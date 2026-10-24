import { describe, expect, it } from 'vitest'

import { firstPayableLevel, usesPerDay } from '../../tools/balance/budget'

describe('when a pool first pays a cost', () => {
  const formula = { base: 2, perCharacteristic: 1, perLevel: 3, perCharacteristicPerLevel: 0 }

  it('returns the first Niveau whose maximum reaches the cost', () => {
    expect(firstPayableLevel(2, formula, 0, 20)).toBe(0)
    expect(firstPayableLevel(11, formula, 0, 20)).toBe(3)
    expect(firstPayableLevel(11, formula, 3, 20)).toBe(2)
  })

  it('returns nothing when the cap comes first', () => {
    expect(firstPayableLevel(100, formula, 0, 5)).toBeUndefined()
  })
})

describe('uses of a limit over a day', () => {
  const day = { encounters: 5, roundsPerEncounter: 3, shortRests: 2, wakingHours: 16 }

  it('counts each period the day holds', () => {
    expect(usesPerDay({ times: 1, per: 'turn' }, day)).toBe(15)
    expect(usesPerDay({ times: 2, per: 'combat' }, day)).toBe(10)
    expect(usesPerDay({ times: 1, per: 'hour' }, day)).toBe(16)
    expect(usesPerDay({ times: 1, per: 'short-rest' }, day)).toBe(3)
    expect(usesPerDay({ times: 3, per: 'long-rest' }, day)).toBe(3)
  })
})
