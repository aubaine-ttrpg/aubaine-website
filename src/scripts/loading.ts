import type { SwupInstance } from './swup'

const SHOW_AFTER = 400
const MIN_VISIBLE = 260
const SPIN_DEGREES_PER_SECOND = 130
const DOCUMENT_START = 0

type Beats = { collapse: number; hold: number; burst: number }

type State = 'idle' | 'armed' | 'showing' | 'revealing'

let state: State = 'idle'
let timers: number[] = []
let frame = 0
let angle = 0
let spinning = false
let lastFrame = 0
let shownAt = 0

function crestElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-load-crest]')
}

function milliseconds(value: string): number {
  const amount = Number.parseFloat(value)
  if (!Number.isFinite(amount)) return 0
  return value.trim().endsWith('ms') ? amount : amount * 1000
}

function beatsOf(crest: HTMLElement): Beats {
  const styles = getComputedStyle(crest)
  return {
    collapse: milliseconds(styles.getPropertyValue('--crest-collapse')),
    hold: milliseconds(styles.getPropertyValue('--crest-void')),
    burst: milliseconds(styles.getPropertyValue('--crest-burst')),
  }
}

function later(run: () => void, delay: number): void {
  timers.push(window.setTimeout(run, delay))
}

function clearTimers(): void {
  for (const id of timers) window.clearTimeout(id)
  timers = []
}

function applySpin(crest: HTMLElement): void {
  const hex = crest.querySelector<SVGGElement>('[data-crest-hex]')
  if (hex) hex.style.transform = `rotate(${angle}deg)`
}

function startSpin(crest: HTMLElement): void {
  spinning = true
  lastFrame = 0
  const step = (now: number) => {
    if (!spinning) return
    if (lastFrame === 0) lastFrame = now
    angle += ((now - lastFrame) / 1000) * SPIN_DEGREES_PER_SECOND
    lastFrame = now
    applySpin(crest)
    frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

function settleSpin(crest: HTMLElement, duration: number): void {
  spinning = false
  cancelAnimationFrame(frame)
  let from = ((angle % 360) + 360) % 360
  if (from > 180) from -= 360
  const started = performance.now()
  const step = (now: number) => {
    const progress = Math.min(1, (now - started) / duration)
    angle = from * (1 - progress) ** 3
    applySpin(crest)
    if (progress < 1) frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
}

function teardown(): void {
  clearTimers()
  spinning = false
  cancelAnimationFrame(frame)
  angle = 0
  state = 'idle'
  const crest = crestElement()
  if (!crest) return
  crest.removeAttribute('data-phase')
  applySpin(crest)
}

function show(): void {
  const crest = crestElement()
  if (!crest) return
  state = 'showing'
  shownAt = performance.now()
  angle = 0
  crest.dataset['phase'] = 'loading'
  startSpin(crest)
}

function reveal(): void {
  const crest = crestElement()
  if (!crest) {
    teardown()
    return
  }
  state = 'revealing'
  clearTimers()
  const beats = beatsOf(crest)
  const wait = Math.max(0, MIN_VISIBLE - (performance.now() - shownAt))

  later(() => {
    crest.dataset['phase'] = 'collapse'
    settleSpin(crest, beats.collapse)
  }, wait)
  later(() => {
    crest.dataset['phase'] = 'void'
  }, wait + beats.collapse)
  later(
    () => {
      crest.dataset['phase'] = 'burst'
    },
    wait + beats.collapse + beats.hold,
  )
  later(teardown, wait + beats.collapse + beats.hold + beats.burst)
}

function adoptRenderedCrest(): void {
  const crest = crestElement()
  if (crest?.dataset['phase'] !== 'loading') return
  state = 'showing'
  shownAt = DOCUMENT_START
  startSpin(crest)
}

export function bindLoading(swup: SwupInstance): void {
  adoptRenderedCrest()

  swup.hooks.on('visit:start', () => {
    if (state === 'showing') return
    teardown()
    state = 'armed'
    later(show, SHOW_AFTER)
  })

  swup.hooks.on('content:replace', () => {
    if (state === 'showing') {
      reveal()
      return
    }
    clearTimers()
    state = 'idle'
  })

  swup.hooks.on('visit:end', () => {
    if (state === 'revealing') return
    teardown()
  })
}
