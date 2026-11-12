import type { Point, Size } from './cover'

export type Lean = Point

export type LeanOptics = { degrees: number; perspective: number }

export type Warping = { box: Size; margin: number; backing: Size; lean: Lean }

type Matrix = readonly [number, number, number, number, number, number, number, number, number]

const RADIANS_PER_DEGREE = Math.PI / 180

function planeToScreen(lean: Lean, { degrees, perspective }: LeanOptics): Matrix {
  const turn = lean.x * degrees * RADIANS_PER_DEGREE
  const tip = -lean.y * degrees * RADIANS_PER_DEGREE
  const across = { x: Math.cos(turn), y: 0, z: -Math.sin(turn) }
  const down = {
    x: Math.sin(turn) * Math.sin(tip),
    y: Math.cos(tip),
    z: Math.cos(turn) * Math.sin(tip),
  }
  return [
    across.x,
    down.x,
    0,
    across.y,
    down.y,
    0,
    -across.z / perspective,
    -down.z / perspective,
    1,
  ]
}

function multiply(a: Matrix, b: Matrix): Matrix {
  const at = (m: Matrix, row: number, column: number): number => m[row * 3 + column] ?? 0
  const cell = (row: number, column: number): number =>
    at(a, row, 0) * at(b, 0, column) +
    at(a, row, 1) * at(b, 1, column) +
    at(a, row, 2) * at(b, 2, column)
  return [
    cell(0, 0),
    cell(0, 1),
    cell(0, 2),
    cell(1, 0),
    cell(1, 1),
    cell(1, 2),
    cell(2, 0),
    cell(2, 1),
    cell(2, 2),
  ]
}

function inverse([a, b, c, d, e, f, g, h, i]: Matrix): Matrix {
  const determinant = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g)
  if (Math.abs(determinant) < 1e-12) throw new Error('a leaned plane cannot be seen edge on')
  return [
    (e * i - f * h) / determinant,
    (c * h - b * i) / determinant,
    (b * f - c * e) / determinant,
    (f * g - d * i) / determinant,
    (a * i - c * g) / determinant,
    (c * d - a * f) / determinant,
    (d * h - e * g) / determinant,
    (b * g - a * h) / determinant,
    (a * e - b * d) / determinant,
  ]
}

export function leanedPoint(point: Point, lean: Lean, optics: LeanOptics): Point {
  const [a, b, c, d, e, f, g, h, i] = planeToScreen(lean, optics)
  const w = g * point.x + h * point.y + i
  return { x: (a * point.x + b * point.y + c) / w, y: (d * point.x + e * point.y + f) / w }
}

export function leanMargin(box: Size, fullest: number, optics: LeanOptics): number {
  const half = { x: box.width / 2, y: box.height / 2 }
  let reach = 0
  for (const x of [-fullest, fullest]) {
    for (const y of [-fullest, fullest]) {
      for (const corner of [
        { x: -half.x, y: -half.y },
        { x: half.x, y: -half.y },
        { x: -half.x, y: half.y },
        { x: half.x, y: half.y },
      ]) {
        const seen = leanedPoint(corner, { x, y }, optics)
        reach = Math.max(reach, Math.abs(seen.x) - half.x, Math.abs(seen.y) - half.y)
      }
    }
  }
  return Math.ceil(reach)
}

export function leanWarp(
  { box, margin, backing, lean }: Warping,
  optics: LeanOptics,
): Float32Array {
  const density = {
    x: backing.width / (box.width + 2 * margin),
    y: backing.height / (box.height + 2 * margin),
  }
  const canvasToScreen: Matrix = [
    1 / density.x,
    0,
    -(margin + box.width / 2),
    0,
    -1 / density.y,
    backing.height / density.y - (margin + box.height / 2),
    0,
    0,
    1,
  ]
  const planeToMap: Matrix = [1 / box.width, 0, 0.5, 0, 1 / box.height, 0.5, 0, 0, 1]
  const [a, b, c, d, e, f, g, h, i] = multiply(
    planeToMap,
    multiply(inverse(planeToScreen(lean, optics)), canvasToScreen),
  )
  return Float32Array.of(a, d, g, b, e, h, c, f, i)
}
