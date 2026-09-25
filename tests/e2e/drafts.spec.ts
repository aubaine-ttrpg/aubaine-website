import { expect, type Page, test } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

function results(page: Page) {
  return page.locator('[aria-live="polite"]').first()
}

function draftsSwitch(page: Page) {
  return page.getByRole('switch', { name: 'Drafts', exact: true })
}

function visibleEntries(page: Page) {
  return page.locator('[data-entry]').filter({ visible: true })
}

test('drafts are hidden by default and the switch shows them', async ({ page }) => {
  await page.goto('/en/species')
  await hydrated(page)
  await expect(draftsSwitch(page)).not.toBeChecked()
  await expect(results(page)).toHaveText('4 results')
  await expect(visibleEntries(page)).toHaveCount(4)

  await draftsSwitch(page).click()
  await expect(draftsSwitch(page)).toBeChecked()
  await expect(results(page)).toHaveText('17 results')
  await expect(visibleEntries(page)).toHaveCount(17)

  await draftsSwitch(page).click()
  await expect(results(page)).toHaveText('4 results')
})

test('a list made only of drafts shows an empty state', async ({ page }) => {
  await page.goto('/en/trees')
  await hydrated(page)
  await expect(results(page)).toHaveText('0 results')
  await expect(page.getByText('Nothing to show yet.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reset' })).toHaveCount(0)

  await draftsSwitch(page).click()
  await expect(draftsSwitch(page)).toBeChecked()
  await expect(results(page)).toHaveText('24 results')
  await expect(page.getByText('Nothing to show yet.')).toBeHidden()
})

test('the preference survives a reload and follows the reader to another list', async ({
  page,
}) => {
  await page.goto('/en/species')
  await hydrated(page)
  await draftsSwitch(page).click()

  await page.reload()
  await hydrated(page)
  await expect(draftsSwitch(page)).toBeChecked()
  await expect(results(page)).toHaveText('17 results')

  await page.locator('[data-nav="almanach"]').click()
  await expect(page).toHaveURL('/en/almanach')
  await page.getByRole('link', { name: 'Skill Trees', exact: true }).click()
  await expect(page).toHaveURL('/en/trees')
  await hydrated(page)
  await expect(draftsSwitch(page)).toBeChecked()
  await expect(results(page)).toHaveText('24 results')
})

test('the switch answers the keyboard', async ({ page }) => {
  await page.goto('/en/species')
  await hydrated(page)
  await draftsSwitch(page).focus()
  await page.keyboard.press('Space')
  await expect(draftsSwitch(page)).toBeChecked()
})

test('a list of drafts leaves no stale detail on screen', async ({ page }) => {
  await page.goto('/en/equipment')
  await hydrated(page)
  await expect(results(page)).toHaveText('1 result')
  await page.getByPlaceholder('Filter by name').fill('Dague')
  await expect(results(page)).toHaveText('0 results')
  await expect(page.locator('[data-details]')).toBeHidden()
})

test('a link to a draft still opens it while drafts are hidden', async ({ page }) => {
  await page.goto('/en/equipment#e-arc-long')
  await expect(page.locator('[data-browse]')).toHaveAttribute('data-selection', 'enhanced')
  await hydrated(page)
  await expect(page.locator('#e-arc-long')).toBeVisible()
  await expect(page.locator('[data-entry="arc-long"] [data-row]')).toHaveAttribute(
    'aria-current',
    'true',
  )
  await expect(results(page)).toHaveText('2 results')
})

test('drafts stay hidden before the filter island hydrates', async ({ page }) => {
  await page.route(/FilterBar/, (route) => route.abort())
  await page.goto('/en/species')
  await expect(page.locator('astro-island[ssr]')).toHaveCount(1)
  await expect(visibleEntries(page)).toHaveCount(4)
  await expect(results(page)).toHaveText(/^4 results$/i, { useInnerText: true })
})
