# Quality

The lens of pass 6, `aubaine-content-quality`, the last pass before the owner reads the entry. It
checks that the entry reads like the page of a professional roleplaying book: exact, consistent,
written about its subject, and identical in behaviour in both locales.

## Clarity

For any text that defines executable behavior.

- Every pronoun has an obvious referent.
- Each mechanical sentence has one unambiguous subject.
- Prerequisites are separated from outcomes.
- The trigger of a Réaction is in the first sentence of the description, not in `activation`.
- Target, range, area, and subject are not conflated.
- Resolution terms match Aubaine's vocabulary.
- Alternate outcomes are distinguishable from sequential ones.
- Timing uses the game's own model: action, bonus action, reaction, round, turn, rest.
- Optional and mandatory behavior are distinct. `pouvez` is a real permission; the plain indicative is
  mandatory.
- A bounded use states both the limit and the reset condition.
- A persistent effect states how it ends.
- Singular and plural agree, and the same entity is named the same way throughout.
- Abbreviations are Aubaine's own and are used as Aubaine uses them.

Do not require a concept the mechanic does not have. Aubaine has no damage type on every effect, no
saving throw on every roll, and no turn boundary on every duration. Write what the mechanic is.

Flag any sentence two reasonable readers could execute differently. That is the whole test. Rewrite
it only when the wording is not one the owner kept and the fix changes no mechanic; otherwise the
finding is a `note` row, and a fix that would change a mechanic is a question.

### Cross checks

- Does the prose add a mechanic the structured data does not carry?
- Does the structured data carry an effect the prose never mentions?
- Does a referenced skill, state, or item actually exist?
- Does the translated version resolve to the same behavior?

## Professional standard

- One term per concept, and no synonym for a defined term. A second word reads as a second rule.
- Active voice, addressed to the player, in the present.
- No stacked negation, and no condition written in the negative when its positive form says the
  same.
- An example demonstrates a rule and never patches one.
- The opening previews nothing. A preview is a clause that states an outcome, a gain or an option
  the rule then states again. Within that, the opening should still say what the entry is once the
  description is cut at 160 characters (`.claude/skills/aubaine-prose/references/site-copy.md`);
  when the two pull apart, no preview wins.
- Every sentence reads as French once its labels print (`keyword-logic.md` § Read it as a sentence).
- Every mechanical sentence maps to a formula in `formulary.md`, or pass 4 flagged it.
- Every rule dated « owner » in `formulary.md`, `adhd.md`, `keyword-logic.md` and `writing.md`
  holds. Read them there rather than from memory: they are the corrections the owner made at a
  checkpoint, and a run that breaks one repeats a mistake already ruled on.
- The limitation inventory from pass 1 is complete in the final text.

## Rule text that reads as generated

These are the tells that survive in short mechanical text. Each one is a defect in rule text, where
the reader needs the rule and nothing around it.

- **Puffery.** An adjective that claims power without a number: « redoutable », « dévastateur »,
  « légendaire ». The number or the effect says it, or nothing does.
- **The antithesis and its cousins.** « Ce n'est pas X, c'est Y », « non pas X mais Y », « pas
  seulement X, mais aussi Y ». The check refuses the first; read for the others.
- **The forced triad.** Three items where the mechanic has two or four, chosen for rhythm.
- **Synonym rotation.** One mechanic named three ways across a tree, as if variety were style.
- **The closing summary.** A last sentence that restates the entry.
- **Copula avoidance.** « sert de », « constitue », « représente » where « est » says it.
- **The participle tail.** « , renforçant ainsi … », « , permettant de … » tacked on to explain what
  the rule already did.
- **Stray emphasis.** Bold outside the owner's `***Label.***` sections, Title Case in a title,
  Markdown in a JSON field, a symbol no keyboard in the game's locale would type.
- **The template.** The openings of a tree's entries, read in a row as a list, start the same way.
  Read the run's entries beside the settled siblings the brief names. The entry the run wrote is the
  one that repeats, and it is rewritten; a settled sibling is never rewritten for it.

Then run `.claude/skills/aubaine-prose/references/ai-tells.md` over the whole run, for the tells that
belong to all prose. `BANNED_PHRASES` in `tests/data/integrity.test.ts` holds the phrasings the
check refuses; read the constant, never a copy.

## Both locales

- The French and the English resolve to the same behaviour, in the same order of operations.
- English labels come from `labelEn` and `RULE_TERMS`; the overlay keeps every key.
- The English is written for an English reader, not mirrored sentence for sentence
  (`.claude/skills/aubaine-prose/references/locale-en.md`).

## Against the baseline

For an entry that existed before the run, compare with the brief's `git show HEAD` baseline:

- every `***Label.***` section the owner wrote is still there, in its order;
- every string the brief lists as owner-kept wording is unchanged;
- nothing outside the run's lenses changed.

## What this pass may change

Wording the owner kept is never changed, typography included: every finding on it is a `note` row.
In the text the run wrote, this pass may fix typography, agreement, a clarity slip that two readers
would execute differently, a parity defect between the locales, and a tell from the list above.
Everything else is a `note` row for the owner.

## Inputs and when to stop

The pass needs the output of Check A and the limitation inventory pass 1 returned; without them it
asks the orchestrator rather than rebuilding them. It looks for precedent only in the siblings the
brief names, and it stops looking once a finding is on wording the owner kept, because that finding
is a note whatever the precedent says.
