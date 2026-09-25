import { DRAFTS_TOGGLED, isHiddenDraft, revealDraft } from './drafts'
import type { SwupInstance } from './swup'

const DETAIL_PREFIX = 'e-'
const DETAIL_HASH = `#${DETAIL_PREFIX}`

type BrowseView = {
  root: HTMLElement
  list: HTMLElement
  panel: HTMLElement
}

function browseView(): BrowseView | undefined {
  const root = document.querySelector<HTMLElement>('[data-browse]')
  if (!root) return undefined
  const list = root.querySelector<HTMLElement>('[data-rows]')
  const panel = root.querySelector<HTMLElement>('[data-details]')
  if (!list || !panel) return undefined
  return { root, list, panel }
}

function detailFor(view: BrowseView, id: string): HTMLElement | null {
  const detail = document.getElementById(`${DETAIL_PREFIX}${id}`)
  return detail && view.panel.contains(detail) ? detail : null
}

function entryFor(view: BrowseView, id: string): HTMLElement | null {
  return view.list.querySelector<HTMLElement>(`[data-entry="${CSS.escape(id)}"]`)
}

function rowFor(view: BrowseView, id: string): HTMLElement | null {
  return entryFor(view, id)?.querySelector<HTMLElement>('[data-row]') ?? null
}

function entries(view: BrowseView): HTMLElement[] {
  return Array.from(view.list.querySelectorAll<HTMLElement>('[data-entry]'))
}

function firstVisibleId(view: BrowseView): string | undefined {
  return entries(view).find((entry) => !entry.hidden && !isHiddenDraft(entry))?.dataset['entry']
}

function currentEntry(view: BrowseView): HTMLElement | null {
  return (
    view.list
      .querySelector<HTMLElement>('[data-row][aria-current]')
      ?.closest<HTMLElement>('[data-entry]') ?? null
  )
}

function hideDrafts(view: BrowseView): void {
  for (const entry of entries(view)) {
    if (isHiddenDraft(entry)) entry.hidden = true
  }
}

function select(view: BrowseView, id: string): HTMLElement | undefined {
  const detail = detailFor(view, id)
  const row = rowFor(view, id)
  if (!detail || !row) return undefined

  for (const previous of view.list.querySelectorAll('[data-row][aria-current]')) {
    previous.removeAttribute('aria-current')
  }
  for (const previous of view.panel.querySelectorAll('[data-detail][data-current]')) {
    previous.removeAttribute('data-current')
  }

  row.setAttribute('aria-current', 'true')
  detail.setAttribute('data-current', '')
  view.panel.scrollTop = 0
  return detail
}

function revealPanel(view: BrowseView): void {
  if (view.panel.getBoundingClientRect().top < window.innerHeight) return
  view.panel.scrollIntoView({ block: 'start' })
}

function open(view: BrowseView, id: string): void {
  const detail = select(view, id)
  if (!detail) return
  window.history.replaceState(window.history.state, '', `${DETAIL_HASH}${id}`)
  detail.setAttribute('tabindex', '-1')
  detail.focus({ preventScroll: true })
  revealPanel(view)
}

function restore(view: BrowseView): void {
  const hash = window.location.hash
  const linked = hash.startsWith(DETAIL_HASH) ? hash.slice(DETAIL_HASH.length) : undefined
  const entry = linked ? entryFor(view, linked) : null
  if (linked && entry && select(view, linked)) {
    revealDraft(entry)
    return
  }
  const first = firstVisibleId(view)
  if (first) select(view, first)
}

function sync(): void {
  const view = browseView()
  if (!view) return
  view.root.setAttribute('data-selection', 'enhanced')
  hideDrafts(view)
  restore(view)
}

function onDraftsToggled(): void {
  const view = browseView()
  if (!view) return
  const current = currentEntry(view)
  if (!current || !isHiddenDraft(current)) return
  const first = firstVisibleId(view)
  if (!first) return
  select(view, first)
  if (window.location.hash === `${DETAIL_HASH}${current.dataset['entry']}`) {
    window.history.replaceState(window.history.state, '', `${DETAIL_HASH}${first}`)
  }
}

function onClick(event: MouseEvent): void {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  const target = event.target
  if (!(target instanceof Element)) return
  const row = target.closest<HTMLElement>('[data-browse] [data-row]')
  const id = row?.closest<HTMLElement>('[data-entry]')?.dataset['entry']
  if (!id) return
  const view = browseView()
  if (!view) return
  event.preventDefault()
  open(view, id)
}

function onHashChange(): void {
  const view = browseView()
  if (view) restore(view)
}

export function bindBrowse(swup: SwupInstance): void {
  document.addEventListener('click', onClick)
  window.addEventListener('hashchange', onHashChange)
  document.addEventListener(DRAFTS_TOGGLED, onDraftsToggled)
  swup.hooks.on('content:replace', sync)
  sync()
}
