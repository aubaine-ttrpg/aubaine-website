# ADR: A tree and a species keep one portrait, which an art effect may develop on the GPU

**Project:** Aubaine, the wiki
**Status:** Accepted
**Revised:** 2026-10-23, Decision 1's portrait hero gives way to the character sheet of 0054
**Revised:** 2026-10-23, Decision 2's engine also draws the moving stage of 0054, so it loads on
every Species and Tree page
**Revised:** 2026-10-23, Decision 3's portrait `sizes` gives way to the card `sizes` of 0054
**Date:** 2026-10-23
**Deciders:** Kori
**Scope:** The pictures of a tree and of a species: their hero, their card, their social image and
an optional effect the browser applies to them; the `sizes` every `Hero.astro` image asks for; how a
species gives its sub-species a shared family name list. Reverses 0009 Decision 2 for trees and
species, and leaves it standing for books and the equipment catalogue. Leaves 0048 intact: every
image still loads eagerly. Does not cover the Home plate and its loop video, the book cards, the
lore pictures (`src/scripts/torchlight.ts`) or the Atlas (0041, 0043).

---

## Context

The art is generated. The 16:9 banners (`data/media/art/*-16_9-og.png`, 1672 by 941, measured with
`sips`) read smooth and waxy, worst when the browser enlarges them two to three times across a wide
hero. The owner compared four GPU post-processes on them, and found that none fixed it, while the
3:4 covers (1086 by 1448), which come out of the generator without that smoothing, did. Keeping
both shapes also means generating two pictures for every tree and species. Versions, read from
`pnpm-lock.yaml` and `node_modules`: `astro@7.3.3`, `swup@4.10.0`, `@playwright/test@1.63.0`.

---

## Decision 1: A tree and a species carry one 3:4 cover, and their hero is a portrait

### Decision

- `skillTree.banner` and `species.banner` are withdrawn from `src/lib/game/schema.ts`. The `cover`
  is the entry's only picture: its card, its hero, the front of a tree's booklet and its social
  image. `tests/data/integrity.test.ts` refuses a cover that is not a `3_4` file.
- `Hero.astro` takes `layout`. In `portrait`, from 960 pixels up, the title, status and plates stand
  on the page background in the page inks, and the cover fills the right of the 1560 pixel
  container at full hero height, its left edge dissolving into the background. Below 960 pixels the
  cover goes full bleed behind the text, under the scrims. `Species.astro` and `Tree.astro` use it;
  every other hero keeps `banner`.
- The social image of a portrait is cut from its top (`src/lib/social-image.ts`, sharp's `top`
  gravity). Astro passes `withoutEnlargement` to sharp, so a 1086 pixel cover gives 1086 by 630.
- `data/media/art/nnor-16_9-og.png`, which nothing names any more, moves to
  `data/media/unassigned/`. `nnor-marchand-16_9-og.png` stays: the Nnor lore page draws it.

### Rationale

- The owner's call, for two reasons: the 3:4 generations do not show the smoothing, and one picture
  per entry asks for less generated art.
- The cover is shown about 1.25 times its size on a 900 pixel hero, against two to three times for
  a banner across the screen.
- Measured on the built site at 960, 1024, 1280, 1440, 1920 and 3000 pixels, Nnor and Marchand: no
  horizontal scroll at any width. At 1440 by 900 the panel is 621 by 827 and the text column ends
  86 pixels into the panel's 236 pixel fade; from 1561 pixels the panel aligns with the content edge
  and fades on both sides.
- The `top` crop keeps the subject's head. Checked on `nnor-3_4-og.png`: sharp's `attention`
  strategy chose the lit chest instead.

### Alternatives considered

- **Keep both pictures**: two generations per entry, and the 16:9 one is the smoothing the owner
  rejected. Rejected.
- **Crop a 16:9 hero out of the cover at build time**: a full-width band keeps about 42 % of a
  portrait's height and loses its subject. Rejected. Reopens if a full-bleed hero is wanted back.
- **Keep the banner for the social image alone**: still a second generation. Rejected.

### Addendum (2026-10-23): the portrait gives way to a framed card

- The one 3:4 cover stands. The portrait layout of `Hero.astro` is withdrawn: Species and Tree pages
  draw `CharacterHero.astro`, where the cover is a framed card beside a column of text on a dark
  stage, and `Hero.astro` keeps only the banner. See 0054 Decision 1.

---

## Decision 2: An entry may choose an art effect, which the browser develops over its cover

### Decision

- `artEffect`, optional on a tree and a species, is `film` (« Pellicule ») or `oil` (« Huile »),
  declared once in `src/lib/art-effect/effects.ts`. No entry sets it yet: every picture renders as
  it is.
- `Banner.astro` wraps a hero or card picture in a `[data-plate]` element that carries the motion
  and, when chosen, `data-art-effect`. `src/scripts/art-effect/boot.ts`, in the shell, loads the
  engine only on a page that has such a plate.
- `src/scripts/art-effect/studio.ts` holds one WebGL2 context for the page and develops plates one
  after another: the source as an `SRGB8_ALPHA8` texture with mipmaps, the `object-fit: cover`
  window of the computed `object-position`, a Catmull-Rom resample, clarity on OKLab lightness, the
  effect's grade, adaptive sharpening, and for Huile an anisotropic Kuwahara pass (structure tensor,
  eight polynomial sectors) in fenced strips at a level suited to the size shown. Each result is
  drawn into the plate's own 2D canvas.
- The canvas replaces the picture at once, with no fade, and is `aria-hidden`. Pellicule's grain
  moves 24 times a second on a hero while it is on screen; cards and reduced motion hold it still.
- Without WebGL2, on a software renderer (SwiftShader, llvmpipe), or for a plate the reader never
  scrolls near, the picture stays. A lost context leaves the developed canvas as it is; the next
  development opens a new context.
- The trial's two other looks, Retenue and Estampe, and its comparison panel are deleted.

### Rationale

- Kept for later use at the owner's request, and off until an entry asks for it.
- One context for the page: Chromium caps the live WebGL contexts of a page and loses the oldest when
  a new one is made (the cap itself is unverified here), and an index of cards with an effect would
  otherwise hold one per card. On the species index with
  drafts shown, all 17 cards developed on a single context, counted by
  `tests/e2e/art-effect.spec.ts`.
- Measured with Playwright against `astro preview`, Chromium on an Apple M5 (ANGLE Metal), 1512 by
  945 at a pixel ratio of 2:

  | Case | LCP element | Developed | Long animation frames | Frame interval p95 |
  | --- | --- | --- | --- | --- |
  | Nnor hero, Pellicule, median of 5 | IMG | 100 ms after LCP | 1, 68 ms | 16.8 ms |
  | Nnor hero, Huile, median of 5 | IMG | 181 ms after LCP | none | 16.7 ms |
  | 17 species cards, Pellicule, 3 runs | | 625 to 714 ms after navigation | none | |
  | 17 species cards, Huile, 3 runs | | 1505 to 1514 ms after navigation | none | |

- The engine chunk is 27,699 bytes, 9,963 gzipped (`gzip -9`) and 8,876 with brotli at quality 11,
  from `dist/_astro/plates.*.js`. The shell bundle grows from 46,183 to 46,523 bytes, 16,364 to
  16,520 gzipped.
- `naturalWidth` is density corrected for an image picked from a `srcset`, so the engine reloads
  `currentSrc` into a plain `Image` for its true pixels. The first upload without it overflowed its
  texture (`GL_INVALID_VALUE` in Chromium).
- `tests/e2e/art-effect.spec.ts` injects an effect into real pages, since no entry carries one:
  nothing fetched without an effect, the instant hand-off, one shared context, a Swup visit and a
  return, a tree node visit keeping the canvas, grain only on screen, still cards, reduced motion,
  and a lost context that keeps the picture and recovers on the next development.
  `tests/e2e/art-effect-fallback.spec.ts` covers no WebGL2 and a software renderer.
  `tests/unit/art-effect.test.ts` covers the cover window, the backing budget and the levels.

### Alternatives considered

- **A finish baked into the files with sharp**: image codecs smooth grain away (AV1, which AVIF is
  built on, can strip film grain before encoding and synthesise it after decoding, because grain is
  costly to keep), and sharpening only holds at the size it is shown. Rejected.
- **One context per plate**: simpler, and the eviction above. Rejected.
- **An `OffscreenCanvas` handing bitmaps to each plate**: no copy per frame, but WebGL in an
  `OffscreenCanvas` reached browsers later than WebGL2 itself (unverified per version here).
  Rejected for the plain canvas and `drawImage`, which works wherever WebGL2 does.
- **three.js, already a dependency**: it ships inside the 762,451 byte `atlas-engine` chunk, which no
  content page loads. Rejected.
- **A 0.4 second fade from the picture to the canvas**: tried in the trial; the owner's rule is that
  hand-offs are instant. Rejected.

### Caveats

- Not measured on Windows, on integrated Intel graphics or on phones. `automaticTier()` lowers the
  pixel budget and the paint level there; it has not been seen running.
- Once a canvas has taken over, its picture is `visibility: hidden`. A test that expects a developed
  plate's image to be visible will fail by design.

### Addendum (2026-10-23): the same context draws the hero's stage

- The studio also draws the moving backdrop of 0054 Decision 4, so `boot.ts` loads `studio` and
  `stage` on every Species and Tree page outside reduced motion. The plate code, now its own chunk,
  still loads only where a plate names an effect, and `tests/e2e/art-effect.spec.ts` checks it for
  `plates` alone.
- The studio canvas only grows, and each copy takes the drawn rectangle from it, so a plate and the
  stage share it without a resize every frame. The grain test counts copies into the plate's canvas
  instead of draw calls on the context.

---

## Decision 3: A hero asks for an image as wide as its crop

### Decision

- `Hero.astro` writes `sizes` from its `minHeight` and the picture's own ratio:
  `max(100vw, calc(<minHeight> * <ratio>))` for a banner, and the portrait panel's `clamp` from 960
  pixels up.

### Rationale

- `object-fit: cover` shows a full-bleed plate wider than the viewport on a tall screen, and
  `sizes="100vw"` asked for the viewport's width. On a 390 by 844 phone at a pixel ratio of 3, the
  build before this change picked the 1280w file on `/fr/arbres` and `/fr/almanach`, shown 1273 and
  954 pixels wide; it now picks 3344w on both. `tests/e2e/images.spec.ts` asserts it, and failed on
  that earlier build.

### Alternatives considered

- **`sizes="auto"`**: the browser would measure the image itself, but only for an image loaded
  lazily, and 0048 loads every image eagerly. Rejected.

### Addendum (2026-10-23): the card asks for its own width

- The portrait panel's `clamp` is gone with the panel. The card of 0054 asks for its own width, at
  both breakpoints. See 0054 Decision 5. A banner hero keeps `max(100vw, calc(<minHeight> * <ratio>))`.

---

## Decision 4: A family name list every sub-species shares is written once, on the species

### Decision

- `species.familyNames` gives every sub-species the same family names; a sub-species' own
  `names.family` replaces it. Each sub-species still shows the list, headed by `familyNamesLabel`
  when the species has one (« Yurtas » for the Nnors).
- `tests/data/integrity.test.ts` refuses two sub-species of one species that carry the same list,
  and a sub-species list that repeats `familyNames`.

### Rationale

- The Nnor's two sub-species carried the same 27 Yurta names twice. The page reads as before, and
  the list now has one owner.

### Alternatives considered

- **Keep the list on one sub-species only**: the other would lose names the owner wrote for it.
  Rejected.
