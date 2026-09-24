import { crc32 } from 'node:zlib'

import type { AssetClaim } from './claim.ts'
import { xmpPacket } from './xmp.ts'

const SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const METADATA_CHUNKS: readonly string[] = ['caBX', 'tEXt', 'iTXt', 'zTXt', 'eXIf']

const XMP_KEYWORD = 'XML:com.adobe.xmp'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

type Chunk = { type: string; body: Uint8Array }

function isPng(bytes: Uint8Array): boolean {
  return SIGNATURE.every((byte, at) => bytes[at] === byte)
}

function parse(bytes: Uint8Array): Chunk[] {
  if (!isPng(bytes)) throw new Error('not a PNG file')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const chunks: Chunk[] = []
  let at = SIGNATURE.length
  while (at + 8 <= bytes.length) {
    const length = view.getUint32(at)
    const type = decoder.decode(bytes.subarray(at + 4, at + 8))
    chunks.push({ type, body: bytes.subarray(at + 8, at + 8 + length) })
    at += 12 + length
    if (type === 'IEND') break
  }
  if (chunks[0]?.type !== 'IHDR') throw new Error('PNG does not start with IHDR')
  return chunks
}

function serialise(chunks: readonly Chunk[]): Uint8Array {
  const size = chunks.reduce((total, chunk) => total + 12 + chunk.body.length, SIGNATURE.length)
  const out = new Uint8Array(size)
  const view = new DataView(out.buffer)
  out.set(SIGNATURE)
  let at = SIGNATURE.length
  for (const chunk of chunks) {
    const type = encoder.encode(chunk.type)
    view.setUint32(at, chunk.body.length)
    out.set(type, at + 4)
    out.set(chunk.body, at + 8)
    const covered = out.subarray(at + 4, at + 8 + chunk.body.length)
    view.setUint32(at + 8 + chunk.body.length, crc32(covered) >>> 0)
    at += 12 + chunk.body.length
  }
  return out
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}

function isAscii(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0)
    if (code === undefined || code > 0x7e || code < 0x20) return false
  }
  return true
}

function textChunk(keyword: string, value: string): Chunk {
  if (isAscii(value)) {
    return {
      type: 'tEXt',
      body: concat([encoder.encode(keyword), new Uint8Array([0]), encoder.encode(value)]),
    }
  }
  return {
    type: 'iTXt',
    body: concat([encoder.encode(keyword), new Uint8Array([0, 0, 0, 0, 0]), encoder.encode(value)]),
  }
}

export function stripPng(bytes: Uint8Array): Uint8Array {
  return serialise(parse(bytes).filter((chunk) => !METADATA_CHUNKS.includes(chunk.type)))
}

export function stampPng(bytes: Uint8Array, claim: AssetClaim): Uint8Array {
  const chunks = parse(bytes).filter((chunk) => !METADATA_CHUNKS.includes(chunk.type))
  const header = chunks[0]
  if (header === undefined) throw new Error('PNG has no IHDR')

  const stamp: Chunk[] = [textChunk(XMP_KEYWORD, xmpPacket(claim))]
  if (claim.title !== undefined) stamp.push(textChunk('Title', claim.title))
  stamp.push(textChunk('Author', claim.creator))
  if (claim.description !== undefined) stamp.push(textChunk('Description', claim.description))
  stamp.push(
    textChunk('Copyright', claim.rights),
    textChunk('Software', claim.creatorTool),
    textChunk('Source', claim.source),
  )

  return serialise([header, ...stamp, ...chunks.slice(1)])
}

export function readPngText(bytes: Uint8Array): Map<string, string> {
  const out = new Map<string, string>()
  for (const chunk of parse(bytes)) {
    if (chunk.type === 'tEXt') {
      const split = chunk.body.indexOf(0)
      if (split < 0) continue
      out.set(
        decoder.decode(chunk.body.subarray(0, split)),
        decoder.decode(chunk.body.subarray(split + 1)),
      )
    }
    if (chunk.type === 'iTXt') {
      const split = chunk.body.indexOf(0)
      if (split < 0) continue
      const keyword = decoder.decode(chunk.body.subarray(0, split))
      if (chunk.body[split + 1] !== 0) continue
      let at = split + 3
      for (let skipped = 0; skipped < 2; skipped += 1) {
        const next = chunk.body.indexOf(0, at)
        if (next < 0) break
        at = next + 1
      }
      out.set(keyword, decoder.decode(chunk.body.subarray(at)))
    }
  }
  return out
}
