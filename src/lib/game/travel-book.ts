import { PACES, type Pace } from '../atlas/vocabulary.ts'

export type BookPace = {
  key: Pace
  label: string
  kmh: number
  kmPerDay: number
  effect: string
}

export type TravelBook = {
  paces: BookPace[]
  rule: string
}

const CELL_SPLIT = /(?<!\\)\|/
const METRES = /^(\d+(?:[.,]\d+)?)\s*m$/
const KILOMETRES = /^(\d+(?:[.,]\d+)?)\s*km$/
const SEPARATOR = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/

const number = (text: string) => Number.parseFloat(text.replace(',', '.'))

function cellsOf(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split(CELL_SPLIT)
    .map((cell) => cell.trim().replaceAll('\\|', '|'))
}

type Row = { label: string; kmh: number; kmPerDay: number; effect: string }

function paceRow(line: string): Row | undefined {
  const [label, perMinute, perHour, perDay, effect, ...rest] = cellsOf(line)
  if (rest.length > 0 || !label || !perMinute || !perHour || !perDay || !effect) return undefined
  const hour = KILOMETRES.exec(perHour)?.[1]
  const day = KILOMETRES.exec(perDay)?.[1]
  if (!METRES.test(perMinute) || hour === undefined || day === undefined) return undefined
  return { label, kmh: number(hour), kmPerDay: number(day), effect }
}

export function readTravelBook(markdown: string): TravelBook {
  const lines = markdown.split('\n')
  const header = lines.findIndex(
    (line, index) => line.trim().startsWith('|') && SEPARATOR.test(lines[index + 1]?.trim() ?? ''),
  )
  const rows: Row[] = []
  let cursor = header + 2
  for (; header >= 0 && cursor < lines.length; cursor++) {
    const line = lines[cursor]?.trim() ?? ''
    if (!line.startsWith('|')) break
    const row = paceRow(line)
    if (!row) throw new Error(`the pace table has a row it cannot read: ${line}`)
    rows.push(row)
  }
  if (rows.length !== PACES.length) {
    throw new Error(`the pace table must list ${PACES.length} paces, found ${rows.length}`)
  }
  const bySpeed = [...rows].sort((a, b) => a.kmh - b.kmh)
  if (new Set(bySpeed.map((row) => row.kmh)).size !== PACES.length) {
    throw new Error('two paces of the table share a speed')
  }
  const paces = PACES.map((key, index) => {
    const row = bySpeed[index]
    if (!row) throw new Error(`the pace table has no row for ${key}`)
    return { ...row, key }
  })

  const after = lines.slice(cursor)
  const start = after.findIndex((line) => line.trim() !== '')
  const paragraph: string[] = []
  for (const line of after.slice(Math.max(0, start))) {
    if (line.trim() === '') break
    paragraph.push(line.trim())
  }
  const rule = paragraph.join('\n')
  if (rule === '' || rule.startsWith('#')) throw new Error('no paragraph follows the pace table')
  return { paces, rule }
}
