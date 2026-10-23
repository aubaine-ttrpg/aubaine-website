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

function animation(row: Locator): Promise<{ name: string; delay: string; duration: string }> {
  return row.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      name: style.animationName,
      delay: style.animationDelay,
      duration: style.animationDuration,
    }
  })
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

test('arriving results rise one after another in the order they are listed', async ({ page }) => {
  await page.goto('/en/search?q=arc')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for arc')

  const rows = visibleRows(page)
  const first = await animation(rows.nth(0))
  const second = await animation(rows.nth(1))
  const third = await animation(rows.nth(2))
  expect(first.name).toBe('au-rise')
  expect([first.delay, second.delay, third.delay]).toEqual(['0s', '0.03s', '0.06s'])
})

test('a refinement fades in only the rows it brings back', async ({ page }) => {
  await page.goto('/en/search?q=arc%20long')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for arc long')
  await expect(result(page, 'Arc court')).toBeHidden()

  await searchField(page, 'Search Aubaine').fill('arc')

  await expect(result(page, 'Arc court')).toBeVisible()
  expect((await animation(result(page, 'Arc court'))).name).toBe('au-fade')
  expect((await animation(result(page, 'Arc long'))).name).toBe('au-rise')
})

test('the search field shows it is working until the results arrive', async ({ page }) => {
  await page.goto('/en/trees')
  await page.waitForFunction(() => 'swup' in window)
  const form = page.locator('#site-header [data-search-form]')

  await searchField(page, 'Search Aubaine').pressSequentially('arc')
  await expect(form).toHaveAttribute('data-search-pending', '')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Results for arc')
  await expect(form).not.toHaveAttribute('data-search-pending')
})

test('clearing the field before the search starts stays on the page', async ({ page }) => {
  await page.goto('/en/trees')
  await page.waitForFunction(() => 'swup' in window)
  const field = searchField(page, 'Search Aubaine')

  await field.fill('a')
  await field.fill('')

  await expect(page.locator('#site-header [data-search-form]')).not.toHaveAttribute(
    'data-search-pending',
  )
  await page.waitForTimeout(600)
  await expect(page).toHaveURL('/en/trees')
})

test('results appear at once when the reader prefers reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/search?q=arc')

  const { duration } = await animation(visibleRows(page).first())
  expect(Number.parseFloat(duration)).toBeLessThan(0.01)
})
