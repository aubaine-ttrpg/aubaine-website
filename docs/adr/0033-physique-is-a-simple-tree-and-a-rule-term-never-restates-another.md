# ADR: Physique is a simple tree, and a rule term never restates another

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-28
**Deciders:** Kori
**Scope:**
- **Covers:** the reversal of [0031](0031-the-martial-and-psychic-trees-bring-attaque-martiale-objet-libre-and-innate-powers.md) Decision 1, made while the Physique tree was in playtest, before any table played it:
  - the Attaque martiale rule term is withdrawn;
  - the Cadence and Aplomb stances leave the Physique tree, and no signature state replaces them.
- **Does not cover:** Objet libre and the innate powers of the mind (0031 Decisions 2 and 3), which stand, or the content of each skill, which lives in its file.

---

## Context

0031 built the Physique loop on two opposed states, Cadence and Aplomb. Gaining either wiped the other, and spenders flipped one into the other. 0031 also added the rule term Attaque martiale, so that ranged weapons could feed that loop.

The decider rejected the term and both states.
- Attaque martiale repeated what Attaque and the Manœuvre tag already name.
- The stances copied the shape of Vent ascendant and Vent descendant (`data/states/vent-ascendant.json`, `vent-descendant.json`).
- A single replacement state was then tried and rejected too. The decider ruled that Physique is meant to be the simple tree: martial and roleplay features, few upgrades, and no signature mechanic.

---

## Decision 1: Attaque martiale leaves the rule terms

### Decision

- The Attaque martiale entry leaves `RULE_TERMS` in `src/lib/game/build.ts`, and its icon `mdi/sword` leaves `data/media/icons/`.
- The martial skills reference `{{attaque}}` wherever they referenced `{{attaque-martiale}}`.
- `.claude/rules/content/vocabularies.md` states the standing rule: a new rule term names a concept that no existing rule term, Caractéristique, Aptitude, state or tag already names.

### Rationale

- A rule term exists to be the single name of its concept. A second term whose definition restates the first makes the reader learn two words for one thing.
- Mener la danse and Point d'orgue take « 1 Attaque » as their activation. They replace an Attaque of the action Attaquer, which is a weapon Attaque in melee or at range. The weapon boundary therefore holds with no second term.

### Alternatives considered

- **Keep Attaque martiale**: rejected by the decider as a duplicate. It would come back only for a concept that no existing entry names.

---

## Decision 2: Physique has no signature state

### Decision

- **The states.** `data/states/cadence.json` and `aplomb.json` are removed, together with their icons `mdi/metronome` and `mdi/shield-half-full`. No state takes their place.
- **Every skill stands alone.** No Physique skill gains, spends or checks a state of the tree.
  - **Mener la danse**, the centre, is an Attaque once a turn. You may then move 1,5 m without that target's Attaque d'opportunité.
  - **Point d'orgue** is an Attaque once a turn. A hit adds 1d10 and one effect: Renversement, Désarmement or Étourdissement.
  - **Riposte** answers a melee miss with an Attaque that adds 1d10 on a hit. Its range stays « Allonge de l'arme », the range of the action Attaquer.
  - **Maître d'armes** gives 1 Avantage to your Attaques made with a weapon or bare hands, for 1 minute and 3 Énergie, with no Repos court recharge. The weapon condition is written in the skill, as `.claude/rules/content/vocabularies.md` asks, so an Attaque set by a Sort gains nothing.
  - **Croiser le fer, Garde du corps and Second souffle** keep their own effects and lose the stances.
  - **Tenir la ligne** now lasts until the start of your next turn, for 2 Énergie.
- **Upgrades stay only on the four skills kept byte for byte:** Attaque supplémentaire, Endurance, Entraînement and Développement. Point d'orgue loses Coup de grâce, Riposte loses Du tac au tac, and Fourbir loses Armurier de campagne. The tree drops from 9 upgrades to 6, and its XP total stays at 300 (`tests/fixtures/design-derived.json`).

### Rationale

- The decider wants one tree that anyone who prefers the sword can pick up without learning a mechanic. The casters' trees already carry the systems: Pression, Glyphe and Mana, and the elemental states.
- Each skill now reads and plays on its own card. Whichever skills a player has learned, none waits on another to work.
- Mener la danse gives a step rather than a push, so it does not outdo Bousculer (`BOUSCU-001`), which moves a creature on an opposed Jet.

### Alternatives considered

- **Two opposed stances (Cadence and Aplomb)**: rejected by the decider as a copy of the Vent pair. It would come back only if playtest shows the simple tree too flat next to the casters, and then in a shape that no other tree already uses.
- **One state bound to one foe, lowering its CA**: tried after the stances and rejected by the decider as needless complexity for this tree. It would come back if playtest shows the simple tree too flat next to the casters.

### Caveats

- Without a state, the tree's burst rests on Point d'orgue, Riposte and Attaque supplémentaire. Its staying power rests on Endurance and Second souffle. Playtest will say whether that keeps pace with the casters' trees.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Attaque martiale withdrawn | No rule term restates another | `src/lib/game/build.ts`, `.claude/rules/content/vocabularies.md` |
| No signature state | Physique skills stand alone, with upgrades only on the four kept skills | `data/skill-trees/physique.json`, `data/skills/` |
