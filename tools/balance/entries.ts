import type { Corpus } from '../../src/lib/game/build.ts'
import { rankFor, unitsFor } from '../../src/lib/game/resources.ts'
import { references } from '../../src/lib/game/richtext.ts'
import type { ContentStatus, Skill } from '../../src/lib/game/schema.ts'
import { UNIT_DAMAGE } from './day.ts'
import { mean, parseAmount } from './dice.ts'

export type Selection = { kind: 'species'; id: string } | { kind: 'skills'; ids: readonly string[] }

function requiredSkill(corpus: Corpus, id: string): Skill {
  const skill = corpus.skills.get(id)
  if (!skill) throw new Error(`no skill ${id}`)
  return skill
}

export function selectSkills(corpus: Corpus, selection: Selection): Skill[] {
  const start =
    selection.kind === 'species'
      ? speciesPool(corpus, selection.id)
      : selection.ids.map((id) => requiredSkill(corpus, id))
  const chosen = new Map<string, Skill>()
  const queue = [...start]
  for (let skill = queue.shift(); skill; skill = queue.shift()) {
    if (chosen.has(skill.id)) continue
    chosen.set(skill.id, skill)
    for (const granted of skill.grants ?? []) queue.push(requiredSkill(corpus, granted))
  }
  return [...chosen.values()]
}

function speciesPool(corpus: Corpus, id: string): Skill[] {
  const species = corpus.speciesById.get(id)
  if (!species) throw new Error(`no species ${id}`)
  return species.pool
}

const DAMAGE_KEY = /^degats-/
const LONG_ACTIVATION = /minute|heure/i
const DICE = /\b\d+d\d+\b/g
const REFERENCE_SPAN = /\{\{[^}]*\}\}/g

export type DamageRoll = { amount: string; key: string; mean: number }

export type SkillMeasure = {
  id: string
  title: string
  type: Skill['type']
  status: ContentStatus | 'basic'
  tier: number
  energy: number | undefined
  karma: number | undefined
  life: string | undefined
  limit: Skill['limit']
  activation: string | undefined
  damage: DamageRoll[]
  deliveredUnits: number
  rank: number | undefined
  budgetUnits: number | undefined
  unparsedDice: string[]
  namesSave: boolean
  namesAttack: boolean
  zeroResource: boolean
}

function statusOf(corpus: Corpus, skill: Skill, basic: boolean): ContentStatus | 'basic' {
  const status = corpus.skillStatus.get(skill.id)
  if (status) return status
  if (basic) return 'basic'
  throw new Error(`${skill.id} has no status and is not a basic skill`)
}

export function measureSkill(corpus: Corpus, skill: Skill): SkillMeasure {
  const basic = corpus.basic.resolved.some((entry) => entry.id === skill.id)
  const found = references(skill.description)
  const damage = found.flatMap(({ key, amount }) =>
    amount !== undefined && DAMAGE_KEY.test(key)
      ? [{ amount, key, mean: mean(parseAmount(amount)) }]
      : [],
  )
  const keys = new Set(found.map(({ key }) => key))
  const paid =
    (skill.energy ?? 0) > 0 ||
    skill.karma !== undefined ||
    skill.life !== undefined ||
    skill.limit !== undefined ||
    LONG_ACTIVATION.test(skill.activation ?? '')
  return {
    id: skill.id,
    title: skill.title,
    type: skill.type,
    status: statusOf(corpus, skill, basic),
    tier: skill.tier,
    energy: skill.energy,
    karma: skill.karma,
    life: skill.life,
    limit: skill.limit,
    activation: skill.activation,
    damage,
    deliveredUnits: damage.reduce((sum, roll) => sum + roll.mean, 0) / UNIT_DAMAGE,
    rank: skill.energy === undefined ? undefined : rankFor(skill.energy)?.rank,
    budgetUnits: skill.energy === undefined ? undefined : unitsFor(skill.energy),
    unparsedDice: skill.description.replace(REFERENCE_SPAN, '').match(DICE) ?? [],
    namesSave: keys.has('sauvegarde'),
    namesAttack: keys.has('attaque'),
    zeroResource: skill.type === 'active' && !basic && !paid,
  }
}
