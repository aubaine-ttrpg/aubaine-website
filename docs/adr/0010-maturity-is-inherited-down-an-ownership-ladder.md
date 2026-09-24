# ADR: Maturity is an authored state, inherited down an ownership ladder

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-20
**Revised:** 2026-09-20, a fourth value, `draft`, below `playtest`
**Deciders:** Kori
**Scope:** The `status` field on a skill, a skill tree, an equipment item and a set, how a skill
without one resolves an owner's, and what each value renders. Does not cover the contract mechanism
itself (0004), the ownership direction it relies on (0002), or the locale model (0003), since a
status is a machine value and is never translated.

---

## Context

The codex publishes game data at very different stages of settledness, and until now said so in one
place only: a single line on the home hero, `heroEyebrow: 'Codex v0.2 · données bêta'` in
`src/lib/i18n/strings.ts`, which covers the whole site and therefore tells a reader nothing about the
entry in front of them. Four trees are actively being playtested while the rest are close to final,
and a reader deciding whether to build a character around a tree has no way to know which is which.

Marking every skill by hand was never an option: 205 skill files, and a tree that enters playtest
would mean touching sixteen of them. The interesting part of the decision is therefore not the field
but the inheritance, and the fact that inheritance forces a third value nobody would otherwise write.

---

## Decision 1: Three authored values, two of which render

### Decision

- `status` accepts `playtest`, `beta` or `balanced`, and is optional on `skill`, `skillTree`,
  `equipmentItem` and `equipmentSet`.
- `playtest` renders a yellow and black hazard badge, `beta` a quiet outlined badge, and `balanced`
  renders nothing.
- Absent and `balanced` are different states. Absent means inherit; `balanced` means settled on
  purpose, and stops inheritance.

### Rationale

- Without an authorable `balanced`, a settled skill inside a playtest tree could not be expressed at
  all, because the only way to say anything is to say something that renders. The third value is what
  makes the second decision usable.
- The three state pattern is already the contract's idiom, and is already documented as load bearing:
  `upgrade.domains` in `src/lib/codex/schema.ts` carries `Absent vaut hérité de la base, [] vaut
  explicitement aucun, rempli remplace. Ces trois états sont distincts et ne doivent jamais être
  confondus.` Reusing the shape costs a reader nothing new.
- Rendering nothing for `balanced` keeps the badge meaningful. Most of the corpus is settled, so a
  badge on settled content would appear on almost every card and stop carrying information.

### Alternatives considered

- **Two values, `playtest` and `beta`, absent meaning settled**: simpler to author and the first
  thing to try, but it collapses "inherit" and "settled" into one token, which makes a settled skill
  inside a playtest tree unrepresentable. Rejected on that single case. It would reopen only if
  inheritance were dropped.
- **A boolean per stage, such as `playtest: true`**: allows contradictory states (`playtest` and
  `beta` both true) that the schema would then have to refine away. A closed enum makes the invalid
  state unrepresentable instead, per `.claude/rules/core/engineering.md`.
- **A `stability` number**: nothing in the game speaks of maturity numerically, and a number invites
  intermediate values the badge cannot render.

### Addendum (2026-09-20): a fourth value, `draft`, below `playtest`

`CONTENT_STATUSES` becomes `draft`, `playtest`, `beta`, `balanced`, still ordered from the least
settled to the most, and `draft` takes rank 0 in `PROVISIONAL_RANK`. It renders a dashed outlined
badge in `--status-draft`, and a dashed square on a plate node. Three authored values become four,
and two rendering values become three; nothing else in this record changes. The ladder, the
least-settled-wins rule inside a rung, and `balanced` stopping inheritance all carry over unchanged,
because rank is the only thing the resolution reads.

`playtest` was the floor, and it turned out to claim too much. It says an entry is written and wants
play to settle its numbers. The Mage tree is not that: it is being written, and putting it in front
of a table would waste the table's evening. Marking it `playtest` would have told a reader the
opposite of the truth, and leaving it unmarked would have told them nothing.

`draft` is a badge rather than a hidden state because the tree is already published and reachable.
The alternative was to leave such an entry out of the build until it is playable, which was rejected:
the codex publishes as it is written, the hidden set would need its own mechanism and its own way to
be reviewed, and a reader following a link to a tree that exists is better served by a badge that
says it is unfinished than by a 404.

The badge's dashed border is deliberate. `.claude/rules/frontend/styles.md` forbids encoding meaning
through colour alone, and `draft` and `beta` are otherwise the same quiet outlined shape. The stroke
separates them before the label is read. Contrast was checked against `--bg2` in both themes:
`#9a93b0` on `#0a0c1e` is 6.62:1, `#565f7d` on `#fffefb` is 6.26:1, both above the 4.5:1 that WCAG
2.2 AA asks of the badge's 11px and 13px text.

Naming: `draft` over `wip`, which was the word the change was asked in. The other three values are
words rather than acronyms, `draft` translates cleanly to `Brouillon`, and an expansion a reader has
to perform is a poor machine value.

---

## Decision 2: A skill inherits down a fixed ownership ladder, tree before item before set

### Decision

- A skill with no `status` of its own takes the first value found down this ladder: the tree that
  places it, then an item whose `grants` names it, then a set tier whose `grants` names it.
- Where one rung holds several owners, the least settled of them wins.
- A skill list is not a rung. Common Bank skills and base actions badge only from their own `status`.
- A set renders no badge anywhere. Its status exists solely to feed this ladder.

### Rationale

- The ladder is not arbitrary: it follows where a skill lives. A tree is a skill's home, while an item
  that grants the same skill is a second way to obtain it, so an item entering playtest should not
  drag a settled tree skill with it. Six skills in the repo have more than one owner and are decided
  by this rule, verified by reading `placements[].skill` across `data/skill-trees/` against `grants`
  across `data/equipment/`: `ECLAT-01`, `HARPO-01`, `LAMEA-01`, `TRFEU-01` sit in a tree and on a
  catalyst, and `PARAD-01` sits in a tree, on an item and in a set.
- Sets have to be on the ladder because of `SILLA-01`, whose only owner is the two piece bonus of
  `data/equipment/sets/TRAQU.json`. Without a status on sets that skill could never inherit anything.
- Least settled wins inside a rung because the rule then does not depend on the order files happen to
  load, and because under-warning is the worse failure of the two.
- The ownership walk was already being computed. `SkillOrigin` in `src/lib/codex/build.ts` collected
  trees, bank and items for the "Where to get it" panel, so the ladder reuses it rather than adding a
  second traversal; the only addition is `sets`, which that index was silently missing.

### Alternatives considered

- **Most provisional owner wins, ignoring the ladder**: order independent and never under-warns, and
  attractive for that. Rejected because it over-warns in the common case: a settled tree skill would
  show Playtest merely because one new catalyst grants it, which misattributes the item's immaturity
  to the skill. Would reopen if the badge were reframed as a caution about any path to the skill
  rather than about the skill itself.
- **The rendering surface decides**, so a skill shows the tree's status on the tree page and the
  item's on the item page: the most contextually accurate reading, and rejected because the same
  skill would then carry two different badges on two pages, which reads as a bug and cannot be
  answered by looking at the data.
- **Skill lists as a rung**: would let the Common Bank be marked in one edit, which its eleven skills
  now carry explicitly instead. Rejected to keep the field on entities that own a page or a plate.
  Worth reopening if the bank statuses start drifting apart.

### Caveats

- The eleven Common Bank skills carry an explicit `beta` today. If one later moves onto a tree it will
  keep that written value and ignore the tree, which is correct behaviour but easy to forget.
- `--status-playtest` is close to `--gold`, which already means XP, and the two badges sit side by
  side in a skill card header. The hazard stripes and the black ink are what separate them; a future
  change to either token should be checked against that pairing.

---

## Decision 3: Shape in the schema, resolution in a module of its own

### Decision

- `src/lib/codex/schema.ts` declares `CONTENT_STATUSES` and the Zod enum, and exports
  `ContentStatus` through `z.infer` like every other content type.
- `src/lib/codex/status.ts` holds the resolution: `mostProvisional`, `inheritedStatus` and
  `badgedStatus`. It imports only the type.
- `buildCorpus` resolves every skill once into `corpus.skillStatus`, and render sites read that map.

### Rationale

- It matches the split the codebase already has between `schema.ts`, which owns shape, and
  `derive.ts`, which owns pure computation over that shape. `status.ts` is to maturity what
  `derive.ts` is to XP and domains.
- The direction of the import is forced by the build, not only by taste. `tools/schemas/emit.ts` runs
  `schema.ts` under plain Node, which does not resolve extensionless TypeScript specifiers, so
  `schema.ts` cannot import a sibling the way a Vite compiled module can. Putting the values in
  `schema.ts` and the behaviour beside it keeps every import in `src/` extensionless, as the rest of
  the directory is.
- Resolving once in `buildCorpus` keeps the ladder in one place. Nine components render a badge; none
  of them knows the rule.

### Alternatives considered

- **Resolving at each render site**: would put the ladder in nine components and let them drift.
- **Importing `./status.ts` with an explicit extension from `schema.ts`**: works, and was the first
  attempt, but introduces the only extension carrying import in `src/` for one file's benefit.
