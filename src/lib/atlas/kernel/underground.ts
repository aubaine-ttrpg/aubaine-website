import {
  type ParticleSpec,
  type Piece,
  type SceneLayer,
  undergroundLayer,
} from '../contract/scene.ts'
import {
  ESTABLISHMENT_DRESSINGS,
  ROCKS,
  type Rock,
  SETTINGS,
  type Setting,
  TILE_TYPES,
  type TileType,
} from '../vocabulary.ts'
import { EDGES, type Grid, hexReach, neighbourOf } from '../world/grid.ts'
import type { UndergroundRecord, World } from '../world/model.ts'
import { mulberry32, type Random } from '../world/noise.ts'
import { BOTTOM, ROCK_TOP, reliefNoise, UNDERGROUND_WATER } from '../world/relief.ts'
import { smoothstep01 } from '../world/smoothstep.ts'
import type { HeightMap } from './heightmap.ts'
import {
  edgeColumns,
  rimHeights,
  WallWriter,
  wallSegments,
  writeFlatHex,
  writeHexTop,
  writeWallSheet,
} from './hex-mesh.ts'
import { InstanceBatch } from './instances.ts'
import { MeshWriter, POSITIONS_ONLY, unorm } from './mesh.ts'
import { DWARF_HALLS, prototypeKey } from './prototypes.ts'
import { TOP_LAYOUT, WALL_LAYOUT } from './terrain.ts'

export type UndergroundBuild = {
  level: number
  pieces: Piece[]
  batch: InstanceBatch
  particles: ParticleSpec[]
}

type LevelSource = { grid: Grid; record: UndergroundRecord; map: HeightMap }

const HOLD_DRESSINGS = ['forge', 'throne', 'pits'] as const
type HoldDressing = (typeof HOLD_DRESSINGS)[number] | 'market'

type Placer = (x: number, y: number, z: number) => void

const PARTICLE_KINDS = ['ember', 'spore', 'shard', 'dust'] as const
type ParticleKind = (typeof PARTICLE_KINDS)[number]

const UNDERGROUND_SEED = 77
const OPEN_RINGS = 3
const ROCK_RINGS = 1
const COLUMNS_PER_SEGMENT = 2
const NORMAL_STEP = 0.04
const MIN_WALL_DROP = 0.005
const ROW_HEIGHT = 0.06
const MAX_ROWS = 40
const SCATTER_REACH = 0.72
const HALL_REACH = 0.78
const PROP_SINK = 0.01
const NO_BLEND = unorm(0)
const UNOCCLUDED = unorm(1)

const ROCK_WALLS: Record<Rock, TileType> = {
  granite: 'mountain',
  limestone: 'tundra',
  sandstone: 'badlands',
  basalt: 'volcanic',
  schist: 'ether',
  permafrost: 'glacier',
  marble: 'urban',
}

const WALL_BIOMES = Uint8Array.from(ROCKS, (rock) => TILE_TYPES.indexOf(ROCK_WALLS[rock]))

const FLAT_SETTINGS: ReadonlySet<Setting> = new Set<Setting>(['rock', 'built', 'lake', 'tunnel'])

const PARTICLE_SYSTEMS: Record<ParticleKind, Omit<ParticleSpec, 'origins'>> = {
  ember: {
    perOrigin: 8,
    life: 2.4,
    velocity: [0, 0.32, 0],
    spread: [0.8, 0.05, 0.8],
    gravity: 0.1,
    size: [0.04, 0.015],
    turbulence: 0.2,
    colour: [5, 1.8, 0.4],
    fade: [2.5, 0.5, 0.1],
    alpha: 1,
    style: 'spark',
    nightOnly: false,
    additive: true,
    seed: 41,
  },
  spore: {
    perOrigin: 7,
    life: 6,
    velocity: [0, 0.05, 0],
    spread: [1.2, 0.3, 1.2],
    gravity: 0,
    size: [0.035, 0.02],
    turbulence: 0.3,
    colour: [0.8, 3, 2.2],
    fade: [0.6, 2, 2.6],
    alpha: 1,
    style: 'spark',
    nightOnly: false,
    additive: true,
    seed: 43,
  },
  shard: {
    perOrigin: 6,
    life: 4,
    velocity: [0, 0.12, 0],
    spread: [1, 0.2, 1],
    gravity: 0,
    size: [0.03, 0.012],
    turbulence: 0.2,
    colour: [2.2, 1.2, 4],
    fade: [2.2, 1.2, 4],
    alpha: 1,
    style: 'spark',
    nightOnly: false,
    additive: true,
    seed: 45,
  },
  dust: {
    perOrigin: 4,
    life: 7,
    velocity: [0.02, 0.02, 0],
    spread: [1.2, 0.2, 1.2],
    gravity: 0,
    size: [0.2, 0.5],
    turbulence: 0.15,
    colour: [0.55, 0.45, 0.35],
    fade: [0.55, 0.45, 0.35],
    alpha: 0.18,
    style: 'smoke',
    nightOnly: false,
    additive: false,
    seed: 47,
  },
}

const settingOf = (source: LevelSource, tile: number): Setting =>
  SETTINGS[source.record.setting[tile] ?? 0] ?? 'rock'
const floorOf = (source: LevelSource, tile: number) => source.record.floor[tile] ?? ROCK_TOP
const ringsOf = (source: LevelSource, tile: number) =>
  settingOf(source, tile) === 'rock' ? ROCK_RINGS : OPEN_RINGS

function floorHeight(source: LevelSource, tile: number, x: number, z: number): number {
  const floor = floorOf(source, tile)
  if (FLAT_SETTINGS.has(settingOf(source, tile))) return floor
  const { grid, record } = source
  const rho = Math.min(1, hexReach(x - (grid.x[tile] ?? 0), z - (grid.z[tile] ?? 0)))
  return (
    floor +
    (1 - smoothstep01((rho - 0.42) / 0.4)) *
      0.05 *
      (reliefNoise.fbm(x * 1.4 + record.level * 7, z * 1.4, 3) + 0.5)
  )
}

function writeFloor(source: LevelSource, tile: number, floors: MeshWriter): void {
  const { grid, record } = source
  const flat = FLAT_SETTINGS.has(settingOf(source, tile))
  const rock = record.rock[tile] ?? 0
  const setting = record.setting[tile] ?? 0
  const height = (x: number, z: number) => floorHeight(source, tile, x, z)
  writeHexTop(floors, grid.x[tile] ?? 0, grid.z[tile] ?? 0, ringsOf(source, tile), (x, z) => {
    const y = height(x, z)
    if (flat) floors.vertex(x, y, z, 0, 1, 0)
    else {
      const gx = (height(x + NORMAL_STEP, z) - height(x - NORMAL_STEP, z)) / (2 * NORMAL_STEP)
      const gz = (height(x, z + NORMAL_STEP) - height(x, z - NORMAL_STEP)) / (2 * NORMAL_STEP)
      floors.vertex(x, y, z, -gx, 1, -gz)
    }
    floors.bytes(rock, setting, NO_BLEND, UNOCCLUDED)
  })
}

function writeWall(
  source: LevelSource,
  walls: MeshWriter,
  tile: number,
  edge: number,
  other: number,
): void {
  const { grid, record, map } = source
  const ownRings = ringsOf(source, tile)
  const otherRings = other < 0 ? ownRings : ringsOf(source, other)
  const segments = wallSegments(ownRings, otherRings, COLUMNS_PER_SEGMENT)
  const columns = edgeColumns(grid, tile, edge, segments)
  const { xs, zs } = columns
  const top = rimHeights((x, z) => floorHeight(source, tile, x, z), columns, ownRings)
  const bottom =
    other < 0
      ? new Float64Array(segments + 1).fill(BOTTOM)
      : rimHeights((x, z) => floorHeight(source, other, x, z), columns, otherRings)
  let tallest = 0
  for (let m = 0; m <= segments; m++) {
    tallest = Math.max(tallest, (top[m] ?? 0) - (bottom[m] ?? 0))
  }
  const rows = Math.max(1, Math.min(MAX_ROWS, Math.ceil(tallest / ROW_HEIGHT)))
  const roughness = other < 0 ? 0 : settingOf(source, tile) === 'rock' ? 1 : 0.45
  const angle = (edge * Math.PI) / 3
  const nx = Math.cos(angle)
  const nz = Math.sin(angle)
  const span = rows + 1
  const points = new Float64Array((segments + 1) * span * 3)
  for (let m = 0; m <= segments; m++) {
    const taper = Math.sin((Math.PI * m) / segments) ** 0.5
    const x0 = xs[m] ?? 0
    const z0 = zs[m] ?? 0
    const high = top[m] ?? 0
    const low = bottom[m] ?? 0
    for (let r = 0; r <= rows; r++) {
      const f = r / rows
      const y = low + (high - low) * f
      const push =
        (reliefNoise.n2(x0 * 1.9 + y * 2.6, z0 * 1.9 - y * 2.2) * 0.06 +
          reliefNoise.n2(x0 * 6 + y * 7, z0 * 6) * 0.015) *
        taper *
        Math.sin(Math.PI * f) *
        roughness
      const o = (m * span + r) * 3
      points[o] = x0 + nx * push
      points[o + 1] = y
      points[o + 2] = z0 + nz * push
    }
  }
  const wall = new WallWriter(walls, map, { tile, biome: WALL_BIOMES[record.rock[tile] ?? 0] ?? 0 })
  writeWallSheet(wall, { points, segments, rows, nx, nz, lips: top, hole: undefined })
}

function writeWalls(source: LevelSource, tile: number, walls: MeshWriter): void {
  const floor = floorOf(source, tile)
  for (let edge = 0; edge < EDGES; edge++) {
    const other = neighbourOf(source.grid, tile, edge)
    const below = other < 0 ? BOTTOM : floorOf(source, other)
    if (floor - below >= MIN_WALL_DROP) writeWall(source, walls, tile, edge, other)
  }
}

function establishmentKinds(world: World): Map<number, Set<string>> {
  const kinds = new Map<number, Set<string>>()
  for (const { place, kind } of world.establishments) {
    kinds.set(place, (kinds.get(place) ?? new Set<string>()).add(kind))
  }
  return kinds
}

function holdDressing(establishments: ReadonlySet<string> | undefined): HoldDressing {
  return (
    HOLD_DRESSINGS.find((dressing) =>
      ESTABLISHMENT_DRESSINGS[dressing].some((kind) => establishments?.has(kind)),
    ) ?? 'market'
  )
}

class Dresser {
  readonly batch = new InstanceBatch()
  private readonly source: LevelSource
  private readonly random: Random
  private readonly establishments: ReadonlyMap<number, ReadonlySet<string>>
  private readonly layer: SceneLayer
  private readonly origins: Record<ParticleKind, number[]> = {
    ember: [],
    spore: [],
    shard: [],
    dust: [],
  }

  constructor(
    source: LevelSource,
    random: Random,
    establishments: ReadonlyMap<number, ReadonlySet<string>>,
  ) {
    this.source = source
    this.random = random
    this.establishments = establishments
    this.layer = undergroundLayer(source.record.level)
  }

  dress(tile: number): void {
    const { grid } = this.source
    const cx = grid.x[tile] ?? 0
    const cz = grid.z[tile] ?? 0
    const floor = floorOf(this.source, tile)
    switch (settingOf(this.source, tile)) {
      case 'rock':
        return
      case 'cavern':
        this.scatter(tile, 3, (x, y, z) =>
          this.put('stalagmites', x, y, z, this.freeTurn(), 0.8 + this.random() * 0.7),
        )
        if (this.random() < 0.35) {
          this.scatter(tile, 1, (x, y, z) =>
            this.put('column', x, y, z, this.freeTurn(), 1, ROCK_TOP - y + 0.02),
          )
        }
        if (this.random() < 0.4) {
          this.scatter(tile, 1, (x, y, z) => this.put('rock', x, y, z, this.freeTurn(), 0.7))
        }
        return
      case 'mine':
        this.scatter(
          tile,
          1,
          (x, y, z) => this.put('mine-head', x, y, z, this.sixthTurns(6), 1.3),
          0.4,
        )
        this.scatter(
          tile,
          2,
          (x, y, z) => this.put('mine-rail', x, y, z, this.sixthTurns(6), 1.3),
          0.5,
        )
        this.emit('dust', cx, floor + 0.1, cz)
        return
      case 'crystal':
        this.scatter(tile, 3, (x, y, z) =>
          this.put('crystal', x, y, z, this.freeTurn(), 0.45 + this.random() * 0.7),
        )
        if (this.random() < 0.3) {
          this.scatter(tile, 1, (x, y, z) =>
            this.put('column', x, y, z, this.freeTurn(), 0.8, ROCK_TOP - y + 0.02),
          )
        }
        this.emit('shard', cx, floor + 0.1, cz)
        return
      case 'lava':
        this.scatter(tile, 2, (x, y, z) =>
          this.put('basalt', x, y, z, this.freeTurn(), 0.9 + this.random() * 0.6),
        )
        this.emit('ember', cx, floor + 0.05, cz)
        return
      case 'ice':
        this.scatter(tile, 3, (x, y, z) =>
          this.put('ice-spikes', x, y, z, this.freeTurn(), 0.8 + this.random() * 0.6),
        )
        return
      case 'fungal':
        this.scatter(tile, 4, (x, y, z) =>
          this.put('mushroom', x, y, z, this.freeTurn(), 0.35 + this.random() * 0.5),
        )
        this.emit('spore', cx, floor + 0.1, cz)
        return
      case 'roots':
        this.scatter(
          tile,
          1,
          (x, y, z) => this.put('roots', x, y, z, this.freeTurn(), 1.2 + this.random() * 0.5),
          0.3,
        )
        if (this.random() < 0.5) {
          this.scatter(tile, 2, (x, y, z) => this.put('mushroom', x, y, z, this.freeTurn(), 0.3))
        }
        this.emit('spore', cx, floor + 0.1, cz)
        return
      case 'tunnel':
        if (this.random() < 0.45) this.put('lamp', cx + 0.25, floor, cz + 0.12, 0, 1.2)
        if (this.random() < 0.3) {
          this.scatter(tile, 1, (x, y, z) => this.put('rock', x, y, z, this.freeTurn(), 0.5))
        }
        return
      case 'lake':
        if (this.random() < 0.15) {
          this.put('lake-boat', cx, UNDERGROUND_WATER - 0.01, cz, this.freeTurn(), 1.4)
        }
        return
      case 'built':
        this.dressHalls(tile, cx, cz, floor)
        return
    }
  }

  particles(): ParticleSpec[] {
    const { level } = this.source.record
    return PARTICLE_KINDS.flatMap((kind) => {
      const origins = this.origins[kind]
      if (origins.length === 0) return []
      const system = PARTICLE_SYSTEMS[kind]
      return [{ ...system, origins: Float32Array.from(origins), seed: system.seed + level }]
    })
  }

  private dressHalls(tile: number, cx: number, cz: number, floor: number): void {
    const quarter = this.source.record.quarter[tile] ?? -1
    if (quarter < 0) {
      this.put('crypt', cx, floor, cz, this.freeTurn(), 1.2)
      this.scatter(tile, 2, (x, y, z) => this.put('brazier', x, y, z, 0, 1.2), 0.6)
      return
    }
    const dressing = holdDressing(this.establishments.get(quarter))
    for (let a = -3; a <= 3; a++) {
      for (let b = -3; b <= 3; b++) {
        const dx = (a + b * 0.5) * 0.22 + (this.random() - 0.5) * 0.03
        const dz = b * 0.19
        if (hexReach(dx, dz) > HALL_REACH || Math.abs(dz) < 0.05) continue
        const x = cx + dx
        const z = cz + dz
        if (dressing === 'pits' && this.random() < 0.4) {
          this.put('mine-head', x, floor, z, this.freeTurn(), 1.1)
          continue
        }
        if (dressing === 'forge' && this.random() < 0.25) {
          this.put(prototypeKey.hall('nordhal'), x, floor, z, this.sixthTurns(3), 1)
          this.emit('ember', x, floor + 0.2, z)
          continue
        }
        const hall = (a * 3 + b + 9) % DWARF_HALLS
        this.put(prototypeKey.dwarfHall(hall), x, floor, z, this.sixthTurns(3), 1)
      }
    }
    if (dressing === 'throne') this.put('column', cx, floor, cz, 0, 2.2, ROCK_TOP - floor + 0.02)
    for (let e = 0; e < 3; e++) {
      const a = e * 2.1 + 0.3
      this.put('brazier', cx + Math.cos(a) * 0.12, floor, cz + Math.sin(a) * 0.12, 0, 1.3)
    }
  }

  private scatter(tile: number, count: number, place: Placer, reach = SCATTER_REACH): void {
    const { grid } = this.source
    const cx = grid.x[tile] ?? 0
    const cz = grid.z[tile] ?? 0
    let placed = 0
    for (let tries = 0; tries < count * 4 && placed < count; tries++) {
      const dx = (this.random() - 0.5) * 2 * reach
      const dz = (this.random() - 0.5) * 2 * reach
      if (hexReach(dx, dz) > reach) continue
      const x = cx + dx
      const z = cz + dz
      place(x, floorHeight(this.source, tile, x, z) - PROP_SINK, z)
      placed++
    }
  }

  private put(
    prototype: string,
    x: number,
    y: number,
    z: number,
    turn: number,
    scale: number,
    height = scale,
  ): void {
    this.batch.add(prototype, this.layer, { x, y, z, ry: turn, sx: scale, sy: height, sz: scale })
  }

  private freeTurn(): number {
    return this.random() * 6
  }

  private sixthTurns(most: number): number {
    return (Math.round(this.random() * most) * Math.PI) / 3
  }

  private emit(kind: ParticleKind, x: number, y: number, z: number): void {
    this.origins[kind].push(x, y, z)
  }
}

export function* undergroundSteps(
  world: World,
  grid: Grid,
  map: HeightMap,
  record: UndergroundRecord,
): Generator<undefined, UndergroundBuild> {
  const source: LevelSource = { grid, record, map }
  const floors = new MeshWriter(TOP_LAYOUT)
  const walls = new MeshWriter(WALL_LAYOUT)
  const water = new MeshWriter(POSITIONS_ONLY)
  for (let row = 0; row < grid.rows; row++) {
    for (let tile = row * grid.columns; tile < (row + 1) * grid.columns; tile++) {
      writeFloor(source, tile, floors)
      if (settingOf(source, tile) === 'lake')
        writeFlatHex(water, grid.x[tile] ?? 0, grid.z[tile] ?? 0, UNDERGROUND_WATER)
      writeWalls(source, tile, walls)
    }
    yield
  }
  const dresser = new Dresser(
    source,
    mulberry32(UNDERGROUND_SEED + record.level - 1),
    establishmentKinds(world),
  )
  for (let tile = 0; tile < grid.size; tile++) dresser.dress(tile)
  yield
  const pieces: Piece[] = []
  if (floors.vertexCount > 0)
    pieces.push({ material: 'under-top', mesh: floors.build(), casts: true })
  if (walls.vertexCount > 0)
    pieces.push({ material: 'under-wall', mesh: walls.build(), casts: true })
  if (water.vertexCount > 0) {
    pieces.push({ material: 'under-water', mesh: water.build(), casts: false })
  }
  return { level: record.level, pieces, batch: dresser.batch, particles: dresser.particles() }
}
