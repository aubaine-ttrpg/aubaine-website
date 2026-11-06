import { TAU } from './curves'

export type Subpath = {
  readonly points: Float32Array
  readonly marks: Float32Array
  readonly length: number
}

export type Outline = { readonly subpaths: readonly Subpath[]; readonly length: number }

export function valueAt(values: Float32Array, index: number): number {
  return values[index] ?? 0
}

function measure(coordinates: readonly number[]): Subpath {
  const points = Float32Array.from(coordinates)
  const marks = new Float32Array(points.length / 2)
  let length = 0
  for (let index = 1; index < marks.length; index += 1) {
    length += Math.hypot(
      valueAt(points, index * 2) - valueAt(points, index * 2 - 2),
      valueAt(points, index * 2 + 1) - valueAt(points, index * 2 - 1),
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

export function outlineOf(data: string): Outline {
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
