# ADR: Every visit reaches aubaine.io over HTTPS

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-11-02
**Deciders:** Kori
**Scope:** How a request made over `http` reaches the site over `https`, and how a browser is told
to stay there. Amends 0006 Decision 4. Does not cover the content security policy (0022) or the
cache headers.

---

## Context

On 2026-11-02, `curl -I http://aubaine.io/` returned `HTTP/1.1 200 OK` with the full page, and
`curl -I https://aubaine.io/` carried no `Strict-Transport-Security` header. Any page could be read
and linked over plain `http`, even though `site` in `astro.config.mjs` is `https://aubaine.io` and
every canonical URL points there.

The site is static assets on a Worker custom domain: `wrangler.jsonc` declares the `aubaine.io`
route and an `assets` directory, and no `main` script. Nothing in the repository runs on a request,
so nothing in it can see the scheme a request arrived on.

---

## Decision 1: The redirect is the zone's Always Use HTTPS

### Decision

- "Always Use HTTPS" is turned on for the `aubaine.io` zone in the Cloudflare dashboard (SSL/TLS,
  Edge Certificates), in the Aubaine account that owns the zone.
- The repository holds no redirect from `http` to `https`.

### Rationale

- Cloudflare documents the setting as redirecting "all your visitor requests from `http` to `https`,
  for all subdomains and hosts" in the zone
  (developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https, read
  2026-11-02).
- `public/_redirects` cannot express it. The Workers static assets redirects page lists
  domain-level redirects as unsupported, and its rules match a path, not a scheme
  (developers.cloudflare.com/workers/static-assets/redirects, read 2026-11-02).
- It keeps 0006 Decision 1 intact: the deployment stays static assets with no request time code.
- Verified on 2026-11-02 after the setting was turned on: `curl -I http://aubaine.io/fr` returns
  `301 Moved Permanently` with `Location: https://aubaine.io/fr`, so the redirect applies before the
  Worker custom domain serves the request.

### Alternatives considered

- **A Worker script that redirects when the scheme is `http`**: needs a `main` entry and
  `run_worker_first`, so every asset request would run code to answer a question the edge already
  answers. Rejected. Reopens if the site gains a Worker script for another reason.
- **A Single Redirect rule in the dashboard**: also works, but it is a rule to write and maintain
  where a single setting suffices. Rejected. Reopens if one host of the zone must stay on `http`,
  which the Cloudflare page names as the case for it.

### Caveats

- The setting lives in the dashboard, outside the repository and outside review. This record is the
  only trace of it in the code base.

---

## Decision 2: HSTS is a zone setting too, a year with subdomains and no preload

### Decision

- HSTS is turned on in the same dashboard page: max-age 12 months, subdomains included, preload off.
- `public/_headers` sends no `Strict-Transport-Security` header.

### Rationale

- The redirect still lets the first request of a visit travel in plain `http`. HSTS makes the
  browser upgrade every later request itself, for a year from the last response that carried it.
- The redirect has to live in the zone (Decision 1), so HSTS sits beside it: every setting that
  keeps the site on `https` is on one dashboard page. A zone setting also covers responses
  Cloudflare generates itself, which `_headers` never reaches.
- Subdomains cost nothing today: `www.aubaine.io` does not resolve (`curl`, 2026-11-02), and
  Decision 1 already sends every host of the zone to `https`.
- Verified on 2026-11-02 after the setting was saved: `curl -I https://aubaine.io/` carries
  `strict-transport-security: max-age=31536000; includeSubDomains`, with no `preload`.

### Alternatives considered

- **`Strict-Transport-Security` in `public/_headers`**: versioned, reviewed and testable beside the
  other security headers of 0006 Decision 4. It was written and tested, then removed on 2026-11-02:
  the owner kept the HTTPS settings together in the zone instead of splitting them between the
  dashboard and the repository. Reopens if the site leaves Cloudflare.
- **`preload`**: browsers would ship the domain as `https` only, which also protects the first
  visit. Removal from the list takes months, so it is the hardest form to undo. Rejected by the
  owner on 2026-11-02. Reopens once the site has run on HSTS without trouble.
- **Both places at once**: two owners for one header. Rejected.

### Caveats

- A browser that has seen the header refuses `http` on `aubaine.io` and on every subdomain for a
  year. Turning the setting off does not release it; only a response with `max-age=0` does, and
  only for a browser that comes back.
- Any future subdomain must serve a valid certificate from its first day.
- No test in the repository guards the header. Check it with `curl -I https://aubaine.io/`.
