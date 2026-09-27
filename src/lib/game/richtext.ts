export const TERM_FAMILIES = [
  'rule',
  'characteristic',
  'aptitude',
  'state',
  'skill',
  'item',
] as const

export type TermFamily = (typeof TERM_FAMILIES)[number]

export type TermRecord = {
  family: TermFamily
  skillId?: string
  itemSlug?: string
  kind: string
  title: string
  meta: string
  color: string
  icon: string | null
  text: string
  href?: string
}

export type TermIndex = {
  keys: Map<string, TermRecord>
}

export type LabelOf = (key: string) => string | undefined

export type Run =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'term'; text: string; term: TermRecord }

export type Line = Run[]

export type Paragraph = { lines: Line[] }

const MARKUP = /\*\*\*([^*]+)\*\*\*|\{\{([^}]+)\}\}/g
const REFERENCE_KEY = /^(?:[a-z0-9]+(?:-[a-z0-9]+)*|[A-Z0-9]{6}-[0-9]{3})$/
const REFERENCE = /\{\{([^}|]+)(?:\|([^}]+))?\}\}/g

export function emptyTermIndex(): TermIndex {
  return { keys: new Map() }
}

type Reference = { key: string; shown: string | undefined }

function referenceOf(content: string): Reference | undefined {
  const bar = content.indexOf('|')
  const key = (bar === -1 ? content : content.slice(0, bar)).trim()
  if (!REFERENCE_KEY.test(key)) return undefined
  return { key, shown: bar === -1 ? undefined : content.slice(bar + 1) }
}

export function referenceKey(content: string): string | undefined {
  return referenceOf(content)?.key
}

export function pinReferenceLabels(source: string, labelOf: LabelOf): string {
  return source.replace(REFERENCE, (whole, key: string, shown: string | undefined) => {
    const name = key.trim()
    if (shown !== undefined || !REFERENCE_KEY.test(name)) return whole
    const label = labelOf(name)
    return label === undefined ? whole : `{{${name}|${label}}}`
  })
}

function referenceRun(content: string, index: TermIndex): Run {
  const reference = referenceOf(content)
  const record = reference ? index.keys.get(reference.key) : undefined
  if (reference && record) {
    return {
      kind: 'term',
      text: reference.shown ?? record.title,
      term: record,
    }
  }
  return { kind: 'text', text: reference?.shown ?? content.trim() }
}

export function parseRuns(source: string, index: TermIndex): Run[] {
  const out: Run[] = []
  let cursor = 0
  MARKUP.lastIndex = 0
  let match = MARKUP.exec(source)

  while (match !== null) {
    if (match.index > cursor) out.push({ kind: 'text', text: source.slice(cursor, match.index) })
    const [, bold, reference] = match
    if (bold !== undefined) out.push({ kind: 'bold', text: bold })
    else if (reference !== undefined) out.push(referenceRun(reference, index))
    cursor = match.index + match[0].length
    match = MARKUP.exec(source)
  }

  if (cursor < source.length) out.push({ kind: 'text', text: source.slice(cursor) })
  return out
}

export function ruleRuns(source: string | undefined, index: TermIndex): Run[] {
  if (!source) return []
  return parseRuns(source.trim(), index)
}

export function parseParagraphs(source: string | undefined, index: TermIndex): Paragraph[] {
  if (!source) return []
  return source
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => ({ lines: linesOf(part, index) }))
}

function linesOf(paragraph: string, index: TermIndex): Line[] {
  return paragraph
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseRuns(line, index))
}

export function flattenText(source: string | undefined, labelOf: LabelOf, limit?: number): string {
  const value = String(source ?? '')
    .replace(REFERENCE, (_, key: string, shown: string | undefined) => {
      const name = key.trim()
      return shown ?? labelOf(name) ?? name
    })
    .replace(/\*\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (limit && value.length > limit) {
    return `${value.slice(0, limit).replace(/\s\S*$/, '')}…`
  }
  return value
}
