import { describe, expect, it } from 'vitest'

import { splitLore } from '../../src/lib/game/lore-parts'

const OPENING =
  'Les humains sont des artisans.\n\n> « Arthur, vois ces stèles. »\n>\n> :source[Jacques]'
const SECTIONS = '## La Venue\n\nLes humains vinrent sur Eden.\n\n## Les Oracles\n\nSix mages.'

describe('the split of a lore page into its opening and its sections', () => {
  it('cuts the page at its first section heading', () => {
    expect(splitLore(`${OPENING}\n\n${SECTIONS}\n`)).toEqual({
      opening: OPENING,
      sections: SECTIONS,
    })
  })

  it('has no opening when the page starts on a section', () => {
    expect(splitLore(`${SECTIONS}\n`)).toEqual({ opening: undefined, sections: SECTIONS })
  })

  it('has no sections when the page never reaches a section heading', () => {
    expect(splitLore(`${OPENING}\n`)).toEqual({ opening: OPENING, sections: undefined })
  })

  it('keeps a heading quoted inside the opening in the opening', () => {
    const quoted = `${OPENING}\n> ## Une ligne citée`
    expect(splitLore(`${quoted}\n\n${SECTIONS}`).opening).toBe(quoted)
  })

  it('never cuts at a third level heading', () => {
    const opening = `${OPENING}\n\n### Le naufrage\n\nUn navire.`
    expect(splitLore(opening)).toEqual({ opening, sections: undefined })
  })

  it('has neither part for an empty page', () => {
    expect(splitLore('\n')).toEqual({ opening: undefined, sections: undefined })
  })
})
