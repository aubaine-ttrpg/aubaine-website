# ADR: The build lets its own inline scripts through the security policy

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-25
**Deciders:** Kori
**Scope:** How `script-src` in the deployed `_headers` admits the inline scripts the build emits.
Amends 0006 Decision 4. Does not cover `style-src`, the other headers, or the root page that
prompted the audit (0021).

---

## Context

0006 Decision 4 sends a content security policy with `script-src 'self'` from `public/_headers`,
confirmed on the live responses for `/` and `/en/trees` on 2026-09-25. Two kinds of inline script
reach the build, and that policy blocks both.

- The theme bootstrap at `src/layouts/Base.astro:108`, which 0007 Decision 3 placed inline so the
  theme is set before first paint. It is the only reader of `aubaine.theme`, since
  `src/scripts/shell.ts` only writes it. On aubaine.io a saved light theme was never restored, and a
  system light preference was ignored.
- Astro's island loader and its `astro-island` runtime, emitted inline on the 46 built pages that
  mount `src/islands/FilterBar.tsx` (counted over `dist/` after `pnpm build`). Blocked, the island
  never hydrates, so every filter bar on aubaine.io was inert. The live `/en/trees` carries both
  scripts inline.

Local end to end runs missed both, because `astro preview` does not apply `_headers`.

---

## Decision 1: The build hashes its inline scripts into the deployed policy

### Decision

- `inlineScriptPolicy()` in `src/lib/security/script-policy.ts` is an integration on
  `astro:build:done`, registered in `astro.config.mjs`.
- It reads every `dist/**/*.html` and collects each inline `<script>` a browser would execute: no
  `src`, and a `type` that is absent, `module`, or JavaScript. JSON-LD is skipped.
- It appends the sorted, deduplicated `'sha256-...'` sources to `script-src` in `dist/_headers`,
  leaving every other directive as written.
- It throws when `_headers` has no policy or the policy has no `script-src`, so a build cannot ship
  an unrestricted policy by accident.
- `public/_headers` stays the authored policy, with `script-src 'self'`.

### Rationale

- A hash admits the exact bytes the build wrote and nothing else, so an injected script is still
  refused. That keeps the promise 0006 Decision 4 and the privacy page make, "n'autorise que ses
  propres scripts" (`src/content/policies/confidentialite.md`), and makes it true in production.
- Computing the hashes at build time means an edit to an inline script cannot drift from the policy.
  The drafts switch edited the theme bootstrap while this change was being made. The first build
  after it emitted three hashes: the bootstrap, on all 568 pages, and the two island scripts.
- `tests/e2e/security-policy.spec.ts` serves each document under the policy read from
  `dist/_headers`. It asserts that no `securitypolicyviolation` fires, that a stored light theme and
  a system light preference are honoured, and that the island hydrates.
- The same spec also serves the authored policy from `public/_headers`, and asserts that the scripts
  are blocked and the island stays unhydrated. That proves the harness enforces what it reads,
  instead of passing because it enforces nothing.
- `tests/unit/script-policy.test.ts` pins the extraction and the header rewrite: exact hashes,
  `script-src` only, a stable order, idempotence, and the two refusals.

### Alternatives considered

- **Move the bootstrap to a file**: satisfies `'self'`, at the cost of a render blocking request on
  every document load. It also leaves Astro's island runtime blocked, because that runtime is not
  ours to move. Rejected.
- **Hashes written by hand into `public/_headers`**: correct until the next edit to an inline
  script, which the drafts switch showed happens. Rejected. Reopens if the deployment ever stops
  running `pnpm build`.
- **`'unsafe-inline'`**: admits any inline script, including an injected one. Rejected.

### Caveats

- `dist/_headers` differs from `public/_headers`. A reader of the authored file sees `'self'` only;
  the hashes exist in the build output alone, which is what this record is for.
- The extraction reads Astro's own output with a regular expression, not an HTML parser. An inline
  script whose attributes contained a quoted `>` would defeat it, and the policy test would then
  fail rather than pass.
- `astro dev` and `astro preview` send no `_headers`, as before, so only the policy spec runs pages
  under the policy locally.
