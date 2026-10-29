import { viewProgress } from '../relief-scroll'
import { aimAt } from '../torchlight'

const GLIDE_SECONDS = 0.16
const SETTLED = 0.0005
const FIRST_STEP_SECONDS = 1 / 60
const LONGEST_STEP_SECONDS = 0.1
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export type Eye = { x: number; y: number }

type Following = {
  rest: Eye
  signal: AbortSignal
  live: () => boolean
  render: (eye: Eye) => boolean
}

export type EyeFollower = { readonly eye: Eye; glide: () => void }

export function scrolledEye(progress: number): Eye {
  return { x: 0.15 + 0.7 * progress, y: 0.1 + 0.6 * progress }
}

export function stepSeconds(time: number, previous: number): number {
  return previous === 0
    ? FIRST_STEP_SECONDS
    : Math.min((time - previous) / 1000, LONGEST_STEP_SECONDS)
}

export function glideToward(eye: Eye, target: Eye, seconds: number): Eye {
  const ease = 1 - Math.exp(-seconds / GLIDE_SECONDS)
  return { x: eye.x + (target.x - eye.x) * ease, y: eye.y + (target.y - eye.y) * ease }
}

export function isSettled(eye: Eye, target: Eye): boolean {
  return Math.abs(target.x - eye.x) + Math.abs(target.y - eye.y) < SETTLED
}

export function followEye(
  element: HTMLElement,
  { rest, signal, live, render }: Following,
): EyeFollower {
  const eye = { ...rest }
  const target = { ...rest }
  let frame = 0
  let previous = 0

  const tick = (time: number): void => {
    frame = 0
    const seconds = stepSeconds(time, previous)
    previous = time
    Object.assign(eye, glideToward(eye, target, seconds))
    if (!render(eye)) return
    if (isSettled(eye, target) || !live()) {
      previous = 0
      return
    }
    frame = window.requestAnimationFrame(tick)
  }

  const glide = (): void => {
    if (frame === 0 && live()) frame = window.requestAnimationFrame(tick)
  }

  const aim = (next: Eye): void => {
    target.x = next.x
    target.y = next.y
    glide()
  }

  const still = window.matchMedia(REDUCED_MOTION).matches
  const fine = window.matchMedia(FINE_POINTER).matches
  if (!still && fine) {
    document.addEventListener(
      'pointermove',
      (event) =>
        aim(aimAt(element.getBoundingClientRect(), { x: event.clientX, y: event.clientY })),
      { passive: true, signal },
    )
  }
  if (!still && !fine) {
    const follow = (): void => {
      const box = element.getBoundingClientRect()
      aim(scrolledEye(viewProgress(box.top, box.height, window.innerHeight)))
    }
    window.addEventListener('scroll', follow, { passive: true, signal })
    follow()
  }

  signal.addEventListener('abort', () => window.cancelAnimationFrame(frame), { once: true })
  return { eye, glide }
}
