# ADR: Tests assert behaviour, never the content inventory

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-24
**Deciders:** Kori
**Scope:** What the unit, data and end to end tests under `tests/` may assert about the content under
`data/`. Retires `tests/fixtures/design-derived.json`, cited as evidence by 0031, 0033 and 0034, and
changes the checks that 0002 and 0054 name. Does not change what `tests/data/integrity.test.ts`
enforces over every entry, and does not rebuild the Atlas unit tests on a world of their own.

---

## Context

The content grows every day through the runs of the `aubaine-content` skill, and those runs check
with `pnpm data:check` and `pnpm build` only (`.claude/skills/aubaine-content/SKILL.md`), so a test
that pins the content fails later, in someone else's run, with no code changed. The skill count in
`tests/unit/derive.test.ts` was written 14 times over that file's history, and
`tests/fixtures/design-derived.json` was touched by 16 commits since it was created on 2026-09-24
(`git log`). The end to end specs pinned node counts, entry counts, « N results » labels, draft
statuses and authored text in the same way. The owner asked for tests that check only what code
decides.

---

## Decision 1: A test asserts what code decides, never the inventory of `data/`

### Decision

- A test never writes a literal that mirrors `data/`: a count of entries, a roster or an order of
  ids, or an entry's authored text, number or status.
- An expected value comes from the page under test, from the source of truth (`readCorpus` in
  `src/lib/game/fs-sources.ts`, a data file, an exported constant), or from an input the test builds.
  In Playwright, `tests/e2e/support/corpus.ts` reads the corpus and `tests/e2e/support/results.ts`
  writes a results label from `strings` and `formatNumber`.
- A real entry may still be the page or record a test visits. When the test needs a property, such
  as a draft, a sub-species or a set of two pieces, it picks the entry by that property from the
  data and fails with a named message when none has it.
- A rule over content is a loop over every entry. `tests/data/integrity.test.ts` keeps failing on
  invalid content, as it should.
- The rule lives in `.claude/rules/quality/testing.md`, which now also loads for `data/**/*`.

### Rationale

- A count proves nothing about code. A filter that works shows 4 or 17 results depending on the
  content of the day; the test that matters is that the counter equals the entries that match.
- The page and the corpus already say what was rendered and why. `readCorpus` builds the same
  corpus as the site with Node alone, and loads under Playwright: the drafts, browse, species and
  search engine specs use it.

### Alternatives considered

- **Keep the counts and update them in each content run**: rejected, since every update is churn
  that proves no behaviour, and the runs do not run `pnpm test`. It would come back for a number the
  code itself fixes, which then lives in an exported constant, as `PROFILE_AXES` does.
- **Snapshots of the rendered lists**: rejected for the same churn, and because
  `.claude/rules/quality/testing.md` already prefers focused assertions to broad snapshots.
- **Rebuild the Atlas unit tests on a world of their own**: rejected by the owner for now. Those
  tests use real places of the Archipel as fixtures and have not broken on a content edit; it would
  come back if they start to.

### Caveats

- A test that needs a property still depends on one entry having it. When the last draft species
  is published, the drafts spec says so by name instead of passing in silence.
- Chrome counts stay literal: four header links, four Atlas views, six profile axes. They change
  only with code.

---

## Decision 2: The derivations of a tree are tested on skills built in the test

### Decision

- The per-tree snapshot of dominant domains, primary Caractéristiques, XP total and upgrade count
  is removed with `tests/fixtures/design-derived.json`.
- `treeDomains` and `primeCharacteristics` (`src/lib/game/derive.ts`) are tested branch by branch on
  skills built in `tests/unit/derive.test.ts`.
- `tests/unit/derive.test.ts` checks that each skill file is named after the id it holds, in place of
  a count of skills, so two skills still cannot share an id.

### Rationale

- The snapshot was the only coverage of the branches of both derivations, so a wrong rule and an
  ordinary edit to a skill failed the same way. With the snapshot gone, changing either rule fails
  the new tests: verified by making the runner-up of `treeDomains` hold only above half the lead,
  and by dropping the one-call margin of `primeCharacteristics`, which failed four of them.

### Alternatives considered

- **Keep the snapshot as balance evidence**: rejected, since a test is not where a design figure is
  recorded. A record that needs a tree's totals measures them from `data/` when it is written; the
  history keeps the fixture for the figures already cited.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| The rule | What a test may assert | `.claude/rules/quality/testing.md` |
| The corpus in Playwright | Expected values and fixtures picked by property | `tests/e2e/support/corpus.ts` |
| The results label | The counter text for a counted value | `tests/e2e/support/results.ts` |
| A world of one ocean | The empty world the Atlas tests build | `tests/unit/fixtures/atlas.ts` |
| The derivations | Tested on built skills | `tests/unit/derive.test.ts` |
