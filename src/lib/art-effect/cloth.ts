import { gridIndex, gridTriangles } from './mesh'

export type Point = { x: number; y: number }

export type Vector = Point & { z: number }

export type Rest = { x: number; y: number; width: number; height: number }

export type Stiffness = { stretch: number; shear: number; bend: number }

export type ClothSpec = {
  stepsPerSecond: number
  aspect: number
  rest: Rest
  columns: number
  rows: number
  gather: number
  gravity: number
  damping: number
  air: number
  stiffness: Stiffness
  iterations: number
  depth: number
  margin: number
  eye: number
}

type Links = { a: Uint16Array; b: Uint16Array; rest: Float32Array; stiffness: Float32Array }

type Hold = { index: number; target: Point }

export type Cloth = {
  readonly spec: ClothSpec
  readonly count: number
  readonly position: Float32Array
  readonly previous: Float32Array
  readonly inverseMass: Float32Array
  readonly links: Links
  readonly anchor: Uint16Array
  readonly reach: Float32Array
  readonly push: Float32Array
  readonly triangles: Uint16Array
  seconds: number
  pending: number
  held: Hold | undefined
  restless: number
  calm: number
}

const LONGEST_FRAME = 0.1
export const MOST_STEPS = 8
const SETTLE_SECONDS = 0.4

const STILL_SPEED = 0.0024
const TETHER_SLACK = 0.02
const HOLD_STIFFNESS = 900
const HOLD_LIFT = 0.45
const FLING_SPEED = 2.4

function stepSeconds(spec: Pick<ClothSpec, 'stepsPerSecond'>): number {
  return 1 / spec.stepsPerSecond
}

function value(array: Float32Array | Uint16Array, index: number): number {
  return array[index] ?? 0
}

function magnitude(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z)
}

function cellSize(spec: ClothSpec): Point {
  return {
    x: spec.rest.width / (spec.columns - 1),
    y: spec.rest.height / (spec.rows - 1),
  }
}

function weaveLinks(spec: ClothSpec): Links {
  const cell = cellSize(spec)
  const diagonal = Math.hypot(cell.x, cell.y)
  const pairs: Array<[number, number, number, number]> = []
  const { columns, rows, stiffness } = spec
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const here = gridIndex(spec, column, row)
      if (column + 1 < columns) {
        pairs.push([here, gridIndex(spec, column + 1, row), cell.x, stiffness.stretch])
      }
      if (row + 1 < rows) {
        pairs.push([here, gridIndex(spec, column, row + 1), cell.y, stiffness.stretch])
      }
      if (column + 1 < columns && row + 1 < rows) {
        pairs.push([here, gridIndex(spec, column + 1, row + 1), diagonal, stiffness.shear])
        pairs.push([
          gridIndex(spec, column + 1, row),
          gridIndex(spec, column, row + 1),
          diagonal,
          stiffness.shear,
        ])
      }
      if (column + 2 < columns) {
        pairs.push([here, gridIndex(spec, column + 2, row), 2 * cell.x, stiffness.bend])
      }
      if (row + 2 < rows) {
        pairs.push([here, gridIndex(spec, column, row + 2), 2 * cell.y, stiffness.bend])
      }
    }
  }
  return {
    a: Uint16Array.from(pairs, ([a]) => a),
    b: Uint16Array.from(pairs, ([, b]) => b),
    rest: Float32Array.from(pairs, ([, , rest]) => rest),
    stiffness: Float32Array.from(pairs, ([, , , strength]) => strength),
  }
}

export function weave(spec: ClothSpec): Cloth {
  const count = spec.columns * spec.rows
  const cell = cellSize(spec)
  const position = new Float32Array(count * 3)
  const inverseMass = new Float32Array(count)
  const anchor = new Uint16Array(count)
  const reach = new Float32Array(count)
  const pleat = cell.x * Math.sqrt(1 - (1 - spec.gather) ** 2)
  const middle = spec.rest.x + (spec.columns - 1) * cell.x * 0.5
  for (let row = 0; row < spec.rows; row++) {
    for (let column = 0; column < spec.columns; column++) {
      const index = gridIndex(spec, column, row)
      const pinned = row === 0
      const squeeze = pinned ? 1 - spec.gather : 1
      const gathered = (column - (spec.columns - 1) / 2) * squeeze
      position[index * 3] = pinned ? middle + gathered * cell.x : spec.rest.x + column * cell.x
      position[index * 3 + 1] = spec.rest.y + row * cell.y
      position[index * 3 + 2] = pinned && column % 2 === 1 ? pleat : 0
      inverseMass[index] = pinned ? 0 : 1
      anchor[index] = gridIndex(spec, column, 0)
      reach[index] = row * cell.y
    }
  }
  return {
    spec,
    count,
    position,
    previous: position.slice(),
    inverseMass,
    links: weaveLinks(spec),
    anchor,
    reach,
    push: new Float32Array(count * 3),
    triangles: gridTriangles(spec),
    seconds: 0,
    pending: 0,
    held: undefined,
    restless: 0,
    calm: 0,
  }
}

function velocityOf(cloth: Cloth, index: number): Vector {
  const at = index * 3
  const per = cloth.spec.stepsPerSecond
  return {
    x: (value(cloth.position, at) - value(cloth.previous, at)) * per,
    y: (value(cloth.position, at + 1) - value(cloth.previous, at + 1)) * per,
    z: (value(cloth.position, at + 2) - value(cloth.previous, at + 2)) * per,
  }
}

function pointOf(array: Float32Array, index: number): Vector {
  const at = index * 3
  return { x: value(array, at), y: value(array, at + 1), z: value(array, at + 2) }
}

function addPush(cloth: Cloth, index: number, x: number, y: number, z: number): void {
  const at = index * 3
  cloth.push[at] = value(cloth.push, at) + x
  cloth.push[at + 1] = value(cloth.push, at + 1) + y
  cloth.push[at + 2] = value(cloth.push, at + 2) + z
}

function gatherAir(cloth: Cloth): void {
  const { spec, triangles: corners, position, previous, push } = cloth
  const restArea = (spec.rest.width * spec.rest.height) / (2 * (spec.columns - 1) * (spec.rows - 1))
  const perVelocity = spec.stepsPerSecond / 3
  const scale = spec.air / (6 * restArea)
  for (let corner = 0; corner + 2 < corners.length; corner += 3) {
    const a = value(corners, corner) * 3
    const b = value(corners, corner + 1) * 3
    const c = value(corners, corner + 2) * 3
    const ax = value(position, a)
    const ay = value(position, a + 1)
    const az = value(position, a + 2)
    const e1x = value(position, b) - ax
    const e1y = value(position, b + 1) - ay
    const e1z = value(position, b + 2) - az
    const e2x = value(position, c) - ax
    const e2y = value(position, c + 1) - ay
    const e2z = value(position, c + 2) - az
    const nx = e1y * e2z - e1z * e2y
    const ny = e1z * e2x - e1x * e2z
    const nz = e1x * e2y - e1y * e2x
    const twice = magnitude(nx, ny, nz)
    if (twice === 0) continue
    const vx =
      (ax +
        value(position, b) +
        value(position, c) -
        value(previous, a) -
        value(previous, b) -
        value(previous, c)) *
      perVelocity
    const vy =
      (ay +
        value(position, b + 1) +
        value(position, c + 1) -
        value(previous, a + 1) -
        value(previous, b + 1) -
        value(previous, c + 1)) *
      perVelocity
    const vz =
      (az +
        value(position, b + 2) +
        value(position, c + 2) -
        value(previous, a + 2) -
        value(previous, b + 2) -
        value(previous, c + 2)) *
      perVelocity
    const across = -(nx * vx + ny * vy + nz * vz) / twice
    const share = scale * across
    const fx = nx * share
    const fy = ny * share
    const fz = nz * share
    push[a] = value(push, a) + fx
    push[a + 1] = value(push, a + 1) + fy
    push[a + 2] = value(push, a + 2) + fz
    push[b] = value(push, b) + fx
    push[b + 1] = value(push, b + 1) + fy
    push[b + 2] = value(push, b + 2) + fz
    push[c] = value(push, c) + fx
    push[c + 1] = value(push, c + 1) + fy
    push[c + 2] = value(push, c + 2) + fz
  }
}

function integrate(cloth: Cloth): void {
  const { spec, position, previous, push, inverseMass } = cloth
  const h = stepSeconds(spec)
  const keep = Math.max(0, 1 - spec.damping * h)
  const step2 = h * h
  const fall = spec.gravity * step2
  for (let index = 0; index < cloth.count; index++) {
    if (value(inverseMass, index) === 0) continue
    const at = index * 3
    const x = value(position, at)
    const y = value(position, at + 1)
    const z = value(position, at + 2)
    position[at] = x + (x - value(previous, at)) * keep + value(push, at) * step2
    position[at + 1] = y + (y - value(previous, at + 1)) * keep + value(push, at + 1) * step2 + fall
    position[at + 2] = z + (z - value(previous, at + 2)) * keep + value(push, at + 2) * step2
    previous[at] = x
    previous[at + 1] = y
    previous[at + 2] = z
  }
  push.fill(0)
}

function screenCentre(spec: ClothSpec): Point {
  return { x: spec.aspect / 2, y: 0.5 }
}

export function project(spec: ClothSpec, point: Vector): Point {
  const centre = screenCentre(spec)
  const scale = spec.eye / (spec.eye - point.z)
  return { x: centre.x + (point.x - centre.x) * scale, y: centre.y + (point.y - centre.y) * scale }
}

function unproject(spec: ClothSpec, screen: Point, depth: number): Point {
  const centre = screenCentre(spec)
  const scale = (spec.eye - depth) / spec.eye
  return {
    x: centre.x + (screen.x - centre.x) * scale,
    y: centre.y + (screen.y - centre.y) * scale,
  }
}

function clampToBox(spec: ClothSpec, point: Vector): Vector {
  const z = Math.min(spec.depth, Math.max(-spec.depth, point.z))
  const low = unproject(spec, { x: spec.margin, y: spec.margin }, z)
  const high = unproject(spec, { x: spec.aspect - spec.margin, y: 1 - spec.margin }, z)
  return {
    x: Math.min(high.x, Math.max(low.x, point.x)),
    y: Math.min(high.y, Math.max(low.y, point.y)),
    z,
  }
}

function holdGoal(cloth: Cloth, hold: Hold): Vector {
  const { spec } = cloth
  const here = pointOf(cloth.position, hold.index)
  const lift = spec.depth * HOLD_LIFT
  const wanted = unproject(spec, hold.target, lift)
  const pin = pointOf(cloth.position, value(cloth.anchor, hold.index))
  const reach = value(cloth.reach, hold.index)
  const offset = { x: wanted.x - pin.x, y: wanted.y - pin.y, z: lift - pin.z }
  const distance = magnitude(offset.x, offset.y, offset.z)
  const fit = distance > reach && distance > 0 ? reach / distance : 1
  const goal = {
    x: pin.x + offset.x * fit,
    y: pin.y + offset.y * fit,
    z: pin.z + offset.z * fit,
  }
  return clampToBox(spec, Number.isFinite(goal.x) ? goal : here)
}

function pullHeld(cloth: Cloth, hold: Hold): void {
  const goal = holdGoal(cloth, hold)
  const here = pointOf(cloth.position, hold.index)
  const velocity = velocityOf(cloth, hold.index)
  const damping = 2 * Math.sqrt(HOLD_STIFFNESS)
  addPush(
    cloth,
    hold.index,
    HOLD_STIFFNESS * (goal.x - here.x) - damping * velocity.x,
    HOLD_STIFFNESS * (goal.y - here.y) - damping * velocity.y,
    HOLD_STIFFNESS * (goal.z - here.z) - damping * velocity.z,
  )
}

function solveLinks(cloth: Cloth): void {
  const { links, position, inverseMass } = cloth
  const { a: from, b: to, rest, stiffness } = links
  for (let link = 0; link < from.length; link++) {
    const ia = value(from, link)
    const ib = value(to, link)
    const wa = value(inverseMass, ia)
    const wb = value(inverseMass, ib)
    const total = wa + wb
    if (total === 0) continue
    const a = ia * 3
    const b = ib * 3
    const dx = value(position, b) - value(position, a)
    const dy = value(position, b + 1) - value(position, a + 1)
    const dz = value(position, b + 2) - value(position, a + 2)
    const length = magnitude(dx, dy, dz)
    if (length === 0) continue
    const correction = (value(stiffness, link) * (length - value(rest, link))) / (length * total)
    const ka = correction * wa
    const kb = correction * wb
    position[a] = value(position, a) + dx * ka
    position[a + 1] = value(position, a + 1) + dy * ka
    position[a + 2] = value(position, a + 2) + dz * ka
    position[b] = value(position, b) - dx * kb
    position[b + 1] = value(position, b + 1) - dy * kb
    position[b + 2] = value(position, b + 2) - dz * kb
  }
}

function solveTethers(cloth: Cloth): void {
  const { position, inverseMass, anchor, reach } = cloth
  const slack = 1 + TETHER_SLACK
  for (let index = 0; index < cloth.count; index++) {
    if (value(inverseMass, index) === 0) continue
    const at = index * 3
    const pin = value(anchor, index) * 3
    const px = value(position, pin)
    const py = value(position, pin + 1)
    const pz = value(position, pin + 2)
    const dx = value(position, at) - px
    const dy = value(position, at + 1) - py
    const dz = value(position, at + 2) - pz
    const distance = magnitude(dx, dy, dz)
    const longest = value(reach, index) * slack
    if (distance <= longest || distance === 0) continue
    const fit = longest / distance
    position[at] = px + dx * fit
    position[at + 1] = py + dy * fit
    position[at + 2] = pz + dz * fit
  }
}

function confine(cloth: Cloth): void {
  const { spec, position, inverseMass } = cloth
  const centreX = spec.aspect / 2
  const lowX = spec.margin - centreX
  const highX = spec.aspect - spec.margin - centreX
  const lowY = spec.margin - 0.5
  const highY = 0.5 - spec.margin
  for (let index = 0; index < cloth.count; index++) {
    if (value(inverseMass, index) === 0) continue
    const at = index * 3
    const z = Math.min(spec.depth, Math.max(-spec.depth, value(position, at + 2)))
    const shrink = (spec.eye - z) / spec.eye
    const x = value(position, at) - centreX
    const y = value(position, at + 1) - 0.5
    position[at] = centreX + Math.min(highX * shrink, Math.max(lowX * shrink, x))
    position[at + 1] = 0.5 + Math.min(highY * shrink, Math.max(lowY * shrink, y))
    position[at + 2] = z
  }
}

function measureRest(cloth: Cloth): number {
  const { position, previous } = cloth
  let most = 0
  for (let at = 0; at < cloth.count * 3; at += 3) {
    const moved = magnitude(
      value(position, at) - value(previous, at),
      value(position, at + 1) - value(previous, at + 1),
      value(position, at + 2) - value(previous, at + 2),
    )
    if (moved > most) most = moved
  }
  return most
}

function step(cloth: Cloth): void {
  gatherAir(cloth)
  const hold = cloth.held
  if (hold) pullHeld(cloth, hold)
  integrate(cloth)
  for (let pass = 0; pass < cloth.spec.iterations; pass++) {
    solveLinks(cloth)
    solveTethers(cloth)
  }
  confine(cloth)
  cloth.restless = measureRest(cloth)
  const h = stepSeconds(cloth.spec)
  const speed = cloth.restless * cloth.spec.stepsPerSecond
  cloth.calm = speed < STILL_SPEED && !hold ? cloth.calm + h : 0
  cloth.seconds += h
}

export function advance(cloth: Cloth, elapsed: number): number {
  const h = stepSeconds(cloth.spec)
  cloth.pending += Math.min(LONGEST_FRAME, Math.max(0, elapsed))
  const steps = Math.min(MOST_STEPS, Math.floor(cloth.pending / h))
  for (let taken = 0; taken < steps; taken++) step(cloth)
  cloth.pending = Math.min(cloth.pending - steps * h, h)
  return steps
}

export function settled(cloth: Cloth): boolean {
  return cloth.calm >= SETTLE_SECONDS
}

export function settle(cloth: Cloth, longest: number): void {
  const h = stepSeconds(cloth.spec)
  const until = cloth.seconds + longest
  while (!settled(cloth) && cloth.seconds < until - h / 2) step(cloth)
}

export function nudge(cloth: Cloth, push: (column: number, row: number) => Vector): void {
  const { spec } = cloth
  for (let row = 0; row < spec.rows; row++) {
    for (let column = 0; column < spec.columns; column++) {
      const index = gridIndex(spec, column, row)
      if (value(cloth.inverseMass, index) === 0) continue
      const velocity = push(column, row)
      const at = index * 3
      const h = stepSeconds(spec)
      cloth.previous[at] = value(cloth.position, at) - velocity.x * h
      cloth.previous[at + 1] = value(cloth.position, at + 1) - velocity.y * h
      cloth.previous[at + 2] = value(cloth.position, at + 2) - velocity.z * h
    }
  }
  cloth.calm = 0
}

export function grab(cloth: Cloth, at: Point, reach: number): number | undefined {
  let nearest: number | undefined
  let closest = reach
  for (let index = 0; index < cloth.count; index++) {
    if (value(cloth.inverseMass, index) === 0) continue
    const shown = project(cloth.spec, pointOf(cloth.position, index))
    const distance = Math.sqrt((shown.x - at.x) ** 2 + (shown.y - at.y) ** 2)
    if (distance <= closest) {
      closest = distance
      nearest = index
    }
  }
  if (nearest !== undefined) {
    cloth.held = { index: nearest, target: at }
    cloth.calm = 0
  }
  return nearest
}

export function pull(cloth: Cloth, at: Point): void {
  if (!cloth.held) return
  cloth.held = { index: cloth.held.index, target: at }
  cloth.calm = 0
}

export function letGo(cloth: Cloth): void {
  const hold = cloth.held
  if (!hold) return
  cloth.held = undefined
  const at = hold.index * 3
  const most = FLING_SPEED * stepSeconds(cloth.spec)
  const moved = {
    x: value(cloth.position, at) - value(cloth.previous, at),
    y: value(cloth.position, at + 1) - value(cloth.previous, at + 1),
    z: value(cloth.position, at + 2) - value(cloth.previous, at + 2),
  }
  const length = magnitude(moved.x, moved.y, moved.z)
  if (length <= most) return
  const fit = most / length
  cloth.previous[at] = value(cloth.position, at) - moved.x * fit
  cloth.previous[at + 1] = value(cloth.position, at + 1) - moved.y * fit
  cloth.previous[at + 2] = value(cloth.position, at + 2) - moved.z * fit
}
