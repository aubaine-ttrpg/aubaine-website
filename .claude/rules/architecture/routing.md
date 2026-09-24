---
paths:
  - "src/pages/**/*"
  - "src/middleware.*"
  - "src/lib/**/*route*"
  - "src/lib/**/*url*"
  - "astro.config.*"
---

# Routing

- Treat published URLs as durable identifiers.
- Keep slugs stable after publication.
- Permanently redirect moved content instead of breaking inbound links.
- Do not create multiple crawlable URLs for the same localized content.
- Centralize trailing slash behavior through Astro configuration.
- Centralize locale routing.
- Keep route generation deterministic.
- Return real 404 responses for missing entities.
- Do not render a generic success page for unknown slugs.
- Keep pagination URLs stable and crawlable when pagination exists.
- Preserve query parameters only when they affect meaningful page state.
- Do not index internal search pages, previews, empty taxonomies, or low value filter combinations unless intentionally designed for indexing.
