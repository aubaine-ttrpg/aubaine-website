import {
  type Pace,
  type PlaceKind,
  ROCKS,
  type RouteKind,
  SETTINGS,
  TILE_TYPES,
} from '../../lib/atlas/vocabulary'
import { itemsAt } from '../../lib/atlas/world/derive'
import { columnOf, type Grid, rowOf, SQRT3 } from '../../lib/atlas/world/grid'
import type {
  EstablishmentRecord,
  LandmarkRecord,
  PlaceRecord,
  UndergroundRecord,
  Words,
  World,
} from '../../lib/atlas/world/model'
import { type AtlasRef, refKey, sameRef } from '../../lib/atlas/world/refs'
import { altitudeMetres, skyAltitudeMetres } from '../../lib/atlas/world/relief'
import { tileMaxPace } from '../../lib/atlas/world/travel'
import type { Locale } from '../../lib/i18n/locales'
import { type AtlasWords, createMeasures, type Measures } from './measures'
import type { AtlasPaceRow, AtlasTerrainLabel } from './props'

export type GazetteerSource = {
  world: World
  grid: Grid
  locale: Locale
  words: AtlasWords
  paces: readonly AtlasPaceRow[]
  terrains: readonly AtlasTerrainLabel[]
}

type EstablishmentIndex = {
  surface: Map<number, EstablishmentRecord[]>
  underground: Map<number, Map<number, EstablishmentRecord[]>>
  sky: Map<number, EstablishmentRecord[]>
}

export type Gazetteer = GazetteerSource & {
  measures: Measures
  hexArea: number
  collator: Intl.Collator
  establishments: EstablishmentIndex
  terrainLabels: Map<string, AtlasTerrainLabel>
  paceLabels: Map<Pace, string>
  strata: UndergroundRecord[]
}

export type Tone = 'gold' | 'landmark' | 'underground' | 'unexplored'

export type DotMark = PlaceKind | 'landmark' | 'establishment' | 'surface' | `route-${RouteKind}`

export type Dot = { mark: DotMark; colour: string | undefined }

export type SheetItem = {
  key: string
  name: string
  detail: string
  dot: Dot
  ref: AtlasRef | undefined
}

export type SectionKind = keyof AtlasWords['sections']

export type SheetSection = { kind: SectionKind; title: string; total: number; items: SheetItem[] }

export type SheetFact = { term: string; value: string }

export type Crumb = { key: string; name: string; ref: AtlasRef; current: boolean }

export type Sheet = {
  eyebrow: string
  title: string
  tone: Tone
  colour: string | undefined
  facts: SheetFact[]
  description: string | undefined
  crumbs: Crumb[]
  sections: SheetSection[]
}

export type HoverText = { title: string; detail: string; tone: Tone }

export type PlaceEntry = { key: string; ref: AtlasRef; name: string; kind: string; dot: Dot }

const SECTION_ITEMS = 14
const SUBDIVISION_ITEMS = 24
const ESTABLISHMENT_ITEMS = 20
const ABOVE_ITEMS = 8
const FACTS = 8
const LANDMARK_SCAN_TILES = 900
const SMALL_PLACE_TILES = 600
const ABOVE_SCAN_TILES = 120
const SOLID_ROCK = SETTINGS.indexOf('rock')
const HIGHEST_POINT_KINDS: ReadonlySet<PlaceKind> = new Set([
  'natural',
  'region',
  'country',
  'continent',
])
const QUARTERED_KINDS: ReadonlySet<PlaceKind> = new Set(['city', 'village', 'hold'])

const isDefined = <T>(value: T | undefined): value is T => value !== undefined

const joined = (...parts: string[]) => parts.join(' · ')

function indexEstablishments(world: World): EstablishmentIndex {
  const index: EstablishmentIndex = { surface: new Map(), underground: new Map(), sky: new Map() }
  const add = (
    map: Map<number, EstablishmentRecord[]>,
    key: number,
    entry: EstablishmentRecord,
  ) => {
    const list = map.get(key)
    if (list) list.push(entry)
    else map.set(key, [entry])
  }
  for (const entry of world.establishments) {
    if (entry.aloft) {
      const hex = world.sky.at[entry.tile] ?? -1
      if (hex >= 0) add(index.sky, hex, entry)
    } else if (entry.stratum > 0) {
      let level = index.underground.get(entry.stratum)
      if (!level) {
        level = new Map()
        index.underground.set(entry.stratum, level)
      }
      add(level, entry.tile, entry)
    } else add(index.surface, entry.tile, entry)
  }
  return index
}

export function createGazetteer(source: GazetteerSource): Gazetteer {
  return {
    ...source,
    measures: createMeasures(source.locale, source.words),
    hexArea: (SQRT3 / 2) * source.world.hexKm ** 2,
    collator: new Intl.Collator(source.locale),
    establishments: indexEstablishments(source.world),
    terrainLabels: new Map(source.terrains.map((terrain) => [terrain.key, terrain])),
    paceLabels: new Map(source.paces.map((pace) => [pace.key, pace.label])),
    strata: [...source.world.underground].sort((a, b) => a.level - b.level),
  }
}

export function word(
  table: Words,
  key: string,
  group: string,
): { label: string; description: string | undefined } {
  const entry = table[key]
  if (!entry) throw new Error(`the Atlas vocabulary has no ${group} ${key}`)
  return entry
}

export function placeKind(g: Gazetteer, place: PlaceRecord): string {
  const { vocabulary } = g.world
  if (place.kind === 'natural' && place.subtype) {
    return word(vocabulary.naturalKinds, place.subtype, 'natural kind').label
  }
  return word(vocabulary.placeKinds, place.kind, 'place kind').label
}

export function landmarkKind(g: Gazetteer, landmark: LandmarkRecord): string {
  return word(g.world.vocabulary.landmarkKinds, landmark.kind, 'landmark kind').label
}

function tileWord(g: Gazetteer, code: number) {
  const key = TILE_TYPES[code]
  if (key === undefined) throw new Error(`the Atlas has no tile type ${code}`)
  return word(g.world.vocabulary.tileTypes, key, 'tile type')
}

export function paceLabel(g: Gazetteer, pace: Pace): string {
  const label = g.paceLabels.get(pace)
  if (label === undefined) throw new Error(`the Atlas has no label for the ${pace} pace`)
  return label
}

export function terrainLabel(g: Gazetteer, terrain: number): AtlasTerrainLabel {
  const key = g.world.travel.terrains[terrain]?.key
  const label = key === undefined ? undefined : g.terrainLabels.get(key)
  if (!label) throw new Error(`the Atlas has no label for the terrain ${key ?? terrain}`)
  return label
}

export function stratumLabel(g: Gazetteer, level: number): string {
  return level === 0 ? g.words.surface : g.words.stratum(level)
}

function cell(g: Gazetteer, tile: number): string {
  return g.words.hex(columnOf(g.grid, tile), rowOf(g.grid, tile))
}

function skyCell(g: Gazetteer, sky: number): string {
  const tile = g.world.sky.tile[sky] ?? 0
  return g.words.skyHex(columnOf(g.grid, tile), rowOf(g.grid, tile))
}

function placeAt(world: World, index: number | undefined): PlaceRecord | undefined {
  return index === undefined || index < 0 ? undefined : world.places[index]
}

function chainOf(world: World, place: PlaceRecord): PlaceRecord[] {
  const chain: PlaceRecord[] = []
  for (let at: PlaceRecord | undefined = place; at; at = placeAt(world, at.parent))
    chain.unshift(at)
  return chain
}

function deepest(world: World, places: readonly PlaceRecord[]): PlaceRecord | undefined {
  let found: PlaceRecord | undefined
  let depth = -1
  for (const place of places) {
    const length = chainOf(world, place).length
    if (length > depth) {
      found = place
      depth = length
    }
  }
  return found
}

function tileChain(world: World, tile: number): PlaceRecord[] {
  const { surface } = world
  const chain = [surface.continent, surface.country, surface.region, surface.city, surface.quarter]
    .map((layer) => placeAt(world, layer[tile]))
    .filter(isDefined)
  if (chain.length > 0) return chain
  const sea = placeAt(world, surface.sea[tile])
  return sea ? [sea] : []
}

function naturalsAt(world: World, tile: number): PlaceRecord[] {
  return Array.from(itemsAt(world.surface.naturals, tile), (index) => placeAt(world, index)).filter(
    isDefined,
  )
}

function stratumOf(g: Gazetteer, level: number): UndergroundRecord | undefined {
  return g.strata.find((record) => record.level === level)
}

function underChain(world: World, record: UndergroundRecord, tile: number): PlaceRecord[] {
  const chain: PlaceRecord[] = []
  for (const layer of [record.realm, record.network, record.cavern, record.quarter]) {
    const place = placeAt(world, layer[tile])
    if (place && !chain.includes(place)) chain.push(place)
  }
  return chain
}

function tileAltitude(world: World, tile: number): number {
  const lake = world.surface.lake[tile] ?? -1
  return altitudeMetres(
    world.surface.level[tile] ?? 0,
    lake >= 0 ? world.lakes[lake]?.level : undefined,
  )
}

function altitudeFact(g: Gazetteer, altitude: number): SheetFact {
  return altitude >= 0
    ? { term: g.words.facts.altitude, value: g.measures.metres(altitude) }
    : { term: g.words.facts.depth, value: g.measures.metres(-altitude) }
}

function depthFact(g: Gazetteer, level: number): SheetFact | undefined {
  const record = stratumOf(g, level)
  if (!record) return undefined
  return { term: g.words.facts.depth, value: g.words.about(g.measures.metres(record.depth)) }
}

function terrainOfType(g: Gazetteer, type: number): string {
  return terrainLabel(g, g.world.travel.tileTerrains[type] ?? 0).label
}

function maxPace(g: Gazetteer, tile: number): string | undefined {
  const pace = tileMaxPace(g.world, tile)
  return pace === undefined ? undefined : paceLabel(g, pace)
}

function placeDot(place: PlaceRecord): Dot {
  return { mark: place.kind, colour: place.kind === 'country' ? place.color : undefined }
}

const LANDMARK_DOT: Dot = { mark: 'landmark', colour: undefined }
const ESTABLISHMENT_DOT: Dot = { mark: 'establishment', colour: undefined }
const SURFACE_DOT: Dot = { mark: 'surface', colour: undefined }

function placeItem(g: Gazetteer, place: PlaceRecord): SheetItem {
  return {
    key: `place:${place.index}`,
    name: place.name,
    detail: placeKind(g, place),
    dot: placeDot(place),
    ref: { kind: 'place', place: place.index },
  }
}

function landmarkItem(g: Gazetteer, landmark: LandmarkRecord): SheetItem {
  return {
    key: `landmark:${landmark.index}`,
    name: landmark.name,
    detail: landmarkKind(g, landmark),
    dot: LANDMARK_DOT,
    ref: { kind: 'landmark', landmark: landmark.index },
  }
}

function establishmentItem(g: Gazetteer, entry: EstablishmentRecord, quarter: string | undefined) {
  const kind = word(g.world.vocabulary.establishmentKinds, entry.kind, 'establishment kind').label
  return {
    key: `establishment:${entry.index}`,
    name: entry.name,
    detail: quarter ? joined(kind, quarter) : kind,
    dot: ESTABLISHMENT_DOT,
    ref: undefined,
  } satisfies SheetItem
}

function surfaceEstablishments(g: Gazetteer, tiles: Iterable<number>, quartered: boolean) {
  const items: SheetItem[] = []
  for (const tile of tiles) {
    const quarter = quartered ? placeAt(g.world, g.world.surface.quarter[tile])?.name : undefined
    for (const entry of g.establishments.surface.get(tile) ?? []) {
      items.push(establishmentItem(g, entry, quarter))
    }
  }
  return items
}

function undergroundEstablishments(
  g: Gazetteer,
  record: UndergroundRecord,
  tiles: Iterable<number>,
  quartered: boolean,
) {
  const items: SheetItem[] = []
  const level = g.establishments.underground.get(record.level)
  for (const tile of tiles) {
    const quarter = quartered ? placeAt(g.world, record.quarter[tile])?.name : undefined
    for (const entry of level?.get(tile) ?? []) items.push(establishmentItem(g, entry, quarter))
  }
  return items
}

function skyEstablishments(g: Gazetteer, hexes: Iterable<number>) {
  const items: SheetItem[] = []
  for (const hex of hexes) {
    for (const entry of g.establishments.sky.get(hex) ?? []) {
      items.push(establishmentItem(g, entry, undefined))
    }
  }
  return items
}

function routeItems(g: Gazetteer, tiles: Iterable<number>): SheetItem[] {
  const seen = new Set<number>()
  const items: SheetItem[] = []
  for (const tile of tiles) {
    for (const index of itemsAt(g.world.surface.routes, tile)) {
      const route = g.world.routes[index]
      if (!route || seen.has(index)) continue
      seen.add(index)
      items.push({
        key: `route:${index}`,
        name: route.name,
        detail: word(g.world.vocabulary.routeKinds, route.kind, 'route kind').label,
        dot: { mark: `route-${route.kind}`, colour: undefined },
        ref: undefined,
      })
    }
  }
  return items
}

function strataItems(g: Gazetteer, tiles: Iterable<number>, deeperThan: number): SheetItem[] {
  const items: SheetItem[] = []
  const list = Array.from(tiles)
  for (const record of g.strata) {
    if (record.level <= deeperThan) continue
    const seen = new Set<number>()
    for (const tile of list) {
      const setting = record.setting[tile] ?? SOLID_ROCK
      if (setting === SOLID_ROCK) continue
      const place = [record.quarter[tile], record.cavern[tile], record.network[tile]]
        .map((index) => placeAt(g.world, index))
        .find(isDefined)
      if (!place || seen.has(place.index)) continue
      seen.add(place.index)
      const settingKey = SETTINGS[setting] ?? 'rock'
      items.push({
        key: `place:${place.index}`,
        name: place.name,
        detail: joined(
          g.words.stratum(record.level),
          placeKind(g, place),
          word(g.world.vocabulary.settings, settingKey, 'setting').label,
        ),
        dot: placeDot(place),
        ref: { kind: 'place', place: place.index },
      })
    }
  }
  return items
}

function surfaceTop(world: World, tile: number): PlaceRecord | undefined {
  const { surface } = world
  return (
    placeAt(world, surface.quarter[tile]) ??
    placeAt(world, surface.city[tile]) ??
    deepest(world, naturalsAt(world, tile)) ??
    placeAt(world, surface.region[tile]) ??
    placeAt(world, surface.sea[tile])
  )
}

function aboveTile(g: Gazetteer, tile: number): SheetItem {
  const type = tileWord(g, g.world.surface.type[tile] ?? 0)
  return {
    key: `tile:${tile}`,
    name: surfaceTop(g.world, tile)?.name ?? type.label,
    detail: joined(cell(g, tile), type.label),
    dot: SURFACE_DOT,
    ref: { kind: 'tile', tile },
  }
}

function abovePlaces(g: Gazetteer, tiles: Iterable<number>): SheetItem[] {
  const { world } = g
  const { surface } = world
  const seen = new Set<number>()
  const items: SheetItem[] = []
  for (const tile of tiles) {
    const top =
      placeAt(world, surface.city[tile]) ??
      naturalsAt(world, tile)[0] ??
      placeAt(world, surface.region[tile]) ??
      placeAt(world, surface.sea[tile])
    if (!top || seen.has(top.index)) continue
    seen.add(top.index)
    items.push(placeItem(g, top))
  }
  return items
}

function section(
  g: Gazetteer,
  kind: SectionKind,
  items: SheetItem[],
  limit = SECTION_ITEMS,
): SheetSection | undefined {
  if (items.length === 0) return undefined
  return { kind, title: g.words.sections[kind], total: items.length, items: items.slice(0, limit) }
}

function crumbsOf(chain: readonly PlaceRecord[], selected: AtlasRef): Crumb[] {
  return chain.map((place) => {
    const ref: AtlasRef = { kind: 'place', place: place.index }
    return { key: refKey(ref), name: place.name, ref, current: sameRef(ref, selected) }
  })
}

function tileSheet(g: Gazetteer, ref: AtlasRef & { kind: 'tile' }): Sheet | undefined {
  const { world } = g
  const { tile } = ref
  const code = world.surface.type[tile]
  if (code === undefined) return undefined
  const type = tileWord(g, code)
  const chain = tileChain(world, tile)
  const naturals = naturalsAt(world, tile)
  const title =
    placeAt(world, world.surface.quarter[tile])?.name ??
    placeAt(world, world.surface.city[tile])?.name ??
    deepest(world, naturals)?.name ??
    type.label
  const pace = maxPace(g, tile)
  const facts: SheetFact[] = [
    altitudeFact(g, tileAltitude(world, tile)),
    { term: g.words.facts.area, value: g.measures.area(g.hexArea, 1) },
    { term: g.words.facts.terrain, value: terrainOfType(g, code) },
  ]
  if (pace) facts.push({ term: g.words.facts.maxPace, value: pace })
  const landmarks = Array.from(
    itemsAt(world.surface.landmarks, tile),
    (index) => world.landmarks[index],
  )
  return {
    eyebrow: joined(cell(g, tile), type.label),
    title,
    tone: 'gold',
    colour: undefined,
    facts,
    description: type.description,
    crumbs: crumbsOf(chain, ref),
    sections: [
      section(
        g,
        'member',
        [...chain].reverse().map((place) => placeItem(g, place)),
      ),
      section(
        g,
        'nature',
        naturals.map((place) => placeItem(g, place)),
      ),
      section(
        g,
        'landmarks',
        landmarks.filter(isDefined).map((landmark) => landmarkItem(g, landmark)),
      ),
      section(g, 'establishments', surfaceEstablishments(g, [tile], false)),
      section(g, 'strata', strataItems(g, [tile], 0)),
      section(g, 'routes', routeItems(g, [tile])),
    ].filter(isDefined),
  }
}

function underSheet(g: Gazetteer, ref: AtlasRef & { kind: 'under' }): Sheet | undefined {
  const { world } = g
  const record = stratumOf(g, ref.level)
  const { tile } = ref
  const rockKey = ROCKS[record?.rock[tile] ?? -1]
  const settingKey = SETTINGS[record?.setting[tile] ?? -1]
  if (!record || rockKey === undefined || settingKey === undefined) return undefined
  const rock = word(world.vocabulary.rocks, rockKey, 'rock').label
  const setting = word(world.vocabulary.settings, settingKey, 'setting').label
  const chain = underChain(world, record, tile)
  const top = chain.at(-1)
  return {
    eyebrow: joined(g.words.stratum(ref.level), cell(g, tile), setting),
    title: top?.name ?? rock,
    tone: 'underground',
    colour: undefined,
    facts: [
      depthFact(g, ref.level),
      { term: g.words.facts.rock, value: rock },
      { term: g.words.facts.setting, value: setting },
      { term: g.words.facts.area, value: g.measures.area(g.hexArea, 1) },
    ].filter(isDefined),
    description: top?.description,
    crumbs: crumbsOf(chain, ref),
    sections: [
      section(
        g,
        'member',
        [...chain].reverse().map((place) => placeItem(g, place)),
      ),
      section(g, 'establishments', undergroundEstablishments(g, record, [tile], false)),
      section(g, 'above', [aboveTile(g, tile)]),
      section(g, 'below', strataItems(g, [tile], ref.level)),
    ].filter(isDefined),
  }
}

function skySheet(g: Gazetteer, ref: AtlasRef & { kind: 'sky' }): Sheet | undefined {
  const { world } = g
  const { sky } = world
  const code = sky.type[ref.sky]
  if (code === undefined) return undefined
  const type = tileWord(g, code)
  const place = placeAt(world, sky.place[ref.sky])
  const island = sky.islands[sky.island[ref.sky] ?? -1]
  const landmark = island ? world.landmarks[island.landmark] : undefined
  const chain = place ? chainOf(world, place) : []
  return {
    eyebrow: joined(skyCell(g, ref.sky), type.label),
    title: place?.name ?? landmark?.name ?? type.label,
    tone: 'landmark',
    colour: undefined,
    facts: [
      {
        term: g.words.facts.altitude,
        value: g.measures.metres(skyAltitudeMetres(sky.y[ref.sky] ?? 0)),
      },
      { term: g.words.facts.area, value: g.measures.area(g.hexArea, 1) },
      { term: g.words.facts.terrain, value: terrainOfType(g, code) },
      { term: g.words.facts.position, value: g.words.aloft },
    ],
    description: type.description,
    crumbs: crumbsOf(chain, ref),
    sections: [
      section(
        g,
        'member',
        [...chain].reverse().map((entry) => placeItem(g, entry)),
      ),
      section(g, 'landmarks', landmark ? [landmarkItem(g, landmark)] : []),
      section(g, 'establishments', skyEstablishments(g, [ref.sky])),
    ].filter(isDefined),
  }
}

function landmarkSheet(g: Gazetteer, ref: AtlasRef & { kind: 'landmark' }): Sheet | undefined {
  const { world } = g
  const landmark = world.landmarks[ref.landmark]
  if (!landmark) return undefined
  const place = placeAt(world, landmark.place)
  const chain = tileChain(world, landmark.tile)
  const facts: SheetFact[] = []
  if (landmark.height !== undefined) {
    facts.push({ term: g.words.facts.height, value: g.measures.metres(landmark.height) })
  }
  if (landmark.length !== undefined) {
    facts.push({ term: g.words.facts.length, value: g.measures.metres(landmark.length) })
  }
  if (landmark.aloft) {
    if (landmark.altitude !== undefined) {
      facts.push({ term: g.words.facts.altitude, value: g.measures.metres(landmark.altitude) })
    }
    facts.push({ term: g.words.facts.position, value: g.words.aloft })
  } else facts.push(altitudeFact(g, tileAltitude(world, landmark.tile)))
  const members = place ? [place] : []
  if (!landmark.aloft) {
    for (const entry of [...chain].reverse()) if (!members.includes(entry)) members.push(entry)
  }
  return {
    eyebrow: joined(g.words.landmark, landmarkKind(g, landmark)),
    title: landmark.name,
    tone: 'landmark',
    colour: undefined,
    facts,
    description: landmark.description,
    crumbs: crumbsOf(place ? chainOf(world, place) : chain, ref),
    sections: [
      section(
        g,
        'member',
        members.map((entry) => placeItem(g, entry)),
      ),
      section(g, 'strata', landmark.aloft ? [] : strataItems(g, [landmark.tile], 0)),
      section(g, 'routes', landmark.aloft ? [] : routeItems(g, [landmark.tile])),
    ].filter(isDefined),
  }
}

function placeFacts(g: Gazetteer, place: PlaceRecord): SheetFact[] {
  const { world, words, measures } = g
  const facts: SheetFact[] = []
  if (place.stratum > 0) {
    const depth = depthFact(g, place.stratum)
    if (depth) facts.push(depth)
  }
  const hexes = place.tiles.length || place.skyTiles.length
  if (hexes > 0) {
    facts.push({ term: words.facts.area, value: measures.area(hexes * g.hexArea) })
    facts.push({ term: words.facts.hexes, value: measures.number(hexes) })
  }
  if (place.ruler) facts.push({ term: words.facts.ruler, value: place.ruler })
  if (place.government) facts.push({ term: words.facts.government, value: place.government })
  if (place.population !== undefined) {
    facts.push({ term: words.facts.population, value: measures.number(place.population) })
  }
  const capital = placeAt(world, place.capital)
  if (capital) facts.push({ term: words.facts.capital, value: capital.name })
  if (
    place.stratum === 0 &&
    place.tiles.length > 0 &&
    HIGHEST_POINT_KINDS.has(place.kind) &&
    place.highestLevel > 0
  ) {
    facts.push({
      term: words.facts.highest,
      value: measures.metres(altitudeMetres(place.highestLevel, undefined)),
    })
  }
  return facts.slice(0, FACTS)
}

function placeLandmarks(g: Gazetteer, place: PlaceRecord): SheetItem[] {
  const indexes = new Set(place.landmarks)
  if (place.tiles.length < LANDMARK_SCAN_TILES) {
    for (const tile of place.tiles) {
      for (const index of itemsAt(g.world.surface.landmarks, tile)) indexes.add(index)
    }
  }
  return [...indexes]
    .map((index) => g.world.landmarks[index])
    .filter(isDefined)
    .map((landmark) => landmarkItem(g, landmark))
}

function placeSections(g: Gazetteer, place: PlaceRecord): SheetSection[] {
  const children = place.children.map((index) => placeAt(g.world, index)).filter(isDefined)
  const subdivisions = section(
    g,
    'subdivisions',
    children.map((child) => placeItem(g, child)),
    SUBDIVISION_ITEMS,
  )
  const quartered = QUARTERED_KINDS.has(place.kind)
  if (place.stratum > 0) {
    const record = stratumOf(g, place.stratum)
    return [
      subdivisions,
      record
        ? section(
            g,
            'establishments',
            undergroundEstablishments(g, record, place.tiles, quartered),
            ESTABLISHMENT_ITEMS,
          )
        : undefined,
      place.tiles.length < ABOVE_SCAN_TILES
        ? section(g, 'above', abovePlaces(g, place.tiles), ABOVE_ITEMS)
        : undefined,
    ].filter(isDefined)
  }
  const small = place.tiles.length < SMALL_PLACE_TILES
  return [
    subdivisions,
    section(g, 'landmarks', placeLandmarks(g, place)),
    small
      ? section(
          g,
          'establishments',
          [
            ...surfaceEstablishments(g, place.tiles, quartered),
            ...skyEstablishments(g, place.skyTiles),
          ],
          ESTABLISHMENT_ITEMS,
        )
      : undefined,
    small ? section(g, 'strata', strataItems(g, place.tiles, 0)) : undefined,
    small ? section(g, 'routes', routeItems(g, place.tiles)) : undefined,
  ].filter(isDefined)
}

function placeSheet(g: Gazetteer, ref: AtlasRef & { kind: 'place' }): Sheet | undefined {
  const place = placeAt(g.world, ref.place)
  if (!place) return undefined
  return {
    eyebrow: placeKind(g, place),
    title: place.name,
    tone: 'gold',
    colour: place.kind === 'country' ? place.color : undefined,
    facts: placeFacts(g, place),
    description: place.description,
    crumbs: crumbsOf(chainOf(g.world, place), ref),
    sections: placeSections(g, place),
  }
}

export function describeRef(g: Gazetteer, ref: AtlasRef): Sheet | undefined {
  switch (ref.kind) {
    case 'tile':
      return tileSheet(g, ref)
    case 'under':
      return underSheet(g, ref)
    case 'sky':
      return skySheet(g, ref)
    case 'landmark':
      return landmarkSheet(g, ref)
    case 'place':
      return placeSheet(g, ref)
  }
}

function surfaceHover(g: Gazetteer, tile: number): HoverText | undefined {
  const { world, words, measures } = g
  const code = world.surface.type[tile]
  if (code === undefined) return undefined
  const type = tileWord(g, code).label
  const quarter = placeAt(world, world.surface.quarter[tile])
  const city = placeAt(world, world.surface.city[tile])
  const [landmark] = itemsAt(world.surface.landmarks, tile)
  const where =
    quarter && city
      ? joined(quarter.name, city.name)
      : (city?.name ??
        deepest(world, naturalsAt(world, tile))?.name ??
        placeAt(world, world.surface.region[tile])?.name ??
        placeAt(world, world.surface.sea[tile])?.name)
  const altitude = tileAltitude(world, tile)
  return {
    title: (landmark === undefined ? undefined : world.landmarks[landmark]?.name) ?? where ?? type,
    detail: joined(
      type,
      altitude >= 0
        ? words.altitudeShort(measures.number(altitude))
        : words.depthShort(measures.number(-altitude)),
      cell(g, tile),
    ),
    tone: 'gold',
  }
}

function underHover(g: Gazetteer, level: number, tile: number): HoverText | undefined {
  const { world } = g
  const record = stratumOf(g, level)
  const rockKey = ROCKS[record?.rock[tile] ?? -1]
  const settingKey = SETTINGS[record?.setting[tile] ?? -1]
  if (!record || rockKey === undefined || settingKey === undefined) return undefined
  const rock = word(world.vocabulary.rocks, rockKey, 'rock').label
  const setting = word(world.vocabulary.settings, settingKey, 'setting').label
  const quarter = placeAt(world, record.quarter[tile])
  const cavern = placeAt(world, record.cavern[tile]) ?? placeAt(world, record.network[tile])
  return {
    title: quarter && cavern ? joined(quarter.name, cavern.name) : (cavern?.name ?? rock),
    detail: joined(setting, rock, g.words.stratum(level), cell(g, tile)),
    tone: 'underground',
  }
}

function skyHover(g: Gazetteer, sky: number): HoverText | undefined {
  const { world, words, measures } = g
  const code = world.sky.type[sky]
  if (code === undefined) return undefined
  const place = placeAt(world, world.sky.place[sky])
  const parent = place?.kind === 'quarter' ? placeAt(world, place.parent) : undefined
  const island = world.sky.islands[world.sky.island[sky] ?? -1]
  const landmark = island ? world.landmarks[island.landmark] : undefined
  const name = place && parent ? joined(place.name, parent.name) : (place?.name ?? landmark?.name)
  const type = tileWord(g, code).label
  return {
    title: name ?? type,
    detail: joined(
      type,
      words.altitudeShort(measures.number(skyAltitudeMetres(world.sky.y[sky] ?? 0))),
      skyCell(g, sky),
    ),
    tone: 'landmark',
  }
}

export function hoverText(g: Gazetteer, ref: AtlasRef): HoverText | undefined {
  switch (ref.kind) {
    case 'tile':
      return surfaceHover(g, ref.tile)
    case 'under':
      return underHover(g, ref.level, ref.tile)
    case 'sky':
      return skyHover(g, ref.sky)
    case 'place': {
      const place = placeAt(g.world, ref.place)
      return place && { title: place.name, detail: placeKind(g, place), tone: 'gold' }
    }
    case 'landmark': {
      const landmark = g.world.landmarks[ref.landmark]
      return (
        landmark && { title: landmark.name, detail: landmarkKind(g, landmark), tone: 'landmark' }
      )
    }
  }
}

export function unexploredHover(g: Gazetteer): HoverText {
  return { title: g.words.unexplored, detail: g.words.notDiscovered, tone: 'unexplored' }
}

export function endpointLabel(g: Gazetteer, ref: AtlasRef): string {
  switch (ref.kind) {
    case 'tile':
      return cell(g, ref.tile)
    case 'under':
      return joined(g.words.stratum(ref.level), cell(g, ref.tile))
    case 'sky':
      return skyCell(g, ref.sky)
    case 'place': {
      const place = placeAt(g.world, ref.place)
      if (!place) return ''
      if (place.stratum > 0) return joined(place.name, g.words.stratum(place.stratum))
      return place.kind === 'city' ? place.name : joined(place.name, placeKind(g, place))
    }
    case 'landmark': {
      const landmark = g.world.landmarks[ref.landmark]
      return landmark ? joined(landmark.name, g.words.landmark) : ''
    }
  }
}

function placeEntry(g: Gazetteer, place: PlaceRecord): PlaceEntry {
  const ref: AtlasRef = { kind: 'place', place: place.index }
  const kind = placeKind(g, place)
  return {
    key: refKey(ref),
    ref,
    name: place.name,
    kind: place.stratum > 0 ? joined(kind, g.words.stratum(place.stratum)) : kind,
    dot: placeDot(place),
  }
}

function landmarkEntry(g: Gazetteer, landmark: LandmarkRecord): PlaceEntry {
  const ref: AtlasRef = { kind: 'landmark', landmark: landmark.index }
  return {
    key: refKey(ref),
    ref,
    name: landmark.name,
    kind: landmarkKind(g, landmark),
    dot: LANDMARK_DOT,
  }
}

export function featuredEntries(g: Gazetteer): PlaceEntry[] {
  const { world } = g
  return [
    ...world.featuredPlaces
      .map((index) => placeAt(world, index))
      .filter(isDefined)
      .map((place) => placeEntry(g, place)),
    ...world.featuredLandmarks
      .map((index) => world.landmarks[index])
      .filter(isDefined)
      .map((landmark) => landmarkEntry(g, landmark)),
  ]
}

export function placeEntries(g: Gazetteer): PlaceEntry[] {
  return [
    ...g.world.places.map((place) => placeEntry(g, place)),
    ...g.world.landmarks.map((landmark) => landmarkEntry(g, landmark)),
  ].sort((a, b) => g.collator.compare(a.name, b.name) || g.collator.compare(a.kind, b.kind))
}

export function folded(locale: Locale, text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase(locale)
}

export function findEntries(
  g: Gazetteer,
  entries: readonly PlaceEntry[],
  query: string,
): PlaceEntry[] {
  const wanted = folded(g.locale, query.trim())
  if (wanted === '') return []
  return entries.filter((entry) => folded(g.locale, entry.name).includes(wanted))
}
