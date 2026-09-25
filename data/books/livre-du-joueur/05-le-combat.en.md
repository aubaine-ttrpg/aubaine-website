---
title: "Combat"
description: "Turn economy, initiative, attacking, Armour Class, damage types, dropping to 0 HP and states."
---

Combat has no resolution rules of its own. The Rolls are the same ones you make everywhere else. What it adds is an order of play and a budget per turn.

## Your turn

A round lasts about 6 seconds, the time it takes for every creature to have its turn.

On your turn you have four things. They are independent: not spending one does not give you another.

One Action
: Most Skills are played here, starting with {{Attaquer}}.

One Bonus Action
: A quick action, usually reserved for Skills that say so. It does not replace the Action, and nothing converts one into the other.

One movement
: Your Speed, 9 metres by default. Split it freely before, during and after your actions.

One Reaction
: Outside your turn, when a rule gives you a trigger. It comes back at the start of your next turn.

### Distance

Everything is counted in steps of 1.5 metres. Contact is 1.5 metres, a reach weapon carries 3 metres, and the usual ranged distances are 9, 12 and 18 metres.

You may break your movement as often as you like within your turn, so long as the total stays inside your Speed.

Your Speed can fall to 0, and several states manage it. Movement of 0 does not stop you acting: you keep your Action, your Bonus Action and your Reaction.

## Initiative

At the start of a fight, each player character rolls:

`1d4 + Dexterity`

Play runs from the highest result down to the lowest. Players win ties against their opponents, and settle ties among themselves however they like.

The die is deliberately small. A gap in Dexterity weighs heavily in this order, more than in any other Roll in the game.

The order holds for the whole fight. It is not rolled again each round.

### Two variants

The GM may roll once for a group of identical creatures, and separately for each major creature. That shortens a fight with many opponents without changing any rule.

They may also group allied positions that run together with no opponent between them. Allies in one block then interleave their movement and their actions. Each keeps their own start and end of turn, which matters for anything that triggers there, and Reactions interrupt as normal.

## Attacking

The {{Attaquer}} action makes one attack with an equipped weapon or unarmed.

Make the Roll the weapon states against the target's AC. On a success the target takes the weapon's damage, increased by the Characteristic that Roll used.

That Characteristic always adds. It is the same one on both sides of the calculation: whatever let you hit is what makes the blow land harder.

Unarmed, a Strike resolves on a `Strength + Melee` Roll, at 1.5 metres, for `1d4 + Strength` damage.

### What a weapon states

Every weapon prints its own line, and that line is what counts:

- the Characteristic and the Aptitude of its Roll;
- one range, and only one;
- its damage dice and damage type;
- its properties.

A target beyond the range cannot be attacked. No general rule lets you shoot further by accepting a penalty; that takes a property saying so.

Everything unusual a weapon does goes through a named property printed on it. A Finesse weapon lets you swap `Strength + Melee` for `Dexterity + Finesse`. Two Light weapons, one in each hand, open an attack as a Bonus Action.

## Armour Class

AC is the number an attack has to reach to hit you. With no armour:

`AC = 12 + Dexterity`

Worn armour erases that formula and imposes its own. **It never adds to 12.** This is the rule most often forgotten.

Only one base formula applies at a time, the one on the piece in the Armour slot. Shields and other explicit modifiers are added afterwards, on top of the result.

1. Take your armour's formula, or `12 + Dexterity` if you wear none.
2. Add the shield.
3. Add the other explicit modifiers, piece by piece.

An example. Unarmoured with Dexterity +3, your AC is 15. Put on armour rated `14 + Dexterity` and it becomes 17, not 29. Add a targe and it reaches 18.

Each armour prints its own formula, and some cap the Dexterity they let you count or demand a minimum Strength. Read the piece: it carries its constraints.

## Damage types

Damage can carry a type, such as Bludgeoning damage or Fire damage. A weapon prints its own, and a Skill names it when its damage has one.

A creature can have a resistance or a vulnerability to one type of damage, to one source of damage, or to all damage, typed or not. With a resistance it takes half the damage concerned, rounded down. With a vulnerability it takes double. Neither involves a Roll: both apply to the total once the dice are rolled.

When other rules change the same damage, work in this order:

1. Total the damage with everything that raises or lowers it by a fixed number, such as an attack's Characteristic or "you take 1 less".
2. If the Skill deals only half, on a success for instance, halve that total, rounded down.
3. Halve the result for a resistance, or double it for a vulnerability.

When one blow deals damage of several types, a resistance or a vulnerability touches only the part of its type. Anything added without naming a type, such as an attack's Characteristic, counts with the damage of the weapon or the Skill. Anything that removes a fixed number without naming a type, such as "you take 1 less", comes off the largest part.

Damage reduced to 0 does not count as damage taken, so it does not lower the [[Agonie]] counter.

A resistance and a vulnerability to the same damage cancel out, and that damage stays as it is. A resistance received from two sources applies only once, under "The same effect twice" in How to play, and a vulnerability works the same way. Two resistances and one vulnerability to the same damage therefore still cancel out.

An example. A blow deals 10 Bludgeoning damage to a creature that takes 1 less and has a resistance to Bludgeoning damage: it takes 4, half of 9 rounded down. With a vulnerability instead, it would take 18.

## Dropping to 0 HP

Your HP never falls below 0. A creature that reaches it gains [[Agonie]] 3 and begins to die.

The counter drops by 1 at the end of each of its turns, but not during the turn it received it. So it has three of its own turns before the end. Taking damage costs it another, at most once per enemy action.

At 0, the creature dies.

Throughout, it is [[À terre]] and cannot get up, and it can no longer play anything that costs Energy.

### Getting someone up

Any healing that restores at least 1 HP ends [[Agonie]] immediately. The counter does not linger: one point restored is enough, whatever its size.

With no magic and no potion, an Action and a successful Intelligence + Medicine Roll against a DC of 20 restores 1 HP, which ends the state.

Either way the creature stays [[À terre]]. Getting up costs half its movement, on its turn.

Three turns is short but it is not instant. A downed ally is a problem to solve during the fight rather than after it, and they stay one even if nobody hits them again.

## States

A state is a named condition that changes the rules while it lasts. Its entry says what it does and how it ends. When the entry leaves its duration, its DC or its damage unset, the Skill or item that applies it gives them.

Some carry an Intensity, written after their name, such as [[Combustion]] 3. Reapplying the same state keeps the highest Intensity, unless its text says they add up.

For an improvised consequence the GM needs no written state. They may grant an Advantage or a Disadvantage until the fiction brings it to a sensible end.
