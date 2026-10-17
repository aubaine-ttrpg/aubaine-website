import { TILE_TYPES, type TileType } from '../vocabulary.ts'
import { CORNER_X, CORNER_Z, EDGES, type Grid, HALF_SQRT3, SQRT3, tileAt } from './grid.ts'
import type { SurfaceRecord } from './model.ts'
import { createNoise } from './noise.ts'
import { smoothstep01 } from './smoothstep.ts'

export const RELIEF_SEED = 11
export const SLOPE_START = 0.5
export const BOTTOM = -2.8
export const ROCK_TOP = 0.6
export const UNDERGROUND_WATER = ROCK_TOP - 0.62
export const LEVEL_HEIGHT = 0.2
export const METRES_PER_LEVEL = 160
export const SKY_STEP = 0.18

export const SEA_DEPTH: Readonly<Record<number, number>> = {
  [-1]: -0.2,
  [-2]: -0.5,
  [-3]: -0.88,
  [-4]: -1.3,
}
export const SEA_DEPTH_METRES: Readonly<Record<number, number>> = {
  [-1]: -15,
  [-2]: -60,
  [-3]: -220,
  [-4]: -900,
}

const TILE_RELIEF: Record<TileType, number> = {
  deep: 0.05,
  sea: 0.05,
  shallows: 0.03,
  reef: 0.05,
  lake: 0.02,
  beach: 0.02,
  plains: 0.035,
  meadow: 0.15,
  farm: 0.01,
  forest: 0.06,
  taiga: 0.06,
  jungle: 0.06,
  swamp: 0,
  desert: 0.08,
  savanna: 0.03,
  badlands: 0.06,
  tundra: 0.05,
  glacier: 0.07,
  mountain: 0.2,
  highland: 0.13,
  volcanic: 0.1,
  ether: 0.07,
  myxo: 0.05,
  urban: 0,
}

export const RELIEF_BY_TYPE = Float32Array.from(TILE_TYPES, (type) => TILE_RELIEF[type])

export type ReliefField = {
  grid: Grid
  y: Float32Array
  cornerHeight: Float32Array
  edgeMid: Float32Array
  amplitude: Float32Array
}

export const reliefNoise = createNoise(RELIEF_SEED)

export function reliefField(grid: Grid, surface: SurfaceRecord): ReliefField {
  const { y, cornerHeight, edgeMid, amplitude } = surface
  return { grid, y, cornerHeight, edgeMid, amplitude }
}

const SECTOR = Math.PI / 3
const sectorTable = (offset: number, trig: (angle: number) => number) =>
  Float64Array.from({ length: EDGES }, (_, sector) => SQRT3 * trig((sector + offset) * SECTOR))
const SECTOR_JX = sectorTable(0, Math.cos)
const SECTOR_JZ = sectorTable(0, Math.sin)
const SECTOR_KX = sectorTable(1, Math.cos)
const SECTOR_KZ = sectorTable(1, Math.sin)

function sectorOf(dx: number, dz: number): number {
  const rise = SQRT3 * dx
  if (dz >= 0) return dz < rise ? 0 : dz > -rise ? 1 : 2
  return dz > rise ? 3 : dz < -rise ? 4 : 5
}

export function heightIn(
  field: ReliefField,
  tile: number,
  x: number,
  z: number,
  relief = true,
): number {
  const { grid } = field
  const dx = x - (grid.x[tile] ?? 0)
  const dz = z - (grid.z[tile] ?? 0)
  const p0 = dx
  const p1 = 0.5 * dx + HALF_SQRT3 * dz
  const p2 = -0.5 * dx + HALF_SQRT3 * dz
  const a0 = Math.abs(p0)
  const a1 = Math.abs(p1)
  const a2 = Math.abs(p2)
  let reach = a0
  let edge = p0 >= 0 ? 0 : 3
  if (a1 > reach) {
    reach = a1
    edge = p1 >= 0 ? 1 : 4
  }
  if (a2 > reach) {
    reach = a2
    edge = p2 >= 0 ? 2 : 5
  }
  const r0 = reach / HALF_SQRT3
  const rho = r0 > 1 ? 1 : r0
  let height = field.y[tile] ?? 0
  if (rho > SLOPE_START && r0 > 1e-6) {
    const bx = dx / r0
    const bz = dz / r0
    const next = (edge + 1) % EDGES
    const c0x = CORNER_X[edge] ?? 0
    const c0z = CORNER_Z[edge] ?? 0
    const c1x = CORNER_X[next] ?? 0
    const c1z = CORNER_Z[next] ?? 0
    let t = (bx - c0x) * (c1x - c0x) + (bz - c0z) * (c1z - c0z)
    t = t < 0 ? 0 : t > 1 ? 1 : t
    const base = tile * EDGES
    const ch0 = field.cornerHeight[base + edge] ?? height
    const ch1 = field.cornerHeight[base + next] ?? height
    const mid = field.edgeMid[base + edge] ?? height
    const border = t < 0.5 ? ch0 + (mid - ch0) * t * 2 : mid + (ch1 - mid) * (t - 0.5) * 2
    height += (border - height) * smoothstep01((rho - SLOPE_START) / (1 - SLOPE_START))
  }
  if (!relief) return height
  const sector = sectorOf(dx, dz)
  const j = grid.neighbours[tile * EDGES + sector] ?? -1
  const k = grid.neighbours[tile * EDGES + ((sector + 1) % EDGES)] ?? -1
  const jx = SECTOR_JX[sector] ?? 0
  const jz = SECTOR_JZ[sector] ?? 0
  const kx = SECTOR_KX[sector] ?? 0
  const kz = SECTOR_KZ[sector] ?? 0
  const det = jx * kz - jz * kx
  const u = (dx * kz - dz * kx) / det
  const v = (jx * dz - jz * dx) / det
  const own = field.amplitude[tile] ?? 0
  const amplitude =
    own * (1 - u - v) +
    (j >= 0 ? (field.amplitude[j] ?? own) : own) * u +
    (k >= 0 ? (field.amplitude[k] ?? own) : own) * v
  if (amplitude > 1e-4) {
    height +=
      amplitude *
      (0.15 +
        0.85 * reliefNoise.fbm(x * 0.55, z * 0.55, 4) +
        0.35 * (reliefNoise.ridged(x * 0.9 + 3.1, z * 0.9 - 1.7, 2) - 0.45))
  }
  return height
}

export function surfaceY(field: ReliefField, x: number, z: number): number {
  const tile = tileAt(field.grid, x, z)
  return tile < 0 ? BOTTOM : heightIn(field, tile, x, z)
}

export function floorY(grid: Grid, floor: Float32Array, x: number, z: number): number {
  const tile = tileAt(grid, x, z)
  return tile < 0 ? BOTTOM : (floor[tile] ?? BOTTOM)
}

export function altitudeMetres(level: number, lakeLevel: number | undefined): number {
  if (lakeLevel !== undefined) return Math.round(((lakeLevel - 0.7) * METRES_PER_LEVEL) / 10) * 10
  if (level < 0) return SEA_DEPTH_METRES[level] ?? 0
  return Math.max(5, Math.round(((level - 0.7) * METRES_PER_LEVEL) / 10) * 10)
}

export function skyAltitudeMetres(y: number): number {
  return Math.round((y * METRES_PER_LEVEL) / 10) * 10
}
