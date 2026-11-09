# ADR: A glazed painting may hang in a modelled wooden frame, and a portrait picture floats beside its text

**Project:** Aubaine, the wiki
**Status:** Proposed
**Date:** 2026-11-08
**Deciders:** Kori
**Scope:** The frames a `glazed` lore picture may hang in (the scanned gilt frame of 0059 and a
modelled wooden one), how the wooden frame is modelled, baked and credited, the room it is baked in,
the `11_12` ratio in `data/media/art/`, which lore pictures float beside their text, the sizes such a
picture is fetched at, and the guillemets of a caption. Amends 0059 Decisions 4 and 6, 0009
Decision 1 and 0069 Decision 3. Leaves 0071 intact: the wooden frame is drawn before it is seen like
every lit piece. Does not cover the gilt frame's own look, which stays as 0059 records it.

---

## Context

The owner asked for the elf section « Les derniers Galwariens » to show their illumination as « Les
Naufragés de la Venue » is shown on the Humain page (0059 Decision 4), in a more rustic wooden frame,
the painting on the left and the text on the right, with CC0 assets allowed and a professional finish.
The illumination is 1199 by 1312 pixels with its own painted floral border, measured with `sharp`.
Asked, the owner chose the float over a column with the painting kept in view, the Poly Haven scan
`wood_table_worn` over `rough_wood`, glass as on « La Venue », and the caption « Les derniers
Galwariens ». Poly Haven's frame models are two carved fancy frames, two plain modern ones, two
whitewashed ones and an oval mahogany one (its asset list, read through `api.polyhaven.com`), so no
scanned rustic frame exists. Versions, read
from `pnpm-lock.yaml`: `astro@7.3.3`, `three@0.186.1`, `sharp@0.35.4`, `@playwright/test@1.63.0`.

---

## Decision 1: A glazed picture names its frame, and the wooden frame is modelled from a CC0 scan

### Decision

- `FRAMES` in `src/lib/art-effect/presets.ts` holds one row per kind of `FRAME_KINDS`, `gilt` and
  `wood`: the bake's size and slice, the size of its maps, its metalness and its exposure. The room's
  rotation, which the bakes and the page share, is `ROOM_ROTATION`, and the page shader's yaw is
  `GLAZE_ROOM_YAW`. The banner's hanger keeps its own exposure in `BANNER_HANGER`.
- `"glazed"` alone hangs the gilt frame (`GLAZED_FRAME`); `"glazed wood"` hangs the wooden one; any
  other second word, or a third, fails the build (`pictureLook` in `src/lib/game/book-markup.ts`). The
  wrapper carries `data-frame`, and `src/styles/prose.css` picks the still per frame through
  `--au-frame-still`.
- `src/scripts/art-effect/glazes.ts` reads the frame from `data-frame` and takes its slice, metalness
  and exposure from `FRAMES`; `mouldingOf(studio, frame)` in `src/scripts/art-effect/textures.ts`
  loads and keeps each frame's maps once per studio, through the keyed loader the fabrics already used.
  `glsl/glazed.frag` is unchanged in what it computes; its colour and roughness map is now named
  `uSurface`, and the gilt file `fancy-picture-frame-01-gilt.avif` was renamed `-surface.avif`, bytes
  unchanged.
- The wooden frame is modelled in three.js on the bake page (`woodModel` in `tools/media/textures.ts`,
  values in `WOOD_MODEL` and `WOOD_MEMBERS`): four members of a 45 mm moulding, the stiles running full
  height and the rails butting between them, so the grain turns at each joint, which a hairline groove
  marks; a worn quarter-round outer arris of 8 mm; a flat face; a chamfer mitred at the inner corners
  down to a narrow sight lip; fixed-phase waves along each member for a hand-worked face, arris and
  chamfer. Each member samples the scan along its own grain, from its own offset. The material is the
  scan's colour, normal and roughness at 2k, metalness 0, its roughness scaled by 0.7 for a waxed sheen,
  and no clear coat, which the page's single lobe could not draw.
- The bake is 1463 by 1576 with a slice of 132 on every side, so the opening is exactly the painting's
  1199 by 1312 and the nine-slice scales evenly at every width; `measureOpening` refuses a bake off by
  more than one pixel. The frame's share of its width is 9.0226 %.
- `TEXTURE_WORKS` in `src/lib/rights/attribution.ts` credits « Wood Table Worn » to Dimitrios Savva and
  Rico Cilliers under CC0 1.0, its cuts `wooden-frame.webp`, `wooden-frame-surface.avif` and
  `wooden-frame-relief.avif`; each frame cut names its frame. The credits page lists it from there.

### Rationale

- With `uMetalness` at 0, `litByRoom` in `glsl/lighting.glsl` shades a dielectric: no new shader is
  needed, and the wooden frame catches the light under the pointer as the gilt one does.
- Modelling follows the banner's hanger (0059 Decision 6), the only other modelled piece, lit by the
  same room, and keeps the ruling of real materials: the wood is the scan, lit, never a drawn gradient.
- The first bake at the gilt's exposure and the scan's roughness read dull: the still's mean luminance
  was 46.9 against 114.0 for the gilt still, its tenth to ninetieth percentile 32 to 63, and its
  roughness, averaging 0.724 in the scan, would have left almost nothing to follow the pointer. At an
  exposure of 2 and a roughness scaled by 0.7, the shipped still reads 68.2, from 45 to 98, its
  brightest percent at 151.
- Measured on the built elf page at 1440 by 900 and a pixel ratio of 2, over the moulding, at rest and
  with the pointer at the far left and far right, with the same script for both frames:

  | Frame and browser | Mean luminance, rest, left, right | Swing |
  | --- | --- | --- |
  | Wood, Playwright Chromium (`channel: 'chromium'`) | 72.5, 72.8, 84.9 | 12.4 |
  | Wood, Playwright WebKit | 73.3, 73.8, 85.9 | 12.6 |
  | Wood, Playwright Firefox, headed on the graphics card | 74.1, 74.5, 86.5 | 12.4 |
  | Gilt, Firefox, headed, after this change | 104.8, 102.5, 117.4 | 14.9 |
  | Gilt, Chromium, before and after this change | 105.0, 102.7, 117.6 | 14.9 |
  | Gilt, WebKit, before and after this change | 104.5, 102.2, 116.9 | 14.7 |

  The arms were accepted at a swing of 12, unbearable at 21 and flat at 5 (0059, `measuring.md`).
  No browser logged an error.
- At the pointer's far positions the painting's recess uncovers at most a sliver of rabbet on the side
  away from the pointer, as on « La Venue »; the illumination's floral band and its outer rule stay
  visible on all four sides, read from the canvas at rest and at both poses.
- `pnpm media:textures` writes the room, the fabrics, the hanger and the gilt frame byte for byte as
  before, compared by `shasum` against copies taken first; only the three wooden files are new, 132,980,
  67,973 and 38,199 bytes. The heraldry spec checks that each frame's maps are fetched only on a page
  that shows that frame.

### Alternatives considered

- **A Poly Haven frame model**: the wooden ones are whitewashed or an oval mahogany, neither rustic.
  Rejected. Reopens if a scanned rustic frame appears under CC0.
- **The grey `rough_wood` scan**: offered beside the warm one; the owner chose the warm one. Rejected.
- **A per-frame branch in the shader**: nothing in the wood needs one. Rejected.
- **Pegs or iron nails at the joints**: at a 353 pixel float the moulding is 32 pixels wide, and a
  4 mm peg would be about two pixels. Rejected. Reopens if the frame is shown much larger.
- **Moving roughness out of the colour map's alpha for both frames**: `measuring.md` warns that WebKit
  multiplies channels by alpha, but the gilt measured within one unit of Chromium in WebKit before any
  change (table above), so the packing stays and the gilt's maps keep their bytes. Reopens if a WebKit
  measurement shows the darkening.

### Caveats

- The frame's exposure differs from the gilt's (2 against 1.2). They hang on different pages; the room
  is the same.
- The bake fits an 11:12 painting. `"glazed wood"` on another shape still builds, and its nine-slice
  would stretch the grain of two members against the other two, 1.64 times at 3:2, as the gilt's side
  members are compressed 9 % (0059 Decision 4). A wooden frame for another shape is a second bake.
- WebKit's brightest percent reads 209 at every pose against 160 to 180 in Chromium; the means agree
  within one unit, and the cause of the difference is not yet found.

---

## Decision 2: The wooden frame is baked in the room as the page sees it

### Decision

- The bake of the wooden frame mirrors the room left to right and turns it by `-GLAZE_ROOM_YAW`
  (`FRAME_ROOMS` and `mirroredRoom` in `tools/media/textures.ts`), so its still is lit from the side the
  page shader lights it from.
- The gilt frame keeps the room as 0059 baked it (`ROOM_AS_BAKED`), so its files do not change.

### Rationale

- three.js samples the room through its cube map convention, which is mirrored against the page
  shader's equirectangular lookup (`roomUv` in `glsl/lighting.glsl`). Baked in the plain room, the
  wooden still lit its left chamfer (127/105/103 in sRGB) where the first live frame lit its right one
  (132/122/133): the chamfers would have swapped as the live frame took over. The gilt's ornament hid
  this; 0059 Decision 4 noted only that its glints sit in different places.
- The mean difference over the moulding between the still and the first live frame at rest, in sRGB
  units, for each bake: the plain room 30.3; mirrored and turned by 0, π/2, π and -π/2: 32.1, 31.6,
  15.4 and 29.3; then 2.94, 2.99, 3.04 and 3.09: 14.5, 13.9, 13.8 and 14.3. 2.99 is π - 0.15, the
  page's yaw of π + 0.15 seen in the mirror, within 0.1 of the best fit, so the bake takes it from the
  shader's constant rather than a fitted number.
- With it, the chamfers agree (left 75/43/6 still against 80/46/9 live, right 135/125/138 against
  132/122/133) and the faces within about ten units.

### Alternatives considered

- **Correcting the page shader's lookup to three.js's**: it would change the live look of « La Venue »,
  which the owner checked on the live page. Rejected. Reopens if the gilt is rebaked.
- **Rebaking the gilt in the mirrored room**: changes an accepted still for no request. Rejected.

### Caveats

- Two frames are baked in two room conventions. A new frame takes the wooden one.

---

## Decision 3: A portrait lore picture of any ratio floats beside its text

### Decision

- `isPortraitSource` in `src/lib/art-effect/almanach-look.ts` is true when the ratio in a picture's name
  is narrower than tall, such as `3_4` or `11_12`; `pictureRatio` there is the one reading of the ratio,
  which `book-markup.ts` reuses. `rehypeProseSidePictures` floats such a picture, captioned or not, at
  the start of the text up to the next heading; an almanach still refuses it (0069).
- The float is the first child of `.au-prose__side` in `src/styles/prose.css`, 46 % of the column, the
  text beside it and then under it; below 48rem it stands above the text, 22rem at most. A side picture
  is fetched at `widths` 352, 704 and 1056 with `sizes` `(width < 48rem) 22rem, 22.25rem`, in place of
  the column's `100vw`.
- A floated frame's wall and rabbet shadows scale with the frame, as « La Venue »'s measure against a
  frame the full column wide (`--au-frame-rem`, a forty-eighth of the frame's width), so an offset
  shadow keeps its proportion to the piece; « La Venue »'s own shadows are unchanged.
- `data/media/art/` accepts `11_12`; `les-derniers-galwariens-11_12-og.png` is the owner's file,
  untouched, 0.31 % from 11:12, inside the 1 % tolerance of `tests/data/integrity.test.ts`.
- A caption keeps each guillemet on the line of its words, with a no-break space
  (`guillemetsHeld` in `book-markup.ts`).

### Rationale

- The owner chose the float. The mechanism existed for 3:4 pictures and no page used it; widening the
  rule to every portrait ratio keeps one rule rather than a list.
- The float took 38 % of the column as built for 3:4 pictures; on seeing the painting live, the owner
  asked for it slightly bigger (42 %, 323 pixels on a 1512 pixel screen), tried half the column (384
  pixels, its text beside it at 33 to 42 characters a line) and chose 46 %: 353 pixels, against 292 at
  first.
- `pnpm design:audit` on `/fr/espece/elfe` and `/en/species/elfe` at 1512 by 860, 1440 by 789, 1366 by
  657, 1280 by 610, 1024 by 768, 820 by 1180, 390 by 844 and 320 by 568: 16 states, no sideways scroll,
  no problem. `tests/e2e/side-pictures.spec.ts` holds the float at 1440, 1024 and 768, the stack at 390
  and 320, and a decoded picture at most twice its shown width.
- Beside the float, the French text runs 36 to 49 characters a line from 1024 to 1512 pixels and 33 to
  47 at its narrowest, a 768 pixel screen; 28 to 36 there under the text spacing of WCAG 1.4.12, with
  no sideways scroll. Counted per full line in Chromium at 46 %; at 38 % it ran 44 to 53. The dark theme and forced colours keep the frame, the painting and the caption; forced
  colours drop only the caption's decorative rule.
- The guillemet rule came from the float: at 38 %, 292 pixels, the caption broke before its closing « » ».
  `pnpm design:pixels` on the approved pages and « La Venue », before and after: every shot identical
  but two. The Humain page at 390 pixels changed only where « La Venue »'s caption no longer starts a
  line with « » »; the English Humain page at 1512 differed by 150 pixels on a skill icon in the text,
  the same 150 pixels two captures of one build differed by.

### Alternatives considered

- **A column with the painting kept in view**: offered; the owner chose the float. Rejected. Reopens if
  the owner asks for it.
- **Cropping the illumination to 3:4**: it would cut 215 pixels of width and its painted border, and
  edit an `og` file. Rejected.

### Caveats

- No mask file exists at `11_12`; a mask on such a picture falls back to its 3:4 file, as 0059 noted
  for 3:2.

---

## Open questions

- The owner's verdict on the live page: the frame's width (9 %), and its colour and sheen.
- The French and English alt text, which the owner has not yet read. The owner kept « enluminure » in
  the caption on 2026-11-09, the picture reading as a manuscript page (its border, gilding and the
  bestiary its file name gives).
