# ADR: A limit of use is a field, and category values and Compétence are keywords

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-20
**Revised:** 2026-10-20, a damage type is the keyword, of the kind Dégâts, keyed `degats-` and its type (addendum in Decision 2)
**Revised:** 2026-10-20, the dice of a damage roll sit inside its keyword, `{{1d6 degats-feu}}` (addendum in Decision 2)
**Revised:** 2026-10-20, Ténèbres is removed, and Résistance and Vulnérabilité join (addendum in Decision 3)
**Deciders:** Kori
**Scope:** The `limit` field on a skill, which replaces `recharge`; the values of a category rule
term (sizes, creature types, damage types) as keywords; a rule term's own `key`; and `Compétence`
and `Accordée` as rule terms, with the icons of the family they belong to. Amends 0019 Decision 4
and reverses in part its addendum of 2026-09-23. Does not cover the notation of rolls, Sauvegardes
and Attaques (0050 Decision 3) or the grants between Compétences (0051).

---

## Context

The owner's second review of the Nnor on 2026-10-20 asked for four things the contract could not
express, each checked against the files before this change:

- Coup de sabot is played once per turn. `recharge` in `src/lib/game/schema.ts` took only
  `short-rest` and `long-rest`, so a turn, a combat or an hour stayed a sentence in the description.
- Forme draconique makes its player « Grande » and a « Dragon », and deals « dégâts de Feu ». The
  owner asked for those words to be keywords, as Jet and Taille are. `data/meta/sizes.json` and
  `creature-types.json` held labels only, and `damage-types.json` was read by no code at all.
- The owner asked for Compétence to be a keyword, and for a granted Compétence to be « Accordée »,
  next to Apprise and Mémorisée, in icons that read as one family.
- A rule term's key was the `slugify` of its French label, and « Physique », the temporary
  Caractéristique Forme draconique gives, is also the id of the Physique tree.

---

## Decision 1: A limit of use is the `limit` field

### Decision

- `skill.limit` is `{ times, per }`: `times` from 1 to 3, `per` one of `turn`, `combat`, `hour`,
  `short-rest`, `long-rest`. `SkillEntry.astro` prints it on the stat line beside the looping arrow
  `recharge` used, « 1 fois par tour », "Twice per Long Rest", through `t.limit` in
  `src/lib/i18n/strings.ts`.
- `recharge` is gone. Its 12 files now write `"limit": { "times": 1, "per": "short-rest" }` or
  `"long-rest"`, and print what they printed before.
- A limit is never a sentence: `docs/runbooks/add-a-skill.md` and the formulary's § limit say so.

### Rationale

- One field for every limit means one place a player looks, and one wording the stat line owns.
  The owner described it as « a new metadata … once per rest, once per long rest or twice thrice …
  Once per turn. Once per combat … like a looping arrow ».

### Alternatives considered

- **Keep `recharge` beside a new field**: rejected. Two fields would name one concept. Reopens
  never; a new kind of limit extends `per`.
- **A free text limit**: rejected. The stat line could not translate or order it.

---

## Decision 2: A category's values are keywords, and a rule term may carry its own key

### Decision

- A rule term in `RULE_TERMS` may declare `values`, the vocabulary its values come from: Taille
  reads `sizes`, Type de créature `creature-types`, Dégâts `damage-types`. `buildTermIndex` in
  `src/lib/game/build.ts` registers each value as a keyword of the new family `value`, keyed by the
  `slugify` of its `referenceFr` or else its `labelFr`, with its category's tooltip, and with its own
  colour and icon when the entry carries them.
- `damage-types.json` gains `referenceFr` and `referenceEn`, what a reference prints: the type is
  « Feu », the reference « Dégâts de Feu », keyed `{{degats-de-feu}}`. Each type carries a colour
  close to the palette the owner named, and the five Nnor types carry the owner's icons. The
  integrity test requires the two fields there and refuses them in any other vocabulary.
- A rule term may declare its own `key` when its label is taken: « Physique » answers to
  `{{physique-temporaire}}`, because `physique` is a tree.
- The keyword rule, in the owner's words: a word takes a key when a rule defines it and plain prose
  does not resolve it. `.claude/skills/aubaine-content/references/keyword-logic.md` holds it.

### Rationale

- A value is a sub-rule of its category, as the owner put it: « type de créature is … a common rule
  with multiple sub rules such as Dragon, Bête, Humanoîde ». A new family keeps values out of the
  Rules index and out of the one-definition-per-word test, which they would break by design.
- The vocabularies hold labels only, so a value's tooltip is its category's definition until the
  owner writes rules for the values themselves. Nothing is invented.

### Alternatives considered

- **One rule term per value**: rejected. Thirty-three entries would copy three vocabularies.
- **Rename the damage types to « Dégâts de Feu »**: rejected. The type is « Feu »; only the
  reference needs the phrase.

### Addendum (2026-10-20): the damage type is the keyword

- The owner: « Dégâts is the kind of keyword and the key word is Contendant / Froid / Feu », with
  « Dégâts Contondants », « Dégâts de Froid » what the players see.
- A damage type's tooltip now shows the kind Dégâts and the type as its title, « Feu », and the
  reference still prints `referenceFr`, « Dégâts de Feu ».
- Its key is the category's key and the type, `{{degats-feu}}`, `{{degats-contondant}}`, through
  `prefixValues` on the Dégâts rule term: « feu », « foudre » and « psychique » are tree ids and
  « force » a Caractéristique, so the bare type cannot be a key. Sizes and creature types keep
  their bare keys.

### Addendum (2026-10-20): the dice sit inside the damage keyword

- The owner: « let's put the dices too inside the dégâts : {{1d6 Dégâts de Feu}} ».
- A reference may open with an amount, dice or a number, before its key: `{{1d6 degats-feu}}`
  prints one chip, « 1d6 Dégâts de Feu ». `richtext.ts` parses it in one place for the rendered
  text, the flattened tooltip text and the labels pinned on an English page; a written text after
  the bar still agrees, `{{1 degats-feu|Dégât de Feu}}`.
- The integrity test refuses an amount before any key but a damage type, so a counted state keeps
  its number outside, « 2 {{combustion}} ». This extends the syntax of 0029 by one prefix.

---

## Decision 3: Compétence and Accordée are rule terms, in the family of the book icons

### Decision

- `Compétence` joins `RULE_TERMS` with `mdi/square-circle`, a circle inside a square for the
  Action and Passif it can be. `Accordée` joins with `mdi/book-plus`, beside `Mémoire`
  (`mdi/book-multiple`), `Apprise` (`mdi/book-education`) and `Mémorisée` (`mdi/book-check`). The
  provenance of a granted Compétence draws the Compétence icon instead of `mdi:star-four-points`,
  which is Glyphe's. The grant label reads « Accorde ».
- An entry naming itself writes its own id, « {{PERRUS-001|cette Compétence}} », and
  `{{competence}}` marks the general concept.
- `Tour`, `Ténèbres`, `Type de créature` and `Dégâts` join `RULE_TERMS` as vocabulary, and the
  `shapeshifting` school (« Métamorphose ») joins `data/meta/tags.json`, open to Inné only.

### Rationale

- The 2026-09-23 addendum to 0019 Decision 4 kept Compétence unmarked because the pill « would sit
  on every card and carry no signal ». Since 0029 a word links only where a text writes its key,
  and the self-reference now links to the entry itself, so the general word marks only where it
  means the general concept.

### Alternatives considered

- **Keep Compétence unmarked**: declined by the owner on 2026-10-20.

### Addendum (2026-10-20): Ténèbres goes, Résistance and Vulnérabilité come

- `Ténèbres` leaves `RULE_TERMS`: the owner found the prose of Legs de Charon, « vous voyez dans
  le noir, en l'absence de lumière », says it alone. No entry used the key.
- `Résistance` (`{{resistance-degats}}`, `game-icons/armor-upgrade`) and `Vulnérabilité`
  (`{{vulnerabilite-degats}}`, `game-icons/armor-downgrade`) join it: a creature « obtient une
  Résistance aux Dégâts de Feu ». Résistance carries its own key because `{{resistance}}` is the
  Aptitude.

---

## Summary

| Item | Role | Where |
| --- | --- | --- |
| `limit` | limit of use on the stat line | `src/lib/game/schema.ts`, `SkillEntry.astro` |
| `values`, family `value` | category values as keywords | `src/lib/game/build.ts`, `richtext.ts` |
| `referenceFr`, `referenceEn` | the printed damage type | `data/meta/damage-types.json` |
| `key` | a rule term whose label is taken | `RULE_TERMS` |
| Compétence, Accordée | keywords of the book family | `RULE_TERMS`, `Provenance.astro` |
