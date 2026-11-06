import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, type Page, test } from '@playwright/test'

import { strings } from '../../src/lib/i18n/strings'

const root = resolve(import.meta.dirname, '../..')
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i
const HOST = '[data-almanach]'
const CANVAS = '.au-almanach__canvas'
const FR = strings('fr').almanachDevice
const EN = strings('en').almanachDevice

async function almanachSpecies(): Promise<string> {
  const directory = resolve(root, 'data/lore/species')
  for (const file of (await readdir(directory)).sort()) {
    if (!file.endsWith('.md') || file.endsWith('.en.md')) continue
    const text = await readFile(resolve(directory, file), 'utf8')
    if (/!\[[^\]]*]\([^)\s]+\s+"almanach(?: [a-z0-9-]+)?"\)/.test(text))
      return file.slice(0, -'.md'.length)
  }
  throw new Error('no species lore stands a picture in an almanach')
}

async function hardwareWebGl(page: Page): Promise<boolean> {
  await page.goto('/fr')
  const name = await page.evaluate(() => {
    const context = document
      .createElement('canvas')
      .getContext('webgl2', { failIfMajorPerformanceCaveat: true })
    if (!context) return 'none'
    const debug = context.getExtension('WEBGL_debug_renderer_info')
    return String(context.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : context.RENDERER))
  })
  return name !== 'none' && !SOFTWARE.test(name)
}

async function bringLit(page: Page): Promise<void> {
  const host = page.locator(HOST)
  await host.scrollIntoViewIfNeeded()
  await expect(host).toHaveAttribute('data-almanach-lit', '', { timeout: 15_000 })
}

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

test.describe('an almanach in the lore', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!(await hardwareWebGl(page)), 'no hardware WebGL2 here')
  })

  test('lights once it nears the screen, over its picture, with controls in French', async ({
    page,
  }) => {
    const errors = collectErrors(page)
    await page.goto(`/fr/espece/${await almanachSpecies()}`)
    await expect(page.locator(HOST)).toHaveCount(1)
    await expect(page.locator(`${HOST} > ${CANVAS}`)).toHaveCount(0)
    await bringLit(page)
    await expect(page.locator(`${HOST} > ${CANVAS}`)).toHaveCount(1)
    await expect(page.locator(`${HOST} > img[data-almanach-picture]`)).toHaveAttribute('alt', /.+/)
    const controls = page.getByRole('group', { name: FR.label, exact: true })
    await expect(controls.getByRole('button', { name: FR.powerOff })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.locator('.au-almanach__status')).toContainText(FR.showing(0, 1, ''))
    expect(errors).toEqual([])
  })

  test('speaks English on the English page', async ({ page }) => {
    await page.goto(`/en/species/${await almanachSpecies()}`)
    await bringLit(page)
    const controls = page.getByRole('group', { name: EN.label, exact: true })
    await expect(controls.getByRole('button', { name: EN.powerOff })).toBeVisible()
  })

  test('sets its buttons at the end of its caption line, like a banner pause', async ({ page }) => {
    await page.goto(`/fr/espece/${await almanachSpecies()}`)
    await bringLit(page)
    const figure = page.locator(`figure:has(${HOST})`)
    const line = await figure.evaluate((element) => {
      const caption = element.querySelector('figcaption')
      if (!caption) throw new Error('the almanach picture has no caption')
      const mark = getComputedStyle(caption, '::after')
      const box = caption.getBoundingClientRect()
      return {
        right: element.getBoundingClientRect().right,
        centre: box.bottom - Number.parseFloat(mark.blockSize) / 2,
      }
    })
    const buttons = await figure
      .locator('.au-almanach__button')
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect().toJSON()),
      )
    expect(buttons).toHaveLength(2)
    expect(buttons.at(-1)?.right).toBeCloseTo(line.right, 0)
    for (const button of buttons) {
      expect(button.top + button.height / 2).toBeCloseTo(line.centre, 0)
    }
  })

  test('turns off and on from its power button, and says so', async ({ page }) => {
    await page.goto(`/fr/espece/${await almanachSpecies()}`)
    await bringLit(page)
    const controls = page.getByRole('group', { name: FR.label, exact: true })
    await controls.getByRole('button', { name: FR.powerOff }).click()
    const power = controls.getByRole('button', { name: FR.powerOn })
    await expect(power).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('.au-almanach__status')).toHaveText(FR.dark)
    await power.click()
    await expect(controls.getByRole('button', { name: FR.powerOff })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('leaves with its page on a Swup visit and comes back alone', async ({ page }) => {
    const species = await almanachSpecies()
    await page.goto(`/fr/espece/${species}`)
    await bringLit(page)
    await page.locator('#site-header [data-nav="home"]').click()
    await expect(page).toHaveURL('/fr')
    await expect(page.locator(CANVAS)).toHaveCount(0)
    await page.goBack()
    await expect(page).toHaveURL(`/fr/espece/${species}`)
    await bringLit(page)
    await expect(page.locator(CANVAS)).toHaveCount(1)
  })

  test('shifts nothing on screen as it lights', async ({ page }) => {
    await page.addInitScript(() => {
      const shifts: number[] = []
      Reflect.set(window, '__shifts', shifts)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const value: unknown = Reflect.get(entry, 'value')
          if (typeof value === 'number') shifts.push(value)
        }
      }).observe({ type: 'layout-shift', buffered: false })
    })
    await page.goto(`/fr/espece/${await almanachSpecies()}`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => Reflect.set(window, '__shifts', []))
    await bringLit(page)
    await page.waitForTimeout(500)
    const shifts = await page.evaluate(() => {
      const value: unknown = Reflect.get(window, '__shifts')
      return Array.isArray(value) ? value.filter((shift) => typeof shift === 'number') : []
    })
    expect(shifts.reduce((sum, shift) => sum + shift, 0)).toBe(0)
  })

  test('prints its picture, without the tube or the controls', async ({ page }) => {
    await page.goto(`/fr/espece/${await almanachSpecies()}`)
    await bringLit(page)
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator(`${HOST} > ${CANVAS}`)).toBeHidden()
    await expect(page.locator('.au-almanach__controls')).toBeHidden()
    await expect(page.locator(`${HOST} > img[data-almanach-picture]`)).toHaveCSS('opacity', '1')
  })
})

test('a page without an almanach fetches none of it', async ({ page }) => {
  const fetched: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (/\/almanach\/v1\/|\/almanachs?\.[^/]*\.js$/.test(url)) fetched.push(url)
  })
  for (const path of ['/fr', '/fr/arbres', '/fr/espece/nnor']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  expect(fetched).toEqual([])
})

test('without WebGL2 the lore keeps its picture and logs nothing', async ({ page }) => {
  const errors = collectErrors(page)
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        return kind === 'webgl2' ? null : Reflect.apply(original, this, [kind, ...rest])
      },
    })
  })
  await page.goto(`/fr/espece/${await almanachSpecies()}`)
  await page.locator(HOST).scrollIntoViewIfNeeded()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await expect(page.locator(CANVAS)).toHaveCount(0)
  await expect(page.locator('.au-almanach__controls')).toHaveCount(0)
  await expect(page.locator(`${HOST} > img[data-almanach-picture]`)).toBeVisible()
  expect(errors).toEqual([])
})
