const DOOR = '[data-door]'
const DOOR_PLATE = '.au-plate-door__plate'
const TITLE_PLATE = '.au-plates__plate'
const ENTRY = '[data-entry]'
const SPOTLIGHT = '[data-spotlight]'
const OPEN_LINK = '[data-spotlight-open]'
const LEAST_SHOWN = 0.5
const SHAPE_TOLERANCE = 0.25

function words(plates: Iterable<Element>): string {
  return [...plates].map((plate) => plate.textContent?.trim() ?? '').join(' ')
}

export function pathOf(url: string): string {
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

export function doorOf(trigger: Element | undefined): Element | undefined {
  return trigger?.closest('a')?.closest(DOOR) ?? undefined
}

export function doorPathOf(trigger: Element | undefined): string | undefined {
  const link = doorOf(trigger)?.querySelector('a')
  return link ? pathOf(link.getAttribute('href') ?? '') : undefined
}

export function doorTo(scope: ParentNode, url: string): Element | undefined {
  const link = [...scope.querySelectorAll(`${DOOR} a`)].find(
    (each) => pathOf(each.getAttribute('href') ?? '') === pathOf(url),
  )
  return link?.closest(DOOR) ?? undefined
}

export type Origin = { words: string; pieces: HTMLElement[]; shapes: number[] }

function platesFromDoor(door: Element, next: Document): Origin | undefined {
  const plates = [...door.querySelectorAll<HTMLElement>(DOOR_PLATE)]
  if (plates.length === 0 || !plates.every(isOnScreen)) return undefined
  const titled = words(plates)
  if (titled !== words(next.querySelectorAll(TITLE_PLATE))) return undefined
  return { words: titled, pieces: plates, shapes: shapesOf(plates) }
}

export function originGoingIn(trigger: Element | undefined, next: Document): Origin | undefined {
  const door = doorOf(trigger)
  return door ? platesFromDoor(door, next) : undefined
}

export function originGoingBack(next: Document, leaving: string): Origin | undefined {
  const title = [...document.querySelectorAll<HTMLElement>(TITLE_PLATE)]
  if (title.length === 0 || !title.every(isOnScreen)) return undefined
  const door = doorTo(next, leaving)
  if (!door) return undefined
  const titled = words(title)
  if (titled !== words(door.querySelectorAll(DOOR_PLATE))) return undefined
  return { words: titled, pieces: title, shapes: shapesOf(title) }
}

function platesAtTarget(titled: string): HTMLElement[] | undefined {
  const title = [...document.querySelectorAll<HTMLElement>(TITLE_PLATE)]
  if (title.length > 0 && words(title) === titled) return title
  const door = [...document.querySelectorAll<HTMLElement>(DOOR)].find(
    (each) => words(each.querySelectorAll(DOOR_PLATE)) === titled,
  )
  const plates = door ? [...door.querySelectorAll<HTMLElement>(DOOR_PLATE)] : []
  return plates.length > 0 ? plates : undefined
}

export function targetsOf(origin: Origin): HTMLElement[] | undefined {
  const plates = platesAtTarget(origin.words)
  if (!plates?.every(isOnScreen)) return undefined
  return sameShapes(shapesOf(plates), origin.shapes) ? plates : undefined
}
