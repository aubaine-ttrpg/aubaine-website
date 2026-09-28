# ADR: The Draugar pays in blood, and an archetype leans on one or two Caractéristiques

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-28
**Deciders:** Kori
**Scope:**
- **Covers:** three choices made while bringing the Draugar archetype to sixteen nodes and to playtest:
  - how a cost paid in PdV resolves;
  - what the Draugar plate holds, and why Greffe stays open;
  - how an archetype chooses the Caractéristiques its skills roll.
- **Does not cover:** the wording of each skill, which lives in its file, or the Sang Domaine itself, which [0030](0030-the-mage-brings-ether-glyphe-mana-and-learning-by-inscription.md) already notes has no tree of its own.

---

## Context

The Draugar is « L'abomination sanguine »: a cursed body that grafts what it takes, pays for its magic in its own blood, and drinks it back. The owner's Notion class names its three pillars Voracité, Résilience and Assimilation, and the old Trait (`tmp/old-aubaine/Compétences/Trait/Draugar (Trait).md`) gives the vibe. The tree was a 13-node draft with a cover and a back cover.

Its skills are the only ones in the repository that carry a `life` cost (verified with `grep -l '"life"' data/skills/*.json`: eight Draugar files, no others). No rule said how such a cost resolves. `data/books/livre-du-joueur/03-creer-un-personnage.md` only covers Énergie: « Une Compétence dont le coût dépasse votre réserve ne peut pas être jouée. » `data/books/livre-du-mj/03-concevoir-une-competence.md` allows the resource without defining it: « Une règle peut employer les PdV ou le {{karma}}, qui pèsent plus lourd. »

---

## Decision 1: a PdV cost is a loss that can drop you into Agonie

### Decision

- The Draugar keeps PdV as the currency of its costs. None of its skills carries an `energy` cost.
- `data/books/livre-du-joueur/11-degats-et-soins.md`, section « Les PdV », and its English overlay state the rule once:
  - You roll a PdV cost when you play the skill, and you lose that many PdV.
  - The loss is not damage. No resistance reduces it, and nothing that triggers on damage taken triggers from it.
  - It can drop you to 0 PdV. You then gain Agonie 3, as with any drop to 0, and the skill resolves after that.
- The existing Énergie limit in Agonie now covers PdV too, in `data/states/agonie.json` and in the chapter's Agonie paragraph (FR and EN): nothing that costs Énergie or PdV can be played while Agonie lasts.

### Rationale

- The decider chose this option over the two safer ones. Blood magic that can kill you is the Draugar's own tension, the counterpart of Énergie scarcity for the other trees.
- Healing ends Agonie (« Tout soin qui lui rend au moins 1 {{pdv}} met fin à l'état », `data/states/agonie.json`). A Draugar at low PdV can therefore pay for Curée, fall, and drink its way back up. The tree's lifesteal skills turn the risk into a choice.
- A loss that is not damage keeps resistances and damage triggers from discounting a cost the player chose to pay.
- Writing the limit next to the Énergie one says it once, where a reader of Agonie already looks.

### Alternatives considered

- **Never below 1 PdV**: rejected by the decider because it removes the risk of dying to your own magic. It would come back if playtest shows the Draugar dying too often to its own costs.
- **The cost must fit your current PdV, like Énergie**: rejected because it caps a wounded Draugar exactly when its lifesteal matters most. It would come back if the fall into Agonie proves too easy to exploit.

### Caveats

- A player can now choose to fall into Agonie. Playtest will say whether the chain « pay, fall, heal » is too strong with Curée at 4d6.

---

## Decision 2: the plate reaches sixteen nodes, and Greffe stays open

### Decision

- **Three new nodes** fill the three slots of the standard grid that the Draugar left empty:
  - **Curée** (`CUREEX-001`), the tier 10 capstone above Croc sanguinaire. Every bleeding creature of your choice resists or loses 6d6 to its own blood, and each failure gives you 1d6 PdV.
  - **Membre errant** (`MEMERR-001`), under Dissection. It detaches an eye, an ear, a hand or a graft that keeps obeying you.
  - **Langue de sang** (`LANSAN-001`), beside the heart. Tasting a creature's blood lets you understand its languages for 1 hour.
- Ponction moves one slot to the left so that the capstone sits at the top of its branch, where Mage, Physique and Vent keep theirs.
- **Greffe stays open.** A graft still gives « ce qu'elle donnait à celle qui la portait ». Only its wording changes: « porter » replaces « maintenir », and « rejet » is defined as the graft your body drops when you add one too many.
- **Balance fixes:**
  - Croc sanguinaire can be played once per turn.
  - Régénération heals 1d4 plus Constitution.
  - Sang-froid gives Agonie 4. It used to waive a Désavantage at low PdV that no rule defines.
  - Greffes dissimulées reads its DD from Intelligence + Médecine.
- **Status and art.** The tree becomes `playtest`. Both of its pictures move to `data/media/unassigned/`, and the card and booklet fall back to the placeholder.
- **Totals.** The base price rises from 205 to 285 PX (`tests/fixtures/design-derived.json`), inside the 240 to 300 PX of the other playtest trees, and the upgrade count stays at 11.

### Rationale

- The decider asked that every tree balance short and easy skills, roleplay skills, and complex skills. Langue de sang is short, Membre errant is roleplay and complex, and Curée is the complex payoff the plate lacked. All three come from the owner's Notion page, rewritten in Aubaine terms.
- The decider kept Greffe open because Aubaine's heart is « roleplay au service du gameplay ». The MJ rules what a graft gives, the way the fiction already decides it.
- Each balance fix follows a house pattern or removes a reference to a rule that does not exist:
  - « une fois par tour » is the limit on the two « 1 Attaque » Manœuvres of `data/skill-trees/physique.json`.
  - « 1d4 {{pdv}} plus votre {{constitution}} » is the phrasing of Second souffle (`SECSOU-001`).
  - No chapter under `data/books/` penalises acting at low PdV.

### Alternatives considered

- **Bound each graft to one bodily faculty (a movement, a sense, a natural weapon or a resistance)**: rejected by the decider in favour of roleplay. It would come back if playtest shows grafts outclassing the other trees.
- **Saigner à blanc or Forme abominable as the capstone**: rejected in favour of Curée, which cashes the pay-in-blood loop rather than one bite or one transformation.
- **Murmures cadavériques as a new node**: dropped because Festin (`FESTIN-001`) already lets a Goule taste a corpse's memory.

---

## Decision 3: an archetype leans on one or two Caractéristiques

### Decision

- An archetype favours one or two Caractéristiques, and each of its skills rolls the one that suits it. Only the six elemental Domaines let a skill choose freely among Intelligence, Esprit and Charisme.
- The Draugar leans on Intelligence and Constitution:
  - Saignée, Curée, Dissection, Chirurgie de campagne and Greffes dissimulées use Intelligence.
  - Régénération and Sang-froid lean on Constitution.
  - Croc sanguinaire keeps Force or Dextérité, like every weapon Attaque.
  - Visage d'emprunt keeps Charisme + Tromperie, because it impersonates.
- The derived primary Caractéristique of the tree is Intelligence (`tests/fixtures/design-derived.json`).

### Rationale

- The decider corrected a stricter reading, that an archetype rolls one Caractéristique only. What gives an archetype its character is its skills and its vibe, not one Caractéristique. This extends the ruling in [0031](0031-the-martial-and-psychic-trees-bring-attaque-martiale-objet-libre-and-innate-powers.md) Decision 3, where only the elemental trees offer the choice and Psychique is tied to Esprit. It does not reverse it.
- Forcing a single Caractéristique would have moved Visage d'emprunt off Charisme and Croc sanguinaire off the Caractéristiques of an Attaque, for no gain in feel.

### Alternatives considered

- **One Caractéristique per archetype**: rejected by the decider as too rigid. A tree may still end up with one, as the Mage does with Intelligence, when that is what its skills call for.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| PdV cost ruling | A cost in PdV is a loss, down to 0 and into Agonie | `data/books/livre-du-joueur/11-degats-et-soins.md`, `.en.md`, `data/states/agonie.json` |
| Sixteen nodes | Curée, Membre errant, Langue de sang, Ponction moved | `data/skill-trees/draugar.json`, `data/skills/` |
| Greffe stays open | Roleplay au service du gameplay | `data/skills/GREFFE-001.json` |
| One or two Caractéristiques | Skills pick what suits them | the Draugar skills, `tests/fixtures/design-derived.json` |
