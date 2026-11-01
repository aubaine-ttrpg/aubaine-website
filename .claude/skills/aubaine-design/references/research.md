# Researching the references

Aubaine's look comes from three games' own screens, read as a designer reads them and translated into a
web page. A new layout starts from the real in-game screens of the same kind of page; a layout built
from memory or from text searches alone was rejected three times on 2026-10-27 (`rulings.md`, The
direction).

## Contents

- [What counts as a source](#what-counts-as-a-source)
- [How to look at a screen](#how-to-look-at-a-screen)
- [How to cite](#how-to-cite)
- [The dossiers](#the-dossiers)
- [In-game screens studied](#in-game-screens-studied)
- [The lineage of the approved pieces](#the-lineage-of-the-approved-pieces)
- [Screens still to capture](#screens-still-to-capture)
- [Galleries and databases](#galleries-and-databases)

## What counts as a source

| Source | Use |
| --- | --- |
| A game's in-game screens: menus, selects, shops, results, the pause menu | Layouts, hierarchy, states, motion. The only source of a layout. |
| The makers' own words: interviews, talks, a studio's articles | Why a screen is the way it is. Quote them, with their name and role. |
| Wikis and screenshot galleries | Where to find a screen and its date. A wiki's prose is a reading, not the makers' intent. |
| Critics, students and fans | Readings, marked as readings, never as intent. |
| A game's marketing site | Web conventions at most, never a layout (2026-10-28). |
| World of Warcraft | Not a source (2026-10-30). |

## How to look at a screen

1. Find the screen of the same kind as the page being designed, in each of the three games: Persona 5's
   menus, Deadlock's hero select, shop and Hideout, the League client's tabs and champion select.
2. Capture the picture into the scratchpad, never into the repository: a Playwright screenshot of the
   page that shows it, or the image file itself with `curl`. Then open it with the Read tool. A screen is
   **viewed** only once its picture has been looked at, with the date; otherwise it is **text only**.
3. Note what the screen does, in words a web page can keep: hierarchy, the focal piece, how the pointed
   item answers, what stays plain, how the next level changes.
4. Note what stays in the game: rings, walkable rooms, perspective floors, logotypes per character,
   distressed paper. `rulings.md` already rules out several of them.
5. The orchestrator and `aubaine-design-researcher` share the work: the researcher finds the screens and
   the makers' words and returns the addresses of the pictures to capture; the orchestrator saves them
   into the scratchpad and gives them back to the researcher to describe. Merge its sourced rows into the
   dossier of the game, with the date.

## How to cite

- Fetch every link you cite, and record the date. A site that refuses scripted requests (HTTP 403, 406
  or 429) is cited only when another fetched page shows it exists, and is marked *(browser only)*.
- A challenge page is not a dead link, and it is never worked around. W3C answers scripts with one
  (HTTP 403 or 429 with `cf-mitigated: challenge`): confirm a WCAG or APG page in W3C's own sources
  ([w3c/wcag](https://github.com/w3c/wcag), [w3c/aria-practices](https://github.com/w3c/aria-practices))
  or with the Internet Archive's [availability API](https://archive.org/help/wayback_api.php), and cite
  CSS at the editor's drafts on [drafts.csswg.org](https://drafts.csswg.org/).
- Quote verbatim, with the speaker, their role, the publication and its date. Give the original of a
  translated quote beside the translation, and say who translated it. A writer's own narration is
  narration, not a quotation of the people they write about.
- Never copy another studio's picture into this repository: link it at its source (the owner's choice of
  2026-10-28).
- A wiki page that redirects is cited at its target. On 2026-10-31 every link in the dossiers was
  checked and none was dead; four wiki addresses were updated to their targets.

## The dossiers

| File | Holds |
| --- | --- |
| `persona-5.md` | The people who made Persona 5's menus and what they said (Masayoshi Suto's CEDEC+KYUSHU 2017 talk, Katsura Hashino, Kazuhisa Wada), the analyses, the screens viewed, ten things Aubaine takes, what it leaves, candidate uses, and the 2026-10-31 pass through the talk's slides, the makers' interviews and Atlus's own screens |
| `deadlock.md` | Valve's own pages and the Deadlock Wiki, the hero select, the Curiosity Shop's catalogues, the Hideout, the title screen and more, what Aubaine takes and leaves, open ideas |
| `hextech.md` | Riot's Hextech guide and the client's architecture articles, what Aubaine takes (gold for structure, the brightest values saved for what matters, shapes with jobs, the selection taking the screen) and what it leaves (the client as a device, blue as the action colour, the diamond) |

## In-game screens studied

| Game | Screen | Viewed | What it shows |
| --- | --- | --- | --- |
| Persona 5 | [Confidant](https://mechanicsofmagic.com/wp-content/uploads/2022/04/cff88b3c293e4b48bfe3a138a8f9ae57.jpeg) | yes | one bond large, browsed in place with named L1 and R1; the rank as a big numeral beside a boxed MAX stamp; the descriptions level, in a plain face on black panels |
| Persona 5 | [Battle command menu](https://mechanicsofmagic.com/wp-content/uploads/2022/04/9.webp) | yes | each command a big word over a short line (ATTACK over "Use Melee Weapon"); the commands ring the character, a geometry that stays in the game |
| Persona 5 | [Velvet Room services](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-098.jpg), from [RPGFan's gallery](https://www.rpgfan.com/gallery/persona-5-screenshots/) | yes, 2026-10-30 | each service a big word in cut letters over a one-word line naming its execution ("Persona Fusion" over "Guillotine"); the pointed service on a tilted red slab, the others greyed; the menu's title in a black starburst; the words lying in perspective on the floor around Igor's desk |
| Persona 5 | The pause menu ([007](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-007.jpg), [027](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-027.jpg)) and its Equip sub-menu ([008](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-008.jpg), [009](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-009.jpg)), Japanese build | yes, 2026-10-30 | a ragged stack of commands in cut letters, the pointed one in a colour no other command has; a big COMMAND title over a one-line hint; one level down, Equip is a new layout. The source of the Codex's plate menu |
| Deadlock | [Hero select](https://thegamehaus.com/deadlock/6-new-deadlock-heroes-revealed-new-select-screen-more/2025/08/18/), since the [18 August 2025 update](https://deadlock.wiki/Update:August_18,_2025) | small captures only | a column of portraits beside the chosen hero's poster, printed in that hero's inks; three descriptor words on dark tapes |
| Deadlock | [The Curiosity Shop's weapon catalogue](https://deadlock.wiki/File:Weapon_shop.png) ([page](https://deadlock.wiki/The_Curiosity_Shop)) | yes | light, deliberately distressed stock; coloured category tabs, the open one's colour down the spine; the Fairfax masthead on a black plate; tiers on printed grounds under black notched price plates |
| Deadlock | [The Hideout, the main menu](https://deadlock.wiki/File:Hideout_main.png) ([page](https://deadlock.wiki/Hideout)) | yes, 2026-10-30 | a walkable manor hall at dusk; the Play terminal, a round table in a glowing green circle under a tiny floating "PLAY" label |
| Deadlock | [Title screen](https://deadlock.wiki/File:Title_screen.png) | yes, 2026-10-30 | the city at dusk from the rooftops, a green beam, the wheel emblem and the wordmark centred, one line, "PRESS ANY KEY TO START" |
| League of Legends client | [Home](https://wiki.leagueoflegends.com/en-us/File:Client.png), [Collection](https://wiki.leagueoflegends.com/en-us/File:Collection.png), [Items](https://wiki.leagueoflegends.com/en-us/File:Items.png), [Runes](https://wiki.leagueoflegends.com/en-us/File:Runes.png) | yes | ornament on the one celebratory panel; search and filters the plainest boxes of the page; badges hanging off a card's edge; each rune page painted in its path's art |
| League of Legends client | [Champion select](https://interfaceingame.com/screenshots/league-of-legends-choose-your-champion/) and its [loadout](https://interfaceingame.com/screenshots/league-of-legends-choose-your-loadout/) | yes, 2026-10-30 | the team in circular portraits under the timer; after lock-in the selected skin's splash fills the middle and, blurred, the rest of the window; "The selected skin's splash art is shown on screen." ([League wiki](https://wiki.leagueoflegends.com/en-us/Team_drafting#Trivia)) |

## The lineage of the approved pieces

- **The select screen** was found on 2026-10-27 from Deadlock's 2025 hero select (a roster beside the
  chosen hero's poster and a giant name), League's champion select (the pick takes the screen), and
  three marketing pages: the Characters section of
  [Persona 5 Royal's official site](https://persona.atlus.com/p5r/), World of Warcraft's race pages
  (where the group marks came from) and League's Universe site. The owner judged the result, not its
  sources. Marketing pages stopped being a source of layouts on 2026-10-28, and World of Warcraft is no
  source at all since 2026-10-30. Persona 5's Confidant screen makes the same moves: one entry large,
  browsed in place with named previous and next.
- **The character sheet**, the answer to the brief of 2026-10-23, draws on Deadlock's hero posters
  printed in each hero's own inks, Persona 5's flat cut paper, and Hextech's brightest values saved for
  one focal card (each dossier's What Aubaine takes).
- **The hub plate menu** came from Persona 5's pause menu and the Velvet Room's big words over one-line
  executions, struck in Aubaine's paper with the kind marks' pictograms; the plain version was too plain
  until each lit door drew its scene (2026-10-30 and 2026-10-31).

## Screens still to capture

Each dossier keeps its own list: `persona-5.md` § Captures still to take, `deadlock.md` § Captures still
to take and `hextech.md` § Still to view.

## Galleries and databases

Where to find in-game screens, checked on 2026-10-31.

| Source | What it holds | Access |
| --- | --- | --- |
| [RPGFan's Persona 5 gallery](https://www.rpgfan.com/gallery/persona-5-screenshots/) | In-game screenshots of a Japanese build, numbered | opens to scripts |
| [The Deadlock Wiki](https://deadlock.wiki/) | File pages for screens, with their dates in the file history | opens to scripts |
| [The League of Legends Wiki](https://wiki.leagueoflegends.com/en-us/) | Client screens on file pages | opens to scripts |
| [Interface In Game](https://interfaceingame.com/) | Screens of games' interfaces, by game and by kind of screen | opens to scripts |
| [Game UI Database](https://www.gameuidatabase.com/) | Interface screens tagged by game and by kind of screen | *(browser only)*: a challenge answers scripts |
