import { describe, expect, it } from 'vitest'

import { PACES, VESSELS } from '../../src/lib/atlas/vocabulary'
import type { TravelRules } from '../../src/lib/atlas/world/model'
import type { AtlasRef } from '../../src/lib/atlas/world/refs'
import {
  planTravel,
  steppedCap,
  type TravelRequest,
  terrainCap,
} from '../../src/lib/atlas/world/travel'
import type { Locale } from '../../src/lib/i18n/locales'
import { bookPaces, loadWorld } from './fixtures/atlas'

const FLYING_SPEED = 9
const { authored, world } = loadWorld('archipel')
const grid = authored.grid
const rules = world.travel
const paces = bookPaces()
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
  flyingSpeed: FLYING_SPEED,
  paces,
  ...overrides,
})

describe('the pace a terrain allows', () => {
  const capped: TravelRules = {
    ...rules,
    terrains: [
      { key: 'open', maxPace: 'fast', maxPaceWithSkis: undefined },
      { key: 'rough', maxPace: 'slow', maxPaceWithSkis: undefined },
      { key: 'snow', maxPace: 'normal', maxPaceWithSkis: 'fast' },
      { key: 'water', maxPace: undefined, maxPaceWithSkis: undefined },
    ],
    roadStep: 1,
  }
  const terrain = (key: string) => capped.terrains.findIndex((entry) => entry.key === key)

  it('caps each terrain at the pace its rule gives', () => {
    expect(terrainCap(capped, terrain('open'), false)).toBe(pace('fast'))
    expect(terrainCap(capped, terrain('rough'), false)).toBe(pace('slow'))
  })

  it('raises the cap by the road step, never past the fastest pace', () => {
    expect(steppedCap(capped, pace('slow'), true)).toBe(pace('normal'))
    expect(steppedCap(capped, pace('normal'), true)).toBe(pace('fast'))
    expect(steppedCap(capped, pace('fast'), true)).toBe(pace('fast'))
    expect(steppedCap(capped, pace('normal'), false)).toBe(pace('normal'))
  })

  it('lets skis lift only a terrain whose rule names a pace for them', () => {
    expect(terrainCap(capped, terrain('snow'), false)).toBe(pace('normal'))
    expect(terrainCap(capped, terrain('snow'), true)).toBe(pace('fast'))
    expect(terrainCap(capped, terrain('rough'), true)).toBe(pace('slow'))
  })

  it('keeps a terrain without a pace out of reach on foot, even on a road', () => {
    expect(terrainCap(capped, terrain('water'), false)).toBe(-1)
    expect(steppedCap(capped, terrainCap(capped, terrain('water'), false), true)).toBe(-1)
  })

  it('reads the paces from the Livre du joueur, the same in both locales, each faster than the last', () => {
    const speeds = (locale: Locale) =>
      bookPaces(locale).map(({ key, kmh, kmPerDay }) => ({ key, kmh, kmPerDay }))
    const french = speeds('fr')
    expect(speeds('en')).toEqual(french)
    expect(french.map((entry) => entry.key)).toEqual([...PACES])
    for (const [index, entry] of french.entries()) {
      const before = french[index - 1]
      expect(entry.kmh, entry.key).toBeGreaterThan(before?.kmh ?? 0)
      expect(entry.kmPerDay, entry.key).toBeGreaterThan(before?.kmPerDay ?? 0)
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
    expect(walk.km / (normal?.hours ?? 1)).toBeCloseTo(FLYING_SPEED * rules.kmhPerMetre, 6)
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
    expect(result.kmh).toBe(rules.dirigeableKmh)
    expect(result.hours).toBeCloseTo(result.km / rules.dirigeableKmh, 9)
  })

  it('rides the rail at its own speed between two stations, and refuses a town with no line nearby', () => {
    const result = planTravel(
      world,
      grid,
      request(place('ferratre'), place('kheranne'), { mode: 'rail' }),
    )
    if (!result.ok || result.mode !== 'rail') throw new Error('expected a train')
    expect(result.kmh).toBe(rules.railKmh)
    expect(
      planTravel(world, grid, request(place('pierrelune'), place('kheranne'), { mode: 'rail' })),
    ).toEqual({
      ok: false,
      reason: 'norail',
    })
  })
})
