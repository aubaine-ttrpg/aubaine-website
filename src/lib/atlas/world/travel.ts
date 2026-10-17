import { PACES, type Pace, SETTINGS } from '../vocabulary.ts'
import { shortestPath } from './astar.ts'
import { ROUTE_BITS } from './derive.ts'
import { EDGES, type Grid, SQRT3 } from './grid.ts'
import type { Stratum, TravelRules, World } from './model.ts'
import type { AtlasRef } from './refs.ts'

export const TRAVEL_MODES = ['foot', 'fly', 'ship', 'dirigeable', 'rail'] as const
export type TravelMode = (typeof TRAVEL_MODES)[number]

export type BookPaceSpeed = { key: Pace; kmh: number; kmPerDay: number }

export type TravelRequest = {
  from: AtlasRef
  to: AtlasRef
  mode: TravelMode
  vessel: number
  skis: boolean
  crew: boolean
  flyingSpeed: number
  paces: BookPaceSpeed[]
}

export const TRAVEL_FAILURES = [
  'same',
  'levels',
  'underMode',
  'nopath',
  'coast',
  'sky',
  'norail',
] as const
export type TravelFailure = (typeof TRAVEL_FAILURES)[number]

export type PaceLeg = { key: Pace; km: number; days: number; hours: number }

export type TerrainLeg = { terrain: number; road: boolean; km: number; pace: Pace }

export type Point = { x: number; y: number; z: number }

export type TravelResult =
  | { ok: false; reason: TravelFailure }
  | {
      ok: true
      mode: 'foot'
      km: number
      stratum: Stratum
      paces: PaceLeg[]
      breakdown: TerrainLeg[]
      tiles: Int32Array
    }
  | { ok: true; mode: 'fly'; km: number; paces: PaceLeg[]; air: [Point, Point] }
  | {
      ok: true
      mode: 'ship' | 'dirigeable' | 'rail'
      km: number
      kmh: number
      hours: number
      days: number
      hoursPerDay: number
      tiles: Int32Array | undefined
      air: [Point, Point] | undefined
    }

type Located = { tile: number; x: number; z: number; y: number; stratum: Stratum; aloft: boolean }

const WATER_SEARCH_RINGS = 7
const RAIL_SEARCH_RINGS = 4
const SHALLOW_SEA_COST = 1.6
const SOLID_ROCK = SETTINGS.indexOf('rock')

function locate(world: World, end: AtlasRef, grid: Grid): Located | undefined {
  const at = (tile: number, stratum: Stratum, aloft: boolean, y: number): Located => ({
    tile,
    x: grid.x[tile] ?? 0,
    z: grid.z[tile] ?? 0,
    y,
    stratum,
    aloft,
  })
  switch (end.kind) {
    case 'tile':
      return at(end.tile, 0, false, world.surface.y[end.tile] ?? 0)
    case 'under':
      return at(end.tile, end.level, false, 0)
    case 'sky': {
      const tile = world.sky.tile[end.sky]
      return tile === undefined ? undefined : at(tile, 0, true, world.sky.y[end.sky] ?? 0)
    }
    case 'landmark': {
      const landmark = world.landmarks[end.landmark]
      return landmark && at(landmark.tile, 0, landmark.aloft, landmark.y)
    }
    case 'place': {
      const place = world.places[end.place]
      if (!place || place.anchor < 0) return undefined
      if (place.aloft) {
        const first = place.skyTiles[0] ?? -1
        return {
          ...at(place.anchor, 0, true, world.sky.y[first] ?? 0),
          x: place.centreX,
          z: place.centreZ,
        }
      }
      return at(place.anchor, place.stratum, false, world.surface.y[place.anchor] ?? 0)
    }
  }
}

function sameEnd(a: AtlasRef, b: AtlasRef): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function nearest(
  grid: Grid,
  start: number,
  rings: number,
  accept: (tile: number) => boolean,
): number {
  if (accept(start)) return start
  const seen = new Set([start])
  let frontier = [start]
  for (let ring = 0; ring < rings; ring++) {
    const next: number[] = []
    for (const tile of frontier) {
      for (let edge = 0; edge < EDGES; edge++) {
        const other = grid.neighbours[tile * EDGES + edge] ?? -1
        if (other < 0 || seen.has(other)) continue
        if (accept(other)) return other
        seen.add(other)
        next.push(other)
      }
    }
    frontier = next
  }
  return -1
}

function paceIndex(pace: Pace): number {
  return PACES.indexOf(pace)
}

export function terrainCap(rules: TravelRules, terrain: number, skis: boolean): number {
  const rule = rules.terrains[terrain]
  const pace = skis ? (rule?.maxPaceWithSkis ?? rule?.maxPace) : rule?.maxPace
  return pace === undefined ? -1 : paceIndex(pace)
}

export function steppedCap(rules: TravelRules, cap: number, onRoad: boolean): number {
  if (cap < 0) return cap
  return Math.min(PACES.length - 1, cap + (onRoad ? rules.roadStep : 0))
}

export function isRoadTile(world: World, tile: number): boolean {
  const { surface, travel } = world
  return (
    ((surface.roads[tile] ?? 0) & ROUTE_BITS.road) !== 0 ||
    travel.roadTileTypes.includes(surface.type[tile] ?? -1)
  )
}

export function tileMaxPace(world: World, tile: number): Pace | undefined {
  const rules = world.travel
  const terrain = rules.tileTerrains[world.surface.type[tile] ?? 0] ?? 0
  return PACES[steppedCap(rules, terrainCap(rules, terrain, false), isRoadTile(world, tile))]
}

export function planTravel(world: World, grid: Grid, request: TravelRequest): TravelResult {
  if (sameEnd(request.from, request.to)) return { ok: false, reason: 'same' }
  const from = locate(world, request.from, grid)
  const to = locate(world, request.to, grid)
  if (!from || !to) return { ok: false, reason: 'nopath' }
  const km = world.hexKm
  const paces = PACES.map((key) => {
    const pace = request.paces.find((entry) => entry.key === key)
    if (!pace) throw new Error(`the travel request has no ${key} pace`)
    return pace
  })
  const normal = paces[paceIndex('normal')]
  const fastest = paces[paces.length - 1]
  if (!normal || !fastest) throw new Error('the travel request has no paces')
  const rules = world.travel
  const { surface } = world

  if (from.stratum !== to.stratum) return { ok: false, reason: 'levels' }
  if (from.stratum > 0) {
    if (request.mode !== 'foot') return { ok: false, reason: 'underMode' }
    const level = world.underground.find((stratum) => stratum.level === from.stratum)
    if (!level) return { ok: false, reason: 'nopath' }
    const terrain = rules.terrains[rules.undergroundTerrain]
    const cap = paceIndex(terrain?.maxPace ?? 'slow')
    const legs: PaceLeg[] = []
    let tiles: Int32Array | undefined
    for (const [index, pace] of paces.entries()) {
      const effective = paces[Math.min(index, cap)] ?? pace
      const path = shortestPath(
        grid,
        from.tile,
        to.tile,
        (_, next) =>
          level.setting[next] === SOLID_ROCK ? Number.POSITIVE_INFINITY : km / effective.kmPerDay,
        km / fastest.kmPerDay,
      )
      if (!path) return { ok: false, reason: 'nopath' }
      const distance = (path.length - 1) * km
      legs.push({
        key: pace.key,
        km: distance,
        days: distance / effective.kmPerDay,
        hours: distance / effective.kmh,
      })
      if (pace.key === 'normal') tiles = path
    }
    return {
      ok: true,
      mode: 'foot',
      km: legs[paceIndex('normal')]?.km ?? 0,
      stratum: from.stratum,
      paces: legs,
      breakdown: [
        {
          terrain: rules.undergroundTerrain,
          road: false,
          km: legs[paceIndex('normal')]?.km ?? 0,
          pace: PACES[Math.min(paceIndex('normal'), cap)] ?? 'slow',
        },
      ],
      tiles: tiles ?? new Int32Array(0),
    }
  }

  const straightKm = (Math.hypot(from.x - to.x, from.z - to.z) * km) / SQRT3
  const air: [Point, Point] = [
    { x: from.x, y: from.y, z: from.z },
    { x: to.x, y: to.y, z: to.z },
  ]
  if (request.mode === 'fly') {
    const factor = (request.flyingSpeed * rules.kmhPerMetre) / normal.kmh
    return {
      ok: true,
      mode: 'fly',
      km: straightKm,
      air,
      paces: paces.map((pace) => {
        const kmh = pace.kmh * factor
        return {
          key: pace.key,
          km: straightKm,
          days: straightKm / (pace.kmPerDay * factor),
          hours: straightKm / kmh,
        }
      }),
    }
  }
  const voyage = (
    kmTravelled: number,
    kmh: number,
    tiles: Int32Array | undefined,
    line: [Point, Point] | undefined,
  ) => {
    const hours = kmTravelled / kmh
    const hoursPerDay = request.crew ? rules.crewHoursPerDay : rules.hoursPerDay
    return {
      ok: true as const,
      km: kmTravelled,
      kmh,
      hours,
      days: hours / hoursPerDay,
      hoursPerDay,
      tiles,
      air: line,
    }
  }
  if (request.mode === 'dirigeable') {
    return { ...voyage(straightKm, rules.dirigeableKmh, undefined, air), mode: 'dirigeable' }
  }
  if (from.aloft || to.aloft) return { ok: false, reason: 'sky' }

  const isSea = (tile: number) => surface.water[tile] === 1 && (surface.lake[tile] ?? -1) < 0
  if (request.mode === 'ship') {
    const start = nearest(grid, from.tile, WATER_SEARCH_RINGS, isSea)
    const goal = nearest(grid, to.tile, WATER_SEARCH_RINGS, isSea)
    if (start < 0 || goal < 0) return { ok: false, reason: 'coast' }
    const path = shortestPath(
      grid,
      start,
      goal,
      (_, next) =>
        isSea(next)
          ? surface.level[next] === -1
            ? SHALLOW_SEA_COST
            : 1
          : Number.POSITIVE_INFINITY,
      1,
    )
    if (!path) return { ok: false, reason: 'nopath' }
    const tiles = [
      ...(from.tile === start ? [] : [from.tile]),
      ...path,
      ...(to.tile === goal ? [] : [to.tile]),
    ]
    const kmh = rules.vessels[request.vessel]
    if (kmh === undefined) throw new RangeError(`unknown vessel ${request.vessel}`)
    return {
      ...voyage((tiles.length - 1) * km, kmh, Int32Array.from(tiles), undefined),
      mode: 'ship',
    }
  }
  if (request.mode === 'rail') {
    const onRail = (tile: number) => ((surface.roads[tile] ?? 0) & ROUTE_BITS.rail) !== 0
    const start = nearest(grid, from.tile, RAIL_SEARCH_RINGS, onRail)
    const goal = nearest(grid, to.tile, RAIL_SEARCH_RINGS, onRail)
    if (start < 0 || goal < 0) return { ok: false, reason: 'norail' }
    const path = shortestPath(
      grid,
      start,
      goal,
      (_, next) => (onRail(next) ? 1 : Number.POSITIVE_INFINITY),
      1,
    )
    if (!path) return { ok: false, reason: 'norail' }
    return { ...voyage((path.length - 1) * km, rules.railKmh, path, undefined), mode: 'rail' }
  }

  const terrainOf = (tile: number) => rules.tileTerrains[surface.type[tile] ?? 0] ?? 0
  const isRoad = (tile: number) => isRoadTile(world, tile)
  const capOf = (tile: number) => terrainCap(rules, terrainOf(tile), request.skis)
  const effective = (tile: number, pace: number, other: number) =>
    Math.min(pace, steppedCap(rules, capOf(tile), isRoad(tile) && isRoad(other)))
  const half = km / 2
  const speedOf = (index: number) => {
    const speed = paces[index]
    if (!speed) throw new RangeError(`no pace at ${index}`)
    return speed
  }
  const legs: PaceLeg[] = []
  let breakdown: TerrainLeg[] = []
  let tiles: Int32Array | undefined
  for (const [index, pace] of paces.entries()) {
    const stepCost = (a: number, b: number, edge: number) => {
      if (surface.water[b] === 1 || (surface.connection[a * EDGES + edge] ?? 3) >= 2)
        return Number.POSITIVE_INFINITY
      if (capOf(a) < 0 || capOf(b) < 0) return Number.POSITIVE_INFINITY
      return (
        half / speedOf(effective(a, index, b)).kmPerDay +
        half / speedOf(effective(b, index, a)).kmPerDay
      )
    }
    const path = shortestPath(grid, from.tile, to.tile, stepCost, km / fastest.kmPerDay)
    if (!path) {
      const wet = surface.water[from.tile] === 1 || surface.water[to.tile] === 1
      return { ok: false, reason: wet ? 'coast' : 'nopath' }
    }
    let days = 0
    let hours = 0
    const legsByTerrain = new Map<string, TerrainLeg>()
    for (let step = 0; step < path.length - 1; step++) {
      const a = path[step] ?? 0
      const b = path[step + 1] ?? 0
      for (const [tile, other] of [
        [a, b],
        [b, a],
      ] as const) {
        const speed = speedOf(effective(tile, index, other))
        days += half / speed.kmPerDay
        hours += half / speed.kmh
        const road = isRoad(tile) && isRoad(other)
        const key = `${terrainOf(tile)}:${road}`
        const leg = legsByTerrain.get(key) ?? {
          terrain: terrainOf(tile),
          road,
          km: 0,
          pace: speed.key,
        }
        leg.km += half
        legsByTerrain.set(key, leg)
      }
    }
    legs.push({ key: pace.key, km: (path.length - 1) * km, days, hours })
    if (pace.key === 'normal') {
      tiles = path
      breakdown = [...legsByTerrain.values()].sort((a, b) => b.km - a.km)
    }
  }
  return {
    ok: true,
    mode: 'foot',
    km: legs[paceIndex('normal')]?.km ?? 0,
    stratum: 0,
    paces: legs,
    breakdown,
    tiles: tiles ?? new Int32Array(0),
  }
}
