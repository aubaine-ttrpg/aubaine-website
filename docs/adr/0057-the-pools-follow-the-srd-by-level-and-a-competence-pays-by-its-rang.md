# ADR: The pools follow the SRD by level, and a Compétence pays by its Rang

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-24
**Deciders:** Kori
**Scope:**
- **Covers:**
  - the PdV, Mémoire and Énergie formulas, their cap and the start;
  - the Rang, the design scale that prices an active Compétence, its gates, its payments, its
    trades and its PX price;
  - the length of the adventuring day;
  - where these numbers live in code, and the `pnpm balance` tool that measures them.
- **Amends:** 0056 Decision 1, which listed these formulas as unchanged, and 0050 Decision 4, whose
  balance pass gains a measured label.
- **Does not cover:** the Jet and its numbers (0056), how a PdV cost resolves (0034), the shield's
  Action Bonus (0038), the three currencies and their award (chapter 12), Menace (MJ chapter 02),
  or a progression system, which is still to come.

---

## Context

The owner asked for a balancing framework inspired by the spell point variant of the DMG (p.288 to
289), able to carry a later progression and combat system, as a rework of Aubaine rather than a
copy of another game.

Measured with `pnpm balance` (Decision 5), the d20 of 0056 left the game unequal:
- Jets already span SRD level 1 to 20: +5 to +12, and a DD of 13 to 20.
- The pools stopped early. Max PdV, `20 + 2 × 6 + 5 × 10` = 82, sits near a level 11 character on a
  d8 (SRD 5.2.1 FR p.24 to 25). Max Énergie per day, 2 × 24 = 48, sits near a level 8 caster's
  44 spell points (DMG p.289).
- `src/lib/game/schema.ts` capped a cost at 5 Énergie, and MJ chapter 03 gave a fixed Compétence
  X + 1 Unités for X Énergie. That is one d10 above the DMG's price at every cost the schema allowed.

Only the Nnor (`playtest`) and the Compétences de base are settled. Every tree is draft (0010).

---

## Decision 1: A Niveau of a path is an SRD level in that pool

### Decision

- `PdV = 3 + (5 + Constitution) × Niveau de Vitalité`.
- `Énergie = Esprit + 3 × Niveau d'Énergie`.
- `Mémoire = 4 + Intelligence + Niveau de Mémoire`, unchanged.
- Each path caps at Niveau 20, up from 10. A character still starts with 3 PP, which puts a 1/1/1
  start at about SRD level 1 in each pool. The Jet at creation (+5) is level 1 already (0056).
- The three paths are the three questions a character answers. In the owner's words of
  2026-10-24: « How many things he knows how to do / How many can he be hit / How many can he do ».
  A build may fill one, split two or spread three.

### Rationale

- **PdV.** The SRD's hit points on a d8 are `8 + CON + (L − 1)(5 + CON)`, that is `3 + 5L + CON × L`
  (SRD 5.2.1 FR p.24 to 25). `pnpm balance pools` recovers that formula with 0.0% error. The owner
  chose the d8 and the SRD's exact shape: « Set A because people who wants to be tank will have
  skills to boost it ».
- **Énergie.** A Repos court returns half the maximum, so a day holds about twice the maximum. The
  DMG's spell points per day (p.289) fit `3 × Niveau` on the maximum with 14.7% mean error. Esprit
  keeps its part, 1 per point.
- **Mémoire.** `4 + Intelligence + Niveau` is the SRD 5.1 rule, Intelligence plus level (p.53), plus
  4. At Intelligence +3 it stays within 1 to 3 of the SRD 5.2.1 prepared spells and cantrips at
  every level: 8 against 7 at level 1, 27 against 30 at level 20 (p.59).
- **Start.** The owner chose « Level 1, keep 3 PP », and gave the reason: a player can build a
  character however they want.

### Alternatives considered

- **A level-1 floor on every path** (`8 + CON + (5 + CON) × Niveau`, `2 + Esprit + 3 × Niveau`):
  rejected by the owner. Measured at 15 PP, it kept a 0/0/15 build at 21 PdV a day where the exact
  shape leaves 5. Reopens if focused builds die too fast in play and no Compétence grows a pool.
- **Niveau 10 equals level 20**: rejected by the owner in favour of a cap of 20, one Niveau per SRD
  level.
- **Keep the pools of v0.2.1**: rejected, because they stop near SRD level 8 to 11 while the Jets
  reach 20.

### Caveats

- A path at 0 is almost empty: 3 PdV whatever the Constitution, and only the Esprit in Énergie. A
  0/0/15 build absorbs 0.6 rounds of its share of a day's damage, against 15 rounds fought
  (`pnpm balance builds`, `tmp/content-runs/2026-10-24-resources/c0/builds-set-a.md`). The owner
  accepts it and expects Compétences to grow a pool.
- 10 PdV at creation meets SRD threats on equal terms: a CR 1 creature deals 9 to 14 damage a round
  (DMG p.274). MJ chapter 02 already lists « un effet capable d'infliger {{agonie}} à un personnage
  en pleine santé en une seule activation » as a case where the Menace ratio stops predicting.
- Forme draconique substitutes Physique for Constitution, which now multiplies by the Niveau de
  Vitalité. Its swing grows with that Niveau; the Nnor run measures it.
- Draft entries that quote the old formulas are left as they are (`docs/data-contract.md`, Known
  inconsistencies).
- Two questions are left to the progression system. Does `Menace = PM + PP` (MJ chapter 02) still
  weigh a PP right, now that a PP is a level of a path while a major milestone trades 3 PM for 1 PP?
  And how fast should PP arrive, when a path takes 20 to fill? MJ chapter 04 lists both.

---

## Decision 2: The Rang prices an active Compétence on the spell point table

### Decision

- The Rang, « Rang » in French and "Rank" in English, goes from 1 to 9. It is a design tool, like the
  Unité d'effet, and is never printed on a card.

  | Rang | Énergie | Unités | Zone | Gate |
  | ---: | ---: | ---: | --- | --- |
  | 1 | 2 | 2 | 2d6 | |
  | 2 | 3 | 3 | 4d6 | |
  | 3 | 5 | 5 | 6d6 | |
  | 4 | 6 | 6 | 7d6 | |
  | 5 | 7 | 8 | 8d6 | |
  | 6 | 9 | 10 | 11d6 | 1 fois par Repos long |
  | 7 | 10 | 11 | 12d6 | 1 Karma and 1 fois par Repos long |
  | 8 | 11 | 12 | 13d6 | 1 Karma and 1 fois par Repos long |
  | 9 | 13 | 15 | 14d6 | 1 Karma and 1 fois par Repos long |

- A Compétence at 1 Énergie buys 1 Unité. A cost between two Rangs keeps the bonus of the Rang
  below.
- One Unité is 1d10 on one target. Healing is priced by activation: 1d8 for an Action, 1d4 for an
  Action Bonus. Temporary PdV stay at 1d4.
- The limit of Rangs 6 to 9 sits on each Compétence, as its `limit` field.
- Rangs 7 to 9 have variants, in the owner's words: « baser is energie + 1 Karma + 1/Repos long but
  it can be 3 karma + 1/REpos Long, it can be health + 1 Karma + 1/repos long it might even be
  Energie + HP + 1 Karma + 1/repos long ».
- The PX price is 10 PX per Rang, and 5 PX for a Compétence at 1 Énergie. Only the price gates a
  Rang. A Compétence d'Espèce keeps its fixed 25 PX whatever its Rang.
- A cost between two Rangs counts as the Rang below, for its Unités, its limit and its price.
- Karma stands apart from the Rangs. Any Compétence may cost Karma, alone or with a `limit`.
- `energy` in the schema goes up to 13.

### Rationale

- **The costs and damage.** The DMG prices spell levels 1 to 9 at 2, 3, 5, 6, 7, 9, 10, 11 and 13
  points (p.288). It gives them 2, 3, 5, 6, 8, 10, 11, 12 and 15 d10 on one target (p.284). Its
  points per level equal its slot table priced at those costs at every level from 1 to 20, which
  `tests/unit/balance-reference.test.ts` asserts against the SRD 5.2.1 FR slot table (p.50).
- **The zone column** is the DMG's multiple-target column (p.284).
- **The healing rates** are the SRD's two healing spells: Soins, an Action, 2d8 per level (SRD
  5.2.1 FR p.177), and Mot de guérison, an Action Bonus, 2d4 per level (p.161).
- **The limit at Rang 6 and up** follows the DMG's rule that spells of 6th level and higher are cast
  once each per long rest (p.288). The owner chose it per Compétence.
- **The owner's other choices:** 10 PX per Rang, PX as the only gate, and the name: « let's keep
  Rank / Rang ». On Karma: « Karma is something that exists independtly of the higher ranks ». On
  the species price: « all species have a fixed rate on their species this allow for species skills
  to be easily distinguished in both balance, choice for players ».
- **The cost between two Rangs, and the PdV rate,** are the designer's choices the owner delegated
  on 2026-10-24 (« you decide »). 1 Énergie ≈ 2.5 PdV is measured at 2.36 at Niveau 5, 2.54 at 10 and
  2.60 at 20 (`pnpm balance ranks`).

### Alternatives considered

- **Keep X Unités for a déchaînée Compétence and X + 1 for a fixed one**: rejected. At 1 Énergie it
  bought 2d10, where the DMG charges 2 points for that. Reopens never; the table replaces it.
- **One spell of each Rang 6 to 9 per Repos long, across all Compétences**: rejected by the owner.
  It is a new base rule, and it would make the Rang visible to players.
- **A Niveau d'Énergie prerequisite per Rang**, the DMG's highest spell level: rejected by the owner.
  It is a level by another name. Reopens with the progression system.
- **5 PX per Rang**, or steps that rise faster: rejected by the owner.

### Caveats

- The pool alone does not gate a Rang. A maximum that pays Rang 9 arrives at Niveau d'Énergie 4 at
  Esprit +3, where the DMG reaches the 9th level at level 17 (`pnpm balance ranks`). The PX price
  and the progression to come carry that gate.
- The Rang is called « Rang » although other games use the word for spell levels. That is the
  owner's choice.
- No award rate for Karma is set, so a Karma price stays unmeasured. MJ chapter 04 asks how often
  the MJ grants it.

---

## Decision 3: Every active pays, and a table prices the trades

### Decision

- Only a Compétence de base is free. Any other active pays in Énergie, PdV, Karma, a long
  activation, a resource it spends, or a limit of use.
- One table of trades prices what a Compétence gives up, fixed or déchaînée:
  - several targets or a zone instead of one target: the Zone column;
  - nothing on a success instead of half: each die one size up;
  - a secondary effect: it replaces a damage die;
  - a range beyond 9 m: 1 die;
  - a zone larger than its Rang allows: 1 die per step;
  - an effect spread over turns: the same dice, never more.
- A zone grows with the Rang: 1.5 m of radius per Rang for a sphere or a cylinder of any height, a
  cube of 3 m of edge, a cone of 4.5 m or a line of 9 m by 1.5 m per Rang.
- A Compétence that takes « 1 Attaque » keeps the Attaque's weapon or fist damage and the
  Caractéristique, and adds its Unités. A natural weapon that replaces the fist counts the fist's
  `1d4` in its dice.
- A limit alone pays up to Rang 1 at 1 per Repos long, and 1 Unité at 1 per Repos court.
- A déchaînée Compétence spends its Unités at the table, through those trades, and gets no
  discount.
- Range is free up to 9 m.

### Rationale

- **Paying.** Owner, 2026-10-24: « no 0 energy or 0 ressource skills unless for basic actions or
  if it is justified by paying something else like time ». Asked the same day whether a limit
  counts as that payment, the owner answered yes.
- **The déchaînée trades.** Owner: « energy is fixed but the DM and Player trades damage; range,
  duration, zone and such within the fixed energy. so it actually should have a go to table with a
  few common cases ».
- **Nothing on a success.** The DMG assumes half damage on a successful save or a missed attack,
  and allows 25% more when a success takes nothing (p.284). One die size up (a d10 to a d12, a d6
  to a d8) gives 18% to 29%.
- **Range.** Owner: « free up to 9m, Aubaine deals with realistic things, above 9 meteres is mostly
  extreme long range on real battle maps ».
- **Zones and the rest of the trades.** Owner: « the higher the rank the higher the allowed distance
  and zone ? your choice about what an be balanced easier ». The SRD's zone spells grow by about
  1.5 m of radius per spell level: a 4.5 m cube at the 1st (Vague tonnante, SRD 5.2.1 FR p.185),
  3 m at the 2nd (Fracassement, p.146), 6 m at the 3rd (Boule de feu, p.122) and the 4th (Tempête de
  grêle, p.182), and an 18 m cone at the 5th (Cône de froid, p.129), about the surface of a 7.5 m
  radius. A die per step beyond is the simplest price that keeps bigger zones affordable only where
  a Rang has dice to spare.
- **The secondary effect.** Owner: « It should replace the die i think ».
- **The « 1 Attaque » Compétence.** Owner: « if it's the skill the basic one it's weapon damage or
  fist damage ». The fist's `1d4` is the unarmed Attaque of chapter 10.
- **The limit as payment** follows the SRD's species spells, cast once per long rest without a slot
  (SRD 5.2.1 FR p.88 to 91).

### Alternatives considered

- **A discount for a déchaînée Compétence**, one Unité less than the fixed row: rejected by the
  owner, who prices the flexibility through the trades.
- **Each range step costs a die**: rejected. Neither the DMG nor the SRD's 1st-level spells price
  range.

### Caveats

- The table of trades sits in the Livre du MJ. Whether players need it in the Livre du joueur,
  beside the Déchaîné tag, is left open.

---

## Decision 4: The day is four to six encounters, with two Repos courts

### Decision

- Balance is judged over four to six mixed encounters between two Repos longs, with two Repos
  courts.
- A Repos court still returns half the maximum PdV and Énergie.
- Chapter 12 changes from « cinq ou six » to four to six, the owner's ruling of 2026-10-11 that
  `.claude/skills/aubaine-content/references/balance.md` already held.

### Rationale

- The owner kept the ruling on 2026-10-24, and kept the half per Repos court: « Keep half per Repos
  court ».

### Alternatives considered

- **Six to eight encounters, as the DMG (p.84)**: rejected by the owner. Reopens if play shows
  shorter days leave too much Énergie per encounter.
- **Énergie returns only on a Repos long**, as spell points do: rejected by the owner.

---

## Decision 5: The rules live in one module, and `pnpm balance` measures them

### Decision

- `src/lib/game/resources.ts` holds the pool formulas, the cap, the Rang table, the cost between
  Rangs and `MAX_ENERGY_COST`. The schema reads the Énergie cap from it.
- `tests/data/resources.test.ts`, run by `pnpm data:check`, parses every formula and every Rang
  table a book chapter prints, in both languages, and compares them with the module.
- `tools/balance/` measures them, through `pnpm balance pools|ranks|builds|entries|report`:
  - exact dice and kept-die arithmetic;
  - the SRD and DMG curves, each with its page;
  - integer fits of the pool formulas;
  - exchange rates;
  - builds at equal PP;
  - the entries of a species or a list of ids.
- Its report is deterministic and lands in `tmp/`.
- A content run executes the tool before its balance pass. The pass reads the report and labels what
  it gives `measured` (0050 Decision 4, addendum).
- The tool stores numbers, never text, with the document and page of each. The chapters name no
  other game.

### Rationale

- The owner rejected estimated balance numbers on 2026-10-11 (« stop guessing ») and asked for
  measurements. Every number in this record came from the tool or a cited page.
- One module means one owner of each number. The schema imports the cap rather than writing 13
  twice, and the drift test keeps the chapters, which readers need, from disagreeing with the code.
  It takes its expected values from the module, so it does not pin content (0055).

### Alternatives considered

- **The numbers in the tool alone**: rejected, because the schema needs the cap and a game rule
  belongs to the game layer.
- **A Markdown directive that prints the formulas from code**: rejected as new markup for three
  lines. Reopens if the progression system needs more computed values in chapters.

---

## Summary

| Item | Role | Where |
| --- | --- | --- |
| Pools | SRD level per Niveau, cap 20 | `src/lib/game/resources.ts`, Livre du joueur chapter 03 |
| Rang | Énergie, Unités, zone, gate, PX | `resources.ts`, Livre du MJ chapter 03 |
| Payment and trades | every active pays; the table of trades | Livre du MJ chapter 03 |
| Day | four to six encounters, two Repos courts | Livre du joueur chapter 12 |
| Measure | `pnpm balance`, the drift test | `tools/balance/`, `tests/data/resources.test.ts` |
