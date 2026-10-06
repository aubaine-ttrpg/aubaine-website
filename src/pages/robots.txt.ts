import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error('robots.txt needs `site` in astro.config.mjs')

  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${new URL('sitemap.xml', site).href}`,
    '',
  ].join('\n')

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
