import { cubicBezier } from 'motion'

import type { Lean } from '../../lib/art-effect/lean'
import { viewProgress } from '../relief-scroll'
import { leanToward } from '../tilt'
import { aimAt } from '../torchlight'

const GLIDE_SECONDS = 0.16
const SETTLED = 0.0005
const FIRST_STEP_SECONDS = 1 / 60
const LONGEST_STEP_SECONDS = 0.1
const LEANING_SECONDS = 0.14
const RESTING_SECONDS = 0.6
const LEAN_EASE = cubicBezier(0.16, 1, 0.3, 1)
const UPRIGHT: Lean = { x: 0, y: 0 }
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export type Eye = { x: number; y: number }

export type LeanTween = { from: Lean; to: Lean; start: number; seconds: number }

type Following = {
  rest: Eye
  signal: AbortSignal
  live: () => boolean
  render: (eye: Eye, lean: Lean) => boolean
  hover?: HTMLElement
}

export type EyeFollower = {
  readonly eye: Eye
  readonly lean: Lean
  readonly leans: boolean
  glide: () => void
}

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

const UPRIGHT_TWEEN: LeanTween = { from: UPRIGHT, to: UPRIGHT, start: 0, seconds: 0 }

export function leanAt({ from, to, start, seconds }: LeanTween, time: number): Lean {
  const progress = seconds === 0 ? 1 : Math.min(Math.max((time - start) / (seconds * 1000), 0), 1)
  const eased = LEAN_EASE(progress)
  return { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased }
}

export function leanTo(tween: LeanTween, target: Lean, time: number): LeanTween {
  return { from: leanAt(tween, time), to: target, start: time, seconds: LEANING_SECONDS }
}

export function leanBack(tween: LeanTween, time: number): LeanTween {
  return { from: leanAt(tween, time), to: UPRIGHT, start: time, seconds: RESTING_SECONDS }
}

export function isLeanSettled({ start, seconds }: LeanTween, time: number): boolean {
  return time >= start + seconds * 1000
}

export function followEye(
  element: HTMLElement,
  { rest, signal, live, render, hover }: Following,
): EyeFollower {
  const eye = { ...rest }
  const target = { ...rest }
  const lean = { ...UPRIGHT }
  let tween = UPRIGHT_TWEEN
  let frame = 0
  let previous = 0

  const tick = (time: number): void => {
    frame = 0
    const seconds = stepSeconds(time, previous)
    previous = time
    Object.assign(eye, glideToward(eye, target, seconds))
    Object.assign(lean, leanAt(tween, time))
    if (!render(eye, lean)) return
    if ((isSettled(eye, target) && isLeanSettled(tween, time)) || !live()) {
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
  const leans = !still && fine && hover !== undefined
  if (leans) {
    hover.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType !== 'mouse') return
        const pointer = { x: event.clientX, y: event.clientY }
        tween = leanTo(tween, leanToward(hover.getBoundingClientRect(), pointer), performance.now())
        glide()
      },
      { passive: true, signal },
    )
    hover.addEventListener(
      'pointerleave',
      () => {
        tween = leanBack(tween, performance.now())
        glide()
      },
      { signal },
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
  return { eye, lean, leans, glide }
}
