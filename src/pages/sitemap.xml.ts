import type { APIRoute } from 'astro'

import { builtRoutes } from '../components/views/registry'
import { sitemapXml } from '../lib/discovery/sitemap'
import { HTML_LANG } from '../lib/i18n/locales'
import { alternatesFor, urlFor } from '../lib/i18n/routes'

export const GET: APIRoute = async ({ site }) => {
  if (!site) throw new Error('The sitemap needs `site` in astro.config.mjs')

  const entries = (await builtRoutes())
    .filter(({ page }) => !page.noIndex)
    .map(({ page }) => ({
      loc: urlFor(page.kind, page.locale, site, page.params),
      alternates: alternatesFor(page.kind, site, page.params).map(({ locale, href }) => ({
        hreflang: HTML_LANG[locale],
        href,
      })),
    }))

  return new Response(sitemapXml(entries), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
