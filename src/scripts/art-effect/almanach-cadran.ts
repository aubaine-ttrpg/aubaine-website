import type { AlmanachBoot } from '../../lib/art-effect/almanach-look'
import { clamp01, easeOut, ramp } from '../cadran/curves'
import {
  CADRAN_EMBLEM_AT,
  CADRAN_SWITCH_AT,
  COMPLETE_TRACE,
  type EmblemFrame,
  emblemTimeline,
  paintEmblem,
} from '../cadran/emblem'
import { CADRAN_INK, css, hex } from '../cadran/ink'

export type CadranFrame = EmblemFrame & {
  readonly hud: number
  readonly charge: number
}

export const CADRAN_PACE = 3
export const CADRAN_SWITCH_DELAY = CADRAN_SWITCH_AT / CADRAN_PACE
export const CADRAN_CALM_SWITCH_AT = 0.9
export const CADRAN_FAST_OPEN = 0.08
export const CADRAN_FAST_SWITCH = 0.28
export const CADRAN_CALM_FAST_SWITCH = 0.3
export const CADRAN_CALM_ORIGINAL_SWITCH = 1.25

export type CadranBattery = {
  readonly level: number
  readonly charging: boolean
}

const OPENED = 0.85
const TRACED = CADRAN_EMBLEM_AT + 1.45
const SETTLED = CADRAN_SWITCH_AT + 0.6

const INK = {
  ...CADRAN_INK,
  ember: hex('#ff7a5c'),
} as const

export function cadranTime(since: number, boot: AlmanachBoot = 'quick'): number {
  if (boot === 'instant') return SETTLED + since
  if (boot === 'original') return since
  if (boot === 'fast') {
    if (since < CADRAN_FAST_OPEN) return 0.28 + (OPENED - 0.28) * (since / CADRAN_FAST_OPEN)
    if (since < CADRAN_FAST_SWITCH)
      return (
        TRACED +
        (CADRAN_SWITCH_AT - TRACED) *
          ((since - CADRAN_FAST_OPEN) / (CADRAN_FAST_SWITCH - CADRAN_FAST_OPEN))
      )
    return since - CADRAN_FAST_SWITCH + CADRAN_SWITCH_AT
  }
  return since < CADRAN_SWITCH_DELAY
    ? since * CADRAN_PACE
    : since - CADRAN_SWITCH_DELAY + CADRAN_SWITCH_AT
}

export function cadranSwitchDelay(boot: AlmanachBoot, calm: boolean): number {
  if (boot === 'instant') return 0
  if (calm) {
    if (boot === 'fast') return CADRAN_CALM_FAST_SWITCH
    return boot === 'original' ? CADRAN_CALM_ORIGINAL_SWITCH : CADRAN_CALM_SWITCH_AT
  }
  if (boot === 'fast') return CADRAN_FAST_SWITCH
  return boot === 'original' ? CADRAN_SWITCH_AT : CADRAN_SWITCH_DELAY
}

export function cadranFrame(
  since: number,
  calm: boolean,
  boot: AlmanachBoot = 'quick',
): CadranFrame {
  if (calm) {
    const at = cadranSwitchDelay(boot, true)
    const pace = at / CADRAN_CALM_SWITCH_AT
    return {
      hud: boot === 'instant' ? 0 : easeOut(ramp(since, 0, 0.3 * pace)),
      alpha:
        boot === 'instant'
          ? 0
          : ramp(since, 0.05 * pace, 0.35 * pace) * (1 - ramp(since, 0.7 * pace, at)),
      charge: easeOut(ramp(since, 0.05 * pace, 0.55 * pace)),
      trace: COMPLETE_TRACE,
      ignite: 1,
      needle: 0,
      halo: 1,
      pulse: 0,
    }
  }
  const t = cadranTime(since, boot)
  const brandOut = ramp(t, CADRAN_SWITCH_AT + 0.08, CADRAN_SWITCH_AT + 0.22)
  return {
    hud: easeOut(ramp(t, 0.9, 1.3)),
    alpha: t >= CADRAN_EMBLEM_AT ? 1 - brandOut : 0,
    charge:
      boot === 'fast'
        ? easeOut(ramp(since, CADRAN_FAST_OPEN, CADRAN_FAST_SWITCH - 0.04))
        : ramp(t, 1, 2),
    ...emblemTimeline(t),
  }
}

function paintHud(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: CadranFrame,
  battery: CadranBattery | undefined,
): void {
  const reveal = frame.hud
  if (reveal <= 0) return
  const unit = height / 290
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
  if (battery) paintBattery(context, width, inset, unit, reveal, frame.charge, battery)
  context.restore()
}

const BARS = 6

function paintBattery(
  context: CanvasRenderingContext2D,
  width: number,
  inset: number,
  unit: number,
  reveal: number,
  charge: number,
  battery: CadranBattery,
): void {
  const level = clamp01(battery.level)
  const barWidth = 6 * unit
  const barGap = 3 * unit
  const barHeight = 13 * unit
  const pad = 3 * unit
  const right = width - inset - 18 * unit - 4 * unit
  const left = right - BARS * barWidth - (BARS - 1) * barGap
  const top = inset + 30 * unit - 12 * unit
  const lit = Math.min(BARS, Math.ceil(level * charge * BARS - 1e-6))
  const low = level <= 0.2
  context.globalAlpha = reveal
  context.lineWidth = Math.max(1, 1.2 * unit)
  context.strokeStyle = css(INK.cyan, 0.5)
  context.strokeRect(left - pad, top - pad, right - left + 2 * pad, barHeight + 2 * pad)
  context.fillStyle = css(INK.cyan, 0.5)
  context.fillRect(right + pad + unit, top + barHeight / 2 - 3.5 * unit, 2.5 * unit, 7 * unit)
  for (let index = 0; index < BARS; index += 1) {
    const on = index < lit
    const ink = low ? INK.ember : on && index >= BARS - 2 ? INK.gold : INK.cyan
    context.fillStyle = css(ink, on ? 0.9 : 0.16)
    context.fillRect(left + index * (barWidth + barGap), top, barWidth, barHeight)
  }
  if (battery.charging) {
    const x = left - pad - 13 * unit
    const y = top + barHeight / 2
    context.fillStyle = css(INK.gold, 0.9)
    context.beginPath()
    context.moveTo(x + 3 * unit, y - 8 * unit)
    context.lineTo(x - 3 * unit, y + 1 * unit)
    context.lineTo(x + 0.5 * unit, y + 1 * unit)
    context.lineTo(x - 1.5 * unit, y + 8 * unit)
    context.lineTo(x + 5 * unit, y - 1.5 * unit)
    context.lineTo(x + 1.5 * unit, y - 1.5 * unit)
    context.closePath()
    context.fill()
  }
}

export function paintCadran(
  context: CanvasRenderingContext2D,
  frame: CadranFrame,
  battery?: CadranBattery,
): void {
  const { width, height } = context.canvas
  context.setTransform(1, 0, 0, 1, 0, 0)
  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  context.clearRect(0, 0, width, height)
  paintHud(context, width, height, frame, battery)
  const scale = Math.min((height * 0.62) / 600, (width * 0.46) / 620)
  paintEmblem(context, { cx: width / 2, cy: height / 2, scale, thinnest: 1 / scale }, frame)
}
