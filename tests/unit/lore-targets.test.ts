import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readCorpus } from '../../src/lib/game/fs-sources'
import { references, termText } from '../../src/lib/game/richtext'
import { sentencesOf } from '../../tools/lore/survey'
import { playParts, printedPage, targetArgumentsOf } from '../../tools/lore/targets'

const corpus = await readCorpus(resolve(import.meta.dirname, '../..'), 'fr')

describe('playParts', () => {
  it('reads the species prose in page order: the play text, each sub-species, then the naming custom', () => {
    const species = corpus.species.find(
      (entry) =>
        entry.subspecies.length > 0 &&
        entry.naming !== undefined &&
        entry.roleplay?.text !== undefined,
    )
    expect(species, 'no species has play text, sub-species and a naming custom').toBeDefined()
    if (!species) return
    expect(playParts(species).map((part) => part.label)).toEqual([
      'roleplay.text',
      ...species.subspecies.map((sub) => `sub-species ${sub.id}`),
      'naming',
    ])
  })
})

describe('printedPage', () => {
  const named = [...corpus.terms.keys.entries()].find(([key, record]) => termText(record) !== key)

  it('cuts the printed page at its sections and leaves its pictures out', () => {
    const parts = printedPage(
      [
        'Les veilleurs gardent le gué.',
        '',
        '## Le val',
        '',
        '![](../../media/art/val.png)',
        '',
        'Le val reste.',
      ].join('\n'),
      corpus,
      undefined,
    )
    expect(parts.map((part) => part.label)).toEqual(['opening', 'Le val'])
    expect(parts.flatMap((part) => sentencesOf(part.text)).join('\n')).not.toContain('val.png')
  })

  it('leaves out a picture that opens a quoted line and reads the words after it', () => {
    const [part] = printedPage('> ![](a.png) **Tiar :** « Rien ne passe. »', corpus, undefined)
    expect(sentencesOf(part?.text ?? '')).toEqual(['Tiar : « Rien ne passe. »'])
  })

  it('reads a reference in the lore page by the label the page prints', () => {
    expect(named, 'no term prints a label other than its key').toBeDefined()
    if (!named) return
    const [key, record] = named
    const [part] = printedPage(`Un texte qui nomme {{${key}}}.`, corpus, undefined)
    expect(sentencesOf(part?.text ?? '')).toEqual([`Un texte qui nomme ${termText(record)}.`])
  })

  it('reads a reference in the species prose by the label the page prints', () => {
    const found = corpus.species
      .flatMap((species) =>
        playParts(species).flatMap((part) =>
          references(part.text).flatMap(({ key }) => {
            const record = corpus.terms.keys.get(key)
            if (!record || !part.text.includes(`{{${key}}}`)) return []
            if (part.text.includes(termText(record))) return []
            return [{ species, label: part.label, printed: termText(record) }]
          }),
        ),
      )
      .at(0)
    expect(found, 'no species prose names a term by a bare reference').toBeDefined()
    if (!found) return
    const part = printedPage('', corpus, found.species).find((entry) => entry.label === found.label)
    expect(sentencesOf(part?.text ?? '').join('\n')).toContain(found.printed)
  })

  it('reads a counted reference with its amount', () => {
    expect(named, 'no term prints a label other than its key').toBeDefined()
    if (!named) return
    const [key, record] = named
    const [part] = printedPage(`Elle grandit de {{2 ${key}}} en un an.`, corpus, undefined)
    expect(sentencesOf(part?.text ?? '')).toEqual([
      `Elle grandit de 2 ${termText(record)} en un an.`,
    ])
  })
})

describe('targetArgumentsOf', () => {
  it('reads one id or name and the options it is given, with or without the -- that pnpm passes through', () => {
    const wanted = { query: 'nnor', values: { out: 'survey.md' } }
    expect(targetArgumentsOf(['nnor', '--out', 'survey.md'], { out: { type: 'string' } })).toEqual(
      wanted,
    )
    expect(
      targetArgumentsOf(['--', 'nnor', '--out', 'survey.md'], { out: { type: 'string' } }),
    ).toEqual(wanted)
  })

  it('refuses a second id or name, and an option left without its value', () => {
    expect(targetArgumentsOf(['--', 'nnor', 'elfe'], {})).toHaveProperty(
      'message',
      'one id or name, got 2: nnor, elfe',
    )
    expect(targetArgumentsOf(['--', 'nnor', '--out'], { out: { type: 'string' } })).toBeInstanceOf(
      Error,
    )
  })
})
