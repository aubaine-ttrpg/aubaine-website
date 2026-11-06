import { bell, clamp01, easeInOut, easeOut, easeOutBack, hash, ramp, TAU } from './cadran/curves'
import {
  CADRAN_EMBLEM_AT,
  CADRAN_SWITCH_AT,
  COMPLETE_TRACE,
  type EmblemFrame,
  emblemTimeline,
  paintEmblem,
} from './cadran/emblem'
import { CADRAN_INK, css, hex, mix, type Rgb } from './cadran/ink'
import {
  buildShapes,
  circle,
  paintShape,
  type Shape,
  type ShapeSpec,
  stagger,
} from './cadran/shapes'
import {
  chime,
  createLimiter,
  degauss,
  hiss,
  ignite,
  noiseBuffer,
  ping,
  powerThunk,
  staticBurst,
  tone,
} from './cadran/sound'

export type AtlasBootOutcome = 'completed' | 'skipped' | 'failed' | 'cancelled'

export type AtlasBootProgress = {
  readonly fraction: number
}

export type AtlasBootOptions = {
  readonly copy: AtlasBootCopy
  readonly logo?: boolean
  readonly volume?: number
}

export type AtlasBoot = {
  readonly canvas: HTMLCanvasElement
  readonly finished: Promise<AtlasBootOutcome>
  readonly loading: Promise<void>
  report(progress: AtlasBootProgress): void
  fail(): void
  skip(): void
  destroy(): void
}

type Motion = 'full' | 'calm'
type LinkState = 'pending' | 'linked' | 'failed'
type SyncState = 'running' | 'waiting' | 'granted' | 'failed'
type GlyphGroup = 'ring' | 'marks' | 'cross' | 'globe' | 'route'

export type AtlasBootCopy = {
  readonly label: string
  readonly brandLine: string
  readonly catalyst: string
  readonly title: string
  readonly syncing: string
  readonly waiting: string
  readonly granted: string
  readonly failed: string
  readonly percentSign: string
  readonly skip: string
}

const ROUTE_DOT_COUNT = 10
const FONT_TIMEOUT = 2500
const MAX_PIXELS = 2_400_000
const FILL_RATE = 1
const STALL_SECONDS = 3

const FONT = {
  display: '"Cinzel", "Trajan Pro", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  ui: '"Barlow Semi Condensed", "Arial Narrow", "Helvetica Neue", sans-serif',
} as const

const FONT_FACES = [
  '600 64px "Cinzel"',
  '500 24px "JetBrains Mono"',
  '500 24px "Barlow Semi Condensed"',
  '600 24px "Barlow Semi Condensed"',
  '700 24px "Barlow Semi Condensed"',
] as const

const INK = {
  ...CADRAN_INK,
  ice: hex('#e6f8ff'),
  brass: hex('#c99b52'),
  amber: hex('#ffb04a'),
  screenCore: hex('#0d3b5e'),
  screenMid: hex('#072540'),
  screenEdge: hex('#020b17'),
  wordTop: hex('#fbe8c0'),
  wordMid: hex('#e0b46a'),
  wordBottom: hex('#a8793a'),
} as const

function fraction(value: number): number {
  return value - Math.floor(value)
}

function frameSeed(clock: number): number {
  return Math.floor(clock * 60)
}

function series(count: number, value: (index: number) => number): number[] {
  return Array.from({ length: count }, (_, index) => value(index))
}

type Signal = {
  readonly openX: number
  readonly openY: number
  readonly flash: number
  readonly brightness: number
  readonly noise: number
  readonly wobble: number
  readonly aberration: number
  readonly roll: number
  readonly tear: number
  readonly fade: number
  readonly hum: number
}

type AppFrame = {
  readonly alpha: number
  readonly glyph: number
  readonly glyphIgnite: number
  readonly title: readonly number[]
  readonly bar: number
  readonly progress: number
  readonly sync: SyncState
  readonly stamp: number
}

type Frame = {
  readonly clock: number
  readonly idle: number
  readonly signal: Signal
  readonly hud: number
  readonly catalyst: number
  readonly emblem: EmblemFrame
  readonly app: AppFrame
}

type Sound =
  | 'power'
  | 'degauss'
  | 'tick'
  | 'hum'
  | 'ignite'
  | 'chime'
  | 'static'
  | 'ping'
  | 'granted'
  | 'fail'
  | 'reveal'

type Cue = { readonly at: number; readonly sound: Sound; readonly length: number }

type Load = {
  readonly shown: number
  readonly stalled: boolean
}

type Plan = {
  readonly loadingAt: number
  readonly holdAt: number
  readonly revealAt: number
  readonly end: number
  readonly failEnd: number
  frame(time: number, clock: number, link: LinkState, load: Load): Frame
  cues(link: LinkState): readonly Cue[]
}

function cue(at: number, sound: Sound, length = 0): Cue {
  return { at, sound, length }
}

function syncState(failed: boolean, waiting: boolean, granted: boolean): SyncState {
  if (failed) return 'failed'
  if (waiting) return 'waiting'
  return granted ? 'granted' : 'running'
}

function stampOf(sync: SyncState, time: number, grantedAt: number, failedAt: number): number {
  if (sync === 'granted') return ramp(time, grantedAt, grantedAt + 0.15)
  if (sync === 'failed') return ramp(time, failedAt, failedAt + 0.15)
  return 0
}

function cueSets(build: (link: LinkState) => Cue[]): (link: LinkState) => readonly Cue[] {
  const sets: Readonly<Record<LinkState, readonly Cue[]>> = {
    pending: build('pending'),
    linked: build('linked'),
    failed: build('failed'),
  }
  return (link) => sets[link]
}

function fullPlan(copy: AtlasBootCopy, logo: boolean): Plan {
  const title = copy.title
  const emblemAt = CADRAN_EMBLEM_AT
  const switchAt = CADRAN_SWITCH_AT
  const holdAt = switchAt + 1.89
  const grantedAt = switchAt + 1.99
  const revealAt = switchAt + 2.59
  const end = switchAt + 3.14
  const failEnd = holdAt + 0.75

  const cues = cueSets((link) => {
    const list: Cue[] = [
      cue(0.35, 'power'),
      cue(0.8, 'degauss'),
      cue(emblemAt, 'hum', 1.45),
      cue(emblemAt + 1.35, 'ignite'),
      cue(switchAt, 'static'),
      cue(switchAt + 0.22, 'ping'),
    ]
    if (link === 'failed') return [...list, cue(holdAt + 0.05, 'fail')]
    list.push(cue(grantedAt, 'granted'), cue(revealAt, 'reveal'))
    return list
  })

  const frame = (time: number, clock: number, link: LinkState, load: Load): Frame => {
    const t = time
    const failed = link === 'failed' && t >= holdAt
    const waiting = link === 'pending' && t >= holdAt && load.stalled
    const seed = frameSeed(clock)
    const warm = ramp(t, 0.47, 1.5)
    const channel = logo ? 1 : 0
    const switching = channel * bell(t, switchAt, switchAt + 0.12, switchAt + 0.34)
    const flicker = hash(seed * 0.917 + 4.1) - 0.5
    const revealing = ramp(t, revealAt, end)
    const revealGlow = bell(t, revealAt - 0.05, revealAt + 0.12, end)
    const brandOut = ramp(t, switchAt + 0.08, switchAt + 0.22)
    const app = (from: number, to: number): number => ramp(t, switchAt + from, switchAt + to)
    const sync = syncState(failed, waiting, t >= grantedAt)

    return {
      clock,
      idle: 1,
      signal: {
        openX: t < 0.28 ? 0 : t < 0.35 ? 0.004 : 0.004 + 0.996 * easeOut(ramp(t, 0.35, 0.47)),
        openY: t < 0.47 ? 0.004 : 0.004 + 0.996 * easeOutBack(ramp(t, 0.47, 0.85)),
        flash:
          t < 0.28
            ? 0
            : t < 0.35
              ? 0.6 * ramp(t, 0.28, 0.35)
              : t < 0.47
                ? 0.6 + 0.4 * ramp(t, 0.35, 0.47)
                : Math.exp(-(t - 0.47) * 5) + 0.12 * switching,
        brightness:
          (0.55 + 0.45 * easeOut(warm)) *
          (1 + flicker * (0.12 * (1 - warm) + 0.014)) *
          (1 + 0.35 * revealGlow),
        noise: 0.04 + 0.86 * (1 - easeOut(warm)) + 0.55 * switching + (waiting ? 0.03 : 0),
        wobble: ramp(t, 0.8, 0.9) * (1 - ramp(t, 0.9, 1.5)) ** 2,
        aberration: 0.8 + (t >= 0.47 ? 3.6 * (1 - easeOut(warm)) : 0) + 5 * switching,
        roll:
          channel *
          0.014 *
          bell(t, switchAt, switchAt + 0.08, switchAt + 0.2) *
          (hash(seed * 1.31) - 0.5),
        tear: switching,
        fade: 1 - easeInOut(revealing),
        hum: 1,
      },
      hud: easeOut(ramp(t, 0.9, 1.3)),
      catalyst: ramp(t, 1, 2),
      emblem: { alpha: logo && t >= emblemAt ? 1 - brandOut : 0, ...emblemTimeline(t) },
      app: {
        alpha: app(0.14, 0.26),
        glyph: app(0.19, 0.79),
        glyphIgnite: easeOut(app(0.69, 0.99)),
        title: series(title.length, (index) => app(0.39 + index * 0.06, 0.59 + index * 0.06)),
        bar: easeOut(app(0.69, 1.09)),
        progress: Math.min(easeOut(app(0.89, 1.89)), load.shown),
        sync,
        stamp: stampOf(sync, t, grantedAt, holdAt + 0.05),
      },
    }
  }

  return {
    loadingAt: switchAt,
    holdAt,
    revealAt,
    end,
    failEnd,
    frame,
    cues,
  }
}

function calmPlan(copy: AtlasBootCopy): Plan {
  const title = copy.title
  const switchAt = 1.25
  const holdAt = 2.25
  const grantedAt = 2.35
  const revealAt = 2.75
  const end = 3.15
  const failEnd = holdAt + 0.6

  const cues = cueSets((link) => {
    const list: Cue[] = [cue(0.3, 'chime'), cue(1.3, 'ping')]
    if (link === 'failed') return [...list, cue(holdAt + 0.05, 'fail')]
    list.push(cue(grantedAt, 'granted'), cue(revealAt, 'reveal'))
    return list
  })

  const frame = (time: number, clock: number, link: LinkState, load: Load): Frame => {
    const t = time
    const failed = link === 'failed' && t >= holdAt
    const waiting = link === 'pending' && t >= holdAt && load.stalled
    const brandOut = ramp(t, 1, switchAt)
    const sync = syncState(failed, waiting, t >= grantedAt)
    return {
      clock,
      idle: 0,
      signal: {
        openX: 1,
        openY: 1,
        flash: 0,
        brightness: easeOut(ramp(t, 0, 0.45)),
        noise: 0,
        wobble: 0,
        aberration: 0.5,
        roll: 0,
        tear: 0,
        fade: 1 - easeInOut(ramp(t, revealAt, end)),
        hum: 0,
      },
      hud: easeOut(ramp(t, 0, 0.3)),
      catalyst: 1,
      emblem: {
        alpha: ramp(t, 0.05, 0.5) * (1 - brandOut),
        trace: COMPLETE_TRACE,
        ignite: 1,
        needle: 0,
        halo: 1,
        pulse: 0,
      },
      app: {
        alpha: ramp(t, switchAt, 1.5),
        glyph: 1,
        glyphIgnite: 1,
        title: series(title.length, () => 1),
        bar: 1,
        progress: Math.min(ramp(t, 1.45, 2.25), load.shown),
        sync,
        stamp: stampOf(sync, t, grantedAt, holdAt + 0.05),
      },
    }
  }

  return {
    loadingAt: switchAt,
    holdAt,
    revealAt,
    end,
    failEnd,
    frame,
    cues,
  }
}

function createPlan(motion: Motion, copy: AtlasBootCopy, logo: boolean): Plan {
  return motion === 'full' ? fullPlan(copy, logo) : calmPlan(copy)
}

function polar(radius: number, degrees: number): string {
  const angle = (degrees * Math.PI) / 180
  return `${(radius * Math.cos(angle)).toFixed(2)},${(radius * Math.sin(angle)).toFixed(2)}`
}

function glyphSpecs(): ShapeSpec<GlyphGroup>[] {
  const cyan = '#5FD4FF'
  const ice = '#E6F8FF'
  const brass = '#C99B52'
  const gold = '#F1D199'
  const navy = '#0A2B3B'
  const plain = { fill: null, opacity: 1, round: false, turns: false } as const
  const specs: ShapeSpec<GlyphGroup>[] = [
    { ...plain, group: 'ring', d: circle(0, 0, 96), stroke: cyan, width: 2.4 },
    { ...plain, group: 'ring', d: circle(0, 0, 70), stroke: cyan, width: 1.4, opacity: 0.75 },
    {
      ...plain,
      group: 'ring',
      d: `M ${polar(82, -35)} A 82,82 0 0 1 ${polar(82, 35)}`,
      stroke: ice,
      width: 3.2,
    },
    {
      ...plain,
      group: 'ring',
      d: `M ${polar(82, 145)} A 82,82 0 0 1 ${polar(82, 215)}`,
      stroke: ice,
      width: 3.2,
    },
  ]
  for (let index = 0; index < 12; index += 1) {
    const major = index % 3 === 0
    const degrees = index * 30 - 90
    specs.push({
      ...plain,
      group: 'marks',
      d: `M ${polar(major ? 90 : 96, degrees)} L ${polar(major ? 112 : 104, degrees)}`,
      stroke: major ? ice : cyan,
      width: major ? 2 : 1.2,
      opacity: major ? 1 : 0.7,
    })
  }
  for (const degrees of [0, 90, 180, 270]) {
    specs.push({
      ...plain,
      group: 'cross',
      d: `M ${polar(118, degrees)} L ${polar(150, degrees)}`,
      stroke: cyan,
      width: 1.6,
    })
  }
  for (const degrees of [0, 90, 180, 270]) {
    const [cx = 0, cy = 0] = polar(156, degrees).split(',').map(Number)
    specs.push({
      ...plain,
      group: 'cross',
      d: circle(cx, cy, 4),
      fill: cyan,
      stroke: cyan,
      width: 1,
    })
  }
  const graticule = { ...plain, group: 'globe', stroke: cyan, width: 1.1, opacity: 0.55 } as const
  specs.push(
    { ...graticule, d: 'M 0,-70 L 0,70' },
    { ...graticule, d: 'M 0,-70 A 36,70 0 1 1 0,70 A 36,70 0 1 1 0,-70' },
    { ...graticule, d: 'M -70,0 L 70,0' },
    { ...graticule, d: 'M -60,-36 L 60,-36' },
    { ...graticule, d: 'M -60,36 L 60,36' },
  )
  specs.push(
    { ...plain, group: 'route', d: circle(-46, 40, 4.5), fill: brass, stroke: gold, width: 1.2 },
    {
      ...plain,
      group: 'route',
      d: 'M 30,-14 C 26,-20 20,-24 20,-30 A 10,10 0 1 1 40,-30 C 40,-24 34,-20 30,-14 Z',
      fill: gold,
      stroke: gold,
      width: 1.4,
      round: true,
    },
    { ...plain, group: 'route', d: circle(30, -30, 3.6), fill: navy, stroke: null, width: 0 },
  )
  return specs
}

let glyphCache: readonly Shape<GlyphGroup>[] | undefined

function glyphShapes(): readonly Shape<GlyphGroup>[] {
  glyphCache ??= buildShapes(glyphSpecs())
  return glyphCache
}

const GLYPH_TIMING: Readonly<Record<GlyphGroup, readonly [number, number, number]>> = {
  ring: [0, 0.5, 0.6],
  marks: [0.2, 0.6, 0.25],
  cross: [0.35, 0.75, 0.5],
  globe: [0.3, 0.8, 0.45],
  route: [0.65, 1, 0.55],
}

type Metrics = {
  readonly width: number
  readonly height: number
  readonly unit: number
  readonly portrait: boolean
}

type Surface = { readonly canvas: HTMLCanvasElement; readonly context: CanvasRenderingContext2D }

function createSurface(): Surface {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot draw on a 2D canvas')
  return { canvas, context }
}

function resizeSurface(target: Surface, width: number, height: number): void {
  target.canvas.width = Math.max(1, Math.round(width))
  target.canvas.height = Math.max(1, Math.round(height))
  target.context.imageSmoothingEnabled = true
  target.context.imageSmoothingQuality = 'high'
}

function font(weight: number, size: number, family: string): string {
  return `${weight} ${size.toFixed(2)}px ${family}`
}

function trackedWidth(context: CanvasRenderingContext2D, text: string, tracking: number): number {
  let width = 0
  let count = 0
  for (const glyph of text) {
    width += context.measureText(glyph).width
    count += 1
  }
  return count > 0 ? width + tracking * (count - 1) : 0
}

function fillTracked(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  alphaOf: (index: number) => number = () => 1,
): void {
  const base = context.globalAlpha
  let left = x
  let index = 0
  for (const glyph of text) {
    const alpha = alphaOf(index)
    if (alpha > 0) {
      context.globalAlpha = base * alpha
      context.fillText(glyph, left, y)
    }
    left += context.measureText(glyph).width + tracking
    index += 1
  }
  context.globalAlpha = base
}

function ignition(progress: number, seed: number, clock: number): number {
  if (progress <= 0) return 0
  if (progress >= 1) return 1
  const lit = hash(seed * 17.31 + Math.floor(clock * 40)) > 0.35 ? 1 : 0.15
  return Math.min(1, progress * 1.6) * lit
}

function paintBackdrop(target: Surface, metrics: Metrics): void {
  const { width, height, unit } = metrics
  const context = target.context
  const radius = Math.hypot(width, height) * 0.62
  const gradient = context.createRadialGradient(
    width / 2,
    height * 0.46,
    0,
    width / 2,
    height * 0.46,
    radius,
  )
  gradient.addColorStop(0, css(INK.screenCore))
  gradient.addColorStop(0.45, css(INK.screenMid))
  gradient.addColorStop(1, css(INK.screenEdge))
  context.fillStyle = gradient
  context.fillRect(0, 0, width, height)
  const step = 64 * unit
  context.strokeStyle = css(INK.cyan, 0.045)
  context.lineWidth = Math.max(1, unit)
  context.beginPath()
  for (let x = (width / 2) % step; x < width; x += step) {
    context.moveTo(x, 0)
    context.lineTo(x, height)
  }
  for (let y = (height / 2) % step; y < height; y += step) {
    context.moveTo(0, y)
    context.lineTo(width, y)
  }
  context.stroke()
}

function paintHud(
  context: CanvasRenderingContext2D,
  metrics: Metrics,
  frame: Frame,
  copy: AtlasBootCopy,
): void {
  const reveal = frame.hud
  if (reveal <= 0) return
  const { width, height, unit } = metrics
  const inset = 26 * unit
  const arm = 46 * unit * reveal
  context.save()
  context.strokeStyle = css(INK.cyan, 0.55)
  context.lineWidth = Math.max(1, 1.6 * unit)
  const corners: readonly (readonly [number, number, number, number])[] = [
    [inset, inset, 1, 1],
    [width - inset, inset, -1, 1],
    [inset, height - inset, 1, -1],
    [width - inset, height - inset, -1, -1],
  ]
  for (const [x, y, dx, dy] of corners) {
    context.beginPath()
    context.moveTo(x + dx * arm, y)
    context.lineTo(x, y)
    context.lineTo(x, y + dy * arm)
    context.stroke()
  }

  context.globalAlpha = reveal
  const top = inset + 30 * unit
  const left = inset + 18 * unit
  const right = width - inset - 18 * unit
  context.font = font(600, 14 * unit, FONT.ui)
  context.fillStyle = css(INK.cyan, 0.75)
  fillTracked(context, copy.brandLine, left, top, 3.2 * unit)

  const bars = 6
  const barWidth = 6 * unit
  const barGap = 3 * unit
  const barsLeft = right - bars * barWidth - (bars - 1) * barGap
  const lit = Math.round(frame.catalyst * bars)
  for (let index = 0; index < bars; index += 1) {
    const on = index < lit
    context.fillStyle = css(on && index >= bars - 2 ? INK.gold : INK.cyan, on ? 0.9 : 0.16)
    context.fillRect(barsLeft + index * (barWidth + barGap), top - 12 * unit, barWidth, 13 * unit)
  }
  const label = trackedWidth(context, copy.catalyst, 3.2 * unit)
  context.fillStyle = css(INK.cyan, 0.6)
  fillTracked(context, copy.catalyst, barsLeft - 12 * unit - label, top, 3.2 * unit)

  context.restore()
}

function emblemScale(metrics: Metrics): number {
  const { width, height, portrait } = metrics
  return Math.min((height * 0.62) / 600, (width * (portrait ? 0.78 : 0.46)) / 620)
}

function paintBrand(context: CanvasRenderingContext2D, metrics: Metrics, frame: Frame): void {
  paintEmblem(
    context,
    { cx: metrics.width / 2, cy: metrics.height / 2, scale: emblemScale(metrics), thinnest: 0 },
    frame.emblem,
  )
}

type Point = readonly [number, number]

const ROUTE: readonly (readonly [Point, Point, Point, Point])[] = [
  [
    [-46, 40],
    [-30, 14],
    [-8, 44],
    [6, 16],
  ],
  [
    [6, 16],
    [14, 0],
    [24, -2],
    [30, -14],
  ],
]
const ROUTE_DOT_RADIUS = 3.6
const ROUTE_ENDS = { from: 0.1, to: 0.9 } as const

function bezier([p0, p1, p2, p3]: readonly [Point, Point, Point, Point], t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ]
}

function routeDots(count: number): readonly Point[] {
  const samples: Point[] = ROUTE.flatMap((segment) =>
    Array.from({ length: 64 }, (_, index) => bezier(segment, index / 63)),
  )
  const lengths = [0]
  for (let index = 1; index < samples.length; index += 1) {
    const [x0, y0] = samples[index - 1] ?? [0, 0]
    const [x1, y1] = samples[index] ?? [0, 0]
    lengths.push((lengths[index - 1] ?? 0) + Math.hypot(x1 - x0, y1 - y0))
  }
  const total = lengths.at(-1) ?? 0
  return Array.from({ length: count }, (_, dot) => {
    const share = ROUTE_ENDS.from + ((ROUTE_ENDS.to - ROUTE_ENDS.from) * dot) / (count - 1)
    const at = lengths.findIndex((length) => length >= share * total)
    return samples[Math.max(0, at)] ?? [0, 0]
  })
}

const ROUTE_DOTS = routeDots(ROUTE_DOT_COUNT)

type AppLayout = {
  readonly scale: number
  readonly glyphX: number
  readonly glyphY: number
  readonly glyphScale: number
  readonly titleX: number
  readonly titleY: number
  readonly titleSize: number
  readonly barX: number
  readonly barWidth: number
  readonly barY: number
  readonly barHeight: number
  readonly captionY: number
}

const GLYPH_REACH = 160
const TITLE_TRACKING = 0.2

function titleWidth(context: CanvasRenderingContext2D, title: string, size: number): number {
  context.font = font(600, size, FONT.display)
  return trackedWidth(context, title, size * TITLE_TRACKING)
}

function appLayout(context: CanvasRenderingContext2D, metrics: Metrics, title: string): AppLayout {
  const { width, height, unit, portrait } = metrics
  if (portrait) {
    const scale = Math.min(unit, width / 640)
    const glyphScale = Math.min(scale * 1.3, (width * 0.7) / (2 * GLYPH_REACH))
    const titleSize = 104 * scale
    const wordWidth = titleWidth(context, title, titleSize)
    const barWidth = Math.min(width * 0.86, Math.max(2 * GLYPH_REACH * glyphScale, wordWidth))
    const barHeight = 13 * scale
    const gap = 40 * scale
    const blockHeight =
      2 * GLYPH_REACH * glyphScale + gap + titleSize * 0.72 + 40 * scale + barHeight + 32 * scale
    const glyphY = (height - blockHeight) / 2 + GLYPH_REACH * glyphScale
    const titleY = glyphY + GLYPH_REACH * glyphScale + gap + titleSize * 0.72
    const barY = titleY + 40 * scale
    return {
      scale,
      glyphX: width / 2,
      glyphY,
      glyphScale,
      titleX: (width - wordWidth) / 2,
      titleY,
      titleSize,
      barX: (width - barWidth) / 2,
      barWidth,
      barY,
      barHeight,
      captionY: barY + barHeight + 32 * scale,
    }
  }
  const natural = (scale: number) =>
    2 * GLYPH_REACH * 1.3 * scale + 72 * scale + titleWidth(context, title, 128 * scale)
  const scale = unit * Math.min(1, (width * 0.86) / natural(unit))
  const glyphScale = 1.3 * scale
  const titleSize = 128 * scale
  const blockWidth = natural(scale)
  const barHeight = 13 * scale
  const left = (width - blockWidth) / 2
  const blockHeight = 2 * GLYPH_REACH * glyphScale + 40 * scale + barHeight + 32 * scale
  const glyphY = (height - blockHeight) / 2 + GLYPH_REACH * glyphScale
  const barY = glyphY + GLYPH_REACH * glyphScale + 40 * scale
  return {
    scale,
    glyphX: left + GLYPH_REACH * glyphScale,
    glyphY,
    glyphScale,
    titleX: left + 2 * GLYPH_REACH * glyphScale + 72 * scale,
    titleY: glyphY + titleSize * 0.36,
    titleSize,
    barX: left,
    barWidth: blockWidth,
    barY,
    barHeight,
    captionY: barY + barHeight + 32 * scale,
  }
}

function routeColour(sync: SyncState, lit: number): Rgb {
  if (sync === 'failed') return INK.amber
  return mix(INK.cyan, INK.gold, lit)
}

function paintRoute(context: CanvasRenderingContext2D, frame: Frame): void {
  const { app } = frame
  const [from, to] = GLYPH_TIMING.route
  const reveal = ramp(app.glyph, from, to)
  if (reveal <= 0) return
  ROUTE_DOTS.forEach(([x, y], index) => {
    const lit = clamp01(app.progress * ROUTE_DOT_COUNT - index)
    const colour = routeColour(app.sync, lit)
    if (lit > 0) {
      context.fillStyle = css(colour, 0.22 * lit * reveal)
      context.beginPath()
      context.arc(x, y, ROUTE_DOT_RADIUS * 2.2, 0, TAU)
      context.fill()
    }
    context.fillStyle = css(colour, (0.28 + 0.72 * lit) * reveal)
    context.beginPath()
    context.arc(x, y, ROUTE_DOT_RADIUS * (0.75 + 0.25 * lit), 0, TAU)
    context.fill()
  })
}

function paintGlyph(
  context: CanvasRenderingContext2D,
  layout: AppLayout,
  frame: Frame,
  shapes: readonly Shape<GlyphGroup>[],
): void {
  const { app } = frame
  const { glyphX, glyphY, glyphScale } = layout
  if (app.glyphIgnite > 0) {
    const halo = context.createRadialGradient(glyphX, glyphY, 0, glyphX, glyphY, 190 * glyphScale)
    halo.addColorStop(0, css(INK.cyan, 0.2 * app.glyphIgnite))
    halo.addColorStop(1, css(INK.cyan, 0))
    context.fillStyle = halo
    context.fillRect(
      glyphX - 190 * glyphScale,
      glyphY - 190 * glyphScale,
      380 * glyphScale,
      380 * glyphScale,
    )
  }
  context.save()
  context.translate(glyphX, glyphY)
  context.scale(glyphScale, glyphScale)
  context.lineCap = 'butt'
  paintRoute(context, frame)
  for (const shape of shapes) {
    const [from, to, window] = GLYPH_TIMING[shape.group]
    const progress = stagger(ramp(app.glyph, from, to), shape.index, shape.count, window)
    if (progress <= 0) continue
    paintShape(context, shape, progress, progress >= 1 ? app.glyphIgnite : 0)
  }
  context.restore()
}

function paintStamp(
  context: CanvasRenderingContext2D,
  layout: AppLayout,
  frame: Frame,
  copy: AtlasBootCopy,
): void {
  const { app } = frame
  const { scale, barX } = layout
  const y = layout.captionY
  const colour = app.sync === 'granted' ? INK.gold : INK.amber
  const text = app.sync === 'granted' ? copy.granted : copy.failed
  context.font = font(700, 17 * scale, FONT.ui)
  const textWidth = trackedWidth(context, text, 4 * scale)
  const padX = 10 * scale
  const boxTop = y - 17 * scale
  const boxHeight = 23 * scale
  context.save()
  context.globalAlpha *= app.stamp
  context.fillStyle = css(colour, 0.12 + 0.4 * (1 - app.stamp))
  context.fillRect(barX - padX, boxTop, textWidth + padX * 2, boxHeight)
  context.strokeStyle = css(colour, 0.9)
  context.lineWidth = Math.max(1, 1.4 * scale)
  const arm = 7 * scale
  const corners: readonly (readonly [number, number, number, number])[] = [
    [barX - padX, boxTop, 1, 1],
    [barX + textWidth + padX, boxTop, -1, 1],
    [barX - padX, boxTop + boxHeight, 1, -1],
    [barX + textWidth + padX, boxTop + boxHeight, -1, -1],
  ]
  for (const [cx, cy, dx, dy] of corners) {
    context.beginPath()
    context.moveTo(cx + dx * arm, cy)
    context.lineTo(cx, cy)
    context.lineTo(cx, cy + dy * arm)
    context.stroke()
  }
  context.fillStyle = css(mix(colour, INK.white, 0.5 * (1 - app.stamp)))
  fillTracked(context, text, barX, y, 4 * scale)
  context.restore()
}

function paintSync(
  context: CanvasRenderingContext2D,
  layout: AppLayout,
  frame: Frame,
  copy: AtlasBootCopy,
): void {
  const { app } = frame
  const { scale, barX, barWidth } = layout
  const y = layout.captionY
  const right = barX + barWidth
  const percent = `${app.sync === 'granted' ? 100 : Math.floor(app.progress * 100)}${copy.percentSign}`

  context.font = font(500, 15 * scale, FONT.mono)
  context.fillStyle = css(app.sync === 'failed' ? INK.amber : INK.ice, 0.9)
  context.fillText(percent, right - context.measureText(percent).width, y)

  if (app.sync === 'granted' || app.sync === 'failed') {
    paintStamp(context, layout, frame, copy)
  } else {
    const waiting = app.sync === 'waiting'
    const pulse = waiting ? 0.6 + 0.4 * Math.sin(frame.clock * (frame.idle > 0 ? 6 : 2.5)) : 1
    const dots =
      waiting && frame.idle > 0 ? '.'.repeat(Math.floor(fraction(frame.clock * 1.5) * 4)) : ''
    context.font = font(600, 15 * scale, FONT.ui)
    context.fillStyle = css(INK.cyan, 0.9 * pulse)
    fillTracked(context, `${waiting ? copy.waiting : copy.syncing}${dots}`, barX, y, 2.6 * scale)
  }

  const segments = 28
  const gap = 3 * scale
  const segmentWidth = (barWidth - gap * (segments - 1)) / segments
  const filled = app.progress * segments
  const shimmer = fraction(frame.clock * 0.7) * (segments + 6) - 3
  context.strokeStyle = css(INK.cyan, 0.35)
  context.lineWidth = Math.max(1, scale)
  context.strokeRect(
    barX - 3 * scale,
    layout.barY - 3 * scale,
    barWidth + 6 * scale,
    layout.barHeight + 6 * scale,
  )
  for (let index = 0; index < segments; index += 1) {
    const x = barX + index * (segmentWidth + gap)
    const amount = clamp01(filled - index)
    context.fillStyle = css(INK.cyan, 0.08)
    context.fillRect(x, layout.barY, segmentWidth, layout.barHeight)
    if (amount <= 0) continue
    let colour: Rgb = index + 1 >= filled ? INK.ice : INK.cyan
    if (app.sync === 'granted') colour = mix(INK.cyan, INK.gold, app.stamp)
    if (app.sync === 'failed') colour = INK.amber
    context.fillStyle = css(colour, 0.35 + 0.65 * amount)
    context.fillRect(x, layout.barY, segmentWidth, layout.barHeight)
    if (app.sync === 'waiting' && frame.idle > 0) {
      const glow = clamp01(1 - Math.abs(index - shimmer) / 2.5)
      if (glow > 0) {
        context.fillStyle = css(INK.white, 0.55 * glow)
        context.fillRect(x, layout.barY, segmentWidth, layout.barHeight)
      }
    }
  }
}

function paintApp(
  context: CanvasRenderingContext2D,
  metrics: Metrics,
  frame: Frame,
  copy: AtlasBootCopy,
  shapes: readonly Shape<GlyphGroup>[],
): void {
  const { app } = frame
  if (app.alpha <= 0) return
  const layout = appLayout(context, metrics, copy.title)
  context.save()
  context.globalAlpha = app.alpha
  paintGlyph(context, layout, frame, shapes)
  context.font = font(600, layout.titleSize, FONT.display)
  context.fillStyle = css(INK.ice)
  fillTracked(
    context,
    copy.title,
    layout.titleX,
    layout.titleY,
    layout.titleSize * TITLE_TRACKING,
    (index) => ignition(app.title[index] ?? 0, index + 11, frame.clock),
  )
  if (app.bar > 0) {
    context.save()
    context.globalAlpha *= app.bar
    paintSync(context, layout, frame, copy)
    context.restore()
  }
  context.restore()
}

type Painter = { paint(frame: Frame, metrics: Metrics): void }

function createPainter(
  content: Surface,
  copy: AtlasBootCopy,
  glyphs: readonly Shape<GlyphGroup>[],
): Painter {
  return {
    paint(frame, metrics) {
      const context = content.context
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
      context.clearRect(0, 0, metrics.width, metrics.height)
      context.textBaseline = 'alphabetic'
      context.textAlign = 'left'
      paintHud(context, metrics, frame, copy)
      paintBrand(context, metrics, frame)
      paintApp(context, metrics, frame, copy, glyphs)
    },
  }
}

type Picture = {
  readonly scene: HTMLCanvasElement
  readonly tight: HTMLCanvasElement
  readonly wide: HTMLCanvasElement
  readonly signal: Signal
  readonly clock: number
  readonly width: number
  readonly height: number
}

type Output = { present(picture: Picture): void; dispose(): void }

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uGlowTight;
uniform sampler2D uGlowWide;
uniform vec2 uResolution;
uniform vec2 uTightTexel;
uniform vec2 uWideTexel;
uniform float uClock;
uniform float uSeed;
uniform float uOpenX;
uniform float uOpenY;
uniform float uFlash;
uniform float uBrightness;
uniform float uNoise;
uniform float uWobble;
uniform float uAberration;
uniform float uRoll;
uniform float uTear;
uniform float uFade;
uniform float uHum;
uniform float uScan;
uniform float uLines;

float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

vec3 bloom(sampler2D source, vec2 uv, vec2 texel) {
  vec3 sum = texture2D(source, uv).rgb * 2.0;
  sum += texture2D(source, uv + texel).rgb;
  sum += texture2D(source, uv - texel).rgb;
  sum += texture2D(source, uv + vec2(texel.x, -texel.y)).rgb;
  sum += texture2D(source, uv + vec2(-texel.x, texel.y)).rgb;
  return sum / 6.0;
}

void main() {
  vec2 c = vUv * 2.0 - 1.0;

  float open = max(uOpenY, 0.0005);
  float sy = c.y / open;
  float raster = (1.0 - smoothstep(uOpenX - 0.003, uOpenX + 0.003, abs(c.x))) * step(abs(sy), 1.0);
  vec2 s = vec2(c.x * 0.5 + 0.5, fract(sy * 0.5 + 0.5 + uRoll));
  float rolling = step(0.0001, uRoll) * step(uRoll, 0.9999);
  float seam = min(s.y, 1.0 - s.y);
  float blank = rolling * (1.0 - smoothstep(0.0, 0.04, seam));

  s.x += uWobble * 0.016 * sin(s.y * 24.0 + uClock * 40.0);
  float band = floor(s.y * 36.0);
  float tearOn = step(0.62, hash(vec2(band, uSeed * 1.37 + 3.0)));
  s.x += uTear * tearOn * (hash(vec2(band * 3.1, uSeed + 7.0)) - 0.5) * 0.14;
  s.x += (hash(vec2(floor(s.y * uResolution.y), uSeed)) - 0.5) * uNoise * 0.003;

  float shift = uAberration / uResolution.x;
  vec3 color;
  color.r = texture2D(uScene, vec2(s.x + shift, s.y)).r;
  color.g = texture2D(uScene, s).g;
  color.b = texture2D(uScene, vec2(s.x - shift, s.y)).b;
  color += bloom(uGlowTight, s, uTightTexel) * 0.55 + bloom(uGlowWide, s, uWideTexel) * 0.85;

  color *= raster * (1.0 - 0.92 * blank);
  color *= 1.0 + uFlash * 1.4;
  color += raster * uFlash * vec3(0.42, 0.7, 1.0) * 0.5;
  float thin = 1.0 - smoothstep(0.015, 0.3, uOpenY);
  float beamY = c.y / (uOpenY + 0.006);
  float beamX = 1.0 - smoothstep(max(uOpenX - 0.02, 0.0), uOpenX + 0.05, abs(c.x));
  color += exp(-beamY * beamY) * beamX * uFlash * thin * vec3(0.6, 0.86, 1.0) * 1.2;

  float line = 0.5 + 0.5 * cos(6.2831853 * (c.y * 0.5 + 0.5) * uLines);
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color *= 1.0 - uScan * (1.0 - line) * (1.0 - 0.55 * clamp(luma, 0.0, 1.0));
  float column = mod(gl_FragCoord.x, 3.0);
  vec3 triad = vec3(step(column, 1.0), step(1.0, column) * step(column, 2.0), step(2.0, column));
  color *= mix(vec3(1.0), vec3(0.84) + triad * 0.24, uScan * 0.35);

  float grain = hash(gl_FragCoord.xy + uSeed * 91.7);
  color += (grain - 0.5) * uNoise * 0.4 * raster;
  float speck = step(1.0 - uNoise * 0.01, hash(gl_FragCoord.yx * 1.31 + uSeed * 13.3));
  color += speck * raster * uNoise * vec3(0.7, 0.85, 1.0);

  float hum = fract((c.y * 0.5 + 0.5) * 0.7 - uClock * 0.085);
  color *= 1.0 + uHum * 0.045 * smoothstep(0.0, 0.5, hum) * (1.0 - smoothstep(0.5, 1.0, hum));

  color *= uBrightness;
  float vignette = 1.0 - smoothstep(0.35, 1.6, length(c * vec2(0.92, 1.0)));
  color *= mix(0.4, 1.0, vignette);
  vec2 glare = (c - vec2(-0.5, 0.62)) * vec2(0.8, 1.7);
  color += vec3(0.55, 0.78, 1.0) * (1.0 - smoothstep(0.0, 0.8, length(glare))) * 0.04;
  color += vec3(0.008, 0.014, 0.022);
  color = clamp(color, 0.0, 1.0);
  gl_FragColor = vec4(color * uFade, uFade);
}
`

const UNIFORMS = [
  'uScene',
  'uGlowTight',
  'uGlowWide',
  'uResolution',
  'uTightTexel',
  'uWideTexel',
  'uClock',
  'uSeed',
  'uOpenX',
  'uOpenY',
  'uFlash',
  'uBrightness',
  'uNoise',
  'uWobble',
  'uAberration',
  'uRoll',
  'uTear',
  'uFade',
  'uHum',
  'uScan',
  'uLines',
] as const

type UniformName = (typeof UNIFORMS)[number]

type GlResources = {
  readonly program: WebGLProgram
  readonly textures: readonly [WebGLTexture, WebGLTexture, WebGLTexture]
  readonly uniforms: Readonly<Record<UniformName, WebGLUniformLocation | null>>
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('WebGL could not create a shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`WebGL shader failed to compile: ${gl.getShaderInfoLog(shader) ?? ''}`)
  }
  return shader
}

function createTexture(gl: WebGLRenderingContext): WebGLTexture {
  const texture = gl.createTexture()
  if (!texture) throw new Error('WebGL could not create a texture')
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return texture
}

function initGl(gl: WebGLRenderingContext): GlResources {
  const program = gl.createProgram()
  if (!program) throw new Error('WebGL could not create a program')
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER))
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`WebGL program failed to link: ${gl.getProgramInfoLog(program) ?? ''}`)
  }
  gl.useProgram(program)
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
  const textures = [createTexture(gl), createTexture(gl), createTexture(gl)] as const
  const uniforms = Object.fromEntries(
    UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
  ) as Record<UniformName, WebGLUniformLocation | null>
  gl.uniform1i(uniforms.uScene, 0)
  gl.uniform1i(uniforms.uGlowTight, 1)
  gl.uniform1i(uniforms.uGlowWide, 2)
  return { program, textures, uniforms }
}

function scanlinePitch(height: number): { readonly lines: number; readonly scan: number } {
  const pitch = Math.max(2, height / 360)
  return { lines: height / pitch, scan: 0.34 * clamp01((pitch - 1.6) / 1.4) }
}

function createGlOutput(canvas: HTMLCanvasElement): Output | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
  })
  if (!gl) return null
  let resources: GlResources
  try {
    resources = initGl(gl)
  } catch (error: unknown) {
    console.warn('Atlas boot could not set up WebGL and falls back to the 2D renderer', error)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return null
  }
  let lost = false
  const onLost = (event: Event): void => {
    event.preventDefault()
    lost = true
  }
  const onRestored = (): void => {
    resources = initGl(gl)
    lost = false
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)

  const upload = (unit: number, texture: WebGLTexture, source: HTMLCanvasElement): void => {
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  }

  return {
    present(picture) {
      if (lost) return
      const { uniforms, textures } = resources
      const { signal, width, height } = picture
      gl.viewport(0, 0, width, height)
      upload(0, textures[0], picture.scene)
      upload(1, textures[1], picture.tight)
      upload(2, textures[2], picture.wide)
      const pitch = scanlinePitch(height)
      gl.uniform2f(uniforms.uResolution, width, height)
      gl.uniform2f(uniforms.uTightTexel, 1 / picture.tight.width, 1 / picture.tight.height)
      gl.uniform2f(uniforms.uWideTexel, 1 / picture.wide.width, 1 / picture.wide.height)
      gl.uniform1f(uniforms.uClock, picture.clock)
      gl.uniform1f(uniforms.uSeed, frameSeed(picture.clock) % 997)
      gl.uniform1f(uniforms.uOpenX, signal.openX)
      gl.uniform1f(uniforms.uOpenY, signal.openY)
      gl.uniform1f(uniforms.uFlash, signal.flash)
      gl.uniform1f(uniforms.uBrightness, signal.brightness)
      gl.uniform1f(uniforms.uNoise, signal.noise)
      gl.uniform1f(uniforms.uWobble, signal.wobble)
      gl.uniform1f(uniforms.uAberration, signal.aberration)
      gl.uniform1f(uniforms.uRoll, signal.roll)
      gl.uniform1f(uniforms.uTear, signal.tear)
      gl.uniform1f(uniforms.uFade, signal.fade)
      gl.uniform1f(uniforms.uHum, signal.hum)
      gl.uniform1f(uniforms.uScan, pitch.scan)
      gl.uniform1f(uniforms.uLines, pitch.lines)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

function createFlatOutput(canvas: HTMLCanvasElement): Output {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot draw on a 2D canvas')
  const lines = createSurface()
  let pattern: CanvasPattern | null = null
  let patternHeight = 0
  return {
    present(picture) {
      const { signal, width, height } = picture
      canvas.style.opacity = String(signal.fade)
      context.globalCompositeOperation = 'source-over'
      context.globalAlpha = 1
      context.fillStyle = '#010204'
      context.fillRect(0, 0, width, height)
      if (signal.openX <= 0) return
      const rasterWidth = width * Math.min(1, signal.openX)
      const rasterHeight = Math.max(1, height * signal.openY)
      const x = (width - rasterWidth) / 2
      const y = (height - rasterHeight) / 2
      context.save()
      context.beginPath()
      context.rect(x, y, rasterWidth, rasterHeight)
      context.clip()
      context.drawImage(picture.scene, 0, y, width, rasterHeight)
      context.globalCompositeOperation = 'lighter'
      context.globalAlpha = 0.55
      context.drawImage(picture.tight, 0, y, width, rasterHeight)
      context.globalAlpha = 0.85
      context.drawImage(picture.wide, 0, y, width, rasterHeight)
      context.globalCompositeOperation = 'source-over'
      context.globalAlpha = 1
      if (signal.flash > 0) {
        context.fillStyle = `rgba(150, 210, 255, ${Math.min(0.85, signal.flash * 0.5)})`
        context.fillRect(x, y, rasterWidth, rasterHeight)
      }
      const pitch = Math.max(2, Math.round(height / 360))
      if (!pattern || patternHeight !== pitch) {
        resizeSurface(lines, 1, pitch)
        lines.context.fillStyle = 'rgba(0, 0, 0, 0.28)'
        lines.context.fillRect(0, 0, 1, Math.max(1, Math.floor(pitch / 2)))
        pattern = context.createPattern(lines.canvas, 'repeat')
        patternHeight = pitch
      }
      if (pattern) {
        context.fillStyle = pattern
        context.fillRect(x, y, rasterWidth, rasterHeight)
      }
      if (signal.brightness < 1) {
        context.fillStyle = `rgba(0, 0, 0, ${1 - Math.max(0, signal.brightness)})`
        context.fillRect(x, y, rasterWidth, rasterHeight)
      }
      context.restore()
      const vignette = context.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.hypot(width, height) * 0.6,
      )
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)')
      context.fillStyle = vignette
      context.fillRect(0, 0, width, height)
    },
    dispose() {
      canvas.style.opacity = ''
    },
  }
}

type Mixer = {
  readonly context: BaseAudioContext
  readonly input: GainNode
  readonly noise: AudioBuffer
}

function createMixer(context: BaseAudioContext): Mixer {
  const input = context.createGain()
  input.gain.value = 0.8
  input.connect(createLimiter(context)).connect(context.destination)
  return { context, input, noise: noiseBuffer(context) }
}

function lowpass(mixer: Mixer, frequency: number): BiquadFilterNode {
  const filter = mixer.context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = frequency
  filter.connect(mixer.input)
  return filter
}

function hum(mixer: Mixer, when: number, length: number): void {
  const { context } = mixer
  const duration = Math.max(0.6, length)
  const gain = context.createGain()
  gain.gain.setValueAtTime(0.0001, when)
  gain.gain.exponentialRampToValueAtTime(0.05, when + 0.2)
  gain.gain.setValueAtTime(0.05, when + duration - 0.3)
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration)
  gain.connect(mixer.input)
  const vibrato = context.createOscillator()
  vibrato.frequency.value = 5.5
  const depth = context.createGain()
  depth.gain.value = 1.2
  vibrato.connect(depth)
  for (const [frequency, level] of [
    [110, 1],
    [165, 0.6],
    [220, 0.25],
  ] as const) {
    const oscillator = context.createOscillator()
    oscillator.frequency.value = frequency
    depth.connect(oscillator.frequency)
    const voice = context.createGain()
    voice.gain.value = level
    oscillator.connect(voice).connect(gain)
    oscillator.start(when)
    oscillator.stop(when + duration + 0.02)
  }
  vibrato.start(when)
  vibrato.stop(when + duration + 0.02)
}

function playSound(mixer: Mixer, entry: Cue, when: number): void {
  const out = mixer.input
  switch (entry.sound) {
    case 'power':
      powerThunk(mixer, out, when)
      return
    case 'degauss':
      degauss(mixer, out, when)
      return
    case 'tick':
      hiss(mixer, out, { type: 'bandpass', from: 3400, to: 3400, q: 1.4 }, when, {
        peak: 0.08,
        attack: 0.001,
        decay: 0.03,
      })
      tone(mixer, out, 'sine', [1480, 1480], when, { peak: 0.028, attack: 0.002, decay: 0.05 })
      return
    case 'hum':
      hum(mixer, when, entry.length)
      return
    case 'ignite':
      ignite(mixer, out, when)
      return
    case 'chime':
      chime(mixer, out, when)
      return
    case 'static':
      staticBurst(mixer, out, when)
      return
    case 'ping':
      ping(mixer, out, when)
      return
    case 'granted': {
      const filter = lowpass(mixer, 2600)
      tone(mixer, filter, 'square', [880, 880], when, { peak: 0.035, attack: 0.005, decay: 0.09 })
      tone(mixer, filter, 'square', [1318.51, 1318.51], when + 0.1, {
        peak: 0.035,
        attack: 0.005,
        decay: 0.22,
      })
      return
    }
    case 'fail': {
      const filter = lowpass(mixer, 2200)
      tone(mixer, filter, 'square', [392, 392], when, { peak: 0.04, attack: 0.005, decay: 0.12 })
      tone(mixer, filter, 'square', [293.66, 293.66], when + 0.15, {
        peak: 0.04,
        attack: 0.005,
        decay: 0.3,
      })
      return
    }
    case 'reveal':
      hiss(mixer, out, { type: 'bandpass', from: 2600, to: 420, q: 0.9 }, when, {
        peak: 0.06,
        attack: 0.06,
        decay: 0.5,
      })
      return
  }
}

type Voice = { cue(entry: Cue): void; mute(): void; close(): void }

function createVoice(volume: number): Voice | null {
  if (typeof AudioContext === 'undefined') return null
  const context = new AudioContext()
  const mixer = createMixer(context)
  mixer.input.gain.value *= volume
  void context.resume()
  return {
    cue(entry) {
      playSound(mixer, entry, context.currentTime + 0.01)
    },
    mute() {
      mixer.input.gain.setTargetAtTime(0, context.currentTime, 0.04)
    },
    close() {
      void context.close()
    },
  }
}

function resolveMotion(): Motion {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'calm' : 'full'
}

function loadFonts(): Promise<void> {
  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, FONT_TIMEOUT)
  })
  const loads = Promise.all(FONT_FACES.map((face) => document.fonts.load(face))).then(
    () => undefined,
    (error: unknown) => {
      console.warn('Atlas boot fonts failed to load, falling back to system fonts', error)
    },
  )
  return Promise.race([loads, timeout])
}

function claimHost(host: HTMLElement): () => void {
  const position = host.style.position
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative'
  host.setAttribute('aria-busy', 'true')
  return () => {
    host.style.position = position
    host.removeAttribute('aria-busy')
  }
}

type Screen = { readonly canvas: HTMLCanvasElement; readonly output: Output }

function createScreen(): Screen {
  const accelerated = document.createElement('canvas')
  const output = createGlOutput(accelerated)
  if (output) return { canvas: accelerated, output }
  const flat = document.createElement('canvas')
  return { canvas: flat, output: createFlatOutput(flat) }
}

function createSkipButton(copy: AtlasBootCopy): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = copy.skip
  const style = button.style
  style.position = 'absolute'
  style.right = 'max(12px, 4%)'
  style.bottom = 'max(12px, 10%)'
  style.zIndex = '1'
  style.padding = '6px 14px'
  style.font = `600 13px ${FONT.ui}`
  style.letterSpacing = '0.18em'
  style.textTransform = 'uppercase'
  style.color = css(INK.beam)
  style.background = 'rgba(2, 12, 22, 0.6)'
  style.border = `1px solid ${css(INK.cyan, 0.55)}`
  style.borderRadius = '4px'
  style.cursor = 'pointer'
  return button
}

type Phase = 'loading' | 'running' | 'resting'

export function mountAtlasBoot(host: HTMLElement, options: AtlasBootOptions): AtlasBoot {
  const { copy } = options
  const logo = options.logo !== false
  const plan = createPlan(resolveMotion(), copy, logo)
  const glyphs = glyphShapes()

  const { canvas, output } = createScreen()
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', copy.label)
  canvas.style.position = 'absolute'
  canvas.style.inset = '0'
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'
  const skipButton = createSkipButton(copy)
  const releaseHost = claimHost(host)
  host.append(canvas, skipButton)

  const backdrop = createSurface()
  const content = createSurface()
  const scene = createSurface()
  const chain = [createSurface(), createSurface(), createSurface(), createSurface()] as const
  const painter = createPainter(content, copy, glyphs)
  const voice = options.volume === undefined ? null : createVoice(options.volume)

  let metrics: Metrics | null = null
  let sized = false
  let phase: Phase = 'loading'
  let destroyed = false
  let time = logo ? 0 : plan.loadingAt
  let clock = 0
  let last = 0
  let frameRequest = 0
  let holding = false
  let skipQueued = false
  let skipRequested = false
  let outcome: AtlasBootOutcome = 'completed'
  let link: LinkState = 'pending'
  let target = 0
  let shown = 0
  let gainedAt = 0
  let dotsLit = 0
  let settled = false
  let resolveFinished: (value: AtlasBootOutcome) => void = () => undefined
  const finished = new Promise<AtlasBootOutcome>((resolve) => {
    resolveFinished = resolve
  })
  let resolveLoading: () => void = () => undefined
  const loading = new Promise<void>((resolve) => {
    resolveLoading = resolve
  })

  const settle = (value: AtlasBootOutcome): void => {
    if (settled) return
    settled = true
    host.removeAttribute('aria-busy')
    resolveFinished(value)
  }

  const load = (): Load => ({
    shown,
    stalled: holding && clock - gainedAt > STALL_SECONDS,
  })

  const applySize = (): boolean => {
    const rect = host.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return false
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      Math.sqrt(MAX_PIXELS / (rect.width * rect.height)),
    )
    const width = Math.max(2, Math.round(rect.width * ratio))
    const height = Math.max(2, Math.round(rect.height * ratio))
    if (!metrics || metrics.width !== width || metrics.height !== height) {
      const portrait = width / height < 1.05
      metrics = {
        width,
        height,
        unit: portrait ? Math.min(width / 640, height / 900) : Math.min(width, height) / 900,
        portrait,
      }
      canvas.width = width
      canvas.height = height
      for (const surface of [backdrop, content, scene]) resizeSurface(surface, width, height)
      chain.forEach((surface, index) => {
        const divisor = 2 ** (index + 1)
        resizeSurface(surface, Math.ceil(width / divisor), Math.ceil(height / divisor))
      })
      paintBackdrop(backdrop, metrics)
    }
    sized = true
    return true
  }

  const draw = (): void => {
    if (destroyed) return
    if (!sized && !applySize()) return
    if (!metrics) return
    const frame = plan.frame(time, clock, link, load())
    const dots = Math.floor(frame.app.progress * ROUTE_DOT_COUNT)
    if (dots > dotsLit) voice?.cue(cue(time, 'tick'))
    dotsLit = dots
    painter.paint(frame, metrics)
    scene.context.drawImage(backdrop.canvas, 0, 0)
    scene.context.drawImage(content.canvas, 0, 0)
    let source = content.canvas
    for (const surface of chain) {
      surface.context.clearRect(0, 0, surface.canvas.width, surface.canvas.height)
      surface.context.drawImage(source, 0, 0, surface.canvas.width, surface.canvas.height)
      source = surface.canvas
    }
    output.present({
      scene: scene.canvas,
      tight: chain[1].canvas,
      wide: chain[3].canvas,
      signal: frame.signal,
      clock,
      width: metrics.width,
      height: metrics.height,
    })
  }

  const fire = (previous: number, next: number): void => {
    if (!voice || next <= previous) return
    for (const entry of plan.cues(link)) {
      if (entry.at > previous && entry.at <= next) voice.cue(entry)
    }
  }

  const limit = (): number => (link === 'failed' ? plan.failEnd : plan.end)

  const hideSkip = (): void => {
    skipButton.style.display = 'none'
  }

  const conclude = (): void => {
    if (time >= plan.revealAt) {
      canvas.style.pointerEvents = 'none'
      hideSkip()
    }
    if (link === 'failed' && time >= plan.failEnd) {
      phase = 'resting'
      hideSkip()
      settle('failed')
      return
    }
    if (link === 'failed' || time < plan.end) return
    settle(outcome)
    destroy()
  }

  const fill = (step: number): void => {
    if (link !== 'pending') return
    const next = Math.min(target, shown + step * FILL_RATE)
    if (next > shown) gainedAt = clock
    shown = next
    if (target >= 1 && shown >= 0.999) link = 'linked'
  }

  const advance = (step: number): void => {
    clock += step
    fill(step)
    if (phase !== 'running') return
    if (holding && link !== 'pending') {
      holding = false
      if (skipRequested && link === 'linked')
        time = Math.max(time, Math.min(plan.revealAt, plan.end))
    }
    if (!holding) {
      const previous = time
      let next = Math.min(time + step, limit())
      if (link === 'pending' && previous < plan.holdAt && next >= plan.holdAt) {
        next = plan.holdAt
        holding = true
      }
      time = next
      fire(previous, next)
    }
    if (time >= plan.loadingAt) resolveLoading()
    conclude()
  }

  const tick = (now: number): void => {
    frameRequest = requestAnimationFrame(tick)
    const step = last === 0 ? 0 : Math.min(250, now - last) / 1000
    last = now
    advance(step)
    if (!destroyed) draw()
  }

  const skip = (): void => {
    if (destroyed || phase === 'resting') return
    hideSkip()
    if (phase === 'loading') {
      skipQueued = true
      return
    }
    if (time >= plan.revealAt) return
    outcome = 'skipped'
    skipRequested = true
    voice?.mute()
    if (link === 'pending') {
      if (time < plan.holdAt) {
        time = plan.holdAt
        holding = true
      }
      return
    }
    const goal = link === 'failed' ? plan.failEnd : Math.min(plan.revealAt, plan.end)
    if (goal > time) time = goal
    conclude()
  }

  const report = (progress: AtlasBootProgress): void => {
    if (destroyed || link !== 'pending') return
    target = Math.max(target, clamp01(progress.fraction))
  }

  const fail = (): void => {
    if (destroyed || link === 'linked') return
    link = 'failed'
  }

  const requestSkip = (): void => {
    skip()
  }
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') skip()
  }

  const observer = new ResizeObserver(() => {
    sized = false
  })

  function destroy(): void {
    if (destroyed) return
    destroyed = true
    cancelAnimationFrame(frameRequest)
    observer.disconnect()
    canvas.removeEventListener('pointerdown', requestSkip)
    skipButton.removeEventListener('click', requestSkip)
    document.removeEventListener('keydown', onKey)
    output.dispose()
    voice?.close()
    canvas.remove()
    skipButton.remove()
    releaseHost()
    resolveLoading()
    settle('cancelled')
  }

  observer.observe(host)
  canvas.addEventListener('pointerdown', requestSkip)
  skipButton.addEventListener('click', requestSkip)
  document.addEventListener('keydown', onKey)
  draw()
  frameRequest = requestAnimationFrame(tick)
  void loadFonts().then(() => {
    if (destroyed || phase !== 'loading') return
    phase = 'running'
    if (skipQueued) skip()
  })

  return { canvas, finished, loading, report, fail, skip, destroy }
}
