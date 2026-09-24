---
paths:
  - "src/**/*.{ts,tsx,astro}"
  - "astro.config.*"
  - "wrangler.*"
---

# Security

- Treat URL parameters, form data, headers, cookies, remote API data, and authored raw HTML as untrusted at their boundaries.
- Validate structured input with explicit schemas.
- Escape output through framework defaults.
- Do not render untrusted raw HTML.
- Sanitize intentionally supported authored HTML with a maintained allowlist approach.
- Keep secrets server side.
- Never log secrets, tokens, session identifiers, or sensitive form payloads.
- Use secure cookie settings for authenticated state if authentication is introduced.
- Add explicit CSRF protection when state changing authenticated endpoints exist.
- Restrict third party scripts and embeds.
- Do not introduce dynamic code execution.
- Add security headers deliberately and verify compatibility with required site behavior.
- Keep dependencies minimal and maintained.
