# ADR: A people's name lists are data, and a species without sub-species reads them under « Noms »

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-11-07
**Revised:** 2026-11-08, every species with names reads them under « Noms », which opens on the `naming` paragraph (0074, addendum in Decision 1)
**Deciders:** Kori
**Scope:** Where a species page shows its name lists when the species has no sub-species, and the two
contract fields that carry them, `names` and `givenNamesLabel` in `src/lib/game/schema.ts`. Extends
0051 Decision 3 (the `given` list and its label) and settles for such a species the names caveat of
0060 Decision 1. Leaves `familyNames` and 0053 Decision 4 as they are, and does not change how a
sub-species shows its names (0019).

---

## Context

Humain and Nnor carry their name lists in `data/species/humain.json` and `data/species/nnor.json`,
on each sub-species, and the page shows them in « En jeu » (0060). The schema gave names only to a
sub-species, so the Elfe, which has none, kept its two lists in its lore page as definition lines,
in a « Noms elfes » chapter printed after the pool. On 2026-11-07 the decider asked for the lists to
read under « En jeu », in a section of their own, with the elves' own label « Noms mixtes ».

---

## Decision 1: A species without sub-species shows its names in a « Noms » section of « En jeu »

### Decision

- The section is titled « Noms » / "Names" (`speciesNames` in `src/lib/i18n/strings.ts`), anchored
  `#noms` in both languages as `#jouer` is, and placed after `Origines régionales` or `Sous-espèces`
  and before the pool. Its outline entry sits in the same place.
- It holds a table of the lists, one row per list, labelled as a sub-species table labels them.
  `nameRows` in `src/components/views/Species.astro` builds the rows of both tables.
- A name list is data. The lore file holds the naming customs alone, and the Elfe lore loses its
  « Noms elfes » chapter, whose two customs paragraphs already sat in « La Matriarchie ».

### Rationale

- The decider chose a section of its own on 2026-11-07, over rows in the « Jouer un Elfe » table.
- A player reads the names at creation. 0060 Decision 1 recorded as a caveat that a lore section
  printed them after the pool.
- The two lists in `data/species/elfe.json` equal the committed lore lines name for name and in
  order, checked by script against `git show HEAD:data/lore/species/elfe.md`.
- Built before and after the change, the Humain, Nnor and Mort-vivant pages differ only in the hash
  of one script bundle, so the shared `nameRows` changed no sub-species table.

### Alternatives considered

- **Two rows at the end of the « Jouer un Elfe » table**: offered and declined by the decider.
  Reopens on the decider's request.
- **Keep the lists in the lore**: rejected for the reason in the rationale.

### Caveats

- `#noms` is a fixed anchor. A lore heading that slugs to `noms` would collide with it, so
  `tests/e2e/no-javascript.spec.ts` checks that every id on a species page is unique.

### Addendum (2026-11-08): every people's names, and its custom, read in « Noms »

- 0074 extends this decision to every species with names: « Noms » opens on the species file's
  `naming` paragraph, then the people's own lists, then each sub-species' lists under its name.
- The lore file no longer holds the naming customs either, so the sentence above that it holds them
  alone gives way to 0074 Decision 2. The Scope's « Leaves `familyNames` and 0053 Decision 4 as they
  are » gives way to the same decision.

---

## Decision 2: The contract gains `names` on a species and `givenNamesLabel`

### Decision

- A species without sub-species takes `names`, the same lists a sub-species takes (`masculine`,
  `feminine`, `given`, `family`), defined once as `peopleNames`. The schema refuses it beside
  `subspecies`.
- `givenNamesLabel` heads the `given` lists of the species and of its sub-species, as
  `familyNamesLabel` heads the family lists: « Noms mixtes » for the elves, « Prénoms » when absent.
  The English overlay translates it, "Mixed names".
- `familyNamesLabel` also accepts the species' own `names.family`.

### Rationale

- The decider kept « Noms mixtes » on 2026-11-07, over the site's « Prénoms ». The elves' first names
  do not follow gender, which is what `given` means (0051 Decision 3), so only the heading differs.
- Names never have an overlay (`docs/runbooks/add-a-species.md`), so a label that translates lives
  beside the lists, as `familyNamesLabel` does.

### Alternatives considered

- **Fold `familyNames` into a species `names` that sub-species inherit list by list**: one home for
  family names, but it migrates the Nnor's file and 0053 Decision 4, which this request did not
  touch. Reopens on the decider's request.
- **Write « Prénoms »**: declined by the decider.
