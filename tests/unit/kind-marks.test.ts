import { describe, expect, it } from 'vitest'

import { indexDescriptors } from '../../src/lib/game/indexes'
import { KIND_MARKS, kindInk } from '../../src/lib/game/kind-marks'
import { LOCALES } from '../../src/lib/i18n/locales'
import { INDEX_KINDS } from '../../src/lib/i18n/routes'
import { contrastOf, DARK_INK, READABLE_CONTRAST, rgbFromHex } from '../../src/lib/key-colour'

describe('the mark of each kind of content', () => {
  it('gives no two kinds the same colour or the same pictogram', () => {
    const marks = INDEX_KINDS.map((kind) => KIND_MARKS[kind])
    expect(new Set(marks.map((mark) => mark.colour.toLowerCase())).size).toBe(marks.length)
    expect(new Set(marks.map((mark) => mark.icon)).size).toBe(marks.length)
  })

  it('inks every kind in a colour that reads on night', () => {
    for (const kind of INDEX_KINDS) {
      const contrast = contrastOf(rgbFromHex(kindInk(kind)), rgbFromHex(DARK_INK))
      expect(contrast, kind).toBeGreaterThanOrEqual(READABLE_CONTRAST)
    }
  })

  it('hands the menu the same mark in every locale', () => {
    for (const locale of LOCALES) {
      for (const entry of indexDescriptors(locale)) {
        expect(entry.mark, `${locale} ${entry.kind}`).toBe(KIND_MARKS[entry.kind])
      }
    }
  })
})
