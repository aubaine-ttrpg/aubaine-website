# Balance

The lens of pass 5, `aubaine-content-balance`. The pass is advisory: it edits nothing, and every
finding goes to the owner with its evidence and its label. A finding is a reason to look, never a
verdict.

## Where the measures come from

- `data/books/livre-du-mj/03-concevoir-une-competence.md` is the design budget. Read it in full:
  - the Unité d'effet;
  - the Rang table and the cost between two Rangs;
  - how a Compétence pays, the gates of Rangs 6 to 9 and their variants;
  - the trades of a fixed or déchaînée Compétence;
  - ranges and zones, the four facts of a resisted effect, and effects over time;
  - the PX price per Rang.
- `data/books/livre-du-mj/04-eprouver-l-equilibrage.md` is the measuring protocol. Measure builds at
  equal PP, focused, split two ways and spread three, over full resource cycles.
- The tool report. Before pass 5, the orchestrator runs
  `pnpm balance report --cap=20 --encounters=5 --jet=srd --species=<id>` (or `--ids=<A,B>`) with
  `--out=<run>/balance-tool.md`, and the brief names the file. It holds the following, each table
  citing its SRD or DMG page:
  - the pool formulas against the SRD curves;
  - the Rang table and the first Niveau that pays each Rang;
  - the exchange rates (PdV per Énergie, uses per day of a limit, the chance a spent Karma rescues a
    Jet);
  - builds at equal PP;
  - one row per entry in scope, with its cost, its Rang, its budget in Unités, the Unités its damage
    keys deliver, the dice it writes in prose, and whether it is an active that pays nothing.
- The owner rulings below.
- Settled siblings, for comparison only.

The tool reads fields and damage keys. It does not read a rider, a state, a zone's reach or a trade,
and the pass costs those by hand against chapter 03.

## Labels

| Label | Meaning | The evidence it carries |
| --- | --- | --- |
| `measured` | The tool report gives the number | the report file, the section and the row |
| `budget-checked` | The entry was costed by hand against chapter 03 | the arithmetic in Unités, written out |
| `sibling-compared` | The entry was set beside settled siblings of its kind | each sibling's id and the field compared |
| `unmeasured` | Neither the report nor chapter 03 settles it | what to measure, in chapter 04's terms |

A finding carries one label or more, and an entry with nothing to report gets one row that says so.

## Owner rulings

Each ruling is dated. Apply it as written, and report a settled entry that breaks it rather than
citing that entry as precedent.

- **Every active pays (2026-09-28, 2026-10-24).**
  - Only a Compétence de base is free. Owner, 2026-10-24: « no 0 energy or 0 ressource skills unless
    for basic actions or if it is justified by paying something else like time ».
  - The payment is Énergie, PdV, Karma, a long activation, a resource the Compétence spends, or a
    `limit` of use. The owner confirmed on 2026-10-24 that a limit counts.
  - The Draugar pays in PdV
    (`docs/adr/0034-the-draugar-pays-in-blood-and-an-archetype-leans-on-one-or-two-caracteristiques.md`).
    Lever le bouclier is paid by the Action Bonus it takes every turn
    (`docs/adr/0038-shields-are-raised-and-wear-down-and-equipment-breaks-and-is-repaired.md`).
- **The resource rework (2026-10-24).**
  - Niveau n of a path is SRD level n in that pool, with a cap of 20 and a start at level 1 with 3 PP.
    The formulas are in `data/books/livre-du-joueur/03-creer-un-personnage.md`, and
    `src/lib/game/resources.ts` holds them.
  - The owner kept the SRD's own numbers, which leave a path at 0 almost empty: « people who wants
    to be tank will have skills to boost it ». A Compétence that raises what a Niveau gives is the
    intended way to grow a pool beyond the formula.
- **The Rang (2026-10-24).**
  - « Rang » / "Rank", 1 to 9. It is priced on the spell point table (DMG p.288 for the costs,
    p.284 for the damage, p.289 for the points by level).
  - Rang 6 is 1 fois par Repos long, per Compétence. Rangs 7 to 9 add 1 Karma.
  - Owner: « it can be 3 karma + 1/REpos Long, it can be health + 1 Karma + 1/repos long it might
    even be Energie + HP + 1 Karma + 1/repos long ».
  - A Rang is reached by its PX price alone, 10 PX per Rang, never a level prerequisite.
  - Karma stands apart from the Rangs. Owner: « Karma is something that exists independtly of the
    higher ranks ». Any Compétence may cost Karma, and a cost may pair Karma with a `limit`, as
    Forme draconique does since 2026-10-24.
- **Déchaînée trades (2026-10-24).**
  - Owner: « energy is fixed but the DM and Player trades damage; range, duration, zone and such
    within the fixed energy ».
  - Chapter 03's table of trades prices both fixed and déchaînée Compétences.
  - Range is free up to 9 m: « above 9 meteres is mostly extreme long range on real battle maps ».
  - Healing is priced by activation: 1d8 per Unité for an Action, 1d4 for an Action Bonus.
- **A « 1 Attaque » Compétence (2026-10-24).**
  - Owner: « if it's the skill the basic one it's weapon damage or fist damage ».
  - It keeps what the Attaque deals, the weapon's or the fist's damage and the Caractéristique, and
    its Unités come on top.
  - A natural weapon that replaces the fist (hooves, claws, fangs) counts the fist's `1d4` in its
    dice on top of its Unités.
- **Trades (2026-10-24).**
  - A secondary effect replaces a damage die. Owner: « It should replace the die i think ».
  - Several targets or a zone take the Zone column of the Rang.
  - A zone grows with the Rang: 1,5 m of radius per Rang (a cylinder at any height), a cube of 3 m
    of edge, a cone of 4,5 m or a line of 9 m per Rang.
    Each step beyond costs 1 die. The owner left the choice to the designer: « the higher the rank
    the higher the allowed distance and zone ? your choice about what an be balanced easier ». The
    evidence is the SRD's zone spells (SRD 5.2.1 FR p.185, 146, 122, 182 and 129).
  - An Attaque deals nothing on a miss, so a Compétence that makes one takes the step up of « rien
    sur un échec » (each die one size up), as the DMG prices attack spells (p.284). The Attaque's
    own damage and its Caractéristique (chapter 11) stay outside the Unités and are not written in
    the entry (`formulary.md` § damage).
  - An entry under its Rang's budget is raised to it, unless the owner keeps it under. Owner on the
    Dragonnor grants: « raise them ».
- **No flat bonus (2026-09-28).** A Jet improves through Avantages, never through a number added
  to it.
- **No grant at a threshold (2026-10-11).** PX, PM and PP are three currencies the MJ awards. Nothing
  arrives automatically when a total crosses a value.
- **No borrowed mechanic (2026-09-28).** A mechanic exists in Aubaine once the repository has it. A
  design taken from another game keeps only what has an Aubaine precedent (`migration.md`).
- **A day, not a fight (2026-10-11, kept on 2026-10-24).** Balance is judged over an adventuring day of
  four to six mixed encounters with two Repos courts, which is what chapter 04's full resource cycle
  means.
- **A tree balances its kinds (2026-09-28).** A tree mixes short and easy Compétences, roleplay
  Compétences and complex ones. A species pool is read the same way, and its options must each be a
  real choice, since a character keeps two of them.
- **Open roleplay rules stay open (2026-09-28).** Fix their cost, duration and ending; leave what
  they mean to the MJ.
- **The Jet is a d20, and Aubaine stays Aubaine (2026-10-24).**
  - `1d20 + CAR + APT`; Avantages stack and keep the best die; a Compétence's DD is
    `8 + CAR + APT`; criticals act by kind (chapter 02).
  - Owner: « we are not recreating dnd, or using SRD, we just migrating to D20 […] we keep aubaine
    as is, av / dv everything ».
  - `docs/adr/0056-the-jet-is-a-d20-and-aubaine-keeps-its-own-rules.md`.
- **The SRD value first (2026-10-24).**
  - A number for an action the SRD also resolves takes the SRD's value. Any other DD lands on 5,
    10, 15, 20, 25 or 30, at the closest chance at +5.
  - Owner: « if something we do is also in SRD like save then take srd value, it's that simple ».
  - Only the number is taken, never the SRD mechanic around it. A finding that a fixed number
    differs from the SRD's value for the same action cites the page in `tmp/srd/`.
- **Owner exceptions (2026-10-20).**
  - Forme draconique's substitution of Physique and Mental, and its full revert when it ends, are
    chosen against the ruling on flat numbers, and so is Fatigue's −1 per stack.
  - Measure what they buy, and never propose removing them.
  - The revert hands back every Énergie spent in the form, on any Compétence. The owner kept it on
    2026-10-24, after its grants were raised: « Yes since it grants energie back it should ».

## Procedure

1. Classify the entry: active, passive or spéciale; déchaînée or fixed; damage, healing, control,
   movement, information or roleplay.
2. Read its row in the tool report: cost, Rang, budget, delivered Unités, prose dice, the
   0-resource flag. Cite the row (`measured`), and never recompute a number the report gives.
3. Cost by hand what the report cannot read: riders, states, zones, trades, range beyond 9 m,
   effects over time, healing by activation. Use chapter 03's tables and show the arithmetic
   (`budget-checked`).
4. Check the payment against the rulings above:
   - any cost at all;
   - the gate of Rang 6 and up;
   - the Karma of Rangs 7 to 9;
   - the exchange rates the report gives for PdV and limits.
5. Check the resisted effects against chapter 03 and `formulary.md` § resisted-effect: the defence,
   the DD and the failure are always written, and the success only when it does something (owner,
   2026-10-20). A success that only escapes the failure is never a finding. Check the ranges and
   zones against chapter 03.
6. Check the price: 10 PX per Rang, 5 PX for a Compétence at 1 Énergie, and `tier` × 5 as the
   field writes it. A Compétence d'Espèce costs 25 PX whatever its Rang (owner, 2026-10-24: « all
   species have a fixed rate on their species this allow for species skills to be easily
   distinguished in both balance, choice for players »), unless the brief says otherwise.
7. Set it beside two or three settled siblings of the same kind and Rang, and name them. A draft is
   never a sibling. When none is settled, say so.
8. Apply the owner rulings and exceptions.
9. Write what stays unmeasured, and what chapter 04 would record to settle it.

## Settled entries that break a ruling

A settled entry that breaks a ruling is a question for the owner, never a precedent in either
direction. Report any such entry a run leans on.

## What this pass returns

A findings table: id, file and field, finding, evidence, label, proposal, and whether it blocks C1 in
the pass's view. The owner decides every one.
