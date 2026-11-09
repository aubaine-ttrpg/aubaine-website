import { readdir } from 'node:fs/promises'
import { basename, extname, resolve } from 'node:path'
import { expect, type Locator, type Page, test } from '@playwright/test'

import { strings } from '../../src/lib/i18n/strings'
import { speciesLorePictures } from './support/lore-pictures'
import { plainPicturesSeen, storedGpu, watchPlainPictures } from './support/plain-pictures'

const root = resolve(import.meta.dirname, '../..')
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i
const HOST = '[data-almanach]'
const CANVAS = '.au-almanach__canvas'
const FR = strings('fr').almanachDevice
const EN = strings('en').almanachDevice

type LoreAlmanach = { readonly species: string; readonly picture: string; readonly onPage: number }

async function loreAlmanach(): Promise<LoreAlmanach> {
  const almanachs = (await speciesLorePictures()).filter(({ look }) => look?.kind === 'almanach')
  const [first] = almanachs
  if (!first) throw new Error('no species lore stands a picture in an almanach')
  return {
    species: first.species,
    picture: basename(first.source, extname(first.source)),
    onPage: almanachs.filter(({ species }) => species === first.species).length,
  }
}

async function mirroredAlmanachSpecies(): Promise<string> {
  const found = (await speciesLorePictures()).find(
    ({ look }) => look?.kind === 'almanach' && look.mirrored,
  )
  if (!found) throw new Error('no species lore mirrors a picture in an almanach')
  return found.species
}

async function focusedAlmanach(): Promise<{ species: string; picture: string; point: string }> {
  for (const { species, source, look } of await speciesLorePictures()) {
    if (look?.kind !== 'almanach' || look.focus === undefined) continue
    const point = look.focus.map((share) => `${Math.round(share * 100)}%`).join(' ')
    return { species, picture: basename(source, extname(source)), point }
  }
  throw new Error('no species lore keeps a point of an almanach picture in view')
}

function almanachOf(page: Page, picture: string): Locator {
  return page.locator(`${HOST}:has(> img[data-almanach-picture][src*="/${picture}."])`)
}

function figureOf(page: Page, host: Locator): Locator {
  return page.locator('figure').filter({ has: host })
}

async function refuseWebGl2(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        return kind === 'webgl2' ? null : Reflect.apply(original, this, [kind, ...rest])
      },
    })
  })
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

async function bringLit(host: Locator): Promise<void> {
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
    const { species, picture, onPage } = await loreAlmanach()
    await page.goto(`/fr/espece/${species}`)
    await expect(page.locator(HOST)).toHaveCount(onPage)
    await expect(page.locator(CANVAS)).toHaveCount(0)
    const host = almanachOf(page, picture)
    await bringLit(host)
    await expect(host.locator(CANVAS)).toHaveCount(1)
    await expect(host.locator('img[data-almanach-picture]')).toHaveAttribute('alt', /.+/)
    const controls = figureOf(page, host).getByRole('group', { name: FR.label, exact: true })
    await expect(controls.getByRole('button', { name: FR.powerOff })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(host.locator('.au-almanach__status')).toContainText(FR.showing(0, 1, ''))
    expect(errors).toEqual([])
  })

  test('on a browser that has drawn it, opens on the device and never on its picture', async ({
    page,
  }) => {
    await watchPlainPictures(page)
    const { species, picture } = await loreAlmanach()
    const path = `/fr/espece/${species}`
    await page.goto(path)
    const host = almanachOf(page, picture)
    const bottom = await host.evaluate(
      (node) => node.getBoundingClientRect().bottom + window.scrollY,
    )
    const width = page.viewportSize()?.width ?? 0
    await page.setViewportSize({ width, height: Math.ceil(bottom) })
    await expect(host).toHaveAttribute('data-almanach-lit', '', { timeout: 15_000 })
    expect(await storedGpu(page)).not.toBeNull()
    await page.goto(path)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    await expect(host).toHaveAttribute('data-almanach-lit', '', { timeout: 15_000 })
    expect(await plainPicturesSeen(page)).toEqual([])
  })

  test('speaks English on the English page', async ({ page }) => {
    const { species, picture } = await loreAlmanach()
    await page.goto(`/en/species/${species}`)
    const host = almanachOf(page, picture)
    await bringLit(host)
    const controls = figureOf(page, host).getByRole('group', { name: EN.label, exact: true })
    await expect(controls.getByRole('button', { name: EN.powerOff })).toBeVisible()
  })

  test('sets its buttons at the end of its caption line, like a banner pause', async ({ page }) => {
    const { species, picture } = await loreAlmanach()
    await page.goto(`/fr/espece/${species}`)
    const host = almanachOf(page, picture)
    await bringLit(host)
    const figure = figureOf(page, host)
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
    const { species, picture } = await loreAlmanach()
    await page.goto(`/fr/espece/${species}`)
    const host = almanachOf(page, picture)
    await bringLit(host)
    const controls = figureOf(page, host).getByRole('group', { name: FR.label, exact: true })
    await controls.getByRole('button', { name: FR.powerOff }).click()
    const power = controls.getByRole('button', { name: FR.powerOn })
    await expect(power).toHaveAttribute('aria-pressed', 'false')
    await expect(host.locator('.au-almanach__status')).toHaveText(FR.dark)
    await power.click()
    await expect(controls.getByRole('button', { name: FR.powerOff })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('leaves with its page on a Swup visit and comes back alone', async ({ page }) => {
    const { species, picture } = await loreAlmanach()
    await page.goto(`/fr/espece/${species}`)
    const host = almanachOf(page, picture)
    await bringLit(host)
    await page.locator('#site-header [data-nav="home"]').click()
    await expect(page).toHaveURL('/fr')
    await expect(page.locator(CANVAS)).toHaveCount(0)
    await page.goBack()
    await expect(page).toHaveURL(`/fr/espece/${species}`)
    await bringLit(host)
    await expect(host.locator(CANVAS)).toHaveCount(1)
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
    const { species, picture } = await loreAlmanach()
    await page.goto(`/fr/espece/${species}`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => Reflect.set(window, '__shifts', []))
    await bringLit(almanachOf(page, picture))
    await page.waitForTimeout(500)
    const shifts = await page.evaluate(() => {
      const value: unknown = Reflect.get(window, '__shifts')
      return Array.isArray(value) ? value.filter((shift) => typeof shift === 'number') : []
    })
    expect(shifts.reduce((sum, shift) => sum + shift, 0)).toBe(0)
  })

  test('prints its picture, without the tube or the controls', async ({ page }) => {
    const { species, picture } = await loreAlmanach()
    await page.goto(`/fr/espece/${species}`)
    const host = almanachOf(page, picture)
    await bringLit(host)
    await page.emulateMedia({ media: 'print' })
    await expect(host.locator(CANVAS)).toBeHidden()
    await expect(figureOf(page, host).locator('.au-almanach__controls')).toBeHidden()
    await expect(host.locator('img[data-almanach-picture]')).toHaveCSS('opacity', '1')
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
  await refuseWebGl2(page)
  const { species, picture } = await loreAlmanach()
  await page.goto(`/fr/espece/${species}`)
  const host = almanachOf(page, picture)
  await host.scrollIntoViewIfNeeded()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await expect(page.locator(CANVAS)).toHaveCount(0)
  await expect(page.locator('.au-almanach__controls')).toHaveCount(0)
  await expect(host.locator('img[data-almanach-picture]')).toBeVisible()
  expect(errors).toEqual([])
})

test('a mirrored picture stays mirrored without WebGL2 and in print', async ({ page }) => {
  await refuseWebGl2(page)
  await page.goto(`/fr/espece/${await mirroredAlmanachSpecies()}`)
  const picture = page.locator(`${HOST} > img[data-almanach-picture][data-mirrored]`)
  await picture.scrollIntoViewIfNeeded()
  await expect(picture).toBeVisible()
  await expect(picture).toHaveCSS('scale', '-1 1')
  await page.emulateMedia({ media: 'print' })
  await expect(picture).toHaveCSS('scale', '-1 1')
})

test('a picture keeps its point in view without WebGL2', async ({ page }) => {
  await refuseWebGl2(page)
  const { species, picture, point } = await focusedAlmanach()
  await page.goto(`/fr/espece/${species}`)
  const image = almanachOf(page, picture).locator('img[data-almanach-picture]')
  await image.scrollIntoViewIfNeeded()
  await expect(image).toBeVisible()
  await expect(image).toHaveCSS('object-position', point)
})

test('the build carries no Dev Hub', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.locator('#site-header [data-dev-hub]')).toHaveCount(0)
  const response = await page.goto('/fr/dev')
  expect(response?.status()).toBe(404)
  const built = await readdir(resolve(root, 'dist'), { recursive: true })
  expect(built.filter((path) => /(^|\/)dev(\/|$)|AlmanachWorkbench|dev-hub/.test(path))).toEqual([])
})
