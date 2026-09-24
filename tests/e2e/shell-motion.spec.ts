import { expect, type Page, test } from '@playwright/test'

const MARKER = 'data-kept-marker'

async function markHeader(page: Page): Promise<void> {
  await page.waitForFunction(() => 'swup' in window)
  await page.evaluate(
    (attribute) => document.querySelector('#site-header')?.setAttribute(attribute, 'yes'),
    MARKER,
  )
}

async function headerSurvived(page: Page): Promise<boolean> {
  return page.evaluate(
    (attribute) => document.querySelector('#site-header')?.hasAttribute(attribute) ?? false,
    MARKER,
  )
}

function activeSection(page: Page) {
  return page.locator('[data-nav][data-active]')
}

test('the header survives a navigation inside one locale', async ({ page }) => {
  await page.goto('/en/trees')
  await markHeader(page)

  await page.getByRole('link', { name: 'Berserker' }).first().click()
  await expect(page).toHaveURL('/en/tree/berserker')
  await expect(page.getByRole('heading', { level: 1, name: 'Berserker' })).toBeVisible()

  expect(await headerSurvived(page)).toBe(true)
})

test('a locale switch replaces the header so its labels follow', async ({ page }) => {
  await page.goto('/en/tree/berserker')
  await markHeader(page)

  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('link', { name: /Français/ }).click()
  await expect(page).toHaveURL('/fr/arbre/berserker')
  await expect(page.locator('[data-nav="home"]')).toHaveText('Accueil')

  expect(await headerSurvived(page)).toBe(false)
})

test('the underlined nav item follows the page across navigation', async ({ page }) => {
  await page.goto('/en/trees')
  await expect(activeSection(page)).toHaveAttribute('data-nav', 'almanach')

  await page.getByRole('link', { name: 'Berserker' }).first().click()
  await expect(page).toHaveURL('/en/tree/berserker')
  await expect(activeSection(page)).toHaveAttribute('data-nav', 'almanach')
  await expect(activeSection(page)).toHaveAttribute('aria-current', 'page')

  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page).toHaveURL('/en')
  await expect(activeSection(page)).toHaveAttribute('data-nav', 'home')
  await expect(page.locator('[data-nav][aria-current="page"]')).toHaveCount(1)
})

test('clicking a nav item moves both underlines at once', async ({ page }) => {
  await page.goto('/en/trees')
  await page.waitForFunction(() => 'swup' in window)

  const scales = async () =>
    page.evaluate(() => {
      const read = (name: string) => {
        const bar = document.querySelector(`[data-nav="${name}"] [data-nav-underline]`)
        if (!bar) return Number.NaN
        return new DOMMatrixReadOnly(getComputedStyle(bar).transform).a
      }
      return { home: read('home'), almanach: read('almanach') }
    })

  expect(await scales()).toEqual({ home: 0, almanach: 1 })

  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await page.waitForTimeout(90)

  const midFlight = await scales()
  expect(midFlight.home).toBeGreaterThan(0)
  expect(midFlight.home).toBeLessThan(1)
  expect(midFlight.almanach).toBeGreaterThan(0)
  expect(midFlight.almanach).toBeLessThan(1)

  await expect.poll(async () => (await scales()).home).toBe(1)
  expect((await scales()).almanach).toBe(0)
})

test('the language links follow the page although the header is not swapped', async ({ page }) => {
  await page.goto('/en/trees')
  await markHeader(page)

  await page.getByRole('link', { name: 'Berserker' }).first().click()
  await expect(page).toHaveURL('/en/tree/berserker')

  await expect(page.locator('[data-lang-option="fr"]')).toHaveAttribute(
    'href',
    '/fr/arbre/berserker',
  )
  await expect(page.locator('[data-lang-option="en"]')).toHaveAttribute(
    'href',
    '/en/tree/berserker',
  )

  expect(await headerSurvived(page)).toBe(true)
})

test('the swap animation is wired to real css', async ({ page }) => {
  const complaints: string[] = []
  page.on('console', (message) => {
    if (message.text().includes('[swup]')) complaints.push(message.text())
  })

  await page.goto('/en/trees')
  await expect(page.locator('[class*="au-swup-"]')).toHaveCount(1)

  await page.getByRole('link', { name: 'Berserker' }).first().click()
  await expect(page).toHaveURL('/en/tree/berserker')
  await expect(page.locator('#swup')).toHaveCSS('opacity', '1')

  expect(complaints).toEqual([])
})

test('a preloaded navigation never shows the loading crest', async ({ page }) => {
  await page.goto('/en/trees')
  await page.waitForFunction(() => 'swup' in window)
  await page.evaluate(() => {
    const seen: string[] = []
    Object.assign(window, { seenPhases: seen })
    const crest = document.querySelector('[data-load-crest]')
    if (!crest) return
    new MutationObserver(() => seen.push(crest.getAttribute('data-phase') ?? 'none')).observe(
      crest,
      { attributes: true, attributeFilter: ['data-phase'] },
    )
  })

  await page.getByRole('link', { name: 'Berserker' }).first().click()
  await expect(page).toHaveURL('/en/tree/berserker')

  expect(
    await page.evaluate(() => (window as unknown as { seenPhases: string[] }).seenPhases),
  ).toEqual([])
})

test('a slow navigation shows the crest below the header and clears it', async ({ page }) => {
  await page.goto('/en/trees')
  await page.waitForFunction(() => 'swup' in window)
  await page.route('**/en/skills**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    await route.continue()
  })

  const crest = page.locator('[data-load-crest]')
  await page.evaluate(() =>
    (window as unknown as { swup: { navigate(to: string): void } }).swup.navigate('/en/skills'),
  )

  await expect(crest).toHaveAttribute('data-phase', 'loading')

  const headerBottom = await page
    .locator('#site-header')
    .evaluate((node) => node.getBoundingClientRect().bottom)
  const crestTop = await crest.evaluate((node) => node.getBoundingClientRect().top)
  expect(crestTop).toBeGreaterThanOrEqual(headerBottom)

  await expect(page).toHaveURL('/en/skills')
  await expect(crest).not.toHaveAttribute('data-phase', /.*/)
  await expect(crest).toBeHidden()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('navigates without a crest and leaves the content visible', async ({ page }) => {
    await page.goto('/en/trees')
    await expect(page.locator('[data-load-crest]')).toBeHidden()

    await page.getByRole('link', { name: 'Berserker' }).first().click()
    await expect(page).toHaveURL('/en/tree/berserker')
    await expect(page.getByRole('heading', { level: 1, name: 'Berserker' })).toBeVisible()
    await expect(page.locator('#swup')).toHaveCSS('opacity', '1')
    await expect(page.locator('[data-load-crest]')).toBeHidden()
  })
})
