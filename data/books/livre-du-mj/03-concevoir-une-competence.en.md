---
title: "Designing a Skill"
description: "The fields to fill, the tags, the effect budget, the reference ranges and the price in XP."
---

A new Skill is designed in this order: what it is, what it costs, what it does, then its price in XP. The prose comes last, otherwise it invents mechanics to justify its sentences.

## Type and activation

There are three types.

Active
: Deliberately activated, it costs a unit of action time.

{{passif}}
: Applied deliberately, continuously or automatically.

Special
: Its own text defines how it works, because it fits neither Active nor Passive.

The activation says what it takes: an {{action}}, a {{action-bonus}}, a {{reaction}} with its trigger, the place of one of the {{attaque|Attacks}} in the {{ATTAQU-001}} action, a time in turns, a time in minutes or hours, or nothing for a passive.

A Reaction states its trigger in the first sentence of its description, never in its activation.

## Tags

A tag is a balance lever: another Skill, an item or a state can target at once every Skill that carries it. For each of the three slots, Practice, School and Special, ask whether the Skill needs it, for balance, for its flavour or for a combo. If the answer is no, the slot stays empty. Basic Skills carry none.

Choose among the existing tags. Inventing one for a single Skill opens one more combo across the whole game and brings nothing to the table. A new tag is justified by a real gap, or by a mechanic shared across several Trees, like the Shout.

Not every School accepts every Practice: a Manoeuvre stays within the Schools of combat, a Shout within what a voice can carry.

{{dechaine}} marks an unleashed Skill in the sense of the effect budget, below: the player composes its effect at the moment of playing it.

## The effect budget

The unit of comparison is the Effect Unit. It is a design tool; it never appears in text a player reads.

One Effect Unit is roughly:

- one damage die, `1d10` against a single target;
- one healing die, `1d8` when the Skill takes an {{action}}, `1d4` when it takes a {{action-bonus}};
- one die of temporary {{pdv}}, `1d4`;
- or one standard secondary effect.

### Rank

Rank measures an active Skill's power, from 1 to 9. Like the Effect Unit, it is a design tool, kept out of any text a player reads. Its {{energie}} cost sets its Units.

| Rank | Energy | Units | Area | Limit and Karma |
| --- | --- | --- | --- | --- |
| 1 | 2 | 2 | 2d6 | |
| 2 | 3 | 3 | 4d6 | |
| 3 | 5 | 5 | 6d6 | |
| 4 | 6 | 6 | 7d6 | |
| 5 | 7 | 8 | 8d6 | |
| 6 | 9 | 10 | 11d6 | Once per {{repos-long}} |
| 7 | 10 | 11 | 12d6 | 1 {{karma}}, once per {{repos-long}} |
| 8 | 11 | 12 | 13d6 | 1 {{karma}}, once per {{repos-long}} |
| 9 | 13 | 15 | 14d6 | 1 {{karma}}, once per {{repos-long}} |

The Area column gives the damage a Skill deals to each creature it hits when it aims at several targets or an area, in place of its Units on a single target.

Below Rank 1, a Skill at 1 {{energie}} buys 1 Unit. A cost between two Ranks counts as the Rank below, for its bonus Units, its limit and its price: at any cost, the Units equal the {{energie}} up to 6, the {{energie}} plus 1 from 7 to 12, and 15 at 13. A Skill costs at most 13 {{energie}}.

### Paying for a Skill

The default resource is {{energie}}. The Basic Skills are the only free ones: every other active Skill pays something. A Skill at 0 {{energie}} pays another way: in {{pdv}}, in {{karma}}, with a long activation of minutes or hours, with a resource it spends, or with a usage limit.

A usage limit is enough to pay for a Skill that costs nothing else. Playable once per {{repos-long}}, such a Skill goes up to the Rank 1 budget of 2 Units; playable once per {{repos-court}}, up to 1 Unit. A more frequent limit, per combat or per turn, does not replace a cost.

At Rank 6, a Skill pays its {{energie}} and is limited to once per {{repos-long}}. At Ranks 7 to 9, it pays its {{energie}} and 1 {{karma}}, and is limited to once per {{repos-long}}. Each Skill has its own limit: two Rank 6 Skills can each be played once per {{repos-long}}. {{karma}} weighs more than {{energie}}: no rest brings it back.

At Ranks 7 to 9, the whole {{energie}} cost can be paid in 3 {{karma}}, the Rank's {{karma}} included, or all or part of it in {{pdv}}. Each {{energie}} replaced costs about 2.5 {{pdv}}: paid entirely in {{pdv}}, a Rank 7 Skill costs `7d6` {{pdv}}, a Rank 8 Skill `8d6`, a Rank 9 Skill `9d6`. In every case, the limit and the Rank's {{karma}} stay.

### Fixed or unleashed

A fixed Skill and an {{dechaine}} Skill follow the same table: their {{energie}} sets their Units. A fixed Skill spends its Units when it is designed, and its effect is settled in advance. An {{dechaine}} Skill lets the player and the GM spend them at the table. The trades below give the cost of each choice, in both cases.

| Trade | What it costs |
| --- | --- |
| Several targets or an area, instead of one target | The dice in the Area column of the same Rank |
| An area larger than its Rank allows | 1 die fewer per extra 1.5 m of radius, 3 m of edge, 4.5 m of cone or 9 m of line |
| No damage on a successful {{sauvegarde}} or a missed {{attaque}}, instead of half | Each die goes up one size: d10 to d12, d6 to d8 |
| A secondary effect | Replaces a damage die |
| A range beyond 9 m | 1 die fewer |
| A lasting effect | The same dice spread over several turns, never more |

A Skill that takes "1 {{attaque}}" keeps the damage of that {{attaque}} as the {{ATTAQU-001}} action sets it: the weapon's, or `1d4` unarmed, plus the {{caracteristique}} its {{jet}} uses. Its Units come on top. When it strikes with a natural weapon that stands in for bare hands, such as hooves, claws or fangs, its damage dice count that `1d4` on top of its Units.

A Rank 3 Skill costs 5 {{energie}} and buys 5 Units: `5d10` on a single target within 9 metres, `4d10` on a target at 18 metres, or `6d6` on each creature in an area.

## Ranges and areas

The reference ranges are contact at 1.5 metres, reach at 3 metres, and distance at 9, 12 or 18 metres. Another value is allowed when the Skill warrants it. Up to 9 metres, range costs nothing; beyond that, it costs what the table of trades says.

An area gives its shape and dimensions in multiples of 1.5 metres. It grows with its Rank: a sphere, or a cylinder of any height, has a radius of up to 1.5 metres per Rank, a cube an edge of up to 3 metres per Rank, a cone a length of up to 4.5 metres per Rank, and a line 1.5 metres wide a length of up to 9 metres per Rank. Within those limits, the area deals the damage in the Area column for its Rank, whatever its exact size; beyond them, it costs what the table of trades says.

## Resisting, and lasting

A Skill that can be resisted states the target's exact defensive {{jet}}, the exact {{dd}} formula, the effect on a failure, and what a success does, if it does anything. A success that does no more than escape the failure's effect goes unwritten. "The target only takes half damage" is part of the budget, not of generosity.

The dice of an effect over time follow the table of trades. Its text says when it applies, for how long, whether it renews and whether it stacks.

A Skill that applies a state with Intensity buys the higher Intensities out of its budget. Intensity 1 should stay comparable to what ordinary fiction would produce without a specialised Skill.

## The price in XP

An active Skill's price follows its Rank: 10 XP per Rank, up to 90 XP at Rank 9. A Skill at 1 {{energie}} costs 5 XP, and a Skill paid only by a limit costs the price of the budget it reaches: 10 XP for 2 Units, 5 XP for 1. Each purchase costs 5 to 100 XP, in steps of 5. A Species Skill is worth 25 XP by default.

The price accounts for impact, frequency, action efficiency, flexibility, persistence, synergies and limitations. The final decision belongs to the designer, who records the departures and watches them through testing.
