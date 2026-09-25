# ADR: The root is a threshold that routes the reader by language

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-25
**Deciders:** Kori
**Scope:** What `https://aubaine.io/` serves, how it chooses a locale, and how it hands the reader
to that locale's home. Amends 0005 Decision 1 and Decision 2 and 0012 Decision 3. Does not cover the
security policy the page runs under (0022) or the route scheme below the locale prefix (0005).

---

## Context

`/` was Astro's `redirects: { '/': '/fr' }` stub: a 268 byte `dist/index.html` with a zero second
meta refresh, a black on white link, no styles and no Open Graph tags, served with status 200
(verified with `curl -sI https://aubaine.io/` on 2026-09-25). Every visitor saw it flash white,
every English reader was sent to French, and a pasted `aubaine.io` link unfurled with nothing. The
root URL carries no locale, so the reader's browser is the only signal for choosing one. The owner
asked for the site's own chrome with only the logo in the bar, the house loading animation, and no
wait before moving on.

Versions this was decided against, read from `pnpm-lock.yaml`: `astro@7.3.3`, `@swup/astro@1.8.0`,
`swup@4.10.0`.

---

## Decision 1: `/` is a page in the default locale's head, kept out of the index

### Decision

- `redirects` leaves `astro.config.mjs`. `src/pages/index.astro` renders `Base` from
  `homePage(DEFAULT_LOCALE, data)` in `src/lib/game/pages.ts`, the descriptor the French home is
  built from, with `noIndex`.
- The head is the French home's head plus `noindex, follow`: canonical `/fr` as the stub had, the
  Bastion social card through `socialImage()` in `src/lib/social-image.ts`, and `og:locale fr_FR`
  with `en_GB` as the alternate.
- The sitemap filter in `astro.config.mjs` drops the root with `new URL(page).pathname !== '/'`,
  because `@astrojs/sitemap` passes it as `https://aubaine.io/` whatever `trailingSlash` says.
- The body is `src/components/views/Threshold.astro`: the logo, an `h1`, and one link per locale to
  its home, each carrying a bare `hreflang`, its own `lang`, and `data-swup-history="replace"`. A
  `<noscript>` prompt names the choice in both languages. The row of links sits at `z-index: 41`,
  above the crest and below the header.
- `src/layouts/Base.astro` gains two named slots, `header` and `crest`, whose fallbacks are the
  `Header` and `LoadingCrest` every other page renders. The root fills them with a logo-only
  `Masthead` and `<LoadingCrest phase="loading" />`.

### Rationale

- Reusing the home descriptor keeps one description of the site. The root tells a crawler or a link
  unfurler nothing that `/fr` does not, and `noindex` keeps it out of results as the stub's own
  `noindex` did.
- Astro lets the root through: with `redirectToDefaultLocale: false`, the prefix-always strategy
  continues on `/` (`matchPrefixAlwaysNoRedirect` in `astro/dist/i18n/router.js`), and no path from
  `pageRoutes()` is empty, so the page cannot collide with the catch-all.
- The links are the floor 0006 requires. Without JavaScript, `@media (scripting: none)` in
  `LoadingCrest.astro` hides the crest and the reader picks a language. When the scripts fail to
  load, the row stays above the crest and clickable. Both are asserted in
  `tests/e2e/no-javascript.spec.ts` and `tests/e2e/threshold.spec.ts`, the second by hit testing
  through the crest.

### Alternatives considered

- **A 301 in `public/_redirects`**: removes the flash with no page at all, and cannot choose a
  language. Reopens if the site ever serves a single locale.
- **A Worker negotiating `Accept-Language`**: would choose before first paint. It costs request
  time code on a site that has none (0006 Decision 1) and a cache that varies on a header, which
  `.claude/rules/platform/caching.md` warns against. Reopens if the host gains header based routing
  that needs no runtime.
- **The full navbar in the default locale**: rejected by the owner. An English reader would read
  French labels until the swap, and a nav click would race the hand-off.

### Caveats

- Every page's `x-default` still points at `/` (`Base.astro`), which is `noindex` with a canonical
  to `/fr`. That is the state the stub already had. Making the root indexable, or pointing
  `x-default` at another page, is a separate search decision that this record does not take.
- `@media (scripting: none)` is verified in Chromium only, by the Playwright run above.

---

## Decision 2: The browser picks the locale, and the hand-off is instant

### Decision

- `preferredLocale(navigator.languages)` in `src/lib/i18n/locales.ts` returns the first tag whose
  primary subtag is a supported locale, ignoring case, and otherwise `LINGUA_FRANCA`, which is
  `en`.
- `bindThreshold` in `src/scripts/threshold.ts`, registered last in `src/scripts/shell.ts`, reads
  the destination from the threshold link whose `hreflang` matches, and calls
  `swup.navigate(path, { history: 'replace' })` at once. There is no hold.
- It replaces the `visit:fail` handler: a failed visit whose history action is `replace` logs the
  error and calls `location.replace`, and every other visit keeps Swup's default.
- Nothing is stored.

### Rationale

- Reading the destination from the markup keeps the segment table out of the browser, for the reason
  0012 Decision 2 gives about the language links.
- `replace` keeps `/` out of the history, so Back leaves the site instead of landing on a page that
  forwards again. `tests/e2e/threshold.spec.ts` goes back from the arrival and expects the page
  before the root.
- Swup's default failure handler cannot serve a replace visit. `performNativeNavigation` in
  `swup@4.10.0` (`src/modules/navigate.ts:262-270`) sees that the address already moved forward and
  calls `history.back()`. With nothing pushed, that leaves the site, or does nothing in a fresh tab.
  The override is exercised by aborting the hand-off fetch in `tests/e2e/threshold.spec.ts`.
- `LINGUA_FRANCA` is named apart from `DEFAULT_LOCALE` because they answer different questions:
  which locale is canonical, and which one a reader of neither language is most likely to read.
  "Fallback" was avoided because `.claude/rules/architecture/i18n-routing.md` already uses the word
  for French content shown on an English URL.
- The privacy page names one stored key, `aubaine.theme` (`src/content/policies/confidentialite.md`).
  Reading `navigator.languages` stores and sends nothing, so that sentence stays true.

### Alternatives considered

- **A short pause so the animation reads**: rejected by the owner for an instant hand-off. It would
  also have made the root a timed redirect, the pattern WCAG failure F40 records against success
  criterion 2.2.1 for meta refresh.
- **French for a reader of neither language**: keeps the stub's behaviour and adds no constant.
  Rejected by the owner, because such a reader is more likely to read English.
- **Remembering an explicit choice in `localStorage`**: would let a returning reader skip detection,
  at the cost of a second stored key and a change to the privacy page. Reopens if readers report
  being sent to the wrong language.

---

## Decision 3: The crest carries the arrival, and the header fills in

### Decision

- The root renders the crest in its `loading` phase. `bindLoading` in `src/scripts/loading.ts`
  adopts a server rendered `data-phase="loading"` as already showing, and its `visit:start` handler
  returns early while a crest is showing. The adopted crest therefore runs into collapse, void and
  burst when the home arrives.
- `/` has no locale segment, so `crossesLocale` in `src/scripts/shell.ts` counts the hand-off as a
  locale crossing and swaps `#site-header`. A one time `content:replace` hook in `threshold.ts` sets
  `data-arriving` on the incoming header, and its four controls run `au-pop` at a 60ms stagger
  (`src/components/shell/Header.astro`).
- The bar and the brand live in `src/components/shell/Masthead.astro`, which `Header` fills with its
  controls and the root leaves empty.

### Rationale

- The crest is already the house loading affordance (0012 Decision 3). Reusing it gives the root its
  motion without a second animation system over the same transition.
- The header swap depends on `localeOf('/')` returning `undefined` (`src/scripts/shell.ts:292-299`).
  `tests/e2e/threshold.spec.ts` asserts that the incoming header carries three nav items and
  `data-arriving`, so a change to that function fails a test rather than a reader.
- The global reduced motion rule in `src/styles/base.css` already neutralises `au-pop`, and the
  crest's own stylesheet hides it under the same query.

### Alternatives considered

- **An emblem of the root's own**: a second crest or a drawn logo would duplicate the overlay and
  could not reveal the home page underneath it. Rejected.

### Caveats

- This reopens, for `/` only, the intro on first document load that 0012 Decision 3 rejected. It
  holds because no search result leads to `/`: the root is `noindex`, and `/fr` and `/en` pages
  are what search engines list.
- The reveal adds about 590ms after the home arrives (0012 Decision 3), on every arrival through the
  root.
- Once the hand-off starts, Swup's crossfade takes the row of links down with the rest of the
  threshold, so during a slow fetch the crest is the only affordance, as on any slow navigation.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Root page | The default locale's head, `noindex`, logo-only bar, crest, both links | `src/pages/index.astro`, `src/components/views/Threshold.astro` |
| Shell slots | Header and crest overridable, defaults unchanged | `src/layouts/Base.astro`, `src/components/shell/Masthead.astro` |
| Locale choice | First supported browser language, else English | `src/lib/i18n/locales.ts` |
| Hand-off | Instant Swup visit with history replace, native replace on failure | `src/scripts/threshold.ts` |
| Arrival | Adopted crest, header controls pop in | `src/scripts/loading.ts`, `src/components/shell/Header.astro` |
| Proof | Three browser languages, history, failure, no scripts, reduced motion, no JavaScript | `tests/e2e/threshold.spec.ts`, `tests/e2e/no-javascript.spec.ts`, `tests/unit/locales.test.ts` |
