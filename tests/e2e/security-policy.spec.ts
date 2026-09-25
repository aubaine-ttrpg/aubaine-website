import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, type Page, test } from '@playwright/test'

const POLICY_HEADER = /^\s*Content-Security-Policy:\s*(.+)$/im

function policyIn(file: string): string {
  const headers = readFileSync(resolve(import.meta.dirname, '../..', file), 'utf8')
  const policy = POLICY_HEADER.exec(headers)?.[1]
  if (policy === undefined) throw new Error(`${file} declares no Content-Security-Policy`)
  return policy
}

async function servedUnder(page: Page, policy: string): Promise<void> {
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') {
      await route.continue()
      return
    }
    const response = await route.fetch()
    await route.fulfill({
      response,
      headers: { ...response.headers(), 'content-security-policy': policy },
    })
  })
  await page.addInitScript(() => {
    const violations: string[] = []
    Object.assign(window, { policyViolations: violations })
    document.addEventListener('securitypolicyviolation', (event) => {
      violations.push(`${event.effectiveDirective} ${event.blockedURI}`)
    })
  })
}

async function violations(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { policyViolations: string[] }).policyViolations)
}

const PAGES = [
  '/fr',
  '/en/trees',
  '/fr/livres/livre-du-joueur/comment-jouer',
  '/fr/equipement',
  '/en/species/humain',
]

for (const path of PAGES) {
  test(`${path} runs every script under the deployed policy`, async ({ page }) => {
    await servedUnder(page, policyIn('dist/_headers'))
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    expect(await violations(page)).toEqual([])
  })
}

test('the threshold hands off under the deployed policy', async ({ page }) => {
  await servedUnder(page, policyIn('dist/_headers'))
  await page.goto('/')
  await expect(page).toHaveURL('/en')
  await expect(page.locator('#site-header [data-nav]')).toHaveCount(3)
  expect(await violations(page)).toEqual([])
})

test('an island hydrates under the deployed policy', async ({ page }) => {
  await servedUnder(page, policyIn('dist/_headers'))
  await page.goto('/en/trees')
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
  expect(await violations(page)).toEqual([])
})

test('a stored light theme survives a reload under the deployed policy', async ({ page }) => {
  await servedUnder(page, policyIn('dist/_headers'))
  await page.goto('/fr')
  await page.evaluate(() => window.localStorage.setItem('aubaine.theme', 'light'))
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await violations(page)).toEqual([])
})

test.describe('a system that prefers light', () => {
  test.use({ colorScheme: 'light' })

  test('opens in the light theme under the deployed policy', async ({ page }) => {
    await servedUnder(page, policyIn('dist/_headers'))
    await page.goto('/fr')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })
})

test('the authored policy alone would block the theme and the islands', async ({ page }) => {
  await servedUnder(page, policyIn('public/_headers'))
  await page.goto('/en/trees')
  await page.waitForLoadState('networkidle')
  const blocked = await violations(page)
  expect(blocked.length).toBeGreaterThan(0)
  expect(blocked.every((violation) => violation.startsWith('script-src'))).toBe(true)
  await expect(page.locator('astro-island[ssr]')).toHaveCount(1)
})
