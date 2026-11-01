# Prototypes, the reserve page and shipping a pick

A new layout is built on a gated page, shown live, measured, picked by the owner, and only then
shipped. The same page keeps the layouts the owner wants to save for later.

## Contents

- [The gated page](#the-gated-page)
- [Building a prototype](#building-a-prototype)
- [The live review](#the-live-review)
- [The kept layouts](#the-kept-layouts)
- [Shipping a pick](#shipping-a-pick)

## The gated page

`src/pages/prototype/[...look].astro` builds only when `AUBAINE_PROTOTYPE=1` is set: its
`getStaticPaths` returns nothing otherwise, so no prototype reaches production. Every page it builds is
`noindex`.

- `/prototype` is the index: one live frame per option, the page at 1512 × 860 scaled to 0.3, with links
  to the French and English pages. Its text is French, for the owner.
- `/prototype/<hub>-<slug>/<locale>` renders one option inside the site's `Base` layout, with the hub's
  title, its help note and its doors, so the header, the stage and the door script are the real ones.
- The options and their pages are tables inside `getStaticPaths`; a new option is a row there and a
  branch in the template.

Today the page holds one kept layout, D, for both hubs in both languages, and, until the owner picks the
archives mark, three candidates for it on the Livres contents (`/prototype/archives-<slug>/<locale>`).
The pick goes into `ARCHIVES_MARK` in `src/lib/game/kind-marks.ts`; the candidates' branch and the
pictograms nobody picked then leave, as [Shipping a pick](#shipping-a-pick) asks.

## Building a prototype

- **Never on a live route.** A prototype renders its own component on the gated page; the view of the
  live route changes only when the owner picks it.
- **Real data through the real contracts.** Take the doors from `codexDoors` and `libraryDoors` in
  `src/lib/game/hub-doors.ts`, light them through the door contract (`approved-pieces.md`, The door
  contract), and feed the stage with `StageBackdrop.astro`. A layout that needs a new field adds it there,
  never as a literal in the component.
- **Reuse, never copy, the approved pieces.** Import `TitlePlates.astro`, `StageBackdrop.astro`,
  `StillToggle.astro`, `DoorGlyph.astro` and the helpers of `src/lib/plates.ts`; never edit an approved
  component to serve a prototype, and never copy one to change it. Every door layout (the plate menu, the
  Livres contents and D) takes its stage look, its ids, its `data-door-*` attributes and its style variables from
  `doorLooks(doors)` and `doorContract(door, look, index, lit)` in `src/lib/game/hub-doors.ts`, and the
  longest word's width in em that its CSS divides the name's room by from `fitLetters(names, padding)` in
  `src/lib/plates.ts`: `--fit-letters` with `PLATE_PADDING` where the names are plates, `--fit-word` with
  0.2 em on the Livres contents.
  Each layout keeps its own CSS, so D's plate rules repeat the plate door's plate recipe with their own
  tilts.
- **Every state, both languages.** Rest, pointed, lit, keyboard focus, without JavaScript, reduced motion,
  forced colours, print, the light theme, a phone. Fit the type to the longest word of the set in each
  language, never to one language's strings.
- **Plain and composed side by side** when the owner asks to compare (`rulings.md`, Working with the
  owner).
- **Measure before showing** (`measuring.md`): `pnpm design:audit` with the prototype's pieces against
  their frames, swept over every door, at the seven sizes.

## The live review

1. Build with `AUBAINE_PROTOTYPE=1` and serve it on your own preview.
2. Give the owner the index link, `http://localhost:4322/prototype`, and the direct link of each option.
3. Report the audit table, the contrast of the lines over the stage, and how the approved pages compared
   to their captures.
4. Name what each option takes from which in-game screen (`research.md`) and what it leaves.
5. Wait for the owner's pick. Every word of their verdict goes into `rulings.md`, dated and quoted, in
   the same change.

## The kept layouts

On 2026-10-31 the owner picked B+ for the hubs and asked to keep two other layouts for a page that may
need them: "let's keep D possibly for later for something else and C+ too, let's not waist them but
rather keep them for something". Later that day C+ shipped as the Livres hub: "let's put C+ for books and
keep b+ for codex." It left the gated page and is specified in `approved-pieces.md`, The Livres
contents. D stays built, lit by the door contract and audited on the gated page; it is not approved for a
live page, and shipping it is a new pick by the owner.

### D, the slanted doors

`SlantedDoors.astro` and `SlantedDoor.astro`; pages `/prototype/codex-cote-a-cote/<locale>` and
`/prototype/livres-cote-a-cote/<locale>`.

- Persona 5's side-by-side command panels in Aubaine's paper: one slanted panel per door in a row,
  skewed 8° (4° below 960 px). A closed panel is night with a 5 px edge in its kind's colour, its hexagon
  seal at the top and its name along the panel's axis, one size for every name of the row. The open panel
  takes 4.4 shares of the row against one for each closed panel, fills with its colour, and stacks its
  pictogram on the panel's axis above its name plates and its line, the arrow after the line.
- With fewer than four doors the panels share the row equally and a closed one shows its pictogram as a
  dark print. Below 960 px the panels become slanted bands. With JavaScript the width changes only once
  the 80 ms intent has passed.
- Every piece is placed on its panel's own slanted frame and counter-skewed alone, after the owner
  rejected the first rebuild for text "coming the divs" and an icon "not positionned at all"
  (`rulings.md`, Layout and composition). Audited on 2026-10-31 at the seven sizes, in both hubs and
  languages, with every door opened in turn: the results are in `measuring.md` § design:audit.
- Open question before it ships anywhere: from four doors and 960 px wide, a closed door shows its line
  only once it opens, and
  `DESIGN.md`'s first principle keeps nothing that matters behind a hover. Ask the owner whether that is
  acceptable for the page that would use it.
- Fits a small, fixed set of strong choices shown side by side, where one at a time deserves the space.

## Shipping a pick

The order the hub plate menu, then the Livres contents, shipped in, on 2026-10-31:

1. **Capture before.** `pnpm design:pixels capture` of the approved pages, and of the picked prototype at
   the sizes and states the owner saw.
2. **Wire the view.** Point the route's view at the picked component in `src/components/views/` and
   `src/components/views/View.astro`; keep the view thin, and give the component the data it needs from
   `src/lib/game/`.
3. **Remove what was not picked**, unless the owner keeps it on the gated page: its components, their
   CSS, the strings and fields only it read, its branch on the gated page. A picture it alone used moves
   to `data/media/unassigned/`. Search every removed name across `src/`, `tests/`, `tools/` and `data/`.
4. **Fold the prototype's switches.** A component that served several options keeps only the picked
   one's code; no flag stays behind.
5. **Tests.** Write or adapt the end-to-end spec from the audit (`measuring.md`, From audit to test), and
   fix every spec that pointed at the old layout.
6. **Prove it.** The live page matches the prototype to the pixel, the approved pages match their
   captures, and `pnpm verify` and the end-to-end run pass.
7. **Record it.** An ADR through the `aubaine-adr` skill, `DESIGN.md` (its page types, layout and
   components), `approved-pieces.md` (the spec and the guard tests), `rulings.md` (the pick, quoted), and
   the accepted capture in `../assets/approved/`.
8. **Report** the links, the tables and what was removed, and commit only on « commit ».
