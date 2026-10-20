# Formulary

The lens of pass 4, `aubaine-content-formulary`, and the wording every pass and every skill writes a
mechanical relationship in. A chapter that teaches one of these relationships prints the same form.

## Why one wording

The same mechanical relationship described with a different sentence shape in every entry is the
failure here, not the fix. Use one phrasing for one mechanical relationship, and save variation for
flavour.

Same function, same words. Different words tell the reader the function differs, so two wordings for
one rule teach a distinction the game does not make. A player who has read one resisted effect has
read them all, and finds in the next entry only what is new in it. That familiarity is what lets a
reader with ADHD, or anyone at a busy table, take in a Compétence on the first read.

## Reading an entry

```
### id
- FR: « … »                         EN: « … »
- When: the case the formula covers.
- Never: the nearest wrong wording.
- Measured: counts, dated.           Examples: two settled entries.
- Status: approved | proposed | legacy
```

- **approved**: in use in settled entries, or approved by the owner on the date given. Write it.
- **proposed**: not yet approved. A run uses it only after the owner approves it at that run's C0,
  and the brief records the approval. An English form with no overlay precedent is `proposed` until
  then.
- **legacy**: the older wording of an approved formula. It stays in entries a run does not touch.

## Counting

Counts are orientation, not law. `all` counts every French skill and state file that writes the
form; `settled` counts those whose resolved status is `playtest`, `beta` or `balanced`. Drafts count
in `all` and never in `settled`. The orchestrator re-measures with a throwaway script in the session
scratchpad before relying on a number, and never commits the script; a pass agent cites the counts
here and never re-measures. Examples are settled entries only.

## Writing a formula into a sentence

A formula is a sentence fragment with its articles and prepositions, so that once the labels print it
reads as French: « fait une Sauvegarde (Dextérité + Réflexes) contre votre DD (10 + Intelligence +
Arcanes) ». `keyword-logic.md` § Read it as a sentence is the test.

## Legacy forms and migration

- Entries a run does not touch keep their legacy form until a migration batch rewrites them all.
- A run rewrites a legacy form in every entry it touches, and logs each rewrite. That rewrite is the
  one change allowed inside wording the owner kept, because the owner approved the notation on
  2026-10-19. In an entry the run does not touch, a legacy form is a `note`.
- `data/books/livre-du-joueur/02-comment-jouer.md` § Nommer un Jet and § Le DD d'une Compétence
  teach the approved forms, in both locales.
- On 2026-10-20 the owner approved `save`, the pair in parentheses after an {{attaque}}, and a DD
  always written with its base and its pair. The Nnor and their Compétences are the first entries
  written in them, and the base later rewrites start from; the chapters and every other entry keep
  their form until a migration batch.

## Proposing a formula

A relationship that recurs in three settled entries with no entry here, or that a run needs, is
proposed with its id, both forms, when, never and the evidence. The owner approves it before any
write uses it. A proposal never renames a rule term or adds a key; that is a vocabulary decision.

## Rolls and difficulty

### roll
- FR: « un {{jet}} ({{force}} + {{melee}}) »
  EN: « a {{jet}} ({{force}} + {{melee}}) », printed « a Roll (Strength + Melee) »
- When: the rule imposes the whole pair, Caractéristique first.
- Never: « un {{jet}} de {{force}} + {{melee}} », the legacy form; « Jet Force Mêlée ».
- Measured 2026-10-20: approved form 0. Legacy form in 112 files, 69 settled.
- Status: approved (owner, 2026-10-19). Legacy: « un {{jet}} de X + Y », EN « a X + Y {{jet}} ».

### roll-single
- FR: « un {{jet}} de {{melee}} »         EN: « a {{melee}} {{jet}} »
- When: only one half of the pair matters. Usually the Aptitude, the Caractéristique following how
  the character acts (chapter 02); sometimes a Caractéristique alone (CONELF-001).
- Never: « un {{jet}} ({{melee}}) ». Parentheses hold a pair.
- Measured 2026-10-20: 22 files, 11 settled. Examples: CELERI-001, CONELF-001.
- Status: approved (owner, 2026-10-19).

### save
- FR: « fait une {{sauvegarde}} ({{constitution}} + {{resistance}}) »
  EN: « makes a {{sauvegarde}} ({{constitution}} + {{resistance}}) », printed « makes a Save
  (Constitution + Resistance) »
- When: a Compétence, an Objet, a state or the environment imposes a {{jet}} on a creature against a
  {{dd}}. A {{jet}} the player chooses to attempt, to climb or to pick a lock, stays a `roll`. To
  improve or hinder it: « Vos {{sauvegarde|Sauvegardes}} contre … gagnent 1 {{avantage}} ».
- Never: « jet de sauvegarde »; « effectue un {{jet}} … pour résister », the legacy form; « une
  {{sauvegarde}} de {{constitution}} + {{resistance}} ».
- First written in: COUSAB-001, SOUDRA-001, ENDALP-001 (2026-10-20).
- Status: approved (owner, 2026-10-20). Legacy: « effectue un {{jet}} (X + Y) contre votre {{dd}} »,
  « Vos {{jet|Jets}} pour résister à … ».

### dd
- FR: « contre votre {{dd}} (10 + {{charisme}} + {{intimidation}}) »
  EN: « against your {{dd}} (10 + {{charisme}} + {{intimidation}}) »
- When: a Compétence lets its target resist. The DD comes from the one who plays it.
- Never: « contre un {{dd}} de `10 + …` », the chapter's legacy form; any base other than 10.
- Measured 2026-10-20: 78 files, 62 settled. Examples: ACOUPH-001, APAISE-001. EN precedent:
  FARPAR-001.
- Status: approved.

### dd-chosen
- FR: « votre {{dd}} (10 + la {{caracteristique}} choisie + {{arcanes}}) »
  EN: « your {{dd}} (10 + the chosen {{caracteristique}} + {{arcanes}}) »
- When: the Compétence let its player choose the Caractéristique, through `chosen-caracteristique`.
- Measured 2026-10-20: inside `dd`. Examples: ACOUPH-001, COUTON-001.
- Status: approved in French; English proposed.

### dd-from-attack
- FR: « Votre {{dd}} vaut 10 + la {{caracteristique}} et l'{{aptitude}} du {{jet}} de cette {{attaque}}. »
- When: an Attaque carries a resisted rider, and the rider's DD follows a pair the entry does not
  fix, such as a weapon's.
- Never: when the entry fixes the Attaque's pair. Then write `dd` with that pair, « contre votre
  {{dd}} (10 + {{force}} + {{melee}}) » (owner, 2026-10-20: a DD is written with its base and its
  pair).
- Examples: POIORG-001.
- Status: approved in French; English proposed.

### dd-fixed
- FR: « contre un {{dd}} de 15 »          EN: « against a {{dd}} of 15 »
- When: the difficulty belongs to the world, not to a character.
- Measured 2026-10-20: 9 files, 4 settled. Examples: CHICAM-001, DEPOUI-001.
- Status: approved.

### resisted-effect
- FR: « Chaque créature dans la zone fait une {{sauvegarde}} ({{dexterite}} + {{reflexes}}) contre
  votre {{dd}} (10 + {{intelligence}} + {{arcanes}}). En cas d'échec, … En cas de réussite, … »
  EN: « … makes a {{sauvegarde}} ({{dexterite}} + {{reflexes}}) against your {{dd}} (10 + … ). On
  a failure, … On a success, … »
- When: anything a target may resist with a fixed shape. It states the defensive {{sauvegarde}},
  the DD formula and the effect on a failure (Livre du MJ, chapter 03 § Résister, et durer). It
  states the effect on a success only when the success does something, as « elle n'en subit que la
  moitié »: a success that only escapes the failure's effect is never written (owner, 2026-10-20). The subject clause before the formula is free (« Chaque
  créature prise dans la sphère », « Chaque créature qui voit l'éclair »); the formula starts at
  « fait une {{sauvegarde}} ». Legacy: « effectue un {{jet}} », approved until 2026-10-20.
- Never: a failure left unsaid, except in a déchaînée Compétence (`resist-open`); « En cas de
  réussite, elle n'est pas {{etourdi|Étourdie}} », which the failure already implies; « jet de
  sauvegarde ».
- Measured 2026-10-20: 64 files, 54 settled. Examples: ACOUPH-001, APAISE-001.
- Order of the outcomes: failure first in a new entry (owner, 2026-10-20). The settled files split
  41 failure first, 27 success first; an entry a run does not touch is never reordered.
- Status: approved; English proposed.

### resist-open
- FR: « Lorsqu'une créature effectue un {{jet}} pour résister à ce feu, elle effectue son {{jet}}
  contre votre {{dd}} (10 + la {{caracteristique}} choisie + {{arcanes}}). »
- When: a déchaînée Compétence, whose player composes the effect when they play it. The defensive
  pair and the outcomes follow the shape the player gives, so the MJ rules them.
- Never: in a Compétence whose effect is fixed in advance; that one uses `resisted-effect`.
- Measured 2026-10-20: 9 files, 9 settled. Examples: AVIFLA-001, DOMVEN-001.
- Status: approved; English proposed.

### attack
- FR: « Vous portez une {{attaque}} ({{force}} + {{melee}}) avec vos sabots. »; the outcome names
  the target, « En cas de réussite, la cible subit 1d4 {{degats-contondant}} »
  EN: « You make an {{attaque}} ({{force}} + {{melee}}) with your hooves. »; « On a success, the
  target takes 1d4 {{degats-contondant}} »
- When: a Compétence makes an Attaque, its own or the one its `1 Attaque` activation replaces. The
  pair sits in parentheses after the {{attaque}}, as after a {{jet}}. An {{attaque}} is a {{jet}}
  against a {{ca}} by definition, so the entry never says « contre la {{ca}} », except when one
  {{jet}} meets several (GRIDRA-001). When the pair depends on a weapon, the parentheses go
  (MENDAN-001, POIORG-001).
- Never: « Portez l'{{attaque}} … », « Effectuez un {{jet}} (…) contre la {{ca}} de la cible »,
  « Portez l'{{attaque}} : effectuez un {{jet}} … », the legacy forms; « une {{attaque}} de
  {{force}} + {{melee}} ».
- Measured 2026-10-20 (legacy forms): 10 files, 9 settled. Examples: BOURRA-001, CROSAN-001.
- Status: approved (owner, 2026-10-20). First written in: COUSAB-001, MORDRA-001.

## Outcomes

### success, failure
- FR: « En cas de réussite, … » / « En cas d'échec, … »
  EN: « On a success, … » / « On a failure, … »
- When: an outcome that does something. A success that only escapes the failure's effect is never
  written (owner, 2026-10-20).
- Never: « Si elle réussit », « Sur un échec », or any rotation of them.
- Measured 2026-10-20: success in 103 files, 70 settled; failure in 71, 57 settled. EN precedent:
  DEPOUI-001, FARPAR-001.
- Status: approved.

### half-on-success
- FR: « elle n'en subit que la moitié »    EN: « it takes only half »
- When: a resisted damage effect halves on a success. It is part of the budget (chapter 03).
- Measured 2026-10-20: 19 files, 18 settled. Examples: BOUFEU-001, BRECHE-001.
- Status: approved in French; English proposed.

## Avantage and states

### avantage-gain
- FR: « gagne 1 {{avantage}} »; for resisting: « Vos {{sauvegarde|Sauvegardes}} contre les états
  {{charme}} et {{endormi}} gagnent 1 {{avantage}}. » (`save`; legacy « Vos {{jet|Jets}} pour
  résister aux états … »)
  EN: « gains 1 {{avantage}} »; « Your {{sauvegarde|Saves}} against … gain 1 {{avantage}}. »
- When: a Jet improves. Aubaine improves a Jet with Avantages, never with a flat number.
- Never: « +1 au {{jet}} », « bonus de 2 ».
- Measured 2026-10-20: 32 files, 17 settled. Examples: HERGAL-001, DEPOUI-001.
- Status: approved.

### desavantage-suffer
- FR: « subit 1 {{desavantage}} »         EN: « suffers 1 {{desavantage}} »
- Measured 2026-10-20: 19 files, 10 settled. Examples: ALPPRI-001, BRECHE-001. EN precedent:
  `effraye`.
- Status: approved.

### state-apply
- FR: « elle est {{etourdi|Étourdie}} jusqu'à la fin de son prochain tour »; for a counted state,
  « vous gagnez 1 {{strate}} »
  EN: « it is {{etourdi|Stunned}} until the end of its next turn »; « you gain 1 {{strate}} »
- When: a Compétence applies a state. The state file defines it; the Compétence says how long it
  lasts and never explains the state again.
- Measured 2026-10-20: a counted state is gained in 78 files, 50 settled. Examples: ANTICI-001,
  ATTTEM-001.
- Status: approved in French; English proposed.

## Time and limits

### until-end-of-next-turn
- FR: « jusqu'à la fin de son prochain {{tour}} » EN: « until the end of its next {{tour}} »
- Never: « tour » unbraced in a new entry; legacy until the migration batch.
- Measured 2026-10-20: 17 files, 14 settled. Examples: ACOUPH-001, CONDUC-001.
- Status: approved in French; English proposed.

### until-start-of-your-next-turn
- FR: « jusqu'au début de votre prochain {{tour}} » EN: « until the start of your next {{tour}} »
- Measured 2026-10-20: 4 files, 3 settled. Examples: ATTTEM-001, COUBRU-001.
- Status: approved in French; English proposed.

### limit
- No sentence. A Compétence played a limited number of times writes the `limit` field, and the
  stat line prints it beside a looping arrow: `"limit": { "times": 1, "per": "turn" }` prints « 1
  fois par tour ». `per` is `turn`, `combat`, `hour`, `short-rest` or `long-rest`; `times` is 1 to
  3. Time or rest, never « scène » (owner, 2026-09-28).
- Never: « Vous ne pouvez jouer cette Compétence qu'une fois par tour. », « qu'une fois par
  heure », the legacy sentences (owner, 2026-10-20).
- Measured 2026-10-20 (legacy sentences): once per turn in 10 files, 10 settled; once per hour in
  JAUADV-001. Field: the 12 former `recharge` files. Examples: BLOGLA-001, COUSAB-001.
- Status: approved (owner, 2026-10-20).

### granted
- No sentence. A Compétence another one grants is played only while the granting one lasts or
  the item that grants it is worn, and needs no {{memorisee|mémorisation}}: the {{accordee}}
  keyword says it once, and the entry's source line shows who grants it.
- Never: « Vous ne pouvez jouer cette Compétence que tant que {{FORDRA-001}} dure. »; « sans les
  avoir {{memorisee|mémorisées}} » (owner, 2026-10-20).
- First applied in: SOUDRA-001, GRIDRA-001, VOLDRA-001, MORDRA-001.
- Status: approved (owner, 2026-10-20).

## Memorisation and purchase

### setup-first-memorise
- FR: « La première fois que vous {{memorisee|mémorisez}} {{PERRUS-001|cette Compétence}}, … »
  EN: « The first time you {{memorisee|memorise}} {{PERRUS-001|this Skill}}, … »
- An entry naming itself writes its own id with « cette Compétence » as text (owner, 2026-10-20);
  legacy: « cette Compétence » unbraced.
- When: a one-time choice or gain. It opens the first rule paragraph, after the flavour paragraph if
  there is one; `pnpm data:check` enforces that.
- Measured 2026-10-20: 11 files, 11 settled. Examples: CHAIRX-001, COMGAG-001.
- Status: approved.

### on-purchase
- FR: « À l'achat, … »                     EN: « On purchase, … »
- When: the one-time setup happens when the Compétence is bought, not when it is memorised.
- Measured 2026-10-20: 7 files, 3 settled. Examples: DEVELO-001, ENTRAI-001.
- Status: approved in French; English proposed.

### while-memorised
- FR: « Tant qu'elle est {{memorisee}}, … » EN: « While it is {{memorisee}}, … »
- Measured 2026-10-20: 6 files, 6 settled. Examples: DISCIP-001, ESPHUM-001.
- Status: approved.

### expertise-grant
- FR: « vous avez l'{{expertise}} dans la {{perception}} »; with a choice, « choisissez une
  {{aptitude}} » in the one-time setup, then « vous avez l'{{expertise}} dans cette {{aptitude}} »
  EN: « you have {{expertise}} in {{perception}} »
- Measured 2026-10-20: 4 files, 4 settled. Examples: ESPHUM-001, SENAIG-001.
- Status: approved.

## Réactions

### reaction-trigger
- FR: « Vous jouez cette {{reaction}} lorsque … » as the first sentence
  EN: « You play this {{reaction}} when … »
- When: every Réaction. The trigger is never in `activation` (clarity checklist in `quality.md`).
- Measured 2026-10-20: 24 of the 26 Réactions open this way. Examples: PARADE-001, INCREV-001.
- Status: approved in French; English proposed.

## Sorts

### chosen-caracteristique
- FR: « Au moment où vous lancez ce {{sort}}, choisissez sa {{caracteristique}} entre
  {{intelligence}}, {{esprit}} et {{charisme}}. »
  EN: « When you cast this {{sort}}, choose its {{caracteristique}} from {{intelligence}},
  {{esprit}} and {{charisme}}. »
- When: the skill's `characteristics` field lists those three.
- Measured 2026-10-20: 43 files, 43 settled. Examples: ACOUPH-001, AMOPOI-001.
- Status: approved in French; English proposed.

## Damage and defence

### damage
- FR: « subit {{6d6 degats-feu}} », « {{1d8 degats-tranchant}} »; with the effect as the
  subject, before any target is named, « ce feu inflige {{1d12 degats-feu}} »; a flat 1 agrees
  after the bar, « {{1 degats-feu|Dégât de Feu}} »
  EN: « takes {{6d6 degats-feu}} », printed « takes 6d6 Fire damage »
- The dice sit inside the keyword (owner, 2026-10-20): the players see one chip, « 6d6 Dégâts de
  Feu ». A damage type named without dice, in a resistance or a conversion, keeps the bare key.
- When: every damage roll. The keyword is the damage type, « Contondant », « Froid », « Feu », of
  the kind Dégâts; its key is `degats-` and the type, {{degats-contondant}}, {{degats-froid}},
  {{degats-feu}}. What the players see is its `referenceFr` in `data/meta/damage-types.json`:
  « Dégâts Contondants », « Dégâts Tranchants », « Dégâts de Froid », « Dégâts de Feu » (owner,
  2026-10-20). « subit » when a creature is the subject (42 files), « inflige » when the
  effect is (14 files). The Attaque's {{caracteristique}} adds to the dice by chapter 11, so the
  entry writes the dice alone.
- Never: « dégâts de Feu » unbraced, the legacy form; « 6d6 {{degats-feu}} », the dice outside the
  keyword; « 1d4 + {{force}} » on an Attaque's damage.
- Measured 2026-10-20: typed 26 files, 25 settled; physical 27 files, 25 settled. Examples:
  BOUFEU-001, BOURRA-001.
- Status: approved in French; English proposed.

### damage-resistance
- FR: « Vous obtenez une {{resistance-degats}} aux {{degats-poison}}. »
  EN: « You gain {{resistance-degats}} to {{degats-poison}}. », printed « You gain Resistance to
  Poison damage. »
- When: a creature halves one type of damage (chapter 11 § Résistance et vulnérabilité).
  Résistance is a keyword (owner, 2026-10-20), keyed {{resistance-degats}} because
  {{resistance}} is the Aptitude.
- Never: « Vous avez une résistance aux dégâts de Poison. », the legacy form.
- Measured 2026-10-20 (legacy form): 4 files, 3 settled. First written in: ENDALP-001, LEGCHA-001.
- Status: approved (owner, 2026-10-20).

### damage-vulnerability
- FR: « Vous obtenez une {{vulnerabilite-degats}} aux {{degats-contondant}}. »
  EN: « You gain {{vulnerabilite-degats}} to {{degats-contondant}}. »
- When: a creature doubles one type of damage (chapter 11 § Résistance et vulnérabilité).
- Status: approved (owner, 2026-10-20).

## Movement and range

### free-difficult-terrain
- FR: « Un {{terrain-difficile|terrain difficile}} ne vous coûte aucun {{deplacement|déplacement}}
  supplémentaire. »
- Examples: PASMON-001.
- Status: approved in French; English proposed.

### range-in-prose
- FR: « à 9 m ou moins de vous »            EN: « within 9 m of you »
- When: a distance inside a rule. The Compétence's own range is the `range` field. The anchor
  follows the rule: « à 3 m ou moins du point où il se produit » (FLASHX-001).
- Measured 2026-10-20: 34 files, 31 settled. Examples: BLOGLA-001, BONSAU-001. EN precedent:
  GLASXX-001.
- Status: approved.

### seen-in-range
- FR: « une créature que vous voyez à portée », « un point que vous voyez à portée »
  EN: « a creature you can see within range »
- When: a target bounded by the `range` field. A distance written out is `range-in-prose`.
- Measured 2026-10-20: a creature in 36 files, a point in 7. Examples: BOUFEU-001, FLASHX-001.
- Status: approved; English proposed.

### area-shape
- FR: « une sphère de 4,5 m de rayon », « un cube de 1,5 m d'arête », « un cône de 3 m », « une
  ligne de 4,5 m sur 1,5 m », « un cylindre de 3 m de rayon et de 6 m de haut »; growth,
  « chaque dimension de sa zone augmente de 1,5 m »
- When: every area, in multiples of 1,5 m (Livre du MJ, chapter 03 § Portées et zones).
- Never: « une ligne de 18 m de long et de 3 m de large », the one settled variant (RAZPOI-001).
- Measured 2026-10-20: a sphere radius in 15 files, a cube, cone or line in 11, the growth clause
  30 times in 8 files. Examples: BOUFEU-001, AVIFLA-001.
- Status: approved; English proposed.

### free-move
- FR: « vous pouvez vous déplacer de 1,5 m. Ce trajet ne compte pas dans votre
  {{deplacement|déplacement}} et ne déclenche aucune {{ATTOPP-001}}. » The noun follows the
  fiction: « trajet », « bond ».
- When: a Compétence moves its player outside their Déplacement.
- Measured 2026-10-20: 8 settled files. Examples: ALPPRI-001, MENDAN-001 (a narrower variant,
  « l'{{ATTOPP-001}} de sa cible »).
- Status: approved; English proposed.

## Upgrades and spending

### upgrade-overcharge
- FR: « Lorsque vous lancez {{AVIFLA-001}}, vous pouvez dépenser 1 {{energie}} de plus pour lancer
  Flambée. »; a Compétence that is not a Sort writes « jouez … jouer »
  EN: « When you cast {{AVIFLA-001}}, you may spend 1 more {{energie}} to cast Flambée. »
- When: an upgrade is a stronger playing of its base, paid on top when it is played.
- Measured 2026-10-20: 33 uses in 11 files. Examples: AVIFLA-001, ESCARB-001.
- Status: approved; English proposed.

### state-spend
- FR: « vous pouvez dépenser 2 {{strate}} »; « jusqu'à 3 {{surtension}} »; « autant de
  {{combustion}} que vous le voulez »
- When: a Compétence spends a counted state the player holds.
- Measured 2026-10-20: 9 files, 9 settled. Examples: BOUFEU-001, REMPAR-001.
- Status: approved; English proposed.

### no-effect-on-success
- FR: « En cas de réussite, elle ne subit rien. » A flavour verb may come first: « elle détourne le
  regard à temps et ne subit rien ».
- Never: in a new entry. A success that only escapes the failure is not written (owner,
  2026-10-20; `success, failure`).
- Measured 2026-10-20: 9 files, 8 settled. Examples: ACOUPH-001, FLASHX-001.
- Status: legacy.

## Rules the chapters own

An entry never restates a rule a chapter or a keyword's definition already gives (owner,
2026-10-20). Two that entries used to repeat:

- A Compétence that deals damage to several creatures rolls the damage once for all of them
  (Livre du joueur, chapter 11).
- A {{jet}} made against several targets counts only the {{avantage|Avantages}} and
  {{desavantage|Désavantages}} that hold against all of them (chapter 02 § Avantage et
  Désavantage).

Never: « Vous lancez une seule fois les dégâts pour toutes celles que ce {{jet}} touche. »; « Les
{{avantage|Avantages}} et les {{desavantage|Désavantages}} qui ne valent pas contre toutes ces
créatures ne comptent pas pour ce {{jet}}. » Legacy in TOURBI-001 until the migration batch.

## Categories and their values

### category-value
- FR: « votre {{taille}} devient {{grande}} », « votre {{type-de-creature}} devient {{dragon}} »
  EN: « your {{taille}} becomes {{grande}} », printed « your Size becomes Large »
- When: a rule names a value of a category a rule term declares: a Taille, a Type de créature, a
  type of damage. The value is a keyword of its own, keyed by the slugify of its French label,
  and a damage type by `degats-` and its type (owner, 2026-10-20).
- Never: « Grande » or « Dragon » unbraced in a new entry.
- Status: approved (owner, 2026-10-20). First written in: FORDRA-001.

### temporary-caracteristique
- FR: « Vous gagnez 2 nouvelles {{caracteristique|Caractéristiques}} temporaires,
  {{physique-temporaire|Physique}} et {{mental-temporaire|Mental}}. »
- When: a Compétence gives values that stand in for Caractéristiques while it lasts. Each is a
  keyword with the hexagon of the Caractéristiques (owner, 2026-10-20).
- Status: approved (owner, 2026-10-20). First written in: FORDRA-001.

## Species

### species-prerequisite
- FR: `"prerequisite": "Être Elfe"`; for a sub-species, « Être Humain du Landenheit »
  EN: `"prerequisite": "Elf"`
- When: every Compétence an Espèce or a sub-species offers or imposes.
- Measured 2026-10-20: 81 files. Examples: ESPHUM-001, CONELF-001.
- Status: approved.
