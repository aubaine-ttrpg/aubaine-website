# ADR: Static output, links before JavaScript, one island

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-20
**Revised:** 2026-09-21, Decision 2 gains an addendum: `:target` is the scriptless floor rather
than the whole selection mechanism, because Swup suppresses fragment navigation
**Revised:** 2026-09-23, the browse markup of Decision 2 moves to `BrowseList.astro` and serves the species page (0019)
**Revised:** 2026-09-25, Decision 4 gains an addendum: the deployed policy admits the build's own inline
scripts by hash, without which the island never hydrated in production (0022)
**Revised:** 2026-09-26, Decisions 2 and 3 gain addenda: a tree node page carries its skill beside the
plate and a same-tree selection swaps only that pane; the island dims a tree's nodes and no longer
renders the empty state (0025)
**Deciders:** Kori
**Scope:** What runs at build time versus in the browser, how interaction that the design expressed
as client state is expressed instead, and the cache policy that follows. Does not cover client
navigation between pages (0007) or the route scheme (0005).

---

## Context

The exported design was a single page application. Selecting a skill tree node, picking an item from
the equipment list, turning a book page, and filtering a grid were all React state in one long lived
component, with the entire corpus loaded in the browser.

This site is a reference work. Its pages are found through search, read once, and linked to. Almost
everything the design expressed as state is, for a reader, a different page or a different part of
the same page.

---

## Decision 1: Fully prerendered, no adapter

### Decision

- `output: 'static'` in `astro.config.mjs`. No Cloudflare adapter is installed.
- 421 pages are built, covering both locales.
- The deployment is Cloudflare static assets, configured in `wrangler.jsonc` with
  `not_found_handling: "404-page"` so a missing path serves a real 404.

### Rationale

- Nothing on the site depends on the request. Every page is a function of the files under `data/`,
  so computing it per request would be work with no corresponding benefit.
- `.claude/rules/platform/cloudflare.md` says not to add the adapter when the project is purely
  static, and adding one moves the build output from `dist/` to `dist/client/`, which breaks the
  asset paths for no gain.

### Alternatives considered

- **Server rendering on Cloudflare Workers**: rejected. It would add a runtime to secure, a cold
  start to pay, and per-request work to cache, to produce pages that are identical for every
  visitor. It becomes worth revisiting only if a feature genuinely needs the request, such as
  authenticated content.

---

## Decision 2: Selection is a link and a fragment, not client state

### Decision

- A skill tree node is an `<a>` to `/{locale}/arbre/{tree}/{node}`. The highlighted state is
  rendered by the server.
- A browse entry is an `<a href="#e-{id}">`. Every detail panel is rendered, and CSS shows the
  targeted one, with `[data-details]:not(:has(:target)) [data-detail]:first-child` showing the first
  when nothing is targeted, in `src/components/views/Browse.astro`.
- The book page list and the previous and next pager are ordinary links.
- Tooltips are CSS, `[data-term]:hover > [data-tip]`, with one small script that only repositions
  them against the viewport.

### Rationale

- Each of these is genuinely a location, not a mode. Treating them as links makes them shareable,
  crawlable, and usable with the keyboard and the back button without writing any of that behaviour.
- It removes the need to send the corpus to the browser. The alternative, a hydrated list of 205
  skills with their descriptions, is a payload measured in hundreds of kilobytes on a page whose job
  is to be read.
- The no-JavaScript Playwright project proves it rather than assuming it: every route renders, the
  plate draws its 14 nodes, and a browse page shows its list and a detail, with scripting disabled.

### Caveats

- `:has()` is required for the fallback that shows the first detail when nothing is targeted. In a
  browser without it, a browse page opens with no detail panel until the reader picks an entry. The
  list itself, and every entry, still work.
- Without JavaScript the row highlight does not follow the fragment, because that would need a rule
  per entry. The detail panel does change, which is the part that carries the content.

### Addendum (2026-09-21): Swup suppresses the fragment, so the script owns selection above the floor

The decision above held for a document request and stopped holding the moment Swup was enabled.
Swup's link handler matches its default `linkSelector: 'a[href]'`, so it caught `#e-{id}` too. It
calls `event.preventDefault()` unconditionally and then updates the address bar with
`history.replaceState`, which never moves the document's indicated part. `:target` therefore matched
nothing, every row click did nothing at all, and the first detail stayed on screen through the
`:not(:has(:target))` fallback, which is why the page still looked correct. Cross page deep links
from the search results and from a skill's provenance were dead for the same reason, since a Swup
navigation arrives by `pushState`.

The mechanism is now layered, and the layers are mutually exclusive by an authored
`data-selection` attribute on the browse root rather than by specificity:

- `data-selection="static"` ships in the HTML and keeps the original `:target` rules. That is what a
  reader without JavaScript gets, and `data-no-swup` on the row list makes Swup ignore these links
  so the native fragment navigation survives even when the script does not load.
- `src/scripts/browse.ts` flips it to `"enhanced"` and drives `[data-current]` and `aria-current`
  itself, bound once through `shell.ts` next to `bindBook`.

Consequences worth naming:

- The mutual exclusion is not decoration. After a selection, `:target` still points at whichever
  entry was last navigated to, so without the flag two details would show at once.
- The caveat above about the row highlight now applies only without JavaScript. With it, the
  selected row is marked, which is what a 205 row list needed.
- Selection uses `replaceState`, so the URL stays shareable and survives reload but the back button
  leaves the page instead of unwinding each selection. That is a deliberate departure from the
  rationale above: one history entry per click turns Back into a trap on a list this long. Swup
  makes the same choice at the same point.
- The script owns `hashchange`, because disabling `:target` also disabled the browser's own response
  to a fragment typed or pasted into the address bar.
- Any future link placed inside the row list will be a full document request, since `data-no-swup`
  covers the whole `<ul>`.

### Addendum (2026-09-23): the browse markup is a shared component

The rows, the details panel and the `data-selection` attribute this decision describes left
`src/components/views/Browse.astro` for `src/components/primitives/BrowseList.astro`, which the
Almanach views and the species page both render (0019 Decision 3). The markup moved byte for byte,
so the `:target` floor, the `data-no-swup` row list and the script above it behave as written here.
The file named in the rationale and in the summary table is now `BrowseList.astro`.

### Addendum (2026-09-26): a tree node page carries its skill, and a selection swaps only the pane

The first bullet above still holds as written. A skill tree node is an `<a>` to
`/{locale}/arbre/{tree}/{node}`, now with `#arbre` so a document load lands on the tree section, and
the server renders the highlight. What changed is what that page shows. It no longer lists every
skill of the tree under the plate: it shows the selected skill in a detail pane beside the plate, and
the bare tree route shows an empty state there. With JavaScript, `src/scripts/tree.ts` narrows a
visit between two nodes of one tree to that pane and the footer, with no animation, no scroll and a
replaced history entry. The fragment and `:target` mechanism above was not reused for trees, because
the node pages are published, linked and indexed. 0025 Decision 2 records why.

---

## Decision 3: Exactly one island

### Decision

- `src/islands/FilterBar.tsx` is the only React component that reaches the browser, mounted
  `client:idle`. It is the only `client:` directive in `src/`.
- It owns the name filter, the facet modal with its live counts, and the tree kind selector, and it
  animates the modal with Motion.
- It ships no data. It reads the entries from the DOM through `data-entry` and `data-facet-*`
  attributes that the server already rendered, and filters by toggling `hidden`.
- A tree page ships two script files, and the whole site's JavaScript is 428KB before compression
  across all of `dist/_astro`.

### Rationale

- Faceted filtering with counts that update as you narrow is real client state with no URL to
  express it, so it is the one thing on the site that earns a framework.
- Reading the facets from the DOM rather than receiving them as props means adding a filterable
  view costs attributes in markup, not a serialised payload. The island never needs to know what a
  skill is.
- `client:idle` keeps it off the critical path. The list is already rendered and readable before the
  island exists.

### Alternatives considered

- **Hydrate the whole browse view as a React component**: rejected. Astro would render it server
  side so the HTML would be fine, but the hydration payload would carry every row and every detail.
- **Write the filter in vanilla TypeScript like the shell script**: reasonable, and rejected only
  because the facet modal is a focus-trapped dialog with enter and exit animation, which is exactly
  what Motion and React are good at. The shell script handles the menus and the theme, which are
  simpler, so the boundary is drawn at animated stateful UI.

### Addendum (2026-09-26): the island dims a tree's nodes and no longer renders the empty state

The island is still the only one, and it still reads its entries from the DOM. Two things changed.

- It takes `unmatched: 'hidden' | 'dimmed'`. A skill tree filters its nodes in dimmed mode, which
  sets `data-dimmed` instead of toggling `hidden`, so the drawing stays whole.
- The empty state it used to render as inline JSX is now
  `src/components/primitives/EmptyState.astro`, which `FilterBar.astro` renders on the server. The
  island only toggles its `hidden` and wires its reset button.

Tree pages now load the island too. 0025 Decision 4 records both changes.

---

## Decision 4: Immutable assets, revalidated HTML

### Decision

- `public/_headers` gives `/_astro/*`, `/fonts/*`, `/icons/*`, `/flags/*` and `/video/*`
  `max-age=31536000, immutable`.
- HTML gets `max-age=0, s-maxage=86400, stale-while-revalidate=604800`, so the edge serves it and
  the browser revalidates.
- PDFs sit between the two, at a week with revalidation.
- The same file carries the security headers, including a content security policy that allows only
  same origin scripts, styles, fonts and media.

### Rationale

- Build assets are content addressed by Astro, so their URL changes when their bytes change. That is
  the precondition for immutable, and it makes a year safe.
- HTML is the mutable part and must never be marked immutable, which is what
  `.claude/rules/platform/caching.md` requires. Putting the caching at the edge rather than in the
  browser means a content change is visible immediately after a deploy.
- Fonts are self hosted, so `font-src 'self'` holds and there is no third party origin to allow.

### Caveats

- `style-src` needs `'unsafe-inline'`, because the views carry inline styles ported from the
  original design export. That weakens the policy against style injection specifically. It is
  accepted because the site renders no untrusted HTML: every string comes from the repository's own
  data files.

### Addendum (2026-09-25): the policy admits the build's own inline scripts

`script-src 'self'` blocked two inline scripts the build emits: the theme bootstrap in `Base.astro`
and Astro's island runtime. On aubaine.io the saved theme was never restored and the island in
Decision 3 never hydrated. 0022 has the build append a SHA-256 source for each of its own inline
scripts to `script-src` in `dist/_headers`, while `public/_headers` keeps the authored policy.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Output | Fully prerendered, no adapter | `astro.config.mjs` |
| Deployment | Cloudflare static assets, real 404 | `wrangler.jsonc` |
| Selection | Links, CSS `:target` as the floor, a delegated script above it | `src/components/views/Browse.astro`, `src/scripts/browse.ts` |
| Island | Filtering and the facet modal, DOM driven | `src/islands/FilterBar.tsx` |
| No-JavaScript proof | Every route, the plate, a browse detail | `tests/e2e/no-javascript.spec.ts` |
| Cache and security | Immutable assets, revalidated HTML, CSP | `public/_headers` |
