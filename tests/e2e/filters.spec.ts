import { expect, type Page, test } from '@playwright/test'

import { resultLabel } from './support/results'

async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

function results(page: Page) {
  return page.locator('[aria-live="polite"]').first()
}

async function nameMatches(page: Page): Promise<{ name: string; matched: number; total: number }> {
  const names = await page
    .locator('[data-entry]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-name') ?? ''))
  const name = names[0] ?? ''
  return {
    name,
    matched: names.filter((entry) => entry.includes(name)).length,
    total: names.length,
  }
}

async function facetMatches(
  page: Page,
  group: string,
): Promise<{ label: string; matched: number; total: number }> {
  const labels = await page
    .locator('[data-entry]')
    .evaluateAll(
      (nodes, attribute) =>
        nodes.map((node) => (node.getAttribute(attribute) ?? '').split('|').filter(Boolean)),
      `data-facet-${group}-labels`,
    )
  const label = labels.flat()[0] ?? ''
  return {
    label,
    matched: labels.filter((entry) => entry.includes(label)).length,
    total: labels.length,
  }
}

function chip(page: Page, label: string) {
  return page
    .getByRole('dialog')
    .getByRole('button')
    .filter({ has: page.getByText(label, { exact: true }) })
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
  const { name, matched, total } = await nameMatches(page)
  expect(matched).toBeLessThan(total)
  await page.getByPlaceholder('Filter by name').fill(name)
  await expect(results(page)).toHaveText(resultLabel(matched, 'en'))
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
  const { name, matched, total } = await nameMatches(page)
  await expect(results(page)).toHaveText(resultLabel(total, 'en'))

  await page.getByPlaceholder('Filter by name').fill(name)
  await expect(results(page)).toHaveText(resultLabel(matched, 'en'))

  await page.getByPlaceholder('Filter by name').fill('')
  await expect(results(page)).toHaveText(resultLabel(total, 'en'))

  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const domain = await facetMatches(page, 'tdom')
  expect(domain.matched).toBeGreaterThan(0)
  expect(domain.matched).toBeLessThan(total)
  await chip(page, domain.label).click()
  await expect(results(page)).toHaveText(resultLabel(domain.matched, 'en'))

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('a species filters its pool by sub-species', async ({ page }) => {
  await page.goto('/en/species/humain')
  await hydrated(page)
  const origin = await facetMatches(page, 'sub')
  await expect(results(page)).toHaveText(resultLabel(origin.total, 'en'))
  expect(origin.matched).toBeGreaterThan(0)
  expect(origin.matched).toBeLessThan(origin.total)

  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await chip(page, origin.label).click()
  await expect(results(page)).toHaveText(resultLabel(origin.matched, 'en'))

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

test('a species names its sub-species facet after what it calls them', async ({ page }) => {
  await page.goto('/en/species/mort-vivant')
  await hydrated(page)
  const subspecies = await facetMatches(page, 'sub')
  await expect(results(page)).toHaveText(resultLabel(subspecies.total, 'en'))

  await page.getByRole('button', { name: 'Filters' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('group', { name: 'Subspecies' })).toBeVisible()
  await expect(dialog.getByRole('group', { name: 'Regional origin' })).toHaveCount(0)
  await chip(page, subspecies.label).click()
  await expect(results(page)).toHaveText(resultLabel(subspecies.matched, 'en'))
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
