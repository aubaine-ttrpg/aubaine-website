import { paintField } from './stage-field'
import type { SwupInstance } from './swup'

const MENU = '[data-doors]'
const DOOR = '[data-door]'
const DOOR_FOCUS = '[data-door-focus]'
const STAGE = '[data-stage], [data-stage-field]'
const LIT = 'data-lit'
const POINTED = 'data-pointed'
const LIVE = 'data-live'
const STAGE_FOCUS = 'data-stage-focus'
const INTENT_MS = 80
const PICTURE_WAIT_MS = 250

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function mount(menu: HTMLElement, signal: AbortSignal): void {
  const stage = menu.querySelector<HTMLElement>(STAGE)
  const doors = [...menu.querySelectorAll<HTMLElement>(DOOR)]
  const fields = new Map<HTMLElement, string>()
  const pictures = new Map<string, Promise<void>>()
  let intent = 0
  let swap = 0

  const picture = (art: string): Promise<void> => {
    const known = pictures.get(art)
    if (known) return known
    const image = new Image()
    image.src = art
    const decoded = image.decode().catch(() => undefined)
    pictures.set(art, decoded)
    return decoded
  }

  const fieldOf = (door: HTMLElement): string => {
    const known = fields.get(door)
    if (known !== undefined) return known
    const colours = (door.dataset['doorColours'] ?? '').split('|').filter(Boolean)
    const painted = colours.length > 0 ? paintField(colours, menu) : ''
    fields.set(door, painted)
    return painted
  }

  const point = (door: HTMLElement | undefined): void => {
    for (const each of doors) each.toggleAttribute(POINTED, each === door)
  }

  const light = (door: HTMLElement): void => {
    for (const each of doors) {
      each.toggleAttribute(LIT, each === door)
      each.querySelector(DOOR_FOCUS)?.toggleAttribute(STAGE_FOCUS, each === door)
    }
  }

  const stageOn = async (door: HTMLElement): Promise<void> => {
    if (!stage) return
    const ticket = ++swap
    const art = door.dataset['doorArt']
    if (art) await Promise.race([picture(art), pause(PICTURE_WAIT_MS)])
    if (ticket !== swap || signal.aborted) return
    stage.style.setProperty('--stage-art', door.dataset['doorBackdrop'] ?? '')
    const source = art || fieldOf(door)
    if (source) stage.setAttribute('data-stage', source)
  }

  const doorOf = (target: EventTarget | null): HTMLElement | undefined => {
    if (!(target instanceof Element)) return undefined
    return target.closest<HTMLElement>(DOOR) ?? undefined
  }

  const keyboardInside = (): boolean => {
    const focused = document.activeElement
    return focused !== null && menu.contains(focused) && focused.matches(':focus-visible')
  }

  menu.addEventListener(
    'pointerover',
    (event) => {
      if (event.pointerType === 'touch' || keyboardInside()) return
      const door = doorOf(event.target)
      if (!door || door.hasAttribute(POINTED)) return
      point(door)
      window.clearTimeout(intent)
      intent = window.setTimeout(() => {
        light(door)
        void stageOn(door)
      }, INTENT_MS)
    },
    { signal },
  )
  menu.addEventListener(
    'pointerout',
    (event) => {
      if (event.pointerType === 'touch' || keyboardInside()) return
      if (!doorOf(event.target) || doorOf(event.relatedTarget)) return
      window.clearTimeout(intent)
      point(undefined)
    },
    { signal },
  )
  menu.addEventListener(
    'focusin',
    (event) => {
      if (!(event.target instanceof Element) || !event.target.matches(':focus-visible')) return
      window.clearTimeout(intent)
      const door = doorOf(event.target)
      point(door)
      if (!door) return
      light(door)
      void stageOn(door)
    },
    { signal },
  )
  menu.addEventListener(
    'focusout',
    (event) => {
      if (doorOf(event.relatedTarget)) return
      point(undefined)
    },
    { signal },
  )

  const warm = (): void => {
    for (const door of doors) {
      const art = door.dataset['doorArt']
      if (art) void picture(art)
    }
  }
  const idle = window.setTimeout(warm, 600)

  menu.setAttribute(LIVE, '')
  signal.addEventListener(
    'abort',
    () => {
      window.clearTimeout(intent)
      window.clearTimeout(idle)
      menu.removeAttribute(LIVE)
      point(undefined)
    },
    { once: true },
  )
}

const menus = new Map<HTMLElement, AbortController>()

function syncMenus(): void {
  for (const [menu, teardown] of [...menus]) {
    if (menu.isConnected) continue
    teardown.abort()
    menus.delete(menu)
  }
  for (const menu of document.querySelectorAll<HTMLElement>(MENU)) {
    if (menus.has(menu)) continue
    const teardown = new AbortController()
    menus.set(menu, teardown)
    mount(menu, teardown.signal)
  }
}

export function bindDoorLights(swup: SwupInstance): void {
  swup.hooks.on('page:view', syncMenus)
  syncMenus()
}
