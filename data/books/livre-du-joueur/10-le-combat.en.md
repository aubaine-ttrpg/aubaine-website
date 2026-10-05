---
title: "Combat"
description: "How a fight unfolds, surprise, initiative, your turn, moving, attacking, Armour Class, acting outside your turn, Concentration, and states."
---

Combat has no resolution rules of its own: you roll the same {{jet|Rolls}} as anywhere else. What it adds is an order to act in and a budget for each turn, so that everyone gets their go when everything is happening at once.

## How a fight unfolds

A fight is split into rounds. A round lasts about 6 seconds, long enough for every creature to take its turn.

1. **Positions.** The GM describes where the creatures are and what surrounds them. The players say where their characters are.
2. **Surprise.** The GM says whether anyone is surprised.
3. **Initiative.** Everyone rolls initiative, which sets the order of turns.
4. **Turns.** Each creature takes its turn in that order.
5. **The next round.** Once everyone has acted, a new round begins, in the same order, until the fight ends.

## Surprise

When one side runs into the other without seeing it coming, a successful ambush for instance, the GM declares surprised the creatures that did not expect it.

In the first round, a surprised creature takes its turn after every creature that is not surprised, in the order of their initiatives. It cannot use any {{reaction}} until the end of that first turn.

## Initiative

At the start of a fight, each player character rolls:

`1d4 + {{dexterite}}`

You act from the highest result to the lowest. Players win ties against their opponents, and settle ties among themselves however they like.

The die is small on purpose. A gap in {{dexterite}} weighs heavily in this order, more than in any other {{jet}} in the game.

The order holds for the whole fight. You do not roll it again each round.

### Two variants

The GM can roll once for a group of identical creatures, and separately for each major one. It shortens a fight with many opponents without changing any rule.

They can also merge allied positions that follow one another with no opponent in between. Allies in the same block then weave their {{deplacement|movement}} and actions together. Each keeps their own start and end of turn, which matters for anything that triggers there, and {{reaction|Reactions}} interrupt as usual.

## Your turn

On your turn, you have four things. They are independent: not using one does not give you another.

An {{action}}
: Most Skills are played with one, starting with {{ATTAQU-001}}.

A {{action-bonus}}
: A quick action, reserved for Skills that say so. It does not replace the {{action}}, and nothing converts it.

{{deplacement}}
: Up to your {{vitesse}}, 9 metres unless your Species sets another. You can spread it freely before, during and after your actions.

A {{reaction}}
: When a rule gives you a trigger, most often outside your turn. It comes back at the start of your next turn.

> [!EXAMPLE] Example
>
> On her turn, Sélène backs off 6 metres to get out of a wolf's reach, uses {{ATTAQU-001}} with her bow on another wolf, then slips 3 metres behind a boulder. She has used her {{deplacement}} in two parts and her {{action}}. She still has her {{action-bonus}}, which none of her Skills uses this turn, and her {{reaction}} for the wolves' turn.
>
> By backing off, she left the first wolf's reach: it can use its {{ATTOPP-001}}. To avoid that, she would have had to use {{DESENG-001}}, at the cost of her {{action}}.

## Moving

Everything is counted in steps of 1.5 metres. Melee reach is 1.5 metres, a reach weapon extends to 3 metres, and the usual ranged distances are 9, 12 and 18 metres.

You can split your {{deplacement}} as many times as you like during your turn, as long as the total stays within your {{vitesse}}.

Difficult terrain
: Rubble, a steep slope, knee-deep water or a packed crowd slow you down. Every metre moved through difficult terrain costs two.

Standing up
: A creature lying {{a-terre}} stands up by spending half its {{vitesse}}, on its turn. If its {{vitesse}} is 0, it cannot stand up, and no effect stands it back up.

Leaving an opponent
: Leaving the reach of a creature that can see you lets it use its {{ATTOPP-001}}, unless you used {{DESENG-001}} this turn.

Your {{vitesse}} can drop to 0, and some states do exactly that. A {{vitesse}} of 0 does not stop you acting: you keep your {{action}}, your {{action-bonus}} and your {{reaction}}.

## Attacking

The {{ATTAQU-001}} action makes an {{attaque}} with an equipped weapon or unarmed.

Make the {{jet}} the weapon states against the target's {{ca}}. On a success, the target takes the weapon's damage, plus the {{caracteristique}} that {{jet}} used.

That {{caracteristique}} is always added. It is the same on both sides of the sum: the one that let you hit is the one that makes the blow heavier.

Without a weapon, a Strike resolves with a `{{force}} + {{melee}}` {{jet}}, at 1.5 metres, for `1d4 + {{force}}` damage.

### What a weapon states

Each weapon prints its own line, and that line is the reference:

- the {{caracteristique}} and {{aptitude}} of its {{jet}};
- one range, and only one;
- its damage dice and type;
- its properties.

A target beyond the range cannot be attacked, unless one of the weapon's properties allows it.

Anything unusual a weapon does goes through a named property printed on it. A Finesse weapon lets you swap `{{force}} + {{melee}}` for `{{dexterite}} + {{finesse}}`. Two Light weapons, one in each hand, open an {{attaque}} as a {{action-bonus}}.

## Armour Class

{{ca}} is the number an {{attaque}} has to reach to hit you. With no armour:

`{{ca}} = 12 + {{dexterite}}`

Worn armour wipes that formula and imposes its own. **It is never added to 12.** It is the rule people forget most often.

Only one base formula applies at a time, the one on the piece in the Torso slot. A raised shield and other explicit modifiers are added afterwards, on top of the result.

1. Take your armour's formula, or `12 + {{dexterite}}` if you wear none.
2. Add the shield, if it is raised.
3. Add the other explicit modifiers, piece by piece.

> [!EXAMPLE] Example
>
> Unarmoured, with {{dexterite}} +3, your {{ca}} is 15. Put on armour at `14 + {{dexterite}}` and it becomes 17, never 29. Raise a targe and it rises to 18.

Each piece of armour prints its own formula, and some cap how much {{dexterite}} they let count or demand a minimum {{force}}. Read the piece: it carries its own limits.

### Raising a shield

A shield only protects you while it is raised. With a shield in hand, the basic Skill {{LEVBOU-001}} raises it: played with your {{action-bonus}}, it adds the shield's {{ca}} bonus to yours until the start of your next turn, and lets you block in the meantime.

Blocking costs your {{reaction}}, once the damage of an {{attaque}} that hits you has been rolled. The shield takes what it can out of its {{encaissement}} and leaves you the rest. If it stops all of it, you take no damage. The Equipment chapter explains how a shield wears down, breaks and is repaired.

### Precision and cover

A creature's {{ca}} is not fixed. The GM can shift it by up to three steps, depending on exactly what you are aiming at and what protects the target.

| Adjustment | Relative difficulty |
| ---: | --- |
| −3 | Much easier |
| −2 | Easier |
| −1 | Slightly easier |
| 0 | Normal |
| +1 | Slightly harder |
| +2 | Harder |
| +3 | Much harder |

A low wall, a tree trunk or a half-open door gives partial protection; aiming for a hand rather than the chest demands more precision. Beyond three steps it is no longer a difficulty but an impossibility: a target in full cover cannot be hit, and no adjustment makes it reachable.

## Acting outside your turn

Your {{reaction}} is your only way to act during someone else's turn, and you have one per round. You use it when a rule gives you its trigger.

Two Basic Skills give everyone one. {{ATTOPP-001}} strikes a creature that leaves your reach. {{PREPAR-001}} holds an action back for a moment you name: "the moment he comes through the door, I shoot". Other Skills add more, and their entry names the trigger.

## Concentration

Some Skills last as long as you concentrate: their duration is marked {{concentration}}. You maintain only one {{concentration}} Skill at a time, and playing another ends the first, even if the second does not resolve or is cancelled.

Each time you take damage while you maintain one, make a {{constitution}} + {{volonte}} {{jet}} against {{dd}} 15 to maintain your {{concentration}}. On a failure, it ends.

Your {{concentration}} also ends when you gain {{agonie}}, when you are {{endormi}}, {{sonne}} or {{enrage}}, and when you end it, which costs nothing.

## States

A state is a named condition that changes the rules for as long as it lasts, such as {{aveugle}}, {{entrave}} or {{a-terre}}. Its entry says what it does and how it ends. When it does not set the duration, the {{dd}} or the damage, the Skill or item that applies it does.

Some carry an Intensity, written after their name, like {{combustion}} 3. Applying the same state again keeps the higher Intensity, unless its text says they add together.

For an improvised consequence, the GM does not need a written state. They can grant an {{avantage}} or a {{desavantage}} until the fiction logically ends it.

The Rules page and the states index carry the full list.
