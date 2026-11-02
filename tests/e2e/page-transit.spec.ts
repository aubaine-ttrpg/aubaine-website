import { expect, type Page, test } from '@playwright/test'
import sharp from 'sharp'

const CARD_ON_ROSTER = '[data-entry="berserker"] a'
const SHEET = '/en/tree/berserker'
const LIST = '/en/trees'
const HUB = '/en/almanach'

type Spy = {
  calls: number
  groups: string[]
  names: string[]
  rejected: string[]
  duplicates: string[]
  hiddenFrames: number
  ready: boolean
  crestName: string
}

function namedElements(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('*')].filter(
    (element) => element.style.getPropertyValue('view-transition-name') !== '',
  )
}

async function spy(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const record: Record<string, unknown> & Spy = {
      calls: 0,
      groups: [],
      names: [],
      rejected: [],
      duplicates: [],
      hiddenFrames: 0,
      ready: false,
      crestName: '',
    }
    Object.assign(window, { __spy: record })
    const named = () =>
      [...document.querySelectorAll<HTMLElement>('*')]
        .map((element) => element.style.getPropertyValue('view-transition-name'))
        .filter(Boolean)
    const watch = () => {
      const page = document.querySelector('#swup')
      if (page && Number(getComputedStyle(page).opacity) < 0.98) record.hiddenFrames += 1
      const names = named()
      if (new Set(names).size !== names.length) record.duplicates.push(names.join(' '))
      requestAnimationFrame(watch)
    }
    requestAnimationFrame(watch)
    const native = document.startViewTransition?.bind(document)
    if (!native) return
    Object.defineProperty(document, 'startViewTransition', {
      configurable: true,
      value: (update: () => Promise<void>) => {
        record.calls += 1
        record.ready = false
        const transition = native(update)
        transition.ready.then(
          () => {
            record.ready = true
            record.names = named()
            const crest = document.querySelector('[data-load-crest]')
            record.crestName = crest ? getComputedStyle(crest).viewTransitionName : ''
            record.groups = document.documentElement
              .getAnimations({ subtree: true })
              .map((animation) => {
                const effect = animation.effect
                return effect instanceof KeyframeEffect ? (effect.pseudoElement ?? '') : ''
              })
              .filter(Boolean)
          },
          (error: unknown) => record.rejected.push(String(error)),
        )
        return transition
      },
    })
  })
}

function spied(page: Page): Promise<Spy> {
  return page.evaluate(() => (window as unknown as { __spy: Spy }).__spy)
}

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForFunction(() => 'swup' in window)
}

async function settled(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const { swup } = window as unknown as { swup: { navigating: boolean } }
    return !swup.navigating && !document.documentElement.hasAttribute('data-transit')
  })
}

test.describe('page changes', () => {
  test.beforeEach(async ({ page }) => {
    await spy(page)
  })

  test('a link visit runs one view transition and never hides the page', async ({ page }) => {
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page).toHaveURL(SHEET)
    await settled(page)
    const seen = await spied(page)
    expect(seen.calls).toBe(1)
    expect(seen.hiddenFrames).toBe(0)
    expect(seen.rejected).toEqual([])
    expect(await page.evaluate(namedElements)).toHaveLength(0)
  })

  test('a page change the browser refuses still changes the page', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript(() => {
      const native = document.startViewTransition.bind(document)
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      })
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      Object.defineProperty(document, 'startViewTransition', {
        configurable: true,
        value: (update: () => Promise<void>) => {
          const transition = native(update)
          transition.skipTransition()
          return transition
        },
      })
    })
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page).toHaveURL(SHEET)
    await expect(page.getByRole('heading', { level: 1, name: 'Berserker' })).toBeVisible()
    await settled(page)
    expect(errors).toEqual([])
    expect(await page.evaluate(namedElements)).toHaveLength(0)
  })

  test('a page left in a background tab is on the new page when it comes back', async ({
    context,
    page,
  }) => {
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).hover()
    const other = await context.newPage()
    await other.goto('about:blank')
    await other.bringToFront()
    await page.evaluate((selector) => {
      document.querySelector<HTMLElement>(selector)?.click()
    }, CARD_ON_ROSTER)
    await expect(page).toHaveURL(SHEET)
    await page.bringToFront()
    await expect(page.getByRole('heading', { level: 1, name: 'Berserker' })).toBeVisible()
    await settled(page)
    expect(await page.evaluate(namedElements)).toHaveLength(0)
    await other.close()
  })

  test('a Livres entry closes the book, then the category arrives', async ({ page }) => {
    await open(page, '/en/books')
    const sheet = page.locator('.au-sommaire__sheet').first()
    await page.locator('main a[href="/en/books/rules"]').click()
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    expect((await spied(page)).groups).toEqual(
      expect.arrayContaining([
        '::view-transition-image-pair(au-book-right)',
        '::view-transition-image-pair(au-book-left)',
        '::view-transition-image-pair(au-book-back)',
        '::view-transition-image-pair(au-book-title)',
      ]),
    )
    await expect(page).toHaveURL('/en/books/rules')
    await settled(page)
    await expect(page.locator('.au-book-leaf')).toHaveCount(0)
    await expect(sheet).toHaveCount(0)
    const seen = await spied(page)
    expect(seen.hiddenFrames).toBe(0)
    expect(seen.rejected).toEqual([])
  })

  test('Back opens the book again and leaves it whole', async ({ page }) => {
    await open(page, '/en/books')
    await page.locator('main a[href="/en/books/rules"]').click()
    await expect(page).toHaveURL('/en/books/rules')
    await settled(page)
    await page.goBack()
    await expect.poll(async () => (await spied(page)).calls).toBe(2)
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    expect((await spied(page)).groups).toContain('::view-transition-image-pair(au-book-back)')
    await settled(page)
    await expect(page.locator('.au-book-leaf')).toHaveCount(0)
    await expect(page.locator('.au-sommaire__sheet')).toBeVisible()
    await expect(page.locator('.au-sommaire__title .au-plates__plate').first()).toBeVisible()
    await expect(page.locator('.au-sommaire__title .au-plates__about')).toBeVisible()
    await expect(page.locator('[data-door][data-lit] a')).toHaveAttribute('href', '/en/books/rules')
  })

  test('a transition ends when its last motion ends', async ({ page }) => {
    await expect(async () => {
      await open(page, '/en/books')
      const link = page.locator('main a[href="/en/books/rules"]')
      await link.hover()
      await page.waitForTimeout(400)
      const timing = await link.evaluate(
        (anchor) =>
          new Promise<{ planned: number; took: number }>((resolve) => {
            const start = document.startViewTransition.bind(document)
            Object.defineProperty(document, 'startViewTransition', {
              configurable: true,
              writable: true,
              value: (update: () => Promise<void>) => {
                const transition = start(update)
                transition.ready.then(() => {
                  const began = performance.now()
                  const planned = Math.max(
                    ...document.documentElement
                      .getAnimations({ subtree: true })
                      .filter((motion) => {
                        const { effect } = motion
                        return effect instanceof KeyframeEffect && Boolean(effect.pseudoElement)
                      })
                      .map((motion) => Number(motion.effect?.getComputedTiming().endTime ?? 0)),
                  )
                  void transition.finished.then(() =>
                    resolve({ planned, took: performance.now() - began }),
                  )
                })
                return transition
              },
            })
            if (anchor instanceof HTMLElement) anchor.click()
          }),
      )
      expect(timing.took).toBeLessThan(timing.planned + 200)
    }).toPass({ timeout: 25_000 })
  })

  test('no book piece outlives the opening by a single frame', async ({ page }) => {
    await open(page, '/en/books')
    await page.locator('main a[href="/en/books/rules"]').click()
    await expect(page).toHaveURL('/en/books/rules')
    await settled(page)
    await page.evaluate(() => {
      const state = { strayFrames: 0, moved: false, stop: false }
      Object.assign(window, { __stray: state })
      const check = () => {
        if (state.stop) return
        const running = document.documentElement
          .getAnimations({ subtree: true })
          .some((animation) => {
            const effect = animation.effect
            return (
              effect instanceof KeyframeEffect &&
              (effect.pseudoElement ?? '').startsWith('::view-transition') &&
              animation.playState === 'running'
            )
          })
        if (running) state.moved = true
        const pieces = document.querySelector('.au-book-leaf, [data-book-hidden]') !== null
        if (state.moved && !running && pieces) state.strayFrames += 1
        requestAnimationFrame(check)
      }
      requestAnimationFrame(check)
    })
    await page.goBack()
    await expect(page).toHaveURL('/en/books')
    await page.waitForTimeout(1200)
    const stray = await page.evaluate(() => {
      const state = (
        window as unknown as { __stray: { strayFrames: number; moved: boolean; stop: boolean } }
      ).__stray
      state.stop = true
      return state
    })
    expect(stray.moved).toBe(true)
    expect(stray.strayFrames).toBe(0)
  })

  test('the book laid out for its capture paints exactly as the open book', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await open(page, '/en/books')
    const link = page.locator('main a[href="/en/books/rules"]')
    await link.hover()
    await page.waitForTimeout(900)
    const sheet = page.locator('.au-sommaire__sheet').first()
    const box = await sheet.boundingBox()
    if (!box) throw new Error('the book has no box')
    const clip = { x: box.x - 4, y: box.y - 60, width: box.width + 8, height: box.height + 64 }
    await page.addStyleTag({ content: '[data-load-crest] { display: none !important; }' })
    const whole = await page.screenshot({ clip, animations: 'disabled' })
    await page.evaluate(() => {
      Object.defineProperty(document, 'startViewTransition', {
        configurable: true,
        value: () => ({
          ready: new Promise(() => undefined),
          finished: new Promise(() => undefined),
          updateCallbackDone: new Promise(() => undefined),
          skipTransition: () => undefined,
        }),
      })
    })
    await link.click()
    await expect(page.locator('.au-book-leaf')).toHaveCount(3)
    await page.evaluate(() => {
      for (const pressed of document.querySelectorAll('[data-pressed]')) {
        pressed.removeAttribute('data-pressed')
      }
    })
    await page.waitForTimeout(500)
    const laidOut = await page.screenshot({ clip, animations: 'disabled' })
    const read = (image: Buffer) => sharp(image).removeAlpha().raw().toBuffer()
    const [before, after] = await Promise.all([read(whole), read(laidOut)])
    let different = 0
    for (let index = 0; index < before.length; index += 3) {
      const delta =
        Math.abs((before[index] ?? 0) - (after[index] ?? 0)) +
        Math.abs((before[index + 1] ?? 0) - (after[index + 1] ?? 0)) +
        Math.abs((before[index + 2] ?? 0) - (after[index + 2] ?? 0))
      if (delta > 24) different += 1
    }
    expect(different / (before.length / 3)).toBeLessThan(0.002)
  })

  test('a narrow Livres has no spread to close and just changes page', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 })
    await open(page, '/en/books')
    await page.locator('main a[href="/en/books/rules"]').click()
    await expect(page).toHaveURL('/en/books/rules')
    await settled(page)
    const seen = await spied(page)
    expect(seen.groups.filter((group) => group.includes('au-book'))).toEqual([])
    expect(seen.rejected).toEqual([])
  })

  test('a keyboard entry closes the book as a click does', async ({ page }) => {
    await open(page, '/en/books')
    await page.locator('main a[href="/en/books/rules"]').focus()
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    expect((await spied(page)).groups).toContain('::view-transition-image-pair(au-book-right)')
    await settled(page)
  })

  test('no two elements share a transition name at any moment', async ({ page }) => {
    await open(page, HUB)
    await page.locator(`main a[href="${LIST}"]`).click()
    await expect(page).toHaveURL(LIST)
    await settled(page)
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page).toHaveURL(SHEET)
    await settled(page)
    const seen = await spied(page)
    expect(seen.duplicates).toEqual([])
    expect(seen.rejected).toEqual([])
  })

  test('the chosen card flies into the sheet and does not land twice', async ({ page }) => {
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).click()
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    expect((await spied(page)).names).toEqual(['au-flight-0'])
    const card = page.locator('.au-character .au-framed__card')
    await expect(card).toHaveAttribute('data-transit-flown', '')
    expect(await card.evaluate((node) => getComputedStyle(node).animationName)).toBe('none')
  })

  test('the blurred stage waits for the landing and comes back at rest', async ({ page }) => {
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).click()
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    const stageState = () =>
      page.evaluate(() => {
        const stage = document.querySelector('.au-character .au-stage')
        const ambient = stage?.querySelector('.au-stage__ambient')
        if (!stage || !ambient) throw new Error('the sheet has no stage')
        return {
          ambient: stage.hasAttribute('data-staged')
            ? 'staged'
            : getComputedStyle(ambient).visibility,
          soft: getComputedStyle(stage, '::before').visibility,
        }
      })
    expect(await stageState()).toEqual({ ambient: 'hidden', soft: 'visible' })
    await settled(page)
    await expect.poll(async () => (await stageState()).soft).toBe('hidden')
    expect(['visible', 'staged']).toContain((await stageState()).ambient)
  })

  test('a door names the plates of the page it opens', async ({ page }) => {
    await open(page, HUB)
    await page.locator(`main a[href="${LIST}"]`).click()
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    const words = await page.locator('.au-plates__plate').count()
    expect((await spied(page)).names).toHaveLength(words)
  })

  test('a slow page keeps the old page and the pressed link until it arrives', async ({ page }) => {
    await open(page, LIST)
    await page.route(`**${SHEET}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900))
      await route.continue()
    })
    const link = page.locator(CARD_ON_ROSTER)
    await link.click()
    await expect(link).toHaveAttribute('data-pressed', '')
    await expect(page.locator('[data-select]')).toBeVisible()
    expect((await spied(page)).calls).toBe(0)
    await expect(page.getByRole('heading', { level: 1, name: 'Berserker' })).toBeVisible()
    expect((await spied(page)).hiddenFrames).toBe(0)
  })

  test('pressing Enter on a slow link marks it pressed at once', async ({ page }) => {
    await open(page, LIST)
    await page.route(`**${SHEET}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })
    const link = page.locator(CARD_ON_ROSTER)
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(link).toHaveAttribute('data-pressed', '')
    await expect(page).toHaveURL(SHEET)
  })

  test('a failed fetch still reaches the page by a full load', async ({ page }) => {
    await open(page, LIST)
    let failed = false
    await page.route(`**${SHEET}`, async (route) => {
      if (failed) return route.continue()
      failed = true
      return route.abort()
    })
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Berserker' })).toBeVisible()
    await expect(page).toHaveURL(SHEET)
  })

  test('a page without its containers falls back to a full load', async ({ page }) => {
    await open(page, LIST)
    await page.route(`**${SHEET}`, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><title>Plain</title><p>Plain</p>',
      }),
    )
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page).toHaveTitle('Plain')
  })

  test('a double click opens the page once', async ({ page }) => {
    await open(page, HUB)
    const before = await page.evaluate(() => window.history.length)
    await page.locator(`main a[href="${LIST}"]`).dblclick()
    await expect(page).toHaveURL(LIST)
    await settled(page)
    expect(await page.evaluate(() => window.history.length)).toBe(before + 1)
  })

  test('a click during the transition is kept and reaches what is under it', async ({ page }) => {
    await open(page, LIST)
    const home = await page.getByRole('link', { name: 'Home', exact: true }).boundingBox()
    if (!home) throw new Error('the header has no Home link')
    await page.locator(CARD_ON_ROSTER).click()
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-transit'))).toBe(
      true,
    )
    await page.mouse.click(home.x + home.width / 2, home.y + home.height / 2)
    await expect(page).toHaveURL('/en')
    await settled(page)
  })

  test('Back during a transition lands on the previous page', async ({ page }) => {
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).click()
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    await page.goBack()
    await expect(page).toHaveURL(LIST)
    await settled(page)
    await expect(page.locator('[data-select]')).toBeVisible()
  })

  test('Back during a slow wait keeps the reader where they were', async ({ page }) => {
    await open(page, LIST)
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }))
    await page.route(`**${SHEET}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue()
    })
    await page.evaluate((selector) => {
      document.querySelector<HTMLElement>(selector)?.click()
    }, CARD_ON_ROSTER)
    await expect(page).toHaveURL(SHEET)
    await page.goBack()
    await expect(page).toHaveURL(LIST)
    await settled(page)
    expect((await spied(page)).calls).toBe(0)
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(300)
  })

  test('Back animates, restores the scroll and returns to the entry left', async ({ page }) => {
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).scrollIntoViewIfNeeded()
    const top = await page.evaluate(() => Math.round(window.scrollY))
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page).toHaveURL(SHEET)
    await settled(page)
    await page.goBack()
    await expect(page).toHaveURL(LIST)
    await settled(page)
    expect((await spied(page)).calls).toBe(2)
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(top)
    await expect(page.locator('[data-spotlight]')).toHaveAttribute(
      'data-spotlight-current',
      'berserker',
    )
    const roster = page.locator('.au-roster').first()
    expect(await roster.evaluate((node) => getComputedStyle(node).animationName)).toBe('none')
  })

  test('Back to a hub lights the door the reader took', async ({ page }) => {
    await open(page, HUB)
    const door = page.locator(`main a[href="/en/species"]`)
    await door.click()
    await expect(page).toHaveURL('/en/species')
    await settled(page)
    await page.goBack()
    await expect(page).toHaveURL(HUB)
    await settled(page)
    await expect(page.locator('[data-door][data-lit] a')).toHaveAttribute('href', '/en/species')
    expect(await page.locator('[data-door][data-lit]').count()).toBe(1)
  })

  test('a fresh visit to a list still opens on its lead', async ({ page }) => {
    await open(page, LIST)
    const lead = await page.locator('[data-spotlight]').getAttribute('data-spotlight-order')
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page).toHaveURL(SHEET)
    await settled(page)
    await page.getByRole('link', { name: 'Home', exact: true }).click()
    await expect(page).toHaveURL('/en')
    await settled(page)
    await open(page, LIST)
    expect(await page.locator('[data-spotlight]').getAttribute('data-spotlight-current')).toBe(
      lead?.split(' ')[0],
    )
  })

  test('a history visit the browser animates runs no second transition', async ({ page }) => {
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page).toHaveURL(SHEET)
    await settled(page)
    await page.evaluate(() => {
      Object.defineProperty(PopStateEvent.prototype, 'hasUAVisualTransition', { get: () => true })
    })
    await page.goBack()
    await expect(page).toHaveURL(LIST)
    await expect(page.locator('[data-select]')).toBeVisible()
    expect((await spied(page)).calls).toBe(1)
  })

  test('an anchor followed then undone returns to the same place in a page', async ({ page }) => {
    await open(page, '/en/books')
    await page.locator('main a[href^="/en/books/"]').first().click()
    await settled(page)
    await open(page, '/en/rules')
    const top = await page.evaluate(() => Math.round(window.scrollY))
    const anchor = page.locator('main a[href^="#"]').first()
    test.skip((await anchor.count()) === 0, 'this page holds no anchor link')
    await anchor.click()
    await page.goBack()
    await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(top)
  })

  test('a restored page clears what a visit left behind', async ({ page }) => {
    await open(page, LIST)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-transit', 'deeper')
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    })
    expect(await page.evaluate(() => document.documentElement.hasAttribute('data-transit'))).toBe(
      false,
    )
  })

  test('a locale switch replaces the header inside a transition', async ({ page }) => {
    await open(page, SHEET)
    await page.getByRole('button', { name: 'Language' }).click()
    await page.getByRole('link', { name: /Français/ }).click()
    await expect(page).toHaveURL('/fr/arbre/berserker')
    await expect(page.locator('[data-nav="home"]')).toHaveText('Accueil')
    await settled(page)
    const seen = await spied(page)
    expect(seen.calls).toBe(1)
    expect(seen.rejected).toEqual([])
  })

  test('a piece off the screen takes no name', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await open(page, LIST)
    await page.evaluate((selector) => {
      document.querySelector<HTMLElement>(selector)?.click()
    }, CARD_ON_ROSTER)
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    expect((await spied(page)).names).toEqual([])
  })

  test('a picture too slow to decode gives up the flight, not the page', async ({ page }) => {
    await page.route(/\.(avif|webp|jpe?g|png)(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 4000))
      await route.continue().catch(() => undefined)
    })
    await page.goto(LIST, { waitUntil: 'commit' })
    await page.waitForFunction(() => 'swup' in window)
    await page.locator('[data-entry]:has([data-cover-art]) a').last().click()
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    expect(await page.locator('[data-transit-flown]').count()).toBe(0)
    await settled(page)
  })

  test('hovering a link warms the picture of the page it opens', async ({ page }) => {
    await open(page, LIST)
    const html = await (await page.request.get(SHEET)).text()
    const tag = html.slice(html.indexOf('au-framed--hero')).match(/<img\b[^>]*>/)?.[0] ?? ''
    const candidates = (tag.match(/srcset="([^"]+)"/)?.[1] ?? '')
      .split(',')
      .map((candidate) => candidate.trim().split(' ')[0] ?? '')
    expect(candidates.length).toBeGreaterThan(0)
    const asked: string[] = []
    page.on('request', (request) => asked.push(new URL(request.url()).pathname))
    await page.locator(CARD_ON_ROSTER).hover()
    await expect
      .poll(() => asked.some((path) => candidates.some((candidate) => candidate.endsWith(path))))
      .toBe(true)
  })

  test('the crest paints above the flight on a slow visit', async ({ page }) => {
    await open(page, LIST)
    await page.route(`**${SHEET}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 700))
      await route.continue()
    })
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page.locator('[data-load-crest][data-phase]')).toBeVisible()
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    expect((await spied(page)).crestName).toBe('au-crest')
    await expect(page.locator('[data-load-crest][data-phase]')).toHaveCount(0)
  })

  test('no hub ever names a card', async ({ page }) => {
    await open(page, LIST)
    await page.getByRole('link', { name: 'Codex', exact: true }).first().click()
    await expect(page).toHaveURL(HUB)
    await settled(page)
    expect(await page.locator('.au-framed__card').count()).toBe(0)
    expect(await page.locator('[data-transit-flown]').count()).toBe(0)
  })

  test('forced colours still change page', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page).toHaveURL(SHEET)
    await settled(page)
    expect((await spied(page)).rejected).toEqual([])
  })

  test('the whole path works from the keyboard', async ({ page }) => {
    await open(page, HUB)
    const door = page.locator(`main a[href="${LIST}"]`)
    await door.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(LIST)
    await settled(page)
    await page.locator(CARD_ON_ROSTER).focus()
    await expect(page.locator('[data-spotlight]')).toHaveAttribute(
      'data-spotlight-current',
      'berserker',
    )
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(SHEET)
    await settled(page)
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY')
    await page.goBack()
    await expect(page).toHaveURL(LIST)
    await settled(page)
    await expect(page.locator('#swup-announcer')).not.toBeEmpty()
    const seen = await spied(page)
    expect(seen.hiddenFrames).toBe(0)
    expect(seen.rejected).toEqual([])
  })

  test('reduced motion runs no transition', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page).toHaveURL(SHEET)
    await expect(page.getByRole('heading', { level: 1, name: 'Berserker' })).toBeVisible()
    expect((await spied(page)).calls).toBe(0)
  })

  test('a typed search runs no transition', async ({ page }) => {
    await open(page, HUB)
    await page.locator('[data-search-input]').first().fill('berserker')
    await expect(page).toHaveURL(/q=berserker/)
    await expect(page.locator('[data-search-input]').first()).toBeFocused()
    expect((await spied(page)).calls).toBe(0)
  })

  test('the Atlas runs no transition', async ({ page }) => {
    await open(page, HUB)
    await page.locator('[data-nav="atlas"]').click()
    await expect(page).toHaveURL('/en/atlas')
    expect((await spied(page)).calls).toBe(0)
  })

  test('moving between the nodes of a tree runs no transition', async ({ page }) => {
    await open(page, SHEET)
    const node = page.locator('[data-node]').first()
    await node.click()
    await expect(page).toHaveURL(/\/en\/tree\/berserker\/.+/)
    expect((await spied(page)).calls).toBe(0)
  })

  test('the threshold hands over with no transition', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/(en|fr)$/)
    expect((await spied(page)).calls).toBe(0)
  })

  test('a browser without view transitions still changes page', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.addInitScript(() => {
      Object.defineProperty(document, 'startViewTransition', { value: undefined })
    })
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).click()
    await expect(page).toHaveURL(SHEET)
    await expect(page.getByRole('heading', { level: 1, name: 'Berserker' })).toBeVisible()
    await context.close()
  })

  test('a Tab during the transition keeps its focus and the page is announced', async ({
    page,
  }) => {
    await open(page, LIST)
    await page.locator(CARD_ON_ROSTER).click()
    await expect.poll(async () => (await spied(page)).ready).toBe(true)
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    await settled(page)
    expect(focused).not.toBe('BODY')
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe(focused)
    await expect(page.locator('#swup-announcer')).toHaveText(/Berserker/)
  })
})

test.describe('touch', () => {
  test.use({ hasTouch: true })

  test('a tap on a slow link marks it pressed at once', async ({ page }) => {
    await open(page, LIST)
    await page.route(`**${SHEET}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })
    const link = page.locator(CARD_ON_ROSTER)
    await link.scrollIntoViewIfNeeded()
    await link.tap()
    await expect(link).toHaveAttribute('data-pressed', '')
    await expect(page).toHaveURL(SHEET)
  })
})
