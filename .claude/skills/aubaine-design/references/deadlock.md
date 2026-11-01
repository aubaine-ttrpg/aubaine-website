# Deadlock, Valve

Deadlock is Valve's "third-person shooter MOBA", in the words of the
[Deadlock Wiki](https://deadlock.wiki/Deadlock). It is not released, and it is not a Steam Early Access
game: its [Steam page](https://store.steampowered.com/app/1422450/Deadlock/) is headed "EARLY DEVELOPMENT
BUILD" and says "Access to Deadlock is currently limited to friend invites via our playtesters." It is an
invite-only playtest, and Valve warns that it is "still in early development stages with lots of
temporary art and experimental gameplay", so every screen below is dated to the update it shows.

The game is set in the Cursed Apple, "an alternate version of early 20th century New York", an "urban
fantasy with strong occult themes and elements of noir, gothic, and dieselpunk fiction" (wiki). Its main
menu is a gothic manor. One god's base is a factory on the red-brick Downtown side, the other's a
Neoclassical museum on the white-brick Uptown side, and Broadway carries the neon and the billboards. No
source read calls the city Art Deco. Deco-style ornament is clearest on plates: chevrons at the ends of
the shop's masthead and of the PLAY frame, stars on the shop's top price plate.

Its interface is the world's own matter, printed or built. The main menu is a room of objects, the shop
is a set of catalogues published by the city's firms, the votes on new heroes come with campaign posters
and a ballot box, the news is a newspaper, and rank is chalk on a board. In the pictures the city is
mostly at dusk, lit by bulbs, candles and fire, with cold accents: green summoning light, green neon, the
mint of the shop's prices. Deadlock gives Aubaine its print, its posters and a model for a hub.

The owner first named it on 2026-10-23, "kinda Persona 5-y kinda like Deadlock-y", and the brief of
2026-10-29 sets it beside the two other games: "Imagine a mix between Deadlock, The Persona Series (more
preciesly Persona 5) and the Hextech from League of Legends." What counts is the game's own screens,
never its website: "i don't want the feel of a Video Game Webiste, i want the feel of those Video game,
Hextech / Persona 5 and Deadlock" (2026-10-28).

The other references: `rulings.md` (the owner's rulings), `approved-pieces.md` (the approved pieces),
`persona-5.md` and `hextech.md`, all in this folder; `DESIGN.md`, at the repository root, documents the
look.

## Contents

- [How to read this file](#how-to-read-this-file)
- [Sources](#sources)
- [Screens studied](#screens-studied)
- [Type](#type)
- [What Aubaine takes](#what-aubaine-takes), [open ideas](#open-ideas-not-decided) and
  [what Aubaine leaves](#what-aubaine-leaves)
- [Added on 2026-10-31](#added-on-2026-10-31)
- [Captures still to take](#captures-still-to-take) and [revisions](#revisions)

## How to read this file

- **Viewed** means a picture of the screen was looked at, on the date given. **Text only** means the
  screen is described from written sources, with no picture looked at.
- Every link was opened on 2026-10-30, and every quote was read that day; every link was checked again
  on 2026-10-31 and none was dead. Wiki pages change; the version a picture shows comes from its file
  history.
- Pictures of Deadlock stay out of this public repository: each screen links its source. Screenshots of
  Aubaine's accepted pieces are in `../assets/approved/`.
- **The approved pieces** are the character sheet (`src/components/primitives/CharacterHero.astro`) and
  the select screen of Arbres and Espèces (`src/components/primitives/SelectScreen.astro`), as
  committed in a9b3954, the Codex's plate menu (`src/components/primitives/PlateMenu.astro`) and the
  Livres contents (`src/components/primitives/SommaireSpread.astro`), picked on 2026-10-31.

## Sources

### Valve

- The [Steam page](https://store.steampowered.com/app/1422450/Deadlock/): "EARLY DEVELOPMENT BUILD",
  "LIMITED ACCESS", release date "To be announced".
- Five screenshots on that page, all served with a Last-Modified date of 2026-01-22, the day of Old
  Gods, New Blood:
  [CREATE ROSTER](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1422450/1a5a68e51d6aff5e2910410f84854c4c39af68cc/ss_1a5a68e51d6aff5e2910410f84854c4c39af68cc.1920x1080.jpg),
  [the Hideout](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1422450/fa25560cf85debe669f5d4acd76cf81b0943019b/ss_fa25560cf85debe669f5d4acd76cf81b0943019b.1920x1080.jpg),
  [the Hidden King](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1422450/52159118573367c304c43fc9ed85588c0c518a19/ss_52159118573367c304c43fc9ed85588c0c518a19.1920x1080.jpg),
  [the Archmother](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1422450/ac02851ede518092df55746dbc98a199c91d7411/ss_ac02851ede518092df55746dbc98a199c91d7411.1920x1080.jpg)
  and
  [a churchyard lane in the city](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1422450/caaf254176430d69244b99e565d3d56559f1743b/ss_caaf254176430d69244b99e565d3d56559f1743b.1920x1080.jpg).
  All five were viewed on 2026-10-30.
- Valve's patch notes, read in the wiki's copies. Each copy names the post it reproduces ("Source: Six
  New Heroes", "Source: Old Gods New Blood", "Source: City Never Sleeps"). The official forum answered
  with a bot check on 2026-10-30 and was not read.

### The updates the screens date to

| Update | Date | What changed for the screens below |
| --- | --- | --- |
| Main menu, build 4,264 | 2024-06-11 | The menu before the Hideout; the date is the build stamp on the screen |
| [Six New Heroes](https://deadlock.wiki/Update:August_18,_2025) | 2025-08-18 | "The Hideout replaces the existing Dashboard UI"; "The character select screen has received a major visual overhaul." |
| [Old Gods, New Blood](https://deadlock.wiki/Update:January_22,_2026) | 2026-01-22 | The Patrons redesigned and renamed; an "Updated Scoreboard", a "revamped postgame with an MVP screen", "Reactive Portraits", "Settings Search", a "Random Hero Button"; votes cast in the Hideout's ballot box; campaign posters as cosmetics (wiki, Hero Voting) |
| [City Never Sleeps](https://deadlock.wiki/Update:September_29,_2026) | 2026-09-29 | "Map rework.", "Major UI changes.", "Refreshed Shop UI."; votes move to the pregame lobby; a pip at each slider's default; Korean hero logos |

### The Deadlock Wiki

The [Deadlock Wiki](https://deadlock.wiki/Deadlock) is written by players. Its pages are cited at each
screen, and the file page of each picture gives its upload date. Its names for typefaces are its own
identifications (see [Type](#type)).

### Press, fans and players

- [Game Haus, Robert Hanes, 2025-08-18](https://thegamehaus.com/deadlock/6-new-deadlock-heroes-revealed-new-select-screen-more/2025/08/18/):
  small screenshots of the new SELECT HERO screen, with Billy, The Doorman and Mina.
- [Destructoid, Andrej Barovic, 2026-01-23](https://www.destructoid.com/latest-deadlock-overhaul-turns-valves-not-so-mysterious-game-into-one-of-the-most-stylish-titles-of-all-time/),
  on Old Gods, New Blood: "a genre blend that sits somewhere between late-19th-century New Orleans and
  early-20th-century New York", with influences "from comics to movies to Valve's own imagination". It
  predates City Never Sleeps, which reworked the map, refreshed the shop and updated the HUD.
- [Shacknews, TJ Denzer, 2026-01-23](https://www.shacknews.com/article/147546/deadlock-old-gods-new-blood-update),
  on the Patrons: the Archmother "built of glass, steel and stone", the Hidden King "a stretching shadow,
  scheming in the darkness of Hell's Kitchen".
- [GameRiv, Ali Ahmed Akib, 2026-09-30](https://gameriv.com/deadlock-reveals-six-new-heroes-in-city-never-sleeps-update-release-schedule-and-voting-explained/):
  the three words on each City Never Sleeps reveal poster.
- [Bren Hermann, "Remaking Deadlock's UI (Fan-Made)"](https://www.bhermann-design.com/remaking-deadlocks-ui),
  undated: it reproduces the main menu of build 4,264 and lists the pain points players reported. Its
  redesign is not a source.
- [Steam Community, "Character priority", a reply by Donut Steel, 2024-12-05](https://steamcommunity.com/app/1422450/discussions/0/4632611455209903011):
  the roster's priority colours, before the 2025 overhaul.

## Screens studied

| Screen | Version shown | Seen |
| --- | --- | --- |
| [Hero select](#hero-select) | Overhauled 2025-08-18; the Steam picture dates from 2026-01-22 | Viewed 2026-10-30 |
| [The Curiosity Shop catalogue](#the-curiosity-shop-catalogue) | City Never Sleeps, file of 2026-10-13 | Viewed 2026-10-30 |
| [The Curiosity Shop stall](#the-curiosity-shop-stall) | City Never Sleeps, file of 2026-10-13 | Viewed 2026-10-30 |
| [The Hideout](#the-hideout) | 2025-08-18 (file of 2025-08-24); Steam picture of 2026-01-22 | Viewed 2026-10-30 |
| [The main menu before the Hideout](#the-main-menu-before-the-hideout) | Build 4,264, 2024-06-11 | Viewed 2026-10-30 |
| [The title screen](#the-title-screen) | Old Gods, New Blood, file of 2026-03-28 | Viewed 2026-10-30 |
| [The New York Oracle](#the-new-york-oracle) | City Never Sleeps, file of 2026-10-14 | Newsstand viewed 2026-10-30; masthead text only |
| [Brands and item posters](#brands-and-item-posters) | The wiki page as of 2026-10-30 | Text only; one wall advert viewed |
| [The map and its lanes](#the-map-and-its-lanes) | The wiki page as of 2026-10-30 | Text only |
| [The Patrons](#the-patrons) | Old Gods, New Blood, Steam pictures of 2026-01-22 | Viewed 2026-10-30 |
| [Settings, scoreboard and postgame](#settings-scoreboard-and-postgame) | 2026-01-22 and 2026-09-29 | Text only |
| [Hero portraits](#hero-portraits) | The wiki's grid as of 2026-10-27 | Grid viewed 2026-10-30; state variants text only |
| [The City Never Sleeps lineup](#the-city-never-sleeps-lineup) | Announcement art, file of 2026-10-15 | Viewed 2026-10-30 |

### Hero select

Sources: the CREATE ROSTER screenshot on the Steam page (above); the Game Haus screenshots; the wiki's
[Mina](https://deadlock.wiki/Mina), [Mina/Gallery](https://deadlock.wiki/Mina/Gallery) and
[Billy/Gallery](https://deadlock.wiki/Billy/Gallery).

- Two parts: a dark roster panel under a grey title, and the pointed hero's poster filling the rest of
  the screen. The title reads CREATE ROSTER on Steam and SELECT HERO in the August 2025 screenshots.
- The roster is a grid of tall portrait tiles. In the CREATE ROSTER picture it is eight across, with NEW
  tags and padlocks; tiles not chosen are greyed, and the chosen ones are in full colour, tilted a few
  degrees, with a pale edge; a last tile holds a question mark. A large, faint hairline circle with
  spokes sits behind the panel, and PLAY sits under the grid in a dark plate with a rough double outline
  and a chevron at each end.
- The poster is the hero's figure over a flat background printed in that hero's own inks: Mina red on
  navy, with red bats, splatter and halftone; Billy pink and yellow on khaki, with black brush shapes. The
  wiki keeps that background as a separate file in a hero's gallery ("Mina select background", "Billy's
  select background").
- The name is the hero's own logotype, in cream at the foot of the poster: MINA a heavy serif, BILLY
  rough wood type.
- Under Mina's name, three words in her red sit on dark tapes, staggered in height and each at a small
  angle: HARASSER, NIMBLE, VEXING, the tags of the wiki's Mina page. The four ability roundels below are
  the same red.
- A player explained the roster's colours on 2024-12-05, before the overhaul: "White means added to
  roster, yellow is high priority and purple is top priority." Whether the overhaul kept them was not
  checked.

### The Curiosity Shop catalogue

Sources: [File:Weapon_shop.png](https://deadlock.wiki/File:Weapon_shop.png), the City Never Sleeps version
uploaded 2026-10-13 (1,594 by 1,304 pixels); the wiki's
[The Curiosity Shop](https://deadlock.wiki/The_Curiosity_Shop) and
[Fairfax Industries](https://deadlock.wiki/Fairfax_Industries), where the same picture is captioned
"Fairfax Industries Weapon items catalog".

- Players buy items there with souls, in three categories (Weapon, Spirit and Vitality) and four tiers
  "based on their price: 800, 1,600, 3,200 and 6,400". The catalogues come from houses of the city: they
  "are provided by Fairfax Industries, Mystic Pharmaceutical Stores, and the Curiosity Catalog." The
  weapon catalogue is the one Fairfax Industries, an arms maker, publishes.
- The whole shop is one sheet of light khaki stock, distressed on purpose: a curled corner, two bullet
  holes in the right edge, worn and stained paper.
- The masthead is a black plate: FAIRFAX in large condensed slab capitals between chevrons, over
  ARTILLERY BOUGHT AND SOLD in spaced orange capitals.
- Six tabs run down the left edge, each one flat colour with one pictogram: a blue star, a red thumb, a
  grey grid, a yellow target, a purple pentagram, a green cross. The open tab, the yellow target, is
  longer, and its yellow runs down the sheet's spine.
- One framed panel per tier, each on its own printed ground: diagonal hatching, faint target rings,
  halftone dots, and solid black for the top tier.
- Each price sits on a black plate in the same mint numerals. The plate grows richer with the price:
  plain at 800, an inner rule at 1,600, notched corners and a stitched border at 3,200, a star above and
  below at 6,400, where "EXPERTS ONLY" follows in amber hand lettering. The plates lean a few degrees
  (about 5° where measured, at 800 and 1,600).
- Items are cream tiles in a level grid, each a square illustration in a few flat inks over its name in
  a heavy, soft slab. The top tier's tiles are dark.
- One pencilled aside, "All's Fair!", faint and tilted.

### The Curiosity Shop stall

Source: [File:The_Curiosity_Shop_in-game.png](https://deadlock.wiki/File:The_Curiosity_Shop_in-game.png),
uploaded 2026-10-13 with the comment "updated for CNS".

- A kiosk on a railway flatcar, under a shaped sign, THE CURIOSITY SHOP, with CURIOSITY arched and
  marquee bulbs along the top edge.
- A green neon arrow reading COME ON IN turns toward the counter; a bulb-lit inverted triangle carries a
  red star.
- A yellow sandwich board on the pavement: HOT FRESH ITEMS in black condensed capitals.
- A faded advert painted on the side of a building further back: ECLIPSE SAFETY CANDLES.
- Warm bulbs and amber electric arcs against a blue dusk sky.

### The Hideout

Sources: [File:Hideout_main.png](https://deadlock.wiki/File:Hideout_main.png), uploaded 2025-08-24, so the
Hideout of the August 2025 update; the Steam screenshot of the Hideout (above); the wiki's
[Hideout](https://deadlock.wiki/Hideout) page, as modified on 2026-10-30.

- The main menu since 2025-08-18: "The Hideout replaces the existing Dashboard UI" (Valve). The wiki
  calls it "an immersive replacement for traditional 2D menus": "a grand, multi-level manor room with an
  opulent, gothic atmosphere, featuring a large fireplace, an extensive library, and towering windows
  that offer a view of The Cursed Apple at dusk." Players walk through it as their hero, seen from
  behind in both pictures.
- The Play terminal "serves as the room's focal point": "a circular table surrounded by a glowing green
  summoning circle". In the August 2025 picture a small PLAY label floats over the table and
  green candles ring it; warm candles burn across the room in both pictures, and the January 2026
  one shows the fireplace. Since City Never Sleeps the player spawns where "the Play Terminal, the
  eye-shaped section of the far window, and the sigil on the skyscraper outside are lined up in the
  center of the camera's initial view" (wiki trivia).
- Each other terminal the wiki describes is a different object. Learn to Play is "a book resting on a
  stand in front of an armchair"; Watch, "a vintage film projector aimed at a screen"; News, "a corner
  under the stairs with newspapers, magazines and a mystic personal computer powered by candles and
  using an Ouija planchette as a mouse"; Ranked, a chalkboard and a frame in the wall; Vote, "a wooden
  ballot box"; the Shop, "a fully-stocked counter". "Interacting with a terminal opens a full-screen UI
  menu."
- State is drawn into the room. The chalk doodles on the ranked board change with the player's games,
  captioned on the wiki "If the last game was won", "If the last game was lost" and "When the player has
  rank protection". Each vote "added stickers to the walls", and over City Never Sleeps "the pizza was
  all eaten and the ballot box overfilled with votes for Nurse Harrow."
- Beside the polished hall, the Atrium practice range has "a more raw, industrial design".

### The main menu before the Hideout

Sources: two captures of the original screen, build 4,264 of 2024-06-11, reproduced in Bren Hermann's fan
case study (above); the wiki's crop,
["Abrams in the main menu"](https://deadlock.wiki/File:Abrams_menu.jpg), uploaded 2024-12-01. Only the
original screen is a source, never the redesign on the same page.

- A left column of large cream serif words, Play, Watch, Heroes, Learn to Play and Resources, with no
  boxes and no icons. Exit Game sits apart below them, red in one capture and dim in the other.
- The eye-and-wheel emblem over the DEADLOCK wordmark, with EARLY DEVELOPMENT BUILD under it in small
  spaced capitals.
- Live state in small green type beside the word it qualifies: "12+ IN QUEUE" under Play, "98 Live Now"
  beside Watch.
- Behind the menu, a street scene: strings of bells and hanging sigils, candles on the pavement, green
  wisps, and Abrams in the doorway of the THIRD EYE shop (Third Eye Supply is on the wiki's list of
  brands).
- A black status card in the lower right, with the matchmaking hours and the playtest schedule, over a
  teal invitation band.
- The study's list of player pain points includes "The UI did not feel dynamic or expressive enough for
  how expressive and dynamic the gameplay was."

### The title screen

Source: [File:Title_screen.png](https://deadlock.wiki/File:Title_screen.png), the version uploaded
2026-03-28 and labelled "old gods new blood version" (the picture viewed is 1,920 by 1,080 pixels, the
size of that version). The first upload, of 2025-08-24, showed the title "as of the August 18 update".
Whether City Never Sleeps changed the screen is not known.

- The city at dusk, seen from above its rooftops, with a green beam rising from the central tower.
- The wheel emblem and the chipped DEADLOCK wordmark in the centre, one line under them, PRESS ANY KEY
  TO START, and EARLY DEVELOPMENT BUILD #6,418 in the bottom-right corner.
- Glowing green pigeons and red neon signs on the nearest roofs.
- The wiki's Hideout page captions the picture "Hideout window view (title screen)"; the picture itself
  shows no window frame.

### The New York Oracle

Sources: [File:Newscaster_CNS.png](https://deadlock.wiki/File:Newscaster_CNS.png), "The Newscaster's paper
stand as seen in the City Never Sleeps update", uploaded 2026-10-14; the wiki's
[The New York Oracle](https://deadlock.wiki/The_New_York_Oracle). The masthead is not legible in the
picture, so it is described from the text only.

- In the picture: a green kiosk stacked with EXTRA! front pages, a figure in a turban and goggles behind
  a glowing cyan crystal ball, candles and crates.
- The paper is "an in-universe newspaper publication", "costing 5 pennies per copy", and the Newscaster
  calls "What calamities await New York? For 5 measly pennies, our prognostications can be yours."
- Its logo "uses the Chomsky font, which is based on the masthead of the real life newspaper The New
  York Times", and the newsstands "use public domain images of real 20th Century newspapers".
- In the Hideout, the News terminal is the newspapers and the candle-powered computer described above.

### Brands and item posters

Source: the wiki's [Brands](https://deadlock.wiki/Brands) page; its galleries were not viewed. One wall
advert, ECLIPSE SAFETY CANDLES, is visible in the picture of the shop stall.

- "There are many commercial brands advertising their products and services on the streets of the
  Cursed Apple": Salt & Chalk Ritual Supplies, Talisman Brand Amulets, H. West Reanimation Professionals,
  Helm of Hades Invisibility Cream, Afterlife Credit House, Third Eye Supply and dozens more.
- "Some of the posters were advertising in-game items", among them Tesla Bullets, Metal Skin and Health
  Nova (later renamed Healing Nova).

### The map and its lanes

Source: the wiki's [Map](https://deadlock.wiki/Cursed_Apple) page, which now redirects to the Cursed
Apple. The lane pills with circled initials are Valve's own design: Valve's City Never Sleeps page
publishes them as `lane_title_blue.webp`, `lane_title_green.webp` and `lane_title_yellow.webp`
([Added on 2026-10-31](#added-on-2026-10-31)).

- "The map is divided into 3 primary, color-coded lanes: York (Yellow Lane), Broadway (Blue Lane), and
  Greenwich (Green Lane)." "Each lane has its own Zipline, which shares that lane's respective color."
- Each lane has a character: York is "heavily industrialized"; Broadway has "open and brightly lit
  streets and buildings covered in billboards and neon signs"; Greenwich is "overgrown with lush
  plant-life".
- "The minimap will always be flipped so that the player's Patron and base is at the bottom".
- The whole map is "Deadlock's artistic rendition of the Manhattan borough in New York City".

### The Patrons

Sources: the two Steam screenshots of the Patrons (above); their name letterings and descriptions on the
wiki's [Patron](https://deadlock.wiki/Patron) page. They were redesigned with Old Gods, New Blood, and
"were originally named The Amber Hand and The Sapphire Flame".

- The Hidden King: an antlered shadow with yellow eyes and long yellow hands looms over a burning wicker
  effigy, in a tall timber hall hung with loudspeakers, all in amber haze. The wiki: "a shadowy figure
  with antlers and glowing yellow eyes, bound to a burning wicker man effigy"; its base "a factory filled
  with large speakers and microphones"; its side of the map "working-class red brick buildings".
- The Archmother: a robed giant with a crowned head and open arms stands over a crystal effigy in blue
  light, under a coffered dome lit from above. The wiki: "a broken mask resembling the head of the Statue
  of Liberty, her form bound to a crystalline effigy burning with blue flames"; its base "a museum with a
  Neoclassic aesthetic"; its side "upper-class white brick buildings".
- Each name has its own lettering: the Hidden King in scrawled, dripping brush capitals, the Archmother
  in tall engraved capitals with sharp spurs.

### Settings, scoreboard and postgame

Sources: Valve's notes of 2026-01-22 and 2026-09-29 (above). No picture was viewed.

- "Settings Search: Quickly find and update the setting you are looking for on the fly."
- "Custom Reticle Control: New custom reticle editor with live-preview to help you find the perfect
  crosshair."
- "Added a pip to sliders in the Settings menu indicating the default value for that setting".
- "New settings options now show an indicator on the row until the new setting notification has been
  dismissed".
- "Updated Scoreboard: Everything you need at a glance." and a "New MVP scoring system and postgame
  summary".

### Hero portraits

Sources: the wiki's portrait grid on [Heroes](https://deadlock.wiki/Heroes), captured on 2026-10-27; the
galleries, such as [Mina/Gallery](https://deadlock.wiki/Mina/Gallery) and
[Abrams/Gallery](https://deadlock.wiki/Abrams/Gallery). The state variants were not each viewed.

- Tall bust portraits, each on its own coloured ground. The names in heavy white capitals and the mint
  NEW bands on that grid are the wiki's framing over the game's art.
- The galleries checked (Abrams, Billy, Haze, Mina) each list a "vertical card", a portrait, a gloat
  portrait and a critical-health portrait, and since 2026-01-22 "Your hero portrait changes based on how
  you are doing in game."

### The City Never Sleeps lineup

Source:
[File:Deadlock_City_Never_Sleeps_Heroes.png](https://deadlock.wiki/File:Deadlock_City_Never_Sleeps_Heroes.png),
"Heroes image for the City Never Sleeps update", uploaded 2026-10-15, viewed at 1,200 pixels wide. It is
announcement art, not a game screen.

- Six tall painted portraits side by side, each in its own palette, with a rough, light edge. Measured
  on Valve's own copy on 2026-10-31, the row is a symmetric bow, not panels askew: equal widths and
  vertical sides, the tops sloping toward the centre (about +5° on the left, -4.5° on the right) and the
  heights shrinking about 9% toward the middle. The image carries no words.
- The individual reveal posters were not viewed. GameRiv: "Valve's City Never Sleeps announcement
  introduces the characters through individual reveal posters. Each features three words that give
  players a taste of their personality or theme." For instance, "Nurse Harrow's poster describes her as
  strict, terrifying, and a savior."
- Players vote on the order in which these heroes are released. Campaign posters, a cosmetic since Old
  Gods, New Blood, "change their image once damaged"
  ([Hero Voting](https://deadlock.wiki/Hero_Voting)).
- The update's key art was seen only small and cropped, as a tile on the wiki's main page (captured on
  2026-10-28): the title in extruded block letters filled with views of the city, under a face with
  glowing green eyes.

## Type

The wiki's hero galleries name the face of a hero's name and list its localised versions (Korean,
Russian, Simplified Chinese, Ukrainian and more): "Mina's name typography (Crucial Black font)", "Billy's
name typography" (its tooltip: "PLAKAT Wood font"), "Abrams' typography" (its tooltip: "Podium Sharp
Italic font"), "Haze's name typography (FSP Demo font)". The wiki names the Oracle's logo face, Chomsky,
and its Brands page says "Some of the fonts used in poster designs are Hestina, Decotura ICG and American
Captain." These are the wiki's identifications; no Valve source for them was read.

On the screens viewed, type is cast by voice: condensed slab capitals for a firm's masthead, heavy rounded
numerals for prices, a soft slab for item names, pencil script for an aside, and a hero's or a Patron's
own logotype for its name.

## What Aubaine takes

Status "approved" means the move is in the approved pieces.

| Move | In Deadlock | In Aubaine | Status |
| --- | --- | --- | --- |
| **Each entry owns its inks** | Each hero's poster is printed in that hero's own two or three inks over its own background, so each poster brings its own palette, figure and lettering | The entry's key colour, read from its cover by `src/lib/art-key-colour.ts` or written as `keyColour` on a species, becomes the `--gold` of its sheet (`CharacterHero.astro`) and of its roster card (`CoverCard.astro`); the stage is made from the entry's own cover, or from its seal's colours; house gold stays the chrome | Approved |
| **One focal piece on a dark stage** | The pointed hero's poster fills most of the select screen beside the roster; the Hideout's Play terminal "serves as the room's focal point", green light among warm candles | The select screen's spotlight (`Spotlight.astro`) and the sheet's framed card (`FramedCard.astro`), over a stage that stays dark in both themes (`StageBackdrop.astro`) | Approved |
| **Few words under the name** | Three words in the hero's ink on dark tapes, staggered and at small angles; each City Never Sleeps reveal poster carries three | One to four descriptors chosen by the owner (the schema's maximum is four, `docs/adr/0054-the-hero-of-a-tree-or-a-species-is-a-character-sheet-on-a-living-stage.md`, Decision 2; the Nnor has four), as stickers in the key colour with dark ink and a hard shadow (`DescriptorStickers.astro`); labels ride black tapes (`TraitPlates.astro`, the kind tape on `CoverCard.astro`) | Approved |
| **Values on black plates** | Every price on a black plate in the same mint numerals, the plate richer as the price rises, the plates leaning a few degrees, the top tier turned black | Rank letters on black plates skewed -10°, edged and offset in the key colour, the S plate inverted to the key colour (`RankProfile.astro`); no approved piece has a notched plate | Approved |
| **The catalogue as a printed object** | The shop is one light sheet published by an in-world firm: a masthead and a tagline, one framed group per price on its own print ground, a grid of tiles, one pencilled aside | For the hubs it gave the catalogue sheet (C), judged too plain, then the Sommaire spread (C+), which opens Livres (`approved-pieces.md`, The Livres contents). For the indexes, groups by a value the data already holds, never an invented tier. Aubaine's canon already holds a catalogue, the Codex Ornamentum (`data/equipment/catalogue.json`), whose printed booklet carries a Sommaire (`src/components/print/ContentsLeaf.astro`) | C dropped on 2026-10-31 and C+ shipped for Livres the same day; the indexes open |
| **A hub gathers unlike objects** | The select screen repeats one card; the Hideout makes each destination a different object: a table in a summoning circle, a book on a stand, a film projector, a chalkboard, a ballot box | Each door drawn as what its section is, from its own pictogram (`CATEGORY_MARKS` for Livres, as Ressources takes `game-icons:folded-paper`; `KIND_MARKS` for the Codex), in one plain grid or column of exactly named links; "same DA but different" (owner, 2026-10-28) | Partly taken: the plate menu strikes each lit door's own pictogram huge on its band; the room of objects stays on file |
| **State drawn, not counted** | Chalk faces on the ranked board, stickers and an overfilled ballot box, reactive portraits, a pip at a slider's default, a mark on a new setting until it is dismissed | A draft card darkened, veiled in halftone and stamped (`CoverCard.astro`); « ? » only for a value that can exist and is not set (`RankProfile.astro`); no count on a door when the next page shows it, from the owner's "what's the point of having the number of each if it is shown afterwards with the number of results" (2026-10-27) | Draft card and « ? » approved; the no-count rule approved for new hub layouts on 2026-10-30 |
| **Colour travels with a name, like a transit line** | Each lane is a colour and a name, and its zipline shares the colour; each shop tab is a colour and a pictogram, and the open one runs down the sheet's spine | `KIND_MARKS` and `CATEGORY_MARKS` in `src/lib/game/kind-marks.ts` give each kind of content and each book category one colour and one pictogram wherever it is marked: "coherence is the key for leanring for users" (owner, 2026-10-28) | `KIND_MARKS` committed (140bbe6); `CATEGORY_MARKS` picked by the owner on 2026-10-30 |

The approved select screen (`../assets/approved/select-screen-arbres.jpg`, approved 2026-10-28) has the
hero select's split: a roster of cover cards that stay links, beside a sticky spotlight that shows the
pointed entry as a small character sheet, over a stage that takes its art. The approved sheet
(`../assets/approved/sheet-tree-marchand.jpg`) shows the stickers, the trait plates and the rank plates.

**Hubs.** The Codex opens on the plate menu, picked on 2026-10-31 and credited to Persona 5's pause menu
(`approved-pieces.md`). This file's catalogue gave two layouts on the way: the plain catalogue sheet (C),
one bone-paper sheet with one line per section, judged too plain on 2026-10-30 and dropped; and the
Sommaire spread (C+), a printed book's contents, which opens Livres since 2026-10-31
(`approved-pieces.md`, The Livres contents).

## Open ideas, not decided

| Idea | From | Note |
| --- | --- | --- |
| A large, faint hexagon drawn in hairlines behind a roster, static, never a control | The hero select's hairline circle with spokes | |
| A card's state told by its frame and a word, never by colour alone | The hero select's chosen tiles and priority colours | Nothing is told by colour alone in Aubaine |
| Sign voices for actions, never for titles: bulbs around a house name (held still under reduced motion), a sandwich board for a call to action, a one-stroke neon arrow for the way in | The shop stall | |
| A broadsheet for a news or changelog page: a masthead plate, a dated rule, straight columns of headline links, Cinzel in place of blackletter, clean paper | The New York Oracle | The site has no such page today |
| Two materials for two sides: rough and warm against polished and cold, in one layout and one reading column, with the house type | The Patrons | |
| For the filter bars, kept as native controls: a mark at each filter's default, a "new" mark kept until seen, a search field for long option lists | Settings | No picture viewed, so no layout from these screens |
| The reader's current section marked the same way on every page | The minimap, which always keeps the player's own base at the bottom | |
| Words over a living stage, with live state beside a word only when the next page does not repeat it | The 2024 main menu | A home menu in this family was rejected on 2026-10-29 with the other prototypes; the Codex's plate menu is in the same family, credited to Persona 5's pause menu, and won with its composed scene |
| A first view that is the world itself, with the mark and one line, made of existing art | The title screen | Hubs reuse existing art: "just like specie and skill tree we will either reuse the covers or something like that" (owner, 2026-10-27) |
| An advert's grammar for an entry card: the name big, one promise line, without the joke | Brands and item posters | |

## What Aubaine leaves

| Deadlock | Aubaine | Why |
| --- | --- | --- |
| Paper distressed on purpose: a curled corner, bullet holes and stains on the catalogue, splatter on Mina's poster, campaign posters that "change their image once damaged" | Clean print: plates, tapes, halftone and stamps, nothing torn, holed or aged | Aubaine's own choice, and Riot's in its Hextech guide ([`hextech.md`](hextech.md)); Deadlock is not its source |
| A logotype for each hero, localised per language, and a lettering for each Patron | Every name in Cinzel 700 (`--font-display` in `src/styles/fonts.css`) | One face for every name, as on the approved sheet and select screen |
| Green light as the house glow: the summoning circle, the title's beam, the wisps | House gold (`--gold`) is the chrome, and each colour is an identity: green marks Matériaux (`#4f8a2e` in `KIND_MARKS`) | Colours mark identities in Aubaine; on 2026-10-30 the owner approved that no colour is reserved for the Almanach, blue being an identity colour like any other |
| The walkable hub: a 3D room crossed on foot, each terminal opening a full-screen menu | A web page: exactly named links in reading order, nothing found only on hover, no room to walk | "We are not BUILDING A VIDEO GAME. and those layouts you gave are clearly unintuitive for websites." (owner, 2026-10-28, on the radial fan, rejected since, and the slanted doors, kept unshipped as layout D after their rebuild) |
| Bookmark tabs down the catalogue's edge | No tabs | Tabs ran down the "ledger" and "livres bookmarks" prototypes, rejected on 2026-10-29 with the seven others: "nah that's shit" |
| Invented in-world brands: Fairfax Industries, Mystic Pharmaceutical Stores, Third Eye Supply and dozens of billboards | An in-world name only where Aubaine's canon already has one, such as the Codex Ornamentum or the Almanach's « Codex » | Canon is never invented, and nothing is borrowed by name or by joke: on 2026-10-23 the owner turned down « G.O.A.T. » for the Nnor, "Goat not G.O.A.T as G.O.A.T is a great pun but is already used by Deadlock, we don't still ideas here" |
| Announcement art as a model: the lineup, the reveal posters, the key art | Layouts come only from the game's own screens; announcement art is provenance | "i don't want the feel of a Video Game Webiste, i want the feel of those Video game" (owner, 2026-10-28) |

The lineup's grammar was tried as the poster wall, layout A, which the owner judged for both hubs on
2026-10-30: "it really feels an awful lot like SkillTrees and Species Indexes it's like a reformated
version of those indexes". Hubs built as copies of the select screen had been rejected on 2026-10-28:
"the goal is not to clone Skill TREE and Especies, since it's a hub it should feel different. same DA
but different."

## Added on 2026-10-31

A second research pass fetched Valve's own pages and pictures, measured them, and rechecked every link
above (all answered; none moved but the Map page). What it adds:

- **Measured angles.** On Valve's City Never Sleeps page, photos rest 0.44 to 2.00 degrees off level,
  alternating (median 1.44 degrees), and kickers, tags and plates lean about 3 to 5 degrees, mostly
  rising to the right; nothing leans past about 7 degrees, from the page's own layout data (`38.js`).
  Aubaine's roster cards (-1.8 to 2 degrees, `CoverCard.astro`) sit inside the same band.
- **Plates are cut quads, not rotated boxes.** Valve's plate files are four-point polygons with no two
  edges parallel (`kicker_plate_blue.svg`, `broker_limited_plate.svg`), the text set on the top edge's
  angle: the same method as the slanted doors' pieces placed on their shape.
- **Hard shadows in proportion.** The MAJOR UPDATE band casts a hard shadow about a fifth of its height,
  with no blur; soft shadows stay for plates set into a sheet.
- **The shop is three catalogues on one template**: the Weapon catalogue by Fairfax Industries, the
  Spirit catalogue as CURIOSITY CATALOG Nº 777, the Vitality catalogue by Mystic Pharmaceutical Stores,
  each on its own paper with its own lettering and one aside.
- **Readability before glow.** In Valve's shader change of 24 October 2024, the wall keeps its luminance
  while the hero lifts against it (coat against wall from 1.01:1 to 1.54:1, measured): spend glow on one
  thing.
- **A faint watermark geometry.** Hero banners repeat hairline circles and spokes at about 1.4:1 against
  their ground, never a control; a candidate for a hexagon watermark behind a roster.
- **A trap.** On Valve's CDN, `hero_rat_king.webp` shows Baba, `hero_baba.webp?v=2` shows Solomon,
  `hero_solomon.webp` shows Deadman Danny and `hero_deadman_danny.webp` shows the Rat King.
- **Reading Valve first-hand.** Steam announcement pages render by script; the Steam Web API serves their
  full text, dates and authors.
- **Refused.** The Game UI Database answered HTTP 403 and Interface In Game has no Deadlock entry.

**Valve's own pages, text and announcements**

- [Deadlock - City Never Sleeps](https://www.playdeadlock.com/) (text only): The official site; its root redirects to the City Never Sleeps page.
- [Deadlock - Old Gods, New Blood](https://www.playdeadlock.com/oldgods) (2026-01-22; text only): Valve's page for the January 2026 update; it publishes in-game captures of the reworked settings, scoreboard, MVP postgame, HUD top bar, Random Hero tile and campaign posters (each listed here).
- [Deadlock - City Never Sleeps](https://www.playdeadlock.com/cityneversleeps) (2026-09-29; text only): Valve's page for the September 2026 update, framed as 'An updated visitor's guide to New York City', with captures of the refreshed shop and its filters, the pregame vote, the minimap labels, the HUD and the accessibility...
- [414.js](https://www.playdeadlock.com/public/javascript/react/414.js?contenthash=272d1d6072d261c17d87) (text only): The page's English strings as a webpack chunk; the source of every quote attributed to the City Never Sleeps page, including 'Callouts for each Lane and District on the map.' and 'Dedicated accessibility settings for visuals...
- [263.js](https://www.playdeadlock.com/public/javascript/react/263.js?contenthash=b80d29ce6b33187cb692) (text only): The Old Gods page's English strings; the source of its quotes ('Everything you need at a glance.' for the scoreboard, 'Defeat the enemy Patron in style.' for objective health bars).
- [38.js](https://www.playdeadlock.com/public/javascript/react/38.js?contenthash=c28850c16ac7d5b4174d) (text only): Every element's x, y, w, h and rotation r on a fixed canvas, and the picture names.
- [38.css](https://www.playdeadlock.com/public/css/react/38.css?contenthash=4bbcde128f95ba2ed180) (text only): @font-face rules load VALVEOracle (Thin, Medium, SemiBold), VALVEPulp-Bold and Jost from cdn.fastly.steamstatic.com/apps/deadlock/fonts/; Pulp sets kickers, tags and titles, often uppercase; Jost and Oracle set body text.
- [ISteamNews/GetNewsForApp v2 (Deadlock, Community Announcements)](https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=1422450&count=100&maxlength=0&feeds=steam_community_announcements&format=json) (text only): Full text, dates and author fields of 47 Deadlock announcements (2024-10-24 to 2026-10-30).
- [Six New Heroes](https://store.steampowered.com/news/app/1422450/view/1808061939479652) (2025-08-18; text only): Valve's own words for the Hideout and the select overhaul (the dossier read them in the wiki's copy), with Valve's pictures of both (listed below).
- [Old Gods, New Blood](https://store.steampowered.com/news/app/1422450/view/1822556746160429) (2026-01-22; text only): Links the update page; its banner is the key art listed below.
- [City Never Sleeps](https://store.steampowered.com/news/app/1422450/view/1844751498235383) (2026-09-29; text only): Valve on the state of its art: remodels and older artwork are planned polish.
- [Fairfax Industries Employee Spotlight](https://store.steampowered.com/news/app/1422450/view/1846018067945303) (2026-10-13; text only): A release written in the voice of the in-world arms maker whose catalogue the shop prints; Danny's line confirms 'All's Fair' as Fairfax's slogan (the aside on the Weapon catalogue).
- [Shh... This Won't Hurt a Bit.](https://store.steampowered.com/news/app/1422450/view/1846651706696737) (2026-10-20; text only): The last City Never Sleeps release post, with the voting statistics; its banner closes the six-banner set.
- [10-24-2024 Update](https://store.steampowered.com/news/app/1422450/view/6212245217911837451) (2024-10-24; text only): Introduces the Previous/New shader picture measured in the readability practice.
- [Matchmaking Update](https://store.steampowered.com/news/app/1422450/view/1839676055886206) (2026-07-30; text only): Ranked mode, the updated ranks and badges (picture below), six subranks per rank, rank-loss protection.
- [Shop Rework Update](https://store.steampowered.com/news/app/1422450/view/1799088287841594) (2025-05-08; text only): Localisation and consistency fixes: label backers sized per language, no English left in HUD images for Korean, 'All keyboard/controller button glyphs have been unified into a common UI element.', 'Items now glow when there is an...
- [Map Rework Update](https://store.steampowered.com/news/app/1422450/view/1792116353369036) (2025-02-25; text only): More localisation failures: Ukrainian, Polish and Italian labels, a prompt wrapping and cut off, Asian fonts clipped in search fields.

**In-game screens Valve published, viewed**

- [settings_primary.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/settings_primary.png) (2026-01-22; viewed): 1,598 by 900.
- [settings_search.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/settings_search.png) (2026-01-22; viewed): 'alt cast' typed in a glowing outlined field; results under KEYBINDS and Abilities, the matched letters on mint blocks.
- [ui_scoreboard.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/ui_scoreboard.png) (2026-01-22; viewed): One tall card per player: portrait, souls on an amber tag, K D A, three small investment bars, items as small tiles in category colours, on a warm translucent plate.
- [postgame_scorecard.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/postgame_scorecard.png) (2026-01-22; viewed): Teams headed by their Patron's lettering (HIDDEN KING orange brush, ARCHMOTHER tall blue capitals) with 'Victorious' by the winner; rows tinted brown or navy; a colour per column; each column's best value bold with a glow.
- [postgame_am.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/postgame_am.png) (2026-01-22; viewed): 'Victorious' over the ARCHMOTHER lettering; six vertical hero cards with rough top edges; MVP and KEY PLAYER cards framed in gold with a word plate; one stat line each ('86k MOST SOULS'); names small and grey below.
- [postgame_hk.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/postgame_hk.png) (2026-01-22; viewed): 'Defeated' over the HIDDEN KING lettering; only the KEY PLAYER card framed in gold; a faint ritual circle behind.
- [ui_random.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/ui_random.png) (2026-01-22; viewed): Greyed portraits, padlocks on locked ones, and a last tile with a cream question mark in a bone frame (#cbbeac) turned about 2.0° clockwise; a faint green hairline circle behind (brightest point about 1.27:1).
- [top_bar.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/top_bar.png) (2026-01-22; viewed): 2,520 by 447.
- [hero_spray.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/hero_spray.png) (2026-01-22; viewed): Election posters on brick: each candidate in its own inks and letters under the shared word VOTE (green for Graves, orange brush for Silver, red and cream for Apollo, black, white and red for Venator).
- [hero_vote.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/hero_vote.png) (2026-01-22; viewed): The vote terminal as an object: an orange wooden ballot box on a green patterned cloth under a warm lamp.
- [hero_priority.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/hero_priority.png) (2026-01-22; viewed): A vertical card with a lilac frame and a holographic wheel token, glowing green among greyed cards: state drawn on the card.
- [settings_reticle.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/settings_reticle.png) (2026-01-22; viewed): Labelled sliders with mint knobs beside a live preview in a light, rough-edged frame.
- [postgame_graphs.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/postgame_graphs.png) (2026-01-22; viewed): A line chart with a graph-type dropdown and a tooltip of sources with values and percentages; both teams' portraits on top in team colours.
- [ui_healthbar.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/ui_healthbar.png) (2026-01-22; viewed): A bar dressed as its Patron: the HIDDEN KING lettering over a bar wrapped in black thorns, PROTECTED beside a green heart.
- [ui_shop_filtering.jpg](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/ui_shop_filtering.jpg) (2026-09-29; viewed): A strip of hand-drawn sigils with names (Physical, Spirit, Defense, Mobility, Disruption, Misc); Spirit open as a purple halftone panel of grouped checkboxes, and a footer that explains with a mouse glyph how 'to select a single...
- [ui_shop_trending.jpg](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/ui_shop_trending.jpg) (2026-09-29; viewed): A red-orange POPULAR ITEMS masthead with a pencilled aside; WEAPON (condensed capitals, orange), Spirit (blackletter, purple), Vitality (script, green), each with an aside; tier rules 800, 1600, 3200; the six coloured tabs, the...
- [vote_pregame.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/vote_pregame.webp) (2026-09-29; viewed): The hero before a VOTE NOW machine under a floating green 'Vote for the Next Hero', a big green countdown over GAME STARTING...; shown on the page as a photo in a pale frame.
- [vote_votes.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/vote_votes.webp) (2026-09-29; viewed): A black tape THE VOTES ARE IN...
- [ui_location_label.jpg](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/ui_location_label.jpg) (2026-09-29; viewed): Each lane a line in its colour with its markers in it, the player's base as a cream half-ring at the bottom, a district label (THEATER) on a dark tag.
- [ui_killing_blow.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/ui_killing_blow.webp) (2026-09-29; viewed): The killer's name on a cream band, the victim's on a red band, the weapon between, the bounty on a mint tag.
- [ui_combat_tracking.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/ui_combat_tracking.webp) (2026-09-29; viewed): Weapon, spirit and vitality as orange, purple and green rings with their pictograms and values.
- [ui_shop_venator_chat.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/ui_shop_venator_chat.webp) (2026-09-29; viewed): 'Rift on Greenwich!' on a cream paper bubble under the speaker's portrait on an amber tag.
- [ui_enemy_color.jpg](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/ui_enemy_color.jpg) (2026-09-29; viewed): A toggle and a hue slider with a hex value (#FF00FE) recolouring the enemy's outline and name in place.
- [ui_subtitles.jpg](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/ui_subtitles.jpg) (2026-09-29; viewed): Size (16 px), colour (#C6C6C6), background (#000000) and font controls under a live preview of three stacked lines.
- [ui_dialog_player.jpg](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/ui_dialog_player.jpg) (2026-09-29; viewed): A roster at left (selected hero in a mint frame), the hero's figure and name with '1,752 VOICE LINES' at centre, a search field and filter chips over a list of lines at right: a large text catalogue browsed beside a focal figure.
- [000bc5550a1c618b6724fd990fd554d59f64df00.png](https://clan.fastly.steamstatic.com/images/45164767/000bc5550a1c618b6724fd990fd554d59f64df00.png) (2025-08-18; viewed): 720 by 403: Create Roster in spaced grey capitals, seven columns of greyed portraits with chosen ones in colour, PLAY on a dark plate with chevrons, ESC BACK bottom left; Lady Geist's name in two letterings and LIFESTEAL, SELF...
- [8da57587ca0ad65cf902f1207706694082164525.png](https://clan.fastly.steamstatic.com/images/45164767/8da57587ca0ad65cf902f1207706694082164525.png) (2025-08-18; viewed): 2,000 by 1,125: arched windows on the city at dusk, a green summoning circle of green candles, the hero from behind, the fireplace and candelabras warm at right, the wheel emblem top left: one cold focal light among warm ones.
- [d937a6e939528a54b0c25ff5caf9e4dff86121c9.png](https://clan.fastly.steamstatic.com/images/45164767/d937a6e939528a54b0c25ff5caf9e4dff86121c9.png) (2024-10-24; viewed): Previous and New: the wall keeps its luminance (0.0050) while the hero lifts, coat against wall 1.01:1 to 1.54:1, fur 1.11:1 to 2.79:1 (measured).
- [4cb96ab54e327aefdcfeef87a67414bdf8f03c6f.png](https://clan.fastly.steamstatic.com/images/45164767/4cb96ab54e327aefdcfeef87a67414bdf8f03c6f.png) (2026-09-29; viewed): 1,200 by 1,021: the title over the six-panel lineup on a dark city, the bowed arrangement visible whole.
- [f6a6d5724077ee5ea7b3b3701f4af907c9517df4.png](https://clan.fastly.steamstatic.com/images/45164767/f6a6d5724077ee5ea7b3b3701f4af907c9517df4.png) (2026-07-30; viewed): 2,000 by 1,650: eleven badges; one crest per rank escalating by material with a city creature (a moth, a pigeon, a rat, a toad and on up to an owl), the name in cream and the material in grey below (Initiate over Brick to Oracle...

**Valve's announcement art and web assets, viewed (provenance, never layout)**

- [header_heroes.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/header_heroes.png) (2026-01-22; viewed): 1,600 by 708.
- [oldgodsnewblood.svg](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/oldgodsnewblood.svg) (2026-01-22; viewed): Rough cream wood-type capitals, each letter on its own baseline and angle.
- [deadlock_old_gods_update.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/oldgods/deadlock_old_gods_update.png) (2026-01-22; viewed): 1,200 by 630: two Patrons in silhouette on an amber half and a steel-blue half, collaged print and halftone, the title in rough cream wood type.
- [title_final.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/title_final.webp) (2026-09-29; viewed): 2,000 by 1,137: extruded block capitals, each letter filled with a different view of the city, outlined in cream and black, on a rising diagonal.
- [header_portraits.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/header_portraits.webp) (2026-09-29; viewed): 1,748 by 819.
- [header_update_plate.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/header_update_plate.webp) (2026-09-29; viewed): An orange band (#dd6638) at 15.4°, heavy black italic capitals, a hard shadow of black at about 23 to 30% opacity, 30 px below a band 127 px tall and 23 px past its end, no blur.
- [kicker_plate_blue.svg](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/kicker_plate_blue.svg) (2026-09-29; viewed): A four-point polygon in the Broadway blue (#60CDE3): top edge -3.6°, bottom -4.6°, sides 8.7° and 5.5° off vertical.
- [plate_specimens.svg](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/plate_specimens.svg) (2026-09-29; viewed): An irregular quad in dark teal (#1A3237) with an 8 px inset stroke of #60CDE3 at 10%, and soft shadows: a 6 px blur drop shadow and a 60 px blur inner shadow, both black at 25%.
- [broker_limited_plate.svg](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/broker_limited_plate.svg) (2026-09-29; text only): SVG source read: a red (#ED4A4B) quad with all four corners offset, no two edges parallel.
- [lane_title_blue.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/lane_title_blue.webp) (2026-09-29; viewed): A black pill edged in Broadway blue (#60c8dc) with a circled B and BROADWAY in wide cream capitals, rising about 4.0° to the right.
- [lane_title_green.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/lane_title_green.webp) (2026-09-29; viewed): GREENWICH with a circled G, edged in green (#96d879), rising about 4.5°.
- [lane_title_yellow.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/lane_title_yellow.webp) (2026-09-29; viewed): YORK with a circled Y, edged in yellow (#fde14d), rising about 3.4°.
- [hero_nurse_harrow.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/hero_nurse_harrow.webp) (2026-09-29; viewed): NURSE HARROW in a tall high-contrast serif crossed by a needle; STRICT, TERRIFYING, SAVIOR in orange on black tapes; the faint wheel at left.
- [hero_rat_king.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/hero_rat_king.webp) (2026-09-29; viewed): Despite its file name, Baba's poster: BABA in ornamented folk wood type; CACKLING, BEADY, HEXING in dark ink on mint-green tapes; tilts -4.4°, +8.7°, +3.7° on screen, middle lowest.
- [hero_baba.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/hero_baba.webp?v=2) (2026-09-29; viewed): Despite its file name, Solomon's poster: SOLOMON with letters on harlequin diamonds and a rook crown; STRATEGIST, FOCUSED, CHECKMATE in cream on black, the middle tape inverted.
- [hero_violet.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/hero_violet.webp) (2026-09-29; viewed): Violet in brush script; AMBITIOUS, NIMBLE, CREATIVE in cream on purple tapes; tilts -1.4°, +6.6°, +6.6° on screen, middle lowest; the faint wheel at left.
- [hero_solomon.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/hero_solomon.webp) (2026-09-29; viewed): Despite its file name, Deadman Danny's poster: rough distressed capitals with a skull; RECKLESS, HIGH-FLYING, EXPLOSIVE in cream on ochre; tilts -3.2°, +9.8°, +4.8°.
- [hero_deadman_danny.webp](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/hero_deadman_danny.webp) (2026-09-29; viewed): Despite its file name, the Rat King's poster: scratchy capitals under a crown; SCRAPPY, REGAL, TENACIOUS in cream on maroon; tilts -0.8 to -3.0°, +5.0°, +5.0°.
- [deadlock_city_never_sleeps_update.png](https://cdn.fastly.steamstatic.com/apps/deadlock/images/react/cityneversleeps/deadlock_city_never_sleeps_update.png) (2026-09-29; viewed): 800 by 450: the title over a face with glowing green eyes and a dark teal city, the wheel-eye emblem in green.
- [13d1ac53868b9396831235f78b9317d4d417a695.png](https://clan.fastly.steamstatic.com/images/45164767/13d1ac53868b9396831235f78b9317d4d417a695.png) (2025-08-18; viewed): A black stage with faint hairline circles and spokes (about 1.4:1), MINA in cream at left, the figure in red and navy at right: the banner template.
- [02829fc9750a193799ea05d6e0ab0ef78b0cffa0.png](https://clan.fastly.steamstatic.com/images/45164767/02829fc9750a193799ea05d6e0ab0ef78b0cffa0.png) (2026-10-10; viewed): The Fairfax Industries Employee Spotlight banner: the same template, the name in rough cream capitals.
- [11ea258a7732d9a48d1f0b679d4aaf7f51292230.png](https://clan.fastly.steamstatic.com/images/45164767/11ea258a7732d9a48d1f0b679d4aaf7f51292230.png) (2026-10-16; viewed): Same banner template (viewed in a contact sheet with the five below).
- [40a0a47432b4e8c857d40152295f1551702c1012.png](https://clan.fastly.steamstatic.com/images/45164767/40a0a47432b4e8c857d40152295f1551702c1012.png) (2026-10-02; viewed): Same banner template.
- [720ba4e0f1b1ed105708f7b15cdfc7ad95bfdb30.png](https://clan.fastly.steamstatic.com/images/45164767/720ba4e0f1b1ed105708f7b15cdfc7ad95bfdb30.png) (2026-10-06; viewed): Same banner template.
- [23db53380c461b7f978c620d5607f9b23271e10c.png](https://clan.fastly.steamstatic.com/images/45164767/23db53380c461b7f978c620d5607f9b23271e10c.png) (2026-10-08; viewed): Same banner template.
- [8c5131174ced00e11e346cc1c3cb4d7c69013370.png](https://clan.fastly.steamstatic.com/images/45164767/8c5131174ced00e11e346cc1c3cb4d7c69013370.png) (2026-10-15; viewed): Same banner template.

**The Deadlock Wiki**

- [Ranked Mode](https://deadlock.wiki/Ranked_Mode) (text only): The ranked corner of the Hideout, its ticker tape ('red for losses and green for wins'), and a table pairing each badge with its chalk drawing and material.
- [Seasonal events](https://deadlock.wiki/Seasonal_events) (text only): Progress drawn into the room: ornaments on the tree, a souvenir above the fireplace.
- [Neon Prime](https://deadlock.wiki/Neon_Prime) (text only): A reported, not confirmed, cautionary case: glow at the cost of readability.
- [The Library](https://deadlock.wiki/The_Library) (text only): Context for the Library and book menus below: an unfinished feature, since removed.
- [The Binding of Oathkeeper](https://deadlock.wiki/The_Binding_of_Oathkeeper) (text only): The unreleased visual novel behind the book menu (Oathkeeper menu), opened in game by a console command; its art is credited on the wiki to Maren Nerei and Lady Santos.
- [File:Spirit shop.png](https://deadlock.wiki/File:Spirit_shop.png) (2026-10-13; viewed): Image viewed from cdn.deadlock.wiki/Spirit_shop.png (1,586 by 1,299; upload comment 'cns').
- [File:Vitality shop.png](https://deadlock.wiki/File:Vitality_shop.png) (2026-10-13; viewed): Image from cdn.deadlock.wiki/Vitality_shop.png (1,589 by 1,291).
- [File:Ranked terminal.jpg](https://deadlock.wiki/File:Ranked_terminal.jpg) (2026-09-06; viewed): Image from cdn.deadlock.wiki/Ranked_terminal.jpg, credited to a Dead Air video.
- [File:Rank01 chalk.webp](https://deadlock.wiki/File:Rank01_chalk.webp) (2026-08-10; viewed): First of eleven chalk drawings (Rank01 to Rank11 on cdn.deadlock.wiki, all viewed): each badge redrawn as one chalk line for the board.
- [File:Hideout bg concept.png](https://deadlock.wiki/File:Hideout_bg_concept.png) (2026-10-27; viewed): Upload comment: 'Concept art of Hideout view found in the game files'.
- [File:Hideout portrait eyes Jan 20th.png](https://deadlock.wiki/File:Hideout_portrait_eyes_Jan_20th.png) (2026-09-26; viewed): The seated man with red gloves, his eyes glowing red; the file name dates it to January 20th and the wiki uses it on Update:January 20, 2026, before Old Gods, New Blood.
- [File:New York Oracle Building.png](https://deadlock.wiki/File:New_York_Oracle_Building.png) (2026-10-14; viewed): 'The New York Oracle building as seen in the City Never Sleeps update': the masthead in gold blackletter on the façade, 'The New York' small over 'Oracle', repeated over the doors.
- [File:The Library menu.png](https://deadlock.wiki/File:The_Library_menu.png) (2024-11-27; viewed): 'The Library' in a cream serif, a text column, AVAILABLE BOOKS with one illustrated cover over a '0% Complete' band and two blank 'Coming Soon' covers, ESC Back bottom left.
- [File:Oathkeeper menu.png](https://deadlock.wiki/File:Oathkeeper_menu.png) (2024-11-28; viewed): The title in the book's own green lettering, '0 of 16 Chapters Unlocked', chapters as a branching map of picture cards, locked ones greyed with a red padlock, the open one framed in green, a hover card with a picture and one...
- [File:Jazz poster 1927.png](https://deadlock.wiki/File:Jazz_poster_1927.png) (2025-05-18; viewed): MIDNIGHT CADENCE, a jazz festival poster: a giant dragonfly on blue with a red crescent, heavy geometric capitals with venue and dates; in Evgeniy Evstrastiy's gallery on the wiki.

**Credited artists, talks and videos**

- [Evgeniy Evstrastiy](https://deadlock.wiki/Evgeniy_Evstrastiy) (text only): Names a credited artist of the city's posters and billboards, with a gallery of five posters and links to an interview and the ArtStation project.
- [Vasili Zorin](https://deadlock.wiki/Vasili_Zorin) (text only): Names a credited character designer (Dynamo concept art in the game files).
- [Maren Nerei](https://deadlock.wiki/Maren_Nerei) (text only): Credit for the book art shown in the Library and book menus.
- [Lady Santos](https://deadlock.wiki/Lady_Santos) (text only): Second credit for the book art.
- [File:Spirattra poster.jpg](https://deadlock.wiki/File:Spirattra_poster.jpg) (2025-10-22; viewed): Upload comment cites the ArtStation project below; listed in Evgeniy Evstrastiy's gallery.
- [File:Call of industry poster.jpg](https://deadlock.wiki/File:Call_of_industry_poster.jpg) (2025-10-22; viewed): ANSWER THE CALL OF INDUSTRY!
- [File:Somnex poster.jpg](https://deadlock.wiki/File:Somnex_poster.jpg) (2025-10-22; viewed): A long billboard: SOMNEX in extruded yellow capitals, a tagline and one slogan band.
- [File:Ethereal strings poster.jpg](https://deadlock.wiki/File:Ethereal_strings_poster.jpg) (2025-10-22; viewed): Ethereal Strings, a conservatory advert: condensed serif title, script tagline 'Guided by the Greats'.
- [deadlock (beta) - posters (link text on the Deadlock Wiki)](https://www.artstation.com/artwork/kN9Bax) (text only; *browser-only*): HTTP 403 to automated requests.
- [Евгений Евстратий | из 2d в 3d и обратно | Deadlock | Интервью в Valve](https://www.youtube.com/watch?v=vl3F5IMLP_o) (2025-04-08; text only): Not watched.
- [Творческая встреча с Василием Зориным](https://www.youtube.com/watch?v=GEhIgNKlbPk) (2024-01-11; text only): Not watched; cited by the wiki for Vasili Zorin's then-unannounced project with IceFrog.
- [All Secrets in the Deadlock Matchmaking Update!](https://www.youtube.com/watch?v=AqMkNTzTM8Y) (2026-07-30; text only): Not watched; the wiki credits it for File:Ranked terminal.jpg; chapters on Hideout changes and ranked badges.
- [Neon Prime - Valve's Playtesters Hated This Game (and it got canceled...)](https://www.youtube.com/watch?v=OJ-fXZtrS-4) (2025-06-28; text only): Not watched; the wiki's only citation for the reported visibility problem, so that claim stays 'reported'.

**Press and reference**

- [Deadlock is the king of MOBA character designs, and it's all thanks to Valve's embrace of New Yorkyness](https://www.pcgamer.com/games/moba/deadlock-is-the-king-of-moba-character-designs-and-its-all-thanks-to-valves-embrace-of-new-yorkyness/) (2026-10-03; text only): Identity grounded in the world's own figures: 'Almost all the new characters are the sights and sounds of New York City'.
- [Deadlock's City Never Sleeps update makes Valve's MOBA my favorite videogame setting in years](https://www.pcgamer.com/games/moba/deadlocks-city-never-sleeps-update-makes-valves-moba-my-favorite-videogame-setting-in-years/) (2026-10-11; text only): Rework as deepening; districts with 'distinct characters'; Solomon and Baba 'torn straight from New York's park culture'.
- [The eyes of Valve's creepy portrait are glowing again](https://www.pcgamer.com/games/moba/the-eyes-of-valves-creepy-portrait-are-glowing-again/) (2026-09-25; text only): The main hub signals news through an object in the room, not a banner.
- [Deadlock's occult New York setting already has such excellent vibes that I might become a MOBA guy just to see where Valve takes it](https://www.pcgamer.com/games/moba/deadlocks-occult-new-york-setting-already-has-such-excellent-vibes-that-i-might-become-a-moba-guy-just-to-see-where-valve-takes-it/) (2024-08-27; text only): A first-hand account of the 2024 main menu as a living street and of a cast 'more cohesive' than Dota 2's.
- [Deadlock's biggest update yet marks a threshold moment: now's the time to grab yourself an invite](https://www.eurogamer.net/deadlocks-biggest-update-yet-marks-a-threshold-moment-nows-the-time-to-grab-yourself-an-invite) (2025-02-27; text only): World-building carried by print in the city; 'alternate-world fantasy goth New York'.
- [Valve spent 2025 ripping apart Deadlock and putting it back together, and it delivered better live service than most live service games](https://www.pcgamer.com/games/moba/state-of-deadlock-2026/) (2026-01-09; text only): Uneven finish reads as unfinished.
- [Deadlock isn't even 'out' yet, but Valve's new game is a true monster in the making](https://www.pcgamesn.com/deadlock/valves-secret-weapon) (2026-08-09; text only): Identity kept consistent across every surface of an entry.
- [Deadlock (video game)](https://en.wikipedia.org/wiki/Deadlock_(video_game)) (text only): The art-style history in brief, with a reception section citing the press pieces above.

## Added on 2026-11-01: how a screen changes

Nothing published documents how Deadlock's screens change: the [Hideout](https://deadlock.wiki/Hideout) page
says a terminal opens a full-screen menu and shows no motion; the
[Curiosity Shop](https://deadlock.wiki/The_Curiosity_Shop) page holds static files only; no Valve interface
designer's portfolio was found. Nothing about Deadlock's motion may be claimed until footage is captured:
hero select, the shop's tabs after the [29 September 2026 refresh](https://deadlock.wiki/Update:September_29,_2026)
("Refreshed Shop UI."), a terminal opening.

## Captures still to take

- The full-screen menus behind the Hideout's terminals: Select Play Mode, Watch, Learn to Play, News,
  Ranked and "Who's Next?". No picture was found.
- The individual City Never Sleeps reveal posters, with their three words.
- The settings screen (its search, the default pip, the new-setting mark), the scoreboard and the
  postgame MVP screen.
- The match HUD: the reactive portraits and the minimap with its coloured lanes.
- The loading screen and the match intro.
- A legible picture of the Oracle's masthead, and the Brands galleries with the item posters.
- The City Never Sleeps key art at full size.
- For history only: the pre-Hideout roster ([File:Roster_2024.png](https://deadlock.wiki/File:Roster_2024.png),
  "Screenshot of Deadlock roster screen in April-August 2024") and the Learn to Play menu art
  ([File:Learn_to_play_menu.png](https://deadlock.wiki/File:Learn_to_play_menu.png)).

Refused on 2026-10-30: the Game UI Database and ArtStation (HTTP 403), and the official Deadlock forum (a
bot check).

## Revisions

- 2026-10-30, just after midnight: first version.
- 2026-10-30: rebuilt. Corrected the status (an invite-only playtest, not Early Access); the setting (the
  Cursed Apple, which no source calls Art Deco); the source for type (the wiki's Help:Font page is a font
  preview for its editors and says nothing about the game, so the hero galleries replace it); the hero
  select (a logotype and inks for each hero, not one serif name and one red and navy); the shop
  (published by an in-world firm and distressed on purpose); the Hideout (a different object for each
  destination, state drawn in chalk); the title screen and the patron halls, now viewed and dated; the
  lineup, which is announcement art. Clean print and one face for names are credited to Aubaine, not to
  Deadlock, and "the posters of the hubs" is gone: the poster wall is only Layout A. Added the shop stall,
  the 2024 main menu, the Oracle, the brands, the map lanes, settings, portraits, and the date of every
  picture.
- 2026-10-31: moved into the `aubaine-design` skill. The hub statuses follow the owner's pick: the plate
  menu ships, the catalogue sheet (C) and the poster wall (A) are dropped, the Sommaire spread (C+) and
  the slanted doors (D) are kept unshipped. Links to screenshots of rejected designs are gone, and every
  link was checked again; the Map page now redirects to the Cursed Apple.
