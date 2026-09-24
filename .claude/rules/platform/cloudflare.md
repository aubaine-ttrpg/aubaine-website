---
paths:
  - "astro.config.*"
  - "wrangler.*"
  - "src/pages/api/**/*"
  - "src/actions/**/*"
  - "src/middleware.*"
  - "src/**/*server*.ts"
  - "src/**/*cloudflare*.ts"
---

# Cloudflare

- Prefer fully static Astro output for wiki and showcase routes.
- Do not add the Astro Cloudflare adapter when the project is purely static.
- Add the adapter only when on demand rendering, server actions, sessions, or other request time behavior requires it.
- Keep Cloudflare runtime compatibility explicit in server side dependencies.
- Do not use Node only APIs in Cloudflare runtime paths.
- Keep the Cloudflare compatibility date explicit and update it intentionally.
- Keep bindings typed.
- Access secrets through environment or Cloudflare bindings.
- Never expose server only environment values through client bundles.
- Validate all external input at the request boundary.
- Return explicit status codes and cache semantics from dynamic endpoints.
- Keep edge handlers small and deterministic.
- Avoid per request work that can move to build time.
- Do not add KV, D1, R2, Durable Objects, Queues, Workers AI, or other platform products without a concrete requirement.
- Keep preview and production behavior as close as practical.
