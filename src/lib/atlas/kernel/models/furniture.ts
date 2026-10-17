import { LOCOMOTIVE_STACK } from '../../contract/scene.ts'
import { mulberry32 } from '../../world/noise.ts'
import { type ClothPin, PropBuilder, type PropGeometry } from '../builder.ts'
import { PROP_KIND } from '../kinds.ts'
import type { Matrix } from '../matrix.ts'
import {
  circle,
  computeNormals,
  dome,
  lathe,
  openBox,
  plane,
  type Shape,
  scaled,
  surface,
} from '../primitives.ts'
import {
  at,
  ball,
  box,
  cone,
  cyl,
  facet,
  faceted,
  IDENTITY,
  ico,
  tube,
  twoSided,
  type Vec3,
} from './parts.ts'

const K = PROP_KIND

type HullForm = {
  length: number
  beam: number
  deck: number
  keel: number
  sheer: number
  transom: number
  stations: number
  around: number
}
type HullPaint = { hull: string; band: string; deck: string }

const BAND_ANGLE = 0.32

function hullPoint(form: HullForm, u: number, theta: number): Vec3 {
  const half =
    (form.beam / 2) *
    (u < 0.4
      ? form.transom + (1 - form.transom) * Math.sin(((u / 0.4) * Math.PI) / 2)
      : Math.cos((((u - 0.4) / 0.6) * Math.PI) / 2) ** 0.6)
  const deck = form.deck + form.sheer * ((1 - u) ** 2 + 0.6 * u ** 3)
  const keel = form.keel * (0.45 + 0.55 * Math.sin(Math.PI * u) ** 0.5)
  return [
    (u - 0.5) * form.length,
    deck - (deck - keel) * Math.sin(theta) ** 0.8,
    half * Math.cos(theta),
  ]
}

function hullStrake(form: HullForm, from: number, to: number, columns: number): Shape {
  const rows = form.stations - 1
  return computeNormals(
    surface(rows, columns, (r, c) => hullPoint(form, r / rows, from + ((to - from) * c) / columns)),
  )
}

function hull(g: PropBuilder, form: HullForm, paint: HullPaint, placement: Matrix): void {
  const bottom = form.around - 2
  g.add(hullStrake(form, 0, BAND_ANGLE, 1), placement, paint.band, K.wood)
  g.add(hullStrake(form, BAND_ANGLE, Math.PI - BAND_ANGLE, bottom), placement, paint.hull, K.wood)
  g.add(hullStrake(form, Math.PI - BAND_ANGLE, Math.PI, 1), placement, paint.band, K.wood)
  const rows = form.stations - 1
  const deck = faceted()
  const edge: Vec3[] = []
  for (let r = 0; r < rows; r++) edge.push(hullPoint(form, r / rows, 0))
  edge.push(hullPoint(form, 1, 0))
  for (let r = rows - 1; r >= 0; r--) edge.push(hullPoint(form, r / rows, Math.PI))
  facet(deck, edge, [0, 1, 0])
  const transom: Vec3[] = []
  for (let c = 0; c <= form.around; c++)
    transom.push(hullPoint(form, 0, (c / form.around) * Math.PI))
  facet(deck, transom, [-1, 0, 0])
  g.add(deck, placement, paint.deck, K.wood, { flat: true })
}

function sail(
  g: PropBuilder,
  corners: readonly [Vec3, Vec3, Vec3, Vec3],
  billow: Vec3,
  colour: string,
  columns = 3,
  rows = 2,
): void {
  const [a, b, c, d] = corners
  const front = surface(rows, columns, (r, k) => {
    const u = k / columns
    const v = r / rows
    const top: Vec3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]
    const low: Vec3 = [d[0] + (c[0] - d[0]) * u, d[1] + (c[1] - d[1]) * u, d[2] + (c[2] - d[2]) * u]
    const swell = Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.2 + 0.8 * v))
    return [
      top[0] + (low[0] - top[0]) * v + billow[0] * swell,
      top[1] + (low[1] - top[1]) * v + billow[1] * swell,
      top[2] + (low[2] - top[2]) * v + billow[2] * swell,
    ]
  })
  g.add(twoSided(computeNormals(front)), IDENTITY, colour, K.plain)
}

function pennant(
  g: PropBuilder,
  corners: readonly Vec3[],
  facing: Vec3,
  colour: string,
  pinned: ClothPin,
): void {
  const out = faceted()
  facet(out, corners, facing)
  facet(out, corners, [-facing[0], -facing[1], -facing[2]])
  g.add(out, IDENTITY, colour, K.cloth, { flat: true, pinned })
}

function spar(
  g: PropBuilder,
  from: Vec3,
  to: Vec3,
  radius: number,
  colour: string,
  sides = 4,
): void {
  tube(g, [from, to], [radius, radius * 0.75], colour, K.wood, sides)
}

const SHIP_HULL: HullForm = {
  length: 0.27,
  beam: 0.1,
  deck: 0.04,
  keel: -0.03,
  sheer: 0.014,
  transom: 0.72,
  stations: 12,
  around: 8,
}
const SHIP_PAINT: HullPaint = { hull: '#5e4128', band: '#9a7340', deck: '#8a6a44' }
const SHIP_SPAR = '#4a3422'
const SAILCLOTH = '#f1e8d6'
const ROPE = '#3a2c20'
type SquareSail = { top: number; width: number; drop: number }
type Mast = { x: number; top: number; sails: readonly SquareSail[] }
const SHIP_MASTS: readonly Mast[] = [
  {
    x: 0.075,
    top: 0.27,
    sails: [
      { top: 0.13, width: 0.1, drop: 0.06 },
      { top: 0.19, width: 0.082, drop: 0.054 },
      { top: 0.243, width: 0.062, drop: 0.045 },
    ],
  },
  {
    x: 0,
    top: 0.305,
    sails: [
      { top: 0.14, width: 0.112, drop: 0.066 },
      { top: 0.207, width: 0.092, drop: 0.06 },
      { top: 0.268, width: 0.068, drop: 0.052 },
    ],
  },
  {
    x: -0.075,
    top: 0.245,
    sails: [
      { top: 0.2, width: 0.07, drop: 0.05 },
      { top: 0.235, width: 0.05, drop: 0.03 },
    ],
  },
]

export function ship(): PropGeometry {
  const g = new PropBuilder()
  hull(g, SHIP_HULL, SHIP_PAINT, IDENTITY)
  const deck = (x: number) => hullPoint(SHIP_HULL, x / SHIP_HULL.length + 0.5, 0)[1]
  g.add(
    openBox(0.046, 0.026, 0.078, ['bottom']),
    at(-0.1, deck(-0.1) + 0.011, 0),
    '#6e4e30',
    K.wood,
  )
  for (const z of [-0.02, 0, 0.02]) {
    g.add(
      plane(0.008, 0.008),
      at(-0.1235, deck(-0.1) + 0.014, z, 0, -Math.PI / 2, 0),
      '#ffcf7a',
      K.lamp,
    )
  }
  g.add(box(0.008, 0.011, 0.008), at(-0.128, deck(-0.1) + 0.033, 0), '#ffcf7a', K.lamp)
  g.add(
    openBox(0.03, 0.013, 0.062, ['bottom']),
    at(0.094, deck(0.094) + 0.004, 0),
    '#6e4e30',
    K.wood,
  )
  for (const side of [1, -1]) {
    for (let k = 0; k < 4; k++) {
      const x = -0.055 + k * 0.04
      const [, y, z] = hullPoint(SHIP_HULL, x / SHIP_HULL.length + 0.5, BAND_ANGLE * 0.5)
      g.add(
        plane(0.008, 0.006),
        at(x, y - 0.002, side * (z + 0.0008), 0, side > 0 ? 0 : Math.PI, 0),
        '#1c1611',
        K.plain,
      )
    }
  }
  spar(g, [0.124, deck(0.124) + 0.004, 0], [0.175, deck(0.124) + 0.034, 0], 0.0026, SHIP_SPAR)
  for (const mast of SHIP_MASTS) {
    const base = deck(mast.x) - 0.004
    spar(g, [mast.x, base, 0], [mast.x, mast.top, 0], 0.0042, SHIP_SPAR, 5)
    g.add(cyl(0.009, 0.007, 0.004, 6), at(mast.x, mast.top - 0.07, 0), SHIP_SPAR, K.wood)
    for (const { top, width, drop } of mast.sails) {
      spar(
        g,
        [mast.x + 0.004, top + 0.002, -width / 2 - 0.006],
        [mast.x + 0.004, top + 0.002, width / 2 + 0.006],
        0.0017,
        SHIP_SPAR,
      )
      sail(
        g,
        [
          [mast.x + 0.005, top, -width / 2],
          [mast.x + 0.005, top, width / 2],
          [mast.x + 0.007, top - drop, width * 0.54],
          [mast.x + 0.007, top - drop, -width * 0.54],
        ],
        [0.016, 0, 0],
        SAILCLOTH,
      )
    }
    for (const side of [1, -1]) {
      tube(
        g,
        [
          [mast.x - 0.012, base + 0.006, side * 0.046],
          [mast.x, mast.top - 0.03, side * 0.004],
        ],
        [0.0008, 0.0008],
        ROPE,
        K.wood,
        3,
      )
    }
  }
  const mizzen = SHIP_MASTS[2]?.x ?? -0.075
  sail(
    g,
    [
      [mizzen - 0.004, 0.17, 0],
      [mizzen - 0.062, 0.182, 0],
      [mizzen - 0.07, 0.07, 0],
      [mizzen - 0.004, 0.07, 0],
    ],
    [0, 0, 0.012],
    SAILCLOTH,
    2,
    2,
  )
  spar(g, [mizzen, 0.068, 0], [mizzen - 0.074, 0.066, 0], 0.0016, SHIP_SPAR)
  const fore = SHIP_MASTS[0]?.x ?? 0.075
  for (const [head, reach] of [
    [0.235, 0.172],
    [0.19, 0.15],
  ] as const) {
    sail(
      g,
      [
        [fore + 0.004, head, 0],
        [fore + 0.009, head - 0.008, 0],
        [reach, 0.078, 0],
        [fore + 0.03, 0.07, 0],
      ],
      [0, 0, 0.01],
      SAILCLOTH,
      2,
      2,
    )
  }
  tube(
    g,
    [
      [fore, SHIP_MASTS[0]?.top ?? 0.27, 0],
      [0.175, deck(0.124) + 0.034, 0],
    ],
    [0.0008, 0.0008],
    ROPE,
    K.wood,
    3,
  )
  const main = SHIP_MASTS[1]
  if (main) {
    pennant(
      g,
      [
        [main.x, main.top + 0.004, 0],
        [main.x - 0.05, main.top - 0.002, 0.004],
        [main.x, main.top - 0.008, 0],
      ],
      [0, 0, 1],
      '#b3402e',
      'right',
    )
  }
  spar(g, [-0.13, deck(-0.1) + 0.02, 0], [-0.142, deck(-0.1) + 0.06, 0], 0.0012, SHIP_SPAR, 3)
  pennant(
    g,
    [
      [-0.141, deck(-0.1) + 0.058, 0],
      [-0.166, deck(-0.1) + 0.056, 0.002],
      [-0.166, deck(-0.1) + 0.04, 0.002],
      [-0.139, deck(-0.1) + 0.042, 0],
    ],
    [0, 0, 1],
    '#2a3f9a',
    'right',
  )
  return g.geometry()
}

const ENVELOPE_GORES = ['#c9a24a', '#b8913f'] as const
const ENVELOPE_CENTRE = 0.195
const ENVELOPE_LENGTH = 0.6
const ENVELOPE_RADIUS = 0.08
const ENVELOPE_ROWS = 13
const ENVELOPE_AROUND = 20
const AIRSHIP_TRIM = '#7a4bab'
const BRASS = '#c99a2e'

function envelopeRadius(t: number): number {
  return ENVELOPE_RADIUS * Math.sin(Math.PI * Math.min(1, 0.02 + t * 0.98) ** 1.15) ** 0.62
}

function envelopePoint(t: number, angle: number, swell = 0): Vec3 {
  const radius = envelopeRadius(t) + swell
  return [
    Math.cos(angle) * radius,
    ENVELOPE_CENTRE + Math.sin(angle) * radius,
    (t - 0.5) * ENVELOPE_LENGTH,
  ]
}

function envelope(g: PropBuilder): void {
  const gores = ENVELOPE_AROUND / 2
  for (let k = 0; k < gores; k++) {
    const from = (k / gores) * Math.PI * 2
    const span = (Math.PI * 2) / gores
    const shape = surface(ENVELOPE_ROWS, 2, (r, c) =>
      envelopePoint(r / ENVELOPE_ROWS, from + (span * c) / 2),
    )
    for (let i = 0; i < shape.positions.length; i += 3) {
      const x = shape.positions[i] ?? 0
      const y = (shape.positions[i + 1] ?? 0) - ENVELOPE_CENTRE
      const z = shape.positions[i + 2] ?? 0
      const t = z / ENVELOPE_LENGTH + 0.5
      const slope =
        (envelopeRadius(Math.min(1, t + 0.01)) - envelopeRadius(Math.max(0, t - 0.01))) / 0.02
      const length = Math.hypot(x, y) || 1
      const nx = x / length
      const ny = y / length
      const nz = -slope / ENVELOPE_LENGTH
      const n = Math.hypot(nx, ny, nz) || 1
      shape.normals[i] = nx / n
      shape.normals[i + 1] = ny / n
      shape.normals[i + 2] = nz / n
    }
    g.add(shape, IDENTITY, ENVELOPE_GORES[k % 2] ?? '#c9a24a', K.plain)
  }
}

function ribs(g: PropBuilder): void {
  for (const t of [0.18, 0.36, 0.54, 0.72]) {
    const radius = envelopeRadius(t) + 0.0016
    g.add(
      cyl(radius, radius, 0.006, ENVELOPE_AROUND, 1, true),
      at(0, ENVELOPE_CENTRE, (t - 0.5) * ENVELOPE_LENGTH, Math.PI / 2, 0, 0),
      BRASS,
      K.metal,
    )
  }
  for (const angle of [Math.PI / 2, Math.PI * 0.18, Math.PI * 0.82]) {
    const points: Vec3[] = []
    const radii: number[] = []
    for (let k = 0; k <= 10; k++) {
      const t = 0.06 + (k / 10) * 0.86
      points.push(envelopePoint(t, angle, 0.0012))
      radii.push(0.0018)
    }
    tube(g, points, radii, BRASS, K.metal, 3)
  }
}

function fins(g: PropBuilder): void {
  const tail = -ENVELOPE_LENGTH / 2
  for (let k = 0; k < 4; k++) {
    const angle = Math.PI / 4 + (k * Math.PI) / 2
    const root = envelopeRadius(0.14)
    const out = faceted()
    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    const fin = (reach: number, z: number): Vec3 => [dx * reach, ENVELOPE_CENTRE + dy * reach, z]
    const corners = [
      fin(root * 0.6, tail + 0.115),
      fin(root + 0.05, tail + 0.05),
      fin(root + 0.05, tail + 0.012),
      fin(root * 0.3, tail + 0.02),
    ]
    const thickness: Vec3 = [-dy * 0.002, dx * 0.002, 0]
    const shift = (p: Vec3, sign: number): Vec3 => [
      p[0] + thickness[0] * sign,
      p[1] + thickness[1] * sign,
      p[2],
    ]
    facet(
      out,
      corners.map((p) => shift(p, 1)),
      thickness,
    )
    facet(
      out,
      corners.map((p) => shift(p, -1)),
      [-thickness[0], -thickness[1], 0],
    )
    for (const [i, p] of corners.entries()) {
      const q = corners[(i + 1) % corners.length] ?? p
      facet(
        out,
        [shift(p, 1), shift(q, 1), shift(q, -1), shift(p, -1)],
        [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - ENVELOPE_CENTRE, (p[2] + q[2]) / 2 - tail],
      )
    }
    g.add(out, IDENTITY, AIRSHIP_TRIM, K.plain, { flat: true })
  }
}

function propeller(g: PropBuilder, z: number, spin: number): void {
  g.add(cyl(0.0035, 0.005, 0.012, 6), at(0, 0, z, Math.PI / 2, 0, 0), BRASS, K.rotor)
  for (let k = 0; k < 4; k++) {
    const angle = spin + (k * Math.PI) / 2
    g.add(
      box(0.0065, 0.027, 0.0016),
      at(Math.sin(angle) * 0.015, Math.cos(angle) * 0.015, z, 0.25, 0, -angle),
      '#5a4030',
      K.rotor,
    )
  }
}

const GONDOLA: HullForm = {
  length: 0.21,
  beam: 0.06,
  deck: 0.034,
  keel: -0.014,
  sheer: 0.008,
  transom: 0.6,
  stations: 9,
  around: 6,
}
const GONDOLA_PAINT: HullPaint = { hull: '#6e4e30', band: AIRSHIP_TRIM, deck: '#8a6a44' }

export function airship(): PropGeometry {
  const g = new PropBuilder()
  envelope(g)
  ribs(g)
  fins(g)
  const lengthwise = at(0, 0, 0.012, 0, -Math.PI / 2, 0)
  hull(g, GONDOLA, GONDOLA_PAINT, lengthwise)
  g.add(openBox(0.036, 0.024, 0.1, ['bottom']), at(0, 0.05, 0.004), '#5a3a2a', K.plaster)
  g.add(box(0.044, 0.004, 0.11), at(0, 0.064, 0.004), '#3a2a1e', K.wood)
  g.add(cyl(0.0065, 0.008, 0.042, 8, 1, true), at(0, 0.086, -0.02), '#2f2c2a', K.metal)
  g.add(cyl(0.0085, 0.0085, 0.004, 8, 1, true), at(0, 0.106, -0.02), BRASS, K.gold)
  g.add(box(0.01, 0.008, 0.006), at(0, 0.044, 0.118), '#ffcf7a', K.lamp)
  g.add(ico(0), at(0, -0.008, 0.02, 0, 0, 0, 0.012, 0.016, 0.012), '#c9a4ff', K.crystal, {
    flat: true,
  })
  g.add(
    cyl(0.0022, 0.0022, 0.24, 4, 1, true),
    at(0, 0, 0.022, Math.PI / 2, 0, 0),
    '#3a2a1a',
    K.rotor,
  )
  propeller(g, -0.101, 0)
  propeller(g, 0.145, Math.PI / 4)
  for (const z of [-0.06, 0.02, 0.09]) {
    for (const side of [1, -1]) {
      tube(
        g,
        [
          [side * 0.022, 0.066, z],
          [
            side * envelopeRadius(z / ENVELOPE_LENGTH + 0.5) * 0.62,
            ENVELOPE_CENTRE - envelopeRadius(z / ENVELOPE_LENGTH + 0.5) * 0.78,
            z * 1.1,
          ],
        ],
        [0.0009, 0.0009],
        '#2a2018',
        K.metal,
        3,
      )
    }
  }
  return g.geometry()
}

const LOCO_IRON = '#2a2624'
const LOCO_BOILER = '#3d3a40'
const LOCO_LIVERY = '#5a2a2a'
const ETHER = '#c9a4ff'
const TENDER_LOAD: readonly (readonly [x: number, z: number])[] = [
  [-0.008, -0.04],
  [0.007, -0.047],
  [-0.002, -0.054],
]

function wheel(g: PropBuilder, x: number, z: number, radius: number, sides: number): void {
  const side = Math.sign(x) || 1
  g.add(
    cyl(radius, radius, 0.004, sides, 1, true),
    at(x, radius, z, 0, 0, Math.PI / 2),
    LOCO_IRON,
    K.metal,
  )
  g.add(
    circle(radius, sides),
    at(x + side * 0.002, radius, z, 0, side * (Math.PI / 2), 0),
    LOCO_IRON,
    K.metal,
  )
}

const STACK_PROFILE: readonly (readonly [number, number])[] = [
  [0.0058, 0],
  [0.005, 0.013],
  [0.0076, 0.023],
  [0.0082, 0.026],
  [0.0062, 0.026],
  [0.0005, 0.02],
]
const STACK_HEIGHT = Math.max(...STACK_PROFILE.map(([, height]) => height))

export function locomotive(): PropGeometry {
  const g = new PropBuilder()
  const axis = 0.05
  g.add(box(0.034, 0.008, 0.15), at(0, 0.017, 0.012), LOCO_IRON, K.metal)
  const pilot = faceted()
  const tip: Vec3 = [0, 0.004, 0.094]
  for (const side of [1, -1]) {
    facet(pilot, [[side * 0.02, 0.022, 0.082], tip, [side * 0.02, 0.004, 0.082]], [side, 0, 0.6])
  }
  facet(pilot, [[-0.02, 0.022, 0.082], [0.02, 0.022, 0.082], tip], [0, 1, 0.6])
  g.add(pilot, IDENTITY, LOCO_IRON, K.metal, { flat: true })
  g.add(box(0.042, 0.007, 0.005), at(0, 0.025, 0.081), '#7a2a22', K.plaster)
  g.add(cyl(0.0185, 0.0185, 0.016, 12), at(0, axis, 0.07, Math.PI / 2, 0, 0), LOCO_IRON, K.metal)
  g.add(circle(0.013, 10), at(0, axis, 0.0785), '#4a4646', K.metal)
  g.add(
    cyl(0.0172, 0.0172, 0.07, 12, 1, true),
    at(0, axis, 0.027, Math.PI / 2, 0, 0),
    LOCO_BOILER,
    K.metal,
  )
  for (const z of [0.052, 0.027, 0.002]) {
    g.add(cyl(0.018, 0.018, 0.003, 12, 1, true), at(0, axis, z, Math.PI / 2, 0, 0), BRASS, K.gold)
  }
  g.add(
    lathe(STACK_PROFILE, 8),
    at(LOCOMOTIVE_STACK.x, LOCOMOTIVE_STACK.y - STACK_HEIGHT, LOCOMOTIVE_STACK.z),
    LOCO_IRON,
    K.metal,
  )
  g.add(dome(1, 8, 3), at(0, axis + 0.015, 0.035, 0, 0, 0, 0.008, 0.01, 0.008), BRASS, K.gold)
  g.add(ico(0), at(0, axis + 0.02, 0.01, 0.4, 0.3, 0, 0.0065, 0.011, 0.0065), ETHER, K.crystal, {
    flat: true,
  })
  g.add(box(0.008, 0.007, 0.005), at(0, axis + 0.024, 0.077), '#ffe2a0', K.lamp)
  g.add(openBox(0.042, 0.042, 0.03, ['bottom']), at(0, 0.047, -0.017), LOCO_LIVERY, K.plaster)
  g.add(box(0.048, 0.004, 0.038), at(0, 0.07, -0.017), LOCO_IRON, K.metal)
  g.add(openBox(0.04, 0.024, 0.03, ['bottom']), at(0, 0.033, -0.047), LOCO_LIVERY, K.metal)
  for (const [k, [x, z]] of TENDER_LOAD.entries()) {
    g.add(ico(0), at(x, 0.048, z, k, k * 0.7, 0, 0.007, 0.011, 0.007), ETHER, K.crystal, {
      flat: true,
    })
  }
  for (const side of [1, -1]) {
    for (const z of [0.042, 0.017, -0.008]) wheel(g, side * 0.019, z, 0.0115, 10)
    wheel(g, side * 0.017, 0.068, 0.0072, 8)
    for (const z of [-0.038, -0.056]) wheel(g, side * 0.019, z, 0.0085, 8)
    g.add(box(0.0018, 0.003, 0.056), at(side * 0.0225, 0.0105, 0.017), BRASS, K.gold)
  }
  return g.geometry()
}

type Wagon = { colour: string; load: 'coach' | 'freight' | 'ether' }
const WAGONS: readonly Wagon[] = [
  { colour: '#5a6a8a', load: 'coach' },
  { colour: '#7a3a3a', load: 'freight' },
  { colour: '#5a7a4a', load: 'ether' },
  { colour: '#6a5a7a', load: 'coach' },
]

function bogies(g: PropBuilder): void {
  for (const z of [-0.038, 0.038]) {
    g.add(box(0.032, 0.007, 0.03), at(0, 0.013, z), LOCO_IRON, K.metal)
    for (const side of [1, -1]) {
      for (const dz of [-0.009, 0.009]) wheel(g, side * 0.018, z + dz, 0.0075, 6)
    }
  }
}

function barrelRoof(width: number, length: number, rise: number): Shape {
  const out = faceted()
  const steps = 5
  const arc = (k: number, z: number): Vec3 => {
    const angle = (k / steps) * Math.PI
    return [Math.cos(angle) * (width / 2), Math.sin(angle) * rise, z]
  }
  for (let k = 0; k < steps; k++) {
    const mid = ((k + 0.5) / steps) * Math.PI
    facet(
      out,
      [arc(k, -length / 2), arc(k + 1, -length / 2), arc(k + 1, length / 2), arc(k, length / 2)],
      [Math.cos(mid), Math.sin(mid), 0],
    )
  }
  for (const end of [1, -1]) {
    const ring: Vec3[] = []
    for (let k = 0; k <= steps; k++) ring.push(arc(k, (end * length) / 2))
    facet(out, ring, [0, 0, end])
  }
  return out
}

export function wagon(index: number): PropGeometry {
  const g = new PropBuilder()
  const { colour, load } = WAGONS[index % WAGONS.length] ?? { colour: '#5a6a8a', load: 'coach' }
  g.add(box(0.044, 0.006, 0.118), at(0, 0.019, 0), LOCO_IRON, K.metal)
  for (const z of [-0.0615, 0.0615])
    g.add(box(0.006, 0.006, 0.005), at(0, 0.019, z), LOCO_IRON, K.metal)
  bogies(g)
  if (load === 'coach') {
    g.add(openBox(0.044, 0.04, 0.11, ['bottom', 'top']), at(0, 0.042, 0), colour, K.plaster)
    g.add(barrelRoof(0.048, 0.114, 0.008), at(0, 0.062, 0), '#3a3530', K.roof, { flat: true })
  } else if (load === 'freight') {
    g.add(openBox(0.044, 0.04, 0.11, ['bottom']), at(0, 0.042, 0), colour, K.wood)
    for (const side of [1, -1]) {
      g.add(
        plane(0.03, 0.03),
        at(side * 0.0225, 0.04, 0, 0, side * (Math.PI / 2), 0),
        '#4a2a26',
        K.wood,
      )
    }
    g.add(box(0.048, 0.003, 0.114), at(0, 0.0635, 0), '#3a3530', K.roof)
  } else {
    g.add(openBox(0.044, 0.03, 0.11, ['bottom', 'top']), at(0, 0.037, 0), colour, K.metal)
    g.add(plane(0.042, 0.108), at(0, 0.048, 0, -Math.PI / 2, 0, 0), '#2a2236', K.plain)
    const random = mulberry32(index * 17 + 3)
    for (let k = 0; k < 5; k++) {
      g.add(
        ico(0),
        at(
          (random() - 0.5) * 0.024,
          0.052,
          -0.04 + k * 0.02,
          random(),
          random() * 3,
          0,
          0.008,
          0.012 + random() * 0.006,
          0.008,
        ),
        k % 2 ? ETHER : '#a879ff',
        K.crystal,
        { flat: true },
      )
    }
  }
  return g.geometry()
}

export function pylon(): PropGeometry {
  const g = new PropBuilder()
  g.add(box(0.01, 0.12, 0.01), at(0, 0.06, 0), '#3a3530', K.metal)
  g.add(box(0.06, 0.006, 0.006), at(0.02, 0.12, 0), '#3a3530', K.metal)
  g.add(octahedron(), at(0, 0.14, 0, 0, 0, 0, 0.012, 0.022, 0.012), '#b48cff', K.crystal, {
    flat: true,
  })
  return g.geometry()
}

const OCTAHEDRON_POINTS: readonly Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]
const OCTAHEDRON_FACES: readonly Vec3[] = [
  [0, 2, 4],
  [0, 4, 3],
  [0, 3, 5],
  [0, 5, 2],
  [1, 2, 5],
  [1, 5, 3],
  [1, 3, 4],
  [1, 4, 2],
]

function octahedron(): Shape {
  const out: Shape = { positions: [], normals: [], indices: [], indexed: false }
  for (const face of OCTAHEDRON_FACES) {
    for (const index of face) {
      const point = OCTAHEDRON_POINTS[index] ?? [0, 0, 0]
      out.positions.push(...point)
      out.normals.push(...point)
    }
  }
  return out
}

export function signpost(): PropGeometry {
  const g = new PropBuilder()
  g.add(cyl(0.003, 0.004, 0.08, 4), at(0, 0.04, 0), '#5a4026', K.wood)
  g.add(box(0.04, 0.012, 0.004), at(0.012, 0.07, 0, 0, 0, 0.1), '#8a6a44', K.wood)
  return g.geometry()
}

export function cairn(): PropGeometry {
  const g = new PropBuilder()
  for (let k = 0; k < 4; k++) {
    g.add(
      ico(0),
      at(0, 0.008 + k * 0.014, 0, k, k, 0, 0.016 - k * 0.003, 0.009, 0.015 - k * 0.003),
      '#9a958c',
      K.rock,
      {
        jitter: 0.2,
        seed: k,
        flat: true,
      },
    )
  }
  return g.geometry()
}

export function sleeper(): PropGeometry {
  return new PropBuilder().add(box(0.1, 0.012, 0.018), at(), '#4a3426', K.wood).geometry()
}

export function trestle(): PropGeometry {
  return new PropBuilder().add(box(0.02, 1, 0.02), at(), '#4a3426', K.wood).geometry()
}

export function stalagmites(): PropGeometry {
  const g = new PropBuilder()
  const random = mulberry32(3)
  for (let k = 0; k < 8; k++) {
    const h = 0.06 + random() * 0.18
    const x = (random() - 0.5) * 0.3
    const z = (random() - 0.5) * 0.3
    g.add(
      cone(0.014 + random() * 0.024, h, 7),
      at(x, h / 2, z),
      k % 2 ? '#6e655c' : '#857a6e',
      K.rock,
      { jitter: 0.15, seed: k },
    )
  }
  return g.geometry()
}

export function column(): PropGeometry {
  const g = new PropBuilder()
  const points: Vec3[] = []
  const radii: number[] = []
  for (let k = 0; k <= 12; k++) {
    const f = k / 12
    points.push([Math.sin(f * 5) * 0.015, f, Math.cos(f * 4) * 0.012])
    radii.push(0.07 * (0.45 + 0.9 * (Math.abs(f - 0.5) * 2) ** 1.6))
  }
  tube(g, points, radii, '#7d746a', K.rock, 9, 0.18)
  return g.geometry()
}

export function mineHead(): PropGeometry {
  const g = new PropBuilder()
  const wood = '#6a4a2c'
  for (let k = 0; k < 2; k++) {
    const z = (k - 0.5) * 0.28
    g.add(cyl(0.01, 0.01, 0.2, 5), at(-0.09, 0.1, z), wood, K.wood)
    g.add(cyl(0.01, 0.01, 0.2, 5), at(0.09, 0.1, z), wood, K.wood)
    g.add(box(0.21, 0.018, 0.02), at(0, 0.2, z), wood, K.wood)
  }
  g.add(box(0.06, 0.035, 0.08), at(0, 0.03, 0.02), '#5a4a3a', K.wood)
  g.add(ball(6, 5), at(0, 0.052, 0.02, 0, 0, 0, 0.026, 0.016, 0.034), '#d9b04a', K.gold)
  g.add(box(0.014, 0.02, 0.014), at(-0.09, 0.17, 0.14), '#ffcf7a', K.lamp)
  return g.geometry()
}

export function mineRail(): PropGeometry {
  const g = new PropBuilder()
  for (const side of [-0.022, 0.022])
    g.add(box(0.005, 0.005, 0.3), at(side, 0.004, 0), '#9aa0a8', K.metal)
  for (let k = 0; k < 6; k++)
    g.add(box(0.07, 0.005, 0.012), at(0, 0.002, -0.125 + k * 0.05), '#4a3426', K.wood)
  return g.geometry()
}

export function iceSpikes(): PropGeometry {
  const g = new PropBuilder()
  const random = mulberry32(9)
  for (let k = 0; k < 6; k++) {
    const h = 0.1 + random() * 0.22
    g.add(
      cone(0.03 + random() * 0.03, h, 5),
      at(
        (random() - 0.5) * 0.3,
        h / 2,
        (random() - 0.5) * 0.3,
        (random() - 0.5) * 0.5,
        random(),
        (random() - 0.5) * 0.5,
      ),
      '#bfe6ff',
      K.ice,
    )
  }
  return g.geometry()
}

export function crypt(): PropGeometry {
  const g = new PropBuilder()
  const stone = '#a49d92'
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    g.add(
      cyl(0.022, 0.026, 0.26, 8),
      at(Math.cos(a) * 0.32, 0.13, Math.sin(a) * 0.32),
      stone,
      K.stone,
    )
    g.add(box(0.06, 0.02, 0.06), at(Math.cos(a) * 0.32, 0.27, Math.sin(a) * 0.32), stone, K.stone)
  }
  g.add(box(0.14, 0.06, 0.07), at(0, 0.03, 0), '#8a8378', K.stone)
  g.add(box(0.15, 0.014, 0.08), at(0, 0.066, 0), '#b8b0a2', K.stone)
  for (const x of [-0.14, 0.14]) {
    g.add(cyl(0.014, 0.018, 0.06, 6), at(x, 0.03, -0.12), '#3a3430', K.metal)
    g.add(ball(6, 5), at(x, 0.07, -0.12, 0, 0, 0, 0.014), '#ffb347', K.glow)
  }
  return g.geometry()
}

export function roots(): PropGeometry {
  const g = new PropBuilder()
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2
    const points: Vec3[] = []
    const radii: number[] = []
    for (let q = 0; q <= 12; q++) {
      const f = q / 12
      points.push([
        Math.cos(a + f * 0.9) * (0.05 + f * 0.5),
        0.03 + Math.sin(f * Math.PI) * 0.09,
        Math.sin(a + f * 0.9) * (0.05 + f * 0.5),
      ])
      radii.push(0.05 * (1 - f) + 0.01)
    }
    tube(g, points, radii, '#5a4330', K.bark, 6, 0.1)
  }
  g.add(ball(10, 8), at(0, 0.07, 0, 0, 0, 0, 0.06), '#ffd27a', K.glow)
  return g.geometry()
}

export function brazier(): PropGeometry {
  const g = new PropBuilder()
  g.add(cyl(0.012, 0.02, 0.08, 6), at(0, 0.04, 0), '#3a3430', K.metal)
  g.add(cyl(0.03, 0.02, 0.025, 8), at(0, 0.09, 0), '#3a3430', K.metal)
  g.add(ball(8, 6), at(0, 0.105, 0, 0, 0, 0, 0.022, 0.03, 0.022), '#ff9a3a', K.glow)
  return g.geometry()
}

export function lamp(): PropGeometry {
  return new PropBuilder()
    .add(cyl(0.003, 0.004, 0.08, 4), at(0, 0.04, 0), '#2a2622', K.metal)
    .add(box(0.014, 0.018, 0.014), at(0, 0.085, 0), '#ffcf7a', K.lamp)
    .geometry()
}

export function dwarfHall(seed: number): PropGeometry {
  const g = new PropBuilder()
  const random = mulberry32(seed)
  const stone = '#8a8378'
  const stone2 = '#6e675e'
  const w = 0.12 + random() * 0.08
  const d = 0.1 + random() * 0.05
  const h = 0.07 + random() * 0.06
  g.add(box(w, h + 0.05, d), at(0, h / 2 - 0.025, 0), stone, K.plaster)
  g.add(box(w * 1.08, 0.018, d * 1.08), at(0, h, 0), stone2, K.stone)
  for (const side of [-1, 1])
    g.add(box(0.02, h + 0.03, 0.02), at(side * w * 0.5, h / 2, d * 0.5), stone2, K.stone)
  g.add(box(w * 0.5, h * 0.55, 0.004), at(0, h * 0.28, d * 0.502), '#ff9a3a', K.glow)
  return g.geometry()
}

export function lakeBoat(): PropGeometry {
  return new PropBuilder()
    .add(
      scaled(cyl(0.03, 0.015, 0.16, 6, 1), 1, 1, 0.5),
      at(0, 0.01, 0, 0, 0, Math.PI / 2),
      '#5e4128',
      K.wood,
    )
    .add(box(0.012, 0.016, 0.012), at(0.05, 0.04, 0), '#ffcf7a', K.lamp)
    .geometry()
}
