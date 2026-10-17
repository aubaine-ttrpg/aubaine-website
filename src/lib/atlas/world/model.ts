import type {
  BuildingStyle,
  CaveKind,
  IsleFeature,
  LandmarkKind,
  NaturalKind,
  Pace,
  PlaceFeature,
  PlaceKind,
  RouteKind,
} from '../vocabulary.ts'

export const SURFACE = 0

export type Stratum = number

export type PlaceRecord = {
  index: number
  id: string
  kind: PlaceKind
  parent: number
  name: string
  description: string | undefined
  subtype: NaturalKind | undefined
  style: BuildingStyle | undefined
  color: string | undefined
  capital: number
  isCapital: boolean
  ruler: string | undefined
  government: string | undefined
  population: number | undefined
  features: readonly PlaceFeature[]
  stratum: Stratum
  aloft: boolean
  tiles: Int32Array
  skyTiles: Int32Array
  children: number[]
  landmarks: number[]
  anchor: number
  centreX: number
  centreZ: number
  highestLevel: number
}

export type LandmarkRecord = {
  index: number
  id: string
  kind: LandmarkKind
  name: string
  description: string | undefined
  place: number
  tile: number
  aloft: boolean
  footprint: number
  altitude: number | undefined
  height: number | undefined
  length: number | undefined
  features: readonly IsleFeature[]
  x: number
  y: number
  z: number
  tiles: Int32Array
}

export type RouteRecord = {
  index: number
  id: string
  kind: RouteKind
  name: string
  description: string | undefined
  tiles: Int32Array
}

export type LaneEnd = { landmark: number } | { place: number }

export type SkyLane = { from: LaneEnd; to: LaneEnd }

export type EstablishmentRecord = {
  index: number
  id: string
  kind: string
  name: string
  description: string | undefined
  place: number
  tile: number
  stratum: Stratum
  aloft: boolean
}

export type CaveRecord = { tile: number; edge: number; kind: CaveKind }

export type LakeRecord = { level: number; y: number; tiles: Int32Array }

export type SkyRecord = {
  tile: Int32Array
  y: Float32Array
  type: Uint8Array
  island: Int16Array
  place: Int16Array
  ring: Uint8Array
  at: Int32Array
  islands: { landmark: number; tiles: Int32Array }[]
}

export type UndergroundRecord = {
  level: number
  depth: number
  rock: Uint8Array
  setting: Uint8Array
  floor: Float32Array
  realm: Int16Array
  network: Int16Array
  cavern: Int16Array
  quarter: Int16Array
  finest: Int16Array
}

export type Offsets = { start: Int32Array; items: Int32Array }

export type SurfaceRecord = {
  type: Uint8Array
  level: Int8Array
  water: Uint8Array
  lake: Int16Array
  y: Float32Array
  connection: Int8Array
  cornerHeight: Float32Array
  edgeMid: Float32Array
  amplitude: Float32Array
  continent: Int16Array
  country: Int16Array
  region: Int16Array
  city: Int16Array
  quarter: Int16Array
  sea: Int16Array
  naturals: Offsets
  roads: Uint8Array
  routes: Offsets
  landmarks: Offsets
}

export type Words = Record<string, { label: string; description: string | undefined }>

export type Vocabulary = {
  tileTypes: Words
  rocks: Words
  settings: Words
  placeKinds: Words
  naturalKinds: Words
  landmarkKinds: Words
  routeKinds: Words
  establishmentKinds: Words
  vessels: Words
  terrains: Words
}

export type TerrainRule = {
  key: string
  maxPace: Pace | undefined
  maxPaceWithSkis: Pace | undefined
}

export type TravelRules = {
  hoursPerDay: number
  crewHoursPerDay: number
  terrains: TerrainRule[]
  tileTerrains: Uint8Array
  undergroundTerrain: number
  roadStep: number
  roadTileTypes: Uint8Array
  kmhPerMetre: number
  vessels: Float64Array
  dirigeableKmh: number
  railKmh: number
}

export type TravelPlace =
  | { kind: 'place'; place: number; tile: number; stratum: Stratum; aloft: boolean }
  | { kind: 'landmark'; landmark: number; tile: number; stratum: Stratum; aloft: boolean }

export type World = {
  name: string
  columns: number
  rows: number
  hexKm: number
  featuredPlaces: number[]
  featuredLandmarks: number[]
  surface: SurfaceRecord
  lakes: LakeRecord[]
  places: PlaceRecord[]
  landmarks: LandmarkRecord[]
  routes: RouteRecord[]
  skyLanes: SkyLane[]
  establishments: EstablishmentRecord[]
  caves: CaveRecord[]
  sky: SkyRecord
  underground: UndergroundRecord[]
  vocabulary: Vocabulary
  travel: TravelRules
  travelPlaces: TravelPlace[]
}
