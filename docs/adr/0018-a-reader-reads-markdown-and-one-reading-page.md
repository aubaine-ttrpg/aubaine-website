# ADR: A reader reads Markdown, and every text page is the same page

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-23
**Revised:** 2026-09-26, the tree page renders the grid for its lore only, and its rail ends on the
tree section that follows it (0025)
**Deciders:** Kori
**Scope:** Where long-form prose that a reader reads is authored, and how the four surfaces that
carry it are laid out: the book chapter, the policy page, the Species page and the skill tree page.
Reverses Decision 3 of 0014, which chose a JSON block array for Species lore. Extends 0011, which
made the equipment guide its own Markdown file, and 0017, which set the measure and the scale. Does
not cover the data model for anything that is not prose (0002), the overlay mechanism (0003) or the
schema contract (0004).

---

## Context

Two problems arrived together and turned out to be one.

Species and skill tree lore was an array of `{ title?, art?, text }` blocks inside the entity JSON.
A block could not hold a table, a list, a sub-heading or a second picture, the picture side was
computed from the block's rank rather than authored, and the English overlay was keyed by the
block's index as a string, so inserting a block at the top of a Species silently shifted every
translated heading by one.

Meanwhile the book chapter and the policy page had each grown their own sticky rail. The two put
their reading column on the same pixel but wore unrelated CSS: `Book.astro` drew a `border-right`,
a hairline under every row, a filled current row and 16px bold titles, while `Policy.astro` drew
plain 14px links and no rules at all. Two objects doing one job, so the pages did not read as the
same site, and a third and fourth surface had nowhere to inherit from.

---

## Decision 1: Prose a reader reads is Markdown under `data/`

### Decision

- Species and skill tree lore lives in `data/lore/species/<id>.md` and
  `data/lore/skill-trees/<id>.md`, with an `.en.md` twin, in a `lore` collection declared in
  `src/content.config.ts`.
- The collection carries no frontmatter contract: its schema is `z.object({}).strict()`. The page
  title is the entity's `name`, already in its JSON, and the outline comes from the `##` headings.
- `loreBlock`, `species.lore`, `skillTree.lore` and both `overlays.*.lore` records leave
  `src/lib/game/schema.ts`. `src/components/primitives/Lore.astro` is deleted.
- `renderProse` in `src/lib/game/prose.ts` gains `'lore'` in its collection union and a `loreFor`
  helper that resolves the canonical file, the locale twin and the render in one call.
- A picture is an ordinary Markdown image with a relative path, `![](../../media/art/<file>)`.

### Rationale

- The capability was already built and only the gate was in the way. `rehypeCodexTerms` returns
  early unless the file path contains `/data/`, verified at `src/lib/game/book-markup.ts:190`, and
  it picks the term index by the `.<locale>.md` suffix at `:98-99`. Lore under `data/` therefore
  gets `[[State]]`, `{{Competence}}`, bare keyword pills and `:icon[set:name]` with no new code.
- Relative Markdown images already reach `astro:assets`. `remarkCollectImages` collects any source
  that is neither a URL nor absolute and `rehypeImages` resolves it against the file, so a lore
  picture is served as a `srcset` and stamped by the custom image service registered at
  `astro.config.mjs:22-26`. The built page at `dist/fr/espece/humain/index.html` carries seven
  widths and a `rights` attribute on each lore picture.
- The move deletes an index-keyed overlay. A translated heading was bound to a block's position in
  an array; it is now bound to nothing, because `humain.en.md` is a whole file.
- 0011 already settled the shape for authored prose that is not a book chapter: a file of its own,
  an `.en.md` twin, its own collection. This applies the same answer to the same question.

### Alternatives considered

- **Keep the JSON blocks and widen `loreBlock`**: rejected because every widening reinvents a piece
  of Markdown inside a strict schema, and the block array still cannot express a table or ordered
  prose. It would reopen only if lore had to be rendered by something that cannot run a Markdown
  processor, which is not the case: the print route does not render lore at all.
- **MDX**: rejected because `@astrojs/mdx` is not a dependency and the processor already passes raw
  HTML through, configured with `allowDangerousHtml` inside `@astrojs/markdown-remark`. It buys a
  component syntax nothing has asked for. It reopens if a lore page needs a live island.
- **A remark directive resolving `art:` filenames the way `Banner.astro` does**: rejected because
  the relative path already resolves through the same pipeline with nothing authored, and a
  directive would be a second way to say the same thing.

### Caveats

- The English lore files repeat the French placeholder body under translated headings, which is
  exactly what the index-keyed overlay produced before, because no lore body has ever been
  translated. The duplication is now visible in the file rather than implied by a fallback.
- `treeContentHash` in `src/lib/booklet/fingerprint.ts` hashes `data/skill-trees/<id>.json`. Two
  trees lose their `lore` bytes, so their booklet content hash moves once. After that a lore edit
  no longer changes a PDF that never printed lore, which is the coupling 0011 argues against.
- `tests/data/integrity.test.ts` no longer checks a declared `art` field for lore. It now resolves
  every Markdown image in `data/lore/` against `data/media/art/` and fails on anything pointing
  elsewhere, so the ratio and rights checks that 0014 worried about still see every picture.

---

## Decision 2: One reading grid and one aside, in `src/styles/reading.css`

### Decision

- `src/styles/reading.css` owns `.au-reading`, `.au-reading__head`, `.au-reading__body`,
  `.au-aside` and `.au-trail`. It is a plain stylesheet imported by the views that need it, the way
  `src/styles/prose.css` already is.
- The text column sits on the centre of the viewport, and the rail is not part of it. Above `76rem`
  the grid is `minmax(0, 1fr) min(var(--measure), 100%) minmax(0, 1fr)` inside the site's 1560px
  shell, and the rail takes the first track at `justify-self: start`, so it is pinned to the left of
  the shell rather than glued to the text. Below `76rem` the page is a single column.
- The rail spans `grid-row: 1 / span 2`, so it starts level with the first thing in the column on
  every page. On a policy page that is the masthead in row 1; on a chapter, a Species or a tree,
  row 1 is empty and the rail starts level with the text.
- The content column is exactly `--measure`, so the paragraph, the heading, the rule under it, the
  chapter title, the picture and the table all share one left edge and one right edge.
- `--measure` moves from `40rem` to `48rem` in `src/styles/tokens.css`, which is the column widening
  to the right that the decider asked for.
- `src/components/primitives/SectionTrail.astro` renders every list of this kind: the chapter list,
  the sub-chapter outline nested under the current chapter, the policy outline, the lore outline and
  the other books. A section carries `text`, `href` and optionally `num`, `current`, `download` and
  one level of nested `sections`.
- The rail holds navigation within the current reading only. On a chapter the other books and the
  version history close the chapter in a `<footer data-book-footer>` after the pager, inside
  `#book-body`, so Swup swaps it with the chapter it belongs to. `.au-eyebrow` labels both.
- The rail carries no `border-right`. Rows carry a hairline, the current row carries `--hover` and a
  `--gold` left rule, and every entry is numbered.
- `Book.astro`, `Policy.astro`, `Species.astro` and `Tree.astro` all render that grid. The full
  bleed heroes above it are untouched.

### Rationale

- Astro scoped styles cannot be shared, which is why the rail existed twice. A plain stylesheet
  imported per view is the pattern the repository already uses for `.au-prose`, imported by
  `Book.astro`, `Policy.astro` and `Browse.astro`, and it keeps the CSS out of the bundle for views
  that render no prose.
- The decider asked for this shape three times, in these words: the text centred, expanding further
  to the right, with the rail and the text not behaving as one element. The intermediate version
  that centred the rail and the text together as a single block is what they were rejecting, and it
  is recorded as an alternative below rather than argued with again.
- The reference the decider named, a class page on D&D Beyond, runs a content area much wider than
  its paragraphs: measured off their screenshot, the rule under a section heading is about 1.7 times
  the width of the text under it. That was built first and then reverted, because the gap between
  where a paragraph stops and where its own rule stops is the first thing a reader notices on a page
  that carries no floated illustration, which is every book chapter and every policy page here.
- Measured on the built site, the column centre equals the viewport centre at 1280, 1501, 1920 and
  3000px, and the column is 768px at all four. The rail reports `x=26`, `26`, `206` and `746`, the
  last two because the 1560px shell is centred once the viewport exceeds it.
- Every text element still shares an edge inside that column: the chapter title, the prose `h2`, its
  rule and the paragraphs all start and stop together, which is the constraint Decision 2 acquired
  when the wide-column arrangement was reverted.
- The breakpoint is arithmetic, not taste. Below `76rem` the side tracks cannot hold the rail
  without the column collapsing, so the page stacks instead.
- Unifying the two rails also fixes a contrast defect rather than leaving it as a separate chore.
  The book trail rested on `--ink3` and hovered to `--gold`; 0017 Decision 3 records `--gold` at
  3.59:1 in the light theme. The shared trail rests on `--ink2`, moves to `--ink`, and uses gold
  only to draw a line.

### Alternatives considered

- **Strip the book rail down to the policy rail**: rejected by the decider, who asked to keep the
  decoration. The policy rail was raised to the book's instead, which is why a policy section is now
  numbered like a chapter.
- **A recursive `SectionTrail`**: rejected because one level of nesting is all four surfaces need
  and `Astro.self` would buy generality nothing consumes.
- **Keep the three separate breakpoints already in the tree (1280px in `Book.astro`, `60rem` in
  `Policy.astro`, 900px in `Lore.astro`)**: rejected because the policy rail provably overflowed its
  track below roughly 1376px, and three breakpoints for one layout is three chances to disagree.
- **Centre the rail and the column together as one block, with equal page margins**: shipped and
  reverted the same day. It is what the named reference does, and it is the only arrangement that
  removes the empty right side, but it makes the rail and the text read as a single element sitting
  off the centre of the page, which the decider rejected explicitly. It reopens only if the empty
  right margin becomes the greater complaint.
- **A content column wider than the measure, with the paragraphs capped inside it**: the reference's
  own arrangement, shipped second and reverted within the hour. Rejected because the rule and the
  paragraph stopped in different places. It reopens if a lore page ever floats its illustration
  beside the text the way the reference does, since the float is what fills that space there.

### Caveats

- The rail is a single-axis scroll container, so it declares `overflow-x: clip` as 0017 Decision 4
  requires. A future rail that forgets this reintroduces the two-axis scrollbar that decision was
  written for. The rail is pinned to the left of the shell with its own width rather than padded
  toward the text, so the scrollbar it grows when its content is taller than `--sticky-max` paints
  at the rail's own right edge, clear of the prose.
- Between `60rem` and `76rem` the policy page loses the sticky rail it used to have and stacks the
  outline above the text. That is deliberate: below `76rem` the rail was either overflowing or too
  narrow to read.
- The lore picture now sits inside the reading column rather than in the page gutter, because the
  rail owns the left gutter and they cannot both have it. At the 1560px shell the gutter figure was
  434px wide and the column figure is 768px, so the picture is larger, but the alternating left and
  right rhythm that 0014 described is gone.
- Centring the column on the viewport while the rail sits to its left forces the right margin to
  equal the whole left gutter: the page padding plus the rail plus the gap. It is 366px at 1501px
  and 1116px at 3000px, and nothing inside this arrangement can reduce it. The empty right side is
  the accepted cost of the decider's instruction, and the alternative that removes it is recorded
  above.
- `--measure` at `48rem` is about 84 characters at the top of the `--prose-body` clamp, above the 45
  to 75 that typographic guidance gives and above the 74 that `40rem` produced. Line height is 1.7,
  which carries a long line better than a tight one would, but this is a readability cost taken on
  instruction and it should be the first thing revisited if the pages read as tiring.

### Addendum (2026-09-26): the tree page ends on a section outside the grid

`Tree.astro` still renders this grid, for its lore. The plate no longer sits above it. The tree now
follows it in a full-width « Arbre de compétences » section, with the plate on the left and a detail
pane on the right, and the rail's last entry points there (`#arbre`) rather than to a list of skills.
The measure, the rail and the breakpoint above are untouched. The tree section takes its side by side
layout from the same `76rem`. 0025 Decisions 1 and 3 record the section.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| `lore` collection | Species and tree prose, French canonical, `.en.md` twin | `src/content.config.ts`, `data/lore/` |
| `loreFor` | Resolves canonical, locale twin and render | `src/lib/game/prose.ts` |
| `reading.css` | The grid, the rail and the trail | `src/styles/reading.css` |
| `SectionTrail.astro` | Every list inside a rail | `src/components/primitives/` |
| `prose.css` | The scale, and now `img`, `figure` and `figcaption` | `src/styles/prose.css` |
