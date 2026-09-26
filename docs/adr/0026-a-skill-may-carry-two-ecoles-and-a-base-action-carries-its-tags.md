# ADR: A skill may carry two Écoles, and a base action carries the tags it needs

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-26
**Deciders:** Kori
**Scope:** The `tags` field on a skill in `src/lib/game/schema.ts` and the tagging policy in
`docs/runbooks/add-a-tag.md`. Reverses two bullets of 0020 Decision 3 (the École slot holds one key;
the 13 base actions carry no tag) and the line of 0020's Nécromancie addendum that has a skill give
up any other École. The vocabulary file, the Pratique x École matrix, the tooltip definitions and
the policy for adding a tag (0020 Decisions 1, 2, 4 and 5) stand.

---

## Context

0020 gave a skill three optional tag slots: one Pratique, one École, and any number of Spéciales. On
2026-09-26 the decider tagged skills one by one and found two limits. Dépouille (ESMOR-06), the
Squelette's skill of flaying a corpse to wear its skin, is at once a disguise and work on the dead,
and the owner wanted both Illusion and Nécromancie on it. The same pass tagged base actions such as
Attaquer and Courir, which 0020 had left untagged on purpose.

---

## Decision 1: The École slot holds one or two keys

### Decision

- `tags.school`, one key, becomes `tags.schools`: one or two distinct keys from the `schools` group
  of `data/meta/tags.json`. Zod refuses an empty list, a third key and a repeated key.
- Each École must accept the skill's Pratique when one is set, checked for every École by
  `tests/data/integrity.test.ts`.
- Every skill that carried an École was rewritten in the same change, `"school": "x"` becoming
  `"schools": ["x"]`: 213 files. Dépouille is the first skill with two, Illusion and Nécromancie.
- `skillTags` in `src/lib/game/derive.ts` yields one slot per École, in the order written. The card
  footer and the École filter already read any number of slots per kind (`tagFacets` in
  `src/lib/game/browse-entries.ts`), so no view changed.

### Rationale

- The decider chose it when asked which École Dépouille should carry.
- The list shape is the one `specials` already uses, and the slot of each key is still a property of
  the key name, so 0020's reason for refusing a flat array of keys holds.
- The cap of two matches `domains`, which `src/lib/game/schema.ts` also caps at two, and keeps a
  second École an exception: a skill whose effect truly belongs to both families.
- The two rules that cite an École, Apprenti illusionniste (APILL-01) and Illusion mortelle
  (DREAD-01), read « un Sort portant l'étiquette Illusion ». Dépouille is a Technique, so neither
  reaches it.

### Alternatives considered

- **Choosing one École for Dépouille**: rejected by the decider. Reopens if two Écoles on one skill
  make a rule citing an École reach skills it should not.
- **Accepting a key or a list under `school`**: rejected; one fact would have two spellings, and
  `.claude/rules/content/schema-contract.md` prefers modelling a state once over validating two.
- **No cap**: rejected; a third École would turn the slot into a checklist, against 0020's standing
  requirement that tags stay few. Reopens if a skill genuinely belongs to three families.

### Caveats

- A rule that cites an École now reaches a skill through either of its Écoles. Whoever writes such
  a rule checks the two-École skills against it.

---

## Decision 2: A base action is tagged like any other skill

### Decision

- The 13 base actions listed in `data/skill-lists/basic-skills.json` are judged slot by slot like
  every other skill, and carry the tags they need.
- The first seven were tagged on 2026-09-26: Agripper, Aider, Attaquer, Attaque d'opportunité,
  Bousculer, Chercher and Courir.
- The skills that only change the character sheet when bought still carry none.

### Rationale

- The decider judged these skills under-tagged. An untagged base action shows no chip and never
  appears under a Pratique or an École in the skills filter.

### Alternatives considered

- **Keeping base actions untagged**: the 0020 rule this decision reverses. Reopens if tags on base
  actions crowd the filters without serving balance, flavour or a combo.
