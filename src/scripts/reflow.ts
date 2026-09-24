const MAX_LEAVES = 200

const COLUMNS = '[data-columns]'

type Unit = { el: Element; chain: Element[] }

export function unitsOf(cols: Element, wrappers: string): Unit[] {
  const units: Unit[] = []

  const walk = (parent: Element, chain: Element[]): void => {
    for (const el of Array.from(parent.children)) {
      if (wrappers && el.matches(wrappers)) {
        walk(el, [...chain, el])
        continue
      }
      units.push({ el, chain })
    }
  }

  walk(cols, [])
  return units
}

export function keepOnPage(fitted: number, keepWithNext: boolean[]): number {
  let kept = fitted
  while (kept > 1 && keepWithNext[kept - 1]) kept -= 1
  return Math.max(kept, 1)
}

function fittedCount(cols: Element, units: Unit[]): number {
  const limit = cols.getBoundingClientRect().right + 1
  let fitted = 0
  for (const unit of units) {
    const rects = Array.from(unit.el.getClientRects())
    if (rects.length === 0 || rects.some((rect) => rect.right > limit)) break
    fitted += 1
  }
  return fitted
}

function refill(target: Element, units: Unit[]): void {
  target.replaceChildren()
  const open: { original: Element; clone: Element }[] = []

  for (const { el, chain } of units) {
    let shared = 0
    while (
      shared < open.length &&
      shared < chain.length &&
      open[shared]?.original === chain[shared]
    ) {
      shared += 1
    }
    open.length = shared

    for (let depth = shared; depth < chain.length; depth += 1) {
      const source = chain[depth] as Element
      const clone = source.cloneNode(false) as Element
      const parent = depth > 0 ? open[depth - 1]?.clone : target
      ;(parent ?? target).appendChild(clone)
      open.push({ original: source, clone })
    }

    const last = open[open.length - 1]
    ;(last ? last.clone : target).appendChild(el)
  }
}

function paginateLeaf(sourceLeaf: Element, wrappers: string): void {
  const cols = sourceLeaf.querySelector(COLUMNS)
  if (!cols) return

  const units = unitsOf(cols, wrappers)
  if (units.length === 0) return
  if (cols.clientHeight <= 0) return

  const keepWithNext = units.map((unit) => getComputedStyle(unit.el).breakAfter === 'avoid')

  const leaves: Element[] = []
  let leaf = sourceLeaf
  let queue = units
  let first = 0

  while (queue.length > 0 && leaves.length < MAX_LEAVES) {
    const target = leaf.querySelector(COLUMNS)
    if (!target) break
    refill(target, queue)

    const fitted = fittedCount(target, queue)
    const kept =
      fitted >= queue.length ? queue.length : keepOnPage(fitted, keepWithNext.slice(first))

    if (kept < queue.length) refill(target, queue.slice(0, kept))
    leaves.push(leaf)

    queue = queue.slice(kept)
    first += kept
    if (queue.length > 0) {
      const next = sourceLeaf.cloneNode(true) as Element
      leaf.after(next)
      leaf = next
    }
  }
}

export function paginate(): void {
  for (const leaf of Array.from(document.querySelectorAll('[data-columns-page]'))) {
    paginateLeaf(leaf, leaf.getAttribute('data-unit-wrappers') ?? '')
  }
}

export function numberLeaves(): Map<Element, number> {
  const numbers = new Map<Element, number>()
  let at = 0
  for (const leaf of Array.from(document.querySelectorAll('.au-page'))) {
    if (!leaf.hasAttribute('data-numbered')) continue
    at += 1
    numbers.set(leaf, at)
    for (const folio of Array.from(leaf.querySelectorAll('[data-page-number]'))) {
      folio.textContent = String(at)
    }
  }
  return numbers
}

export function fillContents(numbers: Map<Element, number>): void {
  for (const row of Array.from(document.querySelectorAll('[data-contents-for]'))) {
    const id = row.getAttribute('data-contents-for')
    const target = id ? document.getElementById(id) : null
    const leaf = target?.closest('.au-page')
    const page = leaf ? numbers.get(leaf) : undefined
    row.textContent = page === undefined ? '' : String(page)
  }
}

export function padCount(leaves: number, multiple: number): number {
  if (multiple <= 1) return 0
  const remainder = leaves % multiple
  return remainder === 0 ? 0 : multiple - remainder
}

export function appendBlankLeaves(multiple: number): void {
  const anchor = document.querySelector('[data-print-anchor]')
  const leaves = document.querySelectorAll('.au-page').length
  const missing = padCount(leaves, multiple)
  for (let at = 0; at < missing; at += 1) {
    const blank = document.createElement('div')
    blank.className = 'au-page'
    if (anchor) anchor.before(blank)
    else document.body.append(blank)
  }
}
