import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FrameScheduler } from '../../src/lib/atlas/engine/frame-scheduler'

const SLOW_FRAME_MS = 400

let waiting: FrameRequestCallback[] = []

function paint(at: number): void {
  for (const callback of waiting.splice(0)) callback(at)
}

function stillMap(movingFrames: number): { drawn: number[]; scheduler: FrameScheduler } {
  const drawn: number[] = []
  let left = movingFrames
  const scheduler = new FrameScheduler(
    (now) => {
      drawn.push(now)
      left -= 1
      return left > 0
    },
    { animated: false, uncapped: false },
  )
  return { drawn, scheduler }
}

beforeEach(() => {
  waiting = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    waiting.push(callback)
    return waiting.length
  })
  vi.stubGlobal('cancelAnimationFrame', () => undefined)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the frame scheduler with animations off', () => {
  it('keeps drawing a moving map after a slow frame', () => {
    const { drawn, scheduler } = stillMap(3)
    const start = performance.now()
    scheduler.start()
    const frames = [start, start + SLOW_FRAME_MS, start + SLOW_FRAME_MS * 2]
    for (const at of frames) paint(at)
    expect(drawn).toEqual(frames)
  })

  it('freezes once the map has settled', () => {
    const { drawn, scheduler } = stillMap(1)
    const start = performance.now()
    scheduler.start()
    paint(start)
    paint(start + SLOW_FRAME_MS)
    expect(drawn).toEqual([start])
    expect(scheduler.mode).toBe('frozen')
  })
})
