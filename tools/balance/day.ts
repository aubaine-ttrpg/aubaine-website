import {
  POOLS,
  type PoolFormula,
  poolMaximum,
  RANKS,
  RESOURCE_POOLS,
  type ResourcePool,
} from '../../src/lib/game/resources.ts'
import { type Amount, attackDamage, successChance } from './dice.ts'
import { atLevel, LAST_LEVEL, monsterAt, PROFICIENCY_BONUS } from './reference-curves.ts'

export const UNIT_DAMAGE = 5.5

export function dayTotal(maximum: number, shortRests: number): number {
  return maximum + shortRests * Math.floor(maximum / 2)
}

export type Build = Record<ResourcePool, number>

export type BuildShape = 'focused' | 'two-way' | 'three-way'

export function buildShape(build: Build): BuildShape {
  const invested = RESOURCE_POOLS.filter((pool) => build[pool] > 0).length
  if (invested <= 1) return 'focused'
  return invested === 2 ? 'two-way' : 'three-way'
}

export function representativeSplits(points: number, cap: number): Build[] {
  const third = Math.floor(points / 3)
  const half = Math.floor(points / 2)
  const candidates: Build[] = [
    { vitality: points, memory: 0, energy: 0 },
    { vitality: 0, memory: points, energy: 0 },
    { vitality: 0, memory: 0, energy: points },
    { vitality: half, memory: 0, energy: points - half },
    { vitality: half, memory: points - half, energy: 0 },
    { vitality: 0, memory: half, energy: points - half },
    { vitality: third, memory: third, energy: points - 2 * third },
  ]
  const seen = new Set<string>()
  return candidates.filter((build) => {
    const key = `${build.vitality}/${build.memory}/${build.energy}`
    const fits = RESOURCE_POOLS.every((pool) => build[pool] <= cap)
    if (!fits || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export type JetAssumption = { kind: 'fixed'; bonus: number } | { kind: 'srd'; modifier: number }

export function jetAt(jet: JetAssumption, challenge: number): number {
  if (jet.kind === 'fixed') return jet.bonus
  const level = Math.min(Math.max(Math.round(challenge), 1), LAST_LEVEL)
  return jet.modifier + atLevel(PROFICIENCY_BONUS, level)
}

export type DayAssumptions = {
  characteristic: number
  jet: JetAssumption
  weapon: Amount
  encounters: number
  shortRests: number
  roundsPerEncounter: number
  partySize: number
  formulas: Record<ResourcePool, PoolFormula>
}

export function currentFormulas(): Record<ResourcePool, PoolFormula> {
  return {
    vitality: POOLS.vitality.formula,
    memory: POOLS.memory.formula,
    energy: POOLS.energy.formula,
  }
}

export type DayProfile = {
  build: Build
  shape: BuildShape
  challenge: number
  vitalityMaximum: number
  vitalityPerDay: number
  memory: number
  energyMaximum: number
  energyPerDay: number
  energyPerEncounter: number
  highestRank: number
  sustainedRank: number
  jet: number
  unitsPerEncounter: number
  skillDamagePerEncounter: number
  weaponDamagePerEncounter: number
  roundsAbsorbed: number
  dayRounds: number
}

export function highestPayableRank(energyMaximum: number, ungatedOnly: boolean): number {
  return RANKS.filter(
    (rank) => rank.energy <= energyMaximum && (!ungatedOnly || rank.gate === 'none'),
  ).reduce((highest, rank) => Math.max(highest, rank.rank), 0)
}

function unitsPerEnergy(rank: number): number {
  const row = RANKS.find((candidate) => candidate.rank === rank)
  return row ? row.units / row.energy : 1
}

export function dayProfile(build: Build, assumptions: DayAssumptions): DayProfile {
  const { characteristic, weapon, encounters, shortRests, roundsPerEncounter, partySize } =
    assumptions
  const { formulas } = assumptions
  const points = build.vitality + build.memory + build.energy
  const challenge = Math.max(1, points / RESOURCE_POOLS.length)
  const monster = monsterAt(challenge)
  const vitalityMaximum = poolMaximum(formulas.vitality, characteristic, build.vitality)
  const vitalityPerDay = dayTotal(vitalityMaximum, shortRests)
  const energyMaximum = poolMaximum(formulas.energy, characteristic, build.energy)
  const energyPerDay = dayTotal(energyMaximum, shortRests)
  const energyPerEncounter = energyPerDay / encounters
  const highestRank = highestPayableRank(energyMaximum, false)
  const sustainedRank = highestPayableRank(energyMaximum, true)
  const unitsPerEncounter = energyPerEncounter * unitsPerEnergy(sustainedRank)
  const jet = jetAt(assumptions.jet, challenge)
  const hit = successChance(jet, monster.armourClass, 0)
  const [low, high] = monster.damagePerRound
  const incomingPerRound = (low + high) / 2 / partySize
  const weaponRound = attackDamage({
    bonus: jet,
    armourClass: monster.armourClass,
    edge: 0,
    damage: weapon,
    characteristic,
  })
  return {
    build,
    shape: buildShape(build),
    challenge,
    vitalityMaximum,
    vitalityPerDay,
    memory: poolMaximum(formulas.memory, characteristic, build.memory),
    energyMaximum,
    energyPerDay,
    energyPerEncounter,
    highestRank,
    sustainedRank,
    jet,
    unitsPerEncounter,
    skillDamagePerEncounter: unitsPerEncounter * UNIT_DAMAGE * hit,
    weaponDamagePerEncounter: weaponRound * roundsPerEncounter,
    roundsAbsorbed: vitalityPerDay / incomingPerRound,
    dayRounds: encounters * roundsPerEncounter,
  }
}
