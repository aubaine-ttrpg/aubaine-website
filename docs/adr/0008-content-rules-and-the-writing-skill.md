# ADR: Content rules load on paths, the skill carries the rest, the codex is original

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-20
**Revised:** 2026-09-23, the skill became `aubaine-prose` and widened past `data/` (0016)
**Deciders:** Kori
**Scope:** Where editorial guidance for `data/` lives, how it is split between `.claude/rules/content/`
and the `aubaine-content` skill, and the two positions that guidance takes which a future contributor
will question. Does not cover the data model (0002), the overlay mechanism (0003), or the schema
contract (0004), all of which this guidance points at rather than restates.

---

## Context

A generated pack of editorial rules arrived in `tmp/ttrpg-content-rules-v2`: 42 rule files plus a
writing skill, produced from a supplied reference corpus. Its editorial substance was usable. Its
mechanical assumptions were not: it targeted `src/content/{spells,monsters,npcs,...}` and
`locales/{fr-FR,en-US}`, none of which exist here, and it assumed English was `en-US` when
`src/lib/i18n/locales.ts` sets `en-GB`.

Installing it as authored would have put roughly 35 rule files in the repository whose `paths:` globs
match no file. Six more duplicated rules that already exist, which
`.claude/rules/meta/rule-maintenance.md` forbids. Three prescribed metadata fields that
`src/lib/codex/schema.ts` rejects, because every entity schema is strict.

The prose was worth keeping regardless: the text currently under `data/` is beta and will be
rewritten, and this guidance is what that rewrite will be measured against.

---

## Decision 1: A rule earns its place by matching files, the skill holds everything else

### Decision

- `.claude/rules/content/` holds nine rules. Every `paths:` entry resolves to real files, checked by
  expanding each glob against the working tree.
- The `aubaine-content` skill holds the editorial corpus as fourteen files under `references/`,
  loaded on demand.
- Voice, flavour, locale, checklists, and the entry formats for content types the codex does not have
  yet all live in the skill, not in rules.
- `.claude/rules/content/ttrpg-domain.md` was deleted, `collections.md` became `schema-contract.md`,
  `provenance.md` was dropped, and `i18n.md` moved to `.claude/rules/architecture/i18n-routing.md`.

### Rationale

- Observed in this repository: rules without `paths:` frontmatter are present in context
  unconditionally, and rules carrying `paths:` arrive only once a matching file is touched. This is
  harness behaviour and is recorded here as observed, not as a documented guarantee.
- It follows that a rule whose glob matches nothing never loads. All five pre-existing content rules
  were in that state and had therefore never fired once. Repointing them was worth more than any new
  file.
- `.claude/rules/meta/rule-maintenance.md` already says to move repeatable procedures into project
  skills when they do not need to remain in context during normal work. Entry formats for creatures
  and encounters are exactly that.
- Aubaine is new, so those content types are expected rather than hypothetical. Keeping their
  guidance in a skill preserves it without creating rule files that can never load.

### Alternatives considered

- **Install the pack as authored**: rejected. Most of it would never load, six files duplicated
  existing rules, and three contradicted the schema. Reopens if the loading behaviour above turns out
  to be wrong.
- **Keep the pack's structure but repoint every glob at `data/`**: rejected. It would attach rules
  about spell entries and creature stat blocks to skill and equipment files, which is worse than not
  loading them.
- **Drop the guidance for absent content types**: rejected on the owner's instruction that creatures,
  non player characters and adventures are planned. Their prose is preserved in
  `references/future-content-types.md`, marked as not yet part of the codex.

### Caveats

- Nothing validates the skill's prose. `pnpm lint` does not read Markdown and `pnpm data:check` only
  scans `docs/` for banned dashes, so these files can go stale without any check failing.
- `translation.md` carries `data/**/*.[a-z][a-z].md`, which matches nothing today because no
  translated book page exists. It is kept because `docs/runbooks/add-a-translation.md` documents that
  path as supported, and the rule still loads through two live globs.

### Addendum (2026-09-23): the skill is `aubaine-prose`, and it covers every word a reader sees

- The skill named above is now `.claude/skills/aubaine-prose/`, and it holds eighteen references
  rather than fourteen. The split this decision draws is unchanged: a rule still earns its place by
  matching files, `.claude/rules/content/` still holds nine, and the skill still loads on demand.
- Its scope is no longer `data/` alone. It also covers `src/lib/i18n/strings.ts`, the policy pages
  under `src/content/policies/` that 0015 created, and the titles and meta descriptions composed in
  `src/lib/game/pages.ts`. `editorial-style.md` gained `src/content/policies/**/*.md`, which matches
  eight files. 0016 records why that is one skill and not two.
- The first caveat above is resolved in part. `tests/data/integrity.test.ts` now refuses a set of
  formulaic phrasings, the antithesis outside a book chapter, a run of asterisks the renderer cannot
  parse, and the typography that breaks keyword matching, so `pnpm data:check` gates them. It still
  does not read this skill's own reference files, so the rest of the caveat stands. 0016 Decision 3
  draws the line between what a check refuses and what a reader judges.
- Decision 4's rejected alternative, extending the banned dash check to `data/`, was reopened and
  taken in a narrower form. The wholesale extension would still fail on 56 files. Banning U+2013
  outright and permitting U+2014 only when it is the entire value of a field passes on all 110
  occurrences, which is the rule this record already states in prose.
- The `aubaine-content` name is left standing in the Scope line, in Decision 1 and in the Summary.
  It was accurate on 2026-09-20, and the `**Revised:**` line carries the change, the way 0002 left
  `art` in place and corrected it in its own addendum.

---

## Decision 2: The guidance points at the contract, it never restates it

### Decision

- `SKILL.md` names `src/lib/codex/schema.ts`, `docs/data-contract.md` and `docs/runbooks/` as the
  sole source of truth for the shape of `data/`, and instructs reading the runbook before the first
  edit.
- The skill ships no templates.
- Rules describe the contract's consequences, not its content. `keywords-and-markup.md` states that
  marked references resolve exactly and that the build fails otherwise; it does not reproduce the
  markup table from `docs/data-contract.md`.

### Rationale

- This is the pattern the repository already chose for the equivalent problem: the `aubaine-commit`
  skill restates no commit policy and defers to `CONTRIBUTING.md`.
- The schema is already described in two places, `src/lib/codex/schema.ts` and the runbook field
  tables that quote its `.describe()` strings. `docs/runbooks/add-a-skill.md` reproduces all nineteen
  skill fields. A template would have been a third copy, and the third copy is the one that goes
  stale unnoticed because nothing validates prose.
- `.claude/rules/meta/rule-maintenance.md` gained the general form of this during the same change:
  never enumerate the members of a list that has a source of truth, name the source and give one
  example. 0004 Decision 3 relies on the same rule for keeping vocabularies out of the schema.

### Alternatives considered

- **Ship JSON skeletons for the highest friction shapes, a skill file and an English overlay**:
  rejected, because both are fully worked in their runbooks already. Reopens if a content type
  appears that has no runbook.

---

## Decision 3: The codex is original, and cites no outside source

### Decision

- Everything under `data/` is original Aubaine text.
- There is no reference corpus recorded in the repository, and no document listing external material
  consulted.
- No provenance or attribution field exists on any schema, and none is to be proposed.
- An entry that would need a source credit does not belong in `data/`.

### Rationale

- The corpus the pack was built from was the generating agent's input, not Aubaine's. Recording those
  works in this repository would have implied a relationship to them that does not exist.
- The position is enforceable as written. Every entity schema is strict, so a provenance key is
  rejected at load; because `src/lib/codex/fs-sources.ts` parses with `safeParse`, the entry is
  dropped rather than failing loudly, and the entity count assertion in
  `tests/data/integrity.test.ts` is what would eventually catch it.
- A per entry provenance table across 205 skill files cannot be validated by anything and would rot.
  A blanket originality policy can be held.
- Aubaine's own licence is unaffected and already stated in `README.md`: MIT for code, CC BY-NC-SA
  4.0 for game content, matching the colophon printed on the plates in `data/media/pdf/`.

### Alternatives considered

- **Keep a `docs/sources-and-licences.md` recording the corpus and its licences**: written, then
  removed on the owner's instruction that those works have no connection to Aubaine. Reopens
  immediately if any externally licensed text is ever reproduced under `data/`, because an attribution
  licence would then require a credit visible to the reader, not merely a note in the repository.
- **Add optional provenance fields to the schemas against future need**: rejected. `.claude/CLAUDE.md`
  forbids speculative abstractions, and the fields would be dead on all 292 data files.

---

## Decision 4: U+2014 is a display token in a stat field, never punctuation

### Decision

- `.claude/CLAUDE.md` bans U+2013 and U+2014 in authored repository text. That stands everywhere,
  including all prose under `data/`.
- One narrow exception is recognised: U+2014 as the entire value of a stat field, where it means not
  applicable.
- `.claude/rules/content/keywords-and-markup.md` carries the exception.

### Rationale

- `data/` holds 110 occurrences across 56 files. Every one is the complete value of a field, 56 in
  `range` and 54 in `duration`, verified by matching the character only when it is the whole string.
  None appears in prose, and none appears in a book chapter.
- The banned dash check in `tests/data/integrity.test.ts` scans the authored source directories and
  not `data/`, so these pass today and always have. Without the exception written down, the
  divergence between the invariant and the data looks like an oversight.
- The failure this prevents is an agent reading `CLAUDE.md`, finding 110 violations, and rewriting 56
  content files as a side effect of an unrelated task.

### Alternatives considered

- **Replace the glyph with a hyphen, or omit the key**: rejected. It is a change to the rendered stat
  line across 56 files, unrelated to the work that surfaced it, and the glyph is the deliberate
  printed form. Reopens if the render gains an explicit not applicable token.
- **Extend the banned dash check to `data/`**: rejected for the same reason. It would fail on 56 files
  the moment it was added.

### Caveats

- This trades a repository wide text integrity invariant for render fidelity, in one narrowly defined
  place. The exception is deliberately phrased so that it cannot be read as permission to use the
  character in a sentence.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Content rules | Invariants held before opening a file, every glob live | `.claude/rules/content/`, nine files |
| Writing skill | Editorial corpus, loaded on demand | `.claude/skills/aubaine-content/`, fourteen references |
| Authoring procedure | Not restated, pointed at | `docs/data-contract.md`, `docs/runbooks/` |
| Sourcing | Original content, no corpus, no provenance field | `.claude/rules/content/authority.md` |
| Dash exception | `range` and `duration` only | `.claude/rules/content/keywords-and-markup.md` |
