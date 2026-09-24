import type { AssetClaim } from './claim.ts'
import { xmpElement } from './xmp.ts'

const METADATA = /\s*<metadata\b[^>]*>[\s\S]*?<\/metadata>/g
const C2PA_NAMESPACE = /\s+xmlns:c2pa="[^"]*"/g

function openingTagEnd(source: string): number {
  const start = source.indexOf('<svg')
  if (start < 0) throw new Error('not an SVG file')
  let quote: string | undefined
  for (let at = start; at < source.length; at += 1) {
    const character = source[at]
    if (quote) {
      if (character === quote) quote = undefined
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '>') return at + 1
  }
  throw new Error('SVG opening tag is not closed')
}

export function stripSvg(source: string): string {
  return source.replace(METADATA, '').replace(C2PA_NAMESPACE, '')
}

export function stampSvg(source: string, claim: AssetClaim): string {
  const bare = stripSvg(source)
  const at = openingTagEnd(bare)
  const block = `<metadata>${xmpElement(claim)}</metadata>`
  return `${bare.slice(0, at)}\n${block}\n${bare.slice(at).replace(/^\n/, '')}`
}
