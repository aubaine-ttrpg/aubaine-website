import { describe, expect, it } from 'vitest'

import {
  atLevel,
  CANTRIPS,
  CITATIONS,
  HIGHEST_SPELL_LEVEL,
  LEVELS,
  type LevelCurve,
  PREPARED_SPELLS,
  PROFICIENCY_BONUS,
  SLOT_COST,
  SPELL_DAMAGE,
  SPELL_POINTS,
  SPELL_SLOTS,
} from '../../tools/balance/reference-curves'

const CURVES: readonly LevelCurve[] = [
  SPELL_POINTS,
  HIGHEST_SPELL_LEVEL,
  PREPARED_SPELLS,
  CANTRIPS,
  PROFICIENCY_BONUS,
]

describe('the reference curves', () => {
  for (const curve of CURVES) {
    it(`${curve.citation.table} covers every level and never decreases`, () => {
      expect(curve.values).toHaveLength(LEVELS.length)
      const values = LEVELS.map((level) => atLevel(curve, level))
      expect(values).toEqual([...values].sort((left, right) => left - right))
    })
  }

  it('prices every level of spell points as its slots at their cost', () => {
    for (const level of LEVELS) {
      const slots = SPELL_SLOTS.byLevel[level - 1] ?? []
      const priced = slots.reduce(
        (sum, count, index) => sum + count * (SLOT_COST.bySpellLevel[index] ?? Number.NaN),
        0,
      )
      expect(priced, `level ${level}`).toBe(atLevel(SPELL_POINTS, level))
    }
  })

  it('reaches the same highest spell level through the slots and through the points table', () => {
    for (const level of LEVELS) {
      expect(SPELL_SLOTS.byLevel[level - 1]?.length, `level ${level}`).toBe(
        atLevel(HIGHEST_SPELL_LEVEL, level),
      )
    }
  })

  it('gives one cost and one damage row to each spell level', () => {
    const spellLevels = Math.max(...LEVELS.map((level) => atLevel(HIGHEST_SPELL_LEVEL, level)))
    expect(SLOT_COST.bySpellLevel).toHaveLength(spellLevels)
    expect(SPELL_DAMAGE.oneTargetD10).toHaveLength(spellLevels)
    expect(SPELL_DAMAGE.multipleTargetsD6).toHaveLength(spellLevels)
  })

  it('names a page for every source', () => {
    for (const source of CITATIONS) expect(source.page).toMatch(/^\d+(-\d+)?$/)
  })
})
