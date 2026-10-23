import { expect, type Page, test } from '@playwright/test'

import { EFFECT_TIERS, GRAIN_PER_SECOND } from '../../src/lib/art-effect/presets'

const SPECIES = '/fr/espece/nnor'
const SPECIES_INDEX = '/fr/especes'
const HERO = '[data-plate="hero"]'
const CARD = '[data-plate="card"]'
const STAGE = '[data-stage]'
const STAGE_MOST_PER_SECOND = Math.max(
  ...Object.values(EFFECT_TIERS).map((tier) => tier.stage?.perSecond ?? 0),
)
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

async function countCopies(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const counted = window as unknown as { plateCopies: number; stageCopies: number }
    counted.plateCopies = 0
    counted.stageCopies = 0
    const copy = CanvasRenderingContext2D.prototype.drawImage
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'drawImage', {
      value(this: CanvasRenderingContext2D, ...args: unknown[]) {
        const holder = this.canvas.parentElement
        if (holder?.matches('[data-plate]')) counted.plateCopies += 1
        if (holder?.matches('[data-stage]')) counted.stageCopies += 1
        return Reflect.apply(copy, this, args)
      },
    })
  })
}

function copies(page: Page): Promise<{ plate: number; stage: number }> {
  return page.evaluate(() => {
    const counted = window as unknown as { plateCopies: number; stageCopies: number }
    return { plate: counted.plateCopies, stage: counted.stageCopies }
  })
}

function copiesPerSecond(page: Page, into: 'plate' | 'stage'): Promise<number> {
  return page.evaluate(async (which) => {
    const counted = window as unknown as { plateCopies: number; stageCopies: number }
    const read = (): number => (which === 'plate' ? counted.plateCopies : counted.stageCopies)
    const fromCount = read()
    const fromTime = performance.now()
    await new Promise((done) => window.setTimeout(done, 1000))
    return ((read() - fromCount) * 1000) / (performance.now() - fromTime)
  }, into)
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

test('without an effect a page never fetches the plate code', async ({ page }) => {
  const fetched: string[] = []
  page.on('request', (request) => {
    if (/\/plates\.[^/]*\.js$/.test(request.url())) fetched.push(request.url())
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
  await countCopies(page)
  await giveEffect(page, 'film', ['hero'])
  await page.goto(SPECIES)
  await expect(page.locator(`${HERO}[data-developed] > canvas`)).toHaveCount(1)
  const moving = await copiesPerSecond(page, 'plate')
  expect(moving).toBeGreaterThanOrEqual(5)
  expect(moving).toBeLessThanOrEqual(GRAIN_PER_SECOND + 2)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  const away = (await copies(page)).plate
  await page.waitForTimeout(1000)
  expect((await copies(page)).plate - away).toBe(0)
})

test('the stage moves behind the hero while it is on screen, at most thirty times a second', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await countCopies(page)
  await page.goto('/fr/arbre/marchand')
  const canvas = page.locator(`${STAGE}[data-staged] > canvas`)
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toHaveAttribute('aria-hidden', 'true')
  const moving = await copiesPerSecond(page, 'stage')
  expect(moving).toBeGreaterThanOrEqual(5)
  expect(moving).toBeLessThanOrEqual(STAGE_MOST_PER_SECOND + 2)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  const away = (await copies(page)).stage
  await page.waitForTimeout(1000)
  expect((await copies(page)).stage - away).toBe(0)
  expect(errors).toEqual([])
})

test('the pause button stills the stage, and the reader can start it again', async ({ page }) => {
  await countCopies(page)
  await page.goto(SPECIES)
  await expect(page.locator(`${STAGE}[data-staged] > canvas`)).toHaveCount(1)
  await page.getByRole('button', { name: 'Mettre en pause l’animation du fond' }).click()
  await page.waitForTimeout(200)
  const paused = (await copies(page)).stage
  await page.waitForTimeout(1000)
  expect((await copies(page)).stage - paused).toBe(0)
  await page.getByRole('button', { name: 'Lancer l’animation du fond' }).click()
  await expect.poll(async () => (await copies(page)).stage).toBeGreaterThan(paused)
})

test('the stage and a developed hero share one context', async ({ page }) => {
  await countGl(page)
  await giveEffect(page, 'film', ['hero'])
  await page.goto(SPECIES)
  await expect(page.locator(`${HERO}[data-developed] > canvas`)).toHaveCount(1)
  await expect(page.locator(`${STAGE}[data-staged] > canvas`)).toHaveCount(1)
  expect((await gl(page)).contexts).toBe(1)
})

test('the stage leaves with its page and comes back with it', async ({ page }) => {
  await page.goto('/fr')
  await page.waitForFunction(() => 'swup' in window)
  const visit = async (path: string): Promise<void> => {
    await page.evaluate((target) => {
      const swup = (window as unknown as { swup: { navigate: (url: string) => void } }).swup
      swup.navigate(target)
    }, path)
    await expect(page).toHaveURL(path)
  }
  await visit(SPECIES)
  await expect(page.locator(`${STAGE}[data-staged] > canvas`)).toHaveCount(1)
  await visit('/fr')
  await expect(page.locator(`${STAGE} > canvas`)).toHaveCount(0)
  await visit(SPECIES)
  await expect(page.locator(`${STAGE}[data-staged] > canvas`)).toHaveCount(1)
})

test('a tree node visit keeps the moving stage', async ({ page }) => {
  await page.goto('/fr/arbre/barbare#arbre')
  await expect(page.locator(`${STAGE}[data-staged] > canvas`)).toHaveCount(1)
  await page.evaluate(() =>
    document.querySelector('[data-stage] > canvas')?.setAttribute('data-kept', ''),
  )
  await page.locator('[data-plate-node][data-node="TOURBI-001"]').click()
  await expect(page).toHaveURL('/fr/arbre/barbare/TOURBI-001#arbre')
  await expect(page.locator(`${STAGE} > canvas[data-kept]`)).toHaveCount(1)
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

  test('the stage never starts, and its code is never fetched', async ({ page }) => {
    const fetched: string[] = []
    page.on('request', (request) => {
      if (/\/stage\.[^/]*\.js$/.test(request.url())) fetched.push(request.url())
    })
    await page.goto('/fr/arbre/marchand')
    await page.waitForLoadState('networkidle')
    await expect(page.locator(`${STAGE} > canvas`)).toHaveCount(0)
    expect(fetched).toEqual([])
  })

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
