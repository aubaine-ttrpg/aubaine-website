import { describe, expect, test } from 'vitest'

import {
  AVERAGE_ADVANCE,
  fitLetters,
  fitLine,
  lineWidth,
  PLATE_PADDING,
} from '../../src/lib/plates'

describe('the width of a name on one line', () => {
  test('a single word is its letters plus its padding', () => {
    expect(lineWidth('Matériaux', PLATE_PADDING)).toBeCloseTo(AVERAGE_ADVANCE * 9 + PLATE_PADDING)
  })

  test('a short word between two words takes less room than the same word alone', () => {
    const between =
      lineWidth('Arbres de compétences', PLATE_PADDING) -
      lineWidth('Arbres compétences', PLATE_PADDING)
    expect(between).toBeLessThan(lineWidth('de', PLATE_PADDING))
  })

  test('every word after the first adds its padding and a gap', () => {
    const apart = lineWidth('Skill Trees', PLATE_PADDING)
    const joined = lineWidth('SkillTrees', PLATE_PADDING)
    expect(apart - joined).toBeGreaterThan(PLATE_PADDING)
  })
})

describe('the fit of a set of names on one line', () => {
  test('follows the widest whole name, not the longest word', () => {
    const names = ['Arbres de compétences', 'Compétences']
    expect(Number(fitLine(names, PLATE_PADDING))).toBeCloseTo(
      lineWidth('Arbres de compétences', PLATE_PADDING),
      2,
    )
    expect(Number(fitLine(names, PLATE_PADDING))).toBeGreaterThan(
      Number(fitLetters(names, PLATE_PADDING)),
    )
  })

  test('refuses an empty set', () => {
    expect(() => fitLine([], PLATE_PADDING)).toThrow()
  })
})
