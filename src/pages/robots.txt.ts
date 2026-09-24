import type { APIRoute } from 'astro'

import { LOCALES } from '../lib/i18n/locales'
import { pathFor } from '../lib/i18n/routes'

export const GET: APIRoute = ({ site }) => {
  const disallowed = LOCALES.map((locale) => `Disallow: ${pathFor('search', locale)}`)
  const body = [
    'User-agent: *',
    ...disallowed,
    'Allow: /',
    '',
    `Sitemap: ${new URL('sitemap-index.xml', site ?? 'https://aubaine.io').href}`,
    '',
  ].join('\n')

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
