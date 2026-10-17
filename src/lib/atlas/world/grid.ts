export const SQRT3 = Math.sqrt(3)
export const HALF_SQRT3 = SQRT3 / 2
export const EDGES = 6
export const NO_TILE = 0xffff
export const MAX_TILES = NO_TILE

const AXIAL_STEPS: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [0, -1],
  [1, -1],
]

export const CORNERS: readonly (readonly [number, number])[] = Array.from(
  { length: EDGES },
  (_, corner) => {
    const angle = ((60 * corner - 30) * Math.PI) / 180
    return [Math.cos(angle), Math.sin(angle)] as const
  },
)

export const CORNER_X = Float64Array.from(CORNERS, ([x]) => x)
export const CORNER_Z = Float64Array.from(CORNERS, ([, z]) => z)

export type Grid = {
  readonly columns: number
  readonly rows: number
  readonly size: number
  readonly originX: number
  readonly originZ: number
  readonly x: Float32Array
  readonly z: Float32Array
  readonly q: Int32Array
  readonly r: Int32Array
  readonly neighbours: Int32Array
}

const axialColumn = (q: number, row: number) => q + ((row - (row & 1)) >> 1)

export function latticeX(column: number, row: number, originX: number): number {
  return SQRT3 * (column + 0.5 * (row & 1)) - originX
}

export function latticeZ(row: number, originZ: number): number {
  return 1.5 * row - originZ
}

export function createGrid(columns: number, rows: number): Grid {
  const size = columns * rows
  if (size > MAX_TILES)
    throw new RangeError(`a world holds at most ${MAX_TILES} tiles, not ${size}`)
  const originX = (SQRT3 * (columns - 0.5)) / 2
  const originZ = (1.5 * (rows - 1)) / 2
  const x = new Float32Array(size)
  const z = new Float32Array(size)
  const q = new Int32Array(size)
  const r = new Int32Array(size)
  const neighbours = new Int32Array(size * EDGES).fill(-1)
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const tile = row * columns + column
      const axialQ = column - ((row - (row & 1)) >> 1)
      x[tile] = latticeX(column, row, originX)
      z[tile] = latticeZ(row, originZ)
      q[tile] = axialQ
      r[tile] = row
      for (const [edge, [dq, dr]] of AXIAL_STEPS.entries()) {
        const nextRow = row + dr
        if (nextRow < 0 || nextRow >= rows) continue
        const nextColumn = axialColumn(axialQ + dq, nextRow)
        if (nextColumn >= 0 && nextColumn < columns) {
          neighbours[tile * EDGES + edge] = nextRow * columns + nextColumn
        }
      }
    }
  }
  return { columns, rows, size, originX, originZ, x, z, q, r, neighbours }
}

export function tileOf(grid: Grid, column: number, row: number): number {
  if (column < 0 || row < 0 || column >= grid.columns || row >= grid.rows) return -1
  return row * grid.columns + column
}

export function columnOf(grid: Grid, tile: number): number {
  return tile % grid.columns
}

export function rowOf(grid: Grid, tile: number): number {
  return Math.floor(tile / grid.columns)
}

export function neighbourOf(grid: Grid, tile: number, edge: number): number {
  return grid.neighbours[tile * EDGES + edge] ?? -1
}

export function hexDistance(grid: Grid, a: number, b: number): number {
  const dq = (grid.q[a] ?? 0) - (grid.q[b] ?? 0)
  const dr = (grid.r[a] ?? 0) - (grid.r[b] ?? 0)
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2
}

export function hexReach(dx: number, dz: number): number {
  return (
    Math.max(
      Math.abs(dx),
      Math.abs(0.5 * dx + HALF_SQRT3 * dz),
      Math.abs(-0.5 * dx + HALF_SQRT3 * dz),
    ) / HALF_SQRT3
  )
}

export function tileAt(grid: Grid, x: number, z: number): number {
  const px = x + grid.originX
  const pz = z + grid.originZ
  const r = pz * (2 / 3)
  const q = px / SQRT3 - pz / 3
  let rx = Math.round(q)
  let rz = Math.round(r)
  const y = -q - r
  const ry = Math.round(y)
  const dx = Math.abs(rx - q)
  const dy = Math.abs(ry - y)
  const dz = Math.abs(rz - r)
  if (dx > dy && dx > dz) rx = -ry - rz
  else if (dy <= dz) rz = -rx - ry
  return tileOf(grid, axialColumn(rx, rz), rz)
}
