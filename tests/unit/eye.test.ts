import { describe, expect, it } from 'vitest'

import {
  glideToward,
  isLeanSettled,
  isSettled,
  type LeanTween,
  leanAt,
  leanBack,
  leanTo,
  scrolledEye,
  stepSeconds,
} from '../../src/scripts/art-effect/eye'

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

describe('the lean of a shield toward a hovering mouse', () => {
  const upright: LeanTween = { from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, start: 0, seconds: 0 }
  const pointed = { x: 0.5, y: -0.4 }

  it('stands upright before any pointer comes near', () => {
    expect(leanAt(upright, 5000)).toEqual({ x: 0, y: 0 })
    expect(isLeanSettled(upright, 5000)).toBe(true)
  })

  it('reaches the lean of the pointer in 0.14 s, most of the way in the first half', () => {
    const leaning = leanTo(upright, pointed, 1000)
    expect(leanAt(leaning, 1000)).toEqual({ x: 0, y: 0 })
    expect(leanAt(leaning, 1070).x).toBeGreaterThan(pointed.x * 0.75)
    expect(leanAt(leaning, 1140)).toEqual(pointed)
    expect(isLeanSettled(leaning, 1139)).toBe(false)
    expect(isLeanSettled(leaning, 1140)).toBe(true)
  })

  it('comes back upright over 0.6 s once the pointer leaves', () => {
    const leaned = leanTo(upright, pointed, 0)
    const resting = leanBack(leaned, 1000)
    expect(leanAt(resting, 1000)).toEqual(pointed)
    expect(Math.abs(leanAt(resting, 1100).x)).toBeGreaterThan(0)
    expect(leanAt(resting, 1600)).toEqual({ x: 0, y: 0 })
    expect(isLeanSettled(resting, 1599)).toBe(false)
    expect(isLeanSettled(resting, 1600)).toBe(true)
  })

  it('turns from where it stands when the pointer moves on, as a CSS transition restarts', () => {
    const leaning = leanTo(upright, pointed, 0)
    const halfway = leanAt(leaning, 50)
    const turning = leanTo(leaning, { x: -0.5, y: 0.4 }, 50)
    expect(leanAt(turning, 50)).toEqual(halfway)
  })
})
