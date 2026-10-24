export const RESOURCE_POOLS = ['vitality', 'memory', 'energy'] as const

export type ResourcePool = (typeof RESOURCE_POOLS)[number]

export type PoolFormula = {
  base: number
  perCharacteristic: number
  perLevel: number
  perCharacteristicPerLevel: number
}

export type PoolRule = {
  term: string
  characteristic: string
  formula: PoolFormula
}

export const POOLS: Record<ResourcePool, PoolRule> = {
  vitality: {
    term: 'pdv',
    characteristic: 'constitution',
    formula: { base: 3, perCharacteristic: 0, perLevel: 5, perCharacteristicPerLevel: 1 },
  },
  memory: {
    term: 'memoire',
    characteristic: 'intelligence',
    formula: { base: 4, perCharacteristic: 1, perLevel: 1, perCharacteristicPerLevel: 0 },
  },
  energy: {
    term: 'energie',
    characteristic: 'spirit',
    formula: { base: 0, perCharacteristic: 1, perLevel: 3, perCharacteristicPerLevel: 0 },
  },
}

export const TRACK_CAP = 20

export function poolMaximum(formula: PoolFormula, characteristic: number, level: number): number {
  return (
    formula.base +
    formula.perCharacteristic * characteristic +
    formula.perLevel * level +
    formula.perCharacteristicPerLevel * characteristic * level
  )
}

export type RankGate = 'none' | 'long-rest' | 'karma-and-long-rest'

export type Rank = {
  rank: number
  energy: number
  units: number
  gate: RankGate
}

export const RANKS: readonly Rank[] = [
  { rank: 1, energy: 2, units: 2, gate: 'none' },
  { rank: 2, energy: 3, units: 3, gate: 'none' },
  { rank: 3, energy: 5, units: 5, gate: 'none' },
  { rank: 4, energy: 6, units: 6, gate: 'none' },
  { rank: 5, energy: 7, units: 8, gate: 'none' },
  { rank: 6, energy: 9, units: 10, gate: 'long-rest' },
  { rank: 7, energy: 10, units: 11, gate: 'karma-and-long-rest' },
  { rank: 8, energy: 11, units: 12, gate: 'karma-and-long-rest' },
  { rank: 9, energy: 13, units: 15, gate: 'karma-and-long-rest' },
]

export const MAX_ENERGY_COST = Math.max(...RANKS.map((rank) => rank.energy))

export function rankFor(energy: number): Rank | undefined {
  return RANKS.filter((rank) => rank.energy <= energy).at(-1)
}

export function unitsFor(energy: number): number {
  const below = rankFor(energy)
  return below ? energy + below.units - below.energy : energy
}
