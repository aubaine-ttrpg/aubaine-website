import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  ALMANACH_CRYSTAL_BOOTS,
  ALMANACH_FIT,
  ALMANACH_MAGICS,
  ALMANACH_PAGE_BOOT,
  ALMANACH_STYLE,
  type AlmanachStyle,
  almanachFitOf,
  almanachStyleOf,
} from '../../src/lib/art-effect/almanach-look'
import { almanachStyle } from '../../src/lib/game/schema'

const root = resolve(import.meta.dirname, '../..')

const lacquered: AlmanachStyle = {
  ...ALMANACH_STYLE,
  metal: '#44a8e7',
  metalGloss: 0.8,
  trim: 'or',
  grip: 'cuir-bordeaux',
  gem: '#f2efe6',
  magic: 'ether',
  battery: 72,
}

const REFUSED: readonly [string, unknown][] = [
  ['an unknown finish', { ...ALMANACH_STYLE, metal: 'platine' }],
  ['a short hex colour', { ...ALMANACH_STYLE, gem: '#fff' }],
  ['an uppercase hex colour', { ...ALMANACH_STYLE, light: '#FFD27A' }],
  ['a gloss above one', { ...ALMANACH_STYLE, gloss: 1.2 }],
  ['a part gloss below zero', { ...ALMANACH_STYLE, gripGloss: -0.1 }],
  ['an unknown magic', { ...ALMANACH_STYLE, magic: 'frost' }],
  ['the whole CADRAN boot on the crystal', { ...ALMANACH_STYLE, crystalBoot: 'quick' }],
  ['a battery above 100', { ...ALMANACH_STYLE, battery: 101 }],
  ['a fractional battery', { ...ALMANACH_STYLE, battery: 12.5 }],
  ['an unknown field', { ...ALMANACH_STYLE, boot: 'instant' }],
  ['a missing field', { metal: 'or' }],
  ['a list', [ALMANACH_STYLE]],
]

describe('almanach styles', () => {
  it('accepts the default style and a full one, keeping a part gloss only when it is set', () => {
    expect(almanachStyleOf(ALMANACH_STYLE)).toEqual(ALMANACH_STYLE)
    expect(almanachStyleOf(lacquered)).toEqual(lacquered)
    const { metalGloss, trimGloss, gripGloss, ...overall } = ALMANACH_STYLE
    expect(almanachStyleOf(overall)).not.toHaveProperty('metalGloss')
  })

  it('fills the tube with a picture unless it asks to be shown whole', () => {
    expect(ALMANACH_FIT).toBe('cover')
    expect(almanachFitOf(undefined)).toBe('cover')
    expect(almanachFitOf('stretch')).toBe('cover')
    expect(almanachFitOf('contain')).toBe('contain')
  })

  for (const [reason, value] of REFUSED) {
    it(`refuses ${reason}, in the page script and in the contract alike`, () => {
      expect(almanachStyleOf(value)).toBeUndefined()
      expect(almanachStyle.safeParse(value).success).toBe(false)
    })
  }

  it('agrees with the contract on the styles it accepts', () => {
    for (const style of [ALMANACH_STYLE, lacquered]) {
      expect(almanachStyle.safeParse(style).success).toBe(true)
    }
  })

  it('starts on a page without the CADRAN boot, and lets a reader play at most its flash', () => {
    expect(ALMANACH_PAGE_BOOT).toBe('instant')
    expect([...ALMANACH_CRYSTAL_BOOTS].sort()).toEqual(['fast', 'instant'])
  })

  it('names every magic after a domain of the game', async () => {
    const raw: unknown = JSON.parse(await readFile(resolve(root, 'data/meta/domains.json'), 'utf8'))
    const entries =
      typeof raw === 'object' && raw !== null && 'entries' in raw && Array.isArray(raw.entries)
        ? raw.entries
        : []
    const keys = new Set(
      entries.map((entry: unknown) =>
        typeof entry === 'object' && entry !== null && 'key' in entry ? entry.key : undefined,
      ),
    )
    for (const magic of ALMANACH_MAGICS) {
      expect(keys.has(magic), `${magic} is not a key of data/meta/domains.json`).toBe(true)
    }
  })
})
