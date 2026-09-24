import type { AssetClaim } from './claim.ts'

const IMAGE_DESCRIPTION = 0x010e
const SOFTWARE = 0x0131
const ARTIST = 0x013b
const COPYRIGHT = 0x8298

const ASCII = 2
const HEADER_SIZE = 8
const ENTRY_SIZE = 12

const encoder = new TextEncoder()

type Field = { tag: number; bytes: Uint8Array }

function field(tag: number, value: string): Field {
  const text = encoder.encode(value)
  const bytes = new Uint8Array(text.length + 1)
  bytes.set(text)
  return { tag, bytes }
}

export function exifBlock(claim: AssetClaim): Uint8Array {
  const fields: Field[] = [
    field(SOFTWARE, claim.creatorTool),
    field(ARTIST, claim.creator),
    field(COPYRIGHT, claim.rights),
  ]
  if (claim.description !== undefined) fields.push(field(IMAGE_DESCRIPTION, claim.description))
  fields.sort((a, b) => a.tag - b.tag)

  const directorySize = 2 + fields.length * ENTRY_SIZE + 4
  const dataSize = fields.reduce(
    (total, entry) => total + (entry.bytes.length > 4 ? entry.bytes.length : 0),
    0,
  )

  const out = new Uint8Array(HEADER_SIZE + directorySize + dataSize)
  const view = new DataView(out.buffer)

  out[0] = 0x4d
  out[1] = 0x4d
  view.setUint16(2, 42)
  view.setUint32(4, HEADER_SIZE)
  view.setUint16(HEADER_SIZE, fields.length)

  let entryAt = HEADER_SIZE + 2
  let dataAt = HEADER_SIZE + directorySize
  for (const entry of fields) {
    view.setUint16(entryAt, entry.tag)
    view.setUint16(entryAt + 2, ASCII)
    view.setUint32(entryAt + 4, entry.bytes.length)
    if (entry.bytes.length <= 4) {
      out.set(entry.bytes, entryAt + 8)
    } else {
      view.setUint32(entryAt + 8, dataAt)
      out.set(entry.bytes, dataAt)
      dataAt += entry.bytes.length
    }
    entryAt += ENTRY_SIZE
  }
  view.setUint32(HEADER_SIZE + 2 + fields.length * ENTRY_SIZE, 0)

  return out
}
