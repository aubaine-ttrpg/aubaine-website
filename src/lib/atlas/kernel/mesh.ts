import type { Bounds, MeshData } from '../contract/scene.ts'

export type MeshLayout = { bytes: boolean; floats: number }

export const POSITIONS_ONLY: MeshLayout = { bytes: false, floats: 0 }
export const RIBBON_LAYOUT: MeshLayout = { bytes: false, floats: 2 }

const SNORM = 127
export const NORMAL_SIZE = 4
export const BYTE_SIZE = 4

export function emptyBounds(): Bounds {
  return [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ]
}

export function expand(bounds: Bounds, x: number, y: number, z: number): void {
  if (x < bounds[0]) bounds[0] = x
  if (y < bounds[1]) bounds[1] = y
  if (z < bounds[2]) bounds[2] = z
  if (x > bounds[3]) bounds[3] = x
  if (y > bounds[4]) bounds[4] = y
  if (z > bounds[5]) bounds[5] = z
}

export function snorm(value: number): number {
  return Math.round(Math.min(1, Math.max(-1, value)) * SNORM)
}

export function unorm(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
}

class Growing<T extends Float32Array | Int8Array | Uint8Array | Uint32Array> {
  data: T
  length = 0
  private readonly make: (size: number) => T

  constructor(make: (size: number) => T, capacity: number) {
    this.make = make
    this.data = make(capacity)
  }

  reserve(extra: number): void {
    const needed = this.length + extra
    if (needed <= this.data.length) return
    let capacity = this.data.length * 2
    while (capacity < needed) capacity *= 2
    const next = this.make(capacity)
    next.set(this.data.subarray(0, this.length))
    this.data = next
  }

  trimmed(): T {
    const out = this.make(this.length)
    out.set(this.data.subarray(0, this.length))
    return out
  }
}

export class MeshWriter {
  private readonly positions = new Growing((size) => new Float32Array(size), 3 * 1024)
  private readonly normals = new Growing((size) => new Int8Array(size), NORMAL_SIZE * 1024)
  private readonly byteData: Growing<Uint8Array> | undefined
  private readonly floatData: Growing<Float32Array> | undefined
  private readonly indices = new Growing((size) => new Uint32Array(size), 3 * 1024)
  readonly floatSize: number
  readonly bounds = emptyBounds()

  constructor(layout: MeshLayout) {
    this.floatSize = layout.floats
    if (layout.bytes) this.byteData = new Growing((size) => new Uint8Array(size), BYTE_SIZE * 1024)
    if (layout.floats > 0)
      this.floatData = new Growing((size) => new Float32Array(size), layout.floats * 1024)
  }

  get vertexCount(): number {
    return this.positions.length / 3
  }

  get indexCount(): number {
    return this.indices.length
  }

  vertex(x: number, y: number, z: number, nx: number, ny: number, nz: number): number {
    const index = this.vertexCount
    this.positions.reserve(3)
    const p = this.positions.data
    const at = this.positions.length
    p[at] = x
    p[at + 1] = y
    p[at + 2] = z
    this.positions.length += 3
    expand(this.bounds, x, y, z)
    this.normals.reserve(NORMAL_SIZE)
    const n = this.normals.data
    const length = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
    const o = this.normals.length
    n[o] = snorm(nx / length)
    n[o + 1] = snorm(ny / length)
    n[o + 2] = snorm(nz / length)
    n[o + 3] = 0
    this.normals.length += NORMAL_SIZE
    return index
  }

  bytes(a: number, b: number, c: number, d: number): void {
    const target = this.byteData
    if (!target) throw new Error('this mesh has no byte attribute')
    target.reserve(BYTE_SIZE)
    const o = target.length
    target.data[o] = a
    target.data[o + 1] = b
    target.data[o + 2] = c
    target.data[o + 3] = d
    target.length += BYTE_SIZE
  }

  float(value: number): void {
    const target = this.floatData
    if (!target) throw new Error('this mesh has no float attribute')
    target.reserve(1)
    target.data[target.length] = value
    target.length += 1
  }

  triangle(a: number, b: number, c: number): void {
    this.indices.reserve(3)
    const i = this.indices.data
    const o = this.indices.length
    i[o] = a
    i[o + 1] = b
    i[o + 2] = c
    this.indices.length += 3
  }

  build(): MeshData {
    const count = this.vertexCount
    const raw = this.indices.data.subarray(0, this.indices.length)
    return {
      positions: this.positions.trimmed(),
      normals: this.normals.trimmed(),
      bytes: this.byteData?.trimmed(),
      floats: this.floatData?.trimmed(),
      floatSize: this.floatSize,
      indices: count > 65535 ? raw.slice() : Uint16Array.from(raw),
      bounds: [...this.bounds],
    }
  }
}
