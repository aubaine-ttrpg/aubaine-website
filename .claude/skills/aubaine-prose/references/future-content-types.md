# Content types Aubaine does not have yet

Aubaine is new, and several content types are planned without a schema yet. The lore types, from
lore certainty to standalone lore, are in `.claude/skills/aubaine-lore/references/future-lore-types.md`.

Nothing here is authoritative. There is no schema, no runbook, and no directory for any of it. When
one of these becomes real, the schema is written first, a runbook follows, and the guidance below
becomes the editorial half of that work.

Two constraints apply in advance to all of it.

- Aubaine's own mechanics, action economy, resources, and vocabulary define these entries. Do not
  import a stat block, a rating, a progression model, or a taxonomy from another game because the
  content type is familiar there.
- Any field named below is a suggestion for a future schema, never a key to add to a file today.
  Schemas are strict and an unknown key drops the entry.

## Creatures

Creature mechanics are compact technical prose shaped by Aubaine's rules, which means Jets built from
a Caractéristique plus an Aptitude, CA, PdV, Vitesse, Énergie, actions and Action Bonus, Réactions,
and the states in `data/states/`.

Keep these layers separate where they exist: identity and classification, defensive data, movement,
core resources, senses and communication, passive traits, active options, triggered options, special
phases, behaviour and lore.

Do not introduce Armor Class as a separate concept from CA, Hit Points as separate from PdV,
Challenge Rating, six abilities under other names, Legendary Actions, recharge notation, or
Multiattack, unless Aubaine independently defines them.

Combat critical limitations belong in the mechanics, not only in the lore.

Suggested entry order: name and identity, classification, compact mechanical profile, passive traits,
active options, triggered options, special phases, behaviour and tactics, habitat, lore, variants,
encounter use.

Keep suggested tactics interpretive unless canon defines the behaviour.

## Spell-like entries

Aubaine has no spell content type. `Sort` is a Pratique tag on a skill, and skills are the mechanism by which
a character does anything. A future spell entry would most likely be a skill with a different
presentation rather than a new schema.

If one is ever modelled: keep structured metadata and executable effect text distinct, and do not
invent levels, class lists, components, slots, concentration as a resource, rituals, or saving
throws. Schools exist only as the École tags declared in `data/meta/tags.json`. Aubaine already has `concentration` as a duration modifier and `energy`, `karma`, and
`life` as costs.

## Non player characters

Open with identity and present role. Give the facilitator playable behaviour, not a biography.

Useful sections: role, appearance, manner, wants, fears, leverage, relationships, what they know,
what they believe incorrectly, table voice, mechanics when needed, restricted truths.

A table voice note is a few behavioural cues, not a script to recite.

## Encounters

An encounter should expose its playable state: premise, location state, participants, goals, starting
positions, environmental features, escalation triggers, retreat or surrender conditions, rewards and
consequences, scaling guidance.

Do not assume every encounter is a fight. If combat can be avoided, make the alternative legible. If
enemies have a reason to stop fighting, state it.

## Adventure hooks

A hook needs a concrete actor, a problem, pressure, and a reason to care.

Prefer hooks that imply a decision or a consequence. Avoid hooks resting only on curiosity about a
mysterious object, stranger, ruin, or rumour.

Give at least one detail specific to this setting.

Do not reveal the resolution in player facing text, and do not confuse a premise with a plot.

## Rules reference pages

Book chapters already fill this role and `book-prose.md` governs them. If a standalone rules
reference type is ever added, the shape is: one sentence definition in canonical terminology, then
when it applies, the procedure, inputs, outcomes, modifiers, exceptions, examples, clarifications,
and related rules. Omit empty sections rather than filling them.

Examples demonstrate the rule without importing assumptions from another game, and never patch
ambiguous rules text.

## Rulings and interpretation

Never collapse rules, clarifications, interpretation, and table variants into one voice.

Aubaine has no ruling content type and no label for these distinctions in the UI. Do not invent one.
Where the rules are genuinely ambiguous, describe the ambiguity and its practical consequences rather
than importing another game's ruling. Known contradictions are recorded in `docs/data-contract.md`.
