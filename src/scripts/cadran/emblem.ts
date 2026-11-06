import { easeInOut, easeOut, ramp, TAU } from './curves'
import { CADRAN_INK, css } from './ink'
import { buildShapes, circle, paintShape, type Shape, stagger } from './shapes'

export type EmblemGroup =
  | 'c'
  | 'arcs'
  | 'outerTicks'
  | 'rings'
  | 'ringTicks'
  | 'rose'
  | 'north'
  | 'hub'
  | 'book'

export type EmblemTrace = Readonly<Record<EmblemGroup, number>>

export type EmblemTimeline = {
  readonly trace: EmblemTrace
  readonly ignite: number
  readonly needle: number
  readonly halo: number
  readonly pulse: number
}

export type EmblemFrame = EmblemTimeline & { readonly alpha: number }

export type EmblemPlacement = {
  readonly cx: number
  readonly cy: number
  readonly scale: number
  readonly thinnest: number
}

export const CADRAN_EMBLEM_AT = 0.9
export const CADRAN_SWITCH_AT = CADRAN_EMBLEM_AT + 2.05

export const COMPLETE_TRACE: EmblemTrace = {
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

function needleAngle(elapsed: number): number {
  if (elapsed < 0) return -0.56
  return -0.56 * Math.exp(-3.2 * elapsed) * Math.cos(9 * elapsed)
}

export function emblemTimeline(time: number): EmblemTimeline {
  const emblem = (from: number, to: number): number =>
    ramp(time, CADRAN_EMBLEM_AT + from, CADRAN_EMBLEM_AT + to)
  return {
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
    needle: needleAngle(time - CADRAN_EMBLEM_AT - 0.7),
    halo: emblem(1.35, 1.9),
    pulse: emblem(1.4, 2.25),
  }
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

const EMBLEM_STAGGER: EmblemTrace = {
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

let shapesCache: readonly Shape<EmblemGroup>[] | undefined

function emblemShapes(): readonly Shape<EmblemGroup>[] {
  shapesCache ??= buildShapes(
    EMBLEM.map(([group, paint, d]) => ({
      group,
      d,
      ...EMBLEM_PAINT[paint],
      turns: group === 'rose',
    })),
  )
  return shapesCache
}

export function paintEmblem(
  context: CanvasRenderingContext2D,
  placement: EmblemPlacement,
  frame: EmblemFrame,
): void {
  if (frame.alpha <= 0) return
  const { cx, cy, scale, thinnest } = placement
  const hubY = cy - 20 * scale

  context.save()
  context.globalAlpha = frame.alpha
  if (frame.halo > 0) {
    const halo = context.createRadialGradient(cx, hubY, 0, cx, hubY, 340 * scale)
    halo.addColorStop(0, css(CADRAN_INK.cyan, 0.22 * frame.halo))
    halo.addColorStop(0.55, css(CADRAN_INK.cyan, 0.07 * frame.halo))
    halo.addColorStop(1, css(CADRAN_INK.cyan, 0))
    context.fillStyle = halo
    context.fillRect(cx - 340 * scale, hubY - 340 * scale, 680 * scale, 680 * scale)
  }
  if (frame.pulse > 0 && frame.pulse < 1) {
    context.strokeStyle = css(CADRAN_INK.gold, 0.55 * (1 - frame.pulse))
    context.lineWidth = 3 * scale
    context.beginPath()
    context.arc(cx, hubY, (160 + 300 * easeOut(frame.pulse)) * scale, 0, TAU)
    context.stroke()
  }

  context.translate(cx, cy)
  context.scale(scale, scale)
  context.translate(-310, -300)
  context.lineCap = 'butt'
  for (const shape of emblemShapes()) {
    const progress = stagger(
      frame.trace[shape.group],
      shape.index,
      shape.count,
      EMBLEM_STAGGER[shape.group],
    )
    if (progress <= 0 && frame.ignite <= 0) continue
    if (shape.turns && frame.needle !== 0) {
      context.save()
      context.translate(310, 280)
      context.rotate(frame.needle)
      context.translate(-310, -280)
      paintShape(context, shape, progress, frame.ignite, thinnest)
      context.restore()
    } else {
      paintShape(context, shape, progress, frame.ignite, thinnest)
    }
  }
  context.restore()
}
