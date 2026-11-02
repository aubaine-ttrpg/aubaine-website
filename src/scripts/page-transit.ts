import { resetLoading } from './loading'
import { BOOK_ARRIVALS_WAIT_MS, isInBook, layOutBook, putBookAway } from './page-book'
import {
  currentEntry,
  litDoorPath,
  type Origin,
  originGoingBack,
  originGoingIn,
  targetsOf,
} from './page-flight'
import {
  landedAt,
  type NamedPiece,
  type SheetScene,
  sceneArrival,
  sceneClosing,
  sceneOpening,
  scoreOf,
  settleArrivals,
} from './page-sheet'
import type { SwupInstance, SwupVisit } from './swup'

const PAGE = '#swup'
const SELECT = '[data-select]'
const MENU = '[data-doors]'
const FLIGHT_CLASS = 'au-flight'
const PICTURE_WAIT_MS = 250
const STYLESHEET_WAIT_MS = 3000
const WARMED_LIMIT = 8
const MOTION_BUDGET_MS = 400
const CAPTURE_MARGIN_MS = 50
const SHORTEST_MOTION_MS = 260
const LONGEST_MOTION_MS = 360
const SHEET_MARKER = 'au-framed--hero'

type Edge = 'deeper' | 'shallower' | 'across'
type Left = { entry?: string | undefined; door?: string | undefined }
type Point = { x: number; y: number }

const root = document.documentElement
const scrolls = new Map<string, number>()
const left = new Map<string, Left>()
const warmed = new Map<string, Promise<void>>()

let holders: HTMLElement[] = []
let origin: Origin | undefined
let scene: SheetScene | undefined
let pressed: Element | undefined
let heldClick: Point | undefined
let startedAt = 0
let latestTransition = 0
let shownUrl = window.location.pathname + window.location.search
let score: CSSStyleSheet | undefined
let running: ViewTransition | undefined

function pause(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function depthOf(page: Element | null | undefined): number | undefined {
  const depth = page?.getAttribute('data-depth')
  return depth ? Number(depth) : undefined
}

function edgeOf(visit: SwupVisit): Edge | undefined {
  const from = depthOf(document.querySelector(PAGE))
  const to = depthOf(visit.to.document?.querySelector(PAGE))
  if (from === undefined || to === undefined) return undefined
  if (to > from) return 'deeper'
  return to < from ? 'shallower' : 'across'
}

function clearNames(): void {
  for (const holder of holders) {
    holder.style.removeProperty('view-transition-name')
    holder.style.removeProperty('view-transition-class')
  }
  holders = []
}

function name(pieces: readonly NamedPiece[]): void {
  clearNames()
  for (const { element, name: pieceName, classes } of pieces) {
    element.style.setProperty('view-transition-name', pieceName)
    element.style.setProperty('view-transition-class', classes)
  }
  holders = pieces.map((piece) => piece.element)
}

function flightOf(plates: readonly HTMLElement[]): NamedPiece[] {
  return plates.map((element, index) => ({
    element,
    name: `au-flight-${index}`,
    classes: FLIGHT_CLASS,
  }))
}

function adoptScore(rules: string): void {
  score ??= new CSSStyleSheet()
  score.replaceSync(rules)
  if (!document.adoptedStyleSheets.includes(score)) {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, score]
  }
}

function dropScore(): void {
  if (!score) return
  document.adoptedStyleSheets = document.adoptedStyleSheets.filter((sheet) => sheet !== score)
}

function reset(): void {
  clearNames()
  dropScore()
  origin = undefined
  scene = undefined
  heldClick = undefined
  pressed?.removeAttribute('data-pressed')
  pressed = undefined
  root.removeAttribute('data-transit')
  root.removeAttribute('data-transit-book')
  root.removeAttribute('data-transit-sheet')
  root.removeAttribute('data-transit-held')
  root.style.removeProperty('--transit-flight')
  root.style.removeProperty('--transit-landed')
  putBookAway()
}

function isTransitionMotion(animation: Animation): boolean {
  const { effect } = animation
  return (
    effect instanceof KeyframeEffect && (effect.pseudoElement ?? '').startsWith('::view-transition')
  )
}

function putAwayWhenMotionEnds(transition: ViewTransition): void {
  const ticket = ++latestTransition
  running = transition
  const putAwayIfLatest = (): void => {
    if (ticket !== latestTransition) return
    putBookAway()
  }
  transition.ready.then(() => {
    const motions = root.getAnimations({ subtree: true }).filter(isTransitionMotion)
    void Promise.allSettled(motions.map((motion) => motion.finished)).then(putAwayIfLatest)
  }, putAwayIfLatest)
}

function watchTransitions(): void {
  const start = document.startViewTransition.bind(document)
  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    writable: true,
    value: (...args: Parameters<typeof start>): ViewTransition => {
      const transition = start(...args)
      putAwayWhenMotionEnds(transition)
      return transition
    },
  })
}

function press(visit: SwupVisit): void {
  const link = visit.trigger?.el?.closest('a')
  if (!link) return
  link.setAttribute('data-pressed', '')
  pressed = link
}

async function stylesheetsReady(next: Document): Promise<void> {
  const known = new Set(
    [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(
      (link) => link.href,
    ),
  )
  const missing = [...next.querySelectorAll<HTMLLinkElement>('head link[rel="stylesheet"]')]
    .map((link) => new URL(link.getAttribute('href') ?? '', window.location.href).href)
    .filter((href) => !known.has(href))
  await Promise.all(
    missing.map((href) => {
      const hint = document.createElement('link')
      hint.rel = 'preload'
      hint.as = 'style'
      hint.href = href
      const settled = new Promise<void>((resolve) => {
        hint.addEventListener('load', () => resolve(), { once: true })
        hint.addEventListener('error', () => resolve(), { once: true })
      })
      document.head.append(hint)
      return Promise.race([settled, pause(STYLESHEET_WAIT_MS)]).finally(() => hint.remove())
    }),
  )
}

async function prepare(visit: SwupVisit): Promise<void> {
  if (!visit.animation.animate) return
  const edge = edgeOf(visit)
  const next = visit.to.document
  if (!edge || !next) {
    visit.animation.animate = false
    return
  }
  await stylesheetsReady(next)
  if (visit.done) return
  root.dataset['transit'] = edge
  if (edge === 'deeper' && isInBook(visit.trigger?.el) && layOutBook()) {
    root.dataset['transitBook'] = 'close'
    return
  }
  const opening = visit.history.popstate
    ? sceneClosing(left.get(visit.to.url)?.entry, visit.from.url, next)
    : sceneOpening(visit.trigger?.el, next)
  if (opening) {
    scene = opening.scene
    root.dataset['transitSheet'] = scene.direction
    settleArrivals(opening.pieces)
    name(opening.pieces)
    return
  }
  origin = visit.history.popstate
    ? originGoingBack(next, visit.from.url)
    : originGoingIn(visit.trigger?.el, next)
  if (!origin) return
  name(flightOf(origin.pieces))
}

function markArrival(visit: SwupVisit): void {
  clearNames()
  const page = document.querySelector<HTMLElement>(PAGE)
  if (!page) return
  if (visit.animation.animate) page.toggleAttribute('data-transit-arrived', true)
  if (!visit.history.popstate) return
  page.toggleAttribute('data-transit-returned', true)
  const memory = left.get(visit.to.url)
  if (memory?.entry)
    document.querySelector<HTMLElement>(SELECT)?.setAttribute('data-select-return', memory.entry)
  if (memory?.door)
    document.querySelector<HTMLElement>(MENU)?.setAttribute('data-doors-return', memory.door)
}

async function pictureDecoded(piece: HTMLElement): Promise<boolean> {
  const picture = piece.querySelector('img')
  if (!picture || picture.complete || document.visibilityState === 'hidden') return true
  return Promise.race([
    picture.decode().then(
      () => true,
      () => false,
    ),
    pause(PICTURE_WAIT_MS).then(() => false),
  ])
}

function holdArrivals(milliseconds: number): void {
  const animations = document.querySelector(PAGE)?.getAnimations({ subtree: true }) ?? []
  for (const animation of animations) {
    animation.currentTime = Number(animation.currentTime ?? 0) - milliseconds
  }
}

function paceMotion(): void {
  const left = MOTION_BUDGET_MS - CAPTURE_MARGIN_MS - (performance.now() - startedAt)
  const motion = Math.min(LONGEST_MOTION_MS, Math.max(SHORTEST_MOTION_MS, left))
  root.style.setProperty('--transit-flight', `${Math.round(motion)}ms`)
}

function holdWhatStays(landing: readonly NamedPiece[], landed: number): void {
  for (const { element } of landing) element.toggleAttribute('data-transit-flown', true)
  root.style.setProperty('--transit-landed', `${landed}ms`)
  root.toggleAttribute('data-transit-held', true)
}

async function nameArrival(visit: SwupVisit): Promise<void> {
  shownUrl = visit.to.url
  if (!visit.animation.animate) return
  paceMotion()
  if (root.dataset['transitBook'] === 'close') {
    holdArrivals(BOOK_ARRIVALS_WAIT_MS)
    return
  }
  if (root.dataset['transit'] === 'shallower' && layOutBook()) {
    root.dataset['transitBook'] = 'open'
    return
  }
  if (scene) {
    const arrival = sceneArrival(scene)
    const card = arrival.find((piece) => piece.name === 'au-sheet-card-0')
    const decoded = !card || (await pictureDecoded(card.element))
    const shown = decoded
      ? arrival
      : arrival.filter((piece) => !/^au-sheet-(card|slab)-/.test(piece.name))
    settleArrivals(shown)
    adoptScore(scoreOf(scene, shown))
    name(shown)
    if (scene.direction === 'close') holdWhatStays(shown, landedAt(scene, shown))
    return
  }
  if (root.dataset['transit'] === 'deeper') root.toggleAttribute('data-transit-held', true)
  if (!origin) return
  const targets = targetsOf(origin)
  if (!targets) return
  for (const target of targets) target.toggleAttribute('data-transit-flown', true)
  name(flightOf(targets))
  root.toggleAttribute('data-transit-held', true)
}

function remember(visit: SwupVisit): void {
  scrolls.set(visit.from.url + (visit.from.hash ?? ''), window.scrollY)
  if (visit.history.popstate) return
  left.set(visit.from.url, { entry: currentEntry(visit.trigger?.el), door: litDoorPath() })
}

function restoreScroll(visit: SwupVisit): void {
  if (!visit.history.popstate) return
  const top = scrolls.get(visit.to.url + (visit.to.hash ?? ''))
  if (top !== undefined) window.scrollTo({ top, behavior: 'instant' })
}

function restoreSamePageScroll(swup: SwupInstance): void {
  if (swup.navigating) return
  const top = scrolls.get(window.location.pathname + window.location.search + window.location.hash)
  if (top !== undefined) {
    window.scrollTo({ top, behavior: 'instant' })
    return
  }
  swup.getAnchorElement(window.location.hash)?.scrollIntoView({ behavior: 'instant' })
}

function warmPicture(html: string | undefined): void {
  if (!html || warmed.size >= WARMED_LIMIT) return
  const at = html.indexOf(SHEET_MARKER)
  const tag = at === -1 ? undefined : html.slice(at).match(/<img\b[^>]*>/)?.[0]
  if (!tag) return
  const parsed = document.createElement('template')
  parsed.innerHTML = tag
  const source = parsed.content.querySelector('img')
  if (!source) return
  const key = source.getAttribute('srcset') ?? source.getAttribute('src') ?? ''
  if (warmed.has(key)) return
  const picture = new Image()
  picture.sizes = source.sizes
  picture.srcset = source.srcset
  picture.src = source.src
  warmed.set(
    key,
    picture.decode().catch(() => undefined),
  )
}

function keepFocusFree(visit: SwupVisit): void {
  const focus = visit.a11y?.focus
  if (visit.a11y && typeof focus === 'object' && focus.selector === 'body') {
    visit.a11y.focus = { selector: 'body', wait: false }
  }
}

function clickDuringVisit(swup: SwupInstance, event: MouseEvent): void {
  if (!swup.navigating) return
  if (event.detail >= 2) {
    event.preventDefault()
    event.stopImmediatePropagation()
    return
  }
  if (event.target === root && root.hasAttribute('data-transit')) {
    heldClick = { x: event.clientX, y: event.clientY }
    running?.skipTransition()
  }
}

function replayClick(point: Point): void {
  const under = document.elementFromPoint(point.x, point.y)
  const target = under?.closest('a, button, label, summary') ?? under
  if (target instanceof HTMLElement) target.click()
}

function endVisit(): void {
  const held = heldClick
  running = undefined
  reset()
  if (held) replayClick(held)
}

export function bindPageTransit(swup: SwupInstance): void {
  if (!swup.options.native) return

  window.history.scrollRestoration = 'manual'
  watchTransitions()
  window.addEventListener('click', (event) => clickDuringVisit(swup, event), { capture: true })
  window.addEventListener('popstate', () => restoreSamePageScroll(swup))
  window.addEventListener('pagehide', () => {
    window.history.scrollRestoration = 'auto'
  })
  window.addEventListener('pageshow', (event) => {
    window.history.scrollRestoration = 'manual'
    if (!event.persisted) return
    reset()
    resetLoading()
  })

  swup.hooks.before('history:popstate', (visit, { event }) => {
    visit.animation.animate = !event.hasUAVisualTransition && visit.to.url !== shownUrl
  })
  swup.hooks.before('link:anchor', () => {
    scrolls.set(
      window.location.pathname + window.location.search + window.location.hash,
      window.scrollY,
    )
  })
  swup.hooks.on('visit:start', (visit) => {
    startedAt = performance.now()
    remember(visit)
    keepFocusFree(visit)
    press(visit)
    if (visit.animation.animate) visit.animation.wait = true
  })
  swup.hooks.before('visit:transition', prepare)
  swup.hooks.on('content:replace', markArrival)
  swup.hooks.on('content:scroll', restoreScroll)
  swup.hooks.on('page:view', nameArrival)
  swup.hooks.on('page:preload', (_visit, { page }) => warmPicture(page?.html))
  swup.hooks.on('visit:end', endVisit)
  swup.hooks.on('visit:abort', reset)
  swup.hooks.before('visit:fail', reset)
}
