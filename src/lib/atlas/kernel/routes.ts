import type { Piece, PieceMaterial, VehicleData, VehiclePath, Voyage } from '../contract/scene.ts'
import type { Grid } from '../world/grid.ts'
import type { LaneEnd, RouteRecord, SkyLane, World } from '../world/model.ts'
import { mulberry32 } from '../world/noise.ts'
import { type ReliefField, surfaceY } from '../world/relief.ts'
import { InstanceBatch } from './instances.ts'
import type { Vec3 } from './matrix.ts'
import { MeshWriter, RIBBON_LAYOUT } from './mesh.ts'

export type RoutePoint = [number, number]

export type RouteBuild = {
  pieces: Piece[]
  batch: InstanceBatch
  vehicles: Omit<VehicleData, 'prototypes'>
}

const ROUTE_MATERIALS = [
  'road',
  'trail',
  'ballast',
  'rail',
  'sea-lane',
  'sky-lane',
  'river',
] as const satisfies readonly PieceMaterial[]
type RouteMaterial = (typeof ROUTE_MATERIALS)[number]

type Width = number | ((along: number) => number)
type Height = (x: number, z: number) => number
type Curve = (t: number) => Vec3
type Axis = 0 | 1 | 2
type Span = { p0: Vec3; p1: Vec3; p2: Vec3; p3: Vec3; dt0: number; dt1: number; dt2: number }
type Ring = { centre: Vec3; tangent: Vec3 }
type Frame = { centre: Vec3; normal: Vec3; binormal: Vec3 }

const ROUTE_SEED = 12
const SMOOTHING_PASSES = 2
const LAND_STEP = 0.05
const SEA_STEP = 0.12
const SIDES = [-1, 1] as const

const ROAD = { width: 0.11, lift: 0.014 }
const TRAIL = { width: 0.065, lift: 0.012 }
const MARKER = {
  first: 20,
  every: 34,
  tail: 5,
  dx: 0.05,
  dz: 0.04,
  turn: 6,
  scale: 1.2,
  cairnAbove: 1.2,
}
const RAIL = {
  ballastWidth: 0.12,
  deckLift: 0.018,
  deckFloor: 0.16,
  width: 0.008,
  lift: 0.016,
  offset: 0.03,
  sleeperLift: 0.008,
  trainLift: 0.012,
  trainSpeed: 0.9,
}
const PYLON = { every: 24, phase: 12, reach: 0.09, scale: 1.1 }
const PIER = { every: 5, clearance: 0.06, reach: 0.045, sink: 0.05, overhang: 0.1 }
const SEA_LANE = { width: 0.05, y: 0.03, shipSpacing: 22, shipSpeed: 0.25, shipSpeedSpread: 0.15 }
const RIVER = { fall: 0.08, source: 0.055, widening: 0.13, lift: 0.01 }
const SKY_LANE = {
  landmarkLift: 0.4,
  groundLift: 0.8,
  apex: 1.4,
  apexPerUnit: 0.05,
  divisions: 80,
  airshipSpacing: 7.3,
  airshipSpeed: 0.55,
}
const TUBE = { segments: 160, sides: 5, radius: 0.018 }

const ARC_DIVISIONS = 200
const TANGENT_DELTA = 0.0001
const CENTRIPETAL = 0.25
const MIN_SPACING = 1e-4
const ORIGIN: Vec3 = [0, 0, 0]

function smoothed(points: RoutePoint[], passes: number): RoutePoint[] {
  let current = points
  for (let pass = 0; pass < passes && current.length >= 3; pass++) {
    const next: RoutePoint[] = []
    let previous: RoutePoint | undefined
    for (const point of current) {
      if (previous) {
        next.push(
          [previous[0] * 0.75 + point[0] * 0.25, previous[1] * 0.75 + point[1] * 0.25],
          [previous[0] * 0.25 + point[0] * 0.75, previous[1] * 0.25 + point[1] * 0.75],
        )
      } else next.push(point)
      previous = point
    }
    if (previous) next.push(previous)
    current = next
  }
  return current
}

function resampled(points: readonly RoutePoint[], step: number): RoutePoint[] {
  const out: RoutePoint[] = []
  let previous: RoutePoint | undefined
  let carried = 0
  for (const point of points) {
    if (!previous) {
      out.push(point)
      previous = point
      continue
    }
    const from = previous
    const length = Math.hypot(point[0] - from[0], point[1] - from[1])
    let reach = step - carried
    while (reach <= length) {
      const f = reach / length
      out.push([from[0] + (point[0] - from[0]) * f, from[1] + (point[1] - from[1]) * f])
      reach += step
    }
    carried = length - (reach - step)
    previous = point
  }
  if (previous) out.push(previous)
  return out
}

export function routeLine(grid: Grid, tiles: ArrayLike<number>, step: number): RoutePoint[] {
  const centres = Array.from(tiles, (tile): RoutePoint => [grid.x[tile] ?? 0, grid.z[tile] ?? 0])
  return resampled(smoothed(centres, SMOOTHING_PASSES), step)
}

function courseAt(line: readonly RoutePoint[], k: number): RoutePoint {
  const ahead = line[Math.min(line.length - 1, k + 1)]
  const behind = line[Math.max(0, k - 1)]
  return ahead && behind ? [ahead[0] - behind[0], ahead[1] - behind[1]] : [0, 0]
}

function directionAt(line: readonly RoutePoint[], k: number): RoutePoint {
  const [dx, dz] = courseAt(line, k)
  const length = Math.hypot(dx, dz) || 1
  return [dx / length, dz / length]
}

function writeRibbon(
  writer: MeshWriter,
  line: readonly RoutePoint[],
  width: Width,
  height: Height,
): void {
  const base = writer.vertexCount
  const last = line.length - 1
  let travelled = 0
  let previous: RoutePoint | undefined
  for (const [k, point] of line.entries()) {
    const [tx, tz] = directionAt(line, k)
    if (previous) travelled += Math.hypot(point[0] - previous[0], point[1] - previous[1])
    const w = typeof width === 'function' ? width(k / last) : width
    for (const side of SIDES) {
      const x = point[0] - tz * w * 0.5 * side
      const z = point[1] + tx * w * 0.5 * side
      writer.vertex(x, height(x, z), z, 0, 1, 0)
      writer.float(travelled)
      writer.float(side < 0 ? 0 : 1)
    }
    previous = point
  }
  for (let k = 0; k < last; k++) {
    const a = base + k * 2
    writer.triangle(a, a + 1, a + 2)
    writer.triangle(a + 1, a + 3, a + 2)
  }
}

function vehiclePath(points: readonly Vec3[]): VehiclePath {
  const flat = new Float32Array(points.length * 3)
  const lengths = new Float32Array(points.length)
  let travelled = 0
  let previous: Vec3 | undefined
  for (const [k, point] of points.entries()) {
    if (previous) {
      travelled += Math.hypot(
        point[0] - previous[0],
        point[1] - previous[1],
        point[2] - previous[2],
      )
    }
    flat.set(point, k * 3)
    lengths[k] = travelled
    previous = point
  }
  return { points: flat, lengths, total: lengths.at(-1) ?? 0 }
}

const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const reflected = (a: Vec3, b: Vec3): Vec3 => [
  a[0] - b[0] + a[0],
  a[1] - b[1] + a[1],
  a[2] - b[2] + a[2],
]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const lengthOf = (v: Vec3) => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

function normalised(v: Vec3): Vec3 {
  const scale = 1 / (lengthOf(v) || 1)
  return [v[0] * scale, v[1] * scale, v[2] * scale]
}

function distanceSquared(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  const dz = a[2] - b[2]
  return dx * dx + dy * dy + dz * dz
}

const distance = (a: Vec3, b: Vec3) => Math.sqrt(distanceSquared(a, b))

function rotated(v: Vec3, axis: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const t = 1 - c
  const [x, y, z] = axis
  const tx = t * x
  const ty = t * y
  const [vx, vy, vz] = v
  return [
    (tx * x + c) * vx + (tx * y - s * z) * vy + (tx * z + s * y) * vz,
    (tx * y + s * z) * vx + (ty * y + c) * vy + (ty * z - s * x) * vz,
    (tx * z - s * y) * vx + (ty * z + s * x) * vy + (t * z * z + c) * vz,
  ]
}

function bezierPoint(start: Vec3, control: Vec3, end: Vec3, t: number): Vec3 {
  const k = 1 - t
  const blend = (axis: Axis) =>
    k * k * start[axis] + 2 * (1 - t) * t * control[axis] + t * t * end[axis]
  return [blend(0), blend(1), blend(2)]
}

function arcLengths(curve: Curve): number[] {
  const lengths = [0]
  let last = curve(0)
  let sum = 0
  for (let p = 1; p <= ARC_DIVISIONS; p++) {
    const current = curve(p / ARC_DIVISIONS)
    sum += distance(current, last)
    lengths.push(sum)
    last = current
  }
  return lengths
}

function parameterAt(lengths: readonly number[], u: number): number {
  const count = lengths.length
  const target = u * (lengths[count - 1] ?? 0)
  let low = 0
  let high = count - 1
  while (low <= high) {
    const i = Math.floor(low + (high - low) / 2)
    const comparison = (lengths[i] ?? 0) - target
    if (comparison < 0) low = i + 1
    else if (comparison > 0) high = i - 1
    else {
      high = i
      break
    }
  }
  const before = lengths[high] ?? 0
  if (before === target) return high / (count - 1)
  const after = lengths[high + 1] ?? before
  return (high + (target - before) / (after - before)) / (count - 1)
}

function spanAxis(span: Span, axis: Axis, weight: number): number {
  const { dt0, dt1, dt2 } = span
  const x0 = span.p0[axis]
  const x1 = span.p1[axis]
  const x2 = span.p2[axis]
  const x3 = span.p3[axis]
  const t1 = ((x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1) * dt1
  const t2 = ((x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2) * dt1
  const c2 = -3 * x1 + 3 * x2 - 2 * t1 - t2
  const c3 = 2 * x1 - 2 * x2 + t1 + t2
  const w2 = weight * weight
  const w3 = w2 * weight
  return x1 + t1 * weight + c2 * w2 + c3 * w3
}

function catmullRomPoint(points: readonly Vec3[], t: number): Vec3 {
  const last = points.length - 1
  const scaled = last * t
  let index = Math.floor(scaled)
  let weight = scaled - index
  if (weight === 0 && index === last) {
    index = last - 1
    weight = 1
  }
  const p1 = points[index] ?? ORIGIN
  const p2 = points[index + 1] ?? p1
  const p0 = index > 0 ? (points[index - 1] ?? p1) : reflected(p1, p2)
  const p3 = index + 2 <= last ? (points[index + 2] ?? p2) : reflected(p2, p1)
  let dt0 = distanceSquared(p0, p1) ** CENTRIPETAL
  let dt1 = distanceSquared(p1, p2) ** CENTRIPETAL
  let dt2 = distanceSquared(p2, p3) ** CENTRIPETAL
  if (dt1 < MIN_SPACING) dt1 = 1
  if (dt0 < MIN_SPACING) dt0 = dt1
  if (dt2 < MIN_SPACING) dt2 = dt1
  const span: Span = { p0, p1, p2, p3, dt0, dt1, dt2 }
  return [spanAxis(span, 0, weight), spanAxis(span, 1, weight), spanAxis(span, 2, weight)]
}

function tangentAt(points: readonly Vec3[], t: number): Vec3 {
  const before = catmullRomPoint(points, Math.max(0, t - TANGENT_DELTA))
  const after = catmullRomPoint(points, Math.min(1, t + TANGENT_DELTA))
  return normalised(subtract(after, before))
}

function firstNormal(tangent: Vec3): Vec3 {
  const tx = Math.abs(tangent[0])
  const ty = Math.abs(tangent[1])
  const tz = Math.abs(tangent[2])
  const least: Vec3 = tz <= Math.min(tx, ty) ? [0, 0, 1] : ty <= tx ? [0, 1, 0] : [1, 0, 0]
  return cross(tangent, normalised(cross(tangent, least)))
}

function transported(normal: Vec3, from: Vec3, to: Vec3): Vec3 {
  const axis = cross(from, to)
  if (lengthOf(axis) <= Number.EPSILON) return normal
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(from, to))))
  return rotated(normal, normalised(axis), angle)
}

function frenetFrames(rings: readonly Ring[]): Frame[] {
  const frames: Frame[] = []
  let previous: { tangent: Vec3; normal: Vec3 } | undefined
  for (const { centre, tangent } of rings) {
    const normal = previous
      ? transported(previous.normal, previous.tangent, tangent)
      : firstNormal(tangent)
    frames.push({ centre, normal, binormal: cross(tangent, normal) })
    previous = { tangent, normal }
  }
  return frames
}

function writeTube(writer: MeshWriter, points: readonly Vec3[], length: number): void {
  const curve: Curve = (t) => catmullRomPoint(points, t)
  const lengths = arcLengths(curve)
  const rings = Array.from({ length: TUBE.segments + 1 }, (_, i): Ring => {
    const t = parameterAt(lengths, i / TUBE.segments)
    return { centre: curve(t), tangent: tangentAt(points, t) }
  })
  const base = writer.vertexCount
  for (const [i, { centre, normal, binormal }] of frenetFrames(rings).entries()) {
    const along = Math.fround(i / TUBE.segments) * length
    for (let j = 0; j <= TUBE.sides; j++) {
      const angle = (j / TUBE.sides) * Math.PI * 2
      const sin = Math.sin(angle)
      const cos = -Math.cos(angle)
      const [nx, ny, nz] = normalised([
        cos * normal[0] + sin * binormal[0],
        cos * normal[1] + sin * binormal[1],
        cos * normal[2] + sin * binormal[2],
      ])
      writer.vertex(
        centre[0] + TUBE.radius * nx,
        centre[1] + TUBE.radius * ny,
        centre[2] + TUBE.radius * nz,
        nx,
        ny,
        nz,
      )
      writer.float(along)
      writer.float(j / TUBE.sides)
    }
  }
  const row = TUBE.sides + 1
  for (let j = 1; j <= TUBE.segments; j++) {
    for (let i = 1; i <= TUBE.sides; i++) {
      const a = base + row * (j - 1) + (i - 1)
      const b = base + row * j + (i - 1)
      const c = base + row * j + i
      const d = base + row * (j - 1) + i
      writer.triangle(a, b, d)
      writer.triangle(b, c, d)
    }
  }
}

function laneEnd(world: World, grid: Grid, end: LaneEnd): Vec3 | undefined {
  if ('landmark' in end) {
    const landmark = world.landmarks[end.landmark]
    return landmark && [landmark.x, landmark.y + SKY_LANE.landmarkLift, landmark.z]
  }
  const place = world.places[end.place]
  if (!place || place.anchor < 0) return undefined
  if (place.aloft) {
    const altitude = world.sky.y[place.skyTiles[0] ?? -1] ?? 0
    return [place.centreX, altitude + SKY_LANE.landmarkLift, place.centreZ]
  }
  const ground = world.surface.y[place.anchor] ?? 0
  return [grid.x[place.anchor] ?? 0, ground + SKY_LANE.groundLift, grid.z[place.anchor] ?? 0]
}

class RouteNetwork {
  private readonly world: World
  private readonly field: ReliefField
  private readonly random = mulberry32(ROUTE_SEED)
  private readonly batch = new InstanceBatch()
  private readonly writers: Record<RouteMaterial, MeshWriter> = {
    road: new MeshWriter(RIBBON_LAYOUT),
    trail: new MeshWriter(RIBBON_LAYOUT),
    ballast: new MeshWriter(RIBBON_LAYOUT),
    rail: new MeshWriter(RIBBON_LAYOUT),
    'sea-lane': new MeshWriter(RIBBON_LAYOUT),
    'sky-lane': new MeshWriter(RIBBON_LAYOUT),
    river: new MeshWriter(RIBBON_LAYOUT),
  }
  private readonly paths: VehiclePath[] = []
  private readonly ships: Voyage[] = []
  private readonly airships: Voyage[] = []
  private readonly trains: Voyage[] = []

  constructor(world: World, field: ReliefField) {
    this.world = world
    this.field = field
  }

  addRoute(route: RouteRecord): void {
    const step = route.kind === 'sea' ? SEA_STEP : LAND_STEP
    const line = routeLine(this.field.grid, route.tiles, step)
    switch (route.kind) {
      case 'road':
        this.road(line)
        break
      case 'trail':
        this.trail(line)
        break
      case 'rail':
        this.rail(line)
        break
      case 'sea':
        this.sea(line)
        break
      case 'river':
        this.river(line)
        break
    }
  }

  addSkyLane(lane: SkyLane): void {
    const start = laneEnd(this.world, this.field.grid, lane.from)
    const end = laneEnd(this.world, this.field.grid, lane.to)
    if (!start || !end) return
    const control: Vec3 = [
      start[0] + (end[0] - start[0]) * 0.5,
      Math.max(start[1], end[1]) + SKY_LANE.apex + distance(start, end) * SKY_LANE.apexPerUnit,
      start[2] + (end[2] - start[2]) * 0.5,
    ]
    const bezier: Curve = (t) => bezierPoint(start, control, end, t)
    const points = Array.from({ length: SKY_LANE.divisions + 1 }, (_, d) =>
      bezier(d / SKY_LANE.divisions),
    )
    writeTube(this.writers['sky-lane'], points, arcLengths(bezier).at(-1) ?? 0)
    this.airships.push({
      path: this.addPath(vehiclePath(points)),
      offset: this.airships.length * SKY_LANE.airshipSpacing,
      speed: SKY_LANE.airshipSpeed,
    })
  }

  build(): RouteBuild {
    const pieces: Piece[] = []
    for (const material of ROUTE_MATERIALS) {
      const writer = this.writers[material]
      if (writer.indexCount > 0) pieces.push({ material, mesh: writer.build(), casts: false })
    }
    const { paths, ships, airships, trains } = this
    return { pieces, batch: this.batch, vehicles: { paths, ships, airships, trains } }
  }

  private ground(x: number, z: number): number {
    return surfaceY(this.field, x, z)
  }

  private addPath(path: VehiclePath): number {
    return this.paths.push(path) - 1
  }

  private road(line: readonly RoutePoint[]): void {
    writeRibbon(this.writers.road, line, ROAD.width, (x, z) => this.ground(x, z) + ROAD.lift)
  }

  private trail(line: readonly RoutePoint[]): void {
    writeRibbon(this.writers.trail, line, TRAIL.width, (x, z) => this.ground(x, z) + TRAIL.lift)
    for (let k = MARKER.first; k < line.length - MARKER.tail; k += MARKER.every) {
      const point = line[k]
      if (!point) continue
      const floor = this.ground(point[0], point[1])
      this.batch.add(floor > MARKER.cairnAbove ? 'cairn' : 'signpost', 'routes', {
        x: point[0] + MARKER.dx,
        y: floor,
        z: point[1] + MARKER.dz,
        ry: this.random() * MARKER.turn,
        sx: MARKER.scale,
      })
    }
  }

  private rail(line: readonly RoutePoint[]): void {
    const deck = (x: number, z: number) =>
      Math.max(this.ground(x, z) + RAIL.deckLift, RAIL.deckFloor)
    writeRibbon(this.writers.ballast, line, RAIL.ballastWidth, deck)
    for (const side of SIDES) {
      const track = line.map((point, k): RoutePoint => {
        const [tx, tz] = directionAt(line, k)
        return [point[0] - tz * RAIL.offset * side, point[1] + tx * RAIL.offset * side]
      })
      writeRibbon(this.writers.rail, track, RAIL.width, (x, z) => deck(x, z) + RAIL.lift)
    }
    const deckPath: Vec3[] = []
    for (const [k, point] of line.entries()) {
      const [dx, dz] = courseAt(line, k)
      const angle = Math.atan2(dz, dx)
      const y = deck(point[0], point[1])
      deckPath.push([point[0], y + RAIL.trainLift, point[1]])
      this.batch.add('sleeper', 'routes', {
        x: point[0],
        y: y + RAIL.sleeperLift,
        z: point[1],
        ry: -angle + Math.PI / 2,
      })
      if (k % PYLON.every === PYLON.phase) {
        this.batch.add('pylon', 'routes', {
          x: point[0] - Math.sin(angle) * PYLON.reach,
          y,
          z: point[1] + Math.cos(angle) * PYLON.reach,
          ry: -angle,
          sx: PYLON.scale,
        })
      }
      const floor = this.ground(point[0], point[1])
      if (y - floor > PIER.clearance && k % PIER.every === 0) {
        for (const side of SIDES) {
          const height = y - floor + PIER.overhang
          this.batch.add('trestle', 'routes', {
            x: point[0] - Math.sin(angle) * PIER.reach * side,
            y: floor - PIER.sink + height / 2,
            z: point[1] + Math.cos(angle) * PIER.reach * side,
            ry: -angle,
            sx: 1,
            sy: height,
            sz: 1,
          })
        }
      }
    }
    this.trains.push({
      path: this.addPath(vehiclePath(deckPath)),
      offset: 0,
      speed: RAIL.trainSpeed,
    })
  }

  private sea(line: readonly RoutePoint[]): void {
    writeRibbon(this.writers['sea-lane'], line, SEA_LANE.width, () => SEA_LANE.y)
    const path = vehiclePath(line.map(([x, z]): Vec3 => [x, 0, z]))
    const index = this.addPath(path)
    const count = Math.max(1, Math.round(path.total / SEA_LANE.shipSpacing))
    for (let k = 0; k < count; k++) {
      const offset = this.random() * path.total * 2
      const speed = SEA_LANE.shipSpeed + this.random() * SEA_LANE.shipSpeedSpread
      this.ships.push({ path: index, offset, speed })
    }
  }

  private river(line: readonly RoutePoint[]): void {
    const reaches: RoutePoint[][] = []
    let reach: RoutePoint[] = []
    let previousY: number | undefined
    for (const point of line) {
      const y = this.ground(point[0], point[1])
      if (previousY !== undefined && Math.abs(y - previousY) > RIVER.fall) {
        if (reach.length > 2) reaches.push(reach)
        reach = []
      }
      reach.push(point)
      previousY = y
    }
    if (reach.length > 2) reaches.push(reach)
    let done = 0
    for (const part of reaches) {
      const start = done / line.length
      const width = (along: number) =>
        RIVER.source + Math.min(1, start + (along * part.length) / line.length) * RIVER.widening
      writeRibbon(this.writers.river, part, width, (x, z) => this.ground(x, z) + RIVER.lift)
      done += part.length
    }
  }
}

export function buildRoutes(world: World, field: ReliefField): RouteBuild {
  const network = new RouteNetwork(world, field)
  for (const route of world.routes) network.addRoute(route)
  for (const lane of world.skyLanes) network.addSkyLane(lane)
  return network.build()
}
