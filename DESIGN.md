# Aubaine art direction

## Overview

The character sheet that opens a species or a skill tree page is the reference. Every page that presents
game entries speaks its language: a dark living stage, a framed card, a giant name, paper pieces slapped
onto the scene, and gold on night.

**In-game feel, web layout.** The feel comes from the screens inside three games: the League of Legends
client (Hextech), Persona 5's menus and Deadlock's interface. The layout stays a web page: links in
reading order, tabs, lists and grids. The select screen is the model: Deadlock's hero select and Persona
5's character pages, translated into a roster of links and a spotlight. Game marketing sites are only a
source of web conventions, never of the feel.

| Reference | What it gives Aubaine |
| --- | --- |
| Persona 5 | Paper and motion: crooked title plates, stickers, halftone, slabs, arrivals that slap on, the pointed item that grows and takes colour, a subtitle under each command |
| Deadlock | Frames and type: double art-deco rules, giant outlined names, three descriptor words per entry, the roster beside the spotlight, the shop's bookmark tabs and black plates |
| League of Legends, the Hextech client | Metal linework around the focal area, gold for navigation, the brightest treatment kept for what matters most, the cover as the stage's light |
| World of Warcraft | Heraldry and gold: crests, emblems, real metal, groups that open on a heraldic mark |

What makes it Aubaine and not a game launcher: the rank profile on a pointy-top hexagon, the
Caractéristique hexes, the seals of entries without a cover, the kind marks, and rule text that stays
readable on paper.

Tokens live in `src/styles/tokens.css` and the font families in `src/styles/fonts.css`. This file names
them and never copies them.

## References

Look at these pages, not at a description of them. The captures stay out of the repository: they are
other studios' work, and the repository is public.

### In-game screens

These give the feel. Each row says what to take and what to leave.

| Screen | Take | Leave |
| --- | --- | --- |
| [Deadlock, the Curiosity Shop](https://deadlock.wiki/File:Weapon_shop.png) ([page](https://deadlock.wiki/The_Curiosity_Shop)) | Bookmark tabs on the sheet's edge, one per category in its colour with its icon, the active one pulled out; a title plate with a tagline; groups in thin frames headed by black plates; tiles of art with a name under it | The paper texture and the prices |
| [Deadlock, the new hero select](https://thegamehaus.com/deadlock/6-new-deadlock-heroes-revealed-new-select-screen-more/2025/08/18/) and the [heroes page](https://deadlock.wiki/Heroes) | The portrait grid beside the chosen hero, a flat poster backdrop, a giant name | The full-screen game frame |
| [Deadlock, the main menu before the Hideout](https://www.bhermann-design.com/remaking-deadlocks-ui) | A column of words over a live scene | Nothing crooked: the words stay straight links |
| [League of Legends client, Collection](https://wiki.leagueoflegends.com/en-us/File:Collection.png), with its [Items](https://wiki.leagueoflegends.com/en-us/File:Items.png) and [Runes](https://wiki.leagueoflegends.com/en-us/File:Runes.png) tabs | One place with sub-tabs; each tab keeps its own layout; filters in a side column; thin gold rules and caps tab labels | The launcher chrome around it |
| [League of Legends client, Home](https://wiki.leagueoflegends.com/en-us/File:Client.png) | A sub-tab row, a featured panel framed in gold linework with a gold-bordered button, a row of captioned tiles under it | The social column and the currencies |
| [League of Legends client, Hextech Crafting](https://wiki.leagueoflegends.com/en-us/File:Hextech_Crafting_Loot.jpg) | Loot sorted in framed groups, the brightest glow on the one thing that matters | The crafting itself |
| [Persona 5, the pause and battle menus](https://mechanicsofmagic.com/2022/04/23/visual-design-of-games-persona-5/) | The pointed item "is made bigger and given a bit of color"; each command carries a small subtitle; menus stay "simple and functional" | The radial battle layout |
| [Persona 5 Royal, Characters](https://persona.atlus.com/p5r/) | The select screen: one character large with a gold name plate and a black profile caption, crooked portrait cards with name tapes over red slabs | The red collage as a page layout |
| [What makes the menus in Persona games so good](https://www.siliconera.com/what-makes-the-ui-and-menus-in-persona-games-so-good/) | "This same aesthetic follows through all the menus", with "more detail and color than peers in the genre" | |

### Rules quoted from the sources

**Hextech**, from Riot's "The Visual Language of Hextech" (2016), reproduced in the
[Surrender at 20 red post collection](https://www.surrenderat20.net/2017/01/red-post-collection-2016-playlist.html):
- Metal linework sits on the top layer as the framing element and draws focus to key details.
- Gold buttons handle navigation and actions outside the main information; the blue magic buttons are
  rare and kept for actions. Aubaine's gold plays both parts and has no blue.
- Value: "the brightest treatments are reserved for the most important moments".
- "Parchment and other distressed elements that littered the client in the past look dated relatively
  quickly."

**Persona 5**, from the two Persona articles above: the pointed item grows and takes a colour, every
command has a subtitle, the same treatment runs through every menu.

**Deadlock**, from the shop and the hero select: a category is a colour and an icon on a tab, a group is
headed by a black plate, a hero is a portrait in a grid beside a giant name.

### Game websites, for web conventions only

These show how a game's site lays out a list, a tab or a "view all" link. They never set the feel.

| Page | Convention |
| --- | --- |
| [Universe of League of Legends](https://universe.leagueoflegends.com/en_US/), [champions](https://universe.leagueoflegends.com/en_US/champions/), [regions](https://universe.leagueoflegends.com/en_US/regions/), [explore](https://universe.leagueoflegends.com/en_US/explore/) | Filter tabs that are links, a type tag with an icon on each card, an emblem on a card's edge |
| [League of Legends, champions](https://www.leagueoflegends.com/en-us/champions/) | Tall cards, the art as the page's light |
| [Overwatch, heroes](https://overwatch.blizzard.com/en-us/heroes/) and [media](https://overwatch.blizzard.com/en-us/media/) | The floor to clear: a plain title over a plain grid; tabs over a gallery |
| [Hearthstone, card library](https://hearthstone.blizzard.com/en-us/cards) | A filter bar in the game's own materials over a long grid |
| [The Deadlock Wiki](https://deadlock.wiki/) | Category tiles with art taken from what each category holds |
| [World of Warcraft, races](https://worldofwarcraft.blizzard.com/en-us/game/races) and [classes](https://worldofwarcraft.blizzard.com/en-us/game/classes) | A roster grouped under faction crests |

The file follows the section order of the open [DESIGN.md format](https://github.com/google-labs-code/design.md)
without its token block, since `tokens.css` is the only list of values.

## Decisions

Dated, with the owner's words. A decision here is not reopened without a new reason; a compaction is not
one.

| Date | Decision |
| --- | --- |
| 2026-10-27 | Hubs get no painting or video of their own: "just like specie and skill tree we will either reuse the covers or something like that, something built using threejs / webgl or icons". |
| 2026-10-27 | Three hub headers rejected: no tallies, no hand of cards picked for no reason, no sigils, no decorative cut. |
| 2026-10-28 | The character sheet and the select screen of Arbres and Espèces are approved: "everything you did was perfect". |
| 2026-10-28 | One colour and one pictogram per kind of content, everywhere: "coherence is the key for leanring for users". `KIND_MARKS` in `src/lib/game/kind-marks.ts`, rule in `.claude/rules/frontend/kind-marks.md`. |
| 2026-10-28 | Rejected: the Codex and Livres as copies of the select screen, "copies of skills trees but with pages instead of skill trees". |
| 2026-10-28 | Rejected as layouts, kept as candidates: a radial command fan and slanted doors, "We are not BUILDING A VIDEO GAME … clearly unintuitive for websites". |
| 2026-10-28 | Rejected: layouts taken from game marketing sites, "i don't want the feel of a Video Game Webiste, i want the feel of those Video game". |
| 2026-10-29 | Hub redesign dropped after the live prototypes (four Codex layouts, three Livres layouts, two homes): "nah that's shit please get rid of you work on hubs DO NOT TOUCH SKILL TREES AND SPECIES NOR THEIR LIST ONLY CODEX INDEX BOOKS INDEX". The Codex and Livres keep their original card grid; Arbres and Espèces keep their select screen. |
| 2026-10-29 | The Espèces mark takes the DNA pictogram, `mdi:dna`, in place of the elf ear: "change it to dna please". |

## Colors

- **Key colour.** An entry with a cover takes its colour from the art (`src/lib/art-key-colour.ts`). An
  entry without one takes the first colour of its seal, lifted until it reads on night
  (`src/lib/game/seals.ts`). Stickers, slabs, frames, kinds and the ghost name use it.
- **House gold** (`--gold`) is for the page's own chrome: title plates, the filter bar, rules and focus.
  Its ink is `--on-gold`.
- **Night.** `--bg` is the stage; `#08070d` is the ground of cards, tapes and plates.
- **Dark in both themes.** Every stage carries `.au-dark`; only the reading below it follows the theme.
- **Paper ink.** Every plate carries the same dark ink. A paper too deep for it to read at AA is lifted,
  keeping its hue (`readableOnNight` in `src/lib/key-colour.ts`).
- **Kind marks.** Each kind of content (an Arbre, an Espèce, a Compétence…) has one colour and one
  pictogram, read from `KIND_MARKS` in `src/lib/game/kind-marks.ts` wherever the kind is marked: a menu,
  a source button, a keyword, a Codex card. `kindInk` lifts the colour to read on night. An entry keeps
  its own colour; the kind mark marks the kind.
- **A seal paints the stage** from its colours: `fieldBackdrop` in `src/lib/game/hubs.ts` for the CSS
  stage, `paintField` in `src/scripts/stage-field.ts` for the GPU. Both dim toward night, so a seal never
  shouts louder than a painted cover.

## Typography

- **Names:** Cinzel 700 (`--font-display`), fitted to their column in container units. `GhostName.astro`
  repeats the name outlined and huge behind the card.
- **Kinds and labels:** mono capitals on black tape (`--font-mono`).
- **Stickers, buttons, plates:** Barlow Semi Condensed (`--font-ui`).
- **Subtitles and lead captions:** EB Garamond italic (`--font-garamond`).
- A name never wraps inside a word and never leaves its column: the fit is computed from the number of
  letters (`fitted` in `CharacterHero.astro` and `TitlePlates.astro`).

## Layout

| Page type | Opens | Layout |
| --- | --- | --- |
| Sheet | one entry: a tree, a species | the character sheet, below |
| Select screen | a list of entries: Arbres, Espèces | the roster and its spotlight, below |
| Hub | sections: the Codex's indexes, the books | the original card grid (`src/components/views/Cards.astro`) |
| Home | the whole site | the original banner (`src/components/views/Home.astro`) |

A hub is never a select screen of its sections.

**The character sheet** (`src/components/primitives/CharacterHero.astro`) opens one entry. The sheet sits
on the left and the card on the right; the name is the page's `h1`. Below 960 px the card comes first.
`docs/adr/0054-the-hero-of-a-tree-or-a-species-is-a-character-sheet-on-a-living-stage.md` records it.

**The select screen** (`src/components/primitives/SelectScreen.astro`) opens a list of entries: Arbres
and Espèces.
- The roster fills the left column under the title plates and the search field.
- The hub's explanation is not printed: a help button beside the title opens it in a note with a link
  to the matching chapter of the Livre du joueur (`HUB_CHAPTERS` in `src/lib/game/hubs.ts`).
- A sticky spotlight on the right shows the card the reader points at or focuses, as the character
  sheet at a smaller scale, and the stage behind takes that entry's art. The cards stay links.

**The spotlight** (`src/components/primitives/SpotlightPanel.astro`) is a portrait column the height of
the screen, never a wide band. The card is its showcase, and every entry of a hub fills it the same way
so that two entries compare at a glance.
- On a desktop the kind and the name sit on top with the epithets or the subtitle, the card takes the
  height that is left, and the properties sit under it in one row.
- Every card stands centred and large, the same size for a species and a tree.
- A tree always shows a rank profile, low on the left, laid over the card's lower-left corner without a
  plate. It reaches no further than the card's left quarter, so it never touches the centred initial or
  the emblem, and it shrinks a little on a short laptop. A species never shows one.
- The two columns need a screen at least 1100 px wide and 640 px tall; below that the spotlight stacks
  above the roster.
- On a tablet the spotlight takes the character sheet's own composition: the sheet on the left, the card
  on the right.
- On a phone the name, the card, the profile and the properties stack above the roster, with arrows that
  step through the shown cards.

Both layouts read their content from one place, `src/lib/game/character-sheet.ts`. The character sheet
renders it through `SheetHead.astro` and `SheetBody.astro`; the spotlight uses `SheetHead.astro` and the
same `RankProfile.astro` and `TraitPlates.astro` at their `preview` size, so the sheet never says a thing
two ways.

## Elevation & Depth

From the back to the front:
1. **The stage** (`StageBackdrop.astro`): the cover's 128 px ambient, blurred and darkened, under a shade
   and a halftone. It is the whole stage without JavaScript, under reduced motion and on a weak GPU.
2. **The living stage** (`src/scripts/art-effect/stage.ts`, `glsl/stage.frag`): slow smoke, motes and
   light shafts aimed at the card (`data-stage-focus`). A stage changes cover by fading a second canvas
   in.
3. **The ghost name**, outlined, behind the card.
4. **The slab**, a key-colour panel swung out from behind the card.
5. **The card** and its glare.
6. **Paper**: plates, stickers, tapes, the rank profile.

Every piece casts a hard offset shadow toward the lower right, never a soft blur, and keeps the hero's
proportion of shadow to size. No band of shade sits behind a control row.

## Shapes

- **The hexagon is pointy-top**, like the logo (`data/media/aubaine-logo.svg`), never a diamond: the rank
  profile rings, the Caractéristique hexes, the seal's crest, the group marks.
- **The card is 3:4** with a double rule (`FramedCard.astro`); one picture per entry.
- **Paper is crooked.** Every piece rests at its own angle, and each kind of piece keeps its own set of
  angles; read them in its component.

## Components

**Stage and light**
- `StageBackdrop.astro`, `src/scripts/art-effect/stage.ts`, and `StillToggle.astro` with
  `src/scripts/stillness.ts`, which pause every drift on every stage at once.

**Paper**
- `DescriptorStickers.astro`: key-colour paper, black capitals.
- `TraitPlates.astro`: a black label tape over coloured paper.
- `TitlePlates.astro`: gold and black plates, one per word, with the help button inside the `h1` flow.
- `StatusBadge.astro`.

**Frames and cards**
- `FramedCard.astro`: the 3:4 card with its double rule, the slab in the key colour, a glare that follows
  the pointer and, at hero size, the entry's emblem.
- `CoverCard.astro`: the roster card. It rests crooked, flips the other way when pointed at, and slides
  its slab out; the selected card keeps that pose.
- `CoverSeal.astro`: stands in for a missing cover with the entry's own colours and its initial centred,
  never a placeholder painting and never a Caractéristique, since the roster card already shows those in
  its corner.

**Charts and icons**
- `RankProfile.astro`: the editorial rank profile on pointy-top hexagon rings, « ? » for each grade not
  set yet.
- `CharacteristicHex.astro`: frames a glyph from `data/media/icons/`.

## Motion and game feel

A game answers every input at once and never makes the player wait for a flourish. Each rule below names
the constant that holds it; read the value there.

**Input**
- A mouse or a pen selects a card after a short intent delay (`INTENT_MS` in
  `src/scripts/select-screen.ts`), so sweeping across the roster does not flicker. Focus selects at once.
  Touch never selects by hovering; a tap opens the card.
- While the keyboard is inside the spotlight, pointing elsewhere swaps nothing.

**Feedback layers of a pointed card**, all at once: the card flips its resting angle, lifts and slides
its slab out (`CoverCard.astro`); it tilts toward the pointer (`src/scripts/tilt.ts`); the spotlight
swaps; the stage fades to its art (`FADE_MS` in `stage.ts`); the key colour follows. No sound, and never
a hold.

**Arrivals** happen once.
- The card lands, the slab swings in, the emblem pops, stickers and plates slap on one after the other,
  the profile unfolds and its grades stamp.
- A slap is a short overshoot from a larger, tilted pose; the plates, stickers and traits share one
  overshooting curve (for example `au-plates-slap` in `TitlePlates.astro`). The card, the slab and the
  profile land on gentler curves.
- `--arrival` scales the whole sequence: 1 on a page, shorter when the spotlight swaps (`SWAP_ARRIVAL`),
  so sweeping a row never piles up arrivals.

**Waits ride the load.** A spotlight swap waits for its picture, at most `PICTURE_WAIT_MS`, and never
adds a hold of its own.

**Continuous motion** (the cover's drift, the ghost name, the stage) reads `--motion-state` and stops with
the pause button.

**Reduced motion** collapses every arrival, binds no tilt and never fetches the stage code. A swap still
changes the picture and the colour.

## Pictures

- Every picture comes from the game: covers (one 3:4 picture per entry), emblems, heraldry, icons and the
  logo. A page never gets a painting or a video made only for it.
- An entry without a cover shows its seal, never the placeholder painting: on its roster card, in the
  spotlight and on its own page. The stage then paints the seal's colours instead of a cover
  (`data-stage-field`); the seal and its key colour come from `src/lib/game/seals.ts`.
- Metal is real: lit on the GPU or baked from scans, never a gradient pretending to be gold
  (`docs/adr/0059-a-sub-species-may-fly-its-heraldry-as-cloth-and-a-painting-hangs-under-glass.md`).
- three.js stays a baking tool; live pieces share one WebGL context (`src/scripts/art-effect/studio.ts`).

## Do's and Don'ts

These come from rejected drafts of the hub headers, 2026-10-27, and two reviews of the select screen,
2026-10-28 ("way too wide, there are some crops and some weird black shadows"; "a beautiful layout that
doesn't change much between things"; "the card can be really the showcase").

- A header never repeats the list below it: no counts the result line already gives, no hand of cards
  picked for no reason.
- No decorative cut or band that leaves a gap above the search field.
- A list of entries opens as a select screen, never as a banner. A list of sections is a hub, never a
  select screen.
- Navigation is never radial, tilted or crooked, never hidden behind a hover, and never a row of
  doors that open on pointing. Crooked paper decorates; links stay straight and in reading order.
- A layout comes from a game's own screen, never from its marketing site.
- Nothing is borrowed by name or by label from another game.
- No piece of the spotlight is ever cut by its edge or by the screen's: the ghost name, the slab, the
  plates and the name all fit. `tests/e2e/select-screen.spec.ts` checks every entry at four sizes.
- A card's offset shadow keeps the hero's proportion to the card, and no band of shade sits behind the
  controls.
- The spotlight keeps one layout for every entry of a hub: epithets in one row, properties in one row,
  the card the same size. The card is the showcase: the profile overlaps it at its own size rather than
  shrinking it. The test above checks the rows, the plates' ink and what the profile covers.
- A tree shows a profile, pending or ranked; a species never does, because it can never have one.
- A hub's explanation lives in the help note beside its title, with its handbook chapter, never as a
  paragraph under the title.
- A card without a cover shows its initial; one kind of mark for every seal.
- On a hub a tree names only its kind, « Archétype » or « Domaine »; its own page says « Arbre
  d’Archétype ».

## Accessibility

- One `h1` per page. On a select screen the spotlight is a named region; its arrows and its link carry
  names, and the link names the entry it opens.
- The panel holds no controls, so keyboard focus never vanishes in a swap.
- A focused card never hides under the sticky header (`scroll-margin-top`).
- Without JavaScript the lead entry stays in the spotlight and every card works as a link. In print the
  stage and the spotlight drop out and the title and the roster remain.
- Nothing is told by colour alone: a draft is darkened and stamped, a selected card is lifted and named
  by `aria-current`.
