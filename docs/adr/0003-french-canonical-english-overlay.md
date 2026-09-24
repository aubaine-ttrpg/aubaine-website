# ADR: French is canonical, English is a sidecar overlay

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kori
**Scope:** How a second language is stored, merged, and fallen back to for everything under `data/`.
Does not cover which URL a locale gets (0005), nor the UI strings of the site chrome, which live in
`src/lib/i18n/strings.ts` and are fully translated in both languages.

---

## Context

Aubaine is written in French. Every skill description, item, state, and book chapter in the corpus is
French prose, and the game's vocabulary is defined in French. English exists as a translation, and
at the time of writing almost none of the game content has one.

The old specification already settled the principle: language neutral identifiers, with text held in
per-language catalogues, and a content package that declares its fallback language. What was open was
the file layout that implements it.

---

## Decision 1: The canonical file carries the structure and the French

### Decision

- `data/skills/RAGER-01.json` holds the identity, the numbers, the relationships, and the French
  text. It is the file of record.
- Identifiers are language neutral and never change between locales: skill ids, tree ids, state
  keys, section keys, domain and characteristic keys, item slugs.
- Deleting every translation leaves a complete, correct, publishable French site.

### Rationale

- It matches how the game is actually written. The designer authors in French; a translation is a
  later, optional pass over finished text.
- It keeps the structural data in exactly one place. Position, tier, cost, and links are not
  language dependent, so they must not be duplicated per locale where they can drift apart.

### Alternatives considered

- **A full per-locale tree, `data/fr/...` and `data/en/...`**: rejected. It duplicates every
  position, tier, link, and cost. A node moved on the plate would have to be moved twice, and the
  two copies would silently diverge.
- **Inline locale maps on every translatable field**: rejected. Every French file becomes twice as
  noisy to edit for a translation that mostly does not exist, and diffs of ordinary French authoring
  get wider for no benefit.

---

## Decision 2: A translation is a sidecar keyed by the same identifier

### Decision

- `data/skills/RAGER-01.en.json` sits beside the canonical file and holds only translatable strings.
- The pattern is `<name>.<locale>.json` for data and `<name>.<locale>.md` for book pages, in the same
  directory as the original.
- An overlay is partial by design. It may translate one field and omit the rest.
- Nested collections are keyed by their stable identifier rather than by array position: upgrades by
  their `level`, set bonuses by their `pieces`, catalogue sections by their key. An overlay never
  relies on ordering.

### Rationale

- The canonical French file is untouched by translation work, so a French edit and an English edit
  never collide in the same file.
- Keying by identifier rather than index means reordering the base array cannot silently reattach a
  translation to the wrong entry.
- The shape is discoverable. A translator looking at `data/states/` sees immediately which states
  have an English version and which do not.

### Caveats

- Five overlays exist today, covering the four books and the Common Bank list. The game content is
  effectively untranslated, and the site is honest about that by falling back rather than by hiding
  the gap.

---

## Decision 3: A missing translation falls back to French and does not fail the build

### Decision

- `overlayLookupFrom` in `src/lib/codex/build.ts` returns a no-op lookup when the locale is the
  default, so the French build does no merge work at all.
- For another locale, a key present in the overlay wins; a key absent falls back to the canonical
  value.
- An overlay that does not match its expected shape is ignored rather than fatal, because a
  malformed translation must not take the site down.
- An overlay that points at a file which does not exist is a build failure, asserted in
  `tests/data/integrity.test.ts`.

### Rationale

- Partial translation is the normal state of this project for the foreseeable future, so it has to
  be the well supported path rather than an error case.
- The asymmetry is deliberate. A missing translation is expected and harmless; an overlay targeting
  nothing is a typo in a filename and will never be noticed otherwise.

### Caveats

- An English page can therefore contain French rule text. That is a real cost, and it is chosen over
  the alternative of either blocking the English site entirely or shipping machine translated game
  rules. `.claude/rules/content/i18n.md` warns against silently replacing missing primary content on
  an indexable localized URL; the mitigation is that identity, navigation, and chrome are fully
  translated, so only the untranslated body text falls back.
- Nothing yet surfaces per-locale coverage to the author. The integrity tests prove every locale
  builds with the same entity counts, but they do not report how much of it is still French.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Canonical file | Structure, identifiers, French text | `data/skills/RAGER-01.json` |
| Overlay | Translated strings only, partial | `data/skills/RAGER-01.en.json` |
| Book page overlay | Same rule for prose | `data/books/<book>/<NN-slug>.<locale>.md` |
| Merge and fallback | Overlay wins per key, otherwise French | `src/lib/codex/build.ts` |
| Orphan overlay | Build failure | `tests/data/integrity.test.ts` |
