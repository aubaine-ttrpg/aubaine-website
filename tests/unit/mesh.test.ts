import { describe, expect, it } from 'vitest'

import { gridCorners, gridIndex, gridTriangles } from '../../src/lib/art-effect/mesh'

describe('a grid mesh', () => {
  it('spans the unit square from its first corner to its last', () => {
    const grid = { columns: 4, rows: 3 }
    const corners = gridCorners(grid)
    expect(corners.length).toBe(grid.columns * grid.rows * 2)
    expect([corners[0], corners[1]]).toEqual([0, 0])
    const last = gridIndex(grid, grid.columns - 1, grid.rows - 1) * 2
    expect([corners[last], corners[last + 1]]).toEqual([1, 1])
  })

  it('covers every cell with two triangles that face the same way', () => {
    const grid = { columns: 5, rows: 4 }
    const corners = gridCorners(grid)
    const triangles = gridTriangles(grid)
    expect(triangles.length).toBe((grid.columns - 1) * (grid.rows - 1) * 6)
    for (let at = 0; at < triangles.length; at += 3) {
      const [a, b, c] = [triangles[at] ?? 0, triangles[at + 1] ?? 0, triangles[at + 2] ?? 0]
      const ab = [
        (corners[b * 2] ?? 0) - (corners[a * 2] ?? 0),
        (corners[b * 2 + 1] ?? 0) - (corners[a * 2 + 1] ?? 0),
      ]
      const ac = [
        (corners[c * 2] ?? 0) - (corners[a * 2] ?? 0),
        (corners[c * 2 + 1] ?? 0) - (corners[a * 2 + 1] ?? 0),
      ]
      expect(Math.sign((ab[0] ?? 0) * (ac[1] ?? 0) - (ab[1] ?? 0) * (ac[0] ?? 0))).toBe(-1)
    }
  })

  it('refuses a grid too large for sixteen bit indices', () => {
    expect(() => gridTriangles({ columns: 300, rows: 300 })).toThrow(/65536/)
  })
})
