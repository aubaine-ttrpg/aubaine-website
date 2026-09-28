# ADR: The Mage brings the Éther Domaine, the Glyphe and Mana rule terms, and learning a Sort by inscription

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-28
**Deciders:** Kori
**Scope:**
- **Covers:** four choices made to build the Mage archetype in `data/skill-trees/mage.json`:
  - a Domaine that no Domaine tree owns;
  - two rule terms written for reuse;
  - a skill that learns Sorts outside their Arbre and discounts that learning;
  - a tree that stops using the `core` emblem.
- **Does not cover:** the rule text of the sixteen Mage skills, which lives in their files.
- **Related records:**
  - 0002 (skills are files, trees are layout) stands.
  - 0020 and 0026 (tags) stand.
  - 0023 (one rules index) receives the two new terms without change.

---

## Context

- **Before.** The Mage tree was a two-node draft:
  - a `core` emblem bordered Psychique;
  - two skills that learned a Sort from another Arbre below a price cap.
- **What the owner asked for.** On 2026-09-28 the owner asked for the full archetype, built on:
  - a Grimoire heart;
  - elemental marks that Mage Sorts spend;
  - a resource that pays only for Sorts;
  - a new Domaine, Éther, the purest form of magic.
- **Why a record.** Each of these touches a shared surface: `data/meta/domains.json`, `RULE_TERMS`
  in `src/lib/game/build.ts`, the price every tree prints, and the tree schema.

---

## Decision 1: Éther is a Domaine found through an archetype

### Decision

- `data/meta/domains.json` gains `ether`, labelled « Éther » and "Ether", colour `#3450ff`. It is
  placed before `neutral` so the plate legend keeps Neutre last.
- No `data/skill-trees/ether.json` exists. The Mage's own Sorts carry the Domaine, and the tree's
  domains are computed from them.
- Éther Sorts deal an existing damage type, written as plain words (« dégâts de Force »). No damage
  type is added.

### Rationale

- **The owner's rule.** A Domaine does not need a tree. Some are discovered through archetypes, the
  way Sang is carried by Berserker and Draugar skills and has no tree of its own. `data/skill-trees/`
  holds no Sang, Vide, Lumière or Nécrotique file.
- **No code change.** A domain key is a plain string (`domainKey` in `src/lib/game/schema.ts`). The
  only key code reads by name is `neutral` (`NEUTRAL_DOMAIN` in `src/lib/game/derive.ts`), so adding
  a Domaine is one data entry.
- **The colour.** `#3450ff` sits at a hue no Domaine uses, between Eau `#1f7fc0` and Foudre
  `#6d4db0`. It is the candidate that kept 3:1 against every site background in both themes and in
  print. That was measured during planning with the contrast formula of
  `tests/data/integrity.test.ts`; no test checks domain colours.

### Alternatives considered

- **An Éther Domaine tree now:** rejected. The owner wants Éther reached through the Mage, and an
  empty tree would announce a Domaine a player cannot yet build. Reopen when Éther skills exist
  outside the Mage.
- **A new « Éther » damage type:** rejected by the owner in favour of existing types. Reopen if
  resistances to pure magic become a rule.

### Caveats

- Every booklet hashes `data/meta/` (`addMeta` in `src/lib/booklet/fingerprint.ts`). This entry
  therefore makes all of them stale, and the reprint is a separate release step.
- « Force » names both a damage type and a Caractéristique. Damage types are written without a
  reference key, so nothing links the wrong word, but a reader meets the same word in two senses.

---

## Decision 2: Glyphe and Mana are rule terms written for reuse

### Decision

- `RULE_TERMS` gains « Glyphe » (`{{glyphe}}`, `--term-spell`, `mdi/star-four-points`). Its
  definition holds only the holding rules:
  - one Glyphe per Domaine, 4 at most;
  - what a fifth does;
  - when they are all lost.
- It also gains « Mana » (`{{mana}}`, `--term-res`, `game-icons/crystal-shine`). Its definition:
  - Mana pays only the Énergie cost of Sorts;
  - it counts as Énergie spent;
  - a Sort costing more than Énergie and Mana together cannot be cast.
- **What the granting skill states.** Neither definition names the Mage. The skill that grants the
  term sets when you gain it, its maximum and what refills it. In the Mage, that is Alphabet
  primordial (ALPPRI-001) for Glyphes and S'ouvrir à l'Éther (OUVETH-001) for Mana, an Éther
  passive that grants a fixed maximum and owes nothing to the Grimoire.

### Rationale

- **They carry mechanics.** Both drive rules in several skills. `.claude/rules/content/rule-text.md`
  asks for a recurring rule to be named once, and the owner asked for rule terms rather than states.
- **Other trees may use them.** The owner said so. Keeping the definitions free of Mage wording is
  what makes reuse possible without rewriting them.
- **Settling « spent ».** « compte comme de l'Énergie dépensée » settles two readings existing
  entries depend on:
  - Feu nourri (COMBUS-001) triggers « en y dépensant au moins 1 {{energie}} »;
  - Agonie (`data/states/agonie.json`) blocks what « coûte de l'{{energie}} ».

### Alternatives considered

- **Stacking states, the Vent ascendant pattern:** rejected by the owner. A state fits a
  condition, and these are resources and marks several trees may share. Reopen if a reader needs a
  pill with an intensity on the character sheet.
- **A new colour token for each term:** rejected. The terms join the families they belong to, the
  Sort family and the resource family, and `tokens.css` and its contrast test stay unchanged.

### Caveats

- A Glyphe is lost at the end of a turn in which its bearer cast no Sort. A future tree without Sorts
  would need its own clause to keep them.

---

## Decision 3: The Grimoire learns a Sort outside its Arbre at its printed price

### Decision

- **Inscription.** Grimoire (GRIMOI-001) lets a character inscribe a Sort from any Arbre but Mage,
  from the Banque Commune or from an Espèce. Inscribing:
  - makes the Sort Apprise;
  - costs its printed PX price and takes 1 hour;
  - needs a source (a text, a creature that teaches it, or a Sort seen cast through Copiste);
  - needs no Arbre unlocked and no trait followed.
- **The discount.** Its upgrade Notes en marge makes learning by inscription 5 PX cheaper, with a
  floor of 5 PX. It changes neither the Sort's Énergie cost nor the PX price of its Niveaux.
- **The book's memory.** Every Sort the character learns is written in the book. The book memorises
  as many of them as the modificateur d'Arcanes, at least 1 and at most 2, on top of Mémoire.
  Palimpseste raises that maximum to 4, then 6. Losing the book switches off only those Sorts.

### Rationale

- **It was the first.** Before this change, no skill, item or species text altered the price of
  buying a skill. Only the two retired spell steals read a price, as a cap.
- **The Mage's identity.** The owner's Mage is the scholar whose book is how Sorts are learned. The
  price is kept whole so the book trades path freedom, not PX.
- **A capped book.** The maximum of 2 keeps the heart, bought at 5 PX, from handing out up to 6
  free memorised Sorts, and turns the growth into a choice of nodes.

### Alternatives considered

- **Free inscription with a price cap:** rejected by the owner, who ruled that inscription costs the
  Sort's price. Reopen if inscription at full price proves too slow in play.
- **A discount on any purchase of a Sort in the book:** rejected. It would lower Mage Sorts and
  every tree purchase. The discount stays on learning by inscription.

### Caveats

- A Mage with sources can learn the Sorts of Arbres they already own out of trait order, 5 PX
  cheaper each with Notes en marge. The owner took this literally from their request; playtest will
  tell whether it needs narrowing.
- Chapter 05 still lists only three things that take no Mémoire. The Grimoire and Palimpseste state
  their own exception, as Discipulus already does, and the owner chose to leave the chapter as it
  is.

---

## Decision 4: The Mage stops using the `core` emblem, which stays in the schema

### Decision

- `mage.json` no longer declares `core`. The Grimoire skill holds the centre at `50, 50.81` with no
  `linked`, and every first-ring skill links to it.
- The `core` field, its overlay, its plate rendering and the `CORE` link value stay supported and
  tested. No tree uses them today.
- `docs/runbooks/add-a-skill-tree.md` and `docs/runbooks/place-a-skill-on-a-tree.md` no longer
  quote the old `mage.json`, and say that no tree uses `core`.

### Rationale

- **The heart is a skill.** Chapter 05 says the first purchase in a tree is « son cœur, au centre »,
  and an emblem is not a skill.
- **The owner kept the support.** Keeping it costs nothing at run time. `treeDomains`, `isTreeRoot`
  and the `CORE` checks in `tests/data/integrity.test.ts` keep working with no tree using them.

### Alternatives considered

- **Removing `core` from the schema, the renderer and the tests in the same change:** rejected by
  the owner. Reopen if the field is still unused when the schema is next revised.
