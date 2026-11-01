# Web techniques behind the pieces

The browser features the approved pieces rely on, where Aubaine uses each one, and what this project
learned about it. Links go to MDN and caniuse, the specifications, their tests and the CSS Working
Group's issues, the browser makers' guides and source code, and the tools' own documentation; every one
was fetched on 2026-10-31. A component named without its folder lives in `src/components/primitives/`.

## Contents

- [Measuring transformed pieces](#measuring-transformed-pieces)
- [Transforms](#transforms)
- [Clip paths and masks](#clip-paths-and-masks)
- [Shadows](#shadows)
- [Container queries and units](#container-queries-and-units)
- [Writing modes](#writing-modes)
- [Colour](#colour)
- [Selectors and state](#selectors-and-state)
- [User preferences and print](#user-preferences-and-print)
- [Layout and stacking](#layout-and-stacking)
- [Popovers and anchors](#popovers-and-anchors)
- [Scripts](#scripts)
- [The WebGL stage](#the-webgl-stage)
- [Astro, Swup and Playwright](#astro-swup-and-playwright)
- [Browser support and Baseline](#browser-support-and-baseline)

## Measuring transformed pieces

- `getBoundingClientRect()` returns the smallest axis-aligned rectangle around an element's border box
  after its transforms, not its corners. A rotated plate or a skewed panel looks bigger than it is, and
  where its corners sit is unknown. The other ready answers do not help: `offsetWidth` and
  `offsetHeight` give the layout size and ignore transforms, Playwright's `boundingBox()` returns the
  same axis-aligned box, and `getBoxQuads()`, which would return the corners, is off by default in
  Firefox and missing from Chrome, Edge and Safari. A 0 × 0 absolutely positioned probe at each corner
  inherits every transform above it, so its box is that corner's true position; `tools/design/audit.ts`
  reads pieces that way (`measuring.md`).
  [getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect),
  [dimensions of elements](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements),
  [boundingBox](https://playwright.dev/docs/api/class-locator#locator-bounding-box),
  [getBoxQuads support](https://caniuse.com/mdn-api_element_getboxquads),
  [CSSOM View](https://drafts.csswg.org/cssom-view/).

## Transforms

- The individual properties `translate`, `rotate` and `scale` apply in that order, before `transform`,
  so a piece can take a pose (a resting tilt) and an animation (a lift) on separate properties without
  one overwriting the other. Drive states with them, and keep `transform` for arrivals, for `skewX()`,
  `perspective()`, `rotateX()` and `rotateY()`, and for a pose that must follow one of those. The plate
  door rotates its plates with `rotate`, lifts its name with `translate` and grows it with `scale`, while
  the name's arrival keyframe animates `transform`; `FramedCard.astro` keeps its `rotate: -2deg` pose
  beside the `transform` that holds its perspective tilt. The slanted doors skew the whole panel with
  `transform`, and each piece inside undoes that skew with `skewX(var(--slant))` in its own `transform`,
  followed by its pose, so the piece shows only its pose (`SlantedDoor.astro`).
  [translate](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/translate),
  [rotate](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/rotate),
  [scale](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scale),
  [transform-origin](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-origin),
  [individual transform properties](https://web.dev/articles/css-individual-transform-properties),
  [CSS Transforms 2](https://drafts.csswg.org/css-transforms-2/).
- Any value but `none`, an identity such as `translate: 0 0px` included, makes a piece a stacking context
  and the containing block of all its descendants, `position: fixed` ones too, whether it sits on
  `transform` or on an individual property. Rest at `none` when a piece must be neither: from 960 px
  wide `.au-slant` rests at `translate: 0 0px`, so every slanted door is both.
  [transform](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform),
  [CSS Transforms 1](https://drafts.csswg.org/css-transforms-1/),
  [CSS Transforms 2](https://drafts.csswg.org/css-transforms-2/).
- Grow a lit name from a stated origin (`transform-origin: left bottom` on the plate door) and reserve
  the room it grows into, so nothing under the pointer moves.
- Derive a lean from its angle with `tan()`, as in `calc(var(--row-h) * tan(var(--slant)) / 2)`, rather
  than typing the tangent; `tan()` is Baseline since March 2023. `SlantedDoors.astro` types
  `--slant-tan: 0.1405` beside `--slant: 8deg`, and below 960 px `--slant` drops to `4deg` while
  `--slant-tan` stays, harmless only because its one reader, `--lean`, pads the row's sides and that
  padding resets there.
  [tan()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/tan).
- Animate transforms and opacity: they run on the compositor and cost no layout. Keep properties that
  trigger layout or paint out of transitions unless a trace shows the cost is fine: `.au-slant`
  transitions `flex-grow` for 0.36 s, which lays the row out again on every frame, so profile it on a
  mid-range laptop.
  [Animations guide](https://web.dev/articles/animations-guide),
  [compositor-only properties](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count).

## Clip paths and masks

- `clip-path` cuts what is painted, not the box: layout and `getBoundingClientRect()` ignore it, the
  clipped-out parts take no pointer events, and any value but `none` makes a stacking context. The
  card's slab and the hub's band are polygons; measure the polygon, as `clippedPieces` in
  `tests/e2e/select-screen.spec.ts` does, and keep a decorative clipped layer at `pointer-events: none`,
  as the plate door's slab and the scene holding its band are. A clip also cuts the piece's own shadows,
  so a hexagon that needs a glow or an outline is drawn as an inline SVG polygon. MDN has `clip-path`
  Baseline since January 2020, while caniuse calls it partial on HTML in every Chrome, Edge and Safari
  version; a plain `polygon()` is safe.
  [clip-path](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clip-path),
  [CSS Masking](https://drafts.csswg.org/css-masking-1/),
  [support](https://caniuse.com/css-clip-path).
- A pictogram is painted through a mask: `DoorGlyph.astro` masks its four layers with the icon file that
  `iconMask()` in `src/lib/media.ts` names (`url('/icons/<set>/<name>.svg')`), and intersects the icon
  with a gradient for the halftone dots. Write a composited mask in this order: `-webkit-mask`, then
  `-webkit-mask-composite: source-in`, the prefixed name of the same operation, then `mask`, then
  `mask-composite: intersect`. The `mask` shorthand resets `mask-composite` to `add`, so the longhand
  must follow it, as it does on the dots. The plate door band's and the slanted door light's `::after`
  layers pair `-webkit-mask-image` with `mask-image`, while `StageBackdrop.astro`'s halftone sets only
  `mask-image`; `mask` is Baseline only since December 2023, and a browser that knows only the prefixed
  property paints those dots unmasked. A mask changes neither the box nor hit testing.
  [mask](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mask),
  [mask-composite](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mask-composite),
  [-webkit-mask-composite](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/-webkit-mask-composite),
  [masking with images](https://web.dev/articles/css-masking),
  [support](https://caniuse.com/css-masks).
- MDN requires a `data:` URL to percent-encode reserved characters such as `#`, spaces and newlines;
  encode `<` and `>` as well. `--au-caption-mark` in `src/styles/prose.css`, an inline SVG mask, encodes
  its `<` and `>` and leaves its spaces raw. A mask or a clip loaded from a file is fetched CORS-enabled
  in anonymous mode, so keep it on the site's own origin, as `iconMask()` does.
  [data: URLs](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data),
  [CSS Masking](https://drafts.csswg.org/css-masking-1/).
- Booklets never print a CSS mask: Quartz, the renderer of Preview and Safari, draws Chromium's printed
  masks as solid blocks (`measuring.md` § Booklets in print).

## Shadows

- A plate casts a zero-blur `box-shadow` (`0.06em 0.07em 0` on the door plates), which follows its
  rectangle. A shape that is not a rectangle, such as a door's hexagon, takes
  `filter: drop-shadow(3px 4px 0 rgba(6, 5, 13, 0.6))` instead, which follows the alpha of what it
  draws. A `filter` other than `none` makes a stacking context and paints its descendants as one group.
  [drop-shadow()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/drop-shadow),
  [Filter Effects 1](https://drafts.csswg.org/filter-effects-1/).

## Container queries and units

- A piece sized from its container keeps its proportions wherever it is placed. The select screen's
  spotlight is a size container, the hub section and the slanted row are inline-size containers, and the
  slanted door's art area is a size container so its pictogram fits the room left above the title.
  [Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries),
  [container size and style queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_size_and_style_queries),
  [container-type](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/container-type),
  [CSS Conditional 5](https://drafts.csswg.org/css-conditional-5/),
  [support](https://caniuse.com/css-container-queries).
- `container-type: size` needs a height from outside its content, or it collapses; give it a flex or
  grid track.
- Container units (`cqw`, `cqh`, `cqi`, `cqb`) resolve against the nearest ancestor container that can
  answer on that axis, and fall back to the small viewport size when none can. An element's own
  `container-type` never answers its own units, so set it on the wrapper whose size should drive the
  piece. A missing container fails quietly: the fallback gives plausible sizes on one screen and wrong
  ones on another.
  [length](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length).
- Keep a container-relative length in an unregistered custom property. Its value stays a stream of
  tokens until `var()` substitutes it, so the `100cqi` inside `--content` on `.au-plate-menu` is measured
  where a descendant reads it, against the menu, that descendant's nearest container. The slanted row's
  `--share`, `--open-w`, `--name-size`, `--spine-size` and `--band-size`, and `--column` on
  `.au-sommaire`, work the same way. Registered with `@property` as a `<length>`, such a value would
  compute on the element that declares it, against that element's own ancestors: this follows from the
  computed-value rules and has not been checked in a browser.
  [CSS Custom Properties 1](https://drafts.csswg.org/css-variables-1/),
  [Properties and Values API 1](https://drafts.css-houdini.org/css-properties-values-api-1/).

## Writing modes

- A spine name runs along its panel with `writing-mode: vertical-rl`, where the default
  `text-orientation: mixed` lays Latin letters on their side to read top to bottom; the
  `rotate(calc(180deg + var(--slant)))` at the end of its own `transform` turns it to read bottom to top
  along the panel's slant (`SlantedDoor.astro`). `writing-mode: sideways-lr` reads bottom to top
  natively from Chrome and Edge 132, Firefox 43 and Safari 18.4, and could replace the half turn behind
  `@supports` once that coverage is enough.
  [writing-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/writing-mode),
  [text-orientation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-orientation),
  [sideways-lr support](https://caniuse.com/mdn-css_properties_writing-mode_sideways-lr),
  [CSS Writing Modes 4](https://drafts.csswg.org/css-writing-modes-4/).
- Inside vertical writing, an element's inline axis is vertical: `max-inline-size: var(--spine-room)`
  caps the spine's height, and `cqi` asks for a container that can answer vertically. An inline-size
  container cannot, and the unit falls back to the small viewport's height: the spines first came out at
  the wrong size that way. Size there with `cqw` or `cqh`, as the spine's size does through `--share`,
  measured in `cqw` against the slanted row. The CSSWG resolved it: "Writing-mode sensitive viewport
  units (and analogous units) use the writing mode of the element they're used on" (#6873). A
  web-platform-tests case checks it, and the spec text still waits on #7429.
  [resolution #6873](https://github.com/w3c/csswg-drafts/issues/6873),
  [test case](https://raw.githubusercontent.com/web-platform-tests/wpt/master/css/css-conditional/container-queries/container-units-selection.html),
  [issue #7429](https://github.com/w3c/csswg-drafts/issues/7429).

## Colour

- `color-mix()` blends a door's colour into night and paper into ink by a percentage computed from a
  state, `calc(var(--lit) * 100%)`, so one property answers rest, lit and pointed. Every mix in the code
  names its space, `in srgb`; left out, the space defaults to `oklab`. A mix toward `transparent` keeps
  its hue as the alpha falls, because the mix runs on premultiplied colours: the door glyph's dots mix
  `--door-colour` 60 % with `transparent`, and the card's frames mix `--gold` the same way. Forced
  colours replace the result with a system colour, so no state rests on a tint alone
  (`accessibility.md`).
  [color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color-mix),
  [CSS Color 5](https://drafts.csswg.org/css-color-5/),
  [CSS Color Adjust 1](https://drafts.csswg.org/css-color-adjust-1/).
- `--lit`, `--pointed` and the slanted door's `--open` are unregistered custom properties that switch
  between 0 and 1; a custom property animates discretely, so they never tween. The transitions sit on
  the properties that read them (background colour, scale, translate), which do. Register a switch with
  `@property`, Baseline since July 2024, only when the number itself must tween: `syntax` and `inherits`
  are then required, and `inherits: false`, far cheaper in web.dev's benchmark, does not fit, since the
  doors' descendants read the switches.
  [custom property reference](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/--*),
  [Custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties),
  [@property](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property),
  [@property performance](https://web.dev/blog/at-property-performance),
  [Properties and Values API 1](https://drafts.css-houdini.org/css-properties-values-api-1/).

## Selectors and state

- `:has()` lets the doors light without JavaScript: `src/styles/doors.css` lights the first door, moves
  the light to a door under `:focus-visible`, or under `:hover` while no door holds keyboard focus, and
  lights a door while it is pressed (`:active`). Once `src/scripts/door-light.ts` marks the menu
  `data-live`, the doors' `data-lit` and `data-pointed` attributes take over from `:hover` and
  `:focus-visible`.
- Anchor each `:has()` on the menu or the door (`[data-doors]:has(...)`, `[data-door]:has(...)`), never
  on `body` or `:root`, since the browser re-checks the whole subtree of the anchor on every change inside
  it. Keep the inner selector tight: MDN suggests `>` or `+` to limit the traversal, while `doors.css`
  uses descendant inner selectors over one menu or one door. One rule anchors on `:root`,
  `:root:has(#swup[data-section="atlas"]) #site-footer` in `src/styles/base.css`, which hides the footer
  on the Atlas; check its style recalculation after a Swup swap. `:has()` parses unforgivingly: one
  selector it cannot read drops the whole rule, unless it sits inside `:is()` or `:where()`.
  [:has()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has),
  [the family selector](https://developer.chrome.com/blog/has-m105),
  [Selectors 4](https://drafts.csswg.org/selectors-4/),
  [support](https://caniuse.com/css-has).
- `:focus-visible` draws focus for the keyboard without drawing it for every click; `src/styles/base.css`
  gives it a gold outline. Focus lights a door only when it is keyboard focus: `doors.css` matches
  `a:focus-visible`, and in `door-light.ts` the `focusin` handler and `keyboardInside()` test
  `matches(':focus-visible')`, leaving focus from a click to the pointer handlers. When script moves
  focus, `focus()` scrolls the element into view unless `preventScroll` is set, and its `focusVisible`
  option forces the ring; check that option's support before relying on it.
  [:focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible),
  [focus()](https://html.spec.whatwg.org/multipage/interaction.html).
- `(hover: hover) and (pointer: fine)` limits hover effects to a primary input that hovers precisely, so
  a touch screen never lights a door by a stray hover; never switch behaviour on `any-hover` or
  `any-pointer` alone. The tilt rules in `FramedCard.astro` and `src/styles/base.css` also require
  `prefers-reduced-motion: no-preference`. In script, `door-light.ts` and `src/scripts/select-screen.ts`
  ignore a touch pointer (`pointerType === 'touch'`) when it points at a door or a card.
  [hover](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/hover),
  [pointer](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/pointer),
  [Media Queries 4](https://drafts.csswg.org/mediaqueries-4/),
  [pointerType](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType),
  [matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia).

## User preferences and print

- `prefers-reduced-motion: reduce` shortens every animation and transition to 0.001 ms, with no delay
  and a single iteration (`src/styles/base.css`), rather than removing them, so states still change and
  arrivals land on their final pose; the WebGL stage's module is never fetched. Measure layouts under
  reduced motion, as `tests/e2e/hubs.spec.ts` and `tools/design/pixels.ts` do, so no arrival is caught
  halfway. Which motion must stop for these readers is in `accessibility.md`.
  [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion).
- Under `forced-colors: active`, colours become system colours, with a backplate behind text, and
  `box-shadow`, `text-shadow` and every `background-image` without a `url()` compute to `none`: gradient
  halftones vanish on their own and the plates lose their shadows. A `filter` and a `url()` background
  survive, so the hexagons keep their `drop-shadow` and an art stage keeps its blurred painting; decide
  for each whether it should stay. Never set `forced-color-adjust: none` for looks: MDN warns that it must
  not override the reader's choice.
  [forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/forced-colors),
  [CSS Color Adjust 1](https://drafts.csswg.org/css-color-adjust-1/),
  [forced-color-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/forced-color-adjust),
  [forced colors in Edge](https://blogs.windows.com/msedgedev/2020/09/17/styling-for-windows-high-contrast-with-new-standards-for-forced-colors/).
- The plate door hides its slab and its scene, straightens its plates and draws focus as a `CanvasText`
  outline (`PlateDoor.astro`); the slanted door draws a 2 px `CanvasText` border round its panel, hides
  its ground, light and art, and outlines focus in `Highlight` (`SlantedDoor.astro`); the title plates
  and their help button stand straight (`TitlePlates.astro`), and `FramedCard.astro` hides its emblem,
  slab and glare (`accessibility.md`).
- Print drops the stage and turns the inks dark: each hub piece, `FramedCard.astro` and
  `StageBackdrop.astro` carry print blocks that drop the stage, the slabs and the shadows and set tilted
  plates and cards straight, and the plate and slanted doors print their names in dark ink with no plate
  fill. The initial `print-color-adjust: economy` lets the browser drop backgrounds anyway, so print no
  ink that needs its fill to read. Check a print block with `page.emulateMedia({ media: 'print' })`, as
  `tests/e2e/hubs.spec.ts` and `tests/e2e/hub-stage.spec.ts` do.
  [Printing](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing),
  [using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using),
  [print-color-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/print-color-adjust),
  [Media Queries 5](https://drafts.csswg.org/mediaqueries-5/).

## Layout and stacking

- `isolation: isolate` makes each stage section a stacking context, so a stage at `z-index: -1` paints
  over the section's own background and under its content. Give it to every root that paints art at
  `z-index: -1`, as the hub roots do for their stage layer and the plate door's name does for its slab.
  Do not count on `container-type` for it: MDN still lists size and inline-size containers as stacking
  contexts, but the CSSWG resolved that `container-type` no longer forces layout containment, only an
  independent formatting context (#10544). A blend mode reaches only as far as the nearest stacking
  context: the card's `soft-light` glare blends inside its rotated card (`FramedCard.astro`).
  [isolation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/isolation),
  [stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context),
  [resolution #10544](https://github.com/w3c/csswg-drafts/issues/10544),
  [Compositing and Blending 1](https://drafts.csswg.org/compositing-1/).
- `overflow: clip` clips without making a scroll container: nothing inside can be scrolled, not even by
  script, so never clip focusable content larger than the box, and sticky pieces keep sticking to the
  page. `overflow-x: clip` beside a visible `overflow-y` stays valid. A transformed or bleeding piece
  extends its ancestors' scrollable overflow, so clip decorative bleed where it is hosted:
  `overflow: clip` sits on `.au-plate-menu`, `.au-sommaire`, the stage and each slanted door's link, and
  `overflow-x: clip` on `.au-slants`, and the plate door's 46vw band and the stage's 48 px bleed rely on
  them. Assert that `scrollWidth` minus `clientWidth` stays 0, as `tests/e2e/hubs.spec.ts` does.
  MDN gives `overflow-clip-margin` only limited availability.
  [overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow),
  [CSS Overflow 3](https://drafts.csswg.org/css-overflow-3/),
  [overflow-clip-margin](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-clip-margin),
  [CSS Transforms 1](https://drafts.csswg.org/css-transforms-1/).
- `svh` sizes a stage to the small viewport, which holds still while a phone's browser bar slides: the
  hub roots take `min-height: calc(100svh - var(--header-h))`. `dvh` sizes the page shell
  (`min-height: 100dvh` in `src/layouts/Base.astro`) and the home and threshold views; keep it for a
  surface that must fit the screen exactly, since dynamic units change while the page scrolls and
  browsers throttle their updates. No viewport unit subtracts a classic scrollbar, so `100vw` can
  overflow.
  [length](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length),
  [viewport units](https://web.dev/blog/viewport-units),
  [CSS Values 4](https://drafts.csswg.org/css-values-4/).
- `clamp()` fits a size between a floor and a cap; the plate names are fitted from the longest word that
  way. `clamp(MIN, VAL, MAX)` is `max(MIN, min(VAL, MAX))`, so a floor above the cap wins, which is why a
  floor that depends on the room sits inside `min()`: the plate menu's `--name-px` opens with
  `min(var(--name-floor), ...)`, and the title plates take
  `clamp(min(38px, 10.5cqi), var(--plate-fit), 112px)`. Such a floor binds only when it is not built on
  the preferred value itself: `clamp(min(20px, fit), fit, 28px)` is just `min(fit, 28px)`, so write that.
  Never size type in `vw` or `cqi` alone, which
  stops it following the reader's text size, and check display type at 200 % zoom (`accessibility.md`).
  MDN asks for a cap in a relative unit, at least twice the floor; the plate caps are in px.
  [clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/clamp),
  [CSS Values 4](https://drafts.csswg.org/css-values-4/),
  [fluid type](https://web.dev/learn/design/typography).
- `aspect-ratio` reserves a card's or a pictogram's box before its picture arrives, so nothing shifts:
  `.au-framed` holds 3:4 with every layer positioned out of flow, and the doors' giant glyphs hold 1:1.
  In-flow content can stretch a ratio box, whose automatic minimum size is its min-content size unless
  it is a scroll container, and `overflow: clip` does not prevent that, since a clipped box is not one;
  when content enters the flow, add `min-block-size: 0` or make the box a scroll container.
  [aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/aspect-ratio),
  [CSS Box Sizing 4](https://drafts.csswg.org/css-sizing-4/),
  [CSS Overflow 3](https://drafts.csswg.org/css-overflow-3/),
  [Cumulative Layout Shift](https://web.dev/articles/cls).
- `text-wrap: balance` evens the lines of a short tagline (`.au-plate-door__line`) or spine
  (`.au-slant__spine`); Chromium balances six lines at most and Firefox ten. Balanced lines end narrower
  than their box, so measure the ink of text with `Range.getClientRects()` or a probe in an inline
  wrapper, never with the block's box.
  [text-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap),
  [text-wrap-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap-style),
  [text-wrap: pretty](https://webkit.org/blog/16547/better-typography-with-text-wrap-pretty/),
  [balanced text](https://developer.chrome.com/docs/css-ui/css-text-wrap-balance),
  [support](https://caniuse.com/mdn-css_properties_text-wrap_balance).
- `scroll-margin` keeps a focused door clear of the sticky header: `.au-plate-door__link` sets
  `scroll-margin-block: calc(var(--sticky-top) + 8px) 16px`, and anchor targets such as section heads
  set `scroll-margin-top: var(--sticky-top)`. It applies to every scroll into view, snapping or not, the
  one `focus()` makes included; `scroll-padding` on the scrolling box reserves the same room for every
  target. Check it by tabbing in Playwright and comparing the focused box with the header's
  (`accessibility.md`).
  [scroll-margin](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-margin),
  [scroll-margin-block](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-margin-block),
  [scroll-padding](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-padding),
  [CSS Scroll Snap 1](https://drafts.csswg.org/css-scroll-snap-1/).
- `backdrop-filter` blurs what is behind the header's menus (`src/components/shell/Header.astro`) and the
  Atlas panels (`src/styles/atlas.css`); count that blur in the contrast of the text on top
  (`accessibility.md`).
  [backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter).
- `@starting-style` gives an element its first style when it appears, and a `display` transition marked
  `allow-discrete` keeps it shown while it fades, so a rule tooltip fades in and out of `display: none`
  (`[data-tip]` in `src/styles/base.css`). Since Chrome 130 the `@starting-style` block must come after
  the normal rule, as it does there. Treat the fade as an enhancement: `@starting-style` is Baseline
  since August 2024, but MDN gives `transition-behavior` only limited availability, and caniuse calls
  Firefox partial from 129.
  [@starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style),
  [transition-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-behavior),
  [entry and exit animations](https://developer.chrome.com/blog/entry-exit-animations),
  [transition-behavior support](https://caniuse.com/mdn-css_properties_transition-behavior).

## Popovers and anchors

- The help note is a native popover: top layer, light dismiss on an outside click or Escape, and no
  JavaScript needed (`PopoverNote.astro`). From 560 px wide it is placed under its button with CSS
  anchor positioning inside `@supports (anchor-name: --a)`; on a phone, or where anchoring is missing,
  it opens centred. Inside the guard alone, the note undoes the browser's centring (`inset: 0` and
  `margin: auto`) with `inset: auto` and `margin: 8px 0`, and takes `position-area: bottom span-right`
  with `position-try-fallbacks: flip-block, flip-inline`. MDN marks `anchor-name` and `position-area`
  Baseline since January 2026, while caniuse calls anchoring partial in Chrome and Edge from 125 and in
  Firefox from 147, and full in Safari only from 27: keep the guard and test the centred fallback.
  [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API),
  [popover](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover),
  [anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning),
  [position-area](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-area),
  [anchor positioning API](https://developer.chrome.com/docs/css-ui/anchor-positioning-api),
  [support](https://caniuse.com/css-anchor-positioning).
- Each invoker names its anchor, as the title plates' button sets `anchor-name: --hub-note`, and the
  note points at that name with `position-anchor`. A name must be unique on the page: the note follows
  the last element in source order that carries it. An invoker is also its popover's implicit anchor, so
  the explicit name is optional.
  [anchor-name](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/anchor-name),
  [using popovers](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using).

## Scripts

- The door light follows `approved-pieces.md` § The door contract (`src/scripts/door-light.ts`).
- Wait for a picture before showing it: `HTMLImageElement.decode()` resolves once the picture is decoded,
  and the door light races it against 250 ms so a slow picture never holds the swap; the spotlight's
  `show()` in `src/scripts/select-screen.ts` does the same for a picture not yet complete. `decode()`
  rejects with an `EncodingError` when the request fails, the source changes or the data is corrupt, and
  both scripts swap anyway. The browser aims to keep decoded data for at least one frame, so decode just
  before use; the door light also decodes every door's picture 600 ms after it mounts and reuses that
  result at the swap. The stage paints the same URL as a CSS background; whether that background reuses
  the decode through the image cache is unconfirmed, so check it in a performance trace.
  [decode()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode),
  [decoding images](https://html.spec.whatwg.org/multipage/embedded-content.html).
- Tear a mounted root down with its own `AbortController`: pass its signal to every `addEventListener`,
  so aborting removes them all, and clear the root's timers and observers in its `abort` handler, as
  `door-light.ts` and `select-screen.ts` do. `AbortSignal.any()`, Baseline since March 2024, merges a
  mount signal with a per-swap one; the spotlight's `show()` checks the two in turn.
  [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController),
  [addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener),
  [AbortSignal.any()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static),
  [DOM Standard](https://dom.spec.whatwg.org/).
- `requestAnimationFrame` hands every callback in a frame the same timestamp, counted from the
  document's own time origin and coarsened (to 0.1 ms, or 0.005 ms when cross-origin isolated, with
  possible jitter), which is why two same-origin iframes drift even with identical code (`measuring.md`
  § Live side by side for the owner). Drive motion from that timestamp, never from a count of frames, since refresh
  rates differ: the WebGL stage advances its clock by the time between frames, at most 0.1 s a step
  (`src/scripts/art-effect/stage.ts`). Most browsers pause frames in background tabs and hidden iframes.
  [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame),
  [animation frames](https://html.spec.whatwg.org/multipage/webappapis.html),
  [High Resolution Time](https://w3c.github.io/hr-time/),
  [DOMHighResTimeStamp](https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp).

## The WebGL stage

- One WebGL2 context serves every art effect on a page, the stage included
  (`src/scripts/art-effect/studio.ts`): Chromium keeps at most 16 WebGL contexts active (8 on Android,
  4 in workers) and loses the oldest past that, so the studio draws in its one context and copies each
  result into the effect's 2D canvas (`copyOut()`). The torchlit book pictures still open one WebGL
  context each (`src/scripts/torchlight.ts`).
  [Chromium context limit](https://chromium.googlesource.com/chromium/src/+/main/content/renderer/webgraphicscontext3d_provider_impl.cc),
  [Blink, too many contexts](https://chromium.googlesource.com/chromium/src/+/main/third_party/blink/renderer/modules/webgl/webgl_rendering_context_base.cc).
- The studio asks for `failIfMajorPerformanceCaveat: true` and `powerPreference: 'low-power'`, keeps
  `alpha: true` as MDN advises, refuses a software renderer and loses that context at once, sizes its
  work under `MAX_TEXTURE_SIZE` and `MAX_VIEWPORT_DIMS` (`textureLimit()`), and links its painter only
  where `EXT_color_buffer_float` exists. `src/scripts/art-effect/gl.ts` links programs through
  `KHR_parallel_shader_compile` and waits for GPU work on a fence polled once a frame (`gpuDone()`)
  rather than blocking.
  [WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices),
  [getContext()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext).
- A lost context can be restored only if the `webglcontextlost` handler calls `preventDefault()`. The
  studio does not: it drops the lost context, and the next `openStudio()` makes a new one.
  `tests/e2e/art-effect.spec.ts` forces a loss with `WEBGL_lose_context` and checks that a new context
  draws.
  [webglcontextlost](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event),
  [WEBGL_lose_context](https://registry.khronos.org/webgl/extensions/WEBGL_lose_context/).
- The stage draws only while on screen and not paused, at the frame rate of its tier.
- The CSS stage is complete on its own: without JavaScript, without WebGL2, on the low tier and under
  reduced motion it is the whole stage.

## Astro, Swup and Playwright

- **Astro** scopes a component's styles with a `data-astro-cid-*` attribute on its elements and in its
  selectors, so under the default `attribute` strategy, which `astro.config.mjs` keeps, a scoped selector
  gains the specificity of one attribute. Scoped styles stop at a child component's markup: reach in
  with `:global()`, as `PlateDoor.astro` styles its `Icon` through `:global(.au-plate-door__glyph)`, or
  pass `class` and spread `...rest` on the child's root so the attribute arrives, as `FramedCard.astro`
  does. `getImage()` runs on the server only: call it in frontmatter or build code and hand its URL to
  CSS or scripts, as `src/lib/stage-ambient.ts` makes the stage's 128 px WebP ambient for `--stage-art`.
  [Styling](https://docs.astro.build/en/guides/styling/),
  [configuration](https://docs.astro.build/en/reference/configuration-reference/),
  [Images](https://docs.astro.build/en/guides/images/),
  [astro:assets](https://docs.astro.build/en/reference/modules/astro-assets/).
- **Swup** replaces the page's content without a reload: bind page scripts on load and on `page:view`,
  once the new content is visible, as `bindDoorLights()` and `bindSelectScreens()` do, and tear them
  down when their element leaves; the door light, the spotlight and the art effects abort each root that
  `page:view` finds disconnected. Swup's session stays in memory and keeps whatever leaks, and its guide
  cleans up a step earlier, before `content:replace`: stop timers, frame loops and GPU work there. Its
  accessibility plugin, on in `astro.config.mjs`, announces the new page from the first it finds of the
  `h1`'s `aria-label`, the `h1`'s text, the title and the URL; the title plates' `h1` carries
  `aria-label={title}`.
  [Hooks](https://swup.js.org/hooks/),
  [lifecycle](https://swup.js.org/lifecycle/),
  [reloading scripts](https://swup.js.org/getting-started/reloading-javascript/),
  [a11y plugin](https://swup.js.org/plugins/a11y-plugin/).
- **Playwright** drives the measurements and the tests: `page.clock` controls time, faking timers and
  `requestAnimationFrame` among others; `emulateMedia` sets reduced motion, print and forced colours;
  screenshots capture full pages; and a locator's box reads an upright piece's position. Compare
  screenshots with animations off, the default of `toHaveScreenshot`, which stops CSS animations,
  transitions and Web Animations; with the pointer parked off every hover target, since a screenshot
  keeps whatever hover is on (`tools/design/pixels.ts` parks it in a corner); and on the baseline's
  system and hardware, since rendering varies with both. `playwright.config.ts` names no channel, and the
  `chromium` channel draws WebGL on the GPU (`measuring.md` § Lit pieces on the GPU).
  [Clock](https://playwright.dev/docs/clock),
  [emulateMedia](https://playwright.dev/docs/api/class-page#page-emulate-media),
  [screenshots](https://playwright.dev/docs/screenshots),
  [visual comparisons](https://playwright.dev/docs/test-snapshots),
  [toHaveScreenshot](https://playwright.dev/docs/api/class-pageassertions),
  [boundingBox](https://playwright.dev/docs/api/class-locator#locator-bounding-box),
  [browsers and channels](https://playwright.dev/docs/browsers).

## Browser support and Baseline

- Read MDN's Baseline banner first: a feature is Baseline newly available once it works in every core
  browser, and widely available 30 months later. "Baseline since March 2023" in this file names the
  month a feature reached every core browser. Read caniuse next for partial support. Where the two
  disagree, as on anchor positioning (§ Popovers and anchors), guard the feature with `@supports` and
  test the fallback. A design report names the Baseline status of every feature it brings in.
  [Baseline](https://web.dev/baseline).
