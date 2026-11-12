import { describe, expect, it } from 'vitest'
import {
  type ArmsRelief,
  armsSurface,
  basRelief,
  bezelHeight,
  curvatureOf,
  depthInside,
  distanceToSeeds,
  engravingDepth,
  halfRound,
  inflate,
  normalsOf,
  occlusionOf,
  type Plane,
  roundedShoulder,
  type SealRelief,
  sealOutline,
  sealSurface,
  shadowOf,
  wireHeight,
} from '../../src/lib/art-effect/relief'
import { SEAL } from '../../src/lib/art-effect/seal-look'

const RELIEF: ArmsRelief = {
  dome: 2,
  bezel: { roll: 0.25, band: 0.5, drop: 0.25, bead: 0.5, height: 1, valley: 0.5, crest: 0.8 },
  fillet: { width: 1, height: 0.6 },
  enamel: { recess: 0.4, meniscus: 0.1, reach: 0.5, pooling: 0.5 },
  charge: { volume: { height: 1.2, reach: 1 }, parts: { height: 0.4, reach: 0.5 } },
  engraving: { depth: 0.3, slope: 0.2, inset: 0.3 },
  curvature: { reach: 0.25, gain: 0.5 },
  occlusion: { contact: { reach: 0.5, strength: 4 }, broad: { reach: 1, strength: 2 } },
  shadow: { reach: 4, softness: 0.3 },
}

function plane(width: number, height: number, inside: (x: number, y: number) => boolean): Plane {
  const values = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) values[y * width + x] = inside(x, y) ? 1 : 0
  }
  return { width, height, values }
}

function mask(
  width: number,
  height: number,
  inside: (x: number, y: number) => boolean,
): Uint8Array {
  return Uint8Array.from(plane(width, height, inside).values)
}

describe('the distance transform of the arms', () => {
  it('measures the exact Euclidean distance to the nearest seed', () => {
    const width = 9
    const height = 7
    const seeds = new Uint8Array(width * height)
    seeds[2 * width + 3] = 1
    const distances = distanceToSeeds(seeds, width, height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        expect(distances[y * width + x]).toBeCloseTo(Math.hypot(x - 3, y - 2), 5)
      }
    }
  })

  it('finds the centre of a disc about one radius deep', () => {
    const size = 41
    const radius = 15
    const disc = plane(size, size, (x, y) => Math.hypot(x - 20, y - 20) <= radius)
    const depth = depthInside(disc)
    expect(depth[20 * size + 20]).toBeGreaterThan(radius - 1.5)
    expect(depth[20 * size + 20]).toBeLessThan(radius + 0.5)
    expect(depth[0]).toBe(0)
  })
})

describe('the inflation of a charge', () => {
  it('rounds a long strip into a half cylinder as wide as the strip', () => {
    const width = 31
    const height = 240
    const across = 9
    const strip = mask(width, height, (x, y) => x >= 11 && x < 11 + across && y >= 10 && y < 230)
    const radius = inflate(strip, width, height)
    for (let step = 0; step < across; step++) {
      const exact = Math.sqrt((step + 1) * (across - step))
      expect(radius[120 * width + 11 + step]).toBeCloseTo(exact, 1)
    }
  })

  it('domes a wide disc to its exact solution, through every level of the solver', () => {
    const size = 161
    const centre = 80
    const disc = mask(size, size, (x, y) => Math.hypot(x - centre, y - centre) <= 60)
    const radius = inflate(disc, size, size)
    const exact = 60.5 / Math.SQRT2
    expect(Math.abs((radius[centre * size + centre] ?? 0) - exact) / exact).toBeLessThan(0.02)
  })

  it('raises a wide part higher than a thin one, and nothing outside the shape', () => {
    const width = 80
    const height = 120
    const shape = mask(
      width,
      height,
      (x, y) => y >= 10 && y < 110 && ((x >= 5 && x < 12) || (x >= 30 && x < 51)),
    )
    const radius = inflate(shape, width, height)
    expect(radius[60 * width + 40]).toBeGreaterThan((radius[60 * width + 8] ?? 0) * 2)
    expect(radius[60 * width + 20]).toBe(0)
    expect(radius.every((value) => Number.isFinite(value) && value >= 0)).toBe(true)
  })

  it('lets a drawn line split a shape into parts that swell on their own', () => {
    const width = 60
    const height = 100
    const parts = mask(width, height, (x, y) => x >= 10 && x < 50 && y >= 10 && y < 90 && x !== 30)
    const radius = inflate(parts, width, height)
    expect(radius[50 * width + 30]).toBe(0)
    expect(radius[50 * width + 20]).toBeGreaterThan(radius[50 * width + 29] ?? 0)
    expect(radius[50 * width + 40]).toBeGreaterThan(radius[50 * width + 31] ?? 0)
  })
})

describe('the profiles of the relief', () => {
  it('rolls the outer edge of the bezel up to its band', () => {
    expect(roundedShoulder(0, 1)).toBe(0)
    expect(roundedShoulder(0.5, 1)).toBeGreaterThan(0.5)
    expect(roundedShoulder(1, 1)).toBe(1)
    expect(roundedShoulder(3, 1)).toBe(1)
  })

  it('steps the bezel from its rolled edge to a band, down a chamfer, and over a bead', () => {
    const { bezel } = RELIEF
    expect(bezelHeight(0, bezel)).toBe(0)
    expect(bezelHeight(bezel.roll / 2, bezel)).toBeGreaterThan(0)
    expect(bezelHeight(bezel.roll + bezel.band / 2, bezel)).toBe(bezel.height)
    const beadStart = bezel.roll + bezel.band + bezel.drop
    expect(bezelHeight(beadStart, bezel)).toBeCloseTo(bezel.valley)
    expect(bezelHeight(beadStart - bezel.drop / 2, bezel)).toBeLessThan(bezel.height)
    expect(bezelHeight(beadStart - bezel.drop / 2, bezel)).toBeGreaterThan(bezel.valley)
    expect(bezelHeight(beadStart + bezel.bead / 2, bezel)).toBeCloseTo(bezel.crest)
  })

  it('rounds a partition wire to its height on the line and to nothing at its side', () => {
    expect(wireHeight(0, RELIEF.fillet)).toBe(RELIEF.fillet.height)
    expect(wireHeight(RELIEF.fillet.width / 4, RELIEF.fillet)).toBeLessThan(RELIEF.fillet.height)
    expect(wireHeight(RELIEF.fillet.width / 2, RELIEF.fillet)).toBe(0)
    expect(halfRound(1, 2)).toBe(1)
  })

  it('compresses a charge toward a plateau as it widens', () => {
    const { volume } = RELIEF.charge
    expect(basRelief(0, volume)).toBe(0)
    expect(basRelief(volume.reach, volume)).toBeCloseTo(volume.height * (1 - Math.exp(-1)))
    expect(basRelief(50, volume)).toBeCloseTo(volume.height)
    expect(basRelief(2, volume)).toBeGreaterThan(basRelief(1, volume))
  })

  it('cuts a line as a V that deepens toward its middle and fades at the outline', () => {
    const { engraving } = RELIEF
    expect(engravingDepth(0, 5, engraving)).toBe(0)
    expect(engravingDepth(engraving.slope / 2, 5, engraving)).toBeCloseTo(engraving.depth / 2)
    expect(engravingDepth(engraving.slope, 5, engraving)).toBe(engraving.depth)
    expect(engravingDepth(engraving.slope, engraving.inset, engraving)).toBe(0)
  })
})

describe('the surface of the arms', () => {
  const size = 80
  const pixelsPerUnit = 4
  const shield = plane(size, size, (x, y) => x >= 4 && x < 76 && y >= 4 && y < 76)
  const sable = plane(size, size, (x) => x >= 40)
  const charges = plane(size, size, (x, y) => Math.hypot(x - 22, y - 40) <= 9)
  const lines = plane(size, size, (x, y) => x === 22 && Math.abs(y - 40) <= 4)
  const surface = armsSurface({ shield, sable, charges, lines }, RELIEF, pixelsPerUnit, 40, 36)
  const at = (x: number, y: number): number => y * size + x

  it('holds a finite height everywhere', () => {
    expect(surface.height.every(Number.isFinite)).toBe(true)
  })

  it('makes the charges, the bezel and the partition gilt, and leaves the cells enamel', () => {
    expect(surface.metal[at(22, 36)]).toBe(1)
    expect(surface.metal[at(5, 40)]).toBe(1)
    expect(surface.metal[at(40, 20)]).toBe(1)
    expect(surface.metal[at(30, 20)]).toBe(0)
    expect(surface.metal[at(60, 60)]).toBe(0)
  })

  it('raises a charge above the enamel around it', () => {
    expect(surface.height[at(25, 40)]).toBeGreaterThan(surface.height[at(34, 52)] ?? 0)
  })

  it('sinks the enamel below the gilt wire beside it', () => {
    expect(surface.height[at(46, 20)]).toBeLessThan(surface.height[at(40, 20)] ?? 0)
  })

  it('engraves the drawn line of a charge below the metal beside it', () => {
    expect(surface.height[at(22, 40)]).toBeLessThan(surface.height[at(24, 40)] ?? 0)
  })

  it('pools the enamel deepest against the metal and thins it away from the walls', () => {
    expect(surface.pooled[at(32, 40)]).toBeGreaterThan(surface.pooled[at(30, 24)] ?? 1)
    expect(surface.pooled.every((value) => value >= 0 && value <= 1)).toBe(true)
  })
})

describe('the occlusion of a height field', () => {
  it('shades a groove darker than the flat around it, and leaves the flat untouched', () => {
    const width = 30
    const surface = new Float32Array(width * width).fill(1)
    for (let y = 0; y < width; y++) surface[y * width + 15] = 0.6
    const occlusion = occlusionOf(surface, width, width, RELIEF, 4)
    expect(occlusion[15 * width + 15]).toBeLessThan(0.95)
    expect(occlusion[15 * width + 3]).toBe(1)
    expect(occlusion.every((value) => value > 0 && value <= 1)).toBe(true)
  })
})

describe('the curvature of a height field', () => {
  const width = 40
  const tent = (x: number): number => Math.max(0, 1 - Math.abs(x - 20) / 10)

  it('reads a ridge as convex and a groove as concave', () => {
    const ridge = Float32Array.from({ length: width * width }, (_, at) => tent(at % width))
    const groove = Float32Array.from(ridge, (value) => -value)
    const convex = curvatureOf(ridge, width, width, RELIEF, 4)
    const concave = curvatureOf(groove, width, width, RELIEF, 4)
    expect(convex[20 * width + 20]).toBeGreaterThan(0.2)
    expect(concave[20 * width + 20]).toBeLessThan(-0.2)
    expect(convex.every((value) => value >= -1 && value <= 1)).toBe(true)
  })

  it('reads a flat or evenly sloping field as neither', () => {
    const slope = Float32Array.from({ length: width * width }, (_, at) => (at % width) * 0.1)
    const curvature = curvatureOf(slope, width, width, RELIEF, 4)
    expect(curvature[20 * width + 20]).toBeCloseTo(0, 5)
  })
})

describe('the normals of a height field', () => {
  it('face the viewer on a flat surface', () => {
    const normals = normalsOf(new Float32Array(16).fill(2), 4, 4, 1)
    expect(normals[15]).toBeCloseTo(0)
    expect(normals[16]).toBeCloseTo(0)
    expect(normals[17]).toBe(1)
  })

  it('lean left on a surface that rises to the right, and up on one that rises toward the bottom', () => {
    const width = 5
    const rising = Float32Array.from({ length: 25 }, (_, at) => at % width)
    const right = normalsOf(rising, width, width, 1)
    expect(right[(2 * width + 2) * 3]).toBeLessThan(0)
    const falling = Float32Array.from({ length: 25 }, (_, at) => Math.floor(at / width))
    const down = normalsOf(falling, width, width, 1)
    expect(down[(2 * width + 2) * 3 + 1]).toBeGreaterThan(0)
  })

  it('stay one unit long', () => {
    const bumpy = Float32Array.from({ length: 36 }, (_, at) => Math.sin(at) * 3)
    const normals = normalsOf(bumpy, 6, 6, 2)
    for (let at = 0; at < normals.length; at += 3) {
      expect(Math.hypot(normals[at] ?? 0, normals[at + 1] ?? 0, normals[at + 2] ?? 0)).toBeCloseTo(
        1,
        5,
      )
    }
  })
})

describe('the shadow of the relief under the key light', () => {
  const size = 40
  const block = Float32Array.from({ length: size * size }, (_, at) => {
    const x = at % size
    const y = Math.floor(at / size)
    return x >= 18 && x < 22 && y >= 18 && y < 22 ? 2 : 0
  })
  const fromUpperLeft = [-0.45, 0.6, 0.66] as const
  const shadow = shadowOf(block, size, size, fromUpperLeft, RELIEF, 4)
  const at = (x: number, y: number): number => shadow[y * size + x] ?? 1

  it('falls on the side away from the light', () => {
    expect(at(23, 24)).toBeLessThan(0.5)
  })

  it('leaves the side toward the light and the open ground lit', () => {
    expect(at(16, 15)).toBe(1)
    expect(at(5, 35)).toBe(1)
    expect(at(19, 19)).toBe(1)
  })

  it('stays between dark and lit everywhere', () => {
    expect(shadow.every((value) => value >= 0 && value <= 1)).toBe(true)
  })
})

const SEAL_RELIEF: SealRelief = {
  span: 100,
  centre: { x: 50, y: 45 },
  outline: { radius: 40, waves: [[5, 0.03, 1]] },
  drip: { angle: Math.PI / 2, from: 0.85, to: 1.15, neck: 5, tip: 4, blend: 3 },
  body: { height: 3, reach: 3, dome: 0, ripples: [] },
  stamp: { radius: 25, press: 1, wall: 1 },
  ring: { height: 1, width: 6, waves: [], drift: [], ripples: [] },
  emblem: { span: 40, swell: { height: 0.8, reach: 0.5 }, clearance: 1 },
  roughness: { body: 0.5, ring: 0.7, field: 0.3, emblem: 0.3 },
  curvature: { reach: 0.2, gain: 0.25 },
  occlusion: { contact: { reach: 0.35, strength: 5 }, broad: { reach: 1.5, strength: 2 } },
  shadow: { reach: 4, softness: 0.3 },
}

const SEAL_SIDE = 200

function sealAt(relief: SealRelief, emblem: (x: number, y: number) => boolean) {
  const puddle = sealOutline({ width: SEAL_SIDE, height: SEAL_SIDE }, relief)
  const perUnit = SEAL_SIDE / relief.span
  const pressed = plane(SEAL_SIDE, SEAL_SIDE, (x, y) =>
    emblem((x + 0.5) / perUnit - relief.centre.x, (y + 0.5) / perUnit - relief.centre.y),
  )
  const surface = sealSurface(puddle, pressed, relief)
  const at = (x: number, y: number): number =>
    Math.round((relief.centre.y + y) * perUnit) * SEAL_SIDE +
    Math.round((relief.centre.x + x) * perUnit)
  return { puddle, surface, at }
}

describe('the wax seal', () => {
  const empty = sealAt(SEAL_RELIEF, () => false)

  it('draws the same seal twice, value for value', () => {
    const again = sealAt(SEAL_RELIEF, () => false)
    expect(again.surface.height).toEqual(empty.surface.height)
    expect(again.surface.roughness).toEqual(empty.surface.roughness)
  })

  it('hangs its one drip lowest on the outline, below the rim of the puddle', () => {
    const rows = new Map<number, number[]>()
    for (let at = 0; at < empty.puddle.values.length; at++) {
      if ((empty.puddle.values[at] ?? 0) < 0.5) continue
      const y = Math.floor(at / SEAL_SIDE)
      rows.set(y, [...(rows.get(y) ?? []), at % SEAL_SIDE])
    }
    const bottom = Math.max(...rows.keys())
    const tip = rows.get(bottom) ?? []
    const perUnit = SEAL_SIDE / SEAL_RELIEF.span
    const across = tip.reduce((sum, x) => sum + x + 0.5, 0) / tip.length / perUnit
    expect(across).toBeCloseTo(SEAL_RELIEF.centre.x, 0)
    expect((bottom + 0.5) / perUnit - SEAL_RELIEF.centre.y).toBeGreaterThan(
      SEAL_RELIEF.outline.radius * 1.1,
    )
  })

  it('raises the squeezed ring above the body, and the body above the pressed field', () => {
    const { stamp, ring } = SEAL_RELIEF
    const crest = stamp.radius - stamp.wall / 2 + ring.width / 2
    const height = (x: number): number => empty.surface.height[empty.at(x, 0)] ?? 0
    const field = height(stamp.radius / 2)
    const body = height(stamp.radius + ring.width + 2)
    expect(height(crest)).toBeGreaterThan(body)
    expect(body).toBeGreaterThan(field)
  })

  it('keeps the pressed field flat and smoother than the body, and the ring rougher', () => {
    const field = [0, 5, 10, 15].map((x) => empty.surface.height[empty.at(x, -x / 2)] ?? 0)
    for (const height of field) expect(height).toBeCloseTo(field[0] ?? 0, 3)
    const { stamp, ring } = SEAL_RELIEF
    const roughness = (x: number): number => empty.surface.roughness[empty.at(x, 0)] ?? 0
    expect(roughness(0)).toBeLessThan(roughness(stamp.radius + ring.width + 2))
    expect(roughness(stamp.radius - stamp.wall / 2 + ring.width / 2)).toBeGreaterThan(
      roughness(stamp.radius + ring.width + 2),
    )
  })

  it('swells each shape of the emblem on its own and leaves its holes at the level of the field', () => {
    const annulus = (x: number, y: number): boolean => {
      const r = Math.hypot(x, y)
      return r > 4 && r < 9
    }
    const pressed = sealAt(SEAL_RELIEF, annulus)
    const height = (x: number): number => pressed.surface.height[pressed.at(x, 0)] ?? 0
    expect(height(0)).toBeCloseTo(empty.surface.height[empty.at(0, 0)] ?? 0, 3)
    expect(height(6.5)).toBeGreaterThan(height(0) + 0.4)
    const sunk = sealAt(
      { ...SEAL_RELIEF, emblem: { ...SEAL_RELIEF.emblem, swell: { height: -0.8, reach: 0.5 } } },
      annulus,
    )
    expect(sunk.surface.height[sunk.at(6.5, 0)] ?? 0).toBeLessThan(height(0) - 0.4)
  })

  it('keeps the outline of the shipped seal inside its map', () => {
    const puddle = sealOutline({ width: SEAL_SIDE, height: SEAL_SIDE }, SEAL.relief)
    for (let i = 0; i < SEAL_SIDE; i++) {
      for (const at of [
        i,
        (SEAL_SIDE - 1) * SEAL_SIDE + i,
        i * SEAL_SIDE,
        i * SEAL_SIDE + SEAL_SIDE - 1,
      ]) {
        expect(puddle.values[at]).toBe(0)
      }
    }
  })
})
