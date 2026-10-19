import type { View } from '../../lib/atlas/contract/camera'
import type { MapDisplay } from '../../lib/atlas/contract/display'
import { type FromWorker, isFromWorker } from '../../lib/atlas/contract/protocol'
import {
  automaticTier,
  type QualityChoice,
  stepDown,
  type Tier,
} from '../../lib/atlas/contract/quality'
import type { MapStyle } from '../../lib/atlas/contract/style'
import type { AtlasEngine, EngineEvents } from '../../lib/atlas/engine/atlas-engine'
import { createGrid, type Grid } from '../../lib/atlas/world/grid'
import type { World } from '../../lib/atlas/world/model'
import type { StarSystem } from '../../lib/atlas/world/stars'
import type { TravelRequest, TravelResult } from '../../lib/atlas/world/travel'
import { HTML_LANG } from '../../lib/i18n/locales'
import type { AtlasLaunch } from './launch'
import { storedSettings } from './settings'

export const ATLAS_STATES = ['loading', 'ready', 'map-unavailable', 'failed'] as const
export type AtlasState = (typeof ATLAS_STATES)[number]

export type ClientSnapshot = {
  state: AtlasState
  world: World | undefined
  grid: Grid | undefined
  stars: StarSystem | undefined
  engine: AtlasEngine | undefined
  readyLevels: ReadonlySet<number>
  autoTier: Tier | undefined
  failure: string | undefined
}

type EngineSetup = {
  label: string
  unexploredLabel: string
  view: View
  style: MapStyle
  animated: boolean
  display: MapDisplay
  screen: boolean
  events: Omit<
    EngineEvents,
    'firstTerrain' | 'compiled' | 'contextLost' | 'contextRestored' | 'settle' | 'slow'
  >
}

const CONTEXT_GRACE_MS = 5000

const SCENE_KINDS: ReadonlySet<FromWorker['kind']> = new Set([
  'textures',
  'terrain',
  'pieces',
  'props',
  'models',
  'effects',
  'vehicles',
])

export class AtlasClient {
  private readonly launch: AtlasLaunch
  private snapshot: ClientSnapshot
  private readonly listeners = new Set<() => void>()
  private readonly backlog: FromWorker[] = []
  private readonly travels = new Map<number, (result: TravelResult) => void>()
  private nextTravel = 1
  private tierGeneration = 0
  private lostContext = 0
  private tier: Tier
  private quality: QualityChoice
  private covered = true
  private streamed = false
  private readonly unlisten: () => void

  constructor(launch: AtlasLaunch) {
    this.launch = launch
    this.tier = launch.tier
    this.quality = storedSettings().quality
    this.snapshot = {
      state: 'loading',
      world: undefined,
      grid: undefined,
      stars: undefined,
      engine: undefined,
      readyLevels: new Set<number>(),
      autoTier: launch.gpu.kind === 'webgl2' ? automaticTier(launch.gpu.report) : undefined,
      failure: undefined,
    }
    this.unlisten = launch.channel.listen(
      (message) => this.receive(message),
      (failure) => this.fail(failure.message),
    )
    if (launch.gpu.kind === 'unavailable') {
      launch.loading.unavailable()
      this.update({ state: 'map-unavailable' })
    }
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  readonly read = (): ClientSnapshot => this.snapshot

  attach(container: HTMLElement, setup: EngineSetup): AtlasEngine | undefined {
    const { world, grid, stars, engine } = this.snapshot
    const { gpu } = this.launch
    if (engine || !world || !grid || !stars || gpu.kind !== 'webgl2') return engine
    let created: AtlasEngine
    try {
      created = gpu.createEngine({
        container,
        label: setup.label,
        unexploredLabel: setup.unexploredLabel,
        locale: HTML_LANG[this.launch.props.locale],
        world,
        grid,
        stars,
        tier: this.tier,
        view: setup.view,
        style: setup.style,
        animated: setup.animated,
        maxSamples: gpu.maxSamples,
        screen: setup.screen,
        display: setup.display,
        events: {
          ...setup.events,
          firstTerrain: () => this.update({ state: 'ready' }),
          compiled: () => this.launch.loading.reach('compiled'),
          contextLost: () => {
            this.lostContext = window.setTimeout(
              () => this.fail('the map lost its drawing context and did not get it back'),
              CONTEXT_GRACE_MS,
            )
          },
          contextRestored: () => window.clearTimeout(this.lostContext),
          settle: (x, z) => this.focus(x, z),
          slow: () => this.stepDownAutomatic(),
        },
      })
    } catch (error) {
      console.error('[atlas] the map could not start', error)
      this.launch.loading.unavailable()
      this.update({ state: 'map-unavailable' })
      return undefined
    }
    for (const message of this.backlog.splice(0)) created.receive(message)
    if (!this.covered) created.uncover()
    if (this.streamed) this.drawn(created)
    this.update({ engine: created })
    return created
  }

  travel(request: TravelRequest): Promise<TravelResult> {
    const id = this.nextTravel++
    return new Promise((resolve) => {
      this.travels.set(id, resolve)
      this.launch.channel.send({ kind: 'travel', id, request })
    })
  }

  focus(x: number, z: number): void {
    this.launch.channel.send({ kind: 'focus', x, z })
  }

  askLevel(level: number): void {
    this.launch.channel.send({ kind: 'level', level })
  }

  setQuality(quality: QualityChoice): void {
    this.quality = quality
    const tier = quality === 'auto' ? this.snapshot.autoTier : quality
    if (tier) this.retier(tier)
  }

  private retier(tier: Tier): void {
    if (tier === this.tier) return
    this.tier = tier
    this.tierGeneration += 1
    this.launch.channel.send({ kind: 'tier', tier, generation: this.tierGeneration })
    this.snapshot.engine?.setTier(tier)
  }

  reveal(): void {
    this.covered = false
    this.snapshot.engine?.uncover()
    this.update({})
  }

  suspend(): void {
    this.snapshot.engine?.suspend()
  }

  resume(): void {
    this.snapshot.engine?.resume()
  }

  dispose(): void {
    window.clearTimeout(this.lostContext)
    this.unlisten()
    this.snapshot.engine?.dispose()
    this.snapshot = { ...this.snapshot, engine: undefined }
    this.travels.clear()
    this.listeners.clear()
  }

  private stepDownAutomatic(): void {
    const { autoTier } = this.snapshot
    if (this.quality !== 'auto' || !autoTier) return
    const lower = stepDown(autoTier)
    if (lower === autoTier) return
    this.update({ autoTier: lower })
    this.tier = lower
    this.snapshot.engine?.setTier(lower)
  }

  private update(patch: Partial<ClientSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch }
    const { root } = this.launch
    const { state } = this.snapshot
    root.dataset['atlasState'] = this.covered && state !== 'failed' ? 'loading' : state
    root.setAttribute('aria-busy', String(this.covered || this.snapshot.state === 'loading'))
    for (const listener of this.listeners) listener()
  }

  private fail(message: string): void {
    console.error('[atlas]', message)
    this.launch.loading.fail()
    this.update({ state: 'failed', failure: message })
  }

  private drawn(engine: AtlasEngine): void {
    engine.afterFrame(() => {
      this.launch.loading.reach('drawn')
      if (this.snapshot.state === 'loading') this.update({ state: 'ready' })
    })
  }

  private receive(raw: unknown): void {
    if (!isFromWorker(raw)) return
    const message = raw
    if (SCENE_KINDS.has(message.kind)) {
      const engine = this.snapshot.engine
      if (engine) engine.receive(message)
      else this.backlog.push(message)
      return
    }
    switch (message.kind) {
      case 'world':
        this.update({
          world: message.world,
          grid: createGrid(message.world.columns, message.world.rows),
          stars: message.stars,
        })
        return
      case 'streamed':
        this.streamed = true
        if (this.snapshot.engine) this.drawn(this.snapshot.engine)
        return
      case 'travel': {
        const resolve = this.travels.get(message.id)
        this.travels.delete(message.id)
        resolve?.(message.result)
        return
      }
      case 'failure':
        this.fail(message.message)
        return
      case 'level-ready':
        this.update({ readyLevels: new Set([...this.snapshot.readyLevels, message.level]) })
        return
      default:
        return
    }
  }
}
