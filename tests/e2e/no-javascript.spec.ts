import { expect, test } from '@playwright/test'

const ROUTES = [
  '/fr',
  '/en',
  '/fr/livres',
  '/en/books',
  '/fr/livres/livre-du-joueur/creer-un-personnage',
  '/en/books/livre-du-joueur/creer-un-personnage',
  '/fr/livres/livre-du-mj/menace-et-rencontres',
  '/fr/almanach',
  '/fr/arbres',
  '/fr/arbre/berserker',
  '/fr/arbre/berserker/RAGER-01',
  '/fr/especes',
  '/en/species',
  '/fr/espece/humain',
  '/en/species/scothan',
  '/fr/competences',
  '/fr/equipement',
  '/fr/actions-de-base',
  '/fr/etats',
  '/fr/recherche',
  '/fr/archives',
  '/en/archives',
  '/fr/archives/berserker',
  '/en/archives/berserker',
  '/fr/archives/livre-du-joueur',
  '/fr/archives/equipement',
  '/fr/licences',
  '/en/licences',
  '/fr/politique-ia',
  '/en/ai-policy',
  '/fr/credits',
  '/en/credits',
  '/fr/confidentialite',
  '/en/privacy',
]

for (const route of ROUTES) {
  test(`${route} renders without client javascript`, async ({ page }) => {
    const response = await page.goto(route)
    expect(response?.status(), route).toBe(200)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
  })
}

test('a species carries its lore, its regional origins and its whole pool in the markup', async ({
  page,
}) => {
  await page.goto('/fr/espece/humain')
  await expect(page.locator('.au-trait')).toHaveCount(3)
  await expect(page.locator('.au-trait').first()).toContainText('Humanoïde')
  await expect(page.locator('.au-reading__body .au-prose h2')).toHaveCount(7)
  await expect(page.locator('.au-reading__body .au-prose img')).toHaveCount(2)
  await expect(page.locator('figure.au-quote blockquote')).toContainText('Arthur, vois ces stèles')
  await expect(page.locator('figure.au-quote blockquote')).not.toContainText('Arsenault')
  await expect(page.locator('figure.au-quote figcaption')).toContainText('Arsenault')
  await expect(page.locator('.au-aside .au-trail a')).toHaveCount(12)
  await expect(page.locator('.au-aside .au-trail .au-trail a')).toHaveText([
    'Nouvelle-Aubaine',
    'Landenheit',
    'Victoria',
    'Al-Wahaa',
  ])
  await expect(page.locator('[id^="origine-"]')).toHaveCount(4)
  const playing = page.locator('#jouer').locator('xpath=..')
  await expect(playing.locator('dd')).toContainText(['Vers 18 à 20 ans'])
  await expect(playing).toContainText('Commun')
  await expect(playing).toContainText('1,60 m')
  await expect(page.locator('[data-rows] [data-entry]')).toHaveCount(11)
  expect(
    await page
      .locator('[data-rows] [data-entry]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-entry'))),
  ).toEqual([
    'ESHUM-02',
    'ESHUM-01',
    'ESHUM-03',
    'ESHUM-05',
    'ESHUM-04',
    'ESHUM-06',
    'ESHUM-07',
    'ESHUM-09',
    'ESHUM-08',
    'ESHUM-11',
    'ESHUM-10',
  ])
  await expect(page.locator('[data-details] .au-skill__xp')).toHaveCount(0)
  await expect(page.locator('[data-detail]').first()).toBeVisible()
})

test('a skill tree plate draws its nodes without javascript', async ({ page }) => {
  await page.goto('/fr/arbre/berserker')
  await expect(page.locator('[data-plate-node]')).toHaveCount(14)
  await expect(page.locator('svg line')).not.toHaveCount(0)
})

test('a tall hero still cues the reader below it without javascript', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 })
  await page.goto('/fr/arbre/berserker')
  await expect(page.locator('[data-scroll-cue]')).toBeInViewport()
})

test('the books hub only cards a book that leads somewhere', async ({ page }) => {
  await page.goto('/fr/livres')
  const cards = page.locator('[data-card]')
  await expect(cards).not.toHaveCount(0)
  for (const href of await cards
    .locator('a[href]')
    .evaluateAll((all) => all.map((a) => a.getAttribute('href')))) {
    expect(href, 'a book card must not link nowhere').toBeTruthy()
  }
})

test('a chapter reaches its neighbour through the pager', async ({ page }) => {
  await page.goto('/fr/livres/livre-du-joueur/comment-jouer')
  await expect(page.locator('#book-nav a[aria-current="page"]')).toHaveCount(1)
  await page.locator('[data-book-next]').click()
  await expect(page).toHaveURL(/\/fr\/livres\/livre-du-joueur\/[a-z-]+$/)
  await expect(page.locator('main')).toBeVisible()
})

test('a browse page shows its list and a detail without javascript', async ({ page }) => {
  await page.goto('/fr/equipement')
  await expect(page.locator('[data-entry]')).toHaveCount(38)
  await expect(page.locator('[data-detail]').first()).toBeVisible()
})

test('a browse row still changes the detail without javascript', async ({ page }) => {
  await page.goto('/fr/equipement')
  const first = page.locator('[data-detail]').first()
  await expect(first).toBeVisible()

  await page.locator('[data-entry="arc-long"] [data-row]').click()
  await expect(page.locator('#e-arc-long')).toBeVisible()
  await expect(first).toBeHidden()
})

test('the equipment index offers its booklet without javascript', async ({ page }) => {
  await page.goto('/fr/equipement')
  const download = page.locator('[data-booklet]')
  await expect(download).toBeVisible()
  await expect(download).toHaveAttribute(
    'href',
    /^\/pdf\/equipement-fr-v[\d.]+_[0-9a-f]{8}_[0-9a-f]{8}\.pdf$/,
  )
})

test('the equipment help opens and closes on a hash without javascript', async ({ page }) => {
  await page.goto('/fr/equipement')
  const overlay = page.locator('#aide')
  await expect(overlay).toBeHidden()

  await page.locator('[data-help-open]').click()
  await expect(overlay).toBeVisible()
  await expect(overlay.locator('.au-help__title')).toHaveText('Artisanat et équipement')

  await overlay.locator('.au-help__close').click()
  await expect(overlay).toBeHidden()
})

test('a sub chapter link clears the sticky header without javascript', async ({ page }) => {
  await page.goto('/fr/livres/livre-du-joueur/comment-jouer')
  const link = page.locator('#book-nav .au-trail[data-inset] a').first()
  const hash = await link.getAttribute('href')
  expect(hash).toBeTruthy()

  await link.click()
  const header = (await page.locator('[data-shell-header]').boundingBox())?.height ?? 0
  const heading = page.locator(`#book-body [id="${(hash ?? '').replace(/^#/, '')}"]`)

  await expect
    .poll(async () => (await heading.boundingBox())?.y ?? Number.NEGATIVE_INFINITY)
    .toBeGreaterThanOrEqual(header)
})

test('a booklet history offers every printing as a direct download', async ({ page }) => {
  await page.goto('/fr/archives/berserker')
  const rows = page.locator('[data-release-row]')
  await expect(rows).not.toHaveCount(0)

  const hrefs = await page
    .locator('[data-release-link]')
    .evaluateAll((all) => all.map((link) => link.getAttribute('href')))
  for (const href of hrefs) {
    expect(href).toMatch(
      /^\/(pdf\/berserker-fr-v[\d.]+_[0-9a-f]{8}_[0-9a-f]{8}\.pdf|pdf-archive\/aubaine-v[\d.]+-fr\.zip)$/,
    )
  }
})

test('the archive lists a generation and routes to each booklet history', async ({ page }) => {
  await page.goto('/fr/archives')
  await expect(page.locator('[data-generation]')).not.toHaveCount(0)

  await page.locator('[data-booklet-history]').first().click()
  await expect(page).toHaveURL(/\/fr\/archives\/[a-z0-9-]+$/)
  await expect(page.locator('h1')).toHaveCount(1)
})

test('a tree page reaches its own history without javascript', async ({ page }) => {
  await page.goto('/fr/arbre/berserker')
  await page.locator('[data-versions]').click()
  await expect(page).toHaveURL('/fr/archives/berserker')
})

test.describe('without javascript', () => {
  test.use({ javaScriptEnabled: false })

  test('the Common Bank source still opens its note without javascript', async ({ page }) => {
    await page.goto('/en/skills#e-CBREP-01')
    const note = page.locator('#note-bank-CBREP-01')
    await expect(note).toBeHidden()
    await page.locator('#e-CBREP-01').getByRole('button', { name: 'Common Bank' }).click()
    await expect(note).toBeVisible()
    await expect(note).toContainText('Common Bank skills are independent from one another.')
  })

  test('every draft stays listed without javascript, and no switch pretends otherwise', async ({
    page,
  }) => {
    await page.goto('/en/trees')
    await expect(page.locator('[data-entry]').filter({ visible: true })).toHaveCount(24)
    await expect(page.locator('[data-drafts-control]')).toBeHidden()
  })
})

test.describe('the threshold without javascript', () => {
  test.use({ javaScriptEnabled: false })

  test('offers both languages and stays until the reader picks one', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('[data-load-crest]')).toBeHidden()
    await expect(page.locator('[data-threshold-prompt]')).toBeVisible()
    await expect(page.locator('[data-threshold-prompt] [lang="fr-FR"]')).toHaveText(
      'Choisissez votre langue',
    )
    await expect(page.locator('[data-threshold-prompt] [lang="en-GB"]')).toHaveText(
      'Choose your language',
    )

    const french = page.getByRole('link', { name: 'Français', exact: true })
    const english = page.getByRole('link', { name: 'English', exact: true })
    await expect(french).toHaveAttribute('href', '/fr')
    await expect(english).toHaveAttribute('href', '/en')

    await page.waitForTimeout(600)
    await expect(page).toHaveURL('/')

    await english.click()
    await expect(page).toHaveURL('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
  })
})

test('a species page lists the other sources as also available, never itself', async ({ page }) => {
  await page.goto('/en/species/humain#e-ESHUM-09')
  const onSpecies = page.locator('#e-ESHUM-09 .au-sources')
  await expect(onSpecies.locator('.au-sources__label')).toHaveText('Also available')
  await expect(onSpecies.getByRole('button', { name: 'Common Bank' })).toBeVisible()
  await expect(onSpecies.getByRole('link', { name: /Human/ })).toHaveCount(0)

  await page.goto('/en/skills#e-ESHUM-09')
  const inIndex = page.locator('#e-ESHUM-09 .au-sources')
  await expect(inIndex.locator('.au-sources__label')).toHaveText('Where to Get It')
  await expect(inIndex.getByRole('link', { name: 'Human · Victoria' })).toBeVisible()
})
