# ADR: The Jet is a d20, and Aubaine keeps its own rules

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-24
**Revised:** 2026-10-24, the PdV and Énergie formulas change after all, through 0057 (addendum in Decision 1)
**Deciders:** Kori
**Scope:**
- **Covers:** the die of every Jet and the numbers tied to it: Avantage and Désavantage dice, the two
  criticals and their rule terms, the DD scale, a Compétence's DD, the CA without armour, armour and
  other fixed CAs, every fixed DD, the conversion of draft entries, and the 0.3.0 version.
- **Does not cover:** damage dice, PdV, Énergie, Mémoire, Initiative and the three currencies, which
  do not change; the roll notation, which stays 0050 Decision 3 (amended for its DD base); the
  printing and archiving of booklets, which stays 0013.

---

## Context

Up to v0.2.1 every Jet is `2d12 + Caractéristique + Aptitude`
(`data/books/livre-du-joueur/02-comment-jouer.md`, and the `jet` definition in `RULE_TERMS`,
`src/lib/game/build.ts`). Its numbers were set by hand for that curve, and no simulator exists to
calibrate them (`tools/balance/` is empty). The decider wants a d20 so that the System Reference
Document's numbers, already played on that die, can be taken as they are: `tmp/srd/FR_SRD_CC_v5.2.1.pdf`
and `tmp/srd/SRD_CC_v5.1_FR.pdf` (CC BY 4.0) are the copies read. Only numbers are taken; no SRD
text is reproduced, and no chapter names another game.

---

## Decision 1: The Jet is 1d20 + Caractéristique + Aptitude, and every mechanic stays

### Decision

- A Jet is `1d20 + une Caractéristique + une Aptitude`, compared to a DD, a CA or an opposed Jet. A
  total equal to the defence succeeds.
- An Avantage adds a d20 and you keep the highest die; a Désavantage adds a d20 and you keep the
  lowest. They cancel one for one, and what remains has no cap.
- Unchanged: Expertise and the Spécialité each give 1 Avantage; a Karma point spent after the roll
  adds its die and the kept die is picked again; the tie-break of opposed Jets; Initiative
  `1d4 + Dextérité`; the caps of +3 and +2 at creation and +6 in play; the PdV, Mémoire and Énergie
  formulas; damage dice; the CA moved by three steps at most; Fatigue's −1 per stack.

### Rationale

- The decider, 2026-10-24: « we are not recreating dnd, or using SRD, we just migrating to D20 which
  happen to be the die used by DND so it's great since SRD exists we can take those already
  playtested values that have the correct percentages for actions. but we keep aubaine as is, av / dv
  everything ».
- Asked one by one the same day, the decider kept stacking Avantages, Expertise as 1 Avantage and
  Initiative on 1d4.
- At creation the best Jet is +5 (+3 and +2, `03-creer-un-personnage.md`), the same reach the SRD
  gives a first-level character with its +3 and a proficiency bonus of +2 (5.2.1 FR p.8 and p.22), so
  the SRD's DDs and CAs fit the existing caps without touching them.

### Alternatives considered

- **Avantages that never stack, as in the SRD**: rejected by the decider. Reopens if play shows that
  stacked Avantages make a Jet a formality.
- **Expertise that doubles the Aptitude**: rejected by the decider; it would break the ruling of
  2026-09-28 that a Jet improves through Avantages, never a number. Reopens with that ruling.
- **Initiative on a d20**: rejected by the decider; chapter 10 keeps « Le dé est petit exprès ».

### Addendum (2026-10-24): the pools follow the SRD by level

- The bullet « Unchanged: … the PdV, Mémoire and Énergie formulas » held for the switch to the d20
  alone. The same day, 0057 makes each Niveau of a path an SRD level in its pool, with a cap of 20.
  PdV becomes `3 + (5 + Constitution) × Niveau de Vitalité` and Énergie `Esprit + 3 × Niveau
  d'Énergie`. Mémoire keeps its formula.
- Everything else this decision kept unchanged stays so.

### Caveats

- Stacked Avantages move a d20 further than the SRD's single one. Computed means of the kept die:
  10.5 with none, 13.8 with one, 15.5 with two, 16.5 with three.

---

## Decision 2: Criticals act by kind, and two rule terms name them

### Decision

- A kept natural 20 is a Réussite critique, and it always succeeds.
  - On a Jet, the player describes an exceptional result that stays inside the fiction.
  - On an Attaque, the total damage doubles (dice, Caractéristique and riders), before resistance,
    vulnerability and the block.
  - On a Sauvegarde, the creature suffers nothing from the effect, even a partial effect the
    Compétence prints for a success.
  - On an opposed Jet, it wins; if both sides score one, the higher Caractéristique + Aptitude wins,
    then the usual tie-break applies.
- A kept natural 1 is an Échec critique: it always fails, and the MJ adds a complication.
- Fuite (`data/skills/FUITEX-001.json`): while it lasts, one kept die of 3 or less is an Échec
  critique.
- Two rule terms join `RULE_TERMS`: Réussite critique (English Critical success, icon
  `game-icons/dice-twenty-faces-twenty`, colour `--term-adv`) and Échec critique (Critical failure,
  `game-icons/dice-twenty-faces-one`, `--term-dis`).

### Rationale

- The decider chose the ruling first given on 2026-10-11, in a d20 plan that was never committed,
  and the Fuite ruling of 2026-10-12 from the same plan.
- With effects of their own, the criticals are rules an entry links instead of restating. The
  decider chose the icons and asked for the colours of Avantage and Désavantage, the pair Résistance
  and Vulnérabilité already share (verified in `src/lib/game/build.ts`).

### Alternatives considered

- **Criticals on Attaques only, as in the SRD**: rejected by the decider.
- **The SRD on Attaques plus narrative criticals elsewhere, with no automatic success**: rejected by
  the decider.

### Caveats

- A kept natural 20 comes up 5% of the time against 1 in 144 for two kept 12s: criticals are about
  seven times as frequent, and each Avantage raises that (9.75% with one, 14.3% with two).

---

## Decision 3: A number comes from the SRD wherever Aubaine does the same thing

### Decision

- **The scale**, the decider's table « Tâche / DD »:

  | Tâche | DD |
  | --- | ---: |
  | Très facile | 5 |
  | Facile | 10 |
  | Moyenne | 15 |
  | Difficile | 20 |
  | Très difficile | 25 |
  | Quasi impossible | 30 |

  The values are the SRD's (5.2.1 FR p.7, 5.1 FR p.84); the labels are the decider's.
- **A Compétence's DD** is `8 + Caractéristique + Aptitude`, the SRD's save DD (5.2.1 FR p.24),
  printed with its base and its pair in every entry.
- **The CA without armour** is `10 + Dextérité` (5.2.1 FR p.7).
- **Same action, same number.** When Aubaine does what the SRD does, it takes the SRD's value:

  | What | 2d12 | d20 | SRD 5.2.1 FR |
  | --- | ---: | ---: | --- |
  | Concentration | 15 | 10 | p.190 |
  | Social Jet of an Hésitante creature | 15 | 15 | p.194, Influence |
  | Extreme cold or heat, every hour | 10 | 10 | p.206, extreme cold |
  | First aid on a creature in Agonie | 20 | 10 | p.19, stabilising |
  | Rigidité cadavérique (`RIGCAD-001`), a Jet in Agonie | 20 | 10 | p.19, death save |
  | Armure de cuir | 13 + Dex | 11 + Dex | p.98, leather |
  | Cuirasse | 15 + min(Dex, For) | 14 + min(Dex, For) | p.98, breastplate base |
  | Cotte de mailles | 18 | 16 | p.98, chain mail |
  | Peau de brute (`PEABRU-001`) | 12 + Dex + Con | 10 + Dex + Con | p.31, Unarmored Defense |
  | Mur de pierre (`MURPIE-001`), CA of a section | 15 | 15 | p.163, Wall of Stone |
  | Peau d'écorce (`PEAECO-001`) | 17 | 17 | p.167, Barkskin |

- **Otherwise the closest chance.** A DD with no SRD counterpart takes the table value whose
  success chance at +5 is closest to its 2d12 chance:

  | 2d12 DD | chance at +5 | d20 DD | chance at +5 |
  | ---: | ---: | ---: | ---: |
  | 10 | 95.8% | 5 | 100% |
  | 12 to 16 | 89.6% to 68.8% | 10 | 80% |
  | 17, 18 | 61.8%, 54.2% | 15 | 55% |
  | 20 | 38.2% | 20 | 30% |

- **Other CAs move with the base.** An armour or a fixed CA with no SRD counterpart drops by 2, as
  the CA without armour does, which keeps each armour's offset to the cuir. The Cuirasse du Parangon
  de l'Ordre des Lame-éther keeps its +1 over the cuirasse (15 + min). Shields and the pieces that
  print `CA +1` do not change.
- **No mechanic travels with a number.** Concentration takes DD 10, not the SRD's rise with half the
  damage; Agonie stays a countdown; the cuirasse keeps « la plus faible entre Dextérité et Force ».

### Rationale

- The decider, 2026-10-24: « Just use SRDs Value for everything how hard is it ? if something we do
  is also in SRD like save then take srd value, it's that simple ».
- The decider refused values off the table: « Why are you sometime saying DD 11 (bienvenue) that
  makes no sense ». The chances were computed exactly over the 144 outcomes of 2d12 and the 20 of a
  d20.

### Alternatives considered

- **Keep each fixed DD's 2d12 chance at +5** (10→6, 12→8, 14→10, 15→11, 18→15, 20→18, the table of
  2026-10-12): rejected by the decider; it fills the game with DDs off the scale.
- **Step for step** (the old 10 becomes 5, 15 becomes 10, 20 becomes 15): rejected by the decider in
  favour of the closest chance; it would make every recipe at 12 a Très facile 5.
- **Every armour at v0.2.1 minus 2**, the ruling of 2026-10-11: kept only where the SRD has no
  armour of its own; the cuirasse takes the breastplate's 14 instead of 13.

### Caveats

- Hit chances fall. An Attaque at +5 against a creature with Dextérité +3 and no armour succeeded
  75% of the time (2d12 against 15) and now 65% (d20 against 13). No simulator has measured what this
  does to an adventuring day; the effect is unmeasured.
- An SRD value can be easier or harder than the 2d12 number it replaces. The Hésitante social Jet
  keeps 15 and falls from 75% to 55% at +5; first aid falls to DD 10 although Aubaine's success gives
  1 PdV and ends Agonie, more than the SRD's stabilising.

---

## Decision 4: Drafts are converted by script, and the version becomes 0.3.0

### Decision

- Every entry, draft included, takes the numbers of Decision 3 through a one-off script kept out of
  the repository (`tmp/` is ignored by git): a DD base of 10 becomes 8, fixed DDs and recipe steps
  land on the table, armour headlines and fixed CAs follow their rows.
- A draft rule that needs judgement rather than a number is listed for its own rework and left as
  it is, such as the widened critical range of `COURRO-004`.
- `data/aubaine.json` becomes `0.3.0` and every booklet is reprinted; 0013 archives the 0.2.1
  generation.

### Rationale

- The decider asked to convert the drafts' numbers by script and to bump the version.
- 0015 Decision 4 makes a version a statement about content; a new die changes every Jet in every
  booklet.

### Alternatives considered

- **Leave drafts on 2d12 until each is redone**: rejected by the decider. Drafts stay outside the
  rules, so nothing else in them is rewritten.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| The Jet and Avantages | 1d20, kept best or worst, stacking | `data/books/livre-du-joueur/02-comment-jouer.md`, `RULE_TERMS` |
| Criticals | By kind, two rule terms | chapter 02, chapter 11, `RULE_TERMS`, `FUITEX-001` |
| The scale and a Compétence's DD | 5 to 30, `8 + CAR + APT` | chapter 02, `.claude/skills/aubaine-content/references/formulary.md` |
| CA | `10 + Dextérité`, armour from the SRD or −2 | chapters 03, 07, 10, `data/equipment/items/` |
| Fixed DDs | SRD value, else the closest chance | chapters 08, 10, 11, entries |
| Version | 0.3.0, every booklet reprinted | `data/aubaine.json`, `data/pdf/notes.json` |
