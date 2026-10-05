---
title: "Damage and healing"
description: "HP, damage and its types, resistance and vulnerability, dropping to 0 HP and Agonie, healing and temporary HP."
---

{{pdv}} measure how much a creature can take before it falls. Damage brings them down, healing and rest bring them back up, and when they reach 0, a race against death begins.

## HP

Your maximum {{pdv}} is worked out at creation and rises with your Vitality, as the Creating a character chapter explains. Your current {{pdv}} go down when you take damage and back up when you are healed.

They never go above your maximum and never below 0.

A Skill can cost {{pdv}}. When you play it, roll that cost and lose that many {{pdv}}. This loss is not damage: no resistance reduces it, and nothing that triggers on taking damage triggers from it. It can drop you to 0 {{pdv}}: you then gain {{agonie}} 3 as with any drop, and the Skill resolves after that.

## Damage

A Skill, a weapon or a danger that wounds states its damage: dice, sometimes a fixed number, often both. An {{attaque}} always adds the {{caracteristique}} its {{jet}} used.

Damage can carry a type, such as Bludgeoning, Fire or Acid damage. A weapon prints its own, and a Skill names it when its damage carries one. The type matters when a creature resists it or is vulnerable to it, or when a rule names it.

## Resistance and vulnerability

A creature can have a resistance or a vulnerability to a damage type, to a source of damage, or to all damage, typed or not.

Resistance
: It takes half the damage concerned, rounded down.

Vulnerability
: It takes double.

Neither calls for a {{jet}}: they apply to the total, once the dice are rolled. When other rules change the same damage, go in this order:

1. Total the damage with anything that raises or lowers it by a fixed number, such as an {{attaque|Attack's}} {{caracteristique}} or "you take 1 less".
2. If the Skill only deals half, on a success for instance, halve that total, rounded down.
3. Halve the result for a resistance, or double it for a vulnerability.
4. If you block with {{LEVBOU-001}}, take away what your shield stops.

When one blow deals damage of several types, a resistance or a vulnerability only touches the share of its own type. Anything added without naming a type, such as an {{attaque|Attack's}} {{caracteristique}}, counts with the weapon's or the Skill's damage. Anything that removes a fixed number without naming a type, such as "you take 1 less", comes off the largest share.

A resistance and a vulnerability to the same damage cancel out, and that damage does not change. A resistance from two sources applies only once, following the same-effect-twice principle in the How to play chapter, and so does a vulnerability. Two resistances and one vulnerability to the same damage therefore still cancel out.

> [!EXAMPLE] Example
>
> A 10-point Bludgeoning blow hits a creature that takes 1 less and has resistance to Bludgeoning damage. Take off the 1 first, then halve: it takes 4, half of 9 rounded down. With a vulnerability instead, it would take 18.

Damage reduced to 0 does not count as damage taken. It triggers nothing that triggers on taking damage, and it does not lower the {{agonie}} counter.

Some creatures are entirely beyond an effect's reach: an Undead cannot be {{endormi}}, for example. Their entry, or the state's, says so.

## Dropping to 0 HP

When your {{pdv}} drop to 0, you gain {{agonie}} 3 and start dying.

The counter goes down by 1 at the end of each of your turns, but not on the turn you gained it: so you have three of your own turns before the end. Each enemy action that damages you costs you one more, once at most per action.

At 0, you die.

While {{agonie}} lasts, you are {{a-terre}} and cannot stand up, and you can play nothing that costs {{energie}} or {{pdv}}.

### Getting someone up

Any healing that restores at least 1 {{pdv}} ends {{agonie}} at once. The counter is not held back: a single point is enough, however far down it was.

Without magic or a potion, an {{action}} and a successful {{intelligence}} + {{medecine}} {{jet}} against {{dd}} 20 restore 1 {{pdv}}, which ends the state.

Either way, the creature stays {{a-terre}}. Standing up costs it half its {{vitesse}}, on its turn, and a creature whose {{vitesse}} is 0 cannot stand up.

Three turns is short without being instant. An ally on the ground is a problem to solve during the fight, and it stays one even if nobody is hitting them any more.

## Healing

Healing restores {{pdv}}, never past your maximum: anything over is lost. A healing Skill, a potion or a rest says how much it restores.

Between fights, rest does most of the work. The Resting and progression chapter says what a {{repos-court}} and a {{repos-long}} give back.

## Temporary HP

Some Skills grant temporary {{pdv}}. They form a separate pool that soaks up damage before your {{pdv}} and does not count towards your maximum.

- Temporary {{pdv}} from different effects add together.
- The same effect does not stack with itself: you keep the higher total.
- Healing does not restore temporary {{pdv}}.
- The effect that grants them states their duration. Any left over disappear at the end of that duration, or at the end of a {{repos-court}} or a {{repos-long}}, whichever comes first.
