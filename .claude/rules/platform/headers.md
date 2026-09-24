---
paths:
  - "public/_headers"
  - "wrangler.*"
  - "src/middleware.*"
  - "astro.config.*"
---

# HTTP Headers

- Prefer an explicit Content Security Policy once required external origins are known.
- Keep `frame-ancestors` restrictive unless embedding is a product requirement.
- Use `X-Content-Type-Options: nosniff`.
- Use an appropriate `Referrer-Policy`.
- Use a deliberate `Permissions-Policy` that disables unused browser capabilities.
- Enable HSTS only on production domains that are permanently HTTPS capable.
- Do not copy a generic security header set without checking required fonts, images, analytics, embeds, Swup behavior, and development tooling.
