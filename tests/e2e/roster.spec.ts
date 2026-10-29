import { expect, type Page, test } from '@playwright/test'

import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'
import { atMoment, freezeAnimations } from './support/animations'
import { corpus } from './support/corpus'

test.use({ storageState: { cookies: [], origins: [] } })

const ROSTERS = [
  { path: pathFor('trees', 'en'), entries: async () => (await corpus('en')).trees },
  { path: pathFor('species', 'en'), entries: async () => (await corpus('en')).species },
] as const

const CARD = '[data-entry]'

function hiddenDuringDeal(page: Page): Promise<number> {
  return page.evaluate((selector) => {
    let invisible = 0
    for (const card of document.querySelectorAll<HTMLElement>(selector)) {
      const box = card.getBoundingClientRect()
      const style = getComputedStyle(card)
      if (box.width === 0 || style.opacity !== '1' || style.visibility !== 'visible') invisible += 1
    }
    return invisible
  }, CARD)
}

for (const roster of ROSTERS) {
  test(`${roster.path} lists every entry by default, drafts included`, async ({ page }) => {
    const entries = await roster.entries()
    await page.goto(roster.path)
    await expect(page.locator(CARD)).toHaveCount(entries.length)
    await expect(page.locator(CARD).filter({ visible: true })).toHaveCount(entries.length)
  })
}

test('a draft is stamped once and stays a link to its page', async ({ page }) => {
  const draft = (await corpus('en')).trees.find((tree) => tree.status === 'draft')
  expect(draft, 'the trees need a draft').toBeDefined()
  await page.goto(pathFor('trees', 'en'))
  const card = page.locator(`[data-entry="${draft?.id}"]`)
  await expect(card.locator('.au-badge')).toHaveCount(1)
  await expect(card.locator('.au-badge')).toHaveText(strings('en').draft)
  await card.getByRole('link').click()
  await expect(page).toHaveURL(pathFor('tree', 'en', { tree: draft?.id ?? '' }))
})

test('a published entry carries no draft stamp', async ({ page }) => {
  const published = (await corpus('en')).species.find((entry) => entry.status !== 'draft')
  expect(published, 'the species need a published entry').toBeDefined()
  await page.goto(pathFor('species', 'en'))
  await expect(
    page.locator(`[data-entry="${published?.id}"] .au-roster__status--stamp`),
  ).toHaveCount(0)
})

test('no card is invisible at any moment of the deal', async ({ page }) => {
  await freezeAnimations(page)
  await page.goto(pathFor('trees', 'en'))
  for (const moment of [0, 120, 300, 520]) {
    await atMoment(page, moment, CARD)
    expect(await hiddenDuringDeal(page), `at ${moment} ms`).toBe(0)
  }
})

test('filtering by name hides the cards that do not match', async ({ page }) => {
  const trees = (await corpus('en')).trees
  const target = trees[0]
  expect(target, 'the trees need an entry').toBeDefined()
  await page.goto(pathFor('trees', 'en'))
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
  await page.getByPlaceholder(strings('en').filterHere).fill(target?.name ?? '')
  const matching = trees.filter((tree) =>
    tree.name.toLowerCase().includes((target?.name ?? '').toLowerCase()),
  )
  await expect(page.locator(CARD).filter({ visible: true })).toHaveCount(matching.length)
})

test('a roster card leans toward the pointer', async ({ page }) => {
  await page.goto(pathFor('species', 'en'))
  const link = page.locator('[data-cover-card]').first()
  await link.scrollIntoViewIfNeeded()
  await page
    .locator(CARD)
    .first()
    .evaluate((card) => Promise.all(card.getAnimations().map((animation) => animation.finished)))
  const box = await link.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move((box?.x ?? 0) + (box?.width ?? 0) * 0.9, (box?.y ?? 0) + 20)
  await expect(link).toHaveAttribute('data-tilting', '')
  const lean = await link.evaluate((element) =>
    Number(getComputedStyle(element).getPropertyValue('--tilt-x')),
  )
  expect(lean).toBeGreaterThan(0)
})
