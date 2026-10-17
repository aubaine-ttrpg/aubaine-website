export type Bounds = [number, number, number, number, number, number]

export const MAX_BLEND = 0.5

export type MeshData = {
  positions: Float32Array
  normals: Int8Array
  bytes: Uint8Array | undefined
  floats: Float32Array | undefined
  floatSize: number
  indices: Uint16Array | Uint32Array
  bounds: Bounds
}

export const SCENE_LAYERS = ['surface', 'sky', 'routes', 'effects', 'under-1', 'under-2'] as const
export type SceneLayer = (typeof SCENE_LAYERS)[number]

export function undergroundLayer(level: number): SceneLayer {
  return level === 1 ? 'under-1' : 'under-2'
}

export const PROP_FAMILIES = ['foliage', 'built', 'mineral', 'cutout'] as const
export type PropFamily = (typeof PROP_FAMILIES)[number]

export const PIECE_MATERIALS = [
  'terrain-top',
  'sky-top',
  'under-top',
  'terrain-wall',
  'under-wall',
  'tunnel',
  'water',
  'abyss',
  'mist-depth',
  'mist',
  'under-water',
  'road',
  'trail',
  'ballast',
  'rail',
  'sea-lane',
  'sky-lane',
  'river',
  'waterfall',
  'sky-fall',
] as const
export type PieceMaterial = (typeof PIECE_MATERIALS)[number]

export type Piece = {
  material: PieceMaterial
  mesh: MeshData
  casts: boolean
}

export type PrototypeData = {
  key: string
  family: PropFamily
  lods: MeshData[]
  casts: boolean
  doubleSided: boolean
}

export const PROP_RANGES = ['near', 'far', 'always'] as const
export type PropRange = (typeof PROP_RANGES)[number]

export type PropSet = {
  prototype: string
  layer: SceneLayer
  range: PropRange
  matrices: Float32Array
  tints: Uint8Array
  thinned: boolean
  bounds: Bounds
}

export const NO_LANDMARK = -1

export type PropModel = {
  layer: SceneLayer
  landmark: number
  family: PropFamily
  mesh: MeshData
  doubleSided: boolean
  casts: boolean
  position: Rgb
  turn: number
  scale: number
}

export const PARTICLE_STYLES = ['soft', 'smoke', 'spark'] as const
export type ParticleStyle = (typeof PARTICLE_STYLES)[number]

export type Rgb = [number, number, number]

export type ParticleSpec = {
  origins: Float32Array
  perOrigin: number
  life: number
  velocity: Rgb
  spread: Rgb
  gravity: number
  size: [number, number]
  turbulence: number
  colour: Rgb
  fade: Rgb
  alpha: number
  style: ParticleStyle
  nightOnly: boolean
  additive: boolean
  seed: number
}

export type ParticleLook = Omit<ParticleSpec, 'origins' | 'perOrigin' | 'seed'>

export const BEAM_SHAPES = ['cylinder', 'cone', 'sphere'] as const
export type BeamShape = (typeof BEAM_SHAPES)[number]

export type BeamSpec = {
  shape: BeamShape
  radiusTop: number
  radiusBottom: number
  height: number
  segments: number
  shift: number
  lying: boolean
  position: Rgb
  tilt: number
  turn: number
  colour: Rgb
  intensity: number
  scroll: number
  night: number
  spin: number
}

export type VortexSpec = { position: Rgb; radius: number; turn: number; colour: Rgb }

export type GlowSpec = { position: Rgb; colour: Rgb; size: number }

export type Flock = {
  x: number
  y: number
  z: number
  radius: number
  count: number
  spread: number
  scale: number
  dark: boolean
  speed: number
}

export type CloudSpec = {
  x: number
  y: number
  z: number
  size: number
  opacity: number
  drift: number
  seed: number
}

export type LightPool = { x: number; y: number; z: number; radius: number; strength: number }

export type EffectsData = {
  particles: ParticleSpec[]
  beams: BeamSpec[]
  vortices: VortexSpec[]
  glows: GlowSpec[]
  flocks: Flock[]
  clouds: CloudSpec[]
  pools: LightPool[]
  falls: MeshData | undefined
}

export const SHIP_PROTOTYPE = 'ship'
export const AIRSHIP_PROTOTYPE = 'airship'
export const LOCOMOTIVE_PROTOTYPE = 'locomotive'
export const LOCOMOTIVE_STACK = { x: 0, y: 0.0885, z: 0.07 } as const
export const WAGON_PROTOTYPES = ['wagon-0', 'wagon-1', 'wagon-2', 'wagon-3'] as const
export const VEHICLE_PROTOTYPES = [
  SHIP_PROTOTYPE,
  AIRSHIP_PROTOTYPE,
  LOCOMOTIVE_PROTOTYPE,
  ...WAGON_PROTOTYPES,
] as const

export type VehiclePath = { points: Float32Array; lengths: Float32Array; total: number }

export type Voyage = { path: number; offset: number; speed: number }

export type VehicleData = {
  paths: VehiclePath[]
  ships: Voyage[]
  airships: Voyage[]
  trains: Voyage[]
  prototypes: PrototypeData[]
}

export type RevealField = {
  width: number
  height: number
  x0: number
  z0: number
  spanX: number
  spanZ: number
  values: Uint8Array
  haze: Uint8Array
}

export type SceneTextures = {
  noiseSize: number
  noise: Uint8Array
  waterNormal: Uint8Array
  heightWidth: number
  heightHeight: number
  heightRect: [number, number, number, number]
  heights: Uint8Array
  tileInfo: Uint8Array[]
  skyInfo: Uint8Array
  reveal: RevealField
}

export type TerrainChunk = {
  chunk: number
  tops: MeshData | undefined
  walls: MeshData | undefined
  tunnels: MeshData | undefined
}

export function meshBuffers(mesh: MeshData): ArrayBuffer[] {
  return [mesh.positions, mesh.normals, mesh.bytes, mesh.floats, mesh.indices]
    .map((array) => array?.buffer)
    .filter((buffer): buffer is ArrayBuffer => buffer instanceof ArrayBuffer)
}
