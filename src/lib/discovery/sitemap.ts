export type SitemapAlternate = { hreflang: string; href: string }

export type SitemapEntry = { loc: string; alternates: readonly SitemapAlternate[] }

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char] ?? char)
}

function urlElement(entry: SitemapEntry): string {
  const links = entry.alternates.map(
    (alternate) =>
      `<xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hreflang)}" href="${escapeXml(alternate.href)}"/>`,
  )
  return `<url><loc>${escapeXml(entry.loc)}</loc>${links.join('')}</url>`
}

export function sitemapXml(entries: readonly SitemapEntry[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries.map(urlElement),
    '</urlset>',
    '',
  ].join('\n')
}
