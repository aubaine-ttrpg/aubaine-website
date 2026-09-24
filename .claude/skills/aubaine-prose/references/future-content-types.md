# Content types the codex does not have yet

Aubaine is new. The codex today holds skills, skill trees, skill lists, states, equipment items,
sets, the catalogue, and books. Creatures, non player characters, locations, factions, encounters,
adventures, and standalone lore are planned and not yet modelled.

Nothing here is authoritative. There is no schema, no runbook, and no directory for any of it. When
one of these becomes real, the schema is written first, a runbook follows, and the guidance below
becomes the editorial half of that work.

Two constraints apply in advance to all of it.

- Aubaine's own mechanics, action economy, resources, and vocabulary define these entries. Do not
  import a stat block, a rating, a progression model, or a taxonomy from another game because the
  content type is familiar there.
- Any field named below is a suggestion for a future schema, never a key to add to a file today.
  Schemas are strict and an unknown key drops the entry.

## Lore certainty

Every lore claim should carry a clear epistemic status when uncertainty matters: fact, common belief,
scholarly theory, rumour, legend, false belief, or hidden truth.

No field records this today, and adding one would be rejected. Until a schema exists it is an
editorial practice: attribute uncertain claims in the prose itself.

Do not write rumour as fact merely because it sounds better. In player facing prose, attribute an
uncertain claim to whoever holds it. In facilitator facing prose, state the hidden truth plainly.

Avoid `on dit que` when a more concrete source of the belief is available.

The facilitator is the `MJ` in French. No English term has been chosen yet; do not invent one in
published copy.

## Dialogue and in-world text

Dialogue must sound like a person with a purpose, not an exposition channel.

Give speakers distinct priorities through word choice, sentence length, assumptions, and what they
refuse to explain.

Do not encode accents through eye dialect unless the setting explicitly requires it and the result
remains respectful and readable.

Avoid generic fantasy archaism unless a specific culture uses it deliberately.

In-world documents reveal authorship through practical details: omissions, euphemisms, jargon, bias,
and intended audience.

Do not use quotation marks to invent authority. A fabricated quote is lore and needs a speaker.

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

## Locations

Open with what and where the place is.

Prioritize what characters can notice, do, learn, buy, risk, or change there.

Useful sections: overview, first impression, features, people, services or resources, dangers,
secrets, connections, current events.

Avoid static travel brochure prose. Do not describe every place as ancient, bustling, hidden, or
imposing. Use scale details that matter to navigation or play.

## Factions

Define a faction by what it wants and what it does.

Useful sections: purpose, methods, structure, resources, public reputation, internal tensions,
allies, rivals, membership, current agenda, restricted truths.

Do not reduce a faction to an adjective. If it is internally diverse, show the fault line that
produces meaningful decisions.

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

## Standalone lore

Open with identity, not atmosphere.

Useful sections: overview, appearance or geography, customs, history, relationships, present
situation, rumours, restricted truths, related entries.

Use dates only when the setting calendar supports them. Do not invent precision such as an exact
population, a founding year, or a distance merely to look authoritative.

Flavor should reveal how the subject affects play.

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
