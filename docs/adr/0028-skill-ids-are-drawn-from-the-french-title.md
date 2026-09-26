# ADR: Skill ids are drawn from the French title

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-26
**Deciders:** Kori
**Scope:** The shape of a skill id, how it is derived, when it may change, and the one-time redraw of
every existing id. Replaces the id format and the permanence stated in Decision 1 of 0002 and
retires the three renames of 0002 Decision 3, recorded there as dated addenda; the rest of 0002
stands. Does not cover set ids,
species ids, tree ids or state keys.

---

## Context

A skill id was five characters and two digits, `^[A-Z0-9]{5}-[0-9]{2}$`, chosen by hand at import
(0002). Nothing said how to choose one. The letters were sometimes the start of the title (`SCHAU-01`
for Surchauffe), sometimes a species code (`ESHUM-05`), sometimes a prefix (`CBREP-01` for the Banque
Commune), and the digits meant a collision counter in one place, a species sequence in another and a
variant in a third (`COURR-02` evolves from `COURR-01`; `CHAIN-02` is an unrelated skill). Adding
two new Domain trees of sixteen skills each exposed the gap: parallel designers picked the same ids
for different skills. The owner asked for ids with a real, written logic.

---

## Decision 1: Six letters from the French title, three digits for derivation

### Decision

- A skill id is `^[A-Z0-9]{6}-[0-9]{3}$`, set in `SKILL_ID` in `src/lib/game/schema.ts`.
- The six letters are drawn from the French title: small words dropped (matched with their accents),
  accents removed, letters shared evenly across the remaining words, `X` padding for a short title.
- A title several trees or species share takes two initials and four letters of its owner's French
  name (`DPFEUX` for the Feu Détection primordiale).
- The number is `001`, except for a skill with `evolvesFrom`, which takes its base's letters and the
  next number (`COURRO-002`).
- When the letters are held, the holder keeps them and the newcomer moves along its last word.
- `docs/runbooks/choose-a-skill-id.md` owns the full rule, and `tools/skill-id/derive.ts` implements
  it, as `pnpm skill:id` and as the functions the tests import.

### Rationale

- French is the source language and the fallback (0003), and it is the only title every skill is
  guaranteed to have. Only 29 of the 295 skills carried an English overlay at the time of the change,
  counted in `data/skills/`.
- A rule that code applies can be checked. The `skill ids` block of `tests/data/integrity.test.ts`
  derives every id from its title, and `tests/unit/skill-id.test.ts` pins the runbook's examples.
- The number now means one thing. Two unrelated skills always differ by their letters, so a shared
  letter block always reads as a family.

### Alternatives considered

- **Letters from the English title**: rejected by the owner, because most skills have no English
  title yet and the English name would have had to be invented to name the file. Reopens if every
  skill ever carries an English overlay and the project wants English ids.
- **Keep hand-picked five-letter ids and only document them**: rejected. The existing ids follow no
  single convention, so a runbook would have had to describe three.
- **Shared titles distinguished by number (`DETPRI-001` to `-006`)**: rejected. It would make six
  unrelated skills read as one family, against the meaning Decision 1 gives the number.

---

## Decision 2: An id follows its title while the skill is a draft, then never changes

### Decision

- While a skill resolves to `draft`, by its own status or an inherited one, its id is re-derived when
  its title changes, and its files and references move with it.
- From `playtest` on, the id is fixed even if the title changes. Such a rename maps the id to the
  title its letters were drawn from, in `TITLE_BEFORE_RENAME` in the `skill ids` checks of
  `tests/data/integrity.test.ts`.
- A new skill never takes a title another skill carries, unless every skill with that title is still
  a draft: a shared title changes the letters of each skill that carries it.

### Rationale

- Drafts carry placeholder titles (the lorem species skills, the two Domain centres before this
  change), and an id drawn from a placeholder would otherwise outlive it.
- A node page URL ends with the id (`treeNodeHref` in `src/lib/i18n/routes.ts`), so a settled skill
  keeps its address once players can reach and share it.

### Alternatives considered

- **The id always follows the title**: rejected. Every rename of a settled skill would break its
  node page and reprint its booklets.
- **The id never changes, even for drafts**: rejected. The placeholder names would be frozen into
  ids for good.

---

## Decision 3: Every existing id was redrawn in one pass, without redirects

### Decision

- All 295 skills were renamed to their derived ids in one change, with every reference in
  `data/skill-trees/`, `data/skill-lists/`, `data/species/`, `data/equipment/` and `evolvesFrom`,
  the tests and the runbooks. The migration script was a one-off and is not kept.
- Collisions were resolved in a fixed claim order: the basic skills, the Banque Commune, the trees
  alphabetically with placements in file order, then the species. Four titles took shifted letters:
  Bousculade `BOUSCL`, Improvisation `IMPROI`, Marque de chair `MARCHI`, Surcharge `SURCHR`.
- The old node URLs are not redirected, by the owner's decision: the site has no search presence to
  preserve yet.
- The accepted records keep the ids they cite, as facts of their date.

### Rationale

- One pass leaves one scheme. A mixed corpus would need both formats in the schema and a second
  rule in the runbook.
- Basic skills claim first because they are the most referenced and the oldest list, which also
  matches the precedent of 0002 Decision 3.

### Alternatives considered

- **Redirect every old node page in `public/_redirects`**: rejected by the owner for now. Reopens as
  soon as the site is indexed or old links are known to circulate.

### Caveats

- `.claude/rules/architecture/routing.md` asks for moved content to be redirected permanently. This
  change breaks that rule on purpose, once, for node pages that nothing outside the site is known to
  link to.
- A tree booklet's fingerprint hashes the paths of its skill files (`treeContentHash` in
  `src/lib/booklet/fingerprint.ts`), so every tree booklet is reprinted after this change.
