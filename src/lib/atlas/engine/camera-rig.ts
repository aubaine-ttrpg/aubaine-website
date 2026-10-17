import type { PerspectiveCamera } from 'three'
import type { View } from '../contract/camera.ts'

type Mode = { fov: number; min: number; max: number }

export const VIEW_MODES: Record<View, Mode> = {
  top: { fov: 26, min: 7, max: 420 },
  iso: { fov: 32, min: 4, max: 330 },
  relief: { fov: 34, min: 4, max: 330 },
  free: { fov: 46, min: 1.6, max: 440 },
}

const TOP_PITCH = Math.PI / 2 - 0.0012
const FREE_PITCH = { low: 0.1, high: 1.55 }
const RELIEF_PITCH = { near: 0.3, far: 0.55, span: 160 }
const FREE_PITCH_ON_SWITCH = 1.5
const SETTLE = 1e-3

export type RigState = {
  x: number
  y: number
  z: number
  dist: number
  yaw: number
  pitch: number
  fov: number
}

type Flight = {
  t: number
  duration: number
  from: { x: number; z: number; dist: number }
  to: { x: number; z: number; dist: number }
  lift: number
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export function isoPitch(dist: number): number {
  const f = clamp((dist - VIEW_MODES.iso.min) / 80, 0, 1)
  return lerp(0.66, 0.98, f)
}

export function reliefPitch(dist: number): number {
  const f = clamp((dist - VIEW_MODES.relief.min) / RELIEF_PITCH.span, 0, 1)
  return lerp(RELIEF_PITCH.near, RELIEF_PITCH.far, f)
}

export class CameraRig {
  readonly rig: RigState
  readonly goal: RigState
  private viewMode: View
  private flight: Flight | undefined
  private animated: boolean
  private readonly reach: { x: number; z: number }

  constructor(view: View, reachX: number, reachZ: number, animated: boolean) {
    this.viewMode = view
    this.animated = animated
    this.reach = { x: reachX + 4, z: reachZ + 4 }
    this.rig = { x: 0, y: 0, z: 30, dist: 320, yaw: 0, pitch: 1.35, fov: VIEW_MODES[view].fov }
    this.goal = { x: 0, y: 0, z: 6, dist: 168, yaw: 0, pitch: 0.92, fov: VIEW_MODES[view].fov }
    this.applyView(view)
    this.goal.dist = 168
    this.goal.pitch = this.pitchFor(view, this.goal.dist) ?? 0.9
  }

  get view(): View {
    return this.viewMode
  }

  get mode(): Mode {
    return VIEW_MODES[this.viewMode]
  }

  get flying(): boolean {
    return this.flight !== undefined
  }

  setView(view: View, animate = true): void {
    this.viewMode = view
    this.applyView(view)
    if (!animate) Object.assign(this.rig, this.goal)
  }

  setAnimated(animated: boolean): void {
    this.animated = animated
    if (!animated && this.flight) this.land(this.flight.to)
  }

  zoom(factor: number): void {
    this.goal.dist = clamp(this.goal.dist * factor, this.mode.min, this.mode.max)
    this.followPitch()
  }

  zoomAt(factor: number, anchor: { x: number; z: number } | undefined): void {
    const next = clamp(this.goal.dist * factor, this.mode.min, this.mode.max)
    const ratio = next / this.goal.dist
    if (anchor) {
      this.goal.x = clamp(anchor.x + (this.goal.x - anchor.x) * ratio, -this.reach.x, this.reach.x)
      this.goal.z = clamp(anchor.z + (this.goal.z - anchor.z) * ratio, -this.reach.z, this.reach.z)
    }
    this.goal.dist = next
    this.followPitch()
  }

  resetNorth(): void {
    this.goal.yaw = Math.round(this.goal.yaw / (Math.PI * 2)) * Math.PI * 2
  }

  pan(dx: number, dz: number): void {
    this.goal.x = clamp(this.goal.x + dx, -this.reach.x, this.reach.x)
    this.goal.z = clamp(this.goal.z + dz, -this.reach.z, this.reach.z)
    this.rig.x = clamp(this.rig.x + dx, -this.reach.x, this.reach.x)
    this.rig.z = clamp(this.rig.z + dz, -this.reach.z, this.reach.z)
  }

  glide(dx: number, dz: number): void {
    this.goal.x = clamp(this.goal.x + dx, -this.reach.x, this.reach.x)
    this.goal.z = clamp(this.goal.z + dz, -this.reach.z, this.reach.z)
  }

  turn(yaw: number, pitch: number): void {
    this.goal.yaw += yaw
    if (this.viewMode === 'free')
      this.goal.pitch = clamp(this.goal.pitch + pitch, FREE_PITCH.low, FREE_PITCH.high)
  }

  pinch(dist: number, yaw: number): void {
    this.goal.dist = clamp(dist, this.mode.min, this.mode.max)
    if (this.viewMode !== 'top') this.goal.yaw = yaw
    this.followPitch()
  }

  stopFlight(): void {
    this.flight = undefined
  }

  flyTo(x: number, z: number, dist: number, duration = 1.6): void {
    const from = { x: this.goal.x, z: this.goal.z, dist: this.goal.dist }
    const to = {
      x: clamp(x, -this.reach.x, this.reach.x),
      z: clamp(z, -this.reach.z, this.reach.z),
      dist: clamp(dist, this.mode.min, this.mode.max),
    }
    if (!this.animated) {
      this.land(to)
      return
    }
    const distance = Math.hypot(x - from.x, z - from.z)
    this.flight = { t: 0, duration, from, to, lift: Math.min(90, distance * 0.45) }
  }

  frameDistance(radius: number): number {
    return clamp(
      (radius / Math.tan((this.rig.fov * Math.PI) / 360)) * 1.05,
      this.mode.min + 2,
      this.mode.max,
    )
  }

  update(dt: number, groundY: number): boolean {
    const { goal, rig } = this
    const flight = this.flight
    if (flight) {
      flight.t += dt / flight.duration
      const t = ease(Math.min(1, flight.t))
      goal.x = lerp(flight.from.x, flight.to.x, t)
      goal.z = lerp(flight.from.z, flight.to.z, t)
      goal.dist = lerp(flight.from.dist, flight.to.dist, t) + Math.sin(Math.PI * t) * flight.lift
      this.followPitch()
      if (flight.t >= 1) this.flight = undefined
    }
    const k = 1 - Math.exp(-dt * (flight ? 14 : 9))
    goal.y = groundY
    let moving = false
    for (const key of ['x', 'y', 'z', 'dist', 'pitch', 'fov', 'yaw'] as const) {
      const delta = goal[key] - rig[key]
      if (Math.abs(delta) > SETTLE) moving = true
      rig[key] = this.animated ? rig[key] + delta * k : goal[key]
    }
    return moving || this.flight !== undefined
  }

  apply(camera: PerspectiveCamera): boolean {
    const { rig } = this
    const cp = Math.cos(rig.pitch)
    const sp = Math.sin(rig.pitch)
    camera.position.set(
      rig.x + rig.dist * cp * Math.sin(rig.yaw),
      rig.y + rig.dist * sp,
      rig.z + rig.dist * cp * Math.cos(rig.yaw),
    )
    camera.up.set(0, 1, 0)
    if (rig.pitch > 1.565) camera.up.set(-Math.sin(rig.yaw), 0, -Math.cos(rig.yaw))
    camera.lookAt(rig.x, rig.y, rig.z)
    const fovChanged = Math.abs(camera.fov - rig.fov) > 0.01
    if (fovChanged) camera.fov = rig.fov
    camera.near = clamp(rig.dist * 0.02, 0.05, 2)
    camera.updateProjectionMatrix()
    return fovChanged
  }

  private pitchFor(view: View, dist: number): number | undefined {
    if (view === 'top') return TOP_PITCH
    if (view === 'iso') return isoPitch(dist)
    if (view === 'relief') return reliefPitch(dist)
    return undefined
  }

  private land(to: Flight['to']): void {
    this.flight = undefined
    this.goal.x = to.x
    this.goal.z = to.z
    this.goal.dist = to.dist
    this.followPitch()
  }

  private followPitch(): void {
    const pitch = this.pitchFor(this.viewMode, this.goal.dist)
    if (pitch !== undefined) this.goal.pitch = pitch
  }

  private applyView(view: View): void {
    const mode = VIEW_MODES[view]
    this.goal.fov = mode.fov
    this.goal.dist = clamp(this.goal.dist, mode.min, mode.max)
    if (view === 'top') this.goal.yaw = Math.round(this.goal.yaw / (Math.PI * 2)) * Math.PI * 2
    const pitch = this.pitchFor(view, this.goal.dist)
    this.goal.pitch = pitch ?? clamp(this.goal.pitch, FREE_PITCH.low, FREE_PITCH_ON_SWITCH)
  }
}
