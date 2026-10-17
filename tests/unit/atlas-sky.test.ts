import { describe, expect, it } from 'vitest'

import { type MeshData, NO_LANDMARK, type PieceMaterial } from '../../src/lib/atlas/contract/scene'
import { buildHeightMap } from '../../src/lib/atlas/kernel/heightmap'
import { familyOf } from '../../src/lib/atlas/kernel/kinds'
import { hasPrototype } from '../../src/lib/atlas/kernel/prototypes'
import { buildSky, type SkyBuild } from '../../src/lib/atlas/kernel/sky'
import { ISLE_FEATURES, type IsleFeature } from '../../src/lib/atlas/vocabulary'
import { NO_TILE, tileAt } from '../../src/lib/atlas/world/grid'
import type { World } from '../../src/lib/atlas/world/model'
import { reliefField } from '../../src/lib/atlas/world/relief'
import { loadWorld } from './fixtures/atlas'

const { authored, world } = loadWorld('archipel')
const grid = authored.grid
const map = buildHeightMap(world, reliefField(grid, world.surface))
const sky = buildSky(world, grid, map)
const heights = [...world.sky.y]
const HEXAGON_VERTICES = 37
const HEXAGON_TRIANGLES = 54
const RIBBON_VERTICES = 18
const PACKED_UNIT = 127

const vertexCount = (mesh: MeshData) => mesh.positions.length / 3
const meshesOf = (build: SkyBuild): MeshData[] => [
  ...build.pieces.map((piece) => piece.mesh),
  ...build.models.map((model) => model.mesh),
]
const pieceOf = (build: SkyBuild, material: PieceMaterial) =>
  build.pieces.find((piece) => piece.material === material)?.mesh
const propVertices = (build: SkyBuild) =>
  build.models.reduce((sum, model) => sum + vertexCount(model.mesh), 0)
const kindsOf = (mesh: MeshData) => {
  const kinds = new Set<number>()
  const bytes = mesh.bytes ?? new Uint8Array(0)
  for (let i = 3; i < bytes.length; i += 4) kinds.add(bytes[i] ?? 0)
  return kinds
}
const withoutFeature = (feature: IsleFeature): World => ({
  ...world,
  landmarks: world.landmarks.map((landmark) => ({
    ...landmark,
    features: landmark.features.filter((entry) => entry !== feature),
  })),
})

describe('the sky islands', () => {
  it('write finite positions, indices inside their mesh and packed normals of unit length', () => {
    for (const mesh of meshesOf(sky)) {
      const count = vertexCount(mesh)
      expect(count).toBeGreaterThan(0)
      expect(mesh.positions.every(Number.isFinite)).toBe(true)
      expect(mesh.indices.length % 3).toBe(0)
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
        worst = Math.max(worst, Math.abs(length / PACKED_UNIT - 1))
      }
      expect(worst).toBeLessThan(0.01)
    }
  })

  it('lay one hexagon of three rings over every sky hex, centred on its tile', () => {
    const top = pieceOf(sky, 'sky-top')
    expect(top?.indices.length).toBe(world.sky.tile.length * HEXAGON_TRIANGLES * 3)
    const centres: number[] = []
    const positions = top?.positions ?? new Float32Array(0)
    for (let start = 0; start < positions.length; start += HEXAGON_VERTICES * 3) {
      centres.push(tileAt(grid, positions[start] ?? 0, positions[start + 2] ?? 0))
    }
    expect(centres.length * HEXAGON_VERTICES * 3).toBe(positions.length)
    expect(centres.sort((a, b) => a - b)).toEqual([...world.sky.tile].sort((a, b) => a - b))
  })

  it('give every cliff vertex one lip float and no surface tile', () => {
    const cliffs = pieceOf(sky, 'terrain-wall')
    const lips = [...(cliffs?.floats ?? [])]
    expect(cliffs?.floatSize).toBe(1)
    expect(lips.length).toBe(cliffs ? vertexCount(cliffs) : -1)
    const lowest = Math.min(...heights)
    const known = new Set(heights)
    expect(lips.every((lip) => known.has(lip) || lip < lowest)).toBe(true)
    const bytes = cliffs?.bytes ?? new Uint8Array(0)
    const owners = new Set<number>()
    for (let i = 0; i < bytes.length; i += 4)
      owners.add((bytes[i + 1] ?? 0) | ((bytes[i + 2] ?? 0) << 8))
    expect([...owners]).toEqual([NO_TILE])
  })

  it('hang each waterfall as a ribbon whose uv runs across and down', () => {
    const falls = pieceOf(sky, 'sky-fall')
    const uv = [...(falls?.floats ?? [])]
    expect(falls?.floatSize).toBe(2)
    expect(uv.length).toBe(falls ? vertexCount(falls) * 2 : -1)
    expect(uv.length % (RIBBON_VERTICES * 2)).toBe(0)
    expect(uv.every((value) => value >= 0 && value <= 1)).toBe(true)
  })

  it('come out the same on every build', () => {
    expect(buildSky(world, grid, map)).toEqual(sky)
  })
})

describe('the sky props', () => {
  it('place houses, towers and trees as instances of registered prototypes on the sky layer', () => {
    const sets = sky.batch.sets()
    expect(sets.length).toBeGreaterThan(0)
    for (const set of sets) {
      expect(hasPrototype(set.prototype)).toBe(true)
      expect(set.layer).toBe('sky')
    }
    const keys = sets.map((set) => set.prototype)
    expect(keys.some((key) => key.startsWith('house-'))).toBe(true)
    expect(keys).toContain('oak')
  })

  it('draw one model per family present, each holding only kinds of its own family', () => {
    const families = sky.models.map((model) => model.family)
    expect(families.length).toBeGreaterThan(0)
    expect(new Set(families).size).toBe(families.length)
    for (const model of sky.models) {
      expect(model).toMatchObject({
        layer: 'sky',
        landmark: NO_LANDMARK,
        position: [0, 0, 0],
        turn: 0,
        scale: 1,
        casts: true,
        doubleSided: false,
      })
      expect(familyOf(kindsOf(model.mesh))).toBe(model.family)
      for (const kind of kindsOf(model.mesh)) expect(familyOf([kind])).toBe(model.family)
    }
  })

  it.each(ISLE_FEATURES)('change on the island that carries the %s feature', (feature) => {
    expect(world.landmarks.some((landmark) => landmark.features.includes(feature))).toBe(true)
    expect(propVertices(buildSky(withoutFeature(feature), grid, map))).toBeLessThan(
      propVertices(sky),
    )
  })
})
