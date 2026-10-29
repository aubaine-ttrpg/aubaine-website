export type Grid = { columns: number; rows: number }

export function gridIndex(grid: Pick<Grid, 'columns'>, column: number, row: number): number {
  return row * grid.columns + column
}

export function gridTriangles(grid: Grid): Uint16Array {
  if (grid.columns * grid.rows > 65536) {
    throw new Error('a grid of more than 65536 points cannot be indexed')
  }
  const indices: number[] = []
  for (let row = 0; row + 1 < grid.rows; row++) {
    for (let column = 0; column + 1 < grid.columns; column++) {
      const a = gridIndex(grid, column, row)
      const b = gridIndex(grid, column + 1, row)
      const c = gridIndex(grid, column, row + 1)
      const d = gridIndex(grid, column + 1, row + 1)
      indices.push(a, c, b, b, c, d)
    }
  }
  return Uint16Array.from(indices)
}

export function gridCorners(grid: Grid): Float32Array {
  const out = new Float32Array(grid.columns * grid.rows * 2)
  for (let row = 0; row < grid.rows; row++) {
    for (let column = 0; column < grid.columns; column++) {
      const at = gridIndex(grid, column, row) * 2
      out[at] = column / (grid.columns - 1)
      out[at + 1] = row / (grid.rows - 1)
    }
  }
  return out
}
