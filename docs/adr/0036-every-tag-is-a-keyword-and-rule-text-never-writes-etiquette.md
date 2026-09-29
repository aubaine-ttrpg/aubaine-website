# ADR: Every tag is a keyword, and rule text never writes « étiquette »

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-29
**Deciders:** Kori
**Scope:**
- **Covers:**
  - how rule text names a tag;
  - how a tag renders in prose;
  - the one change to `slugify` that the tag keys needed.
- **Reverses:** [0020](0020-skill-tags-are-three-optional-slots-and-every-hovered-word-is-defined.md)
  Decision 4, « Tags stay out of the prose term index », and the citation rule in its Decision 5.
- **Builds on:** [0029](0029-every-link-is-an-explicit-reference-by-key.md), every link is an explicit
  reference by key.
- **Does not cover:** the tag vocabulary itself. The tags, their slots and the Pratique x École matrix
  stay as 0020 records them.

---

## Context

Until now, rule text cited a tag in plain words, « l'étiquette Illusion », and only `Sort` linked, as
a rule term reading the `spell` tag. The Barbare and Berserker work added a Rage tag beside the Rage
skill and the Enragé state. Three things shared one word, and nothing on the page told them apart.

The decider asked for a Rage rule term « just like Sorts », and then for every tag to become a
keyword: « we should never have étiquette but always rule terms instead ».

At the time of this change, eight skills cited a tag through the word « étiquette »:
- Illusion mortelle, Flux mystique, Apprenti illusionniste and Copiste (Illusion);
- Appétit and Régénération (Vol de vie);
- Bond sauvage (Rage);
- Inflexion, through five Écoles and Déchaîné.

Combo gagnant also listed all twelve Écoles and three Pratiques by name.

---

## Decision 1: every tag answers to a key

### Decision

- **The key.** Each tag in `data/meta/tags.json` answers to the `slugify` of its `labelFr`, as an
  Aptitude does: `{{illusion}}`, `{{vol-de-vie}}`, `{{rage}}`, `{{manoeuvre}}`.
- **The look.** Tags share one colour, `--term-tag` in `src/styles/tokens.css`, and one icon,
  `TAG_ICON` (`mdi/tag-outline`) in `src/lib/game/build.ts`.
- **The tooltip** shows the tag's own definition.
- **Tags a rule term reads.** A tag a rule term reads keeps that rule term: `{{sort}}` still reads
  `spell`, with its own colour and icon.
- **One list.** The glossary gains a `tag` family. The Rules page draws every tag row from it, so
  the separate tag row builder is gone, and a booklet prints the tags its text references with its
  other rule words.

### Rationale

- The Rage skill, the Rage tag and the Enragé state now read as three different things on the page:
  a skill badge, a tag pill and a state pill.
- 0020 kept tags out of the index because the spelling matcher would have marked « Illusion »,
  « Protection » or « Soin » wherever a sentence started with them. Since 0029 nothing links by its
  spelling, so that cost is gone. 0020's own reopen condition was rule text needing to cite tags.
- One shared look follows the Aptitude precedent (`APTITUDE_ICON`, `--term-apt`): tags are a class,
  not individually marked concepts.
- Deriving the keys from the file means a new tag is linkable the day it is added, with no hand-kept
  list.

### Alternatives considered

- **A hand-made rule term per cited tag**: rejected because it keeps a second list that drifts from
  `tags.json`. It would come back if one tag needs a look of its own, as `Sort` has.

---

## Decision 2: rule text names a tag by its key, never as « l'étiquette X »

### Decision

- **How to write it.** Rule text writes the key where it used to cite the label, for example
  « un {{sort}} d'{{illusion}} », « une Compétence de {{vol-de-vie}} » or « une {{rage}} ».
- **The ban.** `tests/data/integrity.test.ts` refuses the word « étiquette » anywhere in rule text:
  skills, states, items, set bonuses and species. It replaces the old test that checked each
  citation's label.
- **What changed.** The eight skills, Combo gagnant and the Déchaîné line of
  `data/books/livre-du-mj/03-concevoir-une-competence.md` (FR and EN) now use keys.
- **Chapters.** Book chapters keep « étiquette » as the name of the concept they explain.

### Rationale

- One way to name a tag, and one that links, is what the decider asked for.
- A test makes the rule hold without anyone having to remember it.

### Alternatives considered

- **Keep « l'étiquette X » beside the keys**: rejected, because two spellings for one reference is
  the drift this change removes.

---

## Decision 3: `slugify` spells out œ and æ

### Decision

- `slugify` in `src/lib/game/derive.ts` now turns œ into « oe » and æ into « ae » before it drops
  accents, so « Manœuvre » keys to `{{manoeuvre}}` instead of `{{man-uvre}}`. A unit test pins it.

### Rationale

- NFD normalisation does not split ligatures, so the old function dropped the letter.
- Only strings with a ligature change. None of the item names or slugs had one: the only ligature
  under `data/equipment/` is in a set description, verified with `grep`. No existing key moves.

### Alternatives considered

- **Key tags by their English machine `key`** (`{{lifesteal}}`): rejected, because every other
  vocabulary keys by its French label, as 0029 records.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Tag keys | `slugify` of `labelFr`, shared look | `src/lib/game/build.ts`, `src/styles/tokens.css`, `data/media/icons/mdi/tag-outline.svg` |
| One tag list on the Rules page | Rows from the glossary | `src/lib/game/browse-entries.ts` |
| No « étiquette » in rule text | Enforced by a test | `tests/data/integrity.test.ts` |
| Ligatures in keys | œ to oe, æ to ae | `src/lib/game/derive.ts` |
