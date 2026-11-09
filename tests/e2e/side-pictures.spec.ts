import { expect, type Page, test } from '@playwright/test'

import { isPortraitSource } from '../../src/lib/art-effect/almanach-look'
import { LOCALES } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'
import { speciesLorePictures } from './support/lore-pictures'

const SIDE = '.au-prose__side'

test.use({ reducedMotion: 'reduce' })

async function sideSpecies(): Promise<string> {
  const picture = (await speciesLorePictures()).find(({ source }) => isPortraitSource(source))
  if (!picture) throw new Error('no species lore holds a picture narrower than it is tall')
  return picture.species
}

type Box = { left: number; right: number; top: number; bottom: number }
type Layout = {
  side: Box
  picture: Box
  floatBottom: number
  lines: Box[]
  naturalWidth: number
  shownWidth: number
  ratio: number
  sideways: number
}

function layoutOf(page: Page): Promise<Layout> {
  return page
    .locator(SIDE)
    .first()
    .evaluate((side) => {
      const box = (rect: DOMRect) => ({
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      })
      const picture = side.firstElementChild
      const image = picture?.querySelector('img')
      if (!picture || !image) throw new Error('the side holds no picture')
      const lines: ReturnType<typeof box>[] = []
      for (const paragraph of [...side.children].slice(1)) {
        const leading = Number.parseFloat(getComputedStyle(paragraph).lineHeight)
        const range = document.createRange()
        range.selectNodeContents(paragraph)
        for (const rect of range.getClientRects()) {
          if (rect.width === 0) continue
          const half = (leading - rect.height) / 2
          lines.push({
            left: rect.left,
            right: rect.right,
            top: rect.top - half,
            bottom: rect.bottom + half,
          })
        }
      }
      const root = document.documentElement
      return {
        side: box(side.getBoundingClientRect()),
        picture: box(picture.getBoundingClientRect()),
        floatBottom:
          picture.getBoundingClientRect().bottom +
          Number.parseFloat(getComputedStyle(picture).marginBlockEnd),
        lines,
        naturalWidth: image.naturalWidth,
        shownWidth: image.getBoundingClientRect().width,
        ratio: window.devicePixelRatio,
        sideways: root.scrollWidth - root.clientWidth,
      }
    })
}

async function openedOnSide(page: Page, locale: (typeof LOCALES)[number]): Promise<void> {
  await page.goto(pathFor('speciesEntry', locale, { species: await sideSpecies() }))
  const side = page.locator(SIDE).first()
  await side.scrollIntoViewIfNeeded()
  await expect(side.locator('img').first()).toHaveJSProperty('complete', true)
}

for (const locale of LOCALES) {
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
    [768, 1024],
  ] as const) {
    test(`a portrait picture floats at the start of its text, which runs beside it then under it, on a ${width} px screen (${locale})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height })
      await openedOnSide(page, locale)
      const { side, picture, floatBottom, lines, naturalWidth, shownWidth, ratio, sideways } =
        await layoutOf(page)
      expect(Math.abs(picture.left - side.left)).toBeLessThanOrEqual(1)
      expect(Math.abs(picture.right - picture.left - 0.46 * (side.right - side.left))).toBeLessThan(
        1.5,
      )
      const beside = lines.filter((line) => line.left >= picture.right)
      expect(beside.length).toBeGreaterThan(0)
      for (const line of beside) expect(line.top).toBeLessThan(floatBottom)
      for (const line of lines.filter((each) => !beside.includes(each))) {
        expect(Math.abs(line.left - side.left)).toBeLessThanOrEqual(1)
        expect(line.top).toBeGreaterThanOrEqual(floatBottom - 0.5)
      }
      expect(naturalWidth).toBeLessThanOrEqual(2 * shownWidth * ratio)
      expect(sideways).toBe(0)
    })
  }

  for (const [width, height] of [
    [390, 844],
    [320, 568],
  ] as const) {
    test(`a portrait picture stands above its text on a ${width} px screen (${locale})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height })
      await openedOnSide(page, locale)
      const { side, picture, lines, sideways } = await layoutOf(page)
      const rem = await page.evaluate(() =>
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      )
      expect(Math.abs(picture.left - side.left)).toBeLessThanOrEqual(1)
      expect(picture.right - picture.left).toBeLessThanOrEqual(22 * rem + 0.5)
      expect(picture.right).toBeLessThanOrEqual(side.right + 0.5)
      for (const line of lines) expect(line.top).toBeGreaterThanOrEqual(picture.bottom)
      expect(sideways).toBe(0)
    })
  }
}
