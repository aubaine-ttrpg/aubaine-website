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
  '/fr/atlas',
]

for (const path of PAGES) {
  test(`${path} runs every script under the deployed policy`, async ({ page }) => {
    await servedUnder(page, policyIn('dist/_headers'))
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    expect(await violations(page)).toEqual([])
  })
}

test('the Atlas fetches and plays its sounds under the deployed policy', async ({ page }) => {
  test.slow()
  await servedUnder(page, policyIn('dist/_headers'))
  await page.addInitScript(() => {
    window.localStorage.setItem('aubaine.atlas.settings', JSON.stringify({ quality: 'low' }))
    window.localStorage.setItem('aubaine.sound', JSON.stringify({ muted: false }))
  })
  const sounds: string[] = []
  page.on('requestfinished', (request) => {
    if (new URL(request.url()).pathname.endsWith('.mp3')) sounds.push(request.url())
  })
  await page.goto('/fr/atlas')
  const root = page.locator('[data-atlas-root]')
  await expect(root).toHaveAttribute('data-atlas-state', /^(ready|map-unavailable)$/, {
    timeout: 90_000,
  })
  test.skip((await root.getAttribute('data-atlas-state')) !== 'ready', 'sound needs the map')
  await page.getByRole('button', { name: 'Lieu', exact: true }).click()
  await expect.poll(() => sounds.length).toBeGreaterThan(0)
  expect(await violations(page)).toEqual([])
})

test('the threshold hands off under the deployed policy', async ({ page }) => {
  await servedUnder(page, policyIn('dist/_headers'))
  await page.goto('/')
  await expect(page).toHaveURL('/en')
  await expect(page.locator('#site-header [data-nav]')).toHaveCount(4)
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
