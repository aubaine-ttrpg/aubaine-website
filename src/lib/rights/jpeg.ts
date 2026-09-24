import type { AssetClaim } from './claim.ts'
import { exifBlock } from './exif.ts'
import { xmpPacket } from './xmp.ts'

const SOI = 0xd8
const EOI = 0xd9
const SOS = 0xda
const TEM = 0x01
const APP1 = 0xe1
const APP11 = 0xeb
const APP13 = 0xed

const EXIF_TAG = 'Exif\0\0'
const XMP_TAG = 'http://ns.adobe.com/xap/1.0/\0'
const XMP_EXTENSION_TAG = 'http://ns.adobe.com/xmp/extension/\0'
const JUMBF_TAG = 'JP\0\0'
const PHOTOSHOP_TAG = 'Photoshop 3.0\0'

const MAX_PAYLOAD = 65533

const encoder = new TextEncoder()
const decoder = new TextDecoder('latin1')

type Segment = { marker: number; body: Uint8Array }

type Parsed = { segments: Segment[]; trailer: Uint8Array }

function starts(body: Uint8Array, tag: string): boolean {
  return decoder.decode(body.subarray(0, tag.length)) === tag
}

function isMetadata(segment: Segment): boolean {
  if (segment.marker === APP1) {
    return (
      starts(segment.body, EXIF_TAG) ||
      starts(segment.body, XMP_TAG) ||
      starts(segment.body, XMP_EXTENSION_TAG)
    )
  }
  if (segment.marker === APP11) return starts(segment.body, JUMBF_TAG)
  if (segment.marker === APP13) return starts(segment.body, PHOTOSHOP_TAG)
  return false
}

function parse(bytes: Uint8Array): Parsed {
  if (bytes[0] !== 0xff || bytes[1] !== SOI) throw new Error('not a JPEG file')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const segments: Segment[] = []
  let at = 2
  while (at + 4 <= bytes.length) {
    if (bytes[at] !== 0xff) throw new Error(`JPEG segment does not start with 0xff at ${at}`)
    const marker = bytes[at + 1] as number
    if (marker === SOS || marker === EOI) break
    if (marker === TEM || (marker >= 0xd0 && marker <= 0xd7)) {
      at += 2
      continue
    }
    const length = view.getUint16(at + 2)
    segments.push({ marker, body: bytes.subarray(at + 4, at + 2 + length) })
    at += 2 + length
  }
  return { segments, trailer: bytes.subarray(at) }
}

function serialise(parsed: Parsed): Uint8Array {
  const size = parsed.segments.reduce((total, segment) => total + 4 + segment.body.length, 2)
  const out = new Uint8Array(size + parsed.trailer.length)
  const view = new DataView(out.buffer)
  out[0] = 0xff
  out[1] = SOI
  let at = 2
  for (const segment of parsed.segments) {
    out[at] = 0xff
    out[at + 1] = segment.marker
    view.setUint16(at + 2, segment.body.length + 2)
    out.set(segment.body, at + 4)
    at += 4 + segment.body.length
  }
  out.set(parsed.trailer, at)
  return out
}

function segment(marker: number, tag: string, payload: Uint8Array): Segment {
  const prefix = encoder.encode(tag)
  const body = new Uint8Array(prefix.length + payload.length)
  body.set(prefix)
  body.set(payload, prefix.length)
  if (body.length > MAX_PAYLOAD)
    throw new Error(`JPEG ${tag.trim()} segment exceeds ${MAX_PAYLOAD} bytes`)
  return { marker, body }
}

export function stripJpeg(bytes: Uint8Array): Uint8Array {
  const parsed = parse(bytes)
  return serialise({ ...parsed, segments: parsed.segments.filter((one) => !isMetadata(one)) })
}

export function stampJpeg(bytes: Uint8Array, claim: AssetClaim): Uint8Array {
  const parsed = parse(bytes)
  const kept = parsed.segments.filter((one) => !isMetadata(one))
  const leading = kept.findIndex((one) => one.marker !== 0xe0)
  const at = leading < 0 ? kept.length : leading
  const stamp = [
    segment(APP1, EXIF_TAG, exifBlock(claim)),
    segment(APP1, XMP_TAG, encoder.encode(xmpPacket(claim))),
  ]
  return serialise({ ...parsed, segments: [...kept.slice(0, at), ...stamp, ...kept.slice(at)] })
}
