import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { readCorpus } from '../../src/lib/game/fs-sources'
import type { Skill } from '../../src/lib/game/schema'
import { UNIT_DAMAGE } from '../../tools/balance/day'
import { measureSkill, selectSkills } from '../../tools/balance/entries'

const corpus = await readCorpus(resolve(import.meta.dirname, '../..'), 'fr')

function grantClosure(start: readonly Skill[]): Set<string> {
  const ids = new Set<string>()
  const queue = [...start]
  for (let skill = queue.shift(); skill; skill = queue.shift()) {
    if (ids.has(skill.id)) continue
    ids.add(skill.id)
    for (const id of skill.grants ?? []) {
      const granted = corpus.skills.get(id)
      if (granted) queue.push(granted)
    }
  }
  return ids
}

const granting = corpus.species.find((species) =>
  species.pool.some((skill) => (skill.grants ?? []).length > 0),
)

const settledActive = [...corpus.skills.values()].find(
  (skill) =>
    skill.type === 'active' &&
    corpus.skillStatus.has(skill.id) &&
    !corpus.basic.resolved.some((basic) => basic.id === skill.id),
)

describe('choosing the entries to measure', () => {
  it.runIf(granting)('takes a species pool and everything its Compétences grant', () => {
    if (!granting) return
    const selected = selectSkills(corpus, { kind: 'species', id: granting.id })
    const ids = selected.map((skill) => skill.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(ids)).toEqual(grantClosure(granting.pool))
  })

  it('refuses an id that names no Compétence', () => {
    expect(() => selectSkills(corpus, { kind: 'skills', ids: ['XXXXXX-000'] })).toThrow()
  })
})

describe('measuring a Compétence', () => {
  it.runIf(settledActive)('flags an active that pays nothing, and clears it once it pays', () => {
    if (!settledActive) return
    const free: Skill = {
      ...settledActive,
      activation: '1 Action',
      description: 'La cible subit {{2d6 degats-feu}} et {{1d4 degats-froid}}, puis 3d6 en prose.',
    }
    for (const key of ['energy', 'karma', 'life', 'limit'] as const) delete free[key]
    const measure = measureSkill(corpus, free)
    expect(measure.zeroResource).toBe(true)
    expect(measure.damage.map((roll) => roll.amount)).toEqual(['2d6', '1d4'])
    expect(measure.deliveredUnits).toBeCloseTo((7 + 2.5) / UNIT_DAMAGE)
    expect(measure.unparsedDice).toEqual(['3d6'])
    expect(measureSkill(corpus, { ...free, energy: 2 }).zeroResource).toBe(false)
    expect(
      measureSkill(corpus, { ...free, limit: { times: 1, per: 'long-rest' } }).zeroResource,
    ).toBe(false)
    expect(measureSkill(corpus, { ...free, activation: '10 minutes' }).zeroResource).toBe(false)
  })

  it('never flags a basic Compétence', () => {
    for (const skill of corpus.basic.resolved) {
      expect(measureSkill(corpus, skill).zeroResource, skill.id).toBe(false)
    }
  })
})
