# ADR: The parchment is a lit hex chart the same engine draws, behind a 3D/2D switch

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-19
**Revised:** 2026-10-19, Decision 4 gains an addendum: terrain glyphs are things that repeat, each
terrain has a spread, and the pattern takes the shape of the hex
**Deciders:** Kori
**Scope:** The Atlas's second style, « Parchemin » (2D): how the reader reaches it, what it stores,
how the engine draws it, which camera it uses, how its glyphs reach the page, and how it is lit.
Amends 0043 Decision 4 (the options key gains the style and the legend). Leans on 0041 (the
worker and the shell-mounted engine), 0043 (the daylight, the grade and the reveal field), 0046
(the order of the four views) and 0047 (the haze). Does not change the 3D map, its views or its
sound (0045).

---

## Context

On 2026-10-19 the owner asked for a 2D parchment alternative to the 3D Atlas: plain pointy-top hex
tiles seen from straight above, with Iconify icons, keeping three.js for the lighting and the fog,
so that the map reads as a hexcrawl chart. The world already carries every fact the chart needs in
`src/lib/atlas/world/model.ts`, the engine already lights a scene with the setting's stars
(`src/lib/atlas/engine/daylight.ts`) and veils the Unknown with the reveal field, and the CSP in
`public/_headers` (`default-src 'self'`, no `connect-src`) forbids fetching icons from Iconify at
run time. The owner ruled on the shape of the feature in three rounds the same day, recorded in the
decisions below.

---

## Decision 1: A 3D/2D switch beside the view bar, stored with the other options

### Decision

- `MAP_STYLES` is `3d` and `parchment` (`src/lib/atlas/contract/style.ts`); 3D is the default.
- One round toggle button beside the view bar, `role="switch"`, named « Parchemin 2D » /
  "Parchment 2D" (`src/islands/atlas/StyleSwitch.tsx`).
  - It shows the current mode's icon, `mdi:video-3d` or `mdi:video-2d`.
  - On a toggle the icon spins out and the other spins in on a Motion spring, and the button dips
    on press. Motion's `reducedMotion="user"` turns the spin off.
- While the parchment is on, the four views are native `disabled` with the reason as their
  description, the camera locks to the top view with north up, and the keys 1 to 4 do nothing. The
  chosen view stays checked and comes back when the reader returns to 3D.
- The style and whether the legend is open live in `aubaine.atlas.settings`, read field by field. The
  legend is open by default, in both styles, until the reader closes it. The privacy pages name both
  under that key in both locales.

### Rationale

- The owner's rulings of 2026-10-19:
  - a separate switch over a fifth view;
  - then a single toggle over a segmented control;
  - then one button that animates like a light and dark toggle;
  - the legend open on a first visit.
- 0043 Decision 4 keeps every Atlas option under one key and rejected one key per option, so neither
  the style nor the legend gets a key of its own; `tests/unit/storage-keys.test.ts` passes unchanged.
- `tests/e2e/atlas-parchment.spec.ts` covers the lock and its release, the stored style and legend
  across a reload, the switch by keyboard, and a Swup round trip.

### Alternatives considered

- **A fifth view in the bar**: rejected by the owner. The parchment changes what is drawn, not only
  where the camera stands, and 0046 keeps « Libre » last.
- **A key of its own, like `aubaine.atlas.view`**: rejected by 0043 Decision 4. Reopens with that
  decision.

---

## Decision 2: One lit plane in the same scene, data packed by the worker, compiled on first use

### Decision

- `ParchmentView` (`src/lib/atlas/engine/parchment-view.ts`) owns a single plane whose patched
  `MeshStandardMaterial` (`MaterialLibrary.parchment()`, `glsl/parchment.glsl`) draws, per pixel:
  - the wash of the hex's type;
  - the hex hairline, coasts, borders, routes and sky lanes;
  - the glyphs of Decision 4;
  - selection and hover;
  - the fog of war from the reveal field, which fades the Unknown to blank paper under drifting mist;
  - the frame of the sheet.
- In parchment every 3D layer is hidden, not freed, so the switch back is instant.
- The worker packs the chart in the existing `textures` message (`kernel/parchment.ts`):
  - per level, one RGBA8 texel per hex: wash, glyph, flags and river edges;
  - one route texture: road, trail, rail and sea edges;
  - the sky lanes, taken from the same `laneEnd` as the 3D tubes.
  - Underground levels get their own textures from their rock and setting.
- The plane joins the scene and compiles only when a reader shows the intent to open the
  parchment: hovering, focusing or pressing the 3D/2D button (`AtlasEngine.prepareParchment`). The
  glyphs are drawn at the same moment. A reader who opens in 2D gets the plane in the boot's
  compile.

### Rationale

- One owner of the GPU and of the light, as 0041 Decision 2 asks: the parchment reuses the stars,
  the environment, the reveal field and the post pipeline instead of a second renderer.
- Every tile texture already travels in the `textures` message (`worker/session.ts`), so the chart
  adds no job and no loading weight.
- A 3D reader compiles nothing new. The parchment probe was removed from `engine/warm-up.ts`.
- `tests/unit/atlas-parchment.test.ts` asserts, on the Archipel:
  - reciprocal route edges, and no edge without a route;
  - the glyph priority and the flags;
  - the underground washes;
  - lanes equal to the 3D tube ends;
  - a deterministic build.

### Alternatives considered

- **An SVG or 2D canvas map over the page**: rejected, because it would not share the engine's
  light and fog, which the owner asked for, and would draw 12,288 hexes in the DOM or on the CPU.
- **Geometry per hex**: rejected; one plane and a fragment shader draw the same chart with one draw
  call.
- **Compiling the parchment at boot for everyone**: rejected on the work it adds to readers who never
  open it. Reopens if the first switch to 2D is judged too slow.

### Caveats

- The worker still builds the 3D map while the parchment shows, so switching back costs nothing.
- A tap without hover, as on a touch screen, prepares the parchment only on the press. The first
  such switch drew one 50 ms frame before the climb began, against 16.8 ms for every switch after a
  hover; both measured as in Decision 3.

---

## Decision 3: An orthographic camera at a fixed eye height

### Decision

- In parchment the engine renders through an `OrthographicCamera`. Its frustum half height is
  `dist · tan(fov / 2)` of the top view, so `rig.dist`, the zoom range and the framing keep their
  meaning. Its eye sits at height 200 with near 1 and far 400 (`CameraRig.applyParchment`).
- **Entering the parchment.**
  - The camera climbs, in perspective, from whichever view is chosen to the top view with north up,
    in one eased tilt of 0.7 s (`TILT_SECONDS` in `camera-rig.ts`). From the top view itself the
    climb has no angle to cover and is only a dissolve.
  - The sheet dissolves in over the 3D map during the last three quarters of the climb
    (`PAPER_FADE_SPAN` in `atlas-engine.ts`).
    Drawn last, it covers the water and the mist too.
  - During the dissolve, the grade moves from the 3D values to the parchment's, the bloom fades out,
    the labels glide down under their glyphs, and the ink label colours take over halfway.
  - Once the tilt ends overhead, the orthographic camera takes over with nothing left to change on
    screen.
- **Leaving it.** The same move is played backwards:
  - the 3D map is drawn under the paper from the first frame;
  - the camera tilts from overhead down into the chosen view in the same eased 0.7 s;
  - the paper dissolves out over the first three quarters of the tilt (`PAPER_FADE_SPAN`);
  - the grade, the bloom, the labels and their ink return in the same blend.
- **Turning back.** A switch in the middle of either move turns it around from the angles and the
  amount of paper on screen at that moment (`StyleShift` in `atlas-engine.ts`).
- **Without animation.** Under reduced motion both cuts are immediate. The engine sets `data-style`
  on the map container when the sheet is drawn, so the ink labels never show over the 3D map.
- Picking uses `Raycaster.setFromCamera` for both cameras (`engine/input.ts`). Labels and the HUD
  accept either camera.
- Settlement, hold, quarter and landmark labels hang below their hex's glyph.
- The labels are placed on the frame the camera settles. Before, they could stay one zoom step
  behind under reduced motion.

### Rationale

- From straight above, an orthographic projection puts everything at its x and z whatever its
  height, so labels at terrain height, aloft labels at 7.6, underground floors and the travel path
  all land on their hex without flattening each one.
- The owner's requests of 2026-10-19:
  - the way into the parchment to move like the way out;
  - then the way in to be as smooth as the way out, from every view;
  - then the way out to be as smooth as the new way in.
- Measured on 2026-10-19 on the built site, in Chromium with ANGLE on Metal at 1280 × 800, High,
  after a hover on the button: the longest frame between two `requestAnimationFrame` callbacks
  during each switch, on the first round and on the second.

  | View | To 2D, first | To 3D, first | To 2D, second | To 3D, second |
  | ---- | ------------ | ------------ | ------------- | ------------- |
  | Dessus | 33.3 ms | 16.8 ms | 16.8 ms | 16.8 ms |
  | 3/4 | 16.8 ms | 16.8 ms | 16.8 ms | 16.8 ms |
  | Relief | 16.8 ms | 16.8 ms | 16.8 ms | 16.8 ms |
  | Libre | 16.8 ms | 16.8 ms | 16.8 ms | 16.8 ms |

  The climb with the exponential damping and a hard cut at the end had drawn frames of up to
  116.6 ms on the first switch.
- `tests/unit/atlas-camera.test.ts` asserts:
  - the same 0.7 s climb and descent from and to every view, with a rising progress;
  - a turn back from the middle of a climb without a jump;
  - the snap without animation;
  - the framing and a vertical centre ray.
- `tests/e2e/atlas-parchment.spec.ts` asserts, with animations on, that the 3D map is still drawn
  just after the click into 2D and the paper just after the click back, before each gives way.
- The settle fix has a regression test, `the labels stand where the camera stops after every zoom step`,
  which failed by 27.6 px twice before the fix and passed twice after.

### Alternatives considered

- **The perspective top view with every height flattened to 0**: rejected, because each overlay,
  label and pick would need its own special case.

---

## Decision 4: Committed glyphs from Iconify, patterned for terrain and single for places

### Decision

- The glyphs are game-icons, fetched from `api.iconify.design` at authoring time and committed to
  `data/media/icons/game-icons/`, each a single path. The set is already declared under CC BY 3.0 in
  `src/lib/rights/attribution.ts`.
- `src/lib/atlas/engine/parchment-glyphs.ts` imports them raw. It is reached only through `import()`,
  so the engine chunk does not carry them.
- `engine/glyph-atlas.ts` fills each path into a canvas and builds a mipmapped `DataArrayTexture`:
  256 px a layer, 128 on Low.
- **Terrain.** A terrain hex is filled with 19 small copies of its type's glyph on a triangular
  lattice, step 0.33 (`TERRAIN_PATTERN` in `materials/library.ts`).
  - The copies are lightly flipped and shifted, and inked at 0.45 in a dark shade of the wash.
  - They fade out below 3 to 7 pixels.
  - The lattice carries across a shared edge, so neighbouring hexes of one type read as one field.
- **Places.** Landmarks, settlements and cave mouths carry one large, full-ink glyph. A place
  outranks a cave, which outranks the terrain.
- The tables live in `src/lib/atlas/contract/parchment.ts`, typed so a missing tile type, setting or
  landmark kind fails to compile. The legend shows one glyph per type, the pattern's unit.

### Rationale

- The owner's rulings of 2026-10-19:
  - first, glyphs for terrain and places;
  - then far fewer icons, because one large icon per hex repeated information the colour already
    gave;
  - finally, the same glyphs as a dense, light pattern, "decoration while being information".
- Committing the files keeps the CSP and the privacy pages' promise of no third-party script.
  `tests/e2e/security-policy.spec.ts` loads the glyph chunk under the deployed policy with no
  violation.
- `tests/data/atlas.test.ts` asserts that every glyph has a single-path file and is used by a table.

### Alternatives considered

- **Iconify at run time (`@iconify/react` or the API)**: rejected by the CSP and the privacy pages.
  Reopens only with a change to both.
- **One large glyph centred on every hex**: rejected by the owner on 2026-10-19 as too many icons
  that duplicated the colour.
- **Glyphs only on hexes that stand out from their neighbours**: built the same day (89 hexes on the
  Archipel instead of 4,744) and replaced by the pattern at the owner's request, because it dropped
  the terrain from most hexes.
- **Procedural ink patterns drawn in the shader**: considered, and set aside for the glyph pattern
  the owner chose, which keeps the Iconify glyphs as the single source of the look.
- **Glyphs in the engine chunk**: rejected on size; the glyph chunk is 58,037 bytes (see 0041's
  addendum of 2026-10-19).

### Caveats

- The glyph choice per type is the owner's to revise in one table.

### Addendum (2026-10-19): glyphs that repeat, a spread per terrain, the shape of the hex

- The owner's ruling of 2026-10-19, after seeing the desert: a terrain glyph must be one thing that
  occurs many times in that terrain, as trees do in a forest. The desert's sun-and-cactus scene,
  repeated, made no sense. The copies should also be as dense as the terrain, and they should sit
  in a hexagon pointing north like the map hex, not in rows with a flat top.
- **Glyphs.** Each change follows the type's description in `data/atlas/vocabularies.json`:
  - desert, "shifting dunes": `waves` for the dune ripples, in place of `desert`;
  - badlands, "gullied red sandstone and mesas": `rock`, in place of `falling-rocks`;
  - swamp: `reed`, in place of the `swamp` scene;
  - highlands, "windswept": `windy-stripes`, in place of `hills`, which draws hills in a filled
    square under a sun;
  - glacier: `snowflake-2`. `frozen-block` and its icicles stay with the ice cave;
  - temperate forest, "oak and beech": `beech`, in place of `forest`, which draws conifers like the
    taiga's `pine-tree`;
  - mine galleries: `ore`, in place of `mining`, a miner at work;
  - roots: `root-tip`, in place of `tree-roots`, a stump.
- **Spread.** `TILE_PATTERNS` and `SETTING_PATTERNS` in `src/lib/atlas/contract/parchment.ts` give
  each terrain a glyph and a spread, and replace `TILE_GLYPHS` and `SETTING_GLYPHS`.
  - `dense` keeps 19 copies: 2 rings, spacing 0.33, scale 0.82. Forests, crops, flowers and houses
    are dense.
  - `scattered` draws 7 larger copies: 1 ring, spacing 0.6, scale 0.65, so a copy is 0.39 across
    instead of 0.27. Dunes, rocks, peaks and giant mushrooms are scattered; the tables hold the
    rest.
  - Both live in `PATTERN_LATTICES` in `materials/library.ts`. The worker sets
    `PARCHMENT_FLAGS.scattered` in the flags channel, and the shader picks the lattice from it.
- **Shape.** `glyphCover` in `materials/glsl/parchment.glsl` turns the lattice by a quarter turn.
  The rows of 3, 4, 5, 4 and 3 copies, a hexagon with a flat top, become columns, a hexagon pointing
  north like the map hex. A scattered hex has a copy at each corner and one in the centre.
- **Correction.** Each hex draws its own cluster around its centre, so the lattice does not carry
  across a shared edge as this decision states. The gap between two clusters keeps each hex
  readable within a field of one type.
- `tests/unit/atlas-parchment.test.ts` asserts the glyph and the spread flag of every surface and
  underground hex. On 2026-10-19, the built site was screenshotted at every patterned tile type of
  the Archipel and at every patterned setting of stratum 1, with no console error or warning.
- **Alternatives.**
  - A dune or mesa glyph: the game-icons listing on `api.iconify.design`, searched on 2026-10-19,
    has none. Reopens if one is published.
  - A single cactus for the desert: rejected, since the description names dunes and no cactus.
  - One continuous lattice across hexes of one type: rejected, since the owner asked for drawings in
    the shape of the hex. Reopens if the hex outline is to fade inside a field.
  - More spreads than two: not needed for the types the vocabulary describes. Reopens with a type
    that fits neither.
- **Caveat.** `windy-stripes` names the wind of the highlands, not their ground. The three
  game-icons glyphs named for hills each carry more than a hill: `hills` a filled square and a sun,
  `hill-fort` a castle, `hill-conquest` a flag.

---

## Decision 5: The sheet keeps the live daylight but exposes for flat paper

### Decision

- `gradeParchment` (`engine/daylight.ts`), still the single writer of the grade, sets the exposure
  from the irradiance a flat sheet receives from the key and fill lights, clamped to 0.8 to 1.8, with
  saturation 1.1 and no lift. The daylight's tint and direction stay live.
- Under the shader, a lamp floor keeps the paper readable at night, at dusk and underground.
- Bloom fades out during the dissolve and is off in parchment (`PostPipeline.setBloom` takes a
  level). The beacon is replaced by the inked selection, and the travel path is
  drawn in normal-blended ink, because additive gold and cyan vanish on cream.

### Rationale

- A flat plane has no slope facing a low sun, so a fixed exposure swung the paper from 149 to 211 in
  luma between 16:36 and noon.
- With the flat-sheet exposure, the mean luma of the map area at 1440 × 900, High:

  | Hour | Mean luma |
  | ---- | --------- |
  | 7:00 | 147 |
  | 9:00 | 185 |
  | 12:00 | 187 |
  | 16:36 | 168 |
  | 19:00 | 149 |
  | 22:00 | 139 |

  The values were read from screenshots of the built site with PIL on 2026-10-19: daylight readable
  and steady, dimming toward night without going dark, as the owner asked.

### Alternatives considered

- **A fixed reading lamp**: rejected by the owner, who chose the live daylight kept readable.
- **No ACES in parchment**: rejected; tuning the exposure keeps one grade shader.

### Caveats

- The brightness was measured in headless Chromium with software WebGL, on the Archipel, and judged
  on screenshots, not on the owner's screen.
