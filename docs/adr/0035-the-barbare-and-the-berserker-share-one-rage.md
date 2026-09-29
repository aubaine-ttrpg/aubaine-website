# ADR: The Barbare and the Berserker share one Rage

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-28
**Revised:** 2026-09-29, Cri primordial and Poigne du titan return to the Barbare (addenda in Decisions 1, 3 and 6)
**Revised:** 2026-09-29, Rage's upgrades are renamed and the Rage tag answers to a key (addendum in Decision 2)
**Revised:** 2026-09-29, Frénésie puts you in the Fureur state instead of « à son comble » (addendum in Decision 4)
**Deciders:** Kori
**Scope:**
- **Covers:** splitting the draft Berserker archetype into two archetype trees, and the choices that split
  carries:
  - the Rage they share;
  - the Barbare's Cris;
  - the Berserker's heart;
  - the art each tree keeps;
  - the two skills withdrawn.
- **Does not cover:**
  - the wording of each skill, which lives in its file;
  - the Rage Pratique itself, recorded as an addendum to
    [0020](0020-skill-tags-are-three-optional-slots-and-every-hovered-word-is-defined.md) Decision 5.
- **Builds on:**
  - [0034](0034-the-draugar-pays-in-blood-and-an-archetype-leans-on-one-or-two-caracteristiques.md):
    PdV costs, one or two Caractéristiques, weapon Attaques;
  - [0030](0030-the-mage-brings-ether-glyphe-mana-and-learning-by-inscription.md): Sang has no tree of
    its own.

---

## Context

`data/skill-trees/berserker.json` was a 14-node draft that had drifted into a D&D Barbarian:
- Rage and the Enragé state;
- an unarmoured CA;
- an attack that trades defence for Avantage;
- a danger sense;
- a wider critical range.

The old Aubaine Berserker was the blood one: rage below 30 % of its PV, self-harm to reach that
threshold, a last stand at 0 PV, and a link that took an ally's hit. The source is
`tmp/old-aubaine/Compétences/Archétype/Berserker (Archétype).md`.

The decider wanted two simple archetypes to balance the complex trees built lately:
- a **Barbare**, drawn from Norse myth, vikings and nature, and adapted from the SRD Barbarian
  (`tmp/srd/FR_SRD_CC_v5.2.1.pdf`);
- a **Berserker**, blood-thirsty, likes to get hit and thrives at low PdV.

Mix and match between trees is the game's aim, so the two needed a common ground.

---

## Decision 1: two archetypes, each one simple

### Decision

- **Barbare.** A new tree, `data/skill-trees/barbare.json`, subtitled « Les forces de la nature »:
  - it soaks hits through Rage, bare skin and toughness;
  - its signature beside Rage is the Cri.
- **Berserker.** `data/skill-trees/berserker.json` is rebuilt, subtitled « La chair à vif »:
  - it pays PdV for power, strikes back, heals by hitting and refuses to fall;
  - it takes an ally's hit or swaps places with them.
- **Shape of both trees.**
  - Both are `playtest`, with 16 placements on the Vent slots.
  - Each has one T10 capstone at the top of its branch.
  - Most skills are one to three short rule sentences.
- **Existing skills.** Of the old draft:
  - Attaque téméraire, Instinct du danger, Peau de brute, Rage, Tourbillon and Visage intimidant go to
    the Barbare;
  - Déferlement, Sang versé and Soif de sang go to the Berserker.
- **Tanking.** Neither tree taunts or guards. Physique already owns that role (Provocation,
  `PROVOC-001`; Garde du corps, `GARCOR-001`, in `data/skill-trees/physique.json`):
  - the Barbare tanks by soaking;
  - the Berserker's Sacrifice acts after the damage is known and pays in PdV.

### Rationale

- The draft already held most of a Barbarian, and the old material held most of a Berserker. Each tree
  gets a clear fantasy instead of sharing one muddled one.
- The trees stay simple to balance the long ones (Mage, Vent), as the decider asked.

### Alternatives considered

- **One Sacrieur-style tree**: the decider's fallback if there was not enough material for two. It
  was rejected once the split proved to have enough. It would come back if playtest finds the two
  fantasies indistinct at the table.
- **Berserker now, Barbare later**: rejected because the old skills would sit in a half-built tree.

### Addendum (2026-09-29): Cri primordial and Poigne du titan return

The decider asked for both back. Players liked Cri primordial in playtest, and Poigne du titan is the
Barbare's two great weapons.
- Cri primordial (`CRIPRI-001`) and Poigne du titan (`POITIT-001`, tier 6) come back. Visage
  intimidant and Rompu au froid are deleted.
- The four Cris form one branch, the north one, the only branch with four slots: Cri d'effroi at its
  root, Cri primordial at its top, Cri du colosse and Cri de ralliement beside it. The bare-skin line
  moves to the south-east (Peau de brute, then Montagne de muscles and Instinct du danger), and Sens
  de la bête takes the south slot. The capstone, Montagne de muscles, no longer sits at the top of
  the plate, because the top belongs to the Cri branch.
- Estomac de fer sits beside the heart, and Poigne du titan under it.
- Cri primordial keeps its playtested Domaine options and drops « qui vous entendent », which the
  Cri tag already says. The decider extended it to all six elemental Domaines: you infuse it with a
  Domaine whose tree you have unlocked, or with none. Vent carries allies 3 m, and Poisse turns the
  ground into Terrain difficile for the creatures you choose, since a Poisse state would need a DD
  this Cri does not define.
- Poigne du titan lets you carry a two-handed weapon in each hand. While you are Enragé, every melee
  weapon you carry gains the Légère property, which opens the Action Bonus Attaque
  (`data/books/livre-du-joueur/10-le-combat.md`). The decider wrote the text.
- The Barbare's base price rises to 285 PX.

---

## Decision 2: one Rage, a tag and a state, shared by both hearts

### Decision

- **The tag.** A new Pratique, « Rage » (`rage`), marks a Compétence that makes you Enragé. The state
  `data/states/enrage.json` is unchanged.
- **The hearts.** Each tree's heart carries it:
  - Rage (`RAGEXX-001`) lasts while it is fed and may run up to 10 minutes;
  - Frénésie (`FRENES-001`) costs PdV as well as Énergie and lasts up to 1 minute.
- **Combos.** Every skill of either tree that reads « tant que vous êtes Enragé » switches on from
  either heart. Bond sauvage (`BONSAU-001`) fires off any Compétence that carries the tag.
- **Upgrades.** A heart's own upgrades read that heart:
  - Fureur reads « Tant que {{RAGEXX-001}} dure »;
  - Frénésie's thresholds read « à son comble ».
  - Neither heart can borrow the other's.

### Rationale

- The decider asked for « common states like a common rage » so that trees combo.
- The state carries the durations. The tag gives a rule and a filter one name, so a later Druide or
  Draugar rage belongs to the family.
- Tying each heart's upgrades to that heart was a verifier finding. Frénésie runs a flat minute with
  no upkeep, so upgrades read from Enragé alone would have made Rage pointless for a character who owns
  both trees.

### Alternatives considered

- **The state alone, no tag**: rejected because the decider wanted Rage to be « a Primary type of
  skill » as well. It would come back if no rule outside these two trees ever cites the tag.

### Addendum (2026-09-29): Rage's upgrades are renamed, and the tag answers to a key

- Rage's upgrades become Rage ardente, Rage redoublée and Rage sans fin, so that « Fureur » names
  the Berserker's state alone (Decision 4).
- The Rage tag answers to `{{rage}}`, as every tag now does
  ([0036](0036-every-tag-is-a-keyword-and-rule-text-never-writes-etiquette.md)). Bond sauvage
  triggers on « une {{rage}} ».

---

## Decision 3: the Barbare's Cris are Jötnar words, one per Niveau

### Decision

- **The words.** Each Barbare Cri is spoken in the tongue of the Jötnar, an extinct people of Norse
  giants. This is new canon from the decider.
- **One word per Niveau.**
  - The base Compétence shouts the first word.
  - Niveau 2 adds the second word and Niveau 3 the third, each making the shout stronger.
  - Each upgrade is titled with its word.
- **The three Cris:**
  - Cri d'effroi: Hvelg, Drokk, Skurn;
  - Cri de ralliement: Brund, Gelm, Ymra;
  - Cri du colosse: Dralk, Hulv, Gyrn.
- **Scope.** Only the Barbare's Cris work this way:
  - the Cri tag in `data/meta/tags.json` is unchanged;
  - the Berserker has one plain war cry, Cri écorché (`CRIECO-001`).

### Rationale

- The decider wanted a Cri that feels unique, in the spirit of shouted words of power, rooted in an
  « old extinct norse giant species like Jotunns » rather than in Draconique.
- Riding the upgrade system adds no rule: the words are the Niveaux the game already has.
- Each Cri reaches 3 creatures at most, as the MJ book's budget asks
  (`data/books/livre-du-mj/03-concevoir-une-competence.md`).

### Alternatives considered

- **Choose 1 to 3 words per shout, paying per word**: rejected as one more decision at the table in a
  tree meant to be simple.
- **Every Cri in the giant tongue**: rejected by the decider. It would come back if Cris in other
  trees want the same identity.

### Addendum (2026-09-29): Cri primordial speaks three words

Cri primordial follows the Barbare's rule: « Harn », then « Kjeld » at Niveau 2 (tier 5), which widens
it to 9 m and one more target per effect, then « Orsk » at Niveau 3 (tier 7), which picks two of its
options at once.

---

## Decision 4: Frénésie activates at will and peaks at low PdV

### Decision

- **Activation.** Frénésie costs 1 Action Bonus, 2 Énergie and 1d6 PdV, at any PdV. It makes you
  Enragé.
- **À son comble.** At half your PdV maximum or less, Frénésie is « à son comble »: your Attaques deal
  1d6 more.
  - Niveau 2 (Premier sang) moves the threshold to three quarters.
  - Niveau 3 (Folie furieuse) keeps it at its peak whatever your PdV.
- **Readers.** Other Berserker skills read the peak through Frénésie, so its upgrades lift them all.
- **Losses.** The tree's PdV losses push you under the threshold:
  - the costs of Frénésie, Cri écorché, À corps perdu and Lien de sang;
  - Automutilation and Sacrifice.
  - They follow the ruling in 0034.

### Rationale

- The decider reported that an earlier playtest found a pure low-PdV trigger too hard to reach for
  starting characters. The Action Bonus gives a Berserker something from the first turn, and the
  thresholds scale it up.
- The loop needs no counter: the players track PdV already.

### Alternatives considered

- **A stack gained each time you are hit**: rejected as bookkeeping in a simple tree. It would come
  back if the threshold reads too static in play.

### Addendum (2026-09-29): the Fureur state replaces « à son comble »

The decider asked for a state rather than a phrase, so that the table sees at a glance whether a
Berserker is in frenzy. It is worded « Vous êtes en Fureur » and « Si vous êtes en Fureur », so that
the paragraphs read cleanly.
- `data/states/fureur.json`: while you are in Fureur, your Attaques deal 1d6 more. The Compétence
  that puts you in Fureur says when you are, and a fall to 0 PdV ends it in any case.
- Frénésie puts you in Fureur while it lasts and you have half your PdV maximum or less. Premier sang
  moves that to three quarters, and Folie furieuse keeps you in Fureur for as long as Frénésie lasts.
- Soif de sang, Rendre coup pour coup, Cri écorché and Automutilation read « Si vous êtes en
  Fureur ». Another tree can put a character in Fureur on its own terms.
- « À son comble » as a rule term was considered first, then rejected by the decider in favour of
  the state.

---

## Decision 5: the art goes to the tree it depicts

### Decision

- **To the Barbare.** Today's Berserker cover and back cover show a Norse warrior with a storm-lit axe,
  and floating isles.
  - They move to the Barbare as `barbare-3_4-og.png` and `barbare-dos-3_4-og.png`.
  - `barbare-16_9-og.png` leaves `data/media/unassigned/` to become its banner.
- **The Berserker** keeps `berserker-16_9-og.png` and has no 3:4 cover:
  - its tree card and printed back cover fall back to the banner;
  - its printed front cover shows the placeholder (`src/pages/print/[...booklet].astro` passes
    `tree.cover` alone, and `src/components/print/Cover.astro` falls back to `PLACEHOLDER_COVER`).

### Rationale

- The decider chose to swap by theme. The pictures carry no caption, so their stamp claim is
  unchanged. Verified by `pnpm data:check`.

### Caveats

- The Berserker's booklet prints a placeholder front cover until a 3:4 picture exists, as the
  Draugar's does today.

---

## Decision 6: Poigne du titan and Critique brutal are withdrawn

### Decision

- **The deletions.** `POITIT-001` and `CRIBRU-001` are deleted. The old Cris (`CRIPRI-001`,
  `CRISAL-001`, `CRIDEM-001`) are deleted too, replaced by the Jötnar Cris.

### Rationale

- **Poigne du titan** needed an equipment exception (two-handed weapons counted as Légère) in a tree
  meant to be simple, and its title translates another game's talent.
- **Critique brutal** paid off « chacun de vos critiques double vos dés de dégâts ». No chapter holds
  that rule: `data/books/livre-du-joueur/02-comment-jouer.md`, section « Les critiques », makes a
  critical a described result.

### Alternatives considered

- **Keep Critique brutal and rule critical damage**: rejected because it would add a core rule for one
  skill. It would come back with a game-wide ruling on criticals.

### Addendum (2026-09-29): Poigne du titan is restored

Poigne du titan returns (addendum in Decision 1). Critique brutal stays withdrawn, and of the old
Cris only Cri du salut and Cri démoralisant stay deleted.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Two archetypes | Barbare soaks, Berserker bleeds | `data/skill-trees/barbare.json`, `data/skill-trees/berserker.json` |
| One Rage | Tag plus state, each heart keeps its upgrades | `data/meta/tags.json`, `data/states/enrage.json`, `RAGEXX-001`, `FRENES-001` |
| Jötnar Cris | One word per Niveau, Barbare only | `CRIEFF-001`, `CRIRAL-001`, `CRICOL-001` |
| À son comble | Half, three quarters, always | `FRENES-001` |
| Art | Swapped by theme | `data/media/art/barbare-*`, `berserker-16_9-og.png` |
| Withdrawn | Two skills with no footing | `POITIT-001`, `CRIBRU-001` |
