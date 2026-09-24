import { expect, test } from '@playwright/test'

const HERO_VIDEO = '[data-hero-video]'
const HERO_PLATE = 'section img'

test.use({ viewport: { width: 1280, height: 700 } })

test('the home hero plays its loop over the plate', async ({ page }) => {
  await page.goto('/fr')
  const video = page.locator(HERO_VIDEO)
  await expect(video).toHaveJSProperty('loop', true)
  await expect(video).toHaveJSProperty('muted', true)
  await expect(video).toHaveJSProperty('paused', false)
  await expect(page.locator(HERO_PLATE).first()).toBeVisible()
})

test('the home hero keeps its loop across a client navigation', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.locator(HERO_VIDEO)).toHaveJSProperty('paused', false)
  await page.getByRole('link', { name: 'Arbres' }).first().click()
  await expect(page.locator(HERO_VIDEO)).toHaveCount(0)
  await page.goBack()
  await expect(page.locator(HERO_VIDEO)).toHaveJSProperty('paused', false)
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the home hero stays on its plate and never fetches the loop', async ({ page }) => {
    const requested: string[] = []
    page.on('request', (request) => {
      if (request.url().endsWith('.mp4')) requested.push(request.url())
    })
    await page.goto('/fr')
    const video = page.locator(HERO_VIDEO)
    await expect(video).toHaveJSProperty('currentSrc', '')
    await expect(video).toHaveJSProperty('paused', true)
    await expect(page.locator(HERO_PLATE).first()).toBeVisible()
    expect(requested).toEqual([])
  })
})
