import { expect, test } from '@playwright/test'

test('the skills index leaves a state to its tooltip', async ({ page }) => {
  await page.goto('/fr/competences')
  await expect(page.locator('[data-entry="BOUSC-01"]')).toHaveCount(1)
  await expect(page.locator('.au-state-callout')).toHaveCount(0)
})

test('the tree skill pane leaves a state to its tooltip', async ({ page }) => {
  await page.goto('/fr/arbre/berserker/RAGER-01')
  await expect(page.getByText('Enragé').first()).toBeVisible()
  await expect(page.locator('.au-state-callout')).toHaveCount(0)
})
