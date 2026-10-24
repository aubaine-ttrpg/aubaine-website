import { describe, expect, it } from 'vitest'

import { FieldError } from '../../src/lib/atlas/contract/fields'
import { DEFAULT_SEASON } from '../../src/lib/atlas/contract/time-of-day'
import {
  blackbody,
  decodeStars,
  type StarLight,
  skyArc,
  starLights,
  synodicDays,
} from '../../src/lib/atlas/world/stars'
import { atlasFile } from './fixtures/atlas'

const STAR_SYSTEM = {
  primary: { temperature: 5772, illuminance: 120000, diameter: 0.533 },
  warm: { temperature: 5600, illuminance: 2392, diameter: 0.08 },
  hot: { temperature: 12000, illuminance: 9, diameter: 0.0011, tint: [1, 0.93, 1.07] },
  pair: { distance: 6, separation: 0.5, orbitYears: 9.3, mutualDays: 105 },
}
const system = decodeStars(STAR_SYSTEM)
const byKey = (lights: StarLight[], key: StarLight['key']) => {
  const found = lights.find((light) => light.key === key)
  if (!found) throw new Error(`no ${key} light`)
  return found
}
const total = (lights: StarLight[]) => lights.reduce((sum, light) => sum + light.illuminance, 0)

describe('the three stars of Eden', () => {
  it('reads the star file and refuses an incomplete one', () => {
    expect(() => decodeStars(atlasFile('stars.json'))).not.toThrow()
    expect(system.primary.temperature).toBe(STAR_SYSTEM.primary.temperature)
    expect(system.hot.tint[2]).toBe(STAR_SYSTEM.hot.tint[2])
    expect(() => decodeStars({ primary: {}, warm: {}, hot: {}, pair: {} })).toThrow(FieldError)
  })

  it('keeps an ordinary noon: the primary gives about 98 % of the light', () => {
    const lights = starLights(system, 12, DEFAULT_SEASON)
    const share = byKey(lights, 'primary').illuminance / total(lights)
    expect(share).toBeGreaterThan(0.96)
    expect(share).toBeLessThan(0.995)
  })

  it('makes a secondary day of a few thousand lux when only the warm companion is up', () => {
    const lights = starLights(system, 0, 0)
    expect(byKey(lights, 'primary').illuminance).toBe(0)
    const warm = byKey(lights, 'warm').illuminance
    expect(warm).toBeGreaterThan(1000)
    expect(warm).toBeLessThan(4000)
  })

  it('reddens the hot companion near the horizon and keeps it blue white high up', () => {
    const highHour = 12
    const high = byKey(starLights(system, highHour, 0.5), 'hot')
    let low = high
    for (let hour = 12; hour < 19; hour += 0.05) {
      const candidate = byKey(starLights(system, hour, 0.5), 'hot')
      if (candidate.direction[1] > 0.01 && candidate.direction[1] < 0.04) low = candidate
    }
    expect(high.colour[2]).toBeGreaterThan(high.colour[0])
    expect(low.colour[0] / low.colour[2]).toBeGreaterThan((high.colour[0] / high.colour[2]) * 3)
    expect(low.illuminance).toBeLessThan(high.illuminance)
  })

  it('moves the companions around the sky through the season', () => {
    const lag = (season: number) => {
      const primary = byKey(starLights(system, 12, season), 'primary').direction
      const warm = byKey(starLights(system, 12, season), 'warm').direction
      return Math.acos(primary[0] * warm[0] + primary[1] * warm[1] + primary[2] * warm[2])
    }
    expect(lag(0.5)).toBeLessThan(0.15)
    expect(lag(0)).toBeGreaterThan(2)
    expect(synodicDays(system.pair)).toBeCloseTo(409.2, 0)
  })

  it('rises at six and sets at eighteen like the hour slider always did', () => {
    expect(skyArc(6)[1]).toBeCloseTo(0, 6)
    expect(skyArc(18)[1]).toBeCloseTo(0, 6)
    expect(skyArc(12)[1]).toBeGreaterThan(0.8)
  })

  it('gives the same sky for the same hour and season', () => {
    expect(starLights(system, 9.3, 0.27)).toEqual(starLights(system, 9.3, 0.27))
  })

  it('turns 6500 K into white and colder temperatures into warmer light', () => {
    const white = blackbody(6504)
    for (const channel of white) expect(channel).toBeCloseTo(1, 1)
    const warm = blackbody(3000)
    expect(warm[0]).toBeGreaterThan(warm[2])
  })
})
