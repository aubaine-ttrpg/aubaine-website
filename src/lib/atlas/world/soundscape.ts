import { type LandmarkKind, TILE_TYPES, type TileType } from '../vocabulary.ts'
import { type Grid, tileAt } from './grid.ts'
import type { World } from './model.ts'
import { smoothstep } from './smoothstep.ts'

export const BEDS = ['sea', 'shore', 'wind', 'forest', 'fields', 'night', 'town', 'cave'] as const
export type Bed = (typeof BEDS)[number]

export const CALLS = ['gull', 'bell', 'anvil', 'bird', 'owl'] as const
export type Call = (typeof CALLS)[number]

type Ground = 'sea' | 'shore' | 'forest' | 'fields' | 'exposed' | 'town' | 'open'

const TILE_GROUNDS: Readonly<Record<TileType, Ground>> = {
  deep: 'sea',
  sea: 'sea',
  shallows: 'shore',
  reef: 'shore',
  lake: 'shore',
  beach: 'shore',
  plains: 'fields',
  meadow: 'fields',
  farm: 'fields',
  savanna: 'fields',
  forest: 'forest',
  taiga: 'forest',
  jungle: 'forest',
  swamp: 'forest',
  desert: 'exposed',
  badlands: 'exposed',
  tundra: 'exposed',
  glacier: 'exposed',
  mountain: 'exposed',
  highland: 'exposed',
  volcanic: 'exposed',
  ether: 'open',
  myxo: 'open',
  urban: 'town',
}

export const ESTABLISHMENT_CALLS: Readonly<Partial<Record<Call, readonly string[]>>> = {
  gull: ['harbour', 'fishmarket', 'shipyard'],
  bell: ['temple', 'chapel', 'shrine'],
  anvil: ['forge', 'workshop'],
}

const LANDMARK_CALLS: Readonly<Partial<Record<LandmarkKind, Call>>> = { lighthouse: 'gull' }

const CALL_OF_ESTABLISHMENT: ReadonlyMap<string, Call> = new Map(
  CALLS.flatMap((call) => (ESTABLISHMENT_CALLS[call] ?? []).map((kind) => [kind, call] as const)),
)

const DISTANCE = { near: 60, far: 160, highest: 440 } as const
const CALL_DISTANCE = { near: 60, far: 90 } as const
const FOOTPRINT = { share: 0.45, least: 6, most: 90 } as const
const CALL_REACH = 0.6
const WIND = { calm: 0.2, height: 0.45, exposed: 0.5, open: 0.3 } as const
const LEAST_AIRY = 0.3
const TOWN_NIGHT_QUIET = 0.6
const QUIET = 0.04
const SAMPLES = 61
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

const FOOTPRINT_PATTERN: readonly (readonly [number, number])[] = Array.from(
  { length: SAMPLES },
  (_, index) => {
    const radius = Math.sqrt((index + 0.5) / SAMPLES)
    const angle = index * GOLDEN_ANGLE
    return [radius * Math.cos(angle), radius * Math.sin(angle)] as const
  },
)

export type Listener = {
  readonly x: number
  readonly z: number
  readonly dist: number
  readonly yaw: number
  readonly level: number
  readonly night: number
}

export type HeardCall =
  | { readonly kind: 'point'; readonly call: Call; readonly gain: number; readonly pan: number }
  | { readonly kind: 'around'; readonly call: Call; readonly gain: number }

export type Soundscape = {
  readonly beds: Readonly<Record<Bed, number>>
  readonly airy: number
  readonly calls: readonly HeardCall[]
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))

export function closeness(dist: number): number {
  return 1 - smoothstep(DISTANCE.near, DISTANCE.far, dist)
}

function callGate(dist: number): number {
  return 1 - smoothstep(CALL_DISTANCE.near, CALL_DISTANCE.far, dist)
}

function groundOf(world: World, tile: number): Ground {
  if (tile < 0) return 'sea'
  const type = TILE_TYPES[world.surface.type[tile] ?? 0]
  return type ? TILE_GROUNDS[type] : 'sea'
}

function groundShares(world: World, grid: Grid, listener: Listener): Record<Ground, number> {
  const radius = clamp(FOOTPRINT.share * listener.dist, FOOTPRINT.least, FOOTPRINT.most)
  const counts: Record<Ground, number> = {
    sea: 0,
    shore: 0,
    forest: 0,
    fields: 0,
    exposed: 0,
    town: 0,
    open: 0,
  }
  for (const [px, pz] of FOOTPRINT_PATTERN) {
    const tile = tileAt(grid, listener.x + px * radius, listener.z + pz * radius)
    counts[groundOf(world, tile)] += 1
  }
  const share = (ground: Ground) => counts[ground] / FOOTPRINT_PATTERN.length
  return {
    sea: share('sea'),
    shore: share('shore'),
    forest: share('forest'),
    fields: share('fields'),
    exposed: share('exposed'),
    town: share('town'),
    open: share('open'),
  }
}

function pointCalls(
  world: World,
  grid: Grid,
  listener: Listener,
  discovered: (tile: number) => boolean,
): HeardCall[] {
  const gate = callGate(listener.dist)
  if (gate === 0) return []
  const reach = CALL_REACH * listener.dist
  const right = { x: Math.cos(listener.yaw), z: -Math.sin(listener.yaw) }
  const calls: HeardCall[] = []
  const hear = (call: Call, x: number, z: number, tile: number) => {
    const dx = x - listener.x
    const dz = z - listener.z
    const distance = Math.hypot(dx, dz)
    if (distance > reach || !discovered(tile)) return
    const fall = 1 - distance / reach
    const gain = gate * fall * fall
    if (gain < QUIET) return
    const pan = clamp((dx * right.x + dz * right.z) / reach, -1, 1)
    calls.push({ kind: 'point', call, gain, pan })
  }
  for (const establishment of world.establishments) {
    const call = CALL_OF_ESTABLISHMENT.get(establishment.kind)
    if (!call || establishment.stratum !== listener.level) continue
    const tile = establishment.tile
    hear(call, grid.x[tile] ?? 0, grid.z[tile] ?? 0, tile)
  }
  if (listener.level > 0) return calls
  for (const landmark of world.landmarks) {
    const call = LANDMARK_CALLS[landmark.kind]
    if (call) hear(call, landmark.x, landmark.z, landmark.tile)
  }
  return calls
}

function aroundCalls(shares: Record<Ground, number>, listener: Listener): HeardCall[] {
  const gate = callGate(listener.dist)
  const day = 1 - listener.night
  const heard: HeardCall[] = [
    { kind: 'around', call: 'bird', gain: gate * shares.forest * day },
    { kind: 'around', call: 'owl', gain: gate * shares.forest * listener.night },
    { kind: 'around', call: 'gull', gain: gate * shares.shore * day },
  ]
  return heard.filter((call) => call.gain >= QUIET)
}

export function listen(
  world: World,
  grid: Grid,
  listener: Listener,
  discovered: (tile: number) => boolean,
): Soundscape {
  const points = pointCalls(world, grid, listener, discovered)
  if (listener.level > 0) {
    return {
      beds: { sea: 0, shore: 0, wind: 0, forest: 0, fields: 0, night: 0, town: 0, cave: 1 },
      airy: 0,
      calls: points,
    }
  }
  const shares = groundShares(world, grid, listener)
  const near = closeness(listener.dist)
  const height = smoothstep(DISTANCE.near, DISTANCE.highest, listener.dist)
  const day = 1 - listener.night
  const wind =
    WIND.calm + WIND.height * height + WIND.exposed * shares.exposed + WIND.open * shares.open
  return {
    beds: {
      sea: shares.sea + (1 - near) * shares.shore,
      shore: near * shares.shore,
      wind: clamp(wind, 0, 1),
      forest: near * shares.forest * day,
      fields: near * shares.fields * day,
      night: near * (shares.forest + shares.fields) * listener.night,
      town: near * shares.town * (1 - TOWN_NIGHT_QUIET * listener.night),
      cave: 0,
    },
    airy: LEAST_AIRY + (1 - LEAST_AIRY) * clamp(shares.exposed + height / 2, 0, 1),
    calls: [...points, ...aroundCalls(shares, listener)],
  }
}
