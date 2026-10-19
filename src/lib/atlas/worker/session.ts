import type { Locale } from '../../i18n/locales.ts'
import type { FromWorker } from '../contract/protocol.ts'
import { TIER_SETTINGS, type Tier } from '../contract/quality.ts'
import {
  type EffectsData,
  type MeshData,
  meshBuffers,
  type Piece,
  type PropModel,
  type PropSet,
  type PrototypeData,
  type RevealField,
  undergroundLayer,
  VEHICLE_PROTOTYPES,
  type VehicleData,
} from '../contract/scene.ts'
import { buildEffects } from '../kernel/effects.ts'
import { buildHeightMap, type HeightMap } from '../kernel/heightmap.ts'
import type { InstanceBatch } from '../kernel/instances.ts'
import { landmarkSteps } from '../kernel/landmarks.ts'
import { buildMist } from '../kernel/mist.ts'
import { parchmentTextures } from '../kernel/parchment.ts'
import { SurfaceProps } from '../kernel/props.ts'
import { PrototypeShelf } from '../kernel/prototypes.ts'
import { buildReveal } from '../kernel/reveal.ts'
import { buildRoutes } from '../kernel/routes.ts'
import { buildSky } from '../kernel/sky.ts'
import {
  type CaveMouth,
  chunksNearest,
  type TerrainSource,
  terrainChunkSteps,
  terrainSource,
} from '../kernel/terrain.ts'
import {
  emptyTileInfo,
  NOISE_SIZE,
  noiseTextures,
  surfaceTileInfo,
  undergroundTileInfo,
} from '../kernel/textures.ts'
import { undergroundSteps } from '../kernel/underground.ts'
import { buildWater } from '../kernel/water.ts'
import { decodeTravel, decodeVocabulary, decodeWorld } from '../world/decode.ts'
import { deriveWorld } from '../world/derive.ts'
import type { Grid } from '../world/grid.ts'
import type { UndergroundRecord, World } from '../world/model.ts'
import { type ReliefField, reliefField } from '../world/relief.ts'
import { decodeStars } from '../world/stars.ts'
import { planTravel, type TravelRequest } from '../world/travel.ts'
import { loadAtlasData } from './atlas-data.ts'
import { JobQueue, type Work } from './job-queue.ts'

export type Post = (message: FromWorker, transfer?: Transferable[]) => void

const PRIORITY = {
  textures: 0,
  terrain: 10,
  water: 100,
  sky: 120,
  landmarks: 200,
  routes: 250,
  props: 300,
  effects: 400,
  streamed: 1000,
  underground: 1100,
  levelAsked: 5,
} as const

const levelKey = (level: number) => `under:${level}`

const piecesBuffers = (pieces: Piece[]) => pieces.flatMap((piece) => meshBuffers(piece.mesh))
const optionalBuffers = (mesh: MeshData | undefined) => (mesh ? meshBuffers(mesh) : [])
const prototypeBuffers = (prototypes: PrototypeData[]) =>
  prototypes.flatMap((prototype) => prototype.lods.flatMap((lod) => meshBuffers(lod)))
const setBuffers = (sets: PropSet[]) =>
  sets.flatMap((set) => [set.matrices.buffer, set.tints.buffer])
const modelBuffers = (models: PropModel[]) => models.flatMap((model) => meshBuffers(model.mesh))
const vehicleBuffers = (vehicles: VehicleData) => [
  ...vehicles.paths.flatMap((path) => [path.points.buffer, path.lengths.buffer]),
  ...prototypeBuffers(vehicles.prototypes),
]
const effectBuffers = (effects: EffectsData) => [
  ...effects.particles.map((system) => system.origins.buffer),
  ...optionalBuffers(effects.falls),
]

type Built = {
  world: World
  grid: Grid
  field: ReliefField
  map: HeightMap
  reveal: RevealField
}

export class AtlasSession {
  private readonly post: Post
  private readonly queue: JobQueue
  private built: Built | undefined
  private generation = 0
  private focus = { x: 0, z: 0 }
  private readonly mouths: CaveMouth[] = []
  private readonly shelf = new PrototypeShelf()
  private readonly askedLevels = new Set<number>()

  constructor(post: Post) {
    this.post = post
    this.queue = new JobQueue(
      (error) => this.fail(error),
      (job) => this.post({ kind: 'done', job }),
    )
  }

  async start(locale: Locale, tier: Tier, folder: string): Promise<void> {
    const data = await loadAtlasData(locale, folder)
    const authored = decodeWorld(data.files, data.overlays)
    const world = deriveWorld(
      authored,
      decodeVocabulary(data.vocabulary, locale),
      decodeTravel(data.travel),
      locale,
    )
    const { grid } = authored
    const field = reliefField(grid, world.surface)
    const map = buildHeightMap(world, field)
    const reveal = buildReveal(world, grid)
    this.built = { world, grid, field, map, reveal }
    this.post({ kind: 'world', world, stars: decodeStars(data.stars) })
    this.queue.add('textures', PRIORITY.textures, this.textures(world, grid, map, reveal))
    this.queueTerrain(tier)
    this.queue.add('water', PRIORITY.water, this.water(world, grid, reveal))
    this.queue.add('sky', PRIORITY.sky, this.sky(world, grid, map))
    this.queue.add('landmarks', PRIORITY.landmarks, this.landmarks(world, field))
    this.queue.add('routes', PRIORITY.routes, this.routes(world, field))
    this.queue.add('props', PRIORITY.props, this.props(world, field))
    this.queue.add('effects', PRIORITY.effects, this.effects(world, field))
    this.queue.add('streamed', PRIORITY.streamed, this.streamed())
    for (const record of world.underground) {
      const priority = this.askedLevels.has(record.level)
        ? PRIORITY.levelAsked
        : PRIORITY.underground + record.level
      this.queue.add(levelKey(record.level), priority, this.level(world, grid, map, record))
    }
    this.post({ kind: 'plan', jobs: this.queue.keys() })
  }

  retier(tier: Tier, generation: number): void {
    this.generation = generation
    this.queue.cancel((key) => key.startsWith('terrain:'))
    this.queueTerrain(tier)
  }

  refocus(x: number, z: number): void {
    const built = this.built
    if (!built) return
    this.focus = { x, z }
    const order = chunksNearest(built.grid, x, z)
    this.queue.reprioritise((key, current) => {
      if (!key.startsWith('terrain:')) return current
      const chunk = Number(key.slice(key.lastIndexOf(':') + 1))
      return PRIORITY.terrain + order.indexOf(chunk)
    })
  }

  prioritiseLevel(level: number): void {
    this.askedLevels.add(level)
    this.queue.reprioritise((key, current) =>
      key === levelKey(level) ? PRIORITY.levelAsked : current,
    )
  }

  travel(id: number, request: TravelRequest): void {
    const built = this.built
    if (!built) return
    this.post({ kind: 'travel', id, result: planTravel(built.world, built.grid, request) })
  }

  close(): void {
    this.queue.close()
  }

  private fail(error: unknown): void {
    this.queue.close()
    this.post({ kind: 'failure', message: error instanceof Error ? error.message : String(error) })
  }

  private queueTerrain(tier: Tier): void {
    const built = this.built
    if (!built) return
    const { world, grid, field, map, reveal } = built
    const source = terrainSource(world, field, map, TIER_SETTINGS[tier].terrainRings, reveal)
    const generation = this.generation
    const order = chunksNearest(grid, this.focus.x, this.focus.z)
    this.mouths.length = 0
    for (const [rank, chunk] of order.entries()) {
      this.queue.add(
        `terrain:${generation}:${chunk}`,
        PRIORITY.terrain + rank,
        this.terrainChunk(source, generation, chunk, order.length),
      )
    }
  }

  private *textures(world: World, grid: Grid, map: HeightMap, reveal: RevealField): Work {
    const { noise, waterNormal } = noiseTextures()
    yield
    const tileInfo = [
      surfaceTileInfo(world, grid),
      ...world.underground.map((level) => undergroundTileInfo(level, grid)),
    ]
    const skyInfo = emptyTileInfo(grid)
    const parchment = parchmentTextures(world, grid)
    const revealValues = reveal.values.slice()
    const revealHaze = reveal.haze.slice()
    this.post(
      {
        kind: 'textures',
        textures: {
          noiseSize: NOISE_SIZE,
          noise,
          waterNormal,
          heightWidth: map.width,
          heightHeight: map.height,
          heightRect: [map.x0, map.z0, map.spanX, map.spanZ],
          heights: map.pixels,
          tileInfo,
          skyInfo,
          reveal: {
            width: reveal.width,
            height: reveal.height,
            x0: reveal.x0,
            z0: reveal.z0,
            spanX: reveal.spanX,
            spanZ: reveal.spanZ,
            values: revealValues,
            haze: revealHaze,
          },
          parchment,
        },
      },
      [
        noise.buffer,
        waterNormal.buffer,
        map.pixels.buffer,
        ...tileInfo.map((info) => info.buffer),
        skyInfo.buffer,
        revealValues.buffer,
        revealHaze.buffer,
        ...parchment.tiles.map((tiles) => tiles.buffer),
        parchment.routes.buffer,
        parchment.lanes.buffer,
      ],
    )
  }

  private *terrainChunk(
    source: TerrainSource,
    generation: number,
    chunk: number,
    chunks: number,
  ): Work {
    const built = yield* terrainChunkSteps(source, chunk)
    if (generation !== this.generation) return
    this.mouths.push(...built.mouths)
    const { tops, walls, tunnels } = built.chunk
    this.post({ kind: 'terrain', generation, chunk: built.chunk, chunks }, [
      ...optionalBuffers(tops),
      ...optionalBuffers(walls),
      ...optionalBuffers(tunnels),
    ])
  }

  private *water(world: World, grid: Grid, reveal: RevealField): Work {
    const pieces = buildWater(world, grid, reveal)
    yield
    pieces.push(...buildMist(reveal))
    yield
    this.post(
      { kind: 'pieces', generation: this.generation, layer: 'surface', pieces },
      piecesBuffers(pieces),
    )
  }

  private *sky(world: World, grid: Grid, map: HeightMap): Work {
    yield
    const built = buildSky(world, grid, map)
    this.post(
      { kind: 'pieces', generation: this.generation, layer: 'sky', pieces: built.pieces },
      piecesBuffers(built.pieces),
    )
    yield
    this.post({ kind: 'models', models: built.models }, modelBuffers(built.models))
    yield* this.postProps(built.batch)
  }

  private *landmarks(world: World, field: ReliefField): Work {
    const models = yield* landmarkSteps(world, field)
    this.post({ kind: 'models', models }, modelBuffers(models))
  }

  private *routes(world: World, field: ReliefField): Work {
    yield
    const built = buildRoutes(world, field)
    yield
    this.post(
      { kind: 'pieces', generation: this.generation, layer: 'routes', pieces: built.pieces },
      piecesBuffers(built.pieces),
    )
    yield* this.postProps(built.batch)
    const vehicles: VehicleData = {
      ...built.vehicles,
      prototypes: this.shelf.take(VEHICLE_PROTOTYPES),
    }
    this.post({ kind: 'vehicles', vehicles }, vehicleBuffers(vehicles))
  }

  private *props(world: World, field: ReliefField): Work {
    const batch = yield* new SurfaceProps(world, field).steps()
    yield
    yield* this.postProps(batch)
  }

  private *effects(world: World, field: ReliefField): Work {
    yield
    const effects = buildEffects(world, field, this.mouths)
    this.post({ kind: 'effects', layer: 'effects', effects }, effectBuffers(effects))
  }

  private *streamed(): Work {
    yield
    this.post({ kind: 'streamed' })
  }

  private *level(world: World, grid: Grid, map: HeightMap, record: UndergroundRecord): Work {
    const built = yield* undergroundSteps(world, grid, map, record)
    const layer = undergroundLayer(built.level)
    this.post(
      { kind: 'pieces', generation: this.generation, layer, pieces: built.pieces },
      piecesBuffers(built.pieces),
    )
    yield* this.postProps(built.batch)
    const effects: EffectsData = {
      particles: built.particles,
      beams: [],
      vortices: [],
      glows: [],
      flocks: [],
      clouds: [],
      pools: [],
      falls: undefined,
    }
    this.post({ kind: 'effects', layer, effects }, effectBuffers(effects))
    this.post({ kind: 'level-ready', level: built.level })
  }

  private *postProps(batch: InstanceBatch): Generator<undefined, void> {
    const sets = batch.sets()
    yield
    const prototypes = this.shelf.take(batch.prototypes())
    this.post({ kind: 'props', generation: this.generation, prototypes, sets }, [
      ...prototypeBuffers(prototypes),
      ...setBuffers(sets),
    ])
  }
}
