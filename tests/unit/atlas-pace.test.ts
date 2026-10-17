import { describe, expect, it } from 'vitest'

import { automaticTier, stepDown } from '../../src/lib/atlas/contract/quality'
import { JUDGED_FRAMES, PaceCheck, SLOW_FRAME_MS } from '../../src/lib/atlas/engine/pace-check'

function move(pace: PaceCheck, from: number, frames: number, interval: number): boolean[] {
  return Array.from({ length: frames }, (_, index) => pace.findsSlow(from + index * interval, true))
}

describe('the pace check behind Auto', () => {
  it('finds a camera move slow once its frames run past the limit, and says so once', () => {
    const pace = new PaceCheck()
    const verdicts = move(pace, 0, JUDGED_FRAMES + 5, SLOW_FRAME_MS + 10)
    expect(verdicts.filter(Boolean)).toHaveLength(1)
    expect(verdicts[JUDGED_FRAMES]).toBe(true)
  })

  it('lets a smooth move pass', () => {
    const pace = new PaceCheck()
    expect(move(pace, 0, JUDGED_FRAMES + 1, 16).some(Boolean)).toBe(false)
  })

  it('ignores the pause between two moves and keeps counting on the next one', () => {
    const pace = new PaceCheck()
    const first = Math.floor(JUDGED_FRAMES / 2)
    expect(move(pace, 0, first + 1, 40).some(Boolean)).toBe(false)
    expect(pace.findsSlow(5000, false)).toBe(false)
    const second = move(pace, 60_000, JUDGED_FRAMES - first + 1, 40)
    expect(second.at(-1)).toBe(true)
  })

  it('judges again after a restart, so Auto can step down a second time', () => {
    const pace = new PaceCheck()
    move(pace, 0, JUDGED_FRAMES + 1, 40)
    expect(move(pace, 10_000, 3, 40).some(Boolean)).toBe(false)
    pace.restart()
    expect(move(pace, 20_000, JUDGED_FRAMES + 1, 40).filter(Boolean)).toHaveLength(1)
  })

  it('is not fooled by a single long frame among smooth ones', () => {
    const pace = new PaceCheck()
    const times = [0, 600, ...Array.from({ length: JUDGED_FRAMES }, (_, index) => 616 + index * 16)]
    expect(times.map((time) => pace.findsSlow(time, true)).some(Boolean)).toBe(false)
  })
})

describe('the tier Auto starts on', () => {
  const report = { renderer: 'ANGLE (NVIDIA GeForce RTX 3060)', cores: 12, coarsePointer: false }

  it('starts a desktop on Ultra and a touch device on High', () => {
    expect(automaticTier(report)).toBe('ultra')
    expect(automaticTier({ ...report, coarsePointer: true })).toBe('high')
  })

  it('starts a software renderer, a known low end GPU or a two core machine on Low', () => {
    expect(automaticTier({ ...report, renderer: 'SwiftShader' })).toBe('low')
    expect(automaticTier({ ...report, renderer: 'Intel(R) UHD Graphics 620' })).toBe('low')
    expect(automaticTier({ ...report, cores: 2 })).toBe('low')
  })

  it('steps down from Ultra to High to Low, and no further', () => {
    expect(stepDown('ultra')).toBe('high')
    expect(stepDown('high')).toBe('low')
    expect(stepDown('low')).toBe('low')
  })
})
