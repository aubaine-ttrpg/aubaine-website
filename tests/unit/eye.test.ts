import { describe, expect, it } from 'vitest'

import { glideToward, isSettled, scrolledEye, stepSeconds } from '../../src/scripts/art-effect/eye'

describe('the eye that lights a gilt piece', () => {
  it('climbs from the lower left to the upper right as the page scrolls', () => {
    const entering = scrolledEye(0)
    const leaving = scrolledEye(1)
    expect(leaving.x).toBeGreaterThan(entering.x)
    expect(leaving.y).toBeGreaterThan(entering.y)
  })

  it('takes one display frame for its first step and never more than a tenth of a second', () => {
    expect(stepSeconds(5000, 0)).toBeCloseTo(1 / 60)
    expect(stepSeconds(5016, 5000)).toBeCloseTo(0.016)
    expect(stepSeconds(9000, 5000)).toBe(0.1)
  })

  it('moves part of the way toward its target, more for a longer step', () => {
    const eye = { x: 0, y: 0 }
    const target = { x: 1, y: 1 }
    const short = glideToward(eye, target, 0.016)
    const long = glideToward(eye, target, 0.1)
    expect(short.x).toBeGreaterThan(0)
    expect(short.x).toBeLessThan(long.x)
    expect(long.x).toBeLessThan(1)
    expect(short.y).toBe(short.x)
  })

  it('settles once it is close enough to its target, and not before', () => {
    const target = { x: 0.5, y: 0.5 }
    expect(isSettled({ x: 0.5001, y: 0.5001 }, target)).toBe(true)
    expect(isSettled({ x: 0.51, y: 0.5 }, target)).toBe(false)
  })

  it('reaches a settled eye from a far one in a few seconds of frames', () => {
    const target = { x: 0.9, y: 0.2 }
    let eye = { x: 0.1, y: 0.8 }
    let frames = 0
    while (!isSettled(eye, target) && frames < 1000) {
      eye = glideToward(eye, target, 1 / 60)
      frames += 1
    }
    expect(frames).toBeLessThan(120)
  })
})
