import { describe, expect, it } from 'vitest'

import { skillTree } from '../../src/lib/game/schema'

const MARCHAND_PROFILE = {
  damage: 'D',
  toughness: 'F',
  healing: 'C',
  utility: 'A',
  freeform: 'S',
  roleplay: 'S',
}

const tree = (fields: Record<string, unknown>) => ({
  id: 'marchand',
  status: 'draft',
  name: 'Marchand',
  treeType: 'archetype',
  size: 16,
  placements: [],
  ...fields,
})

describe('the profile of a tree', () => {
  it('accepts all six axes ranked from F to S', () => {
    expect(skillTree.safeParse(tree({ profile: MARCHAND_PROFILE })).success).toBe(true)
  })

  it('refuses a profile missing an axis', () => {
    const { roleplay: _, ...five } = MARCHAND_PROFILE
    const parsed = skillTree.safeParse(tree({ profile: five }))
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['profile.roleplay'])
  })

  it('refuses a rank outside F, D, C, B, A and S', () => {
    const parsed = skillTree.safeParse(tree({ profile: { ...MARCHAND_PROFILE, damage: 'E' } }))
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['profile.damage'])
  })

  it('refuses an axis it does not declare', () => {
    const parsed = skillTree.safeParse(tree({ profile: { ...MARCHAND_PROFILE, difficulty: 'C' } }))
    expect(parsed.success).toBe(false)
  })

  it('stays optional', () => {
    expect(skillTree.safeParse(tree({})).success).toBe(true)
  })
})

describe('the descriptors of a tree', () => {
  it('accepts one to four distinct keys', () => {
    expect(skillTree.safeParse(tree({ descriptors: ['buys', 'sells', 'trades'] })).success).toBe(
      true,
    )
  })

  it('refuses an empty list, a fifth key and a repeated key', () => {
    for (const descriptors of [
      [],
      ['buys', 'sells', 'trades', 'lends', 'hoards'],
      ['buys', 'buys'],
    ]) {
      expect(skillTree.safeParse(tree({ descriptors })).success, descriptors.join(',')).toBe(false)
    }
  })
})
