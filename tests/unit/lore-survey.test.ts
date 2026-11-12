import { describe, expect, it } from 'vitest'

import { argumentsOf } from '../../tools/lore/run'
import {
  type LoreTarget,
  pageParts,
  proseOf,
  resolveTarget,
  sentencesOf,
  similarPairs,
  summarise,
  termKey,
  termSpread,
  vocabularyOf,
} from '../../tools/lore/survey'

const page = [
  "Les veilleurs gardent l'arbre-monde du val.",
  '',
  '> « Rien ne passe. »',
  '>',
  '> :source[**Une veilleuse**, au gué.]{top-left}',
  '',
  '## Le val',
  '',
  '![](../../media/art/val.png)',
  '',
  'Au pied des arbres-mondes, les veilleurs tissent des voiles de lin.',
  '',
  '## Le gué',
  '',
  'Un veilleur garde le gué de son clan.',
].join('\n')

const play = [
  {
    label: 'roleplay.text',
    text: 'Vous gardez un arbre-monde et le gué de votre {{clan|clan}}.',
  },
  { label: 'naming', text: 'Chaque veilleur reçoit le nom de son gué.' },
]

describe('pageParts', () => {
  it('cuts the opening, the play texts and each section in reading order', () => {
    expect(pageParts(page, play).map((part) => part.label)).toEqual([
      'opening',
      'roleplay.text',
      'naming',
      'Le val',
      'Le gué',
    ])
  })

  it('leaves the play texts out when the species has none', () => {
    expect(pageParts(page).map((part) => part.label)).toEqual(['opening', 'Le val', 'Le gué'])
  })

  it('labels a section by its words, without the icon that leads its title', () => {
    const iconed = page.replace('## Le gué', '## :icon[game-icons:bookmark] Le gué')
    expect(pageParts(iconed).map((part) => part.label)).toEqual(['opening', 'Le val', 'Le gué'])
  })
})

describe('proseOf', () => {
  it('drops pictures and keeps the words of quotes and references', () => {
    const prose = proseOf(page)
    expect(prose).not.toContain('val.png')
    expect(prose).toContain('Une veilleuse, au gué.')
    expect(proseOf(play[0]?.text ?? '')).toContain('votre clan.')
  })
})

describe('termKey', () => {
  it('folds a plural onto the singular the page also uses', () => {
    const vocabulary = vocabularyOf(pageParts(page, play))
    expect(termKey('arbres-mondes', vocabulary)).toBe('arbre-monde')
    expect(termKey("l'arbre-monde", vocabulary)).toBe('arbre-monde')
  })

  it('keeps a word ending in s whose singular the page never uses', () => {
    expect(termKey('jamais', new Set(['jamais']))).toBe('jamais')
  })
})

describe('termSpread', () => {
  it('counts a term in every part it appears in, and drops terms below the threshold', () => {
    const parts = pageParts(page, play)
    const spread = termSpread(parts, 3)
    const tree = spread.find((entry) => entry.term === 'arbre-monde')
    expect(tree?.parts).toBe(3)
    expect(tree?.counts).toEqual([1, 1, 0, 1, 0])
    expect(spread.every((entry) => entry.parts >= 3)).toBe(true)
  })
})

describe('similarPairs', () => {
  it('pairs sentences from different parts that share most of their terms', () => {
    const parts = [
      { label: 'A', text: 'Les veilleurs tissent des voiles de lin au bord du gué ancien.' },
      { label: 'B', text: 'Au bord du gué ancien, les veilleurs tissent leurs voiles de lin.' },
      { label: 'C', text: 'Le marché ouvre au printemps sur la place des tanneurs.' },
    ]
    const pairs = similarPairs(parts, 0.5)
    expect(pairs).toHaveLength(1)
    expect([pairs[0]?.first.part, pairs[0]?.second.part]).toEqual(['A', 'B'])
  })

  it('never pairs two sentences of the same part', () => {
    const parts = [
      {
        label: 'A',
        text: 'Les veilleurs tissent le lin du gué. Les veilleurs tissent le lin du gué.',
      },
    ]
    expect(similarPairs(parts, 0.1)).toEqual([])
  })
})

describe('summarise', () => {
  it('reports the words and the first and last sentence of a part', () => {
    const summary = summarise({
      label: 'X',
      text: 'Une phrase courte. Une seconde phrase ! La fin.',
    })
    expect(summary.words).toBe(8)
    expect(summary.first).toBe('Une phrase courte.')
    expect(summary.last).toBe('La fin.')
    expect(sentencesOf('Une phrase. Deux phrases.')).toHaveLength(2)
  })

  it('ends a sentence on a closing curly quote', () => {
    expect(sentencesOf('He said \u201CStop.\u201D Then he left.')).toEqual([
      'He said \u201CStop.\u201D',
      'Then he left.',
    ])
  })

  it('keeps a name in guillemets inside its sentence, and ends a sentence on a closing quote', () => {
    expect(
      sentencesOf(
        'Jacques « Le Scellaire » Arsenault appela à la paix. « Rien ne passe. » Le gué tint.',
      ),
    ).toEqual([
      'Jacques « Le Scellaire » Arsenault appela à la paix.',
      '« Rien ne passe. »',
      'Le gué tint.',
    ])
  })
})

describe('resolveTarget', () => {
  const targets: LoreTarget[] = [
    { kind: 'species', id: 'veilleur', names: ['Veilleur', 'Warden'] },
    { kind: 'tree', id: 'gue', names: ['Gué', 'Ford'] },
  ]

  it('matches an id or a name in either locale, ignoring case and accents', () => {
    expect(resolveTarget('Warden', targets)?.id).toBe('veilleur')
    expect(resolveTarget('GUE', targets)?.id).toBe('gue')
    expect(resolveTarget('gué', targets)?.kind).toBe('tree')
  })

  it('returns nothing for a name no target carries', () => {
    expect(resolveTarget('Wardens', targets)).toBeUndefined()
  })
})

describe('argumentsOf', () => {
  it('reads the arguments the same with or without the -- that pnpm passes through', () => {
    const wanted = { query: 'nnor', out: 'survey.md' }
    expect(argumentsOf(['nnor', '--out', 'survey.md'])).toEqual(wanted)
    expect(argumentsOf(['--', 'nnor', '--out', 'survey.md'])).toEqual(wanted)
  })
})
