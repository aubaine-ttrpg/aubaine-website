# Measuring a design

A design is shown with its measurements: the owner trusts numbers and live pages, not claims
(`rulings.md`, Working with the owner). Measure on the built site, at real browser sizes, in both
languages, in every state a reader can reach, and put the table in the report.

## Contents

- [Where to measure](#where-to-measure)
- [The sizes](#the-sizes)
- [design:audit, nothing cut and pieces on their shape](#designaudit-nothing-cut-and-pieces-on-their-shape)
- [design:pixels, an unchanged render](#designpixels-an-unchanged-render)
- [design:transit, a page change frame by frame](#designtransit-a-page-change-frame-by-frame)
- [Methods the tools rest on](#methods-the-tools-rest-on)
- [Contrast](#contrast)
- [Lit pieces on the GPU](#lit-pieces-on-the-gpu)
- [Live side by side for the owner](#live-side-by-side-for-the-owner)
- [Booklets in print](#booklets-in-print)
- [From audit to test](#from-audit-to-test)
- [Capture an accepted piece](#capture-an-accepted-piece)

## Where to measure

- Build, then serve the build: `pnpm build`, with `AUBAINE_PROTOTYPE=1` when the reserve page
  (`prototypes.md`) must be in it. After a plugin edit or a new data file, run `pnpm astro sync --force`
  first: the content cache ignores plugin code.
- Serve it on your own preview: `pnpm exec astro preview --port 4322 --ignore-lock`, or a free port with
  a temporary Playwright config when 4322 is taken. Never stop another session's preview and never start
  a second `astro dev`. The tools default to `http://localhost:4322`; pass `--base=` for another port.
- Node comes from nvm (`source ~/.nvm/nvm.sh && nvm use 22`), and Biome runs through `rtk proxy`.
- Measure with reduced motion, so no arrival is caught halfway: the hub names slap in from 1.35 times
  their size, and a box read during that half second overlaps the next door. Then look once with motion
  on, the pointer at each edge.

## The sizes

| Size | Why |
| --- | --- |
| 1512 × 860, 1440 × 789, 1366 × 657, 1280 × 610 | Laptop browsers with their tab bar and toolbar: the heights a reader really has, not the screen's. |
| 1024 × 768, 820 × 1180 | A small laptop or a tablet in landscape, and a tablet in portrait. |
| 390 × 844 | A phone. |
| 320 × 568 | The narrowest phone, and the width WCAG 1.4.10 (Reflow) asks a page to work at without sideways scroll. `tests/e2e/hubs.spec.ts` adds it to the seven; pass it with `--sizes` wherever a piece must hold there. |
| 1024, 1280, 1440, 1920, 3000 wide | The layout table: an element's left, width and centre against the viewport's centre, and `scrollWidth - clientWidth`, which must be 0. |

## design:audit, nothing cut and pieces on their shape

`tools/design/audit.ts` loads each page at each size with reduced motion and, for every check
`PIECE@FRAME`, measures how far inside its frame every visible piece sits: the least distance from any
corner of the piece to any edge of the frame, in pixels, negative when a corner is outside. `screen` as
the frame measures against the viewport's sides. It reports the page's sideways scroll and flags a piece
that leaves the screen, a piece with no frame around it or in a frame with no area, and any piece, frame
or sweep selector that matches nothing on the page, so a typo never passes as "no problem". With
`--sweep`, it scrolls each matching element into view in turn, points its centre and measures again; an
element it cannot point is flagged, never skipped.

```sh
pnpm design:audit --pages=/fr/almanach,/en/almanach \
  --check='.au-plate-door__plate@screen' --check='.au-plate-door__giant@screen' \
  --sweep='[data-door] a'
```

| Option | Meaning | Default |
| --- | --- | --- |
| `--pages=` | Comma-separated paths | required |
| `--check=` | `PIECE@FRAME` or `PIECE@screen`, repeatable | at least one |
| `--sweep=` | Elements to point in turn, after the rest state | none |
| `--sizes=` | `WIDTHxHEIGHT`, comma-separated | the seven sizes above |
| `--margin=` | Least clearance in px before a piece is flagged | 0 |
| `--base=` | The preview's origin | `http://localhost:4322` |

It prints one row per page, size and state, then a count, and exits with code 1 when anything is flagged
and 2 on a usage error, such as a page that does not start with /, a margin that is not a number, or a selector that CSS or Playwright cannot read. A
piece that exists but is hidden at that size or in that state (`display: none`, `visibility: hidden`,
fully transparent or of no size), such as the hub's pictogram below 960 px, reads "none shown" and is not
a problem; a faint piece still counts as shown.

Checks that hold today, to copy for a new piece. The rows that count 320 × 568 pass
`--sizes=1512x860,1440x789,1366x657,1280x610,1024x768,820x1180,390x844,320x568`:

| Piece | Command | Result on 2026-10-31 |
| --- | --- | --- |
| Codex plate menu | `--pages=/fr/almanach,/en/almanach --check='.au-plate-door__plate@screen' --check='.au-plate-door__giant@screen' --sweep='[data-door] a'` | 112 states (both languages, the seven sizes and 320 × 568, each door pointed in turn), 0 problems; every plate at least 15.6 px and every pictogram 28.6 px inside the screen |
| Slanted doors (D) | `--pages=` its gated pages, `--check='.au-slant__plate@.au-slant__link'` and the same for `__spine`, `__glyph`, `__line`, `__seal`, `--margin=6`, swept | 182 states (both hubs and languages, the seven sizes, each door opened in turn), 0 problems; every piece at least 12.9 px inside its skewed panel, the pictogram at 820 × 1180 |
| Livres contents | `--pages=/fr/livres,/en/books --check='.au-sommaire__sheet@screen' --check='.au-plates__plate@.au-sommaire'` and `--check='.au-sommaire-entry__figure@.au-sommaire__sheet'`, the same for `__name`, `__mark` and `__line`, `--sweep='[data-door] a'` | 96 states (both languages, the seven sizes and 320 × 568, each entry pointed in turn), 0 problems; the sheet at least 16 px inside the screen, the title plates 5.4 px inside the section that clips them, at 320 × 568; inside the sheet every numeral at least 40 px, name 65.4 px, mark and line 30 px |
| An empty book category | `--pages=` its pages in both languages, `--check='.au-plates__plate@screen' --check='.au-empty-stage__panel@screen'` and `--check='.au-empty__title@.au-empty-stage__panel'`, the same for `.au-empty__body` and `.au-empty-stage__back` | 32 states (two empty categories, both languages, the seven sizes and 320 × 568), 0 problems; the title plates at least 12.8 px and the panel 17 px inside the screen; the words 24 px and the link 27.2 px inside the panel |

Use a frame that clips, or the screen. A column that does not clip is a layout reserve, not a frame: the
hub's plates, tilted a degree, poke up to 0.4 px past their column on a phone and nothing is cut.

## design:pixels, an unchanged render

`tools/design/pixels.ts` captures full-page screenshots once the page's fonts and images have loaded,
with reduced motion and the pointer parked at the bottom left, and counts the pixels that differ from an
earlier capture.

```sh
pnpm design:pixels capture --shots=shots.json --out=/path/to/before
pnpm design:pixels compare --shots=shots.json --out=/path/to/after --against=/path/to/before
```

`shots.json` lists `{ "name", "path", "width", "height" }`, with an optional `"hover"` Playwright
selector, such as `"[data-door] a >> nth=1"`. Names must be file-safe and unique. `compare` exits with
code 1 unless every shot is identical. Before it captures anything, both modes refuse, with code 2, a
`hover` Playwright cannot read, and `compare` refuses an `--against` that is missing, is the `--out`
directory under another path, or lacks a shot.

- **Prove the harness first.** Capture the same build twice and compare: every shot must read 0. Only
  then does a 0 after a change mean the change left the render alone.
- **Approved pieces.** Before touching anything near them, capture every route of
  `approved-pieces.md` § Status, routes and captures at 1512 × 860 and 390 × 844, plus each hub with its
  second door pointed (`"hover": "[data-door] a >> nth=1"`); compare after the change.
- **A picked prototype.** When a prototype ships, capture it on the reserve page and the live page under
  the same names: they must match to the pixel. The hub plate menu shipped that way on 2026-10-31,
  20 shots and 0 differing pixels. The Livres contents shipped later that day with entries the owner
  added (every category and the archives), so no prototype matched it; its audit and its tests stand in.
- Store captures in the scratchpad, never in the repository.

## Methods the tools rest on

- **Corner probes.** `getBoundingClientRect()` returns the axis-aligned box around a transformed
  element, so a rotated or skewed piece looks bigger than it is and its real corners are unknown. A 0 × 0
  absolutely positioned probe at each corner of the piece inherits every transform above it, so its box
  is the corner's true position. The audit inserts four probes, reads them and removes them, setting the
  piece to `position: relative` for that instant when it is static. It reads `img`, `input`, `video`,
  `canvas`, `iframe` and `textarea` elements, and every SVG element, by their axis-aligned box: audit a
  rotated SVG through the HTML element that wraps it.
- **Depth into a quad.** With the frame's four corners in order, the signed distance of a point to each
  edge is the cross product of the edge with the point, divided by the edge's length; the least of the
  four is how deep the point sits. The least over the piece's four corners is the piece's clearance.
- **The painted shape.** `clip-path` and masks change what is painted, not the box. Measure the polygon a
  piece paints when its clip carries the shape, as `clippedPieces` in `tests/e2e/select-screen.spec.ts`
  does for the slab.
- **Container units in vertical writing.** Inside `writing-mode: vertical-rl`, `cqi` resolves on the
  vertical axis and falls back to the viewport when no container answers; size a spine's width with
  `cqw`.
- **Pieces on the shape.** Position each piece inside the transformed shape and counter-transform that
  piece alone, so its net transform is only its own pose; give names on spines one size per screen; size
  art from the room left above the title with a size container, never by guess (`rulings.md`, Layout and
  composition).

## Contrast

- Text ink reads at 4.5:1 or more against its paper, 3:1 for large display type and for the parts of a
  control a reader needs to see (`accessibility.md`). Compute with the WCAG relative luminance.
- `plateInks` in `tests/e2e/select-screen.spec.ts` measures every plate's ink against its paper; copy it.
- `readableOnNight` in `src/lib/key-colour.ts` lifts a colour in OKLCH lightness by steps of 0.005 until
  `#14100a` reads on it at 4.5, and `kindInk` and `categoryInk` lift the marks to read on night.
- A line over a painted stage reads against the stage's darkest and lightest regions behind it; measure
  both, or give the text a shadow and a darker shade.

## Lit pieces on the GPU

- Launch Playwright with `channel: 'chromium'`: headless Chromium otherwise renders WebGL on SwiftShader,
  which the studio refuses (`src/scripts/art-effect/studio.ts`), and the living stage never draws.
- Capture a lit piece at rest and at two far pointer positions. Report its mean luminance, the swing
  between poses and the brightest percent; aim between glare and flat. On 2026-10-26 the arms swung 21
  when unbearable, 5 when flat and 12 when accepted.
- When the owner wants more realism, add light direction, shadow and occlusion before reflection. When a
  piece reads soft, look at its sculpt and the value range of its metal before its gloss.
- Check lit pieces in Playwright's WebKit too: it multiplies image channels by alpha, so never pack data
  in a map's alpha.
- Measure a leaned piece against the same pointer drawn flat: lay a transparent fixed veil over the page
  and nudge the pointer, so the piece loses its hover while the light stays where it was
  (`tests/e2e/heraldry.spec.ts`). Read a pixel ratio of 1 in headless Chromium: a headed window emulating
  1 on a ratio 2 screen resamples the page, and under emulation `devicePixelContentBoxSize` disagrees
  with `devicePixelRatio`.
- To time a full-screen shader on an Apple GPU, turn blending on, or tile-based hidden-surface removal
  shades only the last draw. For script cost, read the CPU profiler's per-script self time: Chrome's
  `Performance.getMetrics` ScriptDuration misses async continuations.

## Live side by side for the owner

When a change must leave a render identical, keep the old build running beside the new one from one
origin, and give the owner each piece in a pair of iframes with their input mirrored to the twin, plus a
button that counts differing pixels.

- Two same-origin iframes round `requestAnimationFrame` timestamps against their own time origin, so even
  identical code drifts. Inject a script before the page's own that hands every frame the parent's
  stamp.
- With Playwright's clock, fake time keeps flowing; frames only repeat after `clock.pauseAt()` before each
  scripted step, and after every mirrored pointer event has been handled.
- Shader edits that wrap work in a branch stayed bit-exact in Chromium and WebKit (ANGLE Metal), while
  Firefox on macOS (Apple OpenGL) rounded the branched maths one or two units in the last place
  differently: no 8-bit value changed in the tests, yet the output is not provably exact. JavaScript
  arithmetic stays exact everywhere.

## Booklets in print

When a change touches what a booklet prints, rasterise the PDF page with both `sips -s format png`
(Quartz, which Preview and Safari use) and `pdftoppm` (poppler), after `pdfseparate -f N -l N`, because
`sips` renders the first page only. Quartz draws CSS masks that Chromium prints as solid blocks, so
nothing a booklet prints uses a CSS mask, filter or soft mask. Build the print pages with
`AUBAINE_PRINT=1 pnpm exec astro build --outDir <scratch>`.

## design:transit, a page change frame by frame

`tools/design/transit.ts` clicks a real link and prints one row per edge, theme and size: when the link
answered, when the motion started and ended, how many frames hid the page, the worst frame during the
motion, and the groups that ran.

```sh
pnpm design:transit --base=http://localhost:4322 '--edges=/fr/almanach>/fr/arbres,/fr/arbres</fr/arbre/marchand' \
  --themes=dark,light --sizes=1512x860,390x844 [--browser=firefox] [--cold] [--film=/path/to/dir] [--flash]
```

`FROM>TO` clicks the link to `TO` on `FROM`; `FROM<TO` goes there, then measures Back. `--film` writes a
contact sheet per row from the frames really painted: a screencast on Chromium, a 25 fps recording elsewhere.
Playwright's Firefox recording breaks into tiles on these pages, so do not judge Firefox from it.
`--real-firefox` drives the installed Firefox through geckodriver in a window, on the GPU, prints how it draws,
then frames, median, p95 and worst for the motion alone. **Run it before calling any motion smooth**, and leave
the window alone while it runs. `--headless` draws in software (`WebRender (Software)`), which overstates every
cost: on 2026-11-01 headless Firefox ran a transition at 42 to 50 ms a frame, a stand-in for the stage was built
to save it, and on the GPU on 2026-11-02 the same change held 13 to 14 ms with or without it, while the owner saw
the stage drop out. Compare variants in pairs over several visits, and never trust a single row. To find a cost,
hide one layer at a time with a constructed stylesheet at runtime, and read a slow frame's cause with Firefox's
profiler (`Services.profiler` in the chrome context) before blaming page code. Open the sheets with the Read tool: a table
cannot show a piece that moves badly, and on
2026-11-01 a table said 300 ms while the owner saw nothing move, because the curve had covered 90 % of the
travel in 99 ms. A motion has to be judged by how long it takes to cross, not only by when it ends.
`--pops` records the real painted frames on Chromium and reports a frame that nobody meant: a large area that
jumps for one to three frames and comes back. Run it on any change to a transition. On 2026-11-01 the film
showed a clean book while a blank page painted for three frames after the motion and once before it, because
a film seeks only inside the motion; `--pops` and the recorded frames found both. A reading of a few patches
can be a moving edge passing through, so open the frames before calling it a bug or clearing it.
Exit 1 means a row hid the page, left a name, threw, showed a stray frame, or ran past 400 ms (700 ms for the
book).

## From audit to test

An audit shows a prototype; a test keeps a shipped piece true. When a layout ships, turn its audit into
an end-to-end check in `tests/e2e/`, as `tests/e2e/hubs.spec.ts` does for the hubs ("nothing on a Codex
door is cut at 1512x860, whichever door is lit" and "nothing on the Livres contents is cut at 1512x860,
whichever entry is lit", one test per size) and `tests/e2e/select-screen.spec.ts` for the spotlight
("every entry fits its spotlight"). The test asserts what the code decides, never the content inventory
(`.claude/rules/quality/testing.md`). A bug fix comes with a test that follows the reader's real path,
fails on the build without the fix and passes with it.

## Capture an accepted piece

Only accepted pieces are captured (`rulings.md`). Take the capture from the built site with
`channel: 'chromium'`, at 1512 × 860, in French, the pointer parked in a corner, after about three seconds
so the arrival and the living stage have settled; save it as JPEG, 1400 px wide, quality 80, with
`sharp(png).resize({ width: 1400 }).jpeg({ quality: 80, mozjpeg: true })`, into `../assets/approved/`
under the piece's name. Measure the file (about 65 to 150 KB) and cite it from `approved-pieces.md`; a
capture nothing cites is not kept.

An approved motion is captured as a film strip: `pnpm design:transit --film=DIR` on the approved edge, in
French, at 1512 × 860, then the contact sheet saved as JPEG 1800 px wide, quality 80, so its 32 frames stay
readable (about 190 KB). Name it after the change, such as `page-change-sheet-open.jpg`.
