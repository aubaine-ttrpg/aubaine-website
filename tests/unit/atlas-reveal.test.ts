import { describe, expect, it } from 'vitest'

import { TIER_SETTINGS } from '../../src/lib/atlas/contract/quality'
import { renderSize, scanlineStrength } from '../../src/lib/atlas/engine/post'
import {
  buildReveal,
  isUnexplored,
  REVEAL_PAD,
  revealAt,
  UNEXPLORED,
  unexploredMarks,
} from '../../src/lib/atlas/kernel/reveal'
import { buildWater } from '../../src/lib/atlas/kernel/water'
import { loadWorld } from './fixtures/atlas'

const { authored, world } = loadWorld('archipel')
const grid = authored.grid
const reveal = buildReveal(world, grid)
const centre = (tile: number) => [grid.x[tile] ?? 0, grid.z[tile] ?? 0] as const

describe('the fog of war', () => {
  it('leaves every land tile, landmark and route discovered', () => {
    for (let tile = 0; tile < grid.size; tile++) {
      if (world.surface.water[tile] === 1 && (world.surface.lake[tile] ?? -1) < 0) continue
      expect(revealAt(reveal, ...centre(tile))).toBe(0)
    }
    for (const landmark of world.landmarks) {
      expect(isUnexplored(reveal, ...centre(landmark.tile))).toBe(false)
    }
    for (const route of world.routes) {
      for (const tile of route.tiles) expect(isUnexplored(reveal, ...centre(tile))).toBe(false)
    }
  })

  it('hides the open sea far from the coast, and everything past its own edge', () => {
    expect(revealAt(reveal, reveal.x0 - 50, 0)).toBe(1)
    expect(revealAt(reveal, 0, reveal.z0 + reveal.spanZ + 50)).toBe(1)
    const { width, height, values } = reveal
    for (let x = 0; x < width; x++) {
      expect(values[x]).toBe(255)
      expect(values[(height - 1) * width + x]).toBe(255)
    }
  })

  it('reaches full fog before the end of its padding, so the sea needs no edge', () => {
    const inset = 2
    const { width, height, values } = reveal
    for (let y = inset; y < height - inset; y++) {
      expect(values[y * width + inset]).toBe(255)
      expect(values[y * width + width - 1 - inset]).toBe(255)
    }
  })

  it('only creeps in from the outside, never enclosed by discovered land', () => {
    const { width, height, values } = reveal
    const dense = Math.round(UNEXPLORED * 255)
    const reached = new Uint8Array(width * height)
    const queue: number[] = []
    for (let x = 0; x < width; x++) queue.push(x)
    for (const k of queue) reached[k] = 1
    for (let head = 0; head < queue.length; head++) {
      const k = queue[head] ?? 0
      const x = k % width
      for (const next of [k - 1, k + 1, k - width, k + width]) {
        if (next < 0 || next >= width * height || Math.abs((next % width) - x) > 1) continue
        if (reached[next] === 1 || (values[next] ?? 0) < dense) continue
        reached[next] = 1
        queue.push(next)
      }
    }
    let enclosed = 0
    for (let k = 0; k < width * height; k++) {
      if ((values[k] ?? 0) >= dense && reached[k] === 0) enclosed += 1
    }
    expect(enclosed).toBe(0)
  })

  it('extends the sea past the authored grid wherever the coast can be seen', () => {
    const pieces = buildWater(world, grid, reveal)
    const abyss = pieces.find((piece) => piece.material === 'abyss')
    expect(abyss).toBeDefined()
    const positions = abyss?.mesh.positions ?? new Float32Array()
    let outside = 0
    for (let k = 0; k < positions.length; k += 3) {
      const x = positions[k] ?? 0
      const z = positions[k + 2] ?? 0
      if (Math.abs(x) > grid.originX + 1 || Math.abs(z) > grid.originZ + 1) outside += 1
      expect(Math.abs(x)).toBeLessThan(grid.originX + REVEAL_PAD + 2)
    }
    expect(outside).toBeGreaterThan(0)
    expect(pieces.some((piece) => piece.material.startsWith('water-'))).toBe(false)
  })

  it('names a few spread out places in the fog', () => {
    const marks = unexploredMarks(reveal)
    expect(marks.length).toBeGreaterThan(0)
    expect(marks.length).toBeLessThanOrEqual(8)
    for (const mark of marks) {
      expect(isUnexplored(reveal, mark.x, mark.z)).toBe(true)
      for (const other of marks) {
        if (other !== mark)
          expect(Math.hypot(other.x - mark.x, other.z - mark.z)).toBeGreaterThan(109)
      }
    }
  })
})

describe('the quality tiers', () => {
  it('render Low at 75 %, High at 90 % and Ultra at full resolution', () => {
    expect(TIER_SETTINGS.low.renderScale).toBe(0.75)
    expect(TIER_SETTINGS.high.renderScale).toBe(0.9)
    expect(TIER_SETTINGS.ultra.renderScale).toBe(1)
    expect(renderSize(1440, 0.75)).toBe(1080)
    expect(renderSize(1, 0.75)).toBe(2)
  })

  it('draw scanlines only once they are at least two pixels apart', () => {
    expect(scanlineStrength(360)).toBeGreaterThan(0)
    expect(scanlineStrength(1080)).toBeGreaterThan(scanlineStrength(720))
    expect(scanlineStrength(1440)).toBe(scanlineStrength(2160))
  })
})
