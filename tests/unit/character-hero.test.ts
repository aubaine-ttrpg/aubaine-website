import { describe, expect, it } from 'vitest'

import { leanToward } from '../../src/scripts/character-hero'

const CARD = { left: 100, top: 200, width: 300, height: 400 }
const centre = { x: 250, y: 400 }

describe('the lean of the hero card toward the pointer', () => {
  it('rests flat when the pointer is over the centre of the card', () => {
    const { x, y } = leanToward(CARD, centre)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
  })

  it('leans toward the side the pointer is on', () => {
    expect(leanToward(CARD, { x: 400, y: 400 }).x).toBeGreaterThan(0)
    expect(leanToward(CARD, { x: 100, y: 400 }).x).toBeLessThan(0)
    expect(leanToward(CARD, { x: 250, y: 600 }).y).toBeGreaterThan(0)
    expect(leanToward(CARD, { x: 250, y: 200 }).y).toBeLessThan(0)
  })

  it('leans further as the pointer moves away', () => {
    const near = leanToward(CARD, { x: 300, y: 400 }).x
    const far = leanToward(CARD, { x: 380, y: 400 }).x
    expect(far).toBeGreaterThan(near)
  })

  it('never reaches a full lean, however far the pointer goes', () => {
    for (const pointer of [
      { x: -5000, y: -5000 },
      { x: 5000, y: 5000 },
    ]) {
      const { x, y } = leanToward(CARD, pointer)
      expect(Math.abs(x)).toBeLessThan(1)
      expect(Math.abs(y)).toBeLessThan(1)
    }
  })
})
