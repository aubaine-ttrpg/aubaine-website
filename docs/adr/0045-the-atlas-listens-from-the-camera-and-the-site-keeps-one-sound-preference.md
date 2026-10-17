# ADR: The Atlas listens from the camera, and the site keeps one sound preference

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-16
**Deciders:** Kori
**Scope:** What the Atlas plays and when: the site-wide sound preferences and their key, the
soundscape derived from the camera, the mixer that plays it, the format and delivery of the files,
and how the recordings are credited. Amends 0043 Decision 4 and 0044 Decision 2, and extends the
credits of 0015 Decision 2 and the foreign assets of 0011 Decision 1. Does not cover how the shell
mounts the Atlas (0041 Decision 1) or the boot's own synthesized sound (0044 Decision 1). Vehicles
make no sound yet.

---

## Context

Until this change the only sound on the site was the CADRAN boot, synthesized in
`src/scripts/atlas-boot.ts` and switched on by « Son du démarrage » with its own volume in
`aubaine.atlas.settings`. On 2026-10-16 the owner asked for sound in the Atlas (the sea, the wind and
the like) to make it feel finished, from CC0 recordings credited on the credits page, and kept cheap.
The owner asked for a global mute and a master volume stored for the whole site, so that other pages
can reuse them, and for one volume per category, wide enough to serve other pages and precise
enough to mix. Versions this was decided against, read from `pnpm-lock.yaml`: `astro@7.3.3`,
`react@19.3.0`, `three@0.186.1`, and `@playwright/test@1.63.0` for the tests.

---

## Decision 1: The site keeps one sound preference, and it starts silent

### Decision

- `src/scripts/sound-preferences.ts` stores `aubaine.sound`: `muted`, `master`, and one level for
  each of `SOUND_CATEGORIES`, which are `ambience` (looping beds), `effects` (one-shots in the world)
  and `interface` (the boot and the interface cues). The labels are « Ambiance », « Effets » and
  « Interface ».
- It is read field by field, with a default for anything missing or invalid, and written only when
  the reader changes it. `muted` defaults to `true`.
- A gain is the square of a level, and a category's gain is the master's times its own
  (`categoryGain`). Muted, every gain is zero.
- A change dispatches `aubaine:sound-changed` synchronously, and a change in another tab arrives
  through the `storage` event.
- The Atlas rail carries a « Son » button, pressed while sound is on. The « Sons » tab of the options
  holds the same switch, the « Volume général » and the three category volumes.
- The boot no longer has a switch or a volume of its own. It plays at the Interface gain, and only
  when that gain is above zero and the page has had a user activation (`bootVolume` in
  `src/scripts/atlas.ts`).

### Rationale

- The owner asked for the mute and the master in browser storage for the whole site, and chose these
  three categories and a silent start on 2026-10-16.
- One key keeps the privacy pages to one new line, the reason 0043 Decision 4 gives for one Atlas
  key. `tests/unit/storage-keys.test.ts` enforces that every key is named there.
- A sound that starts unasked breaks `.claude/rules/frontend/accessibility.md` ("Do not autoplay
  motion, audio, or video that the user cannot stop"), the reason 0044 Decision 2 kept the boot
  silent by default.
- The squared curve gives a slider that moves loudness evenly; a linear gain spends most of its
  travel near full volume.
- The module ships in the shell, because the binder reads it before the Atlas chunk arrives. Bundled
  alone with esbuild 0.28.2, minified, it is 1,446 bytes, 686 gzipped.

### Alternatives considered

- **Keep the sound in `aubaine.atlas.settings`**: rejected, because the owner wants the preference
  to serve other pages. Reopens if no other page ever plays sound.
- **One key per preference**: rejected, as in 0043 Decision 4. Reopens if one preference must be
  cleared on its own.
- **Sound on after the first click**: rejected by the owner. Reopens if the owner asks for it, still
  behind the user activation check.
- **A separate switch for the boot**: not kept, because the boot is interface sound and has its
  category. Reopens if readers want the ambience without the boot and with the cues.

---

## Decision 2: The soundscape sharpens as the reader zooms in

### Decision

- `listen` in `src/lib/atlas/world/soundscape.ts` is pure. From the world, the grid and the camera
  it returns a level for each of eight beds (`BEDS`: sea, shore, wind, forest, fields, night, town,
  cave), how open the wind sounds, and the calls that can be heard (`CALLS`: gull, bell, anvil, bird,
  owl).
- The camera is read from the smoothed rig, `engine.rig.rig`, which is what the screen shows. Night
  is the engine's own `uNight`, read through a `night` getter on `AtlasEngine`.
- Each tile type belongs to one ground in a `Record<TileType, Ground>`, so a new tile type fails to
  compile until it is placed. Ether and myxo carry only the generic wind, and a point off the grid
  counts as deep sea.
- A footprint of 61 points around the camera, `0.45 × dist` wide (6 to 90 units), gives each ground
  its share.
- Closeness runs from 0 at a distance of 160 to 1 at 60:
  - **far** (closeness 0, which includes the opening distance of 168): the open sea and the wind
    only;
  - **closer**: the biome beds fade in with closeness, the forest and the fields give way to the
    night loop as night falls, and the town quietens at night;
  - **close** (below 90, full below 60): calls from establishments and landmarks within `0.6 × dist`
    of the centre, outside the fog, falling off with distance and panned by the side of the screen
    they lie on, plus the bird, owl and gull of the ground around the reader.
- Underground, only the cave bed plays, with the calls of establishments on that level.
- Calls are spaced: at least 3 seconds apart, no more than two at once, each kind waiting 10 to 30
  seconds, and none while the camera flies (`src/islands/atlas/sound.ts`).
- Establishments call by kind, through `ESTABLISHMENT_CALLS`, which
  `tests/data/atlas.test.ts` ties to the kinds the vocabulary declares, the way 0041 Decision 3 ties
  `ESTABLISHMENT_DRESSINGS`.

### Rationale

- The owner's ruling of 2026-10-16: not everything on screen should sound; zoomed out the reader
  hears a wider, generic soundscape, and the specific sounds come in as they zoom, "more poetic and
  less chaotic".
- The sound follows the data, as the scenery does in 0041 Decision 3: a harbour or a forge makes its
  call because the world declares it, not because of its id.
- Night comes from the three stars (`Daylight.surface` in `src/lib/atlas/engine/daylight.ts`), which
  is what the screen shows. That file counts full day from 1,000 lux on the ground (`NIGHT_LUX`),
  and the warm companion's reference illuminance is 2,392 lux in `data/atlas/stars.json`, so the map
  can show day while the primary is down, when a clock with sunset at 18 would already call it
  night.
- `tests/unit/atlas-soundscape.test.ts` asserts each rule on the Archipel: far gives only the sea
  and the wind, the forest leads when close to one, night hands it over, a harbour calls only when
  close, a call pans to its side, an undiscovered place is silent, and underground plays only the
  cave.

### Alternatives considered

- **Every source on screen at every zoom**: rejected by the owner as chaotic.
- **Night from the hour slider**: rejected for the reason above.
- **Sound tied to vehicles and effects**: not in this pass. Reopens when the owner asks; the engine
  would have to expose where its vehicles are.

### Caveats

- The distances, footprint, weights and call spacing were set by reasoning and by the measurements
  below, not yet by ear. The owner's listening pass may move them.
- A call's position on the screen uses the yaw only, so in the free view a call above or below the
  centre pans as if it were level with it.

---

## Decision 3: One context, loaded on demand, and MP3 files that loop through a crossfade

### Decision

- `src/islands/atlas/mixer.ts` creates one `AudioContext` at 32 kHz with a `balanced` latency hint.
  It exists only when sound is on and the page has had a user activation; a stored unmute waits for
  the first press or key. The graph is a master gain, then one gain per category.
- A bed loops by overlapping two buffer sources with an equal-power crossfade of 1.5 seconds, so no
  encoder padding is ever heard. Its level glides with a time constant of 0.6 seconds, and the wind
  passes through a lowpass that opens with altitude and exposed ground.
- A bed is fetched and decoded once its level reaches 0.03, and released, with its buffer, after 30
  seconds of silence. The calls and the cues are fetched when the context is created.
- The session (`src/islands/atlas/sound.ts`) polls the engine four times a second while sound is
  audible. It is created in `src/islands/atlas/mount.tsx`: ambience starts on `reveal`, so it never
  plays under the boot; the context is quietened and suspended on a Swup visit, a hidden tab or a
  mute, and closed on unmount.
- A sound that fails to load or decode is reported once with `console.warn` and stays silent.
- The files are MP3, 32 kHz; beds stereo at VBR quality 6, one-shots and cues mono at quality 7. They
  are imported with `?url&no-inline`, so they are hashed under `/_astro/` and share the immutable
  cache of 0006 Decision 4; `public/_headers` is unchanged.

### Rationale

- Browsers hold audio back until a user activation, and Safari on iOS is reported to need the
  context started inside the gesture itself (not verified here on a device), so the session reacts
  to the synchronous preference event rather than to a React effect.
- Measured on 2026-10-16 with Playwright against `pnpm build` and `astro preview`, one fresh browser
  context per row, at 1600 by 1000 on Low with reduced motion, sound turned on from the rail, 8
  seconds after the last key. The
  fetched bytes include the 104 KB of calls and cues; the decoded bytes are the sum of each decoded
  buffer's length times channels times 4.

  | View | Beds loaded | Fetched | Decoded |
  | ---- | ----------- | ------- | ------- |
  | Zoomed fully out | sea, wind | 536 KB | 12.3 MB |
  | Opening view | sea, wind | 536 KB | 12.3 MB |
  | Three steps in | sea, shore, forest, fields, wind | 1,236 KB | 26.9 MB |
  | Close on a harbour | shore, town, fields, wind | 954 KB | 22.1 MB |
  | Strate −1 | cave | 482 KB | 7.4 MB |

  Before the 0.03 threshold and the move of the far distance from 220 to 160, the opening view loaded
  five beds, 1,236 KB and 26.9 MB, for beds barely above silence.
- 32 kHz decodes to two thirds of the memory of 48 kHz and still carries frequencies up to 16 kHz.
- MP3 needs no licensed decoder in any current engine, and the e2e tests confirm every file decodes
  in Playwright's Chromium 153. Opus through `decodeAudioData` is reported unreliable in Safari
  (in WebKit's bug tracker and in a 2025 test of Safari 18.4), and AAC depends on platform
  decoders in some Linux builds; neither was verified here.
- The 17 files total 1,968,912 bytes in `dist/_astro`. The sound code adds 9,213 bytes (4,001
  gzipped) to the Atlas interface chunk, bundled alone with esbuild 0.28.2 without the modules the
  chunk already holds. That chunk is 155,355 bytes (45,149 gzipped) in the same build.

### Alternatives considered

- **`<audio loop>` elements**: they stream without decoding the whole file, but their loop point
  depends on the codec's padding and leaves a gap in some browsers. Reopens if decoded memory proves
  too high on phones.
- **Opus, or Opus with an MP3 fallback**: rejected on the Safari reports above, and the fallback
  would ship every file twice. Reopens when Safari is shown to decode Opus reliably.
- **AAC**: smaller than MP3 at the same quality (not measured here), but its decoding depends on
  the platform. Reopens if every supported browser is shown to decode it.
- **Mono beds**: they would halve the bytes and the memory but flatten the sea and the wind. Reopens
  if phones struggle.
- **A mixer shared by the whole site**: not built, because only the Atlas plays sound. The preference
  is shared already; the mixer moves when a second page needs one.

### Caveats

- Close views decode up to 27 MB on top of the map. Nothing here was measured on a phone.
- A 20-second loop can be recognised by a listener who stays still; the calls are spaced to break it.
- The tests assert state, never what is heard. Playwright's Chromium reports a user activation after
  every navigation, so the test of a stored unmute replaces `navigator.userActivation` with one that
  is set by the first press or key, as a browser does.

---

## Decision 4: The recordings are CC0, and their credits are code with their cuts

### Decision

- `SOUND_WORKS` in `src/lib/rights/attribution.ts` names each work: its title and author as its
  source page prints them, that page, its licence (`CC0 1.0`), and its cuts. A cut names the file it
  produces, the upstream file, and its window, shape and filter. 14 works give 17 files: 13
  recordings from BigSoundBank and four cues from Kenney's Interface Sounds.
- `pnpm media:sounds` (`tools/media/sounds.ts`) cuts, levels and encodes each one from `tmp/sounds/`
  into `data/media/sounds/`. Loops are levelled to -23 LUFS in two passes and one-shots to a -3 dB
  peak, and every file leaves without metadata.
- The credits page renders a « Sons » table from the same rows. `data/media/sounds/` is a foreign
  directory in `src/lib/rights/ownership.ts`, so `pnpm media:stamp` never claims it.
- `pnpm data:check` fails when a file on disk is uncredited, when a credited file is missing, or when
  the files differ from the sounds the Atlas plays (`ATLAS_SOUNDS`).

### Rationale

- The owner asked that CC0 sounds be credited although CC0 does not require it. The credits follow
  0015 Decision 2: a table in code that the page renders and a test enforces, never a second copy.
- Each title and author was copied from the page, read on 2026-10-16. Kenney's pack states
  "Creative Commons Zero, CC0" in its `License.txt`.
- Keeping the cut beside the credit, as `FONT_FAMILIES` keeps its Google Fonts query, makes every
  file reproducible from its source and keeps one list of files.
- The town bed comes from a present-day French market. It is lowpassed at 1,600 Hz so speech blurs
  into a murmur.

### Alternatives considered

- **The cut recipe in the tool, the credit in the rights module**: two lists of the same files would
  drift. Rejected.
- **Freesound**: its downloads need an account. Reopens if a sound is found nowhere else.

### Caveats

- BigSoundBank serves its files through a form behind a browser check, so the originals were
  downloaded with a headless browser and are not committed; `tmp/sounds/` must be refilled by hand
  to encode again.
- The wind recording mentions "shocks" on its page. The steadiest 20 seconds were chosen by a level
  scan, not by ear.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Preference | Mute, master and three categories, site-wide | `src/scripts/sound-preferences.ts` |
| Soundscape | Beds and calls from the camera, by zoom | `src/lib/atlas/world/soundscape.ts` |
| Mixer | One context, crossfaded loops, calls, cues | `src/islands/atlas/mixer.ts`, `src/islands/atlas/sound.ts` |
| Files | MP3, 32 kHz, hashed under `/_astro/` | `data/media/sounds/`, `tools/media/sounds.ts` |
| Credits | CC0 works and their cuts | `src/lib/rights/attribution.ts` |
| Tests | Model, credits, silence, unmute, Swup, policy | `tests/unit/atlas-soundscape.test.ts`, `tests/e2e/atlas-sound.spec.ts` |
