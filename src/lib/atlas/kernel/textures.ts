import { TILE_TYPES, type TileType } from '../vocabulary.ts'
import type { Grid } from '../world/grid.ts'
import type { UndergroundRecord, World } from '../world/model.ts'
import { mulberry32 } from '../world/noise.ts'

export const NOISE_SIZE = 256
export const NOISE_SEED = 5
const CHANNELS = 4
const WATER_NORMAL_SLOPE = 9
const GROUND_COVER: Partial<Record<TileType, number>> = {
  forest: 1,
  taiga: 0.85,
  jungle: 1,
  myxo: 0.8,
  swamp: 0.35,
  urban: 0.4,
}
const COVER_BY_TYPE = Uint8Array.from(TILE_TYPES, (type) =>
  Math.round((GROUND_COVER[type] ?? 0) * 255),
)

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const toByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)))

function perlin(cells: number, seed: number): Float32Array {
  const random = mulberry32(seed)
  const gx = new Float32Array(cells * cells)
  const gy = new Float32Array(cells * cells)
  for (let k = 0; k < cells * cells; k++) {
    const angle = random() * Math.PI * 2
    gx[k] = Math.cos(angle)
    gy[k] = Math.sin(angle)
  }
  const out = new Float32Array(NOISE_SIZE * NOISE_SIZE)
  for (let y = 0; y < NOISE_SIZE; y++) {
    for (let x = 0; x < NOISE_SIZE; x++) {
      const fx = (x / NOISE_SIZE) * cells
      const fy = (y / NOISE_SIZE) * cells
      const x0 = Math.floor(fx)
      const y0 = Math.floor(fy)
      const tx = fx - x0
      const ty = fy - y0
      const x1 = (x0 + 1) % cells
      const y1 = (y0 + 1) % cells
      const k00 = y0 * cells + x0
      const k10 = y0 * cells + x1
      const k01 = y1 * cells + x0
      const k11 = y1 * cells + x1
      const n00 = (gx[k00] ?? 0) * tx + (gy[k00] ?? 0) * ty
      const n10 = (gx[k10] ?? 0) * (tx - 1) + (gy[k10] ?? 0) * ty
      const n01 = (gx[k01] ?? 0) * tx + (gy[k01] ?? 0) * (ty - 1)
      const n11 = (gx[k11] ?? 0) * (tx - 1) + (gy[k11] ?? 0) * (ty - 1)
      const u = fade(tx)
      const v = fade(ty)
      const a = n00 + (n10 - n00) * u
      const b = n01 + (n11 - n01) * u
      out[y * NOISE_SIZE + x] = a + (b - a) * v
    }
  }
  return out
}

function worley(cells: number, seed: number): Float32Array {
  const random = mulberry32(seed)
  const px = new Float32Array(cells * cells)
  const py = new Float32Array(cells * cells)
  for (let k = 0; k < cells * cells; k++) {
    px[k] = random()
    py[k] = random()
  }
  const out = new Float32Array(NOISE_SIZE * NOISE_SIZE)
  for (let y = 0; y < NOISE_SIZE; y++) {
    for (let x = 0; x < NOISE_SIZE; x++) {
      const fx = (x / NOISE_SIZE) * cells
      const fy = (y / NOISE_SIZE) * cells
      const cx = Math.floor(fx)
      const cy = Math.floor(fy)
      let nearest = 9
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const k = ((cy + oy + cells) % cells) * cells + ((cx + ox + cells) % cells)
          const distance = Math.hypot(fx - (cx + ox + (px[k] ?? 0)), fy - (cy + oy + (py[k] ?? 0)))
          if (distance < nearest) nearest = distance
        }
      }
      out[y * NOISE_SIZE + x] = nearest
    }
  }
  return out
}

export function noiseTextures(seed = NOISE_SEED): { noise: Uint8Array; waterNormal: Uint8Array } {
  const texels = NOISE_SIZE * NOISE_SIZE
  const r = perlin(8, seed + 1)
  const g = perlin(16, seed + 2)
  const b = perlin(32, seed + 3)
  const a = worley(8, seed + 4)
  const noise = new Uint8Array(texels * CHANNELS)
  for (let i = 0; i < texels; i++) {
    noise[i * 4] = toByte(128 + (r[i] ?? 0) * 190)
    noise[i * 4 + 1] = toByte(128 + (g[i] ?? 0) * 190)
    noise[i * 4 + 2] = toByte(128 + (b[i] ?? 0) * 190)
    noise[i * 4 + 3] = toByte((a[i] ?? 0) * 235)
  }
  const h1 = perlin(8, seed + 11)
  const h2 = perlin(16, seed + 12)
  const h3 = perlin(32, seed + 13)
  const height = new Float32Array(texels)
  for (let i = 0; i < texels; i++)
    height[i] = (h1[i] ?? 0) * 0.55 + (h2[i] ?? 0) * 0.3 + (h3[i] ?? 0) * 0.15
  const waterNormal = new Uint8Array(texels * CHANNELS)
  const at = (x: number, y: number) => height[y * NOISE_SIZE + x] ?? 0
  for (let y = 0; y < NOISE_SIZE; y++) {
    for (let x = 0; x < NOISE_SIZE; x++) {
      const dx = at((x + 1) % NOISE_SIZE, y) - at((x + NOISE_SIZE - 1) % NOISE_SIZE, y)
      const dz = at(x, (y + 1) % NOISE_SIZE) - at(x, (y + NOISE_SIZE - 1) % NOISE_SIZE)
      const length = Math.hypot(dx * WATER_NORMAL_SLOPE, 1, dz * WATER_NORMAL_SLOPE)
      const i = (y * NOISE_SIZE + x) * 4
      waterNormal[i] = toByte(128 - ((dx * WATER_NORMAL_SLOPE) / length) * 127)
      waterNormal[i + 1] = toByte(128 - ((dz * WATER_NORMAL_SLOPE) / length) * 127)
      waterNormal[i + 2] = toByte(255 / length)
      waterNormal[i + 3] = 255
    }
  }
  return { noise, waterNormal }
}

function borderCodes(
  size: number,
  area: (tile: number) => number,
  code: (order: number) => number,
) {
  const codes = new Uint8Array(size)
  const order = new Map<number, number>()
  for (let tile = 0; tile < size; tile++) {
    const id = area(tile)
    if (id < 0) continue
    let rank = order.get(id)
    if (rank === undefined) {
      rank = order.size + 1
      order.set(id, rank)
    }
    codes[tile] = code(rank)
  }
  return codes
}

export function surfaceTileInfo(world: World, grid: Grid): Uint8Array {
  const { surface } = world
  const dry = (tile: number, id: number) => (surface.water[tile] === 1 ? -1 : id)
  const countries = borderCodes(
    grid.size,
    (tile) => dry(tile, surface.country[tile] ?? -1),
    (rank) => (rank * 23) & 255,
  )
  const regions = borderCodes(
    grid.size,
    (tile) => dry(tile, surface.region[tile] ?? -1),
    (rank) => ((rank * 37) % 250) + 4,
  )
  const info = new Uint8Array(grid.size * CHANNELS)
  for (let tile = 0; tile < grid.size; tile++) {
    info[tile * 4 + 1] = countries[tile] ?? 0
    info[tile * 4 + 2] = regions[tile] ?? 0
    info[tile * 4 + 3] = COVER_BY_TYPE[surface.type[tile] ?? 0] ?? 0
  }
  return info
}

export function undergroundTileInfo(level: UndergroundRecord, grid: Grid): Uint8Array {
  const open = (tile: number, id: number) => ((level.setting[tile] ?? 0) > 0 ? id : -1)
  const realms = borderCodes(
    grid.size,
    (tile) => open(tile, level.realm[tile] ?? -1),
    (rank) => ((rank * 41) % 240) + 10,
  )
  const networks = borderCodes(
    grid.size,
    (tile) => {
      const network = level.network[tile] ?? -1
      return open(tile, network >= 0 ? network : (level.cavern[tile] ?? -1))
    },
    (rank) => ((rank * 37) % 240) + 10,
  )
  const info = new Uint8Array(grid.size * CHANNELS)
  for (let tile = 0; tile < grid.size; tile++) {
    info[tile * 4 + 1] = realms[tile] ?? 0
    info[tile * 4 + 2] = networks[tile] ?? 0
  }
  return info
}

export function emptyTileInfo(grid: Grid): Uint8Array {
  return new Uint8Array(grid.size * CHANNELS)
}
