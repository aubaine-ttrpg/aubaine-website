# Balance

The lens of pass 5, `aubaine-content-balance`. The pass is advisory: it edits nothing, and every
finding goes to the owner with its evidence and its label. Aubaine's balance is still being
calibrated, so a finding is a reason to look, never a verdict.

## Where the measures come from

- `data/books/livre-du-mj/03-concevoir-une-competence.md` is the design budget. Read it in full: the
  Unité d'effet, the gap between a déchaînée Compétence and a fixed one, the reference ranges and
  zones, the four facts of a resisted effect, effects over time, Intensités, and the PX price.
- `data/books/livre-du-mj/04-eprouver-l-equilibrage.md` is the measuring protocol: what to record,
  which builds to compare, over full resource cycles rather than single throws.
- The owner rulings below, which no chapter prints yet.
- Settled siblings, for comparison only.

The repository holds no simulator. A claim that needs one is labelled `unmeasured`, never estimated.

## Labels

| Label | Meaning | The evidence it carries |
| --- | --- | --- |
| `budget-checked` | The entry was costed against chapter 03 | the arithmetic in Unités d'effet, written out |
| `sibling-compared` | The entry was set beside settled siblings of its kind | each sibling's id and the field compared |
| `unmeasured` | The question needs play or a simulator | what to measure, in chapter 04's terms |

A finding carries one label or more, and an entry with nothing to report gets one row that says so.

## Owner rulings

Each ruling is dated. Apply it as written, and report a settled entry that breaks it rather than
citing that entry as precedent.

- **Énergie is the tension (2026-09-28).** An active costs at least 1 Énergie. A cost of 0 needs a
  real counterweight: a `limit` of use, a long activation, a PdV cost, or a resource the Compétence
  spends. The owner repriced the Physique tree by hand on that date, martial actives included. The
  Draugar pays in PdV instead (`docs/adr/0034-the-draugar-pays-in-blood-and-an-archetype-leans-on-one-or-two-caracteristiques.md`),
  and Lever le bouclier is paid by the Action Bonus it takes every turn
  (`docs/adr/0038-shields-are-raised-and-wear-down-and-equipment-breaks-and-is-repaired.md`).
- **No flat bonus (2026-09-28).** A Jet improves through Avantages, never through a number added
  to it.
- **No grant at a threshold (2026-10-11).** PX, PM and PP are three currencies the MJ awards. Nothing
  arrives automatically when a total crosses a value.
- **No borrowed mechanic (2026-09-28).** A mechanic exists in Aubaine once the repository has it. A
  design taken from another game keeps only what has an Aubaine precedent (`migration.md`).
- **A day, not a fight (2026-10-11).** Balance is judged over an adventuring day of four to six mixed
  encounters, which is what chapter 04's full resource cycle means.
- **A tree balances its kinds (2026-09-28).** A tree mixes short and easy Compétences, roleplay
  Compétences and complex ones. A species pool is read the same way, and its options must each be a
  real choice, since a character keeps two of them.
- **Open roleplay rules stay open (2026-09-28).** Fix their cost, duration and ending; leave what
  they mean to the MJ.

## Procedure

1. Classify the entry: active, passive or spéciale; déchaînée or fixed; damage, healing, control,
   movement, information or roleplay.
2. Cost it in Unités d'effet when chapter 03 covers what it does. Show the arithmetic.
3. Check the resisted effects for their four facts, and the ranges and zones against the reference
   values.
4. Check the price: `tier` × 5 PX, 25 PX for a Compétence d'Espèce unless the brief says otherwise.
5. Set it beside two or three settled siblings of the same kind and tier. Name them.
6. Apply the owner rulings.
7. Write what stays unmeasured, and what chapter 04 would record to settle it.

## Settled entries to read with care

Some settled entries sit uneasily with a ruling. They are questions for the owner, not precedents in
either direction. Two examples: PREHER-001 raises two Aptitude modifiers by 1, and CROSAN-001 is an
active Attaque with no cost. Report any such entry a run leans on.

## What this pass returns

A findings table: id, file and field, finding, evidence, label, proposal, and whether it blocks C1 in
the pass's view. The owner decides every one.
