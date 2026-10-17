import { expect, type Page, test } from '@playwright/test'
import sharp from 'sharp'

const BOOT_LABEL = 'Démarrage de l’application Atlas de l’Almanach'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem('aubaine.atlas.settings', JSON.stringify({ quality: 'low' })),
  )
})

function consoleErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

const EMBLEM_BOX = { left: 600, top: 220, width: 200, height: 430 }
const EMBLEM_SHOWN = 1_000

async function emblemGold(png: Buffer): Promise<number> {
  const { data, info } = await sharp(png)
    .extract(EMBLEM_BOX)
    .raw()
    .toBuffer({ resolveWithObject: true })
  let gold = 0
  for (let index = 0; index < data.length; index += info.channels) {
    const red = data[index] ?? 0
    const green = data[index + 1] ?? 0
    const blue = data[index + 2] ?? 0
    if (red > 170 && green > 120 && red > blue + 50) gold += 1
  }
  return gold
}

async function revealed(page: Page): Promise<void> {
  await expect(page.locator('[data-atlas-root]')).toHaveAttribute(
    'data-atlas-state',
    /^(ready|map-unavailable)$/,
    { timeout: 90_000 },
  )
}

test.describe('the start-up screen', () => {
  test.use({ reducedMotion: 'reduce' })

  test('covers the Atlas while it loads, then hands the map over', async ({ page }) => {
    const errors = consoleErrors(page)
    await page.goto('/fr/atlas')
    const screen = page.getByRole('img', { name: BOOT_LABEL })
    await expect(screen).toBeVisible()
    await expect(page.locator('[data-atlas-boot]')).toHaveAttribute('aria-busy', 'true')
    await expect(page.locator('[data-atlas-root]')).toHaveAttribute('data-atlas-state', 'loading')
    expect(
      await page
        .locator('[data-atlas-root]')
        .evaluate((root) => (root instanceof HTMLElement ? root.inert : null)),
    ).toBe(true)
    const skip = page.getByRole('button', { name: 'Passer' })
    await expect(skip).toBeVisible()
    await revealed(page)
    await expect(screen).toHaveCount(0)
    await expect(skip).toHaveCount(0)
    await expect(page.locator('[data-atlas-boot]')).toBeHidden()
    expect(
      await page
        .locator('[data-atlas-root]')
        .evaluate((root) => (root instanceof HTMLElement ? root.inert : null)),
    ).toBe(false)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Atlas')
    expect(errors).toEqual([])
  })

  test('stops on Escape and from its button reached by the keyboard', async ({ page }) => {
    await page.goto('/fr/atlas')
    const skip = page.getByRole('button', { name: 'Passer' })
    await expect(skip).toBeVisible()
    await skip.focus()
    await expect(skip).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(skip).toBeHidden()
    await revealed(page)
    await expect(page.getByRole('img', { name: BOOT_LABEL })).toHaveCount(0)
  })

  test('says the link failed and offers to reload when the maps cannot load', async ({
    page,
    context,
  }) => {
    await context.route(/\/_astro\/.+\.json$/, (route) => route.abort())
    await page.goto('/fr/atlas')
    await expect(page.getByRole('link', { name: 'Recharger l’atlas' })).toBeVisible({
      timeout: 60_000,
    })
    await expect(page.getByRole('img', { name: BOOT_LABEL })).toHaveCount(0)
    await expect(page.locator('[data-atlas-root]')).toHaveAttribute('data-atlas-state', 'failed')
  })
})

test('the full start-up screen draws the CADRAN logo before the map is built', async ({
  page,
  context,
}) => {
  test.slow()
  const maps = Promise.withResolvers<void>()
  await context.route(/\/_astro\/.+\.json$/, async (route) => {
    await maps.promise
    await route.continue()
  })
  await page.goto('/fr/atlas')
  const screen = page.getByRole('img', { name: BOOT_LABEL })
  await expect(screen).toBeVisible()
  await expect(page.locator('.au-atlas__canvas')).toHaveCount(0)
  await page.waitForTimeout(3_000)
  await expect(screen).toBeVisible()
  await expect(page.locator('[data-atlas-root]')).toHaveAttribute('data-atlas-state', 'loading')
  await page.getByRole('button', { name: 'Passer' }).click()
  maps.resolve()
  await revealed(page)
  await expect(screen).toHaveCount(0)
})

async function mostEmblemGold(page: Page, during: () => Promise<void>): Promise<number> {
  const cdp = await page.context().newCDPSession(page)
  const frames: Buffer[] = []
  cdp.on('Page.screencastFrame', (event) => {
    frames.push(Buffer.from(event.data, 'base64'))
    void cdp.send('Page.screencastFrameAck', { sessionId: event.sessionId })
  })
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 })
  await during()
  await cdp.send('Page.stopScreencast')
  await cdp.detach()
  expect(frames.length).toBeGreaterThan(5)
  const gold = await Promise.all(frames.map((frame) => emblemGold(frame)))
  return Math.max(...gold)
}

test('switching maps plays the Atlas screen and never the CADRAN logo', async ({ page }) => {
  test.slow()
  await page.setViewportSize({ width: 1280, height: 800 })
  const firstLoad = await mostEmblemGold(page, async () => {
    await page.goto('/fr/atlas')
    await revealed(page)
  })
  expect(firstLoad).toBeGreaterThan(EMBLEM_SHOWN)

  await page.getByRole('button', { name: /Changer de carte/ }).click()
  const card = page.locator('.au-atlas-map').filter({ hasText: 'Eden' })
  await expect(card).toBeVisible()
  const switching = await mostEmblemGold(page, async () => {
    await card.click()
    await expect(page.getByRole('img', { name: BOOT_LABEL })).toBeVisible()
    await page.waitForTimeout(900)
  })
  expect(switching).toBeLessThan(EMBLEM_SHOWN)
})
