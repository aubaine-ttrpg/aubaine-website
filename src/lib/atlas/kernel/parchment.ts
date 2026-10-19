import {
  CAVE_GLYPH,
  glyphCode,
  LANDMARK_GLYPHS,
  LANE_FLOATS,
  MAX_SKY_LANES,
  PARCHMENT_CHANNELS,
  PARCHMENT_FLAGS,
  type ParchmentGlyph,
  type ParchmentTextures,
  ROCK_WASH_START,
  ROUTE_CHANNEL,
  SETTING_PATTERNS,
  SETTING_WASH_START,
  SETTLEMENT_GLYPHS,
  type TerrainPattern,
  TILE_CHANNEL,
  TILE_PATTERNS,
} from '../contract/parchment.ts'
import { SETTINGS, TILE_TYPES } from '../vocabulary.ts'
import { EDGES, edgeBetween, type Grid } from '../world/grid.ts'
import type { PlaceRecord, RouteRecord, UndergroundRecord, World } from '../world/model.ts'
import { laneEnd } from './routes.ts'

const LAKE_SETTING = SETTINGS.indexOf('lake')

function fillWithPattern(tiles: Uint8Array, at: number, pattern: TerrainPattern | undefined): void {
  if (!pattern) return
  tiles[at + TILE_CHANNEL.glyph] = glyphCode(pattern.glyph)
  if (pattern.spread === 'scattered') {
    tiles[at + TILE_CHANNEL.flags] =
      (tiles[at + TILE_CHANNEL.flags] ?? 0) | PARCHMENT_FLAGS.scattered
  }
}

function settlementGlyph(place: PlaceRecord): ParchmentGlyph | undefined {
  if (place.kind !== 'city' && place.kind !== 'village' && place.kind !== 'hold') return undefined
  if (place.isCapital) return SETTLEMENT_GLYPHS.capital
  return place.kind === 'village' ? SETTLEMENT_GLYPHS.village : SETTLEMENT_GLYPHS.city
}

function mark(tiles: Uint8Array, tile: number, glyph: ParchmentGlyph): void {
  const at = tile * PARCHMENT_CHANNELS
  tiles[at + TILE_CHANNEL.glyph] = glyphCode(glyph)
  tiles[at + TILE_CHANNEL.flags] = (tiles[at + TILE_CHANNEL.flags] ?? 0) | PARCHMENT_FLAGS.marked
}

function markSettlements(tiles: Uint8Array, world: World, stratum: number): void {
  for (const place of world.places) {
    if (place.stratum !== stratum || place.anchor < 0) continue
    const glyph = settlementGlyph(place)
    if (glyph) mark(tiles, place.anchor, glyph)
  }
}

function setEdge(target: Uint8Array, tile: number, channel: number, edge: number): void {
  const at = tile * PARCHMENT_CHANNELS + channel
  target[at] = (target[at] ?? 0) | (1 << edge)
}

function markEdges(target: Uint8Array, channel: number, grid: Grid, route: RouteRecord): void {
  for (let step = 1; step < route.tiles.length; step++) {
    const from = route.tiles[step - 1] ?? -1
    const to = route.tiles[step] ?? -1
    const edge = edgeBetween(grid, from, to)
    setEdge(target, from, channel, edge)
    setEdge(target, to, channel, (edge + EDGES / 2) % EDGES)
  }
}

function surfaceTiles(world: World, grid: Grid): Uint8Array {
  const { surface, sky } = world
  const tiles = new Uint8Array(grid.size * PARCHMENT_CHANNELS)
  for (let tile = 0; tile < grid.size; tile++) {
    const type = surface.type[tile] ?? 0
    const at = tile * PARCHMENT_CHANNELS
    let flags = 0
    if (surface.water[tile] === 1) flags |= PARCHMENT_FLAGS.water
    if ((sky.at[tile] ?? -1) >= 0) flags |= PARCHMENT_FLAGS.aloft
    tiles[at + TILE_CHANNEL.wash] = type
    tiles[at + TILE_CHANNEL.flags] = flags
    fillWithPattern(tiles, at, TILE_PATTERNS[TILE_TYPES[type] ?? 'deep'])
  }
  for (const cave of world.caves) mark(tiles, cave.tile, CAVE_GLYPH)
  markSettlements(tiles, world, 0)
  for (const landmark of world.landmarks) mark(tiles, landmark.tile, LANDMARK_GLYPHS[landmark.kind])
  for (const route of world.routes) {
    if (route.kind === 'river') markEdges(tiles, TILE_CHANNEL.river, grid, route)
  }
  return tiles
}

function undergroundTiles(world: World, level: UndergroundRecord, grid: Grid): Uint8Array {
  const tiles = new Uint8Array(grid.size * PARCHMENT_CHANNELS)
  for (let tile = 0; tile < grid.size; tile++) {
    const setting = level.setting[tile] ?? 0
    const at = tile * PARCHMENT_CHANNELS
    if (setting === 0) {
      tiles[at + TILE_CHANNEL.wash] = ROCK_WASH_START + (level.rock[tile] ?? 0)
      continue
    }
    tiles[at + TILE_CHANNEL.wash] = SETTING_WASH_START + setting
    if (setting === LAKE_SETTING) tiles[at + TILE_CHANNEL.flags] = PARCHMENT_FLAGS.water
    fillWithPattern(tiles, at, SETTING_PATTERNS[SETTINGS[setting] ?? 'rock'])
  }
  markSettlements(tiles, world, level.level)
  return tiles
}

function routeEdges(world: World, grid: Grid): Uint8Array {
  const routes = new Uint8Array(grid.size * PARCHMENT_CHANNELS)
  for (const route of world.routes) {
    if (route.kind !== 'river') markEdges(routes, ROUTE_CHANNEL[route.kind], grid, route)
  }
  return routes
}

function skyLanes(world: World, grid: Grid): Float32Array {
  const ends: number[] = []
  for (const lane of world.skyLanes) {
    const from = laneEnd(world, grid, lane.from)
    const to = laneEnd(world, grid, lane.to)
    if (from && to) ends.push(from[0], from[2], to[0], to[2])
  }
  if (ends.length > MAX_SKY_LANES * LANE_FLOATS) {
    throw new RangeError(`the parchment draws at most ${MAX_SKY_LANES} sky lanes`)
  }
  return Float32Array.from(ends)
}

export function parchmentTextures(world: World, grid: Grid): ParchmentTextures {
  return {
    tiles: [
      surfaceTiles(world, grid),
      ...world.underground.map((level) => undergroundTiles(world, level, grid)),
    ],
    routes: routeEdges(world, grid),
    lanes: skyLanes(world, grid),
  }
}
