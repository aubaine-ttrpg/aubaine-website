import { expect, type Locator, type Page, test } from '@playwright/test'

test.use({ viewport: { width: 1280, height: 700 } })

const PAGES_FULL_OF_IMAGES = [
  { path: '/fr/arbres', images: 'every tree card plate' },
  { path: '/fr/espece/humain', images: 'every picture in its lore' },
  { path: '/fr/equipement', images: 'every item art' },
]

async function expectLoadedWithoutScrolling(images: Locator) {
  await expect(images.first()).toBeAttached()
  const notEager = await images.evaluateAll((nodes: HTMLImageElement[]) =>
    nodes.filter((node) => node.getAttribute('loading') !== 'eager').map((node) => node.src),
  )
  expect(notEager).toEqual([])
  await expect
    .poll(
      () =>
        images.evaluateAll((nodes: HTMLImageElement[]) =>
          nodes.filter((node) => !node.complete || node.naturalWidth === 0).map((node) => node.src),
        ),
      { timeout: 15_000 },
    )
    .toEqual([])
  expect(await images.page().evaluate(() => window.scrollY)).toBe(0)
}

for (const { path, images } of PAGES_FULL_OF_IMAGES) {
  test(`${path} loads ${images} before the reader scrolls`, async ({ page }) => {
    await page.goto(path)
    await expectLoadedWithoutScrolling(page.locator('img'))
  })
}

async function expectCardSharp(page: Page): Promise<void> {
  const card = page.locator('[data-character] [data-plate="hero"] img')
  await expect.poll(() => card.evaluate((node: HTMLImageElement) => node.complete)).toBe(true)
  const { chosen, widest, needed } = await card.evaluate((node: HTMLImageElement) => {
    const candidates = node.srcset.split(',').map((entry) => {
      const [url = '', width = '0w'] = entry.trim().split(/\s+/)
      return { url: new URL(url, document.baseURI).href, width: Number.parseInt(width, 10) }
    })
    const picked = candidates.find((candidate) => candidate.url === node.currentSrc)
    return {
      chosen: picked?.width ?? 0,
      widest: Math.max(...candidates.map((candidate) => candidate.width)),
      needed: Math.ceil(node.offsetWidth * window.devicePixelRatio),
    }
  })
  expect(chosen).toBeGreaterThanOrEqual(Math.min(needed, widest))
}

test('a character card fetches a file wide enough for the card', async ({ page }) => {
  await page.goto('/fr/espece/nnor')
  await expectCardSharp(page)
})

test.describe('on a portrait phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 })

  test('a full-bleed hero fetches a file wide enough for its crop', async ({ page }) => {
    await page.goto('/fr/arbres')
    const hero = page.locator('section.au-hero img').first()
    await expect.poll(() => hero.evaluate((node: HTMLImageElement) => node.complete)).toBe(true)
    const { chosen, widest } = await hero.evaluate((node: HTMLImageElement) => {
      const candidates = node.srcset.split(',').map((entry) => {
        const [url = '', width = '0w'] = entry.trim().split(/\s+/)
        return { url: new URL(url, document.baseURI).href, width: Number.parseInt(width, 10) }
      })
      const largest = candidates.reduce((a, b) => (b.width > a.width ? b : a))
      return { chosen: node.currentSrc, widest: largest.url }
    })
    expect(chosen).toBe(widest)
  })

  test('a character card fetches a file wide enough for the card', async ({ page }) => {
    await page.goto('/fr/arbre/marchand')
    await expectCardSharp(page)
  })
})

test('a visit to the trees index loads every card plate before the reader scrolls', async ({
  page,
}) => {
  await page.goto('/fr')
  await page.waitForFunction(() => 'swup' in window)
  await page.evaluate(() => {
    document.body.dataset['visit'] = 'client'
  })
  await page.getByRole('link', { name: 'Arbres' }).first().click()
  await expect(page).toHaveURL('/fr/arbres')
  await expect(page.getByRole('heading', { level: 1, name: /Arbre de compétences/ })).toBeVisible()
  await expect(page.locator('body')).toHaveAttribute('data-visit', 'client')
  await expectLoadedWithoutScrolling(page.locator('#swup img'))
})
