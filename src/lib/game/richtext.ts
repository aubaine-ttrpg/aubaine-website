export const TERM_FAMILIES = ['rule', 'characteristic', 'aptitude', 'state', 'skill'] as const

export type TermFamily = (typeof TERM_FAMILIES)[number]

export type TermRecord = {
  spelling: string
  family: TermFamily
  skillId?: string
  kind: string
  title: string
  meta: string
  color: string
  icon: string | null
  text: string
  href?: string
}

export type TermIndex = {
  map: Map<string, TermRecord>
  keys: Map<string, TermRecord>
  pattern: RegExp | null
}

export type LabelOf = (key: string) => string | undefined

export type Run =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'term'; text: string; term: TermRecord }
  | { kind: 'ref'; text: string; href: string }

export type Paragraph = { runs: Run[] }

const MARKUP = /\*\*\*([^*]+)\*\*\*|\[\[([^\]]+)\]\]|\{\{([^}]+)\}\}/g
const WORD = /[\p{L}\p{N}]/u
const REFERENCE_KEY = /^(?:[a-z0-9]+(?:-[a-z0-9]+)*|[A-Z0-9]{6}-[0-9]{3})$/
const REFERENCE = /\{\{([^}|]+)(?:\|([^}]+))?\}\}/g

export function escapeForRegExp(value: string): string {
  return value.replace(/[\\^$*+?.()|[\]{}/]/g, '\\$&')
}

export function buildTermPattern(names: string[]): RegExp | null {
  if (names.length === 0) return null
  const sorted = [...names].sort((a, b) => b.length - a.length).map(escapeForRegExp)
  const source = `(?:${sorted.join('|')})`
  try {
    return new RegExp(source, 'giu')
  } catch {
    try {
      return new RegExp(source, 'gi')
    } catch {
      return null
    }
  }
}

export function emptyTermIndex(): TermIndex {
  return { map: new Map(), keys: new Map(), pattern: null }
}

type Reference = { key: string; shown: string | undefined }

export function referenceKey(content: string): string | undefined {
  return referenceOf(content)?.key
}

function referenceOf(content: string): Reference | undefined {
  const bar = content.indexOf('|')
  const key = (bar === -1 ? content : content.slice(0, bar)).trim()
  if (!REFERENCE_KEY.test(key)) return undefined
  return { key, shown: bar === -1 ? undefined : content.slice(bar + 1) }
}

function termRun(index: TermIndex, name: string): Run | null {
  const record = index.map.get(name.toLowerCase())
  if (!record) return null
  return { kind: 'term', text: name, term: record }
}

function pushPlain(out: Run[], text: string, index: TermIndex): void {
  if (!index.pattern) {
    if (text) out.push({ kind: 'text', text })
    return
  }
  let at = 0
  index.pattern.lastIndex = 0
  let match = index.pattern.exec(text)
  while (match !== null) {
    const matched = match[0]
    const left = match.index === 0 ? ' ' : (text[match.index - 1] as string)
    const right = text[match.index + matched.length] ?? ' '
    const record = index.map.get(matched.toLowerCase())
    const usable =
      !WORD.test(left) && !WORD.test(right) && record !== undefined && record.spelling === matched
    if (usable) {
      if (match.index > at) out.push({ kind: 'text', text: text.slice(at, match.index) })
      out.push({ kind: 'term', text: matched, term: record as TermRecord })
      at = match.index + matched.length
    }
    match = index.pattern.exec(text)
  }
  if (at < text.length) out.push({ kind: 'text', text: text.slice(at) })
}

export type ResolveReference = (name: string) => string | null

function referenceRun(content: string, index: TermIndex, resolveReference: ResolveReference): Run {
  const reference = referenceOf(content)
  const record = reference ? index.keys.get(reference.key) : undefined
  if (reference && record)
    return { kind: 'term', text: reference.shown ?? record.title, term: record }
  const name = content.trim()
  const resolved = termRun(index, name)
  if (resolved) return resolved
  const href = resolveReference(name)
  return href ? { kind: 'ref', text: name, href } : { kind: 'text', text: name }
}

export function parseRuns(
  source: string,
  index: TermIndex,
  options: { rulesHref: string; resolveReference: ResolveReference },
): Run[] {
  const out: Run[] = []
  let cursor = 0
  MARKUP.lastIndex = 0
  let match = MARKUP.exec(source)

  while (match !== null) {
    if (match.index > cursor) {
      pushPlain(out, source.slice(cursor, match.index), index)
    }
    const [, bold, state, skill] = match
    if (bold !== undefined) {
      out.push({ kind: 'bold', text: bold })
    } else if (state !== undefined) {
      out.push(termRun(index, state) ?? { kind: 'ref', text: state, href: options.rulesHref })
    } else if (skill !== undefined) {
      out.push(referenceRun(skill, index, options.resolveReference))
    }
    cursor = match.index + match[0].length
    match = MARKUP.exec(source)
  }

  if (cursor < source.length) {
    pushPlain(out, source.slice(cursor), index)
  }
  return out
}

export function ruleRuns(
  source: string | undefined,
  index: TermIndex,
  options: { rulesHref: string; resolveReference: ResolveReference },
): Run[] {
  if (!source) return []
  return parseRuns(source.trim(), index, options)
}

export function parseParagraphs(
  source: string | undefined,
  index: TermIndex,
  options: { rulesHref: string; resolveReference: ResolveReference },
): Paragraph[] {
  if (!source) return []
  return source
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ({ runs: parseRuns(part.replace(/\n/g, ' '), index, options) }))
}

export function flattenText(source: string | undefined, labelOf: LabelOf, limit?: number): string {
  const value = String(source ?? '')
    .replace(REFERENCE, (_, key: string, shown: string | undefined) => {
      const name = key.trim()
      return shown ?? labelOf(name) ?? name
    })
    .replace(/\*\*\*/g, '')
    .replace(/\[\[|\]\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (limit && value.length > limit) {
    return `${value.slice(0, limit).replace(/\s\S*$/, '')}…`
  }
  return value
}
