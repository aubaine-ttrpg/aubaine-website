import { describe, expect, it } from 'vitest'

import { viewProgress } from '../../src/scripts/relief-scroll'

const viewport = 900
const height = 432

describe('relief scroll progress', () => {
  it('starts at 0 while the picture is still below the screen', () => {
    expect(viewProgress(viewport + 50, height, viewport)).toBe(0)
  })

  it('reaches one half when the picture is centred on the screen', () => {
    expect(viewProgress((viewport - height) / 2, height, viewport)).toBeCloseTo(0.5)
  })

  it('ends at 1 once the picture has left above the screen', () => {
    expect(viewProgress(-height - 10, height, viewport)).toBe(1)
  })

  it('grows as the page scrolls the picture upward', () => {
    const entering = viewProgress(viewport - 100, height, viewport)
    const higher = viewProgress(viewport - 400, height, viewport)
    expect(higher).toBeGreaterThan(entering)
  })
})
