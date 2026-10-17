import { type PerspectiveCamera, Ray, Vector2, type Vector3 } from 'three'
import type { View } from '../contract/camera.ts'
import type { CameraRig } from './camera-rig.ts'

export type InputHandlers = {
  activity: () => void
  hover: (clientX: number, clientY: number) => void
  leave: () => void
  click: (clientX: number, clientY: number, double: boolean) => void
  view: (view: View) => void
  escape: () => void
}

type Drag = { mode: 'pan' | 'rotate'; x: number; y: number; moved: number; vx: number; vz: number }
type Pinch = { distance: number; angle: number; dist: number; yaw: number }

const CLICK_TRAVEL = 6
const CLICK_MS = 450
const DOUBLE_MS = 320
const HOVER_MS = 40
const VIEW_KEYS: Record<string, View> = { '1': 'top', '2': 'iso', '3': 'relief', '4': 'free' }

export class MapInput {
  private readonly canvas: HTMLCanvasElement
  private readonly camera: PerspectiveCamera
  private readonly rig: CameraRig
  private readonly handlers: InputHandlers
  private readonly pointers = new Map<number, { x: number; y: number }>()
  private readonly keys = new Set<string>()
  private readonly stop = new AbortController()
  private drag: Drag | undefined
  private pinch: Pinch | undefined
  private down: { x: number; y: number; t: number } | undefined
  private lastClick = 0
  private lastHover = 0
  private readonly ray = new Ray()
  private readonly ndc = new Vector2()

  constructor(
    canvas: HTMLCanvasElement,
    surface: HTMLElement,
    camera: PerspectiveCamera,
    rig: CameraRig,
    handlers: InputHandlers,
  ) {
    this.canvas = canvas
    this.camera = camera
    this.rig = rig
    this.handlers = handlers
    const options = { signal: this.stop.signal }
    const hold = (event: Event) => event.preventDefault()
    surface.addEventListener('contextmenu', hold, options)
    surface.addEventListener('gesturestart', hold, options)
    surface.addEventListener('gesturechange', hold, options)
    surface.addEventListener('wheel', (event) => this.wheel(event), { ...options, passive: false })
    surface.addEventListener(
      'pointerdown',
      (event) => {
        if (event.target !== canvas && event.button !== 0) this.pointerDown(event)
      },
      options,
    )
    canvas.addEventListener('pointerdown', (event) => this.pointerDown(event), options)
    canvas.addEventListener('pointermove', (event) => this.pointerMove(event), options)
    canvas.addEventListener('pointerup', (event) => this.pointerUp(event), options)
    canvas.addEventListener('pointercancel', (event) => this.pointerUp(event), options)
    canvas.addEventListener(
      'pointerleave',
      () => {
        if (!this.drag) this.handlers.leave()
      },
      options,
    )
    canvas.addEventListener('keydown', (event) => this.keyDown(event), options)
    canvas.addEventListener('keyup', (event) => this.keys.delete(event.key.toLowerCase()), options)
    canvas.addEventListener('blur', () => this.keys.clear(), options)
  }

  get moving(): boolean {
    return this.keys.size > 0 || this.drag !== undefined || this.pinch !== undefined
  }

  dispose(): void {
    this.stop.abort()
    this.pointers.clear()
    this.keys.clear()
  }

  rayAt(clientX: number, clientY: number): Ray {
    const rect = this.canvas.getBoundingClientRect()
    this.ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.ray.origin.setFromMatrixPosition(this.camera.matrixWorld)
    this.ray.direction
      .set(this.ndc.x, this.ndc.y, 0.5)
      .unproject(this.camera)
      .sub(this.ray.origin)
      .normalize()
    return this.ray
  }

  groundAt(clientX: number, clientY: number, y: number): Vector3 | undefined {
    const ray = this.rayAt(clientX, clientY)
    if (Math.abs(ray.direction.y) < 1e-4) return undefined
    const t = (y - ray.origin.y) / ray.direction.y
    if (t < 0) return undefined
    return ray.origin.clone().addScaledVector(ray.direction, t)
  }

  step(dt: number): boolean {
    if (this.keys.size === 0) return false
    const { goal } = this.rig
    const speed = goal.dist * 0.9 * dt
    const fx = -Math.sin(goal.yaw)
    const fz = -Math.cos(goal.yaw)
    const rx = Math.cos(goal.yaw)
    const rz = -Math.sin(goal.yaw)
    const view = this.rig.view
    let mx = 0
    let mz = 0
    const has = (key: string) => this.keys.has(key)
    if (has('w') || has('z') || has('arrowup')) {
      mx += fx
      mz += fz
    }
    if (has('s') || has('arrowdown')) {
      mx -= fx
      mz -= fz
    }
    if (has('d') || has('arrowright')) {
      mx += rx
      mz += rz
    }
    if (has('a') || (has('q') && view === 'top') || has('arrowleft')) {
      mx -= rx
      mz -= rz
    }
    this.rig.glide(mx * speed, mz * speed)
    if (view !== 'top') {
      if (has('q')) this.rig.turn(dt * 1.4, 0)
      if (has('e')) this.rig.turn(-dt * 1.4, 0)
    }
    if (view === 'free') {
      if (has('r')) this.rig.turn(0, dt)
      if (has('f')) this.rig.turn(0, -dt)
    }
    return true
  }

  private pointerDown(event: PointerEvent): void {
    this.canvas.focus({ preventScroll: true })
    this.canvas.setPointerCapture(event.pointerId)
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    this.rig.stopFlight()
    this.handlers.activity()
    const [a, b] = [...this.pointers.values()]
    if (this.pointers.size === 2 && a && b) {
      this.pinch = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        angle: Math.atan2(b.y - a.y, b.x - a.x),
        dist: this.rig.goal.dist,
        yaw: this.rig.goal.yaw,
      }
      this.drag = undefined
      return
    }
    const rotating = event.button === 2 || event.button === 1 || event.shiftKey || event.altKey
    this.drag = {
      mode: rotating && this.rig.view !== 'top' ? 'rotate' : 'pan',
      x: event.clientX,
      y: event.clientY,
      moved: 0,
      vx: 0,
      vz: 0,
    }
    this.down = { x: event.clientX, y: event.clientY, t: performance.now() }
  }

  private pointerMove(event: PointerEvent): void {
    if (this.pointers.has(event.pointerId))
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const [a, b] = [...this.pointers.values()]
    if (this.pinch && this.pointers.size === 2 && a && b) {
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      this.rig.pinch(
        (this.pinch.dist * this.pinch.distance) / Math.max(20, distance),
        this.pinch.yaw - (angle - this.pinch.angle),
      )
      this.handlers.activity()
      return
    }
    const drag = this.drag
    if (drag) {
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      drag.moved += Math.abs(dx) + Math.abs(dy)
      if (drag.mode === 'pan') {
        const y = this.rig.rig.y
        const from = this.groundAt(drag.x, drag.y, y)
        const to = this.groundAt(event.clientX, event.clientY, y)
        if (from && to) {
          drag.vx = from.x - to.x
          drag.vz = from.z - to.z
          this.rig.pan(drag.vx, drag.vz)
        }
      } else this.rig.turn(-dx * 0.006, dy * 0.005)
      drag.x = event.clientX
      drag.y = event.clientY
      this.handlers.leave()
      this.handlers.activity()
      return
    }
    const now = performance.now()
    if (now - this.lastHover < HOVER_MS) return
    this.lastHover = now
    this.handlers.hover(event.clientX, event.clientY)
  }

  private pointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId)
    if (this.pointers.size < 2) this.pinch = undefined
    const drag = this.drag
    const down = this.down
    this.drag = undefined
    if (!drag || !down) return
    const click = drag.moved < CLICK_TRAVEL && performance.now() - down.t < CLICK_MS
    if (drag.mode === 'pan' && !click) this.rig.glide(drag.vx * 4, drag.vz * 4)
    this.handlers.activity()
    if (!click || event.button !== 0) return
    const now = performance.now()
    const double = now - this.lastClick < DOUBLE_MS
    this.lastClick = now
    this.handlers.click(event.clientX, event.clientY, double)
  }

  private wheel(event: WheelEvent): void {
    event.preventDefault()
    this.rig.stopFlight()
    const factor = Math.exp(Math.max(-120, Math.min(120, event.deltaY)) * 0.0016)
    const anchor = this.groundAt(event.clientX, event.clientY, this.rig.rig.y)
    this.rig.zoomAt(factor, anchor)
    this.handlers.activity()
  }

  private keyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase()
    const view = VIEW_KEYS[key]
    if (view) {
      this.handlers.view(view)
      return
    }
    if (key === 'escape') {
      this.handlers.escape()
      return
    }
    if (key === '+' || key === '=') {
      this.rig.zoom(0.8)
      this.handlers.activity()
      return
    }
    if (key === '-') {
      this.rig.zoom(1.25)
      this.handlers.activity()
      return
    }
    this.keys.add(key)
    this.handlers.activity()
  }
}
