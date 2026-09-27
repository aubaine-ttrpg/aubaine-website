import { describe, expect, it } from 'vitest'

import {
  flattenText,
  parseParagraphs,
  parseRuns,
  pinReferenceLabels,
  type TermIndex,
  type TermRecord,
} from '../../src/lib/game/richtext'

function record(title: string, family: TermRecord['family']): TermRecord {
  return {
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
  keys: new Map([
    ['energie', energy],
    ['entrave', restrained],
    ['TRAFEU-001', fireBolt],
  ]),
}

describe('references by key', () => {
  it('prints the entry label when the reference carries no text', () => {
    expect(parseRuns('Dépensez 2 {{energie}}.', index)).toEqual([
      { kind: 'text', text: 'Dépensez 2 ' },
      { kind: 'term', text: 'Énergie', term: energy },
      { kind: 'text', text: '.' },
    ])
  })

  it('prints the written text and links the entry the key names', () => {
    expect(parseRuns('La cible est {{entrave|Entravée}}.', index)).toContainEqual({
      kind: 'term',
      text: 'Entravée',
      term: restrained,
    })
  })

  it('links a skill by its id', () => {
    expect(parseRuns('{{TRAFEU-001|cette Compétence}}', index)).toEqual([
      { kind: 'term', text: 'cette Compétence', term: fireBolt },
    ])
  })

  it('leaves a bare word as text, whatever its capitals', () => {
    expect(parseRuns('Dépensez 1 Énergie pour lancer Trait de feu.', index)).toEqual([
      { kind: 'text', text: 'Dépensez 1 Énergie pour lancer Trait de feu.' },
    ])
  })

  it('leaves an unknown key as plain text', () => {
    expect(parseRuns('{{inconnu}}', index)).toEqual([{ kind: 'text', text: 'inconnu' }])
  })
})

describe('paragraphs and lines', () => {
  it('starts a paragraph after a blank line', () => {
    expect(parseParagraphs('Premier.\n\nSecond.', index)).toEqual([
      { lines: [[{ kind: 'text', text: 'Premier.' }]] },
      { lines: [[{ kind: 'text', text: 'Second.' }]] },
    ])
  })

  it('breaks the line on a single newline, inside the same paragraph', () => {
    expect(parseParagraphs('***Sceller.*** Une porte.\n***Coller.*** Deux objets.', index)).toEqual(
      [
        {
          lines: [
            [
              { kind: 'bold', text: 'Sceller.' },
              { kind: 'text', text: ' Une porte.' },
            ],
            [
              { kind: 'bold', text: 'Coller.' },
              { kind: 'text', text: ' Deux objets.' },
            ],
          ],
        },
      ],
    )
  })
})

describe('flattened text', () => {
  const labelOf = (key: string): string | undefined => index.keys.get(key)?.title

  it('prints labels and written texts, never braces', () => {
    expect(
      flattenText('Dépensez 1 {{energie}} : la cible est {{entrave|Entravée}}.', labelOf),
    ).toBe('Dépensez 1 Énergie : la cible est Entravée.')
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

  it('keeps a written text and an unknown key as they are', () => {
    const source = '{{energie|Énergies}} et {{inconnu}}'
    expect(pinReferenceLabels(source, frenchLabel)).toBe(source)
  })
})
