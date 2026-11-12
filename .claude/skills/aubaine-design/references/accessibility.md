# Accessibility and game UX

Aubaine looks like a game and behaves like a website. Its target is WCAG 2.2 AA
(`.claude/rules/frontend/accessibility.md`); the game industry's own guidelines add what a dressed-up
interface needs: stages, motion, patterns and lit states. Each practice below names its sources and says
what the site already does. Every link was fetched on 2026-10-31; two are marked *(browser only)*.

## Contents

- [Stages and paintings](#stages-and-paintings)
- [Plates and type](#plates-and-type)
- [Doors, links and targets](#doors-links-and-targets)
- [Lit and pointed states](#lit-and-pointed-states)
- [Focus](#focus)
- [Motion and the pause](#motion-and-the-pause)
- [Navigation and page changes](#navigation-and-page-changes)
- [Colour and composition](#colour-and-composition)
- [Testing a piece](#testing-a-piece)
- [Open gaps on the site](#open-gaps-on-the-site)
- [Sources](#sources)

## Stages and paintings

- **A stage is decoration.** Paint it as a CSS background or an element hidden from assistive technology,
  never an `img` with descriptive alt; information a painting carries goes in text, or in the entry's
  cover shown once as an informative image. Already: `StageBackdrop.astro` is `aria-hidden` and paints
  with `background-image`; the hub's band and pictogram are `aria-hidden`.
  [1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html),
  [C9](https://www.w3.org/WAI/WCAG22/Techniques/css/C9),
  [F3](https://www.w3.org/WAI/WCAG22/Techniques/failures/F3),
  [WAI decorative images](https://www.w3.org/WAI/tutorials/images/decorative/).
- **Text over a painting passes on its own pixels.** Measure each text run against the lightest pixels
  next to its letters, for every painting the stage can show, at every size and in every state: 4.5:1,
  or 3:1 for large text, never rounded up. Reach it with the shade, a halo or a plate; darken the shade
  for a bright painting rather than accept a failure. A door's line from 960 px sits at 0.75 opacity in
  `--ink2`, which computes to 5.51:1 over the darkest stage colour, so the margin over lighter regions
  is thin: measure it. [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
  [G18](https://www.w3.org/WAI/WCAG22/Techniques/general/G18),
  [text over images](https://www.nngroup.com/articles/text-over-images/),
  [XAG 102](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/102).
- **Blur and translucency count against contrast.** Give the plainest version to those who ask: an opaque
  plate or darker shade under `prefers-contrast: more`, opaque panels under
  `prefers-reduced-transparency: reduce`. [Media Queries 5](https://www.w3.org/TR/mediaqueries-5/),
  [Apple, sufficient contrast](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/sufficient-contrast-evaluation-criteria),
  [WWDC23, vision and motion](https://developer.apple.com/videos/play/wwdc2023/10078/).
- **Keep motion away from reading.** Moving stage parts live on the art side, out of the reading
  periphery; long reading pages stay still. "Horizontal movement in the peripheral field of vision can
  cause disorientation or queasiness." (James Craig, WebKit)
  [Responsive design for motion](https://webkit.org/blog/7551/responsive-design-for-motion/),
  [XAG 117](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/117).
- **Stage swaps stay under the flash thresholds.** No more than three large luminance swings a second;
  soften the jump between the darkest and brightest door paintings; never alternate a saturated red stage
  with a dark one quickly. A fast sweep down the doors can swap the stage several times a second once the
  pictures are warm: measure swaps per second and luminance in a sweep.
  [2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html),
  [2.3.2](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes.html),
  [XAG 118](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/118),
  [GAG, flicker and patterns](https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/).
- **Halftone stays low, still and masked.** Never animate or scroll a high-contrast regular pattern; the
  Game Accessibility Guidelines treat static patterns over 40 % of the screen and moving ones over 25 %
  as seizure triggers. Aubaine's dots are dark on dark and still; measure them over the brightest
  painting. [GAG, flicker and patterns](https://gameaccessibilityguidelines.com/avoid-flickering-images-and-repetitive-patterns/).

## Plates and type

- **Plates are live text.** Never an image or SVG of text, so names zoom, translate, accept user spacing
  and recolour. Already: `platesOf` in `src/lib/plates.ts` splits a name into spans with spaces between
  them. [1.4.5](https://www.w3.org/WAI/WCAG22/Understanding/images-of-text.html),
  [1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html),
  [APX, clear text](https://accessible.games/accessible-player-experiences/access-patterns/clear-text/),
  [XAG 101](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/101).
- **Plates survive user spacing, 200 % zoom and 320 px.** Test with line height 1.5, paragraph spacing
  2 em, letter spacing 0.12 em and word spacing 0.16 em; a fitted name widens beyond its reserve, so
  check nothing clips or scrolls sideways. Use em padding and no fixed heights.
  [1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html),
  [C35](https://www.w3.org/WAI/WCAG22/Techniques/css/C35),
  [C36](https://www.w3.org/WAI/WCAG22/Techniques/css/C36),
  [1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
- **Capitals for labels, sentence case for lines.** Cinzel capitals suit names of one to three words,
  which Xbox's text guideline exempts; a tagline or a note stays in sentence case in a reading face, with
  a contrast margin for thin and italic faces.
  [XAG 101](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/101),
  [GAG, clear text formatting](https://gameaccessibilityguidelines.com/use-simple-clear-text-formatting/),
  [GAG, readable size](https://gameaccessibilityguidelines.com/use-an-easily-readable-default-font-size/).
- **Forced colours keep the meaning.** Forced colours remove box shadows and non-URL background images,
  so no meaning rides on them: drop slabs, scenes and halftones, straighten plates, keep outlines, and
  use system colours. Already: the plate door's forced-colours block. Copy it into every new piece.
  [MDN forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors),
  [C40](https://www.w3.org/WAI/WCAG22/Techniques/css/C40),
  [WHCM and system colors](https://adrianroselli.com/2021/02/whcm-and-system-colors.html),
  [Edge, forced colors](https://blogs.windows.com/msedgedev/2020/09/17/styling-for-windows-high-contrast-with-new-standards-for-forced-colors/) *(browser only)*.

## Doors, links and targets

- **A door is one native link named exactly as it reads.** Its accessible name is its visible name, its
  line describes it, and marks stay out of the name. Already: `aria-labelledby` on the name,
  `aria-describedby` on the line, the hexagon `aria-hidden`.
  [2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html),
  [F96](https://www.w3.org/WAI/WCAG22/Techniques/failures/F96),
  [2.4.4](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html),
  [APG names and descriptions](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/),
  [XAG 114](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/114).
- **Strong signifiers, without colour or hover.** The hexagon, the paper plate, the line, the cursor and a
  lit change bigger than a hue. Computed from the tokens, an unlit plate reads 9.16:1 and a lit one
  15.01:1. [Flat UI and signifiers](https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/),
  [GAG, interactive elements](https://gameaccessibilityguidelines.com/give-a-clear-indication-that-interactive-elements-are-interactive/).
- **Targets.** The whole door is the target; every target is at least 24 by 24 CSS px, primary controls
  aim for 44 by 44. The pause square is 38 px: it passes AA and falls short of AAA.
  [2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  [2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html),
  [GAG, large and well spaced](https://gameaccessibilityguidelines.com/ensure-interactive-elements-virtual-controls-are-large-and-well-spaced-particularly-on-small-or-touch-screens/),
  [Apple HIG, accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).
- **Reading order is drawn order.** Source, reading and focus order equal the visual order at every
  width; rotation, grid areas and absolute layers present, never reorder. Recheck it when a kept layout
  reflows doors into columns. One exception, the owner's (2026-11-12, `rulings.md`): heraldry drawn
  right of its text comes first in the source, so that it stacks above the text below 30rem as the
  pieces on the left do; it holds only while the piece offers nothing a keyboard can reach. [1.3.2](https://www.w3.org/WAI/WCAG22/Understanding/meaningful-sequence.html),
  [2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html),
  [C27](https://www.w3.org/WAI/WCAG22/Techniques/css/C27).
- **Structure.** One `main`, one `h1`, doors in a list, all content in landmarks, a skip link; the `h1` is
  also what a Swup visit announces. [APG landmarks](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/),
  [page regions](https://www.w3.org/WAI/tutorials/page-structure/regions/),
  [1.3.1](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html),
  [2.4.1](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html).

## Lit and pointed states

- **Input parity.** What a mouse gets on hover, keyboard focus and a touch press get too, and nothing a
  reader needs exists only behind hover. Already: `doors.css` lights from `:hover` (fine pointers),
  `:focus-visible` and `:active`. [2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html),
  [menu design](https://www.nngroup.com/articles/menu-design/),
  [GAG, same input method](https://gameaccessibilityguidelines.com/ensure-that-all-areas-of-the-user-interface-can-be-accessed-using-the-same-input-method-as-the-gameplay/).
- **One light, and focus wins.** One door holds the light at a time, and a pressed door lights only while
  it is pressed; while keyboard focus is in the menu the pointer cannot move the light; the lit look never
  reads as a second focus ring. Already: `keyboardInside()` in `door-light.ts`, and without JavaScript
  the hover rules of `src/styles/doors.css` stand down while a door holds keyboard focus. [APG keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/),
  [XAG 113](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/113).
- **Every state passes alone.** Measure at rest, pointed, lit and focused: the unlit doors are read first,
  and lighting one unlights the default door; a press lights a second door only while it is held.
  [1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
  [1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html),
  [low contrast](https://www.nngroup.com/articles/low-contrast/).
- **Never colour alone.** Paper, a filled hexagon, size and the slab mark the lit door; the kind's name
  sits beside its mark; two colours told apart by hue alone also differ in lightness by 3:1.
  [1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html),
  [G183](https://www.w3.org/WAI/WCAG22/Techniques/general/G183),
  [F73](https://www.w3.org/WAI/WCAG22/Techniques/failures/F73),
  [Apple, without colour alone](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/differentiate-without-color-alone-evaluation-criteria).
- **What appears on hover stays out of the way.** A scene sits behind or beside its door; anything that
  must overlap content can be dismissed with Escape, hovered and kept until dismissed.
  [1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html).
- **Answer within 0.1 s, wait for intent before big changes.** A pointed door lights at once. Only after
  80 ms of intent does it keep the light when the pointer leaves and take the stage, so a door the pointer
  only crosses does neither. "0.1 second is about the limit for having the user feel that the system is
  reacting instantaneously" (Jakob Nielsen).
  [Response times](https://www.nngroup.com/articles/response-times-3-important-limits/),
  [timing hidden content](https://www.nngroup.com/articles/timing-exposing-content/),
  [powers of 10](https://www.nngroup.com/articles/powers-of-10-time-scales-in-ux/).
- **Targets stay still.** A lit door grows into empty space with its room reserved, so nothing moves under
  the pointer. Already: `--lit-scale` and `--lit-shift` are reserved in `--name-room`.
  [GAG, stationary elements](https://gameaccessibilityguidelines.com/make-interactive-elements-that-require-accuracy-eg-cursor-touch-controlled-menu-options-stationary/),
  [APX, improved precision](https://accessible.games/accessible-player-experiences/access-patterns/improved-precision/).

## Focus

- **Visible and persistent.** Every focusable element shows `:focus-visible`, drawn with `outline` so
  forced colours keep it, never removed by script or animated away.
  [2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html),
  [C45](https://www.w3.org/WAI/WCAG22/Techniques/css/C45),
  [G195](https://www.w3.org/WAI/WCAG22/Techniques/general/G195),
  [F55](https://www.w3.org/WAI/WCAG22/Techniques/failures/F55),
  [F78](https://www.w3.org/WAI/WCAG22/Techniques/failures/F78),
  [MDN :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible).
- **Over a painting.** Use a two-colour ring (two bands at least 9:1 apart) or prove the single colour
  reaches 3:1 against every pixel around it in every lit state; at least a 2 px solid perimeter.
  [C40](https://www.w3.org/WAI/WCAG22/Techniques/css/C40),
  [2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html),
  [focus indicators](https://sarasoueidan.com/blog/focus-indicators/).
- **Never under the sticky header.** Every focusable piece reserves scroll margin equal to the header.
  Already: `.au-plate-door__link` sets `scroll-margin-block`.
  [2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html),
  [2.4.12](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced.html),
  [C43](https://www.w3.org/WAI/WCAG22/Techniques/css/C43),
  [F110](https://www.w3.org/WAI/WCAG22/Techniques/failures/F110).

## Motion and the pause

- **Short and purposeful.** About 100 ms for small feedback, 200 to 300 ms for larger changes, rarely
  past 400 ms, eased out; the most frequent motion is the shortest; nothing blocks input while it plays.
  Motion answers an action, shows a state or keeps continuity.
  [Animation duration](https://www.nngroup.com/articles/animation-duration/),
  [animation purpose](https://www.nngroup.com/articles/animation-purpose-ux/),
  [animation for attention](https://www.nngroup.com/articles/animation-usability/),
  [scroll animations delay users](https://www.nngroup.com/articles/scroll-animations/),
  [Material 3 easing and duration](https://m3.material.io/styles/motion/easing-and-duration),
  [Material 3 motion](https://m3.material.io/styles/motion/overview/how-it-works),
  [Material duration and easing (archive)](https://material.io/archive/guidelines/motion/duration-easing.html),
  [Apple HIG, motion](https://developer.apple.com/design/human-interface-guidelines/motion).
- **Reduced motion removes the vestibular triggers.** Under `prefers-reduced-motion: reduce`, remove
  scaling, zooms, pans, spins, parallax, depth and long travel; replace a meaningful change with a fade
  rather than nothing, and keep the end state. Short opacity and colour fades may stay: WCAG's motion
  animation "does not include changes of color, blurring, or opacity which do not change the perceived
  size, shape, or position of the element". Aubaine collapses every transition to 0.001 ms
  (`src/styles/base.css`), fades included.
  [C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39),
  [2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html),
  [WCAG 2.2](https://www.w3.org/TR/WCAG22/),
  [WebKit demo](https://webkit.org/blog-files/prefers-reduced-motion/prm.htm),
  [Apple, reduced motion](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/reduced-motion-evaluation-criteria/),
  [safer web animation](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/),
  [designing with reduced motion](https://www.smashingmagazine.com/2020/09/design-reduced-motion-sensitivities/),
  [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion),
  [web.dev, motion](https://web.dev/learn/accessibility/motion),
  [reading list](https://matuzo.at/blog/reading-recommendations-animation-on-the-web-and-vestibular-disorders),
  [vestibular disorders](https://vestibular.org/introduction-to-vestibular-disorders/) *(browser only)*.
- **No sudden shocks.** Arrivals stay small, short and once per visit; no shakes or bobbing, except the
  0.4 s tremble of a descriptor word held in suspense, which the owner asked for (`rulings.md`, Each dot is a
  punch, and the word trembles); sound never autoplays. [GAG, sudden movement](https://gameaccessibilityguidelines.com/avoid-any-sudden-unexpected-movement-or-events/),
  [XAG 117](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/117),
  [Primer, motion](https://primer.style/accessibility/design-guidance/motion-and-animation),
  [NN/g, multimedia](https://www.nngroup.com/articles/guidelines-for-multimedia-on-the-web/).
- **One pause stops everything.** Motion that starts on its own and lasts over five seconds gets a
  visible pause near it; one control stops every moving part, the choice is remembered, and the paused
  frame reads as finished. Already, for the living stage, the cover's pan, the ghost's drift, the flag
  and the banner's wind, which freeze in place: `src/scripts/stillness.ts`, `StillToggle.astro`,
  `Heraldry.astro`.
  [2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html),
  [G4](https://www.w3.org/WAI/WCAG22/Techniques/general/G4),
  [GAG, background movement](https://gameaccessibilityguidelines.com/provide-an-option-to-turn-off-hide-background-movement/),
  [GAG, settings remembered](https://gameaccessibilityguidelines.com/ensure-that-all-settings-are-saved-remembered/),
  [APX, leave it there](https://accessible.games/accessible-player-experiences/access-patterns/leave-it-there/),
  [APX, clear channels](https://accessible.games/accessible-player-experiences/access-patterns/clear-channels/).
- **The pause is a real toggle.** A native button that swaps its label with its icon and sets no
  `aria-pressed`, or keeps one label and toggles `aria-pressed`, never both; its glyph reaches 3:1 over the
  brightest stage. Already: the swapped-label form.
  [APG button](https://www.w3.org/WAI/ARIA/apg/patterns/button/),
  [MDN aria-pressed](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed),
  [toggle buttons](https://inclusive-components.design/toggle-button/),
  [4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html),
  [3.2.3](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html),
  [3.2.4](https://www.w3.org/WAI/WCAG22/Understanding/consistent-identification.html).

## Navigation and page changes

- **Look like a game, behave like a website.** Links that navigate with Enter, a linear Tab order, Back,
  real URLs, no custom key schemes and no focus loops. "A typical web site is not an application."
  (Adrian Roselli) [No ARIA menu roles for site nav](https://adrianroselli.com/2017/10/dont-use-aria-menu-roles-for-site-nav.html),
  [2.1.2](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html),
  [XAG 112](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/112).
- **Site menus are disclosures.** A list of links in `nav`, with a disclosure button or a native popover
  per submenu; no `role="menu"` for site navigation; opened by click, Enter or Space, closed by Escape
  and when focus leaves; hover may open it with an intent delay and a grace period.
  [APG disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/),
  [APG disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/),
  [APG menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/),
  [navigation menubar example](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/),
  [link plus disclosure](https://adrianroselli.com/2019/06/link-disclosure-widget-navigation.html),
  [link plus popover](https://adrianroselli.com/2026/07/link-popover-navigation.html),
  [WAI menus](https://www.w3.org/WAI/tutorials/menus/),
  [fly-out menus](https://www.w3.org/WAI/tutorials/menus/flyout/),
  [mega menus](https://www.nngroup.com/articles/mega-menus-work-well/),
  [APG read me first](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/).
- **Where am I.** The current section carries `aria-current="page"` and a cue beyond colour, and the header
  keeps its order on every page. Already: `setActiveSection` in `src/scripts/shell.ts`.
  [3.2.3](https://www.w3.org/WAI/WCAG22/Understanding/consistent-navigation.html),
  [2.4.5](https://www.w3.org/WAI/WCAG22/Understanding/multiple-ways.html).
- **A Swup visit announces and lands.** The title and head update, the new page is announced by its
  heading, and focus moves somewhere useful; the transition stays a short fade, skipped under reduced
  motion. [swup a11y plugin](https://swup.js.org/plugins/a11y-plugin),
  [swup/a11y-plugin](https://github.com/swup/a11y-plugin/),
  [client routing user testing](https://www.gatsbyjs.com/blog/2019-07-11-user-testing-accessible-client-routing),
  [routing prototypes](https://marcysutton.com/prototype-testing-accessible-clientside-routing/),
  [2.4.2](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html),
  [3.1.1](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html),
  [4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

## Colour and composition

- **Colour is identity, never the only meaning.** Each key colour comes with the kind's name and
  pictogram; no instruction says "the gold door"; check pairs in colour-vision simulation.
  [GAG, colour alone](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/),
  [APX, distinguish this from that](https://accessible.games/accessible-player-experiences/access-patterns/distinguish-this-from-that/),
  [XAG 103](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103),
  [1.3.3](https://www.w3.org/WAI/WCAG22/Understanding/sensory-characteristics.html).
- **One thing is loudest.** Few contrast levels and type sizes, the saturated colour kept for the lit or
  chosen piece, groups by proximity. "If everything is contrasted, then nothing stands out." (Kelley
  Gordon, NN/g) Run the squint test: blur a capture by 5 to 10 px and check the hierarchy holds.
  [Visual hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/),
  [principles of visual design](https://www.nngroup.com/articles/principles-visual-design/),
  [F-shaped pattern](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/),
  [layer-cake pattern](https://www.nngroup.com/articles/layer-cake-pattern-scanning/).
- **Marks need words.** A pictogram or hexagon that carries meaning has the kind's name beside it;
  icon-only controls are kept for common media actions and are named.
  [Icon usability](https://www.nngroup.com/articles/icon-usability/),
  [2.4.6](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html),
  [WAI images](https://www.w3.org/WAI/tutorials/images/),
  [alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/),
  [H67](https://www.w3.org/WAI/WCAG22/Techniques/html/H67).
- **Game UX research.** Celia Hodent's work on perception, attention and memory in games underlies the
  emphasis on signifiers and low cognitive load.
  [Celia Hodent](https://celiahodent.com/),
  [The Gamer's Brain](https://celiahodent.com/the-gamers-brain/),
  [GDC 2015 talk](http://www.gdcvault.com/play/1022310/The-Gamer-s-Brain-How),
  [UX practices at Epic](http://www.gdcvault.com/play/1020934/Developing-UX-Practices-at-Epic),
  [Fortnite's UX](https://celiahodent.com/understanding-the-success-of-fortnite-ux/),
  [cognitive psychology in games](https://celiahodent.com/cognitive-psychology-applied-to-user-experience-in-video-games/).

## Testing a piece

Test every new piece by keyboard, with a screen reader, at 200 % zoom and 320 CSS px wide, with the text
spacing override, in forced colours, with reduced motion, and in every pointed and lit state. Measure
contrast on rendered pixels with the WCAG formula, alpha included. Automated checkers are a floor: low
contrast text is the most common failure the WebAIM Million found on home pages in its 2026 report.
[WebAIM Million](https://webaim.org/projects/million/),
[contrast checker](https://webaim.org/resources/contrastchecker/),
[WCAG quick reference](https://www.w3.org/WAI/WCAG22/quickref/).
`measuring.md` holds the tools; add forced colours, the spacing override and zoom to a sweep when a
piece is new.

## Open gaps on the site

Found by the research of 2026-10-31 in code that predates this skill. None is fixed yet; each is the
owner's to schedule.

| Gap | Where | Guidance |
| --- | --- | --- |
| The header's section menus use `role="menu"`, `role="menuitem"` and `aria-haspopup="menu"` on links, open on focus and on hover with no intent delay, and close on leave at once | `src/components/shell/Header.astro`, `src/scripts/shell.ts` | APG disclosure navigation; NN/g hover timing |
| No `prefers-contrast` or `prefers-reduced-transparency` styles | `src/styles/`, the blurred header panel | Media Queries 5; Apple sufficient contrast |
| Three pause buttons with three names (the stage's, the flag's, the banner's) flip one shared state | `src/lib/i18n/strings.ts`, `src/scripts/stillness.ts` | 3.2.4 consistent identification |
| The sheet's scroll cue nudges its chevron 5 px every 2.4 s without end, and the pause does not stop it; under reduced motion it is still (`src/styles/base.css`) | `CharacterHero.astro` | 2.2.2 |
| Term tooltips open on hover and focus; their dismissal by Escape is unverified | `src/styles/base.css`, `RuleTerm.astro` | 1.4.13 |
| French fallback passages on English pages carry no `lang="fr"` | the views that render untranslated entries | 3.1.2 |
| No accessibility statement among the policies | `src/content/policies/` | WAI statements; GAG; XAG 121 |
| Door lines over bright stages have a thin contrast margin | `PlateDoor.astro` | G18 |
| A pointer pass lights each door it crosses at once, its scene included (no fade), and a stop of 80 ms swaps the stage; neither is measured for flashes | `PlateDoor.astro`, `src/scripts/door-light.ts` | 2.3.1; XAG 118 |
| The pause square is 38 px, short of the 44 px AAA target | `StillToggle.astro` | 2.5.5 |
| Reduced motion also removes harmless fades | `src/styles/base.css` | WCAG motion animation; C39 |

## Sources

Fetched on 2026-10-31. The links above cite them where they apply; this list adds the indexes.

- **W3C, WCAG 2.2**: [the recommendation](https://www.w3.org/TR/WCAG22/),
  [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/),
  [quick reference](https://www.w3.org/WAI/WCAG22/quickref/),
  [what's new in 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/),
  [Media Queries 5](https://www.w3.org/TR/mediaqueries-5/).
- **W3C, ARIA and tutorials**: [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/),
  [page structure](https://www.w3.org/WAI/tutorials/page-structure/),
  [accessibility statements](https://www.w3.org/WAI/planning/statements/).
- **Game accessibility**: [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/),
  [full list](https://gameaccessibilityguidelines.com/full-list/),
  [why and how](https://gameaccessibilityguidelines.com/why-and-how/),
  [non-interactive elements](https://gameaccessibilityguidelines.com/provide-an-option-to-turn-off-hide-all-non-interactive-elements/),
  [high contrast](https://gameaccessibilityguidelines.com/provide-high-contrast-between-text-ui-and-background/),
  [screen reader friendly website](https://gameaccessibilityguidelines.com/ensure-manual-website-are-provided-in-a-screenreader-friendly-format/),
  [accessibility features published](https://gameaccessibilityguidelines.com/provide-details-of-accessibility-features-on-packaging-and-or-website/);
  [Xbox Accessibility Guidelines](https://learn.microsoft.com/en-us/gaming/accessibility/guidelines),
  [XAG 121, documentation](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/121);
  [AbleGamers](https://ablegamers.org/),
  [Accessible Player Experiences](https://accessible.games/accessible-player-experiences/),
  [APX access patterns](https://accessible.games/accessible-player-experiences/access-patterns/).
