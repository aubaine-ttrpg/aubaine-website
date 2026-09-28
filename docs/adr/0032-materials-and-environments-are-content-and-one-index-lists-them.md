# ADR: Materials and environments are content, and one index lists them

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-28
**Deciders:** Kori
**Scope:** The two content types `data/materials/` and `data/environments/`, the vocabulary of
material Types, the Loot Table an environment carries, the Compétence de base Récolter that rolls
it, and the Matériaux index that lists both. Follows the list and detail layout 0023 set for the
Règles page. A material carries its own `status`, as 0010 allows for an entry with no owner. Does
not put materials or environments in the term index (0029), does not model a creature's own loot,
and does not print the tables in a booklet.

---

## Context

`data/books/livre-du-joueur/07-l-equipement.md` described materials only in prose: a material has a
name, one or more Types and a Valeur, and a source is read through its Dé de butin and its Table de
butin. No file held a material, a Type or a table, so a recipe named its Types as free strings
(`"Métal"`, `"Cuir"`) that nothing checked, and a player had no table to roll on outside what the
MJ improvised. The owner asked for a Compétence de base that gathers ordinary materials once per
Repos long, a table for each environment, and a full index of the materials.

---

## Decision 1: Materials and environments are two content types, and Types are a vocabulary

### Decision

- `data/materials/<slug>.json` holds one material: `name`, `status`, `types`, `value` and a
  one-sentence `description`. `data/environments/<slug>.json` holds one environment: `name`,
  `status`, `icon`, `die`, `description` and `loot`. Both schemas live in
  `src/lib/game/schema.ts`, load as the `materials` and `environments` collections in
  `src/content.config.ts`, and resolve with their `.en.json` overlays in `src/lib/game/build.ts`.
- `types` holds keys of a new vocabulary, `data/meta/material-types.json`, one entry per Type with
  its labels, its colour and its icon. Seven Types are declared: the five recipes already use, Bête
  from the chapter's example, and Catalyseur from the catalyseurs' « Matériel. » property.
- Recipes keep naming Types by their French label in `craft.materials`. `tests/data/integrity.test.ts`
  refuses a recipe label the vocabulary does not declare, and a material Type that is not a key.
- 45 materials and 10 environments ship, all in playtest, each with an English overlay.

### Rationale

- A Type that is only a string cannot be checked, coloured or filtered on. As a vocabulary it gets
  one spelling, one icon and one colour, verified by the new tests in
  `tests/data/integrity.test.ts`.
- A material is one fact stored once. The environments that give it point at its slug, and
  « Où le trouver » is computed from those pointers by `placesOf` in `src/lib/game/materials.ts`,
  so no material restates where it is found.

### Alternatives considered

- **Keep the Types as free strings, like the recipes**: rejected because nothing would catch
  « Metal » against « Métal », and a filter would split them. Reopens if Types stop being shared
  between recipes and materials.
- **Move recipes to Type keys in the same change**: rejected to keep the change scoped, since it
  would rewrite the recipe of every craftable item and its overlays. The label check holds the two
  in step meanwhile. Reopens with the next change to the recipe schema.

### Caveats

- Renaming a Type's `labelFr` breaks every recipe that names it, until the recipes follow.
  `pnpm data:check` is what catches it.

---

## Decision 2: A Loot Table is data on the environment, covering every face of its die once

### Decision

- `die` is the number of faces of the environment's Dé de butin, and it varies with the place: a
  rich place rolls a larger die. The shipped environments roll 1d6, 1d8 or 1d10.
- `loot` is an ordered list of rows `from`, `to`, `material`, `quantity`. The rows cover every face
  from 1 to `die` once, in order; two rows may name the same material with different quantities.
- The rows are built like a reward table: the low faces give an ordinary find, a face above gives
  two of it, and the top face gives the excellent one. The Valeur of the shipped materials runs from
  1 to 3.

### Rationale

- A table is read at the table face by face, so it belongs to the place being searched, in the order
  the die reads. `tests/data/integrity.test.ts` checks the coverage, the materials named and the
  icon file, so a table with a gap or a double face cannot ship.
- Quantity as a column lets one material climb the table, which is what the owner asked for: the
  same find, once or twice, then something better.

### Alternatives considered

- **Weights on the materials instead of rows on the environments**: rejected because a reader would
  have to assemble a table from 45 files before rolling. Reopens if tables need to be generated
  rather than written.
- **Tables as Markdown in chapter 07**: rejected by the owner in favour of a full index with
  filters. Reopens if the index goes unused.

---

## Decision 3: Récolter is a Compétence de base that rolls the Loot Die once per Repos long

### Decision

- `data/skills/RECOLT-001.json`, « Récolter », takes 1 heure, recharges on a Repos long through the
  `recharge` field, and asks no other Jet: it rolls the Dé de butin of the environment you are in and
  gives what its Table de butin says. It is listed in `data/skill-lists/basic-skills.json` after
  Chercher.
- Chapter 07 says in one paragraph that the land is a source too, names Récolter and sends the
  reader to the Matériaux index.

### Rationale

- The owner described it as a Jet de butin and nothing else, so it mirrors « Butin aléatoire »: safe,
  quick, and paced by the rest rather than by a roll against a DD.

### Alternatives considered

- **A Jet of Esprit + Survie before the roll**: offered and declined by the owner, since the table's
  own spread already carries the chance of a poor find.

---

## Decision 4: One Matériaux index lists environments, then materials

### Decision

- A `materials` view kind, at `/fr/materiaux` and `/en/materials`, renders through `Browse` and
  `BrowseList` like Équipement and Règles, and joins `INDEX_KINDS` and the Almanach section in
  `src/lib/i18n/routes.ts`.
- It lists the 10 environments, then the 45 materials: 55 rows, counted in the built page on
  2026-09-28. It filters by Famille, Type, Environnement, Valeur and Statut.
- An environment's detail holds its whole Loot Table as a captioned `<table>`, each material linked
  to its own entry. A material's detail gives its Types, its Valeur and, for each environment that
  gives it, the Loot Die and the rolls.
- The search page lists environments and materials under their own group.

### Rationale

- The list and detail layout is the one players already read for items and rules (0023), so the
  index costs no new pattern, and every table works without JavaScript through its `#e-` anchor.

### Alternatives considered

- **Environments and materials as two indexes**: rejected because a table and the materials it names
  are read together, and one page lets a row link straight to its material. Reopens if either list
  grows past what one filtered page carries.

### Caveats

- The hero reuses the Eau banner until the index has a plate of its own.
- No booklet prints the tables yet.
