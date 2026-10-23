import { expect, type Page, test } from '@playwright/test'

const SPECIES = '/fr/espece/nnor'
const SPECIES_INDEX = '/fr/especes'
const HERO = '[data-plate="hero"]'
const CARD = '[data-plate="card"]'
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i

type Effect = 'film' | 'oil'

test.use({ channel: 'chromium' })

async function giveEffect(
  page: Page,
  effect: Effect,
  plates: Array<'hero' | 'card'>,
): Promise<void> {
  await page.addInitScript(
    ({ effect, plates }) => {
      const selector = plates.map((plate) => `[data-plate="${plate}"]`).join(',')
      const stamp = (root: ParentNode): void => {
        for (const plate of root.querySelectorAll<HTMLElement>(selector)) {
          plate.dataset['artEffect'] = effect
        }
      }
      new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (!(node instanceof HTMLElement)) continue
            if (node.matches(selector)) node.dataset['artEffect'] = effect
            stamp(node)
          }
        }
      }).observe(document, { childList: true, subtree: true })
    },
    { effect, plates },
  )
}

async function countGl(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const counted = window as unknown as { glContexts: WebGL2RenderingContext[]; glDraws: number }
    counted.glContexts = []
    counted.glDraws = 0
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        const context: unknown = Reflect.apply(original, this, [kind, ...rest])
        if (kind === 'webgl2' && context instanceof WebGL2RenderingContext)
          counted.glContexts.push(context)
        return context
      },
    })
    const draw = WebGL2RenderingContext.prototype.drawArrays
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      counted.glDraws += 1
      return draw.apply(this, args)
    }
  })
}

function gl(page: Page): Promise<{ contexts: number; lost: number; draws: number }> {
  return page.evaluate(() => {
    const counted = window as unknown as { glContexts: WebGL2RenderingContext[]; glDraws: number }
    return {
      contexts: counted.glContexts.length,
      lost: counted.glContexts.filter((context) => context.isContextLost()).length,
      draws: counted.glDraws,
    }
  })
}

test.beforeEach(async ({ page }) => {
  await page.goto('/fr')
  const name = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return 'none'
    const debug = context.getExtension('WEBGL_debug_renderer_info')
    return String(context.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : context.RENDERER))
  })
  test.skip(SOFTWARE.test(name) || name === 'none', `no hardware WebGL2 here (${name})`)
})

test('without an effect a page never fetches the effect code', async ({ page }) => {
  const fetched: string[] = []
  page.on('request', (request) => {
    if (/\/(plates|studio)\.[^/]*\.js$/.test(request.url())) fetched.push(request.url())
  })
  for (const path of [SPECIES, SPECIES_INDEX, '/fr/arbre/marchand']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('[data-plate] > canvas')).toHaveCount(0)
  }
  expect(fetched).toEqual([])
})

test('an effect develops the hero over its picture at once, without a fade', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await giveEffect(page, 'film', ['hero'])
  await page.goto(SPECIES)
  const canvas = page.locator(`${HERO}[data-developed] > canvas`)
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toHaveAttribute('aria-hidden', 'true')
  await expect(page.locator(`${HERO}[data-developed] > img`)).toBeHidden()
  expect(await canvas.evaluate((node) => getComputedStyle(node).transitionDuration)).toBe('0s')
  expect(errors).toEqual([])
})

test('every card of an index develops on one shared context', async ({ page }) => {
  await countGl(page)
  await giveEffect(page, 'oil', ['card'])
  await page.setViewportSize({ width: 1440, height: 2400 })
  await page.goto(SPECIES_INDEX)
  const cards = await page.locator(CARD).count()
  expect(cards).toBeGreaterThan(10)
  await expect(page.locator(`${CARD}[data-developed] > canvas`)).toHaveCount(cards, {
    timeout: 30_000,
  })
  expect((await gl(page)).contexts).toBe(1)
})

test('the effect follows a Swup visit, and comes back after leaving', async ({ page }) => {
  await giveEffect(page, 'film', ['hero'])
  await page.goto('/fr')
  await page.waitForFunction(() => 'swup' in window)
  await page.evaluate(() => document.documentElement.setAttribute('data-same-document', ''))
  const visit = async (path: string): Promise<void> => {
    await page.evaluate((target) => {
      const swup = (window as unknown as { swup: { navigate: (url: string) => void } }).swup
      swup.navigate(target)
    }, path)
    await expect(page).toHaveURL(path)
  }
  await visit(SPECIES)
  await expect(page.locator(`${HERO}[data-developed] > canvas`)).toHaveCount(1)
  await visit('/fr')
  await expect(page.locator('[data-plate] > canvas')).toHaveCount(0)
  await visit(SPECIES)
  await expect(page.locator(`${HERO}[data-developed] > canvas`)).toHaveCount(1)
  await expect(page.locator('html')).toHaveAttribute('data-same-document', '')
})

test('a tree node visit keeps the developed hero', async ({ page }) => {
  await giveEffect(page, 'film', ['hero'])
  await page.goto('/fr/arbre/barbare#arbre')
  await expect(page.locator(`${HERO}[data-developed] > canvas`)).toHaveCount(1)
  await page.evaluate(() =>
    document.querySelector('[data-plate] > canvas')?.setAttribute('data-kept', ''),
  )
  await page.locator('[data-plate-node][data-node="TOURBI-001"]').click()
  await expect(page).toHaveURL('/fr/arbre/barbare/TOURBI-001#arbre')
  await expect(page.locator(`${HERO} > canvas[data-kept]`)).toHaveCount(1)
})

test('the film grain moves on the hero only while it is on screen', async ({ page }) => {
  await countGl(page)
  await giveEffect(page, 'film', ['hero'])
  await page.goto(SPECIES)
  await expect(page.locator(`${HERO}[data-developed] > canvas`)).toHaveCount(1)
  const first = (await gl(page)).draws
  await page.waitForTimeout(1000)
  const moving = (await gl(page)).draws - first
  expect(moving).toBeGreaterThanOrEqual(15)
  expect(moving).toBeLessThanOrEqual(30)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  const away = (await gl(page)).draws
  await page.waitForTimeout(1000)
  expect((await gl(page)).draws - away).toBe(0)
})

test('cards hold their grain still', async ({ page }) => {
  await countGl(page)
  await giveEffect(page, 'film', ['card'])
  await page.goto(SPECIES_INDEX)
  await expect(page.locator(`${CARD}[data-developed] > canvas`).first()).toBeVisible()
  await page.waitForTimeout(1500)
  const settled = (await gl(page)).draws
  await page.waitForTimeout(1000)
  expect((await gl(page)).draws - settled).toBe(0)
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the film grain holds still', async ({ page }) => {
    await countGl(page)
    await giveEffect(page, 'film', ['hero'])
    await page.goto(SPECIES)
    await expect(page.locator(`${HERO}[data-developed] > canvas`)).toHaveCount(1)
    await page.waitForTimeout(300)
    const settled = (await gl(page)).draws
    await page.waitForTimeout(1000)
    expect((await gl(page)).draws - settled).toBe(0)
  })
})

test('a lost context keeps the developed picture, and the next development recovers', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))
  await countGl(page)
  await giveEffect(page, 'film', ['hero'])
  await page.goto(SPECIES)
  await expect(page.locator(`${HERO}[data-developed] > canvas`)).toHaveCount(1)
  await page.waitForTimeout(1500)
  await page.evaluate(() => {
    const counted = window as unknown as { glContexts: WebGL2RenderingContext[] }
    for (const context of counted.glContexts)
      context.getExtension('WEBGL_lose_context')?.loseContext()
  })
  await expect.poll(async () => (await gl(page)).lost).toBeGreaterThan(0)
  await page.waitForTimeout(300)
  const settled = await gl(page)
  await page.waitForTimeout(800)
  expect((await gl(page)).draws - settled.draws).toBe(0)
  await expect(page.locator(`${HERO}[data-developed] > canvas`)).toHaveCount(1)

  await page.setViewportSize({ width: 1100, height: 760 })
  await expect.poll(async () => (await gl(page)).contexts).toBeGreaterThan(settled.contexts)
  await expect.poll(async () => (await gl(page)).draws).toBeGreaterThan(settled.draws)
  expect(errors).toEqual([])
})
