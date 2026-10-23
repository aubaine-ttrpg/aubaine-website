import { expect, type Locator, type Page, test } from '@playwright/test'

function searchField(page: Page, name: string): Locator {
  return page.locator('#site-header').getByRole('searchbox', { name })
}

function result(page: Page, title: string): Locator {
  return page.locator('[data-search-row]').filter({ has: page.getByText(title, { exact: true }) })
}

function visibleRows(page: Page): Locator {
  return page.locator('[data-search-row]:visible')
}

function query(page: Page): string | null {
  return new URL(page.url()).searchParams.get('q')
}

async function markDocument(page: Page): Promise<void> {
  await page.waitForFunction(() => 'swup' in window)
  await page.evaluate(() => document.documentElement.setAttribute('data-same-document', ''))
}

async function expectSameDocument(page: Page): Promise<void> {
  await expect(page.locator('html')).toHaveAttribute('data-same-document', '')
}

test('a search address lists only the names that carry the query', async ({ page }) => {
  await page.goto('/fr/recherche?q=epee')

  await expect(result(page, 'Épée courte')).toBeVisible()
  await expect(result(page, 'Épée longue')).toBeVisible()
  await expect(result(page, 'Arc long')).toBeHidden()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Résultats pour epee')
  await expect(searchField(page, 'Rechercher dans Aubaine')).toHaveValue('epee')

  const shown = await visibleRows(page).count()
  await expect(page.locator('[data-search-count]')).toHaveText(`${shown} résultats`)
})

test('typing in the header searches from any page and keeps narrowing', async ({ page }) => {
  await page.goto('/en')
  await markDocument(page)
  const field = searchField(page, 'Search Aubaine')

  await field.pressSequentially('arc')
  await expect(page).toHaveURL(/\/en\/search\?q=arc$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for arc')
  await expect(field).toBeFocused()
  const broad = await visibleRows(page).count()

  await field.pressSequentially(' long')
  await expect.poll(() => query(page)).toBe('arc long')
  await expect(result(page, 'Arc long')).toBeVisible()
  await expect.poll(() => visibleRows(page).count()).toBeLessThan(broad)
  await expect(field).toBeFocused()
  await expectSameDocument(page)
})

test('a query no name carries shows the empty state', async ({ page }) => {
  await page.goto('/en/search?q=zzzz')

  await expect(page.locator('[data-search-empty]')).toBeVisible()
  await expect(page.locator('[data-search-count]')).toHaveText('0 results')
  await expect(page.locator('[data-search-group]:visible')).toHaveCount(0)
})

test('pressing Enter searches through client navigation', async ({ page }) => {
  await page.goto('/en/trees')
  await markDocument(page)
  const field = searchField(page, 'Search Aubaine')

  await field.fill('arc long')
  await field.press('Enter')

  await expect.poll(() => query(page)).toBe('arc long')
  await expect(result(page, 'Arc long')).toBeVisible()
  await expect(result(page, 'Berserker')).toBeHidden()
  await expectSameDocument(page)
})

test('going back to a search restores its results', async ({ page }) => {
  await page.goto('/fr/recherche?q=epee')
  await result(page, 'Épée courte').getByRole('link').click()
  await expect(page).toHaveURL('/fr/equipement#e-epee-courte')

  await page.goBack()
  await expect.poll(() => query(page)).toBe('epee')
  await expect(searchField(page, 'Rechercher dans Aubaine')).toHaveValue('epee')
  await expect(result(page, 'Épée courte')).toBeVisible()
  await expect(result(page, 'Arc long')).toBeHidden()
})

test('clearing the field on the results page lists everything again', async ({ page }) => {
  await page.goto('/en/search?q=arc')
  const total = await page.locator('[data-search-row]').count()
  await expect.poll(() => visibleRows(page).count()).toBeLessThan(total)

  await searchField(page, 'Search Aubaine').fill('')

  await expect(page).toHaveURL('/en/search')
  await expect(visibleRows(page)).toHaveCount(total)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Search')
})
