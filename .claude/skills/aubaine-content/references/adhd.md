# ADHD shaping

The lens of pass 2, `aubaine-content-adhd`. Aubaine's rule text is written so that a reader with ADHD
gets every piece of information it holds, the smallest one included, on the first read and at the
table.

## The reader

`.claude/rules/books/i-have-adhd.md` describes that reader through five facts. Read it there; this
file only says what each fact means for a player reading a Compétence in the middle of a turn.

- **Working memory is small.** Everything a rule needs sits in that rule's paragraph. The reader
  does not carry a condition from two paragraphs up, or reconcile a sentence with a field.
- **Knowing is not doing.** A sentence says what the player does, in the order they do it.
- **Starting is the hardest step.** The first rule sentence is the first thing the player does or
  gets.
- **Vague estimates fail.** Distances, durations, counts and dice are written as numbers.
- **A payoff buried is a payoff missed.** The outcome is stated in its own clause, never folded into
  a subordinate one.

## The rules, each with its test

The rules shape the text this run writes. On wording the owner has seen and kept, a failed test is a
`note` row for the owner, never an edit.

1. **The opening is a rule or a flavour line, never a preview.** A preview is a sentence that
   restates the options, outcomes or numbers the next lines state, as an opening listing a
   Compétence's two choices before the lines that give them. It is cut. A flavour line that names
   the theme of the rule it opens is not a preview: « Le sang des Galwariens, premiers enfants de
   la magie, vous rend réfractaire aux manipulations de l'esprit. » opens Héritage des Galwariens.
   Test: no later sentence restates a choice, an outcome or a number the opening already gave.
2. **Flavour is optional, short, first and alone.** Zero, one or two sentences, only before the
   first rule, only when the brief asks for flavour, and stating no rule of its own. Flavour is
   always its own paragraph, a blank line before the first rule (owner, 2026-10-20).
   Test: count the sentences before the first rule that carry no mechanic; none appears after it,
   and none shares a paragraph with a rule.
3. **One paragraph, one job.** A paragraph holds one responsibility and never splits it: a target
   stays in the paragraph of the resolution it sets up, a movement stays with its conditions, and
   what triggers a rule shares a paragraph with what it triggers, so an {{attaque}} and the
   {{sauvegarde}} its hit imposes are one paragraph (owner, 2026-10-20). A paragraph break falls
   only between responsibilities. No word count forces a break.
   Test: no paragraph break falls inside one item of the limitation inventory, and no paragraph
   holds two jobs a player would look up separately.
4. **Each fact once.** No restatement of a structured field (activation, range, duration, the
   costs, `limit`), no state, rule term or chapter rule explained again, no closing sentence that
   sums up the entry, and no outcome that only says the failure's effect does not happen (« En cas
   de réussite, elle n'est pas {{etourdi|Étourdie}} », owner, 2026-10-20).
   Test: none of those fields is repeated in prose, and nothing is said twice or implied twice.
5. **The smallest piece of information gets through.** The pass deletes words, never rules.
   Test: the limitation inventory from pass 1 is identical after this pass.
6. **One condition per sentence.** A sentence that stacks « si … et si … sauf si » becomes ordered
   sentences inside the same paragraph. Relative clauses that describe one subject, and a list of
   alternatives, are not stacked conditions.
   Test: no sentence joins two « si » or « lorsque » conditions to one outcome.
7. **Execution order.** Trigger, then subject, then resolution, then outcome, then how it ends. A
   requirement never follows the effect it gates. A Sort whose player chooses its Caractéristique
   closes its first paragraph with that choice, as every settled Sort does.
   Test: reading the paragraph in order is playing it in order.
8. **Closed options are labelled lines.** A Compétence with parallel parts the player looks up
   separately uses the owner's `***Label.***` lines, as Aviver les flammes does with `***Dégâts.***`,
   `***DD.***` and `***Forme.***`. Never a Markdown list. A labelled section that exists stays.
   Test: the labelled sections of the HEAD baseline are all still there, in their order.
9. **No word without a job.** Cut the announcers (« Cette Compétence vous permet de »), the hedges,
   the idioms and the connectors that carry nothing (« en effet », « ainsi », « normalement »). An
   image that gives the entry its identity, or a phrase that buys roleplay, has a job and stays.
   Test: the deleted word was one of those four kinds.
10. **Concrete over vague.** Where the rule has a number, write it: « à 9 m ou moins de vous »,
    never « à proximité ». A scale the MJ rules in the fiction, « un feu de la taille d'une
    caisse », stays a comparison.
    Test: every distance and duration the rule fixes is written as a number.
11. **Positive when it says the same.** Prefer the positive form where it states the same rule,
    unless a formula fixes the wording. Keep the negative where the limitation is the rule, as Mener
    la danse does with « Vous ne pouvez jouer cette Compétence qu'une fois par tour. »
12. **Read it as a sentence.** With every reference printed as its label, the sentence is correct
    French: articles, prepositions, agreement. `keyword-logic.md` § Read it as a sentence holds the
    test; this pass runs it because a label stack is unreadable before it is wrong.

## What this pass never does

- Change a number, a limitation, a key, a formula or a field.
- Split one rule across paragraphs, or merge two rules into one sentence.
- Dissolve a `***Label.***` section into prose, or add one the owner did not write.
- Shorten an entry by cutting a limitation. Length follows what the skill does; a long Compétence is
  right when its length buys roleplay or a tactical choice.
- Add flavour the brief did not ask for.
- Rewrite wording the owner has seen and kept. A finding about it is a `note` row, never an edit.

## What this pass returns

Ledger rows, one per change, each citing the rule number above. Notes for kept wording. Questions
when a rule could only be met by changing a mechanic.
