export const TILE_TYPES = [
  'deep',
  'sea',
  'shallows',
  'reef',
  'lake',
  'beach',
  'plains',
  'meadow',
  'farm',
  'forest',
  'taiga',
  'jungle',
  'swamp',
  'desert',
  'savanna',
  'badlands',
  'tundra',
  'glacier',
  'mountain',
  'highland',
  'volcanic',
  'ether',
  'myxo',
  'urban',
] as const

export const WATER_TILE_TYPES = ['deep', 'sea', 'shallows', 'reef', 'lake'] as const

export const ROCKS = [
  'granite',
  'limestone',
  'sandstone',
  'basalt',
  'schist',
  'permafrost',
  'marble',
] as const

export const SETTINGS = [
  'rock',
  'cavern',
  'mine',
  'crystal',
  'lava',
  'ice',
  'fungal',
  'built',
  'lake',
  'tunnel',
  'roots',
] as const

export const PLACE_KINDS = [
  'continent',
  'country',
  'region',
  'city',
  'village',
  'quarter',
  'natural',
  'sea',
  'realm',
  'network',
  'cavern',
  'hold',
  'hold-quarter',
] as const

export const NATURAL_KINDS = [
  'forest',
  'range',
  'swamp',
  'valley',
  'desert',
  'badlands',
  'wastes',
  'jungle',
  'glacier',
  'reef',
  'volcano',
  'lake',
  'glade',
  'skyisles',
] as const

export const RELIEF_KINDS = ['range', 'volcano'] as const

export const GROUND_LANDMARK_KINDS = [
  'worldtree',
  'shipwreck',
  'castle',
  'arena',
  'volcano',
  'spire',
  'bones',
  'lighthouse',
  'portal',
  'tower',
] as const

export const ALOFT_LANDMARK_KINDS = ['skycity', 'skyisle'] as const

export const LANDMARK_KINDS = [...GROUND_LANDMARK_KINDS, ...ALOFT_LANDMARK_KINDS] as const

export const ROUTE_KINDS = ['road', 'trail', 'rail', 'sea', 'river'] as const

export const SKY_LANE = 'sky'

export const MAP_KINDS = ['land', 'area'] as const

export const CAVE_KINDS = [
  'smugglers',
  'mine',
  'fungal',
  'crystal',
  'lava',
  'ice',
  'lair',
  'sea',
  'natural',
] as const

export const BUILDING_STYLES = [
  'aubemont',
  'nordhal',
  'orsalis',
  'corsaille',
  'mountain',
  'nordic',
] as const

export const SETTLEMENT_FEATURES = ['walls'] as const

export const NATURAL_FEATURES = ['windmills'] as const

export const ISLE_FEATURES = ['watchtower', 'standing-stones', 'chains'] as const

export const ESTABLISHMENT_DRESSINGS = {
  harbour: ['harbour', 'shipyard'],
  temple: ['temple', 'shrine', 'chapel'],
  workshop: ['forge', 'workshop'],
  mill: ['mill'],
  forge: ['forge'],
  throne: ['palace'],
  pits: ['mine'],
} as const satisfies Record<string, readonly string[]>

export const PACES = ['slow', 'normal', 'fast'] as const

export const VESSELS = ['sailing', 'galley', 'longship', 'warship', 'keelboat', 'rowboat'] as const

export const LAND_LEVELS = { lowest: 1, highest: 13 } as const

export const WATER_DEPTHS = [-1, -2, -3, -4] as const

export type TileType = (typeof TILE_TYPES)[number]
export type SettlementFeature = (typeof SETTLEMENT_FEATURES)[number]
export type NaturalFeature = (typeof NATURAL_FEATURES)[number]
export type IsleFeature = (typeof ISLE_FEATURES)[number]
export type PlaceFeature = SettlementFeature | NaturalFeature
export type Rock = (typeof ROCKS)[number]
export type Setting = (typeof SETTINGS)[number]
export type PlaceKind = (typeof PLACE_KINDS)[number]
export type NaturalKind = (typeof NATURAL_KINDS)[number]
export type LandmarkKind = (typeof LANDMARK_KINDS)[number]
export type RouteKind = (typeof ROUTE_KINDS)[number]
export type MapKind = (typeof MAP_KINDS)[number]
export type CaveKind = (typeof CAVE_KINDS)[number]
export type BuildingStyle = (typeof BUILDING_STYLES)[number]
export type Pace = (typeof PACES)[number]
export type Vessel = (typeof VESSELS)[number]
