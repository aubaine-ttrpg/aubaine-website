import { describe, expect, it } from 'vitest'

import {
  advance,
  blow,
  brisk,
  type Cloth,
  grab,
  letGo,
  MOST_STEPS,
  nudge,
  project,
  pull,
  settle,
  settled,
  weave,
} from '../../src/lib/art-effect/cloth'
import { gridIndex } from '../../src/lib/art-effect/mesh'
import { BANNER_CLOTH } from '../../src/lib/art-effect/presets'

const FRAME = 1 / 60
const STILL_BUDGET_SECONDS = 5

function pointAt(cloth: Cloth, index: number): { x: number; y: number; z: number } {
  return {
    x: cloth.position[index * 3] ?? Number.NaN,
    y: cloth.position[index * 3 + 1] ?? Number.NaN,
    z: cloth.position[index * 3 + 2] ?? Number.NaN,
  }
}

function pins(cloth: Cloth): number[] {
  return [...cloth.inverseMass.keys()].filter((index) => cloth.inverseMass[index] === 0)
}

function run(cloth: Cloth, seconds: number, each?: () => void): void {
  for (let elapsed = 0; elapsed < seconds; elapsed += FRAME) {
    advance(cloth, FRAME)
    each?.()
  }
}

function secondsToRest(cloth: Cloth, limit: number): number {
  let elapsed = 0
  while (!settled(cloth) && elapsed < limit) {
    advance(cloth, FRAME)
    elapsed += FRAME
  }
  return elapsed
}

function insideTheBox(cloth: Cloth): boolean {
  const { spec } = cloth
  for (let index = 0; index < cloth.count; index++) {
    const shown = project(spec, pointAt(cloth, index))
    if (!(shown.x >= 0 && shown.x <= spec.aspect && shown.y >= 0 && shown.y <= 1)) return false
  }
  return true
}

function worstStretch(cloth: Cloth): number {
  const { a, b, rest, stiffness } = cloth.links
  let worst = 0
  for (let link = 0; link < a.length; link++) {
    if (stiffness[link] !== cloth.spec.stiffness.stretch) continue
    const from = pointAt(cloth, a[link] ?? 0)
    const to = pointAt(cloth, b[link] ?? 0)
    const length = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z)
    worst = Math.max(worst, length / (rest[link] ?? 1) - 1)
  }
  return worst
}

function bottomMiddle(cloth: Cloth): number {
  const { columns, rows } = cloth.spec
  return gridIndex(cloth.spec, Math.floor(columns / 2), rows - 1)
}

function shownAt(cloth: Cloth, index: number): { x: number; y: number } {
  return project(cloth.spec, pointAt(cloth, index))
}

describe('a banner', () => {
  it('keeps its rod row where it was hung, whatever pulls it', () => {
    const banner = weave(BANNER_CLOTH)
    const hung = pins(banner).map((index) => pointAt(banner, index))
    const held = bottomMiddle(banner)
    grab(banner, shownAt(banner, held), 0.1)
    run(banner, 1, () => pull(banner, { x: 10, y: -10 }))
    letGo(banner)
    run(banner, 1)
    expect(pins(banner).map((index) => pointAt(banner, index))).toEqual(hung)
  })

  it('comes to rest within five seconds of arriving, and of a hard fling', () => {
    const arrived = weave(BANNER_CLOTH)
    const rows = arrived.spec.rows
    nudge(arrived, (_, row) => ({
      x: 0.12 * (row / (rows - 1)),
      y: 0,
      z: 0.55 * (row / (rows - 1)),
    }))
    expect(secondsToRest(arrived, 10)).toBeLessThan(STILL_BUDGET_SECONDS)

    const flung = weave(BANNER_CLOTH)
    const held = bottomMiddle(flung)
    const start = shownAt(flung, held)
    grab(flung, start, 0.1)
    run(flung, 0.3, () => pull(flung, { x: start.x + 1, y: start.y - 1 }))
    letGo(flung)
    expect(secondsToRest(flung, 10)).toBeLessThan(STILL_BUDGET_SECONDS)
  })

  it('never leaves its box and barely stretches, even pulled far outside it', () => {
    const banner = weave(BANNER_CLOTH)
    grab(banner, shownAt(banner, bottomMiddle(banner)), 0.1)
    let worst = 0
    run(banner, 2, () => {
      pull(banner, { x: 1000, y: -1000 })
      worst = Math.max(worst, worstStretch(banner))
      expect(insideTheBox(banner)).toBe(true)
    })
    expect(worst).toBeLessThan(0.1)
  })

  it('takes the nearest free point under the pointer, never a pinned one, and nothing out of reach', () => {
    const banner = weave(BANNER_CLOTH)
    const target = bottomMiddle(banner)
    const at = shownAt(banner, target)
    expect(grab(banner, { x: at.x + 0.001, y: at.y }, 0.05)).toBe(target)
    letGo(banner)
    const rod = shownAt(banner, gridIndex(banner.spec, 3, 0))
    const taken = grab(banner, rod, 0.02)
    expect(taken === undefined || banner.inverseMass[taken] !== 0).toBe(true)
    letGo(banner)
    expect(grab(banner, { x: -5, y: -5 }, 0.05)).toBeUndefined()
    expect(banner.held).toBeUndefined()
  })

  it('drags its neighbours along and keeps moving once let go', () => {
    const banner = weave(BANNER_CLOTH)
    const held = bottomMiddle(banner)
    const neighbour = held - 1
    const before = shownAt(banner, neighbour)
    const start = shownAt(banner, held)
    grab(banner, start, 0.1)
    run(banner, 0.4, () => pull(banner, { x: start.x + 0.2, y: start.y }))
    expect(shownAt(banner, neighbour).x).toBeGreaterThan(before.x + 0.05)
    letGo(banner)
    advance(banner, FRAME)
    expect(settled(banner)).toBe(false)
    expect(banner.restless).toBeGreaterThan(0)
  })

  it('hangs still and facing the reader when nothing touches it', () => {
    const banner = weave(BANNER_CLOTH)
    expect(secondsToRest(banner, 10)).toBeLessThan(STILL_BUDGET_SECONDS)
    const { triangles } = banner
    for (let corner = 0; corner + 2 < triangles.length; corner += 3) {
      const a = pointAt(banner, triangles[corner] ?? 0)
      const b = pointAt(banner, triangles[corner + 1] ?? 0)
      const c = pointAt(banner, triangles[corner + 2] ?? 0)
      const across = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }
      const down = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z }
      const normal = {
        x: across.y * down.z - across.z * down.y,
        y: across.z * down.x - across.x * down.z,
        z: across.x * down.y - across.y * down.x,
      }
      expect(Math.abs(normal.z) / Math.hypot(normal.x, normal.y, normal.z)).toBeGreaterThan(0.8)
    }
    for (let index = 0; index < banner.count; index++) {
      expect(Math.abs(pointAt(banner, index).z)).toBeLessThan(banner.spec.depth)
    }
  })

  it('settles in place for a still frame, within the time it is given', () => {
    const banner = weave(BANNER_CLOTH)
    settle(banner, STILL_BUDGET_SECONDS)
    expect(settled(banner)).toBe(true)
    expect(banner.seconds).toBeLessThan(STILL_BUDGET_SECONDS)
    const hurried = weave(BANNER_CLOTH)
    settle(hurried, 0.1)
    expect(hurried.seconds).toBeLessThanOrEqual(0.1)
  })

  it('keeps every value finite after a hard fling', () => {
    const banner = weave(BANNER_CLOTH)
    const start = shownAt(banner, bottomMiddle(banner))
    grab(banner, start, 0.1)
    run(banner, 0.5, () => pull(banner, { x: start.x - 3, y: start.y + 3 }))
    letGo(banner)
    run(banner, 3)
    expect([...banner.position].every(Number.isFinite)).toBe(true)
  })
})

function frames(cloth: Cloth, count: number, each?: () => void): void {
  for (let frame = 0; frame < count; frame++) {
    advance(cloth, FRAME)
    each?.()
  }
}

function speedOf(cloth: Cloth): number {
  return cloth.restless * cloth.spec.stepsPerSecond
}

function facingLeast(cloth: Cloth): number {
  const { triangles } = cloth
  let least = 1
  for (let corner = 0; corner + 2 < triangles.length; corner += 3) {
    const a = pointAt(cloth, triangles[corner] ?? 0)
    const b = pointAt(cloth, triangles[corner + 1] ?? 0)
    const c = pointAt(cloth, triangles[corner + 2] ?? 0)
    const across = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }
    const down = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z }
    const normal = {
      x: across.y * down.z - across.z * down.y,
      y: across.z * down.x - across.x * down.z,
      z: across.x * down.y - across.y * down.x,
    }
    least = Math.min(least, Math.abs(normal.z) / Math.hypot(normal.x, normal.y, normal.z))
  }
  return least
}

function inTheWind(): Cloth {
  const banner = weave(BANNER_CLOTH)
  settle(banner, STILL_BUDGET_SECONDS)
  blow(banner, true)
  run(banner, BANNER_CLOTH.wind.rise * 2)
  return banner
}

describe('a banner in the wind', () => {
  it('keeps moving and never comes to rest while the wind blows', () => {
    const banner = inTheWind()
    const hem = bottomMiddle(banner)
    const shown = { low: Number.POSITIVE_INFINITY, high: Number.NEGATIVE_INFINITY }
    const depth = { low: Number.POSITIVE_INFINITY, high: Number.NEGATIVE_INFINITY }
    let turns = 0
    let heading = 0
    let previous = pointAt(banner, hem).z
    run(banner, 20, () => {
      expect(settled(banner)).toBe(false)
      const here = pointAt(banner, hem)
      const seen = shownAt(banner, hem)
      shown.low = Math.min(shown.low, seen.x)
      shown.high = Math.max(shown.high, seen.x)
      depth.low = Math.min(depth.low, here.z)
      depth.high = Math.max(depth.high, here.z)
      const direction = Math.sign(here.z - previous)
      if (direction !== 0 && heading !== 0 && direction !== heading) turns += 1
      if (direction !== 0) heading = direction
      previous = here.z
    })
    expect(turns).toBeGreaterThanOrEqual(4)
    expect(shown.high - shown.low).toBeGreaterThan(0.01)
    expect(depth.high - depth.low).toBeGreaterThan(banner.spec.depth / 20)
  })

  it('moves only slightly: inside its box, facing the reader, its hem swaying a few hundredths', () => {
    const banner = inTheWind()
    const hem = bottomMiddle(banner)
    const rest = shownAt(weave(BANNER_CLOTH), hem).x
    let worst = 0
    let sway = 0
    let deepest = 0
    let least = 1
    run(banner, 30, () => {
      expect(insideTheBox(banner)).toBe(true)
      worst = Math.max(worst, worstStretch(banner))
      sway = Math.max(sway, Math.abs(shownAt(banner, hem).x - rest))
      least = Math.min(least, facingLeast(banner))
      for (let index = 0; index < banner.count; index++) {
        deepest = Math.max(deepest, Math.abs(pointAt(banner, index).z))
      }
    })
    expect(worst).toBeLessThan(0.05)
    expect(sway).toBeLessThan(0.05)
    expect(deepest).toBeLessThan(banner.spec.depth / 2)
    expect(least).toBeGreaterThan(0.8)
  })

  it('blows the same way every time, and a pause resumes where it stopped', () => {
    const straight = weave(BANNER_CLOTH)
    const paused = weave(BANNER_CLOTH)
    blow(straight, true)
    blow(paused, true)
    frames(straight, 360)
    frames(paused, 180)
    advance(paused, 0)
    frames(paused, 180)
    expect([...paused.position]).toEqual([...straight.position])
  })

  it('gathers the wind gradually, and rests within five seconds once it drops', () => {
    const banner = weave(BANNER_CLOTH)
    settle(banner, STILL_BUDGET_SECONDS)
    blow(banner, true)
    let early = 0
    run(banner, 0.25, () => {
      early = Math.max(early, speedOf(banner))
    })
    let steady = 0
    run(banner, BANNER_CLOTH.wind.rise * 2)
    run(banner, 10, () => {
      steady = Math.max(steady, speedOf(banner))
    })
    expect(early).toBeLessThan(steady / 2)
    blow(banner, false)
    expect(secondsToRest(banner, 10)).toBeLessThan(STILL_BUDGET_SECONDS)
  })

  it('rests within five seconds of a fling once the wind has stopped', () => {
    const banner = inTheWind()
    blow(banner, false)
    const start = shownAt(banner, bottomMiddle(banner))
    grab(banner, start, 0.1)
    run(banner, 0.3, () => pull(banner, { x: start.x + 1, y: start.y - 1 }))
    letGo(banner)
    expect(secondsToRest(banner, 10)).toBeLessThan(STILL_BUDGET_SECONDS)
  })

  it('is brisk while held or flung, never in the breeze alone', () => {
    const banner = inTheWind()
    run(banner, 30, () => expect(brisk(banner)).toBe(false))
    const start = shownAt(banner, bottomMiddle(banner))
    grab(banner, start, 0.1)
    expect(brisk(banner)).toBe(true)
    run(banner, 0.3, () => pull(banner, { x: start.x + 1, y: start.y - 1 }))
    letGo(banner)
    advance(banner, FRAME)
    expect(brisk(banner)).toBe(true)
  })

  it('cannot settle for a still frame while the wind blows', () => {
    const banner = inTheWind()
    const before = banner.seconds
    settle(banner, 1)
    expect(settled(banner)).toBe(false)
    expect(banner.seconds - before).toBeCloseTo(1, 1)
  })
})

describe('the cloth clock', () => {
  it('catches up at most a few steps after a long pause', () => {
    expect(advance(weave(BANNER_CLOTH), 2)).toBeLessThanOrEqual(MOST_STEPS)
    expect(advance(weave(BANNER_CLOTH), -1)).toBe(0)
  })
})
