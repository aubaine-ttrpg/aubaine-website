# ADR: « Noms » opens on the naming custom and reads every list of a people

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-11-08
**Deciders:** Kori
**Scope:** The « Noms » section of a species page in `src/components/views/Species.astro`, the
`naming` field of `src/lib/game/schema.ts`, and where a sub-species' name lists and a shared family
list read. Extends 0073 Decision 1 to every species with names, moves the sub-species lists of 0019
Decision 1 into « Noms », narrows 0053 Decision 4, and settles the names caveat of 0060 Decision 1.
Leaves the order of the parts of 0060, every anchor and the name lists themselves unchanged.

---

## Context

On 2026-11-07 the decider asked for a short paragraph on how each people gives its names, the way
the Player's Handbook opens each people's names section, and chose a new paragraph of about 60 words
over moving the lore text, with every Humain and Nnor list in « Noms »
(`tmp/lore-runs/2026-11-07-elfe-revise/request.md`, « Round 3 »). Until then « Noms » showed only the
lists of a species without sub-species (0073), each sub-species showed its lists in its own
presentation, and the naming customs were lore: the chapters « Noms humains » and « Noms nnors »,
printed after the pool, and two paragraphs of « La Matriarchie » on the Elfe page.

---

## Decision 1: « Noms » opens on the custom, then the people's lists, then each sub-species

### Decision

- « Noms » shows for every species with a `naming` paragraph or a name list, after the sub-species
  and before the pool, as one outline entry anchored `#noms`.
- It reads in this order: `naming`, rendered as rule text; the people's own lists with no heading,
  `names` or, for a species with sub-species, `familyNames`; then, for each sub-species with lists, an
  `h3` with its name and its table, in the order the species file declares them.
- A sub-species presentation keeps its text, its heraldry and its imposed Compétence, and lists no
  names.

### Rationale

- The decider chose the new short paragraph and every list in « Noms » on 2026-11-07.
- The Player's Handbook gives each people's custom before its lists, in 30 to 120 words
  (`.claude/skills/aubaine-lore/references/research.md` § Naming customs, read 2026-11-08).
- The shared lists come first so that assistive technology reads them under « Noms », never under the
  last sub-species heading.
- `tests/e2e/species-page.spec.ts` reads the section of every species with names, in both languages,
  against the corpus, and checks that a sub-species presentation lists no names.

### Alternatives considered

- **Move the lore's naming text into « Noms » whole**: offered to the decider, who chose a new short
  paragraph instead. Reopens on the decider's request.
- **Keep each sub-species' lists in its presentation**: declined by the decider, who chose every list
  in « Noms ».
- **Shared lists after the sub-species groups**: rejected because the last `h3` would head them for a
  screen reader.

### Caveats

- The sub-species headings in « Noms » repeat the headings of the presentations above. They carry no
  anchor, so the outline and every link keep pointing at the presentations.
- The other species are drafts with neither a naming paragraph nor lists, so their pages show no
  « Noms » until the decider writes their custom.

---

## Decision 2: The naming custom is `naming` in the species file

### Decision

- The species file takes `naming`, a non empty string written before `names`, with the markup of a
  Compétence. The English overlay translates it, and an untranslated paragraph keeps its French
  labels, as `roleplay.text` does (`inherited` in `src/lib/game/build.ts`).
- The naming custom leaves the lore: « Noms humains », « Noms nnors » and their English chapters go,
  and so do the elves' two naming paragraphs. `tests/data/integrity.test.ts` refuses a name list in
  any lore page.
- `aubaine-content` writes the paragraph from the lore brief's fact map, as it writes
  `roleplay.text` (0050 Decision 1).
- The schema refuses `familyNames` beside a sub-species' own `names.family`, so the family list read
  once at the top of « Noms » belongs to every sub-species.

### Rationale

- « En jeu » reads the species file, and the paragraph sits beside the lists it explains.
- One owner per surface (0050 Decision 1): the reader prose of a species file stays with
  `aubaine-content`.
- No species file declared both family lists, so the refusal changed no data
  (`data/species/nnor.json`, the only file with `familyNames`).

### Alternatives considered

- **Keep the custom as a lore section and cut it out of « Histoire » in the loader**: rejected
  because a lore section is told as history, and the cut of 0060 Decision 2 would gain a second rule.
  Reopens if a people's naming custom grows into history of its own.
- **Let a sub-species replace the shared family list**, as 0053 Decision 4 allowed: rejected because
  the list read once would then not be every sub-species' list. Reopens with the first people that
  needs it, together with a per-sub-species heading for that list.

### Caveats

- Each short paragraph leaves out details of the lore text it replaces; the decider reviews every
  dropped detail before the change is committed.
