import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { ATLAS_SOUNDS } from '../../src/islands/atlas/sound'
import { OPENING_WORLD } from '../../src/lib/atlas/contract/worlds'
import {
  CAVE_KINDS,
  ESTABLISHMENT_DRESSINGS,
  LANDMARK_KINDS,
  NATURAL_KINDS,
  PLACE_KINDS,
  type PlaceKind,
  RELIEF_KINDS,
  ROCKS,
  ROUTE_KINDS,
  SETTINGS,
  SKY_LANE,
  TILE_TYPES,
  type TileType,
  VESSELS,
  WATER_TILE_TYPES,
} from '../../src/lib/atlas/vocabulary'
import { createGrid, EDGES, type Grid, neighbourOf, tileOf } from '../../src/lib/atlas/world/grid'
import { type Layer, readLayer } from '../../src/lib/atlas/world/layer'
import { ESTABLISHMENT_CALLS } from '../../src/lib/atlas/world/soundscape'
import {
  type AtlasWorldSources,
  readAtlasSources,
  readSources,
} from '../../src/lib/game/fs-sources'
import { type AtlasPlace, overlays } from '../../src/lib/game/schema'
import { SOUND_FILES } from '../../src/lib/rights/attribution'
import { OWNED_FILES } from '../../src/lib/rights/ownership'

const root = resolve(import.meta.dirname, '../..')
const atlas = await readAtlasSources(root)
const sources = await readSources(root)

const WATER: ReadonlySet<TileType> = new Set(WATER_TILE_TYPES)

type PlaceRule = { parents: readonly PlaceKind[]; parentRequired: boolean }

const PARENTS: Record<PlaceKind, PlaceRule> = {
  continent: { parents: [], parentRequired: false },
  country: { parents: ['continent'], parentRequired: false },
  region: { parents: ['country'], parentRequired: true },
  city: { parents: ['region', 'country', 'continent'], parentRequired: false },
  village: { parents: ['region', 'country', 'continent'], parentRequired: false },
  quarter: { parents: ['city'], parentRequired: true },
  natural: { parents: ['natural'], parentRequired: false },
  sea: { parents: [], parentRequired: false },
  realm: { parents: [], parentRequired: false },
  network: { parents: ['realm'], parentRequired: true },
  cavern: { parents: ['network', 'realm'], parentRequired: false },
  hold: { parents: ['realm'], parentRequired: false },
  'hold-quarter': { parents: ['hold'], parentRequired: true },
}

const isRelief = (place: AtlasPlace) =>
  place.kind === 'natural' && (RELIEF_KINDS as readonly string[]).includes(place.subtype)

function surfaceLayers(world: AtlasWorldSources): [string, Layer<unknown>][] {
  const { caves: _caves, ...layers } = world.surface
  return Object.entries(layers)
}

function undergroundLayers(world: AtlasWorldSources): [string, Layer<unknown>][] {
  return world.underground.levels.flatMap(({ level, rock, setting, floor, place }) => [
    [`underground ${level} rock`, rock],
    [`underground ${level} setting`, setting],
    [`underground ${level} floor`, floor],
    [`underground ${level} place`, place],
  ])
}

function routeTiles(grid: Grid, start: { column: number; row: number }, steps: string): number[] {
  const tiles = [tileOf(grid, start.column, start.row)]
  for (const step of steps) {
    tiles.push(neighbourOf(grid, tiles.at(-1) ?? -1, Number(step)))
  }
  return tiles
}

const keysOf = (words: readonly { key: string }[]) => words.map((word) => word.key).sort()
const sorted = (keys: readonly string[]) => [...keys].sort()

describe('the Atlas', () => {
  it('opens a world that exists', () => {
    expect(atlas.worlds.map((world) => world.id)).toContain(OPENING_WORLD)
  })

  it('draws every emblem from a file the studio owns', () => {
    const owned: readonly string[] = OWNED_FILES
    for (const { id, world } of atlas.worlds) {
      if (world.emblem !== undefined) expect(owned, `${id} emblem`).toContain(world.emblem)
    }
  })
})

describe('the Atlas vocabularies', () => {
  const words = atlas.vocabularies

  it('declares exactly the keys the engine draws', () => {
    expect(keysOf(words.tileTypes)).toEqual(sorted(TILE_TYPES))
    expect(keysOf(words.rocks)).toEqual(sorted(ROCKS))
    expect(keysOf(words.settings)).toEqual(sorted(SETTINGS))
    expect(keysOf(words.placeKinds)).toEqual(sorted(PLACE_KINDS))
    expect(keysOf(words.naturalKinds)).toEqual(sorted(NATURAL_KINDS))
    expect(keysOf(words.landmarkKinds)).toEqual(sorted(LANDMARK_KINDS))
    expect(keysOf(words.routeKinds)).toEqual(sorted([...ROUTE_KINDS, SKY_LANE]))
    expect(keysOf(words.vessels)).toEqual(sorted(VESSELS))
  })

  it('declares every establishment kind a world uses, and no other', () => {
    const used = new Set(
      atlas.worlds.flatMap((world) => world.establishments.establishments.map((e) => e.kind)),
    )
    expect(keysOf(words.establishmentKinds)).toEqual(sorted([...used]))
  })

  it('dresses the map only by establishment kinds the vocabulary declares', () => {
    const declared = new Set(keysOf(words.establishmentKinds))
    const dressed = Object.values(ESTABLISHMENT_DRESSINGS).flat()
    expect(dressed.filter((kind) => !declared.has(kind))).toEqual([])
  })

  it('ships exactly the sounds the Atlas plays', () => {
    expect([...ATLAS_SOUNDS].sort()).toEqual([...SOUND_FILES].sort())
  })

  it('gives a call only to establishment kinds the vocabulary declares', () => {
    const declared = new Set(keysOf(words.establishmentKinds))
    const calling = Object.values(ESTABLISHMENT_CALLS).flat()
    expect(calling.filter((kind) => !declared.has(kind))).toEqual([])
  })

  it('declares cave kinds only in the engine', () => {
    for (const world of atlas.worlds) {
      for (const cave of world.surface.caves) {
        expect(CAVE_KINDS, `${world.id} cave kind ${cave.kind}`).toContain(cave.kind)
      }
    }
  })
})

describe('the travel rules', () => {
  const { travel, vocabularies } = atlas
  const terrains = new Map(travel.terrains.map((terrain) => [terrain.key, terrain]))
  const environments = new Set(sources.environments.map((entry) => entry.id))

  it('maps every tile type to a terrain it declares', () => {
    for (const [type, terrain] of Object.entries(travel.tileTerrains)) {
      expect(terrains.has(terrain), `${type} maps to ${terrain}`).toBe(true)
    }
    expect(terrains.has(travel.undergroundTerrain)).toBe(true)
  })

  it('lets a traveller walk every land tile and the underground, and no water', () => {
    for (const [type, terrain] of Object.entries(travel.tileTerrains)) {
      const walkable = terrains.get(terrain)?.maxPace !== undefined
      expect(walkable, `${type} on ${terrain}`).toBe(!WATER.has(type as TileType))
    }
    expect(terrains.get(travel.undergroundTerrain)?.maxPace).toBeDefined()
  })

  it('names every terrain after an environment that exists, or after a word of its own', () => {
    const ownWords = new Set(keysOf(vocabularies.terrains))
    const unnamed = travel.terrains.filter((terrain) => terrain.environment === undefined)
    for (const terrain of travel.terrains) {
      if (terrain.environment !== undefined) {
        expect(environments.has(terrain.environment), terrain.key).toBe(true)
      }
    }
    expect(sorted(unnamed.map((terrain) => terrain.key))).toEqual([...ownWords].sort())
  })

  it('counts only land tiles as roads', () => {
    for (const type of travel.road.tileTypes) expect(WATER.has(type), type).toBe(false)
  })
})

for (const world of atlas.worlds) {
  const grid = createGrid(world.world.columns, world.world.rows)
  const places = new Map(world.places.places.map((place) => [place.id, place]))
  const landmarks = new Map(world.landmarks.landmarks.map((landmark) => [landmark.id, landmark]))
  const read = <V>(name: string, layer: Layer<V>) => readLayer(name, layer, grid)
  const heights = read('height', world.surface.height)
  const types = read('type', world.surface.type)
  const underground = world.underground.levels.map((level) => ({
    level: level.level,
    setting: read(`underground ${level.level} setting`, level.setting),
    place: read(`underground ${level.level} place`, level.place),
  }))
  const ancestors = (id: string): string[] => {
    const chain: string[] = []
    let parent = places.get(id)?.parent
    while (parent !== undefined && !chain.includes(parent)) {
      chain.push(parent)
      parent = places.get(parent)?.parent
    }
    return chain
  }

  describe(`the ${world.id} world`, () => {
    it('draws every layer on the grid it declares', () => {
      for (const [name, layer] of [...surfaceLayers(world), ...undergroundLayers(world)]) {
        expect(() => readLayer(name, layer, grid), name).not.toThrow()
      }
    })

    it('uses every legend character it declares', () => {
      for (const [name, layer] of [...surfaceLayers(world), ...undergroundLayers(world)]) {
        const drawn = new Set(layer.rows.join(''))
        for (const cell of Object.keys(layer.legend)) {
          expect(drawn.has(cell), `${name} declares '${cell}' and never draws it`).toBe(true)
        }
      }
    })

    it('gives every place, landmark, route and establishment an id of its own', () => {
      const unique = (ids: string[], what: string) =>
        expect(new Set(ids).size, `${what} ids repeat`).toBe(ids.length)
      unique(
        world.places.places.map((p) => p.id),
        'place',
      )
      unique(
        world.landmarks.landmarks.map((l) => l.id),
        'landmark',
      )
      unique(
        world.routes.routes.map((r) => r.id),
        'route',
      )
      unique(
        world.establishments.establishments.map((e) => e.id),
        'establishment',
      )
    })

    it('fills each layer only with places of the kind it holds', () => {
      const holds: [string, Layer<string>, (place: AtlasPlace) => boolean][] = [
        ['landmass', world.surface.landmass, (p) => p.kind === 'continent'],
        ['political', world.surface.political, (p) => p.kind === 'region' || p.kind === 'country'],
        [
          'settlement',
          world.surface.settlement,
          (p) => p.kind === 'quarter' || p.kind === 'village',
        ],
        ['sea', world.surface.sea, (p) => p.kind === 'sea'],
        ['relief', world.surface.relief, isRelief],
        ['cover', world.surface.cover, (p) => p.kind === 'natural' && !isRelief(p)],
        ...world.underground.levels.map(
          (level): [string, Layer<string>, (place: AtlasPlace) => boolean] => [
            `underground ${level.level} place`,
            level.place,
            (p) => ['realm', 'network', 'cavern', 'hold', 'hold-quarter'].includes(p.kind),
          ],
        ),
      ]
      for (const [name, layer, fits] of holds) {
        for (const id of Object.values(layer.legend)) {
          const place = places.get(id)
          expect(place, `${name} names ${id}`).toBeDefined()
          if (place) expect(fits(place), `${name} holds ${id}, a ${place.kind}`).toBe(true)
        }
      }
    })

    it('nests every place under a parent of a kind that can hold it, without a cycle', () => {
      for (const place of places.values()) {
        const rule = PARENTS[place.kind]
        if (place.parent === undefined) {
          expect(rule.parentRequired, `${place.id} needs a parent`).toBe(false)
          continue
        }
        const parent = places.get(place.parent)
        expect(parent, `${place.id} parent ${place.parent}`).toBeDefined()
        if (parent) expect(rule.parents, `${place.id} under ${parent.kind}`).toContain(parent.kind)
        expect(ancestors(place.id), `${place.id} is its own ancestor`).not.toContain(place.id)
      }
    })

    it('puts every place on the map, itself or through a place it holds', () => {
      const drawn = new Set<string>()
      const mark = (id: string | undefined) => {
        if (id === undefined) return
        drawn.add(id)
        for (const ancestor of ancestors(id)) drawn.add(ancestor)
      }
      for (const [name, layer] of surfaceLayers(world)) {
        if (name === 'height' || name === 'type') continue
        for (const id of Object.values(layer.legend)) mark(String(id))
      }
      for (const level of world.underground.levels) {
        for (const id of Object.values(level.place.legend)) mark(id)
      }
      for (const island of world.sky.islands) for (const tile of island.tiles) mark(tile.place)
      for (const id of places.keys()) expect(drawn.has(id), `${id} is on no hex`).toBe(true)
    })

    it('makes every capital a city of its own country', () => {
      for (const place of places.values()) {
        if (place.kind !== 'country' || place.capital === undefined) continue
        expect(places.get(place.capital)?.kind, `${place.id} capital`).toBe('city')
        expect(ancestors(place.capital), `${place.capital} lies outside ${place.id}`).toContain(
          place.id,
        )
      }
    })

    it('keeps the sea below zero, and the land and the lakes above it', () => {
      for (let tile = 0; tile < grid.size; tile++) {
        const type = types[tile]
        const height = heights[tile]
        expect(type, `tile ${tile} has no type`).toBeDefined()
        expect(height, `tile ${tile} has no height`).toBeDefined()
        if (type === undefined || height === undefined) continue
        const sea = WATER.has(type) && type !== 'lake'
        expect(height < 0, `tile ${tile}, ${type} at ${height}`).toBe(sea)
      }
    })

    it('gives each lake one surface level', () => {
      const seen = new Set<number>()
      for (let start = 0; start < grid.size; start++) {
        if (types[start] !== 'lake' || seen.has(start)) continue
        const level = heights[start]
        const stack = [start]
        seen.add(start)
        while (stack.length > 0) {
          const tile = stack.pop() ?? -1
          expect(heights[tile], `lake tile ${tile}`).toBe(level)
          for (let edge = 0; edge < EDGES; edge++) {
            const next = neighbourOf(grid, tile, edge)
            if (next >= 0 && types[next] === 'lake' && !seen.has(next)) {
              seen.add(next)
              stack.push(next)
            }
          }
        }
      }
    })

    it('keeps every route on the grid, its roads and trails on land, its rails off lakes and deep water', () => {
      for (const route of world.routes.routes) {
        const tiles = routeTiles(grid, route.start, route.steps)
        for (const tile of tiles) {
          expect(tile, `${route.id} leaves the grid`).toBeGreaterThanOrEqual(0)
          const type = types[tile]
          if (type === undefined) continue
          if (route.kind === 'road' || route.kind === 'trail') {
            expect(WATER.has(type), `${route.id} crosses ${type} at ${tile}`).toBe(false)
          }
          if (route.kind === 'rail' && WATER.has(type)) {
            expect(type !== 'lake' && heights[tile] === -1, `${route.id} at ${tile}`).toBe(true)
          }
        }
      }
    })

    it('joins every sky lane between places and landmarks that exist', () => {
      for (const lane of world.routes.skyLanes) {
        for (const end of [lane.from, lane.to]) {
          if ('landmark' in end) expect(landmarks.has(end.landmark), end.landmark).toBe(true)
          else expect(places.has(end.place), end.place).toBe(true)
        }
      }
    })

    it('lifts every floating landmark on an island of its own, centred on its hex', () => {
      const aloft = world.landmarks.landmarks.filter(
        (landmark) => landmark.kind === 'skycity' || landmark.kind === 'skyisle',
      )
      expect(sorted(world.sky.islands.map((island) => island.landmark))).toEqual(
        sorted(aloft.map((landmark) => landmark.id)),
      )
      const lifted = new Set<number>()
      for (const island of world.sky.islands) {
        const landmark = landmarks.get(island.landmark)
        const centre = landmark ? tileOf(grid, landmark.tile.column, landmark.tile.row) : -1
        const tiles = island.tiles.map((tile) => tileOf(grid, tile.column, tile.row))
        expect(tiles, `${island.landmark} misses its centre`).toContain(centre)
        for (const [index, tile] of tiles.entries()) {
          expect(tile, `${island.landmark} leaves the grid`).toBeGreaterThanOrEqual(0)
          expect(lifted.has(tile), `two islands share tile ${tile}`).toBe(false)
          lifted.add(tile)
          const place = places.get(island.tiles[index]?.place ?? '')
          expect(['quarter', 'natural'], `${island.landmark} tile place`).toContain(place?.kind)
        }
      }
    })

    it('anchors every landmark on the grid, in a place that exists', () => {
      for (const landmark of world.landmarks.landmarks) {
        expect(
          tileOf(grid, landmark.tile.column, landmark.tile.row),
          landmark.id,
        ).toBeGreaterThanOrEqual(0)
        if (landmark.place !== undefined) expect(places.has(landmark.place), landmark.id).toBe(true)
      }
    })

    it('shelters every establishment in its place, on its level', () => {
      const settlement = read('settlement', world.surface.settlement)
      for (const establishment of world.establishments.establishments) {
        const tile = tileOf(grid, establishment.tile.column, establishment.tile.row)
        const place = places.get(establishment.place)
        expect(place, establishment.id).toBeDefined()
        const onSurface = settlement[tile] === establishment.place
        const aloft = world.sky.islands.some((island) =>
          island.tiles.some(
            (t) => t.place === establishment.place && tileOf(grid, t.column, t.row) === tile,
          ),
        )
        const below = underground.some((level) => level.place[tile] === establishment.place)
        expect(
          onSurface || aloft || below,
          `${establishment.id} lies outside ${establishment.place}`,
        ).toBe(true)
      }
    })

    it('opens every cave on a cliff', () => {
      for (const cave of world.surface.caves) {
        const tile = tileOf(grid, cave.tile.column, cave.tile.row)
        const below = neighbourOf(grid, tile, cave.edge)
        const top = heights[tile]
        const foot = heights[below]
        const type = types[tile]
        expect(below, `cave at ${tile} faces the edge of the map`).toBeGreaterThanOrEqual(0)
        expect(top !== undefined && foot !== undefined && foot < top, `cave at ${tile}`).toBe(true)
        expect(type !== undefined && !WATER.has(type), `cave at ${tile} is under water`).toBe(true)
      }
    })

    it('gives every open underground hex a place, and the solid rock none', () => {
      expect(underground.map((level) => level.level)).toEqual(
        underground.map((_, index) => index + 1),
      )
      for (const level of underground) {
        for (let tile = 0; tile < grid.size; tile++) {
          const open = level.setting[tile] !== 'rock'
          expect(level.place[tile] !== undefined, `level ${level.level} tile ${tile}`).toBe(open)
        }
      }
    })

    it('features only places and landmarks that exist', () => {
      for (const id of world.world.featured.places) expect(places.has(id), id).toBe(true)
      for (const id of world.world.featured.landmarks) expect(landmarks.has(id), id).toBe(true)
    })

    it('translates only entries that exist', () => {
      const translated = (part: string) =>
        sources.translations.filter((overlay) =>
          overlay.id.startsWith(`atlas/${world.id}/${part}.`),
        )
      const check = (overlayId: string, ids: Iterable<string>, known: Set<string>) => {
        for (const id of ids) {
          expect(known.has(id), `${overlayId} translates the unknown ${id}`).toBe(true)
        }
      }
      for (const overlay of translated('places')) {
        const parsed = overlays.atlasPlaces.parse(overlay.data)
        check(overlay.id, Object.keys(parsed.places), new Set(places.keys()))
      }
      for (const overlay of translated('landmarks')) {
        const parsed = overlays.atlasLandmarks.parse(overlay.data)
        check(overlay.id, Object.keys(parsed.landmarks), new Set(landmarks.keys()))
      }
      for (const overlay of translated('routes')) {
        const parsed = overlays.atlasRoutes.parse(overlay.data)
        check(overlay.id, Object.keys(parsed.routes), new Set(world.routes.routes.map((r) => r.id)))
      }
      for (const overlay of translated('establishments')) {
        const parsed = overlays.atlasEstablishments.parse(overlay.data)
        check(
          overlay.id,
          Object.keys(parsed.establishments),
          new Set(world.establishments.establishments.map((e) => e.id)),
        )
      }
    })
  })
}
