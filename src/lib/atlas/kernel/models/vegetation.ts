import { createNoise, mulberry32, type Random } from '../../world/noise.ts'
import { PropBuilder, type PropGeometry } from '../builder.ts'
import { PROP_KIND } from '../kinds.ts'
import { dome, type Shape, translated } from '../primitives.ts'
import {
  at,
  ball,
  cone,
  cyl,
  type Detail,
  facet,
  faceted,
  IDENTITY,
  ico,
  tube,
  type Vec3,
} from './parts.ts'

const K = PROP_KIND
const peakNoise = createNoise(4242)

type Lobe = readonly [x: number, y: number, z: number, radius: number]
type LobeMesh = readonly [width: number, height: number]
type Crown = { lobes: readonly Lobe[]; mesh: LobeMesh; jitter: number }
type Limb = { points: readonly Vec3[]; radii: readonly number[] }

function crown(
  g: PropBuilder,
  { lobes, mesh, jitter }: Crown,
  colours: readonly string[],
  squash: number,
  seed: number,
): void {
  for (const [k, [x, y, z, r]] of lobes.entries()) {
    g.add(
      ball(mesh[0], mesh[1]),
      at(x, y, z, 0, k * 1.3, 0, r, r * squash, r),
      colours[k % colours.length] ?? '#3f6c2a',
      K.leaf,
      { jitter, seed: seed + k },
    )
  }
}

function limbs(g: PropBuilder, parts: readonly Limb[], colour: string, sides: number): void {
  for (const { points, radii } of parts) tube(g, points, radii, colour, K.bark, sides)
}

function straightened({ points, radii }: Limb): Limb {
  return {
    points: [points[0] ?? [0, 0, 0], points.at(-1) ?? [0, 0, 0]],
    radii: [radii[0] ?? 0, radii.at(-1) ?? 0],
  }
}

const OAK_BARK = '#5b3f27'
const OAK_LEAVES = ['#3f6c2a', '#4c7c31', '#46752e'] as const
const OAK_TRUNK: Limb = {
  points: [
    [0, 0, 0],
    [0.006, 0.15, 0.002],
    [0.012, 0.3, 0.008],
    [0.004, 0.47, 0.012],
  ],
  radii: [0.07, 0.048, 0.04, 0.034],
}
const OAK_LIMBS: readonly Limb[] = [
  {
    points: [
      [0.01, 0.38, 0.008],
      [0.08, 0.48, 0.01],
      [0.14, 0.58, 0.03],
    ],
    radii: [0.028, 0.02, 0.013],
  },
  {
    points: [
      [0.005, 0.4, 0.01],
      [-0.05, 0.5, 0.07],
      [-0.1, 0.59, 0.12],
    ],
    radii: [0.026, 0.018, 0.012],
  },
  {
    points: [
      [0.006, 0.42, 0.006],
      [-0.03, 0.52, -0.07],
      [-0.04, 0.62, -0.14],
    ],
    radii: [0.024, 0.017, 0.011],
  },
]
const OAK_CROWNS: Record<Detail, Crown> = {
  0: {
    lobes: [
      [0, 0.69, 0, 0.25],
      [0.19, 0.6, 0.02, 0.17],
      [0.08, 0.62, 0.18, 0.16],
      [-0.12, 0.6, 0.15, 0.17],
      [-0.2, 0.63, -0.03, 0.16],
      [-0.07, 0.6, -0.18, 0.17],
      [0.13, 0.64, -0.15, 0.16],
      [0.07, 0.83, 0.06, 0.16],
      [-0.09, 0.85, -0.03, 0.15],
      [0.03, 0.8, -0.1, 0.14],
    ],
    mesh: [6, 5],
    jitter: 0.28,
  },
  1: {
    lobes: [
      [0, 0.7, 0, 0.27],
      [0.19, 0.61, 0.03, 0.18],
      [0.03, 0.62, 0.19, 0.18],
      [-0.18, 0.61, 0.06, 0.18],
      [-0.1, 0.62, -0.17, 0.18],
      [0.13, 0.63, -0.15, 0.17],
      [0, 0.85, 0, 0.17],
    ],
    mesh: [5, 4],
    jitter: 0.26,
  },
  2: {
    lobes: [
      [0, 0.7, 0, 0.3],
      [0.17, 0.62, 0.06, 0.22],
      [-0.15, 0.63, -0.07, 0.23],
    ],
    mesh: [4, 3],
    jitter: 0.2,
  },
}

export function oak(detail: Detail): PropGeometry {
  const g = new PropBuilder()
  if (detail === 0) limbs(g, [OAK_TRUNK, ...OAK_LIMBS], OAK_BARK, 5)
  if (detail === 1) limbs(g, [OAK_TRUNK, ...OAK_LIMBS.slice(0, 2).map(straightened)], OAK_BARK, 4)
  if (detail === 2) limbs(g, [straightened(OAK_TRUNK)], OAK_BARK, 3)
  crown(g, OAK_CROWNS[detail], OAK_LEAVES, 0.85, 0)
  return g.geometry()
}

type Tier = { base: number; height: number; radius: number; points: number }
const PINE_BARK = '#4e3522'
const PINE_NEEDLES = ['#25412a', '#2c4a2a'] as const
const PINE_SEED = 17
const PINE_TRUNK: Limb = {
  points: [
    [0, 0, 0],
    [0, 0.3, 0],
  ],
  radii: [0.036, 0.022],
}
const PINE_TIERS: Record<Detail, readonly number[]> = {
  0: [12, 12, 10, 10, 8],
  1: [8, 8, 8, 7],
  2: [6, 6, 6],
}

function pineTier(level: number, levels: number, points: number): Tier {
  const f = levels > 1 ? level / (levels - 1) : 0
  return { base: 0.17 + f * 0.48, height: 0.31 - f * 0.1, radius: 0.27 * (1 - f * 0.74), points }
}

function skirt(g: PropBuilder, tier: Tier, random: Random, colour: string, hollow: boolean): void {
  const out = faceted()
  const phase = random() * Math.PI * 2
  const lean: Vec3 = [(random() - 0.5) * 0.02, 0, (random() - 0.5) * 0.02]
  const apex: Vec3 = [lean[0], tier.base + tier.height * (0.95 + random() * 0.1), lean[2]]
  const droop = tier.radius * 0.18
  const ring: Vec3[] = []
  for (let k = 0; k < tier.points; k++) {
    const long = k % 2 === 0
    const angle = phase + ((k + (random() - 0.5) * 0.3) / tier.points) * Math.PI * 2
    const reach = tier.radius * (long ? 1 : 0.84) * (0.9 + random() * 0.2)
    ring.push([
      Math.cos(angle) * reach,
      tier.base - (long ? droop : droop * 0.4),
      Math.sin(angle) * reach,
    ])
  }
  const heart: Vec3 = [0, tier.base + tier.height * 0.12, 0]
  for (const [k, p] of ring.entries()) {
    const q = ring[(k + 1) % ring.length] ?? p
    const mx = (p[0] + q[0]) / 2
    const mz = (p[2] + q[2]) / 2
    facet(out, [apex, p, q], [mx, 0.6, mz])
    if (hollow) facet(out, [heart, p, q], [mx * 0.3, -1, mz * 0.3])
  }
  if (!hollow) facet(out, ring, [0, -1, 0])
  g.add(out, IDENTITY, colour, K.leaf, { flat: true })
}

export function pine(detail: Detail): PropGeometry {
  const g = new PropBuilder()
  const tiers = PINE_TIERS[detail]
  if (detail < 2) limbs(g, [PINE_TRUNK], PINE_BARK, detail === 0 ? 5 : 4)
  for (const [level, points] of tiers.entries()) {
    const tier = pineTier(level, tiers.length, points)
    skirt(
      g,
      tier,
      mulberry32(PINE_SEED + Math.round(tier.base * 100)),
      PINE_NEEDLES[level % 2] ?? '#25412a',
      detail < 2,
    )
  }
  return g.geometry()
}

type Frond = { azimuth: number; pitch: number; length: number }
type PalmPlan = { trunk: number; sides: number; fronds: number; segments: number }
const PALM_BARK = '#6c5234'
const PALM_FRONDS = ['#5a9632', '#4f8a2e'] as const
const PALM_HEART = '#6b4a2a'
const PALM_NUT = '#5a3e22'
const PALM_SEED = 23
const PALM_HEIGHT = 0.78
const PALM_LEAN = 0.075
const PALM_SPINE_STEPS = 48
const PALM_PLANS: Record<Detail, PalmPlan> = {
  0: { trunk: 9, sides: 7, fronds: 10, segments: 8 },
  1: { trunk: 5, sides: 5, fronds: 8, segments: 3 },
  2: { trunk: 3, sides: 3, fronds: 6, segments: 2 },
}

function palmSpine(count: number): Vec3[] {
  const step = PALM_HEIGHT / PALM_SPINE_STEPS
  const fine: Vec3[] = [[0, 0, 0]]
  for (let k = 0; k < PALM_SPINE_STEPS; k++) {
    const angle = PALM_LEAN * (((k + 0.5) / PALM_SPINE_STEPS) * 6 + 0.5)
    const [x, y] = fine[k] ?? [0, 0, 0]
    fine.push([x + Math.sin(angle) * step, y + Math.cos(angle) * step, 0])
  }
  return Array.from(
    { length: count },
    (_, k): Vec3 => fine[Math.round((k * PALM_SPINE_STEPS) / (count - 1))] ?? [0, 0, 0],
  )
}

function frond(out: Shape, top: Vec3, { azimuth, pitch, length }: Frond, segments: number): void {
  const side: Vec3 = [-Math.sin(azimuth), 0, Math.cos(azimuth)]
  const rows: { centre: Vec3; left: Vec3; right: Vec3; up: Vec3 }[] = []
  let centre: Vec3 = [...top]
  for (let k = 0; k <= segments; k++) {
    const t = k / segments
    const angle = pitch - 1.9 * t ** 1.4
    const forward: Vec3 = [
      Math.cos(angle) * Math.cos(azimuth),
      Math.sin(angle),
      Math.cos(angle) * Math.sin(azimuth),
    ]
    const up: Vec3 = [
      side[1] * forward[2] - side[2] * forward[1],
      side[2] * forward[0] - side[0] * forward[2],
      side[0] * forward[1] - side[1] * forward[0],
    ]
    const w =
      k === segments
        ? 0
        : (0.01 + 0.05 * Math.sin(Math.PI * Math.min(1, t * 1.05) ** 0.8)) * (k % 2 ? 0.62 : 1)
    const fold = w * 0.35
    const edge = (sign: number): Vec3 => [
      centre[0] + side[0] * w * sign - up[0] * fold,
      centre[1] + side[1] * w * sign - up[1] * fold,
      centre[2] + side[2] * w * sign - up[2] * fold,
    ]
    rows.push({ centre, left: edge(-1), right: edge(1), up })
    const step = length / segments
    centre = [
      centre[0] + forward[0] * step,
      centre[1] + forward[1] * step,
      centre[2] + forward[2] * step,
    ]
  }
  for (let k = 0; k < segments; k++) {
    const a = rows[k]
    const b = rows[k + 1]
    if (!a || !b) continue
    const up = a.up
    const down: Vec3 = [-up[0], -up[1], -up[2]]
    const leftOut: Vec3 = [up[0] - side[0], up[1] - side[1], up[2] - side[2]]
    const rightOut: Vec3 = [up[0] + side[0], up[1] + side[1], up[2] + side[2]]
    if (k === segments - 1) {
      facet(out, [a.centre, b.centre, a.left], leftOut)
      facet(out, [a.centre, a.right, b.centre], rightOut)
      facet(out, [a.left, b.centre, a.right], down)
      continue
    }
    facet(out, [a.centre, b.centre, b.left, a.left], leftOut)
    facet(out, [a.centre, a.right, b.right, b.centre], rightOut)
    facet(out, [a.left, b.left, b.right, a.right], down)
  }
}

export function palm(detail: Detail): PropGeometry {
  const g = new PropBuilder()
  const plan = PALM_PLANS[detail]
  const random = mulberry32(PALM_SEED)
  const spine = palmSpine(plan.trunk)
  const radii = spine.map((_, k) => {
    const t = k / (spine.length - 1)
    return (0.03 - t * 0.011) * (detail === 0 && k % 2 ? 0.86 : 1)
  })
  tube(g, spine, radii, PALM_BARK, K.bark, plan.sides)
  const top = spine.at(-1) ?? [0, 0.75, 0]
  const sheaves = PALM_FRONDS.map(() => faceted())
  for (let f = 0; f < plan.fronds; f++) {
    const young = f % 3 === 0
    const sheaf = sheaves[f % sheaves.length] ?? faceted()
    frond(
      sheaf,
      [top[0], top[1] + 0.01, top[2]],
      {
        azimuth: (f / plan.fronds) * Math.PI * 2 + 0.3 + (random() - 0.5) * 0.3,
        pitch: (young ? 0.9 : 0.5) + (random() - 0.5) * 0.2,
        length: (young ? 0.34 : 0.42) + random() * 0.04,
      },
      plan.segments,
    )
  }
  for (const [k, sheaf] of sheaves.entries()) {
    g.add(sheaf, IDENTITY, PALM_FRONDS[k] ?? '#5a9632', K.leaf, { flat: true })
  }
  if (detail === 0) {
    g.add(
      ball(6, 4),
      at(top[0], top[1] - 0.005, top[2], 0, 0, 0, 0.034, 0.03, 0.034),
      PALM_HEART,
      K.plain,
    )
    for (let k = 0; k < 3; k++) {
      const angle = k * 2.1 + 0.4
      g.add(
        ball(5, 4),
        at(
          top[0] + Math.cos(angle) * 0.03,
          top[1] - 0.035,
          top[2] + Math.sin(angle) * 0.03,
          0,
          0,
          0,
          0.024,
        ),
        PALM_NUT,
        K.plain,
      )
    }
  }
  if (detail === 1) {
    g.add(
      ball(4, 3),
      at(top[0], top[1] - 0.02, top[2], 0, 0, 0, 0.045, 0.04, 0.045),
      PALM_NUT,
      K.plain,
    )
  }
  return g.geometry()
}

const JUNGLE_BARK = '#5a4a35'
const JUNGLE_LEAVES = ['#256a26', '#2f7a2c', '#2a7029'] as const
const JUNGLE_VINE = '#2c5e26'
const JUNGLE_TRUNK: Limb = {
  points: [
    [0, 0, 0],
    [0.012, 0.2, 0.006],
    [-0.008, 0.42, 0],
    [0.004, 0.62, -0.01],
    [0.006, 0.72, -0.004],
  ],
  radii: [0.058, 0.04, 0.035, 0.031, 0.028],
}
const JUNGLE_BOUGH: Limb = {
  points: [
    [0.004, 0.36, 0.002],
    [0.07, 0.43, -0.04],
    [0.15, 0.47, -0.08],
  ],
  radii: [0.02, 0.014, 0.01],
}
const JUNGLE_BOUGH_LOBE: Lobe = [0.17, 0.5, -0.09, 0.11]
const JUNGLE_CROWNS: Record<Detail, Crown> = {
  0: {
    lobes: [
      [0.21, 0.62, 0.04, 0.2],
      [-0.03, 0.61, 0.21, 0.2],
      [-0.2, 0.62, -0.05, 0.2],
      [0.04, 0.6, -0.2, 0.19],
      [0.09, 0.76, 0.06, 0.19],
      [-0.1, 0.77, 0.04, 0.18],
      [0.01, 0.75, -0.11, 0.18],
      [0, 0.88, 0, 0.15],
    ],
    mesh: [7, 4],
    jitter: 0.26,
  },
  1: {
    lobes: [
      [0.19, 0.63, 0.05, 0.22],
      [-0.12, 0.62, 0.15, 0.22],
      [-0.07, 0.62, -0.18, 0.21],
      [0.06, 0.77, 0, 0.21],
      [-0.06, 0.82, -0.02, 0.16],
    ],
    mesh: [5, 4],
    jitter: 0.24,
  },
  2: {
    lobes: [
      [0.06, 0.68, 0.04, 0.32],
      [-0.08, 0.8, -0.05, 0.22],
    ],
    mesh: [4, 3],
    jitter: 0.2,
  },
}

function buttresses(g: PropBuilder): void {
  const out = faceted()
  for (let k = 0; k < 4; k++) {
    const angle = 0.4 + (k * Math.PI) / 2
    const dx = Math.cos(angle)
    const dz = Math.sin(angle)
    const across: Vec3 = [-dz * 0.006, 0, dx * 0.006]
    const high: Vec3 = [dx * 0.035, 0.13, dz * 0.035]
    const foot: Vec3 = [dx * 0.12, -0.01, dz * 0.12]
    const root: Vec3 = [dx * 0.035, -0.01, dz * 0.035]
    const shift = (p: Vec3, sign: number): Vec3 => [
      p[0] + across[0] * sign,
      p[1],
      p[2] + across[2] * sign,
    ]
    facet(out, [shift(root, 1), shift(foot, 1), shift(high, 1)], across)
    facet(out, [shift(root, -1), shift(foot, -1), shift(high, -1)], [-across[0], 0, -across[2]])
    facet(out, [shift(high, 1), shift(foot, 1), shift(foot, -1), shift(high, -1)], [dx, 0.8, dz])
  }
  g.add(out, IDENTITY, JUNGLE_BARK, K.bark, { flat: true })
}

function vines(g: PropBuilder): void {
  const out = faceted()
  const random = mulberry32(29)
  for (let k = 0; k < 5; k++) {
    const angle = k * 1.26 + 0.3
    const reach = 0.24 + random() * 0.06
    const top: Vec3 = [Math.cos(angle) * reach, 0.58, Math.sin(angle) * reach]
    const drop = 0.16 + random() * 0.12
    const side: Vec3 = [-Math.sin(angle) * 0.005, 0, Math.cos(angle) * 0.005]
    const middle: Vec3 = [top[0] * 1.04, top[1] - drop * 0.55, top[2] * 1.04]
    const end: Vec3 = [top[0] * 1.02, top[1] - drop, top[2] * 1.02]
    for (const [a, b] of [
      [top, middle],
      [middle, end],
    ] as const) {
      const quad: Vec3[] = [
        [a[0] - side[0], a[1], a[2] - side[2]],
        [a[0] + side[0], a[1], a[2] + side[2]],
        [b[0] + side[0], b[1], b[2] + side[2]],
        [b[0] - side[0], b[1], b[2] - side[2]],
      ]
      const facing: Vec3 = [Math.cos(angle), 0, Math.sin(angle)]
      facet(out, quad, facing)
      facet(out, quad, [-facing[0], 0, -facing[2]])
    }
  }
  g.add(out, IDENTITY, JUNGLE_VINE, K.leaf, { flat: true })
}

export function jungleTree(detail: Detail): PropGeometry {
  const g = new PropBuilder()
  if (detail === 2) limbs(g, [straightened(JUNGLE_TRUNK)], JUNGLE_BARK, 3)
  else {
    limbs(g, [JUNGLE_TRUNK, JUNGLE_BOUGH], JUNGLE_BARK, detail === 0 ? 6 : 4)
    crown(
      g,
      { lobes: [JUNGLE_BOUGH_LOBE], mesh: detail === 0 ? [6, 4] : [4, 3], jitter: 0.24 },
      [JUNGLE_LEAVES[1]],
      0.55,
      11,
    )
  }
  if (detail === 0) {
    buttresses(g)
    vines(g)
  }
  crown(g, JUNGLE_CROWNS[detail], JUNGLE_LEAVES, 0.5, 3)
  return g.geometry()
}

export function deadTree(): PropGeometry {
  const g = new PropBuilder()
  const colour = '#5e5245'
  g.add(cyl(0.02, 0.04, 0.5, 5), at(0, 0.25, 0), colour, K.bark)
  const branches: [number, number, number, number, number][] = [
    [0.07, 0.4, 0, -0.8, 0.2],
    [-0.06, 0.34, 0.02, 0.9, 0.18],
    [0.02, 0.46, -0.05, 0.6, 0.16],
    [-0.02, 0.5, 0.05, -0.5, 0.14],
  ]
  for (const [k, [x, y, z, r, l]] of branches.entries()) {
    g.add(cyl(0.006, 0.014, l, 4), at(x, y, z, k * 0.7, k, r), colour, K.bark)
  }
  return g.geometry()
}

const ACACIA_BARK = '#5b4630'
const ACACIA_LEAVES = ['#5e7a2c', '#6a842f', '#647f2d'] as const
type Plate = readonly [
  x: number,
  y: number,
  z: number,
  width: number,
  thickness: number,
  depth: number,
]
const ACACIA_TRUNK: Limb = {
  points: [
    [0, 0, 0],
    [0.012, 0.12, 0.002],
    [0.03, 0.24, 0.006],
  ],
  radii: [0.034, 0.025, 0.021],
}
const ACACIA_LIMBS: readonly Limb[] = [
  {
    points: [
      [0.03, 0.23, 0.006],
      [0.1, 0.33, 0.02],
      [0.17, 0.43, 0.03],
    ],
    radii: [0.019, 0.013, 0.008],
  },
  {
    points: [
      [0.028, 0.22, 0.008],
      [-0.04, 0.33, 0.04],
      [-0.12, 0.42, 0.06],
    ],
    radii: [0.018, 0.012, 0.008],
  },
  {
    points: [
      [0.03, 0.22, 0.004],
      [0.03, 0.34, -0.06],
      [0.05, 0.46, -0.11],
    ],
    radii: [0.016, 0.011, 0.007],
  },
]
type Canopy = { plates: readonly Plate[]; mesh: LobeMesh }
const ACACIA_CANOPIES: Record<Detail, Canopy> = {
  0: {
    plates: [
      [0.06, 0.48, -0.01, 0.25, 0.05, 0.2],
      [-0.12, 0.45, 0.05, 0.17, 0.042, 0.14],
      [0.07, 0.51, -0.1, 0.15, 0.038, 0.12],
      [0.15, 0.45, 0.07, 0.12, 0.035, 0.1],
    ],
    mesh: [8, 4],
  },
  1: {
    plates: [
      [0.06, 0.48, -0.01, 0.25, 0.05, 0.2],
      [-0.12, 0.45, 0.05, 0.17, 0.042, 0.14],
      [0.07, 0.51, -0.1, 0.15, 0.038, 0.12],
    ],
    mesh: [6, 3],
  },
  2: {
    plates: [
      [0.04, 0.48, -0.02, 0.27, 0.055, 0.22],
      [-0.12, 0.45, 0.05, 0.17, 0.045, 0.14],
    ],
    mesh: [5, 3],
  },
}

export function acacia(detail: Detail): PropGeometry {
  const g = new PropBuilder()
  if (detail === 0) limbs(g, [ACACIA_TRUNK, ...ACACIA_LIMBS], ACACIA_BARK, 5)
  if (detail === 1) limbs(g, [ACACIA_TRUNK, ...ACACIA_LIMBS].map(straightened), ACACIA_BARK, 4)
  if (detail === 2) {
    limbs(g, [ACACIA_TRUNK, ...ACACIA_LIMBS.slice(0, 2)].map(straightened), ACACIA_BARK, 3)
  }
  const { plates, mesh } = ACACIA_CANOPIES[detail]
  for (const [k, [x, y, z, width, thickness, depth]] of plates.entries()) {
    g.add(
      ball(mesh[0], mesh[1]),
      at(x, y, z, 0, k * 0.9, 0, width, thickness, depth),
      ACACIA_LEAVES[k % ACACIA_LEAVES.length] ?? '#5e7a2c',
      K.leaf,
      { jitter: 0.16, seed: k + 1 },
    )
  }
  return g.geometry()
}

export function cactus(): PropGeometry {
  const g = new PropBuilder()
  const colour = '#4b7a3a'
  g.add(cyl(0.035, 0.04, 0.42, 8), at(0, 0.21, 0), colour, K.plain)
  g.add(ball(8, 5), at(0, 0.42, 0, 0, 0, 0, 0.035), colour, K.plain)
  g.add(cyl(0.022, 0.022, 0.09, 6), at(0.06, 0.2, 0, 0, 0, Math.PI / 2), colour, K.plain)
  g.add(cyl(0.022, 0.022, 0.13, 6), at(0.1, 0.27, 0), colour, K.plain)
  g.add(cyl(0.02, 0.02, 0.07, 6), at(-0.05, 0.26, 0, 0, 0, Math.PI / 2), colour, K.plain)
  g.add(cyl(0.02, 0.02, 0.1, 6), at(-0.085, 0.31, 0), colour, K.plain)
  return g.geometry()
}

export function mushroom(): PropGeometry {
  const g = new PropBuilder()
  g.add(cyl(0.035, 0.05, 0.36, 7), at(0, 0.18, 0, 0.08, 0, 0.05), '#d9d1c2', K.plain)
  g.add(
    dome(1, 12, 6),
    at(0.015, 0.34, 0.03, 0.08, 0, 0.05, 0.27, 0.13, 0.27),
    '#3a9c96',
    K.mushroom,
    {
      jitter: 0.08,
    },
  )
  g.add(dome(1, 9, 5), at(0.16, 0.14, -0.06, 0, 0, -0.2, 0.1, 0.05, 0.1), '#7a4bab', K.mushroom)
  g.add(cyl(0.015, 0.02, 0.13, 5), at(0.16, 0.07, -0.06), '#d9d1c2', K.plain)
  return g.geometry()
}

export function crystalCluster(): PropGeometry {
  const g = new PropBuilder()
  const random = mulberry32(9)
  for (let k = 0; k < 7; k++) {
    const r = 0.03 + random() * 0.04
    const h = 0.18 + random() * 0.5
    const ax = (random() - 0.5) * 0.9
    const az = (random() - 0.5) * 0.9
    const x = (random() - 0.5) * 0.14
    const z = (random() - 0.5) * 0.14
    const placement = at(x, 0, z, ax, random() * 3, az)
    const colour = k % 3 === 0 ? '#d4b3ff' : k % 3 === 1 ? '#a879ff' : '#8a5cf0'
    g.add(translated(cyl(r, r, h, 6), 0, h / 2, 0), placement, colour, K.crystal)
    g.add(translated(cone(r, r * 2.2, 6), 0, h + r * 1.1, 0), placement, colour, K.crystal)
  }
  g.add(ico(0), at(0, 0.02, 0, 0, 0, 0, 0.12, 0.05, 0.12), '#5a4a66', K.rock, {
    jitter: 0.3,
    seed: 2,
    flat: true,
  })
  return g.geometry()
}

const BUSH_LEAVES = ['#446c28', '#4f7a2e', '#497329'] as const
const BUSH_CROWNS: Record<Detail, Crown> = {
  0: {
    lobes: [
      [0, 0.065, 0, 0.09],
      [0.075, 0.05, 0.03, 0.07],
      [-0.062, 0.05, -0.045, 0.072],
      [0.03, 0.048, -0.052, 0.056],
      [-0.048, 0.045, 0.045, 0.052],
    ],
    mesh: [6, 4],
    jitter: 0.25,
  },
  1: {
    lobes: [
      [0, 0.06, 0, 0.09],
      [0.07, 0.05, 0.02, 0.07],
      [-0.05, 0.05, -0.04, 0.07],
    ],
    mesh: [4, 3],
    jitter: 0.25,
  },
  2: {
    lobes: [[0.01, 0.055, -0.005, 0.12]],
    mesh: [4, 3],
    jitter: 0.22,
  },
}

export function bush(detail: Detail): PropGeometry {
  const g = new PropBuilder()
  crown(g, BUSH_CROWNS[detail], BUSH_LEAVES, detail === 2 ? 0.66 : 0.8, 7)
  return g.geometry()
}

export function reeds(): PropGeometry {
  const g = new PropBuilder()
  const random = mulberry32(3)
  for (let k = 0; k < 9; k++) {
    const x = (random() - 0.5) * 0.14
    const z = (random() - 0.5) * 0.14
    const h = 0.16 + random() * 0.14
    g.add(
      cone(0.008, h, 3),
      at(x, h / 2, z, (random() - 0.5) * 0.3, 0, (random() - 0.5) * 0.3),
      k % 3 ? '#7d8a3c' : '#9a8a4a',
      K.leaf,
    )
  }
  return g.geometry()
}

export function coral(): PropGeometry {
  const g = new PropBuilder()
  const random = mulberry32(5)
  const colours = ['#f06a7a', '#a06af0', '#ffa848', '#5ad0c8']
  for (let k = 0; k < 6; k++) {
    const colour = colours[k % 4] ?? '#f06a7a'
    const x = (random() - 0.5) * 0.2
    const z = (random() - 0.5) * 0.2
    const h = 0.06 + random() * 0.1
    g.add(
      cyl(0.008, 0.014, h, 5),
      at(x, h / 2, z, (random() - 0.5) * 0.6, 0, (random() - 0.5) * 0.6),
      colour,
      K.plain,
    )
    g.add(ball(5, 4), at(x, h, z, 0, 0, 0, 0.025), colour, K.plain)
  }
  g.add(ball(7, 4), at(0, 0.015, 0, 0, 0, 0, 0.08, 0.035, 0.08), '#e88a5a', K.plain, {
    jitter: 0.3,
    seed: 4,
  })
  return g.geometry()
}

export function rock(): PropGeometry {
  const g = new PropBuilder()
  g.add(ico(1), at(0, 0.04, 0, 0, 0, 0, 0.12, 0.08, 0.1), '#8a8580', K.rock, {
    jitter: 0.35,
    seed: 1,
    flat: true,
  })
  g.add(ico(0), at(0.1, 0.02, 0.05, 0.5, 1, 0, 0.05, 0.035, 0.05), '#7d7872', K.rock, {
    jitter: 0.3,
    seed: 2,
    flat: true,
  })
  return g.geometry()
}

export function boulder(): PropGeometry {
  return new PropBuilder()
    .add(ico(1), at(0, 0.08, 0, 0.2, 0.4, 0, 0.2, 0.15, 0.18), '#8f8a84', K.rock, {
      jitter: 0.3,
      seed: 5,
      flat: true,
    })
    .geometry()
}

export function serac(): PropGeometry {
  const g = new PropBuilder()
  const random = mulberry32(11)
  for (let k = 0; k < 4; k++) {
    const h = 0.12 + random() * 0.22
    g.add(
      cone(0.04 + random() * 0.04, h, 4),
      at(
        (random() - 0.5) * 0.18,
        h / 2 - 0.01,
        (random() - 0.5) * 0.18,
        (random() - 0.5) * 0.4,
        random(),
        (random() - 0.5) * 0.4,
      ),
      '#bfe6ff',
      K.ice,
      { jitter: 0.1, seed: k },
    )
  }
  return g.geometry()
}

export function basalt(): PropGeometry {
  const g = new PropBuilder()
  const random = mulberry32(13)
  for (let k = 0; k < 9; k++) {
    const h = 0.05 + random() * 0.2
    const angle = (k / 9) * 6.28
    const r = k ? 0.07 : 0
    g.add(
      translated(cyl(0.035, 0.035, h, 6), 0, h / 2, 0),
      at(Math.cos(angle) * r, -0.02, Math.sin(angle) * r),
      '#2a2626',
      K.rock,
    )
  }
  return g.geometry()
}

export function hoodoo(): PropGeometry {
  const g = new PropBuilder()
  g.add(cyl(0.06, 0.09, 0.32, 8, 3), at(0, 0.16, 0), '#b5643c', K.rock, { jitter: 0.25, seed: 3 })
  g.add(cyl(0.1, 0.09, 0.05, 8), at(0.01, 0.34, 0), '#8a4a2c', K.rock, { jitter: 0.2, seed: 4 })
  g.add(cyl(0.04, 0.06, 0.18, 7), at(0.13, 0.09, 0.05), '#c2703f', K.rock, {
    jitter: 0.25,
    seed: 6,
  })
  return g.geometry()
}

export function hay(): PropGeometry {
  const g = new PropBuilder()
  g.add(cyl(0.05, 0.055, 0.05, 9), at(0, 0.025, 0), '#d9b65a', K.wood)
  g.add(cone(0.055, 0.05, 9), at(0, 0.075, 0), '#cfa94c', K.wood)
  return g.geometry()
}

type PeakMesh = { rings: number; sides: number }
type PeakForm = { phase: number; sx: number; sz: number; sharp: boolean }
const PEAK_MESH: Record<Detail, PeakMesh> = {
  0: { rings: 6, sides: 24 },
  1: { rings: 5, sides: 17 },
  2: { rings: 4, sides: 12 },
}
const PEAK_SKIRT = -0.05

function peakForm(seed: number, sharp: boolean): PeakForm {
  const random = mulberry32(seed)
  return {
    phase: random() * 10,
    sx: (random() - 0.5) * 0.7,
    sz: (random() - 0.5) * 0.7,
    sharp,
  }
}

function peakHeight(x: number, z: number, f: number, { phase, sx, sz, sharp }: PeakForm): number {
  let h = (1 - f) ** (sharp ? 1.85 : 1.35)
  h +=
    0.42 * Math.max(0, 1 - Math.hypot(x - sx, z - sz) / 0.5) ** 2 +
    0.25 * Math.max(0, 1 - Math.hypot(x + sz, z - sx) / 0.42) ** 2
  const ridge = peakNoise.ridged(x * 2.8 + phase, z * 2.8 - phase, 2)
  return Math.max(0, h * (0.58 + 0.6 * ridge)) - f * 0.05
}

function peakRings(form: PeakForm, { rings, sides }: PeakMesh, scatter: Random): Vec3[][] {
  const grid: Vec3[][] = [[[0, peakHeight(0, 0, 0, form), 0]]]
  for (let r = 1; r <= rings; r++) {
    const rim = r === rings
    const twist = (scatter() - 0.5) * 0.4
    const row: Vec3[] = []
    for (let s = 0; s < sides; s++) {
      const f = (r / rings) * (rim ? 1 : 0.94 + scatter() * 0.12)
      const a = ((s + twist + (rim ? 0 : (scatter() - 0.5) * 0.5)) / sides) * Math.PI * 2
      const radius = f * (0.86 + 0.28 * peakNoise.n2(a * 2.1 + form.phase, f * 3.3))
      const x = Math.cos(a) * radius
      const z = Math.sin(a) * radius
      row.push([x, rim ? PEAK_SKIRT : peakHeight(x, z, f, form), z])
    }
    grid.push(row)
  }
  return grid
}

function peakShape(seed: number, sharp: boolean, detail: Detail): Shape {
  const mesh = PEAK_MESH[detail]
  const grid = peakRings(peakForm(seed, sharp), mesh, mulberry32(seed * 97 + detail))
  const point = (r: number, s: number): Vec3 => grid[r]?.[r === 0 ? 0 : s % mesh.sides] ?? [0, 0, 0]
  const out = faceted()
  const up: Vec3 = [0, 1, 0]
  for (let s = 0; s < mesh.sides; s++) facet(out, [point(0, 0), point(1, s), point(1, s + 1)], up)
  for (let r = 1; r < mesh.rings; r++) {
    for (let s = 0; s < mesh.sides; s++) {
      const a = point(r, s)
      const b = point(r, s + 1)
      const c = point(r + 1, s + 1)
      const d = point(r + 1, s)
      const ridgeAcross = a[1] + c[1] >= b[1] + d[1]
      facet(out, ridgeAcross ? [a, b, c] : [a, b, d], up)
      facet(out, ridgeAcross ? [a, c, d] : [b, c, d], up)
    }
  }
  return out
}

export function peak(
  seed: number,
  sharp: boolean,
  colour: string,
  kind: number,
  detail: Detail,
): PropGeometry {
  return new PropBuilder()
    .add(peakShape(seed, sharp, detail), IDENTITY, colour, kind, { flat: true })
    .geometry()
}
