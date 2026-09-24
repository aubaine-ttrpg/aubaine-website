# ADR: Skills are files, trees are layout manifests

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-20
**Revised:** 2026-09-20, the tree's `art` field became `cover` and `banner` (0009)
**Revised:** 2026-09-24, `tags` leaves the upgrade tri-state and becomes a set of optional slots on the skill (0020, addendum in Decision 4)
**Deciders:** Kori
**Scope:** How game data is split into files under `data/`, what owns a skill's identity, and which
authoring invariants the layout must preserve. Does not cover translation (0003), the validation
contract (0004), how a file becomes a page (0005), or how a picture is named (0009).

---

## Context

The seed corpus arrived as one generated bundle in which every skill tree embedded complete skill
objects. Part 2 of this project is an Editor whose only output will be these files, so their shape
is a contract rather than an implementation detail.

Three things in the seed data made the embedded shape untenable. `SURCH-01` was used by two entirely
different skills, Technomancien's Surcharge and Feu's Surchauffe, and the design silently dropped one
of them. `IMPRO-01` and `BOUSC-01` each collided the same way between a base action and a tree skill.
Five skills, including `TRFEU-01` and `PARAD-01`, were written twice, once in a tree and once in the
equipment catalogue, with different `tier` and `showXp` values in the two copies.

---

## Decision 1: One file per skill

### Decision

- `data/skills/<ID>.json` is the single definition of a skill. There are 205 of them.
- The filename is the id, and the id is `^[A-Z0-9]{5}-[0-9]{2}$`, permanently unique across the
  whole repository.
- Base actions, Common Bank skills, and skills granted by equipment are ordinary skill files. The
  lists that group them, `data/skill-lists/basic-skills.json` and `common-bank.json`, hold ordered
  arrays of ids and nothing else.

### Rationale

- It is the only shape in which the five duplicates stop existing. Under the embedded shape, the
  equipment copy of `TRFEU-01` and the Feu tree copy were two files of record for one skill, already
  disagreeing.
- It matches what the Editor will write. One document per concept is the unit a person edits and the
  unit a tool serialises.
- It makes the id do its job. A collision is now two files claiming one filename, which is
  impossible, instead of two objects in two arrays, which is invisible.

### Alternatives considered

- **Keep skills embedded in tree files**: rejected. It cannot express a skill that belongs to more
  than one place, and it is what produced the five disagreeing copies.
- **Embed by default with a `ref` escape hatch for shared skills**: rejected. Two shapes for one
  concept, where the rare shape is the one nobody tests.
- **A single skills file**: rejected. A 205 entry file is not an atomic document, and every edit
  touches the same lines.

---

## Decision 2: A tree holds placements, not nodes

### Decision

- `data/skill-trees/<id>.json` holds `id`, `name`, `treeType`, `size`, `art`, an optional `core`, and
  `placements`.
- A placement is `{ skill, pos?, linked? }`. `pos` and `linked` belong to the placement, never to the
  skill file, verified in `data/skill-trees/berserker.json` and `data/skills/RAGER-01.json`.
- `linked` keeps the literal `CORE` sentinel, is declared on one side only, and may only name a
  skill placed in the same tree.
- A placement with no `pos` is listed with the tree and draws no dot on the plate, which
  `src/components/primitives/Plate.astro` implements by filtering those placements out of the node
  list.

### Rationale

- Position and links are facts about a tree, not about a skill. A skill placed in two trees has two
  positions and two sets of links, which the embedded shape had nowhere to put.
- It separates the two jobs cleanly. Writing a skill is authoring; placing it is layout. The runbooks
  split along the same line, `add-a-skill.md` and `place-a-skill-on-a-tree.md`.

### Caveats

- Adding a skill to a tree is now two edits, a new file and a placement line. That is the cost of
  the split and it is accepted; the runbook walks both.

### Addendum (2026-09-20): `art` became `cover` and `banner`

- The field list above is now `id`, `name`, `treeType`, `size`, `cover`, `banner`, an optional
  `core`, and `placements`. 0009 replaced the single `art` with two optional picture fields because
  the card and the hero want opposite shapes, 3:4 and 16:9.
- Nothing else in this record changes. The split between a skill file and a placement, the `CORE`
  sentinel, the one sided `linked`, and the positionless placement are untouched. Both new fields are
  facts about the tree, like `art` was, so they sit on the same side of the line this record draws.

---

## Decision 3: A duplicate id is a defect, and the three that existed were renamed

### Decision

- Two different skills may never share an id. The filename makes it structurally impossible, and
  `tests/unit/derive.test.ts` asserts the corpus holds 205 unique ids.
- The three collisions in the seed data were resolved by keeping the base actions and Technomancien's
  Surcharge on their original ids, and renaming the tree side:
  - `SURCH-01` stays Technomancien's Surcharge; Feu's Surchauffe becomes `SCHAU-01`.
  - `IMPRO-01` stays the base action Improviser; Artisan's Improvisation becomes `IMPRV-01`.
  - `BOUSC-01` stays the base action Bousculer; Physique's Bousculade becomes `BOUSD-01`.

### Rationale

- These were not variants of one skill. Surcharge is an Automate mode costing 3 energy at 18m range;
  Surchauffe is a Fire abjuration costing 1 energy on the caster. They share five leading letters of
  their names, which is how the id scheme produced the clash.
- Nothing referenced the colliding ids. No `linked`, `evolvesFrom`, or `grants` pointed at them, so
  renaming touched only the file itself and its own tree's placements.
- The base actions were kept because they are the older and more fundamental list, and because prose
  cross references skills by title rather than by id, so neither side was harder to move.

### Caveats

- These renames changed canon. They are recorded here, in `docs/data-contract.md`, and in
  `tests/unit/derive.test.ts`, which asserts the renamed ids exist and no longer share a title with
  the id they were split from.

---

## Decision 4: Four authoring invariants that must survive any future change

### Decision

- **The upgrade tri-state.** On an upgrade, `domains`, `characteristics` and `tags` have three
  distinct states: absent means inherit from the base skill, `[]` means explicitly none, and a filled
  array replaces. Never write `null`, never read with `?? []`.
- **`energy: 0` is a real value.** It prints a zero energy pill. Omitting `energy` means the skill
  has no energy line at all. Four Common Bank passives rely on the difference.
- **Omit, never null.** A key with no value is absent from the file. `tests/data/integrity.test.ts`
  fails on any `: null` under `data/`.
- **Deterministic serialisation.** Two space indent, trailing newline, fixed key order.
  `tests/data/integrity.test.ts` asserts every file already equals
  `JSON.stringify(parsed, null, 2) + "\n"`.

### Rationale

- Each of these is unrecoverable once flattened. Collapsing the tri-state loses the difference
  between "inherits fire" and "explicitly has no domain", and no later pass can tell which was meant.
- The Editor will round-trip these files. Deterministic serialisation is what makes a tool write and
  a person write produce the same bytes, so a diff shows an intent rather than a formatter.

### Caveats

- The schema in `src/lib/codex/schema.ts` can enforce the shape of each field but cannot enforce
  omit-over-null or key order, which is why those two live in the integrity tests instead.

### Addendum (2026-09-24): `tags` left the upgrade tri-state

- The tri-state now covers `domains` and `characteristics` only. 0020 removed `tags` from the
  upgrade: no upgrade used it, and a tag classifies the whole skill rather than one of its levels.
- On the skill, `tags` is an object with three optional slots (`practice`, `school`, `specials`),
  omitted when the skill carries none. The other three invariants of this decision are untouched.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Skill | The single definition, one file per skill | `data/skills/<ID>.json` |
| Tree | Layout only: which skill sits where, and what links to what | `data/skill-trees/<id>.json` |
| Skill list | An ordered array of ids | `data/skill-lists/` |
| Uniqueness | Enforced by the filename, asserted by test | `tests/unit/derive.test.ts` |
| Invariants | Tri-state, `energy: 0`, no null, deterministic bytes | `tests/data/integrity.test.ts` |
