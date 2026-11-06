import { clamp01, TAU } from './curves'
import { CADRAN_INK, css, hex, mix, type Rgb } from './ink'
import { type Outline, outlineOf, valueAt } from './outline'

export type ShapeSpec<G extends string> = {
  readonly group: G
  readonly d: string
  readonly fill: string | null
  readonly stroke: string | null
  readonly width: number
  readonly opacity: number
  readonly round: boolean
  readonly turns: boolean
}

export type Shape<G extends string> = {
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

export function circle(cx: number, cy: number, r: number): string {
  return `M ${cx},${cy - r} A ${r},${r} 0 1 1 ${cx},${cy + r} A ${r},${r} 0 1 1 ${cx},${cy - r}`
}

export function buildShapes<G extends string>(specs: readonly ShapeSpec<G>[]): Shape<G>[] {
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

export function stagger(progress: number, index: number, count: number, window: number): number {
  if (progress >= 1) return 1
  if (count <= 1 || window >= 1) return progress
  const start = (index / (count - 1)) * (1 - window)
  return clamp01((progress - start) / window)
}

function paintHead(context: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
  gradient.addColorStop(0, css(CADRAN_INK.white, 1))
  gradient.addColorStop(0.35, css(CADRAN_INK.beam, 0.85))
  gradient.addColorStop(1, css(CADRAN_INK.beam, 0))
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
    context.moveTo(valueAt(points, 0), valueAt(points, 1))
    headX = valueAt(points, 0)
    headY = valueAt(points, 1)
    moved = true
    for (let index = 1; index < marks.length; index += 1) {
      const reach = valueAt(marks, index)
      const x = valueAt(points, index * 2)
      const y = valueAt(points, index * 2 + 1)
      if (reach <= remaining) {
        context.lineTo(x, y)
        headX = x
        headY = y
        continue
      }
      const before = valueAt(marks, index - 1)
      const share = reach > before ? (remaining - before) / (reach - before) : 0
      const px = valueAt(points, index * 2 - 2)
      const py = valueAt(points, index * 2 - 1)
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

export function paintShape<G extends string>(
  context: CanvasRenderingContext2D,
  shape: Shape<G>,
  progress: number,
  ignite: number,
  thinnest = 0,
): void {
  const base = context.globalAlpha
  if (shape.fill && ignite > 0) {
    context.globalAlpha = base * shape.opacity * ignite
    context.fillStyle = css(shape.fill)
    context.fill(shape.path)
  }
  if (shape.stroke && progress > 0) {
    context.globalAlpha = base * shape.opacity
    context.strokeStyle = css(mix(CADRAN_INK.beam, shape.stroke, ignite))
    context.lineWidth = Math.max(shape.width, thinnest)
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
