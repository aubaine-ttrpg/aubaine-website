---
name: aubaine-content
author: Kori
version: 1.1.0
last_updated: 2026-10-24
license: MIT
description: Create, migrate, revise and audit Aubaine's gameplay content under data/ (skills, upgrades, states, equipment items, sets, species and sub-species, skill lists, trees) and their English overlays. Six passes, each run by its own subagent (write, ADHD shaping, keyword logic, formulary, balance, quality), with owner checkpoints before writing and before commit. Use for any rule text, any structured mechanical field, any Compétence or species pool, and any migration of an older design into Aubaine.
argument-hint: [entity, source file, or audit target]
---

# Aubaine Content

## Authority

`src/lib/game/schema.ts`, `docs/data-contract.md` and `docs/runbooks/` are the sole source of truth for
the shape of everything under `data/`. A rule under `.claude/rules/` wins over this file. Aubaine is an
original game and the repository is its only authority: nothing outside it defines a mechanic, a
term, a unit, a cost or a setting fact. Every list this work leans on has a source of truth in the
repository; read the source, never a copy.

## Scope

This skill owns every entity file under `data/` but `data/books/**` and `data/lore/**`: its rule
text, its structured fields, its flavour fields and its English overlay.

- Lore pages go to `aubaine-lore`.
- Book chapters, tooltip definitions (`RULE_TERMS`, the `data/meta` definitions, the Banque Commune
  `note`), `src/lib/i18n/strings.ts` and the policy pages go to `aubaine-prose`.
- A run that also needs one of those hands it to that skill once its own C0 has fixed the facts.

## The run

The main agent is the orchestrator. It runs every command, merges the ledger, and is the only one
that talks to the owner. Each pass is a named subagent in `.claude/agents/`, given the brief and the
files in scope, and returning ledger rows. A pass changes only what its lens names.

| Step | Who | Lens | May change |
| --- | --- | --- | --- |
| Intake | orchestrator | this file | the run folder |
| C0 | owner | | nothing; approves the design |
| 1 Write | `aubaine-content-writer` | `references/writing.md` | the French files the brief lists |
| 2 ADHD | `aubaine-content-adhd` | `references/adhd.md` | French prose: cuts, order inside a rule, flavour placement |
| 3 Keywords | `aubaine-content-keywords` | `references/keyword-logic.md` | braces, written text after the bar, paraphrase to term |
| 4 Formulary | `aubaine-content-formulary` | `references/formulary.md` | the wording of mechanical relationships |
| Check A | orchestrator | | nothing; `pnpm data:check`, failures routed |
| EN | `aubaine-content-translator` | `.claude/skills/aubaine-prose/references/locale-en.md` | the `.en.json` overlays, allowlisted fields only |
| 3e | `aubaine-content-keywords` | `references/keyword-logic.md` | the English references |
| Measure | orchestrator | `references/balance.md` § Where the measures come from | nothing; writes `balance-tool.md` in the run folder |
| 5 Balance | `aubaine-content-balance` | `references/balance.md` | nothing; findings only |
| 6 Quality | `aubaine-content-quality` | `references/quality.md` | what its checklist names; the rest is a note |
| Check B | orchestrator | | nothing; `pnpm data:check`, then `pnpm build` |
| C1 | owner | | decides |

Give each subagent the brief path, the mode, the files and fields in scope, and the ledger so far.
Give the balance pass the tool report too.
A writer call takes at most four entities: split a larger run into batches written in parallel, each
on its own files.
The writer also returns a limitation inventory per entry, which passes 2 and 6 check against.

## Intake

Open a run folder, `tmp/content-runs/<date>-<slug>/`, which git ignores, and write `brief.md`:

1. The owner's request, verbatim.
2. Every entity in scope with its French and English paths, marked new or existing.
3. The runbook of each kind. The orchestrator reads it in full first.
4. Two or three settled siblings per kind, as `references/writing.md` § Any entry defines them,
   named one by one, never as a whole tree, with the resolved status of each and of every file in
   scope.
5. The source text, when there is one. For a design from another system, follow
   `references/migration.md`.
6. A baseline of every existing file, from `git show HEAD:<path>`, saved under `baseline/`.
7. The wording the owner has seen and kept, which no pass may rewrite, and every canon decision
   the run depends on (names, spellings, titles), even when it was settled for another skill's run.
8. Whether flavour is wanted, per entity.
9. The formulary entries the run needs, and which of them are `proposed`.
10. What is out of scope.

## C0

Every decision the repository does not settle goes in one table, and nothing is written before the
owner answers it: the mapping of a migrated design, the titles (ids freeze once an entry leaves
draft), the pool of a species, the prices, the `proposed` formulas the run needs. An icon is chosen
from rendered previews of a credited set, never from its name. Before asking,
filter each question through two settled principles: the exception wins over the general rule, and
an unbraced word keeps its ordinary meaning. Never ask for a carve-out the rulebook already answers.
Copy the answers into the brief, then run `pnpm skill:id "<titre>"` for every new title and record
the ids.

## The ledger

The orchestrator owns one table, `ledger.md` in the run folder. Subagents return rows; they never
write it.

```
| # | pass | locale | file | field | kind | before | after | lens § | status |
```

`kind` is one of `edit`, `proposal`, `note`, `question`, `finding`, `reverted`, `skill-fix`.

Before each pass, copy the run's files to `snap/<pass>/`. After it, diff each file against its
snapshot. Every hunk must match an `edit` row whose `after` text is in the file; a hunk with no row
is restored from the snapshot and logged as `reverted`. An overlay key outside the allowlist of
`docs/runbooks/add-a-translation.md` is refused.

## Checks

Check A runs after pass 4, Check B after pass 6. Route each failure to the pass that owns it: an
unresolved key to keywords, a schema error to the writer, typography, a refused phrase or an
antithesis to quality, a dropped overlay to the translator. Run `rtk proxy pnpm format` on the files
the run touched. Report a check as passed only when it ran and passed.

## C1

Give the owner the ledger grouped by file, the balance findings with their labels and the tool
report they cite, the open
questions, the notes on kept wording, the real check output, the `pnpm dev` pages in both locales,
and the skill fixes made during the run. A decision reruns only the steps it touches: the writer on
the changed fields, passes 2 to 4, the translator and 3e, quality, the checks; Measure and balance
only when a mechanic changed. Set a final status only when the owner asks. Commit only on « commit ».

## When a run teaches the skill

A check failure, a reverted hunk or an owner correction that comes from a missing or unclear
instruction is a `skill-fix` row. Edit the reference that should have prevented it, rerun that pass
in `propose` mode on the entry to prove the fix, and list the fix at C1.

## Modes

- `write`, the default: the passes edit the run's files.
- `propose`: for an audit or a calibration. Every pass returns proposals and edits nothing.
- `scoped`: a C1 fix, limited to the fields the owner named.

## Refusals

- Do not add a field the schema does not declare, author a derived value, reuse an id, translate a
  machine value, or write `pos` or `linked` in a skill file.
- Do not tag a skill to fill a slot, and do not invent a tag, a state or a rule term.
- Do not import a mechanic from another game without an Aubaine precedent.
- Do not time or gate a rule with « scène », add a flat bonus to a Jet, or grant anything when a
  total crosses a threshold.
- Do not invent a mechanic, a value or a term to fill a gap. Surface the gap.
- Do not rewrite text the run was not asked to touch. Drift is a report.
- Do not claim a check passed unless it ran. Do not commit without « commit ».

## References

- One per pass, as the table gives, plus `references/migration.md` for a source written for another
  system, `references/one-entry-one-job.md` and `references/naming.md`.
- Shared, in `.claude/skills/aubaine-prose/references/`: `flavor.md`, `claims-and-evidence.md`,
  `source-hierarchy.md`, `revising-an-entry.md`, `ai-tells.md`, `locale-fr.md`, `locale-en.md`,
  `validation.md`.
