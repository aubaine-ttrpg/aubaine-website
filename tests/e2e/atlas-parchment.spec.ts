import { expect, type Page, test } from '@playwright/test'

const SETTLED = /^(ready|map-unavailable)$/
const SETTINGS_KEY = 'aubaine.atlas.settings'

test.use({ reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ key, value }) => {
      if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value)
    },
    { key: SETTINGS_KEY, value: JSON.stringify({ quality: 'low' }) },
  )
})

async function openAtlas(page: Page, path = '/fr/atlas'): Promise<void> {
  await page.goto(path)
  const root = page.locator('[data-atlas-root]')
  await expect(root).toHaveAttribute('data-atlas-state', SETTLED, { timeout: 90_000 })
  test.skip(
    (await root.getAttribute('data-atlas-state')) !== 'ready',
    'the parchment needs the map',
  )
}

function styleSwitch(page: Page) {
  return page.getByRole('switch', { name: 'Parchemin 2D', exact: true })
}

function views(page: Page) {
  return page.locator('.au-atlas-views input')
}

async function chooseParchment(page: Page): Promise<void> {
  await expect(styleSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await styleSwitch(page).click()
  await expect(styleSwitch(page)).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('.au-atlas__map')).toHaveAttribute('data-style', 'parchment')
}

test('the parchment locks the four views and gives them back', async ({ page }) => {
  await openAtlas(page)
  const chosen = await page.locator('.au-atlas-views input:checked').getAttribute('value')

  await chooseParchment(page)
  await expect(views(page)).toHaveCount(4)
  for (const input of await views(page).all()) await expect(input).toBeDisabled()
  await expect(page.locator('.au-atlas__canvas')).toHaveAttribute(
    'aria-label',
    'Carte sur parchemin : Archipel',
  )
  await expect(page.locator('.au-atlas-hint')).toHaveText('Glisser : déplacer · Molette : zoom')
  await page.locator('.au-atlas__canvas').focus()
  await page.keyboard.press('3')
  await expect(page.locator('.au-atlas-views input:checked')).toHaveAttribute('value', chosen ?? '')

  await styleSwitch(page).click()
  await expect(styleSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await expect(page.locator('.au-atlas__map')).toHaveAttribute('data-style', '3d')
  for (const input of await views(page).all()) await expect(input).toBeEnabled()
  await expect(page.locator('.au-atlas-views input:checked')).toHaveAttribute('value', chosen ?? '')
})

test('the parchment is remembered with the Atlas options', async ({ page }) => {
  test.slow()
  await openAtlas(page)
  await chooseParchment(page)
  const stored = await page.evaluate((key) => window.localStorage.getItem(key), SETTINGS_KEY)
  expect(JSON.parse(stored ?? '{}')).toMatchObject({ quality: 'low', style: 'parchment' })

  await openAtlas(page)
  await expect(styleSwitch(page)).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('.au-atlas__map')).toHaveAttribute('data-style', 'parchment')
})

test('the style switch answers the keyboard', async ({ page }) => {
  await openAtlas(page)
  await styleSwitch(page).focus()
  await page.keyboard.press('Space')
  await expect(styleSwitch(page)).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('.au-atlas__map')).toHaveAttribute('data-style', 'parchment')
  await page.keyboard.press('Enter')
  await expect(styleSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await expect(page.locator('.au-atlas__map')).toHaveAttribute('data-style', '3d')
})

test('the parchment names the hex under the pointer', async ({ page }) => {
  await openAtlas(page, '/fr/atlas#t/57-49')
  await chooseParchment(page)
  const canvas = page.locator('.au-atlas__canvas')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('the map canvas has no box')
  await page.mouse.move(box.x + box.width / 2 - 4, box.y + box.height / 2 - 4)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.locator('.au-atlas-tooltip')).toHaveCSS('opacity', '1')
  await expect(page.locator('.au-atlas-tooltip__detail')).toContainText(/57.49/)
})

test('the labels stand where the camera stops after every zoom step', async ({ page }) => {
  await openAtlas(page, '/fr/atlas#g/bastion')
  await chooseParchment(page)
  const label = page.locator('.au-atlas-label--city', { hasText: 'Le Bastion' })
  const size = page.viewportSize() ?? { width: 1280, height: 720 }
  const box = await page.locator('.au-atlas__canvas').boundingBox()
  if (!box) throw new Error('the map has no box')
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.45)
  for (const [step, delta] of [-240, 240, -240, 240, -240, 240].entries()) {
    await page.mouse.wheel(0, delta)
    await expect(label).toBeVisible()
    await page.waitForTimeout(400)
    const stopped = await label.boundingBox()
    await page.setViewportSize({
      width: size.width + (step % 2 === 0 ? 1 : 0),
      height: size.height,
    })
    await page.waitForTimeout(400)
    const refreshed = await label.boundingBox()
    expect(Math.abs((stopped?.x ?? 0) - (refreshed?.x ?? 0)), `step ${step}`).toBeLessThan(3)
    expect(Math.abs((stopped?.y ?? 0) - (refreshed?.y ?? 0)), `step ${step}`).toBeLessThan(3)
  }
})

test('the parchment charts the strata without waiting for their relief', async ({ page }) => {
  await openAtlas(page)
  await chooseParchment(page)
  await page.getByRole('radio', { name: 'Strate −1' }).check({ force: true })
  await expect(page.getByRole('radiogroup', { name: 'Niveau' })).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await expect(page.locator('.au-atlas__map')).toHaveAttribute('data-style', 'parchment')
  await expect(page.locator('.au-atlas-label--realm').first()).toBeAttached()
})

test('the legend opens on a first visit and stays shut once closed', async ({ page }) => {
  test.slow()
  await openAtlas(page)
  const legend = page.getByRole('region', { name: 'Légende' })
  await expect(legend).toBeVisible()
  await expect(legend.getByRole('heading', { name: 'Types de tuiles' })).toBeVisible()
  await page.getByRole('button', { name: 'Légende', exact: true }).click()
  await expect(legend).toHaveCount(0)
  await openAtlas(page)
  await expect(page.getByRole('button', { name: 'Légende', exact: true })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
  await expect(legend).toHaveCount(0)
})

test('the legend keys the parchment symbols', async ({ page }) => {
  await openAtlas(page)
  await chooseParchment(page)
  const legend = page.getByRole('region', { name: 'Légende' })
  await expect(legend.getByRole('heading', { name: 'Symboles' })).toBeVisible()
  await expect(legend.getByText('Entrée de grotte', { exact: true })).toBeVisible()
  await expect(legend.locator('.au-atlas-legend__glyph').first()).toBeVisible()
})

test('the parchment survives a swup visit away and back', async ({ page }) => {
  test.slow()
  await openAtlas(page)
  await chooseParchment(page)
  await page.locator('#site-header [data-nav="home"]').click()
  await expect(page).toHaveURL('/fr')
  await expect(page.locator('.au-atlas__canvas')).toHaveCount(0)
  await page.goBack()
  await expect(page).toHaveURL('/fr/atlas')
  await expect(page.locator('[data-atlas-root]')).toHaveAttribute('data-atlas-state', SETTLED, {
    timeout: 90_000,
  })
  await expect(page.locator('.au-atlas__map')).toHaveAttribute('data-style', 'parchment')
  await expect(styleSwitch(page)).toHaveAttribute('aria-checked', 'true')
})

test.describe('with animations on', () => {
  test.use({ reducedMotion: 'no-preference' })

  test('the map tilts and dissolves into the parchment and back out of it', async ({ page }) => {
    test.slow()
    await openAtlas(page)
    const map = page.locator('.au-atlas__map')
    await styleSwitch(page).click()
    await expect(styleSwitch(page)).toHaveAttribute('aria-checked', 'true')
    await expect(map).toHaveAttribute('data-style', '3d')
    await expect(map).toHaveAttribute('data-style', 'parchment', { timeout: 20_000 })
    await page.waitForTimeout(1000)
    await styleSwitch(page).click()
    await expect(styleSwitch(page)).toHaveAttribute('aria-checked', 'false')
    await expect(map).toHaveAttribute('data-style', 'parchment')
    await expect(map).toHaveAttribute('data-style', '3d', { timeout: 20_000 })
  })
})
