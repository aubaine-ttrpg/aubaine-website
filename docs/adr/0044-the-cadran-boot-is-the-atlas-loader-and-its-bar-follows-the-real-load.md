# ADR: The CADRAN boot is the Atlas loader, and its bar follows the real load

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-16
**Revised:** 2026-10-16, Decision 2 gains an addendum: the boot plays at the Interface
gain of the site-wide sound preference of 0045, and « Son du démarrage » is gone
**Revised:** 2026-10-16, Decision 1 gains an addendum: a map switch no longer shows the
CADRAN emblem or the channel switch
**Deciders:** Kori
**Scope:** What covers the Atlas tab while it loads: the start-up screen, how its progress is
measured, its words, its sound, and how it hands the map over. It does not cover how the shell
mounts the Atlas, which 0041 Decision 1 records, nor the map's own image and settings, which 0043
records.

---

## Context

Until this change the Atlas showed an HTML overlay with three named steps while the worker built the
world and the engine compiled its shaders (`[data-atlas-loading]` in
`src/components/views/Atlas.astro`). The owner then supplied a finished start-up screen, the CADRAN
boot: one canvas module of 2,930 lines in `tmp/atlas-boot-handoff/atlas-boot.ts`, drawn as a curved
CRT tube. On 2026-10-15 the owner asked for it to become the Atlas loader, with straight edges, with
the CADRAN logo always playing, and with a bar that reflects the loading underneath rather than a
fixed animation. On 2026-10-16 the owner found the logo too long for an app and its animation
laggy, and asked for the logo alone, without the CADRAN wordmark, the slogan or the bar at the foot
of the screen, followed at once by the Atlas screen, and for the loading to begin there.

---

## Decision 1: The boot covers the Atlas while it loads, and only real milestones move its bar

### Decision

- `src/scripts/atlas-boot.ts` is the handoff module, changed only where the Atlas needs it:
  - the screen is flat: the barrel warp, the rounded mask and the bezel are deleted, and the
    scanlines, the glow and the HUD brackets stay;
  - the WebGL 1 CRT pass keeps its 2D canvas fallback;
  - the CADRAN wordmark, the slogan and the bar at the foot of the screen, with its travelling
    marker, are deleted; the logo draws alone at the centre, from 0.9 seconds, and the Atlas screen
    takes over 2.05 seconds later;
  - the Atlas screen is the enlarged globe with « ATLAS » beside it and the bar beneath both; the
    route to the pin is ten dots, each lit by a tenth of the load, and the lead and the three status
    rows of the handoff are deleted;
  - one entry, `mountAtlasBoot(host, { copy, logo?, volume? })`, returns
    `{ canvas, finished, loading, report, fail, skip, destroy }`, where `loading` settles when the
    Atlas screen appears or the reader skips, and `logo: false` starts on the Atlas screen when the
    reader switches maps;
  - the options the Atlas never sets (`waitFor`, `speed`, `ending`, `skippable`, `motion`, `locale`)
    and the exports that only served a video capture (`seek`, `renderAtlasBootSoundtrack`) leave
    the module.
- The binder, `src/scripts/atlas.ts`, imports the boot dynamically on `page:view`, in the same turn
  as it posts the worker its start message and requests the interface and the engine. The worker
  fetches and builds the world while the logo plays, but the map itself mounts only once `loading`
  settles. The boot draws into `[data-atlas-boot]`, a layer beside the React root, because React
  clears its own container.
- `LoadProgress` in `src/lib/atlas/contract/loading.ts` turns what is actually happening into a
  fraction:
  - four milestones on the main thread: `code` (the interface and engine modules resolved), `world`
    (the worker's world message), `compiled` (the engine's shaders compiled) and `drawn` (the first
    frame after the worker finished streaming);
  - one share per family of worker jobs, from a `plan` message listing the queued jobs and a `done`
    message as each one finishes (`src/lib/atlas/worker/session.ts`); once the plan has arrived, a
    family it does not list counts as done, so a world with nothing of that kind still completes;
  - weights summing to 100: `code` 18, `world` 22, `compiled` 8, `drawn` 2, and 50 across the job
    families, of which terrain carries 26;
  - without WebGL 2 only `code` and `world` are expected.
- The bar never runs ahead of the load:
  - the shown value moves toward the reported fraction at no more than one full bar per second
    (`FILL_RATE`), and only grows;
  - the bar draws the smaller of that value and the timeline's own ramp, so an instant load still
    fills on schedule;
  - the timeline holds at the full bar until the load completes, and the waiting text appears only
    after three seconds without progress (`STALL_SECONDS`);
  - a route dot lights as the shown value passes its tenth, and its sound cue fires on that change.
- While the boot covers it, the Atlas root is `inert`, `data-atlas-state` stays `loading`, and the
  camera rig, the labels and the HUD skip their updates. The opening camera flight and Auto's
  slow-frame check start only when the boot hands over, so the boot's own drawing cannot push Auto
  to a lower tier.
- On failure the boot shows its failed link, is destroyed, and the existing failure panel with its
  reload link takes over. A Swup visit away destroys the boot with its frame loop, its key listener
  and its audio context. It plays again on each opening.

### Rationale

- The owner's request of 2026-10-15: the logo is mandatory, and the animation is the progress bar.
- Most of the wait is work that no download progress reports: the worker deriving the world and
  building geometry, then the GPU linking programs. Counting the worker's own jobs and the engine's
  compile event measures that work where it happens. The weights order the stages by their share of
  the wait in the worker message timestamps that `tools/perf/atlas-bench.ts` records. They are
  display weights, not a forecast of time.
- Importing the boot in the same turn as the worker start keeps the reason 0041 Decision 1 gives
  for a shell-mounted root: no work waits for the interface chunk.
- The stutter came from building the map on the main thread, not from the boot. Measured on
  2026-10-16 with `PerformanceObserver` long tasks and frame times over the first seconds, in
  headless Chrome on an Apple M5 at 1600 by 1000 and a device pixel ratio of 2:
  - with the map built under the logo, four runs froze the main thread for 59 to 1,095 ms in all,
    the longest single task 555 ms;
  - with the worker or the engine blocked, no long task, and every frame 16.7 ms apart;
  - with the mount deferred, no long task during the logo in six runs, two of them at four times
    slower CPU.
  The worker's work runs on its own thread, so it keeps overlapping the logo without stutter.
- The handoff already held its timeline at the full bar until a `waitFor` promise settled. `report`
  replaces that single promise with the measured fraction, so the hold and the reveal keep the
  handoff's timing.

### Alternatives considered

- **Keep the HTML overlay and its three steps**: rejected by the owner, who asked for the CADRAN
  boot. Reopens if the boot proves unreliable in a supported browser.
- **The handoff's `waitFor` promise**: rejected, because it reports nothing between start and end,
  so the bar would be a fixed animation followed by a wait. Reopens if loading becomes short enough
  on every device that no progress is visible.
- **The boot as a component of the React island**: rejected, because it could only appear once
  React and the interface chunk had arrived, and React clears its container. Reopens if the island
  code ever ships in the shell.
- **Progress from bytes downloaded**: rejected, because module imports expose no download
  progress, and bytes say nothing about the worker's build or the shader compile.
- **Start every part of the load only on the Atlas screen**: rejected, because the worker's fetch
  and build run off the main thread and cause no stutter, so holding them back would only add their
  time after the logo. Reopens if the worker's messages are shown to stall the logo.
- **No Skip, since the logo is mandatory**: rejected under `.claude/rules/frontend/accessibility.md`,
  which forbids motion the user cannot stop. The owner kept Skip and Escape on 2026-10-15. Reopens
  only if that rule changes.

### Caveats

- The full version keeps the map covered for at least 6.09 seconds, even from a warm cache (`end` in
  `fullPlan`, `src/scripts/atlas-boot.ts`); in four runs the map was revealed 6.4 to 6.6 seconds
  after navigation, against 8.4 to 9.6 before the logo was shortened. The calm version, shown under
  reduced motion, takes 3.15 seconds. Skip and Escape jump to the hold at the full bar, so a reader who skips still waits for
  the load, but not for the logo.
- The full version flickers, degausses and shows static. Its flashes were not measured against WCAG
  2.3.1 (three flashes or below threshold), so conformance is unverified. The calm version sets
  flash, noise and tear to zero.
- The words are drawn on a canvas, so they cannot be selected or reached by a screen reader. The
  canvas carries `role="img"` and the label « Démarrage de l’application Atlas de l’Almanach », and
  the host carries `aria-busy` until the hand-over.
- The map's own start now happens on the Atlas screen, so any stutter it causes falls there, where
  the bar shows real work, and no longer on the logo.
- The bar is weighted by stage. On a device where one stage takes a larger share of the wait than
  recorded here, the bar moves unevenly. It still never moves backward and never completes before
  the load.
- Every page pays for the larger binder. `src/scripts/atlas.ts` bundled alone with its static
  imports is now 8,979 bytes, 4,007 gzipped (esbuild 0.28.2, minified, dynamic imports left
  external), against 4,780 and 2,312 in 0041 Decision 1. The tracker is 1,461 of those bytes. The
  shell chunk every page loads grows from 33,075 to 37,857 bytes (11,601 to 13,439 gzipped),
  measured in `dist/_astro` after `pnpm build` on 2026-10-16 against a build of the tree before
  this change.
- The boot chunk loads only on the Atlas: 43,166 bytes, 16,242 gzipped, from the same build.

### Addendum (2026-10-16): a map switch shows the Atlas screen only

- With `logo: false` the full timeline started at the hand-over from the logo, where the emblem was
  still drawn at full strength for a fifth of a second and the channel switch (tear, noise, roll)
  played. `fullPlan` now draws neither when the logo is off; the calm plan already did not.
- `tests/e2e/atlas-boot.spec.ts` records the switch to Eden frame by frame and counts gold pixels
  where the emblem sits: 8,585 in every run before the change, under 1,000 after, while the same
  measure finds the emblem on a first load.

---

## Decision 2: Its words are interface copy, and it is silent unless the reader turns the sound on

### Decision

- The boot's words are an `atlas.boot` group in `src/lib/i18n/strings.ts`, in French and English.
  `Atlas.astro` passes them in `AtlasProps.boot`, inside the JSON attribute the root already carries,
  and `src/islands/atlas/props.ts` validates them. The handoff's `COPY`
  table is deleted.
- The boot plays sound only when « Son du démarrage » is on in the Atlas options, which it is not by
  default, and the page has already had a user activation (`navigator.userActivation.hasBeenActive`
  in `src/scripts/atlas.ts`). It then plays at the stored volume. 0043 Decision 4 records where that
  choice is stored.

### Rationale

- `src/lib/i18n/strings.ts` holds every interface word in both locales, and the owner chose it over
  the module on 2026-10-15.
- A sound that starts unasked is audio the reader did not choose and cannot stop before it plays.
  The owner chose a boot sound with an on and off switch and a volume, off by default, on
  2026-10-15.

### Alternatives considered

- **The words inside the module, as the handoff ships them**: rejected by the owner. A second home
  for interface copy would drift from the translations. Reopens if the boot is reused outside the
  site.
- **Sound on by default**: rejected for the accessibility rule above. Reopens if the owner asks for
  it, still behind the user activation check.

### Addendum (2026-10-16): the boot follows the site's sound

- « Son du démarrage » and its volume are removed. The boot plays when the site's sound is on, at the
  Interface gain of 0045 Decision 1 (`categoryGain` in `src/scripts/sound-preferences.ts`), and only
  after a user activation, as before. Sound stays off by default.
- `mountAtlasBoot` and its `volume` option are unchanged.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Boot | Flat CRT start-up screen over the Atlas | `src/scripts/atlas-boot.ts` |
| Tracker | Milestones and worker jobs to a fraction | `src/lib/atlas/contract/loading.ts` |
| Binder | Starts the boot, the worker and the imports together, mounts the map on the Atlas screen | `src/scripts/atlas.ts` |
| Words | Boot copy in both locales | `src/lib/i18n/strings.ts` |
| Tests | Cover, hand-over, Skip, Escape, failure, no map under the logo | `tests/e2e/atlas-boot.spec.ts` |
