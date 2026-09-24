import { expect, test } from '@playwright/test'

import { FONT_FAMILIES, ICON_SETS } from '../../src/lib/rights/attribution'

const PAIRS = [
  { fr: '/fr/licences', en: '/en/licences' },
  { fr: '/fr/politique-ia', en: '/en/ai-policy' },
  { fr: '/fr/credits', en: '/en/credits' },
  { fr: '/fr/confidentialite', en: '/en/privacy' },
]

for (const pair of PAIRS) {
  test(`${pair.fr} is one page in two languages`, async ({ page }) => {
    await page.goto(pair.fr)

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://aubaine.io${pair.fr}`,
    )
    await expect(page.locator('link[rel=alternate][hreflang="en-GB"]')).toHaveAttribute(
      'href',
      `https://aubaine.io${pair.en}`,
    )

    await page.goto(pair.en)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
    await expect(page.locator('link[rel=alternate][hreflang="fr-FR"]')).toHaveAttribute(
      'href',
      `https://aubaine.io${pair.fr}`,
    )
  })
}

test('the home page carries the footer and reaches every policy from it', async ({ page }) => {
  await page.goto('/fr')

  const footer = page.locator('#site-footer')
  await expect(footer).toBeVisible()
  await expect(footer.getByRole('link', { name: 'CC BY-NC-SA 4.0' })).toBeVisible()

  const project = footer.locator('nav[aria-labelledby="footer-project"]')
  for (const pair of PAIRS) {
    await expect(project.locator(`a[href="${pair.fr}"]`)).toHaveCount(1)
  }
})

test('a policy link navigates through swup and the footer survives it', async ({ page }) => {
  await page.goto('/fr/arbres')
  await page.locator('#site-footer a[href="/fr/politique-ia"]').click()

  await expect(page).toHaveURL('/fr/politique-ia')
  await expect(page).toHaveTitle('Politique IA · Aubaine')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://aubaine.io/fr/politique-ia',
  )
  await expect(page.locator('#site-footer')).toBeVisible()
})

test('the credits page names every icon set and font family the site ships', async ({ page }) => {
  await page.goto('/en/credits')

  const attribution = page.locator('[data-attribution]')
  for (const set of ICON_SETS) {
    await expect(attribution.getByRole('link', { name: set.name })).toBeVisible()
  }
  for (const family of FONT_FAMILIES) {
    await expect(attribution.getByText(family.name, { exact: true })).toBeVisible()
  }
})

test('the licence in the footer leads to the licences page', async ({ page }) => {
  await page.goto('/en/trees')
  await page.locator('#site-footer [data-footer-licence]').click()

  await expect(page).toHaveURL('/en/licences')
  await expect(page.getByRole('heading', { level: 1, name: 'Licences' })).toBeVisible()
})

test('the reading column sits on the centre of a wide viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto('/fr/licences')

  const box = await page.locator('.au-reading__body').boundingBox()
  expect(box).not.toBeNull()
  if (!box) return

  expect(Math.abs(box.x - (1600 - box.x - box.width))).toBeLessThan(2)
})

test('the policy rail starts level with the title, as every other reading page does', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto('/fr/politique-ia')

  const rail = await page.locator('.au-aside').boundingBox()
  const head = await page.locator('.au-reading__head').boundingBox()
  expect(rail).not.toBeNull()
  expect(head).not.toBeNull()
  if (!rail || !head) return

  expect(Math.abs(rail.y - head.y)).toBeLessThan(2)
})

test('a link inside policy prose is set apart from the body', async ({ page }) => {
  await page.goto('/fr/licences')

  const link = page.locator('.au-prose a[href*="creativecommons.org"]')
  await expect(link).toBeVisible()

  const seen = await link.evaluate((node) => {
    const paragraph = node.closest('p')
    return {
      decoration: getComputedStyle(node).textDecorationLine,
      link: getComputedStyle(node).color,
      body: paragraph ? getComputedStyle(paragraph).color : '',
    }
  })

  expect(seen.decoration).toBe('underline')
  expect(seen.link).not.toBe(seen.body)
})

test('every policy page fits a 320 pixel viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })

  for (const pair of PAIRS) {
    await page.goto(pair.fr)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, pair.fr).toBeLessThanOrEqual(0)
  }
})
