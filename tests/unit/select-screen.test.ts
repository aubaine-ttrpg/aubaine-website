import { describe, expect, it } from 'vitest'

import { firstShown, stepAmong } from '../../src/scripts/select-screen'

describe('the arrows of a select screen', () => {
  const shown = ['alpha', 'beta', 'gamma']

  it('step to the next and the previous shown card', () => {
    expect(stepAmong(shown, 'beta', 1)).toBe('gamma')
    expect(stepAmong(shown, 'beta', -1)).toBe('alpha')
  })

  it('wrap around both ends', () => {
    expect(stepAmong(shown, 'gamma', 1)).toBe('alpha')
    expect(stepAmong(shown, 'alpha', -1)).toBe('gamma')
  })

  it('start from an end when the selected card was filtered out', () => {
    expect(stepAmong(shown, 'delta', 1)).toBe('alpha')
    expect(stepAmong(shown, 'delta', -1)).toBe('gamma')
    expect(stepAmong(shown, undefined, 1)).toBe('alpha')
  })

  it('have nowhere to go when nothing is shown', () => {
    expect(stepAmong([], 'alpha', 1)).toBeUndefined()
  })
})

describe('the entry a select screen falls back to', () => {
  it('is the first of its lead order that is still shown', () => {
    expect(firstShown(['delta', 'beta', 'alpha'], new Set(['alpha', 'beta']))).toBe('beta')
  })

  it('is absent when every card is hidden', () => {
    expect(firstShown(['alpha'], new Set())).toBeUndefined()
  })
})
