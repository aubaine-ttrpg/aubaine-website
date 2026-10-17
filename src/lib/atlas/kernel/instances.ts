import type { Bounds, PropRange, PropSet, Rgb, SceneLayer } from '../contract/scene.ts'
import { srgbBytes, WHITE } from './colour.ts'
import { compose, type Placement } from './matrix.ts'
import { emptyBounds, expand } from './mesh.ts'
import { prototypeBounds } from './prototypes.ts'

type Entry = { matrix: Float64Array; tint: Rgb; rank: number }

type Group = {
  prototype: string
  layer: SceneLayer
  thinned: boolean
  cell: number | undefined
  entries: Entry[]
}

export type InstanceOptions = { tint?: Rgb; rank?: number; thinned?: boolean; cell?: number }

const MATRIX = 16
const CORNERS = 8

function placedBounds(target: Bounds, local: Bounds, matrix: Float64Array): void {
  for (let corner = 0; corner < CORNERS; corner++) {
    const x = corner & 1 ? local[3] : local[0]
    const y = corner & 2 ? local[4] : local[1]
    const z = corner & 4 ? local[5] : local[2]
    expand(
      target,
      (matrix[0] ?? 0) * x + (matrix[4] ?? 0) * y + (matrix[8] ?? 0) * z + (matrix[12] ?? 0),
      (matrix[1] ?? 0) * x + (matrix[5] ?? 0) * y + (matrix[9] ?? 0) * z + (matrix[13] ?? 0),
      (matrix[2] ?? 0) * x + (matrix[6] ?? 0) * y + (matrix[10] ?? 0) * z + (matrix[14] ?? 0),
    )
  }
}

function setOf(group: Group, range: PropRange): PropSet {
  const entries = [...group.entries].sort((a, b) => a.rank - b.rank)
  const matrices = new Float32Array(entries.length * MATRIX)
  const tints = new Uint8Array(entries.length * 4)
  const bounds = emptyBounds()
  const local = prototypeBounds(group.prototype)
  for (const [index, entry] of entries.entries()) {
    matrices.set(entry.matrix, index * MATRIX)
    const [r, g, b] = srgbBytes(entry.tint)
    tints[index * 4] = r
    tints[index * 4 + 1] = g
    tints[index * 4 + 2] = b
    tints[index * 4 + 3] = 255
    placedBounds(bounds, local, entry.matrix)
  }
  const { prototype, layer, thinned } = group
  return { prototype, layer, range, matrices, tints, thinned, bounds }
}

export class InstanceBatch {
  private readonly groups = new Map<string, Group>()

  add(
    prototype: string,
    layer: SceneLayer,
    placement: Placement,
    options: InstanceOptions = {},
  ): void {
    this.place(prototype, layer, compose(placement), options)
  }

  place(
    prototype: string,
    layer: SceneLayer,
    matrix: Float64Array,
    options: InstanceOptions = {},
  ): void {
    const key = `${layer}|${prototype}|${options.cell ?? ''}`
    let group = this.groups.get(key)
    if (!group) {
      group = {
        prototype,
        layer,
        thinned: options.thinned ?? false,
        cell: options.cell,
        entries: [],
      }
      this.groups.set(key, group)
    }
    group.entries.push({
      matrix,
      tint: options.tint ?? WHITE,
      rank: options.rank ?? group.entries.length,
    })
  }

  prototypes(): Set<string> {
    return new Set([...this.groups.values()].map((group) => group.prototype))
  }

  get size(): number {
    let count = 0
    for (const group of this.groups.values()) count += group.entries.length
    return count
  }

  sets(): PropSet[] {
    const sets: PropSet[] = []
    const wholeMap = new Map<string, Group>()
    for (const group of this.groups.values()) {
      if (group.cell === undefined) {
        sets.push(setOf(group, 'always'))
        continue
      }
      sets.push(setOf(group, 'near'))
      const key = `${group.layer}|${group.prototype}`
      const merged = wholeMap.get(key)
      if (merged) merged.entries.push(...group.entries)
      else wholeMap.set(key, { ...group, cell: undefined, entries: [...group.entries] })
    }
    for (const group of wholeMap.values()) sets.push(setOf(group, 'far'))
    return sets
  }
}
