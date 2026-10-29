import {
  backingSize,
  blurLevel,
  type Point,
  type Size,
  stageWindow,
} from '../../lib/art-effect/cover'
import { STAGE } from '../../lib/art-effect/presets'
import { paintField } from '../stage-field'
import { STILL } from '../stillness'
import { type Backdrop, openStudio, type Studio } from './studio'

const STAGE_SELECTOR = '[data-stage]'
const FIELD_SELECTOR = '[data-stage-field]'
const HOST = '[data-stage-host]'
const FOCUS = '[data-stage-focus]'
const STAGED = 'data-staged'
const SOURCE = 'data-stage'
const LONGEST_STEP = 0.1
const FADE_MS = 450
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

type Layer = {
  canvas: HTMLCanvasElement
  surface: CanvasRenderingContext2D
  backdrop: Backdrop
  natural: Size
  source: string
}

const stages = new Map<HTMLElement, AbortController>()

async function pixelsOf(source: string): Promise<HTMLImageElement> {
  const pixels = new Image()
  pixels.src = source
  await pixels.decode()
  return pixels
}

function focusOf(stage: HTMLElement, host: Element): Point {
  const focus = host.querySelector(FOCUS)
  if (!focus) return { x: 0.5, y: 0.5 }
  const box = stage.getBoundingClientRect()
  const at = focus.getBoundingClientRect()
  return {
    x: (at.left + at.width / 2 - box.left) / box.width,
    y: (at.top + at.height / 2 - box.top) / box.height,
  }
}

function freshCanvas(): Pick<Layer, 'canvas' | 'surface'> {
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const surface = canvas.getContext('2d', { alpha: false })
  if (!surface) throw new Error('a stage could not draw its canvas')
  return { canvas, surface }
}

function mount(stage: HTMLElement, teardown: AbortController): void {
  const { signal } = teardown
  const host = stage.closest(HOST)
  if (!host) throw new Error('a stage sits outside its host')
  const motion = window.matchMedia(REDUCED_MOTION)

  let studio: Studio | undefined
  let shown: Layer | undefined
  let incoming: Layer | undefined
  let loading: AbortController | undefined
  let visible = false
  let frame = 0
  let fade = 0
  let step = -1
  let seconds = 0
  let last: number | undefined

  const still = (): boolean => motion.matches || host.hasAttribute(STILL)
  const sourceNow = (): string => stage.getAttribute(SOURCE) ?? ''
  const drawn = (): Layer | undefined => incoming ?? shown

  const release = (layer: Layer | undefined): void => {
    if (!layer) return
    layer.canvas.remove()
    studio?.discard(layer.backdrop)
  }

  const lose = (): void => {
    window.clearTimeout(fade)
    release(incoming)
    release(shown)
    incoming = undefined
    shown = undefined
    studio = undefined
    stage.removeAttribute(STAGED)
  }

  const place = (layer: Layer): void => {
    if (shown && shown !== layer && shown.canvas.isConnected) shown.canvas.after(layer.canvas)
    else stage.prepend(layer.canvas)
    stage.setAttribute(STAGED, '')
  }

  const draw = (from: Studio, layer: Layer): boolean => {
    const box = { width: stage.clientWidth, height: stage.clientHeight }
    const pace = from.tier.stage
    if (!pace || box.width === 0 || box.height === 0) return true
    const cover = stageWindow(box, layer.natural, STAGE.bleed)
    const scene = {
      seconds,
      backing: backingSize(box, window.devicePixelRatio, 1, pace.budget, from.limit),
      cover,
      blur: blurLevel(layer.natural.width, (STAGE.blur * cover.scale.x) / box.width),
      focus: focusOf(stage, host),
    }
    if (!from.stage(layer.backdrop, scene, layer.surface)) return false
    if (!layer.canvas.isConnected) place(layer)
    return true
  }

  const settleFade = (layer: Layer): void => {
    window.clearTimeout(fade)
    fade = 0
    if (shown && shown !== layer) release(shown)
    shown = layer
    if (incoming === layer) incoming = undefined
    layer.canvas.style.removeProperty('opacity')
    layer.canvas.style.removeProperty('transition')
  }

  const crossfade = (layer: Layer): void => {
    if (!shown || still()) {
      settleFade(layer)
      return
    }
    layer.canvas.style.opacity = '0'
    layer.canvas.style.transition = `opacity ${FADE_MS}ms ease`
    window.requestAnimationFrame(() => {
      layer.canvas.style.opacity = '1'
    })
    fade = window.setTimeout(() => settleFade(layer), FADE_MS)
  }

  const tick = (time: number): void => {
    frame = 0
    const layer = drawn()
    const pace = studio?.tier.stage
    if (!visible || still() || !studio || !layer || !pace) {
      last = undefined
      return
    }
    seconds += last === undefined ? 0 : Math.min(LONGEST_STEP, (time - last) / 1000)
    last = time
    const next = Math.floor(seconds * pace.perSecond)
    if (next !== step) {
      step = next
      if (!draw(studio, layer)) {
        lose()
        return
      }
    }
    frame = window.requestAnimationFrame(tick)
  }

  const resume = (): void => {
    if (frame === 0 && visible && !still() && studio && drawn()) {
      frame = window.requestAnimationFrame(tick)
    }
  }

  const bring = (): void => {
    const source = sourceNow()
    if (!source || drawn()?.source === source) return
    if (!shown && still()) return
    loading?.abort()
    const attempt = new AbortController()
    loading = attempt
    void (async () => {
      const from = openStudio()
      if (!from?.tier.stage) {
        if (!shown) teardown.abort()
        return
      }
      if (studio && from !== studio) lose()
      const pixels = await pixelsOf(source)
      attempt.signal.throwIfAborted()
      const backdrop = await from.backdrop(pixels, attempt.signal)
      if (attempt.signal.aborted || signal.aborted) {
        from.discard(backdrop)
        return
      }
      studio = from
      if (incoming) settleFade(incoming)
      const layer = {
        ...freshCanvas(),
        backdrop,
        natural: { width: pixels.naturalWidth, height: pixels.naturalHeight },
        source,
      }
      incoming = layer
      if (!draw(from, layer)) {
        lose()
        return
      }
      crossfade(layer)
      resume()
    })()
      .catch((error: unknown) => {
        if (attempt.signal.aborted || signal.aborted) return
        console.error(error)
        if (!shown) teardown.abort()
      })
      .finally(() => {
        if (loading === attempt) loading = undefined
      })
  }

  const wake = (): void => {
    if (visible && (!studio || drawn()?.source !== sourceNow())) bring()
    resume()
  }

  const sight = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    wake()
  })
  const resize = new ResizeObserver(() => {
    const layer = drawn()
    if (!studio || !layer) {
      wake()
      return
    }
    if (!visible || still()) return
    if (!draw(studio, layer)) lose()
  })
  const stillness = new MutationObserver(wake)
  const retarget = new MutationObserver(() => {
    if (visible) bring()
  })
  sight.observe(stage)
  resize.observe(stage)
  stillness.observe(host, { attributes: true, attributeFilter: [STILL] })
  retarget.observe(stage, { attributes: true, attributeFilter: [SOURCE] })
  motion.addEventListener('change', wake, { signal })

  signal.addEventListener(
    'abort',
    () => {
      window.cancelAnimationFrame(frame)
      loading?.abort()
      sight.disconnect()
      resize.disconnect()
      stillness.disconnect()
      retarget.disconnect()
      lose()
    },
    { once: true },
  )
}

export function syncStages(): void {
  for (const [stage, teardown] of [...stages]) {
    if (stage.isConnected) continue
    teardown.abort()
    stages.delete(stage)
  }
  for (const stage of document.querySelectorAll<HTMLElement>(FIELD_SELECTOR)) {
    if (stage.getAttribute(SOURCE)) continue
    const colours = (stage.dataset['stageField'] ?? '').split('|').filter(Boolean)
    const painted = paintField(colours, stage)
    if (painted) stage.setAttribute(SOURCE, painted)
  }
  for (const stage of document.querySelectorAll<HTMLElement>(STAGE_SELECTOR)) {
    if (stages.has(stage) || !stage.getAttribute(SOURCE)) continue
    const teardown = new AbortController()
    stages.set(stage, teardown)
    teardown.signal.addEventListener('abort', () => stages.delete(stage), { once: true })
    try {
      mount(stage, teardown)
    } catch (error) {
      console.error(error)
      teardown.abort()
    }
  }
}
