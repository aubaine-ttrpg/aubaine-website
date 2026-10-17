import type { Locale } from '../../i18n/locales.ts'
import {
  FieldError,
  type Fields,
  fields,
  finite,
  integer,
  isFields,
  list,
  oneOf,
  optionalFinite,
  optionalText,
  positive,
  record,
  text,
} from '../contract/fields.ts'
import {
  BUILDING_STYLES,
  type BuildingStyle,
  CAVE_KINDS,
  type CaveKind,
  ISLE_FEATURES,
  type IsleFeature,
  LANDMARK_KINDS,
  type LandmarkKind,
  NATURAL_FEATURES,
  NATURAL_KINDS,
  type NaturalKind,
  PACES,
  PLACE_KINDS,
  type PlaceFeature,
  type PlaceKind,
  ROCKS,
  ROUTE_KINDS,
  type RouteKind,
  SETTINGS,
  SETTLEMENT_FEATURES,
  TILE_TYPES,
  VESSELS,
} from '../vocabulary.ts'
import { createGrid, type Grid, neighbourOf, tileOf } from './grid.ts'
import { readLayer } from './layer.ts'
import type { CaveRecord, LaneEnd, TravelRules, Vocabulary, Words } from './model.ts'

export class WorldReferenceError extends Error {
  constructor(path: string, id: string) {
    super(`${path}: ${id} does not exist`)
    this.name = 'WorldReferenceError'
  }
}

const PLACE_FEATURES = [...SETTLEMENT_FEATURES, ...NATURAL_FEATURES] as const

function featureList<const T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T[] {
  if (value === undefined) return []
  return list(value, path).map((entry, index) => oneOf(entry, allowed, `${path}[${index}]`))
}

export type AuthoredPlace = {
  id: string
  kind: PlaceKind
  parent: number
  name: string
  description: string | undefined
  subtype: NaturalKind | undefined
  style: BuildingStyle | undefined
  color: string | undefined
  capital: number
  ruler: string | undefined
  government: string | undefined
  population: number | undefined
  features: readonly PlaceFeature[]
}

export type AuthoredLandmark = {
  id: string
  kind: LandmarkKind
  name: string
  description: string | undefined
  place: number
  tile: number
  footprint: number | undefined
  altitude: number | undefined
  height: number | undefined
  length: number | undefined
  features: readonly IsleFeature[]
}

export type AuthoredRoute = {
  id: string
  kind: RouteKind
  name: string
  description: string | undefined
  tiles: Int32Array
}

export type AuthoredEstablishment = {
  id: string
  kind: string
  name: string
  description: string | undefined
  place: number
  tile: number
}

export type AuthoredSkyTile = { tile: number; type: number; place: number }

export type AuthoredUnderground = {
  level: number
  depth: number
  rock: Uint8Array
  setting: Uint8Array
  floor: Float32Array
  place: Int16Array
}

export type AuthoredWorld = {
  grid: Grid
  name: string
  hexKm: number
  featuredPlaces: number[]
  featuredLandmarks: number[]
  level: Int8Array
  type: Uint8Array
  landmass: Int16Array
  political: Int16Array
  settlement: Int16Array
  sea: Int16Array
  relief: Int16Array
  cover: Int16Array
  caves: CaveRecord[]
  places: AuthoredPlace[]
  landmarks: AuthoredLandmark[]
  routes: AuthoredRoute[]
  skyLanes: { from: LaneEnd; to: LaneEnd }[]
  establishments: AuthoredEstablishment[]
  islands: { landmark: number; tiles: AuthoredSkyTile[] }[]
  underground: AuthoredUnderground[]
}

export type WorldFiles = {
  world: unknown
  surface: unknown
  places: unknown
  landmarks: unknown
  routes: unknown
  establishments: unknown
  sky: unknown
  underground: unknown
}

export type WorldOverlays = {
  world?: unknown
  places?: unknown
  landmarks?: unknown
  routes?: unknown
  establishments?: unknown
}

type Translation = { name?: string; description?: string; ruler?: string; government?: string }

function translations(overlay: unknown, part: string): Map<string, Translation> {
  if (overlay === undefined) return new Map()
  const entries = record(fields(overlay, part)[part], part)
  const out = new Map<string, Translation>()
  for (const [id, value] of entries) {
    const path = `${part}.${id}`
    const entry = fields(value, path)
    const translation: Translation = {}
    for (const key of ['name', 'description', 'ruler', 'government'] as const) {
      const shown = optionalText(entry[key], `${path}.${key}`)
      if (shown !== undefined) translation[key] = shown
    }
    out.set(id, translation)
  }
  return out
}

const indexOf = <T extends string>(values: readonly T[], value: T) => values.indexOf(value)

function layerCodes(
  name: string,
  layer: unknown,
  grid: Grid,
  code: (value: unknown, path: string) => number,
  empty: number,
): number[] {
  const shape = fields(layer, name)
  const legend: Record<string, number> = {}
  for (const [cell, value] of record(shape['legend'], `${name}.legend`)) {
    legend[cell] = code(value, `${name}.legend.${cell}`)
  }
  const rows = list(shape['rows'], `${name}.rows`).map((row, index) =>
    text(row, `${name}.rows[${index}]`),
  )
  return readLayer(name, { legend, rows }, grid).map((value) => value ?? empty)
}

function tileField(value: unknown, grid: Grid, path: string): number {
  const at = fields(value, path)
  const tile = tileOf(
    grid,
    integer(at['column'], `${path}.column`),
    integer(at['row'], `${path}.row`),
  )
  if (tile < 0) throw new FieldError(path, 'a hex on the grid')
  return tile
}

function routeTiles(start: number, steps: string, grid: Grid, path: string): Int32Array {
  const tiles = new Int32Array(steps.length + 1)
  tiles[0] = start
  let current = start
  for (let step = 0; step < steps.length; step++) {
    const edge = Number(steps.charAt(step))
    current = neighbourOf(grid, current, edge)
    if (!(edge >= 0 && edge <= 5) || current < 0)
      throw new FieldError(path, 'steps that stay on the grid')
    tiles[step + 1] = current
  }
  return tiles
}

export function decodeWorld(files: WorldFiles, overlays: WorldOverlays): AuthoredWorld {
  const head = fields(files.world, 'world')
  const grid = createGrid(
    integer(head['columns'], 'world.columns'),
    integer(head['rows'], 'world.rows'),
  )
  const worldName = optionalText(
    isFields(overlays.world) ? overlays.world['name'] : undefined,
    'world.en.name',
  )

  const placeNames = translations(overlays.places, 'places')
  const rawPlaces = list(fields(files.places, 'places')['places'], 'places.places').map(
    (value, index) => fields(value, `places[${index}]`),
  )
  const placeIndex = new Map(
    rawPlaces.map((place, index) => [text(place['id'], `places[${index}].id`), index]),
  )
  const place = (id: unknown, path: string) => {
    const name = text(id, path)
    const found = placeIndex.get(name)
    if (found === undefined) throw new WorldReferenceError(path, name)
    return found
  }
  const optionalPlace = (id: unknown, path: string) => (id === undefined ? -1 : place(id, path))

  const places = rawPlaces.map((raw, index): AuthoredPlace => {
    const path = `places[${index}]`
    const id = text(raw['id'], `${path}.id`)
    const kind = oneOf(raw['kind'], PLACE_KINDS, `${path}.kind`)
    const shown = placeNames.get(id) ?? {}
    return {
      id,
      kind,
      parent: optionalPlace(raw['parent'], `${path}.parent`),
      name: shown.name ?? text(raw['name'], `${path}.name`),
      description: shown.description ?? optionalText(raw['description'], `${path}.description`),
      subtype:
        raw['subtype'] === undefined
          ? undefined
          : oneOf(raw['subtype'], NATURAL_KINDS, `${path}.subtype`),
      style:
        raw['style'] === undefined
          ? undefined
          : oneOf(raw['style'], BUILDING_STYLES, `${path}.style`),
      color: optionalText(raw['color'], `${path}.color`),
      capital: optionalPlace(raw['capital'], `${path}.capital`),
      ruler: shown.ruler ?? optionalText(raw['ruler'], `${path}.ruler`),
      government: shown.government ?? optionalText(raw['government'], `${path}.government`),
      population: optionalFinite(raw['population'], `${path}.population`),
      features: featureList(raw['features'], PLACE_FEATURES, `${path}.features`),
    }
  })

  const surface = fields(files.surface, 'surface')
  const placeLayer = (name: string) =>
    Int16Array.from(layerCodes(name, surface[name], grid, (value, path) => place(value, path), -1))
  const level = Int8Array.from(
    layerCodes('height', surface['height'], grid, (value, path) => integer(value, path), 0),
  )
  const type = Uint8Array.from(
    layerCodes(
      'type',
      surface['type'],
      grid,
      (value, path) => indexOf(TILE_TYPES, oneOf(value, TILE_TYPES, path)),
      0,
    ),
  )
  for (let tile = 0; tile < grid.size; tile++) {
    if (level[tile] === 0) throw new FieldError(`height at tile ${tile}`, 'a height step')
  }
  const caves = list(surface['caves'], 'surface.caves').map((value, index): CaveRecord => {
    const path = `caves[${index}]`
    const cave = fields(value, path)
    const edge = integer(cave['edge'], `${path}.edge`)
    if (edge < 0 || edge > 5) throw new FieldError(`${path}.edge`, 'a side from 0 to 5')
    const kind: CaveKind = oneOf(cave['kind'], CAVE_KINDS, `${path}.kind`)
    return { tile: tileField(cave['tile'], grid, `${path}.tile`), edge, kind }
  })

  const landmarkNames = translations(overlays.landmarks, 'landmarks')
  const rawLandmarks = list(
    fields(files.landmarks, 'landmarks')['landmarks'],
    'landmarks.landmarks',
  ).map((value, index) => fields(value, `landmarks[${index}]`))
  const landmarkIndex = new Map(
    rawLandmarks.map((landmark, index) => [text(landmark['id'], `landmarks[${index}].id`), index]),
  )
  const landmark = (id: unknown, path: string) => {
    const name = text(id, path)
    const found = landmarkIndex.get(name)
    if (found === undefined) throw new WorldReferenceError(path, name)
    return found
  }
  const landmarks = rawLandmarks.map((raw, index): AuthoredLandmark => {
    const path = `landmarks[${index}]`
    const id = text(raw['id'], `${path}.id`)
    const shown = landmarkNames.get(id) ?? {}
    return {
      id,
      kind: oneOf(raw['kind'], LANDMARK_KINDS, `${path}.kind`),
      name: shown.name ?? text(raw['name'], `${path}.name`),
      description: shown.description ?? optionalText(raw['description'], `${path}.description`),
      place: optionalPlace(raw['place'], `${path}.place`),
      tile: tileField(raw['tile'], grid, `${path}.tile`),
      footprint:
        raw['footprint'] === undefined
          ? undefined
          : positive(raw['footprint'], `${path}.footprint`),
      altitude: optionalFinite(raw['altitude'], `${path}.altitude`),
      height: optionalFinite(raw['height'], `${path}.height`),
      length: optionalFinite(raw['length'], `${path}.length`),
      features: featureList(raw['features'], ISLE_FEATURES, `${path}.features`),
    }
  })

  const routeNames = translations(overlays.routes, 'routes')
  const routeFile = fields(files.routes, 'routes')
  const routes = list(routeFile['routes'], 'routes.routes').map((value, index): AuthoredRoute => {
    const path = `routes[${index}]`
    const raw = fields(value, path)
    const id = text(raw['id'], `${path}.id`)
    const shown = routeNames.get(id) ?? {}
    const steps = text(raw['steps'], `${path}.steps`)
    return {
      id,
      kind: oneOf(raw['kind'], ROUTE_KINDS, `${path}.kind`),
      name: shown.name ?? text(raw['name'], `${path}.name`),
      description: shown.description ?? optionalText(raw['description'], `${path}.description`),
      tiles: routeTiles(
        tileField(raw['start'], grid, `${path}.start`),
        steps,
        grid,
        `${path}.steps`,
      ),
    }
  })
  const laneEnd = (value: unknown, path: string): LaneEnd => {
    const end = fields(value, path)
    return end['landmark'] !== undefined
      ? { landmark: landmark(end['landmark'], `${path}.landmark`) }
      : { place: place(end['place'], `${path}.place`) }
  }
  const skyLanes = list(routeFile['skyLanes'], 'routes.skyLanes').map((value, index) => {
    const lane = fields(value, `skyLanes[${index}]`)
    return {
      from: laneEnd(lane['from'], `skyLanes[${index}].from`),
      to: laneEnd(lane['to'], `skyLanes[${index}].to`),
    }
  })

  const establishmentNames = translations(overlays.establishments, 'establishments')
  const establishments = list(
    fields(files.establishments, 'establishments')['establishments'],
    'establishments.establishments',
  ).map((value, index): AuthoredEstablishment => {
    const path = `establishments[${index}]`
    const raw = fields(value, path)
    const id = text(raw['id'], `${path}.id`)
    const shown = establishmentNames.get(id) ?? {}
    return {
      id,
      kind: text(raw['kind'], `${path}.kind`),
      name: shown.name ?? text(raw['name'], `${path}.name`),
      description: shown.description ?? optionalText(raw['description'], `${path}.description`),
      place: place(raw['place'], `${path}.place`),
      tile: tileField(raw['tile'], grid, `${path}.tile`),
    }
  })

  const islands = list(fields(files.sky, 'sky')['islands'], 'sky.islands').map((value, index) => {
    const path = `islands[${index}]`
    const island = fields(value, path)
    return {
      landmark: landmark(island['landmark'], `${path}.landmark`),
      tiles: list(island['tiles'], `${path}.tiles`).map((entry, tileIndex): AuthoredSkyTile => {
        const tilePath = `${path}.tiles[${tileIndex}]`
        const tile = fields(entry, tilePath)
        return {
          tile: tileField(tile, grid, tilePath),
          type: indexOf(TILE_TYPES, oneOf(tile['type'], TILE_TYPES, `${tilePath}.type`)),
          place: place(tile['place'], `${tilePath}.place`),
        }
      }),
    }
  })

  const underground = list(
    fields(files.underground, 'underground')['levels'],
    'underground.levels',
  ).map((value, index): AuthoredUnderground => {
    const path = `underground[${index}]`
    const stratum = fields(value, path)
    return {
      level: integer(stratum['level'], `${path}.level`),
      depth: positive(stratum['depth'], `${path}.depth`),
      rock: Uint8Array.from(
        layerCodes(
          `${path}.rock`,
          stratum['rock'],
          grid,
          (v, p) => indexOf(ROCKS, oneOf(v, ROCKS, p)),
          0,
        ),
      ),
      setting: Uint8Array.from(
        layerCodes(
          `${path}.setting`,
          stratum['setting'],
          grid,
          (v, p) => indexOf(SETTINGS, oneOf(v, SETTINGS, p)),
          0,
        ),
      ),
      floor: Float32Array.from(
        layerCodes(`${path}.floor`, stratum['floor'], grid, (v, p) => finite(v, p), 0),
      ),
      place: Int16Array.from(
        layerCodes(`${path}.place`, stratum['place'], grid, (v, p) => place(v, p), -1),
      ),
    }
  })

  const featured = fields(head['featured'], 'world.featured')
  return {
    grid,
    name: worldName ?? text(head['name'], 'world.name'),
    hexKm: positive(head['hexKm'], 'world.hexKm'),
    featuredPlaces: list(featured['places'], 'world.featured.places').map((id, index) =>
      place(id, `world.featured.places[${index}]`),
    ),
    featuredLandmarks: list(featured['landmarks'], 'world.featured.landmarks').map((id, index) =>
      landmark(id, `world.featured.landmarks[${index}]`),
    ),
    level,
    type,
    landmass: placeLayer('landmass'),
    political: placeLayer('political'),
    settlement: placeLayer('settlement'),
    sea: placeLayer('sea'),
    relief: placeLayer('relief'),
    cover: placeLayer('cover'),
    caves,
    places,
    landmarks,
    routes,
    skyLanes,
    establishments,
    islands,
    underground,
  }
}

function words(value: unknown, path: string, locale: Locale): Words {
  const out: Words = {}
  for (const [index, entry] of list(value, path).entries()) {
    const word: Fields = fields(entry, `${path}[${index}]`)
    const key = text(word['key'], `${path}[${index}].key`)
    const english = locale === 'en'
    out[key] = {
      label: text(word[english ? 'labelEn' : 'labelFr'], `${path}.${key}.label`),
      description: optionalText(
        word[english ? 'descriptionEn' : 'descriptionFr'],
        `${path}.${key}.description`,
      ),
    }
  }
  return out
}

export function decodeVocabulary(raw: unknown, locale: Locale): Vocabulary {
  const file = fields(raw, 'vocabularies')
  const group = (name: keyof Vocabulary) => words(file[name], `vocabularies.${name}`, locale)
  return {
    tileTypes: group('tileTypes'),
    rocks: group('rocks'),
    settings: group('settings'),
    placeKinds: group('placeKinds'),
    naturalKinds: group('naturalKinds'),
    landmarkKinds: group('landmarkKinds'),
    routeKinds: group('routeKinds'),
    establishmentKinds: group('establishmentKinds'),
    vessels: group('vessels'),
    terrains: group('terrains'),
  }
}

export function decodeTravel(raw: unknown): TravelRules {
  const file = fields(raw, 'travel')
  const terrains = list(file['terrains'], 'travel.terrains').map((value, index) => {
    const path = `travel.terrains[${index}]`
    const terrain = fields(value, path)
    return {
      key: text(terrain['key'], `${path}.key`),
      maxPace:
        terrain['maxPace'] === undefined
          ? undefined
          : oneOf(terrain['maxPace'], PACES, `${path}.maxPace`),
      maxPaceWithSkis:
        terrain['maxPaceWithSkis'] === undefined
          ? undefined
          : oneOf(terrain['maxPaceWithSkis'], PACES, `${path}.maxPaceWithSkis`),
    }
  })
  const terrainIndex = (key: unknown, path: string) => {
    const name = text(key, path)
    const found = terrains.findIndex((terrain) => terrain.key === name)
    if (found < 0) throw new WorldReferenceError(path, name)
    return found
  }
  const tileTerrains = new Uint8Array(TILE_TYPES.length)
  const mapping = fields(file['tileTerrains'], 'travel.tileTerrains')
  for (const [index, type] of TILE_TYPES.entries()) {
    tileTerrains[index] = terrainIndex(mapping[type], `travel.tileTerrains.${type}`)
  }
  const road = fields(file['road'], 'travel.road')
  const flight = fields(file['flight'], 'travel.flight')
  const vesselSpeeds = fields(file['vessels'], 'travel.vessels')
  const vessels = Float64Array.from(VESSELS, (vessel) =>
    positive(vesselSpeeds[vessel], `travel.vessels.${vessel}`),
  )
  return {
    hoursPerDay: positive(file['hoursPerDay'], 'travel.hoursPerDay'),
    crewHoursPerDay: positive(file['crewHoursPerDay'], 'travel.crewHoursPerDay'),
    terrains,
    tileTerrains,
    undergroundTerrain: terrainIndex(file['undergroundTerrain'], 'travel.undergroundTerrain'),
    roadStep: integer(road['step'], 'travel.road.step'),
    roadTileTypes: Uint8Array.from(
      list(road['tileTypes'], 'travel.road.tileTypes').map((type, index) =>
        indexOf(TILE_TYPES, oneOf(type, TILE_TYPES, `travel.road.tileTypes[${index}]`)),
      ),
    ),
    kmhPerMetre: positive(flight['kmhPerMetre'], 'travel.flight.kmhPerMetre'),
    vessels,
    dirigeableKmh: positive(file['dirigeableKmh'], 'travel.dirigeableKmh'),
    railKmh: positive(file['railKmh'], 'travel.railKmh'),
  }
}
