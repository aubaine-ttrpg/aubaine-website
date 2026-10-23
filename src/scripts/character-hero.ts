import type { SwupInstance } from './swup'

const HERO = '[data-character]'
const CARD = '[data-tilt-card]'
const TOGGLE = '[data-stage-toggle]'
const TILTING = 'data-tilting'
const STILL_KEY = 'aubaine.stage'
const STILL_VALUE = 'still'
const REACH = 0.7
const FULLEST_LEAN = 0.9
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

export const STILL = 'data-still'

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

const heroes = new Map<HTMLElement, AbortController>()

function storedStill(): boolean {
  try {
    return window.localStorage.getItem(STILL_KEY) === STILL_VALUE
  } catch {
    return false
  }
}

function storeStill(still: boolean): void {
  try {
    if (still) window.localStorage.setItem(STILL_KEY, STILL_VALUE)
    else window.localStorage.removeItem(STILL_KEY)
  } catch {
    return
  }
}

function showStill(hero: HTMLElement, toggle: HTMLButtonElement, still: boolean): void {
  hero.toggleAttribute(STILL, still)
  const name = still ? toggle.dataset['play'] : toggle.dataset['pause']
  if (name) toggle.setAttribute('aria-label', name)
}

function bindStillness(hero: HTMLElement, signal: AbortSignal): void {
  const toggle = hero.querySelector<HTMLButtonElement>(TOGGLE)
  if (!toggle) return
  showStill(hero, toggle, storedStill())
  toggle.hidden = false
  toggle.addEventListener(
    'click',
    () => {
      const still = !hero.hasAttribute(STILL)
      showStill(hero, toggle, still)
      storeStill(still)
    },
    { signal },
  )
}

function bindTilt(hero: HTMLElement, signal: AbortSignal): void {
  const card = hero.querySelector<HTMLElement>(CARD)
  if (!card) return
  let pointer: Point | undefined
  let frame = 0

  const lean = (): void => {
    frame = 0
    if (!pointer) return
    const { x, y } = leanToward(card.getBoundingClientRect(), pointer)
    hero.style.setProperty('--tilt-x', x.toFixed(4))
    hero.style.setProperty('--tilt-y', y.toFixed(4))
    hero.setAttribute(TILTING, '')
  }

  hero.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return
      pointer = { x: event.clientX, y: event.clientY }
      if (frame === 0) frame = window.requestAnimationFrame(lean)
    },
    { signal },
  )
  hero.addEventListener(
    'pointerleave',
    () => {
      pointer = undefined
      window.cancelAnimationFrame(frame)
      frame = 0
      hero.removeAttribute(TILTING)
    },
    { signal },
  )
  signal.addEventListener('abort', () => window.cancelAnimationFrame(frame), { once: true })
}

function mount(hero: HTMLElement, signal: AbortSignal): void {
  bindStillness(hero, signal)
  const fine = window.matchMedia(FINE_POINTER).matches
  const reduced = window.matchMedia(REDUCED_MOTION).matches
  if (fine && !reduced) bindTilt(hero, signal)
}

function syncHeroes(): void {
  for (const [hero, teardown] of [...heroes]) {
    if (hero.isConnected) continue
    teardown.abort()
    heroes.delete(hero)
  }
  for (const hero of document.querySelectorAll<HTMLElement>(HERO)) {
    if (heroes.has(hero)) continue
    const teardown = new AbortController()
    heroes.set(hero, teardown)
    mount(hero, teardown.signal)
  }
}

export function bindCharacterHeroes(swup: SwupInstance): void {
  swup.hooks.on('page:view', syncHeroes)
  syncHeroes()
}
