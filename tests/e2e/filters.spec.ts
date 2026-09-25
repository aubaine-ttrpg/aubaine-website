import { expect, type Page, test } from '@playwright/test'

async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

test('the trees filter narrows by name and by facet', async ({ page }) => {
  await page.goto('/en/trees')
  await hydrated(page)
  const count = page.locator('[aria-live="polite"]').first()
  await expect(count).toHaveText('24 results')

  await page.getByPlaceholder('Filter by name').fill('feu')
  await expect(count).toHaveText('1 result')

  await page.getByPlaceholder('Filter by name').fill('')
  await expect(count).toHaveText('24 results')

  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /^Psychic/ }).click()
  await expect(count).toHaveText('6 results')

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
  const total = await count.textContent()

  await page.getByPlaceholder('Filter by name').fill('zzzz')
  await expect(page.locator('main').getByText('Nothing in this part of the codex.')).toBeVisible()

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
  await expect(page.locator('[data-rows] [data-entry="ATTAQ-01"]')).toBeVisible()
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

  await page.goto('/en/skills#e-RAGER-01')
  await expect(page.locator('#e-RAGER-01')).toBeVisible()
})
