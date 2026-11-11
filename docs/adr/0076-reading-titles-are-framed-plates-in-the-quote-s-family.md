# ADR: Reading titles are framed plates in the quote's family

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-11-10
**Deciders:** Kori
**Scope:** How the titles of a reading page look and are built: a book chapter's title, a policy's title,
and the section and subsection titles of book chapters, policies, species and trees, whether Markdown writes
them or a view does. Widens the exception 0068 made for the lore quote to principle 12 of `DESIGN.md`,
keeps the reading column of 0018, takes the key colour of 0054, and restyles the « Noms » titles of 0074
without changing what that section reads. 0064 records how the design was run. Does not change the
character sheet's name, the hub and index titles, the callouts, the equipment help's prose, or the
booklets' `print.css`.

---

## Context

Until now a reading page titled its sections in plain Cinzel over a 1 px rule (`src/styles/prose.css`), a
book chapter's title was an inline-styled `h1` in `src/components/views/Book.astro`, and the heads over a
species' skills and a tree's board were `SectionHead.astro`, a title with a count. On 2026-11-10 the owner
asked for titles drawn from the approved lore quote, in the key colour, each level quieter, each with and
without a round frame that can hold a number or a picture, full width, for the web pages and later the
printed material. Two directions and a dropped third were built on a gated prototype page, then tuned
live with a panel of switches; the owner set the defaults this record ships. The rulings are in
`.claude/skills/aubaine-design/references/rulings.md` (§ Titles), the values in `approved-pieces.md`
(§ The titles).

---

## Decision 1: Titles are game pieces inside the reading, one look per level

### Decision

- A page title is a night plate with the quote box's 4 px bone ring; a section a bone plate with a night
  outline and a hard shadow; a subsection a small night plate with a thin bone ring. Each level runs full
  width on a strip of its own: the page title on a key-colour panel, a section on a key-colour strip under
  halftone, a subsection on a strip of key dots alone.
- Each plate rests 1 to 1.5 degrees off level, its text turning with it, and keeps a minimum width that is a
  share of its column (the page title 55 %, a section 40 %, a subsection 28 %, capped at 30, 22 and 15 rem),
  so a short title never sits lost on its strip and each level stays smaller than the one above.
- The key colour is the page's (`--key` from `readingKeys` on species and trees, house gold elsewhere).
- Principle 12 of `DESIGN.md` names the titles beside the quote and the dialogue; the text between them
  stays calm.

### Rationale

- The owner asked for the quote's family and picked these looks live; the values are in
  `src/styles/titles.css`.
- One look per level keeps the hierarchy readable by weight: a 7 px blur of the specimen in both themes
  showed the page title loudest, then the section, then the subsection, before the pick.
- The minimum width came from the owner's screenshots of « L'Âme » and a two-letter title, where a plate
  hugging its text lost to its strip.

### Alternatives considered

- **A ring on a full-width rule (Hextech's banner ring and mastery line)**: its section and subsection were
  type on a plain ground over a rule, which the owner had rejected for the quote on 2026-11-03 and
  2026-11-04. Reopens if a title ever needs to be lighter than a plate.
- **A subsection without a strip, or with a thin solid strip**: built and switched live; the owner asked
  for a full-width strip and picked the dots alone, the quietest that still runs full width.

### Caveats

- The tilt is decoration on text. It stays at 1.5 degrees or less, 1 degree or less under 40rem, and the
  text spacing of WCAG 1.4.12 was measured with it (Decision 4).

---

## Decision 2: The build writes every prose title's frame, and the heading stays untouched

### Decision

- `rehypeProseHeadings` in `src/lib/game/book-markup.ts`, registered in `astro.config.mjs`, wraps every
  root-level `h2` and `h3` of a prose page in `div.au-head[data-level]` with one `span.au-frame` before the
  heading, hidden from screen readers, and the longest word's width for fitting (`fitLetters` in
  `src/lib/plates.ts`). Headings inside a quote or a callout are left alone.
- `SectionTitle.astro`, `PageTitle.astro` and `TitleFrame.astro` write the same markup for a title a view
  builds; `SectionHead.astro` is removed.
- The look applies inside a `.au-titles` reading column; prose without one, such as the equipment help,
  keeps its plain titles, the frames hidden by `src/styles/prose.css`.

### Rationale

- A plate, its strip and its frame are three boxes; an element gives two pseudo-elements, and a turned
  heading makes its own stacking context, so the frame needs markup. Writing it at build time keeps the
  Markdown free of new syntax and ships no script.
- The heading element, its text and its id are untouched, so the side list, the anchors and Swup's page
  announcement read as before: verified by `tests/unit/prose-headings.test.ts` and by
  `tests/e2e/titles.spec.ts`, which compares every side-list link's words with its target.

### Alternatives considered

- **CSS on the bare headings, with a counter**: no room for the frame as a third box; rejected on that
  count. Reopens if CSS gains a third generated box on an element.
- **New Markdown syntax per title**: a burden on every writer for a frame most titles fill with the same
  unset picture. Reopens with Decision 3's open point, when titles take their own pictograms.

### Caveats

- The content store ignores plugin code: after this change a running `astro dev` must restart with
  `pnpm dev --force`, and a build follows `pnpm astro sync --force`.

---

## Decision 3: A frame holds the title's pictogram, or the painted question mark until one is set

### Decision

- A title that names something with a pictogram shows it in its own ink: « Compétences d'Espèce » the
  Compétences mark, « Arbre de compétences » the Arbres mark (`KIND_MARKS`), a book's chapter its
  category's (`CATEGORY_MARKS`).
- Every other title shows the painted question mark of the square placeholder (`placeholder-1_1-og.png`),
  set as `--unset-picture` by `titleFrameStyle()` in `src/lib/title-frames.ts`, a 10,351-byte JPEG in the
  shipped build; a typed « ? » sits under it when the picture cannot load.
- Sections, subsections and the titles of pages other than book chapters take a round frame; a book's
  chapter title takes the logo's pointy-top hexagon. This is an exception to "the pointy-top hexagon is
  the mark" for title frames only; markers, bullets and badges stay hexagons.
- A book's chapter title leads with its frame and its halftone echo, its number outlined behind the plate
  as the sheet's ghost name is, its one-line description under it. Every other page lays its title on the
  key panel, the frame breaking the panel's top edge, its description under it.

### Rationale

- The frame says what a title is about where the game already has a mark for it, and says « not set yet »
  elsewhere, as the « ? » rule of `rulings.md` asks where a value can exist but is not set. The owner
  picked the painted question mark over a typed one.
- The round frame and the hexagonal chapter frame were shown side by side for every level; the owner
  picked per level.

### Alternatives considered

- **Section numbers in the frames**: they repeat the side list, and a book's side list numbers chapters,
  not sections; tried live and not picked. Reopens if the side list stops numbering.
- **A skill's painting in the frames**: tried live with « Cachette naturelle »; nothing says which skill a
  title takes. Reopens with a rule or a field naming it.
- **Roman numerals and a « Chapitre N » label on the plate**: tried live; the chapter title carries its
  number in the outline behind it instead.
- **Hexagons everywhere**: kept the mark rule whole; the owner picked round frames for most titles.

### Caveats

- Every title of a page without its own pictogram shows the same picture until titles take their own; the
  repetition is the honest « not set yet », and it costs one 10 KB image per page.

---

## Decision 4: Print and forced colours keep today's titles; the measurements at the ship

### Decision

- Under print and forced colours there is no frame, no strip and no tilt: inside prose the wrapper is
  `display: contents` and the `h2` keeps its rule (`src/styles/prose.css`); a title outside prose and the
  page title fall back to plain Cinzel 700.
- The heads over a species' skills and a tree's board drop their « N entrées » and « N nœuds »: the filter
  bar under them already gives the count, and a header never repeats the list below it (`rulings.md`).
- A title's scroll margin stays the header's height (`--sticky-top`), as before.

### Rationale

- The booklets are to print this look later; until then print matches the quote, which also falls back.
- Measured on 2026-11-10 over a book chapter, a policy, the credits, three species and two trees in both
  languages, at 1512, 1366, 1024, 820, 390 and 320 px, with and without the text spacing of WCAG 1.4.12: 108
  states, 912 titles, no sideways scroll, no text past its plate, no plate past its column, every jump from
  the side list leaving a title at least 10 px under the header.
- The pages without titles matched their earlier captures with `pnpm design:pixels` (28 of 28 shots), and the
  first screen of six sheet pages matched to the pixel at two sizes.
- A scroll margin larger than the header's height made a tree node's visit move the page by 15 px
  (`tests/e2e/tree.spec.ts`), so the margin stays as it was.

### Alternatives considered

- **Print the dressed titles now**: deferred to the booklet work, which will print the custom pieces as they
  are; reopens with it.

### Caveats

- `pnpm pdf:check` reported 58 booklets out of date before this change, at `d0ca0d1`; the style folders it
  hashes changed again here. Printing them again is a separate step.
- A jump now leaves a title 10 px under the header, closer than the old heads' 20 px, because a frame and a
  strip rise above the heading.
