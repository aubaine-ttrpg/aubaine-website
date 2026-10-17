export type Shape = {
  positions: number[]
  normals: number[]
  indices: number[]
  indexed: boolean
}

const TAU = Math.PI * 2

function shape(indexed = true): Shape {
  return { positions: [], normals: [], indices: [], indexed }
}

function vertex(
  target: Shape,
  x: number,
  y: number,
  z: number,
  nx: number,
  ny: number,
  nz: number,
): number {
  const index = target.positions.length / 3
  target.positions.push(x, y, z)
  target.normals.push(nx, ny, nz)
  return index
}

export function cylinder(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  radialSegments = 8,
  heightSegments = 1,
  openEnded = false,
): Shape {
  const out = shape()
  const half = height / 2
  const slope = (radiusBottom - radiusTop) / height
  const rows: number[][] = []
  for (let y = 0; y <= heightSegments; y++) {
    const v = y / heightSegments
    const radius = v * (radiusBottom - radiusTop) + radiusTop
    const row: number[] = []
    for (let x = 0; x <= radialSegments; x++) {
      const theta = (x / radialSegments) * TAU
      const sin = Math.sin(theta)
      const cos = Math.cos(theta)
      const length = Math.hypot(sin, slope, cos)
      row.push(
        vertex(
          out,
          radius * sin,
          -v * height + half,
          radius * cos,
          sin / length,
          slope / length,
          cos / length,
        ),
      )
    }
    rows.push(row)
  }
  for (let x = 0; x < radialSegments; x++) {
    for (let y = 0; y < heightSegments; y++) {
      const a = rows[y]?.[x] ?? 0
      const b = rows[y + 1]?.[x] ?? 0
      const c = rows[y + 1]?.[x + 1] ?? 0
      const d = rows[y]?.[x + 1] ?? 0
      if (radiusTop > 0 || y !== 0) out.indices.push(a, b, d)
      if (radiusBottom > 0 || y !== heightSegments - 1) out.indices.push(b, c, d)
    }
  }
  if (!openEnded) {
    for (const top of [true, false]) {
      const radius = top ? radiusTop : radiusBottom
      if (radius <= 0) continue
      const sign = top ? 1 : -1
      const y = half * sign
      const centres: number[] = []
      for (let x = 0; x < radialSegments; x++) centres.push(vertex(out, 0, y, 0, 0, sign, 0))
      const ring: number[] = []
      for (let x = 0; x <= radialSegments; x++) {
        const theta = (x / radialSegments) * TAU
        ring.push(vertex(out, radius * Math.sin(theta), y, radius * Math.cos(theta), 0, sign, 0))
      }
      for (let x = 0; x < radialSegments; x++) {
        const c = centres[x] ?? 0
        const r0 = ring[x] ?? 0
        const r1 = ring[x + 1] ?? 0
        if (top) out.indices.push(r0, r1, c)
        else out.indices.push(r1, r0, c)
      }
    }
  }
  return out
}

export function cone(
  radius: number,
  height: number,
  radialSegments = 8,
  heightSegments = 1,
): Shape {
  return cylinder(0, radius, height, radialSegments, heightSegments)
}

export function sphere(
  radius = 1,
  widthSegments = 8,
  heightSegments = 6,
  phiStart = 0,
  phiLength = TAU,
  thetaStart = 0,
  thetaLength = Math.PI,
): Shape {
  const out = shape()
  const thetaEnd = Math.min(thetaStart + thetaLength, Math.PI)
  const grid: number[][] = []
  for (let iy = 0; iy <= heightSegments; iy++) {
    const v = iy / heightSegments
    const row: number[] = []
    for (let ix = 0; ix <= widthSegments; ix++) {
      const u = ix / widthSegments
      const phi = phiStart + u * phiLength
      const theta = thetaStart + v * thetaLength
      const x = -Math.cos(phi) * Math.sin(theta)
      const y = Math.cos(theta)
      const z = Math.sin(phi) * Math.sin(theta)
      row.push(vertex(out, x * radius, y * radius, z * radius, x, y, z))
    }
    grid.push(row)
  }
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = grid[iy]?.[ix + 1] ?? 0
      const b = grid[iy]?.[ix] ?? 0
      const c = grid[iy + 1]?.[ix] ?? 0
      const d = grid[iy + 1]?.[ix + 1] ?? 0
      if (iy !== 0 || thetaStart > 0) out.indices.push(a, b, d)
      if (iy !== heightSegments - 1 || thetaEnd < Math.PI) out.indices.push(b, c, d)
    }
  }
  return out
}

export function dome(radius: number, widthSegments: number, heightSegments: number): Shape {
  return sphere(radius, widthSegments, heightSegments, 0, TAU, 0, Math.PI / 2)
}

export type BoxSide = 'right' | 'left' | 'top' | 'bottom' | 'front' | 'back'

type BoxFace = { side: BoxSide; axis: 0 | 1 | 2; sign: 1 | -1 }

const BOX_FACES: readonly BoxFace[] = [
  { side: 'right', axis: 0, sign: 1 },
  { side: 'left', axis: 0, sign: -1 },
  { side: 'top', axis: 1, sign: 1 },
  { side: 'bottom', axis: 1, sign: -1 },
  { side: 'front', axis: 2, sign: 1 },
  { side: 'back', axis: 2, sign: -1 },
]

function boxFaces(width: number, height: number, depth: number, faces: readonly BoxFace[]): Shape {
  const out = shape()
  const half = [width / 2, height / 2, depth / 2]
  for (const { axis, sign } of faces) {
    const u = (axis + 1) % 3
    const v = (axis + 2) % 3
    const corner = (cu: number, cv: number) => {
      const p = [0, 0, 0]
      p[axis] = sign * (half[axis] ?? 0)
      p[u] = cu * (half[u] ?? 0)
      p[v] = cv * (half[v] ?? 0)
      const n = [0, 0, 0]
      n[axis] = sign
      return vertex(out, p[0] ?? 0, p[1] ?? 0, p[2] ?? 0, n[0] ?? 0, n[1] ?? 0, n[2] ?? 0)
    }
    const a = corner(-1, -1)
    const b = corner(1, -1)
    const c = corner(1, 1)
    const d = corner(-1, 1)
    if (sign > 0) out.indices.push(a, b, c, a, c, d)
    else out.indices.push(a, c, b, a, d, c)
  }
  return out
}

export function box(width: number, height: number, depth: number): Shape {
  return boxFaces(width, height, depth, BOX_FACES)
}

export function openBox(
  width: number,
  height: number,
  depth: number,
  open: readonly BoxSide[],
): Shape {
  return boxFaces(
    width,
    height,
    depth,
    BOX_FACES.filter((face) => !open.includes(face.side)),
  )
}

const ICOSAHEDRON_T = (1 + Math.sqrt(5)) / 2
const ICOSAHEDRON_VERTICES: readonly (readonly [number, number, number])[] = [
  [-1, ICOSAHEDRON_T, 0],
  [1, ICOSAHEDRON_T, 0],
  [-1, -ICOSAHEDRON_T, 0],
  [1, -ICOSAHEDRON_T, 0],
  [0, -1, ICOSAHEDRON_T],
  [0, 1, ICOSAHEDRON_T],
  [0, -1, -ICOSAHEDRON_T],
  [0, 1, -ICOSAHEDRON_T],
  [ICOSAHEDRON_T, 0, -1],
  [ICOSAHEDRON_T, 0, 1],
  [-ICOSAHEDRON_T, 0, -1],
  [-ICOSAHEDRON_T, 0, 1],
]
const ICOSAHEDRON_FACES: readonly (readonly [number, number, number])[] = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
]

type Point3 = readonly [number, number, number]

const unit = ([x, y, z]: Point3): Point3 => {
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

export function icosahedron(radius = 1, detail = 0): Shape {
  const out = shape(false)
  const divisions = detail + 1
  for (const [ia, ib, ic] of ICOSAHEDRON_FACES) {
    const a = ICOSAHEDRON_VERTICES[ia] ?? [0, 0, 0]
    const b = ICOSAHEDRON_VERTICES[ib] ?? [0, 0, 0]
    const c = ICOSAHEDRON_VERTICES[ic] ?? [0, 0, 0]
    const rows: Point3[][] = []
    for (let i = 0; i <= divisions; i++) {
      const left: Point3 = [
        a[0] + ((c[0] - a[0]) * i) / divisions,
        a[1] + ((c[1] - a[1]) * i) / divisions,
        a[2] + ((c[2] - a[2]) * i) / divisions,
      ]
      const right: Point3 = [
        b[0] + ((c[0] - b[0]) * i) / divisions,
        b[1] + ((c[1] - b[1]) * i) / divisions,
        b[2] + ((c[2] - b[2]) * i) / divisions,
      ]
      const columns = divisions - i
      const row: Point3[] = []
      for (let j = 0; j <= columns; j++) {
        row.push(
          columns === 0
            ? left
            : [
                left[0] + ((right[0] - left[0]) * j) / columns,
                left[1] + ((right[1] - left[1]) * j) / columns,
                left[2] + ((right[2] - left[2]) * j) / columns,
              ],
        )
      }
      rows.push(row)
    }
    const emit = (p: Point3) => {
      const [x, y, z] = unit(p)
      vertex(out, x * radius, y * radius, z * radius, x, y, z)
    }
    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < 2 * (divisions - i) - 1; j++) {
        const k = Math.floor(j / 2)
        const row = rows[i] ?? []
        const next = rows[i + 1] ?? []
        if (j % 2 === 0) {
          emit(row[k + 1] ?? a)
          emit(next[k] ?? a)
          emit(row[k] ?? a)
        } else {
          emit(row[k + 1] ?? a)
          emit(next[k + 1] ?? a)
          emit(next[k] ?? a)
        }
      }
    }
  }
  return out
}

export function lathe(profile: readonly (readonly [number, number])[], segments = 12): Shape {
  const out = shape()
  const normals2d = profile.map((point, index) => {
    const before = profile[Math.max(0, index - 1)] ?? point
    const after = profile[Math.min(profile.length - 1, index + 1)] ?? point
    const dx = after[0] - before[0]
    const dy = after[1] - before[1]
    const length = Math.hypot(dx, dy) || 1
    return [dy / length, -dx / length] as const
  })
  for (let i = 0; i <= segments; i++) {
    const phi = (i / segments) * TAU
    const sin = Math.sin(phi)
    const cos = Math.cos(phi)
    for (const [index, [px, py]] of profile.entries()) {
      const [nx, ny] = normals2d[index] ?? [1, 0]
      vertex(out, px * sin, py, px * cos, nx * sin, ny, nx * cos)
    }
  }
  const count = profile.length
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < count - 1; j++) {
      const a = i * count + j
      const b = a + count
      out.indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  return out
}

export function torus(
  radius: number,
  tube: number,
  radialSegments: number,
  tubularSegments: number,
): Shape {
  const out = shape()
  for (let j = 0; j <= radialSegments; j++) {
    for (let i = 0; i <= tubularSegments; i++) {
      const u = (i / tubularSegments) * TAU
      const v = (j / radialSegments) * TAU
      const cx = radius * Math.cos(u)
      const cy = radius * Math.sin(u)
      const x = (radius + tube * Math.cos(v)) * Math.cos(u)
      const y = (radius + tube * Math.cos(v)) * Math.sin(u)
      const z = tube * Math.sin(v)
      vertex(out, x, y, z, x - cx, y - cy, z)
    }
  }
  for (let j = 1; j <= radialSegments; j++) {
    for (let i = 1; i <= tubularSegments; i++) {
      const a = (tubularSegments + 1) * j + i - 1
      const b = (tubularSegments + 1) * (j - 1) + i - 1
      const c = (tubularSegments + 1) * (j - 1) + i
      const d = (tubularSegments + 1) * j + i
      out.indices.push(a, b, d, b, c, d)
    }
  }
  return out
}

export function plane(width: number, height: number, widthSegments = 1, heightSegments = 1): Shape {
  const out = shape()
  for (let iy = 0; iy <= heightSegments; iy++) {
    for (let ix = 0; ix <= widthSegments; ix++) {
      vertex(
        out,
        (ix / widthSegments - 0.5) * width,
        -(iy / heightSegments - 0.5) * height,
        0,
        0,
        0,
        1,
      )
    }
  }
  for (let iy = 0; iy < heightSegments; iy++) {
    for (let ix = 0; ix < widthSegments; ix++) {
      const a = ix + (widthSegments + 1) * iy
      const b = ix + (widthSegments + 1) * (iy + 1)
      const c = ix + 1 + (widthSegments + 1) * (iy + 1)
      const d = ix + 1 + (widthSegments + 1) * iy
      out.indices.push(a, b, d, b, c, d)
    }
  }
  return out
}

export function circle(radius: number, segments: number): Shape {
  const out = shape()
  const centre = vertex(out, 0, 0, 0, 0, 0, 1)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * TAU
    vertex(out, radius * Math.cos(angle), radius * Math.sin(angle), 0, 0, 0, 1)
  }
  for (let i = 1; i <= segments; i++) out.indices.push(i, i + 1, centre)
  return out
}

export function prism(width: number, depth: number, rise: number): Shape {
  const out = shape(false)
  const hw = width / 2
  const hd = depth / 2
  const triangles: number[][] = [
    [-hw, 0, hd, hw, 0, hd, hw, rise, 0],
    [-hw, 0, hd, hw, rise, 0, -hw, rise, 0],
    [hw, 0, -hd, -hw, 0, -hd, -hw, rise, 0],
    [hw, 0, -hd, -hw, rise, 0, hw, rise, 0],
    [hw, 0, hd, hw, 0, -hd, hw, rise, 0],
    [-hw, 0, -hd, -hw, 0, hd, -hw, rise, 0],
  ]
  for (const t of triangles) {
    const [ax = 0, ay = 0, az = 0, bx = 0, by = 0, bz = 0, cx = 0, cy = 0, cz = 0] = t
    const ux = bx - ax
    const uy = by - ay
    const uz = bz - az
    const vx = cx - ax
    const vy = cy - ay
    const vz = cz - az
    const nx = uy * vz - uz * vy
    const ny = uz * vx - ux * vz
    const nz = ux * vy - uy * vx
    vertex(out, ax, ay, az, nx, ny, nz)
    vertex(out, bx, by, bz, nx, ny, nz)
    vertex(out, cx, cy, cz, nx, ny, nz)
  }
  return out
}

export function surface(
  rows: number,
  columns: number,
  at: (row: number, column: number) => Point3,
): Shape {
  const out = shape()
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= columns; c++) {
      const [x, y, z] = at(r, c)
      vertex(out, x, y, z, 0, 1, 0)
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const a = r * (columns + 1) + c
      const b = a + columns + 1
      out.indices.push(a, a + 1, b, a + 1, b + 1, b)
    }
  }
  return out
}

export function computeNormals(target: Shape): Shape {
  const normals = new Array<number>(target.positions.length).fill(0)
  const p = target.positions
  const faces = target.indexed
    ? target.indices
    : p
        .map((_, index) => index)
        .filter((index) => index % 3 === 0)
        .map((index) => index / 3)
  const triangles = target.indexed ? faces.length / 3 : p.length / 9
  for (let t = 0; t < triangles; t++) {
    const ia = target.indexed ? (target.indices[t * 3] ?? 0) : t * 3
    const ib = target.indexed ? (target.indices[t * 3 + 1] ?? 0) : t * 3 + 1
    const ic = target.indexed ? (target.indices[t * 3 + 2] ?? 0) : t * 3 + 2
    const ax = p[ia * 3] ?? 0
    const ay = p[ia * 3 + 1] ?? 0
    const az = p[ia * 3 + 2] ?? 0
    const ux = (p[ib * 3] ?? 0) - ax
    const uy = (p[ib * 3 + 1] ?? 0) - ay
    const uz = (p[ib * 3 + 2] ?? 0) - az
    const vx = (p[ic * 3] ?? 0) - ax
    const vy = (p[ic * 3 + 1] ?? 0) - ay
    const vz = (p[ic * 3 + 2] ?? 0) - az
    const nx = uy * vz - uz * vy
    const ny = uz * vx - ux * vz
    const nz = ux * vy - uy * vx
    for (const index of [ia, ib, ic]) {
      normals[index * 3] = (normals[index * 3] ?? 0) + nx
      normals[index * 3 + 1] = (normals[index * 3 + 1] ?? 0) + ny
      normals[index * 3 + 2] = (normals[index * 3 + 2] ?? 0) + nz
    }
  }
  target.normals = normals
  return target
}

export function translated(target: Shape, x: number, y: number, z: number): Shape {
  for (let i = 0; i < target.positions.length; i += 3) {
    target.positions[i] = (target.positions[i] ?? 0) + x
    target.positions[i + 1] = (target.positions[i + 1] ?? 0) + y
    target.positions[i + 2] = (target.positions[i + 2] ?? 0) + z
  }
  return target
}

export function scaled(target: Shape, x: number, y: number, z: number): Shape {
  for (let i = 0; i < target.positions.length; i += 3) {
    target.positions[i] = (target.positions[i] ?? 0) * x
    target.positions[i + 1] = (target.positions[i + 1] ?? 0) * y
    target.positions[i + 2] = (target.positions[i + 2] ?? 0) * z
    const nx = (target.normals[i] ?? 0) / x
    const ny = (target.normals[i + 1] ?? 0) / y
    const nz = (target.normals[i + 2] ?? 0) / z
    const length = Math.hypot(nx, ny, nz) || 1
    target.normals[i] = nx / length
    target.normals[i + 1] = ny / length
    target.normals[i + 2] = nz / length
  }
  return target
}
