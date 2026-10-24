import {
  type PoolFormula,
  poolMaximum,
  RANKS,
  type RankGate,
} from '../../src/lib/game/resources.ts'
import type { Skill } from '../../src/lib/game/schema.ts'
import { dayTotal, UNIT_DAMAGE } from './day.ts'
import { successChance } from './dice.ts'
import { atLevel, HIGHEST_SPELL_LEVEL, LEVELS, SPELL_DAMAGE } from './reference-curves.ts'

export const ZONE_DIE_MEAN = 3.5

export type RankRow = {
  rank: number
  energy: number
  units: number
  unitsPerEnergy: number
  singleTargetDamage: number
  zoneDice: number
  zoneDamage: number
  gate: RankGate
}

export function rankTable(): RankRow[] {
  return RANKS.map((rank) => {
    const zoneDice = SPELL_DAMAGE.multipleTargetsD6[rank.rank - 1] ?? 0
    return {
      rank: rank.rank,
      energy: rank.energy,
      units: rank.units,
      unitsPerEnergy: rank.units / rank.energy,
      singleTargetDamage: rank.units * UNIT_DAMAGE,
      zoneDice,
      zoneDamage: zoneDice * ZONE_DIE_MEAN,
      gate: rank.gate,
    }
  })
}

export function firstPayableLevel(
  energy: number,
  formula: PoolFormula,
  characteristic: number,
  cap: number,
): number | undefined {
  for (let level = 0; level <= cap; level += 1) {
    if (poolMaximum(formula, characteristic, level) >= energy) return level
  }
  return undefined
}

export function firstSpellLevelAccess(rank: number): number | undefined {
  return LEVELS.find((level) => atLevel(HIGHEST_SPELL_LEVEL, level) >= rank)
}

export type LimitPeriod = NonNullable<Skill['limit']>['per']

export type DayShape = {
  encounters: number
  roundsPerEncounter: number
  shortRests: number
  wakingHours: number
}

export function usesPerDay(limit: NonNullable<Skill['limit']>, day: DayShape): number {
  const periods: Record<LimitPeriod, number> = {
    turn: day.encounters * day.roundsPerEncounter,
    combat: day.encounters,
    hour: day.wakingHours,
    'short-rest': 1 + day.shortRests,
    'long-rest': 1,
  }
  return limit.times * periods[limit.per]
}

export function vitalityPerEnergy(
  vitality: PoolFormula,
  energy: PoolFormula,
  characteristic: number,
  level: number,
  shortRests: number,
): number {
  const life = dayTotal(poolMaximum(vitality, characteristic, level), shortRests)
  return life / dayTotal(poolMaximum(energy, characteristic, level), shortRests)
}

export function karmaRescueChance(bonus: number, defence: number): number {
  return successChance(bonus, defence, 0)
}
