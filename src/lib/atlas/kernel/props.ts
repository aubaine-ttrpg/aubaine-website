import type { Rgb } from '../contract/scene.ts'
import {
  type BuildingStyle,
  ESTABLISHMENT_DRESSINGS,
  TILE_TYPES,
  type TileType,
} from '../vocabulary.ts'
import { itemsAt } from '../world/derive.ts'
import {
  CORNERS,
  EDGES,
  type Grid,
  HALF_SQRT3,
  hexReach,
  neighbourOf,
  tileAt,
} from '../world/grid.ts'
import type { World } from '../world/model.ts'
import { mulberry32, type Random } from '../world/noise.ts'
import { type ReliefField, surfaceY } from '../world/relief.ts'
import { hexToLinear, offsetHsl, WHITE } from './colour.ts'
import { InstanceBatch } from './instances.ts'
import { HOUSE_VARIANTS, prototypeKey } from './prototypes.ts'

export const PROP_CELL = 16
const SCATTER_SEED = 2024
const RANK_SEED = 7919
const STREET = 0.045
const LATTICE = 0.118
const HARBOUR_KINDS: ReadonlySet<string> = new Set(ESTABLISHMENT_DRESSINGS.harbour)
const TEMPLE_KINDS: ReadonlySet<string> = new Set(ESTABLISHMENT_DRESSINGS.temple)
const WORKSHOP_KINDS: ReadonlySet<string> = new Set(ESTABLISHMENT_DRESSINGS.workshop)
const MILL_KINDS: ReadonlySet<string> = new Set(ESTABLISHMENT_DRESSINGS.mill)
const AVENUES: readonly (readonly [number, number])[] = [
  [1, 0],
  [0.5, HALF_SQRT3],
  [-0.5, HALF_SQRT3],
]
const MYXO_OAK = hexToLinear('#7fa3a0')
const SAVANNA_BUSH = hexToLinear('#b9a860')
const DESERT_ROCK = hexToLinear('#d9a070')

const type = (name: TileType) => TILE_TYPES.indexOf(name)
const T = {
  reef: type('reef'),
  urban: type('urban'),
  forest: type('forest'),
  taiga: type('taiga'),
  jungle: type('jungle'),
  swamp: type('swamp'),
  myxo: type('myxo'),
  plains: type('plains'),
  meadow: type('meadow'),
  savanna: type('savanna'),
  desert: type('desert'),
  badlands: type('badlands'),
  tundra: type('tundra'),
  glacier: type('glacier'),
  highland: type('highland'),
  volcanic: type('volcanic'),
  ether: type('ether'),
  beach: type('beach'),
  farm: type('farm'),
  mountain: type('mountain'),
} as const

type Segment = [number, number, number, number, number]

type Put = (
  key: string,
  x: number,
  y: number,
  z: number,
  turn: number,
  scale: number,
  rise?: number,
  tint?: Rgb,
) => void

function segmentDistance(x: number, z: number, segment: Segment): number {
  const [x0, z0, x1, z1] = segment
  const vx = x1 - x0
  const vz = z1 - z0
  const length = vx * vx + vz * vz
  const t = length ? Math.max(0, Math.min(1, ((x - x0) * vx + (z - z0) * vz) / length)) : 0
  return Math.hypot(x - x0 - vx * t, z - z0 - vz * t)
}

export class SurfaceProps {
  private readonly world: World
  private readonly field: ReliefField
  private readonly grid: Grid
  private readonly batch = new InstanceBatch()
  private readonly segments = new Map<number, Segment[]>()
  private readonly footprints: [number, number, number][]
  private readonly kindsAt = new Map<number, Set<string>>()
  private readonly crossings = new Set<string>()
  private readonly lanterns: [number, number, number][] = []
  private readonly windmillNaturals: ReadonlySet<number>
  private random: Random = mulberry32(SCATTER_SEED)
  private rankRandom: Random = mulberry32(RANK_SEED)
  private tile = 0

  constructor(world: World, field: ReliefField) {
    this.world = world
    this.field = field
    this.grid = field.grid
    for (const route of world.routes) {
      if (route.kind === 'sea') continue
      const { tiles } = route
      for (let k = 0; k < tiles.length; k++) {
        const tile = tiles[k] ?? 0
        const list = this.segments.get(tile) ?? []
        for (const other of [tiles[k - 1], tiles[k + 1]]) {
          if (other === undefined) continue
          list.push([
            this.grid.x[tile] ?? 0,
            this.grid.z[tile] ?? 0,
            ((this.grid.x[tile] ?? 0) + (this.grid.x[other] ?? 0)) / 2,
            ((this.grid.z[tile] ?? 0) + (this.grid.z[other] ?? 0)) / 2,
            route.kind === 'river' ? 0.12 : 0.1,
          ])
        }
        this.segments.set(tile, list)
        if (route.kind === 'road' || route.kind === 'rail') {
          const next = tiles[k + 1]
          if (next !== undefined) {
            this.crossings.add(`${tile}:${next}`)
            this.crossings.add(`${next}:${tile}`)
          }
        }
      }
    }
    this.footprints = world.landmarks
      .filter((landmark) => !landmark.aloft)
      .map((landmark) => [
        landmark.x,
        landmark.z,
        landmark.kind === 'worldtree'
          ? 2.6
          : landmark.kind === 'volcano'
            ? 3.4
            : landmark.footprint * 0.75,
      ])
    for (const establishment of world.establishments) {
      if (establishment.stratum !== 0 || establishment.aloft) continue
      const kinds = this.kindsAt.get(establishment.place) ?? new Set<string>()
      kinds.add(establishment.kind)
      this.kindsAt.set(establishment.place, kinds)
    }
    this.windmillNaturals = new Set(
      world.places
        .filter((place) => place.features.includes('windmills'))
        .map((place) => place.index),
    )
  }

  *steps(): Generator<undefined, InstanceBatch> {
    const { grid } = this
    for (let row = 0; row < grid.rows; row++) {
      for (let column = 0; column < grid.columns; column++) this.nature(row * grid.columns + column)
      yield
    }
    for (const place of this.world.places) {
      if (place.kind !== 'city' && place.kind !== 'village') continue
      this.settlement(place.index)
      yield
    }
    for (const route of this.world.routes) {
      if (route.kind !== 'road') continue
      const { tiles } = route
      for (let k = 0; k < tiles.length - 1; k += 2) {
        const tile = tiles[k] ?? 0
        const next = tiles[k + 1] ?? 0
        if ((this.world.surface.city[tile] ?? -1) >= 0) continue
        const x = ((grid.x[tile] ?? 0) + (grid.x[next] ?? 0)) / 2 + 0.09
        const z = ((grid.z[tile] ?? 0) + (grid.z[next] ?? 0)) / 2 + 0.05
        this.lanterns.push([x, this.height(x, z), z])
      }
    }
    for (const [x, y, z] of this.lanterns) this.add(this.cellAt(x, z), 'lantern', x, y, z, 0, 1)
    return this.batch
  }

  private height(x: number, z: number): number {
    return surfaceY(this.field, x, z)
  }

  private cellOf(tile: number): number {
    const { grid } = this
    const column = tile % grid.columns
    const row = Math.floor(tile / grid.columns)
    return (
      Math.floor(row / PROP_CELL) * Math.ceil(grid.columns / PROP_CELL) +
      Math.floor(column / PROP_CELL)
    )
  }

  private cellAt(x: number, z: number): number {
    const tile = tileAt(this.grid, x, z)
    return this.cellOf(tile >= 0 ? tile : this.tile)
  }

  private add(
    cell: number,
    key: string,
    x: number,
    y: number,
    z: number,
    turn: number,
    scale: number,
    rise = scale,
    tint: Rgb = WHITE,
    thinned = false,
  ): void {
    this.batch.add(
      key,
      'surface',
      { x, y, z, ry: turn, sx: scale, sy: rise, sz: scale },
      { tint, thinned, rank: this.rankRandom(), cell },
    )
  }

  private begin(tile: number): void {
    this.tile = tile
    this.random = mulberry32(SCATTER_SEED + tile * 9973)
    this.rankRandom = mulberry32(RANK_SEED + tile * 7)
  }

  private free(x: number, z: number, pad = 0): boolean {
    for (const segment of this.segments.get(this.tile) ?? []) {
      if (segmentDistance(x, z, segment) < segment[4] + pad) return false
    }
    for (const [fx, fz, reach] of this.footprints)
      if ((x - fx) ** 2 + (z - fz) ** 2 < reach * reach) return false
    return true
  }

  private flatAt(x: number, z: number, y: number): boolean {
    return (
      Math.abs(this.height(x + 0.05, z) - y) < 0.05 &&
      Math.abs(this.height(x - 0.05, z) - y) < 0.05 &&
      Math.abs(this.height(x, z + 0.05) - y) < 0.05 &&
      Math.abs(this.height(x, z - 0.05) - y) < 0.05
    )
  }

  private scatter(
    count: number,
    place: (x: number, y: number, z: number) => void,
    reach = 0.85,
    pad = 0,
  ): void {
    const R = this.random
    const cx = this.grid.x[this.tile] ?? 0
    const cz = this.grid.z[this.tile] ?? 0
    let placed = 0
    for (let tries = 0; tries < count * 4 && placed < count; tries++) {
      const dx = (R() - 0.5) * 2 * reach
      const dz = (R() - 0.5) * 2 * reach
      if (hexReach(dx, dz) > reach) continue
      const x = cx + dx
      const z = cz + dz
      if (!this.free(x, z, pad)) continue
      const y = this.height(x, z)
      if (!this.flatAt(x, z, y)) continue
      place(x, y, z)
      placed++
    }
  }

  private tint(base: Rgb, variation: number): Rgb {
    const R = this.random
    return offsetHsl(base, (R() - 0.5) * 0.04, (R() - 0.5) * 0.12, (R() - 0.5) * variation)
  }

  private density(count: number): number {
    return Math.max(0, Math.round(count + (this.random() - 0.5)))
  }

  private nature(tile: number): void {
    const { world, grid } = this
    const { surface } = world
    this.begin(tile)
    const R = this.random
    const biome = surface.type[tile] ?? 0
    const city = surface.city[tile] ?? -1
    if (city >= 0 && biome === T.urban) return
    const cell = this.cellOf(tile)
    const put: Put = (key, x, y, z, turn, scale, rise = scale, tint = WHITE) =>
      this.add(cell, key, x, y, z, turn, scale, rise, tint, THINNED.has(key))
    if (surface.water[tile] === 1) {
      if (biome === T.reef && R() < 0.8) {
        this.scatter(this.density(3), (x, y, z) => put('coral', x, y, z, R() * 6, 0.9 + R() * 0.8))
      }
      return
    }
    if (city >= 0) return
    const level = surface.level[tile] ?? 0
    const latitude = (Math.floor(tile / grid.columns) + 0.5) / grid.rows
    switch (biome) {
      case T.forest:
        this.scatter(this.density(9), (x, y, z) => {
          if (y > 1.25 && R() < 0.6)
            put('pine', x, y, z, R() * 6, 0.3 + R() * 0.12, undefined, this.tint(WHITE, 0.15))
          else put('oak', x, y, z, R() * 6, 0.32 + R() * 0.14, undefined, this.tint(WHITE, 0.18))
        })
        this.scatter(this.density(2), (x, y, z) => put('bush', x, y, z, R() * 6, 0.6 + R() * 0.4))
        break
      case T.taiga:
        this.scatter(this.density(9), (x, y, z) =>
          put('pine', x, y, z, R() * 6, 0.28 + R() * 0.14, undefined, this.tint(WHITE, 0.15)),
        )
        break
      case T.jungle:
        this.scatter(this.density(7), (x, y, z) => {
          if (R() < 0.3) put('palm', x, y, z, R() * 6, 0.32 + R() * 0.1)
          else put('jungle', x, y, z, R() * 6, 0.3 + R() * 0.14, undefined, this.tint(WHITE, 0.15))
        })
        this.scatter(this.density(2), (x, y, z) => put('bush', x, y, z, R() * 6, 0.7))
        break
      case T.swamp:
        this.scatter(this.density(3), (x, y, z) => put('dead', x, y, z, R() * 6, 0.3 + R() * 0.1))
        this.scatter(this.density(5), (x, y, z) => put('reeds', x, y, z, R() * 6, 0.8 + R() * 0.5))
        break
      case T.myxo:
        this.scatter(this.density(4), (x, y, z) =>
          put('mushroom', x, y, z, R() * 6, 0.32 + R() * 0.25, undefined, this.tint(WHITE, 0.12)),
        )
        this.scatter(this.density(3), (x, y, z) =>
          put('oak', x, y, z, R() * 6, 0.3, undefined, MYXO_OAK),
        )
        break
      case T.plains:
        if (R() < 0.45) this.scatter(1, (x, y, z) => put('oak', x, y, z, R() * 6, 0.28 + R() * 0.1))
        if (R() < 0.4) this.scatter(1, (x, y, z) => put('bush', x, y, z, R() * 6, 0.6))
        break
      case T.meadow:
        this.scatter(this.density(R() < 0.5 ? 2 : 1), (x, y, z) => {
          const key = R() < 0.5 ? 'bush' : 'oak'
          put(key, x, y, z, R() * 6, 0.3 + R() * 0.1)
        })
        if (R() < 0.18)
          this.scatter(1, (x, y, z) => put('rock', x, y, z, R() * 6, 0.45 + R() * 0.35))
        break
      case T.savanna:
        this.scatter(this.density(R() < 0.6 ? 2 : 1), (x, y, z) =>
          put('acacia', x, y, z, R() * 6, 0.32 + R() * 0.12),
        )
        if (R() < 0.4)
          this.scatter(1, (x, y, z) => put('bush', x, y, z, R() * 6, 0.5, undefined, SAVANNA_BUSH))
        break
      case T.desert:
        if (R() < 0.35)
          this.scatter(1, (x, y, z) => put('cactus', x, y, z, R() * 6, 0.3 + R() * 0.12))
        if (R() < 0.25)
          this.scatter(1, (x, y, z) => put('rock', x, y, z, R() * 6, 0.8, undefined, DESERT_ROCK))
        break
      case T.badlands:
        this.scatter(this.density(2), (x, y, z) => put('hoodoo', x, y, z, R() * 6, 0.6 + R() * 0.6))
        break
      case T.tundra:
        if (R() < 0.6) this.scatter(2, (x, y, z) => put('rock', x, y, z, R() * 6, 0.7 + R() * 0.5))
        if (R() < 0.3) this.scatter(1, (x, y, z) => put('pine', x, y, z, R() * 6, 0.2))
        break
      case T.glacier:
        if (R() < 0.4) this.scatter(2, (x, y, z) => put('serac', x, y, z, R() * 6, 0.8 + R() * 0.8))
        break
      case T.highland:
        if (R() < 0.45)
          this.scatter(1, (x, y, z) => put('boulder', x, y, z, R() * 6, 0.35 + R() * 0.3))
        if (R() < 0.5) this.scatter(1, (x, y, z) => put('pine', x, y, z, R() * 6, 0.26))
        break
      case T.volcanic:
        if (level < 4 || R() < 0.5)
          this.scatter(this.density(2), (x, y, z) =>
            put('basalt', x, y, z, R() * 6, 0.8 + R() * 0.6),
          )
        break
      case T.ether:
        this.scatter(this.density(R() < 0.5 ? 3 : 2), (x, y, z) =>
          put('crystal', x, y, z, R() * 6, 0.5 + R() * 0.7),
        )
        break
      case T.beach:
        if (latitude > 0.55 && R() < 0.6)
          this.scatter(this.density(2), (x, y, z) =>
            put('palm', x, y, z, R() * 6, 0.3 + R() * 0.08),
          )
        else if (R() < 0.3) this.scatter(1, (x, y, z) => put('rock', x, y, z, R() * 6, 0.7))
        break
      case T.farm:
        this.farm(tile, put)
        break
    }
    if (biome === T.mountain || (biome === T.glacier && level >= 8)) {
      const cx = grid.x[tile] ?? 0
      const cz = grid.z[tile] ?? 0
      if (this.free(cx, cz, 0.3)) {
        const peak = prototypeKey.peak(((R() * 4) | 0) + 1)
        const scale = 0.72 + Math.min(1, (level - 6) / 6) * 0.38 + R() * 0.1
        const y = (surface.y[tile] ?? 0) - 0.08
        const x = cx + (R() - 0.5) * 0.2
        const z = cz + (R() - 0.5) * 0.2
        const turn = R() * 6
        put(peak, x, y, z, turn, scale, scale * (1.2 + R() * 0.8) * (level >= 10 ? 1.3 : 1))
        if (level >= 9 && R() < 0.7) {
          const angle = R() * 6.28
          const small = scale * 0.6
          put(
            prototypeKey.peak(3),
            cx + Math.cos(angle) * 0.5,
            y,
            cz + Math.sin(angle) * 0.5,
            R() * 6,
            small,
            small * 1.4,
          )
        }
      }
      this.scatter(1, (x, y, z) => put('rock', x, y, z, R() * 6, 0.45 + R() * 0.35))
    }
  }

  private farm(tile: number, put: Put): void {
    const R = this.random
    if (R() < 0.5)
      this.scatter(this.density(3), (x, y, z) => put('hay', x, y, z, R() * 6, 0.8 + R() * 0.3))
    if (R() < 0.35) {
      this.scatter(
        1,
        (x, y, z) => {
          put('farmhouse', x, y, z, R() * 6, 1.1)
          put('barn', x + 0.12, this.height(x + 0.12, z + 0.05), z + 0.05, R() * 6, 1)
        },
        0.6,
        0.06,
      )
    }
    const windmills = [...itemsAt(this.world.surface.naturals, tile)].some((place) =>
      this.windmillNaturals.has(place),
    )
    if (R() < (windmills ? 0.22 : 0.08)) {
      this.scatter(
        1,
        (x, y, z) => {
          put('windmill', x, y, z, 0, 1.2)
          put('blades', x, y + 0.24, z + 0.058, 0, 1.2)
        },
        0.6,
        0.08,
      )
    }
  }

  private settlement(index: number): void {
    const place = this.world.places[index]
    const style = place?.style
    if (!place || !style) return
    for (const tile of place.tiles) {
      this.begin(tile)
      const cell = this.cellOf(tile)
      const put: Put = (key, x, y, z, turn, scale, rise = scale, tint = WHITE) =>
        this.add(cell, key, x, y, z, turn, scale, rise, tint)
      if (place.kind === 'village') this.village(style, put)
      else this.cityTile(tile, style, put)
    }
    if (place.features.includes('walls')) this.walls(place.tiles, style)
  }

  private village(style: BuildingStyle, put: Put): void {
    const R = this.random
    let n = 0
    this.scatter(
      this.density(9),
      (x, y, z) => {
        put(
          prototypeKey.house(style, n % HOUSE_VARIANTS),
          x,
          y,
          z,
          Math.round(R() * 6) * (Math.PI / 3) + (R() - 0.5) * 0.3,
          1.1 + R() * 0.2,
        )
        n++
      },
      0.45,
      0.02,
    )
    this.scatter(1, (x, y, z) => put(prototypeKey.temple(style), x, y, z, R() * 6, 0.75), 0.3, 0.05)
  }

  private cityTile(tile: number, style: BuildingStyle, put: Put): void {
    const { world, grid } = this
    const { surface } = world
    const R = this.random
    const quarter = surface.quarter[tile] ?? -1
    const kinds =
      this.kindsAt.get(quarter >= 0 ? quarter : (surface.city[tile] ?? -1)) ?? new Set<string>()
    const has = (set: ReadonlySet<string>) => [...kinds].some((kind) => set.has(kind))
    const cx = grid.x[tile] ?? 0
    const cz = grid.z[tile] ?? 0
    const points: [number, number][] = []
    for (let a = -8; a <= 8; a++) {
      for (let b = -8; b <= 8; b++) {
        const dx = (a + b * 0.5) * LATTICE + (R() - 0.5) * 0.03
        const dz = b * LATTICE * HALF_SQRT3 + (R() - 0.5) * 0.03
        if (hexReach(dx, dz) > 0.86) continue
        points.push([dx, dz])
      }
    }
    const coast: number[] = []
    for (let edge = 0; edge < EDGES; edge++) {
      const other = neighbourOf(grid, tile, edge)
      if (other >= 0 && surface.water[other] === 1 && (surface.lake[other] ?? -1) < 0)
        coast.push(edge)
    }
    const harbour = coast.length > 0 && has(HARBOUR_KINDS)
    const workshops = has(WORKSHOP_KINDS)
    for (const [dx, dz] of points) {
      const d = Math.hypot(dx, dz)
      const street = AVENUES.some(([ax, az]) => Math.abs(dx * -az + dz * ax) < STREET)
      if (street || d < 0.12) continue
      const x = cx + dx
      const z = cz + dz
      if (!this.free(x, z, 0.02)) continue
      const y = this.height(x, z)
      if (!this.flatAt(x, z, y)) continue
      const turn =
        Math.round(Math.atan2(dz, dx) / (Math.PI / 3)) * (Math.PI / 3) +
        Math.PI / 2 +
        (R() - 0.5) * 0.12
      const roll = R()
      if (workshops && roll < 0.2) put(prototypeKey.hall(style), x, y, z, turn, 0.75)
      else if (harbour && roll < 0.18 && d > 0.5) put(prototypeKey.hall(style), x, y, z, turn, 0.6)
      else if (roll < 0.035) put(prototypeKey.tower(style, roll < 0.017 ? 1 : 2), x, y, z, 0, 1)
      else {
        const variant = (R() * HOUSE_VARIANTS) | 0
        put(prototypeKey.house(style, variant), x, y, z, turn, 0.95 + R() * 0.35)
      }
    }
    if (has(TEMPLE_KINDS) || R() < 0.25) {
      put(prototypeKey.temple(style), cx + 0.06, this.height(cx + 0.06, cz), cz, R() * 6, 0.8)
    }
    if (has(MILL_KINDS)) {
      for (let k = 0; k < 2; k++) {
        const x = cx + (k ? 0.35 : -0.3)
        const z = cz + 0.3
        const y = this.height(x, z)
        put('windmill', x, y, z, 0, 1.2)
        put('blades', x, y + 0.24, z + 0.058, 0, 1.2)
      }
    }
    for (const edge of coast) {
      if (!harbour && R() < 0.5) continue
      const angle = (edge * Math.PI) / 3
      const [c0x, c0z] = CORNERS[edge] ?? [0, 0]
      const [c1x, c1z] = CORNERS[(edge + 1) % EDGES] ?? [0, 0]
      for (let k = 0; k < 3; k++) {
        const t = 0.25 + k * 0.25
        const ex = cx + c0x + (c1x - c0x) * t
        const ez = cz + c0z + (c1z - c0z) * t
        put('pier', ex - Math.cos(angle) * 0.06, 0, ez - Math.sin(angle) * 0.06, -angle, 1, 1)
        if (R() < 0.7) {
          put(
            'boat',
            ex + Math.cos(angle) * 0.12 + Math.sin(angle) * 0.04,
            0,
            ez + Math.sin(angle) * 0.12 - Math.cos(angle) * 0.04,
            -angle + Math.PI / 2,
            1.3,
            1.3,
          )
        }
      }
    }
    for (const [ax, az] of AVENUES) {
      for (const side of [-1, 1]) {
        for (let k = 1; k <= 3; k++) {
          const x = cx + ax * side * k * 0.24 + az * 0.06
          const z = cz + az * side * k * 0.24 - ax * 0.06
          this.lanterns.push([x, this.height(x, z), z])
        }
      }
    }
  }

  private walls(tiles: Int32Array, style: BuildingStyle): void {
    const { grid } = this
    const inside = new Set(tiles)
    const corners = new Map<string, [number, number]>()
    const inset = 0.9
    for (const tile of tiles) {
      const cx = grid.x[tile] ?? 0
      const cz = grid.z[tile] ?? 0
      for (let edge = 0; edge < EDGES; edge++) {
        const other = neighbourOf(grid, tile, edge)
        if (other >= 0 && inside.has(other)) continue
        const [c0x, c0z] = CORNERS[edge] ?? [0, 0]
        const [c1x, c1z] = CORNERS[(edge + 1) % EDGES] ?? [0, 0]
        const ax = cx + c0x * inset
        const az = cz + c0z * inset
        const bx = cx + c1x * inset
        const bz = cz + c1z * inset
        const crossing = this.crossings.has(`${tile}:${other}`)
        for (let k = 0; k < 3; k++) {
          if (crossing && k === 1) continue
          const t0 = k / 3
          const t1 = (k + 1) / 3
          const x0 = ax + (bx - ax) * t0
          const z0 = az + (bz - az) * t0
          const x1 = ax + (bx - ax) * t1
          const z1 = az + (bz - az) * t1
          const xm = (x0 + x1) / 2
          const zm = (z0 + z1) / 2
          const y = Math.min(this.height(x0, z0), this.height(x1, z1), this.height(xm, zm))
          const length = Math.hypot(x1 - x0, z1 - z0)
          this.batch.add(
            prototypeKey.wall(style),
            'surface',
            {
              x: xm,
              y,
              z: zm,
              ry: -Math.atan2(z1 - z0, x1 - x0),
              sx: length * 1.04,
              sy: 0.2,
              sz: 1.6,
            },
            { cell: this.cellAt(xm, zm) },
          )
        }
        for (const [px, pz] of [
          [ax, az],
          [bx, bz],
        ] as const) {
          const key = `${px.toFixed(2)},${pz.toFixed(2)}`
          if (!corners.has(key)) corners.set(key, [px, pz])
        }
        if (crossing) {
          const xm = (ax + bx) / 2
          const zm = (az + bz) / 2
          for (const side of [-1, 1]) {
            const x = xm + (bx - ax) * 0.12 * side
            const z = zm + (bz - az) * 0.12 * side
            this.add(
              this.cellAt(x, z),
              prototypeKey.wallTower(style),
              x,
              this.height(x, z),
              z,
              0,
              0.8,
            )
          }
        }
      }
    }
    for (const [x, z] of corners.values()) {
      this.add(this.cellAt(x, z), prototypeKey.wallTower(style), x, this.height(x, z), z, 0, 0.9)
    }
  }
}

const THINNED: ReadonlySet<string> = new Set([
  'pine',
  'oak',
  'jungle',
  'palm',
  'bush',
  'reeds',
  'rock',
  'coral',
  'hay',
])
