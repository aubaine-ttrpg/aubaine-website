# The approved pieces

The owner has approved four pieces of the site: the character sheet that opens a tree or a species
page, the select screen of the Arbres and Espèces indexes, the plate menu that opens the Codex hub, and
the contents spread that opens the Livres hub. They set the direction: inspire from them, never copy them (`rulings.md`, The approved
pieces). This file is their rebuild spec, value by value, followed by the contract every hub door
shares and what only Aubaine has. `DESIGN.md` documents the look for a reader; this file is for
rebuilding a piece or matching it.

## Contents

- [Status, routes and captures](#status-routes-and-captures)
- [Reading the values](#reading-the-values)
- [The stage](#the-stage) and [the card](#the-card)
- [The character sheet](#the-character-sheet)
- [The select screen](#the-select-screen) and [the spotlight](#the-spotlight)
- [The arrival](#the-arrival) and [fallbacks](#fallbacks)
- [The hub plate menu](#the-hub-plate-menu), [the Livres contents](#the-livres-contents) and
  [the door contract](#the-door-contract)
- [What only Aubaine has](#what-only-aubaine-has)
- [Pictures](#pictures), [objects of Aubaine's world](#objects-of-aubaines-world) and [CADRAN](#cadran)
- [Guard tests](#guard-tests) and [records that disagree with the code](#records-that-disagree-with-the-code)

- **The code is the source of truth.** The sheet and the select screen are recorded as of commit
  `a9b3954` ("open Arbres and Espèces on a select screen", 2026-10-29), their approved state; read a
  file's approved state with `git show a9b3954:<path>`. The plate menu and the Livres contents are
  recorded as they shipped on 2026-10-31. Where this file and the code disagree, the code is right and this file is corrected.
- A component named without its folder lives in `src/components/primitives/`. Other paths start at the
  repository root. `KIND_MARKS` arrived after `a9b3954`, in `140bbe6`.
- Since `a9b3954` the Livres category pages reuse the select screen for books
  (`src/components/views/BookCategory.astro`), which added a `download` attribute on cover cards and on
  the spotlight's open link, a `library` filter variant, library sheets in
  `src/lib/game/character-sheet.ts` and library cards in `src/lib/game/hub-cards.ts`. The title plates'
  word rules moved, unchanged, into `src/lib/plates.ts`, and the help note's chapter link became optional
  for the hubs. None of it changes how the approved pages render: on 2026-10-31 the sheet and the select
  screen matched their earlier captures to the pixel in both languages (`measuring.md`).

## Status, routes and captures

| Piece | Approved | Capture | Built by | Routes |
| --- | --- | --- | --- | --- |
| Character sheet | 2026-10-27 | `sheet-tree-marchand.jpg`, `sheet-species-drow.jpg` | `CharacterHero.astro`, recorded in `docs/adr/0054-the-hero-of-a-tree-or-a-species-is-a-character-sheet-on-a-living-stage.md` | `/fr/arbre/marchand`, `/fr/espece/drow`, `/en/tree/marchand`, `/en/species/drow` |
| Select screen | 2026-10-28 | `select-screen-arbres.jpg` | `SelectScreen.astro` | `/fr/arbres`, `/fr/especes`, `/en/trees`, `/en/species` |
| Hub plate menu | 2026-10-31, the owner's pick of B+ | `hub-codex.jpg` | `PlateMenu.astro` with `PlateDoor.astro`, recorded in `docs/adr/0065-the-livres-hub-opens-on-its-contents-and-lists-every-category.md` | `/fr/almanach`, `/en/almanach` |
| Livres contents | 2026-10-31, the owner's pick of C+ | `hub-livres.jpg` | `SommaireSpread.astro` with `SommaireEntry.astro`, recorded in the same record | `/fr/livres`, `/en/books` |

The plate menu first opened Livres too; the contents spread took Livres the same day. The owner left the
details of Books to the designer ("i'll let you cook for Books"): every category has its entry, empty or
not, an empty category has its own page, and the archives come last, under a mark that awaits the owner's
pick (`rulings.md`, The archives belong to Livres).

On 2026-10-28, in the round the owner approved with the select screen, the sheet itself gained the seal of
an entry without a cover in place of the placeholder painting ("the new programtically generated cover
should be shown instead of the image placeholder"), the « ? » grades of an unranked tree, and the shorter
label « Caractéristique ».

The captures live in `../assets/approved/`. They were taken on 2026-10-31 from the built site, in French,
at 1512 × 860 with the living stage drawn on the GPU, and saved 1400 px wide (`measuring.md`, Capture an
accepted piece). Open one with the Read tool to see it.

| Capture | Shows |
| --- | --- |
| `sheet-tree-marchand.jpg` | The Marchand sheet, the one tree with a cover: key colour `#e8bea6`, its emblem, the profile, one trait plate, the booklet buttons. The slab and the ghost name run off the right edge, as approved. |
| `sheet-species-drow.jpg` | The sheet of a coverless species: the violet seal, the house-gold key, three bone trait plates, no profile. |
| `select-screen-arbres.jpg` | The Arbres select screen with Marchand in the spotlight: the title plates and their help button, the filter bar, the Archétypes group mark, drafts stamped « Brouillon », the profile over the card's lower-left corner, the open link taking its row. |
| `hub-codex.jpg` | The Codex plate menu at rest: the first door lit in bone plates, the others on black paper, the lit door's band and pictogram on the right of the stage. |
| `hub-livres.jpg` | The Livres contents at rest: the bone spread on the living stage, the four categories and the archives under the placeholder mark, the first entry lit over its slab, the pause square clear of the sheet. |
| `page-change-sheet-open.jpg` | The page change approved on 2026-11-02, Arbres to Marchand, 32 painted frames: the roster fades, every part carries into the sheet, then the radar unfolds and the grades stamp. Values in `src/scripts/page-score.ts`. |
| `page-change-sheet-back.jpg` | The same change on Back: the parts carry home in reverse order and the roster fades in under the last 220 ms of the flight. |

The two film strips were taken on 2026-11-02 with `pnpm design:transit --film`, in French, at 1512 × 860,
in headless Chromium, which draws the stage without WebGL; they record the motion, not the living stage.

## Reading the values

- **key** is the entry's key colour ([The key colour](#the-key-colour)). The sheet, each spotlight panel
  and each roster card set `--gold` to it; the rest of the select screen keeps house gold `#efbe04`.
- **night** is `--bg`, `#06050d`, at the alpha given: `night .6` is `rgba(6, 5, 13, .6)`. **Paper night**
  is the literal `#08070d`, a hair lighter, for card bodies, tapes and black plates.
- Shadows read x/y in px and are hard, with no blur, unless a blur is given.
- **--arrival** multiplies the durations and delays marked "× arrival": 1 when a page loads, 0.35 when the
  spotlight swaps.
- `--ease` is `cubic-bezier(0.16, 1, 0.3, 1)`. Cinzel is `--font-display`, JetBrains Mono `--font-mono`,
  Barlow Semi Condensed `--font-ui`, EB Garamond `--font-garamond`, Spectral `--font-body`. All of them
  live in `src/styles/fonts.css`.
- Colour tokens live in `src/styles/tokens.css`: `--ink` `#ece8f7`, `--ink2` `#b3abc9`, `--ink3`
  `#8b83a3`, `--on-gold` `#20180a`, `--bg2` `#0a0c1e`, `--line2` `rgba(239, 190, 4, .26)`, `--accent`
  `#8a5cc4`, `--accent-line` `rgba(157, 111, 209, .5)`, `--accent-soft` `rgba(123, 79, 176, .2)`,
  `--field` `rgba(157, 111, 209, .07)`. `.au-dark` restores them in the light theme, so both pieces stay a
  dark stage there.

## The stage

`StageBackdrop.astro`, `src/lib/stage-ambient.ts`, `STAGE` in `src/lib/art-effect/presets.ts`. The living
stage: `src/scripts/art-effect/stage.ts` and `src/scripts/art-effect/glsl/stage.frag`. The field:
`fieldBackdrop` in `src/lib/game/hubs.ts` and `paintField` in `src/scripts/stage-field.ts`.

The stage sits at `z-index: -1` in an isolated section on `--bg`. The sheet spreads it over the whole
section. The select screen keeps it in a sticky layer one viewport tall (`top: 0`, `height: 100svh`,
`margin-bottom: -100svh`) that stays behind the roster as it scrolls. Its source is the entry's cover, or
the seal colours of an entry without one. Back to front:

| Layer | Values |
| --- | --- |
| Ambient (CSS), for a cover | The cover as a 128 px WebP at quality 60, drawn 48 px past every edge, `background-size: cover`, `filter: blur(40px) saturate(1.45) brightness(0.62)`. |
| Field (CSS), for a seal | The same layer, with the same 48 px bleed and filter, painted instead with one `radial-gradient(62% 72% at <spot>, color-mix(in srgb, <colour> 80%, transparent) 0%, transparent 74%)` per colour, the spots at 28% 30%, 74% 66%, 58% 16% and 20% 78% in turn, over `linear-gradient(135deg, color-mix(in srgb, <first> 40%, #06050d), color-mix(in srgb, <last> 40%, #06050d))`. |
| Living stage (WebGL) | A canvas prepended inside the stage once its first frame is drawn; the ambient is then hidden. It lies under the shade and the halftone. |
| Shade below 960 px | `radial-gradient(120% 90% at 70% 40%, transparent 30%, night .7 100%)` over `linear-gradient(180deg, night .1 0%, night .55 52%, var(--bg) 100%)`. |
| Shade from 960 px | `radial-gradient(90% 110% at 78% 45%, transparent 25%, night .62 100%)` over `linear-gradient(90deg, night .84 0%, night .5 42%, night .08 100%)`: text sits on the dark left, the card on the lit right. |
| Halftone | Dots of night .6, 1.5 px in radius on an 8 px grid, masked by `linear-gradient(30deg, #000 0%, rgba(0, 0, 0, .5) 28%, transparent 58%)`: full in the lower left, gone past 58%. |

The living stage draws three things from the same source, the 128 px WebP or, for a seal, a 256 px PNG
that `paintField` paints (`#06050d`, the 135° gradient at alpha 0.4, the spots at alpha 0.8 with a radius
of 0.62 of the square):

| Part | Values |
| --- | --- |
| Smoke | The source read at the texture level that matches the 40 px blur, displaced by two noise fields drifting at 0.032 and 0.026 a second and two swirling at 0.018 and 0.021, then given the same saturate 1.45 and brightness 0.62. |
| Motes | Three layers of 6, 11 and 16 cells across the stage height, a mote in about half the cells. Each sways, twinkles and rises, crossing the stage height in 120 s, about 71 s and 50 s by layer. Tinted by the colour beneath, `clamp(base × 2.4 + (0.32, 0.22, 0.10))`; dimmed by layer, `÷ (1 + 0.9 × layer)`; added at 0.85. |
| Shafts | Noise beams indexed by angle (`angle × 11`, moving at 0.12 a second), cast from a point 0.06 of the stage width right of and 0.85 of its height above the centre of the `[data-stage-focus]` card, the sheet's card or the spotlight's. Full within 0.2 and gone at 1.6 stage heights, raised to the 4th power, added at 0.3 of the same tint. |
| Finish | A dither of ±1/255. |

- **Pace** (`EFFECT_TIERS`): 30 frames a second within a 400,000 pixel backing on the ultra tier, 24
  within 240,000 on the high tier, none on the low tier. It draws only while the stage is on screen and
  not paused.
- **Swap**: a new source cross-fades in over 450 ms (`FADE_MS`). It appears at once when nothing was drawn
  yet or while the stage is paused.
- **Never drawn** without JavaScript, without WebGL2 or on a software renderer
  (`src/scripts/art-effect/studio.ts`). Under reduced motion its module is never fetched
  (`src/scripts/art-effect/boot.ts`). The CSS layers are then the whole stage, as on the low tier.
- Not measured on Windows, on integrated Intel graphics or on phones (ADR 0054, Decision 4).

**Pause**: `StillToggle.astro` and `src/scripts/stillness.ts`. A 38 px square, 1 px `--line2` border,
ground night .6, an 18 px pause or play glyph in `--ink2`, `--gold` on hover and focus. On the sheet it
sits bottom right, 16 px from the right and bottom edges (26 px and 22 px from 960 px); on the select
screen it ends the spotlight's controls. It ships `hidden` until the script reveals it and stays hidden
under reduced motion. Its choice, kept in `localStorage` under `aubaine.stage`, pauses the stage, the
cover's pan and the ghost's drift (`--motion-state`) on every page. WCAG 2.2.2 asks for it (ADR 0054,
Decision 4).

## The card

`FramedCard.astro`, holding `Banner.astro` for a cover or `CoverSeal.astro` for a seal.

| | Sheet | Spotlight | Roster |
| --- | --- | --- | --- |
| Size | `hero` | `hero` | `roster` |
| Width | From 960 px `clamp(300px, min(36vw, calc((92vh - 120px) * 0.75)), 560px)`, below `min(calc(100vw - 32px), 520px)` (`CharacterHero.astro`) | `min(75cqh, 76cqw)` of the panel's stage from 1100 × 640, `min(30vw, 300px)` from 640 px, `min(52vw, 240px)` below (`SpotlightPanel.astro`) | One cell of the roster grid |
| Body | Paper night, turned -2°, shadow 14/16 night .78 | The same, shadow 8/9 night .72 | Paper night, no turn of its own, shadow 7/8 night .72 |
| Double rule | 1 px key at 60%, 10 px in; 1 px key at 28%, 15 px in | The same | 7 px and 11 px in |
| Slab | Always out | Always out | Out only when pointed |
| Emblem | When the entry names one | The same | Never |
| Picture | `object-position: 50% 24%`; settles, then pans | The same, with a smaller pan | `50% 26%`; still |
| `sizes` | The width expressions above | `(min-width: 1100px) and (min-height: 640px) clamp(180px, 26vw, 420px), (min-width: 640px) min(30vw, 300px), min(52vw, 240px)` | `(min-width: 960px) 240px, (min-width: 640px) 32vw, 46vw` |

**Body.** A 3:4 box. Its card layer holds, in order, the plate (clipped) with the picture or seal, the
double rule, the emblem and the glare.

**Slab.** A key quadrilateral, `clip-path: polygon(16% 0, 100% 5%, 86% 100%, 0 94%)`, inset
`8% -12% -5% -9%` around the card, turned 5°, printed with dots of night .2 (1.3 px in radius on a 7 px
grid), behind the card. On the roster it is inset `6% -8% -4% -7%`, turned 4°, and rests at opacity 0
and scale 0.9.

**Picture.** `Banner.astro` fills the plate with `object-fit: cover`, from files 640 to 3344 px wide. On
the sheet, `au-settle-lg` runs 1 s (`cubic-bezier(.4, .02, .28, 1)`) from scale 1.17 to 1.1 at (-3.4%,
-1.9%), then `au-idle-lg` pans to (+3.4%, +1.9%) and back every 24 s (`cubic-bezier(.37, 0, .63, 1)`);
the keyframes live in `src/styles/base.css`. In the spotlight, `au-settle` and `au-idle` go from 1.12 to
1.06 and pan ±2.2% and ±1.2%. Roster covers do not move. The sheet's picture and the spotlight's first
picture load with `fetchpriority="high"` and `decoding="sync"`. An entry may set `artEffect`, `film`
(« Pellicule ») or `oil` (« Huile »), which the GPU develops over the picture on the sheet and on roster
cards, not in the spotlight (`docs/adr/0053-hero-art-is-developed-on-the-gpu-over-its-plain-picture.md`);
none does at `a9b3954`.

**Seal.** `CoverSeal.astro` replaces a missing cover, the common case: at `a9b3954` only Marchand among the
25 trees, and Humain and Nnor among the 17 species, have a cover. Layers:

- ground `#0d0b16`;
- the seal field under `linear-gradient(165deg, night .08 0%, night .62 72%, #08070d 100%)`, the
  two at opacity 0.86;
- a halftone of night .55 dots, 1.3 px in radius on a 7 px grid, masked by
  `linear-gradient(200deg, #000 0%, transparent 70%)`, strongest at the top;
- the initial outlined huge, Cinzel 700 at `96cqi`, line-height 0.8, a 1.5 px stroke of
  `rgba(244, 241, 251, .16)`, at right -6cqi and bottom -12cqi, bleeding off the card;
- at the centre, the logo's two hexagons with the points of `data/media/aubaine-logo.svg`, `50cqi` wide,
  stroked 2.6 in key with no fill, around the initial in Cinzel 700 (36 units of the 100-unit crest) in
  key, the whole crest under `drop-shadow(5px 6px 0 night .62)`.

The field colours come from `src/lib/game/seals.ts` ([Seals](#seals)), and the stage behind a coverless
entry paints the same colours. On 2026-10-28 the owner chose the initial over a characteristic glyph, "i
prefer names as icons are already showed on top right", and asked: "Please for the no-image covers have
the logo centered."

**Double rule.** Two flat 1 px hairlines in the entry's own colour, on every card, pointed or not. It reads
as gold only when the key falls back to house gold. On 2026-10-23 the owner had an earlier frame's crest
and corners taken off: "also if you can remove crest and the corners svg of the fram, ithink ti's better
without those".

**Emblem.** Hero size only, for an entry that names a file in `data/media/emblems/`: Marchand, Nnor and
Humain at `a9b3954`. One inline SVG in a 100-unit box:

- the emblem file masks a linear gradient from (0.2, 0) to (0.8, 1) running
  `color-mix(in srgb, key 40%, #fff)`, key at 0.45, `color-mix(in srgb, key 62%, #08070d)`;
- a filter adds a halo (the shape dilated by 2, blurred by 4, `#06050d` at 0.75), a light edge 0.7 unit up
  in `color-mix(in srgb, key 30%, #fff)` and a dark edge 1.1 units down in `#06050d` at 0.85;
- it sits at right 4% and bottom 3.5%, `clamp(88px, 25%, 148px)` wide, turned -6°.

The owner asked on 2026-10-23 "can the emblems be bigger please ?" and then "it's perfect but could add
some relief on it". Of the two stronger reliefs tried next, the owner kept neither: "iactually could we
roll back to the first one emblem please not the previous one the one before that one". The edges and
halo above are that first relief. ADR 0054, Decision 6, records how emblem files are framed.

**Lean and glare.** `src/scripts/tilt.ts`, mounted by `src/scripts/stage-host.ts` on each
`[data-tilt-host]`: the whole sheet section, the spotlight, and each roster link.

- Mouse only, with `(hover: hover) and (pointer: fine)` and no reduced motion.
- With the pointer's offset across the card from -1 to 1 on each axis (beyond, when it is outside the
  card), lean = 0.9 × tanh(0.7 × offset).
- The card turns `perspective(1400px) rotateY(lean-x × 7deg) rotateX(lean-y × -7deg)`, at most 6.3°,
  easing over 0.6 s at rest and 0.14 s while tracking.
- While tracking, a soft-light glare fades in over 0.4 s:
  `radial-gradient(circle at calc(50% + lean-x × 45%) calc(40% + lean-y × 45%), rgba(255, 238, 196, .32),
  rgba(255, 238, 196, 0) 48%)`.
- The ghost name slides the other way, by lean-x × -22 px over 0.6 s.

## The character sheet

`CharacterHero.astro`, its column built by `SheetHead.astro` and `SheetBody.astro` from `treeSheet` and
`speciesSheet` in `src/lib/game/character-sheet.ts`. Routes `/fr/arbre/marchand`, `/fr/espece/drow`,
`/en/tree/marchand`, `/en/species/drow`.

### Section and grid

- `.au-character.au-dark`: isolated, `overflow: clip`, an inline-size container on `--bg`, closed by a
  1 px `--line2` rule. It hosts the stage and the lean, so a mouse anywhere over it leans the card. It sets
  `--gold` to the key.
- From 960 px: grid `'info card'`, columns `minmax(0, 1fr) auto`, items centred in height, column gap
  `clamp(36px, 5cqi, 104px)`, padding 44/26/76 px, max width 1560 px, min height `min(92vh, 900px)`. The
  card keeps a right margin of `clamp(8px, 3cqi, 64px)`.
- Below 960 px: the card first, then the column 30 px under it; padding 30/16/64 px.
- As approved, the slab's right part and the ghost name run past the right edge, where the section clips
  them (both captures). The rule that nothing is cut by its frame governs the spotlight and new pieces;
  the owner settled this on 2026-10-30.

### The column, top to bottom

| Piece | Values | File |
| --- | --- | --- |
| Kind | A solid pointy-top hexagon in key, 12 × 13 px (points `50,4 90,27 90,73 50,96 10,73 10,27`); 9 px later the kind in JetBrains Mono 11.5 px, 0.24 em, capitals, in key, on no tape: « Arbre d’Archétype », « Arbre de Domaine », « Espèce » ("Archetype Tree", "Domain Tree", "Species"). Then a rule, `flex: 1 1 32px` up to 120 px, 1 px, `--line2` fading to transparent; then the status badge. The row wraps with gaps of 10/14 px and sits 14 px above the name. | `SheetHead.astro`, `src/lib/i18n/strings.ts` |
| Status badge | Barlow Semi Condensed 700, 13 px, 0.08 em, capitals, padding 8/10 px. Draft « Brouillon »: `#9a93b0` on `--bg2`, 1 px dashed `#6f6884`. Playtest: `#14100a` on `#f7d117`, `#14100a` stripes at 45° in a 5 px band along the top and bottom. Beta: `#7fc8d6` on `--bg2`, 1 px `#4f9fb0`. A `balanced` entry shows none. | `StatusBadge.astro`, `src/styles/base.css`, `src/styles/tokens.css`, `src/lib/game/status.ts` |
| Name | The page's `h1`. Cinzel 700, line-height 0.93, `--ink`. Size `clamp(30px, fit, largest)`, fit = min(40, 100 / (0.78 × letters)) cqi of the column, largest 132 px from 960 px and 96 px below. Shadow `0 2px 0` night .6 and `0 8px 36px` night .7. | `SheetHead.astro`, `CharacterHero.astro` |
| Subtitle | EB Garamond italic, `clamp(19px, 2.2vw, 28px)`, line-height 1.3, `--ink2`, 12 px under the name, only where the entry has one (Berserker: « La chair à vif »). | `SheetHead.astro` |
| Stickers | One to four words the owner picks from `data/meta/descriptors.json` (Marchand: « Achète », « Vend », « Échange »), 24 px down. Flat key paper, `--on-gold` ink, Barlow Semi Condensed 700, capitals, 0.06 em, `clamp(17px, 1.6vw, 22px)`, line-height 1, padding 9/16/8 px, 14 px apart, turned -3°, 2°, -1.5°, 2.5° in turn, shadow 4/5 black .62. | `DescriptorStickers.astro` |
| Body | 30 px down, the profile beside an aside of trait plates and actions; flex wrap, gaps 30/44 px; the aside is a column with 28 px gaps. | `SheetBody.astro` |
| Profile | Trees only; see below. | `RankProfile.astro` |
| Trait plates | See below. | `TraitPlates.astro` |
| Actions | A tree with a booklet. « Télécharger le livret »: a straight, flat key button, Barlow Semi Condensed 600, 15 px, 0.1 em, capitals, `--on-gold` ink, padding 11/18 px, a 17 px download glyph, `brightness(1.08)` on hover, 1 px down when pressed, no tilt, no shadow. « Versions précédentes »: straight, a 1 px `--accent-line` outline, `--ink2`, 13.5 px, padding 11/16 px. With a profile they stack in a column. A species has none. | `src/components/views/Tree.astro`, `SheetBody.astro` |

### The rank profile

`RankProfile.astro`; geometry in `src/lib/game/profile.ts`, axes and ranks in `src/lib/game/schema.ts`;
ADR 0054, Decision 3.

- Up to 340 px wide, an inline-size container. The caption « Profil », JetBrains Mono 11 px, 0.24 em,
  capitals, in key, is followed by a 28 px info button named « Comment lire le profil » (a 17 px glyph
  in `--ink2`; key and a `--line2` border on hover or focus) that opens a note titled « Profil ».
- The chart is a 200-unit square. Six rings, pointy-top hexagons at 1/6 to 6/6 of a radius of 58, one per
  rank F, D, C, B, A, S. Rings `rgba(236, 232, 247, .16)` at 0.6; the outer ring key at 0.7 opacity and
  width 1; spokes `rgba(236, 232, 247, .14)` at 0.6.
- The shape: key fill at 0.2; a dot pattern in key at 0.75 (5-unit cells turned 30°, dots of radius
  1.05); a 1.6 key edge with round joins; at each vertex a pointy-top hexagon of radius 3.6 in key with a
  0.8 paper-night stroke.
- Axes, clockwise from the top: Dégâts, Robustesse, Soin, Utilité, Liberté, Roleplay (Damage, Tankiness,
  Healing, Utility, Freeform, Roleplay). Labels in Barlow Semi Condensed 600, 12 px, 0.12 em, capitals,
  `--ink2`.
- Grades: plates 36 px tall and at least 38 px wide, padding 0 8 px, skewed -10°, paper night, 1 px key
  border, a hard 3/3 key shadow. The letter is skewed back: Cinzel 700, 22 px, `#fbf8ef`. An S is
  inverted: key ground, paper-night border and shadow, `--on-gold` letter.
- A tree not ranked yet shows « ? » on every grade, with a visually hidden « Pas encore de rang », and no
  shape. The owner asked on 2026-10-28: 'on unknown profile we should display a "?" instead of fake data
  or just not displaying a profile'.
- A species never shows one: "there is a huge diff between having the possibility of having profiels and
  just haven't had profiles filled yet" (owner, 2026-10-28). `SheetProfile` in
  `src/lib/game/character-sheet.ts` keeps `none`, `pending` and `ranked` apart.
- When the sheet's profile is narrower than 300 px, the chart shrinks to 70% and the axes become a
  two-column list.

### The trait plates

`TraitPlates.astro`, filled from `src/lib/game/character-sheet.ts`.

- A `dl` in a group labelled « Caractéristique » or « Caractéristiques » for a tree, « Traits de l’Espèce »
  for a species. Flex wrap, gaps 18/16 px, plates turned -1.5°, 1°, -2°, 1.5° in turn.
- A tree shows one plate per characteristic it leans on, labelled « Caractéristique ». A species shows its
  creature type, then its speed (9 m unless it writes another) and its size, or its origin when it derives
  from other species.
- Label (`dt`): a paper-night tape, JetBrains Mono 9.5 px, 0.2 em, capitals, ink
  `color-mix(in srgb, <paper> 45%, #fff)`, padding 4/8/3 px, turned -2.5°, laid on the plate's top edge
  (overlapping it by 7 px, 10 px in), shadow 2/2 black .5.
- Value (`dd`): flat paper with `#14100a` ink, padding 12/16/9/12 px, shadow 4/5 black .62, Barlow Semi
  Condensed 700, 19 px, 0.06 em, capitals. The glyph sits in an inverted rounded hexagon
  (`CharacteristicHex.astro`, `mdi:hexagon`, 27 × 30 px): the hexagon in `#14100a`, the 15 px glyph in the
  paper colour.
- Paper, for a tree: the characteristic's colour from `data/meta/characteristics.json`, raised in OKLCH
  lightness by steps of 0.005 until `#14100a` reads on it at 4.5 or more (`readableOnNight` in
  `src/lib/key-colour.ts`). Charisme `#b8901e` reads at 6.36 and stays; Force `#b5372e` becomes `#d35347`
  and Intelligence `#2f6cae` becomes `#417ec2`. For a species: bone `#efe4cc`. The plates never take the
  key.

### The ghost name

`GhostName.astro`: Cinzel 700, transparent, a 1.5 px stroke of key at 34%, line-height 0.8, no wrap,
`aria-hidden`, under a 90° mask (transparent at 0, opaque from 38%) so it fades in from the left.

- On the sheet its size is min(22, 70 / (0.78 × letters)) cqi of the section. From 960 px it sits at bottom
  9% and right -2%, behind the column and the card (`z-index` 0 under the card's 1); below 960 px at top
  10% and right -3%.
- It drifts by `margin-right` from 0 to 4cqi over 32 s and back over the next 32 s (ease-in-out,
  alternate), paused with the stage, and slides against the lean.
- Hidden in print and in forced colours.

### The scroll cue

« Lire la suite » ("Read on"), sticky 20 px above the bottom of the screen while the sheet is in view,
centred, JetBrains Mono 10.5 px, 0.3 em, capitals, `--ink2`, over a 16 × 9 px chevron that nudges 5 px
every 2.4 s (`au-nudge` in `src/styles/base.css`, `cubic-bezier(0.37, 0, 0.63, 1)`). `aria-hidden`;
hidden below 640 px and in print (`CharacterHero.astro`).

## The select screen

`SelectScreen.astro`, used by `src/components/views/Trees.astro` and
`src/components/views/SpeciesIndex.astro`. Routes `/fr/arbres`, `/fr/especes`, `/en/trees`, `/en/species`.

### Where it comes from

On 2026-10-27 the owner chose its shape from a proposal that named Deadlock's hero select and League of
Legends' champion select for the desktop, the roster on the left and the spotlight on the right, and the
Persona 5 Royal site for the phone, the spotlight on top stepped with ‹ › arrows. The owner also chose to
keep the whole screen a dark stage in the light theme.

| Source | What the select screen took | Seen |
| --- | --- | --- |
| Deadlock, hero select (overhauled in August 2025) | A roster of portrait tiles beside the pointed hero's poster in that hero's own inks, the name at the poster's foot and three words on dark tapes: the roster, the spotlight, the ghost name, the key colour, the stickers. | Small screenshots captured on 2026-10-27 from a [GameHaus article of 18 August 2025](https://thegamehaus.com/deadlock/6-new-deadlock-heroes-revealed-new-select-screen-more/2025/08/18/); the wiki's hero galleries, such as [Mina's](https://deadlock.wiki/Mina/Gallery), list the select background, the vertical card and the name apart. |
| League of Legends, champion select | The pick's art on screen: the stage that takes the pointed entry's picture. | Viewed on 2026-10-30 at [Interface In Game](https://interfaceingame.com/screenshots/league-of-legends-choose-your-loadout/); the [League wiki](https://wiki.leagueoflegends.com/en-us/Team_drafting#Trivia): "The selected skin's splash art is shown on screen." |
| Persona 5 Royal official site, Characters | One character large above crooked portrait cards with name tapes; on a phone, the spotlight on top with a chevron. | Captured on 2026-10-27 ([persona.atlus.com/p5r](https://persona.atlus.com/p5r/)). It is SEGA's marketing page. Since the owner's "i don't want the feel of a Video Game Webiste, i want the feel of those Video game" (2026-10-28), references come from the games' own screens. |

Persona 5's own Confidant screen, viewed after the approval, makes the move of the spotlight's arrows: one
bond at a time, stepped in place between the L1 and R1 marks
([picture](https://mechanicsofmagic.com/wp-content/uploads/2022/04/cff88b3c293e4b48bfe3a138a8f9ae57.jpeg)).
The games themselves are in [`deadlock.md`](deadlock.md), [`persona-5.md`](persona-5.md) and
[`hextech.md`](hextech.md).

### Section and grid

- `.au-select.au-dark`: isolated, `overflow-x: clip`, on `--bg`, closed by a 1 px `--line2` rule. It hosts
  the stage. `--select-top` is 44 px.
- Below 1100 px wide or 640 px tall: one column in the order title, spotlight, filter bar, roster; row gap
  28 px; padding 30/16/84 px; max width 1560 px. The spotlight stays in the flow, above the list.
- From 1100 px wide and 640 px tall: areas `'title spotlight' 'filter spotlight' 'roster spotlight'`,
  columns `minmax(0, 1fr)` and `clamp(420px, 34vw, 540px)`, rows `auto auto 1fr`, column gap
  `clamp(32px, 3.4vw, 72px)`, padding 44/26/110 px.
- A visually hidden `role="status"` line announces the entry's name when the arrows step.

### Title plates and the help note

`TitlePlates.astro`, `PopoverNote.astro`.

- The page's only `h1`, labelled with the title: « Arbres de compétences » and « Espèces » ("Skill Trees",
  "Species"). Cinzel 700, capitals, line-height 0.86, one plate per word, flex wrap with gaps of
  0.06/0.16 em.
- A plate: padding 0.1/0.2/0.04 em, turned -4°, 2.5°, -2°, 3° in turn. Odd plates are house gold
  `#efbe04` with `--on-gold` ink and a 0.07/0.08 em shadow of night .72. Even plates are paper night with
  gold ink and a gold shadow at 70%. In a title of several words, a word of three letters or fewer (« DE »)
  is a small plate at 0.42 em, padding 0.16/0.3/0.1 em, aligned to the top.
- Size `clamp(min(38px, 10.5cqi), fit, 112px)`. Fit is min(19, 82 / (0.8 × characters)) cqi for the whole
  title, spaces counted, when that reaches 9 cqi; otherwise the same rule fitted to the longest word over
  three letters.
- The help button: a 44 px paper-night square turned 3°, right after the last plate with a 10 px top
  margin, 1 px `--line2` border, a 24 px gold info glyph, shadow 3/4 night .6; on hover or focus a gold
  border and a 2 px lift, and `scroll-margin-block: calc(var(--sticky-top) + 8px) 16px`, so the keyboard
  finds it clear of the sticky header. Its label reads « À propos : Arbres de compétences ».
- The note: a native popover, `min(380px, 100vw - 32px)` wide, padding 18/20/16 px, 1 px `--accent-line`
  border, `--bg2`, a soft shadow `0 24px 60px` black .45. Its title in Cinzel 600 19 px, the lead in 15 px
  `--ink2` at line-height 1.6, a link to the Livre du joueur chapter (« Le chapitre complet : … », Barlow
  Semi Condensed 600, 15 px, gold, underlined), and a « Fermer » button. With CSS anchor positioning and
  from 560 px wide it opens under its button, reaching right, and flips when it lacks room; otherwise it
  opens centred, the browser's default. It works without JavaScript.
- Nothing else sits in the header. On 2026-10-27 the owner asked of a tally "what's the point of having the
  number of each if it is shown afterwards with the number of results", and on 2026-10-28 traded the
  printed lead for a helper: 'maybe put a helper smoehere near the "SPECEIS" or "SKILL TREE" thing that
  displays those helps with a link to PHB related chapter'.

### The filter bar

`FilterBar.astro` and the React island `src/islands/FilterBar.tsx`.

- Under the title, closed by a 1 px `--line2` rule: flex wrap, space between, gaps 12/20 px, 16 px of
  padding under it.
- Left, on Arbres, a kind select (« Tous les Arbres », « Archétypes », « Domaines »): a field tinted
  `--field`, 1 px `--line2` border turning gold on hover or focus, Barlow Semi Condensed 600, 14.5 px,
  0.08 em, capitals, padding 10/14 px, a small ▾ drawn 8 × 5 px in `--ink3`. Its list: 1 px gold border,
  `--bg2`, shadow 6/7 night .55, items in Barlow Semi Condensed 600, 15 px, 0.06 em, the current one on
  `--accent-soft`, each after a 6 px square dot, gold for « Tous les Arbres » and `--ink3` for the others.
- Then the name field « Filtrer par nom… »: the same tint and border, 15 px, padding 10/13 px, at most
  300 px wide on Arbres and 340 px on Espèces.
- Right, the « Masquer les brouillons » switch: Barlow Semi Condensed 600, 14.5 px, 0.08 em, capitals; a
  36 × 20 px pill with a 12 px round knob in `--ink3`; when on, a gold border, `--accent-soft` and a gold
  knob moved 16 px. It shows only where drafts exist.
- The results tape (« 25 résultats »): paper night, JetBrains Mono 10.5 px, 0.16 em, capitals, tabular
  figures, ink `color-mix(in srgb, gold 55%, #fff)`, padding 5/9/4 px, turned -2°, shadow 2/2 black .45,
  announced politely.
- The « Filtres » button: a gold plate, `--on-gold` ink, Barlow Semi Condensed 700, 14.5 px, 0.08 em,
  capitals, padding 10/16 px, a three-line glyph, shadow 4/4 night .6 growing to 6/6 with a 1 px lift up
  and left on hover; a count chip appears when filters are on.
- The dialog: a native `dialog` over a scrim of `rgba(4, 3, 10, .72)` blurred 6 px. The panel is
  `min(560px, 100%)` wide and at most `82dvh` tall, 1 px gold border, `--bg2`, shadow 10/12 night .6;
  heading Cinzel 700 22 px. Chips: Barlow Semi Condensed 700, 14.5 px, 0.06 em, capitals, `--ink2`, 1 px
  `--line2`; a chosen chip turns gold with `--on-gold` ink, turns -1.5° and casts 3/3 night .6. Facets:
  Domaines, Caractéristique and Statut on Arbres; Statut on Espèces.
- The « Filtres » button, the chips and the switch take a 2 px gold focus outline, 3 px out.

### Group marks

In `SelectScreen.astro`.

- An `h2` per labelled group: « Archétypes » and « Domaines » on Arbres. Espèces has a single group with
  no heading.
- An outlined pointy-top hexagon, 22 × 25 px, paper-night fill and a gold stroke of 7 in a 100-unit box;
  12 px later the label on a paper-night tape (padding 6/11/5 px, turned -2°, shadow 3/3 night .6) in
  JetBrains Mono 12 px, 0.26 em, capitals, gold; a 1 px rule fading from `--line2` to transparent fills the
  rest of the line.
- The cards start 24 px below. Groups sit 40 px apart, and a group with no card left to show disappears.
- The grid: `repeat(auto-fill, minmax(min(100%, 148px), 1fr))` with gaps 26/16 px on a phone,
  `minmax(176px, 1fr)` with 32/20 px from 640 px wide, `minmax(156px, 1fr)` with 30/18 px in the
  two-column layout. Each card link keeps `scroll-margin-top: 84px` (`--sticky-top`) to clear the header.

### The roster card

`CoverCard.astro` around a roster-size `FramedCard.astro`.

- A link to the entry's page (an inline-size container) inside an `.au-dark` wrapper that sets `--gold`
  to the entry's key.
- The whole frame rests turned by a cycle of -1.8°, 1.2°, -0.8°, 2°, -1.4°, 0.7°, 1.6°.
- Inside, back to front: the cover (still, `50% 26%`) or the seal; the draft veil; a scrim
  `linear-gradient(0deg, #08070d 0%, rgba(8, 7, 13, .82) 22%, transparent 52%)`; for a tree, a 4 px spine
  down the left edge in its seal field; a status badge other than draft top left (14 px in, the small
  size: 11 px, padding 6/8 px); a tree's characteristic badges top right (12 px in, 4 px apart: a rounded
  `mdi:hexagon`, 30 × 33 px, in the characteristic's own colour, a white 16 px glyph, a soft
  `drop-shadow(0 2px 5px)` of black .45, the characteristic's name as a tooltip); and at the bottom, 8% in
  and 7% up, the kicker tape over the name.
- Kicker: « Archétype », « Domaine » or « Espèce » ("Archetype", "Domain", "Species") on a
  paper-night tape, JetBrains Mono 9.5 px, 0.2 em, capitals, ink `color-mix(in srgb, key 55%, #fff)`,
  padding 4/8/3 px, turned -2.5°, shadow 2/2 black .5. The owner asked on 2026-10-28 to "only display :
  Archetype or only display Domain no need to say tree we already are in the skill trees".
- Name: Cinzel 700, `clamp(13px, fit, 27px)` with fit = min(11, 84 / (0.78 × letters)) cqi of the card,
  line-height 1.02, `--ink`, shadow `0 2px 0` night .7, `overflow-wrap: break-word`.

### Drafts

- Every entry is listed and drafts show by default; the owner picked the option "Sealed cards, shown" on
  2026-10-27.
- A draft card keeps its link. Its face drops to `saturate(0.7) brightness(0.74)` under a veil of night .7
  dots, 1.4 px in radius on a 6 px grid; its name turns `--ink2`; the « Brouillon » badge is stamped at
  the centre, turned -12°, scaled 1.45, under `drop-shadow(3px 3px 0 night .75)`.
- « Masquer les brouillons » hides them and is kept in `localStorage` under `aubaine.drafts`. At `a9b3954`
  every tree is a draft, so hiding drafts empties the Arbres roster and its spotlight.

### The pointed state

`CoverCard.astro`, `FramedCard.astro`, `src/scripts/select-screen.ts`.

- A card is pointed when hovered, focused from the keyboard (`:focus-visible`) or current
  (`aria-current="true"`, on the entry the spotlight shows, which stays lit like a cursor).
- Its frame turns to -0.6 times its resting tilt (0.34 s), so it leans the other way. The card lifts 6 px
  (0.34 s). Its key slab fades in (0.28 s), grows from 0.9 to 1 and slides 5% right and 2% down (0.34 s).
- Keyboard focus adds a 2 px key outline, 5 px out. A mouse also leans it, under the glare.
- The card itself never scales, and no ring or circle appears.
- Meanwhile the spotlight shows the entry, and the stage behind the whole screen takes its cover or its
  seal colours.

## The spotlight

`Spotlight.astro`, `SpotlightPanel.astro`, `src/scripts/select-screen.ts`.

### The column

- A `section` named « Aperçu » ("Preview"): a grid of the panel (`minmax(0, 1fr)`) over the controls,
  22 px apart. It is a tilt host.
- From 1100 × 640: sticky under the 64 px header (`--header-h`), `calc(100svh - 64px)` tall, pulled up
  44 px to the top of the grid's padding (`margin-top: -44px`), padding 28/14/24/34 px, scrolling on its
  own when its contents overflow, a size container named `spotlight`.
- Below that, it sits in the page flow between the title and the filter bar.

### Three compositions

`SpotlightPanel.astro` draws the sheet's pieces at preview size, in the entry's key.

| Viewport | Layout |
| --- | --- |
| Below 640 px wide | One column: head; the card, `min(52vw, 240px)`, centred; the profile, `min(100% - 24px, 300px)`, centred; the plates. Gaps 22/18 px. |
| From 640 px, and on wide screens under 640 px tall | Head, profile and plates on the left; the card on the right, `min(30vw, 300px)`, centred in height, with a right margin of 14% of its width. Column gap 40 px. |
| From 1100 × 640 | A portrait column filling the spotlight: the head; a stage row (`minmax(0, 116cqi)`) holding the card, `min(75cqh, 76cqw)`, with the profile laid over its lower-left quarter (absolute, left -10 px, its bottom on the card's bottom, `z-index` 3, width `calc((100cqw - card) / 2 + card × 0.25 + 10px - max(0px, (330px - 100cqh) × 0.5))`); the plates in one row. |

- **Head.** The eyebrow shows the card's kicker (« Archétype », « Espèce ») and the status badge. The name
  is a `p`, so the page keeps one `h1`: `clamp(30px, fit, largest)` with fit = min(30, 96 / (0.78 ×
  letters)) cqi of the head, largest 64 px, or `min(76px, 9cqh)` in the portrait column, holding a minimum
  height of 0.93 × largest, aligned to the bottom. Subtitle `clamp(16px, 1.4vw, 20px)`. Stickers 14 px
  down, `clamp(13px, 3.2cqi, 15px)`, padding 7/12/6 px, 10 px apart, shadow 3/4.
- **Card.** Hero size with the slab out and the emblem, shadow 8/9 night .72; its picture settles and pans.
- **Profile.** The caption is visually hidden and there is no info button. The hexagon's ground is filled
  with paper night at 0.88, after the owner's "a black background only to the graph it self"
  (2026-10-28). Labels on paper-night tapes (padding 3/6/2 px, ink `color-mix(in srgb, key 45%, #fff)`,
  `clamp(8px, 4cqi, 12px)`, shadow 2/2 black .5). Grades `min(38px, 12.7cqi)` by `min(36px, 12cqi)`,
  letters `min(22px, 7.4cqi)`.
- **Plates.** Labels 8.5 px, padding 3/6/2 px, overlapping 6 px, 8 px in, on one line; values padding
  8/10/6/8 px, shadow 3/4, text `clamp(12px, 3cqi, 14px)` at 0.04 em; glyph hexagon 20 × 22 px with an
  11 px glyph; gaps 14/8 px. From 1100 × 640 the plates are held to one row (`nowrap`), and the tests
  hold the stickers to one row too: the owner asked for smaller plates "so they always are in only one
  row" (2026-10-28).
- **Ghost.** min(24, 84 / (0.78 × letters)) cqi of the panel, at bottom 0 and right 22 px, inside the
  column.

### Controls

- One row, 12 px apart: previous, open, next, pause.
- Previous and next: 44 px paper-night squares, 1 px `--line2` border, a 26 px gold chevron, shadow 3/4
  night .6; a gold border and a 2 px lift on hover or focus. They are named « Précédent » and « Suivant »
  and stay hidden until the script runs.
- Open: a house-gold plate that takes the rest of the row (`flex: 1 1 auto`), turned -1.5°, `--on-gold`
  ink, Barlow Semi Condensed 700, 15 px, 0.08 em, capitals, « Ouvrir la fiche → » ("Open the entry →"),
  padding 12/18/11 px, shadow 4/5 night .7 growing to 6/8 with a 2 px lift on hover or focus. Its
  accessible name carries the entry: « Ouvrir la fiche : Marchand ». The owner asked on 2026-10-28 that
  the flex row "should have ouvrir la fleche take the entire container".
- Pause: the stage's 38 px square.

### The swap

`src/scripts/select-screen.ts`.

- **Mouse**: pointing at a card schedules a swap after 80 ms, cancelled if the pointer leaves the card
  for anything that is not a card. It is ignored while keyboard focus is inside the spotlight.
- **Keyboard**: focusing a card swaps at once.
- **Touch**: pointing never swaps; a tap opens the link.
- **Arrows**: they step through the entries shown, in roster order, wrapping at the ends, and announce the
  name.
- A swap clones the entry's `template` and waits up to 250 ms for its picture to decode. It then replaces
  the panel with `--arrival` at 0.35, so the arrival replays in about a third of its time; retargets the
  open link's address, label and text; gives the stage the entry's CSS picture and WebGL source (a seal's
  field is painted once and kept); and moves `aria-current`.
- When a filter or the drafts switch hides the current entry, the spotlight moves to the first entry still
  shown in lead order, or empties.

### Lead and reserve

- **Lead order** (`leadOrder` in `src/lib/game/hubs.ts`): entries that are not drafts with a cover, then
  without; drafts with a cover, then without; then by name in the page's language. The first one is
  rendered in the spotlight on the server and sets the stage at load: Marchand on Arbres and Humain on
  Espèces at `a9b3954`. Every entry, the lead included, also waits in a `template` for the swap.
- **Reserve**: the owner asked on 2026-10-28 for "a beautiful layout that doesn't change much between
  things". Every panel carries hidden copies (`visibility: hidden`, `aria-hidden`) so all entries fill the
  same height: the longest subtitle of all the entries, layered under its own; a status badge when it has
  none; the longest sticker list when it has no stickers of its own.

## The arrival

Durations and delays marked "× arrival" are multiplied by `--arrival`. In the table, n counts from 0.

| From (s) | To (s) | Piece | Motion | Curve | File |
| --- | --- | --- | --- | --- | --- |
| 0 | 0.5 | Name | rises 14 px | `--ease`, × arrival | `SheetHead.astro` |
| 0 | 0.55 | Card | lands from 22 px lower, scale 0.965, -5° | `--ease`, × arrival | `FramedCard.astro` |
| 0 | 1 | Cover | settles (sheet 1.17 to 1.1, spotlight 1.12 to 1.06), then pans every 24 s | `cubic-bezier(.4, .02, .28, 1)` | `Banner.astro`, `src/styles/base.css` |
| 0.12 | 0.87 | Slab | swings out from -2°, scale 0.9 and opacity 0, opaque at 35% | `cubic-bezier(0.22, 1, 0.36, 1)`, × arrival | `FramedCard.astro` |
| 0.16 + 0.07 n | + 0.42 | Stickers | slap from scale 1.45 and -6°, with a soft 14/18/18 px shadow of black .35 that hardens | `cubic-bezier(0.2, 1.45, 0.4, 1)`, × arrival | `DescriptorStickers.astro` |
| 0.3 | 1.25 | Profile | unfolds from its centre: the shape's `d` path and the vertex markers start at the centre | `cubic-bezier(0.22, 1, 0.36, 1)`, × arrival | `RankProfile.astro` |
| 0.34 + 0.07 n | + 0.42 | Trait plates | slap from scale 1.35 and -5° | `cubic-bezier(0.2, 1.45, 0.4, 1)`, × arrival | `TraitPlates.astro` |
| 0.5 | 1.0 | Emblem | presses on from opacity 0, scale 1.7 and -22°, opaque at 40% | `cubic-bezier(0.2, 1.35, 0.4, 1)`, × arrival | `FramedCard.astro` |
| 0.95 + 0.05 n | + 0.4 | Six grades | stamp from scale 1.6 and opacity 0; the last lands at 1.6 s | `cubic-bezier(0.2, 1.5, 0.4, 1)`, × arrival | `RankProfile.astro` |
| 0.08 + 0.09 n | + 0.46 | Title plates | slap from scale 1.4 and -6° | `cubic-bezier(0.2, 1.45, 0.4, 1)` | `TitlePlates.astro` |
| 0.04 × min(n, 12) | + 0.5 | Roster cards | deal in from 18 px left and 26 px down, -5°, scale 0.94, never faded | `--ease` | `CoverCard.astro` |

- The spotlight's first entry arrives like the sheet at preview size. A swap replays it at 0.35, so its
  last grade lands at about 0.56 s.
- The profile unfolds only where the browser can animate `d`; elsewhere the shape is drawn in place. The
  owner asked for it on 2026-10-23: "The graph points should all begin at center and slide to the corect
  position creating a smooth animation".
- The slab, the emblem and the six grades start invisible, and the profile's shape starts folded into its
  centre. The name and the picture are visible from the first frame.
- After the arrival: the cover's pan (24 s), the ghost's drift (32 s each way), the living stage, and the
  scroll cue's nudge (2.4 s). The pause button stops the first three.
- Arriving from the select screen, a part that travels gives up the arrival on the part itself, on that visit
  only (`src/scripts/page-sheet.ts`); arrivals inside it stay live, so the emblem, the radar and the grades still
  play. A direct load plays the table above. Back to a list or a hub deals nothing again: what stays fades in over the
  last 220 ms of the flight (`#swup[data-transit-returned]`, `src/styles/transit.css`). The owner's rulings of
  2026-11-01 and 2026-11-02.
- The approved sheet's arrival runs to about 1.6 s. The owner settled on 2026-10-30 that it stays as
  approved, while new pieces keep their arrival under 700 ms.

## Fallbacks

### Without JavaScript

- Every roster card is a plain link. Every draft stays listed, and the drafts switch stays hidden.
- The spotlight shows the lead, rendered on the server. The arrows and the pause button stay hidden, and
  pointing swaps nothing.
- The stage is the CSS ambient or field. `--motion-state: paused` under `(scripting: none)` pauses the
  cover's pan and the ghost's drift (`CharacterHero.astro`, `SelectScreen.astro`).
- The help note still opens: it is a native popover.
- The filter bar is a React island and needs JavaScript to filter.

### Reduced motion

- Every animation and transition runs in 0.001 ms, with no delay and one iteration (`src/styles/base.css`):
  no arrival, deal, slap, settle, pan, drift or nudge.
- No lean, no glare and no counter-slide of the ghost: `src/scripts/tilt.ts` does not bind, and their CSS
  asks for `prefers-reduced-motion: no-preference`.
- The WebGL stage's code is never fetched. The CSS layers are the stage, and a swap still changes them.
- The pause button is hidden. The scroll cue stays, still.

### Forced colours

- Hidden: the slab, the emblem and the glare (`FramedCard.astro`); the ghost name (`GhostName.astro`); the
  stage's halftone (`StageBackdrop.astro`); the seal's halftone and outlined initial (`CoverSeal.astro`);
  the draft veil (`CoverCard.astro`).
- Straightened: the roster card's resting tilt and the draft stamp (`CoverCard.astro`); the title plates
  and the help button, which also lose their shadows (`TitlePlates.astro`); the open link, which loses its
  shadow and gains a 1 px border (`Spotlight.astro`); the results tape and a chosen chip
  (`FilterBar.astro`). The drafts switch draws in `CanvasText` and `Highlight`.
- Unchanged: the stickers and the trait plates keep their tilt, the grades their skew.

### Print

- Both pieces turn `--ink` to `#14100a`, `--ink2` and `--ink3` to `#3a3448`, their gold to `#93701a` and
  `--on-gold` to black (`CharacterHero.astro`, `SelectScreen.astro`). That gold reads at 4.59:1 on white and
  black reads at 4.57:1 on it, so a filled plate holds with background graphics on or off. White text on
  gold does not: a browser printing without backgrounds only greys it.
- The select screen prints on no background, with `data-print-paper` keeping the page behind it white, and
  its group marks lose their black tape and its shadow. The sheet prints on a white ground of its own, since the reading
  below it keeps the page's theme, and sets its words beside a 240 px card, so it fits below the header of
  its first page (`tests/e2e/print.spec.ts`). The profile's inner rings and spokes turn
  `rgba(20, 16, 10, .22)` to read on it.
- Dropped: the stage, the slab, the emblem, the glare, the ghost name, the pause button, the scroll cue,
  the whole spotlight and the help button. A developed picture prints its plain image.
- The sheet's card prints straight and without a shadow (a roster card loses its shadow but keeps its
  resting tilt), the name without its shadow, the title plates straight and without shadows.

## The hub plate menu

`PlateMenu.astro` and `PlateDoor.astro`, with `DoorGlyph.astro`, `src/styles/doors.css` and
`src/scripts/door-light.ts`; the doors come from `codexDoors` in `src/lib/game/hub-doors.ts`, rendered
by `src/components/views/Codex.astro`. It opened Livres too until the contents spread took it on
2026-10-31. It came from Persona 5's pause menu, a stack of commands in cut
letters with the pointed one lit, built in Aubaine's paper (`persona-5.md`). Each section's name is a
door; one door holds the light (`data-lit`) at a time, and the stage behind takes the picture of the
page that door opens.

### Section

- `.au-plate-menu.au-dark`: an inline-size container, isolated, `overflow: clip`, at least
  `calc(100svh - var(--header-h))` tall, on `--bg`, closed by a 1 px `--line2` rule. It is the stage host
  (`data-stage-host`) and the door menu (`data-doors`).
- Inner column: max width 1560 px, padding `clamp(22px, 3.2vh, 40px)` on top, `--pad` on the sides
  (16 px, `clamp(24px, 3vw, 48px)` from 640 px) and `clamp(48px, 7vh, 80px)` below.
- **Stage.** `StageBackdrop.astro` fed by the first door's light. `doors.css` gives every door menu its own
  shade: `radial-gradient(130% 120% at 50% 35%, transparent 30%, night .62 100%)` over
  `linear-gradient(180deg, night .38 0%, night .5 60%, night .86 100%)`.
- **Title.** `TitlePlates.astro` with the hub's name, « Codex », and a help note holding its lead
  (`almanachLead` in `src/lib/i18n/strings.ts`) with no chapter link. It is
  `min(100%, 360px)` wide, `min(100%, 440px)` from 960 px.
- **Doors.** A list, `clamp(14px, 2.4vh, 30px)` under the title, centred in the free height from 640 px,
  at most 56% of the inner width from 960 px.
- **Pause.** The 38 px square, 16 px from the bottom right.

### A door

- **Data.** Each `li` carries `--door-ink` (the kind colour lifted to read on night, `kindInk`),
  `--door-colour` (the mark's own colour) and `--order`; `data-door-art`, the
  128 px WebP of the page's opening picture; `data-door-backdrop`; and `data-door-colours`, the seal
  colours, when the page opens on a seal. The page's opening picture is its lead entry's cover or seal
  (Arbres, Espèces) or its banner (Compétences, Équipement, Matériaux, Règles), so a
  door shows the light of the room it opens.
- **Link.** A grid of the mark beside the name over the line (`'mark name' '. line'`), one column below
  640 px, `'mark name' 'mark line'` from 960 px with no row gap and `0.16 × name` of padding. Gaps
  `8px var(--gap)`, `--gap` `clamp(14px, 1.6vw, 24px)`. Named by its name (`aria-labelledby`) and
  described by its line (`aria-describedby`); a 2 px focus outline in the door's ink, 6 px out.
- **Mark.** A pointy-top hexagon (`50,4 90,27 90,73 50,96 10,73 10,27`), `--mark-size`
  `clamp(40px, 3.7vw, 56px)` wide and 1.08 times as tall, a 4-unit stroke in the door's ink over paper
  night, a 50% pictogram in the door's ink, `drop-shadow(3px 4px 0 night .6)`. Lit, the hexagon fills with
  the ink and the pictogram turns dark (`#14100a`).
- **Name.** Cinzel 700, capitals, line-height 0.86, one paper plate per word (`platesOf` in
  `src/lib/plates.ts`); a word of three letters or fewer in a longer name is a small plate at 0.42 em,
  aligned to the top. Plates turn -1°, 0.7°, -0.5°, 0.9° in a cycle that starts at the door's index;
  padding 0.1/0.2/0.04 em. At rest a plate is paper night `#08070d` with `--ink` (from 960 px `--ink2`)
  and a 0.06/0.07 em offset in the door's ink at 70% (45% from 960 px); lit, it is bone paper `#efe4cc`
  (`PLATE_PAPER`) with `#14100a` ink and a night .72 offset.
- **One size per hub**, fitted from the longest word: `--fit-letters` is 0.8 × its letters + 0.4, and
  the size is `clamp(min(floor, room / fit), min(room / fit, fit-h), cap)`. Below 960 px the floor is
  30 px, the cap 112 px, and the room the content width (less the mark and a gap from 640 px). From 960 px
  the floor is 28 px; the cap is 56 px (`--scene-cap`); the
  room is `(content × 0.54 - mark - gap - 14px) / 1.16`, which reserves the lit growth; and fit-h is
  `(100svh - header - 260px - doors × 25px) / (lines + doors × 0.44)`, where lines counts each door once
  more when its name takes three plates or more. Below 960 px the height sets no limit.
- **Lit, from 960 px.** The name grows 1.16 times from its lower left over 0.24 s on
  `cubic-bezier(0.2, 1.35, 0.4, 1)` and slides 14 px right over 0.24 s on `--ease`. Pointed, it lifts
  4 px over the same 0.24 s on `--ease`; below 960 px, 6 px over 0.34 s on `--ease`.
- **Slab.** Behind a pointed name: the door's colour printed with night .2 dots (1.3 px on a 7 px grid),
  `clip-path: polygon(3% 0, 100% 7%, 97% 100%, 0 90%)`, turned 2.5°, inset `-18% -4% -22% -3%`
  (`-8% -4% -16% -3%` from 960 px). It fades in over 0.28 s, grows from 0.9 and slides 1.5% right and 6%
  down over 0.34 s.
- **Line.** EB Garamond italic, `clamp(18px, 1.6vw, 26px)` and line-height 1.25 (from 960 px
  `clamp(16px, 1.25vw, 20px)`, `0.12 × name` under it, opacity 0.75 rising to 1 when lit), `--ink2`
  turning `--ink` when lit, a `0 1px 2px` night .85 shadow, balanced.
- **Arrival.** The hexagon strikes in from scale 1.3 and the name slaps in from scale 1.35 at -5°, each
  over 0.42 s on `cubic-bezier(0.2, 1.45, 0.4, 1)`, 0.08 s and 0.1 s after load plus 0.03 s per door up to
  the sixth. Nothing starts invisible.

### The scene, from 960 px

Each door draws a scene that shows only while it is lit (`opacity: var(--lit)`), across the whole section
behind the doors, with no pointer events. Below 960 px it is hidden.

- **Band.** 48 px from the top, 56 px from the bottom, 4vw past the right edge, 46vw wide, turned -6°,
  cut to the card slab's quadrilateral (`polygon(16% 0, 100% 5%, 86% 100%, 0 94%)`). Its ground is the
  door's colour mixed into `#0a0912` at 52%, 82% when pointed, under night .4 dots (2.2 px on an 8 px grid)
  masked in from the lower left (225°). Unlit, it waits 6% to the right and slides in over 0.18 s.
- **Pictogram** (`DoorGlyph.astro`). A square `min(60vh, 520px, 36vw)` wide, centred at 78vw and at the
  section's middle, turned 4° (-2° unlit) and at scale 1 (1.12 unlit), over 0.24 s on
  `cubic-bezier(0.2, 1.35, 0.4, 1)`. Four layers masked by the kind's own pictogram: a night `#08070d`
  offset moved 2.7% and 3.1%; a plate in the door's colour moved -1.5% and -1.2%; the face in bone paper;
  and the door's colour at 60% in 1.6 px dots on an 8 px grid, masked to the lower right (135°, from 55% to
  85%).
- Measured on 2026-10-31: every lit name clears its band's bounding box by at least 13.4 px, over 60
  lit states (1024 to 1512 px wide, both languages, each door lit in turn).

### Fallbacks of the plate menu

- **Without JavaScript.** Every door is a plain link, lit by `doors.css` alone
  ([The door contract](#the-door-contract)), and the stage keeps the first door's light.
- **Reduced motion.** No strike, slap or slide; the light and the stage still change.
- **Forced colours.** The slab and the scene are hidden, the plates stand straight without a shadow, and
  focus draws in `CanvasText`.
- **Print.** The stage, the slab, the scene and the pause drop out; plates stand straight on no
  background in dark ink, the hexagons are outlined in dark ink and the lines turn `#3a3448`.
- **Light theme.** `.au-dark` keeps the section a dark stage.

### Measured at the ship

On 2026-10-31, when it shipped on both hubs, they matched the prototype the owner picked to the pixel:
20 captures, both hubs in both languages at 1512 × 860 (at rest and with the second door pointed), 1366 × 657, 1024 × 768
and 390 × 844, with no differing pixel, counted pixel by pixel.

## The Livres contents

`SommaireSpread.astro` and `SommaireEntry.astro`, with `src/styles/doors.css` and
`src/scripts/door-light.ts`; the entries come from `libraryDoors` in `src/lib/game/hub-doors.ts`,
rendered by `src/components/views/Library.astro`. It is the contents page a printed book opens on, laid
on the stage as a bone two-page spread. One entry per book category, in `BOOK_CATEGORIES` order, then
the archives; one entry holds the light (`data-lit`) at a time, and the stage behind takes the picture of
the page that entry opens.

### Section and sheet

- `.au-sommaire.au-dark`: isolated, `overflow: clip`, at least `calc(100svh - var(--header-h))` tall, on
  `--bg`, closed by a 1 px `--line2` rule. It is the stage host (`data-stage-host`) and the door menu
  (`data-doors`). Its style sets `--rows` (half the entries, rounded up), `--fit-word` (`fitLetters` of
  the names with 0.2 em to spare: 0.8 em a letter of the longest word), `--door-paper` (`PLATE_PAPER`,
  bone `#efe4cc`) and `--door-paper-ink` (`DARK_INK`, `#14100a`).
- **Variables.** `--slug` 12 px, `--indent` 44 px, `--mark` 34 px and `--numeral` 96 px; from 640 px
  26 px, 96 px, 42 px and 128 px. `--column` is the list's width, and from 1100 px half of it less 48 px.
- **Inner column.** A flex column as tall as the section, padding `clamp(60px, 8vh, 72px)` on top, so a
  title that wraps stays inside the section; 16 px on the sides; and 70 px below, so the pause square
  never reaches the sheet.
- **Stage.** `StageBackdrop.astro` fed by the first entry's light, under the shade `doors.css` gives
  every door menu.
- **Sheet.** Centred in the free height (`margin: auto`), `min(100%, 1180px)` wide, `min(100%, 760px)`
  from 640 px and `min(100%, 1180px)` from 1100 px. Padding `slug + 64px` on top, `slug + 18px` right,
  `slug + 24px` below and `slug + 28px` left; from 1100 px `slug + 56px`, `slug + 28px` on both sides and
  `slug + 26px`. Ground: a vignette (`radial-gradient(130% 110% at 50% 38%, transparent 58%,
  rgba(70, 50, 20, .1) 100%)`) over a binding shade on the left (`rgba(70, 50, 20, .16)` to `.04` at
  18 px, gone at 40 px) over the paper, in dark ink. Edges and shadow: `1px 1px 0 #e1d4b6`,
  `2px 2px 0 #d2c3a2`, `8px 9px 0` night .72; from 640 px `2px 1px`, `4px 2px` and `16px 18px 0`
  night .78.
- **The spread, from 1100 px.** Each page darkens toward the fold (the left page from
  `rgba(70, 50, 20, .26)` to transparent over 64 px, the right from `.18` over 48 px), and the fold is a
  1 px `rgba(70, 50, 20, .38)` line at 50%, with a 1 px `rgba(255, 251, 240, .55)` highlight 2 px to its
  right.
- **Arrival.** The sheet lays in from 14 px lower and scale 0.985 over 0.46 s on
  `cubic-bezier(0.2, 1.3, 0.4, 1)`, after 0.06 s.
- **Title.** `TitlePlates.astro` with « Livres » and its help note (`hubLead`), over the sheet's top
  edge: `slug + 20px` from its left, `min(100% - 40px, 400px)` wide, lifted 46% of its own height.
- **Running head.** « Sommaire » (`contents`), hidden from assistive technology: Cinzel 700, 13 px,
  0.12 em, capitals, dark ink, over a 1 px `rgba(20, 16, 10, .22)` rule 8 px below, `slug + 10px` above
  the entries. From 1100 px it heads the right page, `calc(50% + 48px)` in.
- **List.** An ordered list (`role="list"`), an inline-size container, its entries
  `clamp(18px, 3vh, 28px)` apart. From 1100 px two columns 96 px apart with no gap between rows, filled
  down the left page then the right (`grid-auto-flow: column`); each row is at least `--row`,
  `clamp(84px, calc((100svh - var(--header-h) - 350px) / var(--rows)), 300px)`, and grows when its entry
  needs more.
- **Pause.** The 38 px square, 16 px from the bottom right.
- It numbers up to eight entries (I to VIII) and refuses to build with more.

### An entry

- **Data.** As a plate door's: `--door-ink`, `--door-colour`, `--order`, `data-door-art`,
  `data-door-backdrop` and `data-door-colours` (`doorContract`). A category's light is its lead item's
  cover or its seal (`categoryStage`); the archives' light is the painting their page opens on
  (`ARCHIVES_ART` in `src/lib/game/library.ts`).
- **Link.** A grid of `--indent` and the rest, on two rows: the numeral and the heading share the first,
  the line takes the second. Centred, a 6 px row gap, 4 px of padding above and below. Named by its name
  (`aria-labelledby`), described by its line (`aria-describedby`); a 2 px focus outline in dark ink, 2 px
  out, which clears the line above where rows have no gap, and
  `scroll-margin-block: calc(var(--sticky-top) + 8px) 16px`.
- **Numeral.** The entry's rank in Roman numerals, Cinzel 700 at `--numeral` (from 1100 px
  `clamp(84px, calc((var(--row) - 40px) / 0.78), 240px)`), line-height 0.74, at the start of the first
  row behind the heading, at least `indent + 0.2em` wide. At rest it is the paper tinted with 24% of the
  entry's colour, with a 1 px relief (`-1px -1px` `rgba(90, 64, 24, .3)`, `1px 1px`
  `rgba(255, 252, 242, .9)`); lit it is the paper, stroked 1.5 px in dark ink, over a `4px 5px 0` black
  .62 shadow.
- **Slab.** Behind a lit numeral: the entry's colour printed with night .2 dots (1.3 px on a 7 px grid),
  `clip-path: polygon(16% 0, 100% 5%, 86% 100%, 0 94%)`, turned 4°, inset `-10% -14% 0 -12%`. It fades
  in over 0.28 s, grows from 0.9 and slides 5% right and 2% down over 0.34 s.
- **Heading.** The name, the leader and the mark on the first row's second column, 10 px apart: the name
  and the leader on their last baseline, the mark centred (12 px and spread apart below 640 px, where the
  leader hides).
- **Name.** Cinzel 700, capitals, line-height 1, balanced, dark ink with a 2 px halo of the paper in
  eight directions so it reads over the numeral. One size per hub: `--name-fit` is
  `(column - indent - mark - 24px) / fit-word` (48 px from 640 px), and the size `min(fit, 28px)`,
  `min(fit, 40px)` from 640 px. It has no floor, so the longest word always fits before its mark: 14.2 px
  on a 320 px screen, 22.7 px on 390 px.
- **Leader.** Dots of 1.1 px on a 6 px grid in the ink, 4 px tall, at least 28 px long, opacity 0.4
  rising to 0.9 when lit.
- **Mark.** A pointy-top hexagon (`50,4 90,27 90,73 50,96 10,73 10,27`), `--mark` wide and 1.14 times as
  tall: an offset in the entry's colour that slides 7 of the hexagon's 100 units right and down when lit
  (2.4 px at the 34 px mark, 2.9 px at 42 px), a face in the entry's colour that fills with dark ink when lit, stroked 3 units in dark ink, and a 52% pictogram in
  dark ink that turns the entry's ink when lit.
- **Line.** EB Garamond italic, `clamp(16px, 1.25vw, 19px)`, line-height 1.25, `#3a3448` turning dark
  ink when lit.
- Every colour change runs 0.2 s on `--ease`.

### Fallbacks of the Livres contents

- **Without JavaScript.** Every entry is a plain link, lit by `doors.css` alone, and the stage keeps the
  first entry's light.
- **Reduced motion.** The sheet does not lay in and the slab does not slide; the pause square hides; the
  light and the stage still change.
- **Forced colours.** The slab and the numerals are hidden, and focus draws in `CanvasText`.
- **Print.** The stage, the slab, the fold and the pause drop out; the sheet loses its paper and its
  shadow, and the title plates sit above the running head. The numerals are outlined 1 px in dark ink,
  and each name keeps a white halo over them. An entry stays whole across a page break
  (`break-inside: avoid`, the numeral at line-height 1 so its ink stays in its box). `data-print-paper`
  on the section turns the page behind it white (`src/styles/base.css`), so the dark ink reads with the
  dark theme and background graphics on.
- **Light theme.** `.au-dark` keeps the section a dark stage.

### The page of an empty category

`EmptyStage.astro`, rendered by `src/components/views/BookCategory.astro` when a category holds nothing:

- `.au-empty-stage.au-dark`: the stage host, `overflow-x: clip`, at least
  `calc(100svh - var(--header-h))` tall, on `--bg`, closed by a 1 px `--line2` rule, its stage in the
  category seal's colours (`categoryStage`).
- **Inner.** A grid of the title over the panel, 28 px apart, at most 1560 px wide, padding 30 px, 16 px
  and 84 px (44 px, 26 px and 110 px from 1100 × 640).
- **Title.** `TitlePlates.astro` with the category's name and its help note.
- **Panel.** Centred in the free height, `min(100%, 40rem)` wide, padding 26 px and 24 px, on `--bg2`
  with a 1 px `--line2` border and an `8px 9px 0` night .72 shadow. It holds the house `EmptyState.astro`
  (an outlined hexagon in `--ink3`, the title in Cinzel 19 px `--ink`, the line in 15.5 px `--ink2`) with
  the category's `empty` title and `emptyCategoryBody`, and the link back to the Livres hub (`allDocs`):
  Barlow Semi Condensed 600, 14 px, 0.08 em, capitals, padding 9 px and 15 px, a 1 px `--line2` border
  that turns `--gold` on hover and focus, with the entries' scroll margin.
- **Pause.** The 38 px square, 16 px from the bottom right.
- **Print.** The stage and the pause drop out; the words turn `#14100a`, `#3a3448` and gold `#93701a` with
  black on it, on no background, and `data-print-paper` keeps the page behind them white.
- The page is `noindex`, has no canonical link and stays out of the sitemap (`src/lib/game/pages.ts`).

### Measured at the ship of the Livres contents

On 2026-10-31, with `pnpm design:audit` (`measuring.md`), over 96 states (both languages, the seven sizes
and 320 × 568, each entry pointed in turn): 0 problems, no sideways scroll, the sheet at least 16 px inside
the screen, the title plates 5.4 px inside the section that clips them, and inside the sheet every numeral
at least 40 px, name 65.4 px, mark and line 30 px from its edges. The empty pages, over 32 states: 0 problems, the title plates
at least 12.8 px and the panel 17 px inside the screen, its words 24 px and its link 27.2 px inside the
panel.

## The door contract

`src/scripts/door-light.ts` and `src/styles/doors.css` light the doors of any menu that follows this
contract: the plate menu, the Livres contents, and the kept layout D (`prototypes.md`).

| Part | Contract |
| --- | --- |
| Menu | `[data-doors]`, also the stage host when the menu has a stage. `data-live` is set while the script drives it. |
| Door | `[data-door]` around one link. `data-lit` marks one door at a time, the menu's cursor: the first in the markup until the script moves it. The script sets `data-pointed` on a door while the pointer or the keyboard focus is on it. |
| Light | `data-door-art` (the WebP ambient), `data-door-backdrop` (its CSS), `data-door-colours` (seal colours joined by `\|`) |
| Focal piece | `[data-door-focus]` inside the door; the script moves `data-stage-focus` to the `data-lit` door's, so the stage's shafts fall on it |
| CSS state | `--lit` and `--pointed`, 0 or 1 on each door, which every piece reads. With or without `data-live`, `data-lit` sets `--lit` and `:active` sets both. With it, `data-pointed` sets both. Without it, `:focus-visible` sets both, and so does `:hover` under `(hover: hover) and (pointer: fine)` while no door holds keyboard focus: focus wins. A door lit by `data-pointed`, `:focus-visible` or `:hover` sets the `data-lit` door's `--lit` to 0; `:active` alone does not. |

- **Pointer.** With JavaScript, pointing a door with a mouse or a pen marks it `data-pointed`, which
  lights it at once. After 80 ms of intent it also takes `data-lit`, which stays when the pointer leaves,
  and the stage swaps to its light. Pointing another door or leaving the doors before the 80 ms cancels
  that, so a door the pointer only crosses never takes `data-lit` or the stage, the same cancel as the
  select screen's ([The swap](#the-swap)).
- **Keyboard.** With JavaScript, focusing a door from the keyboard marks it `data-pointed` and
  `data-lit` and swaps the stage at once. While keyboard focus is in the menu, pointing changes nothing.
- **Press and touch.** `:active` lights a pressed door, with or without JavaScript and for any input,
  touch included. Touch never sets `data-pointed` or moves `data-lit`, and never swaps the stage; a tap
  opens the door.
- **Stage.** A swap waits up to 250 ms for the picture to decode, then sets `--stage-art` and
  `data-stage`; a seal's field is painted once by `paintField` and kept.
- **Lifecycle.** The script binds on load and on every Swup `page:view`, warms the pictures after 600 ms,
  and tears a menu down with an `AbortController` once it leaves the page.
- **Never.** No door is marked `aria-current`: a lit door is a preview, not the current page.

## What only Aubaine has

### The logo and its crest

- `data/media/aubaine-logo.svg`: two concentric pointy-top hexagons in a 100-unit box, the outer
  `50,6 88,28 88,72 50,94 12,72 12,28` filled `#101417`, the inner
  `50,17 78.5,33.5 78.5,66.5 50,83 21.5,66.5 21.5,33.5`, both stroked `#E1C47B` at 2.6.
- The header draws it with `src/components/shell/Logo.astro`: the two hexagons with no fill, stroked
  `#efbe04` at 2.6, 26 px, beside « AUBAINE » in Cinzel 700, 17 px, 0.22 em, `#f6f2e6`
  (`src/components/shell/Masthead.astro`).
- Every seal's crest reuses the same two polygons, stroked in the entry's key around its initial
  (`CoverSeal.astro`).
- The kind label and the group marks use the slightly larger hexagon of the variants,
  `50,4 90,27 90,73 50,96 10,73 10,27`.

### Light and void variants

- `data/media/aubaine-logo-light.svg`: the larger outer hexagon filled `#101417` and stroked `#B08A57` at
  3, an inner hexagon (`50,13 82,31 82,69 50,87 18,69 18,31`) stroked `#5b4a34` at 1.5, and a four-point
  star filled `#E1C47B`.
- `data/media/aubaine-logo-void.svg`: the same hexagons stroked `#9D6FD1` at 3 and `#4a2c6f` at 1.5 over
  `#100a17`, two orbits turned -24° (`#b98fe0`, `#7b4fb0`), and an orb of radius 14 (a radial gradient of
  `#0a0710`, `#3a1f5c` and `#12081e`) ringed `#c9a8f0` round a `#07040d` core.
- Both are owned files (`src/lib/rights/ownership.ts`). No page shows them, and neither has an assigned
  meaning.
- The page loader, `src/components/shell/LoadingCrest.astro`, combines them: the light variant's hexagons
  and star, the void variant's two orbits, 14 sparks in `--gold`, `--accent-ink` and `--accent`, a halo, a
  shock ring and a horizon bloom. `src/scripts/loading.ts` shows it when a Swup visit has not replaced the
  page within 400 ms, spins its hexagons at 130° a second, then plays its collapse, void and burst phases.

### The hexagon

The pointy-top hexagon is Aubaine's mark, drawn wherever a marker, a bullet or a badge is needed, never a
diamond (owner, 2026-10-16).

| Where | Form | File |
| --- | --- | --- |
| The logo and every seal's crest | two concentric hexagons | `data/media/aubaine-logo.svg`, `src/components/shell/Logo.astro`, `CoverSeal.astro` |
| The sheet's kind label | solid, 12 × 13 px, in key | `SheetHead.astro` |
| The select screen's group marks | outlined, 22 × 25 px, gold stroke 7, paper-night fill | `SelectScreen.astro` |
| The rank profile | six rings, and a small hexagon at each vertex of the shape | `RankProfile.astro`, `src/lib/game/profile.ts` |
| Characteristic badges and the trait plates' glyph holders | rounded, `mdi:hexagon` | `CharacteristicHex.astro`, `CoverCard.astro`, `TraitPlates.astro` |
| The hub doors' marks | the Codex: stroked 4 units in the door's ink over paper night; Livres: a face stroked 3 units in dark ink over an offset in the entry's colour | `PlateDoor.astro`, `SommaireEntry.astro` |

The other shapes of the two pieces are rectangles for cards, plates, stickers and tapes; the slab's
quadrilateral; grade plates skewed -10°; and 44 px, 38 px and 28 px squares for the help and step
buttons, the pause button and the profile's info button. Circles appear only as halftone and pattern
dots, as the stage's motes, as the ring of the info glyph (`mdi:information-outline`) and in the drafts
switch, a pill with a round knob. No circle marks focus or selection.

### Kind marks and category marks

- `KIND_MARKS` in `src/lib/game/kind-marks.ts` gives each of the six indexes one colour and one pictogram;
  Compétences, for one, takes `#8a5cc4` and `game-icons:spell-book`. `kindInk` lifts a colour until it
  reads on night. Read the file for the set: `.claude/rules/frontend/kind-marks.md` forbids copying it.
- The owner set the rule on 2026-10-28: "to always reuse the same colors and icons, coherence is the key
  for leanring for users".
- The sheet and the select screen predate the marks: their group marks, title plates and buttons are
  house gold. The plate menu takes each door's hexagon, pictogram and band from them, and the Livres
  contents each entry's hexagon, pictogram, slab and offset.
- `CATEGORY_MARKS`, in the same file, gives each of the four book categories (Livres de
  règles, Ressources, Aventures, Histoires) its colour and pictogram, and `categoryInk` lifts them. The
  owner picked them on 2026-10-30: "For livres des régles let's keep the color and use
  game-icons:book-cover, for ressource keep the color and use game-icons:folded-paper, for aventures
  game-icons:wax-seal and d98a2b and for stories game-icons:quill-ink b9b4d6." The colours kept for the
  first two are the ones in `CATEGORY_MARKS`.
- `ARCHIVES_MARK`, in the same file, marks the archives, the last entry of the Livres contents and of the
  header's Livres menu, and `archivesInk` lifts it. It is the designer's placeholder until the owner picks
  the mark from rendered previews (`rulings.md`, The archives belong to Livres).

### Seals

A seal is an entry's colour identity, shown in place of a missing cover. `CardSeal` in
`src/lib/game/seals.ts` holds a `field`, which fills the seal and every tree card's spine, and the
`colours` that paint the stage of an entry without a cover.

- **Tree**: its first domain colour. With two domains or more, the first two split hard on the 135°
  diagonal (`frame` in `src/lib/game/derive.ts`); with none, `#2a2a2e`. Without a cover, its key is the
  first domain colour lifted until `#14100a` reads on it at 4.5 (`treeSealKey`), or house gold without a
  domain. In the data at `a9b3954`: Mage, field `#3450ff` (Éther), key `#4970ff`; Berserker, field split
  `#9c1527` (Sang) and `#e67e22` (Physique), key `#d44f54`; Artisan, `#2a2a2e`, key house gold.
- **Species**: `--accent` `#8a5cc4` for every coverless species, with a house-gold key. That violet equals
  the Compétences kind colour, while the Espèces kind colour is `#c9563c`; the owner left it as approved
  on 2026-10-30.
- **Book category**: `categorySeal` takes the category's colour, for a book without a cover on its
  category's page, and for the stage of a category with nothing yet (`categoryStage`).

### The rank profile, F to S

A tree's editorial reading on six axes ranked F to S, drawn on the logo's hexagon. It is the team's
reading and changes no rule; there is no overall grade and no difficulty axis (ADR 0054, Decision 3). A
species never has one. Its values are in [The rank profile](#the-rank-profile) above.

### The key colour

Every entry has one key colour, which tints the pieces listed below, so each page takes its own light. On
2026-10-23 the owner asked for the colours "to be changed with the main color of the artwork, red for
nnor, slight gold / beige for marchand".

The first source that applies wins:

1. a `keyColour` the entry writes, species only (Humain `#44a8e7`);
2. the reading of its cover at build time (`src/lib/art-key-colour.ts`);
3. for a tree without a cover, its first domain colour lifted to read (`treeSealKey`);
4. house gold `#efbe04` (`KEY_FALLBACK`): a coverless species that writes none, which at `a9b3954` is
   every coverless species, and a tree without a domain.

The reading, in `src/lib/key-colour.ts`:

- the cover resized to 96 px wide (sharp, in `src/lib/art-key-colour.ts`);
- only pixels with an OKLCH lightness of 0.45 or more and a chroma of 0.025 or more count;
- their hues fall in 10° bins, each bin adds half of each neighbour, and the fullest bin's centre names
  the family;
- pixels within 30° of the family are weighted by lightness to the 4th power, giving a mean hue and a mean
  chroma;
- strength = min(0.18, 11 × mean chroma²); the key is OKLCH(0.92 - 1.5 × strength, strength, hue);
- a cover with no coloured pixel keeps house gold.

Read with the code at `a9b3954` on 2026-10-30: Marchand `#e8bea6`; Nnor `#e8575c` from the cover in use
since 2026-10-29 (ADR 0054 measured `#e85a48` on the earlier cover); Humain's cover `#eaccc8`, overridden
by its written `#44a8e7`. `tests/unit/key-colour.test.ts` holds the rule.

No colour is reserved for the Almanach: blue is an identity colour like any other, as Humain's azure key
and the Règles kind mark `#3f86b8` show (settled with the owner on 2026-10-30).

The key tints the kind label and its hexagon, the stickers, the slab, the double rule, the ghost name, the
emblem's gradient, the seal's crest and initial, the profile and its grades, the booklet button, the focus
outline inside the sheet, the sheet's pause button and profile info button on hover or focus, and a roster
card's focus outline and kicker (mixed with white). These keep their own colours: the trait plates, the
status badges, the characteristic badges, the rules (`--line2`), and the select screen's title plates,
help button, arrows, open link, pause button, Filtres button, results tape and group marks.

## Pictures

- An entry has one 3:4 cover at most, its only picture: on its card, its sheet, the front of a tree's
  booklet and its social image
  (`docs/adr/0053-hero-art-is-developed-on-the-gpu-over-its-plain-picture.md`, Decision 1). The
  owner's one constraint in the brief of 2026-10-23 was to "keep the 3:4 aspect ratio image". ADR 0053
  records the owner's two reasons: the 3:4 generations do not show the smoothing of the 16:9 ones, and
  one picture per entry asks for less generated art.
- On its card and its sheet, an entry without a cover shows its seal, never a placeholder painting.
- No picture or video is made for one page (`rulings.md`, Pictures and materials).
- What another page may reuse:
  - the six 3:4 covers in use, each as the picture of its own entry or book: Marchand, Humain and Nnor,
    the Livre du joueur, the Livre du MJ and the Codex Ornamentum;
  - an emblem, only on the card of the entry that wears it (Marchand, Nnor, Humain;
    `data/media/emblems/colbert.svg` belongs to the Nouvelle-Aubaine banner);
  - the kind and category pictograms, through `KIND_MARKS` and `CATEGORY_MARKS`;
  - the stage, fed by a cover or by colours.
- Reused as they are, framed cards in a grid read as a copy of the indexes: that is how the poster
  wall failed as a hub (`rulings.md`, Hubs). The plate menu builds its focal object from the kind's
  pictogram, paper and the stage's light instead.

## Objects of Aubaine's world

On its Velvet Room menu, Persona 5 subtitles each Persona service with an execution, "Persona Fusion" over
"Guillotine" ([screenshot](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-098.jpg),
viewed 2026-10-30), and Deadlock prints its weapon shop as a catalogue sheet headed "FAIRFAX" and
"ARTILLERY BOUGHT AND SOLD" ([wiki](https://deadlock.wiki/File:Weapon_shop.png), viewed 2026-10-30). A
page of Aubaine may be dressed the same way by an object of its own world. Such an object comes from canon
and from the owner's choice. **None is chosen yet.** Candidates already in the data:

| Object | Where it is |
| --- | --- |
| The quest board on the Livre du joueur cover, « Tableau de quêtes sous la lune » | `data/media/art/livre-du-joueur-3_4-og.png`, captioned in `data/media-captions.json` |
| The forge on the cover of the Codex Ornamentum, the equipment catalogue | `data/media/art/forge-d-izequiel-3_4-og.png`, named in `data/equipment/catalogue.json` |
| The books and booklets themselves | `data/books/`, `data/equipment/catalogue.json`, the tree booklets |
| The heraldry drawn for the Humain sub-species: the Colbert banner (Nouvelle-Aubaine), the imperial flag of the Landenheit, the arms of the Victoria | `data/species/humain.json`, `data/media/emblems/colbert.svg`, `data/media/art/drapeau-du-landenheit-3_2-og.png`, `data/media/arms/` |

Open: whether the Almanach (`data/equipment/items/almanach.json`) may serve as such an object without its
CADRAN screen.

## CADRAN

CADRAN, the Almanach's navy screen with its grid, HUD corners and gold frame, is the Atlas boot's own
direction (`src/scripts/atlas-boot.ts`,
`docs/adr/0044-the-cadran-boot-is-the-atlas-loader-and-its-bar-follows-the-real-load.md`) and never
dresses a site page (`rulings.md`, The direction). « Codex » stays the indexes' name, after the
Almanach's property « Codex. » (`data/equipment/items/almanach.json`).

## Guard tests

| Test | Holds |
| --- | --- |
| `tests/e2e/character-hero.spec.ts` | the reading in both languages; each sheet's key from its own cover or its written colour; the emblem; « ? » grades; the seal for a coverless page; the profile unfolding from its centre; plates keeping their tilt through the arrival; the name and picture visible from the first frame; a dark stage in the light theme; the card first and no sideways scroll at 320 and 390 px; the lean; the pause; Swup visits; print; reduced motion |
| `tests/e2e/select-screen.spec.ts` | pointing and focus; the sticky spotlight; filters and drafts moving the selection; the stage swapping while paused; Swup visits; the named region and one title; print; every entry fitting its spotlight at 1512 x 982, 1366 x 657, 1024 x 768 and 390 x 844 in both languages (nothing clipped, nothing under the profile, the plates in one ink at 4.5 or more, plates and stickers in one row from 1100 px); « ? » grades and no species profile; seals with initials; the phone arrows; the filter dialog; no JavaScript; reduced motion |
| `tests/e2e/roster.spec.ts` | every entry listed by default; a draft stamped once and still a link; no card invisible during the deal; filtering by name; the lean |
| `tests/e2e/hub-stage.spec.ts` | one title and no picture of its own; each entry linked once in the roster and once from the spotlight; the lead in the note with its chapter; the title and its help button kept apart; the pause; Swup visits; the light theme; print; reduced motion never fetching the stage code |
| `tests/e2e/hubs.spec.ts` | On both hubs in both languages: one door per section, each linked once; each door's page named as the door and offering a way on; each door's light equal to its page's opening picture; the header menu listing the doors in their order; the lead in the help note. In both languages: every book category's page answering with its two language alternates; one with entries carrying its canonical; an empty one showing its title, its line and the link back, carrying `noindex`, no canonical, left out of the sitemap, and printed in dark ink on white paper without its stage. On both hubs in English: the first door lit at rest and never marked current; pointing lights a door, moves the stage and leaves it lit; "a door the pointer only crosses never takes the light or the stage" (a second after a door is pointed and left before its 80 ms run out, the first door still holds `data-lit` and the stage the first door's light); "keyboard focus that leaves the doors for a button leaves no door pointed" (Shift+Tab from the first door to the help button clears `data-pointed`, and the first door keeps `data-lit`); "keyboard focus on a button of the menu clears the pointed door and its intent" (a door the pointer points loses `data-pointed` when keyboard focus lands on the help button, and its 80 ms never runs out into `data-lit`); "the keyboard lights the door it focuses at once" (with the page's clock paused, the focused door takes `data-lit` without a timer, and no other door holds it); a client visit binds the doors, and coming back binds them again in the same document. On both hubs in French: doors read in the order they are drawn. At the seven sizes and 320 × 568 in both languages: nothing cut on a Codex door, each door lit in turn from 960 px and the first door lit at rest below (plates on screen and inside the menu, the lit name clear of its band, the pictogram on screen, a missing piece counted as a problem); nothing cut on the Livres contents with each entry lit in turn (the sheet on screen; the title plates on screen and uncut by the section; every numeral, name, mark and line present, and inside the sheet and inside its link on all four sides; no name running into its mark; no entry over another; no focus ring across the line above); and the pause square clear of the sheet. In English: the help button clear of the header when the keyboard reaches it, on Livres, on an empty category, on the Codex, on both indexes and on a category with entries, at four sizes; forced colours hiding the Livres numerals; print outlining them under a white halo round each name, keeping an entry whole, on white paper under the dark theme; on both hubs, the light theme and print |
| `tests/e2e/print.spec.ts` | Under the dark theme, with background graphics on: the select screens and the Codex on white paper with every word readable; a sheet on its white ground with every word readable and its profile's rings kept; the group marks without their tape and the filter count readable; title plates straight and readable; every sheet fitting below the header of its first A4 page |
| `tests/e2e/drafts.spec.ts`, `tests/e2e/scroll-cue.spec.ts`, `tests/e2e/art-effect-fallback.spec.ts`, `tests/e2e/no-javascript.spec.ts`, `tests/e2e/images.spec.ts` | the drafts switch; the cue; the plain picture without WebGL2 or on a software renderer; the markup without JavaScript, the hub doors opening their pages and taking the light from the pointer and the keyboard, and "keyboard focus keeps the light while the pointer hovers another door" (one door lit, the focused one); picture widths |
| `tests/unit/key-colour.test.ts`, `tests/unit/profile.test.ts`, `tests/unit/hubs.test.ts`, `tests/unit/character-sheet.test.ts`, `tests/unit/character-hero.test.ts`, `tests/unit/emblem-frame.test.ts` | the key colour and its lift; the profile's geometry; lead order and fields; the sheet model; the lean; emblem framing |

## Records that disagree with the code

- ADR 0054, Decision 1, says the arrival stays "under 700 milliseconds, transforms and opacity, and nothing
  that matters starts invisible". At `a9b3954` it runs to about 1.6 s, animates the profile's `d` path and
  keeps the six grades invisible until they stamp. The owner settled on 2026-10-30 that the sheet stays
  as approved.
- ADR 0054 names `src/scripts/character-hero.ts` for the lean (Decision 1) and for the pause (its summary
  table). No such file exists at `a9b3954`: the lean is `src/scripts/tilt.ts`, mounted by
  `src/scripts/stage-host.ts`, and the pause is `src/scripts/stillness.ts`, as the 2026-10-25 addendum to
  Decision 4 says.
- ADR 0054, Decision 1, gives each trait plate "the one with the stronger contrast" of a dark or a light
  ink (`inkOn`). At `a9b3954` every plate takes `#14100a` on a paper lifted until it reads at 4.5
  (`readableOnNight`), and `inkOn` does not exist.
- ADR 0054 records Nnor's key as `#e85a48`, read from the earlier cover. The cover in use since 2026-10-29
  reads `#e8575c`.
