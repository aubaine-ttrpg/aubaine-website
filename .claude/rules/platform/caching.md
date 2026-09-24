---
paths:
  - "src/pages/**/*"
  - "src/middleware.*"
  - "public/**/*"
  - "wrangler.*"
  - "astro.config.*"
---

# Caching

- Prefer content addressed build assets with long lived immutable caching.
- Do not mark mutable HTML or API responses immutable.
- Keep cache policy explicit for runtime responses.
- Do not publicly cache personalized or authenticated responses.
- Vary only on request properties that actually change the response.
- Avoid locale negotiation through opaque headers when locale is already encoded in the URL.
- Do not use cache busting query parameters for normal built assets.
- Avoid custom service worker caching unless offline support is an explicit product requirement.
- Measure before adding additional cache layers.
