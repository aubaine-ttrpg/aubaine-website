import { describe, expect, it } from 'vitest'

import { sitemapXml } from '../../src/lib/discovery/sitemap'

const TREE_NODE = {
  loc: 'https://aubaine.io/fr/arbre/mage/INFLEX-001',
  alternates: [
    { hreflang: 'fr-FR', href: 'https://aubaine.io/fr/arbre/mage/INFLEX-001' },
    { hreflang: 'en-GB', href: 'https://aubaine.io/en/tree/mage/INFLEX-001' },
  ],
}

describe('sitemapXml', () => {
  it('declares the sitemap and xhtml namespaces', () => {
    const xml = sitemapXml([TREE_NODE])
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n')).toBe(true)
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
  })

  it('lists every language version of a page, itself included', () => {
    const xml = sitemapXml([TREE_NODE])
    expect(xml).toContain(
      '<url><loc>https://aubaine.io/fr/arbre/mage/INFLEX-001</loc>' +
        '<xhtml:link rel="alternate" hreflang="fr-FR" href="https://aubaine.io/fr/arbre/mage/INFLEX-001"/>' +
        '<xhtml:link rel="alternate" hreflang="en-GB" href="https://aubaine.io/en/tree/mage/INFLEX-001"/>' +
        '</url>',
    )
  })

  it('escapes the characters XML reserves', () => {
    const xml = sitemapXml([
      {
        loc: `https://aubaine.io/fr?a=1&b=<2>"'`,
        alternates: [{ hreflang: 'fr-FR', href: 'https://aubaine.io/fr?a=1&b=2' }],
      },
    ])
    expect(xml).toContain('<loc>https://aubaine.io/fr?a=1&amp;b=&lt;2&gt;&quot;&apos;</loc>')
    expect(xml).toContain('href="https://aubaine.io/fr?a=1&amp;b=2"')
  })

  it('writes an empty urlset when no page is indexable', () => {
    expect(sitemapXml([])).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
        '</urlset>\n',
    )
  })
})
