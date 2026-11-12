import { describe, expect, it } from 'vitest'

import type { Point, Size } from '../../src/lib/art-effect/cover'
import { type Lean, leanedPoint, leanMargin, leanWarp } from '../../src/lib/art-effect/lean'
import { ARMS } from '../../src/lib/art-effect/presets'
import { FULLEST_LEAN } from '../../src/scripts/tilt'

const BOX: Size = { width: 192, height: 223 }
const RATIO = 2

function cell(warp: Float32Array, index: number): number {
  return warp[index] ?? Number.NaN
}

function mapOf(warp: Float32Array, fragment: Point): Point {
  const w = cell(warp, 2) * fragment.x + cell(warp, 5) * fragment.y + cell(warp, 8)
  return {
    x: (cell(warp, 0) * fragment.x + cell(warp, 3) * fragment.y + cell(warp, 6)) / w,
    y: (cell(warp, 1) * fragment.x + cell(warp, 4) * fragment.y + cell(warp, 7)) / w,
  }
}

function canvasOf(box: Size, margin: number): Size {
  return {
    width: (box.width + 2 * margin) * RATIO,
    height: (box.height + 2 * margin) * RATIO,
  }
}

function fragmentOf(screen: Point, box: Size, margin: number): Point {
  const backing = canvasOf(box, margin)
  return {
    x: (screen.x + margin + box.width / 2) * RATIO,
    y: backing.height - (screen.y + margin + box.height / 2) * RATIO,
  }
}

const LEANS: Lean[] = [
  { x: 0, y: 0 },
  { x: FULLEST_LEAN, y: 0 },
  { x: 0, y: -FULLEST_LEAN },
  { x: -0.5, y: 0.3 },
  { x: FULLEST_LEAN, y: FULLEST_LEAN },
]

describe('the arms leaned toward the pointer inside their shader', () => {
  it('draw the flat shield pixel for pixel, as the unleaned canvas did', () => {
    const backing = canvasOf(BOX, 0)
    const warp = leanWarp({ box: BOX, margin: 0, backing, lean: { x: 0, y: 0 } }, ARMS.lean)
    for (const [x, y] of [
      [0, 0],
      [17, 300],
      [backing.width - 1, backing.height - 1],
    ] as const) {
      const map = mapOf(warp, { x: x + 0.5, y: y + 0.5 })
      expect(map.x).toBeCloseTo((x + 0.5) / backing.width, 6)
      expect(map.y).toBeCloseTo((backing.height - y - 0.5) / backing.height, 6)
    }
  })

  it('return every corner of the leaned shield to its corner of the map', () => {
    const margin = leanMargin(BOX, FULLEST_LEAN, ARMS.lean)
    const backing = canvasOf(BOX, margin)
    for (const lean of LEANS) {
      const warp = leanWarp({ box: BOX, margin, backing, lean }, ARMS.lean)
      for (const corner of [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ]) {
        const plane = { x: (corner.x - 0.5) * BOX.width, y: (corner.y - 0.5) * BOX.height }
        const seen = leanedPoint(plane, lean, ARMS.lean)
        const map = mapOf(warp, fragmentOf(seen, BOX, margin))
        expect(map.x).toBeCloseTo(corner.x, 5)
        expect(map.y).toBeCloseTo(corner.y, 5)
      }
    }
  })

  it('sink the side the pointer is on, as the CSS turn of the card does', () => {
    const half = { x: BOX.width / 2, y: BOX.height / 2 }
    const heightAt = (x: number, lean: Lean): number =>
      leanedPoint({ x, y: half.y }, lean, ARMS.lean).y -
      leanedPoint({ x, y: -half.y }, lean, ARMS.lean).y
    const widthAt = (y: number, lean: Lean): number =>
      leanedPoint({ x: half.x, y }, lean, ARMS.lean).x -
      leanedPoint({ x: -half.x, y }, lean, ARMS.lean).x
    const right = { x: FULLEST_LEAN, y: 0 }
    const below = { x: 0, y: FULLEST_LEAN }
    expect(heightAt(half.x, right)).toBeLessThan(heightAt(-half.x, right))
    expect(widthAt(half.y, below)).toBeLessThan(widthAt(-half.y, below))
  })

  it('leave room for every corner of the shield at any lean up to the fullest', () => {
    const margin = leanMargin(BOX, FULLEST_LEAN, ARMS.lean)
    const half = { x: BOX.width / 2, y: BOX.height / 2 }
    for (let step = -10; step <= 10; step++) {
      for (let other = -10; other <= 10; other++) {
        const lean = { x: (step / 10) * FULLEST_LEAN, y: (other / 10) * FULLEST_LEAN }
        for (const corner of [
          { x: -half.x, y: -half.y },
          { x: half.x, y: half.y },
          { x: half.x, y: -half.y },
          { x: -half.x, y: half.y },
        ]) {
          const seen = leanedPoint(corner, lean, ARMS.lean)
          expect(Math.abs(seen.x)).toBeLessThanOrEqual(half.x + margin)
          expect(Math.abs(seen.y)).toBeLessThanOrEqual(half.y + margin)
        }
      }
    }
  })

  it('need no room when they never lean', () => {
    expect(leanMargin(BOX, 0, ARMS.lean)).toBe(0)
  })
})
