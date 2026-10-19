import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  CAVE_GLYPH,
  glyphCode,
  LANDMARK_GLYPHS,
  LANE_FLOATS,
  MAX_SKY_LANES,
  NO_GLYPH,
  PARCHMENT_CHANNELS,
  PARCHMENT_FLAGS,
  ROCK_WASH_START,
  ROUTE_CHANNEL,
  SETTING_PATTERNS,
  SETTING_WASH_START,
  SETTLEMENT_GLYPHS,
  TILE_CHANNEL,
  TILE_PATTERNS,
  WASH_COUNT,
} from '../../src/lib/atlas/contract/parchment'
import { PARCHMENT_INKS, WASH_ORDER } from '../../src/lib/atlas/engine/parchment-palette'
import { parchmentTextures } from '../../src/lib/atlas/kernel/parchment'
import { laneEnd } from '../../src/lib/atlas/kernel/routes'
import { type RouteKind, SETTINGS, TILE_TYPES } from '../../src/lib/atlas/vocabulary'
import { EDGES, edgeBetween, neighbourOf } from '../../src/lib/atlas/world/grid'
import { loadWorld } from './fixtures/atlas'

const { authored, world } = loadWorld('archipel')
const grid = authored.grid
const built = parchmentTextures(world, grid)
const [surface] = built.tiles

const byte = (texture: Uint8Array | undefined, tile: number, channel: number) =>
  texture?.[tile * PARCHMENT_CHANNELS + channel] ?? -1
const pairKey = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`)

function routeTexture(kind: RouteKind): { texture: Uint8Array; channel: number } {
  if (kind === 'river') return { texture: surface ?? new Uint8Array(), channel: TILE_CHANNEL.river }
  return { texture: built.routes, channel: ROUTE_CHANNEL[kind] }
}

function routePairs(kind: RouteKind): Set<string> {
  const pairs = new Set<string>()
  for (const route of world.routes) {
    if (route.kind !== kind) continue
    for (let step = 1; step < route.tiles.length; step++) {
      pairs.add(pairKey(route.tiles[step - 1] ?? -1, route.tiles[step] ?? -1))
    }
  }
  return pairs
}

const ROUTE_KINDS_DRAWN: readonly RouteKind[] = ['road', 'trail', 'rail', 'sea', 'river']

describe('the parchment route edges', () => {
  it('marks every step of a route on both hexes it joins', () => {
    for (const route of world.routes) {
      const { texture, channel } = routeTexture(route.kind)
      for (let step = 1; step < route.tiles.length; step++) {
        const from = route.tiles[step - 1] ?? -1
        const to = route.tiles[step] ?? -1
        const edge = edgeBetween(grid, from, to)
        expect(byte(texture, from, channel) & (1 << edge), `${route.id} ${from}`).not.toBe(0)
        const back = (edge + EDGES / 2) % EDGES
        expect(byte(texture, to, channel) & (1 << back), `${route.id} ${to}`).not.toBe(0)
      }
    }
  })

  it('marks no edge that no route of that kind crosses', () => {
    for (const kind of ROUTE_KINDS_DRAWN) {
      const pairs = routePairs(kind)
      const { texture, channel } = routeTexture(kind)
      let marked = 0
      for (let tile = 0; tile < grid.size; tile++) {
        const mask = byte(texture, tile, channel)
        for (let edge = 0; edge < EDGES; edge++) {
          if ((mask & (1 << edge)) === 0) continue
          marked += 1
          const other = neighbourOf(grid, tile, edge)
          expect(pairs.has(pairKey(tile, other)), `${kind} ${tile} edge ${edge}`).toBe(true)
        }
      }
      expect(marked, kind).toBe(pairs.size * 2)
    }
  })

  it('draws every kind the Archipel lays down', () => {
    for (const kind of ROUTE_KINDS_DRAWN) expect(routePairs(kind).size, kind).toBeGreaterThan(0)
  })
})

describe('the parchment glyphs', () => {
  const anchors = new Map<number, string>()
  for (const landmark of world.landmarks) anchors.set(landmark.tile, 'landmark')

  it('marks each landmark on its own hex and nowhere else', () => {
    for (const glyph of new Set(Object.values(LANDMARK_GLYPHS))) {
      const kinds = world.landmarks.filter((landmark) => LANDMARK_GLYPHS[landmark.kind] === glyph)
      let tiles = 0
      for (let tile = 0; tile < grid.size; tile++) {
        if (byte(surface, tile, TILE_CHANNEL.glyph) === glyphCode(glyph)) tiles += 1
      }
      expect(tiles, glyph).toBe(kinds.length)
      for (const landmark of kinds) {
        expect(byte(surface, landmark.tile, TILE_CHANNEL.glyph), landmark.id).toBe(glyphCode(glyph))
      }
    }
  })

  it('marks a settlement on its anchor unless a landmark stands there', () => {
    const settlements = world.places.filter(
      (place) => place.stratum === 0 && (place.kind === 'city' || place.kind === 'village'),
    )
    expect(settlements.length).toBeGreaterThan(0)
    for (const place of settlements) {
      if (anchors.has(place.anchor)) continue
      const glyph = place.isCapital
        ? SETTLEMENT_GLYPHS.capital
        : place.kind === 'village'
          ? SETTLEMENT_GLYPHS.village
          : SETTLEMENT_GLYPHS.city
      expect(byte(surface, place.anchor, TILE_CHANNEL.glyph), place.id).toBe(glyphCode(glyph))
      anchors.set(place.anchor, 'settlement')
    }
    expect(settlements.some((place) => place.isCapital)).toBe(true)
  })

  it('marks a cave mouth unless a landmark or a settlement stands there', () => {
    expect(world.caves.length).toBeGreaterThan(0)
    for (const cave of world.caves) {
      if (anchors.has(cave.tile)) continue
      expect(byte(surface, cave.tile, TILE_CHANNEL.glyph), `cave ${cave.tile}`).toBe(
        glyphCode(CAVE_GLYPH),
      )
      anchors.set(cave.tile, 'cave')
    }
  })

  it('patterns every other hex with the glyph of its terrain, as densely as its terrain', () => {
    const spreads = new Set<string>()
    for (let tile = 0; tile < grid.size; tile++) {
      if (anchors.has(tile)) continue
      const type = TILE_TYPES[world.surface.type[tile] ?? 0] ?? 'deep'
      const pattern = TILE_PATTERNS[type]
      expect(byte(surface, tile, TILE_CHANNEL.glyph), `${type} ${tile}`).toBe(
        pattern ? glyphCode(pattern.glyph) : NO_GLYPH,
      )
      const scattered = (byte(surface, tile, TILE_CHANNEL.flags) & PARCHMENT_FLAGS.scattered) !== 0
      expect(scattered, `${type} ${tile}`).toBe(pattern?.spread === 'scattered')
      if (pattern) spreads.add(pattern.spread)
    }
    expect([...spreads].sort()).toEqual(['dense', 'scattered'])
  })

  it('leaves the sea bare but for its reefs', () => {
    const marked = new Set<string>()
    for (let tile = 0; tile < grid.size; tile++) {
      if (anchors.has(tile) || world.surface.water[tile] !== 1) continue
      const type = TILE_TYPES[world.surface.type[tile] ?? 0] ?? 'deep'
      if (byte(surface, tile, TILE_CHANNEL.glyph) !== NO_GLYPH) marked.add(type)
    }
    expect([...marked].filter((type) => type !== 'reef')).toEqual([])
  })
})

describe('the parchment hexes', () => {
  it('washes the surface by tile type', () => {
    for (let tile = 0; tile < grid.size; tile++) {
      expect(byte(surface, tile, TILE_CHANNEL.wash)).toBe(world.surface.type[tile])
    }
  })

  it('flags water, the hexes a sky island hangs over and the hexes a place marks', () => {
    const marked = new Set([
      ...world.landmarks.map((landmark) => landmark.tile),
      ...world.caves.map((cave) => cave.tile),
      ...world.places
        .filter(
          (place) => place.stratum === 0 && (place.kind === 'city' || place.kind === 'village'),
        )
        .map((place) => place.anchor),
    ])
    let aloft = 0
    for (let tile = 0; tile < grid.size; tile++) {
      const flags = byte(surface, tile, TILE_CHANNEL.flags)
      expect((flags & PARCHMENT_FLAGS.water) !== 0, `water ${tile}`).toBe(
        world.surface.water[tile] === 1,
      )
      const above = (world.sky.at[tile] ?? -1) >= 0
      expect((flags & PARCHMENT_FLAGS.aloft) !== 0, `aloft ${tile}`).toBe(above)
      expect((flags & PARCHMENT_FLAGS.marked) !== 0, `marked ${tile}`).toBe(marked.has(tile))
      if (above) aloft += 1
    }
    expect(aloft).toBe(world.sky.tile.length)
  })

  it('charts every underground level by rock and setting', () => {
    expect(built.tiles).toHaveLength(world.underground.length + 1)
    expect(world.places.some((place) => place.kind === 'hold')).toBe(true)
    for (const [index, level] of world.underground.entries()) {
      const chart = built.tiles[index + 1]
      const holds = new Map(
        world.places
          .filter((place) => place.stratum === level.level && place.kind === 'hold')
          .map((place) => [place.anchor, place]),
      )
      for (let tile = 0; tile < grid.size; tile++) {
        const setting = level.setting[tile] ?? 0
        const name = SETTINGS[setting] ?? 'rock'
        const wash =
          setting === 0 ? ROCK_WASH_START + (level.rock[tile] ?? 0) : SETTING_WASH_START + setting
        expect(byte(chart, tile, TILE_CHANNEL.wash), `level ${level.level} ${tile}`).toBe(wash)
        const hold = holds.get(tile)
        const flags = byte(chart, tile, TILE_CHANNEL.flags)
        expect((flags & PARCHMENT_FLAGS.water) !== 0).toBe(name === 'lake')
        expect((flags & PARCHMENT_FLAGS.marked) !== 0).toBe(hold !== undefined)
        const pattern = setting === 0 ? undefined : SETTING_PATTERNS[name]
        const glyph = hold
          ? hold.isCapital
            ? SETTLEMENT_GLYPHS.capital
            : SETTLEMENT_GLYPHS.city
          : pattern?.glyph
        expect(byte(chart, tile, TILE_CHANNEL.glyph), `level ${level.level} ${tile}`).toBe(
          glyph ? glyphCode(glyph) : NO_GLYPH,
        )
        expect((flags & PARCHMENT_FLAGS.scattered) !== 0, `level ${level.level} ${tile}`).toBe(
          pattern?.spread === 'scattered',
        )
      }
    }
  })
})

describe('the parchment sky lanes', () => {
  it('runs each lane between the ends its 3D tube joins', () => {
    expect(world.skyLanes.length).toBeGreaterThan(0)
    expect(built.lanes).toHaveLength(world.skyLanes.length * LANE_FLOATS)
    for (const [index, lane] of world.skyLanes.entries()) {
      const from = laneEnd(world, grid, lane.from)
      const to = laneEnd(world, grid, lane.to)
      const at = index * LANE_FLOATS
      expect(built.lanes[at]).toBeCloseTo(from?.[0] ?? Number.NaN, 4)
      expect(built.lanes[at + 1]).toBeCloseTo(from?.[2] ?? Number.NaN, 4)
      expect(built.lanes[at + 2]).toBeCloseTo(to?.[0] ?? Number.NaN, 4)
      expect(built.lanes[at + 3]).toBeCloseTo(to?.[2] ?? Number.NaN, 4)
    }
    expect(built.lanes.length / LANE_FLOATS).toBeLessThanOrEqual(MAX_SKY_LANES)
  })
})

describe('the parchment build', () => {
  it('builds the same textures every time', () => {
    const again = parchmentTextures(world, grid)
    expect(again.tiles).toEqual(built.tiles)
    expect(again.routes).toEqual(built.routes)
    expect(again.lanes).toEqual(built.lanes)
  })

  it('charts a world with no routes, lanes or underground', () => {
    const empty = loadWorld('eden')
    const textures = parchmentTextures(empty.world, empty.authored.grid)
    expect(textures.tiles).toHaveLength(empty.world.underground.length + 1)
    expect(textures.routes.every((value) => value === 0)).toBe(true)
    expect(textures.lanes).toHaveLength(0)
  })
})

describe('the hex edge between two tiles', () => {
  it('names the edge that leads from one hex to its neighbour', () => {
    const tile = grid.columns * 10 + 10
    for (let edge = 0; edge < EDGES; edge++) {
      expect(edgeBetween(grid, tile, neighbourOf(grid, tile, edge))).toBe(edge)
    }
  })

  it('refuses two hexes that do not touch', () => {
    expect(() => edgeBetween(grid, 0, 5)).toThrow(RangeError)
  })
})

describe('the parchment palette', () => {
  it('gives every wash a colour', () => {
    expect(WASH_ORDER).toHaveLength(WASH_COUNT)
  })

  it('inks the labels and the legend with the colours the shader draws', () => {
    const view = readFileSync(
      resolve(import.meta.dirname, '../../src/components/views/Atlas.astro'),
      'utf8',
    )
    const token = (name: string) => new RegExp(`--atlas-${name}: (#[0-9a-f]{6});`).exec(view)?.[1]
    expect(token('paper')).toBe(PARCHMENT_INKS.paper)
    expect(token('ink')).toBe(PARCHMENT_INKS.ink)
    expect(token('ink-mark')).toBe(PARCHMENT_INKS.mark)
    expect(token('ink-water')).toBe(PARCHMENT_INKS.water)
    expect(token('ink-sky')).toBe(PARCHMENT_INKS.sky)
  })
})
