import { describe, expect, it } from 'vitest'

import { type PoolFormula, poolMaximum } from '../../src/lib/game/resources'
import {
  CHARACTERISTIC_VALUES,
  familyOf,
  fitCandidates,
  levelEquivalent,
  type PoolTarget,
  vitalityTarget,
} from '../../tools/balance/pools'
import { HIT_DICE, LEVELS } from '../../tools/balance/reference-curves'

function targetFrom(formula: PoolFormula): PoolTarget {
  return {
    pool: 'vitality',
    name: 'a formula the test chose',
    citations: [],
    characteristics: CHARACTERISTIC_VALUES,
    characteristicWeight: undefined,
    measured: poolMaximum,
    target: (characteristic, level) => poolMaximum(formula, characteristic, level),
  }
}

const smallBounds = { base: 6, perCharacteristic: 2, perLevel: 4, perCharacteristicPerLevel: 1 }

describe('fitting a pool formula', () => {
  for (const formula of [
    { base: 3, perCharacteristic: 1, perLevel: 2, perCharacteristicPerLevel: 0 },
    { base: 5, perCharacteristic: 0, perLevel: 4, perCharacteristicPerLevel: 1 },
    { base: 1, perCharacteristic: 2, perLevel: 3, perCharacteristicPerLevel: 1 },
  ]) {
    it(`finds ${JSON.stringify(formula)} again with no error`, () => {
      const [best] = fitCandidates(targetFrom(formula), 0, smallBounds)
      expect(best?.formula).toEqual(formula)
      expect(best?.error).toEqual({ mean: 0, worst: 0 })
    })
  }

  it('keeps every candidate at or above the floor at Niveau 0', () => {
    const floor = 4
    const candidates = fitCandidates(targetFrom(smallBounds), floor, smallBounds)
    expect(candidates.length).toBeGreaterThan(0)
    for (const candidate of candidates) {
      expect(poolMaximum(candidate.formula, 0, 0)).toBeGreaterThanOrEqual(floor)
    }
  })

  it('sorts the candidates by their mean error', () => {
    const errors = fitCandidates(targetFrom(smallBounds), 0, smallBounds).map(
      (candidate) => candidate.error.mean,
    )
    expect(errors).toEqual([...errors].sort((left, right) => left - right))
  })

  it('names a family by its Caractéristique terms', () => {
    expect(
      familyOf({ base: 1, perCharacteristic: 1, perLevel: 1, perCharacteristicPerLevel: 0 }),
    ).toBe('additive')
    expect(
      familyOf({ base: 1, perCharacteristic: 0, perLevel: 1, perCharacteristicPerLevel: 1 }),
    ).toBe('scaled')
    expect(
      familyOf({ base: 1, perCharacteristic: 1, perLevel: 1, perCharacteristicPerLevel: 1 }),
    ).toBe('hybrid')
  })

  for (const die of HIT_DICE) {
    it(`finds the hit points on a ${die} in the Caractéristique × Niveau family`, () => {
      const [best] = fitCandidates(vitalityTarget(die), 0)
      expect(best?.family).toBe('scaled')
      expect(best?.error.mean).toBe(0)
    })
  }
})

describe('the level a value is worth', () => {
  const target = targetFrom({
    base: 2,
    perCharacteristic: 1,
    perLevel: 3,
    perCharacteristicPerLevel: 0,
  })

  it('returns the level whose target the value equals', () => {
    for (const level of LEVELS) {
      expect(levelEquivalent(target.target(2, level), target, 2)).toBeCloseTo(level, 12)
    }
  })

  it('falls between two levels for a value between their targets', () => {
    const halfway = (target.target(2, 4) + target.target(2, 5)) / 2
    expect(levelEquivalent(halfway, target, 2)).toBeCloseTo(4.5, 12)
  })
})
