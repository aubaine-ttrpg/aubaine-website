---
paths:
  - "src/**/*.{ts,tsx,astro}"
  - "astro.config.*"
  - "wrangler.*"
---

# Runtime Boundaries

- Make build time, browser, and Cloudflare runtime code ownership obvious from file location and imports.
- Do not import browser only modules into build or server paths.
- Do not import secret bearing or server only modules into client islands.
- Avoid Node specific modules in code that can run on Cloudflare.
- Keep environment access behind a small typed boundary.
- Pass only the minimum serializable data required from server or build code to the browser.
- Keep content transformation at build time when the result does not depend on the request.
