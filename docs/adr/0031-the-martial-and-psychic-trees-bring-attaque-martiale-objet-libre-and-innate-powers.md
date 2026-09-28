# ADR: The martial and psychic trees bring the Attaque martiale and Objet libre rule terms, and powers of the mind are innate

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-28
**Deciders:** Kori
**Scope:**
- **Covers:** three choices made while rebuilding the Physique tree as the martial tree and writing the Psychique tree:
  - which Attaques feed the martial stances;
  - one rule term for an object nobody holds;
  - how powers of the mind are tagged and resisted.
- **Does not cover:** the content of each skill, which lives in its file, or the Mage's Glyphe and Mana terms, which [0030](0030-the-mage-brings-ether-glyphe-mana-and-learning-by-inscription.md) records.
- **Amends:** [0020](0020-skill-tags-are-three-optional-slots-and-every-hovered-word-is-defined.md), whose Inné definition now names the mind.

---

## Context

The decider asked for a martial tree that closes the gap with the casters without an unleashed centre, and for a psychic tree whose only point in common with the elemental trees is its unleashed centre. The martial tree runs on two opposed states, Cadence and Aplomb (`data/states/cadence.json`, `aplomb.json`), built and spent by Attaques. The decider then ruled that ranged weapon Attaques feed them too, so the states needed one definition of the Attaques that count. The psychic tree repeated a clause about loose objects that three existing skills already carried. The decider also ruled that psychic powers are innate powers of the mind, not Sorts.

---

## Decision 1: Attaque martiale names the Attaques that feed the stances

### Decision

- `Attaque martiale` (`{{attaque-martiale}}`, English « Martial Attack ») joins `RULE_TERMS` in `src/lib/game/build.ts`, next to Attaque, in the Attaque colour, with the icon `mdi/sword`.
- Its definition covers any Attaque made with a weapon, a shield, a natural weapon or bare hands whose Jet uses Mêlée, Finesse or Visée, in melee or at range.
  - It excludes an Attaque whose Jet a Sort sets, even when it uses Visée.
  - It excludes an Attaque made with an object that is not a weapon.
- Cadence pays and is kept on an Attaque martiale. Mener la danse, Point d'orgue and Riposte make one.
- Croiser le fer, Riposte's trigger, Tenir la ligne and Garde du corps stay close-quarters, because their fiction is a blade or a body in the way.

### Rationale

- Four entries depend on the same boundary. Written once as a term, it links from each of them and cannot drift.
- Anchoring the term on the Aptitude of the Jet settles the cases a label alone cannot:
  - a shield bash counts;
  - a thrown flask does not;
  - Bousculer and Agripper, which roll Athlétisme, do not.
- « martiale » matches the Manœuvre tag's own definition. It also admits fists and claws, which « armée » would have seemed to exclude.

### Alternatives considered

- **A sentence in the Cadence state**: rejected, because Point d'orgue and Riposte would each have had to restate it. It would come back if only one entry ever needed the boundary.
- **Melee only**: rejected by the decider, who wants ranged weapons to feed the stances. It would come back if playtest shows a kiting archer dominating.

### Caveats

- Grapplers lose Cadence on a turn spent only shoving or grappling. That limitation is deliberate, and playtest may move it.

---

## Decision 2: Objet libre names an object left to itself

### Decision

- `Objet libre` (`{{objet-libre}}`, English « Loose Object ») joins `RULE_TERMS`, in the movement colour, with the icon `mdi/package-variant-closed`.
- Its definition: an object nobody wears or holds, weighing no more than a creature of Taille Moyenne.
- Fronde and Troisième main use it. It replaces the same clause in Ouragan, Portance and Grappin (`OURAGA-001`, `PORTAN-001`, `GRAPPI-001`) without changing what they do.

### Rationale

- The clause reached a third repetition with Fronde. The standing rule in `.claude/rules/content/rule-text.md` names a recurring limitation once, as a state or a rule term.

### Alternatives considered

- **Keep the clause in each skill**: rejected on that rule. It would come back if the five skills ever needed different limits.

---

## Decision 3: Powers of the mind are innate, resisted with Volonté

### Decision

- No Psychique skill carries the Sort Pratique, so none needs a Catalyseur.
- Inné carries the powers whose École accepts it:
  - Bouclier invisible, Coupole and Recueillement, with Protection;
  - Anticipation and Lire les pensées, with Divination;
  - Troisième main, with no École.
- The ten powers in Destruction, Contrôle, Influence or Soin carry their Écoles and no Pratique. No new École and Pratique pairing is opened.
- A resisted psychic power reads its DD as 10 + Intelligence, Esprit or Charisme + Volonté.
- Inné's definition in `data/meta/tags.json` now names the mind: « votre sang, votre corps, votre esprit, ou ce que la mort a fait de vous ».

### Rationale

- The decider chose innate powers over Sorts.
- 0020 Decision 3 already says a power that is not a Sort carries no Pratique. The integrity test « pairs every École only with a Pratique it accepts » in `tests/data/integrity.test.ts` skips a skill whose Pratique is unset. More than thirty skills already carry an École with no Pratique, such as `INTERF-001` and `LECSIG-001`.
- Volonté makes a resisted power a contest of wills. It fits the kinetic powers as well as the reading ones, where Perspicacité would fit only the latter.
- Without the wider definition, six Psychique cards would carry an Inné tooltip that excludes them.

### Alternatives considered

- **Sorts with a psychic Catalyseur**: rejected by the decider.
- **Open Contrôle or Destruction to Inné**: rejected as a taxonomy change for the whole game. It would come back if a rule ever needs to reach every psychic power through the Inné tag, which today it cannot; such a rule names the Domaine Psychique instead.

### Caveats

- One Aptitude drives the psychic's DD, their defence against fear and charm, and their Concentration Jets. Playtest will say whether that concentrates too much on Volonté.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Attaque martiale | Which Attaques feed Cadence and Aplomb | `src/lib/game/build.ts`, `data/states/cadence.json` |
| Objet libre | An object nobody holds, up to Taille Moyenne | `src/lib/game/build.ts`, five skills |
| Innate mind powers | Inné where the matrix allows it, no Pratique elsewhere, DD with Volonté | `data/skill-trees/psychique.json`, `data/meta/tags.json` |
