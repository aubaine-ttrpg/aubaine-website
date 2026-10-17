import type { LoadMilestone } from '../../lib/atlas/contract/loading'
import type { ToWorker } from '../../lib/atlas/contract/protocol'
import type { GpuReport, Tier } from '../../lib/atlas/contract/quality'
import type { AtlasEngine, EngineOptions } from '../../lib/atlas/engine/atlas-engine'
import type { AtlasProps, AtlasWorldCard } from './props'

export type GpuProbe =
  | { kind: 'webgl2'; report: GpuReport; maxSamples: number }
  | { kind: 'unavailable' }

export type MapSupport =
  | (Extract<GpuProbe, { kind: 'webgl2' }> & {
      createEngine: (options: EngineOptions) => AtlasEngine
    })
  | Extract<GpuProbe, { kind: 'unavailable' }>

export type LoadingLink = {
  reach: (milestone: LoadMilestone) => void
  unavailable: () => void
  fail: () => void
}

export type WorkerFailure = { message: string }

export type AtlasChannel = {
  send: (message: ToWorker, transfer?: Transferable[]) => void
  observe: (watch: (message: unknown) => void) => void
  listen: (
    receive: (message: unknown) => void,
    fail: (failure: WorkerFailure) => void,
  ) => () => void
}

export type AtlasLaunch = {
  root: HTMLElement
  section: HTMLElement
  props: AtlasProps
  channel: AtlasChannel
  gpu: MapSupport
  tier: Tier
  loading: LoadingLink
  world: AtlasWorldCard
  switchWorld: (key: string) => void
}

export type AtlasMount = {
  reveal: () => void
  suspend: () => void
  resume: () => void
  unmount: () => void
}
