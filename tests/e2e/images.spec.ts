import { expect, type Locator, test } from '@playwright/test'

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
