import type { RevealField } from '../contract/scene.ts'
import { CORNER_X, CORNER_Z, EDGES, type Grid, HALF_SQRT3, tileAt } from '../world/grid.ts'
import type { LaneEnd, World } from '../world/model.ts'
import { createNoise } from '../world/noise.ts'
import { chamferDistance } from './chamfer.ts'

export const REVEAL_PAD = 84
export const UNEXPLORED = 0.5

const TEXELS_PER_UNIT = 2
const LAND_REACH = 50
const LANDMARK_REACH = 40
const ROUTE_REACH = 25
const LANE_REACH = 16
const BAND = 12
const HAZE = { lead: 30, tail: 14 } as const
const NOISE_AMPLITUDE = 9
const NOISE_SCALE = 0.035
const NOISE_OCTAVES = 3
const REVEAL_SEED = 41
const LANE_STEP = 0.5
const FULL = 255

function tileReaches(world: World, grid: Grid): Float32Array {
  const reach = new Float32Array(grid.size)
  const raise = (tile: number, value: number) => {
    if (tile >= 0 && tile < grid.size) reach[tile] = Math.max(reach[tile] ?? 0, value)
  }
  const { water, lake } = world.surface
  for (let tile = 0; tile < grid.size; tile++) {
    if (water[tile] !== 1 || (lake[tile] ?? -1) >= 0) raise(tile, LAND_REACH)
  }
  for (const tile of world.sky.tile) raise(tile, LAND_REACH)
  for (const landmark of world.landmarks) {
    raise(landmark.tile, LANDMARK_REACH)
    for (const tile of landmark.tiles) raise(tile, LANDMARK_REACH)
  }
  for (const route of world.routes) for (const tile of route.tiles) raise(tile, ROUTE_REACH)
  return reach
}

function lanePoint(world: World, end: LaneEnd): { x: number; z: number } | undefined {
  if ('landmark' in end) {
    const landmark = world.landmarks[end.landmark]
    return landmark ? { x: landmark.x, z: landmark.z } : undefined
  }
  const place = world.places[end.place]
  return place ? { x: place.centreX, z: place.centreZ } : undefined
}

type Raster = {
  width: number
  height: number
  x0: number
  z0: number
  spanX: number
  spanZ: number
  texel: number
}

function seedDistances(world: World, grid: Grid, raster: Raster): Float32Array {
  const { width, height, x0, z0, spanX, spanZ, texel } = raster
  const reach = tileReaches(world, grid)
  const seeds = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    const wz = z0 + ((y + 0.5) / height) * spanZ
    for (let x = 0; x < width; x++) {
      const wx = x0 + ((x + 0.5) / width) * spanX
      const tile = tileAt(grid, wx, wz)
      const seed = tile < 0 ? 0 : (reach[tile] ?? 0)
      seeds[y * width + x] = seed > 0 ? -seed / texel : 1e9
    }
  }
  const mark = (wx: number, wz: number) => {
    const x = Math.floor(((wx - x0) / spanX) * width)
    const y = Math.floor(((wz - z0) / spanZ) * height)
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const k = y * width + x
    seeds[k] = Math.min(seeds[k] ?? 0, -LANE_REACH / texel)
  }
  for (const lane of world.skyLanes) {
    const from = lanePoint(world, lane.from)
    const to = lanePoint(world, lane.to)
    if (!from || !to) continue
    const length = Math.hypot(to.x - from.x, to.z - from.z)
    const steps = Math.max(1, Math.ceil(length / LANE_STEP))
    for (let k = 0; k <= steps; k++) {
      const t = k / steps
      mark(from.x + (to.x - from.x) * t, from.z + (to.z - from.z) * t)
    }
  }
  return seeds
}

type FogLayers = { values: Uint8Array; haze: Uint8Array }

const toByte = (share: number) => Math.round(Math.min(1, Math.max(0, share)) * FULL)

function fogLayers(seeds: Float32Array, raster: Raster): FogLayers {
  const { width, height, x0, z0, spanX, spanZ, texel } = raster
  const distance = seeds.slice()
  chamferDistance(distance, width, height)
  const noise = createNoise(REVEAL_SEED)
  const values = new Uint8Array(width * height)
  const haze = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    const wz = z0 + ((y + 0.5) / height) * spanZ
    for (let x = 0; x < width; x++) {
      const k = y * width + x
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        values[k] = FULL
        haze[k] = FULL
        continue
      }
      const wx = x0 + ((x + 0.5) / width) * spanX
      const shifted =
        (distance[k] ?? 0) * texel +
        NOISE_AMPLITUDE * noise.fbm(wx * NOISE_SCALE, wz * NOISE_SCALE, NOISE_OCTAVES)
      values[k] = toByte(shifted / BAND)
      haze[k] = toByte((shifted + HAZE.lead) / (HAZE.lead + BAND + HAZE.tail))
    }
  }
  return { values, haze }
}

function enclosedFog(values: Uint8Array, width: number, height: number): Int32Array {
  const dense = Math.round(UNEXPLORED * FULL)
  const reached = new Uint8Array(width * height)
  const queue: number[] = []
  for (let k = 0; k < width * height; k++) {
    const x = k % width
    const y = (k - x) / width
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
      reached[k] = 1
      queue.push(k)
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const k = queue[head] ?? 0
    const x = k % width
    for (const next of [k - 1, k + 1, k - width, k + width]) {
      if (next < 0 || next >= width * height) continue
      if (Math.abs((next % width) - x) > 1) continue
      if (reached[next] === 1 || (values[next] ?? 0) < dense) continue
      reached[next] = 1
      queue.push(next)
    }
  }
  const enclosed: number[] = []
  for (let k = 0; k < width * height; k++) {
    if (reached[k] === 0 && (values[k] ?? 0) >= dense) enclosed.push(k)
  }
  return Int32Array.from(enclosed)
}

export function buildReveal(world: World, grid: Grid): RevealField {
  const halfX = grid.originX + HALF_SQRT3 + REVEAL_PAD
  const halfZ = grid.originZ + 1 + REVEAL_PAD
  const spanX = 2 * halfX
  const spanZ = 2 * halfZ
  const width = Math.round(spanX * TEXELS_PER_UNIT)
  const height = Math.round(spanZ * TEXELS_PER_UNIT)
  const raster: Raster = {
    width,
    height,
    x0: -halfX,
    z0: -halfZ,
    spanX,
    spanZ,
    texel: spanX / width,
  }
  const seeds = seedDistances(world, grid, raster)
  let layers = fogLayers(seeds, raster)
  const enclosed = enclosedFog(layers.values, width, height)
  if (enclosed.length > 0) {
    for (const k of enclosed) seeds[k] = -(BAND + NOISE_AMPLITUDE) / raster.texel
    layers = fogLayers(seeds, raster)
  }
  return { width, height, x0: raster.x0, z0: raster.z0, spanX, spanZ, ...layers }
}

export function revealAt(field: RevealField, x: number, z: number): number {
  return sampleLayer(field, field.values, x, z)
}

export function hazeAt(field: RevealField, x: number, z: number): number {
  return sampleLayer(field, field.haze, x, z)
}

function sampleLayer(field: RevealField, values: Uint8Array, x: number, z: number): number {
  const { width, height } = field
  const u = Math.min(width - 1, Math.max(0, ((x - field.x0) / field.spanX) * width - 0.5))
  const v = Math.min(height - 1, Math.max(0, ((z - field.z0) / field.spanZ) * height - 0.5))
  const ix = Math.min(width - 2, Math.floor(u))
  const iy = Math.min(height - 2, Math.floor(v))
  const fx = u - ix
  const fy = v - iy
  const near = iy * width + ix
  const far = near + width
  const top = (values[near] ?? FULL) + ((values[near + 1] ?? FULL) - (values[near] ?? FULL)) * fx
  const bottom = (values[far] ?? FULL) + ((values[far + 1] ?? FULL) - (values[far] ?? FULL)) * fx
  return (top + (bottom - top) * fy) / FULL
}

export function isUnexplored(field: RevealField, x: number, z: number): boolean {
  return revealAt(field, x, z) >= UNEXPLORED
}

export function hexHidden(field: RevealField, x: number, z: number): boolean {
  if (revealAt(field, x, z) < 1) return false
  for (let edge = 0; edge < EDGES; edge++) {
    if (revealAt(field, x + (CORNER_X[edge] ?? 0), z + (CORNER_Z[edge] ?? 0)) < 1) return false
  }
  return true
}

const MARK_STEP = 6
const MARK_SPACING = 110
const MARK_LIMIT = 8
const MARK_LOW = 0.62
const MARK_HIGH = 0.95

export function unexploredMarks(field: RevealField): { x: number; z: number }[] {
  const candidates: { x: number; z: number; value: number }[] = []
  for (let z = field.z0; z <= field.z0 + field.spanZ; z += MARK_STEP) {
    for (let x = field.x0; x <= field.x0 + field.spanX; x += MARK_STEP) {
      const value = revealAt(field, x, z)
      if (value >= MARK_LOW && value <= MARK_HIGH) candidates.push({ x, z, value })
    }
  }
  candidates.sort((a, b) => b.value - a.value || a.x - b.x || a.z - b.z)
  const chosen: { x: number; z: number }[] = []
  for (const candidate of candidates) {
    if (chosen.length >= MARK_LIMIT) break
    if (
      chosen.every(
        (other) => Math.hypot(other.x - candidate.x, other.z - candidate.z) >= MARK_SPACING,
      )
    ) {
      chosen.push({ x: candidate.x, z: candidate.z })
    }
  }
  return chosen
}
