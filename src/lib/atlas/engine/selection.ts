import type { DataTexture } from 'three'
import { landmarkPlacement } from '../kernel/placement.ts'
import type { Grid } from '../world/grid.ts'
import type { World } from '../world/model.ts'
import type { AtlasRef } from '../world/refs.ts'
import { type ReliefField, surfaceY } from '../world/relief.ts'

export type Focus = { x: number; y: number; z: number; radius: number }

const SELECTED = 255
const SMALL_PLACES: ReadonlySet<string> = new Set([
  'city',
  'village',
  'quarter',
  'hold',
  'hold-quarter',
  'cavern',
])
const WIDE_LANDMARKS: ReadonlySet<string> = new Set(['worldtree', 'skycity'])

export function levelOf(world: World, ref: AtlasRef): number {
  if (ref.kind === 'under') return ref.level
  if (ref.kind === 'place') return world.places[ref.place]?.stratum ?? 0
  return 0
}

export function tilesOf(world: World, ref: AtlasRef): ArrayLike<number> {
  switch (ref.kind) {
    case 'tile':
    case 'under':
      return [ref.tile]
    case 'sky':
      return []
    case 'place':
      return world.places[ref.place]?.tiles ?? []
    case 'landmark': {
      const landmark = world.landmarks[ref.landmark]
      if (!landmark || landmark.aloft) return []
      return landmark.tiles.length > 0 ? landmark.tiles : [landmark.tile]
    }
  }
}

export function skyHexesOf(world: World, ref: AtlasRef): ArrayLike<number> {
  switch (ref.kind) {
    case 'sky':
      return [ref.sky]
    case 'place':
      return world.places[ref.place]?.skyTiles ?? []
    case 'landmark':
      return world.sky.islands.find((island) => island.landmark === ref.landmark)?.tiles ?? []
    default:
      return []
  }
}

export function isSmall(world: World, ref: AtlasRef): boolean {
  if (ref.kind !== 'place') return true
  return SMALL_PLACES.has(world.places[ref.place]?.kind ?? '')
}

export function focusOf(world: World, field: ReliefField, ref: AtlasRef): Focus | undefined {
  const { grid } = field
  const { surface, sky } = world
  switch (ref.kind) {
    case 'under': {
      const under = world.underground.find((record) => record.level === ref.level)
      return {
        x: grid.x[ref.tile] ?? 0,
        y: under?.floor[ref.tile] ?? 0,
        z: grid.z[ref.tile] ?? 0,
        radius: 4,
      }
    }
    case 'sky':
      return {
        x: grid.x[sky.tile[ref.sky] ?? 0] ?? 0,
        y: sky.y[ref.sky] ?? 0,
        z: grid.z[sky.tile[ref.sky] ?? 0] ?? 0,
        radius: 3.5,
      }
    case 'tile':
      return {
        x: grid.x[ref.tile] ?? 0,
        y: Math.max(0, surface.y[ref.tile] ?? 0),
        z: grid.z[ref.tile] ?? 0,
        radius: 4,
      }
    case 'landmark': {
      const landmark = world.landmarks[ref.landmark]
      if (!landmark) return undefined
      const base = landmarkPlacement(field, landmark)
      return { x: base.x, y: base.y, z: base.z, radius: WIDE_LANDMARKS.has(landmark.kind) ? 12 : 6 }
    }
    case 'place':
      return placeFocus(world, grid, ref.place)
  }
}

function placeFocus(world: World, grid: Grid, index: number): Focus | undefined {
  const place = world.places[index]
  if (!place) return undefined
  const { sky, surface } = world
  if (place.tiles.length === 0 && place.skyTiles.length > 0) {
    let x = 0
    let z = 0
    let y = 0
    for (const hex of place.skyTiles) {
      const tile = sky.tile[hex] ?? 0
      x += grid.x[tile] ?? 0
      z += grid.z[tile] ?? 0
      y = Math.max(y, sky.y[hex] ?? 0)
    }
    const count = place.skyTiles.length
    return { x: x / count, y, z: z / count, radius: Math.max(3, Math.sqrt(count) * 1.4) }
  }
  if (place.tiles.length === 0) {
    const [landmark] = place.landmarks
    if (landmark === undefined) return undefined
    const record = world.landmarks[landmark]
    return record
      ? { x: record.x, y: record.y, z: record.z, radius: WIDE_LANDMARKS.has(record.kind) ? 12 : 6 }
      : undefined
  }
  let x0 = Number.POSITIVE_INFINITY
  let x1 = Number.NEGATIVE_INFINITY
  let z0 = Number.POSITIVE_INFINITY
  let z1 = Number.NEGATIVE_INFINITY
  for (const tile of place.tiles) {
    x0 = Math.min(x0, grid.x[tile] ?? 0)
    x1 = Math.max(x1, grid.x[tile] ?? 0)
    z0 = Math.min(z0, grid.z[tile] ?? 0)
    z1 = Math.max(z1, grid.z[tile] ?? 0)
  }
  const under = world.underground.find((record) => record.level === place.stratum)
  const y = under ? (under.floor[place.anchor] ?? 0) : Math.max(0, surface.y[place.anchor] ?? 0)
  return {
    x: (x0 + x1) / 2,
    y,
    z: (z0 + z1) / 2,
    radius: Math.max(3, Math.max(x1 - x0, z1 - z0) * 0.62),
  }
}

export function beaconHeight(
  world: World,
  field: ReliefField,
  ref: AtlasRef,
  focus: Focus,
  level: number,
): number {
  if (ref.kind === 'sky') return focus.y
  if (level > 0) return focus.y
  if (ref.kind === 'landmark' && world.landmarks[ref.landmark]?.aloft) return focus.y + 0.4
  return Math.max(surfaceY(field, focus.x, focus.z), 0)
}

export class SelectionTextures {
  private readonly levels: DataTexture[]
  private readonly sky: DataTexture
  private readonly grid: Grid

  constructor(levels: DataTexture[], sky: DataTexture, grid: Grid) {
    this.levels = levels
    this.sky = sky
    this.grid = grid
  }

  write(world: World, ref: AtlasRef | undefined, level: number): void {
    for (const texture of this.levels) {
      const data = texture.image.data
      if (!(data instanceof Uint8Array)) continue
      for (let tile = 0; tile < this.grid.size; tile++) data[tile * 4] = 0
      texture.needsUpdate = true
    }
    const skyData = this.sky.image.data
    if (skyData instanceof Uint8Array) {
      skyData.fill(0)
      this.sky.needsUpdate = true
    }
    if (!ref) return
    const target = this.levels[level]?.image.data
    if (target instanceof Uint8Array)
      for (const tile of Array.from(tilesOf(world, ref))) target[tile * 4] = SELECTED
    if (skyData instanceof Uint8Array) {
      for (const hex of Array.from(skyHexesOf(world, ref)))
        skyData[(world.sky.tile[hex] ?? 0) * 4] = SELECTED
    }
  }
}
