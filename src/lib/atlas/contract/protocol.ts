import type { Locale } from '../../i18n/locales.ts'
import type { World } from '../world/model.ts'
import type { StarSystem } from '../world/stars.ts'
import type { TravelRequest, TravelResult } from '../world/travel.ts'
import type { Tier } from './quality.ts'
import type {
  EffectsData,
  Piece,
  PropModel,
  PropSet,
  PrototypeData,
  SceneLayer,
  SceneTextures,
  TerrainChunk,
  VehicleData,
} from './scene.ts'

export type StartMessage = { kind: 'start'; locale: Locale; tier: Tier; world: string }

export type ToWorker =
  | StartMessage
  | { kind: 'tier'; tier: Tier; generation: number }
  | { kind: 'focus'; x: number; z: number }
  | { kind: 'level'; level: number }
  | { kind: 'travel'; id: number; request: TravelRequest }

export type FromWorker =
  | { kind: 'plan'; jobs: string[] }
  | { kind: 'done'; job: string }
  | { kind: 'world'; world: World; stars: StarSystem }
  | { kind: 'textures'; textures: SceneTextures }
  | { kind: 'terrain'; generation: number; chunk: TerrainChunk; chunks: number }
  | { kind: 'pieces'; generation: number; layer: SceneLayer; pieces: Piece[] }
  | { kind: 'props'; generation: number; prototypes: PrototypeData[]; sets: PropSet[] }
  | { kind: 'models'; models: PropModel[] }
  | { kind: 'effects'; layer: SceneLayer; effects: EffectsData }
  | { kind: 'vehicles'; vehicles: VehicleData }
  | { kind: 'level-ready'; level: number }
  | { kind: 'streamed' }
  | { kind: 'travel'; id: number; result: TravelResult }
  | { kind: 'failure'; message: string }

const TO_WORKER_KINDS: ReadonlySet<string> = new Set<ToWorker['kind']>([
  'start',
  'tier',
  'focus',
  'level',
  'travel',
])

const FROM_WORKER_KINDS: ReadonlySet<string> = new Set<FromWorker['kind']>([
  'plan',
  'done',
  'world',
  'textures',
  'terrain',
  'pieces',
  'props',
  'models',
  'effects',
  'vehicles',
  'level-ready',
  'streamed',
  'travel',
  'failure',
])

const kindOf = (value: unknown): unknown =>
  typeof value === 'object' && value !== null && 'kind' in value ? value.kind : undefined

export function isToWorker(value: unknown): value is ToWorker {
  const kind = kindOf(value)
  return typeof kind === 'string' && TO_WORKER_KINDS.has(kind)
}

export function isFromWorker(value: unknown): value is FromWorker {
  const kind = kindOf(value)
  return typeof kind === 'string' && FROM_WORKER_KINDS.has(kind)
}
