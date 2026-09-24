---
paths:
  - "src/pages/**/*"
  - "src/layouts/**/*"
  - "src/components/**/*"
  - "src/content/**/*"
  - "public/**/*"
  - "astro.config.*"
---

# SEO

- Give every indexable page a unique, descriptive title and useful meta description.
- Generate metadata from validated page data through one shared metadata layer.
- Emit one canonical URL for each indexable page.
- Keep canonical URLs absolute and locale aware.
- Emit alternate language links only for real equivalent pages.
- Keep document language correct.
- Generate XML sitemaps for indexable canonical URLs across supported locales.
- Use `lastmod` only when it reflects a meaningful content modification date.
- Keep robots directives intentional.
- Prevent indexing of previews, internal search results, empty taxonomies, duplicate filters, and private routes.
- Use descriptive internal link text.
- Ensure important pages are reachable through normal HTML links.
- Keep one clear `h1` and a useful heading hierarchy.
- Render essential page content in the initial HTML.
- Do not hide crawler only text.
- Do not create doorway pages, keyword variants, or near duplicate locale pages.
- Keep Open Graph and social card metadata accurate and page specific.
- Keep metadata correct after Swup navigation.
- Prefer strong page semantics and useful content over metadata volume.
