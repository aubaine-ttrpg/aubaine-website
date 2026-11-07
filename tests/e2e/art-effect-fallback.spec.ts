import { expect, type Page, test } from '@playwright/test'

import { pathFor } from '../../src/lib/i18n/routes'
import { corpus } from './support/corpus'
import { rememberGpu, storedGpu } from './support/plain-pictures'

const SPECIES = '/fr/espece/nnor'
const HERO = '[data-plate="hero"]'
const STAGE = '[data-stage]'
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i
const PIECES = '[data-drape], .au-prose__frame, [data-almanach]'
const HERALDRY_PLAIN = '[data-drape] > .au-heraldry__plain'
const PICTURES_UNDER_GLASS = '.au-prose__frame img, [data-almanach] > img[data-almanach-picture]'
const SHELL = /Base\.astro_astro_type_script/

async function giveFilmToTheHero(page: Page): Promise<void> {
  await page.addInitScript(() => {
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement && node.matches('[data-plate="hero"]')) {
            node.dataset['artEffect'] = 'film'
          }
        }
      }
    }).observe(document, { childList: true, subtree: true })
  })
}

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

async function heraldicSpecies(): Promise<string> {
  const species = (await corpus('fr')).species.find((entry) =>
    entry.subspecies.some((sub) => sub.heraldry),
  )
  if (!species) throw new Error('no species carries heraldry')
  return pathFor('speciesEntry', 'fr', { species: species.id })
}

test('without WebGL2 the hero keeps its picture and logs nothing', async ({ page }) => {
  const errors = collectErrors(page)
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        return kind === 'webgl2' ? null : Reflect.apply(original, this, [kind, ...rest])
      },
    })
  })
  await giveFilmToTheHero(page)
  await page.goto(SPECIES)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await expect(page.locator(`${HERO} > canvas`)).toHaveCount(0)
  await expect(page.locator(`${HERO} > img`)).toBeVisible()
  await expect(page.locator(`${STAGE} > canvas`)).toHaveCount(0)
  await expect(page.locator(STAGE)).not.toHaveAttribute('data-staged')
  expect(errors).toEqual([])
})

test('a software renderer keeps the plain picture', async ({ page }) => {
  await page.goto('/fr')
  const name = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return 'none'
    const debug = context.getExtension('WEBGL_debug_renderer_info')
    return String(context.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : context.RENDERER))
  })
  test.skip(!SOFTWARE.test(name), `this browser renders on ${name}`)
  const errors = collectErrors(page)
  await giveFilmToTheHero(page)
  await page.goto(SPECIES)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await expect(page.locator(`${HERO} > canvas`)).toHaveCount(0)
  await expect(page.locator(`${HERO} > img`)).toBeVisible()
  await expect(page.locator(`${STAGE} > canvas`)).toHaveCount(0)
  await expect(page.locator(STAGE)).not.toHaveAttribute('data-staged')
  expect(errors).toEqual([])
})

test('without WebGL2 the heraldry and a glazed picture keep their plain forms and log nothing', async ({
  page,
}) => {
  const errors = collectErrors(page)
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        return kind === 'webgl2' ? null : Reflect.apply(original, this, [kind, ...rest])
      },
    })
  })
  await page.goto(await heraldicSpecies())
  for (const holder of await page.locator('[data-drape], [data-relief="glass"]').all()) {
    await holder.scrollIntoViewIfNeeded()
  }
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  await expect(page.locator('[data-drape] canvas, [data-relief="glass"] canvas')).toHaveCount(0)
  await expect(page.locator('[data-drape] .au-heraldry__plain').first()).toBeVisible()
  for (const toggle of await page.locator('[data-drape-toggle]').all()) {
    await expect(toggle).toBeHidden()
  }
  expect(errors).toEqual([])
})

test('a browser that drew them but no longer can shows every plain picture and forgets', async ({
  page,
}) => {
  const errors = collectErrors(page)
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        return kind === 'webgl2' ? null : Reflect.apply(original, this, [kind, ...rest])
      },
    })
  })
  await page.goto('/fr')
  await rememberGpu(page, 'cloth')
  await page.goto(await heraldicSpecies())
  for (const piece of await page.locator(PIECES).all()) await piece.scrollIntoViewIfNeeded()
  for (const plain of await page.locator(HERALDRY_PLAIN).all()) await expect(plain).toBeVisible()
  for (const picture of await page.locator(PICTURES_UNDER_GLASS).all()) {
    await expect(picture).toHaveCSS('opacity', '1')
  }
  expect(await storedGpu(page)).toBeNull()
  expect(errors).toEqual([])
})

test('a browser that drew them shows the plain pictures when the site script fails to load', async ({
  page,
}) => {
  await page.goto('/fr')
  await rememberGpu(page, 'cloth')
  let blocked = 0
  await page.route(SHELL, (route) => {
    blocked += 1
    return route.abort()
  })
  await page.goto(await heraldicSpecies())
  expect(blocked).toBeGreaterThan(0)
  await expect(page.locator('html')).not.toHaveAttribute('data-lit-expected')
  const plain = page.locator(HERALDRY_PLAIN).first()
  await plain.scrollIntoViewIfNeeded()
  await expect(plain).toBeVisible()
})
