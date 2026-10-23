import { backingSize, coverWindow, grainFrame, objectPosition } from '../../lib/art-effect/cover'
import { type ArtEffect, isArtEffect } from '../../lib/art-effect/effects'
import { EFFECT_SETTINGS, GRAIN_PER_SECOND } from '../../lib/art-effect/presets'
import { type Exposure, openStudio, type Print, type Studio } from './studio'

const PLATE = '[data-plate][data-art-effect]'
const DEVELOPED = 'data-developed'
const SCALE_TOLERANCE = 0.02
const AHEAD = '25% 0px'

const plates = new Map<HTMLElement, AbortController>()

function transformScale(transform: string): number {
  if (transform === 'none') return 1
  const matrix = new DOMMatrixReadOnly(transform)
  return Math.hypot(matrix.a, matrix.b)
}

async function pixelsOf(picture: HTMLImageElement): Promise<HTMLImageElement> {
  await picture.decode()
  const pixels = new Image()
  pixels.src = picture.currentSrc || picture.src
  await pixels.decode()
  return pixels
}

function expose(
  plate: HTMLElement,
  picture: HTMLImageElement,
  pixels: HTMLImageElement,
  studio: Studio,
): Exposure {
  const box = { width: plate.clientWidth, height: plate.clientHeight }
  const ratio = window.devicePixelRatio
  const scale = transformScale(window.getComputedStyle(plate).transform)
  const backing = backingSize(box, ratio, scale, studio.tier.pixelBudget, studio.limit)
  const natural = { width: pixels.naturalWidth, height: pixels.naturalHeight }
  const position = objectPosition(window.getComputedStyle(picture).objectPosition)
  return {
    backing,
    cover: coverWindow(box, natural, position),
    cssPixel: backing.density * scale,
    devicePixel: backing.density / ratio,
  }
}

function mount(plate: HTMLElement, effect: ArtEffect, teardown: AbortController): void {
  const { signal } = teardown
  const picture = plate.querySelector('img')
  if (!picture) throw new Error('a plate with an art effect holds no picture')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const surface = canvas.getContext('2d', { alpha: false })
  if (!surface) throw new Error('a plate with an art effect could not draw its canvas')
  const animated =
    plate.dataset['plate'] === 'hero' && EFFECT_SETTINGS[effect].grain.motion === 'animated'
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')

  let studio: Studio | undefined
  let print: Print | undefined
  let developing: Promise<void> | undefined
  let stale = false
  let seen = false
  let visible = false
  let frame = 0
  let grain = -1
  let scale = transformScale(window.getComputedStyle(plate).transform)

  const fail = (error: unknown): void => {
    if (!signal.aborted) console.error(error)
    teardown.abort()
  }

  const animating = (): boolean => animated && visible && !motion.matches && print !== undefined

  const tick = (time: number): void => {
    frame = 0
    if (!animating() || !studio || !print) return
    const next = grainFrame(time, GRAIN_PER_SECOND)
    if (next !== grain) {
      grain = next
      if (!studio.show(print, next >>> 0, surface)) return
    }
    frame = window.requestAnimationFrame(tick)
  }

  const resume = (): void => {
    if (frame === 0 && animating()) frame = window.requestAnimationFrame(tick)
  }

  const keep = (fresh: Print, from: Studio): void => {
    if (print && studio) studio.discard(print)
    studio = from
    from.show(fresh, 0, surface)
    if (!canvas.isConnected) {
      plate.append(canvas)
      plate.setAttribute(DEVELOPED, '')
    }
    if (animated) {
      print = fresh
      resume()
    } else {
      from.discard(fresh)
      print = undefined
    }
  }

  const redevelop = (): void => {
    stale = true
    if (developing || !seen) return
    developing = (async () => {
      while (stale) {
        stale = false
        if (plate.clientWidth === 0 || plate.clientHeight === 0) continue
        const from = openStudio()
        if (!from) {
          teardown.abort()
          return
        }
        const pixels = await pixelsOf(picture)
        signal.throwIfAborted()
        scale = transformScale(window.getComputedStyle(plate).transform)
        const fresh = await from.develop(
          effect,
          pixels,
          expose(plate, picture, pixels, from),
          signal,
        )
        if (signal.aborted || stale) {
          from.discard(fresh)
          signal.throwIfAborted()
          continue
        }
        keep(fresh, from)
      }
    })().finally(() => {
      developing = undefined
    })
    developing.catch(fail)
  }

  const watchDensity = (): void => {
    window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener(
      'change',
      () => {
        redevelop()
        watchDensity()
      },
      { once: true, signal },
    )
  }

  const resize = new ResizeObserver(() => {
    if (seen) redevelop()
  })
  const sight = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? false
      if (visible && !seen) {
        seen = true
        redevelop()
      }
      resume()
    },
    { rootMargin: AHEAD },
  )
  resize.observe(plate)
  sight.observe(plate)
  watchDensity()

  motion.addEventListener(
    'change',
    () => {
      if (motion.matches && studio && print) studio.show(print, 0, surface)
      resume()
    },
    { signal },
  )
  plate.addEventListener(
    'animationend',
    () => {
      const settled = transformScale(window.getComputedStyle(plate).transform)
      if (Math.abs(settled - scale) / scale > SCALE_TOLERANCE) redevelop()
    },
    { signal },
  )
  picture.addEventListener('load', redevelop, { signal })

  signal.addEventListener(
    'abort',
    () => {
      window.cancelAnimationFrame(frame)
      resize.disconnect()
      sight.disconnect()
      if (print && studio) studio.discard(print)
      print = undefined
      canvas.remove()
      plate.removeAttribute(DEVELOPED)
    },
    { once: true },
  )
}

export function syncPlates(): void {
  for (const [plate, teardown] of [...plates]) {
    if (plate.isConnected) continue
    teardown.abort()
    plates.delete(plate)
  }
  for (const plate of document.querySelectorAll<HTMLElement>(PLATE)) {
    const effect = plate.dataset['artEffect']
    if (plates.has(plate) || !isArtEffect(effect)) continue
    const teardown = new AbortController()
    plates.set(plate, teardown)
    teardown.signal.addEventListener('abort', () => plates.delete(plate), { once: true })
    try {
      mount(plate, effect, teardown)
    } catch (error) {
      console.error(error)
      teardown.abort()
    }
  }
}
