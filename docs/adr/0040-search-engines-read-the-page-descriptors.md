# ADR: Search engines read the page descriptors

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-06
**Deciders:** Kori
**Scope:**
- **Covers:**
  - which pages a search engine may index, and where that is decided;
  - the sitemap, `robots.txt`, and the crawl header on the booklet PDFs;
  - the canonical, `og:url`, alternate and structured data tags in a page's head.
- **Does not cover:**
  - the locale model and the French fallback on English URLs (0003), which stays as decided;
  - the URL scheme itself (0005) or the threshold's hand-off (0021 Decision 2);
  - registering the site with a search console, which happens outside the repository.
- **Amends:** 0005 Decisions 1, 2 and 4, 0010 Decision 1, and 0021 Decision 1 and its caveat.

---

## Context

On 2026-10-06 `site:aubaine.io` returned nothing on a web search tool and on Bing. A crawl of the 762
URLs in the live sitemap that day found every page reachable. But it also found signals that
contradicted each other:

- Draft pages, Lorem ipsum skills among them, were indexable and listed in the sitemap.
- Every page pointed `x-default` at `/`, which is `noindex` with a canonical at `/fr`.
- 696 of the 762 sitemap entries carried no alternate. `@astrojs/sitemap` 3.7.4 pairs two locales
  only when their paths are identical, and the localized segments of 0005 never are.
- `robots.txt` disallowed the search pages, so a crawler never fetched them and never read their
  `noindex`.
- Every page emitted a `WebSite` JSON-LD carrying that page's own description.

Versions this was decided against, read from `pnpm-lock.yaml`: `astro@7.3.3`, `@swup/astro@1.8.0`,
`@swup/head-plugin@2.3.1`, `swup@4.10.0`.

---

## Decision 1: Whether a page is indexed is decided in its descriptor

### Decision

- `noIndex` on the `PageDescriptor` in `src/lib/game/pages.ts` is the only indexing decision, and
  `Base.astro`, the sitemap and the tests all read it.
- A page whose subject resolves to `draft` is `noIndex`:
  - a tree page reads `tree.status`;
  - a tree node reads `data.skillStatus`, the map 0010 Decision 2 resolves down the ownership ladder;
  - a species page reads its own `status`.
- The search pages and the 404 pages stay `noIndex` as before.
- An English page whose text falls back to French stays indexable, as 0003 Decision 3 and
  `.claude/rules/architecture/i18n-routing.md` decide.

### Rationale

- The owner chose on 2026-10-06 to keep drafts out of search. A draft stays published and reachable
  with its badge, as 0010 requires, and it joins the index the day its status moves to `playtest`.
  Nothing else has to change.
- `status` lives in the canonical file, and the overlay schemas are `.strict()` with no `status`, so
  a page and its translation are always both indexable or both not. A sitemap alternate can
  therefore never point at a `noindex` page.
- Reading `placement.skill.status` would miss a skill that inherits `draft` from its tree. 82 of the
  88 draft node pages per locale do, verified against `data/skill-trees/` and `data/skills/`.
- `pnpm build` reports 804 pages. 234 are `noindex`, of which 101 per locale are tree pages, and the
  other 570 are indexable.

### Alternatives considered

- **Leave drafts indexable**: rejected by the owner, because some drafts still carry placeholder
  text. It would come back if drafts stopped being hidden from the lists by default.
- **Canonicalise untranslated English pages to French**: rejected by the owner. It needs a
  translation-coverage test per page kind. It also needs the language switch to stop reading the
  head's alternates (`syncLanguageLinks` in `src/scripts/shell.ts`). It would come back if English
  pages started to rank instead of their French originals.

### Caveats

- Most English skill and tree pages carry French text. A search engine may treat them as
  duplicates of the French pages and pick the French one. That is the cost 0003 Decision 3 already
  accepts.

---

## Decision 2: The sitemap is built from the descriptors

### Decision

- `src/pages/sitemap.xml.ts` serves `/sitemap.xml`. It lists every built page without `noIndex`.
  Each URL carries one `xhtml:link` per locale, itself included, from `alternatesFor` and
  `HTML_LANG`.
- The serialisation is `sitemapXml` in `src/lib/discovery/sitemap.ts`, tested in
  `tests/unit/sitemap.test.ts`.
- `builtRoutes()` in `src/components/views/registry.ts` is the one route list that both the
  catch-all page and the sitemap read.
- `@astrojs/sitemap` leaves `astro.config.mjs` and `package.json`, together with its filter, which
  repeated the search slugs as a regular expression.
- No `lastmod`, `changefreq` or `priority` is written, because no field records when an entry last
  changed meaningfully.

### Rationale

- The sitemap can no longer disagree with the pages: it has the same descriptors, the same
  indexing decision and the same alternates as each page's head. A script audit of `dist/` on
  2026-10-06 found 570 sitemap URLs, each one a built page without `noindex`, and every alternate
  matching its target's `lang`.
- Google asks that each `<url>` list every language version, itself included (verified on
  developers.google.com, "Tell Google about localized versions of your page", 2026-10-06).

### Alternatives considered

- **Keep `@astrojs/sitemap` and add alternates in its `serialize` hook**: rejected. The hook sees a
  URL rather than a descriptor, so it would need a second copy of the route table and of the
  indexing rule. It would come back if the site outgrew one sitemap file, which the protocol caps
  at 50,000 URLs (unverified here).

---

## Decision 3: A page's head states only what is true of it

### Decision

- An indexable page names itself canonical. A `noindex` page names no canonical.
- `og:url` is the page's own URL, so the threshold unfurls as `https://aubaine.io/`.
- No page carries `x-default`. The `fr-FR` and `en-GB` alternates stay on every page.
- One `WebSite` node is emitted on the home pages (`/`, `/fr`, `/en`) and nowhere else. It carries
  an `@id`, the name, the root URL and both languages, and no description.

### Rationale

- The root used to combine `noindex` with a canonical to `/fr`, which sends a crawler both signals
  at once. A `noindex` page has no canonical to claim.
- `.claude/rules/architecture/i18n-routing.md` allows `x-default` only for a real locale-neutral
  destination. The only one is the root, and the root stays out of the index. Google treats
  `x-default` as optional.
- The alternates stay on `noindex` pages because the language switch reads them. Google ignores
  hreflang on a page it does not index.
- A `WebSite` is the site, so describing it with each page's text described a different site on
  every page. The Swup head plugin adds and removes the node on navigation, as asserted in
  `tests/e2e/search-engines.spec.ts`.

### Alternatives considered

- **Make the root indexable as the `x-default`**: rejected. The threshold hands off through Swup at
  once and replaces the head, canonical included. So a rendering crawler would see the root turn into
  `/en` (0021 Decision 2). It would come back if the threshold stopped navigating on its own.

### Caveats

- Google reads a site name only from the domain root, according to "Site names in Google Search" on
  developers.google.com (read 2026-10-06), and the root is `noindex`. Whether Google uses the
  `WebSite` node on a `noindex` root is unverified.

---

## Decision 4: Crawlers are kept out by the page, never by robots.txt

### Decision

- `robots.txt` allows every path and names `/sitemap.xml`. It disallows nothing.
- `/pdf/*` and `/pdf-archive/*` carry `X-Robots-Tag: noindex` in `public/_headers`.

### Rationale

- `.claude/rules/discovery/crawling-indexing.md` asks for `noindex` instead of robots blocking
  alone. A disallowed page is never fetched, so its `noindex` is never read.
- A booklet PDF changes its URL at every printing, and the previous file leaves `public/pdf/` (0013).
  The owner chose on 2026-10-06 to keep PDFs out of search, so that the chapter, tree and archive
  pages rank instead of a file that will soon be gone.

### Alternatives considered

- **Keep disallowing the search pages**: rejected for the rule above. It would come back if search
  started accepting a query that creates new URLs at scale.
- **Let search engines index the PDFs**: rejected by the owner for the churn described above.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| `noIndex` | The only indexing decision | `src/lib/game/pages.ts` |
| `builtRoutes()` | The route list the pages and the sitemap share | `src/components/views/registry.ts` |
| Sitemap | Indexable pages with every language version | `src/pages/sitemap.xml.ts`, `src/lib/discovery/sitemap.ts` |
| Head tags | Canonical, `og:url`, alternates, `WebSite` | `src/layouts/Base.astro` |
| Crawl policy | Allow all, PDFs `noindex` | `src/pages/robots.txt.ts`, `public/_headers` |
| Contract tests | Sitemap, drafts, head, Swup | `tests/e2e/search-engines.spec.ts` |
