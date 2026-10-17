import { type Mesh, type Ray, Raycaster } from 'three'
import { type Grid, tileAt } from '../world/grid.ts'
import type { UndergroundRecord, World } from '../world/model.ts'
import { floorY, heightIn, type ReliefField } from '../world/relief.ts'

const TOP = 3.6
const FLOOR = -1.8
const MAX_STEPS = 2500
const REFINE = 7
const NOT_ON_MAP = -99
const SKY_TOP = 0.04
const SKY_DEPTH = 0.85
const SKY_SAMPLES = 700

export class MapPicker {
  private readonly world: World
  private readonly grid: Grid
  private readonly field: ReliefField
  private readonly skyCeiling: number
  private readonly skyFloor: number
  private readonly raycaster = new Raycaster()

  constructor(world: World, field: ReliefField) {
    this.world = world
    this.grid = field.grid
    this.field = field
    let highest = Number.NEGATIVE_INFINITY
    let lowest = Number.POSITIVE_INFINITY
    for (const y of world.sky.y) {
      highest = Math.max(highest, y)
      lowest = Math.min(lowest, y)
    }
    this.skyCeiling = highest + 0.12
    this.skyFloor = lowest - 0.75
  }

  groundHeight(x: number, z: number, level: number): number {
    const tile = tileAt(this.grid, x, z)
    if (tile < 0) return NOT_ON_MAP
    const under = this.underground(level)
    if (under) return floorY(this.grid, under.floor, x, z)
    const { surface } = this.world
    const h = heightIn(this.field, tile, x, z, false)
    if (surface.water[tile] !== 1) return h
    const lake = surface.lake[tile] ?? -1
    return Math.max(h, lake >= 0 ? (this.world.lakes[lake]?.y ?? 0) : 0)
  }

  tile(ray: Ray, level: number, distance: number): number {
    const { origin: o, direction: d } = ray
    if (d.y > -1e-4) return -1
    let t = Math.max(0, (TOP - o.y) / d.y)
    const end = (FLOOR - o.y) / d.y
    const step = Math.max(0.02, Math.min(0.5, distance * 0.0018))
    let previous = t
    for (let n = 1; t < end && n <= MAX_STEPS; n++) {
      const x = o.x + d.x * t
      const y = o.y + d.y * t
      const z = o.z + d.z * t
      if (y <= this.groundHeight(x, z, level)) {
        let low = previous
        let high = t
        for (let k = 0; k < REFINE; k++) {
          const middle = (low + high) / 2
          if (
            o.y + d.y * middle <=
            this.groundHeight(o.x + d.x * middle, o.z + d.z * middle, level)
          )
            high = middle
          else low = middle
        }
        return tileAt(this.grid, o.x + d.x * high, o.z + d.z * high)
      }
      previous = t
      t += step * (1 + n * 0.004)
    }
    return -1
  }

  sky(ray: Ray, level: number): number {
    const { sky } = this.world
    if (sky.tile.length === 0 || level > 0) return -1
    const { origin: o, direction: d } = ray
    if (Math.abs(d.y) < 1e-5) return -1
    let t0 = (this.skyCeiling - o.y) / d.y
    let t1 = (this.skyFloor - o.y) / d.y
    if (t0 > t1) [t0, t1] = [t1, t0]
    t0 = Math.max(t0, 0)
    if (t1 < 0) return -1
    const step = Math.max(0.025, (t1 - t0) / SKY_SAMPLES)
    for (let t = t0; t <= t1; t += step) {
      const x = o.x + d.x * t
      const y = o.y + d.y * t
      const z = o.z + d.z * t
      const tile = tileAt(this.grid, x, z)
      if (tile < 0) continue
      const hex = sky.at[tile] ?? -1
      if (hex < 0) continue
      const top = (sky.y[hex] ?? 0) + SKY_TOP
      if (y <= top && y >= top - SKY_DEPTH) return hex
    }
    return -1
  }

  landmark(ray: Ray, meshes: Mesh[]): number {
    this.raycaster.ray.copy(ray)
    const [hit] = this.raycaster.intersectObjects(meshes, false)
    const landmark = hit?.object.userData['landmark']
    return typeof landmark === 'number' ? landmark : -1
  }

  private underground(level: number): UndergroundRecord | undefined {
    return level > 0 ? this.world.underground.find((record) => record.level === level) : undefined
  }
}
