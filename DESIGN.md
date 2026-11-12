# Aubaine art direction

This document describes how the Aubaine site looks and why: the direction, the principles that hold it,
and the values that define it. It is written for anyone who works on the site or wants to understand it.
The values themselves live in the code, in `src/styles/tokens.css`, `src/styles/fonts.css` and the
component named beside each value; where this document and the code disagree, the code is right and this
document is corrected.

Design work runs through the `aubaine-design` skill (`.claude/skills/aubaine-design/`): it holds the
owner's rulings with their dates and words, the research on the three reference games with its sources,
the value-by-value spec of the approved pieces, the methods behind the measuring tools in
`tools/design/`, and screenshots of the accepted pieces.
`docs/adr/0064-design-work-runs-through-the-aubaine-design-skill.md` records that split.

The sections loosely follow the open [DESIGN.md format](https://github.com/google-labs-code/design.md)
(Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components), then add Motion and game
feel, Pictures, Accessibility and References.

## Overview

### The direction

Aubaine is a tabletop role-playing game, and its site is a reference work dressed like a game. The
owner's brief, settled between 2026-10-23 and 2026-10-30, names three games: "Imagine a mix between
Deadlock, The Persona Series (more preciesly Persona 5) and the Hextech from League of Legends." The
site takes the feel of those games' own screens and keeps the layout of a website: plain links in reading
order, nothing that matters hidden behind a hover, every page working without JavaScript.

### The look

The approved pieces show an entry the way a game shows a character. The stage is the entry's own
painting, blurred, saturated and darkened, drifting as smoke under rising motes and faint shafts of light
that fall on the card; an entry without a painting paints its seal's colours instead. The entry stands
as one 3:4 card framed by two flat hairlines in its key colour, with a halftone slab of that colour swung
out behind it. Its name is set huge in Cinzel and repeated behind the card as an outlined ghost. Its
facts are flat printed paper (descriptor stickers, trait plates, mono tapes, skewed grade plates)
slapped on at small angles, each with a hard offset shadow. House gold is kept for the page's own
chrome: the title plates, the main buttons, the rules. The card's frame reads gold only when the entry's
key colour falls back to house gold.

The Codex shows its sections the way a game's pause menu shows its commands: the names are the doors,
set in paper plates, and the lit one takes the stage's light and its pictogram, struck huge in paper on a
band of its colour. Livres lays its categories out as a printed book's contents: a bone spread on the
stage, one Roman numeral per entry, and the lit numeral cut in paper over a slab of its colour.

### The approved pieces

Six pieces carry the direction; the others follow them.

| Piece | Code | Routes | Approved |
| --- | --- | --- | --- |
| The character sheet, which opens one tree or one species | `src/components/primitives/CharacterHero.astro`, with `SheetHead.astro`, `SheetBody.astro`, `FramedCard.astro`, `GhostName.astro` and `StageBackdrop.astro` | `/fr/arbre/marchand`, `/fr/espece/drow`, `/en/tree/marchand`, `/en/species/drow` | 2026-10-27 |
| The select screen, which opens the Arbres and Espèces lists | `src/components/primitives/SelectScreen.astro`, with `TitlePlates.astro`, `FilterBar.astro`, `CoverCard.astro`, `Spotlight.astro`, `SpotlightPanel.astro` and `src/scripts/select-screen.ts` | `/fr/arbres`, `/fr/especes`, `/en/trees`, `/en/species` | 2026-10-28 |
| The plate menu, which opens the Codex hub | `src/components/primitives/PlateMenu.astro`, with `PlateDoor.astro`, `DoorGlyph.astro`, `src/styles/doors.css` and `src/scripts/door-light.ts` | `/fr/almanach`, `/en/almanach` | 2026-10-31 |
| The contents spread, which opens the Livres hub | `src/components/primitives/SommaireSpread.astro`, with `SommaireEntry.astro`, `src/styles/doors.css` and `src/scripts/door-light.ts` | `/fr/livres`, `/en/books` | 2026-10-31 |
| The quote and the dialogue of a lore page | `rehypeProseQuotes` in `src/lib/game/book-markup.ts` and `src/styles/prose.css` | every species page whose lore holds a quote, such as `/fr/espece/humain` and `/fr/espece/scothan` | 2026-11-04 |
| The titles of the reading pages | `src/components/primitives/PageTitle.astro`, with `SectionTitle.astro`, `TitleFrame.astro`, `src/styles/titles.css` and `rehypeProseHeadings` in `src/lib/game/book-markup.ts` | every book chapter, species, tree and policy page, such as `/fr/livres/livre-du-joueur/creer-un-personnage` and `/en/licences` | 2026-11-10 |

- The sheet and the select screen are approved as they stand at commit `a9b3954` (2026-10-29), and the
  pages that use them still render identically. `tests/e2e/character-hero.spec.ts`,
  `tests/e2e/select-screen.spec.ts` and `tests/e2e/hubs.spec.ts` guard the first four,
  `tests/e2e/lore-quote.spec.ts` the quote, `tests/e2e/titles.spec.ts` the titles.
- Screenshots of the six are in `.claude/skills/aubaine-design/assets/approved/`.

### Three games, three layers

| Game | What Aubaine takes | What stays in the game |
| --- | --- | --- |
| Persona 5 (Atlus) | A method as much as a surface. Atlus fixes a game's main colour first, and kept other colours out of Persona 5 as far as it could, so its red would stand out; the brightest area is the most important one, and the brightness shifts as priorities change; a line leads the eye; each menu gets a design of its own, and a level deeper changes layout and angle; each battle command carries a short line; screens are dressed as objects of the fiction (fusion as an execution, a bond as a tarot card); the menus open at once. Its paper, in the in-game screens, is flat cut-outs: skewed black bars, cut-letter tiles, jagged balloons, an angled tarot card, a boxed MAX stamp, halftone in the portraits. | The red, black and white palette; the ring of commands around the character; type on moving baselines; letters cut inside a name |
| Deadlock (Valve) | The world's own print and objects: a poster per hero, printed in that hero's own inks; three descriptor words on dark tapes; values on black plates; shop catalogues published by firms of the game's world; a hub made of unlike objects (the Hideout, where each menu is a different thing in the room). | Distressed, stained paper; a different lettering per hero; the walkable hub |
| Hextech, the League of Legends client (Riot) | The metal and the light: ornate framing kept for the key areas of attention; the brightest values saved for the moments that matter; shapes with jobs; magic light that guides the eye and shows state (timers, progress); one shared set of timings and easings; the selection taking the screen (champion select shows the chosen skin's splash art). | The launcher's chrome; blue action buttons; the diamond, which Aubaine's pointy-top hexagon replaces |

The sources of each row are in [Principles](#principles) and in the research dossiers listed under
[References](#references).

### What only Aubaine has

- The pointy-top hexagon of its logo, wherever a mark is drawn.
- The logo's double hexagon as the crest of a seal, the picture of an entry without a cover.
- One key colour per entry, read from its own painting when it has one, unless the entry writes its own.
- One colour and one pictogram per kind of content and per book category (`src/lib/game/kind-marks.ts`).
- The rank profile: six axes on pointy-top hexagon rings, graded F to S on skewed plates.
- Descriptors and traits printed as paper, and rule text that stays readable.

**CADRAN is not Aubaine's look.** The Almanach's navy screen, with its grid, its HUD corners, its gold
frame and its status lines, belongs to the Atlas boot
(`docs/adr/0044-the-cadran-boot-is-the-atlas-loader-and-its-bar-follows-the-real-load.md`,
`src/scripts/atlas-boot.ts`, whose own status lines include « EN ATTENTE DE LIAISON » and « CARTES
PRÊTES »). It dresses no site page (2026-10-30). Inside an almanach's own tube, the flash and the lit
emblem may play when a reader switches it on, never when the page turns it on and never the whole boot
(2026-11-06, `docs/adr/0069-a-lore-picture-may-play-on-an-almanach.md`, Decision 4).

### Principles

Each principle names its source.

1. **In-game feel, web layout.** The feel comes from the games' own screens; the layout stays a web
   page, with plain links in reading order, nothing hidden behind a hover and nothing radial. A link may
   rest a degree or two off level like paper, as the approved roster cards do, but nothing is laid out
   on a fan or a diagonal.
   *Source:* the owner, 2026-10-28: "We are not BUILDING A VIDEO GAME. and those layouts you gave are
   clearly unintuitive for websites." The League client is itself a web page: Riot "chose to start
   again and build around Chromium Embedded Framework (CEF) as our front-end"
   ([Andrew McVeigh, Riot, 2016](https://www.riotgames.com/en/news/architecture-league-client-update))
   and uses "straight-up native Custom Elements"
   ([Jules Glegg, Riot, 2017](https://www.riotgames.com/en/news/under-hood-league-client%E2%80%99s-hextech-ui)).
   Its feel is made of web techniques; what stays in the games is their geometry: rings, walkable rooms,
   full-window takeovers.
2. **One vocabulary, a composition per kind of page.** Stage, card, paper, type, hexagon and motion are
   shared. Each kind of page arranges them its own way, and a level deeper looks visibly new. A hub is
   never a select screen of its sections.
   *Source:* Katsura Hashino, the longtime Persona director, on the menus of Metaphor: ReFantazio, which
   build on Persona's: "Whether it's the shop menu or the main menu, when you open them up there's a
   whole separate program running and a separate design that goes into making it" (to The Verge, quoted by
   [Kotaku, 2024](https://kotaku.com/-metaphor-refantazio-persona-5-menu-ui-hashino-1851667088)).
   Masayoshi Suto, Persona 5's art director and UI design lead, at CEDEC+KYUSHU 2017: a level deeper
   changes its layout and its angle ([Famitsu, 2017](https://www.famitsu.com/news/201711/13145540.html)).
   The owner: "same DA but different." (2026-10-28).
3. **One focal object; the light follows the pointer.** A screen has one focal piece, the card, made
   focal by its size, its painting and the shafts of the stage that fall on it (`data-stage-focus`).
   Gold paper stays rare: on the select screen, the title plates, Filtres and « Ouvrir la fiche ». As the
   pointer moves, the pointed piece takes the light.
   *Source:* Riot: "The highest values should be used to attract the player's attention, saving brighter
   executions for pivotal moments in the experience."
   ([The Visual Language of Hextech](https://loltopchamp.wordpress.com/2017/09/26/the-visual-language-of-hextech/),
   Riot, December 2016, also copied by
   [Surrender at 20](https://www.surrenderat20.net/2017/01/red-post-collection-2016-playlist.html)).
   Suto: the brightness of each area follows its priority and shifts as the priority changes
   ([Famitsu, 2017](https://www.famitsu.com/news/201711/13145540.html)).
4. **The stage is the entry's own art.** A page shows the paintings, emblems, heraldry and pictograms the
   game already has; no page gets a picture or a video made only for it.
   *Source:* the owner, 2026-10-27: "HUBs should'nt have a picture / video for them anymore. just like
   specie and skill tree we will either reuse the covers or something like that, something built using
   threejs / webgl or icons but not something only for them". In League's champion select, "The selected
   skin's splash art is shown on screen."
   ([League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/Team_drafting#Trivia)).
5. **Paper speaks, flat.** Facts are flat paper at small angles, with hard offset shadows. Light paper
   takes dark ink: `#20180a` on stickers, gold plates and buttons, `#14100a` on trait plates. Black paper
   takes light ink: the key colour, the plate's paper colour or gold mixed with white (45 to 55 % of the
   colour), plain gold, or `#fbf8ef` for the grade letters. Names are type on the stage, not paper.
   *Source:* Persona 5's flat cut-outs (the battle and Confidant screens); Deadlock's three
   descriptor words on dark tapes ([Mina](https://deadlock.wiki/Mina)).
6. **Clean print for interface paper.** Halftone, flat fills and stamps; nothing torn, stained or aged on
   interface paper. Lore pictures may wear the torn, stone and rupture masks of `data/media/masks/`.
   *Source:* Riot: "Parchment and other distressed elements that littered the client in the past look
   dated relatively quickly"
   ([The Visual Language of Hextech](https://loltopchamp.wordpress.com/2017/09/26/the-visual-language-of-hextech/)).
   Deadlock's catalogue is torn, stained and shot through on purpose
   ([weapon catalogue](https://deadlock.wiki/File:Weapon_shop.png)): clean print is Aubaine's choice,
   and Riot's, not Deadlock's.
7. **The pointed thing answers at once, in layers.** The card flips, lifts, slides its slab out and
   leans; the spotlight shows it; the stage takes its painting. The card never scales up; only its slab
   grows, from 0.9 to full size. The layers and their timings are in
   [Motion and game feel](#motion-and-game-feel).
   *Source:* in Persona 5's pause menu "the word is made bigger and given a bit of color", and the
   protagonist "switches poses depending on the menu you select"
   ([Mechanics of Magic, 2022](https://mechanicsofmagic.com/2022/04/23/visual-design-of-games-persona-5/),
   a student analysis). RPGFan's screenshots of that menu show the pointed command in a colour no other
   command has. Riot: "Providing different easing functions allows
   animations to convey priority." (Glegg, 2017).
8. **Every door and action says what it does.** A door or a command is a name with a short line under
   it. Actions are plates; the controls around them (previous, next, pause, help) are smaller, dark and
   plainer.
   *Source:* Persona 5's battle menu sets each command over a short line (ATTACK over "Use Melee
   Weapon"), and its Velvet Room sets each service over the name of its execution ("Persona Fusion" over
   "Guillotine"). Riot's blue magic buttons "appear sparingly throughout
   the client".
9. **One voice on a stage; content keeps its identity colours.** The chrome speaks in one hue: house
   gold on the select screen, the entry's key colour inside a sheet. Content keeps its own colours
   (kinds, domains, Caractéristiques, states), never merged into families.
   *Source:* Atlus kept other colours out of Persona 5's menus as far as it could, so its red would stand
   out ([Famitsu, 2017](https://www.famitsu.com/news/201711/13145540.html)). `CharacterHero.astro` sets
   `--gold` to the key. `.claude/rules/frontend/kind-marks.md`: "An entry keeps its own colour, as a tree
   keeps its domains and a state its ink."
10. **Dress the page in Aubaine's own world; borrow nothing.** A page may wear an object of Aubaine's
    world while its links keep their plain names; none is chosen yet. Nothing is
    borrowed by name, label or joke from another game.
    *Source:* Atlus stages Persona fusion as an execution: personas are "executed via guillotine"
    (Atlus's overview of its Velvet Room trailer, relayed by
    [Gematsu, 2017](https://www.gematsu.com/2017/02/persona-5-game-mechanics-velvet-room-trailer)).
    Deadlock's shop "item catalogs are provided by Fairfax Industries, Mystic Pharmaceutical Stores, and
    the Curiosity Catalog" ([The Curiosity Shop](https://deadlock.wiki/The_Curiosity_Shop)). The owner,
    2026-10-23, refusing a pun Deadlock already uses: "Goat not G.O.A.T as G.O.A.T is a great pun but is
    already used by Deadlock, we don't still ideas here".
11. **Readable first.** Display type shouts and reading type talks: cut letters and angles go to names,
    titles, commands and stamps; sentences sit level, in a plain face. Plates and panels grow with their
    text in French and in English and are never sized to one language.
    *Source:* on Persona 5, "Multiple moving axes for type and dynamic baselines that prioritized style
    over information" and "an extra bold typeface that reads poorly in the allotted space in the
    localization"
    ([Geoffrey Bunting, Inverse, 2023](https://www.inverse.com/gaming/persona-5-tactica-user-interface)).
    Kotaku reports that Persona 5's "angular black, red, and white text boxes" were hard to read "until
    the team did a lot of iteration and refinement"
    ([Kotaku, 2024](https://kotaku.com/-metaphor-refantazio-persona-5-menu-ui-hashino-1851667088)).
    Persona 5's Confidant screen sets its descriptions level, in a plain face on black panels.
12. **Intensity follows the place.** Choice screens and hubs carry the show; reading pages stay calm.
    The quote and the dialogue of a lore page are the exception the owner made: game pieces inside
    the reading, drawn from Persona 5's dialogue box (`docs/adr/0068-a-lore-quote-is-a-staged-game-dialogue-box.md`).
    The titles of the reading pages joined them on 2026-11-10, drawn from the quote's title and box
    (`docs/adr/0076-reading-titles-are-framed-plates-in-the-quote-s-family.md`); the text between them
    stays calm.
    *Source:* on Persona 5 Royal's interface at school and in the subway, "In these places, everything
    is tuned out to look muted and drab.", while in its dungeons "everything features high-contrast,
    kinetic energy"
    ([Gfinity, 2026](https://www.gfinityesports.com/article/rebellion-by-design-the-genius-of-persona-5-royals-visual-storytelling)).
    Riot saves "brighter executions for pivotal moments in the experience".
13. **Instant.** No loader before a choice; an animation may cover a real wait and never adds one.
    *Source:* `docs/adr/0012-the-header-outlives-the-page.md`, Decision 3: the page crest appears only on
    a visit that has not replaced its content after 400 ms, and the source's hold phase was left out as
    dead time. `src/scripts/select-screen.ts` waits at most 250 ms for a picture. In Famitsu's 2023
    interview of the Persona 3 Reload team, the interviewer recalls that Persona 5 gave a good share of
    its memory to the UI so that its menus open at once
    ([Famitsu, 2023](https://www.famitsu.com/news/202311/29325647.html)).

## Colors

The values that define the look. Every stage is dark in both themes, so these are the dark values.

| Role | Value | Where it lives |
| --- | --- | --- |
| Stage ground | `#06050d` | `--bg` in `src/styles/tokens.css` |
| Paper night: the card's body, black plates and tapes, the help and step squares | `#08070d` | a literal in the components that draw paper, such as `FramedCard.astro` |
| Seal ground | `#0d0b16` | `CoverSeal.astro` |
| Names | `#ece8f7` | `--ink` |
| Subtitles, labels, quiet controls | `#b3abc9` | `--ink2` |
| Grade letters | `#fbf8ef` | `RankProfile.astro` |
| Dark ink on gold and key-colour paper | `#20180a` | `--on-gold` |
| Dark ink on trait paper | `#14100a` | `DARK_INK` in `src/lib/key-colour.ts` |
| House gold | `#efbe04` | `--gold`, and `KEY_FALLBACK` in `src/lib/key-colour.ts` |
| Line gold: every rule and quiet border | house gold at 26 % | `--line2` |
| Violet: the seal of a species without a cover, and its stage | `#8a5cc4` | `--accent` |
| Bone paper: a species' trait plates | `#efe4cc` | `src/lib/game/character-sheet.ts` |
| Navy: the draft and beta badges, notes, the filter dialog | `#0a0c1e` | `--bg2` |
| Seal field of a tree without a domain | `#2a2a2e` | `src/lib/game/seals.ts` |
| Shadows | night (`#06050d`) at 60 to 78 %, or black at 45 to 62 % | the component of each piece |
| Glare on a leaning card | `#ffeec4` at 32 %, soft-light | `FramedCard.astro` |
| Print | inks `#14100a` and `#3a3448`, gold `#93701a` with black on it | the print rules of `CharacterHero.astro`, `SelectScreen.astro` and `EmptyStage.astro` |

### The key colour

Each entry's accent becomes its `--gold`, taken from the first source that applies:

1. A `keyColour` the entry writes, on a species or a tree. It wins over the cover, either where the
   reading misses the entry (Humain's azure `#44a8e7` over a cover that reads a pale rose, the Mage's
   Ether blue `#5379fd`) or to pin a reading the owner keeps (the Nnor's `#e8575c`). Each entry's
   file under `data/species/` or `data/skill-trees/` holds its own.
2. The cover, read at build time (`src/lib/art-key-colour.ts`), for an entry that writes none: Feu
   reads `#e7733e`. ADR 0054 records the Nnor's `#e85a48` and the Marchand's `#e8bea6`, read before
   their keys were written.
3. A tree without a cover takes its first domain colour, lifted until `#14100a` reads on it at 4.5
   (`treeSealKey` in `src/lib/game/seals.ts`).
4. Otherwise house gold `#efbe04`: a species with neither an authored key nor a cover, and a tree with
   neither an authored key, a cover nor a domain. A coverless species without an authored key is
   therefore a violet seal with a gold key.

**The reading** (`keyColour` in `src/lib/key-colour.ts`): the cover is sampled 96 px wide
(`src/lib/art-key-colour.ts`); only pixels at OKLCH lightness 0.45 or more and chroma 0.025 or more
count; the dominant hue is the fullest 10° bin, smoothed with its neighbours; the pixels within 30° of it are averaged, weighted by lightness to the
fourth power; strength = min(0.18, 11 × mean chroma²) and lightness = 0.92 - 1.5 × strength. A saturated
cover gives a stronger, deeper key, a muted one a softer, lighter key.

**What takes the key.** Inside a sheet and a spotlight panel `--gold` is the key (`CharacterHero.astro`,
`SpotlightPanel.astro`), and on each roster card it is that card's key (`CoverCard.astro`). The key
colours the kind label and its hexagon, the stickers, the slab, the double rule, the ghost name (at
34 %), the emblem's gradient, the seal's crest and initial, the rank profile (outer ring, fill, dots,
edge, markers, grade borders and offsets, the S grade), the booklet button, the focus outlines inside
the sheet and on that card, and the roster kicker (55 % key, 45 % white).

**What keeps its own colour.** Trait plates (a tree's Caractéristique colour lifted to read, bone for a
species), status badges, and the select screen's chrome, which stays house gold: the title plates,
Filtres, « Ouvrir la fiche », the step chevrons, the help glyph, the group marks and the results tape.
Rules and quiet borders are line gold everywhere, never the key.

**The reading column takes it too.** `Species.astro` and `Tree.astro` set `--key` and `--key-paper` on
their reading columns (`readingKeys` in `src/lib/key-colour.ts`): a lore quote's background, its big
quotation mark, its nameplates' edge and its second speaker's tag take the entry's key; elsewhere a quote
takes house gold.

### Seals

A seal is the picture of an entry without a cover (`CoverSeal.astro`, `src/lib/game/seals.ts`).

- **The field**, at 86 % over `#0d0b16`: for a tree its domain colour, or two domain colours split hard
  on the 135° diagonal, or `#2a2a2e` with no domain; for a species the violet `#8a5cc4`.
- **Over the field**: a 165° darkening toward the bottom, a night halftone fading from the top right, a
  giant outlined initial bleeding off the lower right and, at the centre, the logo's two pointy-top
  hexagons (the polygons of `data/media/aubaine-logo.svg`) stroked in the key colour around the initial
  in Cinzel 700, with a hard 5 / 6 px shadow.
- **The stage behind** paints the same colours on night (`fieldBackdrop` in `src/lib/game/hubs.ts` for
  CSS, `paintField` in `src/scripts/stage-field.ts` for the GPU), mixed toward night so that a seal never
  outshines a painted cover.
- The species violet is also the Compétences kind colour.
- A book without a cover takes a seal in its category's colour (`categorySeal`), on the Livres category
  pages.

### Kind and category marks

Each kind of content has one colour and one pictogram in `KIND_MARKS` (`src/lib/game/kind-marks.ts`), as
Compétences takes `game-icons:spell-book` in `#8a5cc4`; each book category has one in `CATEGORY_MARKS`,
in the same file, as Ressources takes `game-icons:folded-paper` in
`#c0457e`. The sets live there; `kindInk` and `categoryInk` lift a colour until it reads on night. A kind's name always sits beside its mark, and a mark marks the kind while an entry keeps its
own colour (`.claude/rules/frontend/kind-marks.md`). On a species or tree page, the title frames ink
every pictogram in the entry's key colour, the kind's mark included.

### Dark in both themes, and print

- Every stage carries `.au-dark` (the sheet, the select screen, each roster card), which restores the dark
  tokens; only the reading below a stage follows the light theme. `tests/e2e/character-hero.spec.ts` and
  `tests/e2e/hub-stage.spec.ts` check it.
- A lore quote's boxes are night and its title bone in both themes; print and forced colours show it as a
  plain quote with its guillemets.
- In print the stage drops out and the inks turn dark. On the sheet, the select screen and an empty
  category's page gold turns `#93701a`, which reads on white and takes black on it, with or without
  background graphics. The Codex and Livres title plates keep house gold, and a roster card keeps its own
  colours.

### Blue

No colour is reserved for the Almanach or for any section. Blue is an identity colour like any other:
Humain's authored azure `#44a8e7`, the Règles kind blue, the seals of trees in a blue domain.

## Typography

| Role | Face | Size | Tracking, case | Ink | Where |
| --- | --- | --- | --- | --- | --- |
| Entry name: the sheet's `h1`, a `p` in the spotlight | Cinzel 700 | fitted at 0.78 em a letter: `min(40, 100 / (0.78 × letters))` cqi of the sheet column, within 30 to 132 px from 960 px wide and 30 to 96 px below; in the spotlight `min(30, 96 / (0.78 × letters))` cqi within 30 to 64 px, or up to `min(76px, 9cqh)` in the wide column | line-height 0.93 | `#ece8f7`, with shadows `0 2px 0` and `0 8px 36px` of night | `SheetHead.astro`, `CharacterHero.astro`, `SpotlightPanel.astro` |
| Ghost name | Cinzel 700, outline only | `min(22, 70 / (0.78 × letters))` cqi of the sheet's section; `min(24, 84 / (0.78 × letters))` cqi of the spotlight's panel | line-height 0.8, no wrap | a 1.5 px stroke of the key at 34 % | `GhostName.astro`; its sizes in `CharacterHero.astro` and `SpotlightPanel.astro` |
| Roster name | Cinzel 700 | `min(11, 84 / (0.78 × letters))` cqi of the card, within 13 to 27 px | line-height 1.02 | `--ink`, `--ink2` on a draft | `CoverCard.astro` |
| Title plates: the select screen's `h1` | Cinzel 700 | fitted at 0.8 em a letter: `min(19, 82 / (0.8 × letters))` cqi for the whole title when that reaches 9 cqi, otherwise fitted to the longest word over three letters; within `min(38px, 10.5cqi)` to 112 px; a word of three letters or fewer in a longer title becomes a plate at 0.42 em | capitals, line-height 0.86 | odd plates `#20180a` on house gold, even plates house gold on `#08070d` | `TitlePlates.astro` |
| Rank letters | Cinzel 700 | 22 px | | `#fbf8ef`; the S grade `#20180a` on the key | `RankProfile.astro` |
| Seal initial | Cinzel 700 | inside the crest, and repeated as a 96 cqi outline | | the key; the outline `#f4f1fb` at 16 % | `CoverSeal.astro` |
| Kind label, in the eyebrow | JetBrains Mono | 11.5 px | 0.24 em, capitals | the key, after a solid 12 × 13 px hexagon; no tape | `SheetHead.astro` |
| Tapes | JetBrains Mono on `#08070d` | roster kicker 9.5 px, trait label 9.5 px, group label 12 px, results tape 10.5 px | 0.2 em, 0.2 em, 0.26 em, 0.16 em; capitals | the key, the plate's paper colour or gold, mixed with white; the group label plain house gold | `CoverCard.astro`, `TraitPlates.astro`, `SelectScreen.astro`, `FilterBar.astro` |
| Profile caption, scroll cue | JetBrains Mono | 11 px; 10.5 px | 0.24 em; 0.3 em; capitals | the key; `--ink2` | `RankProfile.astro`, `CharacterHero.astro` |
| Stickers | Barlow Semi Condensed 700 | `clamp(17px, 1.6vw, 22px)`; 13 to 15 px in the spotlight | 0.06 em, capitals | `#20180a` on the key | `DescriptorStickers.astro` |
| Trait values | Barlow Semi Condensed 700 | 19 px; 12 to 14 px in the spotlight | 0.06 em (0.04 em in the spotlight), capitals | `#14100a` | `TraitPlates.astro` |
| Buttons and badges | Barlow Semi Condensed | « Ouvrir la fiche » 700 at 15 px, Filtres 700 at 14.5 px, the booklet button 600 at 15 px, badges 700 at 13 px (11 px small) | 0.08 em (the booklet button 0.1 em), capitals | `#20180a` on gold or on the key; badges their own | `Spotlight.astro`, `FilterBar.astro`, `src/components/views/Tree.astro`, `src/styles/base.css` |
| Profile axis labels | Barlow Semi Condensed 600 | 12 px; 8 to 12 px on black tapes in the spotlight | 0.12 em, capitals | `--ink2`; on the tapes, 45 % key and 55 % white | `RankProfile.astro` |
| Subtitles | EB Garamond italic | `clamp(19px, 2.2vw, 28px)`; `clamp(16px, 1.4vw, 20px)` in the spotlight | line-height 1.3 | `#b3abc9` | `SheetHead.astro`, `SpotlightPanel.astro` |
| Codex door name | Cinzel 700, one paper plate per word | one size per hub: below 960 px 30 to 112 px, fitted from the longest word at 0.8 em a letter; from 960 px at most 56 px and fitted so the widest whole name holds one line; the 30 and 28 px floors give way when the fit needs less | capitals, line-height 0.86 | at rest `--ink` (`--ink2` from 960 px) on paper night; lit `#14100a` on bone `#efe4cc` | `PlateDoor.astro`, `PlateMenu.astro` |
| Codex door line | EB Garamond italic | `clamp(18px, 1.6vw, 26px)`; `clamp(16px, 1.25vw, 20px)` from 960 px | line-height 1.25 | `--ink2`, `--ink` when lit | `PlateDoor.astro` |
| Livres running head « Sommaire » | Cinzel 700 | 13 px | 0.12 em, capitals | `#14100a` over a rule at 22 % | `SommaireSpread.astro` |
| Livres numeral | Cinzel 700 | 96 px; 128 px from 640 px; from 1100 px fitted to the row, `clamp(84px, (row - 40px) / 0.78, 240px)` | line-height 0.74 | at rest bone tinted with 24 % of the entry's colour; lit bone stroked 1.5 px in `#14100a` | `SommaireEntry.astro`, `SommaireSpread.astro` |
| Livres entry name | Cinzel 700 | fitted from the longest word at 0.8 em a letter, one size per hub: at most 28 px, 40 px from 640 px; no floor, so the longest word always fits before its hexagon (14.2 px on a 320 px screen, 22.7 px on 390 px) | capitals, line-height 1 | `#14100a`, haloed 2 px in the paper | `SommaireEntry.astro`, `SommaireSpread.astro` |
| Livres entry line | EB Garamond italic | `clamp(16px, 1.25vw, 19px)` | line-height 1.25 | `#3a3448`, `#14100a` when lit | `SommaireEntry.astro` |
| Page title, a reading page's `h1` | Cinzel 700 on a night plate | `clamp(14px, min(5.2cqi, (100cqi - room) / letters), 42px)`, fitted to the longest word; the plate at least `min(55cqi, 30rem)` wide | line-height 1.08, 0.02 em | `#efe4cc` | `PageTitle.astro`, `src/styles/titles.css` |
| Section title, `h2` | Cinzel 700 on a bone plate | `min(var(--prose-h2), (100cqi - room) / letters)`; the plate at least `min(40cqi, 22rem)` wide | line-height 1.18, 0.03 em | `#14100a` | `SectionTitle.astro`, `rehypeProseHeadings`, `src/styles/titles.css` |
| Subsection title, `h3` | Cinzel 700 on a night plate | `min(clamp(1.0625rem, 1.02rem + 0.22vw, 1.1875rem), (100cqi - room) / letters)`; the plate at least `min(28cqi, 15rem)` wide | line-height 1.2, 0.03 em | `#efe4cc` | `SectionTitle.astro`, `rehypeProseHeadings`, `src/styles/titles.css` |
| A page title's line | EB Garamond italic | `clamp(1.0625rem, 1rem + 0.3vw, 1.25rem)` | line-height 1.4 | `--ink2` | `PageTitle.astro` |
| Reading | Spectral (`--font-body`) | the prose scale of `src/styles/tokens.css` | | | `src/styles/base.css` |

The families are declared in `src/styles/fonts.css`.

- **Display type shouts, reading type talks.** Cinzel, mono and Barlow capitals are for names, titles,
  labels and buttons. Sentences sit level, in Spectral or EB Garamond.
- **A name is fitted from its letter count** (`fitted` in `CharacterHero.astro` and
  `SpotlightPanel.astro`, the same rule in `CoverCard.astro` and `TitlePlates.astro`), so it never breaks
  inside a word and never leaves its column. 0.78 em a letter sits above the widest advance measured on
  the built site, 0.763 em for « Nnor »
  (`docs/adr/0054-the-hero-of-a-tree-or-a-species-is-a-character-sheet-on-a-living-stage.md`).
- **Plates and panels grow with their text** in both languages; nothing is sized to the French or the
  English string.

## Layout

### Page types

| Page type | Opens | Layout | Status |
| --- | --- | --- | --- |
| Sheet | one entry: a tree, a species | the character sheet, `CharacterHero.astro` | approved |
| Select screen | a list of entries: Arbres, Espèces, and the books of a Livres category | `SelectScreen.astro` | approved for Arbres and Espèces; the Livres category pages reuse it (`src/components/views/BookCategory.astro`), and a category with nothing yet shows the empty stage instead (`EmptyStage.astro`) |
| Hub | a list of sections: the Codex's indexes; the Livres categories and the archives | the plate menu, `PlateMenu.astro`, for the Codex (`src/components/views/Codex.astro`); the contents spread, `SommaireSpread.astro`, for Livres (`src/components/views/Library.astro`) | approved 2026-10-31 |
| Index | a long list with a detail pane: Compétences, Équipement, Matériaux, Règles | `src/components/views/Browse.astro`: a 16:9 banner, the filter bar, the list and its detail | predates the direction |
| Reader | a book chapter | `src/components/views/Book.astro` | predates the direction |
| Home | the whole site | `src/components/views/Home.astro`, over the Bastion video | predates the direction |
| Atlas | the map of Aubaine's worlds | the Atlas and its CADRAN boot | its own direction (`docs/adr/0044-the-cadran-boot-is-the-atlas-loader-and-its-bar-follows-the-real-load.md`) |

`src/components/views/View.astro` maps each route to its view.

### The character sheet

`CharacterHero.astro` opens one tree or one species. Every value is in
`.claude/skills/aubaine-design/references/approved-pieces.md`.

- **The section** is dark in both themes, closed by a line-gold rule, and it is both the stage host and
  the tilt host: a mouse anywhere over it leans the card.
- **From 960 px wide**, two columns: the sheet (`minmax(0, 1fr)`) and the card (`auto`), at most 1560 px
  wide, padded 44 px on top, 26 px on the sides and 76 px below, with a gap of
  `clamp(36px, 5cqi, 104px)`, at least `min(92vh, 900px)` tall. The card is
  `clamp(300px, min(36vw, (92vh - 120px) × 0.75), 560px)` wide and stands `clamp(8px, 3cqi, 64px)` from
  the right.
- **Below 960 px** the card comes first, `min(100vw - 32px, 520px)` wide, and the sheet follows 30 px
  under it.
- **The sheet**, top to bottom: the eyebrow (a solid hexagon, the kind in mono capitals, a fading rule,
  the status badge), the name as the page's `h1`, the subtitle, the descriptor stickers 24 px below, then
  the rank profile beside the trait plates and the actions. A tree's actions, « Télécharger le livret »
  and « Versions précédentes », stand straight and cast no shadow.
- **A tree** always shows its rank profile, ranked, or with « ? » on each grade until it is ranked. **A
  species** never shows one. **An entry without a cover** shows its seal on the card and on the stage.
- **The ghost name** sits low on the right, behind the card, and runs off the right edge of the screen;
  the slab bleeds past that edge too. Both stay as approved (2026-10-30); no new piece is cut by its
  frame.
- **Also on the section**: a 38 px pause square at the bottom right and, from 640 px wide, a sticky
  « LIRE LA SUITE » cue at the bottom centre.

### The select screen

`SelectScreen.astro` opens a list of entries. Its values are in
`.claude/skills/aubaine-design/references/approved-pieces.md`.

- **Two columns only from 1100 px wide and 640 px tall**: the title, the filter bar and the roster on the
  left (`minmax(0, 1fr)`), the spotlight on the right (`clamp(420px, 34vw, 540px)`), with a gap of
  `clamp(32px, 3.4vw, 72px)`, at most 1560 px wide. Smaller screens get one column in the order title,
  spotlight, filter bar, roster.
- **The stage** is a sticky layer one screen tall behind the roster, so the painting stays while the list
  scrolls.
- **The title** is the title plates, the page's `h1`, with a 44 px help button inside the heading. The
  button opens a native popover with the lead and a link to the matching chapter of the Livre du joueur
  (`HUB_CHAPTERS` in `src/lib/game/hubs.ts`). No explanation is printed under the title, and the search
  field sits less than 96 px under it (`tests/e2e/hub-stage.spec.ts`).
- **The filter bar** (`FilterBar.astro`): a name field, after a tree-kind menu on Arbres, both in
  line-gold borders, the « Masquer les brouillons » switch, a black results tape and the gold Filtres
  plate, closed by a line-gold rule.
- **Group marks**: an `h2` per group (Archétypes and Domaines; the species form one group without a
  heading): an outlined hexagon, the label on a black tape at -2°, a rule fading to the right.
- **The roster** is a grid of cards at least 148 px wide on a phone, 176 px from 640 px wide and 156 px
  in the two-column layout. A card (`CoverCard.astro`) is a link: the cover or the seal under a scrim, a
  tree's 4 px spine in its seal colours, a tree's Caractéristique badges at the top right, the status
  badge of an entry that is not a draft at the top left, and at the bottom the kicker tape over the
  Cinzel name. A draft is darkened (saturation 0.7, brightness 0.74) under a halftone veil, its name in
  `--ink2` and « BROUILLON » stamped across its centre at -12°; it stays a link.
- **The spotlight** (`Spotlight.astro`, `SpotlightPanel.astro`) is a named region showing the pointed or
  focused entry as the character sheet at preview size: the head (kind, status, name, subtitle,
  stickers), the card, the trait plates and the ghost name. In the two-column layout it is sticky under
  the 64 px header and as tall as the screen below it; the card is `min(75cqh, 76cqw)` of its stage, and
  a tree's profile lies over the card's lower-left corner, reaching no further than the card's left
  quarter. From 640 px wide, outside the two-column layout, the head, the profile and the plates sit
  left of the card (`min(30vw, 300px)`); on a phone everything stacks and the card is
  `min(52vw, 240px)`.
- **The controls**, one row under the panel: previous and next (44 px black squares with gold chevrons),
  the « Ouvrir la fiche » plate taking the rest of the row, and the 38 px pause square. The panel itself
  holds no control.
- **The lead**: on arrival, and without JavaScript, the spotlight shows the first entry in lead order:
  published with a cover, published, draft with a cover, draft, then by name (`leadOrder` in
  `src/lib/game/hubs.ts`). That is Marchand on Arbres and Humain on Espèces.
- **One layout for every entry**: each panel invisibly reserves the list's longest subtitle, its longest
  sticker row and a status badge, so that nothing jumps from one entry to the next.

`tests/e2e/select-screen.spec.ts` checks every entry, in both locales, at 1512 × 982, 1366 × 657,
1024 × 768 and 390 × 844: the plates share one ink that reads at AA, and from 1100 px wide the stickers
sit on one row and the trait plates on one row; the profile keeps its size and overlaps the card instead
of shrinking it, and nothing sits under the profile; no piece is cut by the panel or by the screen.

### Hubs

The Codex (`/fr/almanach`, `/en/almanach`) opens on the plate menu, after Persona 5's pause menu built in
Aubaine's paper. Livres (`/fr/livres`, `/en/books`) opens on its contents, a printed book's contents laid
on the stage. On both, each section is a door, one door holds the light at a time, and the stage behind
takes the picture of the page that door opens. No door carries a count.
`.claude/skills/aubaine-design/references/approved-pieces.md` gives every value.

**The Codex.** `PlateMenu.astro` lays the hub out and `PlateDoor.astro` draws a door.

- **The title** is the hub's name in title plates, with the help note that holds its lead.
- **A door** is its kind's hexagon, its exact name in Cinzel paper plates (one plate per word, black
  paper at rest), and one line in EB Garamond italic. Every index has its door.
- **The lit door** turns its plates to bone paper with dark ink, fills its hexagon and, from 960 px wide,
  grows 1.16 times. A pointed name lifts over a halftone slab in its colour. The first door is lit at rest;
  pointing or keyboard focus moves the light and, with JavaScript, it stays, like a menu's cursor, on the
  last door the pointer rested on or the keyboard focused.
- **The scene**, from 960 px wide: behind the lit door, a slanted band in its colour across the right of
  the stage carries its pictogram huge, struck in bone paper over a hard black offset and a plate of its
  colour (`DoorGlyph.astro`). Below 960 px the doors stand alone on the stage.
- **The stage** shows each section's own picture, blurred into light: the cover or seal of the page's
  lead entry, or the page's banner. No sharp painting and no picture made for the hub.
- **The names share one size** per hub, with the lit growth reserved, so a lit name never reaches the band.
  On a desktop every name holds one line; below 960 px the size follows the longest word and a long name
  may wrap.

**Livres.** `SommaireSpread.astro` lays the spread out and `SommaireEntry.astro` draws an entry.

- **The sheet** is bone paper laid on the stage, the hub's title plates hanging over its top edge and
  the running head « Sommaire » above the entries. From 1100 px wide it is a two-page spread with a
  fold, the entries filling the left page, then the right.
- **An entry** is a Roman numeral, the category's exact name in Cinzel, leader dots to its hexagon from
  640 px wide, and one line in EB Garamond italic. Every book category has its entry, in `BOOK_CATEGORIES` order, whether
  it holds a book or not; the archives come last.
- **The lit entry** cuts its numeral in paper over a halftone slab of its colour and fills its hexagon
  with dark ink over an offset of that colour; its dots and its line darken. The first entry is lit at
  rest, and the light moves as on the Codex.
- **The stage** shows the light of the page each entry opens: the category's lead cover or seal, and for
  the archives the painting their page opens on.
- **The names share one size**, fitted from the longest word, and keep shrinking on the narrowest screens
  rather than run into their hexagon.
- **A category with nothing yet** still has its page: the stage in its seal's colours, its title plates,
  and the house empty state (`EmptyState.astro`) in a dark panel with a link back to all books
  (`EmptyStage.astro`). The page stays out of search engines and the sitemap.

One other door layout is built only on the gated prototype page (`src/pages/prototype/[...look].astro`,
which builds only with `AUBAINE_PROTOTYPE=1`): slanted doors, one slanted panel per section side by side,
the open one filled with its colour and, from four doors, wider (`SlantedDoors.astro`). It uses the same
door contract (`src/scripts/door-light.ts`, `src/styles/doors.css`).

## Elevation & Depth

From the back to the front:

1. **Night**, `--bg`.
2. **The ambient or the living stage.** The CSS ambient (`StageBackdrop.astro`) is the cover as a 128 px
   WebP stretched 48 px past every edge, blurred 40 px, saturated 1.45 and darkened to 0.62 (`STAGE` in
   `src/lib/art-effect/presets.ts`); without a cover it is a field of the seal's colours. With WebGL2 the
   living stage (`src/scripts/art-effect/stage.ts`, `glsl/stage.frag`) prepends its canvas inside the
   stage and hides the ambient: smoke drawn from the cover, motes tinted by the colour beneath them,
   shafts falling from above the focused card. It replaces the ambient under the shade and the
   halftone; it never sits above them.
3. **The shade**: dark on the reading side, clear on the card's side from 960 px wide.
4. **The halftone**: 1.5 px night dots on an 8 px grid, fading out from the lower left.
5. **The ghost name.**
6. **The slab**, the key-colour halftone quadrilateral behind the card.
7. **The card**: its night body, the picture or the seal, the double rule, the emblem, the glare. A
   roster card adds a scrim, a tree's spine, its badges and its tapes.
8. **Paper**: stickers, plates, tapes, the rank profile. In the wide spotlight the profile lies over the
   card's lower-left corner.

**Shadows** are hard offsets toward the lower right, in proportion to the piece:

| Piece | Offset (x / y) | Colour |
| --- | --- | --- |
| Sheet card | 14 / 16 px | night at 78 % |
| Spotlight card | 8 / 9 px | night at 72 % |
| Roster card | 7 / 8 px | night at 72 % |
| « Ouvrir la fiche » | 4 / 5 px, 6 / 8 px when pointed | night at 70 % |
| Stickers, trait plates | 4 / 5 px (3 / 4 px in the spotlight) | black at 62 % |
| Filtres | 4 / 4 px, 6 / 6 px when pointed | night at 60 % |
| Help and step squares; the group-label tape | 3 / 4 px; 3 / 3 px | night at 60 % |
| Grade plates | 3 / 3 px | the key colour; the S grade casts night |
| Draft stamp | 3 / 3 px | night at 75 % |
| Kicker, trait-label and results tapes | 2 / 2 px | black at 45 to 50 % |
| Title plates | 0.07 / 0.08 em | night at 72 %; the black plates cast house gold at 70 % |
| Codex door plates | 0.06 / 0.07 em | the door's ink at 70 % (45 % from 960 px) at rest; night at 72 % when lit |
| Codex door hexagon | 3 / 4 px | night at 60 % |
| Livres sheet | 8 / 9 px; 16 / 18 px from 640 px, over two paper edges | night at 72 %; 78 % from 640 px |
| Livres numeral, lit | 4 / 5 px | black at 62 % |
| Livres hexagon, lit | 2.4 / 2.4 px; 2.9 / 2.9 px from 640 px | its offset, in the entry's colour |

- **Black pieces cast coloured offsets**: the black title plates cast house gold, the grade plates the key
  colour.
- **Soft exceptions**: the name's `0 8px 36px` under its hard `0 2px 0`, the emblem's blurred halo, the
  roster's Caractéristique badges (`0 2px 5px`), the stickers' soft shadow while they land, and the help
  note's `0 24px 60px`.
- **Proportion**: an offset keeps its proportion to its piece; the spotlight's smaller card casts 8 / 9 px,
  not the sheet's 14 / 16 px.
- **No band of shade** sits behind a row of controls.

## Shapes

- **The card is 3:4** (`FramedCard.astro`), one picture per entry. Its double rule is two 1 px hairlines
  in the key colour, 10 and 15 px in (7 and 11 px on the roster), at 60 % and 28 %. Every card wears it,
  pointed or not: it marks the card, not focus.
- **The slab** is a quadrilateral, `polygon(16% 0, 100% 5%, 86% 100%, 0 94%)`, printed with 1.3 px night
  dots at 20 % on a 7 px grid.
- **Paper** is plain rectangles; the grade plates are skewed -10°.
- **Squares**: 44 px for the help, previous and next buttons; 38 px for the pause.
- **The hexagon is pointy-top**, like the logo, never a diamond: the eyebrow's solid mark, the group
  marks, the seal's crest (the logo's double hexagon), the profile's rings and markers, the
  Caractéristique badges (the rounded `mdi:hexagon`), the frame of a trait's glyph, the divider's mark.
- **No circle and no rounded corner** in the approved pieces, apart from the rounded `mdi:hexagon`, the
  drafts switch and the titles' frames. Since 2026-11-10 a section, a subsection and a page title other
  than a book's chapter hold their picture in a ring, the owner's pick for title frames only; a book's
  chapter title keeps the pointy-top hexagon, and every marker, bullet and badge stays a hexagon.

**Angles.** Each kind of paper cycles through its own resting angles:

| Piece | Resting angles | Where |
| --- | --- | --- |
| Title plates | -4°, 2.5°, -2°, 3°; the help button 3° | `TitlePlates.astro` |
| Stickers | -3°, 2°, -1.5°, 2.5°; a struck one 2.5° further, never past 4°; a held one swings -5°, then +4°, then -3° off its tilt and comes back to it | `DescriptorStickers.astro` |
| Trait plates | -1.5°, 1°, -2°, 1.5°; their label tape -2.5° | `TraitPlates.astro` |
| Roster cards | -1.8°, 1.2°, -0.8°, 2°, -1.4°, 0.7°, 1.6°; turned to -0.6 times their angle when pointed | `CoverCard.astro` |
| Tapes | the kicker -2.5°; the group label and the results tape -2° | `CoverCard.astro`, `SelectScreen.astro`, `FilterBar.astro` |
| The card and its slab | -2° and 5° (the roster slab 4°) | `FramedCard.astro` |
| « Ouvrir la fiche » | -1.5° | `Spotlight.astro` |
| Emblem | -6° | `FramedCard.astro` |
| Draft stamp | -12° | `CoverCard.astro` |
| Codex door plates | -1°, 0.7°, -0.5°, 0.9°, the cycle starting at the door's index | `PlateDoor.astro` |
| The Codex band and pictogram | -6° and 4° | `PlateDoor.astro` |
| The Livres slab | 4° | `SommaireEntry.astro` |

- Paper and cards rest within 4° of level; the slab, the emblem and the draft stamp go further.
- **Straight**: reading text, form fields, the previous, next and pause squares, the sheet's booklet
  buttons, a painting under glass, which hangs level.
- **Navigation** follows reading order; nothing is laid out on a fan or a diagonal.

## Components

**Stage**

- `StageBackdrop.astro`: the CSS stage (the ambient or the seal field, the shade, the halftone), and the
  whole stage without JavaScript, under reduced motion and on the low tier.
- `src/scripts/art-effect/stage.ts` with `glsl/stage.frag`: the living stage, on the page's one WebGL2
  context (`src/scripts/art-effect/studio.ts`); 30 frames a second on the ultra tier, 24 on high, none on
  low (`EFFECT_TIERS` in `src/lib/art-effect/presets.ts`), only while on screen; a new source cross-fades
  in 450 ms.
- `paintField` in `src/scripts/stage-field.ts` and `fieldBackdrop` in `src/lib/game/hubs.ts`: a coverless
  entry's seal colours, painted for the GPU and in CSS.
- `src/lib/stage-ambient.ts`: an entry's stage source, its cover or its seal colours.
- `StillToggle.astro` with `src/scripts/stillness.ts`: the 38 px pause square; one choice for every
  stage, remembered under `aubaine.stage`.
- `src/scripts/stage-host.ts`: binds the pause and the lean on every stage and card, again after each
  Swup visit.

**Sheet**

- `CharacterHero.astro`: the sheet's section, grid and stage; sets `--gold` to the key.
- `SheetHead.astro` (eyebrow, name, subtitle, stickers) and `SheetBody.astro` (profile, traits, the
  actions slot).
- `GhostName.astro`: the outlined name behind the card.
- `DescriptorStickers.astro`: one to four key-colour stickers, at `sheet` or `preview` size; a word its
  vocabulary strikes takes a brush slash in the sticker's ink once the row has landed, the sticker takes
  the hit, and a screen reader hears that the word is struck. A word held in suspense shows its first dot,
  punches in the next two, each punch growing the sticker and swinging it the other way, then lands, trembles
  and lets the sticker spring back; a screen reader reads the label as written.
- `TraitPlates.astro`: a black label tape over flat paper; a tree's Caractéristique colour lifted to
  read, bone for a species.
- `RankProfile.astro`: six axes on hexagon rings, grades on skewed plates, « ? » on an axis not ranked
  yet; trees only.
- `StatusBadge.astro`: draft (navy, a dashed border), playtest (yellow with black stripes), beta (a teal
  outline); the word is always written.
- `CharacteristicHex.astro`: a glyph in a rounded pointy-top hexagon.

**Cards**

- `FramedCard.astro`: the 3:4 card, its double rule, its slab, its glare and, at hero size, the entry's
  emblem: the white SVG of `data/media/emblems/` used as a mask over a key-colour gradient, raised by a
  lit edge, a dark edge and a halo. Sizes `hero` and `roster`.
- `CoverCard.astro`: the roster card, a link resting at its angle.
- `CoverSeal.astro`: the seal of an entry without a cover.
- `Banner.astro`: the picture inside a card, with its slow pan.

**Select screen**

- `SelectScreen.astro`: the grid, the sticky stage layer, the group marks, the live region.
- `TitlePlates.astro` with `PopoverNote.astro`: the `h1` in plates and its help note.
- `FilterBar.astro` with its island, `src/islands/FilterBar.tsx`.
- `Spotlight.astro` and `SpotlightPanel.astro`: the preview column, its controls and its reserve.
- `src/scripts/select-screen.ts`: the intent delay, focus, the arrows, the swap, `aria-current`.
- `src/scripts/tilt.ts`: the lean toward a mouse.

**Data**

- `src/lib/game/character-sheet.ts`: one sheet for the page and the spotlight, so that an entry's kind,
  name, stickers, profile and traits are never rendered a second way.
- `src/lib/game/hub-cards.ts`: each entry's roster card, key colour and labels.
- `src/lib/game/seals.ts`, `src/lib/key-colour.ts`, `src/lib/art-key-colour.ts`,
  `src/lib/game/kind-marks.ts`, `src/lib/game/hubs.ts` (lead order, seal fields, handbook chapters) and
  `src/lib/select-entries.ts`.

**Hubs**

- `PlateMenu.astro`: the Codex's section, stage, title and door list; it fits one name size per hub.
- `PlateDoor.astro`: one door, its hexagon, plates, slab, line and scene; `DoorGlyph.astro`: the
  pictogram struck in paper on the scene's band.
- `src/scripts/door-light.ts` and `src/styles/doors.css`: the door contract, which lights a door with
  JavaScript or without it and moves the stage only with it.
- `src/lib/game/hub-doors.ts`: each hub's doors, named as their pages, with the light of the page each
  opens; `src/components/views/Codex.astro` and `src/components/views/Library.astro` render them.
- `SommaireSpread.astro`: the Livres section, stage, sheet, title and entry list; it numbers the entries
  and fits one name size. `SommaireEntry.astro`: one entry, its numeral, slab, name, dots, hexagon and
  line.
- `src/components/views/BookCategory.astro` and `src/lib/game/library.ts`: the Livres category pages;
  `EmptyStage.astro`: the page of a category with nothing yet, around `EmptyState.astro`.
- Built only on the gated prototype page: `SlantedDoors.astro` with `SlantedDoor.astro`.

**Reading**

- The titles: `rehypeProseHeadings` in `src/lib/game/book-markup.ts` wraps a prose page's `h2` and `h3` with
  a frame; `PageTitle.astro` and `SectionTitle.astro` build the rest; `src/styles/titles.css` draws them
  inside a `.au-titles` reading column. A page title is a night plate with the quote box's bone ring (on a
  book chapter led by a hexagonal frame holding the category's pictogram, elsewhere laid on a full-width
  key panel), a section a bone plate on a key strip, a subsection a small night plate on a strip of key
  dots, each level quieter and each plate at least a share of its column wide. Each frame holds the title's
  pictogram or, until one is set, the painted question mark of the square placeholder; frames are round,
  a chapter's hexagonal. Print and forced colours keep the plain titles.
- `rehypeProseQuotes` in `src/lib/game/book-markup.ts`: a blockquote becomes a speech or a dialogue, its
  source line the title, staged at a corner from `TITLE_CORNERS` on a background from `QUOTE_BACKINGS`.
- `src/styles/prose.css`: the night dialogue box with its bone contour, the bone title with its black
  nameplates, the big “ at the free corner, the name tags, the slab or the echoed box behind, and a
  dialogue turn's optional portrait, a bust in front of its box, one size for every turn. A dialogue's boxes
  climb half as steeply as a speech's. The right-hand speaker has a box of her own, its far end a point
  aimed at the other speaker.
- A painting under glass (a lore picture titled `"glazed"`, or `"glazed wood"`): a frame of
  `FRAME_KINDS`, the scanned gilt one or the modelled wooden one, drawn still as a `border-image`
  (`src/styles/prose.css`) and live by `src/scripts/art-effect/glazes.ts`, its light following the
  pointer or the scroll. A lore picture narrower than it is tall floats at the start of the text it
  heads, 46 % of the column, the text beside it and then under it; below 48rem it stands above the
  text, 22rem at most (`rehypeProseSidePictures`).
- The almanach (`src/components/primitives/Almanach.astro`, or a lore picture titled
  `"almanach"`, optionally followed by a style name, the point to keep in view such as `50% 20%`,
  then `mirrored`): the scanned device shows the picture on its tube, filling it around that point,
  mirrored when it asks, in the default style (`ALMANACH_STYLE`) or a saved one from
  `data/almanachs/`, with its power and zoom buttons as round buttons at the end of its caption's
  line, like a banner's pause button, or under it in the plate look without a caption
  (`src/styles/almanach.css`). Without WebGL2 on a graphics card, without JavaScript and in print, the
  picture shows plain. Styles are designed in the Dev Hub under `astro dev` (0070).

**Measuring**

- `tools/design/audit.ts` (`pnpm design:audit`): how far inside its frame or the screen every piece sits,
  at the browser sizes that matter, in every pointed state.
- `tools/design/pixels.ts` (`pnpm design:pixels`): captures pages and counts the pixels that changed.

## Motion and game feel

A game answers every input at once and never makes the player wait for a flourish.

**Input** (`src/scripts/select-screen.ts`)

- A mouse or a pen selects a card after 80 ms of intent (`INTENT_MS`), so a sweep across the roster does
  not flicker; leaving the card first cancels it.
- Keyboard focus selects at once. Touch never selects by hovering; a tap opens the card.
- While keyboard focus is on a spotlight control, pointing elsewhere swaps nothing.
- A swap waits at most 250 ms for its picture to decode (`PICTURE_WAIT_MS`), then shows.
- The arrows step through the entries shown, wrapping around, and announce the name.

**A pointed card, every layer at once**

- It turns its resting angle to -0.6 times itself and lifts 6 px, in 0.34 s (`CoverCard.astro`,
  `FramedCard.astro`).
- Its key-colour slab fades in (0.28 s), grows from 0.9 to 1 and slides 5 % right and 2 % down
  (0.34 s).
- A mouse leans it: on each axis the lean is 0.9 × tanh(0.7 × the pointer's offset from the card's
  centre, in half-widths or half-heights), times 7°, so at most 6.3°, in a 1400 px perspective; 0.6 s
  at rest, 0.14 s while tracking (the curve in `src/scripts/tilt.ts`; the angle, the perspective and
  the timings in `FramedCard.astro`). A warm glare follows the lean and, on the sheet and in the
  spotlight, the ghost name slides the other way, 22 px times the lean (`GhostName.astro`).
- The spotlight replays the sheet at 0.35 of its timings (`SWAP_ARRIVAL`), and the stage cross-fades to
  the entry's painting, or to its seal colours, in 450 ms (`FADE_MS` in
  `src/scripts/art-effect/stage.ts`).
- `aria-current` moves to it. The card never scales up, no circle appears, no sound plays.

**The sheet's arrival**, once per page. Every duration and delay is multiplied by `--arrival`, except the
cover's settle (`Banner.astro`), a struck sticker's slash and hit, and a held sticker's punches and word: they
keep their durations, and they start 0.3 s plus 0.62 s times `--arrival` in.

| Starts | Lasts | Piece | Curve |
| --- | --- | --- | --- |
| 0 s | 0.5 s | the name rises 14 px | `--ease` |
| 0 s | 0.55 s | the card lands from 22 px lower, at scale 0.965 and -5° | `--ease` |
| 0.12 s | 0.75 s | the slab swings in from -2°, scale 0.9, transparent | `cubic-bezier(0.22, 1, 0.36, 1)` |
| 0.16 s, then 0.07 s apart | 0.42 s | the stickers slap from scale 1.45 at -6° | `cubic-bezier(0.2, 1.45, 0.4, 1)` |
| 0.92 s | 0.09 s | a struck word's brush slash is laid down from the left | `cubic-bezier(0.2, 0.6, 0.35, 1)` |
| 0.97 s | 0.34 s | the struck sticker takes the hit (scale 1.07, 5° more, a wider shadow) and springs back, further turned | `cubic-bezier(0.15, 0.85, 0.3, 1)`, then `cubic-bezier(0.3, 1.35, 0.5, 1)` |
| 0.92 s | 0.88 s | a held sticker punches in its second dot (scale 1.07, 5° back), its third 0.16 s later (scale 1.14, 4° forward), its word 0.2 s after that (scale 1.28, 1.18 below 960 px, 3° back), holds that for 0.3 s, then springs back to rest | `--ease-slap` for each punch, then `cubic-bezier(0.3, 1.35, 0.5, 1)` |
| 1.28 s | 0.1 s, then 0.4 s | the held word drops in from scale 1.6 at -6°, then trembles at full strength while the sticker holds its peak, its jolts dying out as it springs back | `--ease-slap`, then linear |
| 0.3 s | 0.95 s | the profile unfolds from its centre, its path animated, its markers sliding out | `cubic-bezier(0.22, 1, 0.36, 1)` |
| 0.34 s, then 0.07 s apart | 0.42 s | the trait plates slap from scale 1.35 at -5° | `cubic-bezier(0.2, 1.45, 0.4, 1)` |
| 0.5 s | 0.5 s | the emblem presses on from scale 1.7 at -22°, transparent | `cubic-bezier(0.2, 1.35, 0.4, 1)` |
| 0.95 s, then 0.05 s apart | 0.4 s | the six grades stamp from scale 1.6, transparent | `cubic-bezier(0.2, 1.5, 0.4, 1)` |
| 0 s | 1 s | the cover settles from scale 1.17 to 1.1 | `cubic-bezier(0.4, 0.02, 0.28, 1)` |

`--ease` is `cubic-bezier(0.16, 1, 0.3, 1)` (`src/styles/fonts.css`). The last grade lands near 1.6 s.

- **The sheet's arrival lasts about 1.6 s**, though ADR 0054 (Decision 1) says under 700 ms; the code
  decides. `tests/e2e/character-hero.spec.ts` checks that the name and the cover start visible; the grade
  letters start transparent.
- **On the select screen** the title plates slap in 0.46 s each from scale 1.4 at -6°, 0.08 s plus
  0.09 s a word (not scaled by `--arrival`). The roster deals in: each card takes 0.5 s from 18 px to the
  left, 26 px lower, -5° and scale 0.94, 40 ms after the one before, up to the thirteenth, the last
  done by 0.98 s. The spotlight's first entry plays the sheet's arrival at full length; each swap
  replays it at 0.35.

**A hub door**

- With JavaScript, pointing a door with a mouse or a pen lights it at once (`data-pointed`). After the
  same 80 ms of intent as the select screen, the door also takes `data-lit` and the stage swaps; leaving
  the door first cancels both, so a door the pointer only crosses never takes `data-lit` or the stage.
- With JavaScript, keyboard focus gives a door `data-pointed` and `data-lit` and swaps the stage at once.
- With JavaScript, while keyboard focus is anywhere in the menu (a door, the help button or the pause
  square), pointing a door lights nothing; without JavaScript, the same holds while a door holds keyboard
  focus.
- Without JavaScript, a door lights while it is hovered, where the primary pointer hovers finely, or
  while it holds keyboard focus, and the stage keeps the first door's picture.
- A pressed door lights while pressed (`:active`), with or without JavaScript; touch never moves
  `data-lit` and never swaps the stage.
- Once a door is taken, the light stays on it until its page arrives: pointing or focusing another door
  lights nothing, and the other doors' scenes go dark. Back lights the door taken, even one tapped or
  clicked before its 80 ms of intent.
- A stage swap cross-fades to the page's picture once it has decoded, waiting 250 ms at most.
- On the Codex, from 960 px wide, a lit name grows 1.16 times from its lower left over 0.24 s on
  `cubic-bezier(0.2, 1.35, 0.4, 1)` and slides 14 px right over 0.24 s on `--ease`, a pointed name lifts
  4 px over its slab in the same 0.24 s, and the band slides in over 0.18 s. Below 960 px a pointed name
  lifts 6 px over 0.34 s on `--ease`.
- On the Codex, on arrival, each hexagon strikes in from 1.3 times its size and each name slaps in from
  1.35 times and -5°, over 0.42 s each: the hexagons from 0.08 s and the names from 0.1 s, each door
  0.03 s after the one before, up to the sixth. The first name lands at 0.52 s, the sixth at 0.67 s.
- On Livres, the sheet lays in from 14 px lower and 0.985 times its size over 0.46 s on
  `cubic-bezier(0.2, 1.3, 0.4, 1)`, from 0.06 s. A lit entry's slab fades in over 0.28 s, grows from 0.9
  and slides over 0.34 s; its hexagon's offset slides out about 3 px and its colours turn over 0.2 s.

**Continuous motion**, stopped by the one pause button:

- The cover settles for 1 s, then pans and comes back every 24 s: at scale 1.1 by ±3.4 % and ±1.9 % on
  the sheet, at scale 1.06 by ±2.2 % and ±1.2 % in the spotlight. Roster covers stay still.
- The ghost name drifts 4 cqi over 32 s, then back over the next 32 s.
- The living stage runs at 30 frames a second on the ultra tier, 24 on high, not at all on low, and only
  while on screen.
- A sub-species' banner stirs in a light wind and its flag flies, at the stage's pace and only while on
  screen. Each has its own pause, a round button at the right end of its caption rule, which sets the
  same choice.

The sheet's scroll cue also nudges its chevron 5 px every 2.4 s; the pause does not stop it.

**The pause** (`StillToggle.astro`): one choice for every stage, remembered under `aubaine.stage`. It is
required wherever something moves for more than five seconds (WCAG 2.2.2).

**A page change** (`docs/adr/0066-a-page-change-is-a-view-transition-where-the-choice-carries-across.md`)

- The old page stays on screen until the new one is live, so no frame is empty, and the header holds still.
- What you chose becomes the next page: a door's plates fly into its page's title plates, and the rest
  cross-fades while the old page recedes to 0.97. A flown piece gives up its own landing on that visit; the
  other arrivals play live.
- The motion is paced to end about 400 ms after the click: 260 to 360 ms on `--ease-travel`, so a light page
  flies longer and a heavy one stays on budget. Art effects start when it ends.
- From a select screen, the spotlight opens into the sheet: every part travels to its counterpart in 400 ms on one
  curve, `--ease-carry`, with no overshoot, as four masses 0 to 60 ms apart (card, slab and ghost; the head;
  stickers and profile; traits). The roster fades away, the title and help button peel and the filters lift. Then
  the sheet's own arrivals finish it: the emblem presses on, the radar unfolds from its centre, the grades stamp.
  Back starts the masses in the opposite order, and the roster fades in over the last 220 ms of the flight, whole
  when the last piece lands.
- The living stage carries across a page change: the light keeps drifting with its halftone and shade, and when
  the next page's painting differs it crossfades in 450 ms, as on the select screen. A page change has no
  wedge, burst or flip: games keep those for rare moments, and the shipped menus of Deadlock and the League
  client change page with little more than a fade (`.claude/skills/aubaine-design/references/hextech.md`,
  `deadlock.md`).
- From the Livres spread, the help button leaves first, then the title plate dips, peels and flies off the
  screen by about 290 ms. Over that, from 110 ms, the right page turns over the spine and its back lands with
  the crest by about 380 ms, and the closed book is thrown off the screen by 530 ms. The page arrives from 270
  ms. Coming back to Livres, the book comes up and opens by 420 ms; the plate falls from 265 ms, lands past its
  rest and settles by 585 ms; the help button stamps on from 400 ms, by 620 ms.
- A link answers at once (`data-pressed`), pressed paper moves 2 to 4 px and its offset shadow tightens, and
  a card never scales. A click during the transition is kept and replayed at its point.
- Back returns the scroll, the spotlight or lit door, and flies the piece home if it is on screen. The other
  doors fade in over the last 220 ms of that flight.
- From the Codex to a select screen, from 1100 px wide and 640 px tall, the lit door's band and pictogram slide
  off the right edge as one piece, on the title's 260 to 360 ms of `--ease-travel`. The spotlight already
  stands behind them: it appears over 120 ms and plays its own arrival as it is uncovered. Back slides the band
  in from the right on the same timing while the spotlight fades on the same curve, so none of it stays beside
  the landed band. Narrower screens, where the spotlight sits under the title, and the indexes not yet redone
  keep the cross-fade.

**Waits ride the load**: a swap waits for its picture at most 250 ms and adds no hold of its own; the
page crest shows only on a slow visit (`docs/adr/0012-the-header-outlives-the-page.md`, Decision 3).

**Reduced motion**: every animation and transition collapses to 0.001 ms (`src/styles/base.css`);
nothing leans or drifts; a page changes with no transition; the stage code is never fetched and the pause
button hides (`tests/e2e/hub-stage.spec.ts`); a swap still changes the picture and the colour.

## Pictures

- **One 3:4 picture per entry**: its card, its sheet, the front of a tree's booklet and its social image
  (`docs/adr/0053-hero-art-is-developed-on-the-gpu-over-its-plain-picture.md`, Decision 1, which records
  the owner's two reasons). The owner's first brief for the sheet made it the one constraint: "only
  constraint keep the 3:4 aspect ratio image" (2026-10-23).
- **A seal for an entry without one**, never a placeholder painting: on its roster card, in the spotlight
  and on its own page. "the new programtically generated cover should be shown instead of the image
  placeholder" (2026-10-28).
- **An `-og` file is the owner's original** and its pixels are never edited. An entry that wants its
  cover facing the other way writes `coverMirrored: true`: its card, its sheet, its spotlight and its
  booklet cover show the painting mirrored with `scale: -1 1` (`Banner.astro`, `print/Cover.astro`),
  while the blurred stage and the social image keep it as painted.
- **The stage** comes from the entry's painting or from its seal, blurred into colour.
- **No picture or video made for one page.** A hub may reuse what its sections hold (covers, emblems,
  pictograms) or draw with WebGL. The Home video and the 16:9 banners of the four index pages predate
  this rule.
- **Real materials on heraldry and frames**: scanned or baked, lit on the GPU, never a gradient
  pretending to be metal; gold vibrant, never "dark-dusty" (2026-10-26). ADR 0059 records them and is
  still Proposed. The card's emblem is the approved exception (ADR 0054, Decision 6). A frame no scan
  provides, such as the rustic wooden frame of « Les derniers Galwariens », is modelled and baked from a
  CC0 wood scan (2026-11-08, ADR 0075).
- **Torn, stone and rupture masks** (`data/media/masks/`) are for lore pictures only.
- **One WebGL context**: the live pieces share `src/scripts/art-effect/studio.ts`; the torchlight on lore
  pictures (`src/scripts/torchlight.ts`) still opens its own, and the almanachs of a page share one of
  theirs. Outside the Atlas and the almanach, three.js only bakes (`tools/media/textures.ts`; 0069).
- **Drawn before it is seen**: a banner, a flag, a coat of arms, a painting under glass and an almanach
  build two screens before they reach the screen. A browser that has drawn on its graphics card before
  (`aubaine.gpu`) never shows their plain picture: the frame waits empty until the piece is drawn, then
  the canvas takes over at once. A first visit, no graphics card, no JavaScript and print keep the plain
  picture (0071).
- **A picture no field names** waits in `data/media/unassigned/` (`docs/runbooks/add-an-image.md`).

## Accessibility

- **One `h1` per page**: the entry's name on a sheet; on a select screen the title plates, whose `h1`
  carries `aria-label` set to the title because the help button sits inside it.
- **The spotlight is a named region** (« Aperçu », "Preview"). Previous and next carry names, the open
  link's name says which entry it opens, and the arrows stay hidden until the script runs.
- **The panel holds no control**, so keyboard focus never vanishes in a swap.
- **A hub door's accessible name** is its section's exact name; its line describes it. A lit door is a
  preview, never marked `aria-current`. Livres' entries are an ordered list; their numerals and the
  running head are hidden from assistive technology.
- **A visually hidden live region** announces the entry when the arrows step.
- **Focus** is a 2 px outline in the current `--gold`: the key colour inside a sheet, the card's key and
  5 px out on a roster card, house gold on the select screen's chrome; a Codex door draws it in its own
  ink, 6 px out (`PlateDoor.astro`), and a Livres entry in dark ink, 2 px out, clear of the line above it
  (`SommaireEntry.astro`). A focused card scrolls clear of the sticky header (`scroll-margin-top`), as do a
  Livres entry, the help button of the title plates and an empty page's link (`scroll-margin-block`).
- **`aria-current`** marks the card the spotlight shows.
- **Nothing is told by colour alone**: a draft is darkened, veiled and stamped with the word; a pointed
  card flips and lifts; a kind's name sits beside its mark; a status badge writes its word.
- **The pause button** stills the living stage, the cover's pan, the ghost's drift and the heraldry's
  wind (WCAG 2.2.2), though not the scroll cue's chevron, and is remembered from page to page; under
  reduced motion nothing moves and it hides.
- **Without JavaScript** every card is a link, the lead entry stays in the spotlight, the arrows and the
  pause stay hidden, and the stage is the CSS ambient.
- **Forced colours**: slabs, the emblem, the glare, halftones, ghost names and the Livres numerals are
  hidden; the roster cards, the stamps, the title plates and the open link lose their tilt; the open link
  gains a border.
- **Print**: the stage, the spotlight, the slab, the emblem, the glare and the ghost drop out; the card
  and the title plates stand straight; the inks turn dark; the title and the roster remain. The Livres
  sheet loses its paper and its fold, its numerals print in outline, each name keeps a white halo over
  them, and an entry stays whole across a page break. The select screens, the Codex, the Livres contents
  and an empty category's page print on white paper, even with the dark theme and background graphics on
  (`data-print-paper`). A character sheet prints on its own white ground, its words beside a 240 px card,
  so it fits below the header of its first page; the reading below it keeps the page's theme.

## References

- **The design workflow** is the `aubaine-design` skill, `.claude/skills/aubaine-design/SKILL.md`.
- **The approved pieces, value by value**: `.claude/skills/aubaine-design/references/approved-pieces.md`.
- **The owner's rulings**, with their dates and words: `.claude/skills/aubaine-design/references/rulings.md`.
- **The three reference games**, their sources, the screens studied, what Aubaine takes and what it
  leaves: `persona-5.md`, `deadlock.md` and `hextech.md` in `.claude/skills/aubaine-design/references/`,
  with the research method in `research.md`.
- **Web techniques and accessibility** behind the pieces: `web-platform.md` and `accessibility.md` in the
  same folder.
- **Decision records**: `docs/adr/0053-hero-art-is-developed-on-the-gpu-over-its-plain-picture.md`,
  `docs/adr/0054-the-hero-of-a-tree-or-a-species-is-a-character-sheet-on-a-living-stage.md`,
  `docs/adr/0059-a-sub-species-may-fly-its-heraldry-as-cloth-and-a-painting-hangs-under-glass.md`,
  `docs/adr/0065-the-livres-hub-opens-on-its-contents-and-lists-every-category.md`,
  `docs/adr/0064-design-work-runs-through-the-aubaine-design-skill.md` and
  `docs/adr/0071-a-lit-piece-is-drawn-before-it-is-seen.md`.
- Other studios' screens are linked from the dossiers and never copied into this repository.
