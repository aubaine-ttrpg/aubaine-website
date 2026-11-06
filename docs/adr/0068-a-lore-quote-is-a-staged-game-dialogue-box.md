# ADR: A lore quote is a staged game dialogue box

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-11-04
**Revised:** 2026-11-04, a dialogue turn may open on its speaker's portrait (addenda to Decisions 1 and 3); two entries restaged (addendum to Decision 2); the right-hand turn's own box (addendum to Decision 3, 2026-11-05); both turns' slopes halved (addendum to Decision 3, 2026-11-06)
**Deciders:** Kori
**Scope:** How a prose blockquote that is not a callout renders on screen: the single speech and the
dialogue of a lore page, the markup `rehypeProseQuotes` writes for them, the words a source line uses to
stage its quote, where the look and its key colour live, and how print and forced colours read it.
Extends the quote figure of 0018 (the callouts' addendum), whose `:source[...]` attribution and callout
kinds stay as they were. Builds on 0060, which puts a species lore's opening, with its epigraph, first
under the hero, and on 0054 for the key colour an entry takes. 0064 records how the design was run. Does
not change the callouts, the booklets' `print.css`, or the content rules of the writing skills.

---

## Context

A lore page opens on an epigraph, and the Scothan page on a dialogue, all Markdown blockquotes closed by a
`:source[...]` line. Until now they rendered as one calm figure: a gold rule, an italic quote and the
source under it (`src/styles/prose.css`). On 2026-11-03 and 2026-11-04 the owner asked for the quote and
the dialogue to be redesigned with Persona 5's in-game interface as their main source, rejected two
rounds (a layered round on 2026-11-03, judged bad interface, and a plainer rebuild, judged ugly), then
picked the third, « La scène », after seeing it live on the gated prototype page. With the pick they kept
the box redrawn under the title at each corner, kept both of its backgrounds for each quote to choose by
mood, and asked for the people a title names to stand on black nameplates, as in the first round. The
rulings and values are in `.claude/skills/aubaine-design/references/rulings.md` and `approved-pieces.md`.

---

## Decision 1: The markup names the speech, the dialogue and their parts

### Decision

- A blockquote with more than one turn, a paragraph that opens on a bold label ending in a colon, is a
  dialogue; any other is a speech. The figure carries `data-quote="speech"` or `data-quote="dialogue"`.
- Each turn carries `data-speaker`, its speaker's place in order of first appearance, so the same speaker
  keeps one side and one tag colour. Its label splits into `au-quote__name` and `au-quote__colon`.
- The outer guillemets of a speech and of each turn, with their spaces, are wrapped in
  `span.au-quote__mark`, inside an `em` too, so the screen can hide them behind one big quotation mark
  while screen readers, copy, print and forced colours keep them.
- One empty `span.au-quote__box`, `aria-hidden`, opens each box (the speech's blockquote, each turn) and
  carries its contour layers. It prints as nothing.

### Rationale

- The look needs to tell a speech from a dialogue, a speaker from the next and a box from its words; the
  markup states each fact once, at build time, so the CSS selects them by attribute and no script runs.
  Verified in `speechOf`, `dialogueOf` and `markEdge` in `src/lib/game/book-markup.ts`, and in 19 cases of
  `tests/unit/prose-quotes.test.ts`.
- The text stays whole: the marks and the colon are spans around the authored characters, never
  removed, so the French keeps its « » wherever the screen design does not apply.

### Alternatives considered

- **Drawing the marks and boxes from CSS alone**: a pseudo-element cannot hide the authored guillemets
  without hiding the words beside them, and a box needs three rings plus a background behind it, more
  layers than a paragraph's two pseudo-elements once the background takes one. Reopened if CSS gains
  more pseudo-element layers per box.
- **Turning « » into “ ” in the French text**, as the round of 2026-11-03 did: it breaks the French
  editorial rule; one ornament on screen replaces the marks instead.

### Addendum (2026-11-04): portraits

- A dialogue turn that opens on a picture takes it as its speaker's portrait: `portrayed` in
  `src/lib/game/book-markup.ts` wraps it in `span.au-quote__portrait`, placed before the box, and asks for
  168, 336 and 504 px candidates with sizes `(width < 40rem) 80px, 168px`. The portrait is optional per
  turn, so an expression can change from line to line; the owner picked this design after seeing two live.
- Without those widths, Astro served the 1254 px masters and the four Scothan portraits weighed 856 KB on
  the page; with them, 144 KB, measured in Chromium at 1512 and 390 px. The local hast type now carries
  number arrays, as hast's own does, so the widths reach Astro's image step, which runs after the
  project's plugins (verified in `@astrojs/markdown-remark`, `dist/index.js`).
- `data/media/art/` accepts 1:1 pictures for these portraits (`tests/data/integrity.test.ts`,
  `docs/runbooks/add-an-image.md`).

---

## Decision 2: The source line stages its quote

### Decision

- Words in braces after the source line's closing bracket stage the quote: a corner, then a background,
  as `:source[...]{bottom-right echo}`. The corners are the closed list `TITLE_CORNERS` and the
  backgrounds `QUOTE_BACKINGS`, both in `src/lib/game/book-markup.ts`; the defaults are `top-left` and
  `tranche` (`DEFAULT_STAGING`).
- Any other word, or a third one, stops the build with the file's name. `tests/data/integrity.test.ts`
  lets the braces close a source line and requires the French and English lines of a page to stage each
  quote alike.
- The figure carries `data-title-corner` (when it has a title) and `data-backing`. A title at a top corner
  comes before the quote in the document, one at a bottom corner after it.
- Every species quote writes its staging: Humain `top-left tranche`, Nnor `top-right tranche`, Elfe
  `top-left echo`, Mort-vivant `bottom-right echo`, Scothan `top-left echo`, chosen for each scene's mood
  and changed by editing the two words.

### Rationale

- The owner asked for the title at any corner and for each quote to take the background that suits it.
  Both are a property of one quote, so they sit on the quote's own line, beside the words that name its
  scene, rather than in the entry's JSON, which a page holding two quotes could not split.
- A closed list that throws mirrors `pictureLook` and `PICTURE_MASKS` in the same file: a typo fails the
  build instead of shipping a default the author did not mean.
- Putting the title where it is seen keeps the reading order, the focus order and the visual order the
  same (WCAG 1.3.2 and 2.4.3).

### Alternatives considered

- **One box shape on every corner, only the title moving**: shown live beside the box redrawn per
  corner on 2026-11-04; the owner kept the redrawn box. Reopened by a new pick.
- **One background for every quote**: the owner kept both. Reopened if one of them is withdrawn.
- **CSS `order` to lift a top title above a quote that the document lists first**, as the prototype did:
  the order seen and the order read would differ. Reopened never for a static choice; only a title that
  moves with the viewport would need it.
- **The staging in the species file**: a field per entry, not per quote; it would also change the schema
  for a presentational choice.

### Caveats

- A title at a top corner now prints above its quote, where the attribution used to print under it.

### Addendum (2026-11-04): the stagings move with their entries

- At the owner's request the Elfe's title moved to `bottom-right echo` and the Scothan's to
  `bottom-left echo`, whose source line also gained where and when the scene happens. The source lines
  hold each entry's current staging; the list above records the first one.

---

## Decision 3: The look lives in `prose.css`, fixed in both themes, for the screen only

### Decision

- `src/styles/prose.css` draws the piece under `@media screen and (forced-colors: none)`: the night box
  with its bone contour, the bone title turned -2°, the big “ in the key colour, the name tags, and the two
  backgrounds (the character sheet's slab, or the box's own silhouette echoed). Its colours are the same
  in both reader themes.
- The night tokens are set on the box surfaces (a speech's blockquote, a dialogue's turns) and light
  tokens on the title, by selector, inside that media query.
- Print and forced colours keep the plain quote: the gold rule, the title in its document order, the names
  in bold, the guillemets and colons back.

### Rationale

- The approved stages already sit on night in both themes (`DESIGN.md`, Dark in both themes); the quote
  is drawn as paper on that night, so a theme change would only weaken it.
- The plain fallback costs nothing: the base rules that rendered the quote before stay, and the screen
  rules override them.
- Measured on 2026-11-04 over every species quote moved through the four corners and both backgrounds,
  in both languages, at six widths from 1512 to 320 px, with and without the text spacing of WCAG 1.4.12:
  960 states, no sideways scroll, every line at least 10.7 px inside its box's contour, the title 19.6 px,
  a tag 6 px and the mark 3.5 px clear of the words (a sweep run from the scratchpad, not kept).
  `pnpm design:audit`: 80 states, 0 problems. `tests/e2e/lore-quote.spec.ts` keeps the same checks at
  1512, 390 and 320 px, reading each box's polygon from the browser.

### Alternatives considered

- **The class `au-dark` on the box in the markup**, as the round of 2026-11-03 did: `src/styles/tokens.css`
  declares the dark tokens on `:root, .au-dark` for every medium, so the plain quote in print and in
  forced colours would take light inks on white. Reopened if `tokens.css` scopes `.au-dark` to the
  screen.
- **The plain quote or the rejected rounds**: refused by the owner on 2026-11-03 and 2026-11-04.

### Caveats

- The night and light token values are repeated from `src/styles/tokens.css` on the quote's surfaces. A
  token changed there must be changed here too.
- `DESIGN.md` principle 12 keeps reading pages calm; the owner set it aside for this piece alone.
- The mark's clearance falls to 3.5 px at its narrowest; a longer word at a phone's width is the first
  thing to measure after a content change.

### Addendum (2026-11-04): the bust

- On screen the portrait is a bust in front of its box on its speaker's side, the second speaker's mirrored
  by CSS to face the first, the art untouched. Its words and tag keep 0.9em clear of it; every bust of a
  dialogue is one size, the box growing to fit it; a dialogue with portraits sets its turns 1.5em apart.
  Print and forced colours leave the portraits out, as they leave the rest of the staging.
- Measured over the Scothan dialogue in both languages, both backgrounds and six widths, with and without
  the text spacing of WCAG 1.4.12: 48 states, 0 problems, every bust at least 7.2 px from any other turn's
  box or background and 17.4 px from its own words. `tests/e2e/lore-quote.spec.ts` keeps it.
- Rejected: a framed portrait set into the box's corner, after Persona 5's navigator balloon, shown live
  beside the bust; reopened if a dialogue needs its boxes narrower than a bust allows.

### Addendum (2026-11-05): each side has its own box

- The right-hand speaker's turn takes a box of its own design, « Pointe »: its end at the speaker sits
  low behind her bust and its foot meets the bust's foot, as the left-hand box does with its portrait,
  and its far end comes to a point aimed at the other speaker. Its echo reaches toward that far side.
  Persona 5 keeps one still box because its speaker never changes sides; Aubaine's dialogue alternates
  sides, so the owner ruled that its own logic decides.
- Rejected on 2026-11-04: the left-hand box mirrored, refused as odd; then the same box turned half a
  turn, refused as too big beside the other and for leaving the bust floating below a raised corner.
  Rejected on 2026-11-05: « Biais », a long slanted far end, shown live beside « Pointe ».
  `tests/e2e/lore-quote.spec.ts` reads a polygon in either winding since the first trial.

### Addendum (2026-11-06): both turns' slopes halved

- The right-hand box's top edge climbs half the rise from its point instead of the whole rise
  (« Pente douce »), since her words start at the low point and the full slope left an empty wedge above
  them. The point and the end behind her bust keep their places.
- The left-hand box then took the same slope: its far end sits at half the rise, its end behind the bust
  where it was, so both sides of a dialogue climb alike. A single speech keeps its full rise.
- Rejected on 2026-11-06, shown live beside it: her first line following the slope through a
  `shape-outside` float, which left a short first line and the room at the bottom instead; a top edge
  rising to her tag and falling behind her bust; a level top.
- Measured over the Scothan dialogue as in the portraits addendum: 48 states, 0 problems, the same 7.2 px
  and 17.4 px.

---

## Decision 4: The key colour reaches the quote through the reading column

### Decision

- `Species.astro` and `Tree.astro` set `--key` and `--key-paper` on their reading columns, with
  `readingKeys` in `src/lib/key-colour.ts` over `keyOf` in `src/lib/art-key-colour.ts`, the same key the
  sheet above takes. The quote reads them; anywhere else it falls back to house gold `#efbe04`.

### Rationale

- One function computes an entry's key for every place (`keyOf`, already used by `src/lib/game/hub-cards.ts`),
  and the quote takes the key of the page it sits on without the markup knowing the entry.
  `CharacterHero.astro`, an approved piece, is left untouched.

### Alternatives considered

- **Setting the key on the view's root**: it would also reach the sheet, which sets its own and must not
  change. Reopened never; the reading column is the quote's container.

---

## Decision 5: The people a title names stand on black nameplates

### Decision

- Every person a source line names is bold in the source; inside the title a bold run prints on a black
  plate in bone Cinzel capitals with a 2 px edge in the key colour, 0.24em clear of the punctuation after
  it.

### Rationale

- The owner asked for the nameplates of the first round back after seeing names only in a heavier
  weight. Bold is the Markdown the source already used for its speakers, so no new syntax enters the
  lore files. Contrast measured: 15.9 to 1 for the plate's letters.

### Alternatives considered

- **A name syntax of its own**: a second way to mark the same thing; reopened if a title must embolden a
  word that is not a person.

### Caveats

- The space kept before a comma after a plate reads as a gap in English (« Queen Tiar Vyrefiel , »); the
  ruling that punctuation clears a dark plate keeps it.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| `rehypeProseQuotes`, `TITLE_CORNERS`, `QUOTE_BACKINGS` | markup and staging | `src/lib/game/book-markup.ts` |
| The quote's screen rules | the look | `src/styles/prose.css` |
| `readingKeys` | the key colour on the reading column | `src/lib/key-colour.ts`, `Species.astro`, `Tree.astro` |
| Source-line staging and its parity | the data check | `tests/data/integrity.test.ts` |
| Geometry, corners, fallbacks | the guard | `tests/e2e/lore-quote.spec.ts`, `tests/unit/prose-quotes.test.ts` |
