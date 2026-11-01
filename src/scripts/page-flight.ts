const DOOR = '[data-door]'
const DOOR_PLATE = '.au-plate-door__plate'
const TITLE_PLATE = '.au-plates__plate'
const ENTRY = '[data-entry]'
const ROSTER_CARD = '.au-framed__card'
const SHEET_CARD = '.au-character .au-framed__card'
const SPOTLIGHT = '[data-spotlight]'
const SPOTLIGHT_CARD = '[data-spotlight-panel] .au-framed__card'
const OPEN_LINK = '[data-spotlight-open]'
const LEAST_SHOWN = 0.5
const SHAPE_TOLERANCE = 0.25

export type Flight = { kind: 'plates'; words: string } | { kind: 'card' }

function words(plates: Iterable<Element>): string {
  return [...plates].map((plate) => plate.textContent?.trim() ?? '').join(' ')
}

function pathOf(url: string): string {
  return new URL(url, window.location.origin).pathname
}

export function isOnScreen(piece: Element): boolean {
  if (!piece.checkVisibility({ visibilityProperty: true, opacityProperty: true })) return false
  const box = piece.getBoundingClientRect()
  const shownWidth = Math.min(box.right, window.innerWidth) - Math.max(box.left, 0)
  const shownHeight = Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0)
  if (shownWidth <= 0 || shownHeight <= 0) return false
  return shownWidth * shownHeight >= box.width * box.height * LEAST_SHOWN
}

function shapesOf(plates: readonly HTMLElement[]): number[] {
  return plates.map((plate) => plate.offsetWidth / Math.max(1, plate.offsetHeight))
}

function sameShapes(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false
  return a.every((shape, index) => {
    const other = b[index]
    return other !== undefined && Math.abs(shape / other - 1) <= SHAPE_TOLERANCE
  })
}

function spotlightShows(entry: string): HTMLElement | null {
  const spotlight = document.querySelector<HTMLElement>(SPOTLIGHT)
  if (spotlight?.dataset['spotlightCurrent'] !== entry) return null
  const card = spotlight.querySelector<HTMLElement>(SPOTLIGHT_CARD)
  return card && isOnScreen(card) ? card : null
}

function rosterCard(entry: string): HTMLElement | null {
  const holder = document.querySelector<HTMLElement>(`${ENTRY}[data-entry="${CSS.escape(entry)}"]`)
  const card = holder?.querySelector<HTMLElement>(ROSTER_CARD)
  return card && isOnScreen(card) ? card : null
}

function entryOf(link: Element): string | undefined {
  if (link.matches(OPEN_LINK)) {
    return document.querySelector<HTMLElement>(SPOTLIGHT)?.dataset['spotlightCurrent'] || undefined
  }
  return link.closest<HTMLElement>(ENTRY)?.dataset['entry']
}

export function currentEntry(trigger: Element | undefined): string | undefined {
  const link = trigger?.closest('a')
  const chosen = link ? entryOf(link) : undefined
  return (
    chosen ??
    (document.querySelector<HTMLElement>(SPOTLIGHT)?.dataset['spotlightCurrent'] || undefined)
  )
}

export function litDoorPath(): string | undefined {
  const link = document.querySelector<HTMLAnchorElement>(`${DOOR}[data-lit] a`)
  return link?.pathname
}

export type Origin = { flight: Flight; pieces: HTMLElement[]; shapes: number[] }

function platesFromDoor(door: Element, next: Document): Origin | undefined {
  const plates = [...door.querySelectorAll<HTMLElement>(DOOR_PLATE)]
  if (plates.length === 0 || !plates.every(isOnScreen)) return undefined
  const titled = words(plates)
  if (titled !== words(next.querySelectorAll(TITLE_PLATE))) return undefined
  return { flight: { kind: 'plates', words: titled }, pieces: plates, shapes: shapesOf(plates) }
}

export function originGoingIn(trigger: Element | undefined, next: Document): Origin | undefined {
  const link = trigger?.closest('a')
  if (!link) return undefined
  const door = link.closest(DOOR)
  if (door) return platesFromDoor(door, next)
  const entry = entryOf(link)
  if (!entry || !next.querySelector(SHEET_CARD)) return undefined
  const card = spotlightShows(entry) ?? rosterCard(entry)
  return card ? { flight: { kind: 'card' }, pieces: [card], shapes: [] } : undefined
}

export function originGoingBack(
  next: Document,
  returning: { entry?: string | undefined; door?: string | undefined } | undefined,
  leaving: string,
): Origin | undefined {
  const sheetCard = document.querySelector<HTMLElement>(SHEET_CARD)
  if (sheetCard && isOnScreen(sheetCard) && returning?.entry) {
    const home = next.querySelector<HTMLAnchorElement>(
      `${ENTRY}[data-entry="${CSS.escape(returning.entry)}"] a`,
    )
    if (home && pathOf(home.getAttribute('href') ?? '') === pathOf(leaving)) {
      return { flight: { kind: 'card' }, pieces: [sheetCard], shapes: [] }
    }
  }
  const title = [...document.querySelectorAll<HTMLElement>(TITLE_PLATE)]
  if (title.length === 0 || !title.every(isOnScreen)) return undefined
  const door = [...next.querySelectorAll<HTMLAnchorElement>(`${DOOR} a`)].find(
    (link) => pathOf(link.getAttribute('href') ?? '') === pathOf(leaving),
  )
  if (!door) return undefined
  const titled = words(title)
  const doorPlates = door.closest(DOOR)?.querySelectorAll(DOOR_PLATE)
  if (!doorPlates || titled !== words(doorPlates)) return undefined
  return { flight: { kind: 'plates', words: titled }, pieces: title, shapes: shapesOf(title) }
}

function platesAtTarget(flight: Extract<Flight, { kind: 'plates' }>): HTMLElement[] | undefined {
  const title = [...document.querySelectorAll<HTMLElement>(TITLE_PLATE)]
  if (title.length > 0 && words(title) === flight.words) return title
  const door = [...document.querySelectorAll<HTMLElement>(DOOR)].find(
    (each) => words(each.querySelectorAll(DOOR_PLATE)) === flight.words,
  )
  const plates = door ? [...door.querySelectorAll<HTMLElement>(DOOR_PLATE)] : []
  return plates.length > 0 ? plates : undefined
}

function cardAtTarget(returning: string | undefined): HTMLElement | undefined {
  if (returning) return spotlightShows(returning) ?? rosterCard(returning) ?? undefined
  return document.querySelector<HTMLElement>(SHEET_CARD) ?? undefined
}

export function targetsOf(
  origin: Origin,
  returning: string | undefined,
): HTMLElement[] | undefined {
  if (origin.flight.kind === 'card') {
    const card = cardAtTarget(returning)
    return card && isOnScreen(card) ? [card] : undefined
  }
  const plates = platesAtTarget(origin.flight)
  if (!plates?.every(isOnScreen)) return undefined
  return sameShapes(shapesOf(plates), origin.shapes) ? plates : undefined
}
