import { describe, expect, it } from 'vitest'

import {
  AIRSHIP_PROTOTYPE,
  LOCOMOTIVE_PROTOTYPE,
  type MeshData,
  SHIP_PROTOTYPE,
  VEHICLE_PROTOTYPES,
  WAGON_PROTOTYPES,
} from '../../src/lib/atlas/contract/scene'
import { packProp } from '../../src/lib/atlas/kernel/builder'
import { PROP_KIND } from '../../src/lib/atlas/kernel/kinds'
import { worldTree } from '../../src/lib/atlas/kernel/models/landmarks'
import {
  buildPrototype,
  DWARF_HALLS,
  HOUSE_VARIANTS,
  hasPrototype,
  PEAKS,
  prototypeKey,
} from '../../src/lib/atlas/kernel/prototypes'
import { BUILDING_STYLES, type BuildingStyle } from '../../src/lib/atlas/vocabulary'

const NAMED_PROTOTYPES = [
  'oak',
  'pine',
  'palm',
  'jungle',
  'acacia',
  'bush',
  'dead',
  'cactus',
  'mushroom',
  'crystal',
  'reeds',
  'coral',
  'rock',
  'boulder',
  'serac',
  'basalt',
  'hoodoo',
  'hay',
  'peak-volcanic',
  'farmhouse',
  'barn',
  'windmill',
  'blades',
  'boat',
  'pier',
  'lantern',
  'sleeper',
  'trestle',
  'pylon',
  'signpost',
  'cairn',
  'stalagmites',
  'column',
  'mine-head',
  'mine-rail',
  'ice-spikes',
  'crypt',
  'roots',
  'brazier',
  'lamp',
  'lake-boat',
] as const

const peakKeys = Array.from({ length: PEAKS }, (_, index) => prototypeKey.peak(index + 1))
const styleKeys = (style: BuildingStyle) => [
  ...Array.from({ length: HOUSE_VARIANTS }, (_, variant) => prototypeKey.house(style, variant)),
  prototypeKey.tower(style, 1),
  prototypeKey.tower(style, 2),
  prototypeKey.temple(style),
  prototypeKey.hall(style),
  prototypeKey.wall(style),
  prototypeKey.wallTower(style),
]
const KEYS = [
  ...NAMED_PROTOTYPES,
  ...VEHICLE_PROTOTYPES,
  ...peakKeys,
  ...Array.from({ length: DWARF_HALLS }, (_, index) => prototypeKey.dwarfHall(index)),
  ...BUILDING_STYLES.flatMap(styleKeys),
]

const PACKED_UNIT = 127
const KNOWN_KINDS: ReadonlySet<number> = new Set(Object.values(PROP_KIND))

const vertexCount = (mesh: MeshData) => mesh.positions.length / 3
const triangles = (mesh: MeshData) => mesh.indices.length / 3
const lodsOf = (key: string) => buildPrototype(key).lods
const trianglesOf = (key: string) => lodsOf(key).map(triangles)
const kindAt = (mesh: MeshData, vertex: number) => mesh.bytes?.[vertex * 4 + 3] ?? -1

type TreeBudget = { closest: number; overview: number; middle?: number }

const TREE_BUDGETS: Record<string, TreeBudget> = {
  pine: { closest: 168, overview: 32 },
  oak: { closest: 688, overview: 60 },
  bush: { closest: 216, overview: 16 },
  jungle: { closest: 584, overview: 44 },
  palm: { closest: 936, middle: 200, overview: 80 },
  acacia: { closest: 392, overview: 60 },
}

const BUILDING_GROWTH = 2.5
const FORMER_BUILDING_TRIANGLES: Record<string, number> = {
  farmhouse: 30,
  barn: 48,
  ...formerStyle('aubemont', [48, 60, 60, 30, 42], 116, 102, 18),
  ...formerStyle('nordhal', [42, 42, 42, 42, 60], 104, 102, 210),
  ...formerStyle('orsalis', [36, 36, 36, 36, 126], 182, 574, 18),
  ...formerStyle('corsaille', [48, 60, 60, 30, 42], 116, 102, 18),
  ...formerStyle('mountain', [42, 42, 42, 42, 60], 116, 102, 18),
  ...formerStyle('nordic', [48, 60, 60, 30, 42], 116, 102, 18),
}

function formerStyle(
  style: BuildingStyle,
  houses: readonly number[],
  tower: number,
  temple: number,
  hall: number,
): Record<string, number> {
  return Object.fromEntries([
    ...houses.map((count, variant) => [prototypeKey.house(style, variant), count] as const),
    [prototypeKey.tower(style, 1), tower],
    [prototypeKey.tower(style, 2), tower],
    [prototypeKey.temple(style), temple],
    [prototypeKey.hall(style), hall],
  ])
}

const VEHICLE_BUDGETS: Record<string, number> = {
  [SHIP_PROTOTYPE]: 1500,
  [AIRSHIP_PROTOTYPE]: 2000,
  [LOCOMOTIVE_PROTOTYPE]: 1200,
  ...Object.fromEntries(WAGON_PROTOTYPES.map((key) => [key, 400] as const)),
}

const FORMER_PEAK_VERTICES = [4320, 1584, 768] as const
const FORMER_WORLD_TREE_TRIANGLES = 59568

function expectSoundMesh(mesh: MeshData): void {
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

describe('the prop prototypes', () => {
  it('are registered under every key the kernels ask for', () => {
    for (const key of KEYS) expect(hasPrototype(key), key).toBe(true)
  })

  it('write finite positions, indices inside their mesh and packed normals of unit length', () => {
    for (const key of KEYS) for (const lod of lodsOf(key)) expectSoundMesh(lod)
  })

  it('tag every vertex with a known prop kind', () => {
    for (const key of KEYS) {
      for (const lod of lodsOf(key)) {
        for (let vertex = 0; vertex < vertexCount(lod); vertex++) {
          expect(KNOWN_KINDS.has(kindAt(lod, vertex)), key).toBe(true)
        }
      }
    }
  })

  it('never gain triangles from one detail level to the next', () => {
    for (const key of KEYS) {
      const counts = trianglesOf(key)
      for (let level = 1; level < counts.length; level++) {
        expect(counts[level] ?? 0, key).toBeLessThanOrEqual(counts[level - 1] ?? 0)
      }
    }
  })

  it('spin every rotor part about the local z axis through the model origin', () => {
    for (const key of KEYS) {
      for (const lod of lodsOf(key)) {
        let x = 0
        let y = 0
        let rotors = 0
        for (let vertex = 0; vertex < vertexCount(lod); vertex++) {
          if (kindAt(lod, vertex) !== PROP_KIND.rotor) continue
          x += lod.positions[vertex * 3] ?? 0
          y += lod.positions[vertex * 3 + 1] ?? 0
          rotors++
        }
        if (rotors === 0) continue
        expect(Math.abs(x / rotors), key).toBeLessThan(1e-3)
        expect(Math.abs(y / rotors), key).toBeLessThan(1e-3)
      }
    }
  })
})

describe('the prop budgets', () => {
  it('keep each tree inside its close range and overview triangle budgets', () => {
    for (const [key, budget] of Object.entries(TREE_BUDGETS)) {
      const [closest = 0, middle = 0, overview = 0] = trianglesOf(key)
      expect(closest, key).toBeLessThanOrEqual(budget.closest)
      expect(overview, key).toBeLessThanOrEqual(budget.overview)
      if (budget.middle !== undefined) expect(middle, key).toBeLessThanOrEqual(budget.middle)
    }
  })

  it('keep houses, towers, temples and halls within two and a half times their former triangles', () => {
    for (const [key, former] of Object.entries(FORMER_BUILDING_TRIANGLES)) {
      expect(trianglesOf(key)[0] ?? 0, key).toBeLessThanOrEqual(former * BUILDING_GROWTH)
    }
  })

  it('keep each vehicle inside its triangle budget', () => {
    for (const [key, budget] of Object.entries(VEHICLE_BUDGETS)) {
      expect(trianglesOf(key)[0] ?? 0, key).toBeLessThanOrEqual(budget)
    }
  })

  it('draw every peak with fewer vertices than before at each detail level', () => {
    for (const key of [...peakKeys, 'peak-volcanic']) {
      for (const [level, lod] of lodsOf(key).entries()) {
        expect(vertexCount(lod), key).toBeLessThan(FORMER_PEAK_VERTICES[level] ?? 0)
      }
    }
  })

  it('build the World Tree as a sound mesh with fewer triangles than before', () => {
    const tree = packProp(worldTree(() => 0))
    expectSoundMesh(tree)
    expect(triangles(tree)).toBeLessThan(FORMER_WORLD_TREE_TRIANGLES)
  })
})
