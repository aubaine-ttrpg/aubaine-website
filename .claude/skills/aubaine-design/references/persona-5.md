# Persona 5, Atlus

Persona 5 is one of the three games the owner named for Aubaine's art direction on 2026-10-29: "Imagine
a mix between Deadlock, The Persona Series (more preciesly Persona 5) and the Hextech from League of
Legends." This file holds the research behind that choice: who made the game's menus and what they said,
the screens studied, what Aubaine takes and what it leaves. The owner's rulings are in `rulings.md`, and
`DESIGN.md` documents the look the research led to.

## Contents

- [Scope and versions](#scope-and-versions)
- [The people and what they said](#the-people-and-what-they-said)
- [Analyses](#analyses)
- [Screens studied](#screens-studied)
- [What Aubaine takes](#what-aubaine-takes)
- [What Aubaine leaves](#what-aubaine-leaves)
- [Candidate uses, none approved](#candidate-uses-none-approved)
- [Added on 2026-10-31](#added-on-2026-10-31)
- [Capture inventory](#capture-inventory) and [captures still to take](#captures-still-to-take)

- **Viewed** means a picture of the screen was looked at, on the date given. **Text only** means the
  screen is known from words alone.
- Quotes are verbatim, with their speaker and source. A writer's own narration is marked as narration,
  and a reading made by this research is marked as a reading.
- Every link was checked again on 2026-10-31 and none was dead. Sites that refuse scripted requests are
  marked *(browser only)*: Mechanics of Magic (a block) and Source Gaming (HTTP 406) open in a browser;
  the Game UI Database and the Megami Tensei Wiki answer scripts with a challenge and are listed as not
  read under Capture inventory. Pictures of Atlus's games stay out of this public repository and are
  linked at their source; screenshots of Aubaine's accepted pieces are in `../assets/approved/`.
- A component named without its folder lives in `src/components/primitives/`. Code values are those of
  commit `a9b3954`, the approved state of the sheet and the select screen; `KIND_MARKS` arrived in the
  next commit, `140bbe6`.

## Scope and versions

| Game | Platforms at release | Released | Role here |
| --- | --- | --- | --- |
| Persona 5 | PlayStation 3 and PlayStation 4 | Japan 2016; North America and Europe 4 April 2017 | Every screen below unless marked |
| Persona 5 Royal | PlayStation 4 | Japan 31 October 2019; North America and Europe 31 March 2020 | The Thieves Den, Jose's shop, the official site |

Dates from The New York Times (below), [Gematsu](https://www.gematsu.com/2017/02/persona-5-game-mechanics-velvet-room-trailer)
and [Siliconera](https://www.siliconera.com/persona-5-trailer-takes-us-velvet-room/) (21 February 2017),
[Game\*Spark](https://www.gamespark.jp/article/2019/10/30/94204.html) (30 October 2019) and
[RPG Site](https://www.rpgsite.net/news/9247-persona-5-royal-releases-on-march-31-2020-lifetime-persona-5-shipments-reach-32-million)
(3 December 2019). A Japanese build writes its help lines in Japanese, while many of its menu words are
English. Later games appear only as context: Persona 5 Tactica (2023), Persona 3 Reload (2024) and
Metaphor: ReFantazio (2024).

## The people and what they said

### Masayoshi Suto (須藤正喜), Atlus

- **Role.** Atlus's first dedicated UI designer, and on Persona 5 both art director and UI design lead:
  「アトラス初のUI（ユーザーインターフェース）専属デザイナーであり、『ペルソナ5』ではアートディレクターとUIデザインリーダーを兼任」
  ([Famitsu, 13 November 2017](https://www.famitsu.com/news/201711/13145540.html)). The game's look and
  its menus had one lead.
- **The CEDEC+KYUSHU 2017 talk.** On 28 October 2017 in Fukuoka, Suto and Kazuhisa Wada gave the session
  on the UI of Persona 5 ([announced by Game Watch](https://game.watch.impress.co.jp/docs/news/1083476.html),
  29 September 2017). Famitsu's report of it, by ロマンシング★嵯峨, gives Suto these points:
  - **Colour first.** 「人間の印象に強く残るものは色であり、それゆえ、まずメインカラーを決める」: colour is
    what stays in people's minds, so the main colour is fixed first, with the title logo and the key font.
    Persona 3's is blue, Persona 4's yellow, Persona 5's red.
  - **One colour speaks.** 「とにかく情熱的な赤を目立たせるため、極力サブカラーは入れないことにした」: to make
    the passionate red stand out, sub-colours were kept out as far as possible. A caption adds that the
    interface takes almost none 「HPやMPの数値などを除き」 (except for numbers such as HP and MP).
  - **The concept 「ポップパンク」**: pop for mass appeal (「大衆志向」), punk for anti-establishment
    (「反体制」).
  - **Lines lead the eye.** 「人は、線を追って視線を動かす性質がある。」 So when the menu opens, a white line
    is drawn through its centre to guide the eye.
  - **A new level, a new layout.** 「下の階層に移動するときは、レイアウトやアングルを変えて、階層認識のしやすさを意識。」:
    one level down, the layout and the angle change, so the player can tell how deep they are.
  - **Brightness is priority.** 「優先度の高い情報のスペースは明度が高くなり、そうでない情報のスペースは明度が低くなる仕組みになっている。」
    The brightness is tuned to change fluidly, so the important information is easy to grasp.
  - **The 3D models answer the player.** The UI's 3D models move with each input. The layout is drawn in
    Photoshop, a motion designer poses the model, and a 2D illustration is drawn to match its final pose.
  - **Built beside the programmer.** Each part of the game, such as battle and story, had its own UI
    programmer; designers checked beside them, adjusting 「1ドット1フレーム」 (one dot, one frame), and
    leaving room for the programmer's own ideas raised the quality.
  - **The aim.** UI that guides 「直感的に、さりげなく」 (intuitively and subtly), with play and surprise
    folded into that subtlety, raising UI to graphical entertainment.
- **CEDEC AWARDS 2019.** The visual arts top prize went to Suto for 「魅せるUIという表現方法の確立」
  (establishing the UI made to be looked at as a means of expression). The citation covers the series,
  not Persona 5 alone: 「ペルソナ３以降のシリーズのUIデザインを担当。」
  ([gamebiz, 5 September 2019](https://gamebiz.jp/news/247996); the ceremony and Suto's acceptance:
  [Game Watch](https://game.watch.impress.co.jp/docs/news/1205676.html)).
- **2016, before release.** A Famitsu interview, posted in English by Play Asia and excerpted by
  [SEGAbits (James Barton, 12 September 2016)](https://segabits.com/blog/2016/09/12/extensive-famitsu-interview-persona-5-art-audio-leads/),
  where the name is romanised "Sudou": "I tend to not add gradations, but prefer filling in each and every
  graphic." and "The biggest thing I put my all into was regarding the color of the interface compared to
  the game's main color scheme." Against Persona 5's crimson, Suto chose black and white text: "after trying
  out black and white text I was confident with it". These are translations relayed twice.
- **2024, The New York Times.** Rollo Romig, "Exuberant Video Game Menus Designed With da Vinci in Mind",
  October 2024
  ([republished by DT Next](https://www.dtnext.in/amp/story/edit/exuberant-video-game-menus-designed-with-da-vinci-in-mind-807823)),
  which calls Suto "the lead UI designer for many Atlus games":
  - Suto's own words: "I started thinking about it as graphical entertainment", after seeing on Persona 3 that
    a more expressive UI could make information fun; "Now when I make menus, I'm excited for players'
    reactions. I think, 'What will surprise them? What will they talk about?'"; "We vibe with the
    programmer, and the programmer brings their own taste and their own ideas".
  - In the reporter's words, not Suto's: Suto "looked to website menus for inspiration", and Persona 5's
    menus, Suto said, "took typographical inspiration from the ransom-note-style covers of Sex Pistols
    albums".
  - A reading: Suto drew on website menus, so a web site taking Persona's menu grammar back is a fair
    translation.

### Kazuhisa Wada (和田和久), Atlus

Suto's co-speaker in 2017, who oversaw the Persona team. In Famitsu's report, Wada traces the style to
Persona 3, made while Atlus's console division was in crisis (「アトラスのゲームはおもしろいけど売れない」:
Atlus's games are fun but do not sell). One answer was 「UIの徹底強化」, a thorough strengthening of the UI,
which Famitsu's own narration sums up as turning the UI from 「縁の下の力持ち」 (the unseen support) into
「主張の強い主人公」 (an assertive protagonist).

### Katsura Hashino, director of Persona 3, 4 and 5

- **To [The Verge](https://www.theverge.com/2024/10/7/24262357/persona-metaphor-menu-design)** (Andrew
  Webster, 7 October 2024), ahead of Metaphor: ReFantazio: "we try to keep things simple, practical, and
  usable. But maybe the reason that we've achieved both [functionality and beauty] is that we have unique
  designs that we make for each and every menu." Then: "Whether it's the shop menu or the main menu, when
  you open them up there's a whole separate program running and a separate design that goes into making
  it. It takes a lot of time."
- **On Persona 5's angles**, which in The Verge's narration "initially created issues with legibility":
  "It was impossible to read at first," Hashino says, "so we did lots of tweaking and adjusting so it
  became legible."
- **Relayed** by
  [Push Square](https://www.pushsquare.com/news/2024/10/making-metaphor-refantazio-personas-immaculate-menus-is-really-annoying-says-director)
  (Khayl Adam, 8 October 2024: the angular elements were "impossible to read at first") and by
  [Kotaku](https://kotaku.com/-metaphor-refantazio-persona-5-menu-ui-hashino-1851667088) (Ethan Gach,
  7 October 2024). Kotaku's sentence "Apparently that was an issue with Persona 5 until the team did a lot
  of iteration and refinement on the angular black, red, and white text boxes." is Kotaku's narration,
  not Hashino's words.
- **To [Gameblog](https://www.gameblog.fr/jeu-video/ed/interviews/le-realisateur-de-persona-5-katsura-hashino-nous-ouvre-son-coeur-96176)**
  (Rudy Jean Francois, 4 April 2017), in French: « nous voulions un style animé et dynamique
  encore jamais vu ». The interface's inspiration came first from racing games, whose « menus défilent
  rapidement, accompagnés de transitions dynamiques du plus bel effet », and from the BBC's Sherlock. The
  inner life of someone walking down the street with headphones on: « C'est ce que nous voulions
  retranscrire avec notre interface utilisateur ».
- **In The New York Times**, which notes that "even the music ended up being guided by the UI": "We'll
  design a really cool menu," and other members of the team "will come up with ideas based around it."

### Shigenori Soejima, Atlus's lead character designer

In The New York Times's reported speech: because Persona 5 has a character who calls out play-by-play
commentary during some battle scenes, Atlus also looked to "the data-rich but often bombastic graphics of televised sports
matches". The words are the reporter's.

### Tomohiro Kumagai (熊谷友寛), Atlus

A UI designer on the series from Persona 4 Arena Ultimax, then on Persona 5 and Persona 5 Royal, and art
director of Persona 3 Reload. In [Famitsu (川島KG, 29 November 2023)](https://www.famitsu.com/news/202311/29325647.html),
Kumagai says Persona 5's UI had the theme pop punk and that the team was
「動きの素早さやハジけた感じを意識していました」 (mindful of quick movement and a bursting feel). The interviewer recalled that Persona 5 gave a sizeable
share of memory to the UI so its menu could open 「爆速で」 (at explosive speed); Kumagai answered that the
response speed and the clear controls built on Persona 5 were kept.

### The New York Times's narration

Two sentences of the same article are the reporter's, not Atlus's: "Atlus' key insight is that if the
game is played mostly in the menus, then the menus deserve the biggest aesthetic investment." and "Atlus
has designed its menus with the recognition that minimalism and clarity are not necessarily synonymous."

## Analyses

None of these speaks for Atlus.

| Source | Kind | What it says |
| --- | --- | --- |
| Masahiro Sakurai, Famitsu column vol. 515 (6 October 2016), [translated by Source Gaming](https://sourcegaming.info/2016/11/24/the-aims-of-ui-sakurais-famitsu-column-vol-515/) *(browser only)* (24 November 2016) | A game director's column, fan translation | "Persona 5 goes for a black-and-white theme and strongly features the color red." Its UI takes "an active role in the game's presentation" and is "unconventionally cluttered". Localisation is hard because "in English, usually character size gets smaller while sentences grow longer"; still, the team made "a UI that works well for the player". |
| Shimea, ["Visual Design of Games: Persona 5"](https://mechanicsofmagic.com/2022/04/23/visual-design-of-games-persona-5/) *(browser only)*, 23 April 2022 | A student assignment on the Stanford HCI Game Design Blog, whose classes Christina Wodtke teaches; filed under Assignments | In the pause menu the pointed word "is made bigger and given a bit of color. That splash of blue especially helps to bring attention to the fact that this is the current selected menu, because it's so much of a contrast from the games main theme colors, red, black, and white." "Joker, our protagonist in the background, is always there, but he switches poses depending on the menu you select." In battle the student notes the "color for each button that corresponds to the button's color on the Playstation controller". |
| Geoffrey Bunting, [Inverse](https://www.inverse.com/gaming/persona-5-tactica-user-interface), 2 December 2023 | Critique, written about Persona 5 Tactica | Persona 5's "Multiple moving axes for type and dynamic baselines that prioritized style over information, coupled with an extra bold typeface that reads poorly in the allotted space in the localization" make its type "a readability nightmare". Tactica shifted many menus, subtitles and UI elements into "a strong, rational sans-serif typeface that is both more readable and, thanks to the boundaries defined by Constructivist geometry, more stable". |
| Cory Dinkel, [Siliconera](https://www.siliconera.com/what-makes-the-ui-and-menus-in-persona-games-so-good/), 31 January 2024 | Feature | The menus are "simple and functional"; "In combat, the available actions circle the chosen character."; "This same aesthetic follows through all the menus", which is the style, not one layout; by its colour "you can easily separate one Persona game from another from just a screenshot". |
| Gita Jackson, [Kotaku](https://kotaku.com/persona-5-menus-make-everything-better-1794216056), 11 April 2017 | Article | The battle menus "pulsate and react to every button you press". |
| Alexandria Lopez, [Gfinity Esports](https://www.gfinityesports.com/article/rebellion-by-design-the-genius-of-persona-5-royals-visual-storytelling), 20 July 2026 | Feature the site labels opinion, on Royal | The interface looks "muted and drab" at school or in the subway, and in Mementos and the Palaces "everything features high-contrast, kinetic energy". The All-Out Attack ends on "a comic-strip portrait with a unique tagline for each character". A [second piece](https://www.gfinityesports.com/article/persona-5-set-the-bar-for-jrpg-menus-can-persona-6-live-up-to-the-hype) (28 July 2026): "For Persona 5, the magic was the fact that command menus were part of the narrative." |
| Edd Coates, founder of the Game UI Database, at PG Connects London, reported by Khai Trung Le, [PocketGamer.biz](https://www.pocketgamer.biz/pg-connects-london-the-untapped-artistry-of-ui/), 15 February 2022 | Talk report | "This game wants you to recognise the UI. It wants you to identify this as what Persona 5 is [...] UI has the power to hijack the game's visual identity" |
| Robin Rendle, ["Videogames and WiggleTech"](https://robinrendle.com/adventures/video-games-and-wiggletech/), 19 June 2022 | Blog post | "It looks as if everything has been set with wood type and printed incorrectly" |
| Arjan Terpstra, ["Persona 5's Bombastic Art Direction"](https://www.cookandbecker.com/en/article/137/persona-5-s-bombastic-art-direction.html), Cook and Becker, 28 March 2018 | Feature | "Explosions of text in over-exaggerated fonts and sharp, loud colors are presented on oversized strips" |

## Screens studied

RPGFan's numbered screenshots belong to its
[Persona 5 gallery](https://www.rpgfan.com/gallery/persona-5-screenshots/) (106 pictures) and its
[Persona 5 Royal gallery](https://www.rpgfan.com/gallery/persona-5-royal-screenshots/) (163 pictures).

| Screen | Status | Pictures and text | What it shows |
| --- | --- | --- | --- |
| Pause menu, "Camp & Main" | Persona 5, Japanese build. Viewed 2026-10-30 | RPGFan [007](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-007.jpg) and [027](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-027.jpg); text: the student blog, Famitsu 2017 and 2023 | Eight commands stacked and staggered over a giant white hand: SKILL, ITEM, EQUIP, PERSONA, PARTY, COOPERATION, MISSION, SYSTEM. The pointed SKILL is larger, pale mint on black with a cyan stripe (027). COMMAND in huge cut letters with the pointed command's help line under it, 「スキルを使用」 (use a skill). The yen amount lower left; a plate reading "Camp & Main" over "COMMAND SELECT", above a big "01"; the protagonist behind a red brush stroke, halftone in the hair. |
| EQUIP, one and two levels down | Persona 5, Japanese build. Viewed 2026-10-30 | RPGFan [008](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-008.jpg) and [009](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-009.jpg) | Each level recomposes the screen. One down: the protagonist moves to the left and aims a gun, the party list sits at the top with the pointed name on a cyan slab, the five equipment slots hang on stepped white plates, COMMAND moves lower left with a new help line. Two down: L1 and R1 frame the character's name over a black weapon list with attack and accuracy columns, the pointed weapon on a red band, the protagonist in a new pose. |
| Confidant | Persona 5. Viewed 2026-10-30 | [The student blog's figure](https://mechanicsofmagic.com/wp-content/uploads/2022/04/cff88b3c293e4b48bfe3a138a8f9ae57.jpeg) | CONFIDANT on a tilted plate over a cut-off instruction line. The confidant big in black and white with halftone in the hair, the protagonist behind. The confidant's name on a white plate between L1 and R1; the arcana as an angled tarot card beside ARCANA and "Priestess"; RANK with ten stars, a huge 10 and a boxed MAX. The name again in ransom-note tiles; two short descriptions level in a plain white sans on black panels; "Back" lower right. |
| Battle command menu | Persona 5. Viewed 2026-10-30 | [The student blog's figure](https://mechanicsofmagic.com/wp-content/uploads/2022/04/9.webp) | Six commands around the protagonist, each a big word over a verb line with its button glyph: ATTACK "Use Melee Weapon", GUARD "Defend Yourself", PERSONA "Use a Skill", ITEM "Use an Item", GUN "Take Aim", ORDER "Change Tactics". Secondary actions small in one row lower left; the enemy's name and level on one long tilted black bar; Morgana in a black balloon with a jagged white outline; HP and SP beside tilted head cut-outs. |
| Velvet Room, the services | Persona 5. Viewed 2026-10-30 | RPGFan [098](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-098.jpg); text: Atlus via [Gematsu](https://www.gematsu.com/2017/02/persona-5-game-mechanics-velvet-room-trailer), [Siliconera](https://www.siliconera.com/persona-5-trailer-takes-us-velvet-room/) | Four services in cut letters lying in perspective on the floor around Igor's desk, three over a small subtitle naming an execution: Persona Fusion (Guillotine), Strengthen Persona (Gallows), Itemize Persona (Electric Chair), then Explanations. The pointed one on a tilted red slab, white letters outlined in black, the others grey. "Create New Personas" in a black starburst lower left; Igor's "Which fusion would you like?" on a stepped plate; Back and Confirm lower right; chains across the floor. |
| Velvet Room, the fusion list | Persona 5. Viewed 2026-10-30 | RPGFan [099](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-099.jpg) | Inside Persona Fusion the perspective is gone: two flat lists, "Persona" on black and "Result" on white, joined by a jagged arrow. Each row an arcana tag, a level and a name; the first pick on a red band marked 1ST; the cursor row in cyan with a mask icon; a red NEW tag; Igor's "Choose the second Persona." |
| A Persona's status, levelling up | Persona 5. Viewed 2026-10-30 | RPGFan [105](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-105.jpg) | "Moon" on a white plate, the name, LV 8 and NEXT LEVEL 155. One tilted tile per element, each in its own colour, some tagged Wk, Str or Nul; the skills on a black panel, each with its element's icon; "LEVEL UP!!" in tilted yellow cut letters; a blue ground swept by black and white bands. |
| Shops: Untouchable and Takemi Medical Clinic | Persona 5, Japanese build. Viewed 2026-10-30 | RPGFan [015](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-015.jpg), [016](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-016.jpg) and [014](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-014.jpg) | Untouchable is acid green, black and white: the masthead "MILITARY SHOP UNTOUCHABLE MUNEHISA IWAI" on a black starburst, the shopkeeper behind a chain-link fence, the commands on green tags that say what they do (sell, buy melee weapons, buy ranged weapons, buy armour, buy accessories), the pointed tag white. One level down, the party hang as dog tags on a ball chain. The clinic is blue: a dated white list of medicines and prices, the pointed line under a black marker stroke, the doctor a white silhouette. |
| Field HUD | Persona 5. Viewed 2026-10-30 | RPGFan [083](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-083.jpg) and [090](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-090.jpg) | The date in big cut numerals on a tilted white plate, with the weekday, the time of day and a weather mark. The place on two stacked black plates edged in white, a small one over a larger one (Shinjuku over Red-light District; Arcade over Akihabara Gigolo). A countdown or the objectives on red or black bars upper right; button prompts lower left in the same letters. |
| Change of day | Persona 5. Viewed 2026-10-30 | RPGFan [106](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-106.webp) | The month as "20XX 6" upper left. The days in big cut numerals with their weekday, 10 FRIDAY to 15 WEDNESDAY, arc across a black and white drawn city under a blue sky; Saturday's numeral is blue, and 12 SUNDAY, larger and red, has a knife stabbed into it. Lower right, the Phan-Site poll: "Are the Phantom Thieves just?" over a red bar, YES 18.9%, and an anonymous comment. |
| Thieves Den, the gallery | Persona 5 Royal, Japanese build. Viewed 2026-10-30 | RPGFan Royal [125](https://www.rpgfan.com/wp-content/uploads/2020/06/Persona-5-Royal-ss-125.jpg); text: [Push Square](https://www.pushsquare.com/news/2020/02/persona_5_royals_thieves_den_is_the_most_grandiose_extras_menu_ever), [Inside Games](https://www.inside-games.jp/article/2019/10/03/125014.html), [Game\*Spark](https://www.gamespark.jp/article/2019/10/30/94204.html) | Artwork of the Phantom Thieves in gold frames along a dark wall; a "CHECK!" prompt over a black plate reading 「ギャラリーを閲覧」 (view the gallery); マイパレス on a white plate under a black and white minimap. In text: "an all-new option found in the title's pause menu", in "the shape of a gigantic open-plan room" with "various stations situated about the place" (Push Square, 17 February 2020); 「プレイヤーの思いや記憶が形になった特別な場所」, a special place where the player's thoughts and memories take form (Inside Games, 3 October 2019); the main characters visit to talk and play cards (Game\*Spark). |
| City map | Persona 5. Text only | [Game Informer](https://gameinformer.com/b/features/archive/2017/04/09/tips-for-success-in-persona-5), 9 April 2017 | "You can use the square button on map locations to find out what confidants are available for you in each area and whether or not your relationship with them is ready to advance." |
| Stats | A Persona 5 Royal guide. Text only | [Samurai Gamers](https://samurai-gamers.com/persona-5/human-parameters-maximize/) | Five social stats on named ranks ("Each stat ranges from 0-5."): Knowledge runs Oblivious, Learned, Scholarly, Encyclopedic, Erudite; Guts runs Milquetoast, Bold, Staunch, Dauntless, Lionhearted. |
| All-Out Attack, the finishing card | Persona 5 and Royal. Text only | [SmashWiki](https://www.ssbwiki.com/All-Out_Attack), Gfinity (above) | The splash screen "is only displayed when the attack defeats every enemy left in the battle, with a unique screen for each party member depending on who initiated the attack" (SmashWiki); "a comic-strip portrait with a unique tagline for each character" (Gfinity, on Royal). |
| Title screen | Persona 5. Text only | [Destructoid](https://www.destructoid.com/top-10-best-menu-screens-in-games-ranked/), 30 August 2023 | "The introduction of the train pop art and then the Phantom Thieves at a stop is fantastic." "I love the striking red and white style as you see the trains beside them rush on either side." |
| Jose's shop in Mementos | Persona 5 Royal. Text only | [Game\*Spark](https://www.gamespark.jp/article/2019/10/30/94204.html), 30 October 2019 | Jose gathers flowers in Mementos and trades them for items; stamps brought to Jose raise the EXP, money and items won in battle. |
| The official Persona 5 Royal site | Marketing. Captured 2026-10-27, viewed again 2026-10-30 | [persona.atlus.com/p5r](https://persona.atlus.com/p5r/) | SEGA's header, "Buy Now", "Available NOW" and a cookie banner around gold ransom-letter titles. Its Characters section shows one character large beside crooked portrait cards with name tapes. Provenance of the approved select screen only, never a source of layouts: the game's own interface is red, black and white, and the owner asked for the games themselves: "i don't want the feel of a Video Game Webiste, i want the feel of those Video game" (2026-10-28). |

## What Aubaine takes

The grammar, never the geometry. Suto's stated aim, UI that guides 「直感的に、さりげなく」 with play and
surprise inside, matches the owner's brief of 2026-10-29: something "that feels unique to match Aubaine's
world while being intuitive for people visiting the website".

### 1. One main colour, fixed first

- **Persona 5.** The main colour is fixed first, and sub-colours were kept out so the red could speak;
  only numbers such as HP and MP take another hue (Suto, Famitsu 2017). The interface's colour against
  the game's own was "The biggest thing I put my all into" (Suto, 2016). A reading of the viewed screens:
  the pointed thing takes the colour that contrasts with its ground, cyan in the red pause menu (027) and
  on EQUIP's party list (008), red in the blue Velvet Room (098).
- **Aubaine.** The hues stay behind (see What Aubaine leaves); the rule comes across: one hue speaks on a
  stage. The page's chrome is house gold `#efbe04` (`--gold` in `src/styles/tokens.css`). Inside a sheet
  `--gold` becomes the entry's key colour (`--gold: var(--key);` in
  `src/components/primitives/CharacterHero.astro`), and each roster card takes its own
  (`CoverCard.astro`). Kind marks (`KIND_MARKS` in `src/lib/game/kind-marks.ts`) and domain colours mark
  data, as Persona's numbers and element tiles do.

### 2. Brightness follows the selection

- **Persona 5.** The most important space is the brightest, and the brightness moves with priority (Suto,
  Famitsu 2017). The pointed word "is made bigger and given a bit of color", and Joker "switches poses
  depending on the menu you select" (the student blog). Seen: the larger, paler SKILL (007, 027); the one
  service on a red slab while the others go grey (098).
- **Aubaine.** The card never grows. A roster card that is pointed, focused or current turns its resting tilt
  to -0.6 times itself and lifts 6 px over 0.34 s; its key-colour halftone slab fades in over 0.28 s,
  grows from 0.9 to 1 and slides out over 0.34 s; a mouse also leans it under a warm glare
  (`src/scripts/tilt.ts`); and the spotlight and the stage behind the whole screen take that entry, its
  art or its seal colours (`CoverCard.astro`, `FramedCard.astro`, `src/scripts/select-screen.ts`). On the
  roster only the pointed card shows a slab.

### 3. A line leads the eye

- **Persona 5.** 「人は、線を追って視線を動かす性質がある。」 When the menu opens, a white line is drawn
  through its centre (Suto, Famitsu 2017). The viewed stills do not show the opening, so the line itself
  is text only.
- **Aubaine.** Lines run in reading order and never join links into a path. A 1 px hairline fading from
  gold at 26 % follows the sheet's kind label (`SheetHead.astro`) and each group mark
  (`SelectScreen.astro`), and the stage's light shafts fall from above the focal card
  (`src/scripts/art-effect/glsl/stage.frag`). The rejected radial fan drew a line from the lit name to its
  central hexagon (`rulings.md`, Hubs).

### 4. A short line under every command

- **Persona 5.** Every command says what it does: ATTACK over "Use Melee Weapon", Persona Fusion over
  "Guillotine", the pause menu's help line under COMMAND (「スキルを使用」), the shop's tags written as
  verbs.
- **Aubaine.** The open link says what it does and names the entry for assistive technology (« Ouvrir la
  fiche → », accessible name « Ouvrir la fiche : Marchand »; `Spotlight.astro`,
  `src/lib/game/hub-cards.ts`), and an entry with a subtitle shows it under its name in EB Garamond italic
  (`SheetHead.astro`). On the new hub layouts a door is its mark, its exact name and one line, with no
  count: "what's the point of having the number of each if it is shown afterwards with the number of
  results ?" (the owner, 2026-10-27; rule of the plan approved on 2026-10-30).

### 5. A new layout one level down

- **Persona 5.** Suto's rule above, and Hashino's "we have unique designs that we make for each and every
  menu". Seen: the pause menu (007), EQUIP (008) and its weapon list (009) change composition and pose
  at each step; the Velvet Room's floor of words (098) gives way to two flat lists (099); the shop's
  tags (015) give way to dog tags (016). Siliconera's "This same aesthetic follows through all the menus"
  is about the style, not a repeated layout.
- **Aubaine.** One vocabulary everywhere (the night stage, paper, Cinzel, the pointy-top hexagon, the key
  colour) and a composition of its own for each kind of page: the select screen opens onto the sheet, a
  different composition one level down. A hub never re-lays the select screen: "same DA but different"
  (the owner, 2026-10-28); "I do not wish for a copy of what have been done in the Indexes" (2026-10-29);
  of the poster wall, "it really feels an awful lot like SkillTrees and Species Indexes it's like a
  reformated version of those indexes" (2026-10-30). The Codex's plate menu, picked on 2026-10-31, is a
  composition of its own, after the pause menu (`approved-pieces.md`).

### 6. Menus open at once

- **Persona 5.** Memory was set aside so the menu could open 「爆速で」, and the UI aimed at quick movement
  and a bursting feel (Famitsu 2023, the interviewer and Kumagai). The battle menus "pulsate and react to
  every button you press" (Kotaku, 2017).
- **Aubaine.** The choices are in the page as it arrives, and the spotlight swaps from templates already
  in the HTML (`Spotlight.astro`). A mouse swap waits 80 ms of intent, keyboard focus swaps at once, touch
  never swaps on hover, a picture gets at most 250 ms to decode, the panel replays its arrival at 0.35 of
  its time, and the stage crossfades in 450 ms (`src/scripts/select-screen.ts`,
  `src/scripts/art-effect/stage.ts`).
  Paper slaps in from a larger tilted pose with an overshoot, `cubic-bezier(0.2, 1.45, 0.4, 1)`
  (`TitlePlates.astro`, `DescriptorStickers.astro`, `TraitPlates.astro`). The sheet's arrival runs about
  1.6 s and stands as approved; new pieces arrive in under 700 ms (plan approved on 2026-10-30).

### 7. Intensity follows the place

- **Persona 5.** In Gfinity's opinion piece on Royal, the interface is "muted and drab" at school and in
  the subway, with "high-contrast, kinetic energy" in Mementos and the Palaces. The New York Times's
  narration: "the menus deserve the biggest aesthetic investment".
- **Aubaine.** The show belongs to the pages where people choose and arrive: the select screens, the
  sheet's opening screen, and the two hubs. The reading below a sheet stays calm,
  Spectral text in the reader's theme, while the stage above stays dark in both themes (`.au-dark` on
  `CharacterHero.astro`).

### 8. Display type shouts, reading type talks

- **Persona 5.** Cut letters and angles carry names, titles, commands and stamps; the Confidant's two
  descriptions sit level in a plain white sans on black panels (viewed). The failures are named: "It was
  impossible to read at first" (Hashino), type on "Multiple moving axes" in "an extra bold typeface that
  reads poorly in the allotted space in the localization" (Inverse), and English sentences that "grow
  longer" (Sakurai).
- **Aubaine.** Names and titles in Cinzel 700, reading in Spectral, subtitles in EB Garamond italic,
  labels in JetBrains Mono capitals, paper in Barlow Semi Condensed (`src/styles/fonts.css`). Plates and
  panels size to their text in French and English and are never drawn for one language: the spotlight
  reserves room for the longest subtitle and sticker list of all its entries (`Spotlight.astro`), and
  `tests/e2e/select-screen.spec.ts` checks every entry in both locales at 1512 × 982, 1366 × 657,
  1024 × 768 and 390 × 844 for clipped pieces.

### 9. The world dresses the menu

- **Persona 5.** Each Velvet Room service is staged as an execution: personas are "executed via
  guillotine" when a warden "lets the blade drop", strengthened by "sacrificing (hanging) another one",
  turned into items "via electric chair" (Atlus via Gematsu), and the menu's subtitles say so (098). The
  military shop hangs the party on dog tags behind a chain-link fence (016); the clinic lists its
  medicines on a dated white sheet (014); the Thieves Den is a place where the player's memories take
  form (Inside Games). The plain name stays: fusion is still "Persona Fusion".
- **Aubaine.** A page may wear an object of Aubaine's own world while each link keeps its exact name, and
  nothing is borrowed from Persona itself. The Almanach's CADRAN screen is not such an object for site
  pages: "the clearly Aubaine DA (and not CADRAN DA, that are different)" (the owner, 2026-10-30). It
  belongs to the Atlas boot.

### 10. Flat fills, tone from halftone

- **Persona 5.** "I tend to not add gradations, but prefer filling in each and every graphic." (Suto,
  2016). "It looks as if everything has been set with wood type and printed incorrectly" (Rendle).
  Halftone dots fill the hair of the portraits (Confidant, 007, 008).
- **Aubaine.** Paper (plates, stickers, tapes, stamps) is flat colour with a hard offset shadow. Tone
  comes from halftone: 1.5 px dots on an 8 px grid on the stage (`StageBackdrop.astro`), 1.3 px on 7 px
  on the slab and the seal (`FramedCard.astro`, `CoverSeal.astro`), 1.4 px on 6 px on a draft card
  (`CoverCard.astro`). Gradients stay on pictures, seals, the stage and the emblem's sheen
  (`FramedCard.astro`).

### The Persona lineage of the approved pieces

The character sheet (approved on 2026-10-27) and the select screen of Arbres and Espèces (approved on
2026-10-28), at commit `a9b3954`, already carry these moves. The pairing is a reading made on 2026-10-30
against viewed screens; the provenance recorded at the time is the Persona 5 Royal site's character select
(2026-10-27). The approved pieces do not move (plan approved on 2026-10-30), so a page that reuses them
keeps each move.

| Approved move | Where (`src/components/primitives/` unless named) | Persona 5 counterpart |
| --- | --- | --- |
| Title words on separate plates, house gold and black in turn, tilted -4°, 2.5°, -2° and 3°; words of three letters or fewer become small plates; the `h1` keeps the whole title as its name | `TitlePlates.astro` | Cut-letter titles: CONFIDANT on a tilted plate, COMMAND (007), "Create New Personas" in a black starburst (098). Persona cuts per letter; Aubaine cuts per word, and never inside an entry's name |
| « Précédent » and « Suivant » steps beside one entry shown big, so the reader browses without leaving the list | `Spotlight.astro`, `src/scripts/select-screen.ts` | L1 and R1 around the Confidant's name plate, and over the weapon list (009) |
| The draft stamp (« Brouillon », set in capitals) at -12° and × 1.45; the rank letters on plates skewed -10°, stamped in one after another, the top grade S inverted | `CoverCard.astro`, `RankProfile.astro` | RANK with its stars, the huge 10 and the boxed MAX (Confidant) |
| The pointed card's key-colour halftone slab | `FramedCard.astro` | The tilted red slab under the pointed service (098); the red band under the pointed weapon (009) |
| The stage takes the pointed entry's art, its blurred cover or its seal colours, crossfaded in 450 ms | `src/scripts/select-screen.ts`, `src/scripts/art-effect/stage.ts` | Joker re-posing for each command (the student blog), seen changing across 007, 008 and 009 |
| Paper that slaps in with an overshoot: title plates in 0.46 s from × 1.4 at -6°, stickers in 0.42 s from × 1.45 at -6° | `TitlePlates.astro`, `DescriptorStickers.astro` | 「動きの素早さやハジけた感じ」, quick movement and a bursting feel (Kumagai); menus that "pulsate and react to every button you press" (Kotaku, 2017). Text only: stills cannot show motion |
| Halftone on the stage, the slab, the seal and the draft veil | `StageBackdrop.astro`, `FramedCard.astro`, `CoverSeal.astro`, `CoverCard.astro` | Halftone in the hair (Confidant, 007, 008) |

## What Aubaine leaves

| Persona 5 | Aubaine instead | Why |
| --- | --- | --- |
| Red, black and white, red the one main colour | A night ground (`--bg` `#06050d`), house gold `#efbe04` for the page's chrome, each entry's key colour for everything it owns | Aubaine keeps the rule beneath the hues (take 1), not the hues |
| Commands in a ring around the character (battle menu; Siliconera; the student blog) | Links in reading order, in rows and columns | The owner turned down the radial command fan on 2026-10-28: "We are not BUILDING A VIDEO GAME. and those layouts you gave are clearly unintuitive for websites." The plan approved on 2026-10-30 records it as rejected. |
| Type on moving axes and baselines; the pause menu's staggered stack (007) | Reading text, the entry's name on its sheet and form fields sit level. Paper, cards and link plates lean a few degrees at most: title plates up to 4°, roster cards with their names -1.8° to 2°, the open link -1.5°, the help square 3°; the draft stamp's -12° is the one larger tilt | Hashino's "It was impossible to read at first"; Inverse's "readability nightmare" |
| Ransom-note letters inside names (the Confidant's name tiles) | A name keeps one face, Cinzel 700, fitted to its column from its letter count (`CharacterHero.astro`, `CoverCard.astro`) | A name is content to read; cut plates stay for titles and stamps |
| Perspective layouts: the Velvet Room's services lie on the floor (098), and the Thieves Den is a room to walk through (Royal) | Flat web pages: doors and cards in a plain grid or column, each one a link | "building weird crooked video-game layouts not meant for web is just bad" (the owner, 2026-10-28); the slanted doors, turned down the same day, came back at the owner's request on 2026-10-30, rebuilt on their panels' geometry, and are kept unshipped as layout D (`prototypes.md`) |

## Candidate uses, none approved

Each needs the owner's verdict, judged live. The Codex has taken the pause menu already: the plate menu,
picked on 2026-10-31 (`approved-pieces.md`).

- **Hubs.**
  - Taken: the pause menu became the Codex's plate menu. Each section's name is a door in Cinzel paper
    plates, one door lit at a time; the lit door's plates turn to bone paper, its pictogram is struck
    huge on a band of its colour, and the stage takes the picture of the page the door opens; no count,
    no tapes, no card. The same list without its scene was judged too plain on 2026-10-30, as was a
    home-menu prototype on 2026-10-29 that set a list of names beside an empty hexagon.
  - From the city map: a door's line can say what is new or ready inside, never a tally.
  - From the Thieves Den: a hub made of its sections' own covers, emblems and pictograms, growing as they
    grow, the walk left out. On 2026-10-27 the owner ruled that hubs "should'nt have a picture / video for
    them anymore" and would "reuse the covers or something like that, something built using threejs /
    webgl or icons".
- **Sheets and panels.**
  - From the Confidant: a title carrying a one-line instruction, sentences level on a dark panel under a
    display-type name, the way out always named.
  - From the Stats screen: the rank profile's note could name what each letter means on an axis, the
    letters staying the visible mark.
- **Controls and wayfinding.**
  - From the battle menu: main choices big, secondary controls such as filters and toggles small in one
    row.
  - From the field HUD: a breadcrumb as two stacked plates, section over page, that stays a list of
    links; a dated thing such as a booklet version as a numeral plate with the day as a small word.
- **Moments.**
  - From the All-Out Attack: one full-bleed card with an entry's own art and line, for a rare and earned
    moment such as the end of a book, dismissable, never on ordinary navigation.
  - From the title screen: the home page's first screen as a quiet living scene of Aubaine's own art,
    motion at the edges, the choices a plain list of links.

## Added on 2026-10-31

A second research pass read Atlus's 2017 talk on the game's interface, its makers' interviews, Atlus's own
pages and the screens in public galleries, and rechecked the links above (none was dead). Every source
below answered on 2026-10-31; three answer scripts only with a challenge and are marked *browser only*.
Pictures were viewed at their source and never copied. What it adds:

- **The package comes first.** Atlus fixes the main colour, then the title logo, then the key font, and
  the character designer starts from the interface and the logo before the uniforms (Suto's CEDEC+KYUSHU
  2017 talk in Persona Central's translation of Famitsu; Soejima to Game Watch, E3 2016).
- **A second colour only where the player acts.** On Persona 3's blue screens, yellow marks only the
  minimum a player needs to act (「ユーザーが行動をおこすために『最低限必要な情報に』」): the screen title,
  『何の』 and 『誰が』. Persona 5 tested a sub-colour in one of its layout prototypes and did not keep it
  (the talk's slides, with Persona Central's translation).
- **Priority through colour, mass and space.** The talk's abstract sets the aim: an interface that
  pursues cool without sacrificing usability (「ユーザビリティを犠牲にせず、カッコいいを追求できるＵＩデザイン
  構築の考え方。」), with layouts that tell the meaning and priority of information through colour, mass
  and space.
- **Pop punk as named moves.** 『ポップパンク』 is shown as 「クラッシュ（衝突）」 and 「ブレイクアウト（打破）」,
  type that dances roughly (「ラフに踊る『フォント』デザイン」) and a broken grid-shaped layout
  (「升目状レイアウトの」, its last word blurred) on slides 02 and 03.
- **Loud first, then calmer.** In Eurogamer's narration of Hashino's account (2017), the first interface
  was aggressively animated and some messages too diagonal; "The orientation of messages was subtly
  rotated, the animations were calmed."
- **Move, then hold the pose.** Mumon Usuda (Atlus) to Dengeki Online in 2020: in Persona 5's interface a
  character moves, then stops dead to show its pose (「ポーズで魅せる」); the talk shows the 2D art drawn
  to match the posed 3D model.
- **Vector art and coordinate sheets.** Because the game shipped on PlayStation 3 and PlayStation 4 at
  once, all texture data was made as paths (「テクスチャデータは全てパスで作成」), and designers handed
  programmers per-part sheets (part name, registered ID, display X and Y).
- **Choices shout, consequences read level.** On the difficulty screen the choices are cut-letter plates
  on a red slash while the explanation is a level paragraph, its irreversible part in red (persona5.jp).
- **Lists stay level inside a dressed frame.** Shop lists are level rows (icon, name, price) in a black
  panel with the pointed row on a red band, and the shop's world dresses the frame (Royal).
- **Waits are scenes of the world.** The change of day runs about 5.6 s and a subway trip about 5 s in
  recorded GIFs; the timings come from frame delays, not from the game.
- **Atlus on the web.** Atlus's US site carries the game's frames onto web pages: tilted black panels,
  star-pattern fills, ransom-letter headings, screenshots in tilted frames, and paragraphs rotated with
  their panels.
- **Derive, never copy Persona.** For Metaphor: ReFantazio, Atlus's interface lead designed the main
  menu first, derived the other screens from it, pinned every screen on a wall to check cohesion, and
  dropped concepts that looked like Persona or would work in any game (GDC 2025 and its reports).
- **New sources for takes 1, 3, 4, 6 and 9**: the talk's colour slides, the gaze-line slide, the English
  pause menu's changing help line, the makers' account of resident menu assets, and the Velvet Room's
  prison words beside plain service names.
- **Readings to treat with care.** The talk's slides are small audience photos: the gaze-line note on
  slide 04, the white note on slide 05, the last word of the grid heading on slide 03 and the caption of
  the 「UI から GUI に」 slide are readings. Royal's Velvet Room starbursts, Joker's finishing card and the
  Baton Pass rank-up were viewed at thumbnail size only.
- **Not found or not read.** Interface In Game has no Persona or Atlus game; the Game UI Database's
  Persona 5 and Royal pages answer scripts with a challenge; GameSpot's 2016 menu article answers HTTP
  403; no slide deck and no 4Gamer or Game Watch report of the 2017 talk was found; Sakurai's Clarity vs.
  Style video was not transcribed, so only its description and press reports are used.

**Atlus's 2017 talk and its slides**

- [セッション｜CEDEC+KYUSHU 2017 (S201: ペルソナシリーズにおけるUIクリエイティブの手法　～ペルソナ５のUI事例～)](https://cedec-kyushu.jp/2017/session/16.html) (2017-10-28; text only): The organisers' own page for the Suto and Wada talk: titles (須藤: アートディレクター＆チーフデザイナー, 1999年アトラス入社。アトラスで初めてのＵＩ専属デザイナーに; 和田: プロダクションサブマネージャー＆プロデューサー＆ディレクター), the abstract (design data and the orders sent to programmers would be shown, Persona 5 and Catherine as cases) and the intended takeaways.
- [Panel on the Concept and Development Behind Persona 5's UI](https://personacentral.com/persona-5-panel-concept-development-ui/) (2017-11-13; viewed): Details of the 2017 talk not in the dossier: tools (Photoshop, Illustrator, After Effects), the package mission, colour then logo then key font, Persona 3's moonlight-yellow and Persona 4's striped sub-colours, a sub-colour tested in the prototypes, the hero's paparazzi pose, textures packed like Tetris, path data for PS3 and PS4 scaling, paper specs over 1,000 sheets, gestures to programmers. Carries 21 photos of the slides (viewed).
- [CEDEC+KYUSHU 2017 slide photo: 動的UIを支える自然な視線誘導 (pause menu with the white line)](https://personacentral.com/wp-content/uploads/2017/11/Persona-5-UI-Slide-04.jpg) (2017-11; viewed): The pause menu (SKILL, ITEM, EQUIP, PERSONA, STATUS, COOPERATION, REQUEST, CALENDAR, SYSTEM over the white hand, COMMAND below) with one vertical white line drawn through it and an annotation pointing at the line.
- [CEDEC+KYUSHU 2017 slide photo: 画面遷移 (screen transitions)](https://personacentral.com/wp-content/uploads/2017/11/Persona-5-UI-Slide-05.jpg) (2017-11; viewed): A tree of thumbnails from TOP to 第2階層 (three screens), 第3階層 and それ以降の階層, with a red note that the layout change is large and a white note about the white line moving last (blurred).
- [CEDEC+KYUSHU 2017 slide photo: ポップパンク, crash and breakout](https://personacentral.com/wp-content/uploads/2017/11/Persona-5-UI-Slide-02.jpg) (2017-11; viewed): Pop punk illustrated by two screens: a Confidant rank screen for 'crash' and the THE SHOW'S OVER finishing card for 'breakout'.
- [CEDEC+KYUSHU 2017 slide photo: ラフに踊る『フォント』デザイン](https://personacentral.com/wp-content/uploads/2017/11/Persona-5-UI-Slide-03.jpg) (2017-11; viewed): Type that dances roughly (the battle screen with 1 MORE) and the grid-shaped layout broken (an item screen on a red stripe); the last word of the second sub-heading is blurred.
- [CEDEC+KYUSHU 2017 slide photo: UI から GUI に (title screen)](https://personacentral.com/wp-content/uploads/2017/11/Persona-5-Title-Screen.jpg) (2017-11; viewed): The title screen (the P5 logo over red figures in a subway corridor) under the heading UI から GUI に, with a caption defining the aim; low resolution.
- [CEDEC+KYUSHU 2017 slide photo: タイトルを印象付けるメインカラー (four titles)](https://personacentral.com/wp-content/uploads/2017/11/Atlus-UI-Color.jpg) (2017-11; viewed): Persona 3 blue, Persona 4 yellow, Persona 5 red and Catherine pink side by side, with the rule for choosing a main colour.
- [CEDEC+KYUSHU 2017 slide photo: タイトルを印象付けるメインカラー (red)](https://personacentral.com/wp-content/uploads/2017/11/Persona-5-UI-Color.jpg) (2017-11; viewed): Why red for Persona 5, beside the key art.
- [CEDEC+KYUSHU 2017 slide photo: UIと共に動き回る3Dモデル, Photoshopでレイアウトデザイン](https://personacentral.com/wp-content/uploads/2017/11/Persona-5-Prototype-UI-01.jpg) (2017-11; viewed): Six rejected Photoshop layouts for the menus (MAIN, SKILL, SYSTEM and others); Persona Central notes one tested a sub-colour.
- [CEDEC+KYUSHU 2017 slide photo: 3Dモデル to 2Dイラスト](https://personacentral.com/wp-content/uploads/2017/11/Persona-5-Prototype-UI-03.jpg) (2017-11; viewed): The posed 3D model on a green ground beside the 2D illustration of the hand drawn to match it.
- [CEDEC+KYUSHU 2017 slide photo: データの実装・座標指定書とプログラマー (texture sheet)](https://personacentral.com/wp-content/uploads/2017/11/Persona-5-UI-Data-01.jpg) (2017-11; viewed): A packed texture sheet of cut letters, numerals, icons and words (TUTORIAL, DATA SAVE, SKILL CARD) and the note that all texture data was made as paths for two resolutions.
- [CEDEC+KYUSHU 2017 slide photo: 状況把握の補助・サブカラー (Persona 3)](https://personacentral.com/wp-content/uploads/2017/11/Modern-Persona-UI-Slide-1.jpg) (2017-11; viewed): Persona 3's blue screens where yellow marks only what is needed to act.
- [CEDEC+KYUSHU 2017 slide photo: ペルソナのUIが、こうなった経緯](https://personacentral.com/wp-content/uploads/2017/11/Persona-3-UI-Slide-01.jpg) (2017-11; viewed): Persona 3's mission (renew the image, win light users, at low cost) leading to a thorough strengthening of the UI.
- [Atlus Reveals The Design Secrets Behind Persona 5’s Distinctive UI](https://www.siliconera.com/atlus-reveals-design-secrets-behind-persona-5s-distinctive-ui/) (2017-11-13; text only): English report of the 2017 talk: each main colour's meaning, central lines, angle and contrast changes, the 3D model ending in a pose, separate designers for menus and battle checking every frame with the programmer.

**Atlus's people in interviews**

- [Persona 5 Developer Interview About UI Design, Sound Design and Music](https://personacentral.com/persona-5-interview-ui-design-sound-music/) (2016-09-11; text only): The full translated answers of art director Sutou, fuller than the SEGAbits excerpt the dossier cites: GUI planned with Soejima since Persona 3, aimed to stand out in magazines aimed at women too, menu data resident in memory for no lag, every menu entry animated, concept and reacting components relayed to programmers, manual work over optimisation tools, inspiration from roads and signs.
- [【先出し週刊ファミ通】『ペルソナ5』アート面、サウンド面のコダワリに迫る開発者インタビュー3本立て！ ディレクター・橋野桂氏によるコラム連載も開始（2016年9月8日発売号）](https://www.famitsu.com/news/201609/07115031.html) (2016-09-07; text only): Confirms the original: a 16-page feature in Weekly Famitsu 22 September 2016 with an interview of art director Suto on GUI design.
- [副島成記×LAM対談：『ペルソナ』『メタファー』キャラの魅力、その根源は「色気」にあり？副島キャラの魅力徹底解剖](https://news.denfaminicogamer.jp/interview/241125m) (2024-11-25; text only): The illustrator LAM joined Atlus as a graphic and UI designer and worked on Persona 5's UI design, seated next to Soejima.
- [副島成記×LAM対談 (page 2: 『ペルソナ３』以降のオシャレUIの出発点、実は……)](https://news.denfaminicogamer.jp/interview/241125m/2) (2024-11-25; text only): Soejima on why the Persona 3 onward style leans on UI and typography: a division of labour where the UI carries the impact.
- [「ペルソナ5」のキャラクターデザイナー副島成記氏が登場!](https://game.watch.impress.co.jp/docs/news/1006008.html) (2016-06-18; text only): Soejima's order of work (UI and logo first, then uniforms) and why red, both in the writer's narration.
- [アクションRPGならではのビジュアル誕生秘話――『ペルソナ5S』特別インタビュー《アートユニット編》](https://dengekionline.com/articles/31306/) (2020-04-21; text only): Mumon Usuda (Atlus, director and chief designer of the Persona team, director of Persona 5 Scramble) names Persona 5's UI motion principle: move, then stop dead and show the pose.
- [橋野 桂氏×マフィア梶田対談［後編］――1周年を迎えた「ペルソナ5」を振り返り，「PROJECT Re FANTASY」への取り組みや橋野氏の人物像について迫る](https://www.4gamer.net/games/367/G036702/20170831100/) (2017-09-15; text only): Hashino shows experiment footage: the crowd rendered in one grey as the protagonist sees it, not adopted; the interviewer links the mood to the loading screens.
- [Let's talk about Persona 5's menus](https://www.eurogamer.net/articles/2017-04-19-lets-talk-about-persona-5s-menus) (2017-04-19; text only): Hashino's account, in the writer's narration, that the first interface was aggressively animated and some messages too diagonal, then toned down; the UI meant to contrast a boring life with a Phantom Thief life.
- [Masahiro Sakurai Shares His Thoughts On Persona 5 And Atlus Games In A Special Video Interview](https://www.siliconera.com/masahiro-sakurai-shares-his-thoughts-on-persona-5-and-atlus-games-in-a-special-video-interview/) (2018-12-27; text only): A single red can read plain until the whole style comes together (Sakurai, in the writer's narration).

**Atlus's own pages**

- [学生ライフ | P５ - ペルソナ５ - 公式サイト](https://persona5.jp/school_life/) (viewed): Eleven official full-size screenshots (all viewed): crowded subway with onomatopoeia, classroom, date HUD, dialogue, the POINT UP!! stats screen, the SELECT the DIFFICULTY screen, a bath scene, a safe room.
- [怪盗ライフ | P５ - ペルソナ５ - 公式サイト](https://persona5.jp/phantom_life/) (viewed): Twenty official full-size screenshots (all viewed): battle with WEAK and 1 MORE, the Japanese battle menu, a Shadow talk, the Mementos map, the Morgana car, the Velvet Room guillotines, a fusion result, the training screen, the rooftop with a deadline.
- [P5R - ペルソナ５ ザ・ロイヤル](https://p5r.jp/) (viewed): Royal's top page: SNS chat, the daily assist command, Royal's Velvet Room, Kichijoji, darts; Atlus names the assist command as a usability gain.
- [P5R - ペルソナ５ ザ・ロイヤル (学生ライフ)](https://p5r.jp/school_life/) (viewed): Royal's school-life screenshots, including the Thieves Den (My Palace) gallery and the Palace Maker shop.
- [P5R - ペルソナ５ ザ・ロイヤル (怪盗ライフ)](https://p5r.jp/phantom_life/) (viewed): Royal's battle, level-up, Challenge Battle, Jose and Mementos screenshots (77 images across the three Royal pages, all viewed as sheets, several full size).
- [Persona 5 Royal on Steam](https://store.steampowered.com/app/1687950/) (2022-10-20; viewed): Nine official English-build screenshots (all viewed): dialogue boxes with name tags, date plates, Violet's finishing card, battle bars, the Kichijoji location plate with minimap.
- [Persona® 5 - Phantom Thief Life](https://atlus.com/persona5/phantom-life.html) (viewed): Atlus's own web pages in the game's frame language: tilted black panels with red and white borders, star-pattern fills, ransom-letter headings, tilted screenshot frames, paragraphs rotated with their panels (info panels downloaded and viewed). The site opens behind a birthdate gate.

**Screens and motion**

- [Official Persona 5 screenshot: POINT UP!! (social stats)](https://persona5.jp/resources/img/school_life/section5_ss2_whole.jpg) (viewed): Five stats on a star, each with pictogram, level and rank word; POINT UP!! in yellow; date plate 5/30 MONDAY 放課後.
- [Official Persona 5 screenshot: SELECT the DIFFICULTY](https://persona5.jp/resources/img/school_life/section6_ss1_whole.jpg) (viewed): Choices as cut-letter plates on a red slash, the pointed one red; a level explanation with the irreversible part in red.
- [Official Persona 5 screenshot: Mementos map](https://persona5.jp/resources/img/phantom_life/section7_ss1_whole.jpg) (viewed): Chained black structures on a red ground; each path on a plate with waiting-room and deepest area numerals, the current one lit cyan; a red plate counting targets.
- [Official Persona 5 screenshot: fusion result](https://persona5.jp/resources/img/phantom_life/section8_ss2_whole.jpg) (viewed): Arcana 太陽 and name ミトラス, LV 39 and NEXT EXP; affinities as tilted icon tiles tagged 耐, 吸, 弱, 無; inherited skills in red 継承 slots; stats as red bars; L1 and R1 around the header.
- [Official Persona 5 screenshot: Velvet Room training](https://persona5.jp/resources/img/phantom_life/section8_ss3_whole.jpg) (viewed): A Persona behind prison bars; services as cut words with prison sub-words over cracked dark blue; the pointed one on a red slab; the warden's line on a plate.
- [Official Persona 5 screenshot: rooftop, deadline and choices](https://persona5.jp/resources/img/phantom_life/section2_ss1_whole.jpg) (viewed): Deadline on a red bar, target and objective on black, choices as tilted plates beside an EXIT sign, date plate 4/19 TUESDAY 放課後.
- [Official Persona 5 Royal screenshot: SNS group chat](https://p5r.jp/resources/img/top/ss/royal3_sec1_ss5_4e007dbae1b656be1eef58c5d9aa55f8.jpg) (viewed): A tall red panel over the dimmed room: SNS in cut letters, message plates with head icons on yellow squares, a framed photo; date plate 5/5 THURSDAY 夜.
- [Official Persona 5 Royal screenshot: daily assist command](https://p5r.jp/resources/img/top/ss/royal3_sec3_item1_ss_059adf75a4583c492bb4125cc718a29a.jpg) (viewed): Commands on crossing red and black slashes around Joker in Shibuya, each with a button glyph and a Japanese verb line.
- [Official Persona 5 Royal screenshot: Velvet Room services](https://p5r.jp/resources/img/top/ss/royal3_sec2_ss2_b535fc906438dfbafedf6d3faa76d1bf.jpg) (viewed): Royal sets the services in black and red starbursts beside the striped prisoner; the warden's line on a red tag (viewed at thumbnail size).
- [Official Persona 5 Royal screenshot: Thieves Den gallery](https://p5r.jp/resources/img/school_life/ss/sec4_ss1_917d8c71ae0c63dbc4103d711d33432c.jpg) (viewed): Framed artworks on dark walls, a circular minimap with a マイパレス plate, control hints along the bottom.
- [Official Persona 5 Royal screenshot: Palace Maker](https://p5r.jp/resources/img/school_life/ss/sec4_ss5_b606d230e12b11c211339d2ecba9cd6b.jpg) (viewed): Category plates stacked and tilted on a red slash, each with its own art and colour, a coin count, a vending machine stage.
- [Official Persona 5 Royal screenshot: Jose's shop](https://p5r.jp/resources/img/phantom_life/ss/sec6_ss5_38a7c5669363a314a17d08c867682e86.jpg) (viewed): Two road-sign plates over a starry sky of yellow stars and moons, silhouettes of Jose and Joker, flower and stamp counters on black plates; captures still to take in the dossier: Jose's shop.
- [Official Persona 5 Royal screenshot: Challenge Battle result](https://p5r.jp/resources/img/phantom_life/ss/sec5_ss8_3d1690c578b0d57ddf00608362d82611.jpg) (viewed): A results screen in blue: huge score, high score, NEW RECORD! plate, each condition stamped CLEAR in a red starburst, OK lower right.
- [Official Persona 5 Royal screenshot: Joker's finishing card](https://p5r.jp/resources/img/phantom_life/ss/sec4_ss2_c8d1bfde696075f4ae84b44e558b3fa4.jpg) (viewed): The All-Out Attack finishing card: Joker in red, black and white with THE SHOW'S OVER running down the left (viewed at thumbnail size).
- [Official Persona 5 Royal screenshot: Baton Pass rank up](https://p5r.jp/resources/img/phantom_life/ss/sec4_ss8_fdb05bc6bc20a5d3f42b29e8e0ba8c02.jpg) (viewed): RANK UP!! in yellow with the rank on a black starburst and green stars, its effects listed, OK (viewed at thumbnail size).
- [Persona 5 Royal on Steam, Screenshot #4 (Violet's finishing card)](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1687950/ss_63d2164bf39a43905e9602381f43a9ad4ab46dea.1920x1080.jpg) (viewed): English build finishing card: the character's own tagline in blackletter on a black banner, roses, pink halftone, red and white cut-out.
- [Persona 5 Royal on Steam, Screenshot #0 (classroom dialogue)](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1687950/ss_663171dc3afce8fe987e57e8659f91b69faa39bc.1920x1080.jpg) (viewed): English dialogue box: tilted white name tag with its first letter inverted, level white text in a black balloon with a jagged tail, portrait cut-in, date plate 5/16 MONDAY Morning, FFWD, Auto, Log.
- [Persona-5-Royal-ss-063 (RPGFan Persona 5 Royal gallery)](https://www.rpgfan.com/wp-content/uploads/2020/06/Persona-5-Royal-ss-063.jpg) (uploaded 2020-06; viewed): The post-battle results screen, listed in the dossier's captures still to take: EXP numeral in a starburst, ITEM plate reading NONE, ¥950 MONEY BONUS! in yellow, Joker in grey halftone, THE SHOW'S OVER down the left edge, 次へ.
- [Persona-5-Royal-ss-108 (RPGFan Persona 5 Royal gallery)](https://www.rpgfan.com/wp-content/uploads/2020/06/Persona-5-Royal-ss-108.jpg) (uploaded 2020-06; viewed): Panther's finishing card: the character with a tagline in pink and cyan script over a pink halftone collage of her motifs.
- [Persona-5-Royal-ss-072 (RPGFan Persona 5 Royal gallery)](https://www.rpgfan.com/wp-content/uploads/2020/06/Persona-5-Royal-ss-072.jpg) (uploaded 2020-06; viewed): RANK UP!! with the current gain lit on a mint plate and the next one greyed beside NEXT; green stars for rank pips.
- [Persona-5-Royal-ss-093 (RPGFan Persona 5 Royal gallery)](https://www.rpgfan.com/wp-content/uploads/2020/06/Persona-5-Royal-ss-093.jpg) (uploaded 2020-06; viewed): A points shop: level list in a black panel with icons and Pt prices, the pointed row on a red band, a white panel with the owned count and a description, the points total on a black plate upper right.
- [Persona-5-Royal-ss-122 (RPGFan Persona 5 Royal gallery)](https://www.rpgfan.com/wp-content/uploads/2020/06/Persona-5-Royal-ss-122.jpg) (uploaded 2020-06; viewed): AWARD in black cut letters, categories on a red ribbon with the pointed one on a blue slab, the completion rate in a black star, gold trophies along a red ribbon on the wall.
- [Persona-5-Royal-ss-126 (RPGFan Persona 5 Royal gallery)](https://www.rpgfan.com/wp-content/uploads/2020/06/Persona-5-Royal-ss-126.jpg) (uploaded 2020-06; viewed): MOVIE menu on red: ARCHIVE pointed on a blue slab with its help line, PV and SPECIAL below, framed screens on the wall, a medal count.
- [Persona-5-Royal-ss-062 (RPGFan Persona 5 Royal gallery)](https://www.rpgfan.com/wp-content/uploads/2020/06/Persona-5-Royal-ss-062.jpg) (uploaded 2020-06; viewed): Three options with point costs, the pointed one on a yellow plate, the resulting value and star meter beside each, the stamp total with the cost subtracted before confirming.
- [Persona-5-Royal-ss-078 (RPGFan Persona 5 Royal gallery)](https://www.rpgfan.com/wp-content/uploads/2020/06/Persona-5-Royal-ss-078.jpg) (uploaded 2020-06; viewed): Shop entry: three choices as stacked white and black plates beside a large portrait of the protagonist; the clerk's line in a dark balloon with a name plate; date plate 7/4 MONDAY 夜.
- [Persona-5-Screenshot-081 (RPGFan Persona 5 gallery)](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-081.jpg) (uploaded 2020-10; viewed): The Japanese build keeps English command words with Japanese verb lines; huge 1 MORE; the enemy's name on a long tilted bar; party HP and SP lower right.
- [Persona-5-Screenshot-088 (RPGFan Persona 5 gallery)](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-088.jpg) (uploaded 2020-10; viewed): Name tag with one inverted letter, black balloon with a jagged white outline and a big white tail, portrait cut-in, date plate 8/18 THURSDAY Evening.
- [Persona-5-Screenshot-022 (RPGFan Persona 5 gallery)](https://www.rpgfan.com/wp-content/uploads/2020/10/Persona-5-Screenshot-022.jpg) (uploaded 2020-10; viewed): The All-Out Attack opening cut-in: four party members in shattered red panels, comic-panel framing.
- [Game UI Database - Persona 5](https://www.gameuidatabase.com/gameData.php?id=72) (text only; *browser only*): The database's Persona 5 page exists: a web search result lists it under this title and URL (id=72). Its screens could not be read by script.
- [Game UI Database - Persona 5 Royal](https://www.gameuidatabase.com/gameData.php?id=618) (text only; *browser only*): The database's Persona 5 Royal page exists: a web search result lists it under this title and URL (id=618). Its screens could not be read by script.
- [You searched for persona | Interface In Game](https://interfaceingame.com/?s=persona) (text only): Interface In Game holds no Persona game: searches for persona, persona 5, metaphor and atlus all return No games found.
- [Persona 5's Menus Continue to Look Stunning](https://www.gamespot.com/articles/persona-5s-menus-continue-to-look-stunning/1100-6439532/) (text only; *browser only*): Exists per web search results (title and URL); a search result attributes it to Chris Pereira, 5 May 2016, with GIFs of menus. Not read.
- [The UI Design of Persona 5](https://jiaxinwen.wordpress.com/2017/04/27/the-ui-design-of-persona-5/) (2017-04-27; viewed): A named designer's analysis: oblique shapes, one inverted letter per title, battle buttons as long triangles pointing at the active character, thick comic borders, English big titles across languages, transition animations (menu call-out, date change, scene change), eye fatigue from constant high contrast.
- [Calling out menu animation (GIF, English build)](https://jiaxinwen.wordpress.com/wp-content/uploads/2017/04/2017-04-28_15-09-10.gif) (2017-04; viewed): Pause menu opening in an English build, frame by frame: the field turns red, Joker's hand and face sweep in by about 0.6 s, the list sits on the hand; per pointed command the help line under COMMAND changes and the big numeral steps 01 to 04; plate MENU: MAIN, SELECT a COMMAND; stickers Don't Look at ME, Like That. Timings from GIF frame delays (about 0.067 s a frame).
- [Changing the date animation (GIF, English build)](https://jiaxinwen.wordpress.com/wp-content/uploads/2017/04/2017-04-28_15-22-58.gif) (2017-04; viewed): The change of day in motion (a dossier capture still to take): the black and white city fades up from black over about 2 s, 20XX 4 upper left, days arc across (9 SATURDAY in blue, 10 SUNDAY larger in red), a knife stabs 11 MONDAY at about 3.2 s, the sky turns from night to morning by about 5.6 s.
- [Changing the scene animation (GIF, English build)](https://jiaxinwen.wordpress.com/wp-content/uploads/2017/04/2017-04-28_15-25-16.gif) (2017-04; viewed): A loading scene (a dossier capture still to take): from the platform the view fades into a crowd of flat beige silhouettes holding straps for about 5 s, then the packed train with a KUH-LACK sound word; the date plate stays up.

**Context: other studios and readings**

- [From 'Persona' to 'Metaphor: ReFantazio': Creating a Visual Identity for a New Series](https://gdcvault.com/play/1035332/From-Persona-to-Metaphor-ReFantazio) (2025-03-20; text only): Atlus's lead interface designer on building a UI identity distinct from Persona; the page marks it free content. The video itself was not watched in this run.
- [［GDC 2025］ゲームの“顔”としてのユーザーインタフェース──「メタファー：リファンタジオ」のUIは，感情を揺さぶる体験の一部](https://www.4gamer.net/games/367/G036702/20250322013/) (2025-03-22; text only): Main menu designed first and reflected into the rest; five rejected concepts; Ise first too conscious of Persona; Hashino's advice; compositions that only work in that world; every visual given a meaning (paint, lines, type).
- [UIデザインが 『メタファー：リファンタジオ』の顔になったとき―アトラスUIデザイナーパネルセッションレポ【GDC2025】](https://www.gamespark.jp/article/2025/03/21/150591.html) (2025-03-21; text only): Second report of Ise's talk: main menu first, then other screens; every screen printed in A3 and pinned up for team review; a composition rejected because it would work in other games.
- [From Scrapped Concepts to Award Winner: Persona and Metaphor: ReFantazio UI Designer Shares the Journey Behind the Game’s Visual Identity](https://noisypixel.net/persona-metaphor-ui-design-evolution/) (2025-03-22; text only): English report of Ise's talk: five scrapped prototypes, some "felt like Persona knockoffs", the four pillars, physical printouts on walls.
- [Clarity vs. Style (UI)](https://www.youtube.com/watch?v=UjW_TTNtXEM) (2022-09-27; text only): Sakurai's episode setting clarity against style, which reports say uses Persona 5 as the stylish example. Not watched: captions were not retrievable by script.
- [Director Masahiro Sakurai Discusses Persona 5 UI in Latest 'Creating Games' Video](https://personacentral.com/masahiro-sakurai-persona-5-ui/) (2022-09-28; text only): Confirms the video discusses Persona 5's UI as the most stylish and Sakurai's favourite.
- [Clair Obscur: Expedition 33 lead says Persona 5 is the “best game in the world” when it comes to UI and combat visuals](https://automaton-media.com/en/news/clair-obscur-expedition-33-lead-says-persona-5-is-the-best-game-in-the-world-when-it-comes-to-ui-and-combat-visuals/) (2025-05-24; text only): A director who borrowed from Persona 5 warns against surface copies.
- [Análise da Interface do Jogo Persona 5 (Interface Analyze of Persona 5 Game)](https://pdf.blucher.com.br/designproceedings/9cidi/1.0048.pdf) (2019; text only): An exploratory study of why fans empathise with the interface (menu cosplay, reviews calling the menus part of the show); conclusion that the appeal partly comes from breaking expectations of RPG interfaces; hypothesis that the interface reads as the character's gear.

## Capture inventory

- **Viewed on 2026-10-30**, read from their source pages and never copied into the repository:
  RPGFan's Persona 5 screenshots 007, 008, 009, 014, 015, 016, 027, 083, 090, 098, 099, 105 and 106,
  RPGFan's Persona 5 Royal screenshot 125, and the student blog's two figures. The rest of RPGFan's
  Persona 5 gallery was looked through as thumbnails; its Royal gallery was opened only for screenshot
  125.
- **Viewed on 2026-10-31**, at their source: every picture marked viewed under Added on 2026-10-31.
- **An earlier set of local captures** (2026-10-27 and 2026-10-28), not kept, held two in-game pictures,
  the student blog's figures. The rest was the Royal marketing site, two pages of the student's notebook,
  an avatar, Atlus 404 pages and the Game UI Database's security check.
- **Not read:** the [Game UI Database](https://www.gameuidatabase.com/) and
  the [Megami Tensei Wiki](https://megamitensei.fandom.com/wiki/Persona_5) answer automated requests with
  HTTP 403 (checked 2026-10-30 and again on 2026-10-31), so no picture was taken from them.

## Captures still to take

From the game or a public gallery: viewed, linked, never committed.

- **Daily life:** the CALENDAR screen and the Confidant list reached from the pause menu; the city map
  showing a place's confidants.
- **Menus:** Mementos requests; a shop in an English build, since the viewed ones are Japanese.
- **Persona 5 Royal:** the Thieves Den as a whole room.
