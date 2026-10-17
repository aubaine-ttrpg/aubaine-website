import {
  NO_LANDMARK,
  type Piece,
  PROP_FAMILIES,
  type PropFamily,
  type PropModel,
} from '../contract/scene.ts'
import { type BuildingStyle, ESTABLISHMENT_DRESSINGS, TILE_TYPES } from '../vocabulary.ts'
import { CORNERS, EDGES, type Grid, hexReach, NO_TILE, neighbourOf } from '../world/grid.ts'
import type { LandmarkRecord, World } from '../world/model.ts'
import { mulberry32 } from '../world/noise.ts'
import { type ReliefField, reliefField, reliefNoise, surfaceY } from '../world/relief.ts'
import { smoothstep01 } from '../world/smoothstep.ts'
import { PropBuilder, type PropGeometry, packProp } from './builder.ts'
import { type HeightMap, occlusion } from './heightmap.ts'
import { WallWriter, writeHexTop } from './hex-mesh.ts'
import { InstanceBatch } from './instances.ts'
import { familyOf, PROP_KIND } from './kinds.ts'
import { MeshWriter, RIBBON_LAYOUT, unorm } from './mesh.ts'
import { fineTower, palace } from './models/buildings.ts'
import { watchtower } from './models/landmarks.ts'
import { at, box, cone, cyl, tube, type Vec3 } from './models/parts.ts'
import { crystalCluster } from './models/vegetation.ts'
import { torus } from './primitives.ts'
import { HOUSE_VARIANTS, prototypeKey } from './prototypes.ts'
import { TOP_LAYOUT, WALL_LAYOUT } from './terrain.ts'

export type SkyBuild = {
  pieces: Piece[]
  models: PropModel[]
  batch: InstanceBatch
}

type SkyHex = {
  index: number
  tile: number
  island: number
  x: number
  z: number
  y: number
  type: number
  ring: number
  place: number
}

type SkyIsland = {
  landmark: LandmarkRecord
  city: boolean
  base: number
  hexes: SkyHex[]
}

type Sky = {
  grid: Grid
  at: Int32Array
  hexes: readonly SkyHex[]
  islands: readonly SkyIsland[]
}

type Fall = { x: number; y: number; z: number; nx: number; nz: number; tx: number; tz: number }

type FamilyPart = { vertices: number[]; indices: number[] }

const K = PROP_KIND
const URBAN = TILE_TYPES.indexOf('urban')
const FOREST = TILE_TYPES.indexOf('forest')
const MEADOW = TILE_TYPES.indexOf('meadow')
const HIGHLAND = TILE_TYPES.indexOf('highland')
const CLIFF_TYPE = HIGHLAND
const TOP_RINGS = 3
const SLOPE_STEP = 0.04
const PAVED_RISE = 0.004
const ISLAND_DROP = 0.42
const WALL_COLUMNS = 6
const WALL_ROW = 0.08
const LEVEL_TOLERANCE = 1e-4
const FALL_THRESHOLD = 0.3
const UNDERSIDE_LIP = -99
const FALL_SEGMENTS = 8
const FALL_WIDTH = 0.24
const FALL_DROP = 3.6
const PROP_SEED = 808
const RANK_SEED = 809
const SKY_STYLE: BuildingStyle = 'aubemont'
const MARBLE = '#f1ece2'
const SLATE_BLUE = '#34497e'
const PIER_WOOD = '#5a4026'
const HARBOUR_KINDS: ReadonlySet<string> = new Set(ESTABLISHMENT_DRESSINGS.harbour)

function treeOf(species: number): string {
  if (species < 0.5) return 'oak'
  if (species < 0.8) return 'pine'
  return 'bush'
}

function skyOf(world: World, grid: Grid): Sky {
  const record = world.sky
  const hexes = Array.from(
    record.tile,
    (tile, index): SkyHex => ({
      index,
      tile,
      island: record.island[index] ?? -1,
      x: grid.x[tile] ?? 0,
      z: grid.z[tile] ?? 0,
      y: record.y[index] ?? 0,
      type: record.type[index] ?? 0,
      ring: record.ring[index] ?? 0,
      place: record.place[index] ?? -1,
    }),
  )
  const islands = record.islands.map((island, number): SkyIsland => {
    const landmark = world.landmarks[island.landmark]
    if (!landmark) {
      throw new Error(`sky island ${number} names a missing landmark ${island.landmark}`)
    }
    const members = Array.from(island.tiles, (index) => hexes[index]).filter(
      (hex) => hex !== undefined,
    )
    const lowest = members.reduce((low, hex) => Math.min(low, hex.y), Number.POSITIVE_INFINITY)
    return {
      landmark,
      city: landmark.kind === 'skycity',
      base: lowest - ISLAND_DROP,
      hexes: members,
    }
  })
  return { grid, at: record.at, hexes, islands }
}

function neighbourHex(sky: Sky, hex: SkyHex, edge: number): SkyHex | undefined {
  const tile = neighbourOf(sky.grid, hex.tile, edge)
  const index = tile >= 0 ? (sky.at[tile] ?? -1) : -1
  return index >= 0 ? sky.hexes[index] : undefined
}

function reliefAt(hex: SkyHex, x: number, z: number): number {
  if (hex.type === URBAN) return hex.y + PAVED_RISE
  const rho = Math.min(1, hexReach(x - hex.x, z - hex.z))
  return (
    hex.y +
    (1 - smoothstep01((rho - 0.5) / 0.42)) * 0.07 * (reliefNoise.fbm(x * 1.2, z * 1.2, 3) + 0.45)
  )
}

type Writers = { tops: MeshWriter; cliffs: WallWriter; falls: MeshWriter }

function writeTop(tops: MeshWriter, map: HeightMap, hex: SkyHex): void {
  writeHexTop(tops, hex.x, hex.z, TOP_RINGS, (x, z) => {
    const gx =
      (reliefAt(hex, x + SLOPE_STEP, z) - reliefAt(hex, x - SLOPE_STEP, z)) / (2 * SLOPE_STEP)
    const gz =
      (reliefAt(hex, x, z + SLOPE_STEP) - reliefAt(hex, x, z - SLOPE_STEP)) / (2 * SLOPE_STEP)
    const y = reliefAt(hex, x, z)
    tops.vertex(x, y, z, -gx, 1, -gz)
    tops.bytes(hex.type, hex.type, 0, unorm(occlusion(map, x, y, z)))
  })
}

function writeFall(falls: MeshWriter, fall: Fall): void {
  const x0 = fall.x + fall.nx * 0.03
  const y0 = fall.y + 0.01
  const z0 = fall.z + fall.nz * 0.03
  const x1 = fall.x + fall.nx * 0.55
  const y1 = fall.y - FALL_DROP
  const z1 = fall.z + fall.nz * 0.55
  const start = falls.vertexCount
  for (let k = 0; k <= FALL_SEGMENTS; k++) {
    const f = k / FALL_SEGMENTS
    const x = x0 + (x1 - x0) * f
    const y = y0 + (y1 - y0) * f
    const z = z0 + (z1 - z0) * f
    for (const side of [-0.5, 0.5]) {
      falls.vertex(
        x + fall.tx * FALL_WIDTH * side,
        y,
        z + fall.tz * FALL_WIDTH * side,
        fall.nx,
        0,
        fall.nz,
      )
      falls.float(side + 0.5)
      falls.float(f)
    }
  }
  for (let k = 0; k < FALL_SEGMENTS; k++) {
    const a = start + k * 2
    falls.triangle(a, a + 2, a + 1)
    falls.triangle(a + 1, a + 2, a + 3)
  }
}

function writeWalls(writers: Writers, sky: Sky, island: SkyIsland, hex: SkyHex): void {
  const { cliffs } = writers
  for (let edge = 0; edge < EDGES; edge++) {
    const next = neighbourHex(sky, hex, edge)
    const lower = next?.island === hex.island ? next : undefined
    if (lower && lower.y >= hex.y - LEVEL_TOLERANCE) continue
    const bottom = lower ? lower.y : island.base
    const [c0x, c0z] = CORNERS[edge] ?? [0, 0]
    const [c1x, c1z] = CORNERS[(edge + 1) % EDGES] ?? [0, 0]
    const angle = (edge * Math.PI) / 3
    const nx = Math.cos(angle)
    const nz = Math.sin(angle)
    const rows = Math.max(1, Math.ceil((hex.y - bottom) / WALL_ROW))
    const start = cliffs.vertexCount
    for (let m = 0; m <= WALL_COLUMNS; m++) {
      const u = m / WALL_COLUMNS
      const x = hex.x + c0x + (c1x - c0x) * u
      const z = hex.z + c0z + (c1z - c0z) * u
      const taper = Math.sin(Math.PI * u) ** 0.5
      const top = reliefAt(hex, x, z)
      for (let r = 0; r <= rows; r++) {
        const f = r / rows
        const y = bottom + (top - bottom) * f
        const push = lower
          ? 0
          : reliefNoise.n2(x * 2 + y * 3, z * 2 - y * 2) * 0.05 * taper * Math.sin(Math.PI * f)
        cliffs.vertex(x + nx * push, y, z + nz * push, nx, 0, nz, hex.y)
      }
    }
    for (let m = 0; m < WALL_COLUMNS; m++) {
      for (let r = 0; r < rows; r++) {
        const a = start + m * (rows + 1) + r
        const c = a + rows + 1
        cliffs.triangle(a, c, a + 1)
        cliffs.triangle(a + 1, c, c + 1)
      }
    }
    if (
      !lower &&
      hex.type !== URBAN &&
      reliefNoise.n2(hex.x * 3.1, hex.z * 2.7 + edge) > FALL_THRESHOLD
    ) {
      writeFall(writers.falls, {
        x: hex.x + (c0x + c1x) / 2,
        y: hex.y,
        z: hex.z + (c0z + c1z) / 2,
        nx,
        nz,
        tx: c1x - c0x,
        tz: c1z - c0z,
      })
    }
  }
}

function writeUnderside(cliffs: WallWriter, hex: SkyHex, base: number): void {
  const depth =
    0.7 + 1.9 * Math.max(0, 1 - hex.ring / 4) + reliefNoise.n2(hex.x * 2.1, hex.z * 2.1) * 0.5
  const start = cliffs.vertexCount
  for (let edge = 0; edge < EDGES; edge++) {
    const [cx, cz] = CORNERS[edge] ?? [0, 0]
    cliffs.vertex(hex.x + cx, base, hex.z + cz, cx * 0.7, -0.5, cz * 0.7, UNDERSIDE_LIP)
  }
  for (let edge = 0; edge < EDGES; edge++) {
    const [cx, cz] = CORNERS[edge] ?? [0, 0]
    const n = reliefNoise.n2(hex.x * 3 + edge, hex.z * 3 - edge)
    const spread = 0.55 + 0.25 * n
    cliffs.vertex(
      hex.x + cx * spread,
      base - depth * (0.42 + 0.15 * n),
      hex.z + cz * spread,
      cx * 0.6,
      -0.7,
      cz * 0.6,
      UNDERSIDE_LIP,
    )
  }
  const tip = cliffs.vertex(
    hex.x + reliefNoise.n2(hex.x, hex.z) * 0.2,
    base - depth,
    hex.z + reliefNoise.n2(hex.z, hex.x) * 0.2,
    0,
    -1,
    0,
    UNDERSIDE_LIP,
  )
  for (let edge = 0; edge < EDGES; edge++) {
    const a = start + edge
    const b = start + ((edge + 1) % EDGES)
    const c = start + EDGES + edge
    const d = start + EDGES + ((edge + 1) % EDGES)
    cliffs.triangle(a, b, c)
    cliffs.triangle(b, d, c)
    cliffs.triangle(c, d, tip)
  }
}

class SkyProps {
  readonly batch = new InstanceBatch()
  private readonly builder = new PropBuilder()
  private readonly random = mulberry32(PROP_SEED)
  private readonly rank = mulberry32(RANK_SEED)
  private readonly blueTower = fineTower(0.75, 0.09, SLATE_BLUE, MARBLE)
  private readonly tealTower = fineTower(1.05, 0.1, '#3aa6a0', MARBLE)

  buildCitadel(hex: SkyHex): void {
    const { x, y, z } = hex
    this.builder.merge(palace(), at(x, y, z, 0, 0.3, 0, 0.62))
    this.builder.add(cyl(0.05, 0.09, 2.6, 12), at(x, y + 1.3 + 0.6, z), MARBLE, K.stone)
    this.builder.add(cone(0.1, 0.45, 12), at(x, y + 3.4, z), SLATE_BLUE, K.roof)
    this.builder.merge(crystalCluster(), at(x, y + 3.62, z))
    for (let k = 0; k < 3; k++) {
      this.builder.add(
        torus(0.32 + k * 0.12, 0.01, 6, 36),
        at(x, y + 3.15 + k * 0.17, z, Math.PI / 2 + k * 0.25, 0, k * 0.3),
        '#c9a4ff',
        K.crystal,
      )
    }
  }

  buildTowerRing(hex: SkyHex): void {
    const { x, y, z } = hex
    this.builder.merge(
      hex.index % 2 === 1 ? this.blueTower : this.tealTower,
      at(x, y, z, 0, this.random() * 6, 0),
    )
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.5
      const key = this.random() < 0.5 ? 'oak' : prototypeKey.house(SKY_STYLE, k % HOUSE_VARIANTS)
      const scale = this.random() < 0.5 ? 0.24 : 1.5
      this.place(key, x + Math.cos(a) * 0.5, y, z + Math.sin(a) * 0.5, -a, scale)
    }
  }

  buildDistrict(hex: SkyHex): void {
    for (let column = -5; column <= 5; column++) {
      for (let row = -5; row <= 5; row++) {
        const dx = (column + row * 0.5) * 0.15 + (this.random() - 0.5) * 0.03
        const dz = row * 0.13 + (this.random() - 0.5) * 0.03
        if (hexReach(dx, dz) > 0.84 || Math.abs(dz) < 0.04) continue
        const key =
          this.random() < 0.05
            ? prototypeKey.tower(SKY_STYLE, 1 + (column & 1))
            : prototypeKey.house(SKY_STYLE, ((column * 7 + row * 3) & 7) % HOUSE_VARIANTS)
        const turn = (Math.round(this.random() * 3) * Math.PI) / 3 + Math.PI / 2
        const scale = 1.25 + this.random() * 0.3
        this.place(key, hex.x + dx, hex.y, hex.z + dz, turn, scale)
      }
    }
  }

  buildPiers(sky: Sky, hex: SkyHex): void {
    for (let edge = 0; edge < EDGES; edge++) {
      if (neighbourHex(sky, hex, edge)) continue
      const angle = (edge * Math.PI) / 3
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const x = hex.x + cos * 0.95
      const z = hex.z + sin * 0.95
      this.builder.add(
        box(0.9, 0.035, 0.22),
        at(x + cos * 0.4, hex.y, z + sin * 0.4, 0, -angle, 0),
        '#7a5a3a',
        K.wood,
      )
      for (const side of [-1, 1]) {
        this.builder.add(
          box(0.9, 0.05, 0.02),
          at(
            x + cos * 0.4 - sin * 0.11 * side,
            hex.y + 0.05,
            z + sin * 0.4 + cos * 0.11 * side,
            0,
            -angle,
            0,
          ),
          PIER_WOOD,
          K.wood,
        )
      }
      this.builder.add(
        cyl(0.02, 0.025, 0.55, 6),
        at(x + cos * 0.8, hex.y + 0.28, z + sin * 0.8),
        PIER_WOOD,
        K.wood,
      )
    }
  }

  plantGrove(hex: SkyHex): void {
    const wanted = hex.type === FOREST ? 9 : hex.type === MEADOW ? 3 : 1
    const highland = hex.type === HIGHLAND
    let planted = 0
    for (let attempt = 0; attempt < wanted * 4 && planted < wanted; attempt++) {
      const dx = (this.random() - 0.5) * 1.6
      const dz = (this.random() - 0.5) * 1.6
      if (hexReach(dx, dz) > 0.8) continue
      const species = this.random()
      const turn = this.random() * 6
      const scale = highland ? 0.6 + this.random() * 0.5 : 0.3 + this.random() * 0.16
      const key = highland ? 'boulder' : treeOf(species)
      this.place(key, hex.x + dx, hex.y + 0.02, hex.z + dz, turn, scale, !highland)
      planted++
    }
  }

  raiseWatchtower(hex: SkyHex): void {
    this.builder.merge(watchtower(), at(hex.x, hex.y, hex.z, 0, 0, 0, 1.6))
  }

  raiseStandingStones(hex: SkyHex): void {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2
      this.builder.add(
        cyl(0.03, 0.035, 0.2 + (k % 3) * 0.08, 8),
        at(hex.x + Math.cos(a) * 0.32, hex.y + 0.1, hex.z + Math.sin(a) * 0.32),
        '#d9d2c4',
        K.stone,
      )
    }
  }

  hangChains(field: ReliefField, landmark: LandmarkRecord): void {
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.5
      const x0 = landmark.x + Math.cos(a) * 0.9
      const z0 = landmark.z + Math.sin(a) * 0.9
      const anchor = Math.max(surfaceY(field, x0 * 1.02, z0 * 1.02), 0)
      const points: Vec3[] = []
      const radii: number[] = []
      for (let q = 0; q <= 26; q++) {
        const f = q / 26
        points.push([
          x0 + Math.cos(a) * f * 1.4,
          landmark.y - 0.5 + (anchor - landmark.y + 0.5) * f - Math.sin(f * Math.PI) * 0.7,
          z0 + Math.sin(a) * f * 1.4,
        ])
        radii.push(0.035)
      }
      tube(this.builder, points, radii, '#3a3836', K.metal, 6)
    }
  }

  hangCrystals(island: SkyIsland): void {
    const { landmark, city } = island
    for (let k = 0; k < (city ? 8 : 3); k++) {
      const a = this.random() * Math.PI * 2
      const reach = this.random() * (city ? 2.5 : 0.8)
      const y = landmark.y - (city ? 2.2 : 1.1) - this.random() * 0.6
      const scale = city ? 2.2 + this.random() * 1.4 : 1 + this.random() * 0.6
      this.builder.merge(
        crystalCluster(),
        at(
          landmark.x + Math.cos(a) * reach,
          y,
          landmark.z + Math.sin(a) * reach,
          Math.PI,
          0,
          0,
          scale,
        ),
      )
    }
  }

  geometry(): PropGeometry {
    return this.builder.geometry()
  }

  private place(
    key: string,
    x: number,
    y: number,
    z: number,
    turn: number,
    scale: number,
    thinned = false,
  ): void {
    this.batch.add(key, 'sky', { x, y, z, ry: turn, sx: scale }, { thinned, rank: this.rank() })
  }
}

function harbourQuarters(world: World): Set<number> {
  const quarters = new Set<number>()
  for (const establishment of world.establishments) {
    if (!HARBOUR_KINDS.has(establishment.kind)) continue
    if (world.places[establishment.place]?.kind === 'quarter') quarters.add(establishment.place)
  }
  return quarters
}

function skyProps(world: World, sky: Sky): SkyProps {
  const props = new SkyProps()
  const harbours = harbourQuarters(world)
  for (const island of sky.islands) {
    const { features } = island.landmark
    for (const hex of island.hexes) {
      if (island.city && hex.ring === 0) props.buildCitadel(hex)
      else if (island.city && hex.ring === 1) props.buildTowerRing(hex)
      else if (hex.type === URBAN) {
        props.buildDistrict(hex)
        if (harbours.has(hex.place)) props.buildPiers(sky, hex)
      } else {
        props.plantGrove(hex)
        if (hex.ring === 0 && features.includes('watchtower')) props.raiseWatchtower(hex)
        if (hex.ring === 0 && features.includes('standing-stones')) props.raiseStandingStones(hex)
      }
    }
  }
  const field = reliefField(sky.grid, world.surface)
  for (const island of sky.islands) {
    if (island.landmark.features.includes('chains')) props.hangChains(field, island.landmark)
  }
  for (const island of sky.islands) props.hangCrystals(island)
  return props
}

function gather(geometry: PropGeometry, part: FamilyPart): PropGeometry {
  const count = part.vertices.length
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const flutter = new Float32Array(count)
  const colours = new Uint8Array(count * 4)
  for (const [slot, vertex] of part.vertices.entries()) {
    for (let axis = 0; axis < 3; axis++) {
      positions[slot * 3 + axis] = geometry.positions[vertex * 3 + axis] ?? 0
      normals[slot * 3 + axis] = geometry.normals[vertex * 3 + axis] ?? 0
    }
    flutter[slot] = geometry.flutter[vertex] ?? 0
    for (let channel = 0; channel < 4; channel++) {
      colours[slot * 4 + channel] = geometry.colours[vertex * 4 + channel] ?? 0
    }
  }
  return { positions, normals, flutter, colours, indices: Uint32Array.from(part.indices) }
}

function splitByFamily(geometry: PropGeometry): Map<PropFamily, PropGeometry> {
  const { colours, indices } = geometry
  const kindFamilies = new Map<number, PropFamily>()
  const familyAt = (vertex: number): PropFamily => {
    const kind = colours[vertex * 4 + 3] ?? 0
    const known = kindFamilies.get(kind)
    if (known) return known
    const family = familyOf([kind])
    kindFamilies.set(kind, family)
    return family
  }
  const parts = new Map<PropFamily, FamilyPart>()
  const partOf = (family: PropFamily): FamilyPart => {
    const known = parts.get(family)
    if (known) return known
    const part: FamilyPart = { vertices: [], indices: [] }
    parts.set(family, part)
    return part
  }
  const slots = new Uint32Array(geometry.positions.length / 3)
  for (let vertex = 0; vertex < slots.length; vertex++) {
    const part = partOf(familyAt(vertex))
    slots[vertex] = part.vertices.length
    part.vertices.push(vertex)
  }
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] ?? 0
    const b = indices[i + 1] ?? 0
    const c = indices[i + 2] ?? 0
    const family = familyAt(a)
    if (familyAt(b) !== family || familyAt(c) !== family) {
      throw new Error(`sky prop triangle ${i / 3} joins vertices of different prop families`)
    }
    partOf(family).indices.push(slots[a] ?? 0, slots[b] ?? 0, slots[c] ?? 0)
  }
  return new Map([...parts].map(([family, part]) => [family, gather(geometry, part)]))
}

function skyModels(geometry: PropGeometry): PropModel[] {
  const parts = splitByFamily(geometry)
  return PROP_FAMILIES.flatMap((family): PropModel[] => {
    const part = parts.get(family)
    if (!part) return []
    return [
      {
        layer: 'sky',
        landmark: NO_LANDMARK,
        family,
        mesh: packProp(part),
        doubleSided: false,
        casts: true,
        position: [0, 0, 0],
        turn: 0,
        scale: 1,
      },
    ]
  })
}

export function buildSky(world: World, grid: Grid, map: HeightMap): SkyBuild {
  const sky = skyOf(world, grid)
  const walls = new MeshWriter(WALL_LAYOUT)
  const writers: Writers = {
    tops: new MeshWriter(TOP_LAYOUT),
    cliffs: new WallWriter(walls, map, { tile: NO_TILE, biome: CLIFF_TYPE }),
    falls: new MeshWriter(RIBBON_LAYOUT),
  }
  for (const island of sky.islands) {
    for (const hex of island.hexes) {
      writeTop(writers.tops, map, hex)
      writeWalls(writers, sky, island, hex)
      writeUnderside(writers.cliffs, hex, island.base)
    }
  }
  const pieces: Piece[] = []
  if (writers.tops.vertexCount > 0) {
    pieces.push({ material: 'sky-top', mesh: writers.tops.build(), casts: true })
  }
  if (walls.vertexCount > 0) {
    pieces.push({ material: 'terrain-wall', mesh: walls.build(), casts: true })
  }
  if (writers.falls.vertexCount > 0) {
    pieces.push({ material: 'sky-fall', mesh: writers.falls.build(), casts: false })
  }
  const props = skyProps(world, sky)
  return { pieces, models: skyModels(props.geometry()), batch: props.batch }
}
