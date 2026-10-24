import { describe, expect, it } from 'vitest'

import {
  MAX_ENERGY_COST,
  poolMaximum,
  RANKS,
  type RankGate,
  rankFor,
  unitsFor,
} from '../../src/lib/game/resources'

const GATE_ORDER: readonly RankGate[] = ['none', 'long-rest', 'karma-and-long-rest']

describe('the rank table', () => {
  for (const rank of RANKS) {
    it(`gives rank ${rank.rank} its own Unités for its own Énergie`, () => {
      expect(unitsFor(rank.energy)).toBe(rank.units)
    })
  }

  it('keeps the bonus of the rank below for a cost between two ranks', () => {
    for (let energy = 1; energy <= MAX_ENERGY_COST; energy += 1) {
      const below = RANKS.filter((rank) => rank.energy <= energy).at(-1)
      const bonus = below ? below.units - below.energy : 0
      expect(unitsFor(energy), `${energy} Énergie`).toBe(energy + bonus)
    }
  })

  it('counts a cost between two ranks as the rank below, and a single Énergie as no rank', () => {
    for (let energy = 1; energy <= MAX_ENERGY_COST; energy += 1) {
      const below = RANKS.filter((rank) => rank.energy <= energy).at(-1)
      expect(rankFor(energy), `${energy} Énergie`).toBe(below)
    }
    const lowest = Math.min(...RANKS.map((rank) => rank.energy))
    expect(rankFor(lowest - 1)).toBeUndefined()
  })

  it('buys more Unités with every Énergie added', () => {
    for (let energy = 1; energy < MAX_ENERGY_COST; energy += 1) {
      expect(unitsFor(energy + 1)).toBeGreaterThan(unitsFor(energy))
    }
  })

  it('never lowers the cost, the Unités or the gate as the rank rises', () => {
    for (let index = 1; index < RANKS.length; index += 1) {
      const lower = RANKS[index - 1]
      const higher = RANKS[index]
      if (!lower || !higher) throw new Error('a rank is missing')
      expect(higher.energy).toBeGreaterThan(lower.energy)
      expect(higher.units).toBeGreaterThan(lower.units)
      expect(GATE_ORDER.indexOf(higher.gate)).toBeGreaterThanOrEqual(GATE_ORDER.indexOf(lower.gate))
    }
  })

  it('caps the Énergie of a Compétence at the dearest rank', () => {
    expect(MAX_ENERGY_COST).toBe(Math.max(...RANKS.map((rank) => rank.energy)))
  })
})

describe('a pool maximum', () => {
  it('adds the base, the Caractéristique, the Niveau and their product', () => {
    const formula = { base: 3, perCharacteristic: 2, perLevel: 5, perCharacteristicPerLevel: 1 }
    expect(poolMaximum(formula, 0, 0)).toBe(3)
    expect(poolMaximum(formula, 2, 0)).toBe(7)
    expect(poolMaximum(formula, 2, 4)).toBe(3 + 4 + 20 + 8)
  })
})
