import { expect, type Page, test } from '@playwright/test'

async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

async function enhanced(page: Page): Promise<void> {
  await expect(page.locator('[data-browse]')).toHaveAttribute('data-selection', 'enhanced')
}

function row(page: Page, id: string) {
  return page.locator(`[data-entry="${id}"] [data-row]`)
}

async function firstDetail(page: Page) {
  const id = await page.locator('[data-rows] [data-entry]').first().getAttribute('data-entry')
  expect(id).not.toBeNull()
  return page.locator(`#e-${id}`)
}

test('the markup ships the scriptless selection floor', async ({ request }) => {
  const html = await (await request.get('/en/skills')).text()
  expect(html).toContain('data-selection="static"')
  expect(html).toContain('data-rows data-no-swup')
})

test('a hash typed into the address bar selects its entry', async ({ page }) => {
  await page.goto('/en/skills')
  await enhanced(page)
  await expect(await firstDetail(page)).toBeVisible()

  await page.goto('/en/skills#e-RAGEXX-001')
  await expect(page.locator('#e-RAGEXX-001')).toBeVisible()
  await expect(row(page, 'RAGEXX-001')).toHaveAttribute('aria-current', 'true')
})

test('clicking a row swaps the detail panel', async ({ page }) => {
  await page.goto('/en/skills')
  await enhanced(page)
  const first = await firstDetail(page)
  await expect(first).toBeVisible()

  await row(page, 'RAGEXX-001').click()
  await expect(page.locator('#e-RAGEXX-001')).toBeVisible()
  await expect(first).toBeHidden()
})

test('the selected row is the only one marked current', async ({ page }) => {
  await page.goto('/en/equipment')
  await enhanced(page)

  await row(page, 'arc-long').click()
  await expect(page.locator('[data-row][aria-current]')).toHaveCount(1)
  await expect(row(page, 'arc-long')).toHaveAttribute('aria-current', 'true')

  await row(page, 'arc-court').click()
  await expect(page.locator('[data-row][aria-current]')).toHaveCount(1)
  await expect(row(page, 'arc-court')).toHaveAttribute('aria-current', 'true')
})

test('a selection survives reload through its url', async ({ page }) => {
  await page.goto('/en/skills')
  await enhanced(page)

  await row(page, 'RAGEXX-001').click()
  await expect(page).toHaveURL('/en/skills#e-RAGEXX-001')

  await page.reload()
  await enhanced(page)
  await expect(page.locator('#e-RAGEXX-001')).toBeVisible()
  await expect(row(page, 'RAGEXX-001')).toHaveAttribute('aria-current', 'true')
})

test('selecting leaves the history intact for the back button', async ({ page }) => {
  await page.goto('/en/almanach')
  await page.getByRole('link', { name: 'Skills' }).first().click()
  await expect(page).toHaveURL('/en/skills')
  await enhanced(page)

  await row(page, 'RAGEXX-001').click()
  await row(page, 'APPNAT-001').click()

  await page.goBack()
  await expect(page).toHaveURL('/en/almanach')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('a search result deep links into the index it names', async ({ page }) => {
  await page.goto('/en/search')
  const result = page.locator('a[href="/en/equipment#e-arc-long"]').first()
  await expect(result).toBeVisible()

  await result.click()
  await expect(page).toHaveURL('/en/equipment#e-arc-long')
  await enhanced(page)
  await expect(page.locator('#e-arc-long')).toBeVisible()
  await expect(row(page, 'arc-long')).toHaveAttribute('aria-current', 'true')
})

test('selecting does not scroll the document on a desktop viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/en/skills')
  await enhanced(page)

  await row(page, 'APPNAT-001').scrollIntoViewIfNeeded()
  await expect(row(page, 'APPNAT-001')).toBeInViewport()
  const before = await page.evaluate(() => window.scrollY)

  await row(page, 'APPNAT-001').click()
  await expect(page.locator('#e-APPNAT-001')).toBeVisible()
  expect(await page.evaluate(() => window.scrollY)).toBe(before)
})

test('a row is operable by keyboard and hands focus to the detail', async ({ page }) => {
  await page.goto('/en/skills')
  await enhanced(page)

  await row(page, 'RAGEXX-001').focus()
  await page.keyboard.press('Enter')

  await expect(page.locator('#e-RAGEXX-001')).toBeVisible()
  await expect(page.locator('#e-RAGEXX-001')).toBeFocused()
})

test('the detail panel opens a new entry at its own top', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 })
  await page.goto('/en/skills')
  await enhanced(page)

  await row(page, 'RAGEXX-001').click()
  await page.locator('[data-details]').evaluate((panel) => {
    panel.scrollTop = panel.scrollHeight
  })
  expect(await page.locator('[data-details]').evaluate((panel) => panel.scrollTop)).toBeGreaterThan(
    0,
  )

  await row(page, 'APPNAT-001').click()
  expect(await page.locator('[data-details]').evaluate((panel) => panel.scrollTop)).toBe(0)
})

test('filtering every entry away leaves no stale detail on screen', async ({ page }) => {
  await page.goto('/en/equipment')
  await hydrated(page)
  await enhanced(page)
  await expect(page.locator('[data-details]')).toBeVisible()

  await page.getByPlaceholder('Filter by name').fill('zzzz')
  await expect(page.locator('[data-details]')).toBeHidden()

  await page.getByPlaceholder('Filter by name').fill('')
  await expect(page.locator('[data-details]')).toBeVisible()
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('a row still selects its detail', async ({ page }) => {
    await page.goto('/en/skills')
    await enhanced(page)

    await row(page, 'RAGEXX-001').click()
    await expect(page.locator('#e-RAGEXX-001')).toBeVisible()
    await expect(row(page, 'RAGEXX-001')).toHaveAttribute('aria-current', 'true')
  })
})

test('a resting tooltip occupies no layout', async ({ page }) => {
  await page.goto('/en/skills')
  await enhanced(page)

  const tip = page.locator('aside[data-details] [data-tip]').first()
  expect(await tip.evaluate((node) => node.getClientRects().length)).toBe(0)
})

test('the Common Bank source opens its note and closes it again', async ({ page }) => {
  await page.goto('/en/skills#e-REPVIF-001')
  await enhanced(page)

  const source = page.locator('#e-REPVIF-001').getByRole('button', { name: 'Common Bank' })
  const note = page.locator('#note-bank-REPVIF-001')
  await expect(note).toBeHidden()

  await source.click()
  await expect(note).toBeVisible()
  await expect(note).toContainText('Common Bank skills are independent from one another.')
  await page.keyboard.press('Escape')
  await expect(note).toBeHidden()

  await source.click()
  await note.getByRole('button', { name: 'Close' }).click()
  await expect(note).toBeHidden()
})

test('the basic skills source opens its note', async ({ page }) => {
  await page.goto('/en/skills#e-ATTAQU-001')
  await enhanced(page)

  const source = page.locator('#e-ATTAQU-001').getByRole('button', { name: 'Basic Skills' })
  const note = page.locator('#note-basic-ATTAQU-001')
  await expect(note).toBeHidden()
  await source.click()
  await expect(note).toBeVisible()
  await expect(note).toContainText('Every creature has the basic Skills')
})

test('a cross reference to a skill of the same index selects that skill', async ({ page }) => {
  await page.goto('/fr/competences#e-ATTOPP-001')
  await enhanced(page)

  await page.locator('#e-ATTOPP-001 a[href="/fr/competences#e-DESENG-001"]').click()
  await expect(page).toHaveURL('/fr/competences#e-DESENG-001')
  await expect(page.locator('#e-DESENG-001')).toBeVisible()
  await expect(page.locator('#e-ATTOPP-001')).toBeHidden()
  await expect(row(page, 'DESENG-001')).toHaveAttribute('aria-current', 'true')
})

test('selecting a rule word shows its definition', async ({ page }) => {
  await page.goto('/fr/regles')
  await enhanced(page)

  await row(page, 'rule-avantage').click()
  const detail = page.locator('#e-rule-avantage')
  await expect(detail).toBeVisible()
  await expect(detail.locator('.au-term-entry__name')).toHaveText('Avantage')
  await expect(detail.locator('.au-term-entry__desc')).toHaveText(/\S/)
})

test('a tree source opens the skill on its plate', async ({ page }) => {
  await page.goto('/en/skills#e-RAGEXX-001')
  await enhanced(page)

  const source = page.locator('#e-RAGEXX-001').getByRole('link', { name: 'Berserker' })
  await expect(source).toHaveAttribute('href', '/en/tree/berserker/RAGEXX-001#arbre')
  await source.click()
  await expect(page).toHaveURL('/en/tree/berserker/RAGEXX-001#arbre')
  await expect(page.locator('#tree-detail [data-selected-node="RAGEXX-001"]')).toBeVisible()
  await expect(page.locator('#arbre')).toBeInViewport()
})

for (const { path, kind, name } of [
  { path: '/en/skills#e-BOUFEU-001', kind: 'Practice', name: 'Spell' },
  { path: '/fr/competences#e-BOUFEU-001', kind: 'Pratique', name: 'Sort' },
]) {
  test(`a tag opens its definition on keyboard focus at ${path}`, async ({ page }) => {
    await page.goto(path)
    await enhanced(page)

    const tag = page.locator('#e-BOUFEU-001 .au-skill__tag').first()
    const tip = tag.locator('[data-tip]')
    await expect(tip).toBeHidden()
    await tag.focus()
    await expect(tip).toBeVisible()
    await expect(tip).toContainText(kind)
    await expect(tip).toContainText(name)
  })
}

test('the detail panel never scrolls sideways', async ({ page }) => {
  await page.goto('/en/skills')
  await enhanced(page)

  const panel = page.locator('aside[data-details]')
  expect(await panel.evaluate((node) => node.scrollWidth - node.clientWidth)).toBe(0)
})

test('selecting a row never makes the panel scroll', async ({ page }) => {
  await page.goto('/en/skills')
  await enhanced(page)

  const panel = page.locator('aside[data-details]')
  const rows = page.locator('[data-rows] [data-entry] [data-row]')

  for (const index of [1, 2, 3]) {
    await rows.nth(index).click()
    const overflow = await panel.evaluate((node) => ({
      x: node.scrollWidth - node.clientWidth,
      y: node.scrollHeight - node.clientHeight,
    }))
    expect(overflow.x, `row ${index} horizontal`).toBe(0)
    expect(overflow.y, `row ${index} vertical`).toBe(0)
  }
})

test('a panoply piece shows its tiers and opens the other pieces', async ({ page }) => {
  await page.goto('/fr/equipement#e-boucle-de-l-un')
  await enhanced(page)
  const detail = page.locator('#e-boucle-de-l-un')
  await expect(detail.locator('.au-set__rung')).toHaveCount(1)
  await expect(detail.locator('.au-set__member[aria-current] .au-rule')).toHaveAttribute(
    'href',
    '/fr/equipement#e-boucle-de-l-un',
  )

  await detail.locator('.au-set__member a[href$="#e-boucle-de-l-autre"]').click()
  await expect(page).toHaveURL('/fr/equipement#e-boucle-de-l-autre')
  await expect(page.locator('#e-boucle-de-l-autre')).toBeVisible()
  await expect(row(page, 'boucle-de-l-autre')).toHaveAttribute('aria-current', 'true')
})

test('an environment shows its Loot Table and opens the materials it gives', async ({ page }) => {
  await page.goto('/fr/materiaux#e-foret')
  await enhanced(page)
  const forest = page.locator('#e-foret')
  await expect(forest.locator('.au-loot tbody tr')).toHaveCount(8)

  await forest.locator('a[href$="#e-truffe"]').click()
  await expect(page).toHaveURL('/fr/materiaux#e-truffe')
  await expect(row(page, 'truffe')).toHaveAttribute('aria-current', 'true')
  await expect(page.locator('#e-truffe .au-material__place-name')).toHaveText(['Forêt'])
})
