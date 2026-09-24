# ADR: One measure, one scale, and prose that never scrolls

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-23
**Revised:** 2026-09-23, the consumers named in Decisions 1 and 2 moved when 0018 unified the pages
**Deciders:** Kori
**Scope:** How every long-form reading surface is measured, scaled, coloured and scrolled: the
policy pages, the book chapters, the equipment guide and the Species lore. Also the invariant that
refuses an unrendered Markdown entry. Extends 0015, which created the policy collection without an
editorial layout, and 0016, which governs the words rather than their setting. Does not cover the
data model (0002), the overlay mechanism (0003) or the schema contract (0004).

---

## Context

Four surfaces render authored prose and none of them agreed on how. `src/components/views/Policy.astro`
capped its article at `74ch` and forgot `margin-inline: auto`, so every legal page pinned to the left
edge of a 1560px shell. `src/styles/prose.css` had no `a` rule at all, and `src/styles/base.css`
strips colour and underline from every anchor, so a link inside prose was indistinguishable from the
sentence around it. Its scale ran `h2` 19px, `p` 17px, `h3` 16.5px, so a heading was smaller than
the text it introduced, and not one media query existed in the file. Species lore was worse: 32 of
the 48 lore blocks carry paragraph breaks and `src/components/primitives/RuleText.astro` emitted one
flat `<div>`, so they collapsed into a run-on wall.

Three colour choices failed WCAG AA in the light theme, measured against the literal tokens:
`--gold` `#a07c20` is 3.59:1 on `--bg`, used for `dt` at 16px/700 and the ordered-list counter, and
3.05:1 for `code` over the composited `--accent-soft` chip.

Separately, a transient Zod failure in `src/lib/game/schema.ts` blanked every book chapter. Astro's
glob loader catches a render error, logs it, stores the entry without `rendered`, and then
short-circuits on an unchanged digest forever
(`node_modules/astro/dist/content/loaders/glob.js:92-101,128-155`). The runtime turns the missing
payload into an empty `<Content />` and `headings: []`
(`node_modules/astro/dist/content/runtime.js:433-438`). No error, no warning, a blank page that
survived a dev server restart and a source fix.

---

## Decision 1: One reading measure, expressed in `rem`

### Decision

- `--measure: 40rem` in `src/styles/tokens.css`, beside the other layout constants.
- Its consumers are the reading columns only: `.au-policy__head`, `.au-policy__body`,
  `.au-book-body` and the 1280px book grid, `.au-help__bar` and `.au-help__body`, `.au-lore__text`.
- Hero decks, card constraints and cell widths keep their own values. They are not reading columns.

### Rationale

- `74ch` on `article[data-policy]` and on `.au-book-body` resolved against the inherited 16px body
  size, not the 17px prose size, because neither element sets `font-size`. The column was about
  616px while reading as if it were declared at the prose size. `ch` is the wrong unit for a
  `max-width` that sits above the element carrying the type.
- `rem` grows with the reader's browser font setting, so a reader at 200% text size gets a
  proportionally wider column and the same character count. Every previous value was inert under
  text-only zoom.
- Two surfaces already encoded the same constant three different ways, `74ch`, `78ch` and `760px`,
  for one typeface at one size. That is the duplication a token exists to remove.

### Alternatives considered

- **A `--prose-*` token family for every size**: rejected while `prose.css` was the only consumer.
  It became two consumers once Species lore joined, which is why Decision 2 adds exactly two.
- **A shared container component**: the 1560px page shell is inlined in eleven files and
  `src/styles/plate.css` already carries it under a plate-specific name. Consolidating it is a
  mechanical sweep with its own review, not part of a typographic fix. Reopens on its own.

### Addendum (2026-09-23): the consumers moved, the measure did not

The alternative parked above reopened on its own, as predicted, and became Decision 2 of 0018. The
reading column is now `.au-reading__body` in `src/styles/reading.css`, used by the book chapter, the
policy page, the Species page and the skill tree page alike, and `.au-reading__head` replaces
`.au-policy__head`. `.au-book-body`, `.au-policy__body` and the 1280px book grid no longer exist.
`.au-lore__text` and `.au-lore__title` no longer exist either: Species and tree lore is Markdown
rendered through `.au-prose`, so it consumes `--prose-body` and `--prose-h2` by the same route as a
book chapter rather than by its own declarations. `.au-help__bar` and `.au-help__body` are unchanged.
`--prose-body` and `--prose-h2` keep their values. `--measure` does not: Decision 1 set it at
`40rem` for a 74 character line, and 0018 Decision 2 moves it to `48rem`, about 84 characters, on an
explicit instruction to widen the column. It also gained a second job there: it is the width of the
reading column itself, so every element inside the column, rules and pictures included, stops where
the paragraphs stop. The unit, the single declaration and the argument for `rem` over `ch` are
unchanged, and the consumer list above is superseded by `.au-reading__head` and `.au-reading__body`.

---

## Decision 2: The scale lives in `prose.css`, and exactly two sizes are tokens

### Decision

- `--prose-body` and `--prose-h2` in `src/styles/tokens.css`, both `clamp()` with a `rem` term in
  both bounds and in the preferred value.
- Every other size in `src/styles/prose.css` is expressed in `em`, so the scale derives from one
  declared `font-size` and reads in one place.
- `.au-lore__title` and `Attribution.astro`'s headings use `--prose-h2`; `.au-lore__text` uses
  `--prose-body`.
- Vertical rhythm is asymmetric top margins only: `1.7em` above an `h2`, `1.9em` above an `h3`,
  `0.8em` above a paragraph. `.au-prose > :first-child` resets to zero at specificity 0-2-0.
- Nothing is styled for `h4`, `blockquote`, `hr`, `img`, `pre`, `sup` or `abbr`. Across all 38
  authored Markdown files there are 180 `##`, 52 `###` and zero of any of those.

### Rationale

- Three consumers each, not one, is what makes these two worth a token. The rest would be
  indirection with a single reader, which `.claude/CLAUDE.md` forbids.
- A `clamp()` with a `rem` term satisfies SC 1.4.4 where a `vw`-only fluid scale does not. Every
  size in the file was previously a px literal, which ignores the reader's font setting entirely.
- The `h2` ceiling is set by the book chapter title at `Book.astro`, `clamp(28px,3.4vw,42px)`. The
  prose `h2` stays under it at every viewport, so the chapter keeps its rank over its own sections.
- Space, not size, is what makes a heading read as one. An `h3` opens with 2.7 times the gap a
  paragraph gets, which is why a ratio of about 1.11 to the body is enough next to Cinzel's cap
  height.

### Caveats

- The chapter title is an `h2` and the Markdown sections are also `h2`, so they are siblings in the
  accessibility tree while the page looks nested. Each chapter is its own URL, so the chapter title
  should be the `h1`. That change carries metadata consequences and is left open.

---

## Decision 3: `--accent-ink` is the prose ink, and a link is always underlined

### Decision

- Every accented text colour in prose is `--accent-ink`: links, `code`, `dt`, the ordered-list
  counter and the `ul` marker. Gold stays in prose only where it draws a line.
- A prose link carries a permanent 1px underline at `0.2em` offset, thickening to 2px on hover and
  focus. Neither state changes the colour.
- `src/styles/base.css` focus ring is `var(--gold)` rather than the hardcoded `#efbe04`.
- `src/components/primitives/Attribution.astro` follows the same link idiom.

### Rationale

- `--accent-ink` measures 9.99:1 in dark and 9.14:1 in light against `--bg`. `--gold` measures
  3.59:1 in light, below AA for the small text it was carrying.
- The underline is the conformance mechanism, not decoration. `--accent-ink` against the surrounding
  body text is 1.69:1 in dark and 1.73:1 in light; `--gold` is 1.26:1 and 4.41:1. Neither clears the
  3:1 SC 1.4.1 asks of a colour-only link cue in both themes, so the underline cannot be hover-only.
- The site's usual `:hover { color: var(--gold) }` idiom would compute to 3.59:1 in light, and WCAG
  applies to every state. Thickening the underline is a state change that costs no contrast and no
  reflow.
- The focus ring was `#efbe04` at 1.61:1 on the light background, failing SC 1.4.11 for every
  focusable element on the site. Following the token takes it to 3.59:1, which clears it.

### Caveats

- `--gold` is still text elsewhere, in the footer and in the three tooltip label sets, at 3.59:1 in
  light. `#7d5e16`, already in the file as `--paper-sub`, reaches 5.57:1. `--ink3` is 4.43:1, 0.07
  short. Both are site-wide and are not fixed here.

---

## Decision 4: Prose is never a scroll container; a table carries its own

### Decision

- `.au-prose` declares no `overflow`. `rehypeProseTables` in `src/lib/game/book-markup.ts` wraps
  every `<table>` in `<div class="au-prose__scroller" tabindex="0">`, and that wrapper scrolls.
- It carries no `/data/` path filter, so policy prose is covered as well as the codex.
- Every single-axis scroll container in the repository now declares the cross axis as `clip`:
  the browse detail panel, the equipment help panel, the book sidebar, the filters dialog, and the
  tooltip that `src/scripts/shell.ts` sizes at runtime.
- `[data-tip]` is `display: none` at rest, with `transition-behavior: allow-discrete` and an
  `@starting-style` block so the fade survives. `entries.css` no longer sets `display` on
  `.au-rule__tip`.

### Rationale

- CSS promotes the other axis from `visible` to `auto` whenever one axis is not `visible`, so every
  one-axis declaration in the repository was silently a two-axis scroll box.
- A hidden tooltip still occupies layout under `visibility: hidden`. One built skills page carried
  779 of them, each `width: max-content; max-width: 330px` anchored at `left: 0` inside a ~344px
  panel, which is what produced the horizontal scrollbar under every card.
- `[data-tip-root] { overflow-x: clip }` already existed on the body wrapper, so removing
  `.au-prose`'s overflow without a wrapper would have clipped wide tables rather than scrolling
  them. That is data loss, which is what makes the wrapper mandatory.
- A bare scroll container is not keyboard operable in Safari. `tabindex="0"` on the wrapper is what
  makes the only horizontally scrolling content on the site reachable, satisfying SC 2.1.1.

### Alternatives considered

- **`display: block` on `<table>`**: the only pure-CSS way to move the scroll onto the table.
  Rejected because it drops the element out of table layout, so `width: 100%` stops filling the
  column and every narrow table visibly shrinks.
- **`overflow-x: auto; overflow-y: clip` on `.au-prose`**: one line. Rejected because it scrolls the
  headings and paragraphs with the table and leaves the container unreachable by keyboard.
- **`role="region"` on the wrapper**: rejected because an unnamed region is not exposed as a
  landmark and no `<caption>` exists to name it from.

---

## Decision 5: Rich text is paragraphs, and the scrollbar theme is subtraction

### Decision

- `src/components/primitives/RuleText.astro` calls `parseParagraphs` and emits one `<p>` per block.
  Its root carries `au-rule-text`, and `entries.css` spaces consecutive paragraphs by `1lh`.
- The four `white-space: pre-line` declarations in `src/styles/entries.css` are deleted.
- `src/styles/base.css` drops its `::-webkit-scrollbar` rules in favour of `scrollbar-color` on
  `html` and `scrollbar-width: thin` on the existing `*` reset, with `--scroll-thumb` per theme.

### Rationale

- `parseParagraphs` already existed in `src/lib/game/richtext.ts` and was called by nothing. It
  strips callouts and parses runs exactly as `ruleRuns` does, so the only behavioural difference is
  that a lone `\n` becomes a space rather than a hard break. Four strings in the whole of `data/`
  use one; 292 use a blank line.
- `pre-line` produced paragraph spacing without paragraphs. `1lh` is one blank line by definition,
  so the card and booklet rhythm is preserved while the markup becomes real prose.
- Styling any `::-webkit-scrollbar` pseudo opts Chromium out of its overlay scrollbar onto the
  legacy widget, and with no `-track` rule the UA grey track is what the reader saw. Chromium 121+
  ignores those pseudos on any element that sets `scrollbar-width` or `scrollbar-color`, so keeping
  both would be dead code. Firefox had no scrollbar styling at all.

---

## Decision 6: An entry that did not render is refused, not served blank

### Decision

- `src/lib/game/prose.ts` exports `renderProse(entry)`, which throws when `entry.rendered` is absent,
  naming the collection, the entry id, the file path and the store to delete.
- It is the only caller of `render()`. The five sites that resolved a canonical entry, overlaid a
  translation and rendered it now go through it: `Book.astro`, `Policy.astro`, `Browse.astro` and
  `print/[...booklet].astro` twice.
- `tests/data/prose.test.ts` renders every authored Markdown file through the configured processor
  and asserts a non-empty body, and more than one depth-2 heading for a book chapter.
- `playwright.config.ts` moves preview to port 4322.

### Rationale

- A blank page is the worst possible failure for a content-first site, and it survived both a server
  restart and the source fix. Fail-fast is what `.claude/rules/quality/error-handling.md` asks for,
  and `src/lib/game/policies.ts` already establishes a lib module throwing a precise `Error` as the
  house convention.
- The test reproduces the original failure: reverting the schema fix makes it fail in about a second
  with the same `Failed to parse Markdown file` prefix found in `.astro/dev.log`. Playwright cannot,
  because its `webServer` builds and the build store was never poisoned.
- `astro dev` defaults to 4321, and `reuseExistingServer` answered the probe from it, so the entire
  e2e suite ran against the dev server whenever one was up rather than against the build.
- The chapter outline is gated on more than one depth-2 heading, so the heading assertion covers the
  sidebar disappearing as well as the body emptying. Policies are exempt: `credits.md` has none.

### Caveats

- The guard cannot fire during the render that poisons the store, only on the next read. It converts
  a silent blank page into a loud failure; it does not stop Astro from caching the failure.
- `src/lib/game/book-markup.ts` still caches the corpus promise per locale, so one rejection is
  cached for the life of the process. That amplifier is untouched.
