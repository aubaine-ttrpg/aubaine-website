import {
  DataArrayTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RedFormat,
  UnsignedByteType,
} from 'three'
import { PARCHMENT_GLYPHS } from '../contract/parchment.ts'
import { svgPath } from '../svg-path.ts'

const MARGIN = 0.06
const ALPHA = 3
const RGBA = 4

export async function glyphAtlas(size: number): Promise<DataArrayTexture> {
  const { PARCHMENT_GLYPH_FILES } = await import('./parchment-glyphs.ts')
  const count = PARCHMENT_GLYPHS.length
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size * count
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('the browser gave no 2D canvas to draw the parchment glyphs on')
  context.fillStyle = '#fff'
  for (const [layer, glyph] of PARCHMENT_GLYPHS.entries()) {
    const path = svgPath(PARCHMENT_GLYPH_FILES[glyph])
    const scale = (size * (1 - 2 * MARGIN)) / path.size
    context.setTransform(scale, 0, 0, scale, size * MARGIN, size * (layer + MARGIN))
    context.fill(new Path2D(path.d))
  }
  const pixels = context.getImageData(0, 0, size, size * count).data
  const layers = new Uint8Array(size * size * count)
  for (let pixel = 0; pixel < layers.length; pixel++) {
    layers[pixel] = pixels[pixel * RGBA + ALPHA] ?? 0
  }
  const texture = new DataArrayTexture(layers, size, size, PARCHMENT_GLYPHS.length)
  texture.format = RedFormat
  texture.type = UnsignedByteType
  texture.unpackAlignment = 1
  texture.magFilter = LinearFilter
  texture.minFilter = LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}
