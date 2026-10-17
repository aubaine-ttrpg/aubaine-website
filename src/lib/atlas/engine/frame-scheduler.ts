export const FRAME_MODES = ['active', 'ambient', 'dormant', 'frozen', 'suspended'] as const
export type FrameMode = (typeof FRAME_MODES)[number]

export type Frame = (now: number, dt: number, animate: boolean) => boolean

const INTERVAL_MS: Record<'active' | 'ambient' | 'dormant', number> = {
  active: 1000 / 60,
  ambient: 1000 / 30,
  dormant: 1000 / 12,
}
const TOLERANCE_MS = 2
const SETTLE_MS = 250
const DORMANT_AFTER_MS = 30_000
const MAX_STEP_S = 0.05

export class FrameScheduler {
  private readonly frame: Frame
  private request = 0
  private lastTick = 0
  private budget = 0
  private lastRender = 0
  private lastMotion = 0
  private lastActivity = 0
  private pending = true
  private moving = false
  private animated: boolean
  private uncapped: boolean
  private blurred = false
  private suspended = false
  private holds = 0
  private hidden = false
  private covered = false
  private current: FrameMode = 'active'

  constructor(frame: Frame, options: { animated: boolean; uncapped: boolean }) {
    this.frame = frame
    this.animated = options.animated
    this.uncapped = options.uncapped
  }

  get mode(): FrameMode {
    return this.current
  }

  start(): void {
    const now = performance.now()
    this.lastActivity = now
    this.lastMotion = now
    this.wake()
  }

  invalidate(activity = true): void {
    this.pending = true
    if (activity) this.lastActivity = performance.now()
    this.wake()
  }

  setAnimated(animated: boolean): void {
    this.animated = animated
    this.invalidate(false)
  }

  setUncapped(uncapped: boolean): void {
    this.uncapped = uncapped
  }

  setCovered(covered: boolean): void {
    this.covered = covered
    this.invalidate(false)
  }

  setBlurred(blurred: boolean): void {
    this.blurred = blurred
    if (!blurred) this.invalidate()
  }

  setHidden(hidden: boolean): void {
    this.hidden = hidden
    if (hidden) this.halt()
    else this.invalidate()
  }

  suspend(): void {
    this.suspended = true
    this.halt()
  }

  resume(): void {
    this.suspended = false
    this.invalidate()
  }

  hold(): void {
    this.holds += 1
    this.halt()
  }

  release(): void {
    this.holds = Math.max(0, this.holds - 1)
    if (this.holds === 0) this.invalidate(false)
  }

  dispose(): void {
    this.suspended = true
    this.halt()
  }

  private halt(): void {
    if (this.request) cancelAnimationFrame(this.request)
    this.request = 0
    this.lastTick = 0
    if (this.suspended || this.hidden) this.current = 'suspended'
  }

  private wake(): void {
    if (this.request || this.suspended || this.holds > 0 || this.hidden) return
    this.request = requestAnimationFrame((now) => this.tick(now))
  }

  private decide(now: number): Exclude<FrameMode, 'suspended'> {
    if (this.covered) return 'dormant'
    if (this.pending || this.moving || now - this.lastMotion < SETTLE_MS) return 'active'
    if (!this.animated) return 'frozen'
    if (this.blurred || now - this.lastActivity > DORMANT_AFTER_MS) return 'dormant'
    return 'ambient'
  }

  private tick(now: number): void {
    this.request = 0
    const mode = this.decide(now)
    this.current = mode
    if (mode === 'frozen') {
      this.lastTick = 0
      return
    }
    const interval = mode === 'active' && this.uncapped ? 0 : INTERVAL_MS[mode]
    const elapsed = this.lastTick === 0 ? interval : now - this.lastTick
    this.lastTick = now
    this.budget = Math.min(this.budget + elapsed, interval * 2)
    if (this.budget >= interval - TOLERANCE_MS) {
      this.budget -= interval
      const dt =
        this.lastRender === 0 ? 1 / 60 : Math.min(MAX_STEP_S, (now - this.lastRender) / 1000)
      this.lastRender = now
      this.pending = false
      this.moving = this.frame(now, dt, this.animated)
      if (this.moving) this.lastMotion = now
    }
    this.wake()
  }
}
