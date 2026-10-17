# ADR: The Atlas renders scaled tiers under three stars, behind a fog of war

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-16
**Revised:** 2026-10-16, Decision 4 gains an addendum: the sound and its volume leave
`aubaine.atlas.settings` for the site-wide `aubaine.sound` of 0045
**Revised:** 2026-10-16, Decision 3 gains an addendum: the fog rises as a mist bank,
recorded in 0046
**Revised:** 2026-10-17, Decision 3 gains a second addendum: the field carries a haze ramp, and
the pointer and the marks read the sea again (0047)
**Deciders:** Kori
**Scope:** The image of the Atlas map and what the Atlas stores: the render resolution of each tier
and how Auto picks one, the post pipeline and its screen effect, the lighting from the setting's
three stars, the environment baked from the sky, the fog of war and the open sea, and the options
key. Reverses 0041 Decision 5. Does not cover the start-up screen (0044), nor how the shell mounts
the map and where its work runs (0041 Decisions 1 and 2). The world data stays placeholder.

---

## Context

0041 Decision 5 kept every tier at the device resolution and stored the tier under
`aubaine.atlas.quality`. On 2026-10-15 the owner asked for Low at 75 % and High at 90 % under a
screen effect, a fog of war instead of a map that ends in a rectangle, an HDR environment with PBR
lighting, colour grading, bloom and antialiasing, lighting that follows
`docs/aubaine/triple_star_lighting_bible_godot_2_5d.docx`, options sorted by category, and as many
readers as possible on Ultra. On 2026-10-16, having seen the result, the owner found the map too
bright, asked that the stars stay but the image serve players first, and asked for much more open
sea before the fog, named « L'Inconnue ».

---

## Decision 1: Low and High render below the device resolution under a screen effect, and Auto starts a desktop on Ultra

### Decision

- `TIER_SETTINGS` in `src/lib/atlas/contract/quality.ts` gives each tier a render scale, applied to
  `min(devicePixelRatio, 2)`: 0.75 on Low, 0.9 on High, 1 on Ultra. The scene and the bloom chain
  render at that size.
- Antialiasing is FXAA on Low and MSAA on High and Ultra: 4 samples, or 2 on High at 1.5 DPR or more
  and on Ultra above 8,300,000 render pixels, never more than the GPU allows.
- `PostPipeline` in `src/lib/atlas/engine/post.ts`:
  - the grade pass adds the bloom, then applies exposure and white balance, ACES tone mapping, lift,
    gamma and gain, saturation and contrast;
  - below scale 1, or with FXAA, the grade writes an 8-bit target and a present pass draws the
    canvas: FXAA 3.11 on Low, a five-tap Catmull-Rom upscale on High, each followed by a
    contrast-adaptive sharpen;
  - Ultra grades straight to the canvas, so its pass count is unchanged;
  - the post materials compile ahead with the scene, through a probe scene and `compileAsync`.
- The screen effect, in `src/lib/atlas/engine/materials/glsl/screen.glsl`: scanlines at a pitch of
  `max(2, round(height / 360))` device pixels, weaker where the pitch is 2; a slight radial
  chromatic aberration; a vignette; and grain that changes only when a frame is drawn. It is a
  uniform, so « Effet d'écran » never recompiles, and it covers the canvas, never the labels.
- Auto starts a desktop GPU outside the low-end list on Ultra and a touch device on High. A software
  renderer, a known low-end GPU, or two cores (four with touch) start on Low. `PaceCheck` in
  `src/lib/atlas/engine/pace-check.ts` times 20 consecutive frames while the camera moves; a median
  above 25 ms steps Auto down, and every tier change restarts the check, so Auto can go from Ultra to
  High to Low. An automatic step-down keeps the terrain the worker already built. Auto still never
  steps up and is never stored.

### Rationale

- The owner's request of 2026-10-15, which reverses "detail, never resolution" in 0041 Decision 5.
- The renderer string cannot predict what a GPU holds, and a measured frame time can. Starting on
  Ultra and stepping down puts every desktop that can hold Ultra on it, which is the owner's goal.
- Re-tessellating after a step-down would stream new terrain while the next check runs, so that
  check would time the uploads rather than the tier.
- The 360-line pitch is the screen of the start-up boot (`src/scripts/atlas-boot.ts`), rounded to
  whole pixels on the map so the lines stay crisp.

### Alternatives considered

- **The device resolution on every tier**: reversed by the owner. Reopens if the softened borders at
  75 % are judged worse than the saving.
- **Dynamic resolution under load**: still rejected, as in 0041. The resolution stays a property of
  the tier the reader chose. Reopens if a fixed tier cannot hold its frame rate on the devices Auto
  puts on Low.
- **SMAA or TAA on Low**: three 0.186.1 ships both (`SMAAPass` and `TAARenderPass` in
  `three/examples/jsm/postprocessing/`), but SMAA runs edge, weight and blend passes with two lookup
  textures, and TAA keeps a history target. FXAA is one pass that also performs the upscale. Reopens
  if FXAA's softening on Low is judged too strong.
- **Auto on High with one step-down, as before**: rejected, because a desktop able to hold Ultra would
  never reach it unless its reader asked. Reopens if step-downs on capable machines show up in
  testing.

### Caveats

- Borders, the hex grid and the edge of the fog are drawn in shaders, so they soften at 75 % and
  90 %. Labels are DOM and stay sharp. The sharpen and the screen effect reduce the loss without
  cancelling it.
- Scanlines are part of the canvas, so a screenshot keeps them unless the reader turns the effect
  off.
- On a slow desktop, Auto spends the first 20 moving frames on Ultra before stepping down, and up to
  20 more on High. With « Animations » off, the first drag is timed instead of the opening flight.
- After an automatic step-down the terrain keeps the rings of the starting tier, so Low can draw
  more terrain vertices than it would have built.
- The 25 ms and 20 frame thresholds are carried over from 0041, not measured again.
- GPU time could not be compared before and after on the one machine measured.
  `tools/perf/atlas-bench.ts`, run on 2026-10-16 in headless Chrome on an Apple M5 with three
  interleaved runs per build, gave medians that varied by up to a factor of 2.6 between runs of the
  same build (6.32 to 16.75 ms for Low at 2560 by 1440 during the opening). This record therefore
  claims no GPU gain or loss. Draw calls fell by 2 to 8 per frame in every state measured, and no
  program was linked during any measured window.

---

## Decision 2: The setting's three stars light the map, and the image is tuned for reading before physics

### Decision

- `data/atlas/stars.json` holds the bible's reference values: the primary at 5,772 K, 120,000 lx and
  0.533°; the warm companion at 5,600 K, 2,392 lx and 0.08°; the hot companion at 12,000 K, 9 lx and
  0.0011°, with its optional lavender tint; the pair 6 AU away and 0.5 AU apart, with a 9.3-year
  orbit and a 105-day mutual period. `atlasStars` in `src/lib/game/schema.ts` validates the file,
  and `schemas/atlas-stars.schema.json` is emitted from it.
- `src/lib/atlas/world/stars.ts` is pure. The hour moves the three stars along the arc the hour
  slider always used, rising at 6 and setting at 18. The « Saison » slider moves the pair through
  its synodic cycle with the primary, 409.2 days with these values. Illuminance falls with the
  square of the distance, and colour is a blackbody reddened by airmass.
- `src/lib/atlas/engine/daylight.ts` writes the lights. Three `DirectionalLight`s exist from
  construction: the key light carries the only shadow map and follows the strongest star above the
  horizon, or a moon fill when none is up, and the two fills cast no shadow. The `HemisphereLight`
  is gone. The sky dome draws three discs with a minimum size on screen.
- `src/lib/atlas/engine/environment.ts` bakes the environment from the sky. A `CubeCamera` renders
  the dome without its discs into a 64-pixel cube, `PMREMGenerator.fromCubemap` prefilters it into a
  reused target, and the first bake happens before the shaders compile. It bakes again at most
  every 120 ms while a slider moves.
- The image is held in a readable band rather than at the physical exposure. The grade exposure
  goes from 1.08 by day to 2.5 at night, the saturation from 1.16 to 0.85, and the environment from
  0.8/π to 0.55/π, under a grade contrast of 0.2. Hour and season reset on every opening.

### Rationale

- The owner's answers of 2026-10-15: the environment is baked from the engine's own sky, and the
  bible is the reference for how Eden's stars work. No HDRI file is downloaded, and the environment
  matches the sky at every hour, which a fixed HDRI cannot.
- The owner's ruling of 2026-10-16: the Atlas is a tool for players, so readability outranks the
  bible's physics. Measured on 2026-10-16 with the interface hidden, in the 3/4 view at 1600 by
  1000 on High, as the mean sRGB luma of the canvas from 0 to 255, against a build of the tree
  before this change:

  | Hour | Before | After |
  | ---- | ------ | ----- |
  | 16:36, the default | 102.7 | 83.3 |
  | 9:00 | 128.1 | 104.8 |
  | 12:00 | 138.0 | 117.6 |
  | 19:00 | 40.9 | 59.8 |
  | 22:00 | 40.9 | 62.1 |

  At the default hour the saturation rose from 0.378 to 0.397, and the top view went from 79.9 to
  64.5. At 22:00 the share of pixels with a luma under 40 fell from 0.646 to 0.300.
- Turning a light's `visible` or `castShadow` changes `numDirLights` or `numDirLightShadows` in the
  program key (`src/renderers/webgl/WebGLPrograms.js` in three 0.186.1), which recompiles every lit
  material. The lights therefore exist from the start, and only their intensity changes.
- The values belong to the setting and serve every world, so they live beside `vocabularies.json`
  and `travel.json`, the home 0041 Decision 3 gives to data the whole Atlas shares.

### Alternatives considered

- **HDRI files**: rejected by the owner. Reopens if a painted sky replaces the computed one.
- **The bible's physical exposure**: rejected on 2026-10-16, because the night went nearly black and
  players could not read the map. Reopens only if the owner wants a realistic view as an option.
- **The companions folded into the environment instead of lights**: not taken, because the bible
  gives each star its own direction and colour. Reopens if their cost shows on Low.
- **A latitude or an axial tilt behind the season**: rejected, because the bible gives neither and
  nothing is invented.

### Caveats

- Only the key star casts a shadow, although the bible gives every star a shadow direction.
- The exposure, saturation and environment values were tuned by eye against the measurements above,
  on one machine and one display.
- The cost of the two fill lights was not isolated from the rest of the change.
- Each bake while a slider moves renders a cube and a prefilter.

---

## Decision 3: A fog of war derived from the world hides the edge of the map, behind an open sea

### Decision

- `buildReveal` in `src/lib/atlas/kernel/reveal.ts` runs in the worker. Land, lake, floating
  island, landmark and route hexes, and sky lanes, seed a chamfer distance: land reaches 50 world
  units into the sea, landmarks 40, routes 25 and sky lanes 16. Noise shapes a 12-unit band, fog
  enclosed by discovered land is filled in, and the field covers the grid plus 84 units on every
  side. It reaches the engine as an 8-bit texture.
- `revealAt` reads the field on the CPU, and the shaders read the same texture through
  `unexplored()` and `veil()` in `materials/glsl/veil.glsl`. The sky dome is centred on the camera
  and shows the veil below the horizon.
- Open abyss hexes continue past the grid wherever the field is not fully unexplored. Within 1 to 7
  units of the grid's edge, broken by noise, see-through water blends into the colour the open sea
  draws (`materials/glsl/water.frag`), so the outline of the grid never shows. The off-grid water
  curtains, terrain walls, hanging rocks and cloud sea are deleted.
- The camera may pan 30 units past the grid, and the widest zoom grows to 420 units in the top view,
  330 in the 3/4 view and 440 in the free view, so the ring of fog stays in sight.
- A hex that reads 0.5 or more is unexplored. Hovering it names « L'Inconnue », not yet discovered;
  a click selects nothing; a link to it is ignored; its labels hide; and a few `aria-hidden`
  « L'Inconnue » marks sit in the fog.

### Rationale

- The owner's requests of 2026-10-15 and 2026-10-16. Land in the placeholder world runs from
  -99.2 to 105.2 across a half width of 110.4, so with the first reach of 9 units the fog began at
  112.5 on the east, 2 units past the grid. With 50 units it begins at 152.5 east and west and
  near 122 north and south, measured with `revealAt` along both axes.
- Derived, not authored: the placeholder world will be replaced, and any world gets its fog from
  what it already declares, without a new data field.
- One field read by both the CPU and the GPU keeps hover, clicks and labels in agreement with what is
  drawn.
- The blend works whatever depth a world puts at its edge, where an edge rule in the worker would
  hold only for deep edge tiles.

### Alternatives considered

- **An authored fog layer**: rejected, because it would repeat what the land and routes already
  imply. Reopens if the owner wants the map revealed with the story.
- **A fade at the edge of the rectangle**: rejected, because the map would still read as a rectangle.
- **Fog in the shaders only**: rejected, because hover, selection and labels need the same answer on
  the CPU.
- **Edge tiles turned into open sea by the worker**: rejected for the blend above. Reopens if the
  blend shows as a band in testing.

### Caveats

- The CPU reads the field in floating point and the GPU through linear filtering of 8-bit texels half
  a unit apart, so at the boundary the two can disagree within one texel.
- A sea named as a place stays under fog unless something on it reveals it.
- The wider padding grows the field to 488,125 texels, against 200,941 with the first padding, and
  the open sea to 119,168 vertices, both measured on this world with `buildReveal` and `buildWater`.

### Addendum (2026-10-16): the fog rises

- 0046 Decision 2 raises « L'Inconnue » into a mist bank built from the same reveal field. The water
  shader still paints the veil beneath it, and the hover, click and link rules above hold: the
  pointer now meets the mist before the sea, and the « L'Inconnue » marks sit on its crest.

### Addendum (2026-10-17): the field carries a haze, and the pointer reads the sea again

- `buildReveal` now also writes a haze ramp from the same signed distance, uploaded as the green
  channel of the same texture (0047 Decision 1). The fog in the red channel, and every rule above
  that reads it, is unchanged.
- With the mist bank gone (0047 Decision 2), the pointer again meets the sea under the fog and the
  « L'Inconnue » marks are back at their own height.

---

## Decision 4: The Atlas stores its options under one key

### Decision

- `aubaine.atlas.settings`, in `src/islands/atlas/settings.ts`, replaces `aubaine.atlas.quality`. It
  holds the quality, the screen effect, the start-up sound and its volume, and what the map shows:
  the label groups, the borders, the hex grid, the six route kinds and the effect groups.
- It is read field by field, with a default for anything missing or invalid, and written only when
  the reader changes an option. `aubaine.atlas.view` is unchanged. The privacy pages name the new key
  in both locales.

### Rationale

- One key keeps the list on the privacy pages short and the parsing in one module. The Atlas has
  never been published, so no browser holds the old key and nothing is migrated.
- Reading field by field means an older or edited value loses only the field that is wrong.

### Alternatives considered

- **One key per option**: rejected, because the privacy pages would list every one. Reopens if an
  option must be cleared on its own.
- **Remember the hour and the season**: rejected, so that every opening shows the default sky.
  Reopens if the owner wants the sky remembered.

### Addendum (2026-10-16): the sound leaves this key

- 0045 Decision 1 moves the start-up sound and its volume out of `aubaine.atlas.settings`, into the
  site-wide `aubaine.sound`. The key now holds the quality, the screen effect and what the map shows.
- `storedSettings` reads field by field, so a stored `sound` or `volume` is ignored and nothing is
  migrated.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Tiers | Render scale, antialiasing, Auto from Ultra down | `src/lib/atlas/contract/quality.ts`, `src/lib/atlas/engine/pace-check.ts` |
| Post | Grade, present, screen effect | `src/lib/atlas/engine/post.ts` |
| Stars | The bible's values, the hour and season model | `data/atlas/stars.json`, `src/lib/atlas/world/stars.ts` |
| Light | Key and fills, a readable exposure, the sky environment | `src/lib/atlas/engine/daylight.ts`, `src/lib/atlas/engine/environment.ts` |
| Fog | Reveal field, open sea, edge blend | `src/lib/atlas/kernel/reveal.ts`, `src/lib/atlas/engine/materials/glsl/water.frag` |
| Storage | One options key, on change only | `src/islands/atlas/settings.ts` |
