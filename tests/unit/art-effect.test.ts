import { describe, expect, it } from 'vitest'

import {
  backingSize,
  blurLevel,
  coverWindow,
  grainFrame,
  objectPosition,
  paintLevel,
} from '../../src/lib/art-effect/cover'
import { ART_EFFECTS, isArtEffect } from '../../src/lib/art-effect/effects'

const SOURCE = { width: 1672, height: 941 }

const sourceAt = (window: ReturnType<typeof coverWindow>, box: { x: number; y: number }) => ({
  x: box.x * window.scale.x + window.offset.x,
  y: box.y * window.scale.y + window.offset.y,
})

describe('the cover window of a plate', () => {
  it('shows the whole picture when the box has its ratio', () => {
    const window = coverWindow({ width: 836, height: 470.5 }, SOURCE, { x: 0.52, y: 0.28 })
    expect(window.scale.x).toBeCloseTo(1)
    expect(window.scale.y).toBeCloseTo(1)
    expect(window.offset.x).toBeCloseTo(0)
    expect(window.offset.y).toBeCloseTo(0)
  })

  it('crops a phone width around the object position, like object-fit: cover', () => {
    const window = coverWindow({ width: 390, height: 776 }, SOURCE, { x: 0.5, y: 0.26 })
    const left = sourceAt(window, { x: 0, y: 0 })
    const right = sourceAt(window, { x: 1, y: 1 })
    expect(left.y).toBeCloseTo(0)
    expect(right.y).toBeCloseTo(1)
    expect((left.x + right.x) / 2).toBeCloseTo(0.5)
    expect(right.x - left.x).toBeCloseTo((390 / 776) * (941 / 1672))
  })

  it('pins the crop to an edge at 0% and 100%', () => {
    const box = { width: 390, height: 776 }
    expect(sourceAt(coverWindow(box, SOURCE, { x: 0, y: 0 }), { x: 0, y: 0 }).x).toBeCloseTo(0)
    expect(sourceAt(coverWindow(box, SOURCE, { x: 1, y: 0 }), { x: 1, y: 0 }).x).toBeCloseTo(1)
  })

  it('never reaches outside the picture', () => {
    for (const box of [
      { width: 1440, height: 900 },
      { width: 3000, height: 900 },
      { width: 390, height: 776 },
    ]) {
      const window = coverWindow(box, SOURCE, { x: 0.52, y: 0.28 })
      for (const corner of [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]) {
        const at = sourceAt(window, corner)
        expect(at.x).toBeGreaterThanOrEqual(-1e-9)
        expect(at.x).toBeLessThanOrEqual(1 + 1e-9)
        expect(at.y).toBeGreaterThanOrEqual(-1e-9)
        expect(at.y).toBeLessThanOrEqual(1 + 1e-9)
      }
    }
  })
})

describe('the object position a plate is read with', () => {
  it('reads two percentages', () => {
    expect(objectPosition('52% 28%')).toEqual({ x: 0.52, y: 0.28 })
    expect(objectPosition('50% 24.5%')).toEqual({ x: 0.5, y: 0.245 })
  })

  it('refuses keywords and lengths, which the plate never writes', () => {
    expect(() => objectPosition('center')).toThrow()
    expect(() => objectPosition('10px 20px')).toThrow()
    expect(() => objectPosition('left 20%')).toThrow()
  })
})

describe('the backing store of a plate', () => {
  it('matches the screen when the budget allows', () => {
    expect(backingSize({ width: 1440, height: 900 }, 1, 1, 6_600_000, 16384)).toEqual({
      width: 1440,
      height: 900,
      density: 1,
    })
  })

  it('carries the scale of the drift so texels land one to one', () => {
    const backing = backingSize({ width: 1000, height: 500 }, 1, 1.1, 6_600_000, 16384)
    expect(backing.width).toBe(1100)
    expect(backing.height).toBe(550)
  })

  it('lowers its density to stay inside the pixel budget', () => {
    const backing = backingSize({ width: 1512, height: 900 }, 2, 1.1, 4_000_000, 16384)
    expect(backing.width * backing.height).toBeLessThanOrEqual(4_000_000 * 1.01)
    expect(backing.density).toBeLessThan(2)
  })

  it('keeps a phone at three device pixels when it fits the budget', () => {
    expect(backingSize({ width: 390, height: 776 }, 3, 1, 4_000_000, 16384).density).toBe(3)
  })

  it('never exceeds the texture limit', () => {
    const backing = backingSize({ width: 3000, height: 900 }, 2, 1.1, 50_000_000, 4096)
    expect(backing.width).toBeLessThanOrEqual(4096)
  })
})

describe('the levels a plate samples', () => {
  it('blurs on a coarser mip as the radius grows', () => {
    expect(blurLevel(1672, 0.008)).toBeCloseTo(Math.log2((1672 * 0.008) / 0.8))
    expect(blurLevel(100, 0.001)).toBe(0)
  })

  it('paints a picture shown smaller than its source on a coarser level', () => {
    const levels = 12
    expect(paintLevel({ source: 1086, shown: 1366, widest: 1672, coarser: 0, levels })).toBe(0)
    expect(paintLevel({ source: 1086, shown: 540, widest: 1672, coarser: 0, levels })).toBe(1)
    expect(paintLevel({ source: 1086, shown: 260, widest: 1672, coarser: 0, levels })).toBe(2)
  })

  it('never paints a source wider than the widest at full size', () => {
    expect(paintLevel({ source: 3344, shown: 4000, widest: 1672, coarser: 0, levels: 12 })).toBe(1)
  })

  it('steps down a level more on a low tier, but never below the smallest level', () => {
    expect(paintLevel({ source: 1086, shown: 1366, widest: 1672, coarser: 1, levels: 12 })).toBe(1)
    expect(paintLevel({ source: 4, shown: 1, widest: 1672, coarser: 1, levels: 3 })).toBe(2)
  })

  it('changes the grain twenty four times a second', () => {
    expect(grainFrame(0, 24)).toBe(0)
    expect(grainFrame(41, 24)).toBe(0)
    expect(grainFrame(42, 24)).toBe(1)
    expect(grainFrame(1000, 24)).toBe(24)
  })
})

describe('the art effect a plate names', () => {
  it('accepts every declared effect', () => {
    for (const effect of ART_EFFECTS) expect(isArtEffect(effect)).toBe(true)
  })

  it('refuses anything else read from the page', () => {
    for (const value of ['__proto__', 'Film', '', null, 'toString', 'print', 'restrained']) {
      expect(isArtEffect(value)).toBe(false)
    }
  })
})
