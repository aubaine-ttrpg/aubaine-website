import { createNoise } from '../../world/noise.ts'
import type { PropBuilder } from '../builder.ts'
import { compose, type EulerOrder, type Matrix } from '../matrix.ts'
import {
  box as boxShape,
  cone as coneShape,
  cylinder,
  icosahedron,
  type Shape,
  sphere,
} from '../primitives.ts'

export type Detail = 0 | 1 | 2

export type Vec3 = [number, number, number]

export function at(
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
  sx = 1,
  sy = sx,
  sz = sx,
  order: EulerOrder = 'XYZ',
): Matrix {
  return compose({ x, y, z, rx, ry, rz, sx, sy, sz, order })
}

export const cyl = (
  top: number,
  bottom: number,
  height: number,
  radial = 7,
  rows = 1,
  open = false,
): Shape => cylinder(top, bottom, height, radial, rows, open)
export const box = (width: number, height: number, depth: number): Shape =>
  boxShape(width, height, depth)
export const ball = (width = 8, height = 6): Shape => sphere(1, width, height)
export const cone = (radius: number, height: number, radial = 8, rows = 1): Shape =>
  coneShape(radius, height, radial, rows)
export const ico = (detail = 1): Shape => icosahedron(1, detail)

const TUBE_NOISE_SEED = 4242
const tubeNoise = createNoise(TUBE_NOISE_SEED)

export function tube(
  builder: PropBuilder,
  points: readonly Vec3[],
  radii: readonly number[],
  colour: string,
  kind: number,
  sides = 8,
  jitter = 0,
): void {
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  let previous: Vec3 = [1, 0, 0]
  for (const [k, point] of points.entries()) {
    const next = points[Math.min(points.length - 1, k + 1)] ?? point
    const before = points[Math.max(0, k - 1)] ?? point
    let tx = next[0] - before[0]
    let ty = next[1] - before[1]
    let tz = next[2] - before[2]
    const tl = Math.hypot(tx, ty, tz) || 1
    tx /= tl
    ty /= tl
    tz /= tl
    const dot = previous[0] * tx + previous[1] * ty + previous[2] * tz
    let nx = previous[0] - tx * dot
    let ny = previous[1] - ty * dot
    let nz = previous[2] - tz * dot
    if (nx * nx + ny * ny + nz * nz < 1e-6) {
      nx = tz
      ny = 0
      nz = -tx
    }
    const nl = Math.hypot(nx, ny, nz) || 1
    nx /= nl
    ny /= nl
    nz /= nl
    previous = [nx, ny, nz]
    const bx = ty * nz - tz * ny
    const by = tz * nx - tx * nz
    const bz = tx * ny - ty * nx
    for (let s = 0; s <= sides; s++) {
      const angle = (s / sides) * Math.PI * 2
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const wobble = jitter
        ? tubeNoise.n2(point[0] * 5 + s * 0.7, point[1] * 5 + k * 0.3) * jitter
        : 0
      const radius = (radii[k] ?? 0) * (1 + wobble)
      const dx = nx * cos + bx * sin
      const dy = ny * cos + by * sin
      const dz = nz * cos + bz * sin
      positions.push(point[0] + dx * radius, point[1] + dy * radius, point[2] + dz * radius)
      normals.push(dx, dy, dz)
    }
  }
  for (let k = 0; k < points.length - 1; k++) {
    for (let s = 0; s < sides; s++) {
      const a = k * (sides + 1) + s
      const c = a + sides + 1
      indices.push(a, c, a + 1, a + 1, c, c + 1)
    }
  }
  builder.raw(positions, normals, colour, kind, indices)
}

export const IDENTITY = at()

export function faceted(): Shape {
  return { positions: [], normals: [], indices: [], indexed: false }
}

export function facet(target: Shape, corners: readonly Vec3[], outward: Vec3): void {
  let nx = 0
  let ny = 0
  let nz = 0
  for (const [k, p] of corners.entries()) {
    const q = corners[(k + 1) % corners.length] ?? p
    nx += (p[1] - q[1]) * (p[2] + q[2])
    ny += (p[2] - q[2]) * (p[0] + q[0])
    nz += (p[0] - q[0]) * (p[1] + q[1])
  }
  const facing = nx * outward[0] + ny * outward[1] + nz * outward[2]
  const ordered = facing >= 0 ? corners : [...corners].reverse()
  const [first] = ordered
  if (!first) return
  for (let k = 1; k < ordered.length - 1; k++) {
    for (const p of [first, ordered[k] ?? first, ordered[k + 1] ?? first]) {
      target.positions.push(p[0], p[1], p[2])
      target.normals.push(outward[0], outward[1], outward[2])
    }
  }
}

export function twoSided(front: Shape): Shape {
  const count = front.positions.length / 3
  const back: number[] = []
  for (let k = 0; k < front.indices.length; k += 3) {
    back.push(
      (front.indices[k] ?? 0) + count,
      (front.indices[k + 2] ?? 0) + count,
      (front.indices[k + 1] ?? 0) + count,
    )
  }
  return {
    positions: [...front.positions, ...front.positions],
    normals: [...front.normals, ...front.normals.map((value) => -value)],
    indices: [...front.indices, ...back],
    indexed: true,
  }
}
