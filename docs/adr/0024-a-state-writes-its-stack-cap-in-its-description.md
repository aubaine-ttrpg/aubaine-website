# ADR: A state writes its stack cap in its description, not in a field

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-25
**Deciders:** Kori
**Scope:** The `stacks` field of a state and every place that printed it. The contract stays in Zod,
as 0004 decided; only one field of `state` goes. Does not cover how a state is listed or linked
(0023), nor the callout markup `[[[...]]]` of the printed plates.

---

## Context

`state` in `src/lib/game/schema.ts` carried an optional `stacks`, an integer from 2 to 10 described
as « Plafond d'accumulation ». Four states set it: Agonie, Combustion, Redevable and Trempé. The
number was printed beside the state's name: `3 Cumuls` on a state card and in a plate callout, and
`×3` in a tooltip and a search row. The owner rejected that counter and asked for the cap to live in
the description instead.

---

## Decision 1: The stack cap is rule text

### Decision

- `stacks` is removed from `state` in `src/lib/game/schema.ts`, from the emitted
  `schemas/state.schema.json`, and from the four files that set it.
- Nothing prints a counter beside a state's name any more: not the `Cumuls` line of a state entry
  or of a plate callout, not the `×` value of a tooltip or a search row. The `stacks_` interface
  string goes with it.
- The `description` of a state says how far it accumulates when it does, and its `.describe()` now
  asks for it. `docs/runbooks/add-a-state.md` says the same.

### Rationale

- All four descriptions already carried the cap, verified in `data/states/`: « s'accumule sur vous
  jusqu'à 5 » (Combustion), « jusqu'à 3 » (Redevable, Trempé), and « gagne Agonie 3 ». Prose and
  field stated the same number, which `.claude/rules/content/rule-text.md` forbids: never state a
  numeric value in prose that a field already carries.
- The prose is the side that says what the number does. Agonie counts down from its value while the
  other three count up to theirs, and a bare `×3` said neither.

### Alternatives considered

- **Keep the field and only stop printing it**: rejected; a value nothing reads is dead data that
  can drift from the description. Reopens if a rule has to compute from the cap, such as a counter
  on a character sheet.

### Caveats

- The printed tree plates and the equipment booklet lose the counter beside a state's name. The
  components they are printed from are part of the booklet style hash
  (`src/lib/booklet/fingerprint.ts`), so every booklet goes stale until `pnpm pdf` runs.
