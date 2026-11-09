# ADR: The species page reads its play part first and its lore after

**Project:** Aubaine, the wiki
**Status:** Proposed
**Date:** 2026-10-27
**Deciders:** Kori
**Scope:** The order of the sections of `src/components/views/Species.astro`, its outline in two
parts, and how the `lore` collection in `src/content.config.ts` loads a lore page as an opening and
its sections. Amends the position of the `Jouer un <nom>` table set by 0019 Decision 2 and by the
2026-09-23 addendum to 0014 Decision 4. Leaves the tree page in the order 0025 Decision 1 set: lore
first, then the plate. Does not change any anchor, any lore file, or the reading layout of 0018.

---

## Context

The species page read: the hero and its three plates, the whole lore, `Origines régionales` or
`Sous-espèces`, `Jouer un <nom>`, then `Compétences d'Espèce`. Nobody chose that order: 0019 added
the sub-species and the roleplay table below the lore that was already there, while 0025 Decision 1
is the decider's explicit choice of lore first for trees only. The play text written since reads as
a creation sequence that the page printed backwards: the Humain `roleplay.text` ends on « Votre
origine régionale est la région dans laquelle vous avez grandi. », and the Mort-vivant one tells the
reader to choose a sub-species whose Compétence is one of the two kept, both printed after the
sub-species they lead into (`data/species/humain.json`, `data/species/mort-vivant.json`).

---

## Decision 1: Play first, lore after, and the outline in two parts

### Decision

- Under the hero the page shows, in this order:
  - the lore's opening, everything before its first `##`, which is a paragraph and an epigraph on
    every species that has one;
  - `Jouer un <nom>`, then `Origines régionales` or `Sous-espèces`, then « Noms » for a species
    with a naming paragraph or name lists (0073, 0074), then the pool under `Compétences d'Espèce`,
    together the part « En jeu » / "In play";
  - the lore's sections, the part « Histoire » / "Lore".
- The opening and the « En jeu » sections share one reading block, whose sticky outline lists both
  parts, each under its label (`speciesPlayPart` and `speciesLorePart` in
  `src/lib/i18n/strings.ts`). The lore sections sit in a second reading block after the pool, with a
  sticky outline of their own labelled « Histoire ». An outline shows only with more than one entry,
  as before.
- Each part is numbered from 01. A species with no opening, no roleplay and no sub-species, as every
  draft stub is today, shows its pool, then its lore under the « Histoire » outline.
- No anchor moves: `#jouer`, `#origines-regionales`, `#sous-especes`, `#origine-<id>`, `#skills` and
  the lore slugs keep their values.

### Rationale

- The decider chose this order after reviewing the evidence on 2026-10-27, keeping the opening and
  the quote as the first thing under the hero.
- The order 01 `Jouer`, 02 sub-species, 03 pool is the order the authored play text already assumes,
  and it gathers the creation choices that the lore used to separate from the hero's plates. Measured
  at 1440 px with Playwright on the built pages, the distance from the hero to `#jouer` fell from
  11,132 px to 653 px on Humain and from 7,140 px to 497 px on Nnor, and to `#skills` from 11,967 px
  to 6,636 px and from 7,604 px to 2,652 px.
- The lore loses no meaning by moving: its sections stand alone by rule
  (`.claude/skills/aubaine-lore/references/lore.md`, « Each section stands alone »), and every one
  stays in an outline.
- The two parts make visible the line 0019 Decision 2 drew between what a table consults and the
  people's history.
- Numbering per part keeps the lore outline whole when it stands alone: with one count across the
  page, a stub's lore outline would open at 02 with 01 shown nowhere.

### Alternatives considered

- **Keep the order as it was**: rejected because the play text read backwards and the creation
  choices sat after the whole lore. It reopens if the play text stops being written as a sequence.
- **One outline for the whole page**: rejected because the pool is the full width Almanach list
  (0019 Decision 3), which an outline cannot sit beside, so a single outline would leave the lore
  without one. It reopens if the pool moves into the reading column.
- **The same order on tree pages**: not taken. A tree has no creation text, and the decider set its
  order in 0025 Decision 1. It reopens on the decider's request.
- **One count across both parts**: rejected for the stub case above.

### Caveats

- Species pages and tree pages now order their lore differently.
- Below 76rem the outlines are not sticky, so a phone reads the whole outline before the opening, as
  it did before, and the « Histoire » outline again above the lore. At 375 px the Humain page grew
  from 20,531 px to 20,914 px and the Nnor page from 14,567 px to 14,909 px.
- A people's naming custom and its name lists read in « Noms », in « En jeu » (0073, 0074). Until
  2026-11-08 the customs were lore sections printed after the pool.

---

## Decision 2: The lore collection loads an opening and its sections

### Decision

- `src/lib/game/lore-loader.ts` replaces the `glob` loader of the `lore` collection. For each
  `data/lore/**/*.md` it stores up to two entries, `<page>/opening` and `<page>/sections`, cut at the
  first line that starts with `## ` by `splitLore` in `src/lib/game/lore-parts.ts`. An empty part is
  not stored.
- Each part is rendered by the loader context's `renderMarkdown` with the file's URL, and stored with
  its `filePath`, a digest of its text, and its image paths as `assetImports`, so `render()` resolves
  its pictures as it did. In dev the loader listens to the file watcher and reloads a page that
  changes, the way `glob` does; the dev server rendered the new order, but a live reload was not
  exercised before this record.
- `loreFor` in `src/lib/game/prose.ts` returns both parts, with the translated page used whole when
  it exists, as before. The tree page renders the opening, then the sections, in one column.
- The author still writes one file per page, in one language.

### Rationale

- A page placed apart from the rest of its own file needs a render of its own. Verified in Astro
  7.3.3 (`package.json`, `pnpm-lock.yaml`): `renderMarkdown` uses the same `markdown.processor` as the
  `glob` loader's Markdown render (`node_modules/astro/dist/content/content-layer.js` and
  `node_modules/astro/dist/vite-plugin-markdown/content-entry-type.js`), and `render()` resolves
  images from `rendered.metadata.imagePaths` and `filePath`
  (`node_modules/astro/dist/content/runtime.js`).
- Proved on the build: of 770 pages reported by `pnpm build`, 736 are byte-identical to the build
  before the change once hashed asset names are normalised, tree pages included, and the 34 that
  differ are the 17 species pages in both languages.
- Splitting the authored file in two would shape data by where it is shown, which
  `.claude/rules/content/data-authoring.md` forbids.

### Alternatives considered

- **Two authored files per page**: rejected for the reason above. It reopens if an opening ever
  needs to be shown on a page of its own.
- **Reordering with CSS**: rejected because the visual order would no longer be the reading and
  focus order (`.claude/rules/frontend/accessibility.md`).
- **Cutting the rendered HTML in the page**: rejected because image resolution in `render()` is
  internal to Astro, and a cut HTML string would bypass it.

### Caveats

- A heading written as a setext underline would not cut the page; the lore files use `##` as
  `docs/runbooks/add-a-species.md` asks.
- The content store caches by text, not by loader code: after a change to the loader,
  `pnpm astro sync --force`.

---

## Open questions

- The labels « En jeu » / "In play" and « Histoire » / "Lore" await the decider. The prose editor
  noted that the handbook uses « En jeu » for play after creation
  (`data/books/livre-du-joueur/03-creer-un-personnage.md`), that "In play" echoes "Playing <name>
  characters" right under it, and that « Histoire » covers less than "Lore", which also spans
  customs, physique and names. Decided by Kori.
