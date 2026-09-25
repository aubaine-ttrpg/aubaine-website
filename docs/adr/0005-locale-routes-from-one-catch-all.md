# ADR: Locale prefixed routes with localized slugs, built by one catch-all

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-20
**Revised:** 2026-09-21, the indexes page is renamed and both locales share one slug
**Revised:** 2026-09-25, `/` stops redirecting and becomes a threshold page, so `src/pages/` gains
`index.astro` (0021)
**Deciders:** Kori
**Scope:** The URL scheme, where routes come from, and the constraint a segment must satisfy. Does
not cover how a page is rendered (0006) or how navigation between them works (0007).

---

## Context

The exported design was a hash routed single page application. Language was a `localStorage` flag,
so both languages shared one URL and only one could ever be indexed.

The requirement for this site is the opposite: a wiki whose pages are found through search, in two
languages, with durable addresses. Astro also offers a choice the design did not have, between
declaring routes as files and generating them from data. With 15 trees, 205 skills, 38 items and four
books, and an Editor coming that will add more, that choice decides how much work a new piece of
content is.

---

## Decision 1: Every page is `/{locale}/...` with localized slugs

### Decision

- Astro i18n with `prefixDefaultLocale: true`, so French is `/fr/...` rather than bare. `/`
  permanently redirects to `/fr`.
- Slugs are translated, not shared: `/fr/arbre/berserker` and `/en/tree/berserker`,
  `/fr/actions-de-base` and `/en/base-actions`.
- Every slug lives in one table, `SEGMENT` in `src/lib/i18n/routes.ts`. Nothing else builds a path
  by concatenating strings.
- The language control resolves to the sibling entity, not to the locale home, because it rebuilds
  the current route descriptor in the other locale.
- `trailingSlash: 'never'`.

### Rationale

- Both languages become indexable, with a self canonical URL and correct `hreflang` alternates on
  every page. Under the design's flag, only one language existed to a crawler.
- One table means the slug, the canonical URL, the alternates, the sitemap entry, and the language
  switch target are all derived from the same source and cannot disagree.
- Translated slugs are what a French reader expects to see and to share. The cost is one table
  entry per view.

### Alternatives considered

- **Keep the design's client side language flag**: rejected. It cannot produce `hreflang`, and half
  the content would be invisible to search.
- **Prefixed routes with shared English slugs in both locales**: rejected as the lesser of the two
  when asked. It is simpler to generate but puts English words in French URLs on a French first site.
- **No prefix on the default locale**: rejected. It makes French the special case in every path
  building function and complicates the sibling calculation for no user benefit.

### Addendum (2026-09-25): the root is a threshold, not a redirect

`/` no longer redirects to `/fr`. It never did so permanently: the `redirects` entry in
`astro.config.mjs` built a page served with status 200 and a zero second meta refresh, verified with
`curl -sI https://aubaine.io/`. 0021 replaces it with a page that picks `/fr` or `/en` from the
browser's languages and hands off through Swup. Every other bullet of this decision stands: each
page still lives under its locale prefix, and the root is `noindex` with its canonical at `/fr`.

---

## Decision 2: One catch-all, and the routes come from the data

### Decision

- `src/pages/` holds exactly three files: `[...path].astro`, `404.astro`, and `robots.txt.ts`.
- `pageRoutes()` in `src/lib/codex/pages.ts` walks the corpus for both locales and returns every
  path with the descriptor that renders it. `getStaticPaths` returns that list. 421 pages build.
- `src/components/views/View.astro` dispatches on the descriptor's `kind`.

### Rationale

- A new skill tree file becomes a page, a grid entry, a set of node pages, search rows, and tooltip
  entries with no route to register. That is the property the whole data layer exists to provide,
  and a file-per-view routing tree would break it for exactly the content that grows.
- The page file stays thin, which is what `.claude/rules/architecture/astro.md` asks for. All the
  interesting logic is in the route table and the corpus, both of which are unit testable without
  Astro.

### Caveats

- One catch-all means the router is a dispatch rather than a directory listing, so the set of views
  is discoverable from `View.astro` and `registry.ts` rather than from `ls src/pages`. That is a
  real loss of legibility, accepted because the alternative loses the self registration.

### Addendum (2026-09-25): the root has its own page file

`src/pages/index.astro` joins the catch-all and `404.astro`. Like `404.astro`, it renders no locale
route, so it stays outside `pageRoutes()` and the catch-all remains the only page file that renders a
locale's content. The file list in this decision was already short of `src/pages/print/`, which 0015
records.

---

## Decision 3: No route segment may be a name a static host resolves as a directory index

### Decision

- A path segment may never be `index` or `index.html`.
- `tests/unit/derive.test.ts` asserts this across every view kind and both locales.
- The French indexes page is `/fr/index-du-codex`.

### Rationale

- `/fr/index` was the natural French slug and it was silently broken. It builds to
  `dist/fr/index/index.html`, but a static host resolving `/fr/index` finds `dist/fr/index.html`
  first, which is the French home page. Confirmed by serving the build and reading the title:
  `/fr/index` returned the home page's title, while `/en/indexes` returned the right one.
- Review did not catch it, and neither did the type checker or the build. A screenshot comparison
  run during the initial build did: the French indexes page differed on more than 40 percent of its
  pixels across every theme and width, while the English one was clean. A locale-specific failure
  on a single view is the signature of a slug problem.
- The test exists because the next person adding a localized slug has no reason to know this.

### Caveats

- The guard lists two reserved names. Other hosts may reserve more, and the list will need
  extending if the deployment target ever changes.

### Addendum (2026-09-21): the page is renamed Almanach, at one slug in both locales

The indexes page is now `/fr/almanach` and `/en/almanach`, replacing `/fr/index-du-codex` and
`/en/indexes`. Both old paths carry a 301 in `public/_redirects`. The `ViewKind` is `almanach`, while
`INDEX_KINDS` keeps its name: the five browsable indexes are still indexes, and the almanach is the
page that lists them.

The constraint this decision records is untouched and is what ruled out the obvious slug a second
time. `index` remains unusable as a French segment for the reason given above, and `indexs` was
considered as a way around it before being rejected: `index` ends in `-x` and is invariable in
French, so the spelling is simply wrong. Renaming the page sidestepped the collision instead of
working around it.

The two locales now share one segment, which nothing in Decision 1 forbids. `almanach` is a French
word that English also carries, so translating it would have produced two spellings, `almanach` and
`almanac`, that differ by one silent letter and would invite mistyped links in both directions.

---

## Decision 4: A selected node and a book page are real URLs

### Decision

- `/{locale}/arbre/{tree}/{node}` is prerendered for every placement, so a link to a highlighted
  skill works on a cold load.
- Every book page is prerendered at `/{locale}/livres/{book}/{n}`, and the page list and pager are
  ordinary links.
- The internal search page carries `noindex`, and `robots.txt` disallows it in both locales.

### Rationale

- The design changed the URL for a selected node with `history.replaceState`, so the address was
  shareable within a session but meant nothing to anyone who received it. Prerendering the same
  shape makes the link real at the cost of about 180 extra pages per locale, which the build absorbs
  without difficulty.
- Book pagination as links means the reader can open a chapter in a new tab and a crawler can reach
  every page, neither of which a JavaScript pager allows.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Slug table | The only place a path segment is written | `src/lib/i18n/routes.ts` |
| Route list | Every page in both locales, from the corpus | `src/lib/codex/pages.ts` |
| Catch-all | The only page file that renders content | `src/pages/[...path].astro` |
| Dispatch | Descriptor kind to view component | `src/components/views/View.astro` |
| Reserved segment guard | Stops the `/fr/index` class of defect | `tests/unit/derive.test.ts` |
