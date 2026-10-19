import {
  type LandmarkKind,
  ROCKS,
  type RouteKind,
  SETTINGS,
  type Setting,
  TILE_TYPES,
  type TileType,
} from '../vocabulary.ts'

export const PARCHMENT_GLYPHS = [
  'coral',
  'daisy',
  'hills',
  'peaks',
  'wheat',
  'forest',
  'pine-tree',
  'palm-tree',
  'swamp',
  'desert',
  'high-grass',
  'falling-rocks',
  'grass',
  'frozen-block',
  'lava',
  'crystal-cluster',
  'mushrooms',
  'house',
  'crown',
  'tower-flag',
  'village',
  'oak',
  'ship-wreck',
  'castle',
  'coliseum',
  'floating-platforms',
  'island',
  'volcano',
  'crystal-bars',
  'dinosaur-bones',
  'lighthouse',
  'portal',
  'watchtower',
  'cave-entrance',
  'mining',
  'crystal-growth',
  'ancient-columns',
  'tree-roots',
] as const
export type ParchmentGlyph = (typeof PARCHMENT_GLYPHS)[number]

export const NO_GLYPH = 0

export function glyphCode(glyph: ParchmentGlyph): number {
  return PARCHMENT_GLYPHS.indexOf(glyph) + 1
}

export const TILE_GLYPHS: Readonly<Record<TileType, ParchmentGlyph | undefined>> = {
  deep: undefined,
  sea: undefined,
  shallows: undefined,
  reef: 'coral',
  lake: undefined,
  beach: undefined,
  plains: undefined,
  meadow: 'daisy',
  farm: 'wheat',
  forest: 'forest',
  taiga: 'pine-tree',
  jungle: 'palm-tree',
  swamp: 'swamp',
  desert: 'desert',
  savanna: 'high-grass',
  badlands: 'falling-rocks',
  tundra: 'grass',
  glacier: 'frozen-block',
  mountain: 'peaks',
  highland: 'hills',
  volcanic: 'lava',
  ether: 'crystal-cluster',
  myxo: 'mushrooms',
  urban: 'house',
}

export const SETTING_GLYPHS: Readonly<Record<Setting, ParchmentGlyph | undefined>> = {
  rock: undefined,
  cavern: undefined,
  mine: 'mining',
  crystal: 'crystal-growth',
  lava: 'lava',
  ice: 'frozen-block',
  fungal: 'mushrooms',
  built: 'ancient-columns',
  lake: undefined,
  tunnel: undefined,
  roots: 'tree-roots',
}

export const LANDMARK_GLYPHS: Readonly<Record<LandmarkKind, ParchmentGlyph>> = {
  worldtree: 'oak',
  shipwreck: 'ship-wreck',
  castle: 'castle',
  arena: 'coliseum',
  volcano: 'volcano',
  spire: 'crystal-bars',
  bones: 'dinosaur-bones',
  lighthouse: 'lighthouse',
  portal: 'portal',
  tower: 'watchtower',
  skycity: 'floating-platforms',
  skyisle: 'island',
}

export const SETTLEMENT_GLYPHS = {
  capital: 'crown',
  city: 'tower-flag',
  village: 'village',
} as const satisfies Readonly<Record<string, ParchmentGlyph>>

export const CAVE_GLYPH: ParchmentGlyph = 'cave-entrance'

export const SETTING_WASH_START = TILE_TYPES.length
export const ROCK_WASH_START = SETTING_WASH_START + SETTINGS.length
export const WASH_COUNT = ROCK_WASH_START + ROCKS.length

export const PARCHMENT_FLAGS = { water: 1, aloft: 2, marked: 4 } as const

export const MAX_SKY_LANES = 16
export const LANE_FLOATS = 4

export const PARCHMENT_CHANNELS = 4

export const TILE_CHANNEL = { wash: 0, glyph: 1, flags: 2, river: 3 } as const

export const ROUTE_CHANNEL: Readonly<Record<Exclude<RouteKind, 'river'>, number>> = {
  road: 0,
  trail: 1,
  rail: 2,
  sea: 3,
}

export type ParchmentTextures = {
  tiles: Uint8Array[]
  routes: Uint8Array
  lanes: Float32Array
}
