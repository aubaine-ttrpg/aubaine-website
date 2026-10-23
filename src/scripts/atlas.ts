import type {
  AtlasChannel,
  AtlasMount,
  GpuProbe,
  LoadingLink,
  MapSupport,
  WorkerFailure,
} from '../islands/atlas/launch'
import { readAtlasProps } from '../islands/atlas/props'
import { storedSettings } from '../islands/atlas/settings'
import { chosenWorld, worldUrl } from '../islands/atlas/worlds'
import { LoadProgress } from '../lib/atlas/contract/loading'
import type { ToWorker } from '../lib/atlas/contract/protocol'
import { automaticTier, type Tier } from '../lib/atlas/contract/quality'
import type { AtlasBoot, AtlasBootCopy } from './atlas-boot'
import { gpuReport } from './gpu'
import { categoryGain, soundPreferences } from './sound-preferences'
import type { SwupInstance } from './swup'

const SECTION = '[data-atlas]'
const ROOT = '[data-atlas-root]'
const BOOT = '[data-atlas-boot]'
const FAILURE = '[data-atlas-failure]'
const CANVAS = '.au-atlas__canvas'

type Session = {
  root: HTMLElement
  section: HTMLElement
  worker: Worker
  stopped: AbortController
  mount: Promise<AtlasMount | undefined>
  cover: { destroy: () => void }
}

let session: Session | undefined

function probeGpu(): GpuProbe {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2')
  if (!gl) return { kind: 'unavailable' }
  const report = gpuReport(gl)
  const maxSamples = Number(gl.getParameter(gl.MAX_SAMPLES))
  gl.getExtension('WEBGL_lose_context')?.loseContext()
  return { kind: 'webgl2', maxSamples, report }
}

async function mapSupport(gpu: GpuProbe): Promise<MapSupport> {
  if (gpu.kind !== 'webgl2') return gpu
  const { AtlasEngine } = await import('../lib/atlas/engine/atlas-engine')
  return { ...gpu, createEngine: (options) => new AtlasEngine(options) }
}

function startTier(gpu: GpuProbe): Tier {
  const choice = storedSettings().quality
  if (choice !== 'auto') return choice
  return gpu.kind === 'webgl2' ? automaticTier(gpu.report) : 'low'
}

function bootVolume(): number | undefined {
  const gain = categoryGain(soundPreferences(), 'interface')
  return gain > 0 && navigator.userActivation.hasBeenActive ? gain : undefined
}

function channelFor(worker: Worker): AtlasChannel {
  const backlog: unknown[] = []
  const watchers: ((message: unknown) => void)[] = []
  let failure: WorkerFailure | undefined
  let receive: ((message: unknown) => void) | undefined
  let fail: ((failure: WorkerFailure) => void) | undefined
  const report = (next: WorkerFailure) => {
    if (fail) fail(next)
    else failure ??= next
  }
  worker.addEventListener('message', (event) => {
    for (const watch of watchers) watch(event.data)
    if (receive) receive(event.data)
    else backlog.push(event.data)
  })
  worker.addEventListener('messageerror', () =>
    report({ message: 'a message from the worker could not be read' }),
  )
  worker.addEventListener('error', (event) =>
    report({ message: event.message || 'the worker failed' }),
  )
  return {
    send(message: ToWorker, transfer: Transferable[] = []) {
      worker.postMessage(message, transfer)
    },
    observe(watch) {
      watchers.push(watch)
    },
    listen(onMessage, onFailure) {
      receive = onMessage
      fail = onFailure
      for (const message of backlog.splice(0)) onMessage(message)
      if (failure) onFailure(failure)
      return () => {
        receive = undefined
        fail = undefined
      }
    },
  }
}

function start(
  root: HTMLElement,
  section: HTMLElement,
  swup: SwupInstance,
  { logo }: { logo: boolean },
): Session {
  const stopped = new AbortController()
  const host = section.querySelector<HTMLElement>(BOOT)
  const failure = section.querySelector<HTMLElement>(FAILURE)
  const gpu = probeGpu()
  const progress = new LoadProgress(gpu.kind === 'webgl2')
  let boot: AtlasBoot | undefined
  let mounted: AtlasMount | undefined
  let broken = false
  let revealed = false
  let refocus = false
  root.inert = true
  root.setAttribute('data-atlas-state', 'loading')
  host?.removeAttribute('hidden')
  if (failure) failure.hidden = true

  const report = () => boot?.report(progress.state)
  const showFailure = () => {
    host?.setAttribute('hidden', '')
    if (failure) failure.hidden = false
  }
  const breakDown = () => {
    broken = true
    root.setAttribute('data-atlas-state', 'failed')
    if (boot) boot.fail()
    else showFailure()
  }
  const failed = (error: unknown): undefined => {
    console.error('[atlas] the Atlas could not start', error)
    breakDown()
    return undefined
  }
  const loading: LoadingLink = {
    reach(milestone) {
      progress.reach(milestone)
      report()
    },
    unavailable() {
      progress.withoutMap()
      report()
    },
    fail: breakDown,
  }

  const worker = new Worker(new URL('../lib/atlas/worker/atlas.worker.ts', import.meta.url), {
    type: 'module',
    name: 'atlas',
  })
  const channel = channelFor(worker)
  channel.observe((message) => {
    progress.receive(message)
    report()
  })

  const focusMap = () => {
    if (!refocus || !mounted) return
    refocus = false
    root.querySelector<HTMLElement>(CANVAS)?.focus({ preventScroll: true })
  }

  const reveal = () => {
    if (revealed || stopped.signal.aborted) return
    revealed = true
    refocus =
      (host?.contains(document.activeElement) ?? false) || document.activeElement === document.body
    host?.setAttribute('hidden', '')
    root.inert = false
    mounted?.reveal()
    focusMap()
  }

  async function handOver(started: AtlasBoot): Promise<void> {
    const outcome = await started.finished
    if (outcome === 'cancelled') return
    if (outcome === 'failed') {
      started.destroy()
      showFailure()
      return
    }
    reveal()
  }

  async function cover(copy: AtlasBootCopy): Promise<void> {
    if (!host) {
      reveal()
      return
    }
    try {
      const { mountAtlasBoot } = await import('./atlas-boot')
      if (stopped.signal.aborted) return
      const volume = bootVolume()
      host.setAttribute('data-running', '')
      boot = mountAtlasBoot(host, volume === undefined ? { copy, logo } : { copy, logo, volume })
      report()
      if (broken) boot.fail()
      void handOver(boot)
      await boot.loading
    } catch (error) {
      console.error('[atlas] the start-up screen could not run', error)
      if (broken) showFailure()
      else reveal()
    }
  }

  const mount = (async () => {
    const props = readAtlasProps(root.dataset['atlasProps'])
    const { world, known } = chosenWorld(props, window.location.search)
    if (!known) {
      const url = worldUrl(window.location, world.key, props.opening) + window.location.hash
      window.history.replaceState(window.history.state, '', url)
    }
    const switchWorld = (key: string) => {
      void switchAtlas(swup, worldUrl(window.location, key, props.opening))
    }
    const tier = startTier(gpu)
    channel.send({ kind: 'start', locale: props.locale, tier, world: world.key } satisfies ToWorker)
    const loadingScreen = cover(props.boot)
    await import('astro:scripts/before-hydration.js')
    const [{ mountAtlas }, support] = await Promise.all([
      import('../islands/atlas/mount'),
      mapSupport(gpu),
    ])
    if (stopped.signal.aborted) return undefined
    loading.reach('code')
    await loadingScreen
    if (stopped.signal.aborted) return undefined
    mounted = mountAtlas({
      root,
      section,
      props,
      channel,
      gpu: support,
      tier,
      loading,
      world,
      switchWorld,
    })
    if (revealed) mounted.reveal()
    focusMap()
    return mounted
  })().catch(failed)

  return { root, section, worker, stopped, mount, cover: { destroy: () => boot?.destroy() } }
}

function stop(current: Session): Promise<void> {
  current.stopped.abort()
  current.cover.destroy()
  return current.mount.then((mounted) => {
    mounted?.unmount()
    current.worker.terminate()
  })
}

async function switchAtlas(swup: SwupInstance, url: string): Promise<void> {
  const current = session
  if (!current) return
  const state: unknown = window.history.state
  window.history.replaceState(
    typeof state === 'object' && state !== null ? { ...state, url } : { url },
    '',
    url,
  )
  session = undefined
  await stop(current)
  if (current.root.isConnected)
    session = start(current.root, current.section, swup, { logo: false })
}

function syncAtlas(swup: SwupInstance): void {
  if (session && !session.root.isConnected) {
    void stop(session)
    session = undefined
  }
  const section = document.querySelector<HTMLElement>(SECTION)
  const root = section?.querySelector<HTMLElement>(ROOT)
  if (section && root && root !== session?.root) {
    session = start(root, section, swup, { logo: true })
  }
}

export function bindAtlas(swup: SwupInstance): void {
  swup.hooks.on('page:view', () => syncAtlas(swup))
  swup.hooks.on('visit:start', () => {
    void session?.mount.then((mounted) => mounted?.suspend())
  })
  swup.hooks.on('visit:end', () => {
    if (session?.root.isConnected) void session.mount.then((mounted) => mounted?.resume())
  })
  syncAtlas(swup)
}
