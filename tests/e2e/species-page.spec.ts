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
