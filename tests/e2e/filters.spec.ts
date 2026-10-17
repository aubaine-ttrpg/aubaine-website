import { expect, type Page, test } from '@playwright/test'

async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

async function startWithoutIslands(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForFunction(() => 'swup' in window)
  await page.evaluate(() => document.documentElement.setAttribute('data-same-document', ''))
}

async function openTreesFromHome(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'Open the Trees' }).click()
  await expect(page).toHaveURL('/en/trees')
}

async function filterTreesByName(page: Page): Promise<void> {
  await expect(page.locator('astro-island')).toHaveCount(1)
  await hydrated(page)
  await page.getByPlaceholder('Filter by name').fill('feu')
  await expect(page.locator('[aria-live="polite"]').first()).toHaveText('1 result')
  await expect(page.locator('html')).toHaveAttribute('data-same-document', '')
}

test('the trees filter works after a visit from the home page', async ({ page }) => {
  await startWithoutIslands(page, '/en')
  await openTreesFromHome(page)
  await filterTreesByName(page)
})

test('the trees filter works after a visit that started on the Atlas', async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem('aubaine.atlas.settings', JSON.stringify({ quality: 'low' })),
  )
  await startWithoutIslands(page, '/en/atlas')
  await page.locator('#site-header [data-nav="home"]').click()
  await expect(page).toHaveURL('/en')
  await openTreesFromHome(page)
  await filterTreesByName(page)
})

test('the trees filter lets go of the page it leaves and works again on return', async ({
  page,
}) => {
  await startWithoutIslands(page, '/en/trees')
  await hydrated(page)
  await page.evaluate(() => {
    document.querySelector('astro-island')?.addEventListener('astro:unmount', () => {
      document.documentElement.setAttribute('data-filter-unmounted', '')
    })
  })
  await page.locator('#site-header [data-nav="home"]').click()
  await expect(page).toHaveURL('/en')
  await expect(page.locator('html')).toHaveAttribute('data-filter-unmounted', '')
  await openTreesFromHome(page)
  await filterTreesByName(page)
})

test('the trees filter narrows by name and by facet', async ({ page }) => {
  await page.goto('/en/trees')
  await hydrated(page)
  const count = page.locator('[aria-live="polite"]').first()
  await expect(count).toHaveText('25 results')

  await page.getByPlaceholder('Filter by name').fill('feu')
  await expect(count).toHaveText('1 result')

  await page.getByPlaceholder('Filter by name').fill('')
  await expect(count).toHaveText('25 results')

  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /^Psychic/ }).click()
  await expect(count).toHaveText('5 results')

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('a species filters its pool by sub-species', async ({ page }) => {
  await page.goto('/en/species/humain')
  await hydrated(page)
  const count = page.locator('[aria-live="polite"]').first()
  await expect(count).toHaveText('11 results')

  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: /^Landenheit/ }).click()
  await expect(count).toHaveText('2 results')

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('a species names its sub-species facet after what it calls them', async ({ page }) => {
  await page.goto('/en/species/mort-vivant')
  await hydrated(page)
  const count = page.locator('[aria-live="polite"]').first()
  await expect(count).toHaveText('10 results')

  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('group', { name: 'Subspecies' })).toBeVisible()
  await expect(dialog.getByRole('group', { name: 'Regional origin' })).toHaveCount(0)
  await dialog.getByRole('button', { name: /^Ghost/ }).click()
  await expect(count).toHaveText('1 result')
  await page.keyboard.press('Escape')

  await page.goto('/en/species/humain')
  await hydrated(page)
  await page.getByRole('button', { name: 'Filters' }).click()
  await expect(
    page.getByRole('dialog').getByRole('group', { name: 'Regional origin' }),
  ).toBeVisible()
})

test('the filter modal is reachable and dismissable by keyboard', async ({ page }) => {
  await page.goto('/en/rules')
  await hydrated(page)
  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('resetting restores every entry', async ({ page }) => {
  await page.goto('/en/equipment')
  await hydrated(page)
  const count = page.locator('[aria-live="polite"]').first()
  await expect(count.locator('[data-drafts-count]')).toHaveCount(0)
  const total = await count.textContent()

  await page.getByPlaceholder('Filter by name').fill('zzzz')
  await expect(page.locator('main').getByText('No results.')).toBeVisible()

  await page.getByRole('button', { name: 'Reset' }).first().click()
  await expect(count).toHaveText(total ?? '')
})

test('the skills filter narrows by École', async ({ page }) => {
  await page.goto('/en/skills')
  await hydrated(page)
  const rows = page.locator('[data-rows] [data-entry]')
  const total = await rows.count()

  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: /^Illusion/ }).click()
  await page.keyboard.press('Escape')

  const shown = page.locator('[data-rows] [data-entry]:not([hidden])')
  const count = await shown.count()
  expect(count).toBeGreaterThan(0)
  expect(count).toBeLessThan(total)
  for (const school of await shown.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-facet-sch') ?? ''),
  )) {
    expect(school.split(' ')).toContain('illusion')
  }
})

test('the rules filter narrows the list to one family', async ({ page }) => {
  await page.goto('/en/rules')
  await hydrated(page)

  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: /^State/ }).click()
  await page.keyboard.press('Escape')

  const shown = page.locator('[data-rows] [data-entry]:not([hidden])')
  expect(await shown.count()).toBeGreaterThan(0)
  for (const family of await shown.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-facet-fam') ?? ''),
  )) {
    expect(family.split(' ')).toEqual(['state'])
  }
})

test('the skills filter gathers the basic skills under their own provenance', async ({ page }) => {
  await page.goto('/fr/competences')
  await hydrated(page)

  await page.getByRole('button', { name: 'Filtres' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: /^Compétences de base/ }).click()
  await page.keyboard.press('Escape')

  const shown = page.locator('[data-rows] [data-entry]:not([hidden])')
  await expect(page.locator('[data-rows] [data-entry="ATTAQU-001"]')).toBeVisible()
  for (const acquisition of await shown.evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute('data-facet-acq') ?? ''),
  )) {
    expect(acquisition.split(' ')).toContain('basic')
  }
})

test('a browse entry is selectable through its own url', async ({ page }) => {
  await page.goto('/en/skills')
  await hydrated(page)
  const first = page.locator('[data-detail]').first()
  await expect(first).toBeVisible()

  await page.goto('/en/skills#e-RAGEXX-001')
  await expect(page.locator('#e-RAGEXX-001')).toBeVisible()
})
