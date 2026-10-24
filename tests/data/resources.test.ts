import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { readCorpus } from '../../src/lib/game/fs-sources'
import { POOLS, type PoolFormula, RANKS, RESOURCE_POOLS } from '../../src/lib/game/resources'

const root = resolve(import.meta.dirname, '../..')
const corpus = await readCorpus(root, 'fr')

const characteristicReferences = new Map(
  corpus.glossary
    .filter((term) => term.family === 'characteristic')
    .map((term) => [term.key, term.reference]),
)

type Chapter = { path: string; english: boolean; text: string }

async function bookChapters(): Promise<Chapter[]> {
  const entries = await readdir(resolve(root, 'data/books'), {
    recursive: true,
    withFileTypes: true,
  })
  const paths = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort()
  return Promise.all(
    paths.map(async (path) => ({
      path: relative(root, path),
      english: path.endsWith('.en.md'),
      text: await readFile(path, 'utf8'),
    })),
  )
}

const chapters = await bookChapters()

function escaped(text: string): string {
  return text.replace(/[{}|]/g, (character) => `\\${character}`)
}

function printedFormulas(text: string, term: string): string[] {
  const reference = escaped(`{{${term}}}`)
  const definition = new RegExp(`\`${reference} = ([^\`]+)\``, 'g')
  const tableRow = new RegExp(`^\\| ${reference} \\| \`([^\`]+)\` \\|`, 'gm')
  return [...text.matchAll(definition), ...text.matchAll(tableRow)].flatMap(([, expression]) =>
    expression === undefined ? [] : [expression],
  )
}

type Monomial = 'base' | 'perCharacteristic' | 'perLevel' | 'perCharacteristicPerLevel'

type Polynomial = Record<Monomial, number>

const MONOMIALS: readonly Monomial[] = [
  'base',
  'perCharacteristic',
  'perLevel',
  'perCharacteristicPerLevel',
]

const ZERO: Polynomial = {
  base: 0,
  perCharacteristic: 0,
  perLevel: 0,
  perCharacteristicPerLevel: 0,
}

function topLevel(text: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '(') depth += 1
    if (character === ')') depth -= 1
    if (depth === 0 && text.startsWith(separator, index)) {
      parts.push(current.trim())
      current = ''
      index += separator.length - 1
      continue
    }
    current += character
  }
  return [...parts, current.trim()]
}

function product(left: Polynomial, right: Polynomial): Polynomial {
  const result = { ...ZERO }
  const degree: Record<Monomial, [number, number]> = {
    base: [0, 0],
    perCharacteristic: [1, 0],
    perLevel: [0, 1],
    perCharacteristicPerLevel: [1, 1],
  }
  for (const a of MONOMIALS) {
    for (const b of MONOMIALS) {
      if (left[a] === 0 || right[b] === 0) continue
      const characteristic = degree[a][0] + degree[b][0]
      const level = degree[a][1] + degree[b][1]
      const found = MONOMIALS.find(
        (candidate) => degree[candidate][0] === characteristic && degree[candidate][1] === level,
      )
      if (!found) throw new Error('a formula squares its Caractéristique or its Niveau')
      result[found] += left[a] * right[b]
    }
  }
  return result
}

function parsedFormula(expression: string, characteristic: string): PoolFormula {
  const expected = `{{${characteristicReferences.get(characteristic)}}}`
  const others = new Set(
    [...characteristicReferences.values()].map((reference) => `{{${reference}}}`),
  )
  const factorOf = (factor: string): Polynomial => {
    if (factor.startsWith('(') && factor.endsWith(')')) return sumOf(factor.slice(1, -1))
    if (/^\d+$/.test(factor)) return { ...ZERO, base: Number(factor) }
    if (factor === expected) return { ...ZERO, perCharacteristic: 1 }
    if (others.has(factor)) throw new Error(`${expression} reads ${factor}, not ${expected}`)
    return { ...ZERO, perLevel: 1 }
  }
  const sumOf = (text: string): Polynomial =>
    topLevel(text, ' + ').reduce(
      (sum, term) => {
        const value = topLevel(term, ' × ')
          .map(factorOf)
          .reduce(product, { ...ZERO, base: 1 })
        return {
          base: sum.base + value.base,
          perCharacteristic: sum.perCharacteristic + value.perCharacteristic,
          perLevel: sum.perLevel + value.perLevel,
          perCharacteristicPerLevel:
            sum.perCharacteristicPerLevel + value.perCharacteristicPerLevel,
        }
      },
      { ...ZERO },
    )
  return sumOf(expression)
}

describe('the resource formulas the books print', () => {
  for (const pool of RESOURCE_POOLS) {
    const rule = POOLS[pool]

    it(`prints the ${pool} formula in both languages`, () => {
      for (const english of [false, true]) {
        const printed = chapters
          .filter((chapter) => chapter.english === english)
          .flatMap((chapter) => printedFormulas(chapter.text, rule.term))
        expect(printed.length, english ? 'English chapters' : 'French chapters').toBeGreaterThan(0)
      }
    })

    for (const chapter of chapters) {
      const printed = printedFormulas(chapter.text, rule.term)
      if (printed.length === 0) continue
      it(`${chapter.path} prints the ${pool} formula the rules compute`, () => {
        for (const expression of printed) {
          expect(parsedFormula(expression, rule.characteristic), expression).toEqual(rule.formula)
        }
      })
    }
  }
})

const RANK_HEADERS = { fr: 'Rang', en: 'Rank' }

type PrintedRank = { rank: number; energy: number; units: number }

function printedRanks(text: string, header: string): PrintedRank[] {
  const rows = text.split('\n')
  const start = rows.findIndex((row) => row.startsWith(`| ${header} |`))
  if (start === -1) return []
  const body: PrintedRank[] = []
  for (const row of rows.slice(start + 2)) {
    if (!row.startsWith('|')) break
    const [rank, energy, units] = row
      .split('|')
      .slice(1, 4)
      .map((cell) => Number(cell.trim()))
    if (rank === undefined || energy === undefined || units === undefined) break
    body.push({ rank, energy, units })
  }
  return body
}

describe('the rank table the books print', () => {
  for (const english of [false, true]) {
    const header = english ? RANK_HEADERS.en : RANK_HEADERS.fr
    const printing = chapters
      .filter((chapter) => chapter.english === english)
      .map((chapter) => ({ chapter, ranks: printedRanks(chapter.text, header) }))
      .filter(({ ranks }) => ranks.length > 0)

    it(`is printed in the ${english ? 'English' : 'French'} chapters`, () => {
      expect(printing.length).toBeGreaterThan(0)
    })

    for (const { chapter, ranks } of printing) {
      it(`${chapter.path} prints the costs and Unités of every rank`, () => {
        expect(ranks).toEqual(RANKS.map(({ rank, energy, units }) => ({ rank, energy, units })))
      })
    }
  }
})
