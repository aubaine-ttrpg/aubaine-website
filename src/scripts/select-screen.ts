import { DRAFT_REVEALED, DRAFTS_TOGGLED, isHiddenDraft } from './drafts'
import { paintField } from './stage-field'
import type { SwupInstance } from './swup'

const SCREEN = '[data-select]'
const SPOTLIGHT = '[data-spotlight]'
const PANEL = '[data-spotlight-panel]'
const OPEN = '[data-spotlight-open]'
const OPEN_TEXT = '[data-spotlight-open-text]'
const STEP = '[data-spotlight-step]'
const STATUS = '[data-spotlight-status]'
const STAGE = '[data-stage], [data-stage-field]'
const ENTRY = '[data-entry]'
const CARD = '[data-cover-card]'
const TEMPLATE = 'template[data-spotlight-for]'
const INTENT_MS = 80
const PICTURE_WAIT_MS = 250
const SWAP_ARRIVAL = '0.35'

export type Direction = 1 | -1

export function stepAmong(
  ids: readonly string[],
  current: string | undefined,
  direction: Direction,
): string | undefined {
  if (ids.length === 0) return undefined
  const at = current === undefined ? -1 : ids.indexOf(current)
  if (at === -1) return direction === 1 ? ids[0] : ids[ids.length - 1]
  return ids[(at + direction + ids.length) % ids.length]
}

export function firstShown(
  order: readonly string[],
  shown: ReadonlySet<string>,
): string | undefined {
  return order.find((id) => shown.has(id))
}

function shownEntry(entry: HTMLElement): boolean {
  return !entry.hidden && !isHiddenDraft(entry)
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function mount(screen: HTMLElement, signal: AbortSignal): void {
  const spotlight = screen.querySelector<HTMLElement>(SPOTLIGHT)
  const panel = spotlight?.querySelector<HTMLElement>(PANEL)
  const open = spotlight?.querySelector<HTMLAnchorElement>(OPEN)
  if (!spotlight || !panel || !open) throw new Error('a select screen lost its spotlight')
  const openText = open.querySelector<HTMLElement>(OPEN_TEXT)
  const stage = screen.querySelector<HTMLElement>(STAGE)
  const status = screen.querySelector<HTMLElement>(STATUS)
  const templates = new Map<string, HTMLTemplateElement>()
  for (const template of spotlight.querySelectorAll<HTMLTemplateElement>(TEMPLATE)) {
    const id = template.dataset['spotlightFor']
    if (id) templates.set(id, template)
  }
  const order = (spotlight.dataset['spotlightOrder'] ?? '').split(' ').filter(Boolean)
  const fields = new Map<string, string>()
  let current = spotlight.dataset['spotlightCurrent'] || undefined
  let intent = 0
  let swap: AbortController | undefined

  const entries = (): HTMLElement[] => [...screen.querySelectorAll<HTMLElement>(ENTRY)]
  const shownIds = (): string[] =>
    entries()
      .filter(shownEntry)
      .map((entry) => entry.dataset['entry'] ?? '')
      .filter(Boolean)

  const markCurrent = (): void => {
    for (const entry of entries()) {
      const card = entry.querySelector<HTMLElement>(CARD)
      if (!card) continue
      if (entry.dataset['entry'] === current) card.setAttribute('aria-current', 'true')
      else card.removeAttribute('aria-current')
    }
  }

  const empty = (): void => {
    swap?.abort()
    current = undefined
    spotlight.dataset['spotlightCurrent'] = ''
    panel.replaceChildren()
    markCurrent()
  }

  const show = async (id: string, announce: boolean): Promise<void> => {
    const template = templates.get(id)
    if (!template) return
    swap?.abort()
    const attempt = new AbortController()
    swap = attempt
    const fragment = document.importNode(template.content, true)
    const picture = fragment.querySelector('img')
    if (picture && !picture.complete) {
      await Promise.race([picture.decode().catch(() => undefined), pause(PICTURE_WAIT_MS)])
    }
    if (attempt.signal.aborted || signal.aborted) return
    current = id
    spotlight.dataset['spotlightCurrent'] = id
    panel.style.setProperty('--arrival', SWAP_ARRIVAL)
    panel.replaceChildren(fragment)
    open.href = template.dataset['spotlightHref'] ?? open.href
    open.setAttribute('aria-label', template.dataset['spotlightLabel'] ?? '')
    if (openText) openText.textContent = template.dataset['spotlightText'] ?? ''
    if (stage) {
      stage.style.setProperty('--stage-art', template.dataset['spotlightBackdrop'] ?? '')
      const art = template.dataset['spotlightArt'] || fieldOf(id, template)
      if (art) stage.setAttribute('data-stage', art)
    }
    markCurrent()
    if (announce && status) status.textContent = template.dataset['spotlightName'] ?? ''
  }

  const fieldOf = (id: string, template: HTMLTemplateElement): string => {
    const known = fields.get(id)
    if (known !== undefined) return known
    const colours = (template.dataset['spotlightColours'] ?? '').split('|').filter(Boolean)
    const painted = colours.length > 0 ? paintField(colours, spotlight) : ''
    fields.set(id, painted)
    return painted
  }

  const settle = (): void => {
    const shown = new Set(shownIds())
    if (current && shown.has(current)) {
      markCurrent()
      return
    }
    const next = firstShown(order, shown)
    if (next) void show(next, false)
    else empty()
  }

  const idOf = (target: EventTarget | null): string | undefined => {
    if (!(target instanceof Element)) return undefined
    const card = target.closest(CARD)
    return card?.closest<HTMLElement>(ENTRY)?.dataset['entry']
  }

  const focusedInSpotlight = (): boolean => {
    const focused = document.activeElement
    return focused !== null && spotlight.contains(focused) && focused.matches(':focus-visible')
  }

  screen.addEventListener(
    'pointerover',
    (event) => {
      if (event.pointerType === 'touch' || focusedInSpotlight()) return
      const id = idOf(event.target)
      if (!id || id === current) return
      window.clearTimeout(intent)
      intent = window.setTimeout(() => void show(id, false), INTENT_MS)
    },
    { signal },
  )
  screen.addEventListener(
    'pointerout',
    (event) => {
      if (idOf(event.target) && !idOf(event.relatedTarget)) window.clearTimeout(intent)
    },
    { signal },
  )
  screen.addEventListener(
    'focusin',
    (event) => {
      const id = idOf(event.target)
      if (id && id !== current) void show(id, false)
    },
    { signal },
  )

  for (const button of spotlight.querySelectorAll<HTMLButtonElement>(STEP)) {
    const direction: Direction = button.dataset['spotlightStep'] === '-1' ? -1 : 1
    button.hidden = false
    button.addEventListener(
      'click',
      () => {
        const id = stepAmong(shownIds(), current, direction)
        if (id) void show(id, true)
      },
      { signal },
    )
  }

  const filtering = new MutationObserver(settle)
  filtering.observe(screen, { subtree: true, attributes: true, attributeFilter: ['hidden'] })
  document.addEventListener(DRAFTS_TOGGLED, settle, { signal })
  document.addEventListener(DRAFT_REVEALED, settle, { signal })
  signal.addEventListener(
    'abort',
    () => {
      window.clearTimeout(intent)
      swap?.abort()
      filtering.disconnect()
    },
    { once: true },
  )

  settle()
  spotlight.removeAttribute('data-spotlight-pending')
}

const screens = new Map<HTMLElement, AbortController>()

function syncScreens(): void {
  for (const [screen, teardown] of [...screens]) {
    if (screen.isConnected) continue
    teardown.abort()
    screens.delete(screen)
  }
  for (const screen of document.querySelectorAll<HTMLElement>(SCREEN)) {
    if (screens.has(screen)) continue
    const teardown = new AbortController()
    screens.set(screen, teardown)
    try {
      mount(screen, teardown.signal)
    } catch (error) {
      console.error(error)
      teardown.abort()
    }
  }
}

export function bindSelectScreens(swup: SwupInstance): void {
  swup.hooks.on('page:view', syncScreens)
  syncScreens()
}
