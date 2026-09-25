# Claims and evidence

Aubaine's pages assert things about a game that only this repository defines. There is no outside source to
appeal to and none is wanted, so the question is never "where did you read that" but "what in the
repository says so".

## Every claim rests on one of five

1. A schema field that carries the value.
2. A runbook that states the procedure.
3. A sibling entry that already settled the pattern. A `draft` has settled nothing.
4. A book chapter that explains the mechanic.
5. A controlled vocabulary in `data/meta/` or `RULE_TERMS`.

`source-hierarchy.md` gives the order when two of them disagree.

If a sentence rests on none of the five, it does not ship. Report the gap and let it be decided.
Softening the wording is the wrong repair: a hedged invention is still an invention, and
`editorial-style.md` already refuses writing around a missing fact.

## A single word can assert canon

A claim can hide in one word. « Exilé » says that someone drove the subject out. « Conquis »,
« fondé », « trahi » and « hérité » each name a cause, an agent or a relationship. Before writing
a word like that, in either locale, check that one of the five above states what it implies. When
none does, choose the word that states only the known fact (« débarqués » says they arrived, and
nothing about why), or ask. A word picked for its colour still binds the setting to whatever it
means.

## Numbers

A number in prose must match the field that carries it, or follow from the game's own arithmetic.
XP is `5 × tier` unless `xpOverride` replaces it. A difficulty class follows the formula in
`docs/data-contract.md`, which also records where the repository contradicts itself on it.

Never restate a structured value in prose. The render builds the stat line from `activation`,
`range`, `duration` and the costs, and a sentence repeating one of them is a second copy that drifts
the moment the field changes.

Never invent a number to make a sentence land. A quantity with no field and no formula behind it is
a mechanic nobody agreed to.

## What may never be manufactured

A quotation, a citation, a date, a credit, a designer's intent, a piece of history, or a rule. This
is `authority.md` and it is absolute. An entry that would need a source credit does not belong under
`data/` at all, because every schema is strict and no provenance field exists.

Interpretation is not canon. A reading the repository does not state is a question, not a rule, and
it is worth asking rather than writing.

## The bar before an entry ships

Every entry carries at least one thing that only it could carry: a named mechanic, a number tied to
a field, a physical particular, a consequence at the table, or a trace it leaves on the world.

An entry that explains its mechanic correctly and carries none of these is filler with clean grammar.
It reads as interchangeable with its siblings because it is. Say so and stop rather than shipping it.

## Flavour is held to the same bar

Flavour is not exempt because it is decorative. It is exempt from nothing: it may not imply a
mechanic the rules do not state, and it may not assert a fact about the world that no chapter,
entry or vocabulary supports. An image that cannot be anchored is an invention wearing atmosphere.
See `flavor.md` for what anchoring means.
