import { describe, expect, it } from 'vitest'

import type { VehiclePath } from '../../src/lib/atlas/contract/scene'
import { buildRoutes, routeLine } from '../../src/lib/atlas/kernel/routes'
import { reliefField } from '../../src/lib/atlas/world/relief'
import { loadWorld } from './fixtures/atlas'

const { authored, world } = loadWorld('archipel')
const grid = authored.grid
const field = reliefField(grid, world.surface)
const { pieces, batch, vehicles } = buildRoutes(world, field)
const railLines = world.routes.filter((route) => route.kind === 'rail')
const MATRIX_SIZE = 16
const NORMAL_STRIDE = 4
const SNORM = 127
const ROUTE_MATERIALS = ['road', 'trail', 'ballast', 'rail', 'sea-lane', 'sky-lane', 'river']

const pathOf = (index: number): VehiclePath | undefined => vehicles.paths[index]

function firstStall(lengths: Float32Array): number {
  for (let k = 1; k < lengths.length; k++) {
    if (!((lengths[k] ?? 0) > (lengths[k - 1] ?? 0))) return k
  }
  return -1
}

describe('the route pieces', () => {
  it('merges each route material into a single piece that casts no shadow', () => {
    const materials = pieces.map((piece) => piece.material)
    expect(materials).not.toHaveLength(0)
    expect(new Set(materials).size).toBe(materials.length)
    for (const material of materials) expect(ROUTE_MATERIALS).toContain(material)
    for (const piece of pieces) expect(piece.casts).toBe(false)
  })

  it('keeps every position finite and every index inside its piece', () => {
    for (const { mesh } of pieces) {
      const vertices = mesh.positions.length / 3
      expect(mesh.positions.every(Number.isFinite)).toBe(true)
      expect(mesh.indices.length % 3).toBe(0)
      expect(mesh.indices.every((index) => index < vertices)).toBe(true)
    }
  })

  it('packs a unit normal for every vertex', () => {
    for (const { mesh } of pieces) {
      let worst = 0
      for (let at = 0; at < mesh.normals.length; at += NORMAL_STRIDE) {
        const length =
          Math.hypot(mesh.normals[at] ?? 0, mesh.normals[at + 1] ?? 0, mesh.normals[at + 2] ?? 0) /
          SNORM
        worst = Math.max(worst, Math.abs(length - 1))
      }
      expect(worst).toBeLessThan(0.01)
    }
  })

  it('gives every vertex two route coordinates, along the route and across it', () => {
    for (const { mesh } of pieces) {
      expect(mesh.floatSize).toBe(2)
      expect(mesh.floats?.length).toBe((mesh.positions.length / 3) * 2)
    }
  })
})

describe('the rail props', () => {
  it('lays one sleeper under every point a train runs through', () => {
    const sleepers = batch.sets().filter((set) => set.prototype === 'sleeper')
    const laid = sleepers.reduce((sum, set) => sum + set.matrices.length / MATRIX_SIZE, 0)
    const points = vehicles.trains.reduce(
      (sum, train) => sum + (pathOf(train.path)?.lengths.length ?? 0),
      0,
    )
    expect(laid).toBeGreaterThan(0)
    expect(laid).toBe(points)
  })

  it('puts every route prop on the routes layer', () => {
    for (const set of batch.sets()) expect(set.layer).toBe('routes')
  })
})

describe('the route vehicles', () => {
  it('runs one train on every rail line and one airship on every sky lane', () => {
    expect(railLines.length).toBeGreaterThan(0)
    expect(vehicles.trains).toHaveLength(railLines.length)
    expect(vehicles.airships).toHaveLength(world.skyLanes.length)
    expect(vehicles.ships.length).toBeGreaterThan(0)
  })

  it('sends every voyage along a path that exists', () => {
    for (const voyage of [...vehicles.ships, ...vehicles.airships, ...vehicles.trains]) {
      expect(pathOf(voyage.path)).toBeDefined()
    }
  })

  it('measures every path with strictly increasing lengths that end at its total', () => {
    for (const path of vehicles.paths) {
      expect(path.points.length).toBe(path.lengths.length * 3)
      expect(path.lengths[0]).toBe(0)
      expect(firstStall(path.lengths)).toBe(-1)
      expect(path.total).toBe(path.lengths.at(-1))
    }
  })
})

describe('a route line', () => {
  it('starts and ends on the centres of its first and last tiles', () => {
    for (const route of world.routes) {
      const line = routeLine(grid, route.tiles, 0.05)
      const first = route.tiles[0] ?? -1
      const last = route.tiles.at(-1) ?? -1
      expect(line[0]).toEqual([grid.x[first], grid.z[first]])
      expect(line.at(-1)).toEqual([grid.x[last], grid.z[last]])
    }
  })

  it('never leaves more than a step between two of its points', () => {
    for (const step of [0.05, 0.12]) {
      for (const route of world.routes) {
        const line = routeLine(grid, route.tiles, step)
        let widest = 0
        for (let k = 1; k < line.length; k++) {
          const [ax, az] = line[k - 1] ?? [0, 0]
          const [bx, bz] = line[k] ?? [0, 0]
          widest = Math.max(widest, Math.hypot(bx - ax, bz - az))
        }
        expect(widest).toBeLessThanOrEqual(step + 1e-9)
      }
    }
  })
})
