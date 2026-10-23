# ADR: The hero of a tree or a species is a character sheet on a living stage

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-23
**Deciders:** Kori
**Scope:** The hero of the Species and Tree pages: its layout, its dark stage, its key colour, the
descriptor stickers, the rank profile of a tree, the emblem on the card, the moving backdrop drawn on the GPU and its pause control, and
the `sizes` of the card picture. Amends 0053 Decisions 1, 2 and 3, and keeps its one 3:4 cover and
its shared WebGL2 context. Every other hero keeps the banner layout of `Hero.astro`. Leaves 0048
intact: every image still loads eagerly. Does not cover the cards of the indexes, the booklets or the
Atlas (0041).

---

## Context

After 0053 the cover stood in the right half of the hero and the left half was empty: the plates
pinned to its top, the name to its bottom, nothing between, seen on `/fr/arbre/marchand` and
`/fr/espece/nnor` at 1440 and 1920 pixels in both themes. The owner asked for an AAA character
presentation in Aubaine's own art direction (Cinzel, gold on night, the pointy-top hexagon, skewed
plates with hard shadows), leaning toward Persona 5 and Deadlock, with real effects, keeping the
3:4 picture. The owner also asked for words that qualify an entry, and for a tree to show its
strengths as ranks from F to S, with no overall grade. Versions: `astro@7.3.3` (reported by
`astro preview`), `@playwright/test@1.63.0` (`package.json`).

---

## Decision 1: The hero is a character sheet beside a framed card, on a dark stage

### Decision

- `src/components/primitives/CharacterHero.astro` draws the hero of `Species.astro` and `Tree.astro`.
  `Hero.astro` loses its portrait layout, its effect, its plates slot and its scroll cue, and keeps
  the banner every other view uses.
- The cover stands in a framed card: double rules, a hard dark shadow and a slab with a halftone
  behind it that fans out from under the card, tilted two degrees. The entry's name is set behind
  it in outlined Cinzel. The owner had the crest and the corner hexagons removed.
- The hero's accent is the key colour of its cover, read at build time by `src/lib/art-key-colour.ts`
  and set as the hero's `--gold`, so the descriptors, the slab, the frame, the outlined name, the
  profile and the booklet button take it. `src/lib/key-colour.ts` finds it: among the lit, coloured
  pixels, the dominant hue family, its hue weighted toward the highlights, then a colour that is
  stronger and deeper for a saturated cover and softer and lighter for a muted one. A cover without
  colour keeps the house gold. The plates keep their own colours.
- The left column reads the kind (« Arbre d’Archétype », « Espèce »), the status badge, the name,
  the subtitle, the descriptors, the profile of a tree, the plates and a tree's booklet buttons. The
  plates (`TraitPlates.astro`) speak the stickers' language, in a `dl` inside a labelled group: a
  black label tape across a paper sticker, tilted, with a hard shadow. A species' facts sit on bone
  paper, apart from its descriptors; a tree's Caractéristique dominante keeps its own colour. The
  ink, dark or light, is the one with the stronger contrast on that paper (`inkOn` in
  `src/lib/key-colour.ts`), at least 4.5 on every Caractéristique colour.
- The hero carries `.au-dark`, so it is a dark stage in both themes. The layout tokens
  (`--header-h`, `--sticky-top`, `--sticky-max` and the type scales) move out of the `:root, .au-dark`
  block of `src/styles/tokens.css` into `:root` alone, so the dark scope no longer resets the header
  height the shell publishes.
- With a fine pointer and no reduced motion, `src/scripts/character-hero.ts` leans the card toward
  the pointer and moves a glare and the outlined name with it. The arrival is CSS only, under 700
  milliseconds, transforms and opacity, and nothing that matters starts invisible.
- Below 960 pixels the card comes first, then the column.

### Rationale

- The owner's request. The header is already dark in the light theme (`src/components/shell/Masthead.astro`,
  `src/components/shell/Header.astro`), so a dark hero reads as one band with it.
- The name is sized from the info column at 0.78 em a letter, above the widest advance measured on
  the built site, 0.763 em for « Nnor » (« Prestidigitateur » draws 0.571). Measured with Playwright on Marchand, Nnor and
  Prestidigitateur at 320, 390, 768, 1024, 1280, 1440, 1920 and 3000 pixels: no horizontal scroll, no
  name wider than its box, and the column never reaches the card.
- The key colour reads `#e85a48` for the Nnor and `#e8bea6` for the Marchand, the red and the warm
  beige the owner asked for. `tests/unit/key-colour.test.ts` checks both covers and that the dark
  sticker ink keeps a contrast of at least 4.5 on every hue the rule can return.
- `tests/e2e/character-hero.spec.ts` covers the reading in both locales, the accent of each cover, the light theme, the phone
  order, the lean, the pause by keyboard, a Swup visit, back and forward, a tree node visit, print
  and reduced motion.

### Alternatives considered

- **A layout variant of `Hero.astro`**: every banner view would carry props that mean nothing to
  it. Rejected. Reopens if a third view wants the card.
- **A hero that follows the theme**: the backdrop takes the cover's colours, so the text over it
  needs a fixed dark ink. Rejected.
- **An authored colour per entry**: one more field to keep in step with the art. Rejected. Reopens
  if a cover's key colour misreads the art.
- **The mean colour of the cover**: it blends the Marchand's red cloth and its golden light into a
  peach. Rejected for the dominant hue family.

---

## Decision 2: Descriptors are vocabulary keys the owner chooses

### Decision

- `descriptors`, optional on a species and a tree, names one to four distinct keys from
  `data/meta/descriptors.json`, which holds `key`, `labelFr` and `labelEn` only. The hero shows them
  as stickers in the hero's key colour, in the order written.
- The first words are the owner's: Tribal, Solidaire, Farouche, ...Chèvre ?! (« ...Goat?! » in
  English) for the Nnor; Achète, Vend, Échange for the Marchand.

### Rationale

- A vocabulary holds both labels, so no overlay repeats them and `pnpm data:check` refuses an
  undeclared key, as it does for creature types and sizes (`tests/data/integrity.test.ts`).

### Alternatives considered

- **Free text with an English overlay**: an overlay keys arrays by id, never by position, and the
  words would be checked by nothing. Rejected.

---

## Decision 3: A tree may carry an editorial profile of six ranks

### Decision

- `profile`, optional on a tree, ranks six axes from F, the weakest, to S, the strongest, in the order
  F, D, C, B, A, S: Dégâts, Robustesse, Soin, Utilité, Liberté (how much the skills leave to the
  table) and Roleplay. All six or none, refused otherwise by `src/lib/game/schema.ts`.
- It is the team's reading and changes no rule. There is no overall grade and no Difficulty axis.
  A note behind « Profil » says so.
- `src/components/primitives/RankProfile.astro` draws a pointy-top hexagon, one ring per rank, the
  geometry from `src/lib/game/profile.ts`. The labels and the letters are HTML in a `dl`, so a screen
  reader hears each axis and its rank.
- The Marchand is the first: Dégâts D, Robustesse F, Soin C, Utilité S, Liberté S, Roleplay A, set
  by the owner.

### Rationale

- Six axes make the logo's hexagon. Difficulty was dropped by the owner: an S there would be a cost
  drawn as a strength.
- The ranks are written by hand, so the schema contract's rule against derived fields does not
  apply, and `docs/data-contract.md` says the profile does not follow the skills.

### Alternatives considered

- **Seven axes with Difficulty**: a heptagon, and a shape that rewards difficulty. Rejected by the
  owner.
- **Ranks computed from the skills**: the owner wants a judgement, not a count. Rejected.

---

## Decision 4: The backdrop moves on the shared GPU context, and the reader can pause it

### Decision

- A 128 pixel webp of the cover, made by `getImage`, fills the hero as a blurred CSS background. It
  is the whole backdrop without JavaScript, without WebGL2, on a software renderer, on the low tier
  and under reduced motion.
- Elsewhere `src/scripts/art-effect/stage.ts` draws over it a slow smoke of the cover's own colours,
  bokeh motes tinted by the colour beneath them and faint light shafts (`glsl/stage.frag`), on the
  studio's one context, at most 30 frames a second on the ultra tier and 24 on the high tier, and
  only while the hero is on screen. The hand-off is instant.
- The studio canvas only grows, and every copy out of it takes its drawn rectangle
  (`printRegion` in `src/lib/art-effect/cover.ts`), so the plates and the stage share it without
  resizing it every frame.
- A button stops and restarts the backdrop, the slow drift of the cover and the drift of the
  outlined name. The choice is kept under `aubaine.stage`, named on the privacy page.

### Rationale

- One context per page stays 0053's rule; `tests/e2e/art-effect.spec.ts` counts one with a
  developed hero and the stage together.
- Measured with Playwright against `astro preview`, Chromium on an Apple M5 (ANGLE Metal), 1440 by
  900, median of five, against the build of commit 7b7fd93:

  | Page | LCP element | LCP before | LCP after | Stage first frame | Frame interval p95 |
  | --- | --- | --- | --- | --- | --- |
  | Nnor | IMG | 72 ms | 80 ms | 62 ms after LCP | 16.7 ms |
  | Marchand | IMG | 56 ms | 64 ms | 31 ms after LCP | 16.7 ms |

  Long animation frames: before, up to two a run, the longest 83 ms; after, at most one a run, the
  longest 64 ms. The stage copied 30 frames a second, counted on its canvas.
- From `dist/_astro`, `gzip -9`: the effect code, 27,699 bytes (9,963 gzipped) in one chunk before,
  splits into `studio` 28,887 (10,087), `plates` 3,055 (1,533) and `stage` 2,741 (1,479). A Species
  or Tree page now fetches `studio` and `stage`, 11,566 bytes gzipped it did not fetch before. The
  shell grows from 46,523 to 48,696 bytes (16,520 to 17,167 gzipped).
- WCAG 2.2.2 asks that moving content running over five seconds can be paused, so the button is a
  requirement rather than a polish.

### Alternatives considered

- **three.js**: rejected by 0053 for the size of `atlas-engine`, and still so.
- **A second WebGL2 context for the stage**: two contexts where 0053 keeps one. Rejected.
- **Motes as DOM elements or a 2D canvas**: no smoke, and a second drawing path to maintain.
  Rejected. Reopens if WebGL2 reach becomes a concern.
- **Reduced motion as the only way to stop it**: fails 2.2.2 for a reader who has not set it.
  Rejected.

### Caveats

- Not measured on Windows, on integrated Intel graphics or on phones. The high tier is a budget,
  240,000 pixels at 24 frames a second, that has not been seen running there.
- Every Species and Tree page loads 11.6 kB gzipped of GPU code for a decoration. The CSS backdrop
  is the floor, and the stage is skipped under reduced motion before its code is fetched.

---

## Decision 5: The card asks for an image as wide as the card

### Decision

- The card's `sizes` is `(min-width: 960px) clamp(300px, min(36vw, calc((92vh - 120px) * 0.75)),
  560px), min(calc(100vw - 32px), 520px)`, the same expressions that size the card in CSS.

### Rationale

- `tests/e2e/images.spec.ts` asserts that the chosen candidate is at least the card's width times
  the pixel ratio, at 1280 by 700 and at 390 by 844 with a ratio of 3.

### Alternatives considered

- **Keep 0053's panel clamp**: it asked for the width of a panel that no longer exists. Rejected.

---

## Decision 6: An entry may wear an emblem, framed by a script and raised on the card

### Decision

- `emblem`, optional on a tree and a species, names a white SVG in `data/media/emblems/`, an owned
  directory, stamped by `pnpm media:stamp` like every owned picture. The Nnor wears `nnor.svg` and
  the Marchand `marchand.svg`, both the owner's drawings.
- `pnpm media:emblems` (`tools/media/emblems.ts`) rewrites every emblem onto one square frame: the
  bounds of its paths, curves included, measured by `src/lib/emblem-frame.ts`, centred with a 4 %
  margin on the longer side, its size, title and colour dropped. An emblem holds plain paths only;
  a group, a shape or a transform is refused, since the bounds would miss it.
- The card draws the emblem alone in its lower right corner, about 25 % of the card's width, in a
  metal gradient of the hero's key colour, raised by a lit upper edge and a shadowed lower one, over
  a soft dark halo that follows its outline so it stays legible on busy art. It presses on after the
  card lands. The owner preferred it to a first version set on a hexagon medallion.

### Rationale

- The owner's request: generated emblems arrive with different margins, so the same box drew one
  smaller than another. Framed, both fill 92 % of their frame's longer side, which
  `tests/unit/emblem-frame.test.ts` checks on the two files.
- `tests/data/integrity.test.ts` refuses an emblem that is missing, unframed or worn by nobody.
- The emblem is one inline SVG: the emblem file as a mask over a metal gradient, its relief and
  halo drawn by an SVG filter. The file stays a built asset, so the page carries no path of its
  own. A first version built from CSS layers with filters and clip-paths came apart in WebKit as the
  card leaned (the emblem drifted out of its medallion in Playwright's WebKit, and stayed put in
  Chromium and Firefox); drawn as one SVG, it moves with the card in all three.

### Alternatives considered

- **Fixing the margins in CSS per emblem**: one number to tune by hand for every new file.
  Rejected.
- **Measuring the bounds in a headless browser**: exact for any SVG, but a browser to run for a
  file conversion. Rejected for the plain-path rule. Reopens if an emblem needs arcs or groups.
- **CSS layers with `filter` and `clip-path`**: the first build. WebKit misplaces them inside the
  leaning card. Rejected.
- **Inlining the emblem's path**: no request for the file, at the cost of the full path in every
  page. Rejected.

---

## Summary

| Item | Role | Where |
| --- | --- | --- |
| `CharacterHero.astro` | the hero of Species and Tree pages | `src/components/primitives/` |
| `descriptors` | one to four owner words | `data/meta/descriptors.json` |
| `profile` | six editorial ranks, F to S | `src/lib/game/schema.ts`, `RankProfile.astro` |
| the stage | moving backdrop on the shared context | `src/scripts/art-effect/stage.ts` |
| `aubaine.stage` | the reader's pause | `src/scripts/character-hero.ts` |
| the key colour | the hero's accent, from its cover | `src/lib/key-colour.ts`, `src/lib/art-key-colour.ts` |
| `emblem` | an optional emblem raised on the card | `data/media/emblems/`, `tools/media/emblems.ts` |
