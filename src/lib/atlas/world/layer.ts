import type { Grid } from './grid.ts'

export const EMPTY_CELL = '.'

export type Layer<V> = {
  readonly legend: Readonly<Record<string, V>>
  readonly rows: readonly string[]
}

export class LayerShapeError extends Error {
  readonly layer: string

  constructor(layer: string, message: string) {
    super(`${layer}: ${message}`)
    this.name = 'LayerShapeError'
    this.layer = layer
  }
}

export function readLayer<V>(name: string, layer: Layer<V>, grid: Grid): (V | undefined)[] {
  if (layer.rows.length !== grid.rows) {
    throw new LayerShapeError(name, `${layer.rows.length} rows where the grid has ${grid.rows}`)
  }
  const values = Array.from({ length: grid.size }, (): V | undefined => undefined)
  for (const [row, cells] of layer.rows.entries()) {
    if (cells.length !== grid.columns) {
      throw new LayerShapeError(
        name,
        `row ${row} has ${cells.length} cells where the grid has ${grid.columns}`,
      )
    }
    for (let column = 0; column < cells.length; column++) {
      const cell = cells.charAt(column)
      if (cell === EMPTY_CELL) continue
      if (!Object.hasOwn(layer.legend, cell)) {
        throw new LayerShapeError(name, `'${cell}' at row ${row}, column ${column} has no legend`)
      }
      values[row * grid.columns + column] = layer.legend[cell]
    }
  }
  return values
}
