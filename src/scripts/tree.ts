import { treeRef } from '../lib/i18n/routes'
import type { SwupInstance, SwupVisit } from './swup'

const NODE_CONTAINERS = ['#site-footer', '#tree-detail']
const DETAIL_PANE = '#tree-detail'
const SELECTED = '#tree-detail [data-selected-node]'
const BOARD = '[data-plate-viewer]'
const HINTING = 'data-hinting'
const HINT_THRESHOLD = 0.25

let hintWatch: IntersectionObserver | undefined

function treeOf(url: string): string | undefined {
  return treeRef(new URL(url, window.location.origin).pathname)
}

function staysOnOneTree(visit: SwupVisit): boolean {
  const from = treeOf(visit.from.url)
  return from !== undefined && from === treeOf(visit.to.url)
}

function paneStacksBelowTree(): boolean {
  const pane = document.querySelector(DETAIL_PANE)
  return pane !== null && window.getComputedStyle(pane).position !== 'sticky'
}

function litEnd(ends: string | undefined, selected: string | undefined): string | undefined {
  const [from, to] = ends?.split(' ') ?? []
  if (selected === undefined) return undefined
  if (selected === from) return 'start'
  if (selected === to) return 'end'
  return undefined
}

function markSelection(selected: string | undefined): void {
  for (const node of document.querySelectorAll<HTMLElement>('[data-node]')) {
    if (node.dataset['node'] === selected) node.setAttribute('aria-current', 'page')
    else node.removeAttribute('aria-current')
  }
  for (const edge of document.querySelectorAll<SVGElement>('[data-ends]')) {
    const lit = litEnd(edge.dataset['ends'], selected)
    if (lit) edge.setAttribute('data-lit', lit)
    else edge.removeAttribute('data-lit')
  }
}

function watchHint(): void {
  hintWatch?.disconnect()
  hintWatch = undefined
  const board = document.querySelector<HTMLElement>(BOARD)
  if (!board || board.querySelector('[data-node][aria-current]')) return
  const watch = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      board.setAttribute(HINTING, '')
      watch.disconnect()
    },
    { threshold: HINT_THRESHOLD },
  )
  watch.observe(board)
  hintWatch = watch
}

function endHint(event: Event): void {
  const target = event.target
  if (!(target instanceof Element) || !target.closest('[data-node]')) return
  target.closest(BOARD)?.removeAttribute(HINTING)
}

export function bindTree(swup: SwupInstance): void {
  document.addEventListener('pointerover', endHint)
  document.addEventListener('focusin', endHint)

  swup.hooks.on('visit:start', (visit) => {
    if (!staysOnOneTree(visit)) return
    visit.containers = NODE_CONTAINERS
    visit.animation.animate = false
    visit.scroll.reset = false
    visit.scroll.target = paneStacksBelowTree() ? DETAIL_PANE : false
    if (!visit.history.popstate) visit.history.action = 'replace'
    if (visit.a11y) visit.a11y.focus = { selector: DETAIL_PANE, wait: true }
    const chosen = visit.trigger?.el?.closest<HTMLElement>('[data-node]')?.dataset['node']
    if (chosen) markSelection(chosen)
    document.querySelector(DETAIL_PANE)?.setAttribute('data-leaving', '')
  })

  swup.hooks.on('content:replace', (visit) => {
    hintWatch?.disconnect()
    if (!staysOnOneTree(visit)) return
    markSelection(document.querySelector<HTMLElement>(SELECTED)?.dataset['selectedNode'])
    const title = document.querySelector(SELECTED)?.getAttribute('aria-label')
    if (visit.a11y && title) visit.a11y.announce = title
  })

  swup.hooks.on('page:view', watchHint)
  watchHint()
}
