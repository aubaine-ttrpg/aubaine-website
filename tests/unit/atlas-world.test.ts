import { describe, expect, it } from 'vitest'

import { FieldError } from '../../src/lib/atlas/contract/fields'
import { buildReveal, isUnexplored } from '../../src/lib/atlas/kernel/reveal'
import { decodeWorld, WorldReferenceError } from '../../src/lib/atlas/world/decode'
import { itemsAt } from '../../src/lib/atlas/world/derive'
import {
  CORNERS,
  createGrid,
  EDGES,
  hexDistance,
  neighbourOf,
  tileAt,
  tileOf,
} from '../../src/lib/atlas/world/grid'
import { LayerShapeError, readLayer } from '../../src/lib/atlas/world/layer'
import { heightIn, reliefField } from '../../src/lib/atlas/world/relief'
import { loadWorld, oceanWorldFiles, worldFiles, worldFrom, worldOverlays } from './fixtures/atlas'

const { authored, world } = loadWorld('archipel')
const grid = authored.grid
const field = reliefField(grid, world.surface)
const placeId = (index: number) => world.places[index]?.id

describe('the hex grid', () => {
  const small = createGrid(7, 5)

  it('finds each neighbour back across the opposite side', () => {
    for (let tile = 0; tile < small.size; tile++) {
      for (let edge = 0; edge < EDGES; edge++) {
        const next = neighbourOf(small, tile, edge)
        if (next < 0) continue
        expect(neighbourOf(small, next, (edge + 3) % EDGES)).toBe(tile)
        expect(hexDistance(small, tile, next)).toBe(1)
      }
    }
  })

  it('puts every tile centre inside its own tile, and its corners one unit away', () => {
    for (let tile = 0; tile < small.size; tile++) {
      expect(tileAt(small, small.x[tile] ?? 0, small.z[tile] ?? 0)).toBe(tile)
    }
    for (const [x, z] of CORNERS) expect(Math.hypot(x, z)).toBeCloseTo(1, 12)
  })

  it('shifts odd rows half a tile east', () => {
    const even = tileOf(small, 2, 2)
    const odd = tileOf(small, 2, 3)
    expect((small.x[odd] ?? 0) - (small.x[even] ?? 0)).toBeCloseTo(Math.sqrt(3) / 2, 5)
    expect(tileOf(small, 7, 0)).toBe(-1)
  })
})

describe('a layer', () => {
  const tiny = createGrid(3, 2)

  it('reads a character per hex, and a dot as nothing', () => {
    expect(readLayer('t', { legend: { a: 1, b: 2 }, rows: ['a.b', 'ba.'] }, tiny)).toEqual([
      1,
      undefined,
      2,
      2,
      1,
      undefined,
    ])
  })

  it('refuses a row of the wrong length, a missing row and an undeclared character', () => {
    expect(() => readLayer('t', { legend: { a: 1 }, rows: ['aa', 'aaa'] }, tiny)).toThrow(
      LayerShapeError,
    )
    expect(() => readLayer('t', { legend: { a: 1 }, rows: ['aaa'] }, tiny)).toThrow(LayerShapeError)
    expect(() => readLayer('t', { legend: { a: 1 }, rows: ['aaa', 'aza'] }, tiny)).toThrow(/'z'/)
  })
})

describe('decoding a world', () => {
  it('refuses a reference to a place that does not exist', () => {
    const files = worldFiles('archipel')
    const broken = structuredClone(files.places) as { places: { parent?: string }[] }
    const target = broken.places.find((place) => place.parent !== undefined)
    if (target) target.parent = 'nowhere'
    expect(() => decodeWorld({ ...files, places: broken }, {})).toThrow(WorldReferenceError)
  })

  it('refuses a route that steps off the grid', () => {
    const files = worldFiles('archipel')
    const broken = structuredClone(files.routes) as {
      routes: { start: { column: number; row: number }; steps: string }[]
    }
    const route = broken.routes[0]
    if (route) {
      route.start = { column: 0, row: 0 }
      route.steps = '4'
    }
    expect(() => decodeWorld({ ...files, routes: broken }, {})).toThrow(FieldError)
  })

  it('takes the English names from the overlays, and keeps the French ones from the places', () => {
    const english = loadWorld('archipel', 'en').world
    const overlay = (
      worldOverlays('archipel', 'en').places as {
        places: Record<string, { name?: string }>
      }
    ).places
    const french = (worldFiles('archipel').places as { places: { id: string; name: string }[] })
      .places
    for (const place of english.places) {
      const name = overlay[place.id]?.name
      if (name !== undefined) expect(place.name, place.id).toBe(name)
    }
    for (const place of french) {
      expect(world.places.find((entry) => entry.id === place.id)?.name, place.id).toBe(place.name)
    }
  })
})

describe('the derived world', () => {
  const { surface } = world

  it('gives every hex of a region the country that holds the region', () => {
    for (let tile = 0; tile < grid.size; tile++) {
      const region = surface.region[tile] ?? -1
      if (region < 0) continue
      expect(surface.country[tile]).toBe(world.places[region]?.parent)
    }
  })

  it('gives every hex of a quarter the city that holds the quarter', () => {
    for (let tile = 0; tile < grid.size; tile++) {
      const quarter = surface.quarter[tile] ?? -1
      if (quarter >= 0) expect(surface.city[tile]).toBe(world.places[quarter]?.parent)
    }
  })

  it('counts a hex of a natural area in every natural area that holds it', () => {
    for (const natural of world.places.filter((place) => place.kind === 'natural')) {
      for (const tile of natural.tiles) {
        expect([...itemsAt(surface.naturals, tile)], `${natural.id} ${tile}`).toContain(
          natural.index,
        )
      }
    }
  })

  it('makes water of every sea and lake tile, and keeps lakes level', () => {
    for (const lake of world.lakes) {
      for (const tile of lake.tiles) {
        expect(surface.water[tile]).toBe(1)
        expect(surface.level[tile]).toBe(lake.level)
      }
    }
  })

  it('meets its neighbour at the middle of every gentle side', () => {
    let checked = 0
    for (let tile = 0; tile < grid.size; tile += 7) {
      for (let edge = 0; edge < EDGES; edge++) {
        const other = neighbourOf(grid, tile, edge)
        if (other < 0 || surface.connection[tile * EDGES + edge] !== 0) continue
        const [ax, az] = CORNERS[edge] ?? [0, 0]
        const [bx, bz] = CORNERS[(edge + 1) % EDGES] ?? [0, 0]
        const x = (grid.x[tile] ?? 0) + (ax + bx) / 2
        const z = (grid.z[tile] ?? 0) + (az + bz) / 2
        expect(heightIn(field, tile, x, z, false)).toBeCloseTo(
          heightIn(field, other, x, z, false),
          5,
        )
        checked++
      }
    }
    expect(checked).toBeGreaterThan(0)
  })

  it('rests a tile centre at its own height before the relief', () => {
    for (let tile = 0; tile < grid.size; tile += 11) {
      expect(heightIn(field, tile, grid.x[tile] ?? 0, grid.z[tile] ?? 0, false)).toBe(
        surface.y[tile],
      )
    }
  })

  it('files a hold quarter under its hold, and a tunnel under its network', () => {
    for (const stratum of world.underground) {
      for (let tile = 0; tile < grid.size; tile++) {
        const quarter = stratum.quarter[tile] ?? -1
        if (quarter >= 0) {
          expect(world.places[stratum.cavern[tile] ?? -1]?.kind).toBe('hold')
          expect(stratum.network[tile]).toBe(stratum.cavern[tile])
        }
        const finest = stratum.finest[tile] ?? -1
        if (finest >= 0 && world.places[finest]?.kind === 'network') {
          expect(stratum.network[tile]).toBe(finest)
          expect(stratum.cavern[tile]).toBe(-1)
        }
      }
    }
  })

  it('raises the heart of every sky city above its rim', () => {
    const cities = world.sky.islands.filter(
      (island) => world.landmarks[island.landmark]?.kind === 'skycity',
    )
    for (const city of cities) {
      const heights = [...city.tiles].map((sky) => ({
        ring: world.sky.ring[sky] ?? 0,
        y: world.sky.y[sky] ?? 0,
      }))
      const centre = heights.find((tile) => tile.ring === 0)
      const rim = heights.filter((tile) => tile.ring >= 3)
      expect(centre).toBeDefined()
      for (const tile of rim) expect(tile.y).toBeLessThan(centre?.y ?? 0)
    }
  })

  it('lists a landmark under its place and every place above it', () => {
    for (const landmark of world.landmarks) {
      for (let at = landmark.place; at >= 0; at = world.places[at]?.parent ?? -1) {
        expect(world.places[at]?.landmarks, `${landmark.id} in ${placeId(at)}`).toContain(
          landmark.index,
        )
      }
    }
  })

  it('offers the travel planner every town, landmark, hold and large cavern, by name', () => {
    const names = world.travelPlaces.map((entry) =>
      entry.kind === 'place'
        ? world.places[entry.place]?.name
        : world.landmarks[entry.landmark]?.name,
    )
    const collator = new Intl.Collator('fr')
    expect([...names].sort((a, b) => collator.compare(a ?? '', b ?? ''))).toEqual(names)
    expect(world.travelPlaces.filter((entry) => entry.kind === 'landmark')).toHaveLength(
      world.landmarks.length,
    )
  })
})

describe('an empty world', () => {
  it('loads as one ocean that no one has explored yet', () => {
    const ocean = worldFrom(oceanWorldFiles(16, 12))
    expect(ocean.world.places.map((place) => place.id)).toEqual(['ocean'])
    const reveal = buildReveal(ocean.world, ocean.authored.grid)
    expect(isUnexplored(reveal, 0, 0)).toBe(true)
  })
})
