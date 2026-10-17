import { describe, expect, it } from 'vitest'

import { buildMist, MIST, mistHaze, mistRoomCovers } from '../../src/lib/atlas/kernel/mist'
import { buildReveal } from '../../src/lib/atlas/kernel/reveal'
import { createGrid, tileAt } from '../../src/lib/atlas/world/grid'
import { loadWorld } from './fixtures/atlas'

const { world } = loadWorld('archipel')
const grid = createGrid(world.columns, world.rows)
const reveal = buildReveal(world, grid)
const pieces = buildMist(reveal)

type Point = { x: number; y: number; z: number }

function points(material: string): Point[] {
  const piece = pieces.find((candidate) => candidate.material === material)
  if (!piece) throw new Error(`the Archipel built no ${material} piece`)
  const { positions } = piece.mesh
  return Array.from({ length: positions.length / 3 }, (_, index) => ({
    x: positions[index * 3] ?? 0,
    y: positions[index * 3 + 1] ?? 0,
    z: positions[index * 3 + 2] ?? 0,
  }))
}

function onLand(x: number, z: number): boolean {
  const tile = tileAt(grid, x, z)
  return tile >= 0 && world.surface.water[tile] !== 1
}

describe('the room the haze is marched through', () => {
  const room = points('mist')

  it('never covers the land', () => {
    expect(room.filter((point) => onLand(point.x, point.z))).toEqual([])
  })

  it('is a flat roof on walls, so a view enters it once and its shape never shows', () => {
    expect(room.filter((point) => point.y !== 0 && point.y !== MIST.envelope)).toEqual([])
  })

  it('roofs every point where the haze has begun', () => {
    const roofed = new Set(
      room.filter((point) => point.y === MIST.envelope).map((point) => `${point.x},${point.z}`),
    )
    const missed: string[] = []
    const columns = Math.floor(reveal.spanX / MIST.cell)
    const rows = Math.floor(reveal.spanZ / MIST.cell)
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = reveal.x0 + column * MIST.cell
        const z = reveal.z0 + row * MIST.cell
        const key = `${Math.fround(x)},${Math.fround(z)}`
        if (mistHaze(reveal, x, z) > 0 && !roofed.has(key)) missed.push(key)
      }
    }
    expect(missed).toEqual([])
  })

  it('meets the edge of the field and the horizon at one height, so no line divides it', () => {
    const x1 = reveal.x0 + reveal.spanX
    const z1 = reveal.z0 + reveal.spanZ
    const outside = room.filter(
      (point) => point.x <= reveal.x0 || point.x >= x1 || point.z <= reveal.z0 || point.z >= z1,
    )
    expect(outside.length).toBeGreaterThan(8)
    for (const point of outside) expect(point.y).toBe(MIST.envelope)
    expect(Math.max(...outside.map((point) => Math.abs(point.x)))).toBe(MIST.reach)
  })

  it('gives the depth pass the same room as the haze', () => {
    expect(points('mist-depth')).toEqual(room)
  })

  it('tells the camera it is inside exactly where the roof stands', () => {
    const piece = pieces.find((candidate) => candidate.material === 'mist')
    if (!piece) throw new Error('the Archipel built no mist piece')
    const roofed = new Set<string>()
    const { indices } = piece.mesh
    for (let k = 0; k < indices.length; k += 3) {
      const corners = [0, 1, 2].map(
        (offset) => room[indices[k + offset] ?? 0] ?? { x: 0, y: 0, z: 0 },
      )
      if (corners.some((corner) => corner.y !== MIST.envelope)) continue
      const x = (corners[0]?.x ?? 0) + (corners[1]?.x ?? 0) + (corners[2]?.x ?? 0)
      const z = (corners[0]?.z ?? 0) + (corners[1]?.z ?? 0) + (corners[2]?.z ?? 0)
      const column = Math.floor((x / 3 - reveal.x0) / MIST.cell)
      const row = Math.floor((z / 3 - reveal.z0) / MIST.cell)
      roofed.add(`${column},${row}`)
    }
    const covers = mistRoomCovers(reveal)
    const disagreements: string[] = []
    const columns = Math.floor(reveal.spanX / MIST.cell)
    const rows = Math.floor(reveal.spanZ / MIST.cell)
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const x = reveal.x0 + (column + 0.5) * MIST.cell
        const z = reveal.z0 + (row + 0.5) * MIST.cell
        if (covers(x, z) !== roofed.has(`${column},${row}`)) disagreements.push(`${column},${row}`)
      }
    }
    expect(roofed.size).toBeGreaterThan(1000)
    expect(disagreements).toEqual([])
    expect(covers(reveal.x0 - 1, reveal.z0 - 1)).toBe(true)
  })
})
