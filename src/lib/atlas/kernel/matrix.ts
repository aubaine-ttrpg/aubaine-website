export type Matrix = Float64Array

export type EulerOrder = 'XYZ' | 'YZX'

export type Placement = {
  x?: number
  y?: number
  z?: number
  rx?: number
  ry?: number
  rz?: number
  sx?: number
  sy?: number
  sz?: number
  order?: EulerOrder
}

export function compose(placement: Placement = {}): Matrix {
  const { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, order = 'XYZ' } = placement
  const sx = placement.sx ?? 1
  const sy = placement.sy ?? sx
  const sz = placement.sz ?? sx
  const a = Math.cos(rx)
  const b = Math.sin(rx)
  const c = Math.cos(ry)
  const d = Math.sin(ry)
  const e = Math.cos(rz)
  const f = Math.sin(rz)
  const m = new Float64Array(16)
  if (order === 'XYZ') {
    const ae = a * e
    const af = a * f
    const be = b * e
    const bf = b * f
    m[0] = c * e
    m[4] = -c * f
    m[8] = d
    m[1] = af + be * d
    m[5] = ae - bf * d
    m[9] = -b * c
    m[2] = bf - ae * d
    m[6] = be + af * d
    m[10] = a * c
  } else {
    const ac = a * c
    const ad = a * d
    const bc = b * c
    const bd = b * d
    m[0] = c * e
    m[4] = bd - ac * f
    m[8] = bc * f + ad
    m[1] = f
    m[5] = a * e
    m[9] = -b * e
    m[2] = -d * e
    m[6] = ad * f + bc
    m[10] = ac - bd * f
  }
  for (let row = 0; row < 3; row++) {
    m[row] = (m[row] ?? 0) * sx
    m[4 + row] = (m[4 + row] ?? 0) * sy
    m[8 + row] = (m[8 + row] ?? 0) * sz
  }
  m[12] = x
  m[13] = y
  m[14] = z
  m[15] = 1
  return m
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  const out = new Float64Array(16)
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0
      for (let k = 0; k < 4; k++) sum += (a[k * 4 + row] ?? 0) * (b[column * 4 + k] ?? 0)
      out[column * 4 + row] = sum
    }
  }
  return out
}

export function normalMatrix(m: Matrix): Float64Array {
  const a00 = m[0] ?? 0
  const a01 = m[1] ?? 0
  const a02 = m[2] ?? 0
  const a10 = m[4] ?? 0
  const a11 = m[5] ?? 0
  const a12 = m[6] ?? 0
  const a20 = m[8] ?? 0
  const a21 = m[9] ?? 0
  const a22 = m[10] ?? 0
  const b01 = a22 * a11 - a12 * a21
  const b11 = -a22 * a10 + a12 * a20
  const b21 = a21 * a10 - a11 * a20
  const det = a00 * b01 + a01 * b11 + a02 * b21
  const inv = det === 0 ? 0 : 1 / det
  return Float64Array.of(
    b01 * inv,
    b11 * inv,
    b21 * inv,
    (-a22 * a01 + a02 * a21) * inv,
    (a22 * a00 - a02 * a20) * inv,
    (-a21 * a00 + a01 * a20) * inv,
    (a12 * a01 - a02 * a11) * inv,
    (-a12 * a00 + a02 * a10) * inv,
    (a11 * a00 - a01 * a10) * inv,
  )
}

export type Vec3 = [number, number, number]

export function transformPoint(m: Matrix, x: number, y: number, z: number): Vec3 {
  return [
    (m[0] ?? 0) * x + (m[4] ?? 0) * y + (m[8] ?? 0) * z + (m[12] ?? 0),
    (m[1] ?? 0) * x + (m[5] ?? 0) * y + (m[9] ?? 0) * z + (m[13] ?? 0),
    (m[2] ?? 0) * x + (m[6] ?? 0) * y + (m[10] ?? 0) * z + (m[14] ?? 0),
  ]
}

export function transformNormal(n: Float64Array, x: number, y: number, z: number): Vec3 {
  const nx = (n[0] ?? 0) * x + (n[3] ?? 0) * y + (n[6] ?? 0) * z
  const ny = (n[1] ?? 0) * x + (n[4] ?? 0) * y + (n[7] ?? 0) * z
  const nz = (n[2] ?? 0) * x + (n[5] ?? 0) * y + (n[8] ?? 0) * z
  const length = Math.hypot(nx, ny, nz)
  return length < 1e-12 ? [0, 1, 0] : [nx / length, ny / length, nz / length]
}
