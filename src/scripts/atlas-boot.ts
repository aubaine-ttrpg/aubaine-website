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
type EmblemGroup =
  | 'c'
  | 'arcs'
  | 'outerTicks'
  | 'rings'
  | 'ringTicks'
  | 'rose'
  | 'north'
  | 'hub'
  | 'book'
type GlyphGroup = 'ring' | 'marks' | 'cross' | 'globe' | 'route'
type Rgb = readonly [number, number, number]

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
const TAU = Math.PI * 2
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

function hex(value: string): Rgb {
  const digits = value.replace('#', '')
  return [
    Number.parseInt(digits.slice(0, 2), 16),
    Number.parseInt(digits.slice(2, 4), 16),
    Number.parseInt(digits.slice(4, 6), 16),
  ]
}

const INK = {
  white: hex('#ffffff'),
  beam: hex('#a8f1ff'),
  cyan: hex('#5fd4ff'),
  ice: hex('#e6f8ff'),
  brass: hex('#c99b52'),
  gold: hex('#f1d199'),
  amber: hex('#ffb04a'),
  screenCore: hex('#0d3b5e'),
  screenMid: hex('#072540'),
  screenEdge: hex('#020b17'),
  wordTop: hex('#fbe8c0'),
  wordMid: hex('#e0b46a'),
  wordBottom: hex('#a8793a'),
} as const

function css(color: Rgb, alpha = 1): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return [
    Math.round(from[0] + (to[0] - from[0]) * amount),
    Math.round(from[1] + (to[1] - from[1]) * amount),
    Math.round(from[2] + (to[2] - from[2]) * amount),
  ]
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function ramp(time: number, from: number, to: number): number {
  return clamp01((time - from) / (to - from))
}

function bell(time: number, from: number, peak: number, to: number): number {
  return time < peak ? ramp(time, from, peak) : 1 - ramp(time, peak, to)
}

function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3
}

function easeInOut(progress: number): number {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
}

function easeOutBack(progress: number): number {
  const overshoot = 1.6
  return 1 + (overshoot + 1) * (progress - 1) ** 3 + overshoot * (progress - 1) ** 2
}

function hash(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

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

type EmblemFrame = {
  readonly alpha: number
  readonly trace: Readonly<Record<EmblemGroup, number>>
  readonly ignite: number
  readonly needle: number
  readonly halo: number
  readonly pulse: number
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

const COMPLETE_TRACE: Readonly<Record<EmblemGroup, number>> = {
  c: 1,
  arcs: 1,
  outerTicks: 1,
  rings: 1,
  ringTicks: 1,
  rose: 1,
  north: 1,
  hub: 1,
  book: 1,
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

function needleAngle(elapsed: number): number {
  if (elapsed < 0) return -0.56
  return -0.56 * Math.exp(-3.2 * elapsed) * Math.cos(9 * elapsed)
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
  const emblemAt = 0.9
  const switchAt = emblemAt + 2.05
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
    const emblem = (from: number, to: number): number => ramp(t, emblemAt + from, emblemAt + to)
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
      emblem: {
        alpha: logo && t >= emblemAt ? 1 - brandOut : 0,
        trace: {
          c: easeInOut(emblem(0, 0.55)),
          arcs: emblem(0.18, 0.65),
          outerTicks: emblem(0.25, 0.8),
          rings: emblem(0.35, 0.92),
          ringTicks: emblem(0.6, 1.02),
          rose: emblem(0.7, 1.28),
          north: emblem(1.02, 1.2),
          hub: emblem(1.12, 1.3),
          book: emblem(0.92, 1.45),
        },
        ignite: easeOut(emblem(1.35, 1.75)),
        needle: needleAngle(t - emblemAt - 0.7),
        halo: emblem(1.35, 1.9),
        pulse: emblem(1.4, 2.25),
      },
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

type Subpath = {
  readonly points: Float32Array
  readonly marks: Float32Array
  readonly length: number
}

type Outline = { readonly subpaths: readonly Subpath[]; readonly length: number }

function at(values: Float32Array, index: number): number {
  return values[index] ?? 0
}

function measure(coordinates: readonly number[]): Subpath {
  const points = Float32Array.from(coordinates)
  const marks = new Float32Array(points.length / 2)
  let length = 0
  for (let index = 1; index < marks.length; index += 1) {
    length += Math.hypot(
      at(points, index * 2) - at(points, index * 2 - 2),
      at(points, index * 2 + 1) - at(points, index * 2 - 1),
    )
    marks[index] = length
  }
  return { points, marks, length }
}

function appendArc(
  out: number[],
  from: readonly [number, number],
  radii: readonly [number, number],
  rotation: number,
  large: boolean,
  sweep: boolean,
  to: readonly [number, number],
): void {
  const [x1, y1] = from
  const [x2, y2] = to
  let rx = Math.abs(radii[0])
  let ry = Math.abs(radii[1])
  if (rx === 0 || ry === 0) {
    out.push(x2, y2)
    return
  }
  const phi = (rotation * Math.PI) / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const xp = cos * dx + sin * dy
  const yp = -sin * dx + cos * dy
  const lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry)
  if (lambda > 1) {
    rx *= Math.sqrt(lambda)
    ry *= Math.sqrt(lambda)
  }
  const numerator = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp
  const denominator = rx * rx * yp * yp + ry * ry * xp * xp
  const factor = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / denominator))
  const cxp = (factor * rx * yp) / ry
  const cyp = (-factor * ry * xp) / rx
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2
  const start = Math.atan2((yp - cyp) / ry, (xp - cxp) / rx)
  let delta = Math.atan2((-yp - cyp) / ry, (-xp - cxp) / rx) - start
  if (sweep && delta < 0) delta += TAU
  if (!sweep && delta > 0) delta -= TAU
  const steps = Math.max(8, Math.ceil((Math.abs(delta) * Math.max(rx, ry)) / 2))
  for (let step = 1; step <= steps; step += 1) {
    const angle = start + (delta * step) / steps
    const ex = rx * Math.cos(angle)
    const ey = ry * Math.sin(angle)
    out.push(cx + cos * ex - sin * ey, cy + sin * ex + cos * ey)
  }
}

function appendCubic(out: number[], controls: readonly number[]): void {
  const [x0 = 0, y0 = 0, x1 = 0, y1 = 0, x2 = 0, y2 = 0, x3 = 0, y3 = 0] = controls
  const span =
    Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2)
  const steps = Math.max(8, Math.ceil(span / 2))
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps
    const u = 1 - t
    out.push(
      u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
      u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
    )
  }
}

const PATH_TOKEN = /[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g

function outlineOf(data: string): Outline {
  const tokens = data.match(PATH_TOKEN) ?? []
  const subpaths: Subpath[] = []
  let current: number[] = []
  let cursor = 0
  let command = ''
  let x = 0
  let y = 0
  let startX = 0
  let startY = 0

  const read = (): number => {
    const token = tokens[cursor]
    cursor += 1
    if (token === undefined) throw new Error(`Path data ends early: ${data}`)
    const value = Number(token)
    if (Number.isNaN(value)) throw new Error(`Expected a number in path data: ${data}`)
    return value
  }
  const flush = (): void => {
    if (current.length >= 4) subpaths.push(measure(current))
    current = []
  }

  while (cursor < tokens.length) {
    const token = tokens[cursor] ?? ''
    if (/^[A-Za-z]$/.test(token)) {
      command = token
      cursor += 1
    }
    switch (command) {
      case 'M':
        flush()
        x = read()
        y = read()
        startX = x
        startY = y
        current.push(x, y)
        command = 'L'
        break
      case 'L':
        x = read()
        y = read()
        current.push(x, y)
        break
      case 'A': {
        const radii = [read(), read()] as const
        const rotation = read()
        const large = read() !== 0
        const sweep = read() !== 0
        const to = [read(), read()] as const
        appendArc(current, [x, y], radii, rotation, large, sweep, to)
        x = to[0]
        y = to[1]
        break
      }
      case 'C': {
        const controls = [x, y, read(), read(), read(), read(), read(), read()]
        appendCubic(current, controls)
        x = controls[6] ?? x
        y = controls[7] ?? y
        break
      }
      case 'Z':
        current.push(startX, startY)
        x = startX
        y = startY
        flush()
        current = [x, y]
        command = ''
        break
      default:
        throw new Error(`Unsupported path command "${command}" in ${data}`)
    }
  }
  flush()
  return { subpaths, length: subpaths.reduce((sum, subpath) => sum + subpath.length, 0) }
}

type ShapeSpec<G extends string> = {
  readonly group: G
  readonly d: string
  readonly fill: string | null
  readonly stroke: string | null
  readonly width: number
  readonly opacity: number
  readonly round: boolean
  readonly turns: boolean
}

type Shape<G extends string> = {
  readonly group: G
  readonly index: number
  readonly count: number
  readonly path: Path2D
  readonly outline: Outline
  readonly fill: Rgb | null
  readonly stroke: Rgb | null
  readonly width: number
  readonly opacity: number
  readonly round: boolean
  readonly turns: boolean
}

function circle(cx: number, cy: number, r: number): string {
  return `M ${cx},${cy - r} A ${r},${r} 0 1 1 ${cx},${cy + r} A ${r},${r} 0 1 1 ${cx},${cy - r}`
}

function polar(radius: number, degrees: number): string {
  const angle = (degrees * Math.PI) / 180
  return `${(radius * Math.cos(angle)).toFixed(2)},${(radius * Math.sin(angle)).toFixed(2)}`
}

function buildShapes<G extends string>(specs: readonly ShapeSpec<G>[]): Shape<G>[] {
  const totals = new Map<G, number>()
  for (const spec of specs) totals.set(spec.group, (totals.get(spec.group) ?? 0) + 1)
  const seen = new Map<G, number>()
  return specs.map((spec) => {
    const index = seen.get(spec.group) ?? 0
    seen.set(spec.group, index + 1)
    return {
      group: spec.group,
      index,
      count: totals.get(spec.group) ?? 1,
      path: new Path2D(spec.d),
      outline: outlineOf(spec.d),
      fill: spec.fill === null ? null : hex(spec.fill),
      stroke: spec.stroke === null ? null : hex(spec.stroke),
      width: spec.width,
      opacity: spec.opacity,
      round: spec.round,
      turns: spec.turns,
    }
  })
}

type Paint = {
  readonly fill: string | null
  readonly stroke: string | null
  readonly width: number
  readonly opacity: number
  readonly round: boolean
}

const EMBLEM_PAINT = {
  shell: { fill: '#0A2B3B', stroke: '#C99B52', width: 5, opacity: 1, round: true },
  arcBright: { fill: null, stroke: '#F1D199', width: 2.8, opacity: 0.85, round: false },
  arcDim: { fill: null, stroke: '#C99B52', width: 2, opacity: 0.55, round: false },
  tickMajor: { fill: null, stroke: '#F1D199', width: 2.5, opacity: 0.8, round: false },
  tickMinor: { fill: null, stroke: '#F1D199', width: 1.3, opacity: 0.8, round: false },
  ringOuter: { fill: null, stroke: '#C99B52', width: 4, opacity: 1, round: false },
  ringFine: { fill: null, stroke: '#F1D199', width: 1.4, opacity: 0.7, round: false },
  ringInner: { fill: null, stroke: '#C99B52', width: 3, opacity: 1, round: false },
  ringFaint: { fill: null, stroke: '#C99B52', width: 1.4, opacity: 0.7, round: false },
  dialMajor: { fill: null, stroke: '#C99B52', width: 1.9, opacity: 1, round: false },
  dialMinor: { fill: null, stroke: '#C99B52', width: 1, opacity: 1, round: false },
  roseDiagonal: { fill: '#123A4D', stroke: '#C99B52', width: 2.5, opacity: 1, round: false },
  rosePoint: { fill: '#0A2B3B', stroke: '#C99B52', width: 3.2, opacity: 1, round: true },
  roseLight: { fill: '#F1D199', stroke: null, width: 0, opacity: 0.91, round: false },
  north: { fill: '#C99B52', stroke: '#F1D199', width: 2, opacity: 1, round: false },
  hubOuter: { fill: '#0A2B3B', stroke: '#C99B52', width: 8, opacity: 1, round: false },
  hubInner: { fill: '#123A4D', stroke: '#F1D199', width: 5, opacity: 1, round: false },
  stud: { fill: '#0A2B3B', stroke: '#C99B52', width: 3, opacity: 1, round: false },
  bookCover: { fill: '#0A2B3B', stroke: '#C99B52', width: 6, opacity: 1, round: true },
  bookPages: { fill: '#123A4D', stroke: '#F1D199', width: 4, opacity: 1, round: true },
  bookLines: { fill: null, stroke: '#F1D199', width: 2.5, opacity: 0.85, round: false },
  bookSpine: { fill: null, stroke: '#C99B52', width: 4, opacity: 1, round: false },
  bookClasp: { fill: '#0A2B3B', stroke: '#C99B52', width: 3, opacity: 1, round: false },
} as const satisfies Readonly<Record<string, Paint>>

type EmblemPaint = keyof typeof EMBLEM_PAINT

const EMBLEM: readonly (readonly [EmblemGroup, EmblemPaint, string])[] = [
  [
    'c',
    'shell',
    'M 480.97,141.55 A 220,220 0 1 0 468.25,432.82 L 436.60,402.26 A 176,176 0 1 1 446.78,169.24 Z',
  ],
  ['arcs', 'arcBright', 'M467.81,147.59 A 206,206 0 1 0 455.66,425.66'],
  ['arcs', 'arcDim', 'M454.02,159.16 A 188,188 0 1 0 442.94,412.94'],
  ['outerTicks', 'tickMajor', 'M 436.62,134.34 L 445.80,123.78'],
  ['outerTicks', 'tickMinor', 'M 414.92,112.09 L 419.69,104.45'],
  ['outerTicks', 'tickMinor', 'M 387.36,97.74 L 390.88,89.46'],
  ['outerTicks', 'tickMajor', 'M 356.69,92.73 L 360.08,79.15'],
  ['outerTicks', 'tickMinor', 'M 327.26,82.75 L 328.04,73.79'],
  ['outerTicks', 'tickMinor', 'M 296.19,82.48 L 295.56,73.50'],
  ['outerTicks', 'tickMajor', 'M 266.58,91.95 L 263.44,78.31'],
  ['outerTicks', 'tickMinor', 'M 235.83,96.42 L 232.46,88.07'],
  ['outerTicks', 'tickMinor', 'M 208.02,110.28 L 203.39,102.57'],
  ['outerTicks', 'tickMajor', 'M 185.94,132.15 L 176.94,121.43'],
  ['outerTicks', 'tickMinor', 'M 160.57,150.10 L 153.78,144.20'],
  ['outerTicks', 'tickMinor', 'M 142.09,175.08 L 134.45,170.31'],
  ['outerTicks', 'tickMajor', 'M 132.34,204.59 L 119.46,199.12'],
  ['outerTicks', 'tickMinor', 'M 117.88,232.10 L 109.15,229.92'],
  ['outerTicks', 'tickMinor', 'M 112.75,262.74 L 103.79,261.96'],
  ['outerTicks', 'tickMajor', 'M 117.47,293.46 L 103.50,294.44'],
  ['outerTicks', 'tickMinor', 'M 117.07,324.54 L 108.31,326.56'],
  ['outerTicks', 'tickMinor', 'M 126.42,354.17 L 118.07,357.54'],
  ['outerTicks', 'tickMajor', 'M 144.57,379.40 L 132.57,386.61'],
  ['outerTicks', 'tickMinor', 'M 158.32,407.27 L 151.43,413.06'],
  ['outerTicks', 'tickMinor', 'M 180.10,429.43 L 174.20,436.22'],
  ['outerTicks', 'tickMajor', 'M 207.73,443.67 L 200.31,455.55'],
  ['outerTicks', 'tickMinor', 'M 232.64,462.26 L 229.12,470.54'],
  ['outerTicks', 'tickMinor', 'M 262.10,472.12 L 259.92,480.85'],
  ['outerTicks', 'tickMajor', 'M 293.18,472.27 L 291.96,486.21'],
  ['outerTicks', 'tickMinor', 'M 323.81,477.52 L 324.44,486.50'],
  ['outerTicks', 'tickMinor', 'M 354.54,472.93 L 356.56,481.69'],
  ['outerTicks', 'tickMajor', 'M 382.30,458.95 L 387.54,471.93'],
  ['outerTicks', 'tickMinor', 'M 411.98,449.72 L 416.61,457.43'],
  ['rings', 'ringOuter', circle(310, 280, 146)],
  ['rings', 'ringFine', circle(310, 280, 133)],
  ['rings', 'ringInner', circle(310, 280, 111)],
  ['rings', 'ringFaint', circle(310, 280, 99)],
  ['ringTicks', 'dialMajor', 'M441.00,280.00 L454.00,280.00'],
  ['ringTicks', 'dialMinor', 'M442.33,315.46 L449.09,317.27'],
  ['ringTicks', 'dialMinor', 'M428.65,348.50 L434.71,352.00'],
  ['ringTicks', 'dialMajor', 'M402.63,372.63 L411.82,381.82'],
  ['ringTicks', 'dialMinor', 'M378.50,398.65 L382.00,404.71'],
  ['ringTicks', 'dialMinor', 'M345.46,412.33 L347.27,419.09'],
  ['ringTicks', 'dialMajor', 'M310.00,411.00 L310.00,424.00'],
  ['ringTicks', 'dialMinor', 'M274.54,412.33 L272.73,419.09'],
  ['ringTicks', 'dialMinor', 'M241.50,398.65 L238.00,404.71'],
  ['ringTicks', 'dialMajor', 'M217.37,372.63 L208.18,381.82'],
  ['ringTicks', 'dialMinor', 'M191.35,348.50 L185.29,352.00'],
  ['ringTicks', 'dialMinor', 'M177.67,315.46 L170.91,317.27'],
  ['ringTicks', 'dialMajor', 'M179.00,280.00 L166.00,280.00'],
  ['ringTicks', 'dialMinor', 'M177.67,244.54 L170.91,242.73'],
  ['ringTicks', 'dialMinor', 'M191.35,211.50 L185.29,208.00'],
  ['ringTicks', 'dialMajor', 'M217.37,187.37 L208.18,178.18'],
  ['ringTicks', 'dialMinor', 'M241.50,161.35 L238.00,155.29'],
  ['ringTicks', 'dialMinor', 'M274.54,147.67 L272.73,140.91'],
  ['ringTicks', 'dialMajor', 'M310.00,149.00 L310.00,136.00'],
  ['ringTicks', 'dialMinor', 'M345.46,147.67 L347.27,140.91'],
  ['ringTicks', 'dialMinor', 'M378.50,161.35 L382.00,155.29'],
  ['ringTicks', 'dialMajor', 'M402.63,187.37 L411.82,178.18'],
  ['ringTicks', 'dialMinor', 'M428.65,211.50 L434.71,208.00'],
  ['ringTicks', 'dialMinor', 'M442.33,244.54 L449.09,242.73'],
  ['rose', 'roseDiagonal', 'M 297.27,267.27 L 395.56,194.44 L 322.73,292.73 L 310.00,280.00 Z'],
  ['rose', 'roseDiagonal', 'M 322.73,267.27 L 395.56,365.56 L 297.27,292.73 L 310.00,280.00 Z'],
  ['rose', 'roseDiagonal', 'M 322.73,292.73 L 224.44,365.56 L 297.27,267.27 L 310.00,280.00 Z'],
  ['rose', 'roseDiagonal', 'M 297.27,292.73 L 224.44,194.44 L 322.73,267.27 L 310.00,280.00 Z'],
  ['rose', 'rosePoint', 'M 310.00,256.00 L 487.00,280.00 L 310.00,304.00 L 326.00,280.00 Z'],
  ['rose', 'roseLight', 'M 310.00,280.00 L 310.00,256.00 L 487.00,280.00 Z'],
  ['rose', 'rosePoint', 'M 334.00,280.00 L 310.00,457.00 L 286.00,280.00 L 310.00,296.00 Z'],
  ['rose', 'roseLight', 'M 310.00,280.00 L 334.00,280.00 L 310.00,457.00 Z'],
  ['rose', 'rosePoint', 'M 310.00,304.00 L 133.00,280.00 L 310.00,256.00 L 294.00,280.00 Z'],
  ['rose', 'roseLight', 'M 310.00,280.00 L 310.00,304.00 L 133.00,280.00 Z'],
  ['rose', 'rosePoint', 'M 286.00,280.00 L 310.00,103.00 L 334.00,280.00 L 310.00,264.00 Z'],
  ['rose', 'roseLight', 'M 310.00,280.00 L 286.00,280.00 L 310.00,103.00 Z'],
  ['north', 'north', 'M310,28 L297,72 L310,59 L323,72 Z'],
  ['hub', 'hubOuter', circle(310, 280, 33)],
  ['hub', 'hubInner', circle(310, 280, 17)],
  ['rose', 'stud', circle(310, 101, 8.2)],
  ['rose', 'stud', circle(489, 280, 8.2)],
  ['rose', 'stud', circle(131, 280, 8.2)],
  [
    'book',
    'bookCover',
    'M310 508 C265 479 211 463 142 469 L167 441 C222 435 277 459 310 489 C343 459 398 435 453 441 L478 469 C409 463 355 479 310 508 Z',
  ],
  [
    'book',
    'bookPages',
    'M310 511 C263 483 205 481 139 482 C201 491 266 510 310 536 C354 510 419 491 481 482 C415 481 357 483 310 511 Z',
  ],
  ['book', 'bookLines', 'M310 506 C260 467 227 462 173 457 M310 506 C360 467 393 462 447 457'],
  ['book', 'bookSpine', 'M310 491 L310 535'],
  ['book', 'bookClasp', 'M310 539 L299 558 L310 577 L321 558 Z'],
]

function emblemSpecs(): ShapeSpec<EmblemGroup>[] {
  return EMBLEM.map(([group, paint, d]) => ({
    group,
    d,
    ...EMBLEM_PAINT[paint],
    turns: group === 'rose',
  }))
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

type Artwork = {
  readonly emblem: readonly Shape<EmblemGroup>[]
  readonly glyph: readonly Shape<GlyphGroup>[]
}

let artworkCache: Artwork | null = null

function artwork(): Artwork {
  artworkCache ??= { emblem: buildShapes(emblemSpecs()), glyph: buildShapes(glyphSpecs()) }
  return artworkCache
}

const EMBLEM_STAGGER: Readonly<Record<EmblemGroup, number>> = {
  c: 1,
  arcs: 0.8,
  outerTicks: 0.2,
  rings: 0.55,
  ringTicks: 0.22,
  rose: 0.4,
  north: 1,
  hub: 0.7,
  book: 0.45,
}

const GLYPH_TIMING: Readonly<Record<GlyphGroup, readonly [number, number, number]>> = {
  ring: [0, 0.5, 0.6],
  marks: [0.2, 0.6, 0.25],
  cross: [0.35, 0.75, 0.5],
  globe: [0.3, 0.8, 0.45],
  route: [0.65, 1, 0.55],
}

function stagger(progress: number, index: number, count: number, window: number): number {
  if (progress >= 1) return 1
  if (count <= 1 || window >= 1) return progress
  const start = (index / (count - 1)) * (1 - window)
  return clamp01((progress - start) / window)
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

function paintHead(context: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, css(INK.white, 1))
  gradient.addColorStop(0.35, css(INK.beam, 0.85))
  gradient.addColorStop(1, css(INK.beam, 0))
  context.fillStyle = gradient
  context.beginPath()
  context.arc(x, y, radius, 0, TAU)
  context.fill()
}

function strokePart(
  context: CanvasRenderingContext2D,
  outline: Outline,
  amount: number,
): readonly [number, number] | null {
  let remaining = amount
  let headX = 0
  let headY = 0
  let moved = false
  context.beginPath()
  for (const subpath of outline.subpaths) {
    if (remaining <= 0) break
    const { points, marks } = subpath
    context.moveTo(at(points, 0), at(points, 1))
    headX = at(points, 0)
    headY = at(points, 1)
    moved = true
    for (let index = 1; index < marks.length; index += 1) {
      const reach = at(marks, index)
      const x = at(points, index * 2)
      const y = at(points, index * 2 + 1)
      if (reach <= remaining) {
        context.lineTo(x, y)
        headX = x
        headY = y
        continue
      }
      const before = at(marks, index - 1)
      const share = reach > before ? (remaining - before) / (reach - before) : 0
      const px = at(points, index * 2 - 2)
      const py = at(points, index * 2 - 1)
      headX = px + (x - px) * share
      headY = py + (y - py) * share
      context.lineTo(headX, headY)
      break
    }
    remaining -= subpath.length
  }
  context.stroke()
  return moved ? [headX, headY] : null
}

function paintShape<G extends string>(
  context: CanvasRenderingContext2D,
  shape: Shape<G>,
  progress: number,
  ignite: number,
): void {
  const base = context.globalAlpha
  if (shape.fill && ignite > 0) {
    context.globalAlpha = base * shape.opacity * ignite
    context.fillStyle = css(shape.fill)
    context.fill(shape.path)
  }
  if (shape.stroke && progress > 0) {
    context.globalAlpha = base * shape.opacity
    context.strokeStyle = css(mix(INK.beam, shape.stroke, ignite))
    context.lineWidth = shape.width
    context.lineJoin = shape.round ? 'round' : 'miter'
    if (progress >= 1) {
      context.stroke(shape.path)
    } else {
      const head = strokePart(context, shape.outline, progress * shape.outline.length)
      if (head && shape.outline.length > 40) {
        context.globalAlpha = base
        paintHead(context, head[0], head[1], 7 + shape.width)
      }
    }
  }
  context.globalAlpha = base
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

function paintBrand(
  context: CanvasRenderingContext2D,
  metrics: Metrics,
  frame: Frame,
  shapes: readonly Shape<EmblemGroup>[],
): void {
  const { emblem } = frame
  if (emblem.alpha <= 0) return
  const scale = emblemScale(metrics)
  const cx = metrics.width / 2
  const cy = metrics.height / 2
  const hubY = cy - 20 * scale

  context.save()
  context.globalAlpha = emblem.alpha
  if (emblem.halo > 0) {
    const halo = context.createRadialGradient(cx, hubY, 0, cx, hubY, 340 * scale)
    halo.addColorStop(0, css(INK.cyan, 0.22 * emblem.halo))
    halo.addColorStop(0.55, css(INK.cyan, 0.07 * emblem.halo))
    halo.addColorStop(1, css(INK.cyan, 0))
    context.fillStyle = halo
    context.fillRect(cx - 340 * scale, hubY - 340 * scale, 680 * scale, 680 * scale)
  }
  if (emblem.pulse > 0 && emblem.pulse < 1) {
    context.strokeStyle = css(INK.gold, 0.55 * (1 - emblem.pulse))
    context.lineWidth = 3 * scale
    context.beginPath()
    context.arc(cx, hubY, (160 + 300 * easeOut(emblem.pulse)) * scale, 0, TAU)
    context.stroke()
  }

  context.translate(cx, cy)
  context.scale(scale, scale)
  context.translate(-310, -300)
  context.lineCap = 'butt'
  for (const shape of shapes) {
    const progress = stagger(
      emblem.trace[shape.group],
      shape.index,
      shape.count,
      EMBLEM_STAGGER[shape.group],
    )
    if (progress <= 0 && emblem.ignite <= 0) continue
    if (shape.turns && emblem.needle !== 0) {
      context.save()
      context.translate(310, 280)
      context.rotate(emblem.needle)
      context.translate(-310, -280)
      paintShape(context, shape, progress, emblem.ignite)
      context.restore()
    } else {
      paintShape(context, shape, progress, emblem.ignite)
    }
  }
  context.restore()
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

function createPainter(content: Surface, copy: AtlasBootCopy, art: Artwork): Painter {
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
      paintBrand(context, metrics, frame, art.emblem)
      paintApp(context, metrics, frame, copy, art.glyph)
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

type Envelope = { readonly peak: number; readonly attack: number; readonly decay: number }
type Band = {
  readonly type: BiquadFilterType
  readonly from: number
  readonly to: number
  readonly q: number
}
type Mixer = {
  readonly context: BaseAudioContext
  readonly input: GainNode
  readonly noise: AudioBuffer
}

function noiseBuffer(context: BaseAudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
  const data = buffer.getChannelData(0)
  let state = 0x2545f491
  for (let index = 0; index < data.length; index += 1) {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    data[index] = ((state >>> 0) / 4294967296) * 2 - 1
  }
  return buffer
}

function createMixer(context: BaseAudioContext): Mixer {
  const input = context.createGain()
  input.gain.value = 0.8
  const limiter = context.createDynamicsCompressor()
  limiter.threshold.value = -12
  limiter.knee.value = 8
  limiter.ratio.value = 4
  limiter.attack.value = 0.004
  limiter.release.value = 0.18
  input.connect(limiter).connect(context.destination)
  return { context, input, noise: noiseBuffer(context) }
}

function envelope(gain: AudioParam, when: number, shape: Envelope): number {
  const stop = when + shape.attack + shape.decay
  gain.setValueAtTime(0.0001, when)
  gain.exponentialRampToValueAtTime(shape.peak, when + shape.attack)
  gain.exponentialRampToValueAtTime(0.0001, stop)
  return stop
}

function tone(
  mixer: Mixer,
  destination: AudioNode,
  wave: OscillatorType,
  frequencies: readonly [number, number],
  when: number,
  shape: Envelope,
): void {
  const { context } = mixer
  const oscillator = context.createOscillator()
  oscillator.type = wave
  oscillator.frequency.setValueAtTime(frequencies[0], when)
  const gain = context.createGain()
  const stop = envelope(gain.gain, when, shape)
  if (frequencies[1] !== frequencies[0]) {
    oscillator.frequency.exponentialRampToValueAtTime(frequencies[1], stop)
  }
  oscillator.connect(gain).connect(destination)
  oscillator.start(when)
  oscillator.stop(stop + 0.02)
}

function hiss(
  mixer: Mixer,
  destination: AudioNode,
  band: Band,
  when: number,
  shape: Envelope,
): void {
  const { context } = mixer
  const source = context.createBufferSource()
  source.buffer = mixer.noise
  source.loop = true
  const filter = context.createBiquadFilter()
  filter.type = band.type
  filter.Q.value = band.q
  filter.frequency.setValueAtTime(band.from, when)
  const gain = context.createGain()
  const stop = envelope(gain.gain, when, shape)
  if (band.to !== band.from) filter.frequency.exponentialRampToValueAtTime(band.to, stop)
  source.connect(filter).connect(gain).connect(destination)
  source.start(when, (when * 0.37) % 1.9)
  source.stop(stop + 0.02)
}

function lowpass(mixer: Mixer, frequency: number): BiquadFilterNode {
  const filter = mixer.context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = frequency
  filter.connect(mixer.input)
  return filter
}

function degauss(mixer: Mixer, when: number): void {
  const { context } = mixer
  const saw = context.createOscillator()
  saw.type = 'sawtooth'
  saw.frequency.setValueAtTime(58, when)
  saw.frequency.linearRampToValueAtTime(50, when + 0.9)
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 6
  filter.frequency.setValueAtTime(420, when)
  filter.frequency.exponentialRampToValueAtTime(180, when + 0.9)
  const body = context.createGain()
  envelope(body.gain, when, { peak: 0.22, attack: 0.06, decay: 0.85 })
  const tremolo = context.createGain()
  tremolo.gain.value = 0.6
  const wobble = context.createOscillator()
  wobble.frequency.value = 11
  const depth = context.createGain()
  depth.gain.value = 0.4
  wobble.connect(depth).connect(tremolo.gain)
  saw.connect(filter).connect(body).connect(tremolo).connect(mixer.input)
  saw.start(when)
  wobble.start(when)
  saw.stop(when + 0.95)
  wobble.stop(when + 0.95)
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

function staticBurst(mixer: Mixer, when: number): void {
  const gate = mixer.context.createGain()
  const pattern = [1, 0.25, 0.9, 0.1, 0.75, 0.3, 1, 0.15, 0.6] as const
  pattern.forEach((level, index) => {
    gate.gain.setValueAtTime(level, when + index * 0.028)
  })
  gate.connect(mixer.input)
  hiss(mixer, gate, { type: 'bandpass', from: 2200, to: 1600, q: 0.45 }, when, {
    peak: 0.13,
    attack: 0.008,
    decay: 0.24,
  })
}

function playSound(mixer: Mixer, entry: Cue, when: number): void {
  const out = mixer.input
  switch (entry.sound) {
    case 'power':
      tone(mixer, out, 'sine', [140, 42], when, { peak: 0.5, attack: 0.004, decay: 0.45 })
      hiss(mixer, out, { type: 'bandpass', from: 1400, to: 900, q: 0.8 }, when, {
        peak: 0.16,
        attack: 0.003,
        decay: 0.32,
      })
      hiss(mixer, out, { type: 'highpass', from: 4200, to: 4200, q: 0.5 }, when + 0.02, {
        peak: 0.05,
        attack: 0.03,
        decay: 1.1,
      })
      return
    case 'degauss':
      degauss(mixer, when)
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
      tone(mixer, out, 'sine', [220, 440], when, { peak: 0.07, attack: 0.12, decay: 0.55 })
      tone(mixer, out, 'triangle', [330, 330], when, { peak: 0.035, attack: 0.15, decay: 0.7 })
      hiss(mixer, out, { type: 'highpass', from: 6000, to: 6000, q: 0.7 }, when, {
        peak: 0.025,
        attack: 0.05,
        decay: 0.6,
      })
      return
    case 'chime':
      for (const [frequency, delay] of [
        [659.26, 0],
        [987.77, 0.11],
      ] as const) {
        tone(mixer, out, 'sine', [frequency, frequency], when + delay, {
          peak: 0.09,
          attack: 0.005,
          decay: 1.7,
        })
        tone(mixer, out, 'sine', [frequency * 2.01, frequency * 2.01], when + delay, {
          peak: 0.022,
          attack: 0.005,
          decay: 0.9,
        })
      }
      return
    case 'static':
      staticBurst(mixer, when)
      return
    case 'ping':
      tone(mixer, out, 'sine', [783.99, 783.99], when, { peak: 0.08, attack: 0.004, decay: 1.1 })
      tone(mixer, out, 'sine', [1567.98, 1567.98], when, { peak: 0.02, attack: 0.004, decay: 0.5 })
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
  const art = artwork()

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
  const painter = createPainter(content, copy, art)
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
