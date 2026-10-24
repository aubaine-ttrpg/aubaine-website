import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { readCorpus } from '../../src/lib/game/fs-sources.ts'
import {
  type PoolFormula,
  RANKS,
  RESOURCE_POOLS,
  type ResourcePool,
  TRACK_CAP,
} from '../../src/lib/game/resources.ts'
import {
  firstPayableLevel,
  firstSpellLevelAccess,
  karmaRescueChance,
  type LimitPeriod,
  rankTable,
  usesPerDay,
  vitalityPerEnergy,
} from './budget.ts'
import {
  currentFormulas,
  type DayAssumptions,
  dayProfile,
  type JetAssumption,
  representativeSplits,
} from './day.ts'
import { type Amount, parseAmount } from './dice.ts'
import { measureSkill, type Selection, selectSkills } from './entries.ts'
import {
  bestByFamily,
  energyTarget,
  fitCandidates,
  levelEquivalent,
  type MemoryReference,
  memoryTarget,
  type PoolTarget,
  vitalityTarget,
} from './pools.ts'
import { CITATIONS, HIT_DICE, type HitDie } from './reference-curves.ts'
import {
  buildSection,
  candidateTable,
  entrySection,
  exchangeSection,
  formulaText,
  header,
  poolComparison,
  rankSection,
  sources,
} from './report.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const COMMANDS = ['pools', 'ranks', 'builds', 'entries', 'report'] as const

type Command = (typeof COMMANDS)[number]

const MEMORY_REFERENCES: readonly MemoryReference[] = [
  'prepared',
  'prepared-and-cantrips',
  'modifier-and-level',
]

const LIMIT_PERIODS: readonly LimitPeriod[] = ['turn', 'combat', 'hour', 'short-rest', 'long-rest']

const COMPARED_LEVELS = [0, 1, 3, 5, 10, 15, 20]
const CANDIDATE_LEVELS = [0, 1, 5, 10, 20]
const SHOWN_CHARACTERISTICS = [0, 3, 6]
const EXCHANGE_LEVELS = [1, 5, 10, 15, 20]
const KARMA_BONUSES = [5, 8, 12]
const KARMA_DEFENCES = [10, 15, 20]

function option(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length)
}

function numberOption(name: string, fallback: number): number {
  const raw = option(name)
  if (raw === undefined) return fallback
  const value = Number(raw)
  if (!Number.isFinite(value)) throw new Error(`--${name} expects a number, got « ${raw} »`)
  return value
}

function listOption(name: string, fallback: readonly number[]): number[] {
  const raw = option(name)
  if (raw === undefined) return [...fallback]
  return raw.split(',').map((part) => {
    const value = Number(part)
    if (!Number.isFinite(value)) throw new Error(`--${name} expects numbers, got « ${raw} »`)
    return value
  })
}

function oneOf<Value extends string>(
  name: string,
  values: readonly Value[],
  fallback: Value,
): Value {
  const raw = option(name) ?? fallback
  const found = values.find((value) => value === raw)
  if (!found) throw new Error(`--${name} expects one of ${values.join(', ')}, got « ${raw} »`)
  return found
}

function hitDice(): HitDie[] {
  const raw = option('die')
  if (raw === undefined) return ['d8', 'd10']
  return raw.split(',').map((part) => {
    const die = HIT_DICE.find((candidate) => candidate === part)
    if (!die) throw new Error(`--die expects ${HIT_DICE.join(', ')}, got « ${part} »`)
    return die
  })
}

function formulaOption(pool: ResourcePool, fallback: PoolFormula): PoolFormula {
  const raw = option(pool)
  if (raw === undefined) return fallback
  const [base, perCharacteristic, perLevel, perCharacteristicPerLevel, ...rest] = raw
    .split(',')
    .map(Number)
  if (
    base === undefined ||
    perCharacteristic === undefined ||
    perLevel === undefined ||
    perCharacteristicPerLevel === undefined ||
    rest.length > 0 ||
    [base, perCharacteristic, perLevel, perCharacteristicPerLevel].some(Number.isNaN)
  ) {
    throw new Error(`--${pool} expects base,perCAR,perNiveau,perCARxNiveau, got « ${raw} »`)
  }
  return { base, perCharacteristic, perLevel, perCharacteristicPerLevel }
}

function jetOption(): JetAssumption {
  const raw = option('jet') ?? '5'
  if (raw === 'srd') return { kind: 'srd', modifier: numberOption('jet-modifier', 3) }
  const bonus = Number(raw)
  if (!Number.isFinite(bonus)) throw new Error(`--jet expects a number or srd, got « ${raw} »`)
  return { kind: 'fixed', bonus }
}

function selection(): Selection | undefined {
  const species = option('species')
  if (species) return { kind: 'species', id: species }
  const ids = option('ids')
  return ids ? { kind: 'skills', ids: ids.split(',') } : undefined
}

type Settings = {
  cap: number
  characteristic: number
  shortRests: number
  encounters: number
  rounds: number
  party: number
  jet: JetAssumption
  weapon: Amount
  weaponText: string
  wakingHours: number
  dice: HitDie[]
  energyWeight: number
  memory: MemoryReference
  memoryWeight: number
  floors: Record<ResourcePool, number>
  perFamily: number
  shownCharacteristics: number[]
  points: number[]
  formulas: Record<ResourcePool, PoolFormula>
  selection: Selection | undefined
}

function settings(): Settings {
  const current = currentFormulas()
  const weaponText = option('weapon') ?? '1d8'
  return {
    cap: numberOption('cap', TRACK_CAP),
    characteristic: numberOption('characteristic', 3),
    shortRests: numberOption('short-rests', 2),
    encounters: numberOption('encounters', 5),
    rounds: numberOption('rounds', 3),
    party: numberOption('party', 4),
    jet: jetOption(),
    weapon: parseAmount(weaponText),
    weaponText,
    wakingHours: numberOption('waking-hours', 16),
    dice: hitDice(),
    energyWeight: numberOption('energy-weight', 1),
    memory: oneOf('memory-reference', MEMORY_REFERENCES, 'prepared'),
    memoryWeight: numberOption('memory-weight', 1),
    floors: {
      vitality: numberOption('floor-vitality', 1),
      memory: numberOption('floor-memory', 0),
      energy: numberOption('floor-energy', 0),
    },
    perFamily: numberOption('candidates', 5),
    shownCharacteristics: listOption('characteristics', SHOWN_CHARACTERISTICS),
    points: listOption('pp', [3, 9, 15, 30, 45, 60]),
    formulas: {
      vitality: formulaOption('vitality', current.vitality),
      memory: formulaOption('memory', current.memory),
      energy: formulaOption('energy', current.energy),
    },
    selection: selection(),
  }
}

function jetText(jet: JetAssumption): string {
  return jet.kind === 'fixed'
    ? `Jet bonus ${jet.bonus}`
    : `Jet bonus ${jet.modifier} + the SRD proficiency bonus at level P / 3`
}

function assumptions(current: Settings): string[] {
  return [
    `Track cap: ${current.cap}. Characteristic of the reference character: ${current.characteristic}.`,
    `Day: ${current.encounters} encounters of ${current.rounds} rounds, ${current.shortRests} Repos courts, ${current.wakingHours} waking hours, a party of ${current.party}.`,
    `A Repos court returns half the maximum, rounded down: a day holds max + ${current.shortRests} × floor(max / 2).`,
    `${jetText(current.jet)}, weapon ${current.weaponText} + CAR. A build of P PP faces the CR P / 3 row, at least 1.`,
    'Skill damage per encounter spends the Énergie of an encounter at the Unités per Énergie of the highest rank the maximum pays with no rest or Karma gate, against the CR row AC.',
    ...RESOURCE_POOLS.map(
      (pool) =>
        `${pool} formula measured: \`${formulaText(current.formulas[pool])}\`, floor at Niveau 0 for the fit: ${current.floors[pool]}.`,
    ),
    'One Unité is 1d10, 5.5 on average. A zone die is 1d6, 3.5 on average.',
  ]
}

function targetsFor(current: Settings): PoolTarget[] {
  return [
    ...current.dice.map((die) => vitalityTarget(die)),
    energyTarget(current.shortRests, current.characteristic, current.energyWeight),
    memoryTarget(current.memory, current.characteristic, current.memoryWeight),
  ]
}

function poolsReport(current: Settings): string {
  const parts = targetsFor(current).flatMap((target) => {
    const candidates = bestByFamily(
      fitCandidates(target, current.floors[target.pool]),
      current.perFamily,
    )
    return [
      poolComparison({
        target,
        label: `Rules today, ${target.pool}`,
        formula: current.formulas[target.pool],
        levels: COMPARED_LEVELS,
        characteristics: current.shownCharacteristics,
        levelEquivalent: (value, characteristic) => levelEquivalent(value, target, characteristic),
      }),
      candidateTable(target, candidates, CANDIDATE_LEVELS, current.shownCharacteristics),
    ]
  })
  return ['## Pools', ...parts].join('\n\n')
}

function ranksReport(current: Settings): string {
  const access = RANKS.map((rank) => ({
    rank: rank.rank,
    payableAt: firstPayableLevel(
      rank.energy,
      current.formulas.energy,
      current.characteristic,
      current.cap,
    ),
    srdLevel: firstSpellLevelAccess(rank.rank),
  }))
  const day = {
    encounters: current.encounters,
    roundsPerEncounter: current.rounds,
    shortRests: current.shortRests,
    wakingHours: current.wakingHours,
  }
  const exchange = EXCHANGE_LEVELS.map((level) => ({
    level,
    vitalityPerEnergy: vitalityPerEnergy(
      current.formulas.vitality,
      current.formulas.energy,
      current.characteristic,
      level,
      current.shortRests,
    ),
  }))
  const limits = LIMIT_PERIODS.map((per) => ({
    limit: `1 per ${per}`,
    usesPerDay: usesPerDay({ times: 1, per }, day),
  }))
  const karma = KARMA_BONUSES.flatMap((bonus) =>
    KARMA_DEFENCES.map((defence) => ({
      bonus,
      defence,
      rescue: karmaRescueChance(bonus, defence),
    })),
  )
  return [rankSection(rankTable(), access), exchangeSection(exchange, limits, karma)].join('\n\n')
}

function buildsReport(current: Settings): string {
  const assumptionSet: DayAssumptions = {
    characteristic: current.characteristic,
    jet: current.jet,
    weapon: current.weapon,
    encounters: current.encounters,
    shortRests: current.shortRests,
    roundsPerEncounter: current.rounds,
    partySize: current.party,
    formulas: current.formulas,
  }
  const sections = current.points.map((points) =>
    buildSection(
      points,
      representativeSplits(points, current.cap).map((build) => dayProfile(build, assumptionSet)),
    ),
  )
  return ['## Builds at equal PP', ...sections].join('\n\n')
}

async function entriesReport(current: Settings): Promise<string> {
  if (!current.selection) throw new Error('entries needs --species=<id> or --ids=<A,B>')
  const corpus = await readCorpus(root, 'fr')
  const measures = selectSkills(corpus, current.selection).map((skill) =>
    measureSkill(corpus, skill),
  )
  return entrySection(measures)
}

async function body(command: Command, current: Settings): Promise<string[]> {
  if (command === 'pools') return [poolsReport(current)]
  if (command === 'ranks') return [ranksReport(current)]
  if (command === 'builds') return [buildsReport(current)]
  if (command === 'entries') return [await entriesReport(current)]
  const parts = [poolsReport(current), ranksReport(current), buildsReport(current)]
  return current.selection ? [...parts, await entriesReport(current)] : parts
}

function reportedArguments(): string[] {
  return process.argv.slice(2).filter((argument) => !argument.startsWith('--out='))
}

async function main(): Promise<void> {
  const command = COMMANDS.find((candidate) => candidate === process.argv[2])
  if (!command) throw new Error(`pnpm balance <${COMMANDS.join('|')}> [--option=value]`)
  const current = settings()
  const text = [
    header(`pnpm balance ${reportedArguments().join(' ')}`, assumptions(current)),
    ...(await body(command, current)),
    sources(CITATIONS),
  ].join('\n\n')
  const out = resolve(root, option('out') ?? `tmp/balance/${command}.md`)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, `${text}\n`)
  console.log(out)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
