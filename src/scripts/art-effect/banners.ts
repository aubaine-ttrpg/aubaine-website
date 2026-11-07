import {
  advance,
  blow,
  brisk,
  type Cloth,
  grab,
  letGo,
  nudge,
  type Point,
  pull,
  settle,
  settled,
  weave,
} from '../../lib/art-effect/cloth'
import { backingSize, frameIndex, type Size } from '../../lib/art-effect/cover'
import {
  BANNER_CLOTH,
  BANNER_DESIGN,
  bannerFringe,
  bannerOutline,
} from '../../lib/art-effect/presets'
import { bindStillToggle, isStill, STILLNESS_CHANGED } from '../stillness'
import { prepareOnApproach, stayPlain } from './approach'
import { type Look, type Loom, linkLoom, openLoom } from './loom'
import { openStudio, type Studio } from './studio'
import { environmentOf, fabricOf } from './textures'

const BANNER_SELECTOR = '[data-drape="banner"]'
const FIGURE = '[data-heraldry]'
const TOGGLE = '[data-drape-toggle]'
const DRAPED = 'data-draped'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const GRAB_REACH = 0.07
const ARRIVAL = { sway: 0.12, billow: 0.55 }
const STILL_SECONDS = 6
const SETTLE_SLICE = 0.25
const ROWS_PER_SLICE = 128
const PICTURE_WIDTH = 768
const PADDING_BLUR = 7
const BRAID_BLUR = 5
const THREAD_PERIOD = 3
const BRAID_PERIOD = 6
const STRAND_SHARE = 0.66
const TWIST_PERIOD = 9

const banners = new Map<HTMLElement, AbortController>()
const nextTask = new MessageChannel()
const breathing: Array<() => void> = []
nextTask.port1.onmessage = () => breathing.shift()?.()

function breathe(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    breathing.push(() => {
      if (signal.aborted) reject(signal.reason)
      else resolve()
    })
    nextTask.port2.postMessage(undefined)
  })
}

async function settleArrival(cloth: Cloth, signal: AbortSignal): Promise<void> {
  while (!settled(cloth) && cloth.seconds < STILL_SECONDS) {
    settle(cloth, SETTLE_SLICE)
    await breathe(signal)
  }
}

function required(holder: HTMLElement, name: string): string {
  const found = holder.dataset[name]
  if (!found) throw new Error(`a banner has no data-${name}`)
  return found
}

function canvasOf({ width, height }: Size): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('a banner could not compose its picture')
  return context
}

type Triple = [number, number, number]

function bytesOf(hex: string): Triple {
  const byte = (start: number): number => Number.parseInt(hex.slice(start, start + 2), 16)
  return [byte(1), byte(3), byte(5)]
}

function linearOf(hex: string): Triple {
  const [red, green, blue] = bytesOf(hex).map((byte) => {
    const encoded = byte / 255
    return encoded <= 0.04045 ? encoded / 12.92 : ((encoded + 0.055) / 1.055) ** 2.4
  })
  return [red ?? 0, green ?? 0, blue ?? 0]
}

type Emblem = { box: DOMRect; paths: Array<{ path: Path2D; rule: CanvasFillRule }> }

async function emblemOf(source: string, signal: AbortSignal): Promise<Emblem> {
  const response = await fetch(source, { signal })
  if (!response.ok) {
    throw new Error(`a banner could not fetch its emblem ${source} (${response.status})`)
  }
  const drawing = new DOMParser().parseFromString(await response.text(), 'image/svg+xml')
  const root = drawing.documentElement
  if (!(root instanceof SVGSVGElement)) throw new Error(`the emblem ${source} is not an SVG`)
  const paths = [...drawing.querySelectorAll('path')].map((shape) => ({
    path: new Path2D(shape.getAttribute('d') ?? ''),
    rule:
      shape.getAttribute('fill-rule') === 'evenodd' ? ('evenodd' as const) : ('nonzero' as const),
  }))
  if (paths.length === 0) throw new Error(`the emblem ${source} draws nothing`)
  return { box: root.viewBox.baseVal, paths }
}

function drawEmblem(context: CanvasRenderingContext2D, emblem: Emblem, size: Size): void {
  const side = BANNER_DESIGN.emblem.width * size.width
  const { box } = emblem
  context.save()
  context.translate((size.width - side) / 2, BANNER_DESIGN.emblem.centre * size.height - side / 2)
  context.scale(side / box.width, side / box.height)
  context.translate(-box.x, -box.y)
  context.fillStyle = '#fff'
  for (const { path, rule } of emblem.paths) context.fill(path, rule)
  context.restore()
}

function coverage(context: CanvasRenderingContext2D, size: Size): Uint8ClampedArray {
  return context.getImageData(0, 0, size.width, size.height).data
}

function strandsAcross(
  width: number,
  pitch: number,
): { strand: Float64Array; fibre: Float64Array } {
  const strand = new Float64Array(width)
  const fibre = new Float64Array(width)
  for (let x = 0; x < width; x++) {
    const along = x / pitch
    const share = along - Math.floor(along)
    strand[x] = share
    fibre[x] = share < STRAND_SHARE ? Math.sin((Math.PI * share) / STRAND_SHARE) : 0
  }
  return { strand, fibre }
}

function braidsAlong(span: number): Float64Array {
  const braids = new Float64Array(span)
  for (let step = 0; step < span; step++) {
    braids[step] = 0.88 + 0.12 * Math.sin((2 * Math.PI * step) / BRAID_PERIOD)
  }
  return braids
}

function twistAt(y: number, strand: number, pitch: number): number {
  return 0.7 + 0.3 * Math.sin((2 * Math.PI * (y + strand * pitch * 1.6)) / TWIST_PERIOD)
}

async function bannerLook(holder: HTMLElement, signal: AbortSignal): Promise<Look> {
  const field = required(holder, 'field')
  const charge = required(holder, 'charge')
  const { rest } = BANNER_CLOTH
  const size = {
    width: PICTURE_WIDTH,
    height: Math.round((PICTURE_WIDTH * rest.height) / rest.width),
  }
  const emblem = await emblemOf(required(holder, 'emblem'), signal)
  const outline = new Path2D(bannerOutline(size.width, size.height))
  const fringe = new Path2D(bannerFringe(size.width, size.height))

  const cloth = canvasOf(size)
  cloth.fillStyle = '#fff'
  cloth.fill(outline)

  const galloon = canvasOf(size)
  galloon.save()
  galloon.clip(outline)
  galloon.lineJoin = 'miter'
  galloon.strokeStyle = '#fff'
  galloon.lineWidth = 2 * BANNER_DESIGN.trim * size.width
  galloon.stroke(outline)
  galloon.restore()

  const ridged = canvasOf(size)
  ridged.filter = `blur(${BRAID_BLUR}px)`
  ridged.drawImage(galloon.canvas, 0, 0)

  const tassels = canvasOf(size)
  tassels.fillStyle = '#fff'
  tassels.fill(fringe)

  const mark = canvasOf(size)
  drawEmblem(mark, emblem, size)
  const padded = canvasOf(size)
  padded.filter = `blur(${PADDING_BLUR}px)`
  padded.drawImage(mark.canvas, 0, 0)

  const inside = coverage(cloth, size)
  const band = coverage(galloon, size)
  const banded = coverage(ridged, size)
  const strands = coverage(tassels, size)
  const shape = coverage(mark, size)
  const dome = coverage(padded, size)
  const picture = new ImageData(size.width, size.height)
  const detail = new ImageData(size.width, size.height)
  const pitch = size.width / BANNER_DESIGN.strands
  const [fr, fg, fb] = bytesOf(field)
  const [cr, cg, cb] = bytesOf(charge)
  const fringeTop = size.height * (1 - BANNER_DESIGN.fringe - BANNER_DESIGN.notch)
  const across = strandsAcross(size.width, pitch)
  const braids = braidsAlong(size.width + size.height - 1)
  for (let y = 0; y < size.height; y++) {
    if (y > 0 && y % ROWS_PER_SLICE === 0) await breathe(signal)
    const thread = 0.94 + 0.06 * Math.sin((2 * Math.PI * y) / THREAD_PERIOD)
    const fringed = y >= fringeTop
    for (let x = 0; x < size.width; x++) {
      const at = (y * size.width + x) * 4
      const cover = (inside[at] ?? 0) / 255
      const trim = (band[at] ?? 0) / 255
      const motif = (shape[at] ?? 0) / 255
      const fibre = across.fibre[x] ?? 0
      const hanging = fringed ? ((strands[at] ?? 0) / 255) * (1 - cover) : 0
      const fringeCover = hanging * Math.min(1, fibre * 3)
      const metal = Math.max(trim, motif, fringeCover > 0 ? 1 : 0)
      const hung = hanging * fibre
      const rise = Math.max(
        trim * ((banded[at] ?? 0) / 255) * (braids[x + y] ?? 0),
        motif * ((dome[at] ?? 0) / 255) * thread,
        hung === 0 ? 0 : hung * twistAt(y, across.strand[x] ?? 0, pitch) * 0.8,
      )
      const alpha = Math.max(cover, fringeCover)
      const gold = cover > 0 ? Math.max(trim, motif) : 1
      picture.data[at] = Math.round(fr + (cr - fr) * gold)
      picture.data[at + 1] = Math.round(fg + (cg - fg) * gold)
      picture.data[at + 2] = Math.round(fb + (cb - fb) * gold)
      picture.data[at + 3] = Math.round(alpha * 255)
      detail.data[at] = Math.round(metal * 255)
      detail.data[at + 1] = Math.round(rise * 255)
      detail.data[at + 3] = 255
    }
  }
  return {
    picture: { pixels: picture, size },
    detail: { pixels: detail, size },
    field: linearOf(field),
    hem: BANNER_DESIGN.hem,
  }
}

function arrive(cloth: Cloth): void {
  const { rows } = cloth.spec
  nudge(cloth, (_, row) => {
    const reach = row / (rows - 1)
    return { x: ARRIVAL.sway * reach, y: 0, z: ARRIVAL.billow * reach }
  })
}

function mount(holder: HTMLElement, teardown: AbortController): void {
  const { signal } = teardown
  const figure = holder.closest<HTMLElement>(FIGURE)
  const toggle = figure?.querySelector<HTMLButtonElement>(TOGGLE) ?? undefined
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const surface = canvas.getContext('2d')
  if (!surface) throw new Error('a banner could not draw its canvas')
  const cloth = weave(BANNER_CLOTH)
  const still = window.matchMedia(REDUCED_MOTION).matches

  let studio: Studio | undefined
  let loom: Loom | undefined
  let preparing: Promise<void> | undefined
  let visible = false
  let stirred = false
  let frame = 0
  let last: number | undefined
  let shownFrame = -1

  const fail = (error: unknown): void => {
    if (!signal.aborted) console.error(error)
    teardown.abort()
  }

  const release = (): void => {
    loom?.release()
    loom = undefined
    studio = undefined
  }

  const draw = (): boolean => {
    const pace = studio?.tier.cloth
    if (!studio || !loom || !pace) return false
    const box = { width: holder.clientWidth, height: holder.clientHeight }
    if (box.width === 0 || box.height === 0) return true
    const backing = backingSize(box, window.devicePixelRatio, 1, pace.budget, studio.limit)
    if (!loom.draw(backing, surface)) {
      release()
      if (!canvas.isConnected) stayPlain(holder)
      return false
    }
    if (!canvas.isConnected) {
      holder.append(canvas)
      holder.setAttribute(DRAPED, '')
      if (figure && toggle && !still) bindStillToggle(figure, toggle, signal)
    }
    return true
  }

  const moving = (): boolean =>
    !still && (cloth.held !== undefined || ((stirred || !isStill()) && !settled(cloth)))

  const tick = (time: number): void => {
    frame = 0
    const pace = studio?.tier.cloth
    if (!visible || !loom || !pace || !moving()) {
      last = undefined
      return
    }
    const steps = advance(cloth, last === undefined ? 0 : (time - last) / 1000)
    last = time
    const due = frameIndex(cloth.seconds * 1000, pace.perSecond)
    if (steps > 0 && (brisk(cloth) || due !== shownFrame)) {
      shownFrame = due
      if (!draw()) return
    }
    frame = window.requestAnimationFrame(tick)
  }

  const resume = (): void => {
    if (frame === 0 && visible && loom && moving()) frame = window.requestAnimationFrame(tick)
  }

  const prepare = (): void => {
    if (preparing || loom) return
    preparing = (async () => {
      const from = openStudio()
      if (!from?.tier.cloth) {
        teardown.abort()
        return
      }
      const arriving = cloth.seconds === 0
      const [look, room, pile] = await Promise.all([
        bannerLook(holder, signal),
        environmentOf(from),
        fabricOf(from, 'velvet'),
        arriving ? settleArrival(cloth, signal) : undefined,
        linkLoom(from),
      ])
      signal.throwIfAborted()
      loom = await openLoom(from, cloth, look, { room, pile })
      signal.throwIfAborted()
      studio = from
      if (arriving && !still && !isStill()) arrive(cloth)
      blow(cloth, !still && !isStill())
      if (draw()) resume()
    })().finally(() => {
      preparing = undefined
    })
    preparing.catch(fail)
  }

  const local = (event: PointerEvent): Point => {
    const box = holder.getBoundingClientRect()
    return { x: (event.clientX - box.left) / box.height, y: (event.clientY - box.top) / box.height }
  }

  if (!still) {
    canvas.addEventListener(
      'pointerdown',
      (event) => {
        if (event.button !== 0 || grab(cloth, local(event), GRAB_REACH) === undefined) return
        stirred = true
        canvas.setPointerCapture(event.pointerId)
        event.preventDefault()
        resume()
      },
      { signal },
    )
    canvas.addEventListener(
      'pointermove',
      (event) => {
        if (cloth.held === undefined) return
        pull(cloth, local(event))
        resume()
      },
      { signal },
    )
    const drop = (): void => {
      letGo(cloth)
      resume()
    }
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      canvas.addEventListener(type, drop, { signal })
    }
    window.addEventListener(
      STILLNESS_CHANGED,
      () => {
        if (!loom) return
        if (isStill()) stirred = cloth.held !== undefined
        blow(cloth, !isStill())
        resume()
      },
      { signal },
    )
  }

  const sight = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    if (visible) prepare()
    resume()
  })
  const resize = new ResizeObserver(() => {
    if (loom) draw()
  })
  sight.observe(holder)
  resize.observe(holder)
  prepareOnApproach(holder, prepare, signal)

  signal.addEventListener(
    'abort',
    () => {
      window.cancelAnimationFrame(frame)
      sight.disconnect()
      resize.disconnect()
      release()
      canvas.remove()
      holder.removeAttribute(DRAPED)
      if (toggle) toggle.hidden = true
    },
    { once: true },
  )
}

export function syncBanners(): void {
  for (const [holder, teardown] of [...banners]) {
    if (holder.isConnected) continue
    teardown.abort()
    banners.delete(holder)
  }
  for (const holder of document.querySelectorAll<HTMLElement>(BANNER_SELECTOR)) {
    if (banners.has(holder)) continue
    const teardown = new AbortController()
    banners.set(holder, teardown)
    teardown.signal.addEventListener(
      'abort',
      () => {
        banners.delete(holder)
        stayPlain(holder)
      },
      { once: true },
    )
    try {
      mount(holder, teardown)
    } catch (error) {
      console.error(error)
      teardown.abort()
    }
  }
}
