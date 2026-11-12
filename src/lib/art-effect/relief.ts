export type Plane = { width: number; height: number; values: Float32Array }

export type Swell = { height: number; reach: number }

export type Occluder = { reach: number; strength: number }

export type Bezel = {
  roll: number
  band: number
  drop: number
  bead: number
  height: number
  valley: number
  crest: number
}

export type ArmsRelief = {
  dome: number
  bezel: Bezel
  fillet: { width: number; height: number }
  enamel: { recess: number; meniscus: number; reach: number; pooling: number }
  charge: { volume: Swell; parts: Swell }
  engraving: { depth: number; slope: number; inset: number }
  curvature: { reach: number; gain: number }
  occlusion: { contact: Occluder; broad: Occluder }
  shadow: { reach: number; softness: number }
}

export type KeyLight = readonly [across: number, up: number, toward: number]

export type ArmsLayers = {
  shield: Plane
  sable: Plane
  charges: Plane
  lines: Plane
}

export type ArmsSurface = {
  height: Float32Array
  metal: Float32Array
  pooled: Float32Array
}

const FAR = 1e20

function distanceLine(
  source: Float64Array,
  length: number,
  out: Float64Array,
  hull: Int32Array,
  bounds: Float64Array,
): void {
  let top = 0
  hull[0] = 0
  bounds[0] = -FAR
  bounds[1] = FAR
  for (let q = 1; q < length; q++) {
    const fq = source[q] ?? FAR
    let s = 0
    for (;;) {
      const p = hull[top] ?? 0
      s = (fq + q * q - ((source[p] ?? FAR) + p * p)) / (2 * q - 2 * p)
      if (s > (bounds[top] ?? -FAR)) break
      top -= 1
    }
    top += 1
    hull[top] = q
    bounds[top] = s
    bounds[top + 1] = FAR
  }
  top = 0
  for (let q = 0; q < length; q++) {
    while ((bounds[top + 1] ?? FAR) < q) top += 1
    const p = hull[top] ?? 0
    out[q] = (q - p) * (q - p) + (source[p] ?? FAR)
  }
}

export function distanceToSeeds(seeds: Uint8Array, width: number, height: number): Float32Array {
  const longest = Math.max(width, height)
  const line = new Float64Array(longest)
  const solved = new Float64Array(longest)
  const hull = new Int32Array(longest)
  const bounds = new Float64Array(longest + 1)
  const squared = new Float64Array(width * height)
  for (let at = 0; at < squared.length; at++) squared[at] = seeds[at] ? 0 : FAR
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) line[y] = squared[y * width + x] ?? FAR
    distanceLine(line, height, solved, hull, bounds)
    for (let y = 0; y < height; y++) squared[y * width + x] = solved[y] ?? FAR
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) line[x] = squared[y * width + x] ?? FAR
    distanceLine(line, width, solved, hull, bounds)
    for (let x = 0; x < width; x++) squared[y * width + x] = solved[x] ?? FAR
  }
  const distances = new Float32Array(width * height)
  for (let at = 0; at < distances.length; at++) distances[at] = Math.sqrt(squared[at] ?? FAR)
  return distances
}

function seedsWhere(plane: Plane, test: (value: number, at: number) => boolean): Uint8Array {
  const seeds = new Uint8Array(plane.values.length)
  for (let at = 0; at < seeds.length; at++) seeds[at] = test(plane.values[at] ?? 0, at) ? 1 : 0
  return seeds
}

export function depthInside(plane: Plane): Float32Array {
  const outside = seedsWhere(plane, (value) => value < 0.5)
  const distances = distanceToSeeds(outside, plane.width, plane.height)
  for (let at = 0; at < distances.length; at++) {
    distances[at] = Math.max(0, (distances[at] ?? 0) - 0.5)
  }
  return distances
}

type Grid = {
  width: number
  height: number
  inside: Uint8Array
  cells: readonly [Int32Array, Int32Array]
  spacing: number
}

const COARSEST_SIDE = 12
const COARSEST_SWEEPS = 400
const SMOOTHING_SWEEPS = 3
const CYCLES = 12

function gridOf(inside: Uint8Array, width: number, height: number, spacing: number): Grid {
  const sealed = new Uint8Array(inside.length)
  const parities: [number[], number[]] = [[], []]
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const at = y * width + x
      if (!inside[at]) continue
      sealed[at] = 1
      parities[(x + y) % 2]?.push(at)
    }
  }
  return {
    width,
    height,
    inside: sealed,
    cells: [Int32Array.from(parities[0]), Int32Array.from(parities[1])],
    spacing,
  }
}

function coarserGrid(fine: Grid): Grid {
  const width = Math.ceil(fine.width / 2)
  const height = Math.ceil(fine.height / 2)
  const inside = new Uint8Array(width * height)
  const covers = (x: number, y: number): boolean =>
    x < fine.width && y < fine.height && fine.inside[y * fine.width + x] === 1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const filled =
        covers(2 * x, 2 * y) &&
        covers(2 * x + 1, 2 * y) &&
        covers(2 * x, 2 * y + 1) &&
        covers(2 * x + 1, 2 * y + 1)
      inside[y * width + x] = filled ? 1 : 0
    }
  }
  return gridOf(inside, width, height, fine.spacing * 2)
}

function smoothPotential(
  potential: Float32Array,
  source: Float32Array,
  grid: Grid,
  sweeps: number,
): void {
  const { width } = grid
  const area = grid.spacing * grid.spacing
  for (let sweep = 0; sweep < sweeps; sweep++) {
    for (const cells of grid.cells) {
      for (const at of cells) {
        const around =
          (potential[at - 1] ?? 0) +
          (potential[at + 1] ?? 0) +
          (potential[at - width] ?? 0) +
          (potential[at + width] ?? 0)
        potential[at] = (around + area * (source[at] ?? 0)) / 4
      }
    }
  }
}

function residualOf(potential: Float32Array, source: Float32Array, grid: Grid): Float32Array {
  const { width } = grid
  const area = grid.spacing * grid.spacing
  const residual = new Float32Array(potential.length)
  for (const cells of grid.cells) {
    for (const at of cells) {
      const laplacian =
        ((potential[at - 1] ?? 0) +
          (potential[at + 1] ?? 0) +
          (potential[at - width] ?? 0) +
          (potential[at + width] ?? 0) -
          4 * (potential[at] ?? 0)) /
        area
      residual[at] = (source[at] ?? 0) + laplacian
    }
  }
  return residual
}

function restricted(residual: Float32Array, fine: Grid, coarse: Grid): Float32Array {
  const out = new Float32Array(coarse.width * coarse.height)
  const at = (x: number, y: number): number =>
    x < fine.width && y < fine.height ? (residual[y * fine.width + x] ?? 0) : 0
  for (const cells of coarse.cells) {
    for (const cell of cells) {
      const x = 2 * (cell % coarse.width)
      const y = 2 * Math.floor(cell / coarse.width)
      out[cell] = (at(x, y) + at(x + 1, y) + at(x, y + 1) + at(x + 1, y + 1)) / 4
    }
  }
  return out
}

function addProlonged(
  potential: Float32Array,
  correction: Float32Array,
  coarse: Grid,
  fine: Grid,
): void {
  const sample = (x: number, y: number): number => {
    const column = Math.min(Math.max(x, 0), coarse.width - 1)
    const row = Math.min(Math.max(y, 0), coarse.height - 1)
    return correction[row * coarse.width + column] ?? 0
  }
  for (const cells of fine.cells) {
    for (const at of cells) {
      const u = ((at % fine.width) + 0.5) / 2 - 0.5
      const v = (Math.floor(at / fine.width) + 0.5) / 2 - 0.5
      const x = Math.floor(u)
      const y = Math.floor(v)
      const fx = u - x
      const fy = v - y
      const top = sample(x, y) * (1 - fx) + sample(x + 1, y) * fx
      const bottom = sample(x, y + 1) * (1 - fx) + sample(x + 1, y + 1) * fx
      potential[at] = (potential[at] ?? 0) + top * (1 - fy) + bottom * fy
    }
  }
}

function vCycle(
  potential: Float32Array,
  source: Float32Array,
  grids: readonly Grid[],
  level: number,
): void {
  const grid = grids[level]
  if (!grid) return
  const coarse = grids[level + 1]
  if (!coarse) {
    smoothPotential(potential, source, grid, COARSEST_SWEEPS)
    return
  }
  smoothPotential(potential, source, grid, SMOOTHING_SWEEPS)
  const correction = new Float32Array(coarse.width * coarse.height)
  vCycle(
    correction,
    restricted(residualOf(potential, source, grid), grid, coarse),
    grids,
    level + 1,
  )
  addProlonged(potential, correction, coarse, grid)
  smoothPotential(potential, source, grid, SMOOTHING_SWEEPS)
}

export function inflate(inside: Uint8Array, width: number, height: number): Float32Array {
  const grids = [gridOf(inside, width, height, 1)]
  for (;;) {
    const last = grids[grids.length - 1]
    if (!last || Math.min(last.width, last.height) <= COARSEST_SIDE) break
    grids.push(coarserGrid(last))
  }
  const source = Float32Array.from(grids[0]?.inside ?? [])
  const potential = new Float32Array(width * height)
  for (let cycle = 0; cycle < CYCLES; cycle++) vCycle(potential, source, grids, 0)
  return Float32Array.from(potential, (value) => Math.sqrt(2 * Math.max(value, 0)))
}

export function roundedShoulder(distance: number, width: number): number {
  const t = Math.min(Math.max(distance / width, 0), 1)
  return Math.sqrt(1 - (1 - t) * (1 - t))
}

export function halfRound(distance: number, width: number): number {
  const s = (2 * distance) / width - 1
  return Math.sqrt(Math.max(0, 1 - s * s))
}

export function smoothstep(from: number, to: number, value: number): number {
  const t = Math.min(Math.max((value - from) / (to - from), 0), 1)
  return t * t * (3 - 2 * t)
}

export function bezelWidth(bezel: Bezel): number {
  return bezel.roll + bezel.band + bezel.drop + bezel.bead
}

export function bezelHeight(distance: number, bezel: Bezel): number {
  const banded = distance - bezel.roll
  if (banded < 0) return bezel.height * roundedShoulder(distance, bezel.roll)
  const dropped = banded - bezel.band
  if (dropped < 0) return bezel.height
  const beaded = dropped - bezel.drop
  if (beaded < 0) return bezel.height + ((bezel.valley - bezel.height) * dropped) / bezel.drop
  const crown = halfRound(Math.min(beaded, bezel.bead), bezel.bead)
  return bezel.valley + (bezel.crest - bezel.valley) * crown
}

export function wireHeight(distance: number, fillet: { width: number; height: number }): number {
  return fillet.height * halfRound(distance + fillet.width / 2, fillet.width)
}

export function basRelief(radius: number, swell: Swell): number {
  return swell.height * (1 - Math.exp(-radius / swell.reach))
}

export function engravingDepth(
  inLine: number,
  inCharge: number,
  engraving: ArmsRelief['engraving'],
): number {
  const cut = Math.min(inLine / engraving.slope, 1)
  return engraving.depth * cut * smoothstep(engraving.inset, 2 * engraving.inset, inCharge)
}

function coverageWithin(distance: number, edge: number): number {
  return Math.min(Math.max(edge - distance + 0.5, 0), 1)
}

export function armsSurface(
  layers: ArmsLayers,
  relief: ArmsRelief,
  pixelsPerUnit: number,
  centreX: number,
  halfWidth: number,
): ArmsSurface {
  const { width, height } = layers.shield
  const count = width * height
  const inside = (at: number): boolean => (layers.shield.values[at] ?? 0) >= 0.5
  const sable = (at: number): boolean => inside(at) && (layers.sable.values[at] ?? 0) >= 0.5
  const lined = (at: number): boolean => (layers.lines.values[at] ?? 0) >= 0.5

  const edge = depthInside(layers.shield)
  const toSable = distanceToSeeds(
    seedsWhere(layers.sable, (_, at) => sable(at)),
    width,
    height,
  )
  const toPurpure = distanceToSeeds(
    seedsWhere(layers.sable, (_, at) => inside(at) && !sable(at)),
    width,
    height,
  )
  const inCharge = depthInside(layers.charges)
  const inLine = depthInside(layers.lines)
  const volume = inflate(
    seedsWhere(layers.charges, (value) => value >= 0.5),
    width,
    height,
  )
  const parts = inflate(
    seedsWhere(layers.charges, (value, at) => value >= 0.5 && !lined(at)),
    width,
    height,
  )

  const bezel = bezelWidth(relief.bezel)
  const metal = new Float32Array(count)
  const raised = new Float32Array(count)
  for (let at = 0; at < count; at++) {
    if (!inside(at)) continue
    const fromEdge = edge[at] ?? 0
    const fromBoundary = sable(at) ? (toPurpure[at] ?? FAR) : (toSable[at] ?? FAR)
    const charge = layers.charges.values[at] ?? 0
    const rim = coverageWithin(fromEdge, bezel * pixelsPerUnit)
    const fillet = coverageWithin(fromBoundary, (relief.fillet.width / 2) * pixelsPerUnit)
    metal[at] = Math.max(rim, fillet, charge)

    const edgeUnits = fromEdge / pixelsPerUnit
    const boundaryUnits = fromBoundary / pixelsPerUnit
    const rimHeight = edgeUnits < bezel ? bezelHeight(edgeUnits, relief.bezel) : 0
    const wire =
      boundaryUnits < relief.fillet.width / 2 ? wireHeight(boundaryUnits, relief.fillet) : 0
    const chargeHeight =
      charge > 0
        ? basRelief((volume[at] ?? 0) / pixelsPerUnit, relief.charge.volume) +
          basRelief((parts[at] ?? 0) / pixelsPerUnit, relief.charge.parts) -
          engravingDepth(
            (inLine[at] ?? 0) / pixelsPerUnit,
            (inCharge[at] ?? 0) / pixelsPerUnit,
            relief.engraving,
          )
        : 0
    raised[at] = Math.max(rimHeight, wire, chargeHeight)
  }

  const toMetal = distanceToSeeds(
    Uint8Array.from(metal, (value) => (value >= 0.5 ? 1 : 0)),
    width,
    height,
  )
  const surface = new Float32Array(count)
  const pooled = new Float32Array(count)
  for (let at = 0; at < count; at++) {
    if (!inside(at)) continue
    const across = Math.min(Math.abs((at % width) - centreX) / halfWidth, 1)
    const dome = relief.dome * (1 - across * across)
    const wall = (toMetal[at] ?? FAR) / pixelsPerUnit
    const enamel =
      -relief.enamel.recess + relief.enamel.meniscus * Math.exp(-wall / relief.enamel.reach)
    const m = metal[at] ?? 0
    surface[at] = dome + enamel * (1 - m) + (raised[at] ?? 0) * m
    pooled[at] = Math.exp(-wall / relief.enamel.pooling)
  }
  return { height: surface, metal, pooled }
}

export function blurred(
  values: Float32Array,
  width: number,
  height: number,
  radius: number,
): Float32Array {
  const pass = (from: Float32Array, horizontal: boolean): Float32Array => {
    const out = new Float32Array(from.length)
    const span = 2 * radius + 1
    for (let line = 0; line < (horizontal ? height : width); line++) {
      const length = horizontal ? width : height
      const index = (step: number): number => {
        const clamped = Math.min(Math.max(step, 0), length - 1)
        return horizontal ? line * width + clamped : clamped * width + line
      }
      let sum = 0
      for (let k = -radius; k <= radius; k++) sum += from[index(k)] ?? 0
      for (let step = 0; step < length; step++) {
        out[index(step)] = sum / span
        sum += (from[index(step + radius + 1)] ?? 0) - (from[index(step - radius)] ?? 0)
      }
    }
    return out
  }
  return pass(pass(values, true), false)
}

function sunkBelow(
  surface: Float32Array,
  width: number,
  height: number,
  reach: number,
  pixelsPerUnit: number,
): Float32Array {
  const radius = Math.max(1, Math.round(reach * pixelsPerUnit))
  const around = blurred(blurred(surface, width, height, radius), width, height, radius)
  return Float32Array.from(surface, (value, at) => Math.max(0, (around[at] ?? 0) - value))
}

export function occlusionOf(
  surface: Float32Array,
  width: number,
  height: number,
  relief: Pick<ArmsRelief, 'occlusion'>,
  pixelsPerUnit: number,
): Float32Array {
  const { contact, broad } = relief.occlusion
  const near = sunkBelow(surface, width, height, contact.reach, pixelsPerUnit)
  const far = sunkBelow(surface, width, height, broad.reach, pixelsPerUnit)
  return Float32Array.from(
    near,
    (sunk, at) => 1 / (1 + contact.strength * sunk + broad.strength * (far[at] ?? 0)),
  )
}

export function curvatureOf(
  surface: Float32Array,
  width: number,
  height: number,
  relief: Pick<ArmsRelief, 'curvature'>,
  pixelsPerUnit: number,
): Float32Array {
  const radius = Math.max(1, Math.round(relief.curvature.reach * pixelsPerUnit))
  const smooth = blurred(surface, width, height, radius)
  const at = (x: number, y: number): number =>
    smooth[Math.min(Math.max(y, 0), height - 1) * width + Math.min(Math.max(x, 0), width - 1)] ?? 0
  const convexity = new Float32Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const laplacian =
        (at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1) - 4 * at(x, y)) *
        pixelsPerUnit *
        pixelsPerUnit
      convexity[y * width + x] = Math.tanh(-relief.curvature.gain * laplacian)
    }
  }
  return convexity
}

export function normalsOf(
  surface: Float32Array,
  width: number,
  height: number,
  pixelsPerUnit: number,
): Float32Array {
  const normals = new Float32Array(width * height * 3)
  const at = (x: number, y: number): number =>
    surface[Math.min(Math.max(y, 0), height - 1) * width + Math.min(Math.max(x, 0), width - 1)] ?? 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const across = ((at(x + 1, y) - at(x - 1, y)) / 2) * pixelsPerUnit
      const down = ((at(x, y + 1) - at(x, y - 1)) / 2) * pixelsPerUnit
      const length = Math.sqrt(across * across + down * down + 1)
      const out = (y * width + x) * 3
      normals[out] = -across / length
      normals[out + 1] = down / length
      normals[out + 2] = 1 / length
    }
  }
  return normals
}

export function shadowOf(
  surface: Float32Array,
  width: number,
  height: number,
  light: KeyLight,
  relief: Pick<ArmsRelief, 'shadow'>,
  pixelsPerUnit: number,
): Float32Array {
  const [across, up, toward] = light
  const planar = Math.hypot(across, up)
  const lit = new Float32Array(surface.length).fill(1)
  if (planar === 0) return lit
  const step = { x: across / planar, y: -up / planar }
  const rise = toward / planar
  const steps = Math.ceil(relief.shadow.reach * pixelsPerUnit)
  const heightAt = (x: number, y: number): number | undefined => {
    const column = Math.round(x)
    const row = Math.round(y)
    if (column < 0 || row < 0 || column >= width || row >= height) return undefined
    return surface[row * width + column]
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const at = y * width + x
      const start = surface[at] ?? 0
      let light = 1
      for (let t = 1; t <= steps; t++) {
        const ahead = heightAt(x + step.x * t, y + step.y * t)
        if (ahead === undefined) break
        const distance = t / pixelsPerUnit
        const clearance = start + rise * distance - ahead
        light = Math.min(light, smoothstep(-1, 1, clearance / (relief.shadow.softness * distance)))
      }
      lit[at] = light
    }
  }
  return lit
}
