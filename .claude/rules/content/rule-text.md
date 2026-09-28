---
paths:
  - "data/skills/**/*.json"
  - "data/states/**/*.json"
  - "data/equipment/**/*.json"
  - "data/skill-lists/**/*.json"
---

# Rule Text

Rule text is the `description` of a skill, an upgrade, or a state, and the `text` and `description` of an equipment item, an item property, or a set bonus. It defines executable behavior. Precision outranks style: what is written must execute one way, and what is not written is the MJ's to rule.

## Limitations and the table

Aubaine trusts its players and its MJ to rule what a skill does not say. What a skill must say is what it can and cannot do against the rest of the game, because that is where its balance lives.

- Keep every limitation: the cost, a cap, a condition under which the skill cannot be used, what a movement costs and what it crosses, the resolution (who rolls what against which DD, and what success and failure do), the order of chained effects and what stops them, and the ending of a lasting effect.
- When a limitation recurs across skills, name it once as a state or a rule term and refer to it, the way `{{immobilise}}` carries every hold, rather than repeating the clause in each skill.
- Leave to the MJ what only narrates what the fiction already makes obvious, or tells them how to judge a scene.
- Length follows what the skill does. A complex skill may run long.

## What belongs in prose

- Activation, range, duration, and the resource costs are schema fields, and the render builds the stat line from them. Check the runbook for which fields the entity has, and never repeat one in prose.
- A Réaction states its trigger in the first sentence of its description, never in `activation`.
- A one-time setup, the paragraph that opens with « La première fois que vous {{memorisee|mémorisez}} cette Compétence » or « À l'achat », always comes first, before the effect it sets up. A flavour sentence may open that paragraph, never stand in a paragraph of its own ahead of it.
- Say each rule once. An opening that previews the options, gains or outcomes that the next lines spell out repeats them: open on the image or on the first rule, and let the meta description take whatever the opening is.
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
