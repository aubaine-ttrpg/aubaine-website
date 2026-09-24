import type { AssetClaim } from './claim.ts'
import { xmpPacket } from './xmp.ts'

const encoder = new TextEncoder()
const decoder = new TextDecoder('latin1')

function latin1Bytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length)
  for (let at = 0; at < text.length; at += 1) out[at] = text.charCodeAt(at) & 0xff
  return out
}

function hexText(value: string): string {
  let out = 'FEFF'
  for (const character of value) {
    const code = character.codePointAt(0) as number
    if (code > 0xffff) {
      const offset = code - 0x10000
      out += (0xd800 + (offset >> 10)).toString(16).padStart(4, '0')
      out += (0xdc00 + (offset & 0x3ff)).toString(16).padStart(4, '0')
      continue
    }
    out += code.toString(16).padStart(4, '0')
  }
  return `<${out.toUpperCase()}>`
}

function dictionaryAt(source: string, start: number): string {
  let depth = 1
  let at = start + 2
  while (at < source.length && depth > 0) {
    if (source[at] === '(') {
      at += 1
      while (at < source.length && source[at] !== ')') at += source[at] === '\\' ? 2 : 1
      at += 1
      continue
    }
    if (source.startsWith('<<', at)) {
      depth += 1
      at += 2
      continue
    }
    if (source.startsWith('>>', at)) {
      depth -= 1
      at += 2
      continue
    }
    if (source[at] === '<') {
      while (at < source.length && source[at] !== '>') at += 1
      at += 1
      continue
    }
    at += 1
  }
  if (depth !== 0) throw new Error('PDF dictionary is not closed')
  return source.slice(start, at)
}

function objectBody(source: string, number: number): string {
  const heads = [...source.matchAll(new RegExp(`(?:^|[\\r\\n\\s])${number} 0 obj`, 'g'))]
  const head = heads.at(-1)
  if (head === undefined) throw new Error(`PDF object ${number} not found`)
  const open = source.indexOf('<<', head.index)
  if (open < 0) throw new Error(`PDF object ${number} is not a dictionary`)
  return dictionaryAt(source, open)
}

function trailerDictionary(source: string): string {
  const trailerAt = source.lastIndexOf('trailer')
  const at = trailerAt < 0 ? -1 : source.indexOf('<<', trailerAt)
  if (at < 0) throw new Error('PDF has no cross reference table this writer can extend')
  return dictionaryAt(source, at)
}

function carriesMetadata(source: string): boolean {
  const rootNumber = Number(/\/Root\s+(\d+)\s+0\s*R/.exec(trailerDictionary(source))?.[1])
  if (!Number.isInteger(rootNumber)) return false
  return /\/Metadata\s+\d+\s+0\s*R/.test(objectBody(source, rootNumber))
}

export function pdfIsStamped(bytes: Uint8Array): boolean {
  return carriesMetadata(decoder.decode(bytes))
}

export function stampPdf(bytes: Uint8Array, claim: AssetClaim): Uint8Array {
  const source = decoder.decode(bytes)
  if (carriesMetadata(source)) throw new Error('PDF already carries a document metadata stream')

  const previous = /startxref\s+(\d+)\s*%%EOF\s*$/.exec(source)
  if (!previous) throw new Error('PDF has no startxref')

  const trailer = trailerDictionary(source)

  const size = Number(/\/Size\s+(\d+)/.exec(trailer)?.[1])
  const rootNumber = Number(/\/Root\s+(\d+)\s+0\s*R/.exec(trailer)?.[1])
  const infoNumber = Number(/\/Info\s+(\d+)\s+0\s*R/.exec(trailer)?.[1])
  if (!Number.isInteger(size) || !Number.isInteger(rootNumber) || !Number.isInteger(infoNumber)) {
    throw new Error('PDF trailer does not name Size, Root and Info')
  }

  const info = objectBody(source, infoNumber)
  const root = objectBody(source, rootNumber)
  const created = /\/CreationDate\s*(\([^)]*\))/.exec(info)?.[1]
  const modified = /\/ModDate\s*(\([^)]*\))/.exec(info)?.[1]
  const producer = /\/Producer\s*(\([^)]*\)|<[0-9A-Fa-f]*>)/.exec(info)?.[1]

  const metadataNumber = size
  const packet = encoder.encode(xmpPacket(claim))

  const fields = [
    claim.title === undefined ? undefined : `/Title ${hexText(claim.title)}`,
    `/Author ${hexText(claim.creator)}`,
    claim.description === undefined ? undefined : `/Subject ${hexText(claim.description)}`,
    `/Keywords ${hexText(claim.keywords.join(', '))}`,
    `/Creator ${hexText(claim.creatorTool)}`,
    producer === undefined ? undefined : `/Producer ${producer}`,
    created === undefined ? undefined : `/CreationDate ${created}`,
    modified === undefined ? undefined : `/ModDate ${modified}`,
  ].filter((field) => field !== undefined)

  const nextRoot = `${root.slice(0, root.length - 2)}/Metadata ${metadataNumber} 0 R>>`

  const objects: [number, string][] = [
    [infoNumber, `${infoNumber} 0 obj\n<<${fields.join('')}>>\nendobj\n`],
    [rootNumber, `${rootNumber} 0 obj\n${nextRoot}\nendobj\n`],
    [
      metadataNumber,
      `${metadataNumber} 0 obj\n<</Type/Metadata/Subtype/XML/Length ${packet.length}>>\nstream\n${decoder.decode(packet)}\nendstream\nendobj\n`,
    ],
  ]

  const separator = source.endsWith('\n') ? '' : '\n'
  const parts: string[] = [separator]
  const offsets = new Map<number, number>()
  let at = bytes.length + separator.length
  for (const [number, body] of objects) {
    offsets.set(number, at)
    parts.push(body)
    at += body.length
  }

  const table = [...offsets.keys()].sort((a, b) => a - b)
  const entries = table
    .map((number) => `${number} 1\n${String(offsets.get(number)).padStart(10, '0')} 00000 n \n`)
    .join('')
  parts.push(
    `xref\n${entries}trailer\n<</Size ${metadataNumber + 1}/Root ${rootNumber} 0 R/Info ${infoNumber} 0 R/Prev ${previous[1]}>>\nstartxref\n${at}\n%%EOF\n`,
  )

  const appended = latin1Bytes(parts.join(''))
  const out = new Uint8Array(bytes.length + appended.length)
  out.set(bytes)
  out.set(appended, bytes.length)
  return out
}
