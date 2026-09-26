---
paths:
  - "data/skills/**/*.json"
  - "data/states/**/*.json"
  - "data/equipment/**/*.json"
  - "data/skill-lists/**/*.json"
---

# Rule Text

Rule text is the `description` of a skill, an upgrade, or a state, and the `text` and `description` of an equipment item, an item property, or a set bonus. It defines executable behavior. Precision outranks style: what is written must execute one way, and what is not written is the MJ's to rule.

## What the text leaves to the table

Aubaine trusts its players and its MJ to rule what a skill does not say, and a short text leaves room for the uses nobody wrote down. Write only what a table cannot settle on the spot without breaking the game.

- Keep the costs and the limits: the price, a per-turn or per-round cap, a stack cap.
- Keep the resolution: who rolls what, against which DD, and what success and failure do.
- Keep whatever can loop or chain: the order several effects resolve in, and what stops them.
- Keep the ending of any effect that outlasts the turn.
- Leave every other case to the MJ: a Vitesse at 0, a fall, what counts against a Vitesse, which surface holds, what blocks the way, how to undo the effect. Do not add a clause for one of these, even when a review asks for it.
- Length follows what the skill does. A complex skill may run long; a text grows long because it lists cases, and that is what to cut.

## What belongs in prose

- Activation, range, duration, and the resource costs are schema fields, and the render builds the stat line from them. Check the runbook for which fields the entity has, and never repeat one in prose.
- A Réaction states its trigger in the first sentence of its description, never in `activation`.
- Write the effect in the order it resolves: trigger, then subject, then resolution, then outcome, then how it ends.
- State the ending condition when the effect persists. A state ends when its description or the skill that applied it says so.
- State the limit and the reset condition when a rule can be used a bounded number of times. When the reset is a rest, that is the skill's `recharge` field, not a sentence.
- Do not hide a requirement at the end of a paragraph.

## Grammar of an effect

- Use `pouvez` for a genuine permission, and the plain indicative for a mandatory effect. Do not soften a mandatory effect into an option.
- Write exceptions narrowly. An exception names what it changes, the scope of the change, and when it ends.
- Do not create an implied mechanic through flavor. If it is not stated as a rule, it is not a rule.
- Give every sentence one unambiguous subject, and every pronoun an obvious referent.
- Keep prerequisites separate from outcomes.
- Distinguish alternate outcomes from sequential ones.
- Rewrite any sentence two readers could execute differently.

## Separation of layers

- A skill or state `description` is mechanical text.
- An item `description` is the short flavor line. It may describe how the thing looks, sounds, or is carried, and may not imply a mechanic.
- An item `text` and a property `text` are mechanical.
- Explanation of how a mechanic works belongs in a book chapter, not in an entry. See `book-prose.md`.

## Structured values

- Never state a numeric value in prose that a field already carries.
- Use the vocabularies as they are. `rarity` is required on an item and its six keys come from `data/meta/rarities.json`.
- Do not invent a field, a status, or a category the schema does not declare. Schemas are strict and an unknown key drops the entry. Tags come only from `data/meta/tags.json`; `docs/runbooks/add-a-tag.md` says when a new one is justified.
- An example illustrates a rule, it never defines one. Keep examples minimal and built only from Aubaine mechanics.
