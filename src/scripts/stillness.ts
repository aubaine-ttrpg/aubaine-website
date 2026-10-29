const STILL_KEY = 'aubaine.stage'
const STILL_VALUE = 'still'

export const STILL = 'data-still'
export const STILLNESS_CHANGED = 'aubaine:stillness-changed'

let current: boolean | undefined

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

export function isStill(): boolean {
  current ??= storedStill()
  return current
}

export function setStill(still: boolean): void {
  current = still
  storeStill(still)
  window.dispatchEvent(new Event(STILLNESS_CHANGED))
}

export function bindStillToggle(
  holder: HTMLElement,
  toggle: HTMLButtonElement,
  signal: AbortSignal,
): void {
  const show = (): void => {
    const still = isStill()
    holder.toggleAttribute(STILL, still)
    const name = still ? toggle.dataset['play'] : toggle.dataset['pause']
    if (name) toggle.setAttribute('aria-label', name)
  }
  show()
  toggle.hidden = false
  toggle.addEventListener('click', () => setStill(!isStill()), { signal })
  window.addEventListener(STILLNESS_CHANGED, show, { signal })
}
