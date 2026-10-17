import { expect, type Page, test } from '@playwright/test'

const SETTLED = /^(ready|map-unavailable)$/

async function openAtlas(page: Page, path = '/fr/atlas'): Promise<string> {
  await page.goto(path)
  const root = page.locator('[data-atlas-root]')
  await expect(root).toHaveAttribute('data-atlas-state', SETTLED, { timeout: 90_000 })
  return (await root.getAttribute('data-atlas-state')) ?? ''
}

test.use({ reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem('aubaine.atlas.settings', JSON.stringify({ quality: 'low' })),
  )
})

function panel(page: Page) {
  return page.getByRole('complementary', { name: 'Panneau de l’Atlas' })
}

async function openPane(page: Page, name: string): Promise<void> {
  await panel(page).getByRole('button', { name, exact: true, expanded: false }).click()
}

test('the Atlas names itself once and lists the places to go to', async ({ page }) => {
  await openAtlas(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Atlas')
  await openPane(page, 'Lieu')
  await expect(panel(page).getByRole('button', { name: /Le Bastion/ })).toBeVisible()
  await expect(panel(page).getByRole('button', { name: /Aérolys/ })).toBeVisible()
})

test('choosing a place opens its entry and its deep link, and Escape closes both', async ({
  page,
}) => {
  await openAtlas(page)
  await openPane(page, 'Lieu')
  await panel(page)
    .getByRole('button', { name: /Le Bastion/ })
    .click()
  const title = panel(page).getByRole('heading', { level: 3, name: 'Le Bastion' })
  await expect(title).toBeFocused()
  await expect(page).toHaveURL(/\/fr\/atlas#g\/bastion$/)

  await page.keyboard.press('Escape')
  await expect(title).toHaveCount(0)
  await expect(page).toHaveURL(/\/fr\/atlas$/)
  await expect(panel(page).getByRole('searchbox', { name: 'Chercher un lieu' })).toBeFocused()
})

test('a deep link opens the entry it names', async ({ page }) => {
  await openAtlas(page, '/fr/atlas#g/aubemont')
  await expect(
    panel(page).getByRole('heading', { level: 3, name: "Royaume d'Aubemont" }),
  ).toBeVisible()
})

test('the place search finds a place without its accents', async ({ page }) => {
  await openAtlas(page)
  await openPane(page, 'Lieu')
  await panel(page).getByRole('searchbox', { name: 'Chercher un lieu' }).fill('ferratre')
  await expect(panel(page).getByRole('button', { name: 'Ferrâtre Ville' })).toBeVisible()
})

test('the rail opens one pane at a time, and a chosen place opens Lieu', async ({ page }) => {
  await openAtlas(page)
  const place = panel(page).getByRole('button', { name: 'Lieu', exact: true })
  const travel = panel(page).getByRole('button', { name: 'Voyage', exact: true })
  const search = panel(page).getByRole('searchbox', { name: 'Chercher un lieu' })
  await expect(place).toHaveAttribute('aria-expanded', 'false')
  await expect(travel).toHaveAttribute('aria-expanded', 'false')
  await travel.click()
  await expect(travel).toHaveAttribute('aria-expanded', 'true')
  await expect(
    panel(page).getByRole('heading', { level: 3, name: 'Combien de jours de route ?' }),
  ).toBeVisible()
  await place.click()
  await expect(place).toHaveAttribute('aria-expanded', 'true')
  await expect(travel).toHaveAttribute('aria-expanded', 'false')
  await expect(search).toBeVisible()
  await place.click()
  await expect(place).toHaveAttribute('aria-expanded', 'false')
  await expect(search).toBeHidden()
  await page.evaluate(() => {
    window.location.hash = '#g/bastion'
  })
  await expect(place).toHaveAttribute('aria-expanded', 'true')
  await expect(panel(page).getByRole('heading', { level: 3, name: 'Le Bastion' })).toBeVisible()
  await panel(page).getByRole('button', { name: 'Fermer le panneau' }).click()
  await expect(place).toHaveAttribute('aria-expanded', 'false')
  await expect(place).toBeFocused()
})

test('the options are sorted by category and remembered', async ({ page }) => {
  const state = await openAtlas(page)
  test.skip(state === 'map-unavailable', 'the options need the map')
  await openPane(page, 'Options')
  await panel(page).getByRole('tab', { name: 'Carte' }).click()
  await panel(page).getByRole('button', { name: 'Détails : Voies' }).click()
  await panel(page).getByRole('button', { name: 'Route maritime' }).click()
  await expect(panel(page).getByRole('button', { name: 'Route maritime' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(panel(page).getByRole('button', { name: 'Voies', exact: true })).toHaveAttribute(
    'aria-pressed',
    'mixed',
  )
  const stored = await page.evaluate(() => window.localStorage.getItem('aubaine.atlas.settings'))
  expect(JSON.parse(stored ?? '{}').display.routes.sea).toBe(false)
})

test('the planner works out a voyage between two ports', async ({ page }) => {
  await openAtlas(page)
  await panel(page).getByRole('button', { name: 'Voyage' }).click()
  await panel(page).getByLabel('Départ', { exact: true }).selectOption({ label: 'Le Bastion' })
  await panel(page).getByLabel('Arrivée', { exact: true }).selectOption({ label: 'Corsaille' })
  await panel(page).getByRole('radio', { name: 'Navire' }).check()
  await expect(panel(page).getByText('par l’itinéraire', { exact: true })).toBeVisible()
  await expect(panel(page).getByRole('listitem').getByText('Voilier · 3 km/h')).toBeVisible()
  await expect(
    panel(page)
      .getByRole('status')
      .filter({ hasText: /^Itinéraire : .+ km par l’itinéraire$/ }),
  ).toHaveCount(1)
})

test('the planner says why a walk cannot reach a floating island', async ({ page }) => {
  await openAtlas(page)
  await panel(page).getByRole('button', { name: 'Voyage' }).click()
  await panel(page).getByLabel('Départ', { exact: true }).selectOption({ label: 'Le Bastion' })
  await panel(page)
    .getByLabel('Arrivée', { exact: true })
    .selectOption({ label: 'Aérolys · Lieu remarquable' })
  await panel(page).getByRole('radio', { name: 'À pied / monture' }).check()
  await expect(
    panel(page).getByRole('status').filter({ hasText: 'Un des deux lieux est dans les airs' }),
  ).toHaveCount(1)
})

test('picking level −1 checks it and unchecks the surface', async ({ page }) => {
  const state = await openAtlas(page)
  test.skip(state === 'map-unavailable', 'the level bar needs the map')
  const level = page.getByRole('radio', { name: 'Strate −1' })
  await level.click()
  await expect(level).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Surface' })).not.toBeChecked()
})

test('the fog names the Unknown, says it is not yet discovered and selects nothing', async ({
  page,
}) => {
  const state = await openAtlas(page)
  test.skip(state === 'map-unavailable', 'the fog needs the map')
  const canvas = page.locator('.au-atlas__canvas')
  await canvas.focus()
  await page.keyboard.press('1')
  for (let step = 0; step < 8; step++) await page.keyboard.press('-')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('the map has no box')
  const tooltip = page.locator('.au-atlas-tooltip')
  const edges = [0.5, 0.62, 0.74].flatMap((share) => [
    { x: box.x + 6, y: box.y + box.height * share },
    { x: box.x + box.width - 6, y: box.y + box.height * share },
  ])
  let fog = edges[0] ?? { x: box.x, y: box.y }
  await expect(async () => {
    for (const point of edges) {
      await page.mouse.move(point.x, point.y + 1)
      await page.mouse.move(point.x, point.y)
      if ((await tooltip.textContent())?.includes('L’Inconnue')) {
        fog = point
        break
      }
    }
    await expect(tooltip).toContainText('L’Inconnue', { timeout: 1_000 })
    await expect(tooltip).toContainText('Pas encore découvert')
  }).toPass({ timeout: 20_000 })
  await page.mouse.click(fog.x, fog.y)
  await expect(page).toHaveURL(/\/fr\/atlas$/)
  await expect(panel(page).getByRole('button', { name: 'Fermer la fiche' })).toHaveCount(0)
})

test('the map switcher sorts the maps by category and opens the one chosen', async ({ page }) => {
  await openAtlas(page)
  const opener = page.getByRole('button', { name: 'Changer de carte : Archipel' })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Cartes' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
  await opener.click()
  await expect(dialog.getByRole('tab', { name: 'Contrées (2)' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await dialog.getByRole('tab', { name: 'Zones (0)' }).click()
  await expect(dialog.getByText('Aucune carte dans cette catégorie pour l’instant.')).toBeVisible()
  await dialog.getByRole('tab', { name: 'Contrées (2)' }).click()
  await dialog.getByRole('searchbox', { name: 'Chercher une carte' }).fill('eden')
  await expect(dialog.getByRole('button', { name: /Archipel/ })).toHaveCount(0)
  await dialog.getByRole('button', { name: /Eden/ }).click()
  await expect(page).toHaveURL(/\/fr\/atlas\?map=eden$/)
  await expect(page.locator('[data-atlas-root]')).toHaveAttribute('data-atlas-state', SETTLED, {
    timeout: 90_000,
  })
  await expect(page.getByRole('button', { name: 'Changer de carte : Eden' })).toBeVisible()
})

test('an unknown map in the address opens the default one and cleans the address', async ({
  page,
}) => {
  await openAtlas(page, '/fr/atlas?map=nowhere')
  await expect(page).toHaveURL(/\/fr\/atlas$/)
  await expect(page.getByRole('button', { name: 'Changer de carte : Archipel' })).toBeVisible()
})

test('the views run from Dessus to Libre, Relief third, each on its own key', async ({ page }) => {
  const state = await openAtlas(page)
  test.skip(state === 'map-unavailable', 'the views need the map')
  const order = await page
    .locator('.au-atlas-views input[type="radio"]')
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value))
  expect(order).toEqual(['top', 'iso', 'relief', 'free'])
  await page.locator('.au-atlas__canvas').focus()
  await page.keyboard.press('3')
  await expect(page.getByRole('radio', { name: 'Relief' })).toBeChecked()
  await page.keyboard.press('4')
  await expect(page.getByRole('radio', { name: 'Libre' })).toBeChecked()
})

test('the known sea under the pointer is named, never taken for the Unknown', async ({ page }) => {
  const state = await openAtlas(page)
  test.skip(state === 'map-unavailable', 'the sea needs the map')
  const canvas = page.locator('.au-atlas__canvas')
  await canvas.focus()
  await page.keyboard.press('1')
  const box = await canvas.boundingBox()
  if (!box) throw new Error('the map has no box')
  const tooltip = page.locator('.au-atlas-tooltip')
  await expect(async () => {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 1)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await expect(tooltip).not.toBeEmpty({ timeout: 1_000 })
  }).toPass({ timeout: 20_000 })
  await expect(tooltip).not.toContainText('L’Inconnue')
})
