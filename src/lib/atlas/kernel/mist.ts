import type { MeshData, Piece, RevealField } from '../contract/scene.ts'
import { smoothstep } from '../world/smoothstep.ts'
import { MeshWriter, POSITIONS_ONLY } from './mesh.ts'
import { hazeAt } from './reveal.ts'

export const MIST = {
  envelope: 12,
  cell: 4,
  haze: { low: 0.8, high: 6 },
  onset: 1.6,
  density: 0.7,
  settle: 40,
  reach: 1600,
  path: 120,
  melt: { from: 700, to: 1400 },
} as const

function closing(field: RevealField, x: number, z: number): number {
  const inside = Math.min(
    x - field.x0,
    field.x0 + field.spanX - x,
    z - field.z0,
    field.z0 + field.spanZ - z,
  )
  return 1 - smoothstep(0, MIST.settle, inside)
}

export function mistHaze(field: RevealField, x: number, z: number): number {
  return Math.max(hazeAt(field, x, z), closing(field, x, z))
}

type Lattice = {
  columns: number
  rows: number
  xAt: (column: number) => number
  zAt: (row: number) => number
  covered: Uint8Array
}

function coveredLattice(field: RevealField): Lattice {
  const step = MIST.cell
  const columns = Math.floor(field.spanX / step) + 1
  const rows = Math.floor(field.spanZ / step) + 1
  const xAt = (column: number) =>
    column === columns - 1 ? field.x0 + field.spanX : field.x0 + column * step
  const zAt = (row: number) => (row === rows - 1 ? field.z0 + field.spanZ : field.z0 + row * step)
  const hazy = new Uint8Array(columns * rows)
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      if (mistHaze(field, xAt(column), zAt(row)) > 0) hazy[row * columns + column] = 1
    }
  }
  const cells = (columns - 1) * (rows - 1)
  const touched = new Uint8Array(cells)
  for (let row = 0; row < rows - 1; row++) {
    for (let column = 0; column < columns - 1; column++) {
      const corner = (dc: number, dr: number) => hazy[(row + dr) * columns + column + dc] === 1
      if (corner(0, 0) || corner(1, 0) || corner(0, 1) || corner(1, 1)) {
        touched[row * (columns - 1) + column] = 1
      }
    }
  }
  const covered = new Uint8Array(cells)
  for (let row = 0; row < rows - 1; row++) {
    for (let column = 0; column < columns - 1; column++) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = row + dr
          const c = column + dc
          if (r < 0 || c < 0 || r >= rows - 1 || c >= columns - 1) continue
          if (touched[r * (columns - 1) + c] === 1) covered[row * (columns - 1) + column] = 1
        }
      }
    }
  }
  return { columns, rows, xAt, zAt, covered }
}

export function mistRoomCovers(field: RevealField): (x: number, z: number) => boolean {
  const { columns, rows, covered } = coveredLattice(field)
  const cellColumns = columns - 1
  const cellRows = rows - 1
  return (x, z) => {
    const across = x - field.x0
    const down = z - field.z0
    if (across < 0 || down < 0 || across > field.spanX || down > field.spanZ) return true
    const column = Math.min(Math.floor(across / MIST.cell), cellColumns - 1)
    const row = Math.min(Math.floor(down / MIST.cell), cellRows - 1)
    return covered[row * cellColumns + column] === 1
  }
}

function writeField(writer: MeshWriter, field: RevealField): void {
  const { columns, rows, xAt, zAt, covered } = coveredLattice(field)
  const cellColumns = columns - 1
  const cellRows = rows - 1
  const isCovered = (column: number, row: number) =>
    column < 0 || row < 0 || column >= cellColumns || row >= cellRows
      ? true
      : covered[row * cellColumns + column] === 1
  const roof = new Int32Array(columns * rows).fill(-1)
  const ground = new Int32Array(columns * rows).fill(-1)
  const pointAt = (cache: Int32Array, y: number) => (column: number, row: number) => {
    const key = row * columns + column
    const known = cache[key] ?? -1
    if (known >= 0) return known
    const made = writer.vertex(xAt(column), y, zAt(row), 0, 1, 0)
    cache[key] = made
    return made
  }
  const top = pointAt(roof, MIST.envelope)
  const foot = pointAt(ground, 0)
  const skirt = (from: [number, number], to: [number, number]) => {
    const fromTop = top(...from)
    const toTop = top(...to)
    const fromFoot = foot(...from)
    const toFoot = foot(...to)
    writer.triangle(fromFoot, fromTop, toFoot)
    writer.triangle(fromTop, toTop, toFoot)
  }
  for (let row = 0; row < cellRows; row++) {
    for (let column = 0; column < cellColumns; column++) {
      if (!isCovered(column, row)) continue
      const a = top(column, row)
      const b = top(column + 1, row)
      const c = top(column, row + 1)
      const d = top(column + 1, row + 1)
      writer.triangle(a, c, b)
      writer.triangle(b, c, d)
      if (!isCovered(column, row - 1)) skirt([column, row], [column + 1, row])
      if (!isCovered(column, row + 1)) skirt([column + 1, row + 1], [column, row + 1])
      if (!isCovered(column - 1, row)) skirt([column, row + 1], [column, row])
      if (!isCovered(column + 1, row)) skirt([column + 1, row], [column + 1, row + 1])
    }
  }
}

function writeApron(writer: MeshWriter, field: RevealField): void {
  const corner = (x: number, z: number) => writer.vertex(x, MIST.envelope, z, 0, 1, 0)
  const x1 = field.x0 + field.spanX
  const z1 = field.z0 + field.spanZ
  const a = corner(-MIST.reach, -MIST.reach)
  const b = corner(MIST.reach, -MIST.reach)
  const c = corner(MIST.reach, MIST.reach)
  const d = corner(-MIST.reach, MIST.reach)
  const e = corner(field.x0, field.z0)
  const f = corner(x1, field.z0)
  const g = corner(x1, z1)
  const h = corner(field.x0, z1)
  for (const [outerFrom, outerTo, innerTo, innerFrom] of [
    [a, b, f, e],
    [b, c, g, f],
    [c, d, h, g],
    [d, a, e, h],
  ] as const) {
    writer.triangle(outerFrom, innerFrom, outerTo)
    writer.triangle(outerTo, innerFrom, innerTo)
  }
}

function copied(mesh: MeshData): MeshData {
  return {
    ...mesh,
    positions: mesh.positions.slice(),
    normals: mesh.normals.slice(),
    indices: mesh.indices.slice(),
    bounds: [...mesh.bounds],
  }
}

export function buildMist(field: RevealField): Piece[] {
  const writer = new MeshWriter(POSITIONS_ONLY)
  writeField(writer, field)
  writeApron(writer, field)
  const mesh = writer.build()
  return [
    { material: 'mist-depth', mesh: copied(mesh), casts: false },
    { material: 'mist', mesh, casts: false },
  ]
}
