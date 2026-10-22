import type { SwupInstance } from './swup'

const SCROLLED = '[data-relief="drift"]'
const VIEW = '--au-view'

export function viewProgress(top: number, height: number, viewport: number): number {
  return Math.min(1, Math.max(0, (viewport - top) / (viewport + height)))
}

let watched: HTMLElement[] = []
let frame = 0

function update(): void {
  frame = 0
  const viewport = window.innerHeight
  for (const element of watched) {
    const box = element.getBoundingClientRect()
    element.style.setProperty(VIEW, viewProgress(box.top, box.height, viewport).toFixed(4))
  }
}

function schedule(): void {
  if (watched.length === 0 || frame !== 0) return
  frame = window.requestAnimationFrame(update)
}

function collect(): void {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  watched = still ? [] : [...document.querySelectorAll<HTMLElement>(SCROLLED)]
  schedule()
}

export function bindReliefScroll(swup: SwupInstance): void {
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  swup.hooks.on('page:view', collect)
  collect()
}
