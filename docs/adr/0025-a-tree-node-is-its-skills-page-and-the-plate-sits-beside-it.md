# ADR: A tree node is its skill's page, and the plate sits beside it

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-26
**Deciders:** Kori
**Scope:** The order and layout of the skill tree page, how a node is selected with and without
JavaScript, the web variant of the plate, how a tree is filtered, and the empty state every filtered
list shares. Extends 0006 Decisions 2 and 3, 0012 Decision 1 (per-visit containers) and 0018
Decision 2 (the reading grid on the tree page). Does not cover the tree's data (0002), its pictures
(0009), or the booklet beyond keeping its printed sheet unchanged (0013).

---

## Context

`src/components/views/Tree.astro` rendered the hero, then the whole A4 print sheet, then the lore,
then a two column grid of every skill card. The sheet is `src/components/primitives/Plate.astro`, the
same component `src/pages/print/[...booklet].astro` prints, header and footer included. The decider
asked for the lore first, then the tree with a detail pane beside it, like the Almanach skill index.
The request also covered an empty state when nothing is selected, filters with a disabled node
state, visible feedback on the selected node, and a rail entry « Arbre de compétences ».

Two facts constrained the answer. Every node already has a prerendered, indexable page:
`pageRoutes` in `src/lib/game/pages.ts` emits one per placement, titled « <skill> · <tree> » and
described by the skill. The search results (`src/components/views/Search.astro`), the provenance
(`src/lib/game/browse-entries.ts`) and the term index (`src/lib/game/build.ts`) link to those pages.
And any change to the plate reaches print.

---

## Decision 1: The page reads the lore first and ends on the tree

### Decision

- The order is:
  - the hero;
  - the reading block, which is the lore with its rail (0018);
  - a `<section>` headed « Arbre de compétences » (`t.plate`) whose heading carries `id="arbre"`
    (`TREE_ANCHOR` in `src/lib/i18n/routes.ts`), holding the filter bar, the plate and the detail
    pane.
- The rail is the lore's `##` headings, then « Arbre de compétences » pointing at `#arbre`. As before,
  it shows only when the tree has lore and the rail has more than one entry.
- The card grid under the plate goes. So do its `.au-skill-list` and `.au-skill-card` rules in
  `src/styles/entries.css`, and the `#skills` anchor. `treeSkillOrder` stays, because the booklet
  still lists its skills with it.

### Rationale

- The decider set this order, and the rail entry is what lets a reader skip the lore.
- The pane carries each skill, so a grid repeating every one of them would print each skill twice on
  one page.
- Measured with `du` on the build: `dist/fr/arbre/berserker/index.html` fell from 224K to 64K, and
  the node page `dist/fr/arbre/berserker/RAGER-01/index.html` from 224K to 108K.

### Alternatives considered

- **Keep the grid below the tree**: offered and declined by the decider, because every skill would
  appear twice.
- **Keep the grid between the lore and the tree**: offered and declined by the decider.

### Caveats

- The bare tree page no longer carries any skill's rule text. That text now lives on each node page
  and in the booklet.
- The Almanach skill index has no per-tree facet, so reading every skill of one tree in a single
  scroll is now the booklet's job.

---

## Decision 2: A node stays its skill's page, and Swup swaps only the pane

### Decision

- A node links to `treeNodeHref(locale, tree, node)`, which is
  `/{locale}/arbre/{tree}/{node}#arbre`. `src/lib/game/pages.ts` is unchanged, so every node keeps
  its title, its description and its canonical URL. The four link sources above use the same helper.
- A node page renders the skill in `#tree-detail`:
  - `SkillEntry`, then `Provenance` labelled « Également disponible »;
  - the provenance lists every source except the tree itself, through
    `skillSources(skill, corpus, locale, { kind: 'tree', id })`;
  - the server marks the node `aria-current="page"` and marks `data-lit` on the lines that touch it.
- The bare tree route renders the empty state in the pane, « Rien à afficher pour l'instant. » over
  « Choisissez une Compétence dans l'arbre pour l'afficher ici. ».
- `bindTree` in `src/scripts/tree.ts` acts when `treeRef` names the same tree for `visit.from` and
  `visit.to`:
  - containers: `['#site-footer', '#tree-detail']`;
  - no animation, and `scroll.reset = false`;
  - `scroll.target` is `false`, or the pane when the pane is stacked below the tree;
  - `history.action = 'replace'`, except on popstate;
  - focus goes to the pane, and the announcement is the skill's title.
  - On `content:replace`, it moves `aria-current` and `data-lit` to the pane's `data-selected-node`.
- Below `48rem` the board is a horizontal pan container. The same script centres it on the selected
  node on every `page:view`.

### Rationale

- It keeps the original sentence of 0006 Decision 2 true: a node is an `<a>` to its page, and the
  server renders the highlight. `tests/e2e/no-javascript.spec.ts` proves it in "a bare skill tree asks
  for a skill and a node link opens it on its tree".
- The node pages are published and linked from four places. `.claude/rules/architecture/routing.md`
  treats a published URL as durable.
- Swup's head update replaces the title, the canonical URL and the alternates, and
  `syncLanguageLinks` in `src/scripts/shell.ts` mirrors them into the language switch.
  `tests/e2e/tree.spec.ts` asserts all four after a selection. A node page now carries its own skill
  instead of an identical copy of the whole tree, which is the near-duplicate case
  `.claude/rules/discovery/seo.md` warns about.
- Per-visit containers are the mechanism 0012 Decision 1 already records for `src/scripts/book.ts`.
  Both Swup plugins involved were verified in their `dist`:
  - `@swup/scroll-plugin@3.3.2` resolves `scroll.target ?? to.hash`, and does nothing further when
    `reset` is false. So a selection leaves the page where it was, which `tree.spec.ts` checks
    against `scrollY`.
  - `@swup/a11y-plugin@5.2.1` focuses with `preventScroll`.
- The plate and the filter island sit outside the swapped container. They stay mounted, so a
  selection keeps the filters, as `tree.spec.ts` asserts.
- `replace` makes Back leave the tree, the same trade the Almanach made in 0006.
- `#arbre` is what lands a document load, with or without JavaScript, on the section rather than on
  the hero.

### Alternatives considered

- **The Almanach's fragment selection, `#e-<id>` through `src/scripts/browse.ts`**: instant, and
  already written.
  - Rejected while node pages exist. On a node page, the address would read
    `/RAGER-01#e-TOURB-01` under Rage's title and canonical URL.
  - Retiring the node pages would break published URLs, and redirecting them would need a fragment
    to survive the redirect.
  - Reopens if the node pages are ever retired.
- **A script that rewrites the path itself with `replaceState`**: rejected because the title, the
  canonical URL, the alternates and the language switch would stay on the previous node. It would
  also be a second system navigating between pages, which `.claude/rules/frontend/swup.md` forbids.
- **An ordinary Swup visit with the default containers**: rejected because it replays the hero,
  remounts the island, loses the filters and scrolls to the fragment.

### Caveats

- A selection is a fetch.
  - Hover preload serves it from cache with a pointer, but a touch device waits for the network.
  - A visit slower than 400ms shows the content region crest of 0012 Decision 3 over the whole page,
    not only the pane.
- Activating the node that is already selected is a same-page anchor link, so Swup scrolls to
  `#arbre`.
- The highlight is computed twice: in `Plate.astro` for a document, and in `tree.ts` for a swap.
  `data-ends`, `data-node` and `data-selected-node` are their contract.

---

## Decision 3: The web draws the board, print keeps the sheet

### Decision

- `Plate.astro` takes `variant: 'sheet'` or `variant: 'board'`.
  - The sheet is print. It absorbs the former `folio` prop and renders exactly what it did before.
  - The board is the web, and takes `selected`.
- `PlateLegend.astro` is the one legend.
  - The sheet renders it inside the page, at the bottom, as print always has.
  - The tree page renders it above the board, at page type size, so a reader meets the key before
    the tree.
- The board changes these things, all scoped to `.au-sheet--board` in `src/styles/plate.css`:
  - It drops the print header, the footer and the legend band.
  - It drops the `--paper-tex` gradient, and sits on flat `--paper` in both themes.
  - It is `role="group"`, labelled `t.plateLabel`.
  - Its nodes are links carrying the facet attributes.
  - Its window is computed in frontmatter: the outer orbit whole, in both directions, united with
    every node's reach. The plate is offset inside it, and `overflow: visible` lets the rings draw
    past the 960 wide page.
  - Its labels are 14px titles and 12px XP in plate units. A long title wraps onto centred lines
    inside a 130 unit pill instead of running on one line.
  - Its rings are drawn at 16 percent opacity and 1.2 units wide, and its lines at 85 percent. A
    ring stays a backdrop, and a line reads as a connection.
- A placement without `pos` is listed under the board as a link, under « Pas encore sur la
  planche », as its schema description promises.
- Layout:
  - from `76rem`, the tree and the pane each take exactly half the width, as on the Almanach index;
  - the pane stretches to the tree's height, capped by `--sticky-max`;
  - stacked below `76rem`;
  - below `48rem` the board is `min(72svh, 36rem)` tall, and the viewer of Decision 6 opens it at a
    legible scale. The legend stays outside the board.

### Rationale

- The decider chose the board, then asked for these changes, in these words:
  - half tree, half information, like the Almanach;
  - rings that are never cut, because the cut outer ring read as a bug;
  - the legend on top, because this is a web page and not a book;
  - no gradients.
- The page already has its own `h1` and its own footer.
- The labels were sized by measurement, not taste. At a half-width board the print tokens render
  7px. The other constraint is nameplate collisions, measured on every tree in Chromium;
  `tests/e2e/tree.spec.ts` asserts that the chosen size stays at zero:

  | Title token | Pill | Collisions across the 24 trees |
  | ----------- | ---- | ------------------------------ |
  | 11px (print) | one line | 1 (`DRUID-01` and `DRUID-02`, also in the booklet) |
  | 18px | one line | 9 |
  | 22px | one line | 36 |
  | 14px to 22px | wraps inside 130 units | 0 |

- The decider asked twice for smaller titles, from 20px to 16px and then to 14px. They also asked for
  rings dimmer than the lines, because both wore the same gold and the tree read as one tangle.
  Rendered sizes of the chosen 14px label, measured in Chromium:

  | Viewport | Board | Pane | Rendered title |
  | -------- | ----- | ---- | -------------- |
  | 1920 | 737 | 737 | 10.0px |
  | 1440 | 677 | 677 | 9.2px |
  | 1280 | 597 | 597 | 8.1px |
  | 1024, stacked | 972 | 972 | 13.2px |
  | 390, opened by the viewer | 338 | 338 | 11.2px |

  The old page gave 3.9px on a phone.
- Every ring renders inside the board at every viewport above, for all 24 trees. The largest orbit
  lands within 1px of its computed position, and that 1px is the sheet's border. That confirms
  `zoom` scales the plate's own `top` and `left`.
- Nothing is clipped or collides. `tree.spec.ts` asserts that no ring, node shape or nameplate
  crosses the board's edge and that no two labels overlap, on every tree.
- The print sheet is unchanged. The `.au-sheet` markup extracted from `AUBAINE_PRINT=1` builds before
  and after the change is byte-identical for all 48 tree and locale pairs, the extracted legend
  included.
- WCAG 1.4.10 exempts content that needs a two dimensional layout, which a tree diagram does. The
  page itself never scrolls sideways: the measured overflow is 0 at every viewport above.

### Alternatives considered

- **The full A4 sheet**: declined by the decider. It is 1.41 times taller than it is wide, and its
  header repeats the page's `h1`.
- **A separate web component for the plate**: rejected because two renderers of one plate would
  drift. The union keeps one source for positions and lines, and `PlateLegend` one source for the
  key.
- **A board wider than the pane**, which the first version of this record shipped (a 440px pane):
  reversed by the decider in favour of equal halves.
- **Clip the outer ring at the page edge, as the booklet does**: on paper the ring bleeds off the
  page, but inside a bordered board it read as a defect. Showing it whole costs the board about 7
  percent of its scale.
- **Larger single-line labels**: rejected on the collision counts above.

### Caveats

- The whole-ring window leaves empty paper where a tree has no nodes near its outer ring, as Druide
  shows below its lowest branch.
- `DRUID-01` and `DRUID-02` still collide in the booklet, where the sheet is unchanged. A `pos` change
  in `data/skill-trees/druide.json` would fix the print too, and is not made here.
- `src/lib/booklet/fingerprint.ts` hashes every primitive into the style hash, so `pnpm pdf:check`
  now reports every booklet stale although their sheets are unchanged. Regenerating is a separate
  release step.
- The labels and the window were first measured in Chromium only, which is the only browser
  `playwright.config.ts` runs. That is how the `zoom` defect of Decision 6 reached the owner's
  Firefox.

---

## Decision 4: Filters dim a tree's nodes, and the empty state is one server component

### Decision

- `FilterBar.astro` gains a `treeNodes` variant.
  - Its groups are `SKILL_FACETS`: domain, type, cost, activation, characteristic, level and the
    three tag slots.
  - It has no provenance and no status group, so no node carries `data-facet-sta` and the drafts
    rule in `src/styles/base.css` cannot hide one.
  - It renders only when a tree has two placements or more.
- `src/islands/FilterBar.tsx` takes `unmatched: 'hidden' | 'dimmed'`.
  - In dimmed mode, an entry that does not match gets `data-dimmed` rather than `hidden`.
  - A dimmed node stays a link and stays focusable, as the decider chose.
  - `:root[data-filtering]` fades every line that is not lit.
- `src/components/primitives/EmptyState.astro` is the one empty state: a 46 by 52 hexagon, a 1px
  `--line2` rule, the title, the body, and an optional slot for actions.
  - `FilterBar.astro` renders two of them, hidden: `data-filter-empty="unpublished"`, and
    `data-filter-empty="filtered"` with a `data-filter-reset` button.
  - The island toggles their `hidden` and wires the reset, then returns focus to the name filter.
  - Its four empty-state strings leave its props.
  - A list's empty state is centred in both axes, in a region of `min(56vh, 34rem)` under the
    filters. In the tree's pane it is centred in the pane, which is as tall as the tree.
- `DetailPane.astro` and `Provenance.astro` are extracted from `BrowseList.astro`, so the tree's pane
  is the Almanach's.

### Rationale

- Hiding a node would leave a line drawn to nowhere. Dimming keeps the drawing whole, which is the
  disabled node state the decider asked for.
- 0006 Decision 3 still holds. There is one island, it reads `[data-entry]` from the DOM, and the
  tree costs attributes rather than payload.
- The empty state was inline JSX that only React rendered, so the pane had nothing to reuse. It is
  now one component.

### Alternatives considered

- **Truly disabled nodes**, skipped by the keyboard until the filter clears: offered and declined by
  the decider.
- **Keep the empty state in the island and copy its markup into an Astro component**: rejected,
  because two markups for one component drift.
- **Pass the empty state to the island as a slot**: rejected, because slot content is static HTML
  inside React, and the reset button needs the island's handler either way.

### Caveats

- Every page that renders the filter bar now ships both empty states as hidden markup.
- Tree pages now load the island, `client:idle`, as species pages have since 0019.

---

## Decision 5: Choosing a node moves, and the bare tree shows once that its nodes are links

### Decision

- The halo on `::before` scales in from 72 percent and fades in over 0.4s. It leaves the same way
  when the selection moves. A one-shot ripple on `::after` spreads from the chosen node. The
  halo is a circle, or a rounded square for square and concave shapes.
- The lines that touch the chosen node draw outward from it in gold. Each board line carries
  `pathLength="1"`, and `data-lit="start"` or `"end"` names which end the node is, so the dash
  animates from that end.
- A node lifts its nameplate 3px and turns its border gold on hover and on keyboard focus.
- `src/scripts/tree.ts` marks the clicked node at `visit:start`, before the fetch returns, so the
  halo and the lines move during the wait. It dims the outgoing pane to 35 percent until the swap,
  and the incoming skill rises in over 0.32s. The pane's entrance fill is `backwards`, so the dim
  can apply to it again.
- On a bare tree, when a quarter of the board first scrolls into view, each node sends out two
  pulses. They are staggered by distance from the centre and stop for good. Hovering or focusing
  a node ends them early. The observer is disconnected on every content replace.

### Rationale

- The decider asked for transitions on selection and for a pulse hinting which nodes to press.
- Marking at `visit:start` follows the decider's standing instruction for motion on this site:
  animate over a real wait, never add one. With the hover preload the wait is usually nothing, and
  on a touch device the halo answers the tap before the pane arrives.
- The pulse stops. Measured in Chromium, it runs 4.7s from the board entering the view, under the
  five seconds after which WCAG 2.2.2 requires a way to pause moving content.
- `prefers-reduced-motion` reduces every animation and transition to an instant through the rule
  in `src/styles/base.css`. Measured with the preference set, no node shows a pulse ring.
- The halo sits on `::before` because `.au-node__shape--concave` clips its own box shadow with
  `clip-path`. Its contrast against `--paper`, measured in the browser, is 11.30:1 in the dark theme
  and 3.08:1 in the light one.

### Alternatives considered

- **A pulse that never stops**: rejected by WCAG 2.2.2, and because a tree that moves forever
  competes with the reading it is there to serve.
- **Animate only after the new pane arrives**: rejected because on a slow connection the tap would
  appear to do nothing until the fetch returned.

### Caveats

- The light theme halo clears the 3:1 of SC 1.4.11 by a small margin. It never carries the state
  alone, because the nameplate border and the lit lines change with it.
- The optimistic mark trusts the click. If a visit fails, Swup falls back to a document load, which
  renders the right selection from the server.

---

## Decision 6: The board is a viewer that opens fitted and zooms on demand

### Decision

- The board no longer scales with `zoom`. `.au-plate` carries
  `transform: translate(--view-x, --view-y) scale(--view-scale)`, and
  `src/scripts/plate-viewer.ts` writes those three properties as plain numbers.
- It opens fitted: the whole window, centred. Where the fit falls under a scale of 0.5, as on a
  phone, it opens at 0.8 instead, centred on the heart of the tree (the core, or the centre node),
  or on the selected node.
- Controls:
  - buttons to zoom in, zoom out and show the whole tree, in the board's corner;
  - control or command with the wheel, which is also a trackpad pinch;
  - a drag with a mouse, or one finger on a touch screen, once zoomed;
  - a pinch with two fingers;
  - the keys `+`, `-` and `0` while focus is in the board.
- Behaviour:
  - Focusing a node that is off the view brings it into view.
  - A drag never counts as a click on a node.
  - The view cannot leave the window, and cannot zoom below the fit or beyond three times it.
- Without JavaScript the three properties keep their CSS defaults, which compute the fit with
  `calc(100cqw / (var(--board-width) * 1px))`. In an engine that cannot divide a length by a length,
  `@media (scripting: none)` with `@supports not (scale: calc(1px / 1px))` turns the board into a
  scroll box instead. The buttons stay `hidden`, because nothing would drive them.

### Rationale

- The owner saw half the tree cut off in Firefox. `zoom: calc(100cqw / 960px)`, which the plate has
  always used, divides a length by a length, which Firefox does not support.
  - With the Playwright engines, only 6 of the 12 Courtisan nameplates sat inside the board in
    Firefox, against 12 in Chromium and in WebKit.
  - Firefox also rendered the titles at 44px against 28.8px.
  - The old page had the same defect, hidden because its plate was drawn near its natural size.
- The owner asked for a fit, a zoomable viewer centred on the heart of the tree, or both. The fit is
  what a reader sees first, and the viewer is there for detail and for phones.
- Measured in Chromium, Firefox and WebKit after the change:
  - the board opens with all 12 nameplates inside at 1440;
  - it opens centred on the heart at 11.2px on a phone;
  - each control, the drag, the wheel and the keys move the view;
  - a drag does not navigate;
  - a click on a node navigates at every zoom and keeps the zoom.
- Firefox and Chromium started their native link drag on a node and cancelled the pointer stream.
  The viewer prevents `dragstart` inside the board.
- A plain wheel still scrolls the page, as a reference page must. Only the control key zooms,
  following the convention of embedded maps.

### Alternatives considered

- **Express every plate length in container units**, so no scale factor is ever computed: it would
  work without JavaScript in every engine. Rejected because it rewrites every rule the booklet
  prints with, which Decision 3 keeps byte-identical. Reopens if the booklet's stylesheet is ever
  reworked on its own.
- **An SVG `foreignObject` that scales the HTML plate**: not tried, because the absolutely
  positioned nodes inside it are the case WebKit has long mispositioned. Unverified here.
- **Hijack the plain wheel to zoom**: rejected because the board fills half the screen, and a reader
  scrolling past it would be trapped in it.

### Caveats

- Firefox without JavaScript sees the plate at its natural size in a scroll box, not fitted.
- `playwright.config.ts` still runs Chromium only, so `pnpm test:e2e` would not catch a Firefox
  regression. The three engine check above was run by hand.
- A pinch that begins while the board is fitted can be taken by the browser as a page scroll, since
  the board allows vertical panning until it is zoomed.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Order and rail | Lore first, then « Arbre de compétences » at `#arbre` | `src/components/views/Tree.astro` |
| Node pages | One per placement, its skill in the pane | `src/lib/game/pages.ts`, `Tree.astro` |
| Node links | `/{locale}/arbre/{tree}/{node}#arbre` | `treeNodeHref` in `src/lib/i18n/routes.ts` |
| Pane swap | Same tree, `#tree-detail` only, replace, focus the pane | `src/scripts/tree.ts` |
| Plate | `sheet` for print, byte-identical; `board` for the web, rings whole | `Plate.astro`, `src/styles/plate.css` |
| Legend | One component, inside the sheet, above the board | `PlateLegend.astro` |
| Motion | Halo, ripple, drawn lines, dimmed pane, a pulse that stops | `src/styles/plate.css`, `src/scripts/tree.ts` |
| Viewer | Fit, zoom, pan, pinch, keys, focus into view, in every engine | `src/scripts/plate-viewer.ts` |
| Filters | `treeNodes` dims through `unmatched` | `FilterBar.astro`, `src/islands/FilterBar.tsx` |
| Empty state | One server component the island toggles | `EmptyState.astro` |
| Proof | Order, halves, legend, pulse, swap, history, locale, filters, phone, rings and labels on 24 trees | `tests/e2e/tree.spec.ts` |
