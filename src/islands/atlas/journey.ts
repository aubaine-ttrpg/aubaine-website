import { levelOf } from '../../lib/atlas/engine/selection'
import { PACES, type Pace, TILE_TYPES, type TileType, VESSELS } from '../../lib/atlas/vocabulary'
import type { AtlasRef } from '../../lib/atlas/world/refs'
import {
  type BookPaceSpeed,
  type TravelFailure,
  type TravelMode,
  type TravelRequest,
  type TravelResult,
  terrainCap,
} from '../../lib/atlas/world/travel'
import { type Gazetteer, paceLabel, terrainLabel } from './describe'

export type Endpoint = 'from' | 'to'

export type JourneyPlan = {
  from: AtlasRef | undefined
  to: AtlasRef | undefined
  mode: TravelMode
  vessel: number
  skis: boolean
  crew: boolean
  flyingSpeed: number | undefined
}

export type PaceCard = {
  kind: 'pace'
  pace: Pace
  title: string
  duration: string
  detail: string
  highlighted: boolean
}

export type VoyageCard = { kind: 'voyage'; title: string; duration: string; detail: string }

export type JourneyCard = PaceCard | VoyageCard

export type TerrainTone = TileType | 'underground'

export type JourneyLeg = {
  key: string
  label: string
  href: string | undefined
  distance: string
  pace: string
  share: number
  tone: TerrainTone | undefined
}

export type JourneyBreakdown = { title: string; legs: JourneyLeg[] }

export type JourneyView =
  | { kind: 'failure'; message: string }
  | {
      kind: 'route'
      distance: string
      measure: string
      announcement: string
      cards: JourneyCard[]
      breakdown: JourneyBreakdown | undefined
    }

export type VesselOption = { index: number; label: string }

const HIGHLIGHTED_PACE: Pace = 'normal'

export function defaultFlyingSpeed(g: Gazetteer): number {
  const normal = g.paces.find((pace) => pace.key === HIGHLIGHTED_PACE)
  if (!normal) throw new Error('the Atlas has no normal pace')
  return normal.kmh / g.world.travel.kmhPerMetre
}

export function readFlyingSpeed(text: string): number | undefined {
  const value = Number(text.trim().replace(',', '.'))
  return text.trim() !== '' && Number.isFinite(value) && value > 0 ? value : undefined
}

export function travelRequest(g: Gazetteer, plan: JourneyPlan): TravelRequest | undefined {
  const { from, to } = plan
  if (!from || !to) return undefined
  const flyingSpeed = plan.mode === 'fly' ? plan.flyingSpeed : defaultFlyingSpeed(g)
  if (flyingSpeed === undefined) return undefined
  const paces: BookPaceSpeed[] = g.paces.map(({ key, kmh, kmPerDay }) => ({ key, kmh, kmPerDay }))
  return {
    from,
    to,
    mode: plan.mode,
    vessel: plan.vessel,
    skis: plan.skis,
    crew: plan.crew,
    flyingSpeed,
    paces,
  }
}

export function vesselOptions(g: Gazetteer): VesselOption[] {
  return VESSELS.map((key, index) => {
    const name = g.world.vocabulary.vessels[key]?.label
    if (name === undefined) throw new Error(`the Atlas vocabulary has no vessel ${key}`)
    return {
      index,
      label: g.words.speed(name, g.measures.number(g.world.travel.vessels[index] ?? 0, 2)),
    }
  })
}

export function skisLabel(g: Gazetteer): string | undefined {
  const rules = g.world.travel
  const helped = rules.terrains
    .map((_, terrain) => terrain)
    .filter((terrain) => terrainCap(rules, terrain, true) > terrainCap(rules, terrain, false))
  const fastest = Math.max(...helped.map((terrain) => terrainCap(rules, terrain, true)))
  const pace = PACES[fastest]
  if (helped.length === 0 || pace === undefined) return undefined
  const list = new Intl.ListFormat(g.locale, { type: 'conjunction' })
  return g.words.skis(
    paceLabel(g, pace),
    list.format(helped.map((terrain) => terrainLabel(g, terrain).label)),
  )
}

export function crewLabel(g: Gazetteer): string {
  return g.words.crew(g.measures.number(g.world.travel.crewHoursPerDay))
}

export function failureMessage(
  g: Gazetteer,
  reason: TravelFailure,
  request: TravelRequest,
): string {
  if (reason === 'coast' && request.mode === 'foot') return g.words.failures.afloat
  if (reason === 'nopath' && levelOf(g.world, request.from) > 0) return g.words.failures.buried
  return g.words.failures[reason]
}

export function terrainTone(g: Gazetteer, terrain: number): TerrainTone | undefined {
  const rules = g.world.travel
  if (terrain === rules.undergroundTerrain) return 'underground'
  const type = rules.tileTerrains.indexOf(terrain)
  return type < 0 ? undefined : TILE_TYPES[type]
}

function paceCards(
  g: Gazetteer,
  legs: readonly { key: Pace; km: number; days: number; hours: number }[],
  detail: (leg: { km: number; hours: number }) => string,
  rate: (leg: { key: Pace; km: number; days: number }) => number,
): PaceCard[] {
  const { measures, words } = g
  const hoursPerDay = g.world.travel.hoursPerDay
  return legs.map((leg) => ({
    kind: 'pace',
    pace: leg.key,
    title: words.paceRate(paceLabel(g, leg.key), measures.number(rate(leg))),
    duration: measures.duration(leg.days, leg.hours, hoursPerDay),
    detail: detail(leg),
    highlighted: leg.key === HIGHLIGHTED_PACE,
  }))
}

function bookRate(g: Gazetteer, pace: Pace): number {
  return g.paces.find((entry) => entry.key === pace)?.kmPerDay ?? 0
}

function voyageName(g: Gazetteer, mode: 'ship' | 'dirigeable' | 'rail', vessel: number): string {
  if (mode !== 'ship') return g.words.modes[mode]
  const key = VESSELS[vessel]
  const name = key === undefined ? undefined : g.world.vocabulary.vessels[key]?.label
  if (name === undefined) throw new Error(`the Atlas has no vessel ${vessel}`)
  return name
}

export function journeyView(
  g: Gazetteer,
  request: TravelRequest,
  result: TravelResult,
): JourneyView {
  if (!result.ok) return { kind: 'failure', message: failureMessage(g, result.reason, request) }
  const { measures, words } = g
  const distance = measures.kilometres(result.km)
  const airborne = result.mode === 'fly' || (result.mode !== 'foot' && result.air !== undefined)
  const measure = airborne ? words.asTheCrowFlies : words.alongRoute
  const route = {
    kind: 'route' as const,
    distance,
    measure,
    announcement: words.routeFound(distance, measure),
  }
  switch (result.mode) {
    case 'foot': {
      const total = result.breakdown.reduce((sum, leg) => sum + leg.km, 0) || 1
      return {
        ...route,
        cards: paceCards(
          g,
          result.paces,
          (leg) => words.walked(measures.number(leg.km), measures.number(leg.hours, 1)),
          (leg) => bookRate(g, leg.key),
        ),
        breakdown: {
          title: words.breakdown(paceLabel(g, HIGHLIGHTED_PACE)),
          legs: result.breakdown.map((leg) => {
            const terrain = terrainLabel(g, leg.terrain)
            return {
              key: `${leg.terrain}:${leg.road}`,
              label: leg.road ? words.onRoad(terrain.label) : terrain.label,
              href: terrain.href,
              distance: measures.kilometres(leg.km),
              pace: paceLabel(g, leg.pace),
              share: leg.km / total,
              tone: terrainTone(g, leg.terrain),
            }
          }),
        },
      }
    }
    case 'fly':
      return {
        ...route,
        cards: paceCards(
          g,
          result.paces,
          (leg) => words.flown(measures.number(leg.hours, 1)),
          (leg) => (leg.days > 0 ? leg.km / leg.days : bookRate(g, leg.key)),
        ),
        breakdown: undefined,
      }
    case 'ship':
    case 'dirigeable':
    case 'rail':
      return {
        ...route,
        cards: [
          {
            kind: 'voyage',
            title: words.speed(
              voyageName(g, result.mode, request.vessel),
              measures.number(result.kmh, 2),
            ),
            duration: measures.duration(result.days, result.hours, result.hoursPerDay),
            detail: words.voyaged(
              measures.number(result.hours, 1),
              measures.number(result.hoursPerDay),
            ),
          },
        ],
        breakdown: undefined,
      }
  }
}
