# ADR: A sub-species may fly its heraldry as cloth or bear it as enamelled arms, and a painting hangs under glass

**Project:** Aubaine, the wiki
**Status:** Proposed
**Date:** 2026-10-26
**Deciders:** Kori
**Scope:** The heraldry a sub-species may carry (a banner beside its text that stirs in a light wind and the reader can swing, a
flag that flies across the reading column, arms of enamel and gold beside the text), how each is drawn
on the shared WebGL2 context of 0053 and 0054, the one preference that pauses every moving decoration,
the `glazed` look of a lore picture, the `3_2` ratio in `data/media/art/`, a key colour a species
writes for itself, the third party textures and heraldic charges these pieces are made with, and the
note a picture may open from its caption rule. Amends 0053 Decision 2, 0054 Decisions 1 and 4, and
0009 Decision 1. Leaves 0048 intact: every image still loads eagerly, the arms' still included. Does
not cover the torch, drift and lift reliefs, nor the Atlas (0041).

---

## Context

The owner asked for the Humain species to wear three pieces: the banner of the Colbert, the royal
house of the Nouvelle-Aubaine, azure with a golden emblem, that the reader can take and swing; the
imperial flag of the Landenheit, flying; and a painting in its lore, « Les Naufragés de la Venue »,
in a gilded frame under glass. The owner wrote « webgl / threejs ». A first build, dated 2026-10-25,
was refused as looking generated: the banner floated in the empty column right of the text, the flag
flapped on a steel pole in a box with dead space around it, and the painting sat in three CSS
gradient rings under a smoky diagonal band, specks and a wobbling refraction. The owner then asked
for the banner as a column left of its paragraph, the flag across the column like the Nnor pictures
with no pole, professional finish throughout, and free assets credited on the credits page. On the
remake, the owner asked for an effect on the frame itself rather than a still picture, a softer gold
on the banner, and a new hanger in place of the drawn rod, cords and tassels; then for a more vibrant
gold, the softened one reading dark and dusty. Versions,
read from `pnpm-lock.yaml`: `astro@7.3.3`, `@playwright/test@1.63.0`, `sharp@0.35.4`, `three@0.186.1`.

The same day the owner asked for the arms of the Victoria beside the Victoria text, from a shield they
composed in Armoria (`data/media/arms/victoria-armoria.png`, whose PNG carries Armoria's recipe in
an `iTXt` chunk), « optimized performant webgl / threejs » at « professional quality grade », and for a
small round « ? » at the far right of a picture's caption rule that opens a note, here the blazon in
French and English. Asked, the owner chose enamel on gilt metal, the note on the caption rule, and the
page's language only, and left the choice of the book to this session as long as WappenWiki and
Armoria are credited. On the live page the owner then chose a royal violet enamel among four, asked
for less gloss, then found the light and the gloss « unbearable », then asked for it slightly
brighter and to lean on hover like the hero's card, then found it blurry. On 2026-10-27 the owner
found the arms still « like clay », « blurry », « like old 3D games from 1980 », and asked for
« Triple A » quality « matching our stylised fantasy artistic direction », « extremly well
optimized », allowing « shaders, webgl, threejs, anything ». Asked, the owner chose a translucent
jewel enamel and the exact composition, with only the rim made a stepped bezel. Decisions 7 to 9
record where that ended. On 2026-10-29 the owner, having read every piece on the live pages:
« I've checked everything on the front so it should be fine ».

On 2026-11-03 the owner asked for the Colbert banner's yellow to be more vibrant, to match the art
direction, and for a continuous wind that moves it slightly. Asked, the owner chose its pause at the
right end of its caption rule and the gold change on the cloth only, the baked hanger keeping its
gilt. A first build took the charge flat into the gilt and was refused as yellow paint rather than
metal; the shading of Decision 2 stayed and only the charge changed. The owner then asked for a
slightly stronger wind, and for the flag's pause to be the same small round button instead of the
square over the flag. Decision 10 records where that ended.

---

## Decision 1: A sub-species may carry one piece of heraldry, a banner or arms beside its text, or a flag across the column

### Decision

- `subspecies[].heraldry`, optional, is a discriminated union on `kind` in `src/lib/game/schema.ts`:
  `banner` with `name`, `emblem`, `field` and `charge`, `flag` with `name` and `picture`, or `arms`
  with `name`, `blazon` and `arms`. `field` and `charge` are six digit lowercase hex. The banner's
  `emblem` is a framed white SVG in `data/media/emblems/` and counts as worn there; the flag's
  `picture` is a `3_2` file in `data/media/art/`; the arms' `arms` is a composition in
  `data/media/arms/` (Decision 9). `tests/data/integrity.test.ts` checks all three.
- The English overlay may translate `heraldry.name`, and `heraldry.blazon` on arms.
  `src/lib/game/build.ts` merges it into the piece instead of replacing the piece, and fails the build
  when an overlay names a key its piece does not carry.
- `HERALDRY_PLACEMENT` in `src/lib/game/derive.ts` records, for every kind, whether the piece stands
  `beside` its text (banner, arms) or `across` the column (flag). `Species.astro` reads it, and
  `Heraldry.astro` throws on a kind it cannot draw, so a new kind has to be placed and drawn.
- `src/components/primitives/Heraldry.astro` renders a `figure` named by its `figcaption`, with the
  class `au-prose__picture`, so its caption is the same Garamond italic and gold rule as every lore
  picture. The drawing is `aria-hidden`.
- A piece beside its text: `src/components/views/Species.astro` puts the heading across, then a two
  column row, the piece in `clamp(7.5rem, 26%, 12rem)` and the paragraph beside it, its first line
  level with the piece's top. Below 30rem the row becomes one column and the banner stands centred above the
  paragraph at 9rem. The names below stay across the full width.
- A flag: the figure spans the reading column. Its box is the picture's own ratio plus a headroom of
  `FLAG.headroom` (4.5 %) above and below, so the fly end can ripple without touching the caption; the
  plain picture fills the 3:2 part, flush with the column, and there is no pole. Its pause is the
  round button at the right end of its caption rule (Decision 10).

### Rationale

- The owner's request, both layouts.
- Colours are hex on the piece: `.claude/rules/content/vocabularies.md` forbids hard coding a
  vocabulary, and a tincture list for two colours would be one.
- `tests/e2e/heraldry.spec.ts` measures, at 320, 390, 480, 768, 1216 and 1440 pixels and for every
  kind placed beside its text, that nothing scrolls sideways, that no line of text runs under the
  piece, that from 30rem the piece ends left of the paragraph's text with its top within one rem of
  the first line, and that below it the piece ends above the paragraph. It also measures the flag figure as wide as the `.au-prose` column, with
  no fixture inside.

### Alternatives considered

- **The banner floated beside the text, or in the empty column right of it**: the first build; the
  owner asked for a column. Rejected.
- **Two columns at every width**: the paragraph would fall to about 25 to 30 characters a line at 320
  to 390 pixels. Rejected by the owner.
- **A flag on a pole in a wider box**: the first build; dead space beside a picture that every other
  lore page shows flush. Rejected.
- **Heraldic tinctures as a vocabulary in `data/meta/`**: a vocabulary for two values. Rejected.
  Reopens if several houses share a palette.

---

## Decision 2: The banner is a cloth simulated on the CPU and smoothed on the GPU; the flag is a wave on the GPU; three.js never ships

### Decision

- `src/lib/art-effect/cloth.ts` keeps the banner's position based dynamics on a 10 by 21 grid
  (`BANNER_CLOTH` in `src/lib/art-effect/presets.ts`): structural, shear and bend links, a tether per
  point to its pin, air per triangle, a damped spring on the point the reader holds, and a pleated
  rod row. The pinned hoist the first build's flag needed is gone; since 2026-11-03 a light wind
  blows through the banner (Decision 10). `settle` brings it to rest for a still frame.
- `src/scripts/art-effect/banners.ts` and `loom.ts` draw it: the grid's positions go to an RGBA32F
  texture each frame, and a mesh four times finer reads them with Catmull-Rom splines in
  `glsl/cloth.vert`, so folds and normals are smooth. `glsl/cloth.frag` shades the field as velvet
  (Charlie sheen, after Estevez and Kulla, "Production Friendly Microfacet Sheen BRDF", 2017, wrapped
  diffuse and the scanned pile of Decision 6) with hanging folds, and the goldwork as a saturated
  gold: the charge mixed toward a gold reflectance, a roughness of 0.3, reflections that take the
  room's brightness and not its colour, a grazing white held to a fifth, and highlights compressed as
  a whole so they stay gold. One detail texture, composed once in 2D canvas from
  `bannerOutline`, `bannerFringe` and the emblem's own paths, holds the metal mask and a relief:
  padded emblem with couched threads, a braided galloon, a bullion fringe. The back shows a lining.
- The hanger, a wooden pole with gilt finials and a twisted cord to a ring, is one picture baked from
  a 3D model (Decision 6) and laid over the canvas the same in every mode, since the banner's light
  never moves. The plain SVG banner under it matches the drawn one.
- `src/scripts/art-effect/flags.ts` draws the flag with no simulation: `glsl/flag-wave.glsl`, shared by
  `flag.vert` and `flag.frag`, sums three travelling waves that grow from the hoist to the fly under a
  slow gust, mostly in depth, with a slight draw-in at the fly and a perspective that ripples the
  outline. Normals come from the analytic derivatives per fragment. A linen hoist heading with a
  stitched seam and two brass grommets, whose holes let the page through, finishes the hoist.
- Both render into a 4x multisampled layer resolved into the studio's drawing buffer
  (`createLayer`, `resolveLayer` in `src/scripts/art-effect/gl.ts`). The flag draws at
  `tier.cloth.perSecond`, 30 on ultra and 24 on high, within `tier.cloth.budget`, now 2,200,000 and
  1,000,000 pixels so it stays as sharp as its plain picture; the low tier keeps the plain pieces.
- `boot.ts` fetches `banners`, `flags` and `glazes` only on a page that has one. Composing the banner
  and settling its cloth yield to the event loop every 128 rows and every quarter second of
  simulation.
- The room's levels upload as sub-rectangles of one image (`UNPACK_SKIP_ROWS`), and every full screen
  pass reads its triangle from attribute 0 (`fill.vert`, `draw` in `gl.ts`).

### Rationale

- One context per page stays 0053's rule; `tests/e2e/heraldry.spec.ts` counts one WebGL2 context with
  the stage, the banner, the flag and the glass all drawn.
- A wave fills the column the way the owner asked; a simulated flag needs room to fly into.
- Measured in Node 22 under Vitest on an Apple M5: the banner rests 2.8 seconds after arriving and
  3.8 seconds after a hard fling, and takes 0.10 ms a step, 12 ms of CPU for each second it moves.
  `tests/unit/cloth.test.ts` holds pins, rest within five seconds, the box, stretch under 10 %, a still
  frame within its time, finite values; `tests/unit/mesh.test.ts` holds the grid.
- Measured with Playwright's Chromium on an Apple M5 (macOS 26.3.1), 1440 by 900 at a pixel ratio of
  2, five runs, against a static build served from disk:

  | Case | Measured |
  | --- | --- |
  | Humain LCP | 84 ms median of seven (64 to 232, the first one cold) |
  | Frame interval p95, flag flying | 16.7 to 16.8 ms, no long animation frame |
  | Frame interval p95, banner dragged | 16.7 to 16.8 ms, one long animation frame a run, 51 to 72 ms, no script in it |
  | Frame interval p95, pointer sweeping the painting | 16.7 to 16.8 ms, one long animation frame of 51 to 58 ms in four runs, none in the fifth |
  | First appearance, banner then flag | no long animation frame in three runs, 51 to 56 ms in the first two |

  Before the composition yielded, the banner's first appearance cost one frame of 77 to 109 ms.
- From the build's `_astro`, `gzip -9`: `banners` 21,610 bytes (8,696 gzipped), `flags` 11,094 (4,400),
  `glazes` 8,405 (3,602), the shared `textures` loader 4,679 (2,021), `studio` 33,125 (11,497), the
  shell 51,991 (18,266).
- Playwright's Firefox (renderer « Apple M1, or similar ») and WebKit draw the banner, the flag and the
  painting, and Firefox reports no WebGL warning on the Humain page. Before the two fixes above it
  reported four failed uploads, which left the room black, and an emulated attribute 0.

### Alternatives considered

- **three.js at run time**: it ships in the 762,451 byte `atlas-engine` chunk that 0053 and 0054
  already refused for a content page. Rejected again; three.js only bakes the frame and the hanger
  (Decision 6).
  Reopens if a content page needs a scene graph.
- **The simulated flag of the first build**: needs a pole and a box larger than the picture.
  Rejected.
- **Normals from the coarse grid**: the first build; faceted folds. Rejected.
- **A context per piece**: against the one context of 0053. Rejected. Reopens if copying out of the
  shared context measures too slow in WebKit.
- **The drawn SVG rod, cords and tassels**: the first remake; read as 1970s computer graphics to the
  owner. Rejected.

### Caveats

- Timings were measured in Chromium only, and nothing was checked on Windows or a phone. Where an
  AVIF relief fails to decode, the flag and the banner keep their plain forms.
- The long frame at the start of a drag is rendering work with no script attached, as in the first
  build; it was not traced further.
- Dragging the banner has no keyboard equivalent, by the precedent of the hero's tilt: the piece is a
  decoration, and what it says is its caption.

---

## Decision 3: One preference pauses every moving decoration, and reduced motion draws still frames

### Decision

- `src/scripts/stillness.ts` owns the reader's choice, still under the key `aubaine.stage`:
  `isStill`, `setStill`, which announces the change on `window`, and `bindStillToggle`. The hero's
  button and the round buttons of the banner and the flag (Decision 10) all drive it, and each shows
  the others' change. The heraldry's buttons ship `hidden` and appear once their cloth has taken over.
- Under reduced motion the banner and the flag draw one still frame each, the banner settled and not
  draggable, and no pause button appears.

### Rationale

- WCAG 2.2.2 asks that moving content running over five seconds can be paused; the flag flies for as
  long as it is on screen, and since 2026-11-03 the banner stirs as long too, so it carries the same
  pause (Decision 10).
- The spec checks that the flag's button and the banner's pause by keyboard, stay paused on the next
  page, and that the hero's button stills both; and that under reduced motion neither piece redraws,
  even when dragged.

### Alternatives considered

- **A second key for the flag**: two switches for one wish. Rejected.
- **The plain pieces under reduced motion**: the first build; the motion was the concern, not the
  drawing. Rejected.

---

## Decision 4: A painting is glazed: a scanned gilt frame that catches the light, recessed under glass

### Decision

- `glazed` (`GLAZED_PICTURE` in `src/lib/game/book-markup.ts`) is a picture's only title word. The
  picture is wrapped as `span.au-prose__frame > span.au-prose__moulding >
  span.au-prose__relief[data-relief="glass"] > img`, the frame carrying `--au-frame-slice` and
  `--au-frame-share` from `FRAME` in `src/lib/art-effect/presets.ts`.
- `src/styles/prose.css` draws the moulding as a `border-image` of the lit frame of Decision 6,
  stretched, its width `FRAME`'s share of the frame's own width in container units, with a wall
  shadow and a rabbet shadow on the painting. This is the frame without WebGL2 and in print.
- `src/scripts/art-effect/glazes.ts` draws the whole frame on the studio's context with
  `glsl/glazed.frag`, sliced like the border image. The moulding is shaded from two maps baked with
  it, its gilding (albedo and roughness) and its relief (normals), in the room of Decision 6: GGX image
  based lighting with Karis's analytic environment BRDF, multiple scattering after Fdez-Agüera ("A
  Multiple-Scattering Microfacet Model for Real-Time Image-based Lighting", 2019), a metalness of
  `FRAME.metalness` scaled by the scan's map as three.js reads it, and the Khronos PBR Neutral tone
  mapper. The eye follows a fine pointer or, without one, the scroll, so the gilding's highlights move
  along the beads and the rope. The painting sits 1.2 % of the frame's height behind the lip, shifts
  with the eye, and shows the rabbet wall it uncovers. The glass reflects the same room by Schlick's
  Fresnel, desaturated and rolled off, with low frequency smudges in the reflection only. Under
  reduced motion it draws once.
- `data/media/art/` accepts `3_2`.

### Rationale

- The owner's requests: « a golden frame and a glass effect », then an effect on the frame itself.
- At rest the live frame matches the still one: the room's yaw (π + 0.15 in the shader's own
  convention) was fitted against the baked frame by pixel error, and over the top left corner the live
  frame averages 128/108/74 in sRGB against 131/110/76 for the bake. Compared at three times zoom,
  the beads, the rope and the corner blocks of the two line up.
- The painting and the flag are 1536 by 1024, measured with `sips`: exactly 3:2.
- `tests/unit/prose-picture-masks.test.ts` holds the nesting and the frame's properties;
  `tests/e2e/no-javascript.spec.ts` checks the border image without JavaScript; the heraldry spec
  checks that the gilding changes under the pointer, that the glass settles, and that under reduced
  motion it holds still.

### Alternatives considered

- **Three CSS gradient rings**: the first build; read as drawn. Rejected.
- **The still frame with glass only**: the first remake; the owner asked for an effect on the frame.
  Rejected.
- **A 3D tilt of the framed painting**: offered beside the living gilt; the owner chose the gilt.
  Rejected.
- **Fancy Picture Frame 02**: a carved portrait frame whose centre ornaments a stretched border image
  would distort, for a landscape painting. Rejected.
- **A glare band and refraction**: the first build. Rejected.

### Caveats

- The frame's side members are compressed about 9 % against its top and bottom, since the scan is
  603 by 464 mm and the painting 3:2.
- The live frame and the still one differ by a few percent in brightness and in where the glints sit;
  the hand-off between them is instant.
- No mask file exists at `3_2`: a mask key on a 3:2 picture would fall back to the 3:4 file, and no test
  checks that a mask file exists for each key and ratio.

---

## Decision 5: A species may write its own key colour

### Decision

- `keyColour`, optional on a species, is a six digit lowercase hex. `CharacterHero.astro` takes it
  before the colour read from the cover.
- `tests/unit/key-colour.test.ts` holds every authored key colour to a contrast of 4.5 with the dark
  sticker ink, and `tests/e2e/character-hero.spec.ts` checks that the hero wears it.
- Humain writes `#44a8e7`, which the owner chose among four azure swatches rendered on the stage.

### Rationale

- 0054 Decision 1 rejected « an authored colour per entry » and wrote that it reopens « if a cover's
  key colour misreads the art ». The Sculptor cover reads `#eaccc8`, counted with `oklchOf`; the owner
  wants azure.
- `#44a8e7` reads at 7.2 with the dark ink, computed with `contrastOf` in `src/lib/key-colour.ts`.

### Alternatives considered

- **Retuning the key colour rule**: it would move the Nnor red and the Marchand beige to fit one
  cover. Rejected.
- **Grading the cover toward blue**: edits the owner's picture. Rejected.

---

## Decision 6: The pieces are made with CC0 works from Poly Haven, credited on the credits page

### Decision

- `data/media/textures/` is a foreign directory (`FOREIGN_DIRECTORIES` in
  `src/lib/rights/ownership.ts`), never stamped. `TEXTURE_WORKS` in `src/lib/rights/attribution.ts`
  names each work, its authors as Poly Haven gives them, its page, CC0 1.0, and its cuts: Fancy
  Picture Frame 01, Rough Linen, Velour Velvet, Dark Wood and the Combination Room HDRI.
- `pnpm media:textures` (`tools/media/textures.ts`) makes every file from originals in
  `tmp/textures/`: the HDRI decoded from Radiance into four levels of the room (sharp, then cosine
  powers 48, 8 and 1), packed RGBM on square roots in lossless WebP; each fabric's displacement map
  tiled and encoded as AVIF; the frame's glTF rendered front on with three.js in Chromium, lit by the
  same room, its backboard dropped, measured against `FRAME`'s slice and retouched over a chip of bare
  gesso in one corner, in three passes (lit, gilding with roughness, relief); and the banner's hanger
  modelled and rendered in the same room, its pole in the Dark Wood scan. Both bakes scale the room as
  the shipped levels do and expose it by `FRAME.exposure`. The browser turns the fabric reliefs into
  normal maps once.
- The credits page renders a Textures table from `TEXTURE_WORKS`; `docs/third-party-assets.md` says how
  to add one.

### Rationale

- polyhaven.com/license: every asset, HDRIs, textures and models, is CC0, and credit is not required.
  The site credits every file it did not make (third-party-assets). The owner kept « Textures » as
  the heading of their table, though one work is a model and one an HDRI.
- Sizes, from `data/media/textures/`: the room 71,316 bytes, the lit frame 154,552, its gilding 83,530
  and relief 54,991, the linen 131,932, the velvet 20,932, the hanger 20,406; 537,659 in all, each
  fetched only by the piece that shows it, which the heraldry spec checks on a page without them.
- `tests/data/integrity.test.ts` fails when a texture on disk is credited by no cut or a credited file
  is missing, and holds every sound and texture to CC0 as the credits page says; `tests/e2e/policies.spec.ts`
  checks that the page links every work.

### Alternatives considered

- **Procedural weave and gold only**: the first build; read as generated. Rejected.
- **Normal maps instead of displacement for the fabrics**: four channels where one serves, and lossy
  colour subsampling bends normals. Rejected. The frame's relief is a normal map because its bevels
  come from the model, which a height map would not carry; it is AVIF without chroma subsampling.
- **The frame's maps at full size and lossless**: 399 KB and 871 KB. Rejected for 1200 pixel AVIF.

---

## Decision 7: Arms are an Armoria composition sculpted into maps, shaded as burnished gold and translucent enamel on the shared context

### Decision

- The arms of a sub-species are one SVG in `data/media/arms/` (Decision 9). `pnpm media:arms`
  (`tools/media/arms.ts`) rasterises its layers with `sharp` at three times the map size (the shield,
  the sable division, the charges' silhouettes, their drawn lines), sculpts a height field in Node
  with the pure helpers of `src/lib/art-effect/relief.ts`, and writes three maps of 768 pixels by 893
  (`ARMS_MAP_SIZE`), AVIF without chroma subsampling:
  - colour, with the shield's coverage as its only alpha (quality 72);
  - relief, opaque: the normal's two horizontal components and the surface's convexity (quality 72);
  - finish, opaque: metal, occlusion, and the soft shadow each raised part casts under the key light,
    traced along `ARMS.key` by `shadowOf` (quality 60).
- The sculpt inflates each charge instead of bevelling it. `inflate` solves ∇²u = -1 inside the charge
  with u = 0 on its outline, by multigrid V-cycles of red-black Gauss-Seidel whose coarse cells are kept
  only where all four finer cells are inside, and takes the radius √(2u): a strip gets a circular
  section as wide as itself, after Johnston, "Lumo: Illumination for Cel Animation", 2002, and Sýkora
  et al., "Ink-and-Ray: Bas-Relief Meshes for Adding Global Illumination Effects to Hand-Drawn
  Characters", 2014. `basRelief` compresses the radius toward a plateau, so a thin limb is round and the
  book is flat with a rolled edge. A second solve takes WappenWiki's drawn lines as outlines too, so
  each lock, feather, ray and panel swells on its own, and the lines are then cut as V grooves as wide
  as the drawn stroke, faded near the outline (`engravingDepth`).
- The rim is a stepped bezel (`bezelHeight`: a rolled edge, a flat band, a chamfer, a bead), the
  partitions are half-round wires (`wireHeight`), and the enamel sits below the metal with a meniscus,
  under a slight horizontal dome. `curvatureOf` reads convexity from the height blurred over 0.2 units,
  and `occlusionOf` sums a contact and a broad scale. Every height and reach is in `ARMS.relief`
  (`src/lib/art-effect/presets.ts`).
- The enamel pools against the metal: `armsSurface` returns how near each enamel point is to a wall,
  and the bake raises the tincture, in linear light, to an optical depth from 0.9 in the open to 1.5
  against the walls (`ARMS.enamelDepth`), into the colour map.
- The page draws them with `glsl/arms.frag` through `src/scripts/art-effect/arms.ts`, fetched only on a
  page with arms (`boot.ts`), with the uniforms of `ARMS_UNIFORMS`, which the bake sets as well.
  - The shader rebuilds the normal from its horizontal components. Every roughness is widened by the screen-space
    variance of the normal (Tokuyoshi and Kaplanyan, "Improved Geometric Specular Antialiasing",
    2019), so crisp edges do not sparkle.
  - The gold is a burnished metal: the energy a white metal takes from the room (`litByRoom`, weighted
    0.68) and from the key light in a sharp lobe and a broad one (roughness 0.45), at a roughness of
    0.4, 0.2 on convex edges, which also brighten by up to a quarter, and 0.6 in crevices, which darken
    to 0.45. `ARMS.gold` colours that energy from a deep gold in shadow toward a paler gold in light,
    rolled off without losing its hue from 0.62.
  - The enamel is its pooled tincture lit by the room and the key light, darkened by the baked
    occlusion and shadow, under a clear coat of 4 % facing and 8 % grazing that carries a satin sheen
    (roughness 0.55) and one small key glint (0.3), both compressed.
  - The exposure is 1.06, and the maps are sampled with a level of detail bias of -0.5.
- The eye follows a fine pointer or, without one, the scroll, and settles, through
  `src/scripts/art-effect/eye.ts`, shared with the glazed frame. A hovering mouse leans the shield by up
  to 6.3 degrees, through `src/scripts/tilt.ts`, shared with the hero's card. The eye sways 0.75 of the
  way to the pointer, over a dome of 5 units. Reduced motion draws once and neither follows nor leans.
- The plain form is a still of 576 by 670 (`ARMS_SIZE`), WebP at quality 88, rendered at the rest eye by
  the same shader source (`fragmentSource` in `src/lib/art-effect/shader-source.ts`, shared with
  `gl.ts`) in Chromium on SwiftShader (`tools/media/browser-bake.ts`, shared with
  `pnpm media:textures`). It is what readers see without JavaScript or WebGL2, on a software renderer
  and in print.

### Rationale

- The owner's corrections on the live page, in order: royal violet `#5a2378` among four baked enamels;
  less gloss; the light and the gloss « unbearable » (exposure 1.2 to 0.85, a full Fresnel coat brought
  to 8 % grazing, the eye's sway 0.9 to 0.5); slightly brighter; the card's lean on hover; blurry; «
  some realistic lighting but without being too blinding » (a key light); « more realistic » but « not
  that glossy » (realism moved from reflection to light and shadow). Then, on 2026-10-27, clay and
  blurry, which this build answers, with the owner's two answers: a translucent jewel enamel, and the
  exact composition with only the rim made a stepped bezel.
- What read as clay, found in the 2026-10-26 build: a rounded shoulder 1.6 units wide on every charge,
  so any limb narrower than 3.2 units was all bevel, under a swell; satin gold (roughness 0.42 to 0.65)
  that took only the room's brightness from its blurred levels, nearly even across a form, so the value
  hardly changed across the lion; a flat enamel; a single half-round rim. What read as blurry: its 576
  pixel normals at AVIF quality 72 showed block seams inside the lion's body at three times zoom, and a
  576 pixel map at a 384 pixel canvas blends its 288 pixel level.
- 768 pixels puts the map's first level exactly at the 384 pixel canvas of a 192 pixel shield at a pixel
  ratio of 2. Rendered off the page with the same shader, the bias changes nothing at that ratio, and
  raises the mean square of the Laplacian from 3,041 to 4,370 at a ratio of 1.5 and from 1,387 to
  1,723 at 3, so it stays.
- Measured with Playwright's Chromium (`channel: 'chromium'`, ANGLE on Metal, Apple M5, macOS 26.3.1),
  1440 by 900, on the built Humain page, the 2026-10-26 build and this one served from one origin, at
  rest and with the pointer at the far left and the far right of the window, by one script reading the
  canvas (gold and violet picked by OKLCH hue):

  | Measure | 2026-10-26 build | This build |
  | --- | --- | --- |
  | Mean luminance, rest, left, right | 75.4, 74.2, 82.6 | 72.1, 71.0, 79.0 |
  | Swing across the three | 8.4 | 8.1 |
  | Brightest percent | 213 to 214 | 218 to 221 |
  | Gold, median OKLCH chroma and hue | 0.103, 80 | 0.112, 81 |
  | Gold luminance, 10th, 50th and 90th percentiles | 96, 162, 209 | 90, 161, 205 |
  | Violet, median luminance | 40 | 43 |
  | Mean square of the Laplacian, pixel ratio 2 and 1 | 1,651 and 3,652 | 3,186 and 5,787 |
  | First live frame against the still, ratio 2 and 1 | 2.58 and 3.77 | 3.51 and 4.70 |
  | Frame interval p95, fifteen pointer sweeps | 16.7 ms | 16.7 to 16.8 ms |
  | Long animation frames during the sweeps, ratio 2 | none in seven runs | none in four runs |
  | Long animation frames during the sweeps, ratio 1 | 693 and 385 ms in one run of seven | 142 ms in one run of four |

  The brightest percent is thin edge highlights, a pale gold, never white. Humain's LCP, the cover in
  the hero, had a median of 76 and 68 ms over two batches of five runs before, and 76 and 76 ms after.
- The encoding: against the same normals written lossless, over the shield, the relief map measures

  | Relief map | Bytes | Mean angular error | p99 |
  | --- | --- | --- | --- |
  | AVIF quality 72 | 63,547 | 1.02° | 10.1° |
  | AVIF quality 80 | 76,722 | 0.87° | 8.2° |
  | AVIF quality 95 | 141,787 | 0.46° | 2.8° |
  | AVIF lossless | 303,165 | 0 | 0 |

  and, drawn on the M5 with the shipped maps and with lossless ones, the shield differs by a mean of
  1.85 of 255 at rest (p99 15), on edges, and the two are not told apart at three times zoom.
- Bytes, from `data/media/arms/`: colour 10,054, relief 63,547, finish 40,308, still 46,412, 160,321 in
  all, against 119,578; the maps are fetched only once the shield comes into view, on a page with arms,
  which the heraldry spec checks on a page without them. From the build's `_astro`, `gzip -9`: `arms`
  8,498 bytes (3,366), against 6,200 (2,679). The bake takes 12.5 seconds on the M5, against 3.9.
- No data rides in an alpha channel. An earlier pass of this build kept the pooling in the finish map's
  alpha and the convexity in the relief's: Playwright's WebKit drew black blocks across the open enamel,
  and drew them still with the maps written lossless, but not once every data map was opaque.
  `createImageBitmap` there appears to multiply the colour channels by alpha despite `premultiplyAlpha:
  'none'`; this was observed, not traced in WebKit's source. The 2026-10-26 maps kept alpha near one,
  which hid it. Firefox and WebKit now draw the shield Chromium draws, with no console message.
- The multigrid needs its coarse cells inside. Kept where any finer cell is inside, the coarse problem
  is wider than the fine one, and on an 81 pixel strip the centre swung from 6,222 to -7,356 over eight
  cycles against an exact 840.5; kept where all four are, the residual falls about fourfold a cycle.
  `tests/unit/relief.test.ts` holds a strip and a disc of radius 60 to their exact solutions through
  every level, a line splitting a shape into parts, the bezel, wire, plateau and V profiles, the
  surface, the curvature, the occlusion, the normals and the cast shadow.
- One shader source for the still and the page: the heraldry spec holds the first live frame within 8
  of the still, and checks the one context, the light following the pointer and settling, reduced
  motion, print, Swup and the hand-off.
- Moving `litByRoom`, `environmentBrdf` and `neutral` into `lighting.glsl` on 2026-10-26 left the glazed
  frame unchanged: rendered on identical inputs at three eyes, old and new are bit identical on
  SwiftShader, and differ in one value of 1,228,800 by 1 on the M5. This build does not touch
  `lighting.glsl`.

### Alternatives considered

- **three.js at run time**: allowed by the owner this time. It ships in the 762,451 byte `atlas-engine`
  chunk that 0053 and 0054 refused for a content page, it would add a scene graph and a second context,
  and what read as clay was the sculpt and the material, which a renderer does not supply. Rejected.
  Reopens if the arms need a silhouette in depth, such as a shield seen at an angle.
- **Modelling the shield in three.js and baking it like the frame**: extruded charges cannot carry the
  drawn line work, and a fitted room yaw leaves the hand-off a few percent off. Rejected. Reopens with
  the alternative above.
- **The bevelled relief of the 2026-10-26 build**: « like clay ». Rejected.
- **A relief map within 0.5° on average**: AVIF quality 95, 141,787 bytes for the relief alone, for a
  drawing no one could tell apart from quality 72 at three times zoom. Rejected, and lossless maps with
  it. Reopens if block seams show on a display not measured here.
- **Data in alpha channels**: the black blocks in WebKit above. Rejected.
- **Coarse cells kept where any finer cell is inside**: the cycles diverge. Rejected.
- **A height map with the normals worked out on the page**: over this relief's range of about 7.5
  units, eight bits step the height by 0.03 units, a slope step of about 0.15 at 5 pixels a unit, which
  would terrace every curve. Not built. Rejected.
- **A gloss with a full Fresnel coat**, **the calmest build**, **realism through gloss**: the owner's
  « unbearable », « flat » and « not that glossy ». Rejected.
- **Shadows traced on the page**: a march per pixel per frame for a light that never moves. Rejected for
  the bake. Reopens if the key light ever follows the reader.
- **Supersampling the shading**: an offscreen target and a downsampling pass, where widening the
  roughness by the normal's variance already averages what would sparkle. Rejected. Reopens if edges
  sparkle on a display not measured here.

### Caveats

- The still is drawn by SwiftShader and the page by the reader's GPU, so the hand-off is close, not
  exact: 3.51 of 255 at a ratio of 2, up from 2.58, under the spec's 8. It is instant, as for the frame.
- The shield reads about 3.5 levels darker on average than the build the owner last brightened, from
  deeper shadows on the gold and pooled enamel at the walls, and the violet 3 levels lighter in its
  median; both await the owner's review.
- The gold is a stylised ramp, `ARMS.gold`, not a measured gold, chosen for the art direction.
- The maps take about 11 MB of GPU memory with their levels (three of 768 by 893 in RGBA8), against
  about 6.2 MB.
- Timings come from Chromium on the M5 only. Firefox and WebKit were checked for drawing, not timed, and
  nothing was checked on Windows or a phone. The arms draw on every tier, as the glass does, since they
  redraw only while the eye moves.

---

## Decision 8: A picture may open a note from a round button at the right end of its caption rule

### Decision

- `src/components/primitives/PictureNote.astro` puts a round button, 26 pixels, `mdi:help` in a 1 pixel
  circle, at the right end of the gold rule under a picture's caption, as a sibling of the
  `figcaption`. While a visible button sits on its rule, the figure takes `--au-caption-tail`, which
  shortens both halves of the rule equally so the hexagon stays centred (`:has()` in
  `src/styles/prose.css`). The button's look is `.au-prose__caption-button` there, which the pause of
  Decision 10 shares.
- The button opens a native popover, `src/components/primitives/PopoverNote.astro`, which now also
  draws the notes of `RankProfile.astro` and `Provenance.astro`: its title, its text and a close
  button. It reaches left of the button where CSS anchor positioning exists and the screen is wider
  than 560 pixels, and stands centred otherwise. It opens without JavaScript.
- The heraldry uses it for the blazon of arms, in the page's language: « Blasonnement » / « Blazon »,
  and the button's name `blazonOf` in `src/lib/i18n/strings.ts`.

### Rationale

- The owner's request and answers: at the far right of the caption's rule, in the page's language.
- A sibling, not a child: `tests/e2e/no-javascript.spec.ts` reads the caption's text and the heraldry
  spec the figure's name, which a button inside the caption would change.
- `tests/e2e/picture-note.spec.ts` opens the note by click and by keyboard, closes it with Escape and
  with its button, in both locales with the blazon read from the corpus, and measures at six widths
  that the button's centre is within one pixel of the rule's, that it ends at the figure's edge, after
  the rule, at least 24 pixels wide, with nothing scrolling sideways.
- The first rule used a three value position in `mask`, which Firefox refuses, dropping the whole mask
  and showing a solid gold bar. With four values the rule renders identical to the original in
  Chromium, Firefox and WebKit, compared on screenshots.

### Alternatives considered

- **The button on the heading's line**: offered; the owner chose the caption rule. Rejected.
- **A third copy of the note's styles**: `RankProfile` and `Provenance` already carried two. Rejected
  for one primitive.
- **Both languages in every note**: offered; the owner chose the page's language. Rejected.

---

## Decision 9: The arms' charges are WappenWiki's, credited with Armoria, in a foreign directory outside the image pipeline

### Decision

- `data/media/arms/` is a foreign directory (`FOREIGN_DIRECTORIES` in `src/lib/rights/ownership.ts`):
  never stamped. It holds each composition and its bake.
- `ARMS_WORKS` in `src/lib/rights/attribution.ts` credits Armoria (Azgaar, MIT) and each charge
  (WappenWiki, CC BY-NC-SA 3.0); `ARMS_COMPOSITIONS` says which works each composition uses. The
  credits page renders a Heraldry table from them, and its text says how the arms adapt the charges.
- The Victoria composition is Armoria's own export of the owner's recipe, with `bookClosed` in place
  of `bookClosed2`, and its enamels changed to the owner's choice. Each charge keeps the `source` and
  `license` Armoria gives it. The owner's export, `victoria-armoria.png`, stays beside it as its
  `source` in `ARMS_COMPOSITIONS`, so the recipe ships with the arms and can be reused.
- The page imports the maps and the still as hashed files (`armsOf` in `src/lib/media.ts`, with
  `?url&no-inline`), never through Astro's image pipeline.

### Rationale

- Armoria's License screen and each charge's `<metadata>`: Lion Rampant, Estoile and Raven are
  WappenWiki drawings under CC BY-NC-SA 3.0, and so is `bookClosed` (WappenWiki's `Perm.svg`); the
  wappenwiki.org footer gives the same licence. CC BY-NC-SA 3.0 §4(b) lets an adaptation be shared
  under a later version with the same elements, which Aubaine's CC BY-NC-SA 4.0 is.
- `bookClosed2`, the book of the owner's render, is Tzeentch's drawing under the Free Art Licence 1.3,
  which forbids adding a non-commercial clause: it cannot ship in a CC BY-NC-SA shield.
- Exported from Armoria with the recipe in the owner's PNG, the arms match that PNG within 0.55 to 0.83
  of 255 on average in each quarter; the committed composition rendered pixel identical to the export
  before its enamel was changed. Only the book's quarter changed, by 4.1 of 255 on average.
- `src/lib/rights/image-service.ts` writes Aubaine's claim into every raster it outputs, whatever its
  directory, which would claim someone else's drawing. Vite inlined the 3,290 byte colour map as a `data:`
  URL, which `public/_headers` forbids a `fetch` (`default-src 'self'`), so the maps are imported with
  `?url&no-inline`, as the Atlas does.
- `tests/data/integrity.test.ts` fails when a file in `data/media/arms/` is credited by no composition,
  when a composition draws a charge it does not credit or credits one it does not draw, when a credited
  licence differs from the charge's, or when a work is under any licence but MIT or CC BY-NC-SA 3.0;
  `tests/e2e/policies.spec.ts` checks the credits page links every work.

### Alternatives considered

- **`bookClosed2`, as rendered**: Free Art Licence. Rejected.
- **Redrawing the four charges as Aubaine's own**: no credit to carry, but a hand-drawn lion and raven
  short of WappenWiki's line work; the owner preferred crediting. Rejected. Reopens if Aubaine ever
  needs a commercial licence for its content.
- **The arms under `data/media/art/`, stamped**: a false claim on WappenWiki's drawings. Rejected.

### Caveats

- WappenWiki names no author for the lion, the estoile and the raven, and Armoria records only
  wappenwiki.org as their source, so the credit links the site; the book links `File:Perm.svg`, whose
  page names its uploader and no author.
- Armoria's README describes its WappenWiki charges as CC BY-NC 3.0 while the files and wappenwiki.org
  say CC BY-NC-SA 3.0; the credit follows the files and the site, the stricter reading.

---

## Decision 10: The banner stirs in a light wind, and every heraldic pause is a round button on the caption rule

### Decision

- `data/species/humain.json` gives the Colbert banner house gold, `#efbe04` (`KEY_FALLBACK` in
  `src/lib/key-colour.ts`), as its `charge`. The gilt of Decision 2 shades it unchanged, and the plain
  SVG banner mixes its stops from the same value.
- `src/lib/art-effect/cloth.ts` lets the air move. `gatherAir` takes each triangle's velocity
  relative to the air, `v - w`, so with no wind the force is the old drag exactly. `w` is a sum of
  sines over the triangle's rest centre (`centres`, from `weave`) and `cloth.seconds`: a slow gust on a
  steady push toward the reader, ripples that travel across and down the cloth, and a sideways part
  carried by an in-plane share of the wind (`slip`), since pressure alone cannot push a flat cloth
  sideways. The values are `BANNER_CLOTH.wind` in `src/lib/art-effect/presets.ts`, `slip` 3.5 for one.
  Nothing is random, so the same calls give the same motion.
- `blow` turns the wind on or off. The breeze eases in over `rise` (2 s) and out over `fall` (0.8 s),
  and `calm` counts only once it is out, so a lull never reads as rest. `brisk` is true while the
  reader holds the cloth or a point moves faster than 0.25 a second.
- `src/scripts/art-effect/banners.ts` steps the cloth on every animation frame and draws at
  `tier.cloth.perSecond`, the flag's pace, unless the cloth is brisk (arriving, dragged, flung), when it
  draws every frame. It blows from its first frame unless the reader prefers reduced motion or has
  paused. Pausing, from any of the page's buttons, freezes the cloth where it is, as the flag does, and
  Play continues from there. A drag while paused still moves it, and it comes to rest.
- The banner's pause and the flag's are one button in `Heraldry.astro`, after the `figcaption`:
  26 pixels, round, at the right end of the caption rule, with the look of Decision 8's « ? »
  (`.au-prose__caption-button`), named `bannerPause` and `bannerPlay` or `flagPause` and `flagPlay` in
  `src/lib/i18n/strings.ts`. The flag's 38 pixel square over its corner, and the wrapper that placed
  it, are gone.

### Rationale

- The owner's requests and choices (Context).
- Measured on a scratch copy of `cloth.ts` and `presets.ts` in Node 22.23.0 on an Apple M5, over 60 s
  after a 6 s ramp, on a banner 384 pixels tall: the hem sways 13.0 pixels from side to side (7.4 at
  a `slip` of 2, which the owner found too faint), the bottom moves between 0.014 and 0.100 in depth
  against a `depth` of 0.22, nothing leaves the box, links stretch at most 2.5 %, every triangle
  keeps the depth part of its normal above 0.85, the fastest point moves 0.059 a second, and the cloth
  rests 2.7 s after the wind stops. Every gust, ripple and sway runs under 0.35 Hz.
- Measured in the same Node, outside Vitest, medians of seven 60 s runs in two rounds: 0.13 to
  0.15 ms a step in the wind against 0.13 to 0.14 ms without, about 16 to 18 ms of CPU for each second
  the banner is on screen and moving. The work per step does not depend on the wind's values.
- Measured with Playwright 1.63.0's Chromium (`channel: 'chromium'`) on macOS 26.3.1, 1440 by 900 at a
  pixel ratio of 2, five runs with the banner in the wind: frame interval median 16.7 ms, p95 16.7 to
  16.8, worst 16.8, no long animation frame; 30.1 draws a second; no draw and the same pixels while
  paused. In Firefox 158.0.1, in a window through geckodriver, drawing with WebRender on the GPU: 30.2
  draws a second, frame interval median 8.3 ms, p95 9.2, worst 9.3; no draw while paused.
- The gold, read from the settled frame under reduced motion in the same Chromium, on pixels within
  60° of the charge's OKLCH hue: median chroma 0.083 before and 0.096 after, chroma of the brightest
  5 % 0.092 and 0.113, median hue 86.3° and 88.1°, from `#d4a83a` to `#efbe04`.
- `tests/unit/cloth.test.ts`, « a banner in the wind », holds that it keeps moving and never rests,
  stays slight, blows the same way every time, resumes where a pause stopped it, gathers the wind
  gradually and rests within five seconds once it drops or after a fling, is brisk only when held or
  flung, and gives no still frame while blowing. `tests/e2e/heraldry.spec.ts` holds the banner's pace
  on screen and no draw off it, the pause by keyboard holding the frame while a drag still moves it,
  one pause shared by the banner, the flag and the hero across a reload, each pause on its caption
  rule at 320, 768 and 1440 pixels, and the gilt taking the hue of its charge.
- Freezing rather than letting the cloth settle: the reader who pauses wants the motion to stop now,
  and one control stops every moving part at once (`accessibility.md`, One pause stops everything).

### Alternatives considered

- **The gilt taking the charge flat**: the charge as the metal's reflectance, normalised so flat metal
  showed it, highlights held at its hue. The median chroma rose to 0.146, and the owner refused it as
  yellow paint rather than metal (`rulings.md`, Gilt is shaded metal, never flat yellow). Rejected.
  Reopens if an illustrated, unshaded gold is asked for.
- **The arms' deep to pale gold, or a ramp built from the charge**: rendered beside the kept gilt; the
  first read pale and washed out, the second as copper. Rejected. Reopens with a new direction for the
  metal.
- **The wind dying and the cloth swinging to rest on pause**: two to three more seconds of motion
  after the reader asked for none. Rejected.
- **Drawing every animation frame**: a GPU render and a copy per display frame, 60 to 120 a second,
  for motion of a few pixels a second. Rejected. Reopens if the paced breeze reads choppy.
- **Stepping the cloth only on drawn frames**: `MOST_STEPS` and `LONGEST_FRAME` would drop time on any
  gap over a fifteenth of a second and slow the wind. Rejected.
- **A square pause over the cloth**: the owner chose the caption rule for the banner, then moved the
  flag's there. Rejected.

### Caveats

- The motion sits beside a paragraph, which `accessibility.md` asks to keep still. It stays slow and
  slight, and its pause sits right under it.
- The simulation runs for as long as the banner is on screen and moving: 16 to 18 ms of CPU a second on
  an M5. Nothing was measured on Windows, on a phone or on integrated graphics.
- Three buttons with three names (the stage's, the flag's, the banner's) set one choice; it stays an
  open gap in `accessibility.md` (WCAG 3.2.4).

---

## Summary

| Item | Role | Where |
| --- | --- | --- |
| `heraldry` | a banner or a flag on a sub-species | `src/lib/game/schema.ts`, `Heraldry.astro`, `Species.astro` |
| the banner | a simulated cloth in a light wind, smoothed and shaded on the GPU, under a baked hanger | `cloth.ts`, `banners.ts`, `loom.ts` |
| the flag | a wave on the GPU | `flags.ts`, `glsl/flag-wave.glsl` |
| stillness | one pause for every moving decoration, round on the heraldry's caption rule | `src/scripts/stillness.ts`, `Heraldry.astro` |
| `glazed` | a scanned frame that catches the light, and glass | `book-markup.ts`, `prose.css`, `glazes.ts` |
| `keyColour` | a species' own accent | `src/lib/game/schema.ts`, `CharacterHero.astro` |
| textures | CC0 works and their credits | `TEXTURE_WORKS`, `tools/media/textures.ts` |
| arms | an Armoria composition baked into maps, enamel and gold on the GPU | `relief.ts`, `tools/media/arms.ts`, `arms.ts`, `glsl/arms.frag` |
| the picture note | a round « ? » at the end of the caption rule, a popover | `PictureNote.astro`, `PopoverNote.astro`, `prose.css` |
| heraldry credits | Armoria and the WappenWiki charges | `ARMS_WORKS`, `ARMS_COMPOSITIONS`, `data/media/arms/` |

## Open questions

- A WebKit and Firefox timing of the copy out of the shared context, before this record is accepted.
- One name for the three pauses that set one choice (WCAG 3.2.4), or keep a name per piece.
