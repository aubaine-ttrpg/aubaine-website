import { type PoolFormula, poolMaximum, type ResourcePool } from '../../src/lib/game/resources.ts'
import { dayTotal } from './day.ts'
import {
  atLevel,
  CANTRIPS,
  type Citation,
  HIT_POINTS,
  type HitDie,
  hitPoints,
  LAST_LEVEL,
  LEVELS,
  PREPARED_BY_MODIFIER,
  PREPARED_SPELLS,
  preparedByModifier,
  SPELL_POINTS,
} from './reference-curves.ts'

export const CHARACTERISTIC_VALUES: readonly number[] = [0, 1, 2, 3, 4, 5, 6]

export type PoolTarget = {
  pool: ResourcePool
  name: string
  citations: readonly Citation[]
  characteristics: readonly number[]
  characteristicWeight: number | undefined
  measured: (formula: PoolFormula, characteristic: number, level: number) => number
  target: (characteristic: number, level: number) => number
}

function poolValue(formula: PoolFormula, characteristic: number, level: number): number {
  return poolMaximum(formula, characteristic, level)
}

export function vitalityTarget(die: HitDie): PoolTarget {
  return {
    pool: 'vitality',
    name: `PdV maximum against SRD hit points on a ${die}, Constitution as the modifier`,
    citations: [HIT_POINTS.citation],
    characteristics: CHARACTERISTIC_VALUES,
    characteristicWeight: undefined,
    measured: poolValue,
    target: (constitution, level) => hitPoints(die, constitution, level),
  }
}

export function energyTarget(
  shortRests: number,
  spirit: number,
  characteristicWeight: number,
): PoolTarget {
  return {
    pool: 'energy',
    name: `Énergie per day with ${shortRests} Repos courts against spell points by level, Esprit ${spirit} worth ${characteristicWeight} each`,
    citations: [SPELL_POINTS.citation],
    characteristics: [spirit],
    characteristicWeight,
    measured: (formula, characteristic, level) =>
      dayTotal(poolMaximum(formula, characteristic, level), shortRests),
    target: (_, level) => atLevel(SPELL_POINTS, level),
  }
}

export type MemoryReference = 'prepared' | 'prepared-and-cantrips' | 'modifier-and-level'

export function memoryTarget(
  reference: MemoryReference,
  intelligence: number,
  characteristicWeight: number,
): PoolTarget {
  if (reference === 'modifier-and-level') {
    return {
      pool: 'memory',
      name: 'Mémoire against prepared spells, Intelligence modifier plus level',
      citations: [PREPARED_BY_MODIFIER.citation],
      characteristics: CHARACTERISTIC_VALUES,
      characteristicWeight: undefined,
      measured: poolValue,
      target: preparedByModifier,
    }
  }
  const withCantrips = reference === 'prepared-and-cantrips'
  return {
    pool: 'memory',
    name: `Mémoire against prepared spells${withCantrips ? ' and cantrips' : ''}, Intelligence ${intelligence} worth ${characteristicWeight} each`,
    citations: withCantrips
      ? [PREPARED_SPELLS.citation, CANTRIPS.citation]
      : [PREPARED_SPELLS.citation],
    characteristics: [intelligence],
    characteristicWeight,
    measured: poolValue,
    target: (_, level) =>
      atLevel(PREPARED_SPELLS, level) + (withCantrips ? atLevel(CANTRIPS, level) : 0),
  }
}

export type FormulaFamily = 'additive' | 'scaled' | 'hybrid'

export const FORMULA_FAMILIES: readonly FormulaFamily[] = ['additive', 'scaled', 'hybrid']

export function familyOf(formula: PoolFormula): FormulaFamily {
  if (formula.perCharacteristicPerLevel === 0) return 'additive'
  return formula.perCharacteristic === 0 ? 'scaled' : 'hybrid'
}

export type FitError = { mean: number; worst: number }

export function fitError(formula: PoolFormula, target: PoolTarget): FitError {
  let sum = 0
  let worst = 0
  let count = 0
  for (const characteristic of target.characteristics) {
    for (const level of LEVELS) {
      const expected = target.target(characteristic, level)
      const error = Math.abs(target.measured(formula, characteristic, level) - expected) / expected
      sum += error
      worst = Math.max(worst, error)
      count += 1
    }
  }
  return { mean: sum / count, worst }
}

export type Candidate = { formula: PoolFormula; family: FormulaFamily; error: FitError }

export type FitBounds = {
  base: number
  perCharacteristic: number
  perLevel: number
  perCharacteristicPerLevel: number
}

export const DEFAULT_BOUNDS: FitBounds = {
  base: 30,
  perCharacteristic: 4,
  perLevel: 10,
  perCharacteristicPerLevel: 2,
}

function range(top: number): number[] {
  return Array.from({ length: top + 1 }, (_, index) => index)
}

function coefficientCount(formula: PoolFormula): number {
  return Object.values(formula).filter((value) => value !== 0).length
}

export function fitCandidates(
  target: PoolTarget,
  floor: number,
  bounds: FitBounds = DEFAULT_BOUNDS,
): Candidate[] {
  const weights =
    target.characteristicWeight === undefined
      ? range(bounds.perCharacteristic)
      : [target.characteristicWeight]
  const candidates: Candidate[] = []
  for (const base of range(bounds.base)) {
    for (const perCharacteristic of weights) {
      for (const perLevel of range(bounds.perLevel)) {
        for (const perCharacteristicPerLevel of range(bounds.perCharacteristicPerLevel)) {
          const formula = { base, perCharacteristic, perLevel, perCharacteristicPerLevel }
          if (poolMaximum(formula, 0, 0) < floor) continue
          candidates.push({ formula, family: familyOf(formula), error: fitError(formula, target) })
        }
      }
    }
  }
  return candidates.sort(
    (left, right) =>
      left.error.mean - right.error.mean ||
      coefficientCount(left.formula) - coefficientCount(right.formula) ||
      left.formula.base - right.formula.base,
  )
}

export function bestByFamily(candidates: readonly Candidate[], perFamily: number): Candidate[] {
  return FORMULA_FAMILIES.flatMap((family) =>
    candidates.filter((candidate) => candidate.family === family).slice(0, perFamily),
  )
}

export function levelEquivalent(value: number, target: PoolTarget, characteristic: number): number {
  const at = (level: number) => target.target(characteristic, level)
  const first = at(1)
  if (value <= first) return first === 0 ? 0 : value / first
  for (const level of LEVELS) {
    if (level === LAST_LEVEL) break
    const low = at(level)
    const high = at(level + 1)
    if (value <= high) return high === low ? level + 1 : level + (value - low) / (high - low)
  }
  const top = at(LAST_LEVEL)
  const slope = top - at(LAST_LEVEL - 1)
  return slope === 0 ? LAST_LEVEL : LAST_LEVEL + (value - top) / slope
}
