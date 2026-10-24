import { expect, type Page, test } from '@playwright/test'

import { pathFor } from '../../src/lib/i18n/routes'
import { corpus } from './support/corpus'

async function indexing() {
  const english = await corpus('en')
  const published = english.species.find((entry) => entry.status !== 'draft')
  const inherited = english.trees
    .filter((tree) => tree.status === 'draft')
    .flatMap((tree) =>
      tree.placements
        .filter((placement) => placement.skill.status === undefined)
        .map((placement) => ({ tree: tree.id, node: placement.skill.id })),
    )[0]
  const ownDraft = [...english.skills.values()].find((skill) => skill.status === 'draft')
  if (!published || !inherited || !ownDraft) {
    throw new Error('the corpus needs a published species, a draft tree node and a draft skill')
  }
  return {
    publishedPage: {
      fr: pathFor('speciesEntry', 'fr', { species: published.id }),
      en: pathFor('speciesEntry', 'en', { species: published.id }),
    },
    inheritedDraftNode: pathFor('tree', 'en', inherited),
    ownDraftNode: ownDraft.id,
  }
}

function websiteData(page: Page) {
  return page.locator('script[type="application/ld+json"]')
}

test('the sitemap pairs every page with its translation across localized segments', async ({
  request,
}) => {
  const { publishedPage } = await indexing()
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).toContain(
    `<url><loc>https://aubaine.io${publishedPage.fr}</loc>` +
      `<xhtml:link rel="alternate" hreflang="fr-FR" href="https://aubaine.io${publishedPage.fr}"/>` +
      `<xhtml:link rel="alternate" hreflang="en-GB" href="https://aubaine.io${publishedPage.en}"/>` +
      '</url>',
  )
})

test('the sitemap lists no draft, no search and no error page', async ({ request }) => {
  const { inheritedDraftNode, ownDraftNode } = await indexing()
  const sitemap = await (await request.get('/sitemap.xml')).text()
  expect(sitemap).not.toContain(inheritedDraftNode)
  expect(sitemap).not.toContain(ownDraftNode)
  expect(sitemap).not.toContain('/fr/recherche')
  expect(sitemap).not.toContain('/en/search')
  expect(sitemap).not.toContain('/404')
  expect(sitemap).not.toContain('/fr/atlas')
  expect(sitemap).not.toContain('/en/atlas')
})

test('a page that inherits draft from its tree stays out of the index', async ({ request }) => {
  const html = await (await request.get((await indexing()).inheritedDraftNode)).text()
  expect(html).toContain('<meta name="robots" content="noindex, follow">')
  expect(html).not.toContain('rel="canonical"')
})

test('a published page is indexable and names itself canonical', async ({ request }) => {
  const { publishedPage } = await indexing()
  const html = await (await request.get(publishedPage.en)).text()
  expect(html).not.toContain('name="robots"')
  expect(html).toContain(`<link rel="canonical" href="https://aubaine.io${publishedPage.en}">`)
})

test('no page claims a locale neutral alternate', async ({ request }) => {
  const { publishedPage } = await indexing()
  for (const path of ['/', '/fr', '/en', publishedPage.fr, '/en/books', '/fr/recherche']) {
    const html = await (await request.get(path)).text()
    expect(html, path).not.toContain('x-default')
  }
})

test('only the home pages describe the website', async ({ request }) => {
  for (const path of ['/fr', '/en']) {
    const html = await (await request.get(path)).text()
    expect(html, path).toContain('"@type":"WebSite"')
  }
  const species = await (await request.get((await indexing()).publishedPage.fr)).text()
  expect(species).not.toContain('application/ld+json')
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
