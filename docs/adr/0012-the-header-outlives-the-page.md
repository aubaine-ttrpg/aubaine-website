# ADR: The header outlives the page, and the swap finally animates

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-22
**Deciders:** Kori
**Scope:** Which parts of the shell Swup replaces, how the header's per-page state reaches it once it
is no longer replaced, and what motion a navigation shows. Supersedes 0007, whose Decision 2 this
reverses; its other three decisions are restated here unchanged. Does not cover what a page contains
(0006) or its address (0005).

---

## Context

The design this site is a port of (`tmp/aubaine-website-design/Aubaine Wiki.dc.html`) is a
single-page app. Its navbar underline is one permanently mounted `<span>` per nav item, transitioning
`transform: scaleX()` from `transform-origin: left` over `.3s cubic-bezier(.16,1,.3,1)`, so clicking a
nav item collapses the outgoing bar leftward while the incoming one grows.

The port kept that markup and lost the effect. 0007 Decision 2 made `#site-header` a swap container,
so every navigation destroyed and rebuilt it and the incoming bar arrived at its final `scaleX` with
no previous value to transition from. A CSS transition needs a node that survives the change.

Two further gaps were found at the same time. `animationClass: 'au-swup-'` in `astro.config.mjs`
resolves to `animationSelector: '[class*="au-swup-"]'`, and no CSS in the repository ever matched it:
`awaitAnimations.ts` in `swup@4.10.0` warns and returns early, so every swap was instant and the
console carried `[swup] No elements found matching animationSelector` twice per visit. And the site
had no affordance at all for a navigation that outruns the hover preload.

---

## Decision 1: The header leaves the container list, except across locales

### Decision

- `containers: ['#swup', '#site-footer']` in `astro.config.mjs`.
- `'#site-header'` is pushed back onto `visit.containers` in a `visit:start` hook, and only when the
  first path segment of `visit.from.url` and `visit.to.url` differ.
- `CHAPTER_CONTAINERS` in `src/scripts/book.ts` drops `'#site-header'` for the same reason: a chapter
  switch never crosses locales.

### Rationale

- Everything in the header except the underlined item and the language hrefs is locale constant: the
  labels, the flag, the search action and the menu contents all come from `strings(locale)` and
  `pathFor(kind, locale)` in `src/components/shell/Header.astro`. A locale change is therefore the
  only visit that genuinely needs new header markup.
- Per-visit containers are not a new mechanism here. `src/scripts/book.ts:31` already assigns
  `visit.containers` for a same-book chapter switch, and `swup@4.10.0` reads the visit's list at
  replace time, not the option, verified in its `replaceContent` module.
- Keeping the node alive is what makes the transition possible at all. Measured in a browser 90ms
  after a navbar click, the outgoing bar sits at `scaleX(0.90)` and the incoming one at
  `scaleX(0.097)`: both moving at once, which is the design's behaviour.
- It also repairs a defect that the old arrangement hid. `@swup/a11y-plugin@5.2.1` sets
  `visit.a11y.focus = { selector: 'body', wait: true }` on every visit, verified in its `dist`, so the
  debounced search navigation moved focus off the search input on every keystroke. That was invisible
  while the input was being destroyed anyway. The same `visit:start` hook now sets
  `visit.a11y.focus = false` when the visit came from `scheduleSearch`.

### Alternatives considered

- **Keep the header replaced and replay a keyframe on arrival**: a fresh node restarts a CSS
  animation, so the active bar could draw itself in with no script at all. Rejected because the
  outgoing bar cannot collapse when its node no longer exists, and because the bar would redraw on
  every navigation inside one section. Reopens if the transport in Decision 2 ever proves unreliable,
  since this needs no client logic whatsoever.
- **Persist only the `<nav>` through `data-swup-persist`**: supported by `swup@4.10.0`, and it would
  keep the bars alive inside a replaced header. Rejected because the carried-over node keeps its old
  locale labels, so it needs the same locale-crossing exception plus a second mechanism to get there.
- **Make the locale switch a full document request**: `data-no-swup` on the language links removes the
  exception entirely. Rejected because it trades a working client navigation for a reload on a link
  people use to read the same entity in the other language.

### Caveats

- The container list is now decided in two places: `book.ts` assigns its own, and the shell hook
  appends to whatever it finds. The shell hook is registered after `bindBook` so the order is
  defined, and it appends rather than assigns, but the coupling is real and undocumented in the
  markup.
- `watchHeader()` still disconnects and re-arms its `ResizeObserver` on every `page:view`, although
  the header it observes now usually survives. That is wasted work, kept because the observer must
  still be re-armed on the visits where the header is replaced.

---

## Decision 2: Per-page header state is transported, not re-derived

### Decision

- `#swup` carries `data-section={sectionFor(kind)}`, set in `src/layouts/Base.astro`.
- `NAV_SECTIONS` and `sectionFor` live in `src/lib/i18n/routes.ts`, beside the `ViewKind` vocabulary,
  and are the one description of which kinds a nav item owns.
- `setActiveSection` in `src/scripts/shell.ts` toggles `data-active` and `aria-current` on
  `[data-nav]` links. It runs authoritatively on `content:replace` from `#swup[data-section]`, and
  optimistically on `visit:start` when `visit.trigger.el` closes on a `[data-nav]` link.
- `syncLanguageLinks` reads `link[rel=alternate][hreflang]` from the head, which the head plugin
  already replaces, and assigns `new URL(href).pathname` to each `[data-lang-option]`.

### Rationale

- 0007 Decision 2 rejected a persistent header on the grounds that the browser would describe the
  header a second time, drifting from Astro's description. That objection holds against re-deriving
  the state and does not hold against moving it. The section rule stays in one server-side module and
  is consumed by both `Base.astro` and `Header.astro`; the alternates stay generated by
  `alternatesFor`. The script matches nothing and computes nothing.
- The authoritative update arrives with the page, so an aborted or redirected visit corrects itself.
  The optimistic one exists only so the bars start moving on the click rather than after the
  fade-out, and it writes the same value the server would.
- The head alternates are absolute (`https://aubaine.io/...`), which is why only their `pathname` is
  assigned. Assigning them whole would send a click in `pnpm dev` or `pnpm preview` to production.
- The server still renders `data-active` and `aria-current`, so the scriptless floor 0006 requires is
  unchanged and the first paint needs no script.
- `hreflang` on the language links stays a bare locale code, and the bare-to-BCP-47 mapping is
  `HTML_LANG` from `src/lib/i18n/locales.ts`, as `.claude/rules/architecture/i18n-routing.md`
  requires.

### Alternatives considered

- **Match the destination URL against prefixes each nav item declares**: gives the optimistic update
  for every link, not only nav links. Rejected because the home item needs an exact match while the
  others need a prefix, and the special case buys a refinement to an animation.
- **Import the route table into the shell and derive the section from `location.pathname`**: rejected
  as exactly the second description 0007 warned about, and it ships the segment map to the browser.

### Caveats

- The contract between `Base.astro`, `Header.astro` and `shell.ts` is three `data-*` attributes with
  no compile-time link. `sectionFor` is unit tested and the wiring is covered in
  `tests/e2e/shell-motion.spec.ts`, but a rename of `data-section` or `data-nav` fails silently at
  build time.

---

## Decision 3: The swap crossfades, and a slow visit shows a crest over the content region

### Decision

- `.au-swup-page` on `#swup`, with `transition: opacity 0.2s var(--ease)` and
  `html.is-animating .au-swup-page { opacity: 0 }` in `src/styles/base.css`. The selector
  `animationClass` has always pointed at now matches something.
- `src/components/shell/LoadingCrest.astro` and `src/scripts/loading.ts` port the crest from
  `~/Code/aubaine.io/sigil/src/fx/blackhole.js` and `blackhole.css`, retokenised to
  `--gold`, `--edge`, `--accent`, `--accent-line` and `--accent-ink` so it follows both themes.
- It is `position: fixed` inset below `var(--header-h)`, so it never covers the navbar, and
  `pointer-events: none`, so it never traps the pointer.
- It appears only 400ms into a visit that has not yet replaced content, holds a 260ms floor so it
  cannot flash, then runs `loading` to `collapse` to `void` to `burst` and tears itself down. The
  phase durations are CSS custom properties on the element, read back by the script, so the schedule
  and the animation cannot drift apart.

### Rationale

- The crossfade is the whole of the page transition on purpose. The per-view `au-rise` entrances
  already in `Card.astro`, `TreeCard.astro`, `EntryCard.astro`, `Home.astro` and `Tree.astro` supply
  the directional movement, so a transform on the container would move those pages twice.
- Scoping the crest to the content region, rather than the whole viewport as aubaine.io does, is what
  lets the header stay put and keeps the underline visible while the page loads. The two decisions
  support each other.
- The `void` hold phase and `whenPageReady()` were not ported. Both exist in aubaine.io to cover a
  full document load including webfonts, verified in `blackhole.js`; here the trigger is a router
  hook and the hold would be dead time on a visit that is already slow.
- Reduced motion is honoured twice, as it is in the source. `@swup/a11y-plugin` sets
  `visit.animation.animate = false` when the media query matches, verified in its `dist`, so the
  crossfade is skipped in JavaScript rather than merely shortened, and the crest's own stylesheet
  holds `display: none !important` under the same query.
- `public/_headers` sets `script-src 'self'`, so a ported file was the only option; the source has no
  dependencies, so nothing is added to `package.json`.

### Alternatives considered

- **`progress: true`, the Swup progress plugin**: a thin bar is the conventional affordance and costs
  no port. Rejected because the crest is the house one, and because a bar pinned to the viewport edge
  would sit over the header the decision above works to keep still.
- **The full aubaine.io intro on first document load**: rejected because an overlay in front of first
  paint is a poor trade on a reference work people arrive at from a search result. Reopens if the
  home page ever becomes a deliberate front door rather than one route among 433.
- **A crest on the skills and equipment detail panel**: asked for, and refused. `Browse.astro` renders
  every `<article data-detail>` at build time and `src/scripts/browse.ts` only toggles `display`, so
  selecting a row is a zero-latency DOM operation. An indicator there would be theatre for a wait
  that does not exist. Its `au-rise 0.22s` was confirmed in a browser to replay on each selection.

### Caveats

- On a visit that does show the crest, the reveal adds about 590ms after the content has arrived,
  spent on an animation rather than on reading. That is a deliberate trade of speed for character on
  the visits that were already slow, and the 400ms threshold is what keeps it off the common path.
- The crest's black hole core stays literal black in both themes rather than following a token,
  because the subject is a black hole and a cream one would not read as one.
- The overlay markup ships on every page, about one kilobyte of inert SVG, to avoid building it in
  JavaScript on first need.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Containers | Two by default, three across locales, book chapters their own | `astro.config.mjs`, `src/scripts/shell.ts`, `src/scripts/book.ts` |
| Active section | One server rule, transported on the replaced container | `src/lib/i18n/routes.ts`, `src/layouts/Base.astro` |
| Language links | Mirrored from the head alternates the head plugin replaces | `src/scripts/shell.ts` |
| Underline | A CSS transition on a node that now survives the swap | `src/components/shell/Header.astro` |
| Page swap | Opacity only, so per-view entrances are not doubled | `src/styles/base.css` |
| Loading crest | Ported, retokenised, below the header, past 400ms only | `src/components/shell/LoadingCrest.astro`, `src/scripts/loading.ts` |
| Proof | Header identity, both underlines mid-flight, crest geometry | `tests/e2e/shell-motion.spec.ts` |
