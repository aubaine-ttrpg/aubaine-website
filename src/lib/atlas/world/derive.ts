import type { Locale } from '../../i18n/locales.ts'
import { ALOFT_LANDMARK_KINDS, TILE_TYPES, WATER_TILE_TYPES } from '../vocabulary.ts'
import type { AuthoredWorld } from './decode.ts'
import { EDGES, type Grid, hexDistance, neighbourOf } from './grid.ts'
import type {
  LakeRecord,
  LandmarkRecord,
  Offsets,
  PlaceRecord,
  SkyRecord,
  SurfaceRecord,
  TravelPlace,
  TravelRules,
  UndergroundRecord,
  Vocabulary,
  World,
} from './model.ts'
import { LEVEL_HEIGHT, METRES_PER_LEVEL, RELIEF_BY_TYPE, SEA_DEPTH, SKY_STEP } from './relief.ts'

export const ROUTE_BITS = { road: 1, trail: 2, rail: 4, river: 8, sea: 16 } as const

const WATER_CODES = new Set(WATER_TILE_TYPES.map((type) => TILE_TYPES.indexOf(type)))
const LAKE_CODE = TILE_TYPES.indexOf('lake')
const ALOFT: ReadonlySet<string> = new Set(ALOFT_LANDMARK_KINDS)

function offsets(size: number, lists: Map<number, number[]>): Offsets {
  const start = new Int32Array(size + 1)
  let total = 0
  for (let tile = 0; tile < size; tile++) {
    start[tile] = total
    total += lists.get(tile)?.length ?? 0
  }
  start[size] = total
  const items = new Int32Array(total)
  for (const [tile, list] of lists) items.set(list, start[tile] ?? 0)
  return { start, items }
}

export function itemsAt(table: Offsets, tile: number): Int32Array {
  return table.items.subarray(table.start[tile] ?? 0, table.start[tile + 1] ?? 0)
}

function push(lists: Map<number, number[]>, key: number, value: number): void {
  const list = lists.get(key)
  if (list) list.push(value)
  else lists.set(key, [value])
}

function lakesOf(
  grid: Grid,
  type: Uint8Array,
  level: Int8Array,
): { lake: Int16Array; lakes: LakeRecord[] } {
  const lake = new Int16Array(grid.size).fill(-1)
  const lakes: LakeRecord[] = []
  for (let start = 0; start < grid.size; start++) {
    if (type[start] !== LAKE_CODE || (lake[start] ?? 0) >= 0) continue
    const id = lakes.length
    const tiles: number[] = []
    const stack = [start]
    lake[start] = id
    while (stack.length > 0) {
      const tile = stack.pop() ?? 0
      tiles.push(tile)
      for (let edge = 0; edge < EDGES; edge++) {
        const next = neighbourOf(grid, tile, edge)
        if (next >= 0 && type[next] === LAKE_CODE && (lake[next] ?? 0) < 0) {
          lake[next] = id
          stack.push(next)
        }
      }
    }
    const surface = level[start] ?? 1
    lakes.push({ level: surface, y: surface * LEVEL_HEIGHT, tiles: Int32Array.from(tiles) })
  }
  return { lake, lakes }
}

function connections(
  grid: Grid,
  y: Float32Array,
  water: Uint8Array,
  lake: Int16Array,
  lakes: LakeRecord[],
  level: Int8Array,
): Int8Array {
  const connection = new Int8Array(grid.size * EDGES)
  for (let tile = 0; tile < grid.size; tile++) {
    for (let edge = 0; edge < EDGES; edge++) {
      const other = neighbourOf(grid, tile, edge)
      connection[tile * EDGES + edge] = connectionBetween(tile, other, y, water, lake, lakes, level)
    }
  }
  return connection
}

function connectionBetween(
  a: number,
  b: number,
  y: Float32Array,
  water: Uint8Array,
  lake: Int16Array,
  lakes: LakeRecord[],
  level: Int8Array,
): number {
  if (b < 0) return 3
  const ya = y[a] ?? 0
  const yb = y[b] ?? 0
  const gap = Math.abs(ya - yb)
  const wetA = water[a] === 1
  const wetB = water[b] === 1
  const lakeA = (lake[a] ?? -1) >= 0
  const lakeB = (lake[b] ?? -1) >= 0
  if (wetA && wetB) {
    if (lakeA !== lakeB) return 2
    return gap <= 0.5 ? 0 : 2
  }
  if (!wetA && !wetB) return gap <= 0.21 ? 0 : gap <= 0.41 ? 1 : 2
  const land = wetA ? b : a
  const wet = wetA ? a : b
  const wetLake = lake[wet] ?? -1
  if (wetLake >= 0) return Math.abs((y[land] ?? 0) - (lakes[wetLake]?.y ?? 0)) <= 0.21 ? 0 : 2
  return (level[land] ?? 0) <= 1 && level[wet] === -1 ? 0 : 2
}

function surfaceOf(world: AuthoredWorld): { surface: SurfaceRecord; lakes: LakeRecord[] } {
  const { grid, type, level } = world
  const size = grid.size
  const water = new Uint8Array(size)
  for (let tile = 0; tile < size; tile++) water[tile] = WATER_CODES.has(type[tile] ?? 0) ? 1 : 0
  const { lake, lakes } = lakesOf(grid, type, level)

  const y = new Float32Array(size)
  for (let tile = 0; tile < size; tile++) {
    const lakeId = lake[tile] ?? -1
    if (lakeId >= 0) {
      let shore = false
      for (let edge = 0; edge < EDGES; edge++) {
        const next = neighbourOf(grid, tile, edge)
        if (next >= 0 && water[next] === 0) shore = true
      }
      y[tile] = (lakes[lakeId]?.y ?? 0) - (shore ? 0.24 : 0.44)
    } else if (water[tile] === 1) {
      y[tile] = SEA_DEPTH[level[tile] ?? -1] ?? 0
    } else {
      y[tile] = (level[tile] ?? 1) * LEVEL_HEIGHT
    }
  }

  const connection = connections(grid, y, water, lake, lakes, level)
  const edgeMid = new Float32Array(size * EDGES)
  const cornerHeight = new Float32Array(size * EDGES)
  for (let tile = 0; tile < size; tile++) {
    const own = y[tile] ?? 0
    for (let edge = 0; edge < EDGES; edge++) {
      const other = neighbourOf(grid, tile, edge)
      edgeMid[tile * EDGES + edge] =
        other >= 0 && connection[tile * EDGES + edge] === 0 ? (own + (y[other] ?? 0)) * 0.5 : own
    }
    for (let corner = 0; corner < EDGES; corner++) {
      const before = (corner + 5) % EDGES
      const a = neighbourOf(grid, tile, before)
      const b = neighbourOf(grid, tile, corner)
      const joinsA = a >= 0 && connection[tile * EDGES + before] === 0
      const joinsB = b >= 0 && connection[tile * EDGES + corner] === 0
      const joinsAB = a >= 0 && b >= 0 && connection[a * EDGES + ((corner + 1) % EDGES)] === 0
      let sum = own
      let count = 1
      if (joinsA || (joinsB && joinsAB)) {
        sum += y[a] ?? 0
        count++
      }
      if (joinsB || (joinsA && joinsAB)) {
        sum += y[b] ?? 0
        count++
      }
      cornerHeight[tile * EDGES + corner] = sum / count
    }
  }
  const amplitude = new Float32Array(size)
  for (let tile = 0; tile < size; tile++) {
    amplitude[tile] = water[tile] === 1 ? 0 : (RELIEF_BY_TYPE[type[tile] ?? 0] ?? 0) * 1.25 + 0.03
  }

  const parentOf = (place: number) => world.places[place]?.parent ?? -1
  const continent = Int16Array.from(world.landmass)
  const country = new Int16Array(size).fill(-1)
  const region = new Int16Array(size).fill(-1)
  const city = new Int16Array(size).fill(-1)
  const quarter = new Int16Array(size).fill(-1)
  const sea = Int16Array.from(world.sea)
  const naturalLists = new Map<number, number[]>()
  for (let tile = 0; tile < size; tile++) {
    const political = world.political[tile] ?? -1
    if (political >= 0) {
      if (world.places[political]?.kind === 'region') {
        region[tile] = political
        country[tile] = parentOf(political)
      } else country[tile] = political
    }
    const settlement = world.settlement[tile] ?? -1
    if (settlement >= 0) {
      if (world.places[settlement]?.kind === 'quarter') {
        quarter[tile] = settlement
        city[tile] = parentOf(settlement)
      } else city[tile] = settlement
    }
    const naturals = new Set<number>()
    for (const finest of [world.relief[tile] ?? -1, world.cover[tile] ?? -1]) {
      for (let place = finest; place >= 0; place = parentOf(place)) {
        if (world.places[place]?.kind === 'natural') naturals.add(place)
      }
    }
    if (naturals.size > 0)
      naturalLists.set(
        tile,
        [...naturals].sort((a, b) => a - b),
      )
  }

  const roads = new Uint8Array(size)
  const routeLists = new Map<number, number[]>()
  for (const [index, route] of world.routes.entries()) {
    const bit = ROUTE_BITS[route.kind]
    for (const tile of new Set(route.tiles)) {
      roads[tile] = (roads[tile] ?? 0) | bit
      push(routeLists, tile, index)
    }
  }

  return {
    lakes,
    surface: {
      type,
      level,
      water,
      lake,
      y,
      connection,
      cornerHeight,
      edgeMid,
      amplitude,
      continent,
      country,
      region,
      city,
      quarter,
      sea,
      naturals: offsets(size, naturalLists),
      roads,
      routes: offsets(size, routeLists),
      landmarks: { start: new Int32Array(size + 1), items: new Int32Array(0) },
    },
  }
}

function undergroundOf(world: AuthoredWorld): UndergroundRecord[] {
  const kindOf = (place: number) => world.places[place]?.kind
  const parentOf = (place: number) => world.places[place]?.parent ?? -1
  const ancestorOfKind = (place: number, kind: string) => {
    for (let at = place; at >= 0; at = parentOf(at)) if (kindOf(at) === kind) return at
    return -1
  }
  return world.underground.map((stratum) => {
    const size = world.grid.size
    const realm = new Int16Array(size).fill(-1)
    const network = new Int16Array(size).fill(-1)
    const cavern = new Int16Array(size).fill(-1)
    const quarter = new Int16Array(size).fill(-1)
    for (let tile = 0; tile < size; tile++) {
      const finest = stratum.place[tile] ?? -1
      if (finest < 0) continue
      const kind = kindOf(finest)
      if (kind === 'hold-quarter') {
        quarter[tile] = finest
        cavern[tile] = parentOf(finest)
      } else if (kind === 'cavern' || kind === 'hold') cavern[tile] = finest
      const net = ancestorOfKind(finest, 'network')
      network[tile] = net >= 0 ? net : (cavern[tile] ?? -1)
      realm[tile] = ancestorOfKind(finest, 'realm')
    }
    return {
      level: stratum.level,
      depth: stratum.depth,
      rock: stratum.rock,
      setting: stratum.setting,
      floor: stratum.floor,
      realm,
      network,
      cavern,
      quarter,
      finest: stratum.place,
    }
  })
}

function skyOf(world: AuthoredWorld, landmarkY: (landmark: number) => number): SkyRecord {
  const tiles = world.islands.flatMap((island, islandIndex) =>
    island.tiles.map((tile) => ({ ...tile, island: islandIndex, landmark: island.landmark })),
  )
  const at = new Int32Array(world.grid.size).fill(-1)
  const sky: SkyRecord = {
    tile: new Int32Array(tiles.length),
    y: new Float32Array(tiles.length),
    type: new Uint8Array(tiles.length),
    island: new Int16Array(tiles.length),
    place: new Int16Array(tiles.length),
    ring: new Uint8Array(tiles.length),
    at,
    islands: world.islands.map((island) => ({
      landmark: island.landmark,
      tiles: new Int32Array(0),
    })),
  }
  const islandTiles = world.islands.map((): number[] => [])
  for (const [index, entry] of tiles.entries()) {
    const landmark = world.landmarks[entry.landmark]
    const centre = landmark?.tile ?? entry.tile
    const ring = hexDistance(world.grid, entry.tile, centre)
    const steps = landmark?.kind === 'skycity' ? Math.max(0, 3 - ring) : ring === 0 ? 1 : 0
    sky.tile[index] = entry.tile
    sky.y[index] = landmarkY(entry.landmark) + steps * SKY_STEP
    sky.type[index] = entry.type
    sky.island[index] = entry.island
    sky.place[index] = entry.place
    sky.ring[index] = ring
    at[entry.tile] = index
    islandTiles[entry.island]?.push(index)
  }
  sky.islands = world.islands.map((island, index) => ({
    landmark: island.landmark,
    tiles: Int32Array.from(islandTiles[index] ?? []),
  }))
  return sky
}

function edgeDistances(grid: Grid, tiles: readonly number[]): Map<number, number> {
  const inside = new Set(tiles)
  const distance = new Map<number, number>()
  let frontier: number[] = []
  for (const tile of tiles) {
    let edge = false
    for (let side = 0; side < EDGES; side++) {
      const next = neighbourOf(grid, tile, side)
      if (next < 0 || !inside.has(next)) edge = true
    }
    if (edge) {
      distance.set(tile, 0)
      frontier.push(tile)
    }
  }
  while (frontier.length > 0) {
    const next: number[] = []
    for (const tile of frontier) {
      for (let side = 0; side < EDGES; side++) {
        const other = neighbourOf(grid, tile, side)
        if (other >= 0 && inside.has(other) && !distance.has(other)) {
          distance.set(other, (distance.get(tile) ?? 0) + 1)
          next.push(other)
        }
      }
    }
    frontier = next
  }
  return distance
}

function anchorOf(grid: Grid, tiles: readonly number[]): { anchor: number; x: number; z: number } {
  const first = tiles[0] ?? -1
  if (first < 0) return { anchor: -1, x: 0, z: 0 }
  const distance = edgeDistances(grid, tiles)
  let cx = 0
  let cz = 0
  for (const tile of tiles) {
    cx += grid.x[tile] ?? 0
    cz += grid.z[tile] ?? 0
  }
  cx /= tiles.length
  cz /= tiles.length
  let best = first
  let bestScore = -1e9
  for (const tile of tiles) {
    const score =
      (distance.get(tile) ?? 0) * 3 -
      Math.hypot((grid.x[tile] ?? 0) - cx, (grid.z[tile] ?? 0) - cz) * 0.25
    if (score > bestScore) {
      bestScore = score
      best = tile
    }
  }
  return { anchor: best, x: grid.x[best] ?? 0, z: grid.z[best] ?? 0 }
}

export function deriveWorld(
  world: AuthoredWorld,
  vocabulary: Vocabulary,
  travel: TravelRules,
  locale: Locale,
): World {
  const { grid } = world
  const { surface, lakes } = surfaceOf(world)
  const underground = undergroundOf(world)

  const placeTiles = world.places.map((): number[] => [])
  const placeStratum = new Int16Array(world.places.length)
  const placeAloft = new Uint8Array(world.places.length)
  const placeSky = world.places.map((): number[] => [])
  const memberships = [
    surface.continent,
    surface.country,
    surface.region,
    surface.city,
    surface.quarter,
    surface.sea,
  ]
  for (let tile = 0; tile < grid.size; tile++) {
    const members = new Set<number>()
    for (const layer of memberships) {
      const place = layer[tile] ?? -1
      if (place >= 0) members.add(place)
    }
    const start = surface.naturals.start[tile] ?? 0
    const end = surface.naturals.start[tile + 1] ?? 0
    for (let at = start; at < end; at++) members.add(surface.naturals.items[at] ?? -1)
    for (const place of members) placeTiles[place]?.push(tile)
  }
  for (const stratum of underground) {
    for (let tile = 0; tile < grid.size; tile++) {
      for (
        let place = stratum.finest[tile] ?? -1;
        place >= 0;
        place = world.places[place]?.parent ?? -1
      ) {
        placeTiles[place]?.push(tile)
        placeStratum[place] = stratum.level
      }
    }
  }

  const landmarkY = (index: number) => {
    const landmark = world.landmarks[index]
    if (!landmark) return 0
    if (ALOFT.has(landmark.kind)) return (landmark.altitude ?? 0) / METRES_PER_LEVEL
    return surface.y[landmark.tile] ?? 0
  }
  const sky = skyOf(world, landmarkY)
  for (let index = 0; index < sky.place.length; index++) {
    for (
      let place = sky.place[index] ?? -1;
      place >= 0;
      place = world.places[place]?.parent ?? -1
    ) {
      placeSky[place]?.push(index)
      placeAloft[place] = 1
    }
  }

  const landmarkLists = new Map<number, number[]>()
  const landmarks = world.landmarks.map((landmark, index): LandmarkRecord => {
    const aloft = ALOFT.has(landmark.kind)
    const x = grid.x[landmark.tile] ?? 0
    const z = grid.z[landmark.tile] ?? 0
    const footprint = landmark.footprint ?? 0
    const covered: number[] = []
    if (aloft) covered.push(landmark.tile)
    else {
      for (let tile = 0; tile < grid.size; tile++) {
        if (Math.hypot((grid.x[tile] ?? 0) - x, (grid.z[tile] ?? 0) - z) < footprint + 0.3)
          covered.push(tile)
      }
    }
    for (const tile of covered) push(landmarkLists, tile, index)
    return {
      index,
      id: landmark.id,
      kind: landmark.kind,
      name: landmark.name,
      description: landmark.description,
      place: landmark.place,
      tile: landmark.tile,
      aloft,
      footprint,
      altitude: landmark.altitude,
      height: landmark.height,
      length: landmark.length,
      features: landmark.features,
      x,
      y: landmarkY(index),
      z,
      tiles: Int32Array.from(covered),
    }
  })
  surface.landmarks = offsets(grid.size, landmarkLists)

  const capitals = new Set(
    world.places.map((place) => place.capital).filter((capital) => capital >= 0),
  )
  const places = world.places.map((place, index): PlaceRecord => {
    const tiles = [...new Set(placeTiles[index] ?? [])].sort((a, b) => a - b)
    const skyTiles = placeSky[index] ?? []
    const aloft = placeAloft[index] === 1
    let anchor = -1
    let centreX = 0
    let centreZ = 0
    if (tiles.length > 0) {
      const found = anchorOf(grid, tiles)
      anchor = found.anchor
      centreX = found.x
      centreZ = found.z
    } else if (skyTiles.length > 0) {
      for (const skyTile of skyTiles) {
        centreX += grid.x[sky.tile[skyTile] ?? 0] ?? 0
        centreZ += grid.z[sky.tile[skyTile] ?? 0] ?? 0
      }
      centreX /= skyTiles.length
      centreZ /= skyTiles.length
      anchor = sky.tile[skyTiles[0] ?? 0] ?? -1
    }
    let highestLevel = Number.NEGATIVE_INFINITY
    for (const tile of tiles) highestLevel = Math.max(highestLevel, surface.level[tile] ?? 0)
    return {
      index,
      id: place.id,
      kind: place.kind,
      parent: place.parent,
      name: place.name,
      description: place.description,
      subtype: place.subtype,
      style: place.style,
      color: place.color,
      capital: place.capital,
      isCapital: capitals.has(index),
      ruler: place.ruler,
      government: place.government,
      population: place.population,
      features: place.features,
      stratum: placeStratum[index] ?? 0,
      aloft,
      tiles: Int32Array.from(tiles),
      skyTiles: Int32Array.from(skyTiles),
      children: [],
      landmarks: [],
      anchor,
      centreX,
      centreZ,
      highestLevel,
    }
  })
  for (const place of places)
    if (place.parent >= 0) places[place.parent]?.children.push(place.index)
  for (const landmark of landmarks) {
    for (let place = landmark.place; place >= 0; place = places[place]?.parent ?? -1) {
      places[place]?.landmarks.push(landmark.index)
    }
  }

  const establishments = world.establishments.map((establishment, index) => {
    const place = places[establishment.place]
    return {
      index,
      ...establishment,
      stratum: place?.stratum ?? 0,
      aloft: place?.aloft ?? false,
    }
  })

  const collator = new Intl.Collator(locale)
  const travelPlaces: TravelPlace[] = [
    ...places
      .filter(
        (place) =>
          !place.aloft &&
          place.anchor >= 0 &&
          (place.kind === 'city' ||
            place.kind === 'village' ||
            place.kind === 'hold' ||
            (place.kind === 'cavern' && place.tiles.length >= 6)),
      )
      .map(
        (place): TravelPlace => ({
          kind: 'place',
          place: place.index,
          tile: place.anchor,
          stratum: place.stratum,
          aloft: false,
        }),
      ),
    ...landmarks.map(
      (landmark): TravelPlace => ({
        kind: 'landmark',
        landmark: landmark.index,
        tile: landmark.tile,
        stratum: 0,
        aloft: landmark.aloft,
      }),
    ),
  ]
  const travelName = (entry: TravelPlace) =>
    entry.kind === 'place'
      ? (places[entry.place]?.name ?? '')
      : (landmarks[entry.landmark]?.name ?? '')
  travelPlaces.sort((a, b) => collator.compare(travelName(a), travelName(b)))

  return {
    name: world.name,
    columns: grid.columns,
    rows: grid.rows,
    hexKm: world.hexKm,
    featuredPlaces: world.featuredPlaces,
    featuredLandmarks: world.featuredLandmarks,
    surface,
    lakes,
    places,
    landmarks,
    routes: world.routes.map((route, index) => ({ index, ...route })),
    skyLanes: world.skyLanes,
    establishments,
    caves: world.caves,
    sky,
    underground,
    vocabulary,
    travel,
    travelPlaces,
  }
}
