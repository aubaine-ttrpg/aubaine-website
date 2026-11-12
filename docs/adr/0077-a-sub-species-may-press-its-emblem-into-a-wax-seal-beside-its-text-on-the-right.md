# ADR: A sub-species may press its emblem into a wax seal beside its text on the right

**Project:** Aubaine, the wiki
**Status:** Proposed
**Date:** 2026-11-12
**Deciders:** Kori
**Scope:** The `seal` kind of heraldry and where it stands, where its emblem and its bake live and who
owns them, how it is sculpted, baked and shaded, the stills it hands off from, and the mount, bake,
shader library and measuring tool it now shares with the arms. Extends 0059 Decisions 1, 7 and 9
without changing the arms' look, keeps the lean in the shader that 0059 Decision 7 records, and keeps
0071: a seal is drawn before it is seen like every lit piece. Leaves the banner and the flag as they
are.

---

## Context

The owner asked for a seal of gold sealing wax for the Al-Wahaa origin on the Humain page, baked from
the owner's own emblem as the Victoria arms are baked, beside its paragraph on the right where the
Colbert banner and the Victoria arms stand on the left. The emblem, `oasis_emirates_emblem.svg` at the
repository root, was one black evenodd path of 9 shapes over a white background rectangle, 1312 by
1199, made of 1,031 straight segments on whole pixels, 169 of them 1.5 px or shorter (counted from its
path data). The look reference is the sub-species' painting, `sceau-d-al-wahaa-1_1-og.png`: a lobed
gold puddle with one drip and the emblem pressed into it. The brief excluded three.js at run time, a
generated image and a third-party seal; that Poly Haven and ambientCG offer no wax material or seal
and that Sketchfab's only CC0 seal is a brass stamp is the owner's finding, not checked here. Versions,
read from `pnpm-lock.yaml`: `astro@7.3.3`, `sharp@0.35.4`, `playwright-core@1.63.0`.

---

## Decision 1: A seal stands beside its text on the right, and comes first in the page's order

### Decision

- `heraldry` gains a fourth kind in `src/lib/game/schema.ts`: `seal`, with `name`, `emblem` (a framed
  SVG in `data/media/emblems/`) and `wax`, a six digit lowercase hex. The English overlay translates
  `name`, as for every kind.
- `HeraldryPlacement` in `src/lib/game/derive.ts` becomes `'beside-start' | 'beside-end' | 'across'`:
  the banner and the arms stand `beside-start`, the flag `across`, the seal `beside-end`.
- `Species.astro` mirrors the row for `beside-end` (`au-subspecies__flanked--end`): the text takes
  `minmax(0, 1fr)` and the piece the same `clamp(7.5rem, 26%, 12rem)` as the pieces on the left. The
  figure stays first in the source, so that below 30rem it stands above the text at 9rem as the
  others do, and from 30rem `grid-column: 2` draws it right of the text.
- The Al-Wahaa seal is captioned « Sceau des Banū al-Baṭal », "Seal of the Banū al-Baṭal", and its wax
  is `#ef9600` (`data/species/humain.json` and its English overlay).

### Rationale

- The owner's request and choices, recorded in `.claude/skills/aubaine-design/references/rulings.md`
  on 2026-11-12. The caption is the owner's name for the former ruling tribe of the Al-Wahaa, recorded
  as canon in `.claude/skills/aubaine-lore/references/rulings.md`; the owner kept the name alone.
- A seal drawn right of its text but read before it breaks *Reading order is drawn order*
  (`.claude/skills/aubaine-design/references/accessibility.md`). The owner chose the stacked order of
  the pieces on the left over a seal under its text, and that reference now records the exception.
  WCAG 2.4.3 holds because the piece offers nothing a keyboard can reach, which
  `tests/e2e/heraldry.spec.ts` checks for every `beside-end` kind; 1.3.2 holds because the heading
  still leads the article and a captioned figure beside a paragraph does not change its meaning
  (the accessibility critic's reading).
- The wax colour is on the piece, as the banner's `field` and `charge` are (0059 Decision 1), because
  a tincture list for one seal would be a vocabulary.
- `HERALDRY_PLACEMENT` is a `Record` over the kinds and `Heraldry.astro` throws on a kind it cannot
  draw, so the compiler required the new place and the new branch.

### Alternatives considered

- **The paragraph first in the source**: reading order equals drawn order at every width with no
  exception, but the seal then stacks under its text on a phone. Rejected by the owner, for parity
  with the banner and the arms. Reopens if a seal ever carries a control, such as a note.
- **The left column of 0059**: where the banner and the arms stand. Rejected by the owner's brief.
- **A column stepped to 7.5rem and 12rem**: the still would match the live seal at every width
  (Decision 5). The owner asked for the seal to sit as the pieces on the left sit; not taken.
- **The wax colour as a constant**: one less field, but every seal would share it. Rejected.

---

## Decision 2: The emblem is the owner's and lives in `emblems/`; the bake lives in `seals/`, owned and unstamped

### Decision

- The emblem moved to `data/media/emblems/al-wahaa.svg`. Its background rectangle was removed, as
  `frameEmblem` (`src/lib/emblem-frame.ts`) accepts plain paths only, then `pnpm media:emblems`
  framed it (white fill, a square viewBox 1234.783 units wide with the shared 4 % margin) and
  `pnpm media:stamp` wrote Aubaine's claim into it. No shape was redrawn.
- `data/media/seals/` holds each seal's maps and stills and is declared in `OWNED_MODEL_DIRECTORIES`
  (`src/lib/rights/ownership.ts`): owned, and left as the bake wrote it. The page imports them with
  `?url&no-inline` through `sealOf` in `src/lib/media.ts`.
- `tests/data/integrity.test.ts` counts a seal's emblem as worn and holds `data/media/seals/` to
  exactly the bakes of the seals the data presses.
- The emblem's straight segments stay: at the bake's resolution a source pixel is 1.064 fine pixels,
  or 0.35 of a map texel, and neither the lit seal at three times zoom on the live page nor its normal
  map at four times zoom with the slopes amplified threefold shows a ridge along an edge.

### Rationale

- An owned folder may hold only the formats `pnpm media:stamp` writes (`.png`, `.jpg`, `.svg`,
  `.mp4`), which `tests/data/integrity.test.ts` enforces, so the AVIF maps and WebP stills cannot sit
  beside the emblem. `almanach/` already holds owned baked maps the stamp leaves alone
  (`docs/first-party-assets.md`).
- The emblem is the owner's drawing: nothing to credit, and `arms/` is for credited third-party
  compositions (0059 Decision 9).

### Alternatives considered

- **The seal in `data/media/arms/`**: a foreign folder whose files must each be credited by a
  composition. Rejected.
- **A new rights table for baked folders**: the same treatment as `almanach/` under a second name.
  Rejected. Reopens if the owned baked folders ever need different handling.
- **Smooth curves traced by potrace**: the brief's remedy if the steps showed as ridges. Not needed.
  Reopens if the bake's resolution rises far enough for a source step to span a texel.

---

## Decision 3: The seal is sculpted in Node from fixed waves, a squeezed ring, a pressed field and the emblem

### Decision

- `sealOutline` and `sealSurface` (`src/lib/art-effect/relief.ts`), with every value in `SEAL`
  (`src/lib/art-effect/seal-look.ts`), sculpt a 768 pixel square map, supersampled three times, over
  100 units:
  - the puddle, a signed distance from a circle of radius 40 lobed by five fixed-phase waves (orders 3,
    5, 8, 11 and 17), joined by a smooth minimum to one tapered drip below it; `inflate` then
    `basRelief` (height 3.2, reach 3) round its edge into a meniscus and its drip into a bead;
  - a dome of 2.5 and three plane ripples on the wax outside the pressed field;
  - the ring the stamp squeezed out: a bell profile 7 units wide and 1.1 high, its height and its
    radius each moved by three fixed waves and its crest roughened by three high-order ones;
  - the pressed field, 1.1 below the wax behind a wall 1.2 wide, flat;
  - the emblem, scaled to 57 units and centred in the field, each shape inflated on its own and
    raised by `basRelief` (height 0.9, reach 0.5);
  - a roughness of 0.6 on the wax, 0.72 on the ring, 0.5 on the field and 0.48 on the emblem.
- Occlusion, curvature, normals and the key light's cast shadow come from the arms' `occlusionOf`,
  `curvatureOf`, `normalsOf` and `shadowOf`, whose parameters now ask only for the fields they read.
- `tools/media/seal.ts` refuses an emblem that reaches past the pressed field.

### Rationale

- The brief, item by item, with nothing random: the same input bakes the same map, which
  `tests/unit/relief.test.ts` checks with the drip lowest on the outline, the ring above the wax and
  the wax above the field, a flat field, a hole of the emblem left at field level, a sunk emblem below
  it, and the shipped outline inside its map.
- The dome stops at the field. Over a domed field the shading showed rectangular blocks: eight bit
  normals step once every 19 or so texels on so gentle a slope, and the blocks stayed with the relief
  map at AVIF quality 96 (99,528 bytes against 57,450 at 88), so they were not compression.
- A half-round ring, as the arms' bezel uses, is vertical at its feet and left a crease around the
  field; the bell is flat there.
- The owner chose the emblem raised, as an impression comes out of its stamp, over sunk, from previews
  rendered on the live page.

### Alternatives considered

- **The dome over the field**: the blocks above. Rejected.
- **A relief map at a higher quality or lossless**: the blocks did not move. Rejected.
- **The emblem sunk**, as the painting reads: rejected by the owner.
- **Noise for the outline and the ring**: excluded by the brief.

---

## Decision 4: Gold sealing wax is shaded as satin wax with mica, its tones drawn from its wax colour

### Decision

- `glsl/seal.frag`, linked after `lighting.glsl` and `relief.glsl`, shades the wax as a diffuse body
  (the key light with a wrap of 0.1 and a weight of 1.3, the room's irradiance at 0.15), darkened by
  the baked occlusion and shadow, under a satin sheen tinted by the wax: the room's reflection at 0.35
  and the key's lobes at the map's roughness and at 0.55, weighed 1.0, ramped from the hollow tone to
  the pale tone and kept in hue by `keepHue`, never white.
- A faint mica sparkle at 0.6: flakes on a fixed grid of 110 across the map, 22 % of them, each tilted
  by up to 0.45 and lit by the key at a roughness of 0.14, fading out where a flake is smaller than
  0.35 to 0.7 of a pixel. They ride the wax and never change from frame to frame.
- `waxShades` draws three tones from the wax colour in OKLCH: the body at its hue (lightness 0.72),
  the hollows 14° warmer (0.58) and the highlights at its hue with half its chroma (0.93). The page
  reads the hollow and highlight tones from the drape's `data-wax-deep` and `data-wax-pale`, the bake
  from the data.
- The seal shares the arms' room and key light (`RELIEF_ROOM` in `src/lib/art-effect/presets.ts`) and
  sways its eye 0.4 of the way to the pointer, where the arms sway 0.75.

### Rationale

- The rulings on gilt (shaded, amber in the hollows, pale warm highlights, never flat yellow) and on
  lit pieces (realism from light and shadow, not gloss; luminance measured at rest and at two far
  pointer positions). Measured on the built Humain page in Playwright's Chromium (`channel:
  'chromium'`, ANGLE on Metal, Apple M5), 1440 by 900 at a ratio of 2, over the canvas's opaque
  pixels, by the same script that reads the arms at 72.3, 71.1 and 79.2, as 0059 Decision 7 records:

  | Measure | Seal | Victoria arms |
  | --- | --- | --- |
  | Mean luminance, rest, far left, far right | 138.1, 136.2, 148.2 | 72.3, 71.1, 79.2 |
  | Swing | 12.0 | 8.1 |
  | 10th, 50th, 90th percentile at rest | 90, 142, 180 | 23, 44, 186 |
  | OKLCH hue of those bands at rest | 59°, 60°, 63° | 267°, 304°, 82° |
  | Median OKLCH chroma at rest | 0.145 | 0.168 (violet), 0.128 (gold) |

- The amber: the painting's lit wax has a median OKLCH of lightness 0.747, chroma 0.166 and hue 62.5°
  (pixels within 36 % of the width from its centre, lightness 0.6 to 0.88, chroma above 0.08). The
  wax `#ef9600` (hue 69°) renders its middle band at 60° and its light band at 63°.
- The swing: the diffuse body read 104.3 at every pose, so all of it is the sheen, the room's
  reflection 19 alone and the key's lobes 11 alone. A rougher field barely moved it (22 to 20); the
  shorter sway brought it from 19.9 to 12.0.
- The owner chose the painting's amber over house gold and the faint mica over satin alone, from
  previews rendered on the live page.

### Alternatives considered

- **House gold, `#efbe04`**: rendered at 78° to 81°, beside the arms' 82°. Rejected by the owner.
- **Satin alone**: no per-pixel flake. Rejected by the owner.
- **The arms' sway of 0.75**: a swing of 19.9, against the 21 the owner called unbearable on the
  arms. Rejected.
- **A smoother wax**: a roughness of 0.32 to 0.45 mirrored the key across the flat field from the
  right, a swing of 22. Rejected.

### Caveats

- The tones are a stylised rule, three OKLCH offsets from the wax, not a measured wax.
- The flakes fade out at a ratio of 1 on a 192 px seal, where one is under a pixel wide.

---

## Decision 5: A seal's still is baked at the device sizes of its box

### Decision

- `pnpm media:seal` bakes nine stills, 120, 144, 192, 240, 288, 360, 384, 432 and 576 px square,
  WebP at quality 88, by the same shader on SwiftShader. The still is served by `srcset` with the
  `sizes` `Species.astro` passes for its column: `(width < 30rem) 9rem, clamp(7.5rem, calc(0.26 *
  (100vw - 3.25rem)), 12rem)`, the row measuring `min(100vw - 3.25rem, 48rem)`.

### Rationale

- A still matches its live drawing only on its own pixels. Measured on the built page in Chromium,
  still against the first live frame, as the variance of the Laplacian of the greyscale box:

  | Width | Box | Ratio 1 | Ratio 2 |
  | --- | --- | --- | --- |
  | 320, 390 | 144 | 0.97 | 0.97 |
  | 480 | 120 | 0.98 | 0.96 |
  | 768 | 186.2 | 0.50 | 0.50 |
  | 1216, 1440 | 192 | 0.95 | 0.97 |

  At 768 the 192 px still is shrunk by 3 %, which halves the measure. Before `sizes` followed the
  clamp, 480 read 0.62 and 0.66 from a still shrunk to 120. The colours of the first live frame stay
  within the heraldry spec's 8 of 255 of the still.
- Chromium, Firefox and WebKit all pick the exact still from that `sizes`, `clamp()` and `calc()`
  included (one script over 400 to 1440 px at ratios 1 and 2).
- Bytes, from `data/media/seals/`: the stills 4,548 to 34,120, one fetched per page; the maps 4,137
  (colour), 34,145 (relief) and 25,322 (finish). The bake takes 22.6 seconds on the M5 and rewrites
  every file byte for byte.

### Alternatives considered

- **One still of 576 px, as the arms**: the browser shrinks it everywhere, the softening the arms'
  caveat records (0059 Decision 7). Rejected.
- **A stepped column**: Decision 1.

### Caveats

- Between about 514 and 790 px wide, where the column is neither at its floor nor at its cap, a first
  visit opened on the seal shows a still about half as sharp for the 0.4 to 0.7 s before the canvas
  takes over. Every other visit never shows the still (0071). The brief asked for no shift at all;
  the owner chose the fluid column.

---

## Decision 6: The seal shares the arms' mount, bake, shader library and measures

### Decision

- `src/scripts/art-effect/baked-relief.ts` holds what `arms.ts` held: the canvas, the maps, the lean
  in the shader, the eye, the observers and the teardown, configured by a selector, a shader, its
  uniforms, per-holder uniforms, the rest eye, the room's yaw and the lean. `arms.ts` and `seal.ts`
  each configure it and load lazily as their own chunk from `boot.ts`.
- `glsl/relief.glsl` holds the warped map lookup, the normal, the eye, `keepHue`, `antialiased`,
  `keySpecular` and the dithered output, and `arms.frag` renames `uShield` to `uPiece`.
- `tools/media/relief-bake.ts` holds the map packing, the encodings and the still page;
  `tools/media/arms.ts` and `tools/media/seal.ts` call it.
- `tools/design/picture-measures.ts` holds the sharpness, the pointer grid and the veil of the
  leaned-against-flat measure, used by `tests/e2e/heraldry.spec.ts` and by `pnpm design:sharpness`
  (`tools/design/sharpness.ts`), which runs it in Firefox, Chromium and WebKit.
- The seal's values live in `src/lib/art-effect/seal-look.ts`, apart from `presets.ts`, which the
  stage and the plates import on every page.

### Rationale

- Nothing of the arms changed: `pnpm media:arms` rewrites the three maps and the still byte for byte
  after the bake moved, the arms render bit identical on SwiftShader at three eyes after the shader
  library moved (0 of 1,543,680 values differ), and the arms' tests of `tests/e2e/heraldry.spec.ts`
  pass, now over a 3 by 3 pointer grid at ratios 1 and 2 instead of one corner.
- The seal leans as sharp as it stands. `pnpm design:sharpness`, against `astro preview` of this build
  on the M5, 1440 by 900, headed but for Chromium at a ratio of 1 (read headless, as
  `measuring.md` asks), with the pointer at nine points of the box, 2 % inside its edges at most:

  | Browser, ratio | Still against first live frame | Leaned against flat, lowest of nine |
  | --- | --- | --- |
  | Firefox, 1 | 0.951 | 0.974 |
  | Firefox, 2 | 0.970 | 0.953 |
  | Chromium, 1 | 0.954 | 0.974 |
  | Chromium, 2 | 0.973 | 0.924 |
  | WebKit, 1 | 0.947 | 0.974 |
  | WebKit, 2 | 0.970 | 0.957 |

  A pointer reaches at most a corner, 0.9 × tanh(0.7) × 7°, about 3.8° on each axis (`leanToward` in
  `src/scripts/tilt.ts`). Headed Chromium at a ratio of 1 read the still at 0.389, the resampled
  window `measuring.md` warns of; its leaned rows matched headless within 0.004.
- Bytes, from the build's `_astro`, with `gzip -9`: `arms` 4,074 (1,485) and the shared
  `baked-relief` 6,794 (3,205), together 10,868 (4,690) against the 10,208 (4,175) 0059 records;
  `seal` 4,529 (2,033), fetched only on a page with a seal, which the heraldry spec checks. No other
  chunk carries the seal's code.

### Alternatives considered

- **A copy of `arms.ts` for the seal**: two mounts to keep in step. Rejected.
- **One module drawing both kinds**: each kind's shader would ship to the other's pages. Rejected.

---

## Summary

| Item | Role | Where |
| --- | --- | --- |
| `seal` | the kind, its emblem and its wax | `src/lib/game/schema.ts` |
| `beside-end` | right of the text, first in the source | `src/lib/game/derive.ts`, `Species.astro` |
| `al-wahaa.svg` | the owner's emblem, framed and stamped | `data/media/emblems/` |
| the maps and stills | baked by `pnpm media:seal` | `data/media/seals/` |
| `SEAL`, `waxShades` | the sculpt's and the wax's values | `src/lib/art-effect/seal-look.ts` |
| `seal.frag` | the wax shader | `src/scripts/art-effect/glsl/` |
| `pnpm design:sharpness` | leaned against flat and still against live, three engines | `tools/design/sharpness.ts` |

## Open questions

- Whether to step the seal's column after all, so that a first visit between about 514 and 790 px
  wide shows no shift; the owner's call.
- Whether the arms' still should take the device-size stills of Decision 5, which answers 0059's open
  question with a measured method.
- A note on what the seal shows, like the arms' blazon: the owner's call, and canon only the owner
  gives.
- Frame timings in Firefox and WebKit, and anything on Windows or a phone.
