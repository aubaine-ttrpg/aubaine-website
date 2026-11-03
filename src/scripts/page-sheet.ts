import { pathOf } from './page-flight'
import { type PartKey, type SceneDirection, sceneEnd, sceneRules } from './page-score'

const SPOTLIGHT = '[data-spotlight]'
const PANEL = '[data-spotlight-panel]'
const OPEN_LINK = '[data-spotlight-open]'
const ENTRY = '[data-entry]'
const SHEET = '.au-character'
const ROSTER_CARD = '.au-framed__card'
const ROSTER = '.au-roster:not([hidden])'
const MOST_DEALT = 24

const PARTS = {
  ghost: '.au-ghost',
  kind: '.au-character__kind',
  rule: '.au-character__rule',
  badge: '.au-character__eyebrow .au-badge',
  name: '.au-character__name',
  subtitle: '.au-character__subtitle:not(.au-character__reserve)',
  sticker: '.au-character__descriptors:not(.au-character__reserve) .au-sticker',
  slab: '.au-framed__slab',
  card: '.au-framed__card',
  profile: '.au-rank',
  trait: '.au-trait',
} as const satisfies Record<PartKey, string>

const PART_KEYS = Object.keys(PARTS).filter((key): key is PartKey => key in PARTS)

export type NamedPiece = { element: HTMLElement; name: string; classes: string }

export type SheetScene = {
  direction: SceneDirection
  entry: string
  carried: ReadonlySet<string>
  leaving: readonly string[]
}

function touchesScreen(element: Element): boolean {
  if (!element.checkVisibility({ visibilityProperty: true })) return false
  const box = element.getBoundingClientRect()
  return (
    box.width > 0 &&
    box.height > 0 &&
    box.bottom > 0 &&
    box.top < window.innerHeight &&
    box.right > 0 &&
    box.left < window.innerWidth
  )
}

function partsIn(scope: Element): NamedPiece[] {
  return PART_KEYS.flatMap((key) =>
    [...scope.querySelectorAll<HTMLElement>(PARTS[key])]
      .filter(touchesScreen)
      .map((element, index) => ({
        element,
        name: `au-sheet-${key}-${index}`,
        classes: `au-flight au-part au-part-${key}`,
      })),
  )
}

function panelOf(entry: string): HTMLElement | null {
  const spotlight = document.querySelector<HTMLElement>(SPOTLIGHT)
  if (spotlight?.dataset['spotlightCurrent'] !== entry) return null
  return spotlight.querySelector<HTMLElement>(PANEL)
}

function rosterCardOf(entry: string): NamedPiece[] {
  const holder = document.querySelector(`${ENTRY}[data-entry="${CSS.escape(entry)}"]`)
  const card = holder?.querySelector<HTMLElement>(ROSTER_CARD)
  if (!card || !touchesScreen(card)) return []
  return [{ element: card, name: 'au-sheet-card-0', classes: 'au-flight au-part au-part-card' }]
}

function indexPartsOf(entry: string): NamedPiece[] {
  const panel = panelOf(entry)
  const parts = panel ? partsIn(panel) : []
  return parts.some((part) => part.name === 'au-sheet-card-0') ? parts : rosterCardOf(entry)
}

function centreOf(element: Element): { x: number; y: number } {
  const box = element.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

function dealtRoster(entry: string): NamedPiece[] {
  const chosen = document.querySelector(`${ENTRY}[data-entry="${CSS.escape(entry)}"]`)
  const from = chosen ? centreOf(chosen) : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  return [...document.querySelectorAll<HTMLElement>(ROSTER)]
    .filter(touchesScreen)
    .map((element) => {
      const centre = centreOf(element)
      return { element, away: Math.hypot(centre.x - from.x, centre.y - from.y) }
    })
    .sort((one, other) => one.away - other.away)
    .slice(0, MOST_DEALT)
    .map(({ element }, rank) => ({ element, name: `au-deal-${rank}`, classes: 'au-dealt' }))
}

function titleChrome(): NamedPiece[] {
  const one = (selector: string, name: string, classes: string): NamedPiece[] => {
    const element = document.querySelector<HTMLElement>(selector)
    return element && touchesScreen(element) ? [{ element, name, classes }] : []
  }
  return [
    ...one('.au-select__title .au-plates__title', 'au-title', 'au-chrome'),
    ...one('.au-select__title .au-plates__about', 'au-help', 'au-chrome'),
    ...one('.au-select__filter', 'au-filter', 'au-chrome'),
  ]
}

function entryChosen(link: Element): string | undefined {
  if (link.matches(OPEN_LINK)) {
    return document.querySelector<HTMLElement>(SPOTLIGHT)?.dataset['spotlightCurrent'] || undefined
  }
  return link.closest<HTMLElement>(ENTRY)?.dataset['entry']
}

function namesOf(pieces: readonly NamedPiece[]): string[] {
  return pieces.map((piece) => piece.name)
}

export function sceneOpening(
  trigger: Element | undefined,
  next: Document,
): { scene: SheetScene; pieces: NamedPiece[] } | undefined {
  const link = trigger?.closest('a')
  const entry = link ? entryChosen(link) : undefined
  if (!entry || !next.querySelector(`${SHEET} ${PARTS.card}`)) return undefined
  const parts = indexPartsOf(entry)
  if (parts.length === 0) return undefined
  const pieces = [...parts, ...titleChrome(), ...dealtRoster(entry)]
  return {
    scene: {
      direction: 'open',
      entry,
      carried: new Set(namesOf(parts)),
      leaving: namesOf(pieces),
    },
    pieces,
  }
}

export function sceneClosing(
  entry: string | undefined,
  leaving: string,
  next: Document,
): { scene: SheetScene; pieces: NamedPiece[] } | undefined {
  const sheet = document.querySelector(SHEET)
  if (!sheet || !entry) return undefined
  const home = next.querySelector(`${ENTRY}[data-entry="${CSS.escape(entry)}"] a`)
  if (pathOf(home?.getAttribute('href') ?? '') !== pathOf(leaving)) return undefined
  const parts = partsIn(sheet)
  if (parts.length === 0) return undefined
  return {
    scene: {
      direction: 'close',
      entry,
      carried: new Set(namesOf(parts)),
      leaving: namesOf(parts),
    },
    pieces: parts,
  }
}

export function sceneArrival(scene: SheetScene): NamedPiece[] {
  if (scene.direction === 'close') {
    const parts = indexPartsOf(scene.entry).filter((part) => scene.carried.has(part.name))
    return [...parts, ...titleChrome()]
  }
  const sheet = document.querySelector(SHEET)
  return sheet ? partsIn(sheet).filter((part) => scene.carried.has(part.name)) : []
}

export function finishFinite(animations: Iterable<Animation>): void {
  for (const animation of animations) {
    if (animation.effect?.getTiming().iterations !== Number.POSITIVE_INFINITY) animation.finish()
  }
}

export function settleArrivals(pieces: readonly NamedPiece[]): void {
  for (const { element } of pieces) finishFinite(element.getAnimations())
}

export function scoreOf(scene: SheetScene, arriving: readonly NamedPiece[]): string {
  return sceneRules(scene.direction, scene.leaving, namesOf(arriving))
}

export function landedAt(scene: SheetScene, arriving: readonly NamedPiece[]): number {
  return sceneEnd(scene.direction, namesOf(arriving))
}
