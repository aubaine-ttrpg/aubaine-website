import { describe, expect, it } from 'vitest'

import {
  attackDamage,
  criticalChance,
  distribution,
  mean,
  meanHalvedDown,
  parseAmount,
  savedDamage,
  successChance,
} from '../../tools/balance/dice'

function keptFaces(edge: number): number[] {
  const dice = Math.abs(edge) + 1
  let rolls: number[][] = [[]]
  for (let die = 0; die < dice; die += 1) {
    rolls = rolls.flatMap((roll) => Array.from({ length: 20 }, (_, face) => [...roll, face + 1]))
  }
  return rolls.map((roll) => (edge >= 0 ? Math.max(...roll) : Math.min(...roll)))
}

function enumeratedSuccess(bonus: number, defence: number, edge: number): number {
  const kept = keptFaces(edge)
  const successes = kept.filter((face) => face === 20 || (face > 1 && face + bonus >= defence))
  return successes.length / kept.length
}

describe('dice amounts', () => {
  it('reads dice and plain numbers, and refuses anything else', () => {
    expect(parseAmount('4d8')).toEqual({ count: 4, sides: 8, flat: 0 })
    expect(parseAmount('6')).toEqual({ count: 0, sides: 0, flat: 6 })
    expect(() => parseAmount('d8')).toThrow()
  })

  for (const [count, sides] of [
    [1, 4],
    [2, 6],
    [3, 10],
    [4, 8],
  ] as const) {
    it(`gives ${count}d${sides} an exact distribution over its range`, () => {
      const totals = distribution({ count, sides, flat: 0 })
      const chances = [...totals.values()].reduce((sum, chance) => sum + chance, 0)
      expect(chances).toBeCloseTo(1, 12)
      expect(Math.min(...totals.keys())).toBe(count)
      expect(Math.max(...totals.keys())).toBe(count * sides)
      const expected = [...totals].reduce((sum, [total, chance]) => sum + total * chance, 0)
      expect(mean({ count, sides, flat: 0 })).toBeCloseTo(expected, 12)
      expect(mean({ count, sides, flat: 0 })).toBe((count * (sides + 1)) / 2)
    })
  }

  it('halves each total and rounds it down before averaging', () => {
    expect(meanHalvedDown({ count: 1, sides: 6, flat: 0 })).toBeCloseTo((0 + 1 + 1 + 2 + 2 + 3) / 6)
  })
})

describe('the kept die', () => {
  for (const edge of [-2, -1, 0, 1, 2]) {
    it(`matches every roll enumerated with an edge of ${edge}`, () => {
      for (const [bonus, defence] of [
        [5, 10],
        [5, 15],
        [8, 20],
        [0, 25],
      ] as const) {
        expect(successChance(bonus, defence, edge)).toBeCloseTo(
          enumeratedSuccess(bonus, defence, edge),
          12,
        )
      }
    })
  }

  it('rises with every Avantage and falls with every Désavantage', () => {
    const chances = [-2, -1, 0, 1, 2].map((edge) => successChance(5, 15, edge))
    expect(chances).toEqual([...chances].sort((left, right) => left - right))
    expect(new Set(chances).size).toBe(chances.length)
  })

  it('succeeds on a natural 20 and fails on a natural 1, whatever the numbers', () => {
    expect(successChance(0, 100, 0)).toBeCloseTo(1 / 20)
    expect(successChance(100, 1, 0)).toBeCloseTo(19 / 20)
  })

  it('keeps a natural 20 more often with every Avantage', () => {
    expect(criticalChance(0)).toBeCloseTo(1 / 20)
    expect(criticalChance(1)).toBeCloseTo(1 - (19 / 20) ** 2)
  })
})

describe('expected damage', () => {
  const damage = { count: 2, sides: 6, flat: 0 }

  it('doubles the dice and the Caractéristique on a critical hit', () => {
    const onlyCriticals = attackDamage({
      bonus: 0,
      armourClass: 100,
      edge: 0,
      damage,
      characteristic: 3,
    })
    expect(onlyCriticals).toBeCloseTo((1 / 20) * 2 * (7 + 3))
  })

  it('takes everything on a failed save, half on a success and nothing on a natural 20', () => {
    const neverSaves = savedDamage({
      saveBonus: 0,
      difficulty: 100,
      edge: 0,
      damage,
      halfOnSuccess: true,
    })
    expect(neverSaves).toBeCloseTo((19 / 20) * 7)
    const alwaysSaves = savedDamage({
      saveBonus: 100,
      difficulty: 1,
      edge: 0,
      damage,
      halfOnSuccess: true,
    })
    expect(alwaysSaves).toBeCloseTo((1 / 20) * 7 + (18 / 20) * meanHalvedDown(damage))
  })
})
