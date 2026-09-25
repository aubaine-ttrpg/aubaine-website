# ADR: A species is a pool of two picks, not a plate

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-22
**Revised:** 2026-09-23, Decision 3's lore block array is reversed by 0018
**Revised:** 2026-09-23, Decision 5 is reversed and Decision 4 gains roleplay fields off the plates (0019)
**Revised:** 2026-09-25, a sub-species may impose one of the two Compétences (addendum in Decision 2)
**Revised:** 2026-09-26, an equipment item may carry a prerequisite too (addendum in Decision 7)
**Deciders:** Kori
**Scope:** The `species` entity in `src/lib/game/schema.ts`, its two routes, its hero plates and lore blocks,
the one cran of sub-species, the new `prerequisite` field on a skill, and the fact that an empty
`placements` is now legal. Does not cover the ownership ladder itself (0010), the locale model
(0003), the contract mechanism (0004), or the catch all route (0005), all of which this record
extends rather than changes.

---

## Context

`treeType` has accepted `species` since the contract was written, and nothing ever used it.
`data/books/livre-du-joueur/09-les-especes.md` states what an Espèce does: it grants two Species
Skills that cost no Memory and no XP, and it fixes movement where that differs from 9 metres. It also
stated that no species existed, which is what this change ends.

The campaign needs the whole board laid down before hand review, so seventeen species, three missing
domains and five missing archetypes arrive together, all at `draft`, and the whole corpus moves to
`draft` with them. That forced three decisions the repository had no answer for: what shape a species
is, how an entry that is announced but not yet written is represented, and how a skill says who is
allowed to buy it.

---

## Decision 1: A species is its own entity, not a `treeType`

### Decision

- `species` is a strict Zod entity of its own, loaded from `data/species/` by its own collection.
- `treeType: 'species'` stays in the enum and stays unused by data.
- A species carries `offered`, a list of skill ids, and no layout of any kind: no `placements`, no
  `pos`, no `linked`, no `core`, no plate, no booklet.

### Rationale

- The two shapes disagree on the thing that matters. A tree is a layout manifest, which
  `docs/adr/0002-skills-are-files-trees-are-layout.md` makes the whole point of the kind, and every
  field on `skillTree` past `name` exists to draw a 960 by 1358 plate. A species draws nothing. It
  answers "which two do you keep", which no tree field can express.
- `placements` was `.min(1)` and every placement must name a real skill file that
  `tests/data/integrity.test.ts` resolves. Shipping seventeen empty species as trees would have meant
  inventing seventeen plates worth of skills on day one, which
  `.claude/rules/content/authority.md` forbids.
- The cost of the separate kind is small and bounded: one schema block, one collection line, one
  loader line in `fs-sources.ts`, one resolution loop in `build.ts`, two `ViewKind` entries. It buys
  a page whose vocabulary is the game's own.

### Alternatives considered

- **A species is a `skillTree` with `treeType: 'species'`**: the cheapest option, zero schema work,
  and the index card, the plate page, the per skill pages, the booklet and the archive route all
  come free. Rejected because every one of those freebies is wrong for a species: it has no plate to
  print and no booklet to download, and it would sit inside `/fr/arbres` among the archetypes it is
  explicitly not one of. Would reopen if species ever gained a printed plate.
- **A species is a `skillList`**: the closest existing shape, a named ordered list of skill ids.
  Rejected because `skillList` carries no `status`, no pictures and no per entry route, and because
  the Common Bank and the base actions are lists precisely because nobody chooses among them.

### Caveats

- `treeType: 'species'` is now a value nothing can reach. It was left in rather than removed because
  removing it is a contract change that touches the emitted JSON Schema and three render sites for
  no gain, and because `t.species` and `t.scrollCueSpecies` are still the labels the species page
  uses. A later change that removes it should take `treeTypeLabel`'s third branch with it.

---

## Decision 2: Two picks is canon, so it is a constant and not a field

### Decision

- `SPECIES_SKILL_CHOICES = 2` lives in `src/lib/codex/derive.ts`.
- No species file declares how many skills it grants.
- `offered` is either empty or holds at least two, checked in `tests/data/integrity.test.ts` against
  the effective pool rather than the authored array.

### Rationale

- The number is a rule of the game, written in chapter 09 and repeated in chapter 03's step list. A
  field would let a data file contradict the rulebook, which is the kind of invalid state
  `.claude/rules/core/engineering.md` asks to model out of existence.
- The floor of two is the honest one. Offering one skill and keeping two is unsatisfiable, and
  offering exactly two, as Scothan does, is a legal degenerate case: the pick is forced and the page
  still reads correctly.

### Alternatives considered

- **A `choose` field defaulting to 2**: allows a future species that grants three. Rejected as the
  speculative abstraction `.claude/CLAUDE.md` forbids. If one ever grants three, the constant becomes
  a field in one edit, and the runbook already names where to look.

### Addendum (2026-09-25): a sub-species may impose one of the two

The Mort-vivant needed each of its six sub-species to carry one Compétence every member has: the
Fantôme passes through walls, the Zombie refuses to die. The decider chose to keep two picks canon
and let the imposed Compétence fill one of them, the way Scothan's pool of exactly two already
forces both picks.

- `subspecies[].imposed` names one skill id. It stays out of every `offered`, so 0019 Decision 1's
  rule that a skill is named once across a species and its sub-species holds, and the page can tell
  the imposed row from the choosable ones.
- `SPECIES_SKILL_CHOICES` stays 2. The floor in `tests/data/integrity.test.ts` becomes: nothing
  imposed and an empty pool, or at least `SPECIES_SKILL_CHOICES` minus the imposed count to pick
  from. An imposed skill beside an empty pool is refused.
- Chapter 09 states the rule, and an imposed skill writes `"showXp": false` because no one buys it.
- Rejected: an imposed skill on top of the two. Undead would then start with three Compétences
  d'Espèce, more than any other Espèce, and chapters 03, 06 and 09 would each need an exception.
  It reopens if an Espèce is ever meant to be that much richer at creation.

---

## Decision 3: The page states the rule and does not play it

### Decision

- The species page lists the whole pool and says two are kept. It offers no way to pick them.
- A species carries `lore`, an ordered array of blocks, each with an optional heading, an optional
  16:9 picture and a required text. There is no separate `description`.

### Rationale

- A codex entry is a reference, not a character sheet. A picker that remembers nothing, belongs to no
  character and cannot be printed is a toy on a page whose job is to be read, and it cost a script, a
  counter, a live region and two end to end tests to say what one sentence says.
- One way to write prose, not two. A `description` beside a `lore` array would be two fields meaning
  the same thing, and the first block already reads as the presentation. Removing it took the
  duplicate out before any entry could depend on it.
- The picture side alternates from the block's rank among the illustrated blocks, computed in the
  template. Authoring it would be a layout decision in a content file, which
  `docs/adr/0002-skills-are-files-trees-are-layout.md` keeps out of `data/` on principle.

### Alternatives considered

- **Keep the picker without its counter**: the shape first asked for, minus the chrome. Rejected
  because a capped toggle with no visible count is worse than either end of the trade: the reader
  cannot see why the third click did nothing.
- **A markdown body per species**, like `data/equipment/guide.md`: richer for long lore and the
  obvious home for it later. Rejected for now because no prose page in the repository carries a
  picture and the markdown pipeline has no figure handling, so it would have meant building that
  first, outside the strict schema and outside the ratio and rights checks that
  `tests/data/integrity.test.ts` already runs on every declared picture.

### Caveats

- A lore overlay is keyed by the block's rank in the array, so inserting a block at the top of a
  species that has an English overlay silently shifts every translated heading by one. The same trap
  already exists for `overlays.equipmentSet.bonuses`, keyed by piece count.

### Addendum (2026-09-23): the lore block array is reversed by 0018

The alternative rejected above, a Markdown body per species, has been adopted. Its two named costs
are gone: `rehypeCodexTerms` had already been widened to every Markdown file under `data/` by
0011 Decision 2, and a relative Markdown image reaches `astro:assets` through
`remarkCollectImages` without a figure handler being written. The picture is therefore inside the
strict pipeline, and `tests/data/integrity.test.ts` now resolves every lore image against
`data/media/art/` rather than trusting a declared field. The index-keyed overlay caveat above is
also void, because a translated lore file is a whole file.

The rest of Decision 3 stands: the page states the rule and offers no picker, and there is still
only one way to write a species presentation.

---

## Decision 4: The hero plates are three controlled vocabularies

### Decision

- A species hero carries exactly three plates, built from `types`, `movement` and `size`.
- `types` and `size` name keys from `data/meta/creature-types.json` and `data/meta/sizes.json`.
  `movement` stays a string, because it carries a unit and a 9 m default.
- Several types cumulate and render joined by a middot; several sizes are a choice the player makes
  at creation and render joined by `ou`.
- There is no free text on a plate, and no `age` or `height` field.
- An Espèce that takes its size and its Déplacement from elsewhere declares `derivedFrom` instead of
  either, and the three are mutually exclusive. `origin` is an Espèce that used to be another one,
  `parents` an Espèce born of two. Such an Espèce shows one plate rather than two, because it is one
  rule and repeating the sentence would read as a fault.
- The plates are drawn with `TraitPlates`, extracted from the markup that was inline in `Tree.astro`
  and now shared by both heroes.

### Rationale

- All three are closed taxonomies the rules already read, so a controlled vocabulary is the honest
  shape and `pnpm data:check` can reject a value the game has not declared. A free text row could
  not be checked at all.
- Age and height were tried first and removed. They read as lore rather than as something a table
  consults, and a lifespan a player never rolls against is a sentence for the entry's prose, not a
  plate in the hero.
- The cumulate-versus-choose distinction is real and had to be visible: a Cindersöhls is Humanoïde
  **and** Artificiel at once, while a Humain is Moyenne **or** Petite and picks one. Rendering both
  as the same list would have flattened a rule into a comma.
- `movement` resists the same treatment because 9 m is a default rather than a member of a set, and
  a vocabulary key cannot carry a unit.
- `derivedFrom` exists because two Espèces answer the size and the Déplacement question with a rule
  rather than a value. Listing every size they could end up being would have read as a free choice at
  creation, which is the one thing it is not: a Mort-vivant is the size of whoever died, and walks as
  far as they did.

### Alternatives considered

- **A generic `vitals` array of icon, label and value**, which this record previously described and
  the repository briefly carried: it let an entry name any trait it liked. Removed once the set
  settled at three, because every one of them turned out to be a closed list, and a free text row
  that only ever holds a vocabulary member is a validation hole with extra steps.
- **Typed `age`, `height` and `size` fields**: what a reader coming from another game expects.
  Rejected because only size survived the question "does a table ever consult this?", and the other
  two would have written another game's sheet into the contract.
- **Folding `movement` into `size`**: one field instead of two, and rejected because the 9 m default
  would then have to live in the renderer or be copied into every file.

### Addendum (2026-09-23): age and height return, below the lore rather than on a plate

0019 Decision 2 adds `roleplay.adulthood`, `roleplay.lifespan`, `roleplay.height` and a top level
`languages`, rendered in a table under a « Jouer un <nom> » heading. The three plates are untouched:
the decider drew the line between gameplay data a table consults, which stays on the plates, and
roleplay, which does not. The bullet "no `age` or `height` field" and the rejected alternative of
typed `age` and `height` fields are therefore reversed, for the reason this decision gave against
them: they never belonged on a plate, and they no longer sit on one. The example in the rationale
above, a Humain that is Moyenne or Petite, did not survive either: the Humain file declares Moyenne
alone.

---

## Decision 5: Sub-species add to their stock, one cran deep

### Decision

- A species may name a `parent`, another species, and the pool a player picks from is the parent's
  `offered` plus its own, in that order, without duplicates.
- A species that is named as a `parent` may not itself declare one.
- No species in the repository declares a `parent` yet.

### Rationale

- Additive is what a sub-species means: a Drow is an Elfe and then something more. Replacement would
  make the stock's list decoration, and the three state idiom that
  `upgrade.domains` uses, where absent inherits and a filled array replaces, reads wrong here because
  a sub-species almost always wants both.
- One cran is a deliberate floor, not a limitation discovered late. An arbitrary tree invites a chain
  whose pool nobody can read off one page, and nothing in the game asks for one.
- `speciesPool` is a pure function over two resolved lists, so it is testable without the corpus, in
  the same way `treeDomains` and `primeCharacteristics` already are.

### Caveats

- Which of the seventeen species are sub-species of which is not recorded anywhere in the repository,
  so none declares a `parent`. Writing one from resemblance would be inventing a relationship, which
  `.claude/rules/content/authority.md` forbids. The field and its three integrity checks ship unused
  on purpose, waiting on an authored answer.

### Addendum (2026-09-23): reversed by 0019

The authored answer arrived, and it is not a `parent`. A sub-species is an entry inside its species,
`species.subspecies`, with no file and no page of its own, as 0019 Decision 1 records. `parent` and
its three integrity checks are gone. What this decision chose still holds inside the new shape: a
sub-species adds to its species and never replaces it, the filiation is one level deep because an
entry cannot nest another, and `speciesPool` still builds the pool a character picks from.

---

## Decision 6: An entry that is announced but unwritten is an empty draft

### Decision

- `skillTree.placements` drops `.min(1)` and gains a refine: an empty plate is legal only when
  `status` is `draft`.
- `species.offered` may be empty with no refine, because the floor of two is a pool level rule and
  lives in the integrity test.

### Rationale

- The alternative was to keep a tree out of the build until it is playable, which
  `docs/adr/0010-maturity-is-inherited-down-an-ownership-ladder.md` already rejected for the same
  reason in its addendum: the codex publishes as it is written, and a reader following a link is
  better served by a badge than by a 404.
- Tying emptiness to `draft` is what keeps the loosening honest. A tree cannot be promoted to
  `playtest` while its plate is bare, so the state cannot outlive the excuse for it.
- The refine is the idiom `skill` already uses for the passive and energy contradiction, so a reader
  meets nothing new.

### Alternatives considered

- **Leave `.min(1)` and place one real skill per tree**: rejected because the eight new trees have no
  written skills yet, and a plate holding one invented node claims more than the repository knows.
- **Allow empty on any status**: one less rule to read, and rejected because a finished tree with no
  skills would then be expressible and nothing would catch it.

---

## Decision 7: A prerequisite is free text on the skill, and the species link is derived

### Decision

- `skill.prerequisite` is an optional string, rendered on the stat line beside activation and range,
  and translatable through `overlays.skill`.
- Which species offer a skill is not authored on the skill. It is computed by inverting
  `species.offered` into `SkillOrigin.species`, the way trees, items and sets already are.

### Rationale

- One authoritative owner. The species file names its skills, and every other surface, the
  provenance panel, the acquisition facet and the species rung of the maturity ladder, reads that one
  list. Writing the species on the skill as well would be the copy that drifts.
- Free text matches the fields around it. `activation`, `range` and `duration` are all free strings
  because the game says them in prose, and a prerequisite reads the same way: `Force 3`,
  `Charisme 2 ou Intelligence 2`, `Être Humain`.
- The Common Bank's promise had to be qualified in the same change. Its note and `t.bankNote` both
  said a Bank skill asks for no prerequisite at all, which a `prerequisite` field makes false.

### Alternatives considered

- **A structured prerequisite union**, with characteristic thresholds, species membership, skill
  counts per domain and `any` groups: machine checkable and filterable, and rejected as a rules
  expression language designed before the rules it must express are written. It reopens the moment a
  dozen real prerequisites exist and their shapes can be read off the corpus rather than guessed.
- **A `species` field on the skill**: would let a skill claim a species that does not offer it, and
  duplicates a fact the species file already owns.

### Caveats

- Nothing validates a prerequisite's text, so a typo in a species name is invisible to
  `pnpm data:check`. That is the accepted cost of free text and the first thing structuring it would
  buy back.

### Addendum (2026-09-26): an item may carry a prerequisite

The decider reserved the Masque du Métamorphe to Squelettes and widened the rule term: a Prérequis
is now a condition to buy a Compétence or to equip an item (`RULE_TERMS` in
`src/lib/game/build.ts`). `equipmentItem.prerequisite` is the same free text as the skill field,
rendered under the item's name by the `PrerequisiteStat` primitive both cards share, and translated
by the item overlay. Chapter 07 states that only a creature meeting it can equip the piece. The same
caveat holds: nothing validates the text.

---

## Decision 8: A species is a rung of the ownership ladder, above equipment

### Decision

- `inheritedStatus` gains a species rung: own status, then tree, then species, then item, then set.

### Rationale

- A species is where a species skill lives, which is the test
  `docs/adr/0010-maturity-is-inherited-down-an-ownership-ladder.md` used to put trees first and
  equipment second. Marking one species `draft` marks everything it offers, in one edit, which is the
  whole reason the field exists.
- Below trees rather than beside them because a skill that sits on a plate and is also offered by a
  species is a tree skill the species hands out early, not the other way round. No skill is in both
  positions today, so the order is a rule written before it is needed rather than one inferred from a
  case.
