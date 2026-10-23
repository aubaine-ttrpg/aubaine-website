export type Bounds = { left: number; top: number; right: number; bottom: number }

type Point = { x: number; y: number }

export const EMBLEM_MARGIN = 0.04

const DECIMALS = 1000
const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi
const COMMAND = /[MLHVCSQTAZ][^MLHVCSQTAZ]*/gi
const PATH = /<path\b([^>]*?)\/?>/g
const ATTRIBUTE = (name: string): RegExp => new RegExp(`\\s${name}="([^"]*)"`)
const FORBIDDEN = /<(?:g|use|circle|ellipse|rect|polygon|polyline|line|text|image)\b|\stransform="/
const ARGUMENTS: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, q: 4, z: 0 }

const round = (value: number): number => Math.round(value * DECIMALS) / DECIMALS

function grow(bounds: Bounds, { x, y }: Point): Bounds {
  return {
    left: Math.min(bounds.left, x),
    top: Math.min(bounds.top, y),
    right: Math.max(bounds.right, x),
    bottom: Math.max(bounds.bottom, y),
  }
}

function turningPoints(from: number, first: number, second: number, to: number): number[] {
  const a = -from + 3 * first - 3 * second + to
  const b = 2 * (from - 2 * first + second)
  const c = first - from
  if (Math.abs(a) < 1e-12) return Math.abs(b) < 1e-12 ? [] : [-c / b]
  const discriminant = b * b - 4 * a * c
  if (discriminant < 0) return []
  const root = Math.sqrt(discriminant)
  return [(-b + root) / (2 * a), (-b - root) / (2 * a)]
}

function cubicAt(from: number, first: number, second: number, to: number, t: number): number {
  const u = 1 - t
  return u * u * u * from + 3 * u * u * t * first + 3 * u * t * t * second + t * t * t * to
}

function cubicBounds(bounds: Bounds, points: [Point, Point, Point, Point]): Bounds {
  const [p0, p1, p2, p3] = points
  let next = grow(grow(bounds, p0), p3)
  const times = [
    ...turningPoints(p0.x, p1.x, p2.x, p3.x),
    ...turningPoints(p0.y, p1.y, p2.y, p3.y),
  ].filter((t) => t > 0 && t < 1)
  for (const t of times) {
    next = grow(next, {
      x: cubicAt(p0.x, p1.x, p2.x, p3.x, t),
      y: cubicAt(p0.y, p1.y, p2.y, p3.y, t),
    })
  }
  return next
}

export function pathBounds(d: string): Bounds {
  let bounds: Bounds = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
  let at: Point = { x: 0, y: 0 }
  let start: Point = { x: 0, y: 0 }
  for (const [segment] of d.matchAll(COMMAND)) {
    const letter = segment.charAt(0)
    const kind = letter.toLowerCase()
    const relative = letter !== letter.toUpperCase()
    const size = ARGUMENTS[kind]
    if (size === undefined) throw new Error(`an emblem path may not use the ${letter} command`)
    const values = [...segment.slice(1).matchAll(NUMBER)].map(([value]) => Number(value))
    if (size === 0) {
      at = start
      continue
    }
    if (values.length === 0 || values.length % size !== 0) {
      throw new Error(`an emblem path has a ${letter} command with ${values.length} numbers`)
    }
    for (let index = 0; index < values.length; index += size) {
      const group = values.slice(index, index + size)
      const origin = relative ? at : { x: 0, y: 0 }
      const point = (x: number, y: number): Point => ({ x: origin.x + x, y: origin.y + y })
      const [a = 0, b = 0, c = 0, e = 0, f = 0, g = 0] = group
      if (kind === 'h') at = { x: (relative ? at.x : 0) + a, y: at.y }
      else if (kind === 'v') at = { x: at.x, y: (relative ? at.y : 0) + a }
      else if (kind === 'c') {
        const end = point(f, g)
        bounds = cubicBounds(bounds, [at, point(a, b), point(c, e), end])
        at = end
      } else if (kind === 'q') {
        const control = point(a, b)
        const end = point(c, e)
        const first = {
          x: at.x + (2 / 3) * (control.x - at.x),
          y: at.y + (2 / 3) * (control.y - at.y),
        }
        const second = {
          x: end.x + (2 / 3) * (control.x - end.x),
          y: end.y + (2 / 3) * (control.y - end.y),
        }
        bounds = cubicBounds(bounds, [at, first, second, end])
        at = end
      } else {
        at = point(a, b)
        if (kind === 'm' && index === 0) start = at
      }
      bounds = grow(bounds, at)
    }
  }
  if (!Number.isFinite(bounds.left)) throw new Error('an emblem path draws nothing')
  return bounds
}

export function frameEmblem(source: string): string {
  if (FORBIDDEN.test(source)) {
    throw new Error('an emblem is plain paths only: no group, shape, text, image or transform')
  }
  const paths = [...source.matchAll(PATH)].map(([, attributes = '']) => {
    const d = ATTRIBUTE('d').exec(attributes)?.[1]
    if (!d) throw new Error('an emblem path has no d attribute')
    const rule = ATTRIBUTE('fill-rule').exec(attributes)?.[1]
    return { d, rule }
  })
  if (paths.length === 0) throw new Error('an emblem holds no path')
  const bounds = paths
    .map(({ d }) => pathBounds(d))
    .reduce((all, one) =>
      grow(grow(all, { x: one.left, y: one.top }), { x: one.right, y: one.bottom }),
    )
  const width = bounds.right - bounds.left
  const height = bounds.bottom - bounds.top
  const side = Math.max(width, height) / (1 - 2 * EMBLEM_MARGIN)
  const left = bounds.left + width / 2 - side / 2
  const top = bounds.top + height / 2 - side / 2
  const box = [left, top, side, side].map(round).join(' ')
  const drawn = paths
    .map(({ d, rule }) => `<path fill="#ffffff"${rule ? ` fill-rule="${rule}"` : ''} d="${d}"/>`)
    .join('\n')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}">\n${drawn}\n</svg>\n`
}
