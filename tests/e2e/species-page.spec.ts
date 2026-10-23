import { expect, test } from '@playwright/test'

test('the species plates draw the icons the rules give their terms', async ({ page }) => {
  await page.goto('/fr/espece/nnor')
  await expect(page.locator('.au-trait').first().locator('[style*="beast-eye"]')).toHaveCount(1)
  await expect(
    page.locator('.au-trait', { hasText: '10,5 m' }).locator('[style*="speedometer"]'),
  ).toHaveCount(1)
})
