import { expect, test } from '@playwright/test'

test('swup navigation keeps the head correct', async ({ page }) => {
  await page.goto('/en/trees')
  await expect(page).toHaveTitle('Skill Trees · Aubaine')

  await page.getByRole('link', { name: 'Berserker' }).first().click()
  await expect(page).toHaveURL('/en/tree/berserker')
  await expect(page).toHaveTitle('Berserker · Aubaine')

  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://aubaine.io/en/tree/berserker',
  )
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
  await expect(page.locator('link[rel=alternate][hreflang="fr-FR"]')).toHaveAttribute(
    'href',
    'https://aubaine.io/fr/arbre/berserker',
  )
})

test('back and forward restore the previous page', async ({ page }) => {
  await page.goto('/en/trees')
  await page.getByRole('link', { name: 'Draugar' }).first().click()
  await expect(page).toHaveURL('/en/tree/draugar')

  await page.goBack()
  await expect(page).toHaveURL('/en/trees')

  await page.goForward()
  await expect(page).toHaveURL('/en/tree/draugar')
  await expect(page.getByRole('heading', { level: 1, name: 'Draugar' })).toBeVisible()
})

test('the language switch lands on the same entity', async ({ page }) => {
  await page.goto('/en/tree/berserker')
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('link', { name: /Français/ }).click()
  await expect(page).toHaveURL('/fr/arbre/berserker')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR')
})

test('the theme survives navigation and reload', async ({ page }) => {
  await page.goto('/en/trees')
  const initial = await page.locator('html').getAttribute('data-theme')
  await page.locator('[data-theme-toggle]').click()
  const toggled = await page.locator('html').getAttribute('data-theme')
  expect(toggled).not.toBe(initial)

  await expect(page.locator('[data-theme-rays]')).toHaveCSS(
    'opacity',
    toggled === 'light' ? '1' : '0',
  )

  await page.getByRole('link', { name: 'Home' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', toggled as string)

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', toggled as string)
})

test('the theme toggle keeps a localized name without a text label', async ({ page }) => {
  await page.goto('/fr/arbres')
  await expect(
    page.getByRole('button', { name: 'Basculer le thème clair ou sombre' }),
  ).toBeVisible()
  await expect(page.locator('[data-theme-toggle]')).toHaveText('')
})

test('a selected skill tree node deep links and highlights', async ({ page }) => {
  await page.goto('/en/tree/berserker/RAGER-01')
  await expect(page.locator('[data-plate-node][aria-current="true"]')).toHaveCount(1)
  await expect(page.locator('#skill-RAGER-01')).toBeVisible()
})

test('an unknown url returns a real 404', async ({ page }) => {
  const response = await page.goto('/en/does-not-exist')
  expect(response?.status()).toBe(404)
})

test('internal search is excluded from robots', async ({ request }) => {
  const response = await request.get('/robots.txt')
  const body = await response.text()
  expect(body).toContain('Disallow: /en/search')
  expect(body).toContain('Disallow: /fr/recherche')
})

test('the language switch keeps a booklet history on the same booklet', async ({ page }) => {
  await page.goto('/en/archives/berserker')
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('link', { name: /Français/ }).click()
  await expect(page).toHaveURL('/fr/archives/berserker')
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr-FR')
})

test('the footer reaches the archive and survives the swap', async ({ page }) => {
  await page.goto('/fr/arbres')
  await page.locator('[data-footer-archives]').click()
  await expect(page).toHaveURL('/fr/archives')
  await expect(page).toHaveTitle(/Archives · Aubaine/)
  await expect(page.locator('[data-footer-archives]')).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://aubaine.io/fr/archives',
  )
})

test('a book chapter reaches its history through a full swap', async ({ page }) => {
  await page.goto('/fr/livres/livre-du-joueur/comment-jouer')
  await page.locator('[data-versions]').click()
  await expect(page).toHaveURL('/fr/archives/livre-du-joueur')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('the species index reaches a species through a swap', async ({ page }) => {
  await page.goto('/en/species')
  await page.locator('[data-cover-card]').first().click()
  await expect(page).toHaveURL(/\/en\/species\/[a-z-]+$/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('[data-rows] [data-entry]')).not.toHaveCount(0)
})
