---
paths:
  - "public/robots.txt"
  - "src/pages/**/*"
  - "astro.config.*"
  - "wrangler.*"
---

# Crawling And Indexing

- Keep public canonical content crawlable when discoverability is intended.
- Do not block CSS, JavaScript, images, or other assets required to understand public pages.
- Use `noindex` for pages that should not appear in search instead of relying on robots blocking alone.
- Keep sitemap URLs canonical, indexable, and successful.
- Do not include redirected, missing, preview, duplicate, or noindex URLs in sitemaps.
- Keep bot protection from accidentally rejecting legitimate search crawlers required by the project's discovery policy.
- Keep training crawler policy separate from search discovery crawler policy.
- Review robots rules whenever route structure, preview environments, or deployment domains change.
