# ADR: Swup owns client navigation, and the shell swaps as three containers

**Project:** Aubaine, the wiki
**Status:** Superseded by 0012-the-header-outlives-the-page
**Date:** 2026-09-20
**Deciders:** Kori
**Scope:** How moving between pages works once JavaScript is available, which parts of the document
are replaced, and how the browser behaviour attached to a page survives that replacement. Does not
cover what a page contains (0006) or its address (0005).

---

## Context

The site is fully prerendered, so every navigation is a document request by default. That is
correct and it is the floor, but it also throws away the header, the fonts, the stylesheet and the
scroll position on every click through a reference work that people read by following links.

Swup replaces the changing part of the document instead. The decisions it forces are which part is
changing, what happens to the head, and what happens to the behaviour that was attached to the DOM
that just got replaced.

---

## Decision 1: The official integration, one instance

### Decision

- `@swup/astro` in `astro.config.mjs`, with `globalInstance: true`.
- No second page transition system. The `au-*` CSS keyframes animate content within a page; Swup
  animates the swap; Motion animates inside the island. None of them animates the same thing.
- `@swup/head-plugin` was removed as a direct dependency once it was confirmed the integration
  bundles it behind `updateHead`.

### Rationale

- `.claude/rules/frontend/swup.md` requires the official integration unless a verified limitation
  prevents it, and requires exactly one application level instance.
- The integration already carries the head, accessibility, preload and cache plugins, so adding any
  of them directly would be a duplicate dependency.

---

## Decision 2: Three swap containers, not one

### Decision

- `containers: ['#site-header', '#swup', '#site-footer']`.
- `#site-header` is the `<header>` in `src/components/shell/Header.astro`, `#swup` wraps the page
  content inside `<main>` in `src/layouts/Base.astro`, and `#site-footer` is the `<footer>`.

### Rationale

- The header carries per-page state that is rendered by the server: which nav item is underlined,
  which language the flag shows, and where the language link points. The footer is hidden on the
  home page and shown everywhere else. Swapping only the content would leave all of that stale.
- Rebuilding that state in the browser after each navigation would mean the header is described
  twice, once by Astro and once by a script, which is the drift
  `.claude/rules/core/engineering.md` warns about. Swapping the server rendered markup keeps one
  description.
- The cost is that anything inside those containers is recreated on navigation. The only island is
  in the content area, and the header's behaviour is delegated rather than bound, so nothing is
  lost.

### Caveats

- The page must not put long lived state inside a swap container. The theme is on `<html>`
  specifically for this reason, which is what makes it survive.

---

## Decision 3: The head is the integration's job, and the theme is not in it

### Decision

- `updateHead: true`, so the title, canonical link, `hreflang` alternates, Open Graph tags and the
  JSON-LD block are replaced from the incoming document.
- `accessibility: true`, so the new page is announced and focus is placed usefully.
- The theme lives as `data-theme` on `<html>`, set before first paint by a small inline script in
  the head, and persisted to `localStorage`.
- `ignore` excludes `.pdf` and `.mp4`, so a booklet download is a real download.
- `preload: { hover: true, visible: false }`, so hovering a link prefetches it but a grid of fifteen
  tree posters does not fetch fifteen pages.

### Rationale

- `.claude/rules/discovery/seo.md` requires metadata to be correct after Swup navigation, not only
  on the initial response. Verified in `tests/e2e/navigation.spec.ts`, which navigates from the
  trees grid to a tree and asserts the title, the canonical URL, the document language and the
  French alternate.
- `<html>` is outside every container, so the theme attribute is never replaced and never flashes.
  The alternative, restoring it on each swap, would repaint after the new content is already
  visible.
- Viewport preloading on a page of fifteen posters would fetch the whole index to save one click.

---

## Decision 4: One delegated script, re-armed on `page:view`

### Decision

- `src/scripts/shell.ts` is the only shell behaviour. It binds its listeners once, on `document`,
  using delegation, so they survive a container being replaced.
- It attaches to Swup on `swup:enable` and re-runs the per-page work on `page:view`: repainting the
  theme button, re-measuring the header into `--sticky-top` and `--sticky-max`, starting the hero
  video, and syncing the search input from the query string.
- On `content:replace` it clears the pending search timer and disconnects the header
  `ResizeObserver`.
- Swup is reached through a guarded accessor rather than a global type declaration, because the
  instance is not present when the module first runs.

### Rationale

- Delegation is what makes a swapped header keep working without re-binding. Binding directly to
  header elements would break silently on the first navigation, which is exactly the class of bug
  `.claude/rules/frontend/swup.md` warns about.
- The `ResizeObserver` is the one thing that genuinely holds a reference into a swapped container,
  so it is the one thing explicitly torn down.
- The guarded accessor was not defensive programming for its own sake. The unguarded version threw
  `Cannot read properties of undefined (reading 'on')` in the browser console on first load,
  because the module runs before the integration has assigned the global.

### Caveats

- Delegated listeners on `document` mean the shell's behaviour is not discoverable from the markup
  it acts on. The `data-*` attribute names are the contract between the two, and they are the thing
  to grep for.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Integration | One instance, official, bundles the head plugin | `astro.config.mjs` |
| Containers | Header, content, footer, so server state stays correct | `Base.astro`, `Header.astro`, `Footer.astro` |
| Head | Replaced by the integration, asserted in e2e | `tests/e2e/navigation.spec.ts` |
| Theme | On `<html>`, outside every container | `src/layouts/Base.astro` |
| Shell behaviour | Delegated once, re-armed on `page:view` | `src/scripts/shell.ts` |
