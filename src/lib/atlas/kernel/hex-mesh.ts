import { CORNER_X, CORNER_Z, EDGES, type Grid } from '../world/grid.ts'
import { type HeightMap, occlusion } from './heightmap.ts'
import { type MeshWriter, unorm } from './mesh.ts'

export type HexPoint = (x: number, z: number, rho: number, edge: number) => void

export type EdgeColumns = { xs: Float64Array; zs: Float64Array }

export type WallOwner = { tile: number; biome: number }

export type WallSheet = {
  points: Float64Array
  segments: number
  rows: number
  nx: number
  nz: number
  lips: Float64Array
  hole: ((u: number, y: number) => boolean) | undefined
}

const ringStart = (ring: number) => 1 + 3 * ring * (ring - 1)
const greatestDivisor = (a: number, b: number): number => (b === 0 ? a : greatestDivisor(b, a % b))

export function writeHexTop(
  mesh: MeshWriter,
  x: number,
  z: number,
  rings: number,
  point: HexPoint,
): void {
  const base = mesh.vertexCount
  point(x, z, 0, 0)
  for (let ring = 1; ring <= rings; ring++) {
    const f = ring / rings
    for (let edge = 0; edge < EDGES; edge++) {
      const next = (edge + 1) % EDGES
      const c0x = CORNER_X[edge] ?? 0
      const c0z = CORNER_Z[edge] ?? 0
      const c1x = CORNER_X[next] ?? 0
      const c1z = CORNER_Z[next] ?? 0
      for (let j = 0; j < ring; j++) {
        const t = j / ring
        point(x + (c0x + (c1x - c0x) * t) * f, z + (c0z + (c1z - c0z) * t) * f, f, edge)
      }
    }
  }
  const written = mesh.vertexCount - base
  if (written !== ringStart(rings + 1)) {
    throw new Error(
      `a hex top of ${rings} rings takes one vertex per point, not ${written} vertices`,
    )
  }
  for (let ring = 1; ring <= rings; ring++) {
    const outer = base + ringStart(ring)
    const inner = base + ringStart(ring - 1)
    for (let edge = 0; edge < EDGES; edge++) {
      for (let j = 0; j < ring; j++) {
        const o0 = outer + ((edge * ring + j) % (EDGES * ring))
        const o1 = outer + ((edge * ring + j + 1) % (EDGES * ring))
        if (ring === 1) {
          mesh.triangle(base, o1, o0)
          continue
        }
        const in0 = inner + ((edge * (ring - 1) + j) % (EDGES * (ring - 1)))
        const in1 = inner + ((edge * (ring - 1) + j + 1) % (EDGES * (ring - 1)))
        mesh.triangle(in0, o1, o0)
        if (j < ring - 1) mesh.triangle(in0, in1, o1)
      }
    }
  }
}

export function writeFlatHex(mesh: MeshWriter, cx: number, cz: number, y: number): void {
  const base = mesh.vertex(cx, y, cz, 0, 1, 0)
  for (let edge = 0; edge < EDGES; edge++) {
    mesh.vertex(cx + (CORNER_X[edge] ?? 0), y, cz + (CORNER_Z[edge] ?? 0), 0, 1, 0)
  }
  for (let edge = 0; edge < EDGES; edge++) {
    mesh.triangle(base, base + 1 + ((edge + 1) % EDGES), base + 1 + edge)
  }
}

export function wallSegments(ownRings: number, otherRings: number, perSegment: number): number {
  return perSegment * ((ownRings * otherRings) / greatestDivisor(ownRings, otherRings))
}

export function edgeColumns(grid: Grid, tile: number, edge: number, segments: number): EdgeColumns {
  const next = (edge + 1) % EDGES
  const c0x = CORNER_X[edge] ?? 0
  const c0z = CORNER_Z[edge] ?? 0
  const c1x = CORNER_X[next] ?? 0
  const c1z = CORNER_Z[next] ?? 0
  const cx = grid.x[tile] ?? 0
  const cz = grid.z[tile] ?? 0
  const xs = new Float64Array(segments + 1)
  const zs = new Float64Array(segments + 1)
  for (let m = 0; m < segments; m++) {
    const t = m / segments
    xs[m] = cx + (c0x + (c1x - c0x) * t)
    zs[m] = cz + (c0z + (c1z - c0z) * t)
  }
  xs[segments] = cx + c1x
  zs[segments] = cz + c1z
  return { xs, zs }
}

export function rimHeights(
  height: (x: number, z: number) => number,
  columns: EdgeColumns,
  rings: number,
): Float64Array {
  const { xs, zs } = columns
  const segments = xs.length - 1
  const stride = segments / rings
  const heights = new Float64Array(segments + 1)
  for (let m = 0; m <= segments; m += stride) heights[m] = height(xs[m] ?? 0, zs[m] ?? 0)
  for (let m = 0; m < segments; m++) {
    const into = m % stride
    if (into === 0) continue
    const before = m - into
    const f = into / stride
    heights[m] = (heights[before] ?? 0) * (1 - f) + (heights[before + stride] ?? 0) * f
  }
  return heights
}

export class WallWriter {
  private readonly mesh: MeshWriter
  private readonly map: HeightMap
  private readonly owner: WallOwner

  constructor(mesh: MeshWriter, map: HeightMap, owner: WallOwner) {
    this.mesh = mesh
    this.map = map
    this.owner = owner
  }

  get vertexCount(): number {
    return this.mesh.vertexCount
  }

  vertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, lip: number): number {
    const index = this.mesh.vertex(x, y, z, nx, ny, nz)
    const { tile, biome } = this.owner
    this.mesh.bytes(biome, tile & 0xff, tile >> 8, unorm(occlusion(this.map, x, y, z)))
    this.mesh.float(lip)
    return index
  }

  triangle(a: number, b: number, c: number): void {
    this.mesh.triangle(a, b, c)
  }
}

export function writeWallSheet(wall: WallWriter, sheet: WallSheet): void {
  const { points, segments, rows, nx, nz, lips, hole } = sheet
  const span = rows + 1
  const coordinate = (m: number, r: number, axis: number) => points[(m * span + r) * 3 + axis] ?? 0
  const base = wall.vertexCount
  for (let m = 0; m <= segments; m++) {
    const previous = Math.max(0, m - 1)
    const next = Math.min(segments, m + 1)
    for (let r = 0; r <= rows; r++) {
      const below = Math.max(0, r - 1)
      const above = Math.min(rows, r + 1)
      const tx = coordinate(next, r, 0) - coordinate(previous, r, 0)
      const ty = coordinate(next, r, 1) - coordinate(previous, r, 1)
      const tz = coordinate(next, r, 2) - coordinate(previous, r, 2)
      const vx = coordinate(m, above, 0) - coordinate(m, below, 0)
      const vy = coordinate(m, above, 1) - coordinate(m, below, 1)
      const vz = coordinate(m, above, 2) - coordinate(m, below, 2)
      let cx = vy * tz - vz * ty
      let cy = vz * tx - vx * tz
      let cz = vx * ty - vy * tx
      if (cx * nx + cz * nz < 0) {
        cx = -cx
        cy = -cy
        cz = -cz
      }
      wall.vertex(
        coordinate(m, r, 0),
        coordinate(m, r, 1),
        coordinate(m, r, 2),
        cx,
        cy,
        cz,
        lips[m] ?? 0,
      )
    }
  }
  for (let m = 0; m < segments; m++) {
    for (let r = 0; r < rows; r++) {
      if (hole?.((m + 0.5) / segments, (coordinate(m, r, 1) + coordinate(m + 1, r + 1, 1)) / 2))
        continue
      const a = base + m * span + r
      const b = a + span
      wall.triangle(a, b, a + 1)
      wall.triangle(a + 1, b, b + 1)
    }
  }
}
