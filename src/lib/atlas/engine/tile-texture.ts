import { DataTexture, NearestFilter, RGBAFormat } from 'three'
import type { Grid } from '../world/grid.ts'

export function tileTexture(data: Uint8Array, grid: Grid): DataTexture {
  const texture = new DataTexture(data, grid.columns, grid.rows, RGBAFormat)
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
  texture.needsUpdate = true
  return texture
}
