import { describe, expect, it } from 'vitest'

import { RESOURCE_POOLS } from '../../src/lib/game/resources'
import { buildShape, dayTotal, jetAt, representativeSplits } from '../../tools/balance/day'

describe('a day of a pool', () => {
  it('adds half the maximum, rounded down, for each Repos court', () => {
    expect(dayTotal(11, 2)).toBe(21)
    expect(dayTotal(10, 1)).toBe(15)
    expect(dayTotal(7, 0)).toBe(7)
  })
})

describe('the builds compared at equal PP', () => {
  for (const [points, cap] of [
    [3, 20],
    [12, 5],
    [30, 20],
  ] as const) {
    it(`splits ${points} PP under a cap of ${cap}, each build once`, () => {
      const builds = representativeSplits(points, cap)
      const keys = builds.map((build) => `${build.vitality}/${build.memory}/${build.energy}`)
      expect(new Set(keys).size).toBe(builds.length)
      for (const build of builds) {
        expect(RESOURCE_POOLS.reduce((sum, pool) => sum + build[pool], 0)).toBe(points)
        for (const pool of RESOURCE_POOLS) expect(build[pool]).toBeLessThanOrEqual(cap)
      }
    })
  }

  it('compares a three-way spread whenever the cap allows one', () => {
    const shapes = representativeSplits(30, 20).map(buildShape)
    expect(shapes).toContain('three-way')
    expect(shapes).toContain('two-way')
  })

  it('names a build by how many tracks it invests in', () => {
    expect(buildShape({ vitality: 0, memory: 0, energy: 6 })).toBe('focused')
    expect(buildShape({ vitality: 3, memory: 0, energy: 3 })).toBe('two-way')
    expect(buildShape({ vitality: 2, memory: 2, energy: 2 })).toBe('three-way')
  })
})

describe('the Jet a build rolls', () => {
  it('keeps a fixed bonus at every challenge', () => {
    expect(jetAt({ kind: 'fixed', bonus: 5 }, 1)).toBe(5)
    expect(jetAt({ kind: 'fixed', bonus: 5 }, 20)).toBe(5)
  })

  it('never falls as the challenge rises when it follows the proficiency bonus', () => {
    const jets = Array.from({ length: 20 }, (_, index) =>
      jetAt({ kind: 'srd', modifier: 3 }, index + 1),
    )
    expect(jets).toEqual([...jets].sort((left, right) => left - right))
  })
})
