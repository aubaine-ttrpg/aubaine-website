import { describe, expect, it } from 'vitest'

import {
  CADRAN_EMBLEM_AT,
  CADRAN_SWITCH_AT,
  COMPLETE_TRACE,
  emblemTimeline,
} from '../../src/scripts/cadran/emblem'
import { outlineOf } from '../../src/scripts/cadran/outline'
import { circle } from '../../src/scripts/cadran/shapes'

describe('the CADRAN outline', () => {
  it('measures a circle as its circumference', () => {
    expect(outlineOf(circle(0, 0, 10)).length).toBeCloseTo(2 * Math.PI * 10, 0)
  })

  it('measures each subpath of a path on its own', () => {
    const outline = outlineOf('M 0,0 L 30,0 M 0,10 L 0,50')
    expect(outline.subpaths).toHaveLength(2)
    expect(outline.length).toBeCloseTo(70)
  })

  it('refuses a path command it cannot trace', () => {
    expect(() => outlineOf('M 0,0 Q 10,10 20,0')).toThrow(/Unsupported path command/)
  })
})

describe('the CADRAN emblem timeline', () => {
  it('draws nothing before the emblem and everything once it is lit', () => {
    const before = emblemTimeline(CADRAN_EMBLEM_AT - 0.1)
    for (const progress of Object.values(before.trace)) expect(progress).toBe(0)
    expect(before.ignite).toBe(0)

    const lit = emblemTimeline(CADRAN_SWITCH_AT)
    expect(lit.trace).toEqual(COMPLETE_TRACE)
    expect(lit.ignite).toBe(1)
  })
})
