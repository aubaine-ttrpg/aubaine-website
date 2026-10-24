import { expect, type Page, test } from '@playwright/test'

import { corpus } from './support/corpus'
import { resultLabel } from './support/results'

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

async function entryCounts(page: Page): Promise<{ all: number; published: number }> {
  return {
    all: await page.locator('[data-entry]').count(),
    published: await page.locator('[data-entry]:not([data-facet-sta="draft"])').count(),
  }
}

test('drafts are hidden by default and the switch shows them', async ({ page }) => {
  await page.goto('/en/species')
  await hydrated(page)
  const { all, published } = await entryCounts(page)
  expect(all, 'the species need a draft for the switch to show').toBeGreaterThan(published)
  await expect(draftsSwitch(page)).not.toBeChecked()
  await expect(results(page)).toHaveText(resultLabel(published, 'en'))
  await expect(visibleEntries(page)).toHaveCount(published)

  await draftsSwitch(page).click()
  await expect(draftsSwitch(page)).toBeChecked()
  await expect(results(page)).toHaveText(resultLabel(all, 'en'))
  await expect(visibleEntries(page)).toHaveCount(all)

  await draftsSwitch(page).click()
  await expect(results(page)).toHaveText(resultLabel(published, 'en'))
})

test('a list made only of drafts shows an empty state', async ({ page }) => {
  const english = await corpus('en')
  const species = english.species.find(
    (entry) =>
      entry.pool.length > 0 &&
      entry.pool.every((skill) => english.skillStatus.get(skill.id) === 'draft'),
  )
  expect(species, 'no species lists only drafts').toBeDefined()
  await page.goto(`/en/species/${species?.id}`)
  await hydrated(page)
  await expect(results(page)).toHaveText(resultLabel(0, 'en'))
  await expect(page.getByText('Nothing to show yet.')).toBeVisible()
  await expect(page.locator('[data-filter-empty="unpublished"] .au-empty__mark')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reset' })).toHaveCount(0)

  await draftsSwitch(page).click()
  await expect(draftsSwitch(page)).toBeChecked()
  await expect(results(page)).toHaveText(resultLabel((await entryCounts(page)).all, 'en'))
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
  await expect(results(page)).toHaveText(resultLabel((await entryCounts(page)).all, 'en'))

  await page.locator('[data-nav="almanach"]').click()
  await expect(page).toHaveURL('/en/almanach')
  await page.getByRole('link', { name: 'Skill Trees', exact: true }).click()
  await expect(page).toHaveURL('/en/trees')
  await hydrated(page)
  await expect(draftsSwitch(page)).toBeChecked()
  await expect(results(page)).toHaveText(resultLabel((await entryCounts(page)).all, 'en'))
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
  const draftName = await page.evaluate(() => {
    const entries = [...document.querySelectorAll<HTMLElement>('[data-entry]')]
    const published = entries
      .filter((entry) => entry.dataset['facetSta'] !== 'draft')
      .map((entry) => entry.dataset['name'] ?? '')
    return entries.find(
      (entry) =>
        entry.dataset['facetSta'] === 'draft' &&
        !published.some((name) => name.includes(entry.dataset['name'] ?? '')),
    )?.dataset['name']
  })
  expect(draftName, 'the equipment needs a draft no published piece is named after').toBeDefined()
  await page.getByPlaceholder('Filter by name').fill(draftName ?? '')
  await expect(results(page)).toHaveText(resultLabel(0, 'en'))
  await expect(page.locator('[data-details]')).toBeHidden()
})

test('a link to a draft still opens it while drafts are hidden', async ({ page }) => {
  const draft = [...(await corpus('en')).itemsBySlug].find(([, item]) => item.status === 'draft')
  expect(draft, 'no equipment piece is a draft').toBeDefined()
  const slug = draft?.[0] ?? ''
  await page.goto(`/en/equipment#e-${slug}`)
  await expect(page.locator('[data-browse]')).toHaveAttribute('data-selection', 'enhanced')
  await hydrated(page)
  await expect(page.locator(`#e-${slug}`)).toBeVisible()
  await expect(page.locator(`[data-entry="${slug}"] [data-row]`)).toHaveAttribute(
    'aria-current',
    'true',
  )
  const { published } = await entryCounts(page)
  await expect(results(page)).toHaveText(resultLabel(published + 1, 'en'))
})

test('drafts stay hidden before the filter island hydrates', async ({ page }) => {
  await page.route(/FilterBar/, (route) => route.abort())
  await page.goto('/en/species')
  await expect(page.locator('astro-island[ssr]')).toHaveCount(1)
  const { published } = await entryCounts(page)
  await expect(visibleEntries(page)).toHaveCount(published)
  await expect(results(page)).toHaveText(new RegExp(`^${resultLabel(published, 'en')}$`, 'i'), {
    useInnerText: true,
  })
})
