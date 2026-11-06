# ADR: A lore picture may play on an almanach

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-11-06
**Revised:** 2026-11-07, a page that names no style takes the default almanach, which the Humans use, and a picture fills the tube by default (addendum to Decision 3)
**Deciders:** Kori
**Scope:** The almanach a reader sees on a page: the three.js object that shows a picture on its tube
(`src/scripts/art-effect/almanach.ts` and its siblings), where its styles live, how a lore picture or
a page asks for one, and how it starts. Amends the line of `DESIGN.md` that kept three.js to the Atlas
and to baking, and narrows the CADRAN ruling behind 0044, which keeps the Atlas loader as it was. Does
not cover the Dev Hub that designs the styles (0070), nor the heraldry of 0059.

---

## Context

The owner built an almanach kit: a scanned model of the device whose « Oculus » property lets it show
pictures (`data/equipment/items/almanach.json`), drawn with three.js on a CRT tube, with 19 finishes,
13 magics in its crystal, a CADRAN boot ported from the Atlas loader, zoom, sound and a battery gauge.
Until now three.js reached a reader only on the Atlas (`DESIGN.md`, « Outside the Atlas, three.js only
bakes »), and the lore's live pictures shared the studio's one WebGL2 context. The Humans' page is the
first to use it: its picture of the Bibliothèque des Oracles plays on an almanach in the Humans' own
style.

---

## Decision 1: An almanach page loads three.js and opens one context for its almanachs

### Decision

- `src/scripts/art-effect/boot.ts` imports `almanachs.ts` only on a page that holds `[data-almanach]`,
  like the other effects; a page without one fetches none of it.
- Every almanach on a page draws through one shared three.js renderer, apart from the studio's context
  (`src/scripts/art-effect/studio.ts`).
- The context opens only on WebGL2 on a graphics card: `failIfMajorPerformanceCaveat`, and the
  software renderers the studio refuses (`rendersInSoftware` in `src/scripts/gpu.ts`). Otherwise the
  picture stays as it is, with no canvas and nothing logged.
- The model and its four baked textures live in `data/media/almanach/` (owned); the HDRI, the magic
  sprite atlas and the 20 finish textures in `data/media/almanach-materials/` (CC0, credited beside
  the textures by `ALMANACH_MATERIAL_WORKS` in `src/lib/rights/attribution.ts`). `tools/media/sync.ts`
  serves them at `/almanach/v1/`, which `public/_headers` caches as immutable; a new model ships as
  `v2`.
- The device's words live in `src/lib/i18n/strings.ts` under `almanachDevice`.
- The CADRAN code the Atlas loader and the almanach share (the emblem, its outline, its timeline and the
  sound voices) lives once, in `src/scripts/cadran/`.

### Rationale

- The owner asked for the kit at full strength; an object the reader turns on, zooms and drags is
  WebGL drawn from the game's own object, which the « no picture made for one page » ruling allows.
- three.js is already a dependency (`three` 0.186.1 in `pnpm-lock.yaml`) and ships in the Atlas; the
  build splits it into one chunk the two share.
- The kit draws with three.js materials and loaders (`GLTFLoader`, `HDRLoader`, `PMREMGenerator`); the
  studio is raw WebGL2. Sharing its context would make each reset the other's state.
- The meshopt decoder is the pure JavaScript one, vendored in `src/scripts/art-effect/vendor/`, so the
  page needs no WebAssembly and `script-src 'self'` holds (`public/_headers`).

### Alternatives considered

- **Draw the almanach on the studio's context**: rejected on the shared state between raw WebGL2 and
  three.js. Reopens if the studio moves to three.js.
- **A still or a video of the almanach**: rejected; it would be a picture made for one page, with no
  power, zoom or channel. Reopens if a page must show the device where WebGL2 cannot run.
- **The WebAssembly meshopt decoder from three.js**: rejected; it needs `'wasm-unsafe-eval'` in the
  policy.

### Caveats

- Cost on an almanach page, measured on `dist/_astro` with `gzip -9` after `pnpm build` on 2026-11-06:
  `almanachs` 137,229 bytes raw, 43,845 gzipped; `three.module` 574,866 raw, 140,762 gzipped, shared
  with the Atlas; `strings` 36,810 raw, 12,803 gzipped, shared with the Atlas. The model and its
  textures weigh 873,502 bytes; a finish, the HDRI or the sprite atlas load only when a style uses them
  (1,100,986 bytes for all of them).
- A page with an almanach and a living stage holds two WebGL contexts. `tests/e2e/heraldry.spec.ts`
  counts the studio's alone, and marks the almanach's canvas by `data-almanach-stage`.
- Headless Chromium draws on SwiftShader, which the almanach refuses, so the end-to-end tests that need
  it lit skip there; `channel: 'chromium'` runs them on the graphics card.

---

## Decision 2: A page's almanach style is data, resolved in the browser

### Decision

- A style is one file, `data/almanachs/<name>.json`: the case, trim and grip finishes, the crystal's
  colour and magic, the light strips, the gloss, the reader's boot and the battery gauge.
- `almanachStyle` in `src/lib/game/schema.ts` is its contract, emitted to
  `schemas/almanach-style.schema.json`; `almanachStyleOf` in `src/lib/art-effect/almanach-look.ts`
  reads it in the browser from the same vocabulary. There is no content collection.
- A page names the style; `src/lib/art-effect/almanach-styles.ts` resolves the name on the page.
- `src/components/primitives/Almanach.astro` takes either a `style` name or explicit settings, never
  both, and fails the build on a missing art or a style that does not exist.

### Rationale

- The lore loader renders a part again only when its text changes (`generateDigest(body)` in
  `src/lib/game/lore-loader.ts`). Values written into the HTML would keep an old style after an edit to
  the style alone; a name in the HTML and the values in the browser stay true.
- One file per style lets a later page, such as the elves', take its own without touching code.
- `tests/data/integrity.test.ts` holds every saved style to both readers, and
  `tests/unit/almanach-look.test.ts` checks that they refuse the same cases.

### Alternatives considered

- **The style values in the Markdown or the HTML**: rejected on the cached render above. Reopens if
  the lore loader digests its plugins' data too.
- **A content collection**: rejected; nothing reads styles through Astro's store, and a save would
  reload the content. Reopens if a page lists styles at build.

---

## Decision 3: A lore picture asks for an almanach by its title

### Decision

- A picture whose title is `"almanach <style>"` stands in an almanach of that style; `pictureLook` and
  `rehypeProsePictureMasks` in `src/lib/game/book-markup.ts` wrap it, in the line of `"glazed"`.
- The word takes exactly one style name, in lowercase with dashes. A portrait (`-3_4-`) is refused,
  since the tube shows a wide picture whole.
- `tests/data/integrity.test.ts` checks that every style a picture names exists.

### Rationale

- The lore's text stays the owner's; the title word is markup, as the masks and the glazing are.
- `"almanach humain"` on the Bibliothèque des Oracles in `data/lore/species/humain.md` and its English
  page is the first use.

### Alternatives considered

- **MDX and the component in the lore**: rejected as in 0018, which keeps the lore Markdown. Reopens if
  a lore page needs an island the title word cannot express.

### Addendum (2026-11-07): the default almanach, and a picture that fills the tube

- The word may stand alone: `"almanach"` takes the default almanach, `ALMANACH_STYLE` in
  `src/lib/art-effect/almanach-look.ts`; a style name after it picks a saved style. A component with
  neither a `style` nor settings takes the default too.
- The owner set the default in the Dev Hub: the gold case and the painted steel at gloss 0.5, a black
  leather grip at gloss 0, the painted crystal with no magic, the light strips following the picture.
- The Humans take the default almanach: the Bibliothèque des Oracles now carries `"almanach"`, and the
  Humans' own style of 2026-11-06 is gone from `data/almanachs/`.
- A picture fills the tube unless it asks to be shown whole (`ALMANACH_FIT`, `cover`); the engine, the
  component, the lore markup, the page script and the plain picture without JavaScript share it. A
  portrait is still refused: the wide tube would crop it to a strip.

---

## Decision 4: On a page an almanach starts without CADRAN, and a reader's switch-on may flash it

### Decision

- When an almanach turns itself on, as the page loads or as it first nears the screen, it starts
  `instant`: the picture fades in (`ALMANACH_PAGE_BOOT`).
- When a reader switches it on, by the crystal or the power button, it plays the style's
  `crystalBoot`: `instant`, or `fast`, the flash and the lit CADRAN emblem. The whole CADRAN boot
  (`quick`, `original`) never plays on a site page (`ALMANACH_CRYSTAL_BOOTS`, and the enum in the
  contract).
- The engine keeps all four boots; the Dev Hub plays them.

### Rationale

- The owner's ruling of 2026-11-06, which narrows the one of 2026-10-30 that kept CADRAN to the Atlas
  loader: CADRAN may show inside the device's own tube, briefly, when a reader asks for it, and never
  dresses a page.

### Alternatives considered

- **The kit's defaults, `fast` on start and `quick` on the crystal**: rejected by the owner's ruling.
- **No CADRAN at all on a page**: rejected; the owner keeps the flash for a reader's own switch-on.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Engine | Draws the almanach | `src/scripts/art-effect/almanach.ts` |
| Site binding | Mounts every `[data-almanach]` | `src/scripts/art-effect/almanachs.ts` |
| Vocabulary | Finishes, magics, boots, the style reader | `src/lib/art-effect/almanach-look.ts` |
| Styles | One file per style | `data/almanachs/` |
| Contract | The style's schema | `almanachStyle` in `src/lib/game/schema.ts` |
| Component | An almanach on a page | `src/components/primitives/Almanach.astro` |
| Lore word | `"almanach <style>"` | `src/lib/game/book-markup.ts` |
| Shared CADRAN | Emblem, outline, sound | `src/scripts/cadran/` |
