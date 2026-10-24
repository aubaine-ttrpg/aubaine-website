import type { PoolFormula } from '../../src/lib/game/resources.ts'
import type { RankRow } from './budget.ts'
import type { DayProfile } from './day.ts'
import type { SkillMeasure } from './entries.ts'
import type { Candidate, PoolTarget } from './pools.ts'
import type { Citation } from './reference-curves.ts'

export function number(value: number, digits = 1): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits)
}

export function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function table(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const line = (cells: readonly string[]) => `| ${cells.join(' | ')} |`
  return [line(headers), line(headers.map(() => '---')), ...rows.map(line)].join('\n')
}

export function citation(source: Citation): string {
  return `${source.document} p.${source.page}, « ${source.table} »`
}

export function header(command: string, assumptions: readonly string[]): string {
  return [
    '# Balance report',
    '',
    `Command: \`${command}\``,
    '',
    '## Assumptions',
    '',
    ...assumptions.map((assumption) => `- ${assumption}`),
  ].join('\n')
}

export function sources(citations: readonly Citation[]): string {
  return ['## Sources', '', ...citations.map((source) => `- ${citation(source)}`)].join('\n')
}

export function formulaText(formula: PoolFormula): string {
  const terms = [
    String(formula.base),
    formula.perCharacteristic ? `${formula.perCharacteristic} × CAR` : '',
    formula.perLevel ? `${formula.perLevel} × Niveau` : '',
    formula.perCharacteristicPerLevel ? `${formula.perCharacteristicPerLevel} × CAR × Niveau` : '',
  ]
  return terms.filter((term) => term !== '').join(' + ')
}

export type PoolComparison = {
  target: PoolTarget
  label: string
  formula: PoolFormula
  levels: readonly number[]
  characteristics: readonly number[]
  levelEquivalent: (value: number, characteristic: number) => number
}

export function poolComparison(comparison: PoolComparison): string {
  const { target, label, formula, levels, characteristics } = comparison
  const rows = characteristics.flatMap((characteristic) =>
    levels.map((level) => {
      const value = target.measured(formula, characteristic, level)
      const expected = level === 0 ? '' : number(target.target(characteristic, level))
      return [
        String(characteristic),
        String(level),
        number(value),
        expected,
        number(comparison.levelEquivalent(value, characteristic)),
      ]
    }),
  )
  return [
    `### ${label}: \`${formulaText(formula)}\``,
    '',
    target.name,
    '',
    table(['CAR', 'Niveau', 'Aubaine', 'SRD target', 'SRD level equivalent'], rows),
  ].join('\n')
}

export function candidateTable(
  target: PoolTarget,
  candidates: readonly Candidate[],
  levels: readonly number[],
  characteristics: readonly number[],
): string {
  const valueHeaders = characteristics.flatMap((characteristic) =>
    levels.map((level) => `CAR ${characteristic} N${level}`),
  )
  const rows = candidates.map((candidate) => [
    `\`${formulaText(candidate.formula)}\``,
    candidate.family,
    percent(candidate.error.mean),
    percent(candidate.error.worst),
    ...characteristics.flatMap((characteristic) =>
      levels.map((level) => number(target.measured(candidate.formula, characteristic, level))),
    ),
  ])
  return [
    `### Candidates: ${target.name}`,
    '',
    table(['Formula', 'Family', 'Mean error', 'Worst error', ...valueHeaders], rows),
  ].join('\n')
}

export type RankAccess = {
  rank: number
  payableAt: number | undefined
  srdLevel: number | undefined
}

export function rankSection(rows: readonly RankRow[], access: readonly RankAccess[]): string {
  const accessOf = new Map(access.map((entry) => [entry.rank, entry]))
  return [
    '## Ranks',
    '',
    table(
      [
        'Rank',
        'Énergie',
        'Unités',
        'Unités per Énergie',
        'One target (mean)',
        'Zone dice',
        'Zone (mean)',
        'Gate',
        'First Niveau that pays it',
        'First SRD level with that spell level',
      ],
      rows.map((row) => [
        String(row.rank),
        String(row.energy),
        String(row.units),
        number(row.unitsPerEnergy, 2),
        number(row.singleTargetDamage),
        `${row.zoneDice}d6`,
        number(row.zoneDamage),
        row.gate,
        String(accessOf.get(row.rank)?.payableAt ?? 'never'),
        String(accessOf.get(row.rank)?.srdLevel ?? ''),
      ]),
    ),
  ].join('\n')
}

export type ExchangeRow = { level: number; vitalityPerEnergy: number }

export type LimitRow = { limit: string; usesPerDay: number }

export type KarmaRow = { bonus: number; defence: number; rescue: number }

export function exchangeSection(
  exchange: readonly ExchangeRow[],
  limits: readonly LimitRow[],
  karma: readonly KarmaRow[],
): string {
  return [
    '## Exchange rates',
    '',
    '### PdV per Énergie, a day of each at the same Niveau',
    '',
    table(
      ['Niveau', 'PdV per Énergie'],
      exchange.map((row) => [String(row.level), number(row.vitalityPerEnergy, 2)]),
    ),
    '',
    '### Uses per day of a limit',
    '',
    table(
      ['Limit', 'Uses per day'],
      limits.map((row) => [row.limit, number(row.usesPerDay)]),
    ),
    '',
    '### Karma spent after a failed Jet: chance it becomes a success',
    '',
    table(
      ['Jet bonus', 'Defence', 'Rescue chance'],
      karma.map((row) => [String(row.bonus), String(row.defence), percent(row.rescue)]),
    ),
  ].join('\n')
}

export function buildSection(points: number, profiles: readonly DayProfile[]): string {
  return [
    `### ${points} PP`,
    '',
    table(
      [
        'Vitalité/Mémoire/Énergie',
        'Shape',
        'CR',
        'PdV max',
        'PdV per day',
        'Mémoire',
        'Énergie max',
        'Énergie per day',
        'Énergie per encounter',
        'Highest rank',
        'Sustained rank',
        'Jet',
        'Skill damage per encounter',
        'Weapon damage per encounter',
        'Rounds absorbed',
        'Rounds in the day',
      ],
      profiles.map((profile) => [
        `${profile.build.vitality}/${profile.build.memory}/${profile.build.energy}`,
        profile.shape,
        number(profile.challenge),
        number(profile.vitalityMaximum),
        number(profile.vitalityPerDay),
        number(profile.memory),
        number(profile.energyMaximum),
        number(profile.energyPerDay),
        number(profile.energyPerEncounter),
        String(profile.highestRank),
        String(profile.sustainedRank),
        String(profile.jet),
        number(profile.skillDamagePerEncounter),
        number(profile.weaponDamagePerEncounter),
        number(profile.roundsAbsorbed),
        String(profile.dayRounds),
      ]),
    ),
  ].join('\n')
}

function cost(measure: SkillMeasure): string {
  const parts = [
    measure.energy === undefined ? '' : `${measure.energy} Énergie`,
    measure.karma === undefined ? '' : `${measure.karma} Karma`,
    measure.life === undefined ? '' : `${measure.life} PdV`,
    measure.limit === undefined ? '' : `${measure.limit.times}/${measure.limit.per}`,
  ].filter((part) => part !== '')
  return parts.length === 0 ? 'none' : parts.join(' + ')
}

export function entrySection(measures: readonly SkillMeasure[]): string {
  return [
    '## Entries',
    '',
    table(
      [
        'Id',
        'Title',
        'Type',
        'Status',
        'Tier',
        'Activation',
        'Cost',
        'Rank',
        'Budget Unités',
        'Damage',
        'Delivered Unités',
        'Names a Sauvegarde',
        'Names an Attaque',
        'Unparsed dice',
        '0 resource',
      ],
      measures.map((measure) => [
        measure.id,
        measure.title,
        measure.type,
        measure.status,
        String(measure.tier),
        measure.activation ?? '',
        cost(measure),
        measure.rank === undefined ? '' : String(measure.rank),
        measure.budgetUnits === undefined ? '' : String(measure.budgetUnits),
        measure.damage.map((roll) => `${roll.amount} ${roll.key}`).join(', '),
        number(measure.deliveredUnits, 2),
        measure.namesSave ? 'yes' : '',
        measure.namesAttack ? 'yes' : '',
        measure.unparsedDice.join(', '),
        measure.zeroResource ? 'yes' : '',
      ]),
    ),
  ].join('\n')
}
