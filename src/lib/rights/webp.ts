import type { AssetClaim } from './claim.ts'
import { exifBlock } from './exif.ts'
import { xmpPacket } from './xmp.ts'

const HEADER_SIZE = 12
const VP8X_SIZE = 10

const ICC_FLAG = 0x20
const ALPHA_FLAG = 0x10
const EXIF_FLAG = 0x08
const XMP_FLAG = 0x04
const ANIMATION_FLAG = 0x02

const ORDER: readonly string[] = [
  'VP8X',
  'ICCP',
  'ANIM',
  'ANMF',
  'ALPH',
  'VP8 ',
  'VP8L',
  'EXIF',
  'XMP ',
]

const METADATA_CHUNKS: readonly string[] = ['EXIF', 'XMP ']

const encoder = new TextEncoder()
const decoder = new TextDecoder('latin1')

type Chunk = { fourcc: string; body: Uint8Array }

type Canvas = { width: number; height: number; alpha: boolean }

function parse(bytes: Uint8Array): Chunk[] {
  if (
    decoder.decode(bytes.subarray(0, 4)) !== 'RIFF' ||
    decoder.decode(bytes.subarray(8, 12)) !== 'WEBP'
  ) {
    throw new Error('not a WebP file')
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const chunks: Chunk[] = []
  let at = HEADER_SIZE
  while (at + 8 <= bytes.length) {
    const fourcc = decoder.decode(bytes.subarray(at, at + 4))
    const size = view.getUint32(at + 4, true)
    chunks.push({ fourcc, body: bytes.subarray(at + 8, at + 8 + size) })
    at += 8 + size + (size % 2)
  }
  return chunks
}

function serialise(chunks: readonly Chunk[]): Uint8Array {
  const payload = chunks.reduce(
    (total, chunk) => total + 8 + chunk.body.length + (chunk.body.length % 2),
    0,
  )
  const out = new Uint8Array(HEADER_SIZE + payload)
  const view = new DataView(out.buffer)
  out.set(encoder.encode('RIFF'))
  view.setUint32(4, payload + 4, true)
  out.set(encoder.encode('WEBP'), 8)
  let at = HEADER_SIZE
  for (const chunk of chunks) {
    out.set(encoder.encode(chunk.fourcc), at)
    view.setUint32(at + 4, chunk.body.length, true)
    out.set(chunk.body, at + 8)
    at += 8 + chunk.body.length + (chunk.body.length % 2)
  }
  return out
}

function readCanvas(chunks: readonly Chunk[]): Canvas {
  const extended = chunks.find((chunk) => chunk.fourcc === 'VP8X')
  if (extended && extended.body.length >= VP8X_SIZE) {
    const body = extended.body
    const width =
      ((body[4] as number) | ((body[5] as number) << 8) | ((body[6] as number) << 16)) + 1
    const height =
      ((body[7] as number) | ((body[8] as number) << 8) | ((body[9] as number) << 16)) + 1
    return { width, height, alpha: ((body[0] as number) & ALPHA_FLAG) !== 0 }
  }

  const lossy = chunks.find((chunk) => chunk.fourcc === 'VP8 ')
  if (lossy) {
    const body = lossy.body
    if (body[3] !== 0x9d || body[4] !== 0x01 || body[5] !== 0x2a) {
      throw new Error('WebP VP8 chunk has no start code')
    }
    const view = new DataView(body.buffer, body.byteOffset, body.byteLength)
    return {
      width: view.getUint16(6, true) & 0x3fff,
      height: view.getUint16(8, true) & 0x3fff,
      alpha: chunks.some((chunk) => chunk.fourcc === 'ALPH'),
    }
  }

  const lossless = chunks.find((chunk) => chunk.fourcc === 'VP8L')
  if (lossless) {
    const body = lossless.body
    if (body[0] !== 0x2f) throw new Error('WebP VP8L chunk has no signature')
    const view = new DataView(body.buffer, body.byteOffset, body.byteLength)
    const bits = view.getUint32(1, true)
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >>> 14) & 0x3fff) + 1,
      alpha: ((bits >>> 28) & 1) === 1,
    }
  }

  throw new Error('WebP has no image chunk')
}

function vp8x(canvas: Canvas, chunks: readonly Chunk[], flags: number): Chunk {
  const body = new Uint8Array(VP8X_SIZE)
  let all = flags
  if (canvas.alpha) all |= ALPHA_FLAG
  if (chunks.some((chunk) => chunk.fourcc === 'ICCP')) all |= ICC_FLAG
  if (chunks.some((chunk) => chunk.fourcc === 'ANIM' || chunk.fourcc === 'ANMF'))
    all |= ANIMATION_FLAG
  body[0] = all
  const width = canvas.width - 1
  const height = canvas.height - 1
  body[4] = width & 0xff
  body[5] = (width >>> 8) & 0xff
  body[6] = (width >>> 16) & 0xff
  body[7] = height & 0xff
  body[8] = (height >>> 8) & 0xff
  body[9] = (height >>> 16) & 0xff
  return { fourcc: 'VP8X', body }
}

function ordered(chunks: readonly Chunk[]): Chunk[] {
  return [...chunks].sort((a, b) => ORDER.indexOf(a.fourcc) - ORDER.indexOf(b.fourcc))
}

export function stripWebp(bytes: Uint8Array): Uint8Array {
  return serialise(parse(bytes).filter((chunk) => !METADATA_CHUNKS.includes(chunk.fourcc)))
}

export function stampWebp(bytes: Uint8Array, claim: AssetClaim): Uint8Array {
  const chunks = parse(bytes)
  const canvas = readCanvas(chunks)
  const kept = chunks.filter(
    (chunk) => !METADATA_CHUNKS.includes(chunk.fourcc) && chunk.fourcc !== 'VP8X',
  )
  return serialise(
    ordered([
      vp8x(canvas, kept, EXIF_FLAG | XMP_FLAG),
      ...kept,
      { fourcc: 'EXIF', body: exifBlock(claim) },
      { fourcc: 'XMP ', body: encoder.encode(xmpPacket(claim)) },
    ]),
  )
}
