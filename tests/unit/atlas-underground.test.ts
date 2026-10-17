import { describe, expect, it } from 'vitest'

import type { MeshData, Piece } from '../../src/lib/atlas/contract/scene'
import { buildHeightMap } from '../../src/lib/atlas/kernel/heightmap'
import { hasPrototype, prototypeKey } from '../../src/lib/atlas/kernel/prototypes'
import { type UndergroundBuild, undergroundSteps } from '../../src/lib/atlas/kernel/underground'
import { SETTINGS } from '../../src/lib/atlas/vocabulary'
import { tileAt } from '../../src/lib/atlas/world/grid'
import type { PlaceRecord } from '../../src/lib/atlas/world/model'
import { ROCK_TOP, reliefField, UNDERGROUND_WATER } from '../../src/lib/atlas/world/relief'
import { finish, loadWorld } from './fixtures/atlas'

type Point = { x: number; y: number; z: number }

const { authored, world } = loadWorld('archipel')
const grid = authored.grid
const field = reliefField(grid, world.surface)
const map = buildHeightMap(world, field)
const buildAll = () =>
  [...world.underground]
    .sort((a, b) => a.level - b.level)
    .map((record) => finish(undergroundSteps(world, grid, map, record)))
const builds = buildAll()

const LAKE = SETTINGS.indexOf('lake')
const BUILT = SETTINGS.indexOf('built')
const MATRIX = 16

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`missing ${what}`)
  return value
}

const recordOf = (level: number) =>
  required(
    world.underground.find((record) => record.level === level),
    `underground level ${level}`,
  )
const buildOf = (level: number) =>
  required(
    builds.find((build) => build.level === level),
    `build of level ${level}`,
  )
const meshOf = (build: UndergroundBuild, material: Piece['material']): MeshData | undefined =>
  build.pieces.find((piece) => piece.material === material)?.mesh
const vertexCount = (mesh: MeshData) => mesh.positions.length / 3
const pointAt = (mesh: MeshData, vertex: number): Point => ({
  x: mesh.positions[vertex * 3] ?? 0,
  y: mesh.positions[vertex * 3 + 1] ?? 0,
  z: mesh.positions[vertex * 3 + 2] ?? 0,
})
const tilesOf = (codes: ArrayLike<number>, keep: (code: number, tile: number) => boolean) =>
  Array.from({ length: grid.size }, (_, tile) => tile).filter((tile) =>
    keep(codes[tile] ?? -1, tile),
  )

const instancesOf = (build: UndergroundBuild, prototype: string): Float32Array[] =>
  build.batch
    .sets()
    .filter((set) => set.prototype === prototype)
    .flatMap((set) =>
      Array.from({ length: set.matrices.length / MATRIX }, (_, k) =>
        set.matrices.subarray(k * MATRIX, (k + 1) * MATRIX),
      ),
    )
const standsOn = (matrix: Float32Array, tile: number) =>
  Math.abs((matrix[12] ?? 0) - (grid.x[tile] ?? 0)) < 1e-4 &&
  Math.abs((matrix[14] ?? 0) - (grid.z[tile] ?? 0)) < 1e-4

const hasEstablishment = (place: number, kind: string) =>
  world.establishments.some(
    (establishment) => establishment.place === place && establishment.kind === kind,
  )
const holdQuarters = (kind: string): PlaceRecord[] =>
  world.places.filter(
    (place) => place.kind === 'hold-quarter' && hasEstablishment(place.index, kind),
  )

function floorRims(build: UndergroundBuild): Point[][] {
  const { setting } = recordOf(build.level)
  const floors = required(meshOf(build, 'under-top'), 'floors')
  const rims: Point[][] = []
  let end = 0
  for (let tile = 0; tile < grid.size; tile++) {
    const rings = (setting[tile] ?? 0) > 0 ? 3 : 1
    end += 1 + 3 * rings * (rings + 1)
    rims.push(Array.from({ length: 6 * rings }, (_, k) => pointAt(floors, end - 6 * rings + k)))
  }
  return rims
}

function wallTops(build: UndergroundBuild): Map<number, Point[]> {
  const walls = required(meshOf(build, 'under-wall'), 'walls')
  const tops = new Map<number, Point[]>()
  for (let vertex = 0; vertex < vertexCount(walls); vertex++) {
    const point = pointAt(walls, vertex)
    if (Math.abs(point.y - (walls.floats?.[vertex] ?? Number.NaN)) > 1e-6) continue
    const tile = (walls.bytes?.[vertex * 4 + 1] ?? 0) + (walls.bytes?.[vertex * 4 + 2] ?? 0) * 256
    const list = tops.get(tile) ?? []
    list.push(point)
    tops.set(tile, list)
  }
  return tops
}

function along(a: Point, b: Point, p: Point): { t: number; off: number } {
  const dx = b.x - a.x
  const dz = b.z - a.z
  const t = ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz)
  return { t, off: Math.hypot(a.x + dx * t - p.x, a.z + dz * t - p.z) }
}

const samePoint = (a: Point, b: Point) => a.x === b.x && a.y === b.y && a.z === b.z

function sameValues(a: ArrayLike<number> | undefined, b: ArrayLike<number> | undefined): boolean {
  if (a === undefined || b === undefined) return a === b
  if (a.length !== b.length) return false
  for (let k = 0; k < a.length; k++) if (!Object.is(a[k], b[k])) return false
  return true
}

describe('the underground build', () => {
  it('builds both levels in order, each on its own layer', () => {
    expect(builds.map((build) => build.level)).toEqual([1, 2])
    for (const build of builds) {
      for (const set of build.batch.sets()) expect(set.layer).toBe(`under-${build.level}`)
    }
  })

  it('writes finite positions, indices inside each mesh and packed unit normals', () => {
    for (const build of builds) {
      for (const { mesh } of build.pieces) {
        const count = vertexCount(mesh)
        expect(count).toBeGreaterThan(0)
        expect(mesh.positions.every(Number.isFinite)).toBe(true)
        let highest = 0
        for (const index of mesh.indices) highest = Math.max(highest, index)
        expect(highest).toBeLessThan(count)
        let worst = 0
        for (let vertex = 0; vertex < count; vertex++) {
          const length = Math.hypot(
            mesh.normals[vertex * 4] ?? 0,
            mesh.normals[vertex * 4 + 1] ?? 0,
            mesh.normals[vertex * 4 + 2] ?? 0,
          )
          worst = Math.max(worst, Math.abs(length / 127 - 1))
        }
        expect(worst).toBeLessThan(0.02)
      }
    }
  })

  it('gives walls one lip float per vertex and floors none', () => {
    for (const build of builds) {
      const floors = required(meshOf(build, 'under-top'), 'floors')
      const walls = required(meshOf(build, 'under-wall'), 'walls')
      expect(floors.floats).toBeUndefined()
      expect(floors.floatSize).toBe(0)
      expect(floors.bytes?.length).toBe(vertexCount(floors) * 4)
      expect(walls.floatSize).toBe(1)
      expect(walls.floats?.length).toBe(vertexCount(walls))
      expect(walls.bytes?.length).toBe(vertexCount(walls) * 4)
    }
  })

  it('rings open tiles three times and solid rock once', () => {
    for (const build of builds) {
      const open = tilesOf(recordOf(build.level).setting, (code) => code > 0).length
      const rock = grid.size - open
      const floors = required(meshOf(build, 'under-top'), 'floors')
      expect(vertexCount(floors)).toBe(open * 37 + rock * 7)
      expect(floors.indices.length).toBe((open * 54 + rock * 6) * 3)
    }
  })

  it('lays one hexagon of still water on each lake tile', () => {
    let lakeTiles = 0
    for (const build of builds) {
      const lakes = tilesOf(recordOf(build.level).setting, (code) => code === LAKE)
      const water = meshOf(build, 'under-water')
      lakeTiles += lakes.length
      if (lakes.length === 0) {
        expect(water).toBeUndefined()
        continue
      }
      const mesh = required(water, 'water')
      expect(vertexCount(mesh)).toBe(lakes.length * 7)
      expect(mesh.indices.length).toBe(lakes.length * 18)
      for (const [k, tile] of lakes.entries()) {
        const centre = pointAt(mesh, k * 7)
        expect(centre.x).toBeCloseTo(grid.x[tile] ?? 0, 4)
        expect(centre.z).toBeCloseTo(grid.z[tile] ?? 0, 4)
      }
      for (let vertex = 0; vertex < vertexCount(mesh); vertex++) {
        expect(pointAt(mesh, vertex).y).toBeCloseTo(UNDERGROUND_WATER, 6)
      }
    }
    expect(lakeTiles).toBeGreaterThan(0)
  })

  it('tops every wall on its floor rim, sharing the rim vertices of the walled side', () => {
    const unmet: string[] = []
    let walledSides = 0
    for (const build of builds) {
      const rims = floorRims(build)
      for (const [tile, tops] of wallTops(build)) {
        const rim = rims[tile] ?? []
        for (const [k, a] of rim.entries()) {
          const b = rim[(k + 1) % rim.length] ?? a
          const inside = tops.filter((p) => {
            const { t, off } = along(a, b, p)
            return t > 0.01 && t < 0.99 && off < 1e-4
          })
          if (inside.length === 0) continue
          walledSides++
          for (const end of [a, b]) {
            if (!tops.some((p) => samePoint(p, end)))
              unmet.push(`level ${build.level} tile ${tile} rim ${k}`)
          }
          for (const p of inside) {
            const { t } = along(a, b, p)
            if (Math.abs(p.y - (a.y + (b.y - a.y) * t)) > 1e-5) {
              unmet.push(`level ${build.level} tile ${tile} rim ${k} height`)
            }
          }
        }
      }
    }
    expect(walledSides).toBeGreaterThan(0)
    expect(unmet).toEqual([])
  })

  it('places only registered prototypes', () => {
    for (const build of builds) {
      expect(build.batch.size).toBeGreaterThan(0)
      for (const key of build.batch.prototypes()) expect(hasPrototype(key)).toBe(true)
    }
  })

  it('emits only particle systems that have origins', () => {
    for (const build of builds) {
      for (const spec of build.particles) {
        expect(spec.origins.length).toBeGreaterThan(0)
        expect(spec.origins.length % 3).toBe(0)
        expect(spec.origins.every(Number.isFinite)).toBe(true)
      }
    }
  })

  it('builds the same arrays every time', () => {
    const summary = (list: UndergroundBuild[]) =>
      list.map((build) => ({
        level: build.level,
        materials: build.pieces.map((piece) => piece.material),
        prototypes: build.batch.sets().map((set) => set.prototype),
        seeds: build.particles.map((spec) => spec.seed),
      }))
    const arrays = (list: UndergroundBuild[]) =>
      list.flatMap((build) => [
        ...build.pieces.flatMap(({ mesh }) => [
          mesh.positions,
          mesh.normals,
          mesh.bytes,
          mesh.floats,
          mesh.indices,
        ]),
        ...build.batch.sets().flatMap((set) => [set.matrices, set.tints]),
        ...build.particles.map((spec) => spec.origins),
      ])
    const again = buildAll()
    expect(summary(again)).toEqual(summary(builds))
    const before = arrays(builds)
    const after = arrays(again)
    expect(after.length).toBe(before.length)
    expect(after.every((array, k) => sameValues(array, before[k]))).toBe(true)
  })
})

describe('a hold quarter', () => {
  it('raises forge halls in the quarter whose establishments include a forge, and nowhere else', () => {
    const forges = new Set(holdQuarters('forge').map((place) => place.index))
    expect(forges.size).toBeGreaterThan(0)
    const hosts = new Set<number>()
    for (const build of builds) {
      const { quarter } = recordOf(build.level)
      for (const matrix of instancesOf(build, prototypeKey.hall('nordhal'))) {
        hosts.add(quarter[tileAt(grid, matrix[12] ?? 0, matrix[14] ?? 0)] ?? -1)
      }
    }
    expect(hosts).toEqual(forges)
  })

  it('stands a throne column on each carved tile of the quarter with a palace, and only there', () => {
    const thrones = new Set(
      holdQuarters('palace')
        .filter((place) => !hasEstablishment(place.index, 'forge'))
        .map((place) => place.index),
    )
    expect(thrones.size).toBeGreaterThan(0)
    let throneTiles = 0
    for (const place of world.places.filter((entry) => entry.kind === 'hold-quarter')) {
      const record = recordOf(place.stratum)
      const columns = instancesOf(buildOf(place.stratum), 'column')
      const carved = tilesOf(
        record.quarter,
        (quarter, tile) => quarter === place.index && record.setting[tile] === BUILT,
      )
      for (const tile of carved) {
        const throne = columns.find((matrix) => standsOn(matrix, tile))
        if (!thrones.has(place.index)) {
          expect(throne).toBeUndefined()
          continue
        }
        throneTiles++
        const floor = record.floor[tile] ?? 0
        expect(throne?.[0]).toBeCloseTo(2.2, 5)
        expect(throne?.[5]).toBeCloseTo(ROCK_TOP - floor + 0.02, 5)
        expect(throne?.[13]).toBeCloseTo(floor, 5)
      }
    }
    expect(throneTiles).toBeGreaterThan(0)
  })

  it('leaves a crypt on carved tiles outside any hold', () => {
    let crypts = 0
    for (const build of builds) {
      const record = recordOf(build.level)
      const placed = instancesOf(build, 'crypt')
      const carved = tilesOf(
        record.setting,
        (setting, tile) => setting === BUILT && (record.quarter[tile] ?? -1) < 0,
      )
      for (const tile of carved) expect(placed.some((matrix) => standsOn(matrix, tile))).toBe(true)
      crypts += carved.length
    }
    expect(crypts).toBeGreaterThan(0)
  })
})
