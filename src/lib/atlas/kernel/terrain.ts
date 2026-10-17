import { MAX_BLEND, type RevealField, type TerrainChunk } from '../contract/scene.ts'
import { TILE_TYPES, WATER_DEPTHS } from '../vocabulary.ts'
import { CORNERS, EDGES, type Grid, neighbourOf, tileOf } from '../world/grid.ts'
import type { CaveRecord, World } from '../world/model.ts'
import { heightIn, type ReliefField, reliefNoise, SLOPE_START, surfaceY } from '../world/relief.ts'
import { smoothstep01 } from '../world/smoothstep.ts'
import { type HeightMap, occlusion } from './heightmap.ts'
import {
  edgeColumns,
  rimHeights,
  WallWriter,
  wallSegments,
  writeHexTop,
  writeWallSheet,
} from './hex-mesh.ts'
import { type MeshLayout, MeshWriter, unorm } from './mesh.ts'
import { hexHidden } from './reveal.ts'

export const CHUNK_COLUMNS = 32
export const CHUNK_ROWS = 16
export const OPEN_WATER_RINGS = 2
export const TOP_LAYOUT: MeshLayout = { bytes: true, floats: 0 }
export const WALL_LAYOUT: MeshLayout = { bytes: true, floats: 1 }
export const TUNNEL_LAYOUT: MeshLayout = { bytes: true, floats: 0 }
export const STALACTITE_LIP = 5

const FLAT_TYPES: ReadonlySet<number> = new Set([
  TILE_TYPES.indexOf('swamp'),
  TILE_TYPES.indexOf('urban'),
])
const ABYSS_LEVEL = Math.min(...WATER_DEPTHS)
const BLEND_START = 0.45
const NORMAL_STEP = 0.045
const CLIFF_LIMIT = 0.09
const COLUMNS_PER_SEGMENT = 2
const CAVE_COLUMNS_PER_SEGMENT = 4
const BOTTOM_OVERLAP = 0.025

export type CaveMouth = {
  x: number
  y: number
  z: number
  outX: number
  outY: number
  outZ: number
  kind: CaveRecord['kind']
}

export type TerrainChunkBuild = { chunk: TerrainChunk; mouths: CaveMouth[] }

export type TerrainSource = {
  world: World
  field: ReliefField
  map: HeightMap
  rings: Uint8Array
  hidden: Uint8Array
  caves: ReadonlyMap<number, CaveRecord>
}

type Writers = { walls: MeshWriter; tunnels: MeshWriter; mouths: CaveMouth[] }

const built = (writer: MeshWriter) => (writer.vertexCount > 0 ? writer.build() : undefined)

function isOpenWater(world: World, grid: Grid, tile: number): boolean {
  const { water, lake } = world.surface
  if (water[tile] !== 1 || (lake[tile] ?? -1) >= 0) return false
  for (let edge = 0; edge < EDGES; edge++) {
    const next = neighbourOf(grid, tile, edge)
    if (next < 0 || water[next] !== 1 || (lake[next] ?? -1) >= 0) return false
  }
  return true
}

export function isAbyss(world: World, grid: Grid, tile: number): boolean {
  const { water, lake, level } = world.surface
  if (water[tile] !== 1 || (lake[tile] ?? -1) >= 0 || (level[tile] ?? 0) > ABYSS_LEVEL) return false
  for (let edge = 0; edge < EDGES; edge++) {
    const next = neighbourOf(grid, tile, edge)
    if (next < 0 || (level[next] ?? 0) > ABYSS_LEVEL) return false
  }
  return true
}

function seabedHidden(world: World, grid: Grid, tile: number): boolean {
  if (!isAbyss(world, grid, tile)) return false
  for (let edge = 0; edge < EDGES; edge++) {
    if (!isAbyss(world, grid, neighbourOf(grid, tile, edge))) return false
  }
  return true
}

export function terrainSource(
  world: World,
  field: ReliefField,
  map: HeightMap,
  rings: number,
  reveal: RevealField,
): TerrainSource {
  const { grid } = field
  const tileRings = new Uint8Array(grid.size)
  const hidden = new Uint8Array(grid.size)
  for (let tile = 0; tile < grid.size; tile++) {
    tileRings[tile] = isOpenWater(world, grid, tile) ? OPEN_WATER_RINGS : rings
    hidden[tile] = hexHidden(reveal, grid.x[tile] ?? 0, grid.z[tile] ?? 0) ? 1 : 0
  }
  return {
    world,
    field,
    map,
    rings: tileRings,
    hidden,
    caves: new Map(world.caves.map((cave) => [cave.tile * EDGES + cave.edge, cave])),
  }
}

export function chunkLayout(grid: Grid): { columns: number; rows: number; count: number } {
  const columns = Math.ceil(grid.columns / CHUNK_COLUMNS)
  const rows = Math.ceil(grid.rows / CHUNK_ROWS)
  return { columns, rows, count: columns * rows }
}

export function chunksNearest(grid: Grid, x: number, z: number): number[] {
  const { columns, count } = chunkLayout(grid)
  const distance = (chunk: number) => {
    const column = Math.min(grid.columns - 1, (chunk % columns) * CHUNK_COLUMNS + CHUNK_COLUMNS / 2)
    const row = Math.min(grid.rows - 1, Math.floor(chunk / columns) * CHUNK_ROWS + CHUNK_ROWS / 2)
    const tile = tileOf(grid, column, row)
    return Math.hypot((grid.x[tile] ?? 0) - x, (grid.z[tile] ?? 0) - z)
  }
  return Array.from({ length: count }, (_, chunk) => chunk).sort(
    (a, b) => distance(a) - distance(b),
  )
}

const slope = (forward: number, backward: number) =>
  Math.abs(forward) < CLIFF_LIMIT && Math.abs(backward) < CLIFF_LIMIT
    ? (forward + backward) / (2 * NORMAL_STEP)
    : (Math.abs(forward) < Math.abs(backward) ? forward : backward) / NORMAL_STEP

function writeSurfaceNormal(
  field: ReliefField,
  x: number,
  z: number,
  h0: number,
  out: Float64Array,
): void {
  const gx = slope(
    surfaceY(field, x + NORMAL_STEP, z) - h0,
    h0 - surfaceY(field, x - NORMAL_STEP, z),
  )
  const gz = slope(
    surfaceY(field, x, z + NORMAL_STEP) - h0,
    h0 - surfaceY(field, x, z - NORMAL_STEP),
  )
  const length = Math.sqrt(gx * gx + 1 + gz * gz)
  out[0] = -gx / length
  out[1] = 1 / length
  out[2] = -gz / length
}

function writeTop(source: TerrainSource, tile: number, tops: MeshWriter): void {
  const { world, field, map } = source
  const { grid } = field
  const { surface } = world
  const type = surface.type[tile] ?? 0
  const flat = FLAT_TYPES.has(type)
  const normal = new Float64Array(3)
  writeHexTop(
    tops,
    grid.x[tile] ?? 0,
    grid.z[tile] ?? 0,
    source.rings[tile] ?? OPEN_WATER_RINGS,
    (x, z, rho, edge) => {
      const y = heightIn(field, tile, x, z)
      if (rho <= SLOPE_START && flat) {
        normal[0] = 0
        normal[1] = 1
        normal[2] = 0
      } else writeSurfaceNormal(field, x, z, y, normal)
      tops.vertex(x, y, z, normal[0] ?? 0, normal[1] ?? 1, normal[2] ?? 0)
      let other = type
      let blend = 0
      if (rho > BLEND_START) {
        const next = neighbourOf(grid, tile, edge)
        if (next >= 0 && (surface.connection[tile * EDGES + edge] ?? 3) <= 1) {
          other = surface.type[next] ?? type
          blend = MAX_BLEND * smoothstep01((rho - BLEND_START) / (1 - BLEND_START))
        }
      }
      tops.bytes(type, other, unorm(blend / MAX_BLEND), unorm(occlusion(map, x, y, z)))
    },
  )
}

function gridWall(
  wall: WallWriter,
  columns: { xs: Float64Array; zs: Float64Array; offsets: Float64Array },
  top: Float64Array,
  bottom: Float64Array,
  nx: number,
  nz: number,
  hole: ((u: number, y: number) => boolean) | undefined,
): void {
  const { xs, zs, offsets } = columns
  const segments = xs.length - 1
  let tallest = 0
  for (let m = 0; m <= segments; m++) tallest = Math.max(tallest, (top[m] ?? 0) - (bottom[m] ?? 0))
  if (tallest < 0.002) return
  const rows = Math.max(1, Math.min(48, Math.ceil(tallest / (hole ? 0.045 : 0.11))))
  const span = rows + 1
  const points = new Float64Array((segments + 1) * span * 3)
  for (let m = 0; m <= segments; m++) {
    const taper = Math.sin((Math.PI * m) / segments) ** 0.5
    const x0 = (xs[m] ?? 0) + nx * (offsets[m] ?? 0)
    const z0 = (zs[m] ?? 0) + nz * (offsets[m] ?? 0)
    const high = top[m] ?? 0
    const low = bottom[m] ?? high
    for (let r = 0; r <= rows; r++) {
      const f = r / rows
      const y = low + (high - low) * f
      const bulge = Math.sin(Math.PI * f)
      const push =
        reliefNoise.n2(x0 * 1.6 + y * 2.3, z0 * 1.6 - y * 1.9) * 0.05 * taper * bulge +
        reliefNoise.n2(x0 * 5.1 + y * 6, z0 * 5.1) * 0.012 * taper * bulge
      const o = (m * span + r) * 3
      points[o] = x0 + nx * push
      points[o + 1] = y
      points[o + 2] = z0 + nz * push
    }
  }
  writeWallSheet(wall, { points, segments, rows, nx, nz, lips: top, hole })
}

type Mouth = {
  x: number
  z: number
  nx: number
  nz: number
  tx: number
  tz: number
  baseY: number
  width: number
  height: number
  topY: number
  kind: CaveRecord['kind']
}

function caveMouth(writers: Writers, wall: WallWriter, mouth: Mouth): void {
  const { x, z, nx, nz, tx, tz, baseY, width, height, topY } = mouth
  const depth = 0.55
  const radius = width / 2
  const archY = height - radius
  const outline: [number, number][] = [
    [-radius, 0],
    [-radius, archY],
  ]
  for (let k = 1; k < 10; k++) {
    const angle = Math.PI - (Math.PI * k) / 10
    outline.push([Math.cos(angle) * radius, archY + Math.sin(angle) * radius])
  }
  outline.push([radius, archY], [radius, 0])
  const place = (u: number, v: number, d: number, s: number): [number, number, number] => [
    x + tx * u * s - nx * d,
    baseY + v * s,
    z + tz * u * s - nz * d,
  ]
  const { tunnels } = writers
  const tunnelVertex = (p: [number, number, number], r: number, g: number, b: number) => {
    const index = tunnels.vertex(p[0], p[1], p[2], 0, 1, 0)
    tunnels.bytes(unorm(r), unorm(g), unorm(b), 255)
    return index
  }
  const sideStart = tunnels.vertexCount
  for (const [u, v] of outline) {
    tunnelVertex(place(u, v, -0.01, 1), 0.13, 0.12, 0.12)
    tunnelVertex(place(u, v, depth, 0.7), 0, 0, 0)
  }
  for (let k = 0; k < outline.length - 1; k++) {
    const a = sideStart + k * 2
    tunnels.triangle(a, a + 1, a + 2)
    tunnels.triangle(a + 1, a + 3, a + 2)
  }
  const floorStart = tunnels.vertexCount
  tunnelVertex(place(-radius, 0, -0.01, 1), 0.1, 0.09, 0.08)
  tunnelVertex(place(radius, 0, -0.01, 1), 0.1, 0.09, 0.08)
  tunnelVertex(place(-radius, 0, depth, 0.7), 0, 0, 0)
  tunnelVertex(place(radius, 0, depth, 0.7), 0, 0, 0)
  tunnels.triangle(floorStart, floorStart + 2, floorStart + 1)
  tunnels.triangle(floorStart + 1, floorStart + 2, floorStart + 3)
  const back = tunnelVertex(place(0, archY * 0.6, depth, 0.7), 0, 0, 0)
  for (const [u, v] of outline) tunnelVertex(place(u, v, depth, 0.7), 0, 0, 0)
  for (let k = 0; k < outline.length - 1; k++) tunnels.triangle(back, back + 1 + k, back + 2 + k)

  const arch: [number, number][] = [[radius + 0.03, -0.02]]
  for (let k = 0; k <= 16; k++) {
    const angle = (Math.PI * k) / 16
    arch.push([Math.cos(angle) * (radius + 0.03), archY + Math.sin(angle) * (radius + 0.03)])
  }
  arch.push([-radius - 0.03, -0.02])
  const rimStart = wall.vertexCount
  for (const [u, v] of arch) {
    const thickness = 0.045 + Math.abs(reliefNoise.n2(u * 9 + x, v * 9 + z)) * 0.03
    const reach = Math.hypot(u, v - archY || 1e-3)
    const du = u === 0 ? 0 : u / reach
    const dv = (v - archY) / reach
    for (let s = 0; s <= 5; s++) {
      const angle = (s / 5) * Math.PI * 2
      const ou = Math.cos(angle) * thickness
      const ov = Math.sin(angle) * thickness * 0.8
      const uu = u + du * ou * (v > archY ? 1 : 0) + (v <= archY ? Math.sign(u) * ou : 0)
      const vv = v + (v > archY ? dv * ou : 0)
      wall.vertex(
        x + tx * uu + nx * (ov + 0.02),
        baseY + vv,
        z + tz * uu + nz * (ov + 0.02),
        nx * Math.sin(angle) + tx * Math.cos(angle) * 0.4,
        Math.cos(angle) * 0.4,
        nz * Math.sin(angle) + tz * Math.cos(angle) * 0.4,
        topY,
      )
    }
  }
  for (let k = 0; k < arch.length - 1; k++) {
    for (let s = 0; s < 5; s++) {
      const a = rimStart + k * 6 + s
      const b = a + 6
      wall.triangle(a, b, a + 1)
      wall.triangle(a + 1, b, b + 1)
    }
  }
  for (let k = 0; k < 4; k++) {
    const u = (k / 3 - 0.5) * radius * 1.2
    const v0 = archY + Math.sqrt(Math.max(0, radius * radius - u * u)) - 0.01
    const length = 0.05 + (k % 2) * 0.04
    const start = wall.vertexCount
    for (let s = 0; s < 4; s++) {
      const angle = (s / 4) * Math.PI * 2
      wall.vertex(
        x + tx * (u + Math.cos(angle) * 0.018) - nx * (0.04 + Math.sin(angle) * 0.018),
        baseY + v0,
        z + tz * (u + Math.cos(angle) * 0.018) - nz * (0.04 + Math.sin(angle) * 0.018),
        Math.cos(angle),
        0,
        Math.sin(angle),
        topY + STALACTITE_LIP,
      )
    }
    const tip = wall.vertex(
      x + tx * u - nx * 0.04,
      baseY + v0 - length,
      z + tz * u - nz * 0.04,
      0,
      -1,
      0,
      topY + STALACTITE_LIP,
    )
    for (let s = 0; s < 4; s++) wall.triangle(start + s, start + ((s + 1) % 4), tip)
  }
  writers.mouths.push({
    x: x - nx * 0.38,
    y: baseY + height * 0.35,
    z: z - nz * 0.38,
    outX: x + nx * 0.05,
    outY: baseY + height * 0.4,
    outZ: z + nz * 0.05,
    kind: mouth.kind,
  })
}

function buildWall(source: TerrainSource, writers: Writers, tile: number, edge: number): void {
  const { world, field } = source
  const { grid } = field
  const { surface } = world
  const other = neighbourOf(grid, tile, edge)
  const connection = surface.connection[tile * EDGES + edge] ?? 3
  const ownRings = source.rings[tile] ?? OPEN_WATER_RINGS
  const otherRings = source.rings[other] ?? OPEN_WATER_RINGS
  const cave = source.caves.get(tile * EDGES + edge)
  const segments = wallSegments(
    ownRings,
    otherRings,
    cave ? CAVE_COLUMNS_PER_SEGMENT : COLUMNS_PER_SEGMENT,
  )
  const columns = edgeColumns(grid, tile, edge, segments)
  const { xs, zs } = columns
  const top = rimHeights((x, z) => heightIn(field, tile, x, z), columns, ownRings)
  const bottom = rimHeights((x, z) => heightIn(field, other, x, z), columns, otherRings)
  let drop = 0
  for (let m = 0; m <= segments; m++) drop = Math.max(drop, (top[m] ?? 0) - (bottom[m] ?? 0))
  if (drop < 0.004) return
  const angle = (edge * Math.PI) / 3
  const nx = Math.cos(angle)
  const nz = Math.sin(angle)
  const wall = new WallWriter(writers.walls, source.map, { tile, biome: surface.type[tile] ?? 0 })
  const otherWet = surface.water[other] === 1
  const steps: { f: number; d: number }[] = []
  if (!cave) {
    if (connection === 1) steps.push({ f: 0.5, d: 0.17 })
    else if (drop > 2 && !otherWet) steps.push({ f: 0.33, d: 0.075 }, { f: 0.66, d: 0.06 })
    else if (drop > 1.05 && !otherWet) steps.push({ f: 0.45, d: 0.085 })
  }
  let hole: ((u: number, y: number) => boolean) | undefined
  if (cave) {
    const middle = segments / 2
    const sea = otherWet && (surface.lake[other] ?? -1) < 0
    const baseY = Math.max(bottom[middle] ?? 0, sea ? 0.025 : -9)
    const topY = top[middle] ?? 0
    const width = 0.34
    const height = Math.min(0.5, (topY - baseY) * 0.62)
    const archY = baseY + height - width / 2
    hole = (u, y) => {
      const du = u - 0.5
      if (Math.abs(du) >= width / 2 || y < baseY) return false
      if (y < archY) return true
      return du * du + (y - archY) * (y - archY) < (width / 2) * (width / 2)
    }
    const [c0x, c0z] = CORNERS[edge] ?? [0, 0]
    const [c1x, c1z] = CORNERS[(edge + 1) % EDGES] ?? [0, 0]
    caveMouth(writers, wall, {
      x: ((xs[0] ?? 0) + (xs[segments] ?? 0)) / 2,
      z: ((zs[0] ?? 0) + (zs[segments] ?? 0)) / 2,
      nx,
      nz,
      tx: c1x - c0x,
      tz: c1z - c0z,
      baseY,
      width,
      height,
      topY,
      kind: cave.kind,
    })
  }
  let offsets = new Float64Array(segments + 1)
  let currentTop = top
  for (let s = 0; s <= steps.length; s++) {
    const step = steps[s]
    if (!step) {
      const finalBottom = bottom.map((value, m) => {
        const offset = offsets[m] ?? 0
        if (offset < 1e-4) return value
        return (
          heightIn(field, other, (xs[m] ?? 0) + nx * offset, (zs[m] ?? 0) + nz * offset) -
          BOTTOM_OVERLAP
        )
      })
      gridWall(wall, { xs, zs, offsets }, currentTop, finalBottom, nx, nz, hole)
      return
    }
    const ledge = top.map((value, m) => value + ((bottom[m] ?? 0) - value) * step.f)
    gridWall(wall, { xs, zs, offsets }, currentTop, ledge, nx, nz, undefined)
    const reach = offsets.map(
      (offset, m) =>
        offset +
        step.d *
          Math.sin((Math.PI * m) / segments) ** 0.6 *
          (0.75 + 0.5 * reliefNoise.n2((xs[m] ?? 0) * 3.1, (zs[m] ?? 0) * 3.1 + s)),
    )
    const start = wall.vertexCount
    for (let m = 0; m <= segments; m++) {
      const y = ledge[m] ?? 0
      const x = xs[m] ?? 0
      const z = zs[m] ?? 0
      const inner = offsets[m] ?? 0
      const outer = reach[m] ?? 0
      wall.vertex(x + nx * inner, y, z + nz * inner, 0, 1, 0, y + 0.001)
      wall.vertex(x + nx * outer, y, z + nz * outer, 0, 1, 0, y + 0.001)
    }
    for (let m = 0; m < segments; m++) {
      const a = start + m * 2
      wall.triangle(a, a + 2, a + 1)
      wall.triangle(a + 1, a + 2, a + 3)
    }
    offsets = reach
    currentTop = ledge
  }
}

export function* terrainChunkSteps(
  source: TerrainSource,
  chunk: number,
): Generator<undefined, TerrainChunkBuild> {
  const { world, field } = source
  const { grid } = field
  const { columns } = chunkLayout(grid)
  const startColumn = (chunk % columns) * CHUNK_COLUMNS
  const startRow = Math.floor(chunk / columns) * CHUNK_ROWS
  const tops = new MeshWriter(TOP_LAYOUT)
  const writers: Writers = {
    walls: new MeshWriter(WALL_LAYOUT),
    tunnels: new MeshWriter(TUNNEL_LAYOUT),
    mouths: [],
  }
  const { y, connection } = world.surface
  for (let row = startRow; row < Math.min(grid.rows, startRow + CHUNK_ROWS); row++) {
    for (
      let column = startColumn;
      column < Math.min(grid.columns, startColumn + CHUNK_COLUMNS);
      column++
    ) {
      const tile = row * grid.columns + column
      if (source.hidden[tile] === 1) continue
      if (!seabedHidden(world, grid, tile)) writeTop(source, tile, tops)
      for (let edge = 0; edge < EDGES; edge++) {
        const other = neighbourOf(grid, tile, edge)
        if (other < 0 || connection[tile * EDGES + edge] === 0) continue
        const own = y[tile] ?? 0
        const theirs = y[other] ?? 0
        if (own < theirs || (own === theirs && tile > other)) continue
        buildWall(source, writers, tile, edge)
      }
    }
    yield
  }
  return {
    chunk: {
      chunk,
      tops: built(tops),
      walls: built(writers.walls),
      tunnels: built(writers.tunnels),
    },
    mouths: writers.mouths,
  }
}
