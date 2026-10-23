import { resolve } from 'node:path'
import sharp from 'sharp'
import { hexOf, KEY_FALLBACK, keyColour, type Rgb, rgbOf } from './key-colour'

const ART_DIRECTORY = 'data/media/art'
const SAMPLE_WIDTH = 96
const CHANNELS = 3

const known = new Map<string, Promise<string>>()

async function readKeyColour(file: string): Promise<string> {
  const { data } = await sharp(resolve(process.cwd(), ART_DIRECTORY, file))
    .resize(SAMPLE_WIDTH)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const pixels: Rgb[] = []
  for (let at = 0; at + CHANNELS <= data.length; at += CHANNELS) {
    pixels.push([data[at] ?? 0, data[at + 1] ?? 0, data[at + 2] ?? 0])
  }
  const key = keyColour(pixels)
  return key ? hexOf(rgbOf(key)) : KEY_FALLBACK
}

export function artKeyColour(file: string): Promise<string> {
  const read = known.get(file) ?? readKeyColour(file)
  known.set(file, read)
  return read
}
