# ADR: Skill tags are three optional slots from one vocabulary, and every hovered word carries its own definition

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-24
**Revised:** 2026-09-25, the Nécromancie École is added (addendum in Decision 5)
**Revised:** 2026-09-26, a skill may carry two Écoles and base actions carry tags, reversed by 0026 (addenda in Decisions 3 and 5)
**Revised:** 2026-09-26, the Enseignement and Inné Pratiques are added (addendum in Decision 5)
**Deciders:** Kori
**Scope:** The `tags` field on a skill and its removal from upgrades and English overlays, the new
vocabulary file `data/meta/tags.json`, the definitions shown in the tooltips of rule terms,
Caractéristiques, Aptitudes and tags, and the policy for adding a tag. Amends 0002 Decision 4 (the
upgrade `tags` tri-state), 0016 Decision 1 (two new prose surfaces) and the `Sort` addendum of 0019
Decision 4. Does not cover the overlay mechanism (0003) or the schema contract itself (0004).

---

## Context

Every rule term shared one tooltip, « Un mot de règle du système, marqué partout où il apparaît
dans un texte. », and every Aptitude and Caractéristique shared another, both hard coded in
`buildTermIndex` in `src/lib/game/build.ts`. A reader hovering `Jet`, `Aptitude` or `Discrétion`
learned nothing. Skill tags were free strings (`z.array(z.string())` in `src/lib/game/schema.ts`):
207 of the 216 skills with real rule text carried 32 distinct tags that mixed effect families,
archetype families and modifiers, one of them spelled like an Aptitude (`Intimidation`) and one in
English (`Language`), with no rule for how many a skill carries or when a new one may exist. English
pages printed the French tags.

---

## Decision 1: A definition sits next to the word it defines

### Decision

- Each entry of `RULE_TERMS` in `src/lib/game/build.ts` carries `definition: Record<Locale, string>`.
  The `Sort` entry carries `tag: 'spell'` instead and reads the definition of that tag, so Sort is
  defined in one place.
- The shared vocabulary schema gains `definitionFr` and `definitionEn`, written together or not at
  all. `data/meta/characteristics.json` and `data/meta/aptitudes.json` carry them. The `any` entry of
  the Caractéristiques is a stat line marker no text writes, so it carries none and leaves the term
  index.
- `buildTermIndex` throws, naming the file and the key, when a rule term, a Caractéristique or an
  Aptitude has no definition, because a plain `astro build` runs no data test.
- The definitions are the source of truth: a chapter that restates one of these words follows its
  definition.

### Rationale

- A rule term's colour is a theme token such as `var(--term-adv)`, verified in `RULE_TERMS`, and the
  vocabulary `color` field only accepts a hex value (`HEX` in `src/lib/game/schema.ts`). Keeping the
  definition beside the colour, the icon and the spellings keeps one owner per term.
- `tests/data/integrity.test.ts` requires a distinct definition for every indexed rule term,
  Caractéristique and Aptitude in both locales, refuses a definition in any other vocabulary file,
  and runs the definitions from code through the dash, typography, banned phrase and antithesis
  checks the data files already pass.

### Alternatives considered

- **Moving `RULE_TERMS` to `data/meta/rule-terms.json`**: rejected for now. It needs a field for
  theme tokens and a new loader, and twelve documents under `docs/` and `.claude/` point at
  `RULE_TERMS` in code. Reopens if rule terms must be edited without touching code, or if a second
  consumer needs them.
- **One generic line per family**: the defect this record removes.

### Caveats

- Rule term definitions live in a TypeScript file, so `aubaine-prose` must reach into code to edit
  them. Decision 1 of 0016 gains that surface (addendum there).

---

## Decision 2: One vocabulary file for tags, grouped by slot, with the matrix on the schools

### Decision

- `data/meta/tags.json` holds three groups, `practices`, `schools` and `specials`, each entry with
  `key`, `labelFr`, `labelEn`, `definitionFr` and `definitionEn`. A school also lists the practices
  it accepts: that list is the Pratique x École matrix.
- It has its own strict schema, `tagTaxonomy`, and its own collection. The generic `vocabularies`
  collection and `readSources` both skip the file by name (`TAG_TAXONOMY_FILE`).
- The schema refuses a key or a label declared twice, a school naming an undeclared practice or the
  same practice twice, and a practice no school accepts.
- The file stays in `data/meta/`, which `src/lib/booklet/fingerprint.ts` already hashes, so a label
  change marks the printed booklets stale.

### Rationale

- Reusing the shared vocabulary schema with optional `slot` and `practices` fields would have let a
  domain carry a slot, a tag carry none, or a tag lack its definition, all invisible to
  `astro build`. `.claude/rules/content/schema-contract.md` prefers modelling an invalid state out of
  existence over validating it later.

### Alternatives considered

- **Tags inside the shared vocabulary schema**: rejected for the reason above. Reopens if tags lose
  their slots and definitions.
- **A matrix stored apart from the schools**: rejected; the restriction is a property of a school,
  and a separate table would be a second source for it.

---

## Decision 3: A skill fills only the slots it needs

### Decision

- A skill's `tags` is an object with three optional keys: `practice` (one key), `school` (one key)
  and `specials` (one or more distinct keys). The object is never empty; a skill with no tag omits
  the key.
- No slot is mandatory. Tags serve balance, flavour and combos, and a skill carries only what one of
  those uses. The 13 base actions and the eight skills that only change the sheet when bought carry
  none; supernatural class powers that are not Sorts carry no Pratique.
- `upgrade.tags` and `overlays.skill.tags` are removed. No upgrade and no overlay used them. A tag
  classifies the whole skill, and the English label comes from `labelEn`.
- `Sort` keeps its rule and it now covers passives: a Sort needs a Catalyseur equipped to be
  activated, passive or active. `Cri` gains one: it only affects creatures that can hear it.

### Rationale

- The owner rejected a mandatory one Pratique plus one École scheme as filling slots blindly.
  Balance comes from playtest and logic, not from classifying every skill.
- The object shape makes the order of the slots a property of the key names, so a School cannot sit
  in the Pratique position, and Zod refuses a repeated Spéciale.
- The migration kept every rule that cites a tag reaching the same skills, checked by script: the
  Sort and Illusion set read by APILL-01 and DREAD-01, and the six skills APPET-01 and REGEN-01 read.

### Alternatives considered

- **An array of keys**: rejected; the slot of each key would be a convention the test reconstructs.
- **Exactly one Pratique and one École on every real skill**: rejected by the owner, see above.

### Caveats

- Classification is judgement. The table in the approved plan records it skill by skill, and the
  definitions guide rather than decide: Illusion mortelle stays Illusion although it deals damage.

### Addendum (2026-09-26): reversed in part by 0026

[0026](0026-a-skill-may-carry-two-ecoles-and-a-base-action-carries-its-tags.md) reverses two bullets
of this decision. The École slot is now `schools`, one or two distinct keys, each accepting the
Pratique. The 13 base actions carry the tags they need. The skills that only change the sheet when
bought still carry none.

---

## Decision 4: Tags stay out of the prose term index

### Decision

- Tags render as chips in the card footer, each with the existing tooltip markup and its
  definition. The one tag filter becomes three: Pratique, École, Spéciale.
- Only `Sort` marks in prose, as a rule term.

### Rationale

- The index keeps the first record per spelling, and tag labels collide with other words: `Greffe`
  is also the title of GREFF-01, and `Illusion`, `Protection` or `Soin` would mark wherever a
  sentence starts with them.

### Alternatives considered

- **Indexing every tag label**: rejected for the collisions above. Reopens if rule text needs to
  cite tags by a spelling no other word shares.

---

## Decision 5: A new tag is rare and deliberate

### Decision

- A tag is added only for a real gap no declared tag covers, or for a mechanic shared across several
  trees, class specific tags included.
- `tests/data/integrity.test.ts` refuses a declared tag no skill carries, a tag in the wrong slot, a
  School paired with a Pratique it does not accept, and a French rule text citing « l'étiquette X »
  for an undeclared label.
- `docs/runbooks/add-a-tag.md` owns the procedure.

### Rationale

- The owner's standing requirement: the list stays short and tags are never added lightly.

### Alternatives considered

- **Free tags with a review convention**: the state this record replaces.

### Addendum (2026-09-25): the Nécromancie École

The decider asked for a necromancy tag with the Mort-vivant work, and placed it as an École rather
than a Spéciale. `necromancy` (Nécromancie / Necromancy) accepts Sort and Technique and is carried by
the Compétences that work on death or on the dead: Ténacité morbide, Festin and Phylactère
(ESMOR-08, 09 and 10). A skill carrying it gives up any other École, which is why the undead bodily
traits keep theirs (Passe-muraille is Mobilité, Rigidité cadavérique is Protection). Rules can now
target « l'étiquette Nécromancie », as the lore's forbidden occult magic will want.

### Addendum (2026-09-26): Nécromancie no longer excludes another École

Since [0026](0026-a-skill-may-carry-two-ecoles-and-a-base-action-carries-its-tags.md), a skill may
carry two Écoles, so Nécromancie no longer costs the other one. Dépouille (ESMOR-06) carries Illusion
and Nécromancie.

### Addendum (2026-09-26): the Enseignement and Inné Pratiques

The decider narrowed Technique to something the character does, and added two Pratiques for skills
that are not an act. `teaching` (Enseignement / Teaching) is knowledge passed on to the character by
a master, a school, a book or a bloodline, and is carried by Discipulus, Formation technique,
L'esprit humain and Savoir d'Élyséa (ESHUM-09, ESHUM-06, ESHUM-01, ESELF-02). `innate` (Inné /
Innate) is what the character holds from their nature, and is carried by Héritage des Galwariens and
Sens aiguisés (ESELF-03, ESELF-05) and by the Mort-vivant's Glas, Rigidité cadavérique, Ténacité
morbide, Phylactère and Passe-muraille (ESMOR-03, 07, 08, 10, 05). Only the pairings these skills use
are open: Renforcement accepts Enseignement, and Protection, Divination, Nécromancie and Mobilité
accept Inné. Opening another stays a balance decision. The Decision 3 bullet on class powers that
are not Sorts is unchanged.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Rule term definitions | Tooltip text, one per term and locale | `RULE_TERMS` in `src/lib/game/build.ts` |
| Caractéristique and Aptitude definitions | Tooltip text | `data/meta/characteristics.json`, `data/meta/aptitudes.json` |
| Tag vocabulary and matrix | Source of truth for tags | `data/meta/tags.json`, `tagTaxonomy` in `src/lib/game/schema.ts` |
| Skill tags | Optional slots on a skill | `tags` on `skill` in `src/lib/game/schema.ts` |
| Adding a tag | Procedure | `docs/runbooks/add-a-tag.md` |
