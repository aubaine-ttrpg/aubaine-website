import { expect, type Page, test } from '@playwright/test'

const SPECIES = '/fr/espece/nnor'
const HERO = '[data-plate="hero"]'
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i

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
  expect(errors).toEqual([])
})
