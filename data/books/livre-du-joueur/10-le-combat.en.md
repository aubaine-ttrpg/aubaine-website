---
title: "Combat"
description: "How a fight unfolds, surprise, initiative, your turn, moving, attacking, Armour Class, acting outside your turn, and states."
---

Combat has no resolution rules of its own: you roll the same Rolls as anywhere else. What it adds is an order to act in and a budget for each turn, so that everyone gets their go when everything is happening at once.

## How a fight unfolds

A fight is split into rounds. A round lasts about 6 seconds, long enough for every creature to take its turn.

1. **Positions.** The GM describes where the creatures are and what surrounds them. The players say where their characters are.
2. **Surprise.** The GM says whether anyone is surprised.
3. **Initiative.** Everyone rolls initiative, which sets the order of turns.
4. **Turns.** Each creature takes its turn in that order.
5. **The next round.** Once everyone has acted, a new round begins, in the same order, until the fight ends.

## Surprise

When one side runs into the other without seeing it coming, a successful ambush for instance, the GM declares surprised the creatures that did not expect it.

In the first round, a surprised creature takes its turn after every creature that is not surprised, in the order of their initiatives. It cannot use any Reaction until the end of that first turn.

## Initiative

At the start of a fight, each player character rolls:

`1d4 + Dexterity`

You act from the highest result to the lowest. Players win ties against their opponents, and settle ties among themselves however they like.

The die is small on purpose. A gap in Dexterity weighs heavily in this order, more than in any other Roll in the game.

The order holds for the whole fight. You do not roll it again each round.

### Two variants

The GM can roll once for a group of identical creatures, and separately for each major one. It shortens a fight with many opponents without changing any rule.

They can also merge allied positions that follow one another with no opponent in between. Allies in the same block then weave their movement and actions together. Each keeps their own start and end of turn, which matters for anything that triggers there, and Reactions interrupt as usual.

## Your turn

On your turn, you have four things. They are independent: not using one does not give you another.

An Action
: Most Skills are played with one, starting with {{Attaquer}}.

A Bonus Action
: A quick action, reserved for Skills that say so. It does not replace the Action, and nothing converts it.

Movement
: Up to your Speed, 9 metres unless your Species sets another. You can spread it freely before, during and after your actions.

A Reaction
: Outside your turn, when a rule gives you a trigger. It comes back at the start of your next turn.

> [!EXAMPLE] Example
>
> On her turn, Sélène backs off 6 metres to get out of a wolf's reach, uses {{Attaquer}} with her bow on another wolf, then slips 3 metres behind a boulder. She has used her Movement in two parts and her Action. She still has her Bonus Action, which none of her Skills uses this turn, and her Reaction for the wolves' turn.
>
> By backing off, she left the first wolf's reach: it can use its {{Attaque d'opportunité}}. To avoid that, she would have had to use {{Se désengager}}, at the cost of her Action.

## Moving

Everything is counted in steps of 1.5 metres. Melee reach is 1.5 metres, a reach weapon extends to 3 metres, and the usual ranged distances are 9, 12 and 18 metres.

You can split your Movement as many times as you like during your turn, as long as the total stays within your Speed.

Difficult terrain
: Rubble, a steep slope, knee-deep water or a packed crowd slow you down. Every metre moved through difficult terrain costs two.

Standing up
: A creature lying [[À terre]] stands up by spending half its Speed, on its turn.

Leaving an opponent
: Leaving the reach of a creature that can see you lets it use its {{Attaque d'opportunité}}, unless you used {{Se désengager}} this turn.

Your Speed can drop to 0, and some states do exactly that. A Speed of 0 does not stop you acting: you keep your Action, your Bonus Action and your Reaction.

## Attacking

The {{Attaquer}} action makes an Attack with an equipped weapon or unarmed.

Make the Roll the weapon states against the target's AC. On a success, the target takes the weapon's damage, plus the Characteristic that Roll used.

That Characteristic is always added. It is the same on both sides of the sum: the one that let you hit is the one that makes the blow heavier.

Without a weapon, a Strike resolves with a `Strength + Melee` Roll, at 1.5 metres, for `1d4 + Strength` damage.

### What a weapon states

Each weapon prints its own line, and that line is the reference:

- the Characteristic and Aptitude of its Roll;
- one range, and only one;
- its damage dice and type;
- its properties.

A target beyond the range cannot be attacked, unless one of the weapon's properties allows it.

Anything unusual a weapon does goes through a named property printed on it. A Finesse weapon lets you swap `Strength + Melee` for `Dexterity + Finesse`. Two Light weapons, one in each hand, open an Attack as a Bonus Action.

## Armour Class

AC is the number an Attack has to reach to hit you. With no armour:

`AC = 12 + Dexterity`

Worn armour wipes that formula and imposes its own. **It is never added to 12.** It is the rule people forget most often.

Only one base formula applies at a time, the one on the piece in the Torso slot. Shields and other explicit modifiers are added afterwards, on top of the result.

1. Take your armour's formula, or `12 + Dexterity` if you wear none.
2. Add the shield.
3. Add the other explicit modifiers, piece by piece.

> [!EXAMPLE] Example
>
> Unarmoured, with Dexterity +3, your AC is 15. Put on armour at `14 + Dexterity` and it becomes 17, never 29. Add a targe and it rises to 18.

Each piece of armour prints its own formula, and some cap how much Dexterity they let count or demand a minimum Strength. Read the piece: it carries its own limits.

### Precision and cover

A creature's AC is not fixed. The GM can shift it by up to three steps, depending on exactly what you are aiming at and what protects the target.

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

Your Reaction is your only way to act during someone else's turn, and you have one per round. You use it when a rule gives you its trigger.

Two Basic Skills give everyone one. {{Attaque d'opportunité}} strikes a creature that leaves your reach. {{Se préparer}} holds an action back for a moment you name: "the moment he comes through the door, I shoot". Other Skills add more, and their entry names the trigger.

## States

A state is a named condition that changes the rules for as long as it lasts, such as [[Aveuglé]], [[Entravé]] or [[À terre]]. Its entry says what it does and how it ends. When it does not set the duration, the DC or the damage, the Skill or item that applies it does.

Some carry an Intensity, written after their name, like [[Combustion]] 3. Applying the same state again keeps the higher Intensity, unless its text says they add together.

For an improvised consequence, the GM does not need a written state. They can grant an Advantage or a Disadvantage until the fiction logically ends it.

The Rules page and the states index carry the full list.
