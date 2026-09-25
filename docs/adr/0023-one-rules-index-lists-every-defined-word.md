# ADR: One Rules index lists every defined word, and the basic skills stay skills

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-25
**Deciders:** Kori
**Scope:** The Règles page that replaces the États and Actions de base pages, the glossary it shares
with the term index, where the Compétences de base are listed and where their cross references
land, and why keywords stay tooltips. Amends 0005 Decision 1 (two slugs retire behind 301s). Builds
on 0020 Decision 1 (a definition sits next to its word) and Decision 4 (tags stay out of the prose
index). Does not cover the provenance buttons of the skills index, nor how Swup navigates (0007).

---

## Context

`/fr/etats` and `/fr/actions-de-base` were card grids rendered by `src/components/views/Cards.astro`
that could filter by one facet but never select an entry, unlike the list and detail layout of
Compétences and Équipement (`src/components/primitives/BrowseList.astro`). Since 0020, every rule
term, Caractéristique, Aptitude and tag carries a definition, but a reader could only read one by
hovering the word somewhere. The 13 Compétences de base existed on the web only through the second
page: `src/lib/game/build.ts` left them out of the origins map, so no index or search row listed
them. The owner asked for one list of every rule of the game, in the display the items and skills
use, and for the Compétences de base to be skills in the skills index as well as rules.

---

## Decision 1: One Règles index replaces the États and Actions de base pages

### Decision

- A `rules` view kind at `/fr/regles` and `/en/rules` renders through `Browse` and `BrowseList`, like
  `skills` and `equipment`. The `baseActions` and `states` kinds are removed from `VIEW_KINDS` in
  `src/lib/i18n/routes.ts`.
- It holds one row per rule term, Caractéristique, Aptitude, state, tag and Compétence de base: 107
  rows in each locale, counted with `ruleBrowseEntries` on 2026-09-25. It filters by `Famille` and,
  for states, by `Effet`.
- `public/_redirects` answers the old paths with a 301: `/fr/etats` and `/en/states` to the Règles
  page, and `/fr/actions-de-base` and `/en/base-actions` to the skills index.
  `tests/unit/derive.test.ts` asserts the four targets against `pathFor`.

### Rationale

- Knowing what a word means is one question, so it gets one page, filterable and selectable like the
  other indexes. The card grids offered neither selection nor a detail pane.
- The Actions de base path goes to the skills index, not to Règles, because that is where the
  owner placed the Compétences de base as skills and where their cross references now land
  (Decision 3).

### Alternatives considered

- **Keep the États page and add a glossary page beside it**: rejected; two pages answering one
  question, and a state is a defined word like any other. Reopens if the list grows past what one
  filterable page reads comfortably.
- **Send `/fr/actions-de-base` to Règles**: rejected for the reason above. Reopens if the
  Compétences de base leave the skills index.

### Caveats

- The old cards carried `#etat-<key>` anchors. The Règles detail answers to `#e-state-<key>`, so a
  kept `#etat-` link opens the page on its first entry rather than on the state.

---

## Decision 2: One glossary feeds the tooltips and the Règles page

### Decision

- `buildGlossary` in `src/lib/game/build.ts` returns every rule term, every Caractéristique except
  the `any` marker, every Aptitude and every state, each with its spellings and its tooltip record.
  `Corpus.glossary` exposes it.
- `buildTermIndex` indexes the glossary's spellings first, in that order, then the skills. The
  records, their order and the first wins rule are unchanged, which the existing term index tests in
  `tests/data/integrity.test.ts` confirm.
- `ruleBrowseEntries` in `src/lib/game/browse-entries.ts` builds the Règles rows from the glossary,
  then the tags of `data/meta/tags.json`, then the list `data/skill-lists/basic-skills.json`.
- Each row id is `<family>-<key>`, for example `rule-avantage` or `state-agonie`. A rule term's key is
  `slugify` of its first French spelling, and every other key is the entry's own. The ids are the
  same in both locales, which the data tests assert.

### Rationale

- 0020 gives every definition one owner. A second walk over `RULE_TERMS` or the vocabularies would
  copy the colour, the icon and the definition rules, and the page and the tooltip could drift apart.

### Alternatives considered

- **Read the page from `terms.map`**: rejected; the map is keyed by spelling and is first wins, so a
  word holds several keys and a shadowed word would silently vanish from the page. Reopens if the
  term index comes to hold one record per word instead of one per spelling.
- **Export `RULE_TERMS` and walk the vocabularies again in the page**: rejected; it repeats the
  colour and icon fallbacks of `buildTermIndex`.

---

## Decision 3: The Compétences de base are skills first, and rules too

### Decision

- The origins map gains `basic`, so the skills index lists the 13 Compétences de base with their own
  provenance, `Compétences de base`, filterable beside the trees and the Banque Commune. Their source
  button opens the list's `note`, which `basic-skills.json` and `basic-skills.en.json` now carry,
  taken from chapter 08 of the Livre du joueur.
- The Règles page lists them too, under the family `Compétence de base`, with the full skill card as
  their detail.
- The cross reference of a Compétence de base, and of a Banque Commune skill, points at
  `/fr/competences#e-<id>`. `src/scripts/browse.ts` answers Swup's `link:anchor` hook, so a link to an
  entry of the index the reader is already on selects it.
- Search lists them in its skills group. Its rules group lists every other Règles row.

### Rationale

- The owner's words: they are Compétences, displayed in Compétences with their own filter, and since
  they are also rules of the game they belong on Règles.
- A same page link needs the hook. In `swup@4.10.0`, `handleLinkClick` sends a link to the current URL
  with a hash through `link:anchor`, whose default handler replaces the history state and fires no
  `hashchange`, so the detail pane would not change (verified in
  `node_modules/.pnpm/swup@4.10.0/node_modules/swup/dist/Swup.modern.js`).
- The Banque Commune links landed on the top of the index, not on the skill. They now share the
  anchored form.

### Alternatives considered

- **List them only on Règles**: rejected by the owner.
- **List them only in the skills index**: rejected by the owner.

### Caveats

- None of the 13 has an English overlay (no `data/skills/*.en.json` for their ids), so `/en/skills`
  and `/en/rules` show them in French. That is the documented fallback of 0003, recorded here as a
  gap to fill.

---

## Decision 4: Keywords stay tooltips, and a word the tags share is listed once

### Decision

- The records of rule terms, Caractéristiques, Aptitudes and states carry no `href`. Rule text marks
  them exactly as before, and chapter 01 of the Livre du joueur points the reader to the Règles page
  instead of claiming that state names link.
- `Sort` reads the definition of the `spell` tag (0020 Decision 1). It has one row, `rule-sort`,
  filed under both the rule term and the tag families, and the tag has no row of its own.

### Rationale

- The owner chose tooltips only. A link would turn a tap on a touch screen into a navigation away
  from the text instead of showing the definition.
- One word with one definition gets one row. Filing it under both families keeps it findable from
  either filter.

### Alternatives considered

- **Link every keyword to its Règles row**: rejected by the owner for the touch reason above.
  Reopens if a tooltip gains its own separate way to open the entry.
- **List Sort twice, as a rule term and as a Pratique**: rejected; two rows with one definition.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Règles view | The list and detail page of every defined word | `rules` in `src/lib/i18n/routes.ts`, `src/components/views/Browse.astro` |
| Glossary | Every word with its spellings and tooltip record | `buildGlossary` in `src/lib/game/build.ts` |
| Règles rows | Glossary, tags and Compétences de base as rows | `ruleBrowseEntries` in `src/lib/game/browse-entries.ts` |
| Retired paths | 301s to Règles and to the skills index | `public/_redirects` |
| Same page links | Select the entry a cross reference names | `onAnchorLink` in `src/scripts/browse.ts` |
