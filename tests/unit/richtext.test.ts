import { describe, expect, it } from 'vitest'

import {
  emptyTermIndex,
  flattenText,
  parseRuns,
  pinReferenceLabels,
  type TermIndex,
  type TermRecord,
} from '../../src/lib/game/richtext'

function record(title: string, family: TermRecord['family']): TermRecord {
  return {
    spelling: title,
    family,
    kind: family,
    title,
    meta: '',
    color: 'var(--accent-ink)',
    icon: null,
    text: '',
  }
}

const energy = record('Énergie', 'rule')
const restrained = record('Entravé', 'state')
const fireBolt = record('Trait de feu', 'skill')

const index: TermIndex = {
  ...emptyTermIndex(),
  keys: new Map([
    ['energie', energy],
    ['entrave', restrained],
    ['TRAFEU-001', fireBolt],
  ]),
  map: new Map([['trait de feu', fireBolt]]),
}

const options = { rulesHref: '/fr/regles', resolveReference: (): null => null }

describe('references by key', () => {
  it('prints the entry label when the reference carries no text', () => {
    expect(parseRuns('Dépensez 2 {{energie}}.', index, options)).toEqual([
      { kind: 'text', text: 'Dépensez 2 ' },
      { kind: 'term', text: 'Énergie', term: energy },
      { kind: 'text', text: '.' },
    ])
  })

  it('prints the written text and links the entry the key names', () => {
    expect(parseRuns('La cible est {{entrave|Entravée}}.', index, options)).toContainEqual({
      kind: 'term',
      text: 'Entravée',
      term: restrained,
    })
  })

  it('links a skill by its id', () => {
    expect(parseRuns('{{TRAFEU-001|cette Compétence}}', index, options)).toEqual([
      { kind: 'term', text: 'cette Compétence', term: fireBolt },
    ])
  })

  it('still resolves a skill named by its title', () => {
    expect(parseRuns('{{Trait de feu}}', index, options)).toEqual([
      { kind: 'term', text: 'Trait de feu', term: fireBolt },
    ])
  })

  it('leaves an unknown key as plain text', () => {
    expect(parseRuns('{{inconnu}}', index, options)).toEqual([{ kind: 'text', text: 'inconnu' }])
  })
})

describe('flattened text', () => {
  const labelOf = (key: string): string | undefined => index.keys.get(key)?.title

  it('prints labels and written texts, never braces', () => {
    expect(
      flattenText('Dépensez 1 {{energie}} : la cible est {{entrave|Entravée}}.', labelOf),
    ).toBe('Dépensez 1 Énergie : la cible est Entravée.')
  })

  it('prints the name inside the braces of an old reference', () => {
    expect(flattenText('Lancez {{Trait de feu}}.', labelOf)).toBe('Lancez Trait de feu.')
  })
})

describe('text inherited from another language', () => {
  const frenchLabel = (key: string): string | undefined =>
    new Map([['energie', 'Énergie']]).get(key)

  it('pins a bare reference to the label of the language the text is written in', () => {
    expect(pinReferenceLabels('Dépensez 1 {{energie}}.', frenchLabel)).toBe(
      'Dépensez 1 {{energie|Énergie}}.',
    )
  })

  it('keeps a written text, an unknown key and an old title as they are', () => {
    const source = '{{energie|Énergies}}, {{inconnu}} et {{Trait de feu}}'
    expect(pinReferenceLabels(source, frenchLabel)).toBe(source)
  })
})
