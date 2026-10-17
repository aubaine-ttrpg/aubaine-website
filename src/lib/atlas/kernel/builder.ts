import type { MeshData } from '../contract/scene.ts'
import { createNoise } from '../world/noise.ts'
import { type Matrix, normalMatrix, transformNormal, transformPoint } from './matrix.ts'
import { emptyBounds, expand, NORMAL_SIZE, snorm } from './mesh.ts'
import type { Shape } from './primitives.ts'

export type PropGeometry = {
  positions: Float32Array
  normals: Float32Array
  flutter: Float32Array
  colours: Uint8Array
  indices: Uint32Array
}

export type ClothPin = 'left' | 'right' | 'top'

const CLOTH_PINS: Record<ClothPin, { axis: 0 | 1; edge: 'low' | 'high' }> = {
  left: { axis: 0, edge: 'low' },
  right: { axis: 0, edge: 'high' },
  top: { axis: 1, edge: 'high' },
}

const JITTER_SEED = 4242
const jitterNoise = createNoise(JITTER_SEED)

function hexBytes(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export type ShapeOptions = {
  jitter?: number
  seed?: number
  flat?: boolean
  pinned?: ClothPin | undefined
}

function clothReach(source: Shape, placement: Matrix, pinned: ClothPin | undefined): Float32Array {
  const count = source.positions.length / 3
  const reach = new Float32Array(count)
  if (!pinned) return reach
  const { axis, edge } = CLOTH_PINS[pinned]
  let low = Number.POSITIVE_INFINITY
  let high = Number.NEGATIVE_INFINITY
  for (let i = 0; i < count; i++) {
    const value = source.positions[i * 3 + axis] ?? 0
    low = Math.min(low, value)
    high = Math.max(high, value)
  }
  const scale = Math.hypot(
    placement[axis * 4] ?? 0,
    placement[axis * 4 + 1] ?? 0,
    placement[axis * 4 + 2] ?? 0,
  )
  for (let i = 0; i < count; i++) {
    const value = source.positions[i * 3 + axis] ?? 0
    reach[i] = (edge === 'low' ? value - low : high - value) * scale
  }
  return reach
}

function volumeScale(m: Matrix): number {
  const determinant =
    (m[0] ?? 0) * ((m[5] ?? 0) * (m[10] ?? 0) - (m[9] ?? 0) * (m[6] ?? 0)) -
    (m[4] ?? 0) * ((m[1] ?? 0) * (m[10] ?? 0) - (m[9] ?? 0) * (m[2] ?? 0)) +
    (m[8] ?? 0) * ((m[1] ?? 0) * (m[6] ?? 0) - (m[5] ?? 0) * (m[2] ?? 0))
  return Math.cbrt(Math.abs(determinant))
}

export class PropBuilder {
  private readonly positions: number[] = []
  private readonly normals: number[] = []
  private readonly flutter: number[] = []
  private readonly colours: number[] = []
  private readonly indices: number[] = []

  get vertexCount(): number {
    return this.positions.length / 3
  }

  add(
    source: Shape,
    placement: Matrix,
    colour: string,
    kind: number,
    options: ShapeOptions = {},
  ): this {
    const { jitter = 0, seed = 0, flat = false, pinned } = options
    const normal = normalMatrix(placement)
    const reach = clothReach(source, placement, pinned)
    const [r, g, b] = hexBytes(colour)
    const base = this.vertexCount
    const count = source.positions.length / 3
    for (let i = 0; i < count; i++) {
      let x = source.positions[i * 3] ?? 0
      let y = source.positions[i * 3 + 1] ?? 0
      let z = source.positions[i * 3 + 2] ?? 0
      const nx = source.normals[i * 3] ?? 0
      const ny = source.normals[i * 3 + 1] ?? 0
      const nz = source.normals[i * 3 + 2] ?? 0
      if (jitter) {
        const push =
          jitterNoise.n2(x * 3.1 + seed * 7.7 + z * 1.3, y * 3.3 - z * 2.1 + seed) * jitter
        x += nx * push
        y += ny * push
        z += nz * push
      }
      const [px, py, pz] = transformPoint(placement, x, y, z)
      const [tx, ty, tz] = transformNormal(normal, nx, ny, nz)
      this.positions.push(px, py, pz)
      this.normals.push(tx, ty, tz)
      this.flutter.push(reach[i] ?? 0)
      this.colours.push(r, g, b, kind)
    }
    if (source.indexed) for (const index of source.indices) this.indices.push(base + index)
    else for (let i = 0; i < count; i++) this.indices.push(base + i)
    if (flat && !source.indexed) {
      for (let t = 0; t < count; t += 3) {
        const o = (base + t) * 3
        const ax = this.positions[o] ?? 0
        const ay = this.positions[o + 1] ?? 0
        const az = this.positions[o + 2] ?? 0
        const ux = (this.positions[o + 3] ?? 0) - ax
        const uy = (this.positions[o + 4] ?? 0) - ay
        const uz = (this.positions[o + 5] ?? 0) - az
        const vx = (this.positions[o + 6] ?? 0) - ax
        const vy = (this.positions[o + 7] ?? 0) - ay
        const vz = (this.positions[o + 8] ?? 0) - az
        let fx = uy * vz - uz * vy
        let fy = uz * vx - ux * vz
        let fz = ux * vy - uy * vx
        const length = Math.hypot(fx, fy, fz) || 1
        fx /= length
        fy /= length
        fz /= length
        for (let q = 0; q < 3; q++) {
          this.normals[o + q * 3] = fx
          this.normals[o + q * 3 + 1] = fy
          this.normals[o + q * 3 + 2] = fz
        }
      }
    }
    return this
  }

  merge(source: PropGeometry, placement: Matrix): this {
    const normal = normalMatrix(placement)
    const scale = volumeScale(placement)
    const base = this.vertexCount
    const count = source.positions.length / 3
    for (let i = 0; i < count; i++) {
      const [px, py, pz] = transformPoint(
        placement,
        source.positions[i * 3] ?? 0,
        source.positions[i * 3 + 1] ?? 0,
        source.positions[i * 3 + 2] ?? 0,
      )
      const [nx, ny, nz] = transformNormal(
        normal,
        source.normals[i * 3] ?? 0,
        source.normals[i * 3 + 1] ?? 0,
        source.normals[i * 3 + 2] ?? 0,
      )
      this.positions.push(px, py, pz)
      this.normals.push(nx, ny, nz)
      this.flutter.push((source.flutter[i] ?? 0) * scale)
      this.colours.push(
        source.colours[i * 4] ?? 0,
        source.colours[i * 4 + 1] ?? 0,
        source.colours[i * 4 + 2] ?? 0,
        source.colours[i * 4 + 3] ?? 0,
      )
    }
    for (const index of source.indices) this.indices.push(base + index)
    return this
  }

  raw(
    positions: readonly number[],
    normals: readonly number[],
    colour: string,
    kind: number,
    indices: readonly number[],
  ): this {
    const [r, g, b] = hexBytes(colour)
    const base = this.vertexCount
    for (let i = 0; i < positions.length / 3; i++) {
      this.positions.push(
        positions[i * 3] ?? 0,
        positions[i * 3 + 1] ?? 0,
        positions[i * 3 + 2] ?? 0,
      )
      this.normals.push(normals[i * 3] ?? 0, normals[i * 3 + 1] ?? 1, normals[i * 3 + 2] ?? 0)
      this.flutter.push(0)
      this.colours.push(r, g, b, kind)
    }
    for (const index of indices) this.indices.push(base + index)
    return this
  }

  geometry(): PropGeometry {
    return {
      positions: Float32Array.from(this.positions),
      normals: Float32Array.from(this.normals),
      flutter: Float32Array.from(this.flutter),
      colours: Uint8Array.from(this.colours),
      indices: Uint32Array.from(this.indices),
    }
  }
}

export function packProp(geometry: PropGeometry): MeshData {
  const count = geometry.positions.length / 3
  const normals = new Int8Array(count * NORMAL_SIZE)
  const bounds = emptyBounds()
  for (let i = 0; i < count; i++) {
    const nx = geometry.normals[i * 3] ?? 0
    const ny = geometry.normals[i * 3 + 1] ?? 0
    const nz = geometry.normals[i * 3 + 2] ?? 0
    const length = Math.hypot(nx, ny, nz) || 1
    normals[i * NORMAL_SIZE] = snorm(nx / length)
    normals[i * NORMAL_SIZE + 1] = snorm(ny / length)
    normals[i * NORMAL_SIZE + 2] = snorm(nz / length)
    normals[i * NORMAL_SIZE + 3] = snorm(geometry.flutter[i] ?? 0)
    expand(
      bounds,
      geometry.positions[i * 3] ?? 0,
      geometry.positions[i * 3 + 1] ?? 0,
      geometry.positions[i * 3 + 2] ?? 0,
    )
  }
  return {
    positions: geometry.positions.slice(),
    normals,
    bytes: geometry.colours.slice(),
    floats: undefined,
    floatSize: 0,
    indices: count > 65535 ? geometry.indices.slice() : Uint16Array.from(geometry.indices),
    bounds,
  }
}
