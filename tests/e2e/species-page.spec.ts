import { expect, test } from '@playwright/test'

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
