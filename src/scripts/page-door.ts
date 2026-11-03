import { doorOf, doorTo, isOnScreen } from './page-flight'
import { finishFinite, type NamedPiece } from './page-sheet'

const SCENE = '.au-plate-door__scene'
const BAND = '.au-plate-door__band'
const GIANT = '.au-plate-door__giant'
const SPOTLIGHT = '[data-spotlight]'
const PAST_THE_EDGE_PX = 8

export const DOOR_SCENE_NAME = 'au-door-scene'
export const SPOTLIGHT_NAME = 'au-spotlight'

export type Box = Pick<DOMRectReadOnly, 'left' | 'top' | 'bottom'>

export type LeavingBand = { piece: NamedPiece; band: DOMRect; away: number }
export type LeavingSpotlight = { piece: NamedPiece; box: DOMRect }
export type ReturningBand = { piece: NamedPiece; away: number }

export function besideBand(spotlight: Box, band: Box): boolean {
  return spotlight.left >= band.left && spotlight.top < band.bottom && spotlight.bottom > band.top
}

export function awayFrom(left: number, screenWidth: number): number {
  return Math.ceil(screenWidth - left) + PAST_THE_EDGE_PX
}

function piece(element: HTMLElement, name: string): NamedPiece {
  return { element, name, classes: '' }
}

function settleScenes(scope: ParentNode): void {
  for (const scene of scope.querySelectorAll(SCENE)) {
    finishFinite(scene.getAnimations({ subtree: true }))
  }
}

function shownScene(door: Element | undefined): { scene: HTMLElement; band: Element } | undefined {
  const scene = door?.querySelector<HTMLElement>(SCENE)
  const band = scene?.querySelector(BAND)
  return scene && band && isOnScreen(band) ? { scene, band } : undefined
}

function awayOf(scene: Element, band: Element): number {
  const giant = scene.querySelector(GIANT)
  const left = Math.min(
    band.getBoundingClientRect().left,
    giant?.getBoundingClientRect().left ?? Number.POSITIVE_INFINITY,
  )
  return awayFrom(left, window.innerWidth)
}

function shownSpotlight(): HTMLElement | undefined {
  const spotlight = document.querySelector<HTMLElement>(SPOTLIGHT)
  return spotlight && isOnScreen(spotlight) ? spotlight : undefined
}

export function bandLeaving(trigger: Element | undefined, next: Document): LeavingBand | undefined {
  if (!next.querySelector(SPOTLIGHT)) return undefined
  settleScenes(document)
  const shown = shownScene(doorOf(trigger))
  if (!shown) return undefined
  return {
    piece: piece(shown.scene, DOOR_SCENE_NAME),
    band: shown.band.getBoundingClientRect(),
    away: awayOf(shown.scene, shown.band),
  }
}

export function spotlightUncovered(band: Box): HTMLElement | undefined {
  const spotlight = shownSpotlight()
  return spotlight && besideBand(spotlight.getBoundingClientRect(), band) ? spotlight : undefined
}

export function spotlightPiece(spotlight: HTMLElement): NamedPiece {
  return piece(spotlight, SPOTLIGHT_NAME)
}

export function spotlightLeaving(next: Document, leaving: string): LeavingSpotlight | undefined {
  if (!doorTo(next, leaving)?.querySelector(SCENE)) return undefined
  const spotlight = shownSpotlight()
  if (!spotlight) return undefined
  finishFinite(spotlight.getAnimations({ subtree: true }))
  return { piece: spotlightPiece(spotlight), box: spotlight.getBoundingClientRect() }
}

export function bandReturning(leaving: string, spotlight: Box): ReturningBand | undefined {
  settleScenes(document)
  const shown = shownScene(doorTo(document, leaving))
  if (!shown || !besideBand(spotlight, shown.band.getBoundingClientRect())) return undefined
  return { piece: piece(shown.scene, DOOR_SCENE_NAME), away: awayOf(shown.scene, shown.band) }
}
