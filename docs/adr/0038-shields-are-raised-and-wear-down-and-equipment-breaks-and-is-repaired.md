# ADR: Shields are raised and wear down, and equipment breaks and is repaired

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-04
**Deciders:** Kori
**Scope:**
- **Covers:**
  - how a shield gives its CA and blocks;
  - the rule terms Encaissement and Brisé;
  - the basic skills Lever le bouclier, Fabriquer and Réparer;
  - the Encaissement values of the three shields and their rarity ceiling.
- **Does not cover:**
  - the wording of each entry, which lives in its file;
  - the CA ceiling of armour, which stays as `docs/runbooks/add-an-item.md` states it;
  - the place of rolled damage reductions such as Parade in the damage order, which chapter 11 still leaves open.
- **Related:** [0033](0033-physique-is-a-simple-tree-and-a-rule-term-never-restates-another.md) for the rule that a new term never restates an existing one.

---

## Context

Until this record, a shield was a passive `CA +N` headline (`data/equipment/items/targe.json`, `pavois.json`) plus a 1d4 bash. Nothing in the rules let a shield stop damage, nothing in the game could break, and crafting had no duration.

The decider asked for shields that work by raising and blocking. A raised shield gives its CA, and a block spends a pool the shield carries, which the decider named Encaissement.

The word comes from the legacy Aubaine notes under `tmp/old-aubaine/` (gitignored). There, the Sorcelame's Lame-sort « possède 10 d'Encaissement » and becomes fragile when it reaches 0. The word was absent from the rules: `git grep -i encaiss` found only the ordinary verb.

The decider settled each point in this session. Draft content took no part in the design, because a draft is not a source of truth.

---

## Decision 1: A shield protects only while raised, through a basic skill

### Decision

- Lever le bouclier, `data/skills/LEVBOU-001.json`, is a Compétence de base, listed in `data/skill-lists/basic-skills.json` after Esquiver.
  - It costs 1 Action Bonus and lasts until the start of your next turn.
  - Its first sentence requires a shield held in one of your hands.
- **Garde.** While it lasts, your CA gains the CA bonus the shield prints.
- **Blocage.** While it lasts, an Attaque you see that hits you can be blocked with your Réaction, once its damage is rolled.
  - After any resistance or vulnerability, the shield stops as much of that damage as its Encaissement allows, and you take the rest.
  - The Attaque's other effects apply.
- Lever le bouclier ends early if you let go of the shield or it becomes Brisé.
- Shields carry no `grants`. A shield prints `CA`, `Encaissement` and `Dégâts` as its headlines, and the basic skill reads them.
- The CA chapters follow:
  - `data/books/livre-du-joueur/10-le-combat.md` adds the shield only « s'il est levé »;
  - `03-creer-un-personnage.md` adds the shield only when raised;
  - chapter 10 gains a « Lever un bouclier » subsection;
  - `11-degats-et-soins.md` adds the block as step 4 of the damage order.

### Rationale

- The decider ruled that raising is something anyone holding a shield can do, so it belongs with the basic skills. The requirement sits in the skill, the way Croiser le fer (`data/skills/CROFER-001.json`) requires a held weapon or shield.
- Basic skills carry no Énergie (`basic-skills.json`, `note`). The cost is elsewhere:
  - raising takes the Action Bonus every turn you want the CA;
  - every block spends Encaissement that only Réparer brings back, with materials.
- The skill states its own step in the damage order, after resistance and vulnerability. The catalogue booklet prints the skill without chapter 11, so the order has to live in the skill.
  - The CERAC set's six-piece bonus already writes its own step this way (`data/equipment/sets/CERAC.json`).
- A full block is damage reduced to 0. `11-degats-et-soins.md:47` already says such damage counts as no damage taken, so a full block costs no Concentration Jet and triggers nothing.
- Tenir la ligne (`data/skills/TENLIG-001.json`) is the precedent for an Action Bonus stance that opens a Réaction use.
- Two shields give one CA. The skill raises one shield, so this settles a question that « Une main (x2) » in chapter 07 had left open.

### Alternatives considered

- **Keep the passive CA and add the block on top**: rejected by the decider in favour of the raise. Reopen it if playtest shows that the Action Bonus spent every turn crowds out the Action Bonus skills a shield bearer wants, such as Tenir la ligne.
- **Each shield grants Lever le bouclier**: built first and rejected by the decider. A grant repeated on every shield adds nothing the requirement does not say. Reopen it if one shield needs a raise of its own.
- **Price the block at 1 Énergie**, like Parade and Croiser le fer: rejected by the decider. The Encaissement pool and its repair cost already pay for it.

### Caveats

- Agonie forbids only the actions that cost Énergie or PdV (`data/states/agonie.json`), so a creature in Agonie can still raise a shield and keep its CA. A sentence added to Agonie stops its Encaissement from stopping any damage, which removes the block.
- The shields have no English overlay. On `/en`, their `CA`, `Encaissement` and `Dégâts` headlines print in French, as their other cells already did.

---

## Decision 2: Encaissement and Brisé are rule terms

### Decision

- `RULE_TERMS` in `src/lib/game/build.ts` gains two entries.
  - **Encaissement** / Durability, key `{{encaissement}}`. It is what a piece of equipment can still take in your place before it gives way. The piece prints its maximum, each point of damage it stops removes 1, and at 0 the piece is Brisé. Only Réparer brings it back up.
  - **Brisé** / Broken, key `{{brise}}`. A Brisé piece still occupies its slot, but no other rule counts it as worn or held. Nothing it prints applies, which includes the Skills it grants, and it does not count toward its set's tiers.
- The icons are `game-icons:shield-impact` and `game-icons:cracked-shield`, added to `data/media/icons/game-icons/`.
- Encaissement values: Targe 8, Pavois 16, Pavois du Parangon de l'Ordre des Céracites 20.
- Ceiling: a Commun shield sets the base Encaissement of its type, and a Peu commun one stays at it. A Rare or Très rare piece adds up to a quarter of that base, rounded down, and a Légendaire or Artéfact piece up to half. The rule sits in `docs/runbooks/add-an-item.md`.
- The Agonie state adds that the Encaissement of its pieces stops no damage.
- `12-repos-et-progression.md` lists Encaissement among what a rest does not give back.

### Rationale

- No existing term names this concept. That was checked against `RULE_TERMS`, `data/meta/`, `data/states/` and the skill, item and tree keys, as `.claude/rules/content/vocabularies.md` requires.
- Encaissement is not PdV given to an object. Objects that can be attacked already carry CA and PdV in their own text, as the resin of Colmater does (`data/skills/COLMAT-001.json`). Encaissement differs in three ways:
  - it is spent in the wearer's place;
  - healing never restores it;
  - reaching 0 breaks the piece instead of destroying it.
- Brisé is defined for any piece of equipment, not for shields alone, so a future piece that can break needs no new word. The decider wanted Brisé to do nothing, set tiers included, which is one rule with no exceptions.
- The decider chose the values. Against 29 starting PdV (`03-creer-un-personnage.md`, worked example) and hits around 1d8 + 3, the Targe stops about one hit between repairs and the Pavois about two. The Pavois du Parangon's 20 is the Pavois's 16 plus a quarter, which sets the ceiling.
- The English labels follow the decider's choice of Durability. « Soak » was rejected because the English chapter 11 already says temporary PdV « soak up damage ».

### Alternatives considered

- **A flat reduction per block, with the excess hurting both the shield and you, over a separate durability**: rejected by the decider. It needs two numbers and more bookkeeping. Reopen it if a single pool proves too swingy, since one large hit can empty it.
- **A flat reduction that never breaks**: rejected. It plays as another Parade and would need an Énergie cost on every block.
- **A Brisé piece still counting toward its set**: rejected by the decider for the simpler rule. Reopen it if breaking one piece of a six-piece set proves too punishing.

---

## Decision 3: Fabriquer and Réparer are basic skills that take 10 minutes

### Decision

- **Fabriquer**, `data/skills/FABRIQ-001.json`, is a Compétence de base taking 10 minutes.
  - It follows the recipe the entry prints, or the one the MJ sets for an object or modification the player proposes.
  - It runs the chapter 07 procedure: materials covering each Type up to the cost, consumed when committed, then the Jets in order, with the first failure losing everything.
- **Réparer**, `data/skills/REPARE-001.json`, is a Compétence de base taking 10 minutes. It works on a piece that is Brisé or has lost Encaissement.
  - Commit materials that cover each Type of the recipe and reach half its cost, rounded up. A material counts for one Type.
  - Then make the recipe's last Jet. On a success, the piece is no longer Brisé and gets all its Encaissement back. On a failure, the materials are lost.
  - For a piece whose entry prints no recipe, the MJ sets the Types, the cost and the Jet.
- `07-l-equipement.md` and the Codex Ornamentum guide (`data/equipment/guide.md`) teach both skills. They also gain a « Les pièces brisées » section, the broken-equipment section the decider asked for in the Livre du joueur.
- The English titles are Fabricate and Repair. « Craft » is already the English label of the Artisanat Aptitude (`data/meta/aptitudes.json`).

### Rationale

- The decider ruled that restoring costs time and material, using the recipe's last Jet and half the craft value. Half makes repair worth doing over forging a new piece, while it still drains the materials the loot rules hand out.
- The decider set crafting to 10 minutes as well. Chapter 12 already notes that a 10-minute Compétence often fits in a Repos court (`12-repos-et-progression.md:49`), so a shield can be repaired between fights, at the cost of its materials.
- Récolter (`data/skills/RECOLT-001.json`) is the precedent for a basic skill that runs an equipment procedure. Both new skills carry the Technique tag only, as Récolter does.
- `docs/runbooks/add-a-basic-skill.md` told authors to leave tags out, while `docs/runbooks/add-a-tag.md` and the data tag basic skills. The runbook now defers to add-a-tag.md.

### Alternatives considered

- **Repair at full craft cost**: rejected by the decider. A repair would cost as much as a new piece.
- **Repair restored by a rest**: rejected by the decider in favour of time and material.
- **A workplace requirement for crafting or repair**: no published rule requires one, so none is written.

### Caveats

- The draft Artisan tree predates both skills and was not reconciled with them. A draft is not a rule, so its skills are left as they are, Remise en état, Atelier portatif, Métier and Improvisation among them.
- The printed booklets in `data/media/pdf/` describe the old shields until they are regenerated.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Lever le bouclier | Basic skill: raise for CA, block with Encaissement | `data/skills/LEVBOU-001.json` |
| Encaissement, Brisé | Rule terms for equipment wear | `RULE_TERMS` in `src/lib/game/build.ts` |
| Fabriquer, Réparer | Basic skills: craft and repair in 10 minutes | `data/skills/FABRIQ-001.json`, `REPARE-001.json` |
| Shield values and ceiling | Targe 8, Pavois 16, Parangon 20; +25% and +50% by rarity | shield items, `docs/runbooks/add-an-item.md` |
| Broken equipment | Explanation and example | `07-l-equipement.md`, `data/equipment/guide.md` |
