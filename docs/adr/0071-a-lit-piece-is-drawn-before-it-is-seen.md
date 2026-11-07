# ADR: A lit piece is drawn before it is seen, and a known graphics card never shows its plain picture

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-11-07
**Deciders:** Kori
**Scope:** When the lit pieces of a page (a sub-species' banner, flag and coat of arms, a painting under
glass, an almanach) start building, and what a reader sees of their plain picture before they are drawn.
Extends 0053 Decision 2, whose plain picture showed until the canvas took over; keeps 0069 Decision 4,
the almanach still switching itself on as it nears the screen; keeps the instant hand-off of 0053. Does
not cover the living stage of 0054, which crossfades on its own, nor the plates of 0053, which no entry
uses.

---

## Context

Each lit piece is a canvas drawn over a plain HTML picture, so a page works without JavaScript, without a
graphics card and in print. The heraldry and the glass started building only once on screen: one
IntersectionObserver with no margin drove both their build and their ticking. The almanach started 200 px
ahead. A reader therefore saw the plain picture first, then the canvas take over. The owner asked that a
reader whose browser can draw the pieces get them at once, and chose an empty frame over the plain picture
for the wait that cannot be removed.

---

## Decision 1: Every lit piece builds two screens before it reaches the screen

### Decision

- `prepareOnApproach` in `src/scripts/art-effect/approach.ts` watches a piece with a second
  IntersectionObserver, `rootMargin` `200% 0px`, and calls its build when it enters that lead. The
  banner, the flag, the arms and the glass call it (`banners.ts`, `flags.ts`, `arms.ts`, `glazes.ts`);
  their own observers still gate every frame, so a piece off screen never animates.
- The almanach loads its model, materials and first picture in that lead, but switches on, shows its
  canvas and plays its fade only once within its own 200 px (`present` in `almanach.ts`), as 0069
  Decision 4 asks.

### Rationale

- Measured against the build served locally, at 1512 by 860, on this Mac's Apple M5, as the time a plain
  picture stayed painted on screen while the page scrolled at 1000 and 2500 px a second:

  | Browser | Before | After |
  | --- | --- | --- |
  | Chromium (Playwright `channel: 'chromium'`, ANGLE Metal), wheel steps | banner 200 ms, flag 33, arms 33 to 50, glass 33 to 34, almanach 0 | 0 for every piece, both speeds, two runs |
  | Firefox (Playwright 1.63.0, in a window, renderer reported as "Apple M1, or similar"), 100 px steps | banner 233 to 234 ms, flag 16 to 34, arms 25 to 33, glass 15 to 92, almanach 0 to 18 | 0 for every piece, both speeds |

- Two screens covers those builds: with all five building at once, a piece took 67 to 450 ms on
  Chromium and 316 to 723 ms on Firefox, and at 2500 px a second two 860 px screens last about 0.7 s.

### Alternatives considered

- **Build every piece once the page has loaded**: rejected; it spends the almanach's 873,502 bytes of
  model and textures (0069) and the banner's cloth settle on pages a reader never scrolls through.
  Reopens if a page's pieces become cheap enough to build blind.
- **Widen the almanach's own 200 px observer**: rejected; it would switch the almanach on and spend its
  fade off screen, against 0069 Decision 4.

### Caveats

- A piece within two screens of the fold now builds as the page loads, and the almanach fetches its model
  two screens ahead rather than 200 px.
- Not measured on Windows, on integrated Intel graphics or on phones.

---

## Decision 2: A browser that has drawn on its graphics card waits on an empty frame

### Decision

- The studio stores `aubaine.gpu` in `localStorage` when it opens on a graphics card, `cloth` when its
  tier draws cloth and `still` otherwise, and removes it when it is refused (`rememberGpu` and `forgetGpu`
  in `src/scripts/gpu.ts`, called from `src/scripts/art-effect/studio.ts`).
- The head script in `src/layouts/Base.astro` copies that value to `data-lit-expected` on `<html>` before
  the first paint, when the browser has WebGL2. On `DOMContentLoaded` it removes it unless the shell set
  `data-lit-bound` (`bindArtEffects` in `src/scripts/art-effect/boot.ts`).
- On screen only, while `data-lit-expected` holds, each piece hides what its canvas will replace until it
  is drawn: the heraldry's plain picture by `visibility` (`Heraldry.astro`; the banner and the flag only on
  `cloth`), the glass's picture, gilt and shadow (`src/styles/prose.css`), the almanach's pictures by
  opacity, its alternative text kept (`src/styles/almanach.css`). Print keeps every plain picture.
- A piece that will not be drawn says so with `data-stays-plain` (`stayPlain` in `approach.ts`): on its
  teardown, on a first draw that fails, when its code fails to load, and for an almanach that fails or
  cannot open a context. Its plain picture then shows.
- The canvas still replaces the frame at once, with no fade (0053 Decision 2).
- The privacy page names the key in both languages (`src/content/policies/confidentialite.md` and
  `.en.md`, required by `tests/unit/storage-keys.test.ts`).

### Rationale

- The build cannot run before the first paint, and a warm cache does not remove it: on a reload with every
  file cached, the plain picture still showed for 100 to 180 ms after the first paint on the build and
  250 to 420 ms under `astro dev`, Chromium.
- Measured with every piece in view as the page opens (1512 by 12000, so all five build at once), on a
  second visit:

  | Browser | Plain picture painted, before | Plain picture painted, after | Empty frame, after |
  | --- | --- | --- | --- |
  | Chromium | banner 467 ms, the others 167 to 217 | 0 | banner 450 ms, the others 67 to 283 |
  | Firefox | banner 635 ms, the others 268 to 441 | 0 | banner 723 ms, the others 316 to 483 |

- `tests/e2e/heraldry.spec.ts` and `tests/e2e/almanach.spec.ts` sample every frame and find no plain
  picture painted on such a visit; they fail on the build before this record.
  `tests/e2e/art-effect-fallback.spec.ts` covers a browser that can no longer draw and a shell that fails
  to load.

### Alternatives considered

- **Hide the plain pictures for every reader with JavaScript**: rejected; a browser without a graphics
  card would see an empty frame, then the plain picture. Reopens if no supported browser lacks hardware
  WebGL2.
- **Probe WebGL2 in the head script**: rejected; it would open a context before the first paint on every
  page and repeat the tier choice of `automaticTier` outside the studio. Reopens if a browser offers a
  cheap synchronous capability query.
- **Fade from the plain picture to the canvas**: rejected by 0053 Decision 2; hand-offs are instant.

### Caveats

- A browser's first visit, before the studio has opened once, still shows the plain picture and the swap.
- A page opened with a piece in view shows an empty frame for the piece's build, longest for the banner.
- After Back with a piece in view, the frame is empty for the page change, since effects wait for the
  visit's end (0066). Not measured.
- A fetch that stalls now leaves an empty frame where the plain picture used to stay; no timeout reveals
  it.
- On a tier without cloth (`still`), the banner and the flag keep their plain picture, as they never
  drape there.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| `prepareOnApproach`, `stayPlain` | Build two screens ahead; mark a piece that will not be drawn | `src/scripts/art-effect/approach.ts` |
| `aubaine.gpu` | Remembers that this browser draws on its graphics card | `src/scripts/gpu.ts`, `src/scripts/art-effect/studio.ts` |
| `data-lit-expected`, `data-lit-bound` | Hide plain pictures from the first paint, drop it if the shell never bound | `src/layouts/Base.astro`, `src/scripts/art-effect/boot.ts` |
| Screen-only hiding | What each canvas replaces | `Heraldry.astro`, `src/styles/prose.css`, `src/styles/almanach.css` |
