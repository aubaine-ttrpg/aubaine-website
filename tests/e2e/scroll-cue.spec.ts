import { expect, test } from '@playwright/test'

const CUE = '[data-scroll-cue]'

test.use({ viewport: { width: 1280, height: 700 } })

test('a tree page cues the reader below its hero', async ({ page }) => {
  await page.goto('/fr/arbre/berserker')
  await expect(page.locator(CUE)).toBeInViewport()
})

test('the cue leaves the screen with the hero it belongs to', async ({ page }) => {
  await page.goto('/fr/arbre/berserker')
  const cue = page.locator(CUE)
  await expect(cue).toBeInViewport()
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2))
  await expect(cue).not.toBeInViewport()
})

test('no hero outside a tree page carries a cue', async ({ page }) => {
  for (const route of ['/en/trees', '/en/skills', '/en/almanach']) {
    await page.goto(route)
    await expect(page.locator(CUE), route).toHaveCount(0)
  }
})

test('the cue names the kind of tree it sits on', async ({ page }) => {
  await page.goto('/fr/arbre/berserker')
  await expect(page.locator(CUE)).toContainText('Découvrez cet archétype')
  await page.goto('/fr/arbre/feu')
  await expect(page.locator(CUE)).toContainText('Découvrez ce domaine')
})

test('the cue gives way to hero content too tall for a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 })
  await page.goto('/fr/arbre/berserker')
  await expect(page.locator(CUE)).toBeHidden()
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the cue stays on screen without its animation', async ({ page }) => {
    await page.goto('/fr/arbre/berserker')
    await expect(page.locator(CUE)).toBeInViewport()
  })
})
