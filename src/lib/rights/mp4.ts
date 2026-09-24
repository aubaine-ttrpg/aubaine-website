import { type AssetClaim, YEAR } from './claim.ts'

const decoder = new TextDecoder('utf8', { fatal: false })

export function mp4MetadataArguments(claim: AssetClaim): string[] {
  const tags: [string, string][] = [
    ['artist', claim.creator],
    ['copyright', claim.rights],
    ['comment', claim.source],
    ['date', YEAR],
  ]
  if (claim.title !== undefined) tags.unshift(['title', claim.title])
  if (claim.description !== undefined) tags.push(['description', claim.description])

  return [
    '-map',
    '0',
    '-c',
    'copy',
    '-movflags',
    '+faststart',
    '-map_metadata',
    '-1',
    ...tags.flatMap(([key, value]) => ['-metadata', `${key}=${value}`]),
  ]
}

function movieBox(bytes: Uint8Array): Uint8Array | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let at = 0
  while (at + 8 <= bytes.length) {
    const size = view.getUint32(at)
    if (size < 8) return undefined
    if (decoder.decode(bytes.subarray(at + 4, at + 8)) === 'moov') {
      return bytes.subarray(at, Math.min(at + size, bytes.length))
    }
    at += size
  }
  return undefined
}

export function mp4IsStamped(bytes: Uint8Array, claim: AssetClaim): boolean {
  const moov = movieBox(bytes)
  if (moov === undefined) return false
  const text = decoder.decode(moov)
  const wanted = [claim.creator, claim.rights, claim.source]
  if (claim.title !== undefined) wanted.push(claim.title)
  if (claim.description !== undefined) wanted.push(claim.description)
  return wanted.every((value) => text.includes(value))
}
