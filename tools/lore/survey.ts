import { withoutIcons } from '../../src/lib/game/book-markup.ts'
import { splitLore } from '../../src/lib/game/lore-parts.ts'

export type LoreKind = 'species' | 'tree'

export type LoreTarget = { kind: LoreKind; id: string; names: string[] }

export type PagePart = { label: string; text: string }

export type PartSummary = { label: string; words: number; first: string; last: string }

export type TermSpread = { term: string; counts: number[]; total: number; parts: number }

export type SentenceAt = { part: string; sentence: string }

export type SimilarPair = { first: SentenceAt; second: SentenceAt; similarity: number }

export type PageSurvey = {
  parts: PartSummary[]
  terms: TermSpread[]
  pairs: SimilarPair[]
}

export type SurveyOptions = { minParts: number; minSimilarity: number }

export const DEFAULT_SURVEY: SurveyOptions = { minParts: 3, minSimilarity: 0.3 }

const SECTION_HEADING = /^## /m
const WORD = /\p{L}+(?:['-]\p{L}+)*/gu
const ELISION = /^(?:l|d|j|m|n|s|t|c|qu|jusqu|lorsqu|puisqu)'/u
const SENTENCE_END = /(?<=[.!?…](?:\s?[»"\u201D])?)\s+(?=[«"\u201C\p{Lu}])/u
const MIN_TERM_LETTERS = 4
const MIN_SENTENCE_TERMS = 4

const FUNCTION_WORDS = new Set([
  'alors',
  'aussi',
  'autre',
  'autres',
  'avant',
  'avec',
  'avoir',
  'cela',
  'celle',
  'celles',
  'celui',
  'ceux',
  'chaque',
  'comme',
  'dans',
  'depuis',
  'donc',
  'dont',
  'elle',
  'elles',
  'encore',
  'entre',
  'leur',
  'leurs',
  'lors',
  'mais',
  'même',
  'mêmes',
  'nous',
  'notre',
  'parmi',
  'pendant',
  'plus',
  'pour',
  'quand',
  'quel',
  'quelle',
  'sans',
  'selon',
  'sont',
  'sous',
  'tous',
  'tout',
  'toute',
  'toutes',
  'très',
  'vers',
  'votre',
  'vous',
  'après',
  'cette',
  'ainsi',
  'contre',
  'about',
  'after',
  'also',
  'among',
  'been',
  'before',
  'being',
  'between',
  'each',
  'even',
  'every',
  'from',
  'have',
  'into',
  'more',
  'most',
  'only',
  'other',
  'others',
  'over',
  'since',
  'some',
  'such',
  'than',
  'that',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'through',
  'under',
  'until',
  'very',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'whom',
  'will',
  'with',
  'your',
])

function folded(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .trim()
}

export function resolveTarget(query: string, candidates: LoreTarget[]): LoreTarget | undefined {
  const wanted = folded(query)
  return candidates.find(
    (target) =>
      folded(target.id) === wanted || target.names.some((name) => folded(name) === wanted),
  )
}

export function pageParts(markdown: string, play: PagePart[] = []): PagePart[] {
  const { opening, sections } = splitLore(markdown)
  const parts: PagePart[] = []
  if (opening !== undefined) parts.push({ label: 'opening', text: opening })
  parts.push(...play)
  for (const chunk of (sections ?? '').split(SECTION_HEADING)) {
    const [heading = '', ...body] = chunk.split('\n')
    if (heading.trim() === '') continue
    parts.push({ label: withoutIcons(heading).trim(), text: body.join('\n') })
  }
  return parts
}

function readableLine(line: string): string {
  return line
    .replace(/^>\s?/, '')
    .replace(/!\[[^\]]*\]\([^)]*\)\s*/gu, '')
    .replace(/:source\[(.*)\](?:\{[^{}]*\})?/u, '$1')
    .replace(/\{\{[^|}]+\|([^}]+)\}\}/gu, '$1')
    .replace(/\{\{([^}]+)\}\}/gu, '$1')
    .replace(/\*+/g, '')
    .trim()
}

function holdsOnlyPictures(line: string): boolean {
  return line.includes('![') && readableLine(line) === ''
}

export function proseOf(text: string): string {
  return text
    .split('\n')
    .filter((line) => !holdsOnlyPictures(line) && !/^:caption\[/.test(line))
    .map(readableLine)
    .join('\n')
}

export function sentencesOf(text: string): string[] {
  return proseOf(text)
    .split(/\n+/)
    .flatMap((paragraph) => paragraph.split(SENTENCE_END))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== '')
}

function bareWord(word: string): string {
  return word.toLowerCase().replace(ELISION, '')
}

function singular(word: string): string {
  return word
    .split('-')
    .map((piece) => piece.replace(/[sx]$/u, ''))
    .join('-')
}

export function vocabularyOf(parts: PagePart[]): Set<string> {
  return new Set(parts.flatMap((part) => (proseOf(part.text).match(WORD) ?? []).map(bareWord)))
}

export function termKey(word: string, vocabulary: Set<string>): string {
  const bare = bareWord(word)
  const one = singular(bare)
  return one !== bare && vocabulary.has(one) ? one : bare
}

function termsOf(text: string, vocabulary: Set<string>): string[] {
  return (proseOf(text).match(WORD) ?? [])
    .filter((word) => {
      const bare = bareWord(word)
      return bare.length >= MIN_TERM_LETTERS && !FUNCTION_WORDS.has(bare)
    })
    .map((word) => termKey(word, vocabulary))
}

function wordCount(text: string): number {
  return (proseOf(text).match(WORD) ?? []).length
}

export function summarise(part: PagePart): PartSummary {
  const sentences = sentencesOf(part.text)
  return {
    label: part.label,
    words: wordCount(part.text),
    first: sentences[0] ?? '',
    last: sentences.at(-1) ?? '',
  }
}

export function termSpread(parts: PagePart[], minParts: number): TermSpread[] {
  const vocabulary = vocabularyOf(parts)
  const counts = new Map<string, number[]>()
  parts.forEach((part, index) => {
    for (const key of termsOf(part.text, vocabulary)) {
      const row = counts.get(key) ?? parts.map(() => 0)
      row[index] = (row[index] ?? 0) + 1
      counts.set(key, row)
    }
  })
  return [...counts]
    .map(([term, row]) => ({
      term,
      counts: row,
      total: row.reduce((sum, count) => sum + count, 0),
      parts: row.filter((count) => count > 0).length,
    }))
    .filter((spread) => spread.parts >= minParts)
    .sort((a, b) => b.parts - a.parts || b.total - a.total || a.term.localeCompare(b.term))
}

function jaccard(first: Set<string>, second: Set<string>): number {
  let shared = 0
  for (const term of first) if (second.has(term)) shared += 1
  return shared / (first.size + second.size - shared)
}

export function similarPairs(parts: PagePart[], minSimilarity: number): SimilarPair[] {
  const vocabulary = vocabularyOf(parts)
  const sentences = parts.flatMap((part) =>
    sentencesOf(part.text)
      .map((sentence) => ({
        part: part.label,
        sentence,
        terms: new Set(termsOf(sentence, vocabulary)),
      }))
      .filter((entry) => entry.terms.size >= MIN_SENTENCE_TERMS),
  )
  const pairs: SimilarPair[] = []
  sentences.forEach((first, index) => {
    for (const second of sentences.slice(index + 1)) {
      if (first.part === second.part) continue
      const similarity = jaccard(first.terms, second.terms)
      if (similarity < minSimilarity) continue
      pairs.push({
        first: { part: first.part, sentence: first.sentence },
        second: { part: second.part, sentence: second.sentence },
        similarity,
      })
    }
  })
  return pairs.sort((a, b) => b.similarity - a.similarity)
}

export function surveyPage(parts: PagePart[], options: SurveyOptions = DEFAULT_SURVEY): PageSurvey {
  return {
    parts: parts.map(summarise),
    terms: termSpread(parts, options.minParts),
    pairs: similarPairs(parts, options.minSimilarity),
  }
}

function cell(text: string): string {
  return text.replaceAll('|', '\\|').replaceAll('\n', ' ')
}

export function renderSurvey(title: string, survey: PageSurvey): string {
  const numbered = survey.parts.map((_, index) => `${index + 1}`)
  const lines = [
    `## ${title}`,
    '',
    '| # | Part | Words | First sentence | Last sentence |',
    '| --- | --- | --- | --- | --- |',
    ...survey.parts.map(
      (part, index) =>
        `| ${index + 1} | ${cell(part.label)} | ${part.words} | ${cell(part.first)} | ${cell(part.last)} |`,
    ),
    '',
    '### Terms that recur across parts',
    '',
    `| Term | Parts | Total | ${numbered.join(' | ')} |`,
    `| --- | --- | --- | ${numbered.map(() => '---').join(' | ')} |`,
    ...survey.terms.map(
      (spread) =>
        `| ${cell(spread.term)} | ${spread.parts} | ${spread.total} | ${spread.counts.join(' | ')} |`,
    ),
    '',
    '### Similar sentences across parts',
    '',
    ...(survey.pairs.length === 0
      ? ['None above the threshold.']
      : survey.pairs.map(
          (pair) =>
            `- ${pair.similarity.toFixed(2)}: « ${pair.first.sentence} » (${pair.first.part}) / « ${pair.second.sentence} » (${pair.second.part})`,
        )),
    '',
  ]
  return lines.join('\n')
}
