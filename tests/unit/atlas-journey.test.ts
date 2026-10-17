import { describe, expect, it } from 'vitest'

import { createGazetteer } from '../../src/islands/atlas/describe'
import {
  crewLabel,
  defaultFlyingSpeed,
  type JourneyPlan,
  type JourneyView,
  journeyView,
  readFlyingSpeed,
  skisLabel,
  terrainTone,
  travelRequest,
  vesselOptions,
} from '../../src/islands/atlas/journey'
import { VESSELS } from '../../src/lib/atlas/vocabulary'
import type { AtlasRef } from '../../src/lib/atlas/world/refs'
import {
  planTravel,
  TRAVEL_FAILURES,
  TRAVEL_MODES,
  type TravelMode,
  type TravelRequest,
} from '../../src/lib/atlas/world/travel'
import { strings } from '../../src/lib/i18n/strings'
import { bookPaces, loadWorld } from './fixtures/atlas'

const { authored, world } = loadWorld('archipel')
const grid = authored.grid
const paces = bookPaces()
const t = strings('fr').atlas
const g = createGazetteer({
  world,
  grid,
  locale: 'fr',
  words: t,
  paces,
  terrains: world.travel.terrains.map(({ key }) => ({ key, label: `terrain ${key}` })),
})
const number = (value: number, digits = 0) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: digits }).format(value)
const place = (id: string): AtlasRef => ({
  kind: 'place',
  place: world.places.findIndex((entry) => entry.id === id),
})
const landmark = (id: string): AtlasRef => ({
  kind: 'landmark',
  landmark: world.landmarks.findIndex((entry) => entry.id === id),
})
const plan = (from: AtlasRef, to: AtlasRef, overrides: Partial<JourneyPlan> = {}): JourneyPlan => ({
  from,
  to,
  mode: 'foot',
  vessel: 0,
  skis: false,
  crew: false,
  flyingSpeed: undefined,
  ...overrides,
})
const requestFor = (journey: JourneyPlan): TravelRequest => {
  const request = travelRequest(g, journey)
  if (!request) throw new Error('expected a travel request')
  return request
}
const viewOf = (journey: JourneyPlan): JourneyView => {
  const request = requestFor(journey)
  return journeyView(g, request, planTravel(world, grid, request))
}
const route = (view: JourneyView) => {
  if (view.kind !== 'route') throw new Error(`expected a route, got ${JSON.stringify(view)}`)
  return view
}
const paceName = (key: string) => paces.find((pace) => pace.key === key)?.label ?? ''

describe('the travel request', () => {
  it('waits for both ends of the journey', () => {
    expect(travelRequest(g, plan(place('bastion'), place('ferratre'), { to: undefined }))).toBe(
      undefined,
    )
    expect(travelRequest(g, plan(place('bastion'), place('ferratre'), { from: undefined }))).toBe(
      undefined,
    )
  })

  it('flies only at a Vitesse the reader gave, and walks at the default one', () => {
    const ends = plan(place('bastion'), place('ferratre'))
    expect(travelRequest(g, { ...ends, mode: 'fly' })).toBeUndefined()
    expect(travelRequest(g, { ...ends, mode: 'fly', flyingSpeed: 18 })?.flyingSpeed).toBe(18)
    expect(requestFor(ends).flyingSpeed).toBe(defaultFlyingSpeed(g))
  })

  it('takes the default Vitesse from the normal pace of the book', () => {
    const normal = paces.find((pace) => pace.key === 'normal')
    expect(defaultFlyingSpeed(g)).toBe((normal?.kmh ?? 0) / world.travel.kmhPerMetre)
  })

  it('sends the speeds of the book, without their labels', () => {
    expect(requestFor(plan(place('bastion'), place('ferratre'))).paces).toEqual(
      paces.map(({ key, kmh, kmPerDay }) => ({ key, kmh, kmPerDay })),
    )
  })

  it('reads a Vitesse typed with a comma or a point, and refuses nothing, zero and words', () => {
    expect(readFlyingSpeed('18')).toBe(18)
    expect(readFlyingSpeed('4,5')).toBe(4.5)
    expect(readFlyingSpeed(' 12.5 ')).toBe(12.5)
    expect(readFlyingSpeed('')).toBeUndefined()
    expect(readFlyingSpeed('0')).toBeUndefined()
    expect(readFlyingSpeed('-9')).toBeUndefined()
    expect(readFlyingSpeed('vite')).toBeUndefined()
  })
})

describe('a journey on foot', () => {
  const view = route(viewOf(plan(place('bastion'), place('brumefort'))))

  it('measures the distance along the route', () => {
    expect(view.measure).toBe(t.alongRoute)
    expect(view.announcement).toBe(t.routeFound(view.distance, t.alongRoute))
  })

  it('shows one card per pace of the book, the normal pace highlighted', () => {
    expect(view.cards.map((card) => (card.kind === 'pace' ? card.pace : card.kind))).toEqual([
      'slow',
      'normal',
      'fast',
    ])
    expect(view.cards.filter((card) => card.kind === 'pace' && card.highlighted)).toHaveLength(1)
    const normal = paces.find((pace) => pace.key === 'normal')
    expect(view.cards[1]?.title).toBe(
      `${paceName('normal')} · ${number(normal?.kmPerDay ?? 0)} km / jour`,
    )
    expect(view.cards[1]?.detail.endsWith('h de marche')).toBe(true)
  })

  it('splits the normal pace across the terrains it crosses, in shares that add up', () => {
    const legs = view.breakdown?.legs ?? []
    expect(view.breakdown?.title).toBe(t.breakdown(paceName('normal')))
    expect(legs.length).toBeGreaterThan(0)
    expect(legs.reduce((sum, leg) => sum + leg.share, 0)).toBeCloseTo(1, 9)
    for (const leg of legs) expect(leg.label.startsWith('terrain ')).toBe(true)
  })

  it('names the terrains walked on a road', () => {
    const result = planTravel(world, grid, requestFor(plan(place('bastion'), place('brumefort'))))
    if (!result.ok || result.mode !== 'foot') throw new Error('expected a walk')
    const road = result.breakdown.find((leg) => leg.road)
    const shown = view.breakdown?.legs.find((leg) => leg.key === `${road?.terrain}:true`)
    expect(shown?.label).toBe(
      t.onRoad(`terrain ${world.travel.terrains[road?.terrain ?? -1]?.key}`),
    )
  })

  it('counts the days in travel days of the hours the rules give', () => {
    expect(g.measures.duration(1.5, 12, world.travel.hoursPerDay)).toBe(
      t.daysHours(number(1), number(4)),
    )
    expect(g.measures.duration(2, 16, world.travel.hoursPerDay)).toBe(t.days(number(2)))
    expect(g.measures.duration(0.25, 2, world.travel.hoursPerDay)).toBe(t.hours(number(2)))
    expect(g.measures.duration(0.01, 0.08, world.travel.hoursPerDay)).toBe(t.underAnHour)
  })
})

describe('a flight', () => {
  const ends = plan(place('bastion'), place('ferratre'), { mode: 'fly' })

  it('flies as the crow flies, at the pace rates a Vitesse gives', () => {
    const slow = route(viewOf({ ...ends, flyingSpeed: defaultFlyingSpeed(g) }))
    const fast = route(viewOf({ ...ends, flyingSpeed: defaultFlyingSpeed(g) * 2 }))
    expect(slow.measure).toBe(t.asTheCrowFlies)
    expect(slow.breakdown).toBeUndefined()
    const normal = paces.find((pace) => pace.key === 'normal')
    expect(slow.cards[1]?.title).toBe(
      `${paceName('normal')} · ${number(normal?.kmPerDay ?? 0)} km / jour`,
    )
    expect(fast.cards[1]?.title).toBe(
      `${paceName('normal')} · ${number((normal?.kmPerDay ?? 0) * 2)} km / jour`,
    )
    expect(slow.cards[0]?.detail.endsWith('h de vol')).toBe(true)
  })
})

describe('a voyage', () => {
  it('sails a vessel at its own speed, eight hours a day or around the clock with a crew', () => {
    const sailing = VESSELS.indexOf('sailing')
    const ends = plan(place('bastion'), place('corsaille'), { mode: 'ship', vessel: sailing })
    const day = route(viewOf(ends))
    const shifts = route(viewOf({ ...ends, crew: true }))
    expect(day.measure).toBe(t.alongRoute)
    expect(day.cards).toHaveLength(1)
    expect(day.cards[0]?.title).toBe(
      t.speed(
        world.vocabulary.vessels['sailing']?.label ?? '',
        number(world.travel.vessels[sailing] ?? 0, 2),
      ),
    )
    expect(day.cards[0]?.detail.endsWith(`${number(world.travel.hoursPerDay)} h par jour`)).toBe(
      true,
    )
    expect(
      shifts.cards[0]?.detail.endsWith(`${number(world.travel.crewHoursPerDay)} h par jour`),
    ).toBe(true)
  })

  it('flies a dirigeable straight to the floating city', () => {
    const view = route(viewOf(plan(place('bastion'), landmark('aerolys'), { mode: 'dirigeable' })))
    expect(view.measure).toBe(t.asTheCrowFlies)
    expect(view.cards[0]?.title).toBe(
      t.speed(t.modes.dirigeable, number(world.travel.dirigeableKmh, 2)),
    )
  })

  it('rides the Ether Line between two of its towns', () => {
    const view = route(viewOf(plan(place('ferratre'), place('kheranne'), { mode: 'rail' })))
    expect(view.cards[0]?.title).toBe(t.speed(t.modes.rail, number(world.travel.railKmh, 2)))
  })

  it('works out a journey for every means of travel', () => {
    const covered = new Set<TravelMode>()
    const journeys: JourneyPlan[] = [
      plan(place('bastion'), place('brumefort')),
      plan(place('bastion'), place('ferratre'), { mode: 'fly', flyingSpeed: 9 }),
      plan(place('bastion'), place('corsaille'), { mode: 'ship' }),
      plan(place('bastion'), landmark('aerolys'), { mode: 'dirigeable' }),
      plan(place('ferratre'), place('kheranne'), { mode: 'rail' }),
    ]
    for (const journey of journeys) {
      expect(viewOf(journey).kind).toBe('route')
      covered.add(journey.mode)
    }
    expect([...covered].sort()).toEqual([...TRAVEL_MODES].sort())
  })
})

describe('a journey that cannot be made', () => {
  const failed = (journey: JourneyPlan) => {
    const view = viewOf(journey)
    if (view.kind !== 'failure') throw new Error('expected a failure')
    return view.message
  }

  it('explains each failure the planner reports', () => {
    expect(failed(plan(place('bastion'), place('bastion')))).toBe(t.failures.same)
    expect(failed(plan(place('bastion'), place('dolmhir')))).toBe(t.failures.levels)
    expect(failed(plan(place('dolmhir'), place('mer-sans-soleil'), { mode: 'ship' }))).toBe(
      t.failures.underMode,
    )
    expect(failed(plan(place('bastion'), landmark('aerolys')))).toBe(t.failures.sky)
    expect(failed(plan(place('pierrelune'), place('kheranne'), { mode: 'rail' }))).toBe(
      t.failures.norail,
    )
  })

  it('has a message for every failure, and tells a walker who starts on the water to sail', () => {
    const request = requestFor(plan(place('bastion'), place('ferratre')))
    for (const reason of TRAVEL_FAILURES) {
      for (const mode of TRAVEL_MODES) {
        const view = journeyView(g, { ...request, mode }, { ok: false, reason })
        expect(view.kind === 'failure' && view.message.length > 0).toBe(true)
      }
    }
    expect(journeyView(g, request, { ok: false, reason: 'coast' })).toEqual({
      kind: 'failure',
      message: t.failures.afloat,
    })
    expect(journeyView(g, { ...request, mode: 'ship' }, { ok: false, reason: 'coast' })).toEqual({
      kind: 'failure',
      message: t.failures.coast,
    })
    expect(journeyView(g, request, { ok: false, reason: 'nopath' })).toEqual({
      kind: 'failure',
      message: t.failures.nopath,
    })
  })

  it('blames the rock, and not the sea, when no tunnel joins two underground places', () => {
    expect(failed(plan(place('tube-ardent'), place('crypte-rois')))).toBe(t.failures.buried)
  })
})

describe('the planner options', () => {
  it('offers every vessel with its speed', () => {
    expect(vesselOptions(g).map((option) => option.label)).toEqual(
      VESSELS.map((key, index) =>
        t.speed(
          world.vocabulary.vessels[key]?.label ?? '',
          number(world.travel.vessels[index] ?? 0, 2),
        ),
      ),
    )
  })

  it('offers skis on the terrains where they raise the pace', () => {
    expect(skisLabel(g)).toBe(t.skis(paceName('fast'), 'terrain neiges'))
  })

  it('gives the hours of a crew in shifts from the rules', () => {
    expect(crewLabel(g)).toBe(t.crew(number(world.travel.crewHoursPerDay)))
  })

  it('colours a terrain after the first tile type that has it, and the underground in amber', () => {
    const terrain = (key: string) => world.travel.terrains.findIndex((entry) => entry.key === key)
    expect(terrainTone(g, terrain('plaine'))).toBe('plains')
    expect(terrainTone(g, world.travel.undergroundTerrain)).toBe('underground')
  })
})
