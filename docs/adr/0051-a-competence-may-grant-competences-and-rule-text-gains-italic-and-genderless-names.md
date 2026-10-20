# ADR: A Compétence may grant Compétences, rule text gains italic, and a sub-species may list names without gender

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-20
**Deciders:** Kori
**Scope:** Three extensions of the content contract that the Nnor migration needed: `grants` on a
skill, an italic mark in rule text, and a `given` name list on a sub-species. Amends 0010 Decision 2
(the ownership ladder gains a rung). Does not cover the model of species and sub-species (0019), the
reference syntax (0029), or the writing skills that produced the migration (0050).

---

## Context

The owner's decisions for the Nnor on 2026-10-20 asked for three things the contract could not
express, each checked against the files before this change:

- Forme draconique gives a dragon its breath, claws, flight and bite as Compétences of their own.
  A skill entered the term index only through a tree, a skill list, a species pool or an equipment
  grant (`buildTermIndex` in `src/lib/game/build.ts`), so a Compétence that only another Compétence
  gives could not be referenced, and `pnpm data:check` would refuse every `{{...}}` to it.
- The same entry closes on an italic piece of advice. `MARKUP` in `src/lib/game/richtext.ts` parsed
  `***bold***` and references only, and the integrity test refused any other run of asterisks.
- The Nnors de Charon carry first names that are not sorted by gender. `subspecies[].names` in
  `src/lib/game/schema.ts` required `masculine`, `feminine` and `family` together.

---

## Decision 1: A Compétence may grant Compétences

### Decision

- The `skill` schema gains `grants`, an optional list of skill ids, placed after `tags`. It mirrors
  `grants` on an item and on a set tier.
- `SkillOrigin` records the granting Compétences. The skills index lists a granted Compétence with
  the source « Accordée par une Compétence » and the granting title, and the term index links it to
  its entry there.
- The granting Compétence's entry lists what it grants, through `Grants.astro`, the component the
  item entry now uses too.
- `tests/data/integrity.test.ts` refuses a grant that does not resolve, a Compétence that grants
  itself through any chain of grants, and a granted Compétence that a skill list or an Espèce also
  offers.

### Rationale

- The item already had the shape, so a skill takes the same field, the same origin record and the
  same rendering; one component now draws both, instead of two copies of the same block.
- Keeping a granted Compétence out of every list and pool keeps it from being bought or picked at
  creation: it is played only while the granting Compétence allows it.

### Alternatives considered

- **Write the breath, claws, flight and bite inside Forme draconique**: declined by the owner. It
  would make one entry carry five rules.
- **Offer them through the Charon sub-species**: rejected. They would become choices at creation and
  purchases in the Banque Commune.

---

## Decision 2: The ownership ladder gains a sixth rung

### Decision

- A Compétence that writes no `status` and that another Compétence grants takes the status that the
  granting Compétence resolves to, after the five rungs 0010 Decision 2 and `docs/data-contract.md`
  list.
- The resolution walks the chain of grants with a guard against loops, which the integrity test
  also refuses.

### Rationale

- A granted Compétence is part of the one that grants it, so it should move from playtest to
  balanced with it, as a skill on a tree moves with its tree.

### Alternatives considered

- **Write a status on each granted Compétence**: rejected. It drifts the day the granting Compétence
  is promoted and the four granted ones are not.

---

## Decision 3: Rule text gains an italic mark, and a sub-species may list names without gender

### Decision

- `*italique*` sets italic in rule text. `MARKUP` reads `***bold***` first, then `*italic*`, then a
  reference. A new `italic` run renders as `<em>` in `RuleText.astro`, `RichText.astro` and
  `book-markup.ts`, and `flattenText` strips the mark. The integrity test accepts runs of one or
  three asterisks and refuses an asterisk left unpaired. A reference written inside either mark
  prints as text, which `keywords-and-markup.md` says.
- `subspecies[].names` keeps `masculine`, `feminine` and `family`, and gains `given`. Each list is
  optional, and at least one is present. `Species.astro` renders the lists a sub-species has, and
  `given` prints under « Prénoms ».

### Rationale

- The owner asked for the italic line, and a mark the renderer does not parse would print its
  asterisks on the page. Markdown already owns emphasis in chapters, so text nodes reaching the
  parser there carry no asterisk; no escaped asterisk exists under `data/books/`, `data/lore/` or the
  equipment guide.
- A people whose names do not follow gender is canon for the Nnors de Charon, which reproduce on
  their own (`data/lore/species/scothan.md`). Forcing their names into masculine and feminine lists
  would assert a fact the canon denies.

### Alternatives considered

- **A plain closing sentence instead of italic**: declined by the owner.
- **The Charon names in the lore page only**: declined by the owner; the alpine names would sit in
  the data and the Charon names would not.

### Caveats

- Bold and italic cannot nest, and neither can hold a reference. No entry needs either today.
