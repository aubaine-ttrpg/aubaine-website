# ADR: The Livres hub opens on its contents and lists every category

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-31
**Deciders:** Kori
**Scope:** How books are grouped into categories and which pages and menu entries the categories
derive; the layouts of the two hubs that open sections, the Codex (`/fr/almanach`) and Livres
(`/fr/livres`); the place of the archives (`/fr/archives`) in Livres; and the layout kept unshipped.
Supersedes 0063 and restates what of it still holds. Builds on 0053 (one picture per entry) and 0054
(the character sheet on a living stage), whose select screen the category pages reuse. Does not change
the chapter pages, the booklet register (0013) and its archived downloads (0062), which the archives
page lists, or the Atlas boot's CADRAN screen (0044). 0064 records how the design work is run.

---

## Context

Earlier on 2026-10-31, 0063 opened both hubs on the plate menu and gave a book category a page, a door
and a menu entry only once it held something. Later the same day the owner moved Livres to the
contents spread, kept the plate menu for the Codex, asked for every category to show, empty or not,
and for the archives to join Livres: "let's put C+ for books and keep b+ for codex. for C+ put all the
categories we talked about, it will jsut say "none found" with our default placeholder when there is
no data. and in additino i think you can add archives for the old books and older versions anyway i'll
let you cook for Books. Be smart. Professional. Make no mistakes." Two categories, Aventures and
Histoires, hold nothing yet.

---

## Decision 1: A book has a category, and every category has its page

### Decision

- `book.category` is required, one of `rules`, `resources`, `adventures` and `stories`
  (`BOOK_CATEGORIES` in `src/lib/game/schema.ts`), and `order` ranks a book within its category. The
  Livre du joueur and the Livre du MJ are `rules`, the Recueil des Arbres is `resources`
  (`data/books/*/book.json`); the equipment catalogue and each tree's booklet are filed under
  `resources` by `PRINTED` in `src/lib/game/library.ts`.
- `library()` in `src/lib/game/library.ts` lists every category once, in `BOOK_CATEGORIES` order,
  whether it holds something or not; within one, books come first, then the catalogue, then the tree
  booklets, each by `order` and then by name.
- Each category has a page at `/fr/livres/<segment>` and `/en/books/<segment>` (`CATEGORY_SEGMENT` in
  `src/lib/i18n/routes.ts`), rendered by `src/components/views/BookCategory.astro`. A category with
  items is the select screen; a book without a cover shows its category's seal.
- A category with nothing yet renders `src/components/primitives/EmptyStage.astro`: its seal's light
  on the stage, its title plates and help note, the house empty state
  (`src/components/primitives/EmptyState.astro`) with the category's `empty` title, the shared
  `emptyCategoryBody` and a link back to the Livres hub (`allDocs`), and the pause square. The words are
  in `src/lib/i18n/strings.ts`.
- Such a page is `noindex`, has no canonical link and is left out of the sitemap: `src/lib/game/pages.ts`
  marks a category page `noIndex` when none of its items is indexable, an empty list included,
  `src/layouts/Base.astro` then writes the robots meta and drops the canonical, and
  `src/pages/sitemap.xml.ts` skips the page.
- Each category has one colour and one pictogram, picked by the owner on 2026-10-30, in
  `CATEGORY_MARKS` (`src/lib/game/kind-marks.ts`).

### Rationale

- The owner asked for every category and for an empty one to say "none found" with the house
  placeholder. `EmptyState.astro` is that placeholder: an outlined hexagon beside a title and one
  line, already shown by `src/components/primitives/FilterBar.astro` and
  `src/components/views/Tree.astro`. `EmptyStage.astro` composes it with `TitlePlates.astro`,
  `StageBackdrop.astro` and `StillToggle.astro` and copies none of them.
- The link back to all books is the recovery path a reader needs on a page with nothing to open, and
  an empty taxonomy stays out of search, as `.claude/rules/discovery/seo.md` and
  `.claude/rules/architecture/routing.md` ask.
- When the first adventure or story arrives, its `book.json` names its category and the page fills
  and becomes indexable on its own; no code changes.
- Verified by `tests/unit/library.test.ts` (every category once, in its order, each item in its own
  category), `tests/e2e/hubs.spec.ts` (every category page answers with its two language alternates; an
  empty one shows its title, the shared line and the link back, carries `noindex` and no canonical, is
  absent from the sitemap, and prints in dark ink on white paper without its stage) and
  `tests/data/integrity.test.ts` (no book id equals a category's segment, and no redirect captures a
  category page).

### Alternatives considered

- **Hiding a category until it holds something (0063)**: superseded at the owner's request. Reopens if
  the owner wants the hub to show only what exists.
- **An entry on the hub with no page behind it**: rejected; a link that opens nothing is a dead end, and
  a page that says so with a way back is not. Reopens never.
- **A "coming soon" label or a date**: rejected; it would promise books that do not exist. Reopens when
  the owner announces one in their own words.

### Caveats

- An empty category's meta description is its lead, which says what the category is for while the
  page says it holds nothing yet; the page stays out of search until its first book.
- A book whose id equals a category's segment would shadow that category's page; the integrity test
  refuses it, so the id must change.

---

## Decision 2: The Codex opens on the plate menu, Livres on its contents

### Decision

- The Codex renders `src/components/primitives/PlateMenu.astro` through
  `src/components/views/Codex.astro`: one door per index (`codexDoors` in `src/lib/game/hub-doors.ts`),
  its kind's hexagon, its exact name in Cinzel paper plates, one line, and no count.
- Livres renders `src/components/primitives/SommaireSpread.astro` and `SommaireEntry.astro` through
  `src/components/views/Library.astro`: a bone two-page spread laid on the stage, the title plates over
  its top edge, the running head « Sommaire », and one entry per category in `BOOK_CATEGORIES` order
  under a Roman numeral, with leader dots, its hexagon mark and its line, then the archives
  (`libraryDoors` in `src/lib/game/hub-doors.ts`). From 1100 px wide the entries fill the left page,
  then the right; below, one page.
- The archives entry opens `/fr/archives` and `/en/archives`, and takes that page's own painting,
  `ARCHIVES_ART` in `src/lib/game/library.ts`, as its light. It carries `ARCHIVES_MARK`
  (`game-icons:book-pile` in `#a07c4f`, inked by `archivesInk()`) in `src/lib/game/kind-marks.ts`, the
  designer's default until the owner picks the mark from rendered previews, as
  `.claude/rules/frontend/kind-marks.md` requires.
- The header's Livres menu lists the same entries in the same order (`src/components/shell/Header.astro`),
  and the archives pages (`archives`, `archive`) belong to the Livres section of the header
  (`NAV_SECTIONS` in `src/lib/i18n/routes.ts`).
- Both hubs share the door contract (`doorLooks` and `doorContract` in `src/lib/game/hub-doors.ts`,
  `src/scripts/door-light.ts`, `src/styles/doors.css`): one entry holds the light, the first at rest,
  and none is marked `aria-current`; with JavaScript, pointing lights an entry at once and, after 80 ms
  of intent, moves the light and the stage to it, and leaving first cancels both; keyboard focus moves
  them at once. The stage takes the opening picture of the page the entry opens, blurred.

### Rationale

- The owner on 2026-10-31: "let's put C+ for books and keep b+ for codex.", and the details of Books
  were left to the designer.
- Measured on 2026-10-31 with `pnpm design:audit`: Livres over 96 states (the seven sizes of
  `.claude/skills/aubaine-design/references/measuring.md` and 320 × 568, both languages, every entry
  pointed in turn), 0 problems, the sheet at least 16 px inside the screen and every name, line, mark
  and numeral inside the sheet; the empty category pages over 32 states, 0 problems, their title plates
  at least 12.8 px inside the screen.
- The Codex is unchanged: it matches its captures from before this decision with no differing pixel,
  10 of 10 (both languages, at 1512 × 860 at rest and with the second door pointed, 1366 × 657,
  1024 × 768 and 390 × 844). The approved pages match their captures from before either hub shipped,
  16 of 16 (every route of the sheet and the select screen at 1512 × 860 and 390 × 844).
- `tests/e2e/hubs.spec.ts` holds both layouts at the seven sizes and 320 × 568 (the plate menu's
  plates and scene; the contents' title plates uncut, its names, lines, marks and numerals inside the
  sheet and inside their link with each entry lit, no entry over another, no focus ring across the line
  above, and the pause square clear of the sheet), the reading order down each page, the header menu equal
  to the entries, each entry's light equal to its page's opening picture, the pointer and the keyboard on
  both hubs, a client visit binding the doors again, the help button clear of the header, and the contents
  in forced colours and in print; `tests/e2e/no-javascript.spec.ts` opens every door of both hubs without
  JavaScript and lights them from the pointer and the keyboard.

### Alternatives considered

- **The plate menu for Livres too (0063)**: superseded; the owner moved Livres to the contents spread.
  Reopens if the owner returns to one layout for both hubs.
- **The contents spread for the Codex**: rejected; "keep b+ for codex". Reopens with a new pick.
- **The archives left to the footer's « Versions précédentes » only**: rejected; the owner asked for
  them in Books. The footer link stays. Reopens if the owner takes them out of Books.
- **An archives mark already in the repository** (`game-icons:sands-of-time`, `scroll-unfurled`,
  `open-treasure-chest`, `mdi:book-multiple`, `game-icons:ancient-columns`): rejected; each already
  stands for a rule term, the chapters or an Atlas landmark, and a mark means one thing. Reopens if
  one of them is retired.

### Caveats

- The archives mark awaits the owner's pick, whose candidates are live on the gated page; changing it
  is one entry in `src/lib/game/kind-marks.ts` and its pictogram file under `data/media/icons/`.
- The contents spread numbers up to eight entries (I to VIII) and refuses to build with more; a sixth
  category would still fit, a ninth entry would not.
- `src/scripts/door-light.ts` keeps its own copy of the select screen's pointer intent and stage swap,
  and `src/lib/game/hub-doors.ts` derives the opening stage of the trees and species indexes again with
  the same domain functions as their views (`leadOrder`, `leadFirst`, `stageSource`), so that the hubs
  change nothing in the approved select screen; `categoryStage` is shared by `libraryDoors` and
  `BookCategory.astro`, and the light test of `tests/e2e/hubs.spec.ts` keeps the rest in agreement.

---

## Decision 3: The slanted doors stay on the gated reserve page

### Decision

- `src/pages/prototype/[...look].astro`, built only with `AUBAINE_PROTOTYPE=1` and never indexed,
  keeps D, the slanted doors (`SlantedDoors.astro`, `SlantedDoor.astro`), for both hubs and both
  languages, lit by the same door contract. The contents spread left it when it shipped for Livres.
- D does not ship. Using it on a live page is a new pick by the owner.

### Rationale

- The owner on 2026-10-31: "let's keep D possibly for later for something else and C+ too, let's not
  waist them but rather keep them for something".
- Kept built, it stays type-checked by `pnpm check` and measurable by `pnpm design:audit`: on
  2026-10-31, over 182 states at the seven sizes, the Livres page with its five doors included, every
  piece sat at least 12.9 px inside its skewed panel.

### Alternatives considered

- **Delete it and rely on git history**: rejected; the owner asked to keep it, and code nobody builds
  stops compiling unnoticed. Reopens if the owner retires it.

### Caveats

- From four doors and 960 px wide, D shows a closed door's line only once the door opens, which the
  first principle of `DESIGN.md` forbids on a live page. The owner settles it before D ships anywhere.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| `book.category` | files a book under one of four categories | `src/lib/game/schema.ts`, `data/books/*/book.json` |
| Library | lists every category and its items | `src/lib/game/library.ts` |
| Category pages | the select screen, or the empty stage when a category holds nothing | `BookCategory.astro`, `EmptyStage.astro` |
| Plate menu | the Codex hub | `PlateMenu.astro`, `PlateDoor.astro`, `DoorGlyph.astro` |
| Contents spread | the Livres hub, the archives last | `SommaireSpread.astro`, `SommaireEntry.astro` |
| Door contract | the light with or without JavaScript, the stage only with it | `src/scripts/door-light.ts`, `src/styles/doors.css` |
| Kept layout | D, unshipped | `src/pages/prototype/[...look].astro` |
