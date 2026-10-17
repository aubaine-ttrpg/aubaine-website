# ADR: The Unknown rises as a mist bank, and a Relief view looks across it

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-16
**Revised:** 2026-10-16, Decision 2 gains an addendum: the mist keeps one form out to the horizon
**Revised:** 2026-10-17, Decision 2 is reversed by 0047: the Unknown is a haze marched
through, not a mist bank
**Deciders:** Kori
**Scope:** The fourth camera view of the Atlas and the volume of « L'Inconnue »: how the fog of war of
0043 Decision 3 rises above the sea, where its mesh is built and how much it costs, and how the
labels and the pointer follow it. Amends 0043 Decision 3. Does not change the reveal field itself,
which 0043 records, nor the Atlas's sound (0045).

---

## Context

0043 Decision 3 drew the fog of war flat: the water shader paints the veil colour where the reveal
field reads unexplored, and the sky dome shows the same veil below the horizon. On 2026-10-16 the
owner asked for « L'Inconnue » to have volume, so that in a perspective view it does not sit at the
level of the sea but reads as something more imposing, without costing performance, and for a
« Relief » view to show it, with « Libre » kept last because it is the free camera. The Atlas then
had three views, `top`, `iso` and `free` (`src/lib/atlas/contract/camera.ts`).

---

## Decision 1: Relief is the third view, and Libre stays last

### Decision

- `VIEWS` is `top`, `iso`, `relief`, `free`. The view bar lists them in that order and the keys 1 to
  4 follow it, so « Libre » moves from 3 to 4.
- Relief is a low oblique view: its pitch rises with distance from 0.3 rad close up to 0.55 rad
  (`reliefPitch` in `src/lib/atlas/engine/camera-rig.ts`), always below the lowest pitch of the 3/4
  view. It rotates like the 3/4 view, with a field of view of 34° and a distance from 4 to 330.
- Its icon is `mdi:terrain`, and its words are « Relief », « Vue rasante, le relief en volume » in
  French and "Relief", "Low oblique view, the land in volume" in English. The stored view
  (`aubaine.atlas.view`) accepts it, and the privacy pages name it.

### Rationale

- The owner's ruling of 2026-10-16: add a relief view, with « Libre » always last.
- A grazing angle is what makes height read on screen; the 3/4 view keeps its strategy pitch for
  reading the map.
- `tests/unit/atlas-camera.test.ts` asserts the pitch stays under the 3/4 view's at every distance
  and holds through a zoom; `tests/e2e/atlas.spec.ts` asserts the order and the keys.

### Alternatives considered

- **Lower the 3/4 view instead of adding one**: rejected, because the 3/4 view is the default and
  is tuned for reading labels and borders. Reopens if readers rarely leave Relief.
- **Relief as the last view**: rejected by the owner, who wants the free camera last.

---

## Decision 2: The fog rises as a mist bank, built in the worker from the reveal field

### Decision

- `buildMist` in `src/lib/atlas/kernel/mist.ts` runs in the worker with the water job. It lays a
  grid over the reveal field at the tier's `mistStep` (3 on Low, 2 on High, 1.5 on Ultra, in
  `src/lib/atlas/contract/quality.ts`) and keeps only the cells where the mist has risen, so no
  vertex lies over the known world.
- The height is baked: `mistHeight` rises with the reveal value from 0.35 to 1 to a top of 6 units,
  adds a broad roll of up to 2.5 and puffs of up to 2, and falls to the sea within 24 units of the
  field's edge. Normals come from the same heights.
- The `mist` piece draws in one call after the water (`src/lib/atlas/engine/materials/glsl/mist.vert`
  and `mist.frag`): a slow swell of 0.45 units, a foot that fades in from the sea with the reveal
  value, drifting noise, light from the key star with a rim against the light, brighter crests,
  cloud shadows, and the veil colour taking over with distance and at the edge of the field, where
  the sky dome continues it.
- The « L'Inconnue » marks sit on the mist's crest. The pointer marches through the mist in 16 steps
  before it reaches the ground (`mistInFront` in `src/lib/atlas/engine/atlas-engine.ts`), so hovering
  the mist names « L'Inconnue » and clicking it selects nothing, even where a known tile lies behind
  it.

### Rationale

- The owner chose a rising mist bank over a low layer and a storm wall on 2026-10-16.
- Baking the height in the worker keeps the main thread's work to drawing, as 0041 Decision 2 asks,
  and lets the labels and the pointer read the same `mistHeight` the mesh was built from;
  `tests/unit/atlas-mist.test.ts` asserts that agreement, that the mist never covers land, lies flat
  on the known sea, stands at full height deep in the Unknown and never passes its ceiling.
- The field already decides where the Unknown is, so the mist adds no data and follows any world.
- Measured on 2026-10-16 with `buildMist` on the Archipel, median of five runs in Node on the
  development machine (the browser worker was not timed):

  | Tier | Step | Vertices | Triangles | Build |
  | ---- | ---- | -------- | --------- | ----- |
  | Low | 3 | 7,197 | 13,524 | 1.5 ms |
  | High | 2 | 15,723 | 30,130 | 3.2 ms |
  | Ultra | 1.5 | 27,517 | 53,278 | 5.7 ms |

  The open sea of the same world is 119,168 vertices. The mist adds one draw call and one material.
- Ending the mist at sea level and in the veil colour near the field's edge hides where its mesh
  stops; without it the top ended in a cliff against the sky dome.

### Alternatives considered

- **Volumetric fog in a post pass**: a ray march per pixel would cost on every frame what the mesh
  costs once. Rejected. Reopens if the mist must be seen from inside.
- **Billboard clouds along the edge**: they read as a row of sprites from a low angle, and their
  sorting costs more than one mesh. Rejected.
- **A mesh over the whole field**: it would put vertices over the known world that never show.
  Rejected.

### Caveats

- GPU time was not measured, for the reason 0043 Decision 1 gives: the bench varied by up to a
  factor of 2.6 between runs of one build. The added cost is one draw call and the fill of the mist
  on screen.
- An automatic step-down keeps the mist of the starting tier, as it keeps the terrain.
- From under the mist's top the camera sees only the sea, because the mist is drawn from above.
- The heights, the rise and the shading were tuned by eye on screenshots at one hour of the default
  sky, and the owner has not yet judged them.

### Addendum (2026-10-16): one form out to the horizon

- The owner found a hard diagonal line between the mist and a flat pale veil near the north-west of
  the Archipel, and asked for one form everywhere. It was the edge of the reveal field: within 24 to
  31 units of it the mist sank to the sea and took the veil colour, and the nearer of the two edges
  drew a crease at the corner. There the known sea also comes within 34 units of the field's edge,
  so the field never reaches full fog.
- The mist no longer sinks or fades at the field's edge. Over its last 40 units (`MIST.settle`) the
  fog closes, on the CPU and in the shader alike, and the rolls ease to one plateau height. A flat
  apron of 8 triangles carries that height from the edge to 1,600 units on every side.
- The puffs moved from the mesh to the fragment shader, as a bump read from the noise texture, so
  the texture looks the same near and far. Low skips the bump, and a pixel past the melt distance
  returns the veil at once.
- Far away the mist melts into the veil by distance from the camera only, from 700 to 1,400 units,
  inside the sky dome's 1,500, so no line is drawn in the world.
- The pointer now counts the mist only where it has height; at height 0 it had named every known sea
  tile « L'Inconnue ». `tests/e2e/atlas.spec.ts` covers both, and `tests/unit/atlas-mist.test.ts`
  asserts that the edge of the field and the horizon share one height.
- Measured again with the same method:

  | Tier | Vertices | Triangles | Build |
  | ---- | -------- | --------- | ----- |
  | Low | 7,265 | 13,670 | 3.6 ms |
  | High | 15,832 | 30,368 | 6.2 ms |
  | Ultra | 27,769 | 53,810 | 10.5 ms |

- The apron covers everything past the field, where the sky dome was drawn before; the dome now
  draws only above the horizon of the mist. On 2026-10-16, with Playwright's headless Chromium on
  the development machine, which renders WebGL in software, the median of 60 frame intervals at 1280
  by 800 was the same with and without the apron: 366.6 ms on Low in the zoomed-out Relief view,
  366.7 ms on Low in the zoomed-out top view, 2,883.2 ms on High in Relief, and 2,516.6 against
  2,533.2 ms on High in the top view. Those intervals fall on display refreshes, so the comparison
  cannot see a difference smaller than one refresh. A GPU was not measured.

### Addendum (2026-10-17): reversed by 0047

The owner found the bank too solid, « like a weird flan », and then, once marched with a ceiling,
« like a mountain ». 0047 replaces it with a haze that thickens from the edge of the known and has no
surface. The apron to 1,600 units and the melt by distance from the camera are kept; the rolls, the
lit surface, the crest the labels sat on and the pointer's march through the mist are gone.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Relief view | Third view, low pitch, Libre last | `src/lib/atlas/contract/camera.ts`, `src/lib/atlas/engine/camera-rig.ts` |
| Mist mesh | Ring of the Unknown, height baked in the worker | `src/lib/atlas/kernel/mist.ts` |
| Mist shader | Swell, light, crests, melt into the veil | `src/lib/atlas/engine/materials/glsl/mist.vert`, `mist.frag` |
| Agreement | Labels on the crest, pointer through the mist | `src/lib/atlas/engine/atlas-engine.ts` |
| Tests | Pitch, coverage, heights, order of views | `tests/unit/atlas-camera.test.ts`, `tests/unit/atlas-mist.test.ts`, `tests/e2e/atlas.spec.ts` |
