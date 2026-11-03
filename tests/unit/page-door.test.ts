import { describe, expect, it } from 'vitest'
import { awayFrom, type Box, besideBand } from '../../src/scripts/page-door'

const BAND: Box = { left: 843, top: 79, bottom: 838 }

describe('a spotlight beside the band', () => {
  it('is beside when it starts right of the band and shares its height', () => {
    expect(besideBand({ left: 972, top: 65, bottom: 860 }, BAND)).toBe(true)
  })

  it('is beside when its left edge meets the band exactly', () => {
    expect(besideBand({ left: BAND.left, top: 65, bottom: 860 }, BAND)).toBe(true)
  })

  it('is not beside when it starts left of the band, as the stacked spotlight does', () => {
    expect(besideBand({ left: 16, top: 301, bottom: 936 }, BAND)).toBe(false)
  })

  it('is not beside when it lies wholly above or below the band', () => {
    expect(besideBand({ left: 972, top: 0, bottom: BAND.top }, BAND)).toBe(false)
    expect(besideBand({ left: 972, top: BAND.bottom, bottom: 1200 }, BAND)).toBe(false)
  })
})

describe('the distance that takes the band off the screen', () => {
  it('carries the leftmost edge past the right edge of the screen', () => {
    const left = 843
    const width = 1512
    expect(left + awayFrom(left, width)).toBeGreaterThan(width)
  })

  it('rounds a fractional edge up, never short of the screen edge', () => {
    const left = 714.6
    const width = 1280
    expect(left + awayFrom(left, width)).toBeGreaterThan(width)
    expect(Number.isInteger(awayFrom(left, width))).toBe(true)
  })

  it('still clears the screen when the band starts at its left edge', () => {
    expect(awayFrom(0, 1024)).toBeGreaterThan(1024)
  })
})
