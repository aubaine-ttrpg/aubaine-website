import {
  backingSize,
  blurLevel,
  type Point,
  type Size,
  stageWindow,
} from '../../lib/art-effect/cover'
import { STAGE } from '../../lib/art-effect/presets'
import { STILL } from '../character-hero'
import { type Backdrop, openStudio, type Studio } from './studio'

const STAGE_SELECTOR = '[data-stage]'
const HERO = '[data-character]'
const CARD = '[data-tilt-card]'
const STAGED = 'data-staged'
const LONGEST_STEP = 0.1
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

const stages = new Map<HTMLElement, AbortController>()

async function pixelsOf(source: string): Promise<HTMLImageElement> {
  const pixels = new Image()
  pixels.src = source
  await pixels.decode()
  return pixels
}

function focusOf(stage: HTMLElement, hero: Element): Point {
  const card = hero.querySelector(CARD)
  if (!card) return { x: 0.5, y: 0.5 }
  const box = stage.getBoundingClientRect()
  const at = card.getBoundingClientRect()
  return {
    x: (at.left + at.width / 2 - box.left) / box.width,
    y: (at.top + at.height / 2 - box.top) / box.height,
  }
}

function mount(stage: HTMLElement, source: string, teardown: AbortController): void {
  const { signal } = teardown
  const hero = stage.closest(HERO)
  if (!hero) throw new Error('a stage sits outside its hero')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const surface = canvas.getContext('2d', { alpha: false })
  if (!surface) throw new Error('a stage could not draw its canvas')
  const motion = window.matchMedia(REDUCED_MOTION)

  let studio: Studio | undefined
  let backdrop: Backdrop | undefined
  let natural: Size | undefined
  let preparing: Promise<void> | undefined
  let visible = false
  let frame = 0
  let shown = -1
  let seconds = 0
  let last: number | undefined

  const still = (): boolean => motion.matches || hero.hasAttribute(STILL)

  const fail = (error: unknown): void => {
    if (!signal.aborted) console.error(error)
    teardown.abort()
  }

  const release = (): void => {
    if (backdrop && studio) studio.discard(backdrop)
    backdrop = undefined
  }

  const draw = (from: Studio, held: Backdrop, picture: Size): boolean => {
    const box = { width: stage.clientWidth, height: stage.clientHeight }
    const pace = from.tier.stage
    if (!pace || box.width === 0 || box.height === 0) return true
    const cover = stageWindow(box, picture, STAGE.bleed)
    const scene = {
      seconds,
      backing: backingSize(box, window.devicePixelRatio, 1, pace.budget, from.limit),
      cover,
      blur: blurLevel(picture.width, (STAGE.blur * cover.scale.x) / box.width),
      focus: focusOf(stage, hero),
    }
    if (!from.stage(held, scene, surface)) return false
    if (!canvas.isConnected) {
      stage.prepend(canvas)
      stage.setAttribute(STAGED, '')
    }
    return true
  }

  const lose = (): void => {
    release()
    studio = undefined
  }

  const tick = (time: number): void => {
    frame = 0
    const pace = studio?.tier.stage
    if (!visible || still() || !studio || !backdrop || !natural || !pace) {
      last = undefined
      return
    }
    seconds += last === undefined ? 0 : Math.min(LONGEST_STEP, (time - last) / 1000)
    last = time
    const next = Math.floor(seconds * pace.perSecond)
    if (next !== shown) {
      shown = next
      if (!draw(studio, backdrop, natural)) {
        lose()
        return
      }
    }
    frame = window.requestAnimationFrame(tick)
  }

  const resume = (): void => {
    if (frame === 0 && visible && !still() && studio && backdrop) {
      frame = window.requestAnimationFrame(tick)
    }
  }

  const prepare = (): void => {
    if (preparing || still()) return
    preparing = (async () => {
      const from = openStudio()
      if (!from?.tier.stage) {
        teardown.abort()
        return
      }
      if (from !== studio) release()
      if (!backdrop || !natural) {
        const pixels = await pixelsOf(source)
        signal.throwIfAborted()
        natural = { width: pixels.naturalWidth, height: pixels.naturalHeight }
        backdrop = await from.backdrop(pixels, signal)
      }
      studio = from
      if (!draw(from, backdrop, natural)) {
        lose()
        return
      }
      resume()
    })().finally(() => {
      preparing = undefined
    })
    preparing.catch(fail)
  }

  const wake = (): void => {
    if (visible && !studio) prepare()
    resume()
  }

  const sight = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    wake()
  })
  const resize = new ResizeObserver(() => {
    if (!studio) {
      wake()
      return
    }
    if (!backdrop || !natural || !visible || still()) return
    if (!draw(studio, backdrop, natural)) lose()
  })
  const stillness = new MutationObserver(wake)
  sight.observe(stage)
  resize.observe(stage)
  stillness.observe(hero, { attributes: true, attributeFilter: [STILL] })
  motion.addEventListener('change', wake, { signal })

  signal.addEventListener(
    'abort',
    () => {
      window.cancelAnimationFrame(frame)
      sight.disconnect()
      resize.disconnect()
      stillness.disconnect()
      release()
      canvas.remove()
      stage.removeAttribute(STAGED)
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
  for (const stage of document.querySelectorAll<HTMLElement>(STAGE_SELECTOR)) {
    const source = stage.dataset['stage']
    if (stages.has(stage) || !source) continue
    const teardown = new AbortController()
    stages.set(stage, teardown)
    teardown.signal.addEventListener('abort', () => stages.delete(stage), { once: true })
    try {
      mount(stage, source, teardown)
    } catch (error) {
      console.error(error)
      teardown.abort()
    }
  }
}
