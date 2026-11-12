const TILTING = 'data-tilting'
const REACH = 0.7
export const FULLEST_LEAN = 0.9
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

type Point = { x: number; y: number }
type Box = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>

export function leanToward(box: Box, pointer: Point): Point {
  const across = ((pointer.x - box.left) / box.width - 0.5) * 2
  const down = ((pointer.y - box.top) / box.height - 0.5) * 2
  return {
    x: FULLEST_LEAN * Math.tanh(across * REACH),
    y: FULLEST_LEAN * Math.tanh(down * REACH),
  }
}

export function bindTilt(
  host: HTMLElement,
  card: HTMLElement | (() => HTMLElement),
  signal: AbortSignal,
): void {
  const fine = window.matchMedia(FINE_POINTER).matches
  const reduced = window.matchMedia(REDUCED_MOTION).matches
  if (!fine || reduced) return
  const cardNow = typeof card === 'function' ? card : () => card
  let pointer: Point | undefined
  let frame = 0

  const lean = (): void => {
    frame = 0
    if (!pointer) return
    const { x, y } = leanToward(cardNow().getBoundingClientRect(), pointer)
    host.style.setProperty('--tilt-x', x.toFixed(4))
    host.style.setProperty('--tilt-y', y.toFixed(4))
    host.setAttribute(TILTING, '')
  }

  host.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return
      pointer = { x: event.clientX, y: event.clientY }
      if (frame === 0) frame = window.requestAnimationFrame(lean)
    },
    { signal },
  )
  host.addEventListener(
    'pointerleave',
    () => {
      pointer = undefined
      window.cancelAnimationFrame(frame)
      frame = 0
      host.removeAttribute(TILTING)
    },
    { signal },
  )
  signal.addEventListener(
    'abort',
    () => {
      window.cancelAnimationFrame(frame)
      host.removeAttribute(TILTING)
    },
    { once: true },
  )
}
