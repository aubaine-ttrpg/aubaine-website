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

function rowFor(view: BrowseView, id: string): HTMLElement | null {
  return view.list.querySelector<HTMLElement>(`[data-entry="${CSS.escape(id)}"] [data-row]`)
}

function firstVisibleId(view: BrowseView): string | undefined {
  for (const entry of view.list.querySelectorAll<HTMLElement>('[data-entry]')) {
    if (!entry.hidden) return entry.dataset['entry']
  }
  return undefined
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
  if (hash.startsWith(DETAIL_HASH) && select(view, hash.slice(DETAIL_HASH.length))) return
  const first = firstVisibleId(view)
  if (first) select(view, first)
}

function sync(): void {
  const view = browseView()
  if (!view) return
  view.root.setAttribute('data-selection', 'enhanced')
  restore(view)
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
  swup.hooks.on('content:replace', sync)
  sync()
}
