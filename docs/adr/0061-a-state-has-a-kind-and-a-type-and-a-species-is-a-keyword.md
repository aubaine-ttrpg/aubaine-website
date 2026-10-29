# ADR: A state has a kind and a type, both keyword categories, and a species is a keyword

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-27
**Deciders:** Kori
**Scope:** The `kind` and new `type` fields of a state in `src/lib/game/schema.ts`, the two
vocabularies `data/meta/state-kinds.json` and `data/meta/state-types.json`, the rule terms Effet and
Type d'état in `RULE_TERMS`, and the `species` family of the term index in `src/lib/game/build.ts`.
Extends the category values of 0052 Decision 2 to two new categories. Does not change how a state
renders on its own card, its colour (each state keeps its own ink), or the species page.

---

## Context

On 2026-10-27 the owner reviewed the Humain pool and asked whether « Humain » in J'achète, je vends,
j'échange and « néfaste » in Volonté de survivre should be keywords. Both words count or target
something a rule defines, and neither could take a key: a state's `kind` was a closed enum whose
labels lived in `src/lib/i18n/strings.ts`, and the term index held no species. The owner also asked
for states to carry a type, « the goal is to mimic the status repartition of world of warcraft and
see if we can make it better to give more flexibilty and combos possibilities for game designer »,
with Rage, Charme, Peur and Magie as the first four.

---

## Decision 1: A state's kind is a category whose values are keywords

### Decision

- `data/meta/state-kinds.json` declares the three kinds, `buff`, `debuff` and `neutral`, labelled
  Bénéfique, Néfaste, Neutre and, in English, Buff, Debuff, Neutral (owner, 2026-10-27).
- `STATE_KINDS` in `src/lib/game/schema.ts` stays the typed key set of `state.kind`, because the
  default pastille ink is chosen per kind. `tests/data/integrity.test.ts` asserts that the vocabulary
  declares exactly those keys.
- The rule term Effet declares `values: 'state-kinds'`, so `{{benefique}}`, `{{nefaste}}` and
  `{{neutre}}` are keywords. A kind value takes its kind's ink through `stateInk`, the colour its
  states' pastilles carry.
- The `buff`, `debuff` and `neutral` labels leave `strings.ts`; the state glossary meta and the
  Rules page facet read the vocabulary.

### Rationale

- One owner per label: the facet, the tooltip meta and the keyword now print the same word from
  one file. Verified in `src/lib/game/browse-entries.ts` and `buildGlossary` in `build.ts`.
- The category mechanism of 0052 already registers a vocabulary's values as keywords, so the
  change is a declaration, not a new code path.

### Alternatives considered

- **Keep the enum and register the labels from code**: rejected because a third copy of the labels
  would sit beside `strings.ts`. Reopens if kinds stop being a closed set.
- **Drop Neutre**: rejected by the owner; Pression and Redevable are neutral.

---

## Decision 2: A state may carry one type, a family other rules can name

### Decision

- `state.type` is optional and names a key of `data/meta/state-types.json`. A state carries one
  type or none.
- The rule term Type d'état, keyed `type-etat`, declares `values: 'state-types'` and
  `prefixValues`, so the types are `{{type-etat-rage}}`, `{{type-etat-charme}}`,
  `{{type-etat-peur}}` and `{{type-etat-magie}}`, printing Rage, Charme, Peur and Magie.
- The first mapping (owner, 2026-10-27): Enragé and Fureur are Rage, Charmé is Charme, Effrayé is
  Peur, and Combustion, Strate, Surtension, Vent ascendant and Vent descendant are Magie. Every
  other state is untyped.
- The state glossary meta prints kind and type together, « Néfaste · Charme », and the Rules page
  gains a type facet beside the effect facet.

### Rationale

- Each state is already its own mechanic, as Effrayé or Immobilisé is. The type adds the axis that
  decides what reaches it, and because both axes are keywords any Compétence can cross them: « un
  état {{nefaste}} », « un état {{benefique}} de {{type-etat-magie}} », « un état de
  {{type-etat-rage}} ».
- A type holds Bénéfique and Néfaste states alike, so stripping a family is counterplay against a
  buff as well as a cure.
- Leaving a state untyped is a balance lever: only a Compétence that names it, or its kind, reaches
  it.
- The prefix is required: `charme` is the key of the Charmé state and `rage` the key of the Rage
  tag, and the build stops on a shared key (verified in `buildTermIndex`).

### Alternatives considered

- **Reuse the skill tags as state types**: rejected because tag definitions describe a Compétence,
  and the owner named families (Charme, Peur, Magie) no tag carries. Reopens if a tag and a type
  ever mean the same thing.
- **Several types per state**: rejected for now; no state needs two. Reopens with the first one
  that does.
- **Declare Poison, Maladie or Malédiction now**: rejected because a type no state carries is dead
  data. Each arrives with its first state.

### Caveats

- A type is fixed on the state, so a state that can come from a Sort or from a blow (Aveuglé) cannot
  be Magie from one source only. Such a state stays untyped.

---

## Decision 3: A species is a keyword keyed `espece-` and its id

### Decision

- `buildTermIndex` registers every species under `espece-<id>`, as `{{espece-humain}}`, in the new
  term family `species`. The reference prints the species name, shows `SPECIES_ORIGIN_ICON` in the
  species' `keyColour`, and links to the species page.
- `referenceLabels` knows the species names, so a tooltip that flattens rule text prints « Humain »
  rather than the key.

### Rationale

- The bare id is taken: the species `mort-vivant` and the creature type Mort-vivant both slugify to
  `mort-vivant` (verified in `data/species/` and `data/meta/creature-types.json`). A prefix keeps
  every species key free of collisions, as `degats-` does for damage types (owner, 2026-10-27).

### Alternatives considered

- **Bare ids with an exception for Mort-vivant**: rejected because one species would follow a
  different rule from all the others. Reopens never; the prefix costs seven characters.
- **Keep species names bare**: rejected by the owner. A word that decides who a rule applies to
  takes its key.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Kind | what a state does to its bearer, keyword `{{nefaste}}` | `data/meta/state-kinds.json`, Effet in `RULE_TERMS` |
| Type | the family other rules reach, keyword `{{type-etat-magie}}` | `data/meta/state-types.json`, Type d'état in `RULE_TERMS` |
| Species | who a rule applies to, keyword `{{espece-humain}}` | `buildTermIndex` in `src/lib/game/build.ts` |
