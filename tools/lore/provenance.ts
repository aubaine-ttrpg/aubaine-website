import { type PagePart, proseOf, type SentenceAt, sentencesOf } from './survey.ts'

export type OwnerSource = { label: string; text: string }

export type PageOrigin = 'owner' | 'changed' | 'writer'

export type PageSentence = SentenceAt & { origin: PageOrigin; closest?: SentenceAt | undefined }

export type Provenance = { page: PageSentence[]; missing: SentenceAt[] }

const RUN = 5
const LIFTED_FROM = 3
const CHANGED_FROM = 0.5

function wordsOf(text: string): string[] {
  return (
    text
      .normalize('NFD')
      .replace(/\p{Mn}/gu, '')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  )
}

function runsOf(words: string[]): string[] {
  if (words.length <= RUN) return words.length === 0 ? [] : [words.join(' ')]
  return words.slice(0, words.length - RUN + 1).map((_, at) => words.slice(at, at + RUN).join(' '))
}

type PlacedSentence = { at: SentenceAt; start: number; words: string[] }

type PlacedSource = { words: string[]; sentences: PlacedSentence[] }

type Pool = { sources: PlacedSource[]; runs: Set<string>; sentences: Set<string> }

function placedSource(source: OwnerSource): PlacedSource {
  const placed: PlacedSource = { words: [], sentences: [] }
  for (const at of sourceSentences(source)) {
    const words = wordsOf(at.sentence)
    placed.sentences.push({ at, start: placed.words.length, words })
    placed.words.push(...words)
  }
  return placed
}

function poolOf(sources: OwnerSource[]): Pool {
  const placed = sources.map(placedSource)
  return {
    sources: placed,
    runs: new Set(placed.flatMap((source) => runsOf(source.words))),
    sentences: new Set(
      placed.flatMap((source) => source.sentences.map((sentence) => sentence.words.join(' '))),
    ),
  }
}

function startsOf(piece: string[], words: string[]): number[] {
  return words.flatMap((_, start) =>
    piece.every((word, offset) => words[start + offset] === word) ? [start] : [],
  )
}

function standsIn(words: string[], pool: Pool): boolean {
  return pool.sources.some((source) => startsOf(words, source.words).length > 0)
}

function runShare(words: string[], runs: Set<string>): number {
  const own = runsOf(words)
  return own.filter((run) => runs.has(run)).length / own.length
}

function standsAsLine(words: string[], pool: Pool): boolean {
  if (words.length < LIFTED_FROM) return pool.sentences.has(words.join(' '))
  return standsIn(words, pool)
}

type Beside = { before: string[]; after: string[] }

function standsJoined(words: string[], { before, after }: Beside, pool: Pool): boolean {
  const room = RUN - words.length
  return (
    (before.length > 0 && standsAsLine([...before.slice(-room), ...words], pool)) ||
    (after.length > 0 && standsAsLine([...words, ...after.slice(0, room)], pool))
  )
}

function foundIn(words: string[], beside: Beside, pool: Pool): number {
  if (words.length === 0) return 1
  if (words.length < LIFTED_FROM) {
    return standsAsLine(words, pool) || standsJoined(words, beside, pool) ? 1 : 0
  }
  if (words.length <= RUN) return standsAsLine(words, pool) ? 1 : 0
  return runShare(words, pool.runs)
}

function piecesOf(words: string[], pool: Pool): string[][] {
  if (words.length <= RUN || standsIn(words, pool)) return [words]
  return runsOf(words).map((run) => run.split(' '))
}

function carriedIn(source: PlacedSource, pieces: string[][]): Set<number> {
  const carried = new Set<number>()
  for (const piece of pieces) {
    const free = startsOf(piece, source.words).filter((at) =>
      piece.some((_, offset) => !carried.has(at + offset)),
    )
    const start =
      free.find((at) =>
        source.sentences.some(
          (sentence) => sentence.start === at && sentence.words.length === piece.length,
        ),
      ) ?? free[0]
    if (start === undefined) continue
    for (const offset of piece.keys()) carried.add(start + offset)
  }
  return carried
}

function keptIn(sentence: PlacedSentence, carried: Set<number>, pageRuns: Set<string>): boolean {
  if (sentence.words.length > RUN) return runShare(sentence.words, pageRuns) >= CHANGED_FROM
  return sentence.words.every((_, offset) => carried.has(sentence.start + offset))
}

function overlap(first: string, second: string): number {
  const own = new Set(runsOf(wordsOf(first)))
  const other = runsOf(wordsOf(second))
  if (own.size === 0 || other.length === 0) return 0
  return other.filter((run) => own.has(run)).length / Math.max(own.size, other.length)
}

function unwrapped(text: string): string {
  return text
    .split(/\n[ \t]*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter((paragraph) => paragraph !== '')
    .join('\n')
}

const HEADING = /^#{1,6}\s/

function readableSource(source: OwnerSource): string {
  const withoutHeadings = source.text
    .split('\n')
    .map((line) => (HEADING.test(line) ? '' : line))
    .join('\n')
  return unwrapped(proseOf(withoutHeadings))
}

export function sourceSentences(source: OwnerSource): SentenceAt[] {
  return sentencesOf(readableSource(source)).map((sentence) => ({ part: source.label, sentence }))
}

export function provenance(parts: PagePart[], sources: OwnerSource[]): Provenance {
  const pool = poolOf(sources)
  const owned = pool.sources.flatMap((source) => source.sentences.map((sentence) => sentence.at))
  const page = parts.flatMap((part) => {
    const sentences = sentencesOf(part.text)
    const words = sentences.map(wordsOf)
    return sentences.map((sentence, index): PageSentence => {
      const beside = { before: words[index - 1] ?? [], after: words[index + 1] ?? [] }
      const found = foundIn(wordsOf(sentence), beside, pool)
      if (found === 1) return { part: part.label, sentence, origin: 'owner' }
      if (found < CHANGED_FROM) return { part: part.label, sentence, origin: 'writer' }
      const closest = owned.reduce<{ at?: SentenceAt; score: number }>(
        (best, candidate) => {
          const score = overlap(sentence, candidate.sentence)
          return score > best.score ? { at: candidate, score } : best
        },
        { score: 0 },
      ).at
      return { part: part.label, sentence, origin: 'changed', closest }
    })
  })
  const pageRuns = new Set(parts.flatMap((part) => runsOf(wordsOf(proseOf(part.text)))))
  const pieces = page
    .filter((entry) => entry.origin === 'owner')
    .flatMap((entry) => piecesOf(wordsOf(entry.sentence), pool))
  const missing = pool.sources.flatMap((source) => {
    const carried = carriedIn(source, pieces)
    return source.sentences
      .filter((sentence) => !keptIn(sentence, carried, pageRuns))
      .map((sentence) => sentence.at)
  })
  return { page, missing }
}

function cell(text: string): string {
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

export function renderProvenance(title: string, sources: string[], found: Provenance): string {
  const writer = found.page.filter((entry) => entry.origin === 'writer')
  const changed = found.page.filter((entry) => entry.origin === 'changed')
  const owner = found.page.filter((entry) => entry.origin === 'owner')
  return [
    `# Owner text: ${title}`,
    '',
    `Sources: ${sources.join(', ')}. A sentence of the page is the owner's when its words stand in a source in the same order, and a line under ${LIFTED_FROM} words only when a source sentence has exactly its words, or when its words joined to those of the sentence beside it pass the same test, as when the page splits an owner sentence. It is changed when at least ${CHANGED_FROM * 100} % of its ${RUN}-word runs stand in a source, and writer text otherwise. A source sentence of up to ${RUN} words is on the page only when the owner's sentences stand on all its words, each of them counted in one place only, a source sentence of exactly its words first, and a longer one when at least ${CHANGED_FROM * 100} % of its runs stand on the page. Sources are read as the page prints them, their headings aside. Typography never counts.`,
    '',
    `${owner.length} sentences are the owner's, ${changed.length} are changed and ${writer.length} are writer text. ${found.missing.length} source sentences are not on the page.`,
    '',
    `## Writer text: sentences in no source (${writer.length})`,
    '',
    '| Part | Sentence |',
    '| --- | --- |',
    ...writer.map((entry) => `| ${cell(entry.part)} | ${cell(entry.sentence)} |`),
    '',
    `## Changed: sentences that differ from their source (${changed.length})`,
    '',
    '| Part | On the page | Closest in the sources |',
    '| --- | --- | --- |',
    ...changed.map(
      (entry) =>
        `| ${cell(entry.part)} | ${cell(entry.sentence)} | ${cell(entry.closest?.sentence ?? '')} |`,
    ),
    '',
    `## Missing: source sentences the page does not carry (${found.missing.length})`,
    '',
    '| Source | Sentence |',
    '| --- | --- |',
    ...found.missing.map((entry) => `| ${cell(entry.part)} | ${cell(entry.sentence)} |`),
    '',
  ].join('\n')
}
