import { describe, expect, it } from 'vitest'

import { PACES, VESSELS } from '../../src/lib/atlas/vocabulary'
import type { AtlasRef } from '../../src/lib/atlas/world/refs'
import {
  planTravel,
  steppedCap,
  type TravelRequest,
  terrainCap,
} from '../../src/lib/atlas/world/travel'
import { bookPaces, loadWorld } from './fixtures/atlas'

const { authored, world } = loadWorld('archipel')
const grid = authored.grid
const rules = world.travel
const paces = bookPaces()
const terrain = (key: string) => rules.terrains.findIndex((entry) => entry.key === key)
const pace = (key: (typeof PACES)[number]) => PACES.indexOf(key)
const place = (id: string): AtlasRef => ({
  kind: 'place',
  place: world.places.findIndex((entry) => entry.id === id),
})
const landmark = (id: string): AtlasRef => ({
  kind: 'landmark',
  landmark: world.landmarks.findIndex((entry) => entry.id === id),
})

const request = (
  from: AtlasRef,
  to: AtlasRef,
  overrides: Partial<TravelRequest> = {},
): TravelRequest => ({
  from,
  to,
  mode: 'foot',
  vessel: 0,
  skis: false,
  crew: false,
  flyingSpeed: 9,
  paces,
  ...overrides,
})

describe('the pace a terrain allows', () => {
  it('lets the plains be crossed fast, the forest at a normal pace and the mountains slowly', () => {
    expect(terrainCap(rules, terrain('plaine'), false)).toBe(pace('fast'))
    expect(terrainCap(rules, terrain('foret'), false)).toBe(pace('normal'))
    expect(terrainCap(rules, terrain('montagne'), false)).toBe(pace('slow'))
    expect(terrainCap(rules, terrain('marais'), false)).toBe(pace('slow'))
  })

  it('raises the cap one step on a road, never past the fastest pace', () => {
    expect(steppedCap(rules, pace('slow'), true)).toBe(pace('normal'))
    expect(steppedCap(rules, pace('normal'), true)).toBe(pace('fast'))
    expect(steppedCap(rules, pace('fast'), true)).toBe(pace('fast'))
    expect(steppedCap(rules, pace('normal'), false)).toBe(pace('normal'))
  })

  it('lets skis cross the snow fast, and nothing else', () => {
    expect(terrainCap(rules, terrain('neiges'), false)).toBe(pace('normal'))
    expect(terrainCap(rules, terrain('neiges'), true)).toBe(pace('fast'))
    expect(terrainCap(rules, terrain('foret'), true)).toBe(pace('normal'))
  })

  it('keeps the water out of reach on foot, and the underground at a normal pace', () => {
    expect(terrainCap(rules, terrain('eaux'), false)).toBe(-1)
    expect(terrainCap(rules, rules.undergroundTerrain, false)).toBe(pace('normal'))
  })

  it('reads the paces from the Livre du joueur in both locales', () => {
    for (const locale of ['fr', 'en'] as const) {
      const book = bookPaces(locale)
      expect(book.map((entry) => entry.key)).toEqual([...PACES])
      expect(book.map((entry) => entry.kmh)).toEqual([3, 4.5, 6])
      expect(book.map((entry) => entry.kmPerDay)).toEqual([27, 36, 45])
    }
  })
})

describe('a journey on foot', () => {
  const result = planTravel(world, grid, request(place('bastion'), place('brumefort')))

  it('takes longer at a slower pace', () => {
    if (!result.ok || result.mode !== 'foot') throw new Error('expected a walk')
    const [slow, normal, fast] = result.paces
    expect(fast?.days ?? 0).toBeLessThanOrEqual(normal?.days ?? 0)
    expect(normal?.days ?? 0).toBeLessThanOrEqual(slow?.days ?? 0)
    expect(result.km).toBe((result.tiles.length - 1) * world.hexKm)
  })

  it('sums its terrain breakdown to the whole distance', () => {
    if (!result.ok || result.mode !== 'foot') throw new Error('expected a walk')
    expect(result.breakdown.reduce((sum, leg) => sum + leg.km, 0)).toBeCloseTo(result.km, 6)
  })

  it('cannot leave the level it starts on', () => {
    const hold = place('dolmhir')
    expect(planTravel(world, grid, request(place('bastion'), hold))).toEqual({
      ok: false,
      reason: 'levels',
    })
    expect(
      planTravel(world, grid, request(hold, place('mer-sans-soleil'), { mode: 'ship' })),
    ).toEqual({
      ok: false,
      reason: 'underMode',
    })
  })

  it('cannot walk to a floating island', () => {
    expect(planTravel(world, grid, request(place('bastion'), landmark('aerolys')))).toEqual({
      ok: false,
      reason: 'sky',
    })
  })

  it('refuses a journey to where it starts', () => {
    expect(planTravel(world, grid, request(place('bastion'), place('bastion')))).toEqual({
      ok: false,
      reason: 'same',
    })
  })
})

describe('the other ways to travel', () => {
  it('flies at the speed a Vitesse gives, at any pace over any terrain', () => {
    const walk = planTravel(
      world,
      grid,
      request(place('bastion'), place('ferratre'), { mode: 'fly' }),
    )
    const twice = planTravel(
      world,
      grid,
      request(place('bastion'), place('ferratre'), { mode: 'fly', flyingSpeed: 18 }),
    )
    if (!walk.ok || walk.mode !== 'fly' || !twice.ok || twice.mode !== 'fly')
      throw new Error('expected flights')
    const normal = walk.paces[pace('normal')]
    expect(walk.km / (normal?.hours ?? 1)).toBeCloseTo(4.5, 6)
    expect(twice.paces[pace('fast')]?.hours ?? 0).toBeCloseTo(
      (walk.paces[pace('fast')]?.hours ?? 0) / 2,
      6,
    )
  })

  it('sails eight hours a day, or around the clock with a crew in shifts', () => {
    const sailing = VESSELS.indexOf('sailing')
    const day = planTravel(
      world,
      grid,
      request(place('bastion'), place('corsaille'), { mode: 'ship', vessel: sailing }),
    )
    const shifts = planTravel(
      world,
      grid,
      request(place('bastion'), place('corsaille'), { mode: 'ship', vessel: sailing, crew: true }),
    )
    if (!day.ok || day.mode !== 'ship' || !shifts.ok || shifts.mode !== 'ship')
      throw new Error('expected voyages')
    expect(day.kmh).toBe(rules.vessels[sailing])
    expect(day.hours).toBeCloseTo(day.km / day.kmh, 9)
    expect(day.days).toBeCloseTo(day.hours / rules.hoursPerDay, 9)
    expect(shifts.days).toBeCloseTo(shifts.hours / rules.crewHoursPerDay, 9)
  })

  it('flies a dirigeable straight at its own speed, to the floating city too', () => {
    const result = planTravel(
      world,
      grid,
      request(place('bastion'), landmark('aerolys'), { mode: 'dirigeable' }),
    )
    if (!result.ok || result.mode !== 'dirigeable') throw new Error('expected a dirigeable')
    expect(result.kmh).toBe(80)
    expect(result.hours).toBeCloseTo(result.km / 80, 9)
  })

  it('rides the rail at its own speed between two stations, and refuses a town with no line nearby', () => {
    const result = planTravel(
      world,
      grid,
      request(place('ferratre'), place('kheranne'), { mode: 'rail' }),
    )
    if (!result.ok || result.mode !== 'rail') throw new Error('expected a train')
    expect(result.kmh).toBe(500)
    expect(
      planTravel(world, grid, request(place('pierrelune'), place('kheranne'), { mode: 'rail' })),
    ).toEqual({
      ok: false,
      reason: 'norail',
    })
  })
})
