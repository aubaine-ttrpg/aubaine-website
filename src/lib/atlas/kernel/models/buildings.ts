import type { BuildingStyle } from '../../vocabulary.ts'
import { mulberry32, type Random } from '../../world/noise.ts'
import { type ClothPin, PropBuilder, type PropGeometry } from '../builder.ts'
import { PROP_KIND } from '../kinds.ts'
import { circle, lathe, openBox, plane, prism, type Shape, scaled, torus } from '../primitives.ts'
import { at, ball, box, cone, cyl, facet, faceted, tube, type Vec3 } from './parts.ts'

const K = PROP_KIND

type Style = {
  walls: readonly string[]
  roof: readonly string[]
  domes?: readonly string[]
  spire: string
  base: string
  shape: 'gable' | 'flat' | 'steep'
  chimney?: boolean
}

export const STYLES: Record<BuildingStyle, Style> = {
  aubemont: {
    walls: ['#efe7d8', '#e6dccb', '#f4ede0', '#ddd2bf'],
    roof: ['#b4532d', '#a8472a', '#c0643a', '#9c4326'],
    spire: '#3b4f8e',
    base: '#cfc6b6',
    shape: 'gable',
  },
  nordhal: {
    walls: ['#7a5240', '#6a4a3c', '#8a5e48', '#5e4a42'],
    roof: ['#3c4046', '#46494f', '#34383d'],
    spire: '#555b66',
    base: '#4a4440',
    shape: 'gable',
    chimney: true,
  },
  orsalis: {
    walls: ['#e2c79c', '#d8b886', '#ecd6b0', '#cfae7c'],
    roof: ['#d9bd8e'],
    domes: ['#3aa6a0', '#d9b04a', '#f2efe8'],
    spire: '#3aa6a0',
    base: '#b89466',
    shape: 'flat',
  },
  corsaille: {
    walls: ['#3f8f8a', '#c98a3a', '#b5463a', '#e0d0a0', '#4f6fa8'],
    roof: ['#4a3a30', '#5a4636'],
    spire: '#7a3a2a',
    base: '#6a5440',
    shape: 'gable',
  },
  mountain: {
    walls: ['#8a8680', '#9a958c', '#7c7872'],
    roof: ['#3a3f4a', '#444955'],
    spire: '#3a3f4a',
    base: '#6a6660',
    shape: 'steep',
    chimney: true,
  },
  nordic: {
    walls: ['#5a4030', '#6a4a34', '#4e3828'],
    roof: ['#6b7a4a', '#5a6a40'],
    spire: '#6b7a4a',
    base: '#4a4038',
    shape: 'steep',
  },
}

const pick = (random: Random, values: readonly string[]) =>
  values[(random() * values.length) | 0] ?? values[0] ?? '#ffffff'

const FOOTING = 0.08
const PARAPET = 0.007
const DOOR = '#4a3426'
const GLASS = '#262a33'
const TIMBER = '#4e3826'
const IRON = '#2f2c2a'
const AWNINGS = ['#c9583e', '#e6d6ae', '#3f8f8a', '#d1a03c'] as const
const BANNER = '#2a3f9a'
const GOLD = '#e8c35a'

type Body = { width: number; depth: number; height: number }
type Pitch = { rise: number; overhang: number; eaves: number; thickness: number }
type Spot = { x: number; z: number; turn: number }

const CENTRE: Spot = { x: 0, z: 0, turn: 0 }

function gableRoof(length: number, span: number, rise: number, thickness: number): Shape {
  const out = faceted()
  const x = length / 2
  const z = span / 2
  const below = (p: Vec3): Vec3 => [p[0], p[1] - thickness, p[2]]
  for (const side of [1, -1]) {
    const ridge0: Vec3 = [-x, rise, 0]
    const ridge1: Vec3 = [x, rise, 0]
    const eave0: Vec3 = [-x, 0, side * z]
    const eave1: Vec3 = [x, 0, side * z]
    facet(out, [ridge0, ridge1, eave1, eave0], [0, 1, side])
    facet(out, [below(ridge0), below(ridge1), below(eave1), below(eave0)], [0, -1, 0])
    facet(out, [eave0, eave1, below(eave1), below(eave0)], [0, 0, side])
    facet(out, [ridge1, eave1, below(eave1), below(ridge1)], [1, 0, 0])
    facet(out, [ridge0, eave0, below(eave0), below(ridge0)], [-1, 0, 0])
  }
  return out
}

function hippedRoof(length: number, span: number, rise: number, thickness: number): Shape {
  const out = faceted()
  const x = length / 2
  const z = span / 2
  const ridge = Math.max(0, x - z)
  const r0: Vec3 = [-ridge, rise, 0]
  const r1: Vec3 = [ridge, rise, 0]
  const c0: Vec3 = [-x, 0, -z]
  const c1: Vec3 = [x, 0, -z]
  const c2: Vec3 = [x, 0, z]
  const c3: Vec3 = [-x, 0, z]
  const corners = [c0, c1, c2, c3]
  const below = (p: Vec3): Vec3 => [p[0], p[1] - thickness, p[2]]
  if (ridge > 0.0005) {
    facet(out, [r0, r1, c2, c3], [0, 1, 1])
    facet(out, [r1, r0, c0, c1], [0, 1, -1])
  } else {
    facet(out, [r0, c2, c3], [0, 1, 1])
    facet(out, [r0, c0, c1], [0, 1, -1])
  }
  facet(out, [r1, c1, c2], [1, 1, 0])
  facet(out, [r0, c3, c0], [-1, 1, 0])
  for (const [k, a] of corners.entries()) {
    const b = corners[(k + 1) % corners.length] ?? a
    facet(out, [a, b, below(b), below(a)], [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2])
  }
  facet(out, corners.map(below), [0, -1, 0])
  return out
}

function gableEnds(width: number, depth: number, apex: number): Shape {
  const out = faceted()
  for (const side of [1, -1]) {
    const x = (side * width) / 2
    facet(
      out,
      [
        [x, 0, -depth / 2],
        [x, 0, depth / 2],
        [x, apex, 0],
      ],
      [side, 0, 0],
    )
  }
  return out
}

function spanOf(body: Body, pitch: Pitch): number {
  return body.depth + pitch.eaves * 2
}

function eaveLine(body: Body, pitch: Pitch): number {
  return body.height + pitch.thickness - pitch.rise * (1 - body.depth / spanOf(body, pitch))
}

function roofAt(body: Body, pitch: Pitch, z: number): number {
  return eaveLine(body, pitch) + pitch.rise * (1 - Math.abs(z) / (spanOf(body, pitch) / 2))
}

function walls(g: PropBuilder, body: Body, colour: string, spot: Spot = CENTRE): void {
  g.add(
    openBox(body.width, body.height + FOOTING, body.depth, ['bottom']),
    at(spot.x, (body.height - FOOTING) / 2, spot.z, 0, spot.turn, 0),
    colour,
    K.plaster,
  )
}

function plinth(g: PropBuilder, body: Body, colour: string): void {
  g.add(
    openBox(body.width + 0.004, 0.014, body.depth + 0.004, ['top', 'bottom']),
    at(0, 0.001, 0),
    colour,
    K.stone,
  )
}

type Cladding = { colour: string; kind: number }

function gable(
  g: PropBuilder,
  body: Body,
  pitch: Pitch,
  roof: string,
  ends: Cladding,
  spot: Spot = CENTRE,
): void {
  const span = spanOf(body, pitch)
  const place = (y: number) => at(spot.x, y, spot.z, 0, spot.turn, 0)
  g.add(
    gableRoof(body.width + pitch.overhang * 2, span, pitch.rise, pitch.thickness),
    place(eaveLine(body, pitch)),
    roof,
    K.roof,
  )
  g.add(
    gableEnds(body.width, body.depth, (pitch.rise * body.depth) / span),
    place(body.height),
    ends.colour,
    ends.kind,
  )
}

function hip(g: PropBuilder, body: Body, pitch: Pitch, roof: string): void {
  g.add(
    hippedRoof(body.width + pitch.eaves * 2, spanOf(body, pitch), pitch.rise, pitch.thickness),
    at(0, eaveLine(body, pitch), 0),
    roof,
    K.roof,
  )
}

function door(g: PropBuilder, x: number, z: number, height = 0.022, width = 0.012): void {
  g.add(plane(width, height), at(x, height / 2, z + 0.0005), DOOR, K.wood)
}

function chimney(
  g: PropBuilder,
  x: number,
  z: number,
  base: number,
  top: number,
  colour: string,
): void {
  g.add(openBox(0.011, top - base, 0.011, ['bottom']), at(x, (base + top) / 2, z), colour, K.stone)
}

function sheet(
  g: PropBuilder,
  corners: readonly Vec3[],
  facing: Vec3,
  colour: string,
  kind: number,
  pinned?: ClothPin,
): void {
  const out = faceted()
  facet(out, corners, facing)
  facet(out, corners, [-facing[0], -facing[1], -facing[2]])
  g.add(out, at(), colour, kind, { flat: true, pinned })
}

function dormer(
  g: PropBuilder,
  body: Body,
  pitch: Pitch,
  x: number,
  wall: string,
  roof: string,
): void {
  const width = 0.017
  const front = body.depth / 2 - 0.006
  const base = roofAt(body, pitch, front)
  const height = 0.014
  const depth = front * 0.8
  g.add(
    openBox(width, height + 0.01, depth, ['bottom', 'back', 'top']),
    at(x, base + (height - 0.01) / 2, front - depth / 2),
    wall,
    K.plaster,
  )
  g.add(
    prism(depth * 1.12, width * 1.35, 0.011),
    at(x, base + height, front - depth / 2 + depth * 0.06, 0, Math.PI / 2, 0),
    roof,
    K.roof,
  )
  g.add(
    plane(width * 0.5, height * 0.6),
    at(x, base + height * 0.48, front + 0.0006),
    GLASS,
    K.plain,
  )
}

function wing(
  g: PropBuilder,
  body: Body,
  pitch: Pitch,
  wall: string,
  roof: string,
  ends: Cladding,
): void {
  const wingBody: Body = {
    width: body.depth * 0.74,
    depth: body.width * 0.55,
    height: body.height * 0.75,
  }
  const spot: Spot = { x: body.width * 0.62, z: 0, turn: Math.PI / 2 }
  walls(g, wingBody, wall, spot)
  gable(g, wingBody, { ...pitch, rise: pitch.rise * 0.8, overhang: 0.004 }, roof, ends, spot)
}

function balcony(g: PropBuilder, spot: Spot, y: number, width: number, colour: string): void {
  const depth = 0.008
  const place = (dx: number, dy: number, dz: number) => {
    const c = Math.cos(spot.turn)
    const s = Math.sin(spot.turn)
    return [spot.x + dx * c + dz * s, y + dy, spot.z - dx * s + dz * c] as const
  }
  const [bx, by, bz] = place(0, 0, depth / 2)
  g.add(box(width, 0.003, depth), at(bx, by, bz, 0, spot.turn, 0), colour, K.wood)
  const corners: Vec3[] = [
    [...place(-width / 2, 0.0015, depth)],
    [...place(width / 2, 0.0015, depth)],
    [...place(width / 2, 0.009, depth)],
    [...place(-width / 2, 0.009, depth)],
  ]
  sheet(g, corners, [Math.sin(spot.turn), 0, Math.cos(spot.turn)], colour, K.wood)
}

function awning(
  g: PropBuilder,
  x: number,
  y: number,
  z: number,
  width: number,
  colour: string,
): void {
  sheet(
    g,
    [
      [x - width / 2, y, z],
      [x + width / 2, y, z],
      [x + width / 2, y - 0.005, z + 0.009],
      [x - width / 2, y - 0.005, z + 0.009],
    ],
    [0, 1, 0.5],
    colour,
    K.plain,
  )
}

function bargeboards(g: PropBuilder, body: Body, pitch: Pitch, colour: string): void {
  const span = spanOf(body, pitch)
  const eave = eaveLine(body, pitch)
  const reach = 0.014
  const slope = pitch.rise / (span / 2)
  const normal = Math.hypot(1, slope)
  for (const end of [1, -1]) {
    const x = end * (body.width / 2 + pitch.overhang + 0.0007)
    for (const side of [1, -1]) {
      const lower: Vec3 = [x, eave + slope * 0.004, side * (span / 2 - 0.004)]
      const upper: Vec3 = [x, eave + pitch.rise + slope * reach, -side * reach]
      const lift: Vec3 = [0, 0.0035 / normal, (side * 0.0035 * slope) / normal]
      sheet(
        g,
        [
          lower,
          upper,
          [upper[0], upper[1] + lift[1], upper[2] + lift[2]],
          [lower[0], lower[1] + lift[1], lower[2] + lift[2]],
        ],
        [end, 0, 0],
        colour,
        K.wood,
      )
    }
  }
}

function parapets(g: PropBuilder, body: Body, pitch: Pitch, colour: string): void {
  const out = faceted()
  const eave = eaveLine(body, pitch)
  const shoulder = body.height + pitch.thickness + 0.005
  const apex = eave + pitch.rise + 0.008
  const z = body.depth / 2
  for (const end of [1, -1]) {
    for (const face of [0.0025, -0.0025]) {
      const x = end * (body.width / 2 + face)
      facet(
        out,
        [
          [x, body.height, -z],
          [x, body.height, z],
          [x, shoulder, z],
          [x, apex, 0],
          [x, shoulder, -z],
        ],
        [face * end, 0, 0],
      )
    }
    const outer = end * (body.width / 2 + 0.0025)
    const inner = end * (body.width / 2 - 0.0025)
    for (const side of [1, -1]) {
      facet(
        out,
        [
          [outer, shoulder, side * z],
          [outer, apex, 0],
          [inner, apex, 0],
          [inner, shoulder, side * z],
        ],
        [0, 1, side * 0.4],
      )
    }
  }
  g.add(out, at(), colour, K.stone, { flat: true })
}

function pitchedHouse(
  g: PropBuilder,
  style: BuildingStyle,
  s: Style,
  body: Body,
  wall: string,
  random: Random,
): void {
  const rise = s.shape === 'steep' ? 0.05 + random() * 0.02 : 0.026 + random() * 0.018
  const roof = pick(random, s.roof)
  const chimneyed = s.chimney === true || random() < 0.4
  const winged = random() < 0.3
  const wingWall = winged ? pick(random, s.walls) : wall
  const wingRoof = winged ? pick(random, s.roof) : roof
  const pitch: Pitch = {
    rise,
    overhang: style === 'nordhal' ? 0 : 0.006,
    eaves: style === 'mountain' ? 0.008 : 0.007,
    thickness: 0.004,
  }
  const front = body.depth / 2
  const ends: Cladding =
    style === 'mountain' ? { colour: TIMBER, kind: K.wood } : { colour: wall, kind: K.plaster }
  walls(g, body, wall)
  plinth(g, body, s.base)
  door(g, (random() - 0.5) * body.width * 0.5, front + (style === 'mountain' ? 0.0017 : 0))
  const hipped = (style === 'aubemont' || style === 'corsaille') && !winged && random() < 0.35
  if (hipped) hip(g, body, { ...pitch, overhang: pitch.eaves }, roof)
  else gable(g, body, pitch, roof, ends)
  const ridge = eaveLine(body, pitch) + pitch.rise
  if (chimneyed) {
    const z = -body.depth * 0.18
    chimney(g, -body.width * 0.28, z, roofAt(body, pitch, z) - 0.006, ridge + 0.012, s.base)
  }
  if (winged) {
    wing(g, body, pitch, wingWall, wingRoof, {
      ...ends,
      colour: style === 'mountain' ? TIMBER : wingWall,
    })
  }
  switch (style) {
    case 'aubemont':
      if (!winged && random() < 0.8)
        dormer(g, body, pitch, (random() - 0.5) * body.width * 0.3, wall, roof)
      break
    case 'corsaille':
      balcony(
        g,
        { x: (random() - 0.5) * body.width * 0.3, z: front, turn: 0 },
        Math.min(body.height - 0.01, 0.032),
        body.width * 0.45,
        IRON,
      )
      awning(
        g,
        0,
        0.027,
        front,
        body.width * 0.4,
        AWNINGS[(random() * AWNINGS.length) | 0] ?? '#c9583e',
      )
      break
    case 'mountain':
      g.add(
        openBox(
          body.width + 0.003,
          Math.min(body.height * 0.5, 0.026) + FOOTING,
          body.depth + 0.003,
          ['top', 'bottom'],
        ),
        at(0, (Math.min(body.height * 0.5, 0.026) - FOOTING) / 2, 0),
        s.base,
        K.stone,
      )
      balcony(
        g,
        { x: 0, z: front, turn: 0 },
        Math.min(body.height - 0.008, 0.034),
        body.width * 0.62,
        TIMBER,
      )
      break
    case 'nordic':
      bargeboards(g, body, pitch, TIMBER)
      break
    case 'nordhal':
      parapets(g, body, pitch, s.base)
      chimney(
        g,
        body.width * 0.3,
        body.depth * 0.18,
        roofAt(body, pitch, body.depth * 0.18) - 0.006,
        ridge + 0.016,
        s.base,
      )
      break
    case 'orsalis':
      break
  }
}

function terrace(g: PropBuilder, body: Body, wall: string, rim: string): void {
  const top = body.height + PARAPET
  g.add(
    openBox(body.width, top + FOOTING, body.depth, ['top', 'bottom']),
    at(0, (top - FOOTING) / 2, 0),
    wall,
    K.plaster,
  )
  const out = faceted()
  const x = body.width / 2
  const z = body.depth / 2
  const ix = x - 0.003
  const iz = z - 0.003
  const outer: Vec3[] = [
    [-x, top, -z],
    [x, top, -z],
    [x, top, z],
    [-x, top, z],
  ]
  const inner: Vec3[] = [
    [-ix, top, -iz],
    [ix, top, -iz],
    [ix, top, iz],
    [-ix, top, iz],
  ]
  for (let k = 0; k < 4; k++) {
    const a = outer[k] ?? [0, 0, 0]
    const b = outer[(k + 1) % 4] ?? a
    const c = inner[(k + 1) % 4] ?? a
    const d = inner[k] ?? a
    facet(out, [a, b, c, d], [0, 1, 0])
    const sink = (p: Vec3): Vec3 => [p[0], body.height, p[2]]
    facet(out, [d, c, sink(c), sink(d)], [-(c[0] + d[0]), 0, -(c[2] + d[2])])
  }
  facet(
    out,
    inner.map((p): Vec3 => [p[0], body.height, p[2]]),
    [0, 1, 0],
  )
  g.add(out, at(), rim, K.stone, { flat: true })
}

function onion(radius: number): Shape {
  return lathe(
    [
      [radius, 0],
      [radius * 1.12, radius * 0.32],
      [radius * 1.02, radius * 0.72],
      [radius * 0.62, radius * 1.1],
      [radius * 0.22, radius * 1.42],
      [0.0005, radius * 1.62],
    ],
    10,
  )
}

function windTower(
  g: PropBuilder,
  x: number,
  z: number,
  base: number,
  wall: string,
  rim: string,
): void {
  const height = 0.03
  g.add(openBox(0.013, height, 0.013, ['bottom']), at(x, base + height / 2, z), wall, K.stone)
  g.add(openBox(0.018, 0.003, 0.018, ['bottom']), at(x, base + height + 0.0015, z), rim, K.stone)
  for (const side of [1, -1]) {
    g.add(
      plane(0.007, 0.01),
      at(x, base + height - 0.008, z + side * 0.0066, 0, side > 0 ? 0 : Math.PI, 0),
      GLASS,
      K.plain,
    )
  }
}

function flatHouse(g: PropBuilder, s: Style, body: Body, wall: string, random: Random): void {
  const domed = random() < 0.35
  const domeColour = domed ? pick(random, s.domes ?? s.roof) : wall
  const gilded = domed && random() < 0.3
  const raised = random() < 0.4
  const raisedWall = raised ? pick(random, s.walls) : wall
  const front = body.depth / 2
  terrace(g, body, wall, s.base)
  const doorX = (random() - 0.5) * body.width * 0.4
  door(g, doorX, front, 0.02, 0.011)
  awning(g, doorX, 0.024, front, 0.02, AWNINGS[(random() * AWNINGS.length) | 0] ?? '#c9583e')
  const roofY = body.height
  if (domed) {
    const radius = Math.min(body.width, body.depth) * 0.3
    g.add(cyl(radius, radius, 0.012, 8, 1, true), at(0, roofY + 0.006, 0), wall, K.plaster)
    g.add(onion(radius), at(0, roofY + 0.012, 0), domeColour, gilded ? K.gold : K.plain)
    g.add(cone(0.003, 0.014, 5), at(0, roofY + 0.012 + radius * 1.62 + 0.006, 0), GOLD, K.gold)
  }
  if (raised) {
    const height = roofY * 0.45
    g.add(
      openBox(body.width * 0.42, height, body.depth * 0.5, ['bottom']),
      at(body.width * 0.22, roofY + height / 2, -body.depth * 0.18),
      raisedWall,
      K.plaster,
    )
  }
  if (!domed && random() < 0.6)
    windTower(g, -body.width * 0.3, -body.depth * 0.22, roofY, wall, s.base)
  if (!raised && random() < 0.6) {
    const x = body.width * 0.24
    const z = -body.depth * 0.12
    g.add(openBox(0.022, 0.016, 0.018, ['bottom']), at(x, roofY + 0.008, z), wall, K.plaster)
    door(g, x, z + 0.009, 0.011, 0.007)
  }
}

export function house(style: BuildingStyle, seed: number): PropGeometry {
  const random = mulberry32(seed * 131 + 7)
  const s = STYLES[style]
  const body: Body = {
    width: 0.055 + random() * 0.04,
    depth: 0.045 + random() * 0.03,
    height: 0.035 + random() * 0.045,
  }
  const wall = pick(random, s.walls)
  const g = new PropBuilder()
  if (s.shape === 'flat') flatHouse(g, s, body, wall, random)
  else pitchedHouse(g, style, s, body, wall, random)
  return g.geometry()
}

function keep(g: PropBuilder, s: Style, height: number, radius: number, random: Random): void {
  const wall = s.walls[0] ?? '#ffffff'
  g.add(
    cyl(radius, radius * 1.08, height + 0.06, 12, 1, true),
    at(0, height / 2 - 0.03, 0),
    wall,
    K.stone,
  )
  g.add(
    cyl(radius * 1.06, radius * 1.06, 0.005, 12, 1, true),
    at(0, height * 0.45, 0),
    s.base,
    K.stone,
  )
  g.add(cyl(radius * 1.2, radius * 1.04, 0.016, 12), at(0, height + 0.002, 0), s.base, K.stone)
  const roofHeight = 0.09 + random() * 0.04
  g.add(
    cone(radius * 1.32, roofHeight, 12),
    at(0, height + 0.01 + roofHeight / 2, 0),
    s.spire,
    K.roof,
  )
  const top = height + 0.01 + roofHeight
  g.add(cyl(0.0018, 0.0018, 0.03, 4, 1, true), at(0, top + 0.012, 0), GOLD, K.gold)
  sheet(
    g,
    [
      [0.0015, top + 0.022, 0],
      [0.02, top + 0.019, 0],
      [0.02, top + 0.01, 0],
      [0.0015, top + 0.013, 0],
    ],
    [0, 0, 1],
    BANNER,
    K.cloth,
    'left',
  )
  for (let k = 0; k < 3; k++) {
    const angle = (k / 3) * Math.PI * 2 + 0.6
    const reach = radius * 1.03 + 0.0006
    g.add(
      plane(0.003, 0.014),
      at(Math.sin(angle) * reach, height * (0.62 + k * 0.08), Math.cos(angle) * reach, 0, angle, 0),
      GLASS,
      K.plain,
    )
  }
  door(g, 0, radius * 1.05, 0.02, 0.011)
}

function minaret(g: PropBuilder, s: Style, height: number, radius: number, random: Random): void {
  const wall = s.walls[2] ?? '#ffffff'
  const domeColour = (s.domes ?? [])[(random() * 3) | 0] ?? '#3aa6a0'
  g.add(
    openBox(radius * 2.2, 0.03 + FOOTING, radius * 2.2, ['bottom']),
    at(0, (0.03 - FOOTING) / 2, 0),
    s.base,
    K.stone,
  )
  g.add(
    cyl(radius * 0.82, radius, height + 0.06, 10, 1, true),
    at(0, height / 2 - 0.03, 0),
    s.walls[0] ?? '#ffffff',
    K.plaster,
  )
  g.add(cyl(radius * 1.15, radius * 0.86, 0.012, 10), at(0, height + 0.006, 0), s.base, K.stone)
  g.add(
    cyl(radius * 0.56, radius * 0.6, 0.05, 10, 1, true),
    at(0, height + 0.037, 0),
    wall,
    K.stone,
  )
  g.add(cyl(radius * 0.7, radius * 0.7, 0.004, 10), at(0, height + 0.064, 0), s.base, K.stone)
  g.add(onion(radius * 0.62), at(0, height + 0.066, 0), domeColour, K.gold)
  g.add(cone(0.003, 0.018, 5), at(0, height + 0.066 + radius * 1.0 + 0.009, 0), GOLD, K.gold)
}

function stack(g: PropBuilder, s: Style, height: number, radius: number): void {
  const wall = s.walls[0] ?? '#ffffff'
  g.add(
    cyl(radius, radius * 1.08, height + 0.06, 12, 1, true),
    at(0, height / 2 - 0.03, 0),
    wall,
    K.plaster,
  )
  g.add(cyl(radius * 1.12, radius * 1.08, 0.01, 12), at(0, height + 0.005, 0), s.base, K.stone)
  g.add(
    cyl(radius * 0.42, radius * 0.62, 0.16, 10, 1, true),
    at(0, height + 0.09, 0),
    '#3a3230',
    K.stone,
  )
  for (const y of [0.05, 0.11]) {
    g.add(
      cyl(radius * 0.58 - y * radius * 0.9, radius * 0.6 - y * radius * 0.9, 0.006, 10, 1, true),
      at(0, height + 0.01 + y, 0),
      IRON,
      K.metal,
    )
  }
  g.add(
    cyl(radius * 0.5, radius * 0.46, 0.012, 10, 1, true),
    at(0, height + 0.172, 0),
    IRON,
    K.metal,
  )
  g.add(circle(radius * 0.47, 10), at(0, height + 0.176, 0, -Math.PI / 2, 0, 0), '#141210', K.plain)
}

export function tower(style: BuildingStyle, seed: number): PropGeometry {
  const random = mulberry32(seed * 71 + 3)
  const s = STYLES[style]
  const g = new PropBuilder()
  const height = 0.13 + random() * 0.08
  const radius = 0.03 + random() * 0.012
  if (style === 'orsalis') minaret(g, s, height, radius, random)
  else if (style === 'nordhal') stack(g, s, height, radius)
  else keep(g, s, height, radius, random)
  return g.geometry()
}

function church(g: PropBuilder, s: Style, wall: string): void {
  const nave: Body = { width: 0.2, depth: 0.1, height: 0.09 }
  const pitch: Pitch = { rise: 0.05, overhang: 0.008, eaves: 0.008, thickness: 0.005 }
  walls(g, nave, wall, { x: 0.01, z: 0, turn: 0 })
  g.add(
    gableRoof(nave.width + pitch.overhang * 2, spanOf(nave, pitch), pitch.rise, pitch.thickness),
    at(0.01, eaveLine(nave, pitch), 0),
    s.spire,
    K.roof,
  )
  g.add(
    gableEnds(nave.width, nave.depth, (pitch.rise * nave.depth) / spanOf(nave, pitch)),
    at(0.01, nave.height, 0),
    wall,
    K.plaster,
  )
  g.add(
    cyl(0.04, 0.04, 0.07 + FOOTING, 8, 1, true),
    at(0.11, (0.07 - FOOTING) / 2, 0),
    wall,
    K.plaster,
  )
  g.add(cone(0.047, 0.045, 8), at(0.11, 0.0925, 0), s.spire, K.roof)
  for (const x of [-0.04, 0.05]) {
    for (const side of [1, -1]) {
      g.add(
        openBox(0.012, 0.05 + 0.02, 0.012, ['bottom']),
        at(x, 0.015, side * 0.052),
        s.base,
        K.stone,
      )
    }
  }
  for (const x of [-0.06, 0.005, 0.07]) {
    for (const side of [1, -1]) {
      g.add(
        plane(0.008, 0.035),
        at(x, 0.05, side * 0.0505, 0, side > 0 ? 0 : Math.PI, 0),
        '#4a6ad0',
        K.lamp,
      )
    }
  }
  g.add(circle(0.022, 12), at(-0.095, 0.115, 0, 0, -Math.PI / 2, 0), '#4a6ad0', K.lamp)
  const towerX = -0.13
  g.add(openBox(0.06, 0.26, 0.06, ['bottom']), at(towerX, 0.07, 0), wall, K.stone)
  g.add(openBox(0.068, 0.007, 0.068, ['bottom']), at(towerX, 0.2035, 0), s.base, K.stone)
  for (let k = 0; k < 4; k++) {
    const angle = (k * Math.PI) / 2
    g.add(
      plane(0.014, 0.03),
      at(towerX + Math.sin(angle) * 0.0306, 0.17, Math.cos(angle) * 0.0306, 0, angle, 0),
      GLASS,
      K.plain,
    )
    const cx = towerX + (k % 2 ? 0.03 : -0.03)
    const cz = k < 2 ? 0.03 : -0.03
    g.add(cone(0.006, 0.03, 4), at(cx, 0.222, cz, 0, Math.PI / 4, 0), s.spire, K.roof)
  }
  g.add(cone(0.038, 0.16, 4), at(towerX, 0.287, 0, 0, Math.PI / 4, 0), s.spire, K.roof)
  g.add(cyl(0.0022, 0.0022, 0.03, 4, 1, true), at(towerX, 0.38, 0), GOLD, K.gold)
  sheet(
    g,
    [
      [towerX - 0.008, 0.384, 0],
      [towerX + 0.008, 0.384, 0],
      [towerX + 0.008, 0.388, 0],
      [towerX - 0.008, 0.388, 0],
    ],
    [0, 0, 1],
    GOLD,
    K.gold,
  )
  door(g, towerX - 0.0305, 0, 0.032, 0.016)
}

function mosque(g: PropBuilder, s: Style): void {
  const wall = s.walls[2] ?? '#ffffff'
  const body: Body = { width: 0.2, depth: 0.2, height: 0.07 }
  terrace(g, body, wall, s.base)
  g.add(cyl(0.07, 0.07, 0.025, 16, 1, true), at(0, 0.0825, 0), wall, K.plaster)
  g.add(
    lathe(
      [
        [0.074, 0],
        [0.086, 0.026],
        [0.078, 0.06],
        [0.05, 0.094],
        [0.018, 0.119],
        [0.0005, 0.134],
      ],
      16,
    ),
    at(0, 0.095, 0),
    '#d9b04a',
    K.gold,
  )
  g.add(cone(0.004, 0.018, 5), at(0, 0.238, 0), GOLD, K.gold)
  for (const [x, z] of [
    [0.09, 0.09],
    [-0.09, 0.09],
    [0.09, -0.09],
    [-0.09, -0.09],
  ] as const) {
    g.add(
      cyl(0.011, 0.014, 0.2 + FOOTING, 8, 1, true),
      at(x, (0.2 - FOOTING) / 2, z),
      s.walls[0] ?? '#ffffff',
      K.plaster,
    )
    g.add(cyl(0.018, 0.012, 0.008, 8), at(x, 0.14, z), s.base, K.stone)
    g.add(onion(0.012), at(x, 0.2, z), '#3aa6a0', K.gold)
    g.add(cone(0.0022, 0.012, 4), at(x, 0.226, z), GOLD, K.gold)
  }
  for (let k = 0; k < 4; k++) {
    const angle = (k * Math.PI) / 2
    g.add(
      plane(0.04, 0.05),
      at(Math.sin(angle) * 0.1006, 0.025, Math.cos(angle) * 0.1006, 0, angle, 0),
      GLASS,
      K.plain,
    )
  }
}

export function temple(style: BuildingStyle): PropGeometry {
  const s = STYLES[style]
  const g = new PropBuilder()
  if (style === 'orsalis') mosque(g, s)
  else church(g, s, style === 'nordhal' ? '#6a5a50' : (s.walls[0] ?? '#ffffff'))
  return g.geometry()
}

function sawtooth(g: PropBuilder, body: Body, roof: string): void {
  const out = faceted()
  const glass = faceted()
  const teeth = 4
  const step = body.width / teeth
  const rise = 0.03
  const z = body.depth / 2 + 0.004
  for (let k = 0; k < teeth; k++) {
    const x0 = -body.width / 2 + k * step
    const x1 = x0 + step
    const low0: Vec3 = [x0, body.height, -z]
    const low1: Vec3 = [x0, body.height, z]
    const high0: Vec3 = [x1, body.height + rise, -z]
    const high1: Vec3 = [x1, body.height + rise, z]
    const foot0: Vec3 = [x1, body.height, -z]
    const foot1: Vec3 = [x1, body.height, z]
    facet(out, [low0, low1, high1, high0], [-rise, step, 0])
    facet(out, [low0, high0, foot0], [0, 0, -1])
    facet(out, [low1, foot1, high1], [0, 0, 1])
    facet(glass, [foot0, high0, high1, foot1], [1, 0, 0])
  }
  g.add(out, at(), roof, K.roof, { flat: true })
  g.add(glass, at(), '#ffcf7a', K.lamp, { flat: true })
}

function works(g: PropBuilder, s: Style): void {
  const body: Body = { width: 0.26, depth: 0.1, height: 0.065 }
  walls(g, body, '#5e4a42')
  sawtooth(g, body, s.roof[0] ?? '#3c4046')
  for (let k = 0; k < 3; k++) {
    const x = -0.09 + k * 0.09
    g.add(cyl(0.011, 0.015, 0.2, 8, 1, true), at(x, 0.12, -0.035), '#3a3230', K.stone)
    g.add(cyl(0.0135, 0.0135, 0.008, 8, 1, true), at(x, 0.2, -0.035), IRON, K.metal)
    g.add(circle(0.012, 8), at(x, 0.2205, -0.035, -Math.PI / 2, 0, 0), '#141210', K.plain)
  }
  door(g, -0.04, body.depth / 2, 0.04, 0.03)
  door(g, 0.07, body.depth / 2, 0.04, 0.03)
}

export function hall(style: BuildingStyle): PropGeometry {
  const s = STYLES[style]
  const g = new PropBuilder()
  if (style === 'nordhal') {
    works(g, s)
    return g.geometry()
  }
  const wall = s.walls[1] ?? '#ffffff'
  const body: Body = { width: 0.26, depth: 0.1, height: 0.06 }
  if (style === 'orsalis') {
    terrace(g, body, wall, s.base)
    for (const x of [-0.08, 0, 0.08]) {
      g.add(plane(0.03, 0.035), at(x, 0.0175, body.depth / 2 + 0.0005), GLASS, K.plain)
    }
    awning(g, 0, 0.042, body.depth / 2, 0.2, AWNINGS[0])
    return g.geometry()
  }
  const pitch: Pitch = { rise: 0.035, overhang: 0.008, eaves: 0.008, thickness: 0.004 }
  walls(g, body, wall)
  gable(g, body, pitch, s.roof[0] ?? '#ffffff', { colour: wall, kind: K.plaster })
  g.add(
    prism(0.12, 0.022, 0.01),
    at(0, eaveLine(body, pitch) + pitch.rise - 0.002, 0),
    s.roof[1] ?? s.roof[0] ?? '#ffffff',
    K.roof,
  )
  door(g, 0, body.depth / 2, 0.04, 0.034)
  door(g, -0.09, body.depth / 2, 0.022, 0.012)
  return g.geometry()
}

export function windmill(): PropGeometry {
  const g = new PropBuilder()
  g.add(cyl(0.03, 0.045, 0.2, 10), at(0, 0.1, 0), '#ece4d4', K.plaster)
  g.add(cone(0.04, 0.06, 10), at(0, 0.23, 0), '#8a4a2c', K.roof)
  g.add(box(0.012, 0.012, 0.03), at(0, 0.2, 0.04), '#4a3a2a', K.wood)
  return g.geometry()
}

export function blades(): PropGeometry {
  const g = new PropBuilder()
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2
    g.add(
      box(0.012, 0.13, 0.002),
      at(Math.sin(a) * 0.07, Math.cos(a) * 0.07, 0, 0, 0, -a),
      '#d8cfbc',
      K.rotor,
    )
    g.add(
      box(0.004, 0.14, 0.004),
      at(Math.sin(a) * 0.07, Math.cos(a) * 0.07, 0.002, 0, 0, -a),
      '#5a4632',
      K.rotor,
    )
  }
  g.add(ball(6, 4), at(0, 0, 0, 0, 0, 0, 0.012), '#3a2e22', K.rotor)
  return g.geometry()
}

export function boat(): PropGeometry {
  const g = new PropBuilder()
  g.add(
    scaled(cyl(0.025, 0.012, 0.12, 6, 1), 1, 1, 0.5),
    at(0, 0.008, 0, 0, 0, Math.PI / 2),
    '#6a4a2c',
    K.wood,
  )
  g.add(cyl(0.002, 0.002, 0.09, 4), at(0, 0.05, 0), '#4a3a2a', K.wood)
  g.add(box(0.001, 0.06, 0.05), at(0.005, 0.055, 0, 0, Math.PI / 2, 0), '#efe6d4', K.cloth)
  return g.geometry()
}

export function pier(): PropGeometry {
  const g = new PropBuilder()
  g.add(box(0.26, 0.012, 0.045), at(0.13, 0.02, 0), '#7a5a3a', K.wood)
  for (let k = 0; k < 4; k++) {
    for (const side of [-1, 1])
      g.add(cyl(0.005, 0.005, 0.3, 4), at(0.03 + k * 0.07, -0.12, side * 0.02), '#4e3a28', K.wood)
  }
  return g.geometry()
}

const wallColour = (style: BuildingStyle) =>
  style === 'nordhal'
    ? '#6e5a4e'
    : style === 'orsalis'
      ? '#d6b98a'
      : style === 'mountain'
        ? '#8a8680'
        : '#e4dccb'

export function wallPiece(style: BuildingStyle): PropGeometry {
  const g = new PropBuilder()
  const colour = wallColour(style)
  g.add(box(1, 0.5, 0.03), at(0, 0.25, 0), colour, K.rampart)
  g.add(box(1, 0.4, 0.03), at(0, -0.2, 0), colour, K.stone)
  return g.geometry()
}

export function wallTower(style: BuildingStyle): PropGeometry {
  const s = STYLES[style]
  const g = new PropBuilder()
  const colour = wallColour(style)
  g.add(cyl(0.045, 0.05, 0.36, 10), at(0, 0.06, 0), colour, K.stone)
  g.add(cyl(0.052, 0.052, 0.012, 10), at(0, 0.24, 0), colour, K.stone)
  g.add(cone(0.058, 0.08, 10), at(0, 0.285, 0), style === 'orsalis' ? '#3aa6a0' : s.spire, K.roof)
  return g.geometry()
}

export function lantern(): PropGeometry {
  const g = new PropBuilder()
  g.add(cyl(0.003, 0.004, 0.07, 4), at(0, 0.035, 0), '#2a2622', K.metal)
  g.add(box(0.012, 0.014, 0.012), at(0, 0.075, 0), '#ffcf7a', K.lamp)
  return g.geometry()
}

export function fineTower(
  height: number,
  radius: number,
  roof: string,
  wall: string,
): PropGeometry {
  const g = new PropBuilder()
  const gold = '#e8c35a'
  g.add(cyl(radius * 1.15, radius * 1.25, height * 0.3, 16), at(0, height * 0.15, 0), wall, K.stone)
  g.add(
    cyl(radius, radius * 1.1, height * 0.62, 16),
    at(0, height * 0.3 + height * 0.31, 0),
    wall,
    K.plaster,
  )
  g.add(
    torus(radius * 1.18, radius * 0.12, 6, 20),
    at(0, height * 0.62, 0, Math.PI / 2, 0, 0),
    wall,
    K.stone,
  )
  g.add(
    cyl(radius * 1.08, radius * 1.08, height * 0.04, 16),
    at(0, height * 0.92, 0),
    wall,
    K.rampart,
  )
  const profile: [number, number][] = []
  for (let k = 0; k <= 8; k++) {
    const f = k / 8
    profile.push([radius * 1.3 * (1 - f) ** 1.35 + 0.0005, f * height * 0.55])
  }
  g.add(lathe(profile, 16), at(0, height * 0.92, 0), roof, K.roof)
  g.add(cyl(radius * 0.05, radius * 0.05, height * 0.18, 5), at(0, height * 1.52, 0), gold, K.gold)
  g.add(ball(6, 5), at(0, height * 1.47, 0, 0, 0, 0, radius * 0.14), gold, K.gold)
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2 + 0.4
    g.add(
      cyl(radius * 0.28, radius * 0.28, height * 0.2, 8),
      at(Math.cos(a) * radius * 1.05, height * 0.86, Math.sin(a) * radius * 1.05),
      wall,
      K.stone,
    )
    g.add(
      cone(radius * 0.34, height * 0.2, 8),
      at(Math.cos(a) * radius * 1.05, height * 1.06, Math.sin(a) * radius * 1.05),
      roof,
      K.roof,
    )
  }
  return g.geometry()
}

export function palace(): PropGeometry {
  const g = new PropBuilder()
  const stone = '#f1ece2'
  const gold = '#e8c35a'
  const blue = '#34497e'
  g.add(cyl(0.95, 1.05, 0.22, 40), at(0, 0.11, 0), '#d9d1c2', K.stone)
  g.add(cyl(0.7, 0.72, 0.42, 40), at(0, 0.43, 0), stone, K.plaster)
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2
    g.add(
      cyl(0.035, 0.04, 0.36, 8),
      at(Math.cos(a) * 0.86, 0.4, Math.sin(a) * 0.86),
      stone,
      K.stone,
    )
  }
  g.add(torus(0.86, 0.04, 6, 48), at(0, 0.6, 0, Math.PI / 2, 0, 0), stone, K.stone)
  const profile: [number, number][] = []
  for (let k = 0; k <= 12; k++) {
    const t = ((k / 12) * Math.PI) / 2
    profile.push([Math.cos(t) * 0.66 + 0.0005, Math.sin(t) * 0.72])
  }
  g.add(lathe(profile, 40), at(0, 0.64, 0), gold, K.gold)
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    const points: Vec3[] = []
    const radii: number[] = []
    for (let q = 0; q <= 10; q++) {
      const t = ((q / 10) * Math.PI) / 2
      points.push([
        Math.cos(a) * Math.cos(t) * 0.675,
        0.64 + Math.sin(t) * 0.735,
        Math.sin(a) * Math.cos(t) * 0.675,
      ])
      radii.push(0.018)
    }
    tube(g, points, radii, '#c99a2e', K.gold, 5)
  }
  g.add(cyl(0.1, 0.12, 0.2, 12), at(0, 1.44, 0), stone, K.plaster)
  g.add(cone(0.14, 0.32, 12), at(0, 1.7, 0), blue, K.roof)
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2
    g.add(
      box(0.36, 0.5, 0.24),
      at(Math.cos(a) * 0.92, 0.25, Math.sin(a) * 0.92, 0, -a, 0),
      stone,
      K.plaster,
    )
    g.add(
      prism(0.38, 0.28, 0.16),
      at(Math.cos(a) * 0.92, 0.5, Math.sin(a) * 0.92, 0, -a + Math.PI / 2, 0),
      blue,
      K.roof,
    )
  }
  return g.geometry()
}
