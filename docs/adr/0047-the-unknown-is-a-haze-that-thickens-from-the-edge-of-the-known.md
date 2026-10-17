# ADR: The Unknown is a haze that thickens from the edge of the known

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-17
**Revised:** 2026-10-17, Decision 2 gains an addendum: each view enters the haze once, through a
flat roof on walls
**Deciders:** Kori
**Scope:** How « L'Inconnue » is drawn: the haze carried by the reveal field, the march through
it, the envelope that bounds the march, and what it costs. Reverses 0046 Decision 2 and its
addendum; amends 0043 Decision 3, whose field gains a second channel. Does not change which hexes are
unexplored (0043), nor the Relief view (0046 Decision 1).

---

## Context

0046 Decision 2 raised the fog into a mist bank: a lit surface 6 units high with rolls and puffs.
Between 2026-10-16 and 2026-10-17 the owner judged it in three steps: first a line between two forms
of fog (fixed by the addendum of 0046), then « it should really feel like a mist, not like a weird
flan », and then, on a march through a density field with a ceiling, « it really seems like there is
nothing and then there is like a mountain, it doesn't look like fog ». The reveal field of 0043 goes
from 0 to 1 across 12 units and stays at 1 beyond (`BAND` in `src/lib/atlas/kernel/reveal.ts`), so any
fog whose density follows it turns opaque a few units past the edge of the known, and looks like a
wall from the side.

---

## Decision 1: The reveal field carries a haze ramp beside the fog

### Decision

- `buildReveal` writes `haze` beside `values` in `RevealField` (`src/lib/atlas/contract/scene.ts`).
  It reads the same signed distance as the fog, from 30 units inside the reach of the known to 14
  units past the band (`HAZE` in `src/lib/atlas/kernel/reveal.ts`), so it starts over known water and
  is full shortly after the water stops being drawn. The border texels are full.
- The engine uploads both as one two-channel texture (`applyReveal`, `RGFormat`): the fog stays in
  red, where every shader already reads it through `unexplored()`, and the haze is green, read by
  `haze()` in `src/lib/atlas/engine/materials/glsl/veil.glsl`. The CPU reads it with `hazeAt`.
- Which hexes are unexplored, the hover and click rules, and where the water is drawn do not change.

### Rationale

- The haze needs a front much deeper than the fog's 12-unit band to look like fog, and it must be
  dense by the point where the water ends (`hexHidden` in `src/lib/atlas/kernel/reveal.ts`), because
  nothing is drawn beneath it past there. Starting the ramp over known water satisfies both, with the
  real sea under every part of the haze that is thin enough to see through.
- One channel more in the same texture costs no extra fetch, since the shader samples the texel
  anyway. `buildReveal` took 71.1 ms in Node on the development machine for 488,125 texels with both
  channels, measured on the Archipel on 2026-10-17; it was not timed before the change.

### Alternatives considered

- **A painted far sea under the haze, past the drawn water**: rejected, because the seam with the
  real water showed wherever the haze was thin, and the sea's shading would have been written twice.
- **Draw the water further into the Unknown**: rejected, because it would add a ring of water hexes
  as wide as the haze front. Reopens if the haze must start later.

---

## Decision 2: The haze is marched through and has no surface

### Decision

- The mist mesh (`buildMist` in `src/lib/atlas/kernel/mist.ts`) is only an envelope: a 4-unit grid at
  12 units wherever the haze has begun, plus the flat apron of 0046 to 1,600 units, drawn on both
  sides. It shows nothing itself.
- `src/lib/atlas/engine/materials/glsl/mist.frag` marches each pixel from where the view enters the
  envelope, or from the camera when the camera is inside it, to the sea or 120 units, in 3 segments on
  Low, 6 on High and 8 on Ultra. Density is `0.7 × haze^1.6`, varied by drifting noise, and falls
  exponentially with height over a scale of 0.8 units at the front to 6 deep in the Unknown, so it
  has no top. Each segment integrates that fall exactly, so few steps leave no bands.
- The colour is the veil's, slightly paler where the haze is thin and brighter higher up, with a glow
  toward the light. The noise grows from soft at the front to wispy inside. A pixel stops marching
  once 98 % opaque; where the sea is not drawn, what is left closes in the veil colour; far away the
  haze melts into the veil between 700 and 1,400 units from the camera.
- The pointer reads the sea under the haze again, and the « L'Inconnue » marks are back at their own
  height (`unexploredSea` and `markUnexplored` in `src/lib/atlas/engine/atlas-engine.ts`), because the
  haze has no surface to stand on.

### Rationale

- The owner's two rulings above. Fog looks like fog because opacity grows with the distance looked
  through it; a surface or a ceiling draws a line that fog does not have.
- Screenshots on 2026-10-17, at the opening hour on High, compared the surface, the march with a
  ceiling and this haze in the Relief view near Givrecroc, the far Relief view and the top view north
  of Givrecroc: the sea now runs into a soft bank with no top, the world sits in a ring of haze, and
  from above the front breaks into patches with the sea between them.
- Measured on 2026-10-17 with Playwright's headless Chromium, which renders WebGL in software, as the
  median of 60 frame intervals at 1280 by 800 against the surface of 0046 Decision 2:

  | Tier | View | Surface | Haze |
  | ---- | ---- | ------- | ---- |
  | Low | Relief, zoomed out | 366.6 ms | 383.4 ms |
  | Low | Top, zoomed out | 366.7 ms | 399.9 ms |
  | High | Relief, zoomed out | 2,883.2 ms | 3,016.5 ms |
  | High | Top, zoomed out | 2,516.6 ms | 2,600.0 ms |

  Before Low was cut to 3 segments and one noise layer it measured 433.3 and 449.9 ms. A GPU was not
  measured.
- The envelope is 5,892 vertices and 11,174 triangles on the 4-unit grid all tiers now share, built
  in 1.1 ms, measured on the Archipel with `buildMist`; it was 10,337 vertices on the 3-unit grid Low
  used before. The tiers differ by the number of segments instead.

### Alternatives considered

- **A lit surface (0046 Decision 2)**: rejected by the owner as a flan.
- **A march through density with a ceiling**: tried on 2026-10-17 and rejected by the owner as a
  mountain.
- **Stacked translucent sheets**: not built, because sheets read as layers from the grazing angle of
  the Relief view.

### Caveats

- Every pixel of haze on screen runs the march, so the cost grows with how much of the view is
  Unknown. Software rendering showed 3 to 9 % on frame time; real GPUs, and phones above all, were not
  measured.
- The haze reaches 30 units over the known sea, thinly, so the edge of the known looks misty even
  though hovering it still names the sea.
- The density, the heights and the colours were tuned by eye at one hour of the default sky.

### Addendum (2026-10-17): each view enters the haze once

- The owner judged the haze right except in the Relief and 3/4 views, where at night near Île de
  Braise it read as « a harsh hard shape just popping ». Every face of the envelope a view crossed
  ran the march and blended its result, so a view that crossed the envelope more than once was hazed
  again at each crossing, in the order the triangles happened to be drawn. That drew polygons, and
  bright streaks along the grid.
- The envelope (`buildMist` in `src/lib/atlas/kernel/mist.ts`) is now a flat roof at 12 units over
  every 4-unit cell the haze touches, widened by one cell, with vertical walls down to the sea where
  a covered cell meets an uncovered one, plus the apron. Its faces point out of the room it bounds.
- One mesh is drawn twice. The `mist-depth` pass writes only depth, at render order 3.5, then the
  `mist` pass marches, at 4. Both use `mist.vert`, whose position is `invariant`, so only the
  nearest face passes the depth test and each pixel marches once.
- The engine tells both passes whether the camera is inside the room (`uInMist`, from
  `mistRoomCovers` and the camera's height), and each pass keeps only the faces that matter: those a
  view enters by when the camera is outside, those it leaves by when it is inside, where the march
  starts at the camera. Kept together, a wall seen edge on tied in depth with the roof, the hidden
  face won the tie and was thrown away, and the sea showed through as a thin dark line. The earlier
  test, haze above zero under the camera, also disagreed with the roof along the widened rim.
- The haze whitens with daylight: its lit side moves 38 % of the way to white at full day and 6 % at
  night, so at night it stays close to the veil instead of glowing against a dark sea.
- The fog of distance now tints the haze toward the veil without raising its opacity. The sea under
  it is already fogged by `atlasFog`, so raising the haze's opacity by the same amount fogged the sea
  twice, and the first pixels past the 1 % cut-off jumped to that opacity at once: a dark, speckled
  rim where the haze begins. Where no sea is drawn, the haze is opaque through its own closing, and
  a pixel past 1,400 units is filled with the veil only where the fog is full.
- `tests/unit/atlas-mist.test.ts` asserts the roof is flat on walls, that it covers every point where
  the haze has begun, that the depth pass has the same room, and that `mistRoomCovers` agrees with
  the roof cell by cell; that last test fails under the earlier test.
- Screenshots on 2026-10-17 with Playwright's headless Chromium, on High, compared the Relief and
  3/4 views near Île de Braise by night and by day, the far Relief view and the Relief view near
  Givrecroc. A build that painted the envelope's faces in flat colours placed the dark line on a
  wall seen edge on. In the Relief view near Givrecroc, the darkest pixel column there sat 5.1
  levels of luminance below its neighbours before the change and 1.9 after, averaged over 151 rows,
  which no longer stands out from the waves. Against a frame of the same view with the haze turned
  off, 85 of 2,000 blocks of 32 by 8 pixels around the start of the haze were darker than the bare
  sea by more than 2 levels before the rim was fixed, by up to 6.4, and none after.
- The envelope is 6,338 vertices and 12,096 triangles on the Archipel, built in 1.7 ms as the median
  of seven runs in Node; it is uploaded twice, once per pass. `mistRoomCovers` takes 0.75 ms on the
  main thread each time the reveal field changes.
- The depth pass adds one draw call, and its fragments and the march's both discard, which turns
  off early depth rejection for them. Measured with the method and views of the table above, against
  its Haze column:

  | Tier | View | Haze | Entered once |
  | ---- | ---- | ---- | ------------ |
  | Low | Relief, zoomed out | 383.4 ms | 400.1 ms |
  | Low | Top, zoomed out | 399.9 ms | 416.5 ms |
  | High | Relief, zoomed out | 3,016.5 ms | 3,083.3 ms |
  | High | Top, zoomed out | 2,600.0 ms | 2,650.0 ms |

  That is one display refresh on Low and about 2 % on High, in software rendering; a GPU was not
  measured.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Haze ramp | Second channel of the reveal field | `src/lib/atlas/kernel/reveal.ts`, `src/lib/atlas/engine/atlas-engine.ts` |
| Envelope | Where the march starts, 4-unit grid and apron | `src/lib/atlas/kernel/mist.ts` |
| March | Exponential haze by height, integrated per segment | `src/lib/atlas/engine/materials/glsl/mist.frag` |
| Tests | Envelope over the haze, never over land, one height at the edges | `tests/unit/atlas-mist.test.ts` |
