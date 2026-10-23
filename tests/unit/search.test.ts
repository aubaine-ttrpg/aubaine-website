import { describe, expect, it } from 'vitest'

import { slugify } from '../../src/lib/game/derive'
import { nameMatches, queryTerms } from '../../src/scripts/search'

function finds(query: string, title: string): boolean {
  return nameMatches(slugify(title), queryTerms(query))
}

describe('global search matching', () => {
  it('ignores accents and case in the query and the name', () => {
    expect(finds('epee', 'Épée courte')).toBe(true)
    expect(finds('ÉPÉE', 'Épée longue')).toBe(true)
  })

  it('reads a ligature as its two letters', () => {
    expect(finds('manoeuvre', 'Manœuvre')).toBe(true)
    expect(finds('manœuvre', 'Manoeuvre')).toBe(true)
  })

  it('finds a name that carries every word, in any order', () => {
    expect(finds('sibylles parangon', "Bague du parangon de l'ordre des Sibylles")).toBe(true)
    expect(finds('arc long', 'Arc long')).toBe(true)
  })

  it('keeps out a name that lacks one of the words', () => {
    expect(finds('arc court', 'Arc long')).toBe(false)
  })

  it('treats punctuation and extra spaces as word breaks', () => {
    expect(finds("  l'ordre  ", "Bague du parangon de l'ordre des Sibylles")).toBe(true)
    expect(finds('lame-ether', "Anneau du parangon de l'ordre des Lame-Éther")).toBe(true)
  })

  it('matches every name when the query is empty', () => {
    expect(queryTerms('   ')).toEqual([])
    expect(finds('', 'Berserker')).toBe(true)
  })

  it('matches no name for a query no name carries', () => {
    expect(finds('zzzz', 'Berserker')).toBe(false)
  })
})
