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
  'windy-stripes',
  'peaks',
  'wheat',
  'beech',
  'pine-tree',
  'palm-tree',
  'reed',
  'waves',
  'high-grass',
  'rock',
  'grass',
  'snowflake-2',
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
  'ore',
  'crystal-growth',
  'ancient-columns',
  'root-tip',
] as const
export type ParchmentGlyph = (typeof PARCHMENT_GLYPHS)[number]

export const NO_GLYPH = 0

export function glyphCode(glyph: ParchmentGlyph): number {
  return PARCHMENT_GLYPHS.indexOf(glyph) + 1
}

export const PATTERN_SPREADS = ['dense', 'scattered'] as const
export type PatternSpread = (typeof PATTERN_SPREADS)[number]

export type TerrainPattern = { glyph: ParchmentGlyph; spread: PatternSpread }

const dense = (glyph: ParchmentGlyph): TerrainPattern => ({ glyph, spread: 'dense' })
const scattered = (glyph: ParchmentGlyph): TerrainPattern => ({ glyph, spread: 'scattered' })

export const TILE_PATTERNS: Readonly<Record<TileType, TerrainPattern | undefined>> = {
  deep: undefined,
  sea: undefined,
  shallows: undefined,
  reef: dense('coral'),
  lake: undefined,
  beach: undefined,
  plains: undefined,
  meadow: dense('daisy'),
  farm: dense('wheat'),
  forest: dense('beech'),
  taiga: dense('pine-tree'),
  jungle: dense('palm-tree'),
  swamp: dense('reed'),
  desert: scattered('waves'),
  savanna: dense('high-grass'),
  badlands: scattered('rock'),
  tundra: scattered('grass'),
  glacier: scattered('snowflake-2'),
  mountain: scattered('peaks'),
  highland: scattered('windy-stripes'),
  volcanic: scattered('lava'),
  ether: scattered('crystal-cluster'),
  myxo: scattered('mushrooms'),
  urban: dense('house'),
}

export const SETTING_PATTERNS: Readonly<Record<Setting, TerrainPattern | undefined>> = {
  rock: undefined,
  cavern: undefined,
  mine: scattered('ore'),
  crystal: dense('crystal-growth'),
  lava: scattered('lava'),
  ice: scattered('frozen-block'),
  fungal: dense('mushrooms'),
  built: dense('ancient-columns'),
  lake: undefined,
  tunnel: undefined,
  roots: dense('root-tip'),
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

export const PARCHMENT_FLAGS = { water: 1, aloft: 2, marked: 4, scattered: 8 } as const

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
