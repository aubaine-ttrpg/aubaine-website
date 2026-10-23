import { expect, test } from '@playwright/test'

test('the Nnor head their family names as Yurtas, in both languages', async ({ page }) => {
  await page.goto('/fr/espece/nnor')
  await expect(page.locator('.au-subspecies dt', { hasText: 'Yurtas' })).toHaveCount(2)
  await expect(page.locator('.au-subspecies dt', { hasText: 'Noms de famille' })).toHaveCount(0)
  await page.goto('/en/species/nnor')
  await expect(page.locator('.au-subspecies dt', { hasText: 'Yurtas' })).toHaveCount(2)
  await expect(page.locator('.au-subspecies dt', { hasText: 'Family names' })).toHaveCount(0)
})

test('a species that names no heading keeps « Noms de famille »', async ({ page }) => {
  await page.goto('/fr/espece/humain')
  await expect(
    page.locator('.au-subspecies dt', { hasText: 'Noms de famille' }).first(),
  ).toBeVisible()
})

test('the Nnor are Humanoïdes and Bêtes, under the icon the rules give the creature type', async ({
  page,
}) => {
  await page.goto('/fr/espece/nnor')
  const plate = page.locator('.au-trait', { hasText: 'Humanoïde · Bête' })
  await expect(plate).toBeVisible()
  await expect(plate.locator('[style*="beast-eye"]')).toHaveCount(1)
  await expect(
    page.locator('.au-trait', { hasText: '10,5 m' }).locator('[style*="speedometer"]'),
  ).toHaveCount(1)
})

test('species cards carry no domain spine, tree cards keep theirs', async ({ page }) => {
  await page.goto('/fr/especes')
  await expect(page.locator('[data-cover-card]').first()).toBeVisible()
  await expect(page.locator('[data-cover-spine]')).toHaveCount(0)
  await page.goto('/fr/arbres')
  expect(await page.locator('[data-cover-spine]').count()).toBeGreaterThan(0)
})

test('a species and a tree show their one 3:4 cover in the hero and in the social image', async ({
  page,
}) => {
  for (const path of ['/fr/espece/nnor', '/fr/arbre/marchand']) {
    await page.goto(path)
    const hero = page.locator('section.au-hero[data-layout="portrait"] img')
    await expect(hero, path).toHaveCount(1)
    expect(await hero.getAttribute('src'), path).toMatch(/-3_4-og\./)
    expect(await page.locator('meta[property="og:image"]').getAttribute('content'), path).toMatch(
      /-3_4-og\./,
    )
  }
})
