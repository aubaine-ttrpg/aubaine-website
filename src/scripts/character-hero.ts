import { bindStillToggle } from './stillness'
import type { SwupInstance } from './swup'
import { bindTilt } from './tilt'

const HERO = '[data-character]'
const CARD = '[data-tilt-card]'
const TOGGLE = '[data-stage-toggle]'

const heroes = new Map<HTMLElement, AbortController>()

function mount(hero: HTMLElement, signal: AbortSignal): void {
  const toggle = hero.querySelector<HTMLButtonElement>(TOGGLE)
  if (toggle) bindStillToggle(hero, toggle, signal)
  const card = hero.querySelector<HTMLElement>(CARD)
  if (card) bindTilt(hero, card, signal)
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
