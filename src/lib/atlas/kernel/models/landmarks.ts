import { createNoise, mulberry32 } from '../../world/noise.ts'
import { PropBuilder, type PropGeometry } from '../builder.ts'
import { PROP_KIND } from '../kinds.ts'
import {
  circle,
  computeNormals,
  lathe,
  plane,
  prism,
  type Shape,
  sphere,
  surface,
  torus,
  translated,
} from '../primitives.ts'
import { at, ball, box, cone, cyl, IDENTITY, ico, tube, type Vec3 } from './parts.ts'

const K = PROP_KIND
const shapeNoise = createNoise(4242)
const LEAF_GREENS = ['#5b8f3c', '#4f8236', '#69a046', '#476f31', '#7aa84e'] as const
const CLUMP_COLUMNS = 26
const CLUMP_ROWS = 16
const TUFTS = 26
const TUFT_LEAN = 2
const LEAF_GRAIN = 3.4
const LEAF_TILT = 0.5
const CANOPY_LANTERNS = 16

function leafNoise(x: number, y: number, z: number): number {
  return (shapeNoise.n2(x, y) + shapeNoise.n2(y + 31.4, z) + shapeNoise.n2(z + 17.2, x)) / 3
}

function tuftsOf(seed: number): Vec3[] {
  const random = mulberry32(seed)
  return Array.from({ length: TUFTS }, (): Vec3 => {
    const y = random() * 2 - 1
    const angle = random() * Math.PI * 2
    const ring = Math.sqrt(1 - y * y)
    return [Math.cos(angle) * ring, y, Math.sin(angle) * ring]
  })
}

function nearestTuft(tufts: readonly Vec3[], x: number, y: number, z: number): Vec3 {
  let best: Vec3 = [x, y, z]
  let closest = Number.NEGATIVE_INFINITY
  for (const tuft of tufts) {
    const dot = tuft[0] * x + tuft[1] * y + tuft[2] * z
    if (dot > closest) {
      closest = dot
      best = tuft
    }
  }
  return best
}

function swell(
  clump: Shape,
  units: readonly number[],
  centre: Vec3,
  radius: number,
  seed: number,
): void {
  const p = clump.positions
  for (let i = 0; i < p.length; i += 3) {
    const x = units[i] ?? 0
    const y = units[i + 1] ?? 0
    const z = units[i + 2] ?? 0
    const lump =
      1 +
      0.3 * leafNoise(x * 1.6 + seed, y * 1.6, z * 1.6 - seed) +
      0.12 * leafNoise(x * 3.9 - seed, y * 3.9 + seed, z * 3.9)
    p[i] = centre[0] + x * radius * 1.3 * lump
    p[i + 1] = centre[1] + y * radius * (y < 0 ? 0.5 : 0.78) * lump
    p[i + 2] = centre[2] + z * radius * 1.2 * lump
  }
}

function tuftNormals(clump: Shape, units: readonly number[], seed: number): void {
  const tufts = tuftsOf(seed)
  const p = clump.positions
  const n = clump.normals
  for (let i = 0; i < n.length; i += 3) {
    const length = Math.hypot(n[i] ?? 0, n[i + 1] ?? 0, n[i + 2] ?? 0) || 1
    const ux = units[i] ?? 0
    const uy = units[i + 1] ?? 0
    const uz = units[i + 2] ?? 0
    const [tx, ty, tz] = nearestTuft(tufts, ux, uy, uz)
    const gx = (p[i] ?? 0) * LEAF_GRAIN
    const gy = (p[i + 1] ?? 0) * LEAF_GRAIN
    const gz = (p[i + 2] ?? 0) * LEAF_GRAIN
    const nx = (n[i] ?? 0) / length + (ux - tx) * TUFT_LEAN + LEAF_TILT * leafNoise(gx, gy, gz)
    const ny =
      (n[i + 1] ?? 0) / length + (uy - ty) * TUFT_LEAN + LEAF_TILT * leafNoise(gy + 7.3, gz, gx)
    const nz =
      (n[i + 2] ?? 0) / length + (uz - tz) * TUFT_LEAN + LEAF_TILT * leafNoise(gz - 4.1, gx, gy)
    const tilted = Math.hypot(nx, ny, nz) || 1
    n[i] = nx / tilted
    n[i + 1] = ny / tilted
    n[i + 2] = nz / tilted
  }
}

function canopyClump(centre: Vec3, radius: number, seed: number): Shape {
  const clump = sphere(1, CLUMP_COLUMNS, CLUMP_ROWS)
  const units = [...clump.positions]
  swell(clump, units, centre, radius, seed)
  computeNormals(clump)
  tuftNormals(clump, units, seed)
  return clump
}

export type Ground = (dx: number, dz: number) => number

export function worldTree(ground: Ground): PropGeometry {
  const g = new PropBuilder()
  const barks = ['#6e5d4b', '#5d4e3f', '#7a6a56']
  const bark = (index: number) => barks[index % 3] ?? '#6e5d4b'
  const random = mulberry32(31)
  const height = 7.4
  for (let strand = 0; strand < 7; strand++) {
    const points: Vec3[] = []
    const radii: number[] = []
    const phase = (strand / 7) * Math.PI * 2
    for (let k = 0; k <= 40; k++) {
      const f = k / 40
      const y = f * height
      const angle = phase + f * 2.9
      const reach = 0.62 * (1 - f * 0.62) + 0.55 * Math.exp(-y * 1.3)
      points.push([
        Math.cos(angle) * reach + Math.sin(f * 4 + strand) * 0.04,
        y,
        Math.sin(angle) * reach,
      ])
      radii.push(0.36 * (1 - f * 0.62) + 0.3 * Math.exp(-y * 1.4))
    }
    tube(g, points, radii, bark(strand), K.bark, 12, 0.08)
  }
  {
    const points: Vec3[] = []
    const radii: number[] = []
    for (let k = 0; k <= 20; k++) {
      const f = k / 20
      points.push([0, f * height * 0.96, 0])
      radii.push(0.62 * (1 - f * 0.6))
    }
    tube(g, points, radii, '#4e4236', K.bark, 16)
  }
  for (let root = 0; root < 13; root++) {
    const angle = (root / 13) * Math.PI * 2 + random() * 0.2
    const length = 2.2 + random() * 1.6
    const points: Vec3[] = []
    const radii: number[] = []
    for (let k = 0; k <= 16; k++) {
      const f = k / 16
      const d = 0.5 + f * length
      const x = Math.cos(angle + f * 0.18) * d
      const z = Math.sin(angle + f * 0.18) * d
      const gy = ground(x, z)
      points.push([
        x,
        Math.max(gy - 0.04, (1 - f) * 1.15 + gy * f + Math.sin(f * Math.PI) * 0.22 - f * 0.12),
        z,
      ])
      radii.push(0.36 * (1 - f) ** 0.9 + 0.07)
    }
    tube(g, points, radii, bark(root), K.bark, 10, 0.06)
  }
  const crowns: Vec3[] = []
  for (let branch = 0; branch < 10; branch++) {
    const angle = (branch / 10) * Math.PI * 2 + 0.25
    const y0 = 4.4 + (branch % 3) * 0.7
    const length = 2.3 + (branch % 2) * 1.1 + random() * 0.5
    const points: Vec3[] = []
    const radii: number[] = []
    for (let k = 0; k <= 12; k++) {
      const f = k / 12
      points.push([
        Math.cos(angle + f * 0.25) * f * length,
        y0 + Math.sin(f * Math.PI * 0.7) * 1.3 + f * 0.6,
        Math.sin(angle + f * 0.25) * f * length,
      ])
      radii.push(0.3 * (1 - f) + 0.06)
    }
    tube(g, points, radii, bark(branch), K.bark, 9, 0.05)
    const end = points[12]
    if (end) crowns.push(end)
    const split = points[7] ?? [0, 0, 0]
    const angle2 = angle + (branch % 2 ? 0.7 : -0.7)
    const twig: Vec3[] = []
    const twigRadii: number[] = []
    for (let k = 0; k <= 7; k++) {
      const f = k / 7
      twig.push([
        split[0] + Math.cos(angle2) * f * 1.4,
        split[1] + f * 0.9,
        split[2] + Math.sin(angle2) * f * 1.4,
      ])
      twigRadii.push(0.13 * (1 - f) + 0.03)
    }
    tube(g, twig, twigRadii, bark(branch + 1), K.bark, 6)
    const tip = twig[7]
    if (tip) crowns.push(tip)
  }
  crowns.push([0, height + 0.6, 0], [1.2, height + 0.2, -0.8], [-1.1, height + 0.3, 0.9])
  for (const [k, crown] of crowns.entries()) {
    const radius = 1.25 + random() * 0.45 + (k % 2 ? 0 : 0.2)
    g.add(
      canopyClump(crown, radius, k * 37 + 11),
      IDENTITY,
      LEAF_GREENS[(k + Math.round(crown[0] * 3)) % LEAF_GREENS.length] ?? '#5b8f3c',
      K.worldLeaf,
    )
    if (k >= CANOPY_LANTERNS) continue
    g.add(
      ball(6, 5),
      at(
        crown[0] + (random() - 0.5) * radius,
        crown[1] - radius * 0.62 - random() * 0.3,
        crown[2] + (random() - 0.5) * radius,
        0,
        0,
        0,
        0.06,
      ),
      '#ffd38a',
      K.lamp,
    )
  }
  for (let k = 0; k < 10; k++) {
    const angle = (k / 10) * Math.PI * 2
    const d = 3.2
    g.add(
      box(0.09, 0.28, 0.06),
      at(
        Math.cos(angle) * d,
        ground(Math.cos(angle) * d, Math.sin(angle) * d) + 0.1,
        Math.sin(angle) * d,
        0,
        -angle,
        0,
      ),
      '#a39e94',
      K.runes,
    )
  }
  return g.geometry()
}

export function shipwreck(): PropGeometry {
  const g = new PropBuilder()
  const length = 2.4
  const plank = '#6e4e30'
  const dark = '#4a3422'
  const hull = (u0: number, u1: number, tilt: number, dx: number) => {
    const positions: number[] = []
    const normals: number[] = []
    const indices: number[] = []
    const nu = 14
    const nv = 9
    const cosT = Math.cos(tilt)
    const sinT = Math.sin(tilt)
    const rotate = (x: number, y: number, z: number): Vec3 => [
      x,
      y * cosT - z * sinT,
      y * sinT + z * cosT,
    ]
    for (let a = 0; a <= nu; a++) {
      const u = u0 + ((u1 - u0) * a) / nu
      const width = 0.36 * Math.sin(Math.PI * Math.min(0.98, Math.max(0.03, u))) ** 0.55 + 0.02
      const hh = 0.42 + (u > 0.8 ? 0.16 : 0)
      for (let b = 0; b <= nv; b++) {
        const t = (b / nv) * Math.PI
        const [px, py, pz] = rotate(
          (u - 0.5) * length + dx,
          -Math.sin(t) * hh * 0.8 + hh * 0.35,
          Math.cos(t) * width,
        )
        positions.push(px, py, pz)
        const [nx, ny, nz] = rotate(0, -Math.sin(t) * 0.6, Math.cos(t))
        const nl = Math.hypot(nx, ny, nz) || 1
        normals.push(nx / nl, ny / nl, nz / nl)
      }
    }
    for (let a = 0; a < nu; a++) {
      for (let b = 0; b < nv; b++) {
        const i0 = a * (nv + 1) + b
        const i1 = i0 + nv + 1
        indices.push(i0, i1, i0 + 1, i0 + 1, i1, i1 + 1)
      }
    }
    g.raw(positions, normals, plank, K.wood, indices)
  }
  hull(0, 0.54, 0.32, 0)
  hull(0.62, 1, 0.5, 0.12)
  for (let k = 0; k < 5; k++) {
    const x = (0.55 - 0.5) * length + k * 0.045
    const points: Vec3[] = []
    const radii: number[] = []
    for (let b = 0; b <= 8; b++) {
      const t = (b / 8) * Math.PI
      points.push([x, -Math.sin(t) * 0.36 + 0.18 + 0.05, Math.cos(t) * 0.38])
      radii.push(0.014)
    }
    tube(g, points, radii, dark, K.wood, 5)
  }
  g.add(box(length * 0.5, 0.02, 0.6), at(-0.5, 0.2, 0.06, 0.32, 0, 0), '#7a5a3a', K.wood)
  g.add(box(0.38, 0.24, 0.62), at(1.02, 0.36, 0.1, 0.5, 0, 0.04), '#5a4028', K.plaster)
  g.add(cyl(0.035, 0.045, 1.4, 7), at(-0.4, 0.8, 0.25, 0.5, 0, 0.18), dark, K.wood)
  g.add(cyl(0.03, 0.04, 0.55, 7), at(0.5, 0.5, 0.3, 0.62, 0, -0.1), dark, K.wood)
  g.add(cyl(0.012, 0.012, 0.9, 5), at(-0.5, 1.2, 0.48, 0.5, 0, Math.PI / 2 + 0.2), dark, K.wood)
  g.add(plane(0.85, 0.6, 6, 4), at(-0.48, 0.95, 0.42, 0.5, 0.15, 0.18), '#d8cdb0', K.tornCloth, {
    pinned: 'top',
  })
  g.add(cyl(0.02, 0.03, 0.7, 6), at(-1.35, 0.15, 0, 0.3, 0, -1.2), dark, K.wood)
  const random = mulberry32(17)
  for (let k = 0; k < 12; k++) {
    const x = (random() - 0.5) * 3
    const z = (random() - 0.5) * 1.6 + 0.5
    if (k % 3)
      g.add(
        box(0.12 + random() * 0.1, 0.012, 0.025),
        at(x, 0.02, z, 0, random() * 3, 0),
        plank,
        K.wood,
      )
    else g.add(cyl(0.03, 0.03, 0.06, 7), at(x, 0.03, z, random(), random(), 0), '#5a4030', K.wood)
  }
  return g.geometry()
}

export function castle(): PropGeometry {
  const g = new PropBuilder()
  const stone = '#ece6da'
  const stone2 = '#ddd5c6'
  const slate = '#34497e'
  const gold = '#e8c35a'
  const ring = 6
  const reach = 0.52
  for (let k = 0; k < ring; k++) {
    const a = (k / ring) * Math.PI * 2 + 0.3
    const x = Math.cos(a) * reach
    const z = Math.sin(a) * reach
    const a2 = ((k + 1) / ring) * Math.PI * 2 + 0.3
    const x2 = Math.cos(a2) * reach
    const z2 = Math.sin(a2) * reach
    const span = Math.hypot(x2 - x, z2 - z)
    const turn = -Math.atan2(z2 - z, x2 - x)
    g.add(box(span, 0.24, 0.05), at((x + x2) / 2, 0.06, (z + z2) / 2, 0, turn, 0), stone2, K.stone)
    g.add(
      box(span, 0.03, 0.05),
      at((x + x2) / 2, 0.195, (z + z2) / 2, 0, turn, 0),
      stone2,
      K.rampart,
    )
    g.add(cyl(0.075, 0.085, 0.42, 12), at(x, 0.12, z), stone, K.stone)
    g.add(cyl(0.085, 0.085, 0.02, 12), at(x, 0.34, z), stone2, K.stone)
    g.add(cone(0.095, 0.2, 12), at(x, 0.45, z), slate, K.roof)
    g.add(cyl(0.003, 0.003, 0.06, 4), at(x, 0.58, z), gold, K.gold)
    g.add(
      plane(0.06, 0.1, 4, 1),
      at(x + Math.cos(k) * 0.035, 0.6, z - Math.sin(k) * 0.035, 0, k, 0),
      '#2a3f9a',
      K.cloth,
      { pinned: 'left' },
    )
  }
  g.add(box(0.2, 0.66, 0.2), at(0, 0.25, 0), stone, K.stone)
  g.add(cone(0.17, 0.32, 4), at(0, 0.74, 0, 0, Math.PI / 4, 0), slate, K.roof)
  g.add(cyl(0.004, 0.004, 0.1, 4), at(0, 0.94, 0), gold, K.gold)
  for (const [x, z] of [
    [0.1, 0.1],
    [-0.1, 0.1],
    [0.1, -0.1],
    [-0.1, -0.1],
  ] as const) {
    g.add(cyl(0.035, 0.035, 0.18, 10), at(x, 0.58, z), stone, K.stone)
    g.add(cone(0.045, 0.16, 10), at(x, 0.75, z), slate, K.roof)
  }
  g.add(box(0.34, 0.3, 0.16), at(0.18, 0.05, -0.2, 0, 0.5, 0), stone, K.plaster)
  g.add(prism(0.37, 0.19, 0.11), at(0.18, 0.2, -0.2, 0, 0.5, 0), slate, K.roof)
  g.add(box(0.08, 0.38, 0.08), at(-0.22, 0.17, 0.2), stone, K.stone)
  g.add(cone(0.06, 0.34, 4), at(-0.22, 0.53, 0.2, 0, Math.PI / 4, 0), slate, K.roof)
  g.add(cyl(0.04, 0.04, 0.008, 14), at(0, 0.36, 0.101, Math.PI / 2, 0, 0), '#5a7ae0', K.lamp)
  for (let k = 0; k < 6; k++)
    g.add(box(0.05, 0.3, 0.06), at(-0.65 - k * 0.16, -0.05, 0.3 + k * 0.02), stone2, K.stone)
  g.add(box(0.98, 0.04, 0.07), at(-0.98, 0.1, 0.35, 0, -0.02, 0), stone2, K.stone)
  return g.geometry()
}

export function arena(): PropGeometry {
  const g = new PropBuilder()
  const stone = '#e6dfd0'
  g.add(cyl(0.42, 0.42, 0.18, 36, 1, true), at(0, 0.06, 0), stone, K.arcade)
  g.add(cyl(0.4, 0.4, 0.18, 36, 1, true), at(0, 0.06, 0), stone, K.arcade)
  g.add(
    lathe(
      [
        [0.18, 0],
        [0.2, 0.03],
        [0.26, 0.03],
        [0.27, 0.07],
        [0.33, 0.07],
        [0.34, 0.11],
        [0.4, 0.13],
      ],
      36,
    ),
    at(0, 0.02, 0),
    '#cfc6b4',
    K.stone,
  )
  g.add(cyl(0.19, 0.19, 0.02, 30), at(0, 0.01, 0), '#d8be8a', K.plain)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    g.add(
      plane(0.04, 0.09),
      at(Math.cos(a) * 0.43, 0.2, Math.sin(a) * 0.43, 0, -a + Math.PI / 2, 0),
      k % 2 ? '#2a3f9a' : '#d9a83a',
      K.cloth,
    )
  }
  return g.geometry()
}

export function volcano(ground: Ground): PropGeometry {
  const g = new PropBuilder()
  const rings = 18
  const sides = 40
  const reach = 3.3
  const height = 2
  const shape = surface(rings, sides, (r, s) => {
    const f = r / rings
    const angle = (s / sides) * Math.PI * 2
    const radius = 0.38 + f * (reach - 0.38)
    const ridge = shapeNoise.ridged(Math.cos(angle) * 2.4, Math.sin(angle) * 2.4 + f * 4, 3)
    let y = height * (1 - f) ** 1.25 * (0.88 + 0.22 * ridge)
    const wx = Math.cos(angle) * radius * (1 + (ridge - 0.5) * 0.1)
    const wz = Math.sin(angle) * radius
    if (f > 0.85) y = Math.min(y, ground(wx, wz) - 0.05)
    return [wx, y, wz]
  })
  g.add(computeNormals(shape), at(), '#2d2827', K.lavaRock)
  g.add(
    lathe(
      [
        [0, height - 0.32],
        [0.3, height - 0.28],
        [0.38, height * 0.97],
      ],
      32,
    ),
    at(),
    '#3a2a26',
    K.rock,
  )
  g.add(circle(0.3, 24), at(0, height - 0.3, 0, -Math.PI / 2, 0, 0), '#ff6a1a', K.glow)
  return g.geometry()
}

export function spire(): PropGeometry {
  const g = new PropBuilder()
  const random = mulberry32(61)
  const shard = (
    height: number,
    radius: number,
    x: number,
    z: number,
    ax: number,
    az: number,
    colour: string,
  ) => {
    const placement = at(x, 0, z, ax, random() * 3, az)
    g.add(
      translated(cyl(radius, radius * 1.05, height, 6), 0, height / 2, 0),
      placement,
      colour,
      K.crystal,
    )
    g.add(
      translated(cone(radius, radius * 3, 6), 0, height + radius * 1.5, 0),
      placement,
      colour,
      K.crystal,
    )
  }
  shard(4.6, 0.32, 0, 0, 0.03, -0.04, '#c9a4ff')
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2
    const d = 0.45 + random() * 0.5
    shard(
      0.6 + random() * 1.8,
      0.07 + random() * 0.12,
      Math.cos(a) * d,
      Math.sin(a) * d,
      Math.cos(a) * 0.45,
      Math.sin(a) * -0.45,
      k % 2 ? '#a879ff' : '#d8bcff',
    )
  }
  for (let k = 0; k < 7; k++) {
    g.add(
      ico(1),
      at(
        (random() - 0.5) * 1.6,
        0.05,
        (random() - 0.5) * 1.6,
        random(),
        random(),
        random(),
        0.25 + random() * 0.2,
        0.15,
        0.22,
      ),
      '#4a3c5a',
      K.rock,
      { jitter: 0.3, seed: k, flat: true },
    )
  }
  return g.geometry()
}

export function bones(): PropGeometry {
  const g = new PropBuilder()
  const bone = '#e9e0c8'
  const spine: Vec3[] = []
  for (let k = 0; k <= 26; k++) {
    const f = k / 26
    spine.push([
      (f - 0.5) * 3.2,
      0.08 + Math.sin(f * Math.PI) * 0.18 - (f > 0.8 ? (f - 0.8) * 0.6 : 0),
      Math.sin(f * 4.2) * 0.35,
    ])
  }
  for (const [k, p] of spine.entries()) {
    const s = 0.05 + Math.sin((k / 26) * Math.PI) * 0.03
    g.add(box(s * 1.4, s * 1.2, s * 1.5), at(p[0], p[1], p[2], 0, k * 0.15, 0), bone, K.bone)
    g.add(cone(s * 0.5, s * 2, 4), at(p[0], p[1] + s * 1.4, p[2]), bone, K.bone)
  }
  for (let k = 5; k < 18; k++) {
    const p = spine[k] ?? [0, 0, 0]
    const f = Math.sin(((k - 5) / 13) * Math.PI)
    const reach = 0.45 + f * 0.35
    for (const side of [-1, 1]) {
      const points: Vec3[] = []
      const radii: number[] = []
      for (let s = 0; s <= 8; s++) {
        const t = s / 8
        points.push([
          p[0] + t * 0.08,
          p[1] + Math.sin(t * Math.PI) * reach * 0.9 - t * 0.05,
          p[2] + side * Math.sin(t * Math.PI * 0.62) * reach,
        ])
        radii.push(0.022 * (1 - t * 0.6))
      }
      tube(g, points, radii, bone, K.bone, 6)
    }
  }
  const head = spine[0] ?? [0, 0, 0]
  g.add(
    ball(10, 7),
    at(head[0] - 0.2, head[1] + 0.06, head[2], 0, 0.3, 0, 0.3, 0.14, 0.17),
    bone,
    K.bone,
    { jitter: 0.15, seed: 3 },
  )
  g.add(
    box(0.36, 0.04, 0.14),
    at(head[0] - 0.38, head[1] - 0.04, head[2] + 0.1, 0.1, 0.4, -0.1),
    bone,
    K.bone,
  )
  for (const side of [-1, 1]) {
    g.add(
      cone(0.03, 0.34, 6),
      at(head[0] - 0.05, head[1] + 0.22, head[2] + side * 0.09, side * 0.5, 0.3, -1.1),
      '#d9cfb4',
      K.bone,
    )
  }
  for (let k = 0; k < 6; k++) {
    g.add(
      cone(0.012, 0.05, 4),
      at(head[0] - 0.3 - k * 0.04, head[1] - 0.04, head[2] + 0.06, Math.PI, 0, 0),
      '#f2ead8',
      K.bone,
    )
  }
  return g.geometry()
}

export function lighthouse(): PropGeometry {
  const g = new PropBuilder()
  g.add(cyl(0.05, 0.075, 0.52, 14, 4), at(0, 0.26, 0), '#ffffff', K.stripes)
  g.add(torus(0.06, 0.008, 5, 16), at(0, 0.52, 0, Math.PI / 2, 0, 0), '#2a2a2a', K.metal)
  g.add(cyl(0.04, 0.04, 0.07, 12), at(0, 0.565, 0), '#ffd27a', K.lamp)
  g.add(cone(0.055, 0.07, 12), at(0, 0.635, 0), '#b02a20', K.roof)
  g.add(cyl(0.09, 0.11, 0.06, 10), at(0, 0, 0), '#8a8680', K.rock, { jitter: 0.2, seed: 3 })
  return g.geometry()
}

export function portal(): PropGeometry {
  const g = new PropBuilder()
  const random = mulberry32(81)
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2
    const d = 0.55
    const h = 0.22 + random() * 0.12
    g.add(
      box(0.07, h, 0.045),
      at(
        Math.cos(a) * d,
        h / 2 - 0.02,
        Math.sin(a) * d,
        (random() - 0.5) * 0.1,
        -a,
        (random() - 0.5) * 0.1,
      ),
      '#8a8f96',
      K.runes,
      {
        jitter: 0.03,
        seed: k,
      },
    )
  }
  g.add(torus(0.26, 0.045, 8, 28), at(0, 0.31, 0), '#7a7f88', K.runes)
  g.add(box(0.12, 0.07, 0.1), at(0, 0.03, 0), '#6e7278', K.rock)
  return g.geometry()
}

export function watchtower(): PropGeometry {
  const g = new PropBuilder()
  g.add(cyl(0.06, 0.075, 0.42, 12), at(0, 0.18, 0), '#d9d2c4', K.stone)
  g.add(cyl(0.075, 0.075, 0.04, 12), at(0, 0.41, 0), '#cfc6b6', K.rampart)
  g.add(cyl(0.025, 0.03, 0.03, 8), at(0, 0.44, 0), '#ff9a3a', K.glow)
  g.add(cyl(0.002, 0.002, 0.14, 4), at(0.05, 0.5, 0), '#3a2a1a', K.wood)
  g.add(plane(0.06, 0.035, 4, 1), at(0.08, 0.55, 0), '#2a3f9a', K.cloth, { pinned: 'left' })
  return g.geometry()
}
