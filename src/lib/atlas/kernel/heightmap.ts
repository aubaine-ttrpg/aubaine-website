import { HALF_SQRT3, SQRT3, tileAt } from '../world/grid.ts'
import type { World } from '../world/model.ts'
import { heightIn, type ReliefField, SEA_DEPTH } from '../world/relief.ts'
import { smoothstep01 } from '../world/smoothstep.ts'
import { chamferDistance } from './chamfer.ts'

export const HEIGHT_OFFSET = 1.6
export const HEIGHT_RANGE = 5
export const SHORE_RANGE = 3
const MARGIN = 5
const OPEN_SEA_FLOOR = SEA_DEPTH[-4] ?? -1.3
const TEXELS_PER_UNIT = 512 / 225

export type HeightMap = {
  width: number
  height: number
  x0: number
  z0: number
  spanX: number
  spanZ: number
  pixels: Uint8Array
  heights: Float32Array
}

function openSeaFloor(field: ReliefField, x: number, z: number): number {
  const { grid } = field
  const edgeX = Math.max(-grid.originX + HALF_SQRT3, Math.min(grid.originX - HALF_SQRT3, x))
  const edgeZ = Math.max(-grid.originZ, Math.min(grid.originZ, z))
  const border = tileAt(grid, edgeX, edgeZ)
  if (border < 0) return OPEN_SEA_FLOOR
  const shore = heightIn(field, border, edgeX, edgeZ, false)
  const reach = smoothstep01(Math.hypot(x - edgeX, z - edgeZ) / MARGIN)
  return shore + (OPEN_SEA_FLOOR - shore) * reach
}

export function buildHeightMap(world: World, field: ReliefField): HeightMap {
  const { grid } = field
  const x0 = -grid.originX - MARGIN
  const z0 = -grid.originZ - MARGIN
  const spanX = 2 * grid.originX + 2 * MARGIN + SQRT3 / 2
  const spanZ = 2 * grid.originZ + 2 * MARGIN
  const width = Math.round(spanX * TEXELS_PER_UNIT)
  const height = Math.round(spanZ * TEXELS_PER_UNIT)
  const pixels = new Uint8Array(width * height * 4)
  const distance = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const wx = x0 + ((x + 0.5) / width) * spanX
      const wz = z0 + ((y + 0.5) / height) * spanZ
      const tile = tileAt(grid, wx, wz)
      const h = tile < 0 ? openSeaFloor(field, wx, wz) : heightIn(field, tile, wx, wz, false)
      const lake = tile < 0 ? -1 : (world.surface.lake[tile] ?? -1)
      const waterline = lake >= 0 ? (world.lakes[lake]?.y ?? 0) : 0
      const k = y * width + x
      pixels[k * 4] = Math.max(
        0,
        Math.min(255, Math.round(((h + HEIGHT_OFFSET) / HEIGHT_RANGE) * 255)),
      )
      pixels[k * 4 + 3] = 255
      distance[k] = tile >= 0 && h > waterline - 0.02 ? 0 : 1e9
    }
  }
  chamferDistance(distance, width, height)
  const texel = spanX / width
  const heights = new Float32Array(width * height)
  for (let k = 0; k < width * height; k++) {
    pixels[k * 4 + 1] = Math.max(
      0,
      Math.min(255, Math.round((((distance[k] ?? 0) * texel) / SHORE_RANGE) * 255)),
    )
    heights[k] = ((pixels[k * 4] ?? 0) / 255) * HEIGHT_RANGE - HEIGHT_OFFSET
  }
  return { width, height, x0, z0, spanX, spanZ, pixels, heights }
}

export function sampleHeight(map: HeightMap, x: number, z: number): number {
  const { width, height, heights } = map
  const u = ((x - map.x0) / map.spanX) * width - 0.5
  const v = ((z - map.z0) / map.spanZ) * height - 0.5
  let ix = Math.floor(u)
  let fx = u - ix
  if (ix < 0) {
    ix = 0
    fx = 0
  } else if (ix >= width - 1) {
    ix = width - 2
    fx = 1
  }
  let iy = Math.floor(v)
  let fy = v - iy
  if (iy < 0) {
    iy = 0
    fy = 0
  } else if (iy >= height - 1) {
    iy = height - 2
    fy = 1
  }
  const near = iy * width + ix
  const far = near + width
  const a = heights[near] ?? 0
  const b = heights[near + 1] ?? 0
  const c = heights[far] ?? 0
  const d = heights[far + 1] ?? 0
  const top = a + (b - a) * fx
  const bottom = c + (d - c) * fx
  return top + (bottom - top) * fy
}

const AO_ANGLES = Array.from({ length: 6 }, (_, k) => k * 1.0472 + 0.3)
const AO_X = Float64Array.from(AO_ANGLES, Math.cos)
const AO_Z = Float64Array.from(AO_ANGLES, Math.sin)
export const AO_CEILING = 3.6

export function occlusion(map: HeightMap, x: number, y: number, z: number): number {
  if (y > AO_CEILING) return 1
  let sum = 0
  for (let k = 0; k < AO_ANGLES.length; k++) {
    const dx = AO_X[k] ?? 0
    const dz = AO_Z[k] ?? 0
    const near = sampleHeight(map, x + dx * 0.42, z + dz * 0.42) - y - 0.02
    const far = sampleHeight(map, x + dx * 1.05, z + dz * 1.05) - y - 0.05
    if (near > 0) sum += near
    if (far > 0) sum += 0.55 * far
  }
  return Math.min(1, Math.max(0.62, 1 - sum * 0.17))
}
