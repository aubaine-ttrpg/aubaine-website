import { describe, expect, it } from 'vitest'

import { badgedStatus, inheritedStatus, mostProvisional } from '../../src/lib/game/status'

describe('mostProvisional', () => {
  it('ignores owners that declare nothing', () => {
    expect(mostProvisional([undefined, undefined])).toBeUndefined()
    expect(mostProvisional([])).toBeUndefined()
  })

  it('prefers draft over playtest over beta over balanced', () => {
    expect(mostProvisional(['balanced', 'beta', 'playtest', 'draft'])).toBe('draft')
    expect(mostProvisional(['balanced', 'beta', 'playtest'])).toBe('playtest')
    expect(mostProvisional(['balanced', 'beta'])).toBe('beta')
    expect(mostProvisional(['balanced'])).toBe('balanced')
  })

  it('does not depend on the order of its owners', () => {
    expect(mostProvisional(['playtest', 'beta'])).toBe(mostProvisional(['beta', 'playtest']))
    expect(mostProvisional(['draft', 'playtest'])).toBe(mostProvisional(['playtest', 'draft']))
  })
})

describe('inheritedStatus', () => {
  it('lets an entry override every owner', () => {
    expect(inheritedStatus('beta', [['playtest'], ['playtest']])).toBe('beta')
  })

  it('lets balanced suppress a playtest owner', () => {
    expect(inheritedStatus('balanced', [['playtest']])).toBe('balanced')
  })

  it('lets a draft tree mark every skill it places', () => {
    expect(inheritedStatus(undefined, [['draft'], ['beta']])).toBe('draft')
    expect(inheritedStatus('balanced', [['draft']])).toBe('balanced')
  })

  it('takes the first rung that declares anything', () => {
    expect(inheritedStatus(undefined, [['beta'], ['playtest']])).toBe('beta')
    expect(inheritedStatus(undefined, [[], ['playtest']])).toBe('playtest')
    expect(inheritedStatus(undefined, [[undefined], [undefined], ['beta']])).toBe('beta')
  })

  it('takes the most provisional owner inside one rung', () => {
    expect(inheritedStatus(undefined, [['balanced', 'playtest']])).toBe('playtest')
  })

  it('yields nothing when no owner declares anything', () => {
    expect(inheritedStatus(undefined, [[], [], []])).toBeUndefined()
    expect(inheritedStatus(undefined, [])).toBeUndefined()
  })
})

describe('badgedStatus', () => {
  it('badges every provisional value and nothing else', () => {
    expect(badgedStatus('draft')).toBe('draft')
    expect(badgedStatus('playtest')).toBe('playtest')
    expect(badgedStatus('beta')).toBe('beta')
    expect(badgedStatus('balanced')).toBeUndefined()
    expect(badgedStatus(undefined)).toBeUndefined()
  })
})
