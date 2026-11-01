const SHEET = '.au-sommaire__sheet'
const TITLE = '.au-sommaire__title'
const TITLE_PLATE = '.au-plates__plate'
const FLOWN = 'data-transit-flown'
const LIST = '.au-sommaire__list'
const HIDDEN = 'data-book-hidden'
const CREST = '[data-shell-header] a svg'
const SIDES = ['left', 'right'] as const

export const BOOK_ARRIVALS_WAIT_MS = 270

function isSpread(sheet: Element): boolean {
  const list = sheet.querySelector(LIST)
  if (!list) return false
  return getComputedStyle(list).gridTemplateColumns.trim().split(/\s+/).length > 1
}

function placed(leaf: HTMLElement, host: Element, sheet: HTMLElement, side: string): HTMLElement {
  const box = sheet.getBoundingClientRect()
  const origin = host.getBoundingClientRect()
  leaf.classList.add('au-book-leaf', `au-book-leaf--${side}`)
  leaf.setAttribute('aria-hidden', 'true')
  leaf.inert = true
  leaf.style.left = `${box.left - origin.left}px`
  leaf.style.top = `${box.top - origin.top}px`
  leaf.style.width = `${box.width}px`
  leaf.style.height = `${box.height}px`
  return leaf
}

function leafOf(host: Element, sheet: HTMLElement, side: string): HTMLElement {
  const leaf = sheet.cloneNode(true)
  if (!(leaf instanceof HTMLElement)) throw new Error('a book page could not be copied')
  leaf.querySelector(TITLE)?.remove()
  for (const named of leaf.querySelectorAll('[id], [popover], [popovertarget]')) {
    if (named.hasAttribute('popover')) {
      named.remove()
      continue
    }
    named.removeAttribute('id')
    named.removeAttribute('popovertarget')
  }
  return placed(leaf, host, sheet, side)
}

export function layOutBook(): boolean {
  const sheet = document.querySelector<HTMLElement>(SHEET)
  const host = sheet?.offsetParent
  if (!sheet || !host || !isSpread(sheet)) return false
  for (const arrival of sheet.getAnimations()) arrival.finish()
  for (const side of SIDES) host.append(leafOf(host, sheet, side))
  const back = placed(document.createElement('div'), host, sheet, 'back')
  const crest = document.querySelector(CREST)?.cloneNode(true)
  if (crest instanceof SVGElement) {
    crest.classList.add('au-book-leaf__crest')
    back.append(crest)
  }
  host.append(back)
  sheet.toggleAttribute(HIDDEN, true)
  for (const plate of sheet.querySelectorAll(TITLE_PLATE)) plate.toggleAttribute(FLOWN, true)
  return true
}

export function putBookAway(): void {
  for (const leaf of document.querySelectorAll('.au-book-leaf')) leaf.remove()
  document.querySelector(SHEET)?.removeAttribute(HIDDEN)
}

export function isInBook(trigger: Element | undefined): boolean {
  const sheet = trigger?.closest<HTMLElement>(SHEET)
  return sheet ? isSpread(sheet) : false
}
