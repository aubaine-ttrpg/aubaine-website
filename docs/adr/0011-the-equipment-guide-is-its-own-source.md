# ADR: The equipment guide is its own source

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-22
**Revised:** 2026-09-22, the guide is player facing rules prose, not a second register
**Deciders:** Kori
**Scope:** Where the prose that opens the equipment booklet and answers the help button on
`/fr/equipement` is authored, and why it is not the player's book chapter that already covers the
same mechanic. It does not cover the booklet's structure, which follows the printed layout, nor the
markup those two surfaces share.

---

## Context

The equipment booklet opens on a prose leaf, so a reader meets the procedure before the list. The
website wanted the same thing behind a help button next to the download. `data/books/livre-du-joueur/07-l-equipement.md`
already teaches the mechanic: the eight slots, finding materials, crafting, sets and currency.

Reusing that chapter is the obvious move, and it is the one the previous implementation made. It
also means the same prose prints in two booklets, and it binds a rule chapter to a help panel that
wants to answer a different question.

---

## Decision 1: The guide is a file of its own

### Decision

- The prose lives at `data/equipment/guide.md`, with an `.en.md` twin, in its own `equipmentGuide`
  collection declared in `src/content.config.ts`.
- It is seeded from chapter 07 and diverges from it. Neither file derives from the other, and
  neither is generated.
- It feeds two surfaces: the tutorial leaf in the equipment booklet, and the `:target` help overlay
  on the equipment index.

### Rationale

- The two texts answer different questions. Chapter 07 is rule text: it states what a slot is and
  what a crafting roll costs. The guide is help: it tells a reader how to read the catalogue in
  front of them. They start alike and are expected to drift, which is the point.
- `data/books/` is the book. A chapter is a page of a named book with a slug, a place in a reading
  order and a numeric prefix, enforced by `tests/data/integrity.test.ts`. The guide has none of
  those and belongs to the catalogue, not to a book.
- Printing chapter 07 in the equipment booklet would put the same leaves in two PDFs, and a reader
  who owns both would meet the same page twice with no way to tell which was canonical.

### Alternatives considered

- **Render chapter 07 in the booklet**: rejected because it publishes one text in two places and
  couples a rule chapter's edits to a second PDF's content hash. It would be reopened if the two
  texts were found to stay identical over several revisions, which would mean the distinction was
  imagined.
- **No tutorial leaf, help panel only**: rejected because the printed booklet is the canonical
  layout, and the original argued the ordering: a reader meeting the catalogue needs the procedure
  first.
- **A third book whose only chapter is the guide**: rejected as ceremony. It would buy a slug and a
  reading order that nothing reads.

### Addendum (2026-09-22): both files are rules prose

The record first argued the split on register: chapter 07 as rule text, the guide as help. That
distinction did not survive contact. The guide is now official player facing rules prose in the
same register as a book chapter, and the split stands on ownership instead: the guide belongs to
the catalogue and opens the equipment book, the chapter belongs to the player's book and is read in
its reading order. Neither derives from the other.

### Caveats

- The two files will disagree at some point, and nothing detects it. That is the intended
  behaviour, not a gap to close: they are owned by different books.
- The guide is not translated by an overlay but by a sibling `.en.md`, the same way a chapter is.
  It therefore follows the book convention rather than the JSON overlay convention.

---

## Decision 2: Term marking applies to authored prose, not to books

### Decision

- `rehypeCodexTerms` in `src/lib/codex/book-markup.ts` marks any Markdown under `data/`, not only
  Markdown under `data/books/`.

### Rationale

- The plugin returned early unless the file path contained `/data/books/`, so `[[Caché]]` and
  `{{Parade}}` in the guide would have rendered as literal brackets with nothing to warn the author.
- The gate was never about books. It was about telling authored game prose apart from any other
  Markdown the processor might see, and `data/` is the boundary that actually expresses that.
- `tests/data/integrity.test.ts` now validates the guide's references alongside the chapters', so a
  name that does not resolve fails `pnpm data:check` rather than reaching a page.

### Alternatives considered

- **Widen to an explicit list of two folders**: rejected because it would need editing again for the
  next authored prose file, and the list would be a copy of what `data/` already says.
