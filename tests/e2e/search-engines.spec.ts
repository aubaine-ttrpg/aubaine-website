import { expect, type Page, test } from '@playwright/test'

const PLAYTEST_NODE = { fr: '/fr/arbre/mage/GRIMOI-001', en: '/en/tree/mage/GRIMOI-001' }
const INHERITED_DRAFT_NODE = '/en/tree/artisan/METIER-001'
const OWN_DRAFT_NODE = 'VOLADI-001'

function websiteData(page: Page) {
  return page.locator('script[type="application/ld+json"]')
}

test('the sitemap pairs every page with its translation across localized segments', async ({
  request,
}) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain(
    `<url><loc>https://aubaine.io${PLAYTEST_NODE.fr}</loc>` +
      `<xhtml:link rel="alternate" hreflang="fr-FR" href="https://aubaine.io${PLAYTEST_NODE.fr}"/>` +
      `<xhtml:link rel="alternate" hreflang="en-GB" href="https://aubaine.io${PLAYTEST_NODE.en}"/>` +
      '</url>',
  )
})

test('the sitemap lists no draft, no search and no error page', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).not.toContain(INHERITED_DRAFT_NODE)
  expect(sitemap).not.toContain(OWN_DRAFT_NODE)
  expect(sitemap).not.toContain('/fr/recherche')
  expect(sitemap).not.toContain('/en/search')
  expect(sitemap).not.toContain('/404')
})

test('a page that inherits draft from its tree stays out of the index', async ({ request }) => {
  const html = await (await request.get(INHERITED_DRAFT_NODE)).text()
  expect(html).toContain('<meta name="robots" content="noindex, follow">')
  expect(html).not.toContain('rel="canonical"')
})

test('a playtest page is indexable and names itself canonical', async ({ request }) => {
  const html = await (await request.get(PLAYTEST_NODE.en)).text()
  expect(html).not.toContain('name="robots"')
  expect(html).toContain(`<link rel="canonical" href="https://aubaine.io${PLAYTEST_NODE.en}">`)
})

test('no page claims a locale neutral alternate', async ({ request }) => {
  for (const path of ['/', '/fr', '/en', PLAYTEST_NODE.fr, '/en/books', '/fr/recherche']) {
    const html = await (await request.get(path)).text()
    expect(html, path).not.toContain('x-default')
  }
})

test('only the home pages describe the website', async ({ request }) => {
  for (const path of ['/fr', '/en']) {
    const html = await (await request.get(path)).text()
    expect(html, path).toContain('"@type":"WebSite"')
  }
  const tree = await (await request.get(PLAYTEST_NODE.fr)).text()
  expect(tree).not.toContain('application/ld+json')
})

test('client navigation adds and removes the website description', async ({ page }) => {
  await page.goto('/en/trees')
  await page.waitForFunction(() => 'swup' in window)
  await page.evaluate(() => document.documentElement.setAttribute('data-same-document', ''))
  await expect(websiteData(page)).toHaveCount(0)

  await page.getByRole('link', { name: 'Home', exact: true }).click()
  await expect(page).toHaveURL('/en')
  await expect(websiteData(page)).toHaveCount(1)

  await page.goBack()
  await expect(page).toHaveURL('/en/trees')
  await expect(websiteData(page)).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('data-same-document', '')
})
