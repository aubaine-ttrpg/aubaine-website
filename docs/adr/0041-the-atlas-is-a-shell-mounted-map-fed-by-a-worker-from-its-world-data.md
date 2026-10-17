# ADR: The Atlas is a shell-mounted map, fed by a worker from its world's data

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-14
**Revised:** 2026-10-16, Decision 5 is reversed by 0043; Decision 1 gains an addendum: the loading
screen gives way to the CADRAN boot (0044) and the measured sizes move; Decision 3 gains an addendum:
`data/atlas/` holds several worlds, one of which opens
**Deciders:** Kori
**Scope:** The Atlas tab at `/fr/atlas` and `/en/atlas`: how its interactive map reaches the browser
through Swup, where its work runs, how its world is stored and validated, where its travel rules
come from, how its quality tiers trade cost, and what it stores in the browser. Amends 0006
Decision 3 and 0021 Decision 2. Does not cover the route scheme (0005), the head and indexing of a
draft page (0040), or the world's canon: the world shipped with this record is placeholder content.

---

## Context

The owner asked for an Atlas tab after the Almanach: a real-time 3D hex map of the world of Eden,
built from a design handoff in `tmp/design_handoff_atlas`. The handoff is a three.js engine of seven
ES modules (355,020 bytes, counted with `wc -c engine/*.js`), a UI reference and a README. Its
`createAtlas` generates the whole world and every mesh on the main thread before the first frame,
and its world is procedural placeholder content that contradicts canon, kept until the real map
replaces it.

The site had no precedent for any of what this needs: no worker, no JSON world data, no 3D, and one
React island (0006 Decision 3). Versions this was decided against, read from `pnpm-lock.yaml`:
`astro@7.3.3`, `@astrojs/react@6.0.6`, `@swup/astro@1.8.0`, `swup@4.10.0`, `react@19.3.0`,
`vite@8.3.0`, `three@0.186.1` and `@types/three@0.186.0`.

---

## Decision 1: The shell mounts the Atlas root, so Swup can enter and leave it

### Decision

- The Atlas page renders no `client:` island. `bindAtlas` in `src/scripts/atlas.ts`, registered in
  `src/scripts/shell.ts`, mounts a React root into `[data-atlas-root]` on `page:view`, suspends
  rendering on `visit:start`, and unmounts once the root has left the document. Unmounting disposes
  the engine, releases its WebGL context and terminates its worker.
- React is used wherever interaction needs client state, and a root may be mounted by the shell when
  Swup's lifecycle requires it. The one island rule of 0006 Decision 3 is lifted.
- Entering and leaving the Atlas are ordinary Swup visits, with the sliding underline, the crossfade
  and the crest of 0012 Decision 3.
- three.js and the Atlas UI are loaded by dynamic import, only on the Atlas page. The engine chunk,
  the only one that contains three.js, is imported only when the GPU probe finds WebGL 2
  (`mapSupport` in `src/scripts/atlas.ts`). Without it the page keeps the place list and the
  planner, and three.js is never fetched; `tests/e2e/atlas-shell.spec.ts` asserts both.
- The UI imports the engine as types only. The binder hands it a factory, `createEngine`, through
  `MapSupport` in `src/islands/atlas/launch.ts`.
- A lost WebGL context resumes drawing when the browser restores it. If it is not restored within
  five seconds, the page shows the failure panel and its reload link.

### Rationale

- `reloadScripts: false` in `astro.config.mjs` keeps Swup's scripts plugin out
  (`@swup/astro/dist/script.js:68` maps the option to `SwupScriptsPlugin`), and
  `.claude/rules/frontend/swup.md` forbids adding it. Astro's island runtime is an inline script
  (`astro/dist/runtime/server/astro-island.prebuilt.js`), so an island on a page reached by a Swup
  visit hydrates only if an earlier document load already defined `astro-island`.
- The same runtime unmounts a React island on `astro:after-swap`, an event of Astro's own view
  transitions that Swup never dispatches (`disconnectedCallback` in that file; the React renderer
  unmounts on `astro:unmount` in `@astrojs/react/dist/client.js:97`). A map left through Swup would
  keep its WebGL context alive behind it. The shell owns both ends of the lifecycle instead.
- The owner lifted the one island rule on 2026-10-14 as an obstacle to a fast interactive page.
- What the Atlas adds to a visit, measured in `dist/_astro` after `pnpm build` on 2026-10-15
  (`wc -c`, then `gzip -9`):

  | Chunk | Bytes | Gzipped | Loaded |
  | ----- | ----- | ------- | ------ |
  | Engine with three.js | 721,437 | 189,652 | On the Atlas, with WebGL 2 |
  | Atlas UI | 119,281 | 32,743 | On the Atlas |
  | Worker | 169,527 | 61,116 | On the Atlas |
  | World data, French | 308,691 | 32,953 | On the Atlas, 10 files |

  The React DOM client (211,144 bytes, 65,001 gzipped) is the chunk the existing island already
  shares. Every page pays for the binder in the shell: `src/scripts/atlas.ts` bundled alone with
  its static imports is 4,780 bytes, 2,312 gzipped (esbuild, minified), the price of starting the
  worker the moment the Atlas is reached rather than after one more request.
  `vite.build.chunkSizeWarningLimit` is 730 kB in `astro.config.mjs` because the engine chunk is
  Vite's one chunk over the default 500 kB. three.js is 546,025 bytes of it: the 53 exports the
  engine imports, bundled alone and minified with esbuild 0.28.2.
- The interface stylesheet, `src/styles/atlas.css`, is imported `?inline` by
  `src/islands/atlas/mount.tsx` and appended to the head on mount, so it travels in the Atlas UI
  chunk and leaves with the map. The stylesheet every page shares keeps only the frame, the loading
  screen and the failure panel scoped in `Atlas.astro`: built from the same tree both ways on
  2026-10-15, it is 27,061 bytes (5,912 gzipped) where a static import made it 63,058 (11,861).

### Alternatives considered

- **An Astro `client:only` island**: rejected for the two runtime facts above. Reopens if the site
  moves to Astro's view transitions, or if Swup's scripts plugin is ever admitted.
- **A full document load for the Atlas tab**: rejected by the owner, who wants the same entry as
  every other tab. Reopens if the shell-mounted root proves unreliable across visits.
- **The interface stylesheet as the CSS chunk of the mount import**: Swup's head plugin removes a
  stylesheet the next page's head lacks (`persistAssets: false`, `@swup/astro/dist/script.js:49`),
  and Vite's preload helper never inserts a URL twice (`seen` in
  `vite/dist/node/chunks/node.js:26420`), so the second visit would mount unstyled. Reopens if the
  head plugin persists assets.
- **The Atlas UI in vanilla TypeScript**: the sidebar, the travel planner and the searchable place
  list are client state with focus management and animated panels, the boundary 0006 Decision 3
  draws at animated stateful UI.

### Caveats

- The contract between `src/components/views/Atlas.astro`, `bindAtlas` and the root is a set of
  `data-atlas-*` attributes with no compile time link.

### Addendum (2026-10-16): the loading screen is the CADRAN boot, and the sizes moved

- 0044 replaces the loading screen named above with the CADRAN boot, drawn in its own layer beside
  the root, and the binder now also starts the boot.
- Measured in `dist/_astro` after `pnpm build` on 2026-10-16, with the same method: the engine with
  three.js is 735,880 bytes (194,516 gzipped), the Atlas UI 134,768 (38,608), the worker 172,055
  (62,218), and the French world data 309,096 bytes in 11 files (33,178), `stars.json` being the
  eleventh. The binder bundled alone is 8,979 bytes (4,007 gzipped).
- `vite.build.chunkSizeWarningLimit` is 740 kB in `astro.config.mjs`, raised from 730 because the
  engine chunk passed 730 kB.

---

## Decision 2: A long lived module worker builds the world, under the unchanged policy

### Decision

- `src/lib/atlas/worker/atlas.worker.ts` is a module worker, created with
  `new Worker(new URL(...), { type: 'module' })` and bundled as ES (`vite.worker.format: 'es'`). It
  fetches the world's files, validates them, derives the world, builds every mesh as packed typed
  arrays transferred to the main thread, and answers travel queries. It lives as long as the page.
- The world's JSON files reach the worker as hashed files under `/_astro/`, through
  `import.meta.glob` with `?url&no-inline`, so they share the immutable cache of 0006 Decision 4. The
  worker fetches the French files and the overlays of the page's locale only.
- The worker imports neither three.js nor the DOM. The geometry kernel writes its own buffers.
  An override in `biome.json` forbids three.js, React, Motion, the engine, the islands, the page
  scripts and the DOM globals in `src/lib/atlas/vocabulary.ts`, `contract/`, `world/`, `kernel/`
  and `worker/`. The worker compiles against the `WebWorker` library through its own
  `src/lib/atlas/worker/tsconfig.json`, which `pnpm check` runs.
- `public/_headers` is unchanged. No `blob:` worker is used.

### Rationale

- The handoff generates on the main thread, so the page cannot answer input until the whole world
  is built. A worker moves all of it off the thread that handles input and labels.
- The authored policy is `default-src 'self'` with `script-src 'self'` (`public/_headers`). A worker
  script is checked against `worker-src`, which falls back to `script-src` and then `default-src`,
  so a same origin worker and its same origin fetches are admitted. A `?worker&inline` build would
  load from a `blob:` URL, which this policy refuses.
- Keeping three.js out of the worker keeps the worker small and keeps one owner of the GPU: the
  renderer on the main thread.

### Alternatives considered

- **Generate on the main thread in idle slices**: each slice still blocks input while it runs, and
  the total work does not shrink. Rejected.
- **Render in the worker through `OffscreenCanvas`**: the labels are DOM elements and the input
  arrives on the main thread, so every frame would cross threads twice. Rejected; reopens if the
  labels move into the canvas.
- **Ship prebuilt meshes from the build**: the terrain alone is hundreds of thousands of vertices,
  far larger than the authored layers it is derived from. Rejected.

---

## Decision 3: The world is data under `data/atlas/`, derived in the browser

### Decision

- `data/atlas/vocabularies.json` and `data/atlas/travel.json` serve every world. `data/atlas/eden/`
  holds one world split by part: `world.json`, `surface.json`, `places.json`, `landmarks.json`,
  `routes.json`, `establishments.json`, `sky.json` and `underground.json`. The parts with prose
  carry `.en.json` overlays keyed by id.
- A per tile layer is a legend, one character per value, plus one string of characters per row of
  the grid. Only what an author decides is stored. Water, lakes, heights, memberships, centres, road
  masks, what lies beneath a tile and the travel place list are derived.
- The vocabularies keep the entry shape of `data/meta/`: a `key` with its `labelFr` and `labelEn`.
- The scenery follows the data, not ids. A place's establishments dress it (a harbour brings piers
  and boats, a forge brings halls and smoke), through `ESTABLISHMENT_DRESSINGS` in
  `src/lib/atlas/vocabulary.ts`, which `tests/data/atlas.test.ts` ties to the declared
  establishment kinds. Walls, windmills and the ornaments of a floating island are explicit
  `features` on the place or landmark.
- The parts are validated by schemas in `src/lib/game/schema.ts` and collections in
  `src/content.config.ts`, so an invalid file fails `pnpm build`.
- The placeholder world is `status: "draft"`: published, badged and kept out of search through
  `keptOutOfSearch` in `src/lib/game/pages.ts` (0040 Decision 1).

### Rationale

- A layer stored as rows reads as the map in a diff, and the byte exact formatting `pnpm data:check`
  requires keeps one row per line.
- The derived arrays are larger than the layers they come from and fully determined by them.
  Deriving them in the worker keeps one source and keeps the payload to what an author wrote.
- Grouping the world's entities by part keeps the load to a handful of requests. The owner chose
  this layout and `data/atlas/` as the home of its vocabularies on 2026-10-14.
- The layout departs from two standing rules, which are amended in the same change:
  `.claude/rules/content/data-authoring.md` says a file describes one entity, and
  `.claude/rules/content/vocabularies.md` says `data/meta/` holds every controlled vocabulary.

### Alternatives considered

- **One file per place, as every other content type**: rejected, because the browser would fetch one
  file per entity on every load. Reopens if a build step bundles the files into one payload.
- **The vocabularies in `data/meta/`**: rejected by the owner, because these keys exist only for the
  Atlas and its engine. Reopens if another content type needs one of them.
- **Derive at build time and ship the derived arrays**: rejected for the payload. Reopens if the
  derivation becomes measurably slow on low end devices.

### Addendum (2026-10-16): several worlds, one opens

- The owner ruled on 2026-10-16 that the placeholder map is not Eden. It moves to
  `data/atlas/archipel/` as « Archipel », and `data/atlas/eden/` holds an empty Eden: one sea over
  the grid and every list empty, the smallest world the schema accepts.
- Each folder under `data/atlas/` is a world, sorted by `kind` into « Contrées » (`land`, a
  stretch one travels) and « Zones » (`area`, a place at the scale of a scene: dungeon, interior,
  battlefield). `OPENING_WORLD` in `src/lib/atlas/contract/worlds.ts` names the world the Atlas
  opens when the address names none; `?map=<folder>` names another, read by the binder
  (`src/islands/atlas/worlds.ts`), sent to the worker in its start message, and an unknown name
  falls back to the opening world and is dropped from the address.
- The hexagon at the top of the rail opens the switcher (`src/islands/atlas/MapSwitcher.tsx`), a
  modal dialog with a search, a tab per kind and a card per world, whose preview the browser draws
  from that world's surface types. Choosing a world replaces the address, stops the Atlas session
  and starts a new one on the same root, under the start-up screen without its logo (0044), and
  never through a Swup visit, so the site's own page loader does not play.
- A world may name an `emblem`, an owned SVG under `data/media/` ending in `-emblem.svg`, drawn in
  the hexagon that stands for it; Eden carries the Celtic tree, and a world without one shows the
  Aubaine logo. `pnpm data:check` fails when the opening world is missing or an emblem is not an
  owned file.

---

## Decision 4: The planner reads its paces from the book, and the owner sets the other speeds

### Decision

- The paces, their distances per hour and per day, and their effects are read at build time from
  the pace table in `data/books/livre-du-joueur/08-l-exploration.md` and its English page, never
  copied. The planner links to that chapter.
- Every other rule is in `data/atlas/travel.json`: the maximum pace in each terrain, the step a road
  or a town adds, skis in the snow, flight from a Vitesse, the vessels' speeds, the hours travelled
  per day, the dirigeable at 80 km/h and the rail at 500 km/h. The owner set them on 2026-10-14.
- Each planner terrain names the Aubaine environment it corresponds to, where one exists.

### Rationale

- The book is the authority for how fast a group travels and what its pace costs it, so a change to
  that chapter moves the planner with it. The eight hour day and the mount rule come from the same
  page.
- The other speeds are the owner's rules for this planner. Keeping them in one data file makes them
  visible and validated, rather than constants in the engine.

### Alternatives considered

- **Copy the pace table into `travel.json`**: two sources for one rule would drift. Rejected.

---

## Decision 5: Lower tiers drop detail, never resolution, and two choices are stored

### Decision

- The tiers are Low, High and Ultra, plus Auto. Every tier renders at `min(devicePixelRatio, 2)`. A
  tier changes the terrain's subdivision, the shadows, the antialiasing, the bloom, the density of
  the scattered props, the shader features and the particles.
- Auto picks a tier from the GPU it reports, and steps down once if the median frame interval of
  the opening camera move passes 25 ms. It never steps up, never changes the resolution, and is
  never stored. With « Animations » off the camera cuts to its framing instead of moving, so there
  is no opening move to time and Auto keeps its first choice.
- `aubaine.atlas.view` and `aubaine.atlas.quality` are written to `localStorage`, and only when the
  reader changes them. The privacy pages name all four keys the site stores.

### Rationale

- The owner asked on 2026-10-14 that lower tiers remove details, shadows and effects rather than
  lower the rendering resolution. Labels, borders and text over the map stay sharp on every tier.
- The handoff's Auto was the only tier that scaled resolution under load (`prScale` in
  `tmp/design_handoff_atlas/engine/engine.js`), which is the behaviour the owner refused.

### Alternatives considered

- **Dynamic resolution under load**: rejected by the owner, as above.
- **Remember nothing**: the reader would pick a view and a tier again on every visit. Rejected, at
  the cost of two keys on the privacy pages.

### Addendum (2026-10-16): reversed by 0043

The owner asked on 2026-10-15 for Low at 75 % and High at 90 % under a screen effect, so lower tiers
now drop resolution as well as detail. Auto starts a desktop on Ultra and can step down twice, and
`aubaine.atlas.settings` replaces `aubaine.atlas.quality`, holding the quality with the other
options. 0043 Decisions 1 and 4 record the new rules. `aubaine.atlas.view` and its write on change
still hold.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Mount | Shell-mounted React root, Swup lifecycle | `src/scripts/atlas.ts`, `src/scripts/shell.ts` |
| Worker | Validation, derivation, geometry, travel | `src/lib/atlas/worker/atlas.worker.ts` |
| World | One world split by part, layers as rows | `data/atlas/`, `src/lib/game/schema.ts` |
| Travel | Book paces, the owner's speeds | `data/books/livre-du-joueur/08-l-exploration.md`, `data/atlas/travel.json` |
| Tiers | Detail, shadows and effects, never resolution | `src/lib/atlas/contract/quality.ts` |
| Storage | View and tier, on change only | `src/content/policies/confidentialite.md` |
