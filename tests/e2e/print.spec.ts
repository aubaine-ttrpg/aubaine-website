import { expect, type Page, test } from '@playwright/test'

import { pathFor } from '../../src/lib/i18n/routes'
import { corpus } from './support/corpus'

const PLATED_PAGES = [
  pathFor('trees', 'fr'),
  pathFor('species', 'en'),
  pathFor('almanach', 'fr'),
  pathFor('books', 'en'),
  pathFor('bookCategory', 'fr', { category: 'rules' }),
  pathFor('bookCategory', 'en', { category: 'stories' }),
]
const WHOLE_STAGE_PAGES = [
  pathFor('trees', 'fr'),
  pathFor('species', 'en'),
  pathFor('almanach', 'fr'),
  pathFor('bookCategory', 'fr', { category: 'rules' }),
]
const WHITE_PAPER = 'rgb(255, 255, 255)'
const RINGS_ON_PAPER = 'rgba(20, 16, 10, 0.22)'
const A4_WIDTH = 794
const A4_ROOM_BELOW_THE_HEADER = 940

async function printDark(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ media: 'print' })
}

async function unreadText(page: Page, scope: string): Promise<string[]> {
  return page.evaluate((selector) => {
    type Colour = { r: number; g: number; b: number; a: number }
    const parse = (text: string): Colour => {
      const [r = 0, g = 0, b = 0, a = 1] = (text.match(/[\d.]+/g) ?? []).map(Number)
      return text.startsWith('color(srgb')
        ? { r: r * 255, g: g * 255, b: b * 255, a }
        : { r, g, b, a }
    }
    const over = (top: Colour, under: Colour): Colour => ({
      r: top.r * top.a + under.r * (1 - top.a),
      g: top.g * top.a + under.g * (1 - top.a),
      b: top.b * top.a + under.b * (1 - top.a),
      a: 1,
    })
    const luminance = ({ r, g, b }: Colour): number => {
      const channel = (value: number): number => {
        const v = value / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    }
    const contrast = (a: Colour, b: Colour): number => {
      const [high = 0, low = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x)
      return (high + 0.05) / (low + 0.05)
    }
    const groundOf = (start: Element): Colour | undefined => {
      const layers: Colour[] = []
      for (let node: Element | null = start; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.backgroundImage !== 'none') return undefined
        const colour = parse(style.backgroundColor)
        if (colour.a > 0) layers.push(colour)
        if (colour.a === 1) break
      }
      return layers.reduceRight((under, top) => over(top, under), parse('rgb(255, 255, 255)'))
    }
    const shown = (start: Element): boolean => {
      if (start.closest('[aria-hidden="true"], [hidden], [popover]')) return false
      for (let node: Element | null = start; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        if (style.display === 'none' || style.visibility === 'hidden') return false
      }
      return start.getBoundingClientRect().width > 0
    }
    const problems: string[] = []
    const root = document.querySelector(selector) ?? document.body
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      const words = text.textContent?.trim()
      const holder = text.parentElement
      if (!words || !holder || !shown(holder)) continue
      const ground = groundOf(holder)
      if (!ground) continue
      const style = getComputedStyle(holder)
      const size = Number.parseFloat(style.fontSize)
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700)
      const value = contrast(over(parse(style.color), ground), ground)
      if (value < (large ? 3 : 4.5)) problems.push(`${value.toFixed(2)} "${words.slice(0, 24)}"`)
    }
    return problems
  }, scope)
}

test.use({ colorScheme: 'dark', reducedMotion: 'reduce' })

for (const path of WHOLE_STAGE_PAGES) {
  test(`${path} prints on white paper with every word readable with background graphics on`, async ({
    page,
  }) => {
    await printDark(page, path)
    await expect(page.locator('[data-tip-root]')).toHaveCSS('background-color', WHITE_PAPER)
    expect(await unreadText(page, 'main')).toEqual([])
  })
}

test.describe('a character sheet with background graphics on', () => {
  for (const path of [
    pathFor('tree', 'fr', { tree: 'marchand' }),
    pathFor('speciesEntry', 'en', { species: 'drow' }),
  ]) {
    test(`${path} prints its sheet on white with every word readable`, async ({ page }) => {
      await printDark(page, path)
      await expect(page.locator('.au-character')).toHaveCSS('background-color', WHITE_PAPER)
      expect(await unreadText(page, '.au-character')).toEqual([])
    })
  }

  test('its profile keeps its rings on the white ground', async ({ page }) => {
    await printDark(page, pathFor('tree', 'fr', { tree: 'marchand' }))
    await expect(page.locator('.au-rank__spoke').first()).toHaveCSS('stroke', RINGS_ON_PAPER)
  })
})

test('a select screen prints its group marks without the tape and its filter count readable', async ({
  page,
}) => {
  await page.goto(pathFor('trees', 'en'))
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button').nth(1).click()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(page.locator('.au-filterbar__active')).toBeVisible()
  await page.emulateMedia({ media: 'print' })
  const mark = page.locator('.au-select__mark > span').first()
  await expect(mark).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(mark).toHaveCSS('box-shadow', 'none')
  expect(await unreadText(page, '.au-select__filter')).toEqual([])
})

for (const path of PLATED_PAGES) {
  test(`${path} sets its title plates straight, and they read`, async ({ page }) => {
    await printDark(page, path)
    const plates = page.locator('.au-plates__plate')
    expect(await plates.count()).toBeGreaterThan(0)
    for (const plate of await plates.all()) {
      await expect(plate).toHaveCSS('rotate', 'none')
    }
    expect(await unreadText(page, '.au-plates__title')).toEqual([])
  })
}

test.describe('on A4', () => {
  test.use({ viewport: { width: A4_WIDTH, height: 1123 } })

  test('every sheet fits below the header of its first page', async ({ page }) => {
    test.slow()
    const { trees, species } = await corpus('fr')
    for (const path of [
      ...trees.map((tree) => pathFor('tree', 'fr', { tree: tree.id })),
      ...species.map((entry) => pathFor('speciesEntry', 'fr', { species: entry.id })),
    ]) {
      await printDark(page, path)
      const box = await page.locator('.au-character').boundingBox()
      expect(box?.height, path).toBeLessThanOrEqual(A4_ROOM_BELOW_THE_HEADER)
      await page.emulateMedia({ media: 'screen' })
    }
  })
})
