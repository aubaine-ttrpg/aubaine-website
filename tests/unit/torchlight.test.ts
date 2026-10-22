import { describe, expect, it } from 'vitest'

import { aimAt } from '../../src/scripts/torchlight'

const fresque = { left: 100, top: 200, width: 768, height: 256 }

describe('torchlight aim', () => {
  it('puts the light under a pointer at the centre of the fresque', () => {
    const aim = aimAt(fresque, { x: 100 + 384, y: 200 + 128 })
    expect(aim.x).toBeCloseTo(0.5)
    expect(aim.y).toBeCloseTo(0.5)
  })

  it('follows a pointer that moves across the fresque', () => {
    const left = aimAt(fresque, { x: 100 + 200, y: 328 })
    const right = aimAt(fresque, { x: 100 + 560, y: 328 })
    expect(left.x).toBeLessThan(right.x)
    expect(left.x).toBeGreaterThan(0.2)
    expect(right.x).toBeLessThan(0.8)
  })

  it('keeps the light inside the fresque however far the pointer goes', () => {
    for (const pointer of [
      { x: -5000, y: -5000 },
      { x: 9000, y: 9000 },
      { x: 484, y: -3000 },
      { x: -40, y: 328 },
    ]) {
      const aim = aimAt(fresque, pointer)
      expect(aim.x).toBeGreaterThan(0.07)
      expect(aim.x).toBeLessThan(0.93)
      expect(aim.y).toBeGreaterThan(0.15)
      expect(aim.y).toBeLessThan(0.85)
    }
  })

  it('leans toward a pointer outside the fresque instead of jumping back', () => {
    const near = aimAt(fresque, { x: 100 + 768 + 40, y: 328 })
    const far = aimAt(fresque, { x: 100 + 768 + 600, y: 328 })
    expect(near.x).toBeGreaterThan(0.7)
    expect(far.x).toBeGreaterThan(near.x)
  })
})
