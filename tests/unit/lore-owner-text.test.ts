import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readCorpus } from '../../src/lib/game/fs-sources'
import { termText } from '../../src/lib/game/richtext'
import { argumentsOf, printedSources } from '../../tools/lore/owner-text'
import { provenance, sourceSentences } from '../../tools/lore/provenance'

const corpus = await readCorpus(resolve(import.meta.dirname, '../..'), 'fr')

const source = {
  label: 'export.txt',
  text: [
    'Les veilleurs gardent le gué du val depuis que le fleuve a changé de lit.',
    '',
    "Chaque veilleur reçoit à l'aube le nom de son gué, et ne le quitte plus de toute sa",
    'vie. Attendre ? Observer ?',
  ].join('\n'),
}

const origins = (text: string) =>
  provenance([{ label: 'opening', text }], [source]).page.map((entry) => [
    entry.sentence,
    entry.origin,
  ])

describe('sourceSentences', () => {
  it('joins the lines an export wraps inside a paragraph', () => {
    expect(sourceSentences(source).map((entry) => entry.sentence)).toContain(
      "Chaque veilleur reçoit à l'aube le nom de son gué, et ne le quitte plus de toute sa vie.",
    )
  })

  it('leaves a picture out wherever it sits on a line, and the line it leaves empty', () => {
    const read = (text: string) =>
      sourceSentences({ label: 'notes.md', text }).map((entry) => entry.sentence)
    expect(read('> ![](a.png) **Tiar :** « Rien ne passe. »')).toEqual([
      'Tiar : « Rien ne passe. »',
    ])
    expect(read('Le gué tint\n![](a.png)\nface à la crue.')).toEqual([
      'Le gué tint face à la crue.',
    ])
  })

  it('keeps the break between two paragraphs when the first ends without a full stop', () => {
    expect(
      sourceSentences({ label: 'notes.md', text: 'Le titre du gué\n\nLe gué tint.' }).map(
        (entry) => entry.sentence,
      ),
    ).toEqual(['Le titre du gué', 'Le gué tint.'])
  })

  it('leaves the headings of a markdown source out of its sentences', () => {
    expect(
      sourceSentences({
        label: 'notes.md',
        text: '## Le gué\nLe gué tint.\n\n### La crue\nElle passa.',
      }).map((entry) => entry.sentence),
    ).toEqual(['Le gué tint.', 'Elle passa.'])
  })
})

describe('provenance', () => {
  it('counts a sentence as the owner when its words stand in a source, whatever its typography', () => {
    expect(
      origins('Les Veilleurs gardent le gué du val, depuis que le fleuve a changé de lit !'),
    ).toEqual([
      ['Les Veilleurs gardent le gué du val, depuis que le fleuve a changé de lit !', 'owner'],
    ])
  })

  it('reads a short sentence by its words in their order', () => {
    expect(origins('« Attendre ? Observer ? »')).toEqual([
      ['« Attendre ?', 'owner'],
      ['Observer ? »', 'owner'],
    ])
  })

  it('marks a sentence whose words mostly stand in a source as changed, beside that source sentence', () => {
    const [entry] = provenance(
      [
        {
          label: 'Le gué',
          text: "Chaque veilleur reçoit à l'aube le nom de son gué, et ne le quitte plus jamais.",
        },
      ],
      [source],
    ).page
    expect(entry?.origin).toBe('changed')
    expect(entry?.closest?.sentence).toBe(
      "Chaque veilleur reçoit à l'aube le nom de son gué, et ne le quitte plus de toute sa vie.",
    )
  })

  it('lists a sentence whose words stand in no source as writer text', () => {
    expect(origins("Des jardins s'étagent sur les terrasses des tours du val.")).toEqual([
      ["Des jardins s'étagent sur les terrasses des tours du val.", 'writer'],
    ])
  })

  it('lists the source sentences the page does not carry', () => {
    const found = provenance(
      [
        {
          label: 'opening',
          text: 'Les veilleurs gardent le gué du val depuis que le fleuve a changé de lit.',
        },
      ],
      [source],
    )
    expect(found.missing.map((entry) => entry.sentence)).toEqual([
      "Chaque veilleur reçoit à l'aube le nom de son gué, et ne le quitte plus de toute sa vie.",
      'Attendre ?',
      'Observer ?',
    ])
  })

  it('reads a reference by the label the page prints', () => {
    const found = provenance(
      [
        {
          label: 'roleplay.text',
          text: 'Si elle propose plusieurs {{taille|Tailles}}, retenez-en une.',
        },
      ],
      [{ label: 'export.txt', text: 'Si elle propose plusieurs Tailles, retenez-en une.' }],
    )
    expect(found.page.map((entry) => entry.origin)).toEqual(['owner'])
    expect(found.missing).toEqual([])
  })

  it('leaves a short source sentence missing when only writer text holds its words', () => {
    const found = provenance(
      [{ label: 'Le gué', text: 'Ils aiment attendre le soir au bord du gué.' }],
      [{ label: 'export.txt', text: 'Attendre ?' }],
    )
    expect(found.missing.map((entry) => entry.sentence)).toEqual(['Attendre ?'])
  })

  it('lists a short source sentence the page only truncates', () => {
    expect(
      provenance(
        [{ label: 'Le gué', text: 'Le gué tint.' }],
        [{ label: 'export.txt', text: 'Le gué tint bon.' }],
      ).missing.map((entry) => entry.sentence),
    ).toEqual(['Le gué tint bon.'])
  })

  it('keeps a short source sentence the page merges into a sentence of the owner', () => {
    const found = provenance(
      [{ label: 'Le gué', text: 'Ils partent, le gué reste.' }],
      [{ label: 'export.txt', text: 'Ils partent. Le gué reste.' }],
    )
    expect(found.page.map((entry) => entry.origin)).toEqual(['owner'])
    expect(found.missing).toEqual([])
  })

  it('lists a short source sentence the page drops, even when an owner sentence holds the same words', () => {
    const dropped = (page: string, text: string) =>
      provenance([{ label: 'Le gué', text: page }], [{ label: 'export.txt', text }]).missing.map(
        (entry) => entry.sentence,
      )
    expect(dropped('Le gué ne cède jamais.', 'Le gué ne cède jamais. Jamais.')).toEqual(['Jamais.'])
    expect(
      dropped(
        'Le gué tint face à la crue de printemps.',
        'Le gué tint. Le gué tint face à la crue de printemps.',
      ),
    ).toEqual(['Le gué tint.'])
    expect(
      dropped(
        'Au soir, le gué tint bon face à la crue.',
        'Le gué tint bon face. Au soir, le gué tint bon face à la crue.',
      ),
    ).toEqual(['Le gué tint bon face.'])
  })

  it('lists a short source sentence the page drops, even when owner lines placed elsewhere hold all its words', () => {
    const dropped = (page: string, text: string) =>
      provenance([{ label: 'Le gué', text: page }], [{ label: 'export.txt', text }]).missing.map(
        (entry) => entry.sentence,
      )
    expect(dropped('Non. Le gué tint. Jamais.', 'Non. Le gué tint. Jamais. Non, jamais.')).toEqual([
      'Non, jamais.',
    ])
    expect(
      dropped(
        'Le gué tint. Puis vint la nuit. Tint bon face.',
        'Le gué tint. Puis vint la nuit. Tint bon face. Le gué tint bon face.',
      ),
    ).toEqual(['Le gué tint bon face.'])
    expect(
      dropped('Jamais. Le gué tint.', 'Jamais. Le gué tint. Puis vint la nuit. Jamais, jamais.'),
    ).toEqual(['Puis vint la nuit.', 'Jamais, jamais.'])
  })

  it('counts a short owner line where the source holds it as a sentence of its own', () => {
    const dropped = (page: string, text: string) =>
      provenance([{ label: 'Le gué', text: page }], [{ label: 'export.txt', text }]).missing.map(
        (entry) => entry.sentence,
      )
    expect(dropped('Ici ?', 'Ils vivent ici depuis toujours. Ici ?')).toEqual([
      'Ils vivent ici depuis toujours.',
    ])
    expect(dropped('Ils partent. Ils partent tôt.', 'Ils partent tôt. Ils partent.')).toEqual([])
  })

  it('keeps a split half whose words also stand earlier in the source', () => {
    const found = provenance(
      [{ label: 'Le gué', text: 'Ils partent tôt. Ils partent. Le gué reste.' }],
      [{ label: 'export.txt', text: 'Ils partent tôt. Ils partent, le gué reste.' }],
    )
    expect(found.page.map((entry) => entry.origin)).toEqual(['owner', 'owner', 'owner'])
    expect(found.missing).toEqual([])
  })

  it('gives the owner each half of an owner sentence the page splits', () => {
    const found = provenance(
      [{ label: 'Le gué', text: 'Les Nnors sont fiers. Ils le disent au Saman.' }],
      [{ label: 'export.txt', text: 'Les Nnors sont fiers, ils le disent au Saman.' }],
    )
    expect(found.page.map((entry) => entry.origin)).toEqual(['owner', 'owner'])
    expect(found.missing).toEqual([])
  })

  it('gives the owner a half of one or two words when the page splits an owner sentence', () => {
    const split = (page: string, text: string) => {
      const found = provenance([{ label: 'Le gué', text: page }], [{ label: 'export.txt', text }])
      return { origins: found.page.map((entry) => entry.origin), missing: found.missing }
    }
    const kept = { origins: ['owner', 'owner'], missing: [] }
    expect(split('Ils partent. Le gué reste.', 'Ils partent, le gué reste.')).toEqual(kept)
    expect(split('Jamais. Le gué ne cède pas.', 'Jamais le gué ne cède pas.')).toEqual(kept)
    expect(
      split(
        "Ils partent. Le gué reste derrière eux jusqu'au soir.",
        "Ils partent, le gué reste derrière eux jusqu'au soir.",
      ),
    ).toEqual(kept)
  })

  it('gives the owner a short half that comes after its neighbour', () => {
    const found = provenance(
      [{ label: 'Le gué', text: 'Le gué ne cède. Jamais.' }],
      [{ label: 'export.txt', text: 'Le gué ne cède jamais.' }],
    )
    expect(found.page.map((entry) => entry.origin)).toEqual(['owner', 'owner'])
    expect(found.missing).toEqual([])
  })

  it('leaves to the writer a word it adds beside an owner sentence', () => {
    expect(
      provenance(
        [{ label: 'Le gué', text: 'Le gué ne cède pas. Jamais.' }],
        [
          {
            label: 'export.txt',
            text: 'Le gué ne cède pas, même quand la crue monte, et jamais au Saman.',
          },
        ],
      ).page.map((entry) => entry.origin),
    ).toEqual(['owner', 'writer'])
  })

  it('gives two one-word lines to the owner only when a source sentence has exactly their two words', () => {
    const lines = (page: string, text: string) =>
      provenance([{ label: 'Le gué', text: page }], [{ label: 'export.txt', text }]).page.map(
        (entry) => entry.origin,
      )
    expect(
      lines(
        'Les veilleurs se taisent. Jamais. Rien. Le val attend.',
        'Il ne dit jamais rien au Saman.',
      ),
    ).toEqual(['writer', 'writer', 'writer', 'writer'])
    expect(lines('Non. Hélas.', 'Elle dit non hélas trop tard.')).toEqual(['writer', 'writer'])
    expect(lines('Non. Jamais.', 'Non, jamais.')).toEqual(['owner', 'owner'])
  })

  it('gives the owner a short line lifted from an owner sentence', () => {
    expect(
      provenance(
        [{ label: 'opening', text: '> « Rien ne passe. »' }],
        [{ label: 'export.txt', text: '« Rien ne passe », dit la veilleuse au gué du val.' }],
      ).page.map((entry) => entry.origin),
    ).toEqual(['owner'])
  })

  it('gives a line of one or two words to the owner only when a source sentence has exactly those words', () => {
    expect(
      provenance(
        [{ label: 'Le gué', text: 'Jamais. Tint bon. Bon vent.' }],
        [{ label: 'export.txt', text: 'Le gué ne cède jamais. Le gué tint. Bon vent.' }],
      ).page.map((entry) => [entry.sentence, entry.origin]),
    ).toEqual([
      ['Jamais.', 'writer'],
      ['Tint bon.', 'writer'],
      ['Bon vent.', 'owner'],
    ])
  })

  it('reads a source as the page prints it, its pictures and quote marks aside', () => {
    const found = provenance(
      [
        {
          label: 'Le gué',
          text: 'Les veilleurs gardent le gué du val depuis que le fleuve a changé de lit.',
        },
      ],
      [
        {
          label: 'notes.md',
          text: '![](gue.png)\nLes veilleurs gardent le gué du val depuis que le fleuve a changé de lit.',
        },
      ],
    )
    expect(found.page.map((entry) => entry.origin)).toEqual(['owner'])
  })

  it('gives a short sentence to the writer when its words come in another order', () => {
    expect(
      provenance(
        [{ label: 'Le gué', text: 'Bon tint le gué.' }],
        [{ label: 'export.txt', text: 'Le gué tint bon.' }],
      ).page.map((entry) => entry.origin),
    ).toEqual(['writer'])
  })
})

describe('printedSources', () => {
  it('reads a source the way the page prints it, its references by their label', () => {
    const named = [...corpus.terms.keys.entries()].find(([key, record]) => termText(record) !== key)
    expect(named, 'no term prints a label other than its key').toBeDefined()
    if (!named) return
    const [key, record] = named
    const [source] = printedSources(
      [{ label: 'notes.md', text: `Le gué nomme {{${key}}}.\n\nIl en garde {{2 ${key}}}.` }],
      corpus,
    )
    expect(
      sourceSentences(source ?? { label: '', text: '' }).map((entry) => entry.sentence),
    ).toEqual([`Le gué nomme ${termText(record)}.`, `Il en garde 2 ${termText(record)}.`])
  })
})

describe('argumentsOf', () => {
  it('reads the arguments the same with or without the -- that pnpm passes through', () => {
    const wanted = { query: 'elfe', sources: ['notes.md'], out: 'report.md' }
    expect(argumentsOf(['elfe', '--source', 'notes.md', '--out', 'report.md'])).toEqual(wanted)
    expect(argumentsOf(['--', 'elfe', '--source', 'notes.md', '--out', 'report.md'])).toEqual(
      wanted,
    )
  })
})
