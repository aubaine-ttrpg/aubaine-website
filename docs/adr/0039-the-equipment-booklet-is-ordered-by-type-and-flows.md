# ADR: The equipment booklet is ordered by type, then rarity, and flows

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-04
**Revised:** 2026-10-04, panoplies are alphabetical and their pages are titled Panoplies (addendum in Decision 2)
**Deciders:** Kori
**Scope:**
- **Covers:**
  - the order of the Équipement part of the equipment booklet (Codex Ornamentum);
  - how that part is cut into pages, and what its page title names.
- **Does not cover:**
  - the `/fr/equipement` index, which keeps its alphabetical list (0006, 0032);
  - the guide that opens the booklet (0011);
  - the words and states printed at the back (0027);
  - archiving (0013).
- The Panoplies part keeps one leaf per set after the Équipement part.

---

## Context

The booklet printed one leaf per rarity and section: Commun, then Armures, then Têtes, and so on, with the whole run repeated under every rarity. The paginator in `src/scripts/reflow.ts` splits a leaf that overflows, but it never joins two short leaves. As a result, each small group started on a fresh page.

The FR booklet of v0.2.1 (`data/media/pdf/equipement-fr-v0.2.1_90b72239_99d80ba2.pdf`, 42 pages by `pdfinfo`) printed 40 items over 23 pages, folios 5 to 27. Folio 8 held only the Targe and the Pavois, with its right column empty, and the Armures heading came back under four rarities.

---

## Decision 1: Type first, rarity inside a section

### Decision

- The Équipement part follows the families and sections in the order `data/equipment/catalogue.json` gives them.
- Inside a section, pieces run from Commun to Artéfact. `position` orders pieces of the same rarity.
- `catalogueByFamily` in `src/lib/game/derive.ts` owns this order:
  - a piece with an undeclared rarity stops the build;
  - panoply pieces are left out of this part;
  - a section or family left empty is dropped.
- The `position` describe in `src/lib/game/schema.ts` becomes « Rang dans sa section, parmi les pièces de même rareté. » `docs/runbooks/add-an-item.md` says the same.
- The contents list each family, then its sections. A family with a single section, such as Consommables or Objets, gets one row. Panoplies follows with one row per set.

### Rationale

- A player shops by slot and by kind of weapon. Rarity is already printed on every entry, in the sub-line of `src/components/primitives/ItemEntry.astro`, so it does not also need to be a chapter.
- Each section heading now appears once, with its slot glyph, instead of up to four times.
- The pieces outside a panoply in `data/equipment/items/` already ran from Commun upward within each section. Sorting on rarity first makes that order a rule instead of a habit.

### Alternatives considered

- **Keep rarity first, but flow the pages**: rejected. It keeps the repeated headings, and the search across four rarities. It would come back if the booklet became a loot table read by rarity at the table.
- **Rarity only from `position`**: rejected. A Rare piece given `position: 0` would print before every Commun piece of its section.

---

## Decision 2: One flowing leaf under a running title

### Decision

- **One leaf for the whole part.**
  - The Équipement part is a single `CatalogueLeaf` that the paginator cuts into as many pages as it needs.
  - Section headings sit inline, rendered by `src/components/print/CatalogueSection.astro`.
- **A running title.**
  - Each page's title names the family in force at the top of that page, under the subtitle « Équipement ».
  - Section headings carry a `data-running` mark.
  - `runningHeads` in `src/scripts/reflow.ts` gives each page the mark of its first unit, or else the last mark before it.
- **Panoplies.** The leaves keep one set each, titled with the set's rarity under « Panoplies ».
- **How an item may split.**
  - An item may continue from the left column into the right column of the same page.
  - It splits only between whole blocks: a paragraph of its text, a property, the craft box.
  - Its name stays with what follows it, and its italic description stays with the block above it (`src/styles/entries.css`).
  - An item never continues onto the next page. When any part of it would land past the right column, the paginator moves the whole item to the next page.

### Rationale

- Measured on the `AUBAINE_PRINT` build of 2026-10-04, against the v0.2.1 booklets in `data/media/pdf/`:
  - The FR booklet goes from 42 to 28 pages, and its Équipement part from 23 pages (folios 5 to 27) to 9 (folios 5 to 13).
  - The EN booklet goes from 41 to 28 pages.
  - These counts come from the `.au-page` leaves after pagination, and from the folios the contents page prints.
- Splitting items inside a page brought the part from 11 pages to 9. Before it, a weapon about half a column tall left the rest of a column empty whenever it did not fit.
- The running title keeps the reader oriented on a page that opens mid-section, without a heading on every page.

### Alternatives considered

- **Each family opens a page**: rejected. It costs about one page per family that ends mid-page, and the flow does not need it. It would come back if families grew long enough to want their own chapter openings.
- **Panoplies back to back**: rejected by the decider. A six-piece set would straddle two pages. One set per leaf is the separation the booklet keeps.
- **Let an item continue onto the next page**: rejected. It would save at most about one page, and the reader would turn the page in the middle of an item. It would come back if the part grew long enough for the saving to count.

### Caveats

- A page can still end with part of its right column empty, when the next item cannot finish on it. Folios 9 and 10 in FR end at about 55% and 66% of the right column.
- The section title's line box is now 1.4 instead of 1, because Cinzel's accents were clipped at the top of a column: « Armes · Mêlée » printed as MELEE. The fix was verified on a 200 dpi render of the « Têtes » heading.

### Addendum (2026-10-04): Panoplies are alphabetical and titled Panoplies

- `cataloguePanoplies` in `src/lib/game/derive.ts` now sorts sets by name with the locale collator, whatever their rarity. The contents list them in that order.
- A panoply page is titled « Panoplies » over « Équipement », the same pattern as « Armures » over « Équipement ». The set card names the set just below the title, and each piece still prints its rarity on its own line.
- The rarity no longer appears in the page title, so `setRarity`, which existed only to print it, is gone. The rule that every piece of a set shares one rarity moves to `tests/data/integrity.test.ts`. A set that no piece names still stops the print build.
- **Rarity order, as before**: rejected by the decider. A player looks a set up by its name, which every piece prints. Four of the five sets are Rare, so sorting by rarity mostly meant Faebies came last.
