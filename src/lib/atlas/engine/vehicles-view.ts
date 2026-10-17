import {
  BufferAttribute,
  BufferGeometry,
  Euler,
  type Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  Points,
  Quaternion,
  type ShaderMaterial,
  Vector3,
} from 'three'
import type { TierSettings } from '../contract/quality.ts'
import {
  AIRSHIP_PROTOTYPE,
  LOCOMOTIVE_PROTOTYPE,
  LOCOMOTIVE_STACK,
  type ParticleLook,
  type PrototypeData,
  SHIP_PROTOTYPE,
  type VehicleData,
  type VehiclePath,
  type Voyage,
  WAGON_PROTOTYPES,
} from '../contract/scene.ts'
import { downwind } from '../contract/wind.ts'
import { mulberry32 } from '../world/noise.ts'
import { geometryOf } from './geometry.ts'
import type { MaterialLibrary } from './materials/library.ts'

const WAGON_GAP = 0.15
const SHIP_SCALE = 1.25
const AIRSHIP_SCALE = 2.2
const TRAIN_SCALE = 1.2
const DECAL_STYLE = { shadow: 0, wake: 1 } as const
const DECAL_LIFT = 0.006
const QUARTER_TURN = Math.PI / 2
const UP = new Vector3(0, 1, 0)
const SHIP_SHADOW = { length: 0.42, width: 0.13, opacity: 0.32 }
const SHIP_WAKE = { length: 0.9, width: 0.42, opacity: 0.5, gap: 0.12 }
const CAR_SHADOW = { length: 0.2, width: 0.08, opacity: 0.4 }
const AIRSHIP_SHADOW = { length: 1.2, width: 0.42, opacity: 0.26, fadeHeight: 10, faintest: 0.25 }
const PLUME_PUFFS = 16
const PLUME_SEED = 61
const PLUME: ParticleLook = {
  life: 2.4,
  velocity: downwind(0.04, 0.12),
  spread: [0.006, 0.004, 0.006],
  gravity: 0,
  size: [0.025, 0.2],
  turbulence: 0.04,
  colour: [0.92, 0.92, 0.94],
  fade: [0.7, 0.71, 0.75],
  alpha: 0.55,
  style: 'smoke',
  nightOnly: false,
  additive: false,
}

type Sample = { position: Vector3; tangent: Vector3 }

type DecalSize = { length: number; width: number }

type Decals = { mesh: InstancedMesh; looks: InstancedBufferAttribute; material: ShaderMaterial }

type Plume = {
  points: Points<BufferGeometry, ShaderMaterial>
  origins: BufferAttribute
  seeds: Float32Array
  cycles: Float64Array
  trains: number
  total: number
}

function sample(path: VehiclePath, distance: number, out: Sample): Sample {
  const { points, lengths, total } = path
  const at = Math.max(0, Math.min(total, distance))
  let low = 0
  let high = lengths.length - 1
  while (high - low > 1) {
    const middle = (low + high) >> 1
    if ((lengths[middle] ?? 0) < at) low = middle
    else high = middle
  }
  const from = lengths[low] ?? 0
  const span = (lengths[high] ?? 0) - from || 1
  const f = (at - from) / span
  const ax = points[low * 3] ?? 0
  const ay = points[low * 3 + 1] ?? 0
  const az = points[low * 3 + 2] ?? 0
  const bx = points[high * 3] ?? 0
  const by = points[high * 3 + 1] ?? 0
  const bz = points[high * 3 + 2] ?? 0
  out.position.set(ax + (bx - ax) * f, ay + (by - ay) * f, az + (bz - az) * f)
  out.tangent.set(bx - ax, by - ay, bz - az).normalize()
  return out
}

function pingPong(distance: number, total: number): [number, number] {
  const loop = total * 2
  const u = ((distance % loop) + loop) % loop
  return u <= total ? [u, 1] : [loop - u, -1]
}

type Fleet = { mesh: InstancedMesh; voyages: Voyage[] }

export type FleetsShown = { ships: boolean; airships: boolean; trains: boolean; plume: boolean }

export class VehiclesView {
  private readonly library: MaterialLibrary
  private readonly meshes: InstancedMesh[] = []
  private paths: VehiclePath[] = []
  private ships: Fleet | undefined
  private airships: Fleet | undefined
  private trains: { cars: InstancedMesh[]; voyages: Voyage[] } | undefined
  private decals: Decals | undefined
  private plume: Plume | undefined
  private shown: FleetsShown = { ships: true, airships: true, trains: true, plume: true }
  private particleShare: number
  private readonly ground: (x: number, z: number) => number
  private readonly stackAt = new Vector3()
  private readonly decalAt = new Vector3()
  private readonly sampled: Sample = { position: new Vector3(), tangent: new Vector3() }
  private readonly matrix = new Matrix4()
  private readonly rotation = new Quaternion()
  private readonly euler = new Euler()
  private readonly scale = new Vector3()

  constructor(
    library: MaterialLibrary,
    settings: TierSettings,
    ground: (x: number, z: number) => number,
  ) {
    this.library = library
    this.particleShare = settings.particleShare
    this.ground = ground
  }

  add(group: Group, data: VehicleData): void {
    this.paths = data.paths
    const prototypes = new Map(data.prototypes.map((prototype) => [prototype.key, prototype]))
    const fleet = (key: string, count: number) => {
      const prototype = prototypes.get(key)
      return prototype && count > 0 ? this.instanced(group, prototype, count) : undefined
    }
    const shipMesh = fleet(SHIP_PROTOTYPE, data.ships.length)
    if (shipMesh) this.ships = { mesh: shipMesh, voyages: data.ships }
    const airshipMesh = fleet(AIRSHIP_PROTOTYPE, data.airships.length)
    if (airshipMesh) this.airships = { mesh: airshipMesh, voyages: data.airships }
    const cars = [LOCOMOTIVE_PROTOTYPE, ...WAGON_PROTOTYPES]
      .map((key) => fleet(key, data.trains.length))
      .filter((mesh): mesh is InstancedMesh => mesh !== undefined)
    if (cars.length > 0) {
      this.trains = { cars, voyages: data.trains }
      this.plume = this.plumeMesh(group, data.trains.length)
      this.thinPlume()
    }
    const decals = data.ships.length * 2 + data.airships.length + data.trains.length * cars.length
    if (decals > 0) this.decals = this.decalMesh(group, decals)
    this.setShown(this.shown)
    this.update(0)
  }

  update(time: number): void {
    const out = this.sampled
    let slot = 0
    if (this.ships && !this.shown.ships) slot = this.hideDecals(slot, this.ships.voyages.length * 2)
    else if (this.ships) {
      for (const [k, voyage] of this.ships.voyages.entries()) {
        const path = this.paths[voyage.path]
        if (!path) continue
        const [distance, direction] = pingPong(voyage.offset + time * voyage.speed, path.total)
        sample(path, distance, out)
        const yaw = Math.atan2(-out.tangent.z * direction, out.tangent.x * direction)
        const { x, z } = out.position
        const behind = SHIP_WAKE.length / 2 + SHIP_WAKE.gap
        this.decal(
          slot++,
          x,
          DECAL_LIFT,
          z,
          yaw,
          SHIP_SHADOW,
          DECAL_STYLE.shadow,
          SHIP_SHADOW.opacity,
        )
        this.decal(
          slot++,
          x - Math.cos(yaw) * behind,
          DECAL_LIFT,
          z + Math.sin(yaw) * behind,
          yaw,
          SHIP_WAKE,
          DECAL_STYLE.wake,
          SHIP_WAKE.opacity,
        )
        this.euler.set(Math.sin(time * 1.3 + k) * 0.04, yaw, Math.cos(time * 1.1 + k) * 0.05)
        out.position.y = 0.005 + Math.sin(time * 1.7 + k) * 0.006
        this.place(this.ships.mesh, k, SHIP_SCALE)
      }
      this.ships.mesh.instanceMatrix.needsUpdate = true
    }
    if (this.airships && !this.shown.airships) {
      slot = this.hideDecals(slot, this.airships.voyages.length)
    } else if (this.airships) {
      for (const [k, voyage] of this.airships.voyages.entries()) {
        const path = this.paths[voyage.path]
        if (!path) continue
        const [distance, direction] = pingPong(voyage.offset + time * voyage.speed, path.total)
        sample(path, distance, out)
        const yaw = Math.atan2(out.tangent.x * direction, out.tangent.z * direction)
        this.euler.set(0, yaw, Math.sin(time * 0.8 + k) * 0.05)
        out.position.y += Math.sin(time * 0.9 + k * 2) * 0.04 - 0.2
        this.place(this.airships.mesh, k, AIRSHIP_SCALE)
        const { x, y, z } = out.position
        const floor = this.ground(x, z)
        const height = Math.max(0, 1 - (y - floor) / AIRSHIP_SHADOW.fadeHeight)
        const opacity = AIRSHIP_SHADOW.opacity * Math.max(AIRSHIP_SHADOW.faintest, height)
        this.decal(
          slot++,
          x,
          floor + DECAL_LIFT,
          z,
          yaw - QUARTER_TURN,
          AIRSHIP_SHADOW,
          DECAL_STYLE.shadow,
          opacity,
        )
      }
      this.airships.mesh.instanceMatrix.needsUpdate = true
    }
    if (this.trains && !this.shown.trains) {
      this.hideDecals(slot, this.trains.voyages.length * this.trains.cars.length)
    } else if (this.trains) {
      for (const [k, voyage] of this.trains.voyages.entries()) {
        const path = this.paths[voyage.path]
        if (!path) continue
        const [head, direction] = pingPong(voyage.offset + time * voyage.speed, path.total)
        for (const [car, mesh] of this.trains.cars.entries()) {
          sample(path, head - direction * car * WAGON_GAP, out)
          const yaw = Math.atan2(out.tangent.x * direction, out.tangent.z * direction)
          this.euler.set(0, yaw, 0)
          this.place(mesh, k, TRAIN_SCALE)
          if (car === 0) this.puff(k, time, yaw)
          const { x, y, z } = out.position
          this.decal(
            slot++,
            x,
            y + DECAL_LIFT,
            z,
            yaw - QUARTER_TURN,
            CAR_SHADOW,
            DECAL_STYLE.shadow,
            CAR_SHADOW.opacity,
          )
        }
      }
      for (const mesh of this.trains.cars) mesh.instanceMatrix.needsUpdate = true
    }
    if (this.decals) {
      this.decals.mesh.instanceMatrix.needsUpdate = true
      this.decals.looks.needsUpdate = true
    }
  }

  apply(settings: TierSettings): void {
    this.particleShare = settings.particleShare
    this.thinPlume()
  }

  setShown(shown: FleetsShown): void {
    this.shown = shown
    if (this.ships) this.ships.mesh.visible = shown.ships
    if (this.airships) this.airships.mesh.visible = shown.airships
    for (const car of this.trains?.cars ?? []) car.visible = shown.trains
    if (this.plume) this.plume.points.visible = shown.plume && shown.trains
  }

  dispose(): void {
    for (const mesh of this.meshes) {
      mesh.removeFromParent()
      mesh.geometry.dispose()
      mesh.dispose()
    }
    this.meshes.length = 0
    this.decals?.material.dispose()
    this.decals = undefined
    if (this.plume) {
      this.plume.points.removeFromParent()
      this.plume.points.geometry.dispose()
      this.plume.points.material.dispose()
      this.plume = undefined
    }
  }

  private puff(train: number, time: number, yaw: number): void {
    const plume = this.plume
    if (!plume) return
    this.stackAt
      .set(LOCOMOTIVE_STACK.x, LOCOMOTIVE_STACK.y, LOCOMOTIVE_STACK.z)
      .multiplyScalar(TRAIN_SCALE)
      .applyAxisAngle(UP, yaw)
      .add(this.sampled.position)
    let emitted = false
    for (let p = 0; p < PLUME_PUFFS; p++) {
      const index = p * plume.trains + train
      const cycle = Math.floor(time / PLUME.life + (plume.seeds[index * 4] ?? 0))
      if (plume.cycles[index] === cycle) continue
      plume.cycles[index] = cycle
      plume.origins.setXYZ(index, this.stackAt.x, this.stackAt.y, this.stackAt.z)
      emitted = true
    }
    if (emitted) plume.origins.needsUpdate = true
  }

  private plumeMesh(group: Group, trains: number): Plume {
    const total = trains * PLUME_PUFFS
    const random = mulberry32(PLUME_SEED)
    const seeds = new Float32Array(total * 4)
    for (let index = 0; index < total; index++) {
      seeds[index * 4] = Math.floor(index / trains) / PLUME_PUFFS
      seeds[index * 4 + 1] = random()
      seeds[index * 4 + 2] = random()
      seeds[index * 4 + 3] = random()
    }
    const origins = new BufferAttribute(new Float32Array(total * 3), 3)
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', origins)
    geometry.setAttribute('aOrigin', origins)
    geometry.setAttribute('aSeed', new BufferAttribute(seeds, 4))
    const points = new Points(geometry, this.library.particles(PLUME))
    points.frustumCulled = false
    points.renderOrder = 9
    points.visible = this.shown.plume && this.shown.trains
    points.name = 'locomotive-plume'
    group.add(points)
    return {
      points,
      origins,
      seeds,
      cycles: new Float64Array(total).fill(Number.NaN),
      trains,
      total,
    }
  }

  private thinPlume(): void {
    const plume = this.plume
    if (!plume) return
    plume.points.geometry.setDrawRange(0, Math.max(1, Math.round(plume.total * this.particleShare)))
  }

  private hideDecals(first: number, count: number): number {
    const decals = this.decals
    if (decals) for (let slot = first; slot < first + count; slot++) decals.looks.setY(slot, 0)
    return first + count
  }

  private decal(
    slot: number,
    x: number,
    y: number,
    z: number,
    yaw: number,
    size: DecalSize,
    style: number,
    opacity: number,
  ): void {
    const decals = this.decals
    if (!decals) return
    this.rotation.setFromAxisAngle(UP, yaw)
    this.scale.set(size.length, 1, size.width)
    this.matrix.compose(this.decalAt.set(x, y, z), this.rotation, this.scale)
    decals.mesh.setMatrixAt(slot, this.matrix)
    decals.looks.setXY(slot, style, opacity)
  }

  private decalMesh(group: Group, count: number): Decals {
    const geometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
    const looks = new InstancedBufferAttribute(new Float32Array(count * 2), 2)
    geometry.setAttribute('aDecal', looks)
    const material = this.library.vehicleDecals()
    const mesh = new InstancedMesh(geometry, material, count)
    mesh.frustumCulled = false
    mesh.renderOrder = 4
    mesh.name = 'vehicle-decals'
    group.add(mesh)
    this.meshes.push(mesh)
    return { mesh, looks, material }
  }

  private place(mesh: InstancedMesh, index: number, scale: number): void {
    this.rotation.setFromEuler(this.euler)
    this.scale.set(scale, scale, scale)
    this.matrix.compose(this.sampled.position, this.rotation, this.scale)
    mesh.setMatrixAt(index, this.matrix)
  }

  private instanced(
    group: Group,
    prototype: PrototypeData,
    count: number,
  ): InstancedMesh | undefined {
    const [nearest] = prototype.lods
    if (!nearest) return undefined
    const geometry = geometryOf(nearest, 'prop')
    geometry.setAttribute(
      'aTint',
      new InstancedBufferAttribute(new Uint8Array(count * 4).fill(255), 4, true),
    )
    const mesh = new InstancedMesh(
      geometry,
      this.library.prop(prototype.family, prototype.doubleSided),
      count,
    )
    mesh.frustumCulled = false
    mesh.castShadow = false
    mesh.receiveShadow = true
    mesh.name = prototype.key
    group.add(mesh)
    this.meshes.push(mesh)
    return mesh
  }
}
