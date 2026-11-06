import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, type Page, test } from '@playwright/test'

import { LOCALES, type Locale } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'

const SIZES = [
  { width: 1512, height: 860 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
] as const

async function speciesWithQuotes(): Promise<string[]> {
  const directory = resolve(import.meta.dirname, '../../data/lore/species')
  const quoted: string[] = []
  for (const file of await readdir(directory)) {
    if (!file.endsWith('.md') || file.endsWith('.en.md')) continue
    const lines = (await readFile(resolve(directory, file), 'utf8')).split('\n')
    if (lines.some((line) => line.startsWith('> '))) quoted.push(file.replace(/\.md$/, ''))
  }
  return quoted
}

async function speciesWithPortraits(): Promise<string[]> {
  const directory = resolve(import.meta.dirname, '../../data/lore/species')
  const portrayed: string[] = []
  for (const file of await readdir(directory)) {
    if (!file.endsWith('.md') || file.endsWith('.en.md')) continue
    const lines = (await readFile(resolve(directory, file), 'utf8')).split('\n')
    if (lines.some((line) => line.startsWith('> ![]('))) portrayed.push(file.replace(/\.md$/, ''))
  }
  return portrayed
}

async function openQuote(page: Page, species: string, locale: Locale): Promise<void> {
  await page.goto(pathFor('speciesEntry', locale, { species }))
  await page.evaluate(() =>
    Promise.all([
      document.fonts.ready,
      ...[...document.images].map((image) => image.decode().catch(() => undefined)),
    ]),
  )
  await expect(page.locator('figure.au-quote').first()).toBeVisible()
}

function collisions(): string[] {
  const CONTOUR = 5.5
  const found: string[] = []
  type Box = { left: number; right: number; top: number; bottom: number }
  type Point = { x: number; y: number }
  const viewport = document.documentElement.clientWidth
  if (document.documentElement.scrollWidth - viewport !== 0) found.push('the page scrolls sideways')

  const overlap = (one: Box, other: Box): boolean =>
    Math.min(one.right, other.right) > Math.max(one.left, other.left) &&
    Math.min(one.bottom, other.bottom) > Math.max(one.top, other.top)

  const length = (value: string, size: number): number => {
    const terms = value.replace(/^calc\((.*)\)$/, '$1').match(/[-+]?\s*[\d.]+(?:px|%)/g) ?? []
    return terms.reduce((sum, term) => {
      const amount = Number.parseFloat(term.replace(/\s+/g, ''))
      return sum + (term.endsWith('%') ? (amount / 100) * size : amount)
    }, 0)
  }

  const outline = (shape: Element): Point[] => {
    const box = shape.getBoundingClientRect()
    const corners = getComputedStyle(shape).clipPath.replace(/^polygon\((.*)\)$/, '$1')
    return corners.split(/,(?![^(]*\))/).map((corner) => {
      const [x = '0', y = '0'] = corner.trim().split(/\s+(?![^(]*\))/)
      return { x: box.left + length(x, box.width), y: box.top + length(y, box.height) }
    })
  }

  const turning = (shape: Point[]): number =>
    Math.sign(
      shape.reduce((sum, from, index) => {
        const to = shape[(index + 1) % shape.length] ?? from
        return sum + (from.x * to.y - to.x * from.y)
      }, 0),
    )

  const depthInside = (point: Point, shape: Point[]): number =>
    Math.min(
      ...shape.map((from, index) => {
        const to = shape[(index + 1) % shape.length] ?? from
        const run = Math.hypot(to.x - from.x, to.y - from.y)
        return (
          (turning(shape) *
            ((to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x))) /
          run
        )
      }),
    )

  const linesOf = (speaking: Element): DOMRect[] => {
    const lines: DOMRect[] = []
    const walker = document.createTreeWalker(speaking, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      if (!node.textContent?.trim()) continue
      const hidden =
        '.au-quote__mark, [data-quote="dialogue"] :is(.au-quote__colon, p > strong:first-of-type)'
      if (node.parentElement?.closest(hidden)) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      lines.push(...[...range.getClientRects()].filter((line) => line.width > 0))
    }
    return lines
  }

  const markInk = (quote: Element): Box | undefined => {
    const mark = getComputedStyle(quote, '::after')
    if (mark.content === 'none' || mark.content === 'normal') return undefined
    const size = Number.parseFloat(mark.fontSize)
    const pen = document.createElement('canvas').getContext('2d')
    if (!pen) return undefined
    pen.font = `${mark.fontWeight} ${size}px ${mark.fontFamily}`
    const glyph = pen.measureText('“')
    const ascent = glyph.fontBoundingBoxAscent
    const baseline = (size - (ascent + glyph.fontBoundingBoxDescent)) / 2 + ascent
    const frame = quote.getBoundingClientRect()
    const width = glyph.actualBoundingBoxLeft + glyph.actualBoundingBoxRight
    const left =
      mark.left === 'auto'
        ? frame.right - Number.parseFloat(mark.right) - width
        : frame.left + Number.parseFloat(mark.left) - glyph.actualBoundingBoxLeft
    const top = frame.top + Number.parseFloat(mark.top) + baseline
    const stroke = Number.parseFloat(mark.webkitTextStrokeWidth) / 2
    const [shadowX = 0, shadowY = 0] = (mark.textShadow.match(/-?[\d.]+px/g) ?? []).map((offset) =>
      Number.parseFloat(offset),
    )
    return {
      left: left - stroke + Math.min(0, shadowX),
      right: left + width + stroke + Math.max(0, shadowX),
      top: top - glyph.actualBoundingBoxAscent - stroke + Math.min(0, shadowY),
      bottom: top + glyph.actualBoundingBoxDescent + stroke + Math.max(0, shadowY),
    }
  }

  for (const figure of document.querySelectorAll('figure.au-quote')) {
    const where = location.pathname
    const title = figure.querySelector(':scope > figcaption')?.getBoundingClientRect()
    const frame = figure.getBoundingClientRect()
    if (frame.left < 0 || frame.right > viewport)
      found.push(`${where}: the quote leaves the screen`)
    if (title && (title.left < 0 || title.right > viewport))
      found.push(`${where}: the title leaves the screen`)
    const quote = figure.querySelector(':scope > blockquote')
    if (!quote) continue
    const speeches =
      figure.getAttribute('data-quote') === 'dialogue'
        ? [...quote.querySelectorAll(':scope > p[data-speaker]')]
        : [quote]
    const mark = markInk(quote)
    if (mark && title && overlap(mark, title))
      found.push(`${where}: the quotation mark covers the title`)
    const portraitSizes = new Set(
      [...quote.querySelectorAll(':scope > p > .au-quote__portrait')].map((portrait) =>
        Math.round(portrait.getBoundingClientRect().height),
      ),
    )
    if (portraitSizes.size > 1) found.push(`${where}: the portraits differ in size`)
    for (const speech of speeches) {
      const shape = speech.querySelector(':scope > .au-quote__box')
      if (!shape) {
        found.push(`${where}: a speech has no box`)
        continue
      }
      const box = outline(shape)
      const tag = speech.querySelector(':scope > strong')?.getBoundingClientRect()
      if (tag && (tag.left < 0 || tag.right > viewport))
        found.push(`${where}: a name tag leaves the screen`)
      if (tag && title && overlap(tag, title)) found.push(`${where}: a name tag covers the title`)
      const portrait = speech.querySelector(':scope > .au-quote__portrait')?.getBoundingClientRect()
      if (portrait && (portrait.left < 0 || portrait.right > viewport))
        found.push(`${where}: a portrait leaves the screen`)
      if (portrait && tag && overlap(portrait, tag))
        found.push(`${where}: a portrait covers its name tag`)
      if (portrait && title && overlap(portrait, title))
        found.push(`${where}: a portrait covers the title`)
      for (const other of speeches) {
        if (portrait && other !== speech && overlap(portrait, other.getBoundingClientRect()))
          found.push(`${where}: a portrait covers another turn`)
      }
      for (const line of linesOf(speech)) {
        const corners = [
          { x: line.left, y: line.top },
          { x: line.right, y: line.top },
          { x: line.right, y: line.bottom },
          { x: line.left, y: line.bottom },
        ]
        const depth = Math.min(...corners.map((corner) => depthInside(corner, box)))
        if (depth < CONTOUR)
          found.push(
            `${where}: a line comes ${depth.toFixed(1)}px from its box's edge, inside the contour`,
          )
        if (title && overlap(line, title)) found.push(`${where}: the title covers a line`)
        if (tag && overlap(line, tag)) found.push(`${where}: a name tag covers a line`)
        if (mark && overlap(line, mark)) found.push(`${where}: the quotation mark covers a line`)
        if (portrait && overlap(line, portrait)) found.push(`${where}: a portrait covers a line`)
      }
    }
  }
  return found
}

for (const { width, height } of SIZES) {
  test(`every lore quote keeps its lines inside its box and clear of its title, tags, mark and portraits at ${width}x${height}`, async ({
    page,
  }) => {
    test.slow()
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const quoted = await speciesWithQuotes()
    expect(quoted.length, 'no species lore holds a quote').toBeGreaterThan(0)
    for (const locale of LOCALES) {
      for (const species of quoted) {
        await openQuote(page, species, locale)
        expect(await page.evaluate(collisions), `${species} in ${locale}`).toEqual([])
      }
    }
  })
}

test('a lore quote stands its title at the corner its source names', async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 860 })
  for (const species of await speciesWithQuotes()) {
    await openQuote(page, species, 'fr')
    const placed = await page.evaluate(() =>
      [...document.querySelectorAll('figure.au-quote[data-title-corner]')].map((figure) => {
        const corner = figure.getAttribute('data-title-corner') ?? ''
        const frame = figure.getBoundingClientRect()
        const title = figure.querySelector(':scope > figcaption')?.getBoundingClientRect()
        const middle = (box: DOMRect | undefined, axis: 'x' | 'y'): number =>
          box ? (axis === 'x' ? box.left + box.width / 2 : box.top + box.height / 2) : Number.NaN
        return {
          corner,
          vertical: middle(title, 'y') < middle(frame, 'y') ? 'top' : 'bottom',
          horizontal: middle(title, 'x') < middle(frame, 'x') ? 'left' : 'right',
        }
      }),
    )
    expect(placed.length, `${species} names no corner`).toBeGreaterThan(0)
    for (const { corner, vertical, horizontal } of placed) {
      expect(`${vertical}-${horizontal}`, species).toBe(corner)
    }
  }
})

test('a lore quote prints and shows in forced colours as plain text, its quotation marks back', async ({
  page,
}) => {
  const [species] = await speciesWithQuotes()
  if (!species) throw new Error('no species lore holds a quote')
  const plainModes = [
    { media: 'print', forcedColors: 'none' },
    { media: 'screen', forcedColors: 'active' },
  ] as const
  for (const media of plainModes) {
    await page.emulateMedia(media)
    await openQuote(page, species, 'fr')
    const marks = page.locator('figure.au-quote .au-quote__mark')
    await expect(marks.first()).toBeVisible()
    expect((await marks.first().boundingBox())?.width ?? 0).toBeGreaterThan(1)
    await expect(page.locator('figure.au-quote .au-quote__box').first()).toHaveCSS(
      'position',
      'static',
    )
  }
})

test('a dialogue shows its portraits on screen and leaves them out of print and forced colours', async ({
  page,
}) => {
  const [species] = await speciesWithPortraits()
  if (!species) throw new Error('no species lore gives a dialogue a portrait')
  await openQuote(page, species, 'fr')
  const portraits = page.locator('figure.au-quote .au-quote__portrait')
  await expect(portraits.first()).toBeVisible()
  const plainModes = [
    { media: 'print', forcedColors: 'none' },
    { media: 'screen', forcedColors: 'active' },
  ] as const
  for (const media of plainModes) {
    await page.emulateMedia(media)
    await expect(portraits.first()).toBeHidden()
  }
})
