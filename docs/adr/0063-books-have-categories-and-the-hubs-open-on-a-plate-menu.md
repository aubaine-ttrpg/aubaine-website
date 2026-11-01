# ADR: Books have categories, and the Codex and Livres hubs open on a plate menu

**Project:** Aubaine, the wiki
**Status:** Superseded by 0065-the-livres-hub-opens-on-its-contents-and-lists-every-category
**Date:** 2026-10-31
**Deciders:** Kori
**Scope:** How books are grouped into categories and which pages and menu entries the categories
derive; the layout of the two hubs that open sections, the Codex (`/fr/almanach`) and Livres
(`/fr/livres`); and the two hub layouts kept unshipped. Builds on 0053 (one picture per entry) and
0054 (the character sheet on a living stage), whose select screen the category pages reuse. Does not
change the chapter pages, the booklet register (0013) and its archived downloads (0062), or the Atlas
boot's CADRAN screen (0044). 0064 records how the design work behind this record is run.

---

## Context

Until this change Livres showed every book and booklet as one grid of cards under a 16:9 banner, and
the Codex showed its six indexes the same way (`src/components/views/Cards.astro` with
`src/components/primitives/Card.astro`). On 2026-10-29 the owner asked for book categories, "Books
should know have categories (rule books, booklets, stories and maybe others laters)", and for both hubs
to be redone in the art direction of the character sheet and the select screen without copying them.
Between 2026-10-28 and 2026-10-31 the owner turned down hubs built as select screens, nine live
prototypes, a CADRAN screen and a poster wall, found two list layouts too plain, and on 2026-10-31
picked the composed plate menu: "let's do B+".

---

## Decision 1: A book has a category, and the categories are derived lists

### Decision

- `book.category` is required, one of `rules`, `resources`, `adventures` and `stories`
  (`BOOK_CATEGORIES` in `src/lib/game/schema.ts`), and `order` ranks a book within its category.
- The data files it: the Livre du joueur and the Livre du MJ are `rules`, the Recueil des Arbres is
  `resources` (`data/books/*/book.json`). A printed aid that is not a book, the equipment catalogue and
  each tree's booklet, is filed under `resources` by `PRINTED` in `src/lib/game/library.ts`, not by a
  field.
- `library()` in `src/lib/game/library.ts` returns only the categories that hold something, in
  `BOOK_CATEGORIES` order; within one, books come first, then the catalogue, then the tree booklets,
  each by `order` and then by name.
- A category with nothing to open has no page, no door on the Livres hub and no entry in the header's
  Livres menu.
- Each category has a page at `/fr/livres/<segment>` and `/en/books/<segment>`, the segments being
  `regles` and `rules`, `ressources` and `resources`, `aventures` and `adventures`, `histoires` and
  `stories` (`CATEGORY_SEGMENT` in `src/lib/i18n/routes.ts`). The page is the select screen
  (`src/components/views/BookCategory.astro`); a book without a cover shows its category's seal.
- Each category has one colour and one pictogram, picked by the owner on 2026-10-30, in
  `CATEGORY_MARKS` (`src/lib/game/kind-marks.ts`).

### Rationale

- The owner named the categories on 2026-10-29 and added "i forgot that there should also be an
  adventure category"; each category got its own page, among the proposals, and shows only once it
  holds something.
- Lists derived from the data need no code when an adventure or a story arrives: its `book.json`
  names its category and the page, the hub door and the menu entry follow.
- Verified in the tests: `tests/data/integrity.test.ts` keeps every category path free of a book id
  and of a redirect source, `tests/unit/derive.test.ts` gives each category its own segment one level
  under the books section, and `tests/e2e/hubs.spec.ts` checks that an empty category has no page.

### Alternatives considered

- **One Livres page listing every book**: rejected; the owner asked for categories with pages of their
  own. Reopens if the books fit one category again.
- **A `category` field on printed aids**: rejected; the catalogue and the tree booklets have no
  `book.json`, and filing them in code keeps each schema strict. Reopens when a printed aid needs a
  category other than `resources`.
- **Showing an empty category as coming soon**: rejected; a door that opens nothing is a dead link.
  Reopens only for an announcement that is not a door.

### Caveats

- A book whose id equals a category's segment would shadow that category's page; the integrity test
  refuses it, so the id must change.
- `order` changed meaning from a rank among all books to a rank within a category. The three books
  kept their values.

---

## Decision 2: The Codex and Livres open on the plate menu

### Decision

- Both hubs render `src/components/primitives/PlateMenu.astro`, through
  `src/components/views/Codex.astro` and `src/components/views/Library.astro`. One door per section
  (`codexDoors` and `libraryDoors` in `src/lib/game/hub-doors.ts`): the kind's or the category's
  hexagon, the section's exact name in Cinzel paper plates, one line, and no count.
- One door holds the light at a time (`data-lit`, the menu's cursor), the first at rest, and no door
  is marked `aria-current`. With JavaScript, pointing a door with a mouse or a pen lights it at
  once, and after 80 ms of intent `data-lit` moves to it, staying after the pointer leaves, and the
  stage swaps; leaving the door first cancels both. With JavaScript, keyboard focus moves `data-lit`
  and swaps the stage at once, and while keyboard focus is anywhere in the menu, pointing moves
  nothing; without JavaScript, the same holds while a door holds keyboard focus. A pressed door
  lights while pressed, with or without JavaScript, but touch never moves `data-lit` or the stage.
  The stage takes the opening picture of the page the door holding the light opens, blurred; from
  960 px wide, a lit door draws a band of its colour with its pictogram struck in paper
  (`src/components/primitives/DoorGlyph.astro`).
- `src/scripts/door-light.ts` moves the light and the stage; `src/styles/doors.css` lights the doors
  without JavaScript through `:has()`, `:hover` and `:focus-visible`.
- The card grid goes: `Cards.astro`, `Card.astro`, their hover rules in `src/styles/base.css`, the
  `--card-shadow` token, the index descriptions and the « Consulter » label only it printed, and its
  banner `bureau-de-archibald-16_9-upscaled_4.jpg`, moved to `data/media/unassigned/`.

### Rationale

- The owner picked it on 2026-10-31 after comparing the layouts live, in both hubs and both languages.
- Measured on 2026-10-31: the live hubs match the prototype the owner picked with no differing pixel
  over 20 full-page captures (both hubs and languages, at 1512 × 860 at rest and pointed, 1366 × 657,
  1024 × 768 and 390 × 844, counted pixel by pixel); the Arbres, Espèces, Marchand and Drow pages
  match their earlier captures over 16; every lit name clears its band by at least 13.4 px over 80
  lit states.
- The hubs make no picture of their own: each door's light is the picture its page already opens on,
  as 0053 and the owner's rule of 2026-10-27 ask.
- `tests/e2e/hubs.spec.ts` holds the contracts at seven browser sizes, and
  `tests/e2e/no-javascript.spec.ts` the light without JavaScript.

### Alternatives considered

- **The card grid under a banner**: the previous hubs; replaced at the owner's request of 2026-10-29.
  Reopens if the hubs stop being doors to sections.
- **A select screen of the sections**: rejected on 2026-10-28, "hubs don't feel like hubs at all they
  just feel like copies of skills trees but with pages isntead of skill trees." Reopens never for a hub.
- **Nine live prototypes** (a ledger, a collection, tiles, sections, bookmarks, chips, Hextech
  histories and two homes): rejected on 2026-10-29. Reopens only for a new brief.
- **The Codex as the Almanach's CADRAN screen**: rejected on 2026-10-30; CADRAN stays the Atlas boot's
  (0044). Reopens if the owner gives a site page that look.
- **A poster wall of framed cards (layout A)**: rejected on 2026-10-30 as "a reformated version of
  those indexes". Reopens never for a hub; a framed card stays the entry's showcase.
- **The plain plate menu (B) and a plain catalogue sheet (C)**: "not convincing AT ALL" (2026-10-30).
  B+ is B composed with its scene.
- **The Sommaire spread (C+) and the slanted doors (D)**: not picked, and kept (Decision 3).

### Caveats

- Below 960 px the scene is hidden and the doors stand alone on the stage.
- The header's Livres and Codex menus open over the top of the hub while the pointer rests on them, as
  on every page; they close when it leaves.
- The names take up to 0.67 s to arrive (`PlateDoor.astro`). A test that points a door during the
  arrival can land on its neighbour, so the hub tests run with reduced motion.
- `src/scripts/door-light.ts` keeps its own copy of the select screen's pointer intent and stage swap,
  and `src/lib/game/hub-doors.ts` derives the opening stage of the trees index, the species index and
  each book category again, with the same domain functions as their views (`leadOrder`, `leadFirst` and
  `stageSource`). Both copies are on purpose, so that the plate menu changes nothing in the select
  screen's pointer code or in how its views pick their lead; the test of `tests/e2e/hubs.spec.ts` that
  each door shows the light of the page it opens keeps the stages in agreement.

---

## Decision 3: Two hub layouts are kept on the gated prototype page

### Decision

- `src/pages/prototype/[...look].astro`, built only with `AUBAINE_PROTOTYPE=1` and never indexed, keeps
  C+, the Sommaire spread (`SommaireSpread.astro`, `SommaireEntry.astro`), and D, the slanted doors
  (`SlantedDoors.astro`, `SlantedDoor.astro`), for both hubs and both languages, lit by the same door
  contract.
- Neither ships. Using one on a live page is a new pick by the owner.

### Rationale

- The owner on 2026-10-31: "let's keep D possibly for later for something else and C+ too, let's not
  waist them but rather keep them for something".
- Kept built, they stay type-checked by `pnpm check` and measurable by `pnpm design:audit`: on
  2026-10-31, over 140 states each at the seven sizes, every piece of D sat at least 12.9 px inside
  its skewed panel, and C+ had nothing outside its sheet or the screen.

### Alternatives considered

- **Delete them and rely on git history**: rejected; the owner asked to keep them, and code nobody
  builds stops compiling unnoticed. Reopens if the owner retires them.
- **Keep them as descriptions in the design skill**: rejected for the same reason. The skill describes
  them in `.claude/skills/aubaine-design/references/prototypes.md`.

### Caveats

- From four doors and 960 px wide, D shows a closed door's line only once the door opens, which the
  first principle of `DESIGN.md` forbids on a live page. The owner settles it before D ships anywhere.
- The plate menu, C+ and D build their doors with the same helpers: `doorLooks(doors)` and
  `doorContract(door, look, index, lit)` in `src/lib/game/hub-doors.ts` give each door its stage
  look, its ids, its `data-door-*` attributes and its style variables, and
  `fitLetters(names, padding)` in `src/lib/plates.ts` gives each layout `--fit-letters`, the longest
  word's width in em, which its CSS divides the name's room by, the plate menu and D with
  `PLATE_PADDING`. Each layout writes its own markup and CSS, so D's plate rules repeat the plate
  door's plate recipe with their own tilts.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| `book.category` | files a book under one of four categories | `src/lib/game/schema.ts`, `data/books/*/book.json` |
| Library | derives the non-empty categories and their items | `src/lib/game/library.ts` |
| Category pages | the select screen for one category's books | `src/components/views/BookCategory.astro` |
| Plate menu | the Codex and Livres hubs | `PlateMenu.astro`, `PlateDoor.astro`, `DoorGlyph.astro` |
| Door contract | the light with or without JavaScript, the stage only with it | `src/scripts/door-light.ts`, `src/styles/doors.css` |
| Kept layouts | C+ and D, unshipped | `src/pages/prototype/[...look].astro` |
