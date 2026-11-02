# The owner's design rulings

Every ruling the owner made about how Aubaine looks, and how design work is done with them. Each one
gives the rule and, except one undated ruling, its date. A correction or a rejection also quotes the
owner's words, because they carry its reason. Quotes dated 2026-10-16 or from 2026-10-23 on were checked
against the stored conversations and are verbatim, typos kept; the earlier ones and the undated one come
from notes written at the time. An approval is recorded as what was approved: a description, its values
or the file that holds them, its capture in `../assets/approved/`, and the date. Read the sections that
touch the task before proposing anything; a ruling is not reopened without a new reason, and losing
context is not one. When the owner corrects, rejects or approves a design, it is added here in the same
change.

The look itself, its values and its principles, is documented in `DESIGN.md` at the repository root;
the values of the approved pieces are in `approved-pieces.md`.

## Contents

- [Working with the owner](#working-with-the-owner)
- [The direction](#the-direction)
- [The approved pieces](#the-approved-pieces)
- [Hubs](#hubs)
- [Layout and composition](#layout-and-composition)
- [Pictures and materials](#pictures-and-materials)
- [Colour, marks and type](#colour-marks-and-type)
- [Motion](#motion)
- [Tools for players](#tools-for-players)
- [Index by date](#index-by-date)

## Working with the owner

**Show it live.** A proposal is built and shown running in the browser, never as stills alone.

> "really show me everything you propose i need to se ethem in action to know" (2026-10-28)

**Professional grade, measured.** Work is held to the standard of a shipped game interface, and every
claim that a layout fits or a bug is gone comes with a measured table or a test that fails before the
fix and passes after it (`measuring.md`).

> "resume, and as i SAID : PROFERSIONNAL QUALITY GRADE, those are not convincing AT ALL" (2026-10-30)

> "Professional qualtiy grade still. Make no mistakes." (2026-10-31)

**Compare plain and composed side by side.** When the owner asks to compare, keep the plain versions on
the review page beside the composed ones.

> "create alternatives so i can compare  with those that are too plain and one that are the one you have now" (2026-10-30)

**Prove an unchanged render live.** When a change must leave a render identical, give the owner the old
and the new running side by side, to see and touch, as well as the pixel counts.

> "i wanted to see like all 6 componets side by side so i can see them with my eyes, touch drag ect..." (2026-10-26)

**Carry the references in files.** Decisions, references and links live in this skill and in
`DESIGN.md`, so work starts from them rather than from memory. On 2026-10-29 the owner had the design
directions then in the repository wiped as wrong and rebuilt from research that keeps every reference
and link.

> "each time you compact it feels like you just rolled new dices, let's have more refrences more links" (2026-10-28)

> 'sadly the current "design" directions given in this repo are wrong and need to be wiped and completly redone.' (2026-10-29)

> "Please fetch as much content as you can to understand each of those artistic directions and keep all references, links and such to build a real design documentation." (2026-10-29)

> "Keep looking for references and such to still alimente our DESIGN.md since it doesn't seem like you really got it right" (2026-10-30)

**Instructions live in this skill; `DESIGN.md` is documentation.** Rules for whoever designs, the
research, the rulings and the measuring methods belong here. `DESIGN.md` describes the look for a
reader.

> "also most of your work should go to a new aubaine-design skill, lots of things you did should acutally be in this skill, with DESIGN.md and other things being docs, a lot of your writtings are clearly ai instruction and those should be swithc to a skill" (2026-10-31)

> "highest quality skill, with references, many many many many links ect... only best practices" (2026-10-31)

**Keep screenshots of accepted pieces only.** A rejected design is recorded here in words; its
screenshot is not kept. The accepted pieces are captured in `../assets/approved/`.

> "also other thing do not put the screenshots of rejections and such, rather just put screenshots if you want in the skill of accepted things no need to have 3412321 pictures each time i reject something" (2026-10-31)

**An approval is recorded as what was approved, not as praise.** Its description, its values or the file
that holds them, its capture (a screenshot, or a film strip for a motion) and its date. The owner's words
are kept for corrections and rejections, where they carry the reason.

> "i want to know whats the point when creating skill to put my approval sentences, it seems useless, i think i get to have screenshots or description of what i approved, but sentences ?" (2026-11-02)

**Link other studios' pictures, never copy them.** Screenshots of the reference games stay out of the
repository and are linked at their source (the owner's pick among proposals, 2026-10-28; `research.md`,
How to cite).

**Never delete art.** A picture no field uses any more moves to the gitignored `data/media/unassigned/`
(`docs/runbooks/add-an-image.md`); it is deleted only when the owner names it.

> "never delete art except if i explicitly say so, if i don't say it just move them to the unused / unassigned thing" (2026-09-25)

## The direction

**Three games.** Persona 5, Deadlock and Hextech, the League of Legends client. World of Warcraft is not
a source (settled 2026-10-30); "Wow" in the brief of 2026-10-23 stays quoted as written. The hub brief of
2026-10-27 named Monster Hunter; the three games of 2026-10-29 leave it out.

> "The DA of Aubaine is quite exotic for a TTRPG : Imagine a mix between Deadlock, The Persona Series (more preciesly Persona 5) and the Hextech from League of Legends." (2026-10-29)

> "Let's look for something more like aubaine's DA, jaw-dropping, but kinda Persona 5-y kinda like Deadlock-y, but with real effects that really feels like Wow. it's unique but it's good" (2026-10-23, the brief of the character sheet)

> "PLease reget the whole Deadlock / Monster Hunter DA more coherent with Aubaine and please. Cook like you did last time. I'm begging." (2026-10-27, the first hub brief)

**The games' feel, a web page's layout.** The feel comes from the games' own in-game screens; the
layout stays a website, with plain links in reading order. No layout comes from a game's marketing
site.

> "it's cool, but unsifficent let's keep them as candidates but they are clearly bad for one simple reason : We are building a website with the VIBE and FEEL of a video game and a DA close to Persona 5 / Deadlock / Hextech. We are not BUILDING A VIDEO GAME. and those layouts you gave are clearly unintuitive for websites." (2026-10-28, the radial fan and the slanted doors)

> "i don't want the feel of a Video Game Webiste, i want the feel of those Video game, Hextech / Persona 5 and Deadlock, just like what you did with the hero of skill trees and species and their lists / hubs." (2026-10-28)

**Research the real screens before designing.** A design pass starts from captured in-game screens of
the same kind of page, never from text searches alone (`research.md`). Three hub headers designed
without that research were rejected on 2026-10-27, and the owner then asked again for the research behind
the first character sheet.

> "please return to plan mode and really search, seek the same infroamtions you did the first time when you checked for the hero of skill tree and specie. that was peak." (2026-10-27)

**One vocabulary, a composition of its own for each kind of page.** Stage, card, paper, type, hexagon
and motion are shared; each kind of page arranges them its own way.

> "the goal is not to clone Skill TREE and Especies, since it's a hub it should feel different. same DA but different." (2026-10-28)

> "I do not wish for a copy of what have been done in the Indexes (Skill Trees and Species) i want something new, that fits our DA that feels unique to match Aubaine's world while being intuitive for people visiting the website just like what was done for both Indexes." (2026-10-29)

**CADRAN belongs to the Atlas boot.** The Almanach's navy screen, its grid, HUD corners, gold frame and
status lines dress the Atlas loader only, never a site page.

> "I see what you meant about CADRAN and thing, but the problem is once you enter Skill Trees for exemple well it's just not the same vibe so i prefere keeping the vibe of our current Skill Trees and Species." (2026-10-30)

> "the clearly Aubaine DA (and not CADRAN DA, that are different)" (2026-10-30)

**Borrow nothing.** A reference game may inspire a style or a layout when the owner asks; never a
name, a label, a joke or a mechanic.

> "Goat not G.O.A.T as G.O.A.T is a great pun but is already used by Deadlock, we don't still ideas here" (2026-10-23)

## The approved pieces

**They are the reference: inspire, never copy.** The character sheet and the select screen are the only
pieces that set the direction; the hub plate menu joined them on 2026-10-31.

> "really the first doing of the heros of skill tree and specie were the perfect reference and those should be the DESIGN.md and just our whole DA, a mix of PERSONA 5, WORLD OF WARCRAFT and DEADLOCK and LEAGUE OF LEGENDS, unique for a TTRPG yet, perfect" (2026-10-27; the games were narrowed to three on 2026-10-29)

> "the only thing already in the repo that fits Aubaine's DA that you can inspire yourself from (but not blindly copy) are the Hero from Skill Tree and Specie page and the Skill Trees and Species Index" (2026-10-29)

**Never touch them without a request.** Work on any other page leaves the sheet, the select screen and
their lists byte for byte as they render (`approved-pieces.md` lists their files and guard tests).

> "nah that's shit please get rid of you work on hubs DO NOT TOUCH SKILL TREES AND SPECIES NOR THEIR LIST ONLY CODEX INDEX BOOKS INDEX" (2026-10-29)

> "Please just assure me that you will not touhc the already validated skill tree index and species index and skill tree and species indivudual pages that were validated you are only reveting your Codex Hub and Book Hub. Right ?" (2026-10-29)

> "you can fix those as you suggested once you are finished with all the commits" (2026-11-01, the owner's request that opened `TitlePlates.astro` and the print rules of the approved pieces: the help button's scroll margin and the stage pages' print, neither visible on screen)

**The approvals.** The character sheet on 2026-10-27 (`../assets/approved/sheet-tree-marchand.jpg`,
`sheet-species-drow.jpg`); the select screen on 2026-10-28, with that day's round on the sheet
(`select-screen-arbres.jpg`); the hub plate menu, B+, and the Livres contents, C+, on 2026-10-31
(`hub-codex.jpg`, `hub-livres.jpg`). Their values are in `approved-pieces.md`.

**The select screen's shape is the owner's pick.** On 2026-10-27, among proposals, the owner chose the
roster on the left and the spotlight on the right, the spotlight on top with ‹ › arrows on a phone, and
the whole screen a dark stage in the light theme too (`approved-pieces.md`, The select screen).

**Every entry is listed, drafts included.** A draft shows by default as a darkened card stamped
« Brouillon » that stays a link (the owner's pick among proposals, 2026-10-27; `approved-pieces.md`,
Drafts).

**What the approval kept as it is.** The sheet's arrival of about 1.6 s and its ghost name and slab
running past the screen's edge stay as approved. New pieces keep the arrival rule that Decision 1 of
`docs/adr/0054-the-hero-of-a-tree-or-a-species-is-a-character-sheet-on-a-living-stage.md` set for the
sheet: in CSS only, under 700 ms, with transforms and opacity, and nothing that matters starts
invisible. The nothing-cut rule governs them too (all settled 2026-10-30).

## Hubs

**A hub is never the select screen, nor a rearrangement of its cards.** A hub leads to sections and
needs a structure and a focal object of its own.

> "hubs don't feel like hubs at all they just feel like copies of skills trees but with pages isntead of skill trees." (2026-10-28)

> "for both hubs in Aubaine's DA it really feels an awful lot like SkillTrees and Species Indexes it's like a reformated version of those indexes" (2026-10-30, the poster wall)

**A page's layout is read from the code, never assumed from its kind.** The old rule that every list
page opens as a select screen was wrong; `src/components/views/View.astro` maps each route to its view.

> "just wrong design. and it's false" (2026-10-29)

**The poster wall was kept only as the baseline.** Asked on 2026-10-29 whether the Codex hub should be
the Almanach's CADRAN screen or keep the night stage and paper, the owner asked for both, and the poster
wall was built beside the CADRAN screen. On 2026-10-30, in the message that found it a reformatted index
(quoted above), the owner kept it as Layout A, the baseline for the other layouts they asked for. It was
removed on 2026-10-31, when B+ shipped and only C+ and D were kept for another page.

> "could you do both and let me see each one please ?" (2026-10-29)

> "keep the Aubaine's DA you already created as Layout A and propoe other layouts that still fits the DA but feels differnet ?" (2026-10-30)

**A hub is composed at a game interface's density.** A list of big names on the stage, or a plain
printed sheet, is not enough.

> "resume, and as i SAID : PROFERSIONNAL QUALITY GRADE, those are not convincing AT ALL" (2026-10-30, the plain plate menu B and the plain catalogue sheet C)

**The sections' paintings are blurred stage light only.** No sharp painting and no tipped-in cover on a
hub; its focal object is built from type, paper and marks, such as a kind's pictogram struck large in
halftone, paper plates, slanted bands and hexagon lattices, set on the living stage (examples, not the
owner's words).

> "Blurred stage light only" (2026-10-30, answering "Should a hub show the sections' paintings sharp and whole, or keep them as blurred stage light?")

**A door is its mark, its exact name and one line, and no count.** A door is named exactly as the page
it opens; the first door is lit softly at rest and never marked `aria-current`; touch never selects by
hovering; the last pointed door stays lit like a menu cursor; a door shows the light of the page it
opens (the round-3 plan the owner approved on 2026-10-30).

> "what's the point of having the number of each if it is shown afterwards with the number of results ?" (2026-10-27)

**The slanted doors came back for a professional rebuild.** Kept only as candidates on 2026-10-28 (see
The direction) and rejected outright by the round-3 plan of 2026-10-30, the slanted doors were brought
back by the owner that evening, to be redone at professional quality grade, and became D. The request
below suggests that the 2026-10-28 verdict was on crude execution as much as on the idea (a reading, not
the owner's words).

> "Actually for hub do both show me the diff alternatives too and please reod with PROFESISONAL QUALTIY GRADE the Side by side one that were proposed by another agent earlier. the one that really feel like a Persona Menu, except it was really bad when done by the other agent, try do it better. PROFESIONNAL QUALITY GRADE" (2026-10-30)

**A Codex door name holds one line on a desktop.** From 960 px wide the names are sized so the widest whole
name fits on one line, so « Arbres de compétences » no longer breaks on a large screen with its slab stretched
past it (`approved-pieces.md`, The hub plate menu).

> "it comes back to one line when i'm on my laptop screen, and 2 lines on my big screen" (2026-11-02)

> "why is the background so far ? make a decision either you rollback and have it the same disposition (in one line) or you adapt the background (i prefer having only one line)" (2026-11-02)

**The plate menu opens the Codex.** B+, the composed plate menu, opens the Codex in both languages
(`approved-pieces.md`, The hub plate menu). It first opened Livres too, until the contents spread took
Livres the same day. The owner's pick, 2026-10-31.

**The contents spread opens Livres.** C+, the Sommaire spread, opens Livres in both languages
(`approved-pieces.md`, The Livres contents), one entry per book category and the archives last. The
owner's pick, 2026-10-31, keeping B+ for the Codex; they left the details of Books to the designer.

> "i'll let you cook for Books. Be smart. Professional. Make no mistakes." (2026-10-31)

**The slanted doors are kept for another page.** D stays built and audited on the gated reserve page
(`prototypes.md`), for a page that needs it later; it is not deleted and not shipped. C+ was kept there
too until it shipped for Livres.

> "let's keep D possibly for later for something else and C+ too, let's not waist them but rather keep them for something" (2026-10-31)

**Book categories.** Books are grouped in categories; each has its own page, an entry on the Livres hub
and in the header's Livres menu, whether it holds something or not. A category with nothing yet says so
on its page with the house empty state (`EmptyState.astro`) and a way back to all books, and stays out
of search; until 2026-10-31 such a category had no page. Ressources holds whatever can be printed to
help a game and is not a rule book. The owner named the categories and picked their marks.

> 'for C+ put all the categories we talked about, it will jsut say "none found" with our default placeholder when there is no data.' (2026-10-31)

> "Books should know have categories (rule books, booklets, stories and maybe others laters)" (2026-10-29)

> 'most printable pdfs, (for later) character sheets + trees + compondium + helps ect... anything that is not a rule book and can be printed to help people for their game, i forgot that there should also be an adventure category. also everything will be printable at some point so i guess "booklets" should be player ressources if you really want a rule (as i said, trees, archetype helpers, character sheets, ect... ect...)' (2026-10-29, asked what the « Livrets » category should hold, which became Ressources)

> "categories : Livres de régles / Ressource / Aventures / Histoires" (2026-10-29, asked what the header's Livres menu should list)

> "For Books : For livres des régles let's keep the color and use game-icons:book-cover, for ressource keep the color and use game-icons:folded-paper, for aventures game-icons:wax-seal and d98a2b and for stories game-icons:quill-ink b9b4d6." (2026-10-30)

**The archives belong to Livres.** The earlier versions of Aubaine and their booklets (the archives
page) are the last entry of the Livres hub and of its menu, and the archives pages sit in the Livres
section of the header. Their mark, like any new mark, is the owner's pick from rendered previews; until
the owner picks, `ARCHIVES_MARK` holds the designer's placeholder, and the candidates are live on the
gated page (`prototypes.md`).

> "and in additino i think you can add archives for the old books and older versions anyway" (2026-10-31)

**A category's page may take the select screen.** The Livres category pages list their books on the
select screen (`src/components/views/BookCategory.astro`), which the owner allowed for books.

> "maybe you can keep the skill tree/ species layout for books" (2026-10-28)

**Rejected for hubs.** Hubs built as copies of the select screen (2026-10-28); a radial command fan
(2026-10-28, rejected outright 2026-10-30); the nine prototypes of 2026-10-29 (a ledger, a collection,
tiles, sections, bookmarks, chips, Hextech histories and two homes); the Codex as the CADRAN screen
(2026-10-30); the poster wall, Layout A (2026-10-30, removed 2026-10-31); the plain plate menu B and the
plain catalogue sheet C (2026-10-30). What the nine prototypes share (a reading of the captures, not the
owner's words): a stage tinted gold by its own colours under a gold title, the League client's utility
layer copied in thin gold lines, square tiles with an initial in place of entries, covers fanned on
tiles, and no focal object. A one-word title on a single gold plate and a seal with its initial remain
approved where the approved pieces use them.

## Layout and composition

**A header never repeats the list below it.** No tally the results already give, no hand of cards, no
sigils or covers that link where the list links, no decorative cut above the search field, no compact
band in place of the stage. The select screen's answer, found on 2026-10-27, is a spotlight that follows
the card the reader points at, so nothing repeats. A screen's explanation goes in the help note beside
its title, with its handbook chapter.

> "what's the point of having the number of each if it is shown afterwards with the number of results ?" (2026-10-27)

> "the 5 displayed cards make no sense. and the slash doesn't make sens too it joust create a big gap about the search field" (2026-10-27)

> "nah bro that's ugly it ain't epic anymore" (2026-10-27, the compact band)

> "or even better, let's just drop both the explanations" (2026-10-28)

> 'maybe put a helper smoehere near the "SPECEIS" or "SKILL TREE" thing that displays those helps with a link to PHB related chapter' (2026-10-28)

**Nothing is cut by its frame.** No piece is clipped by its container or by the screen; panels stay
compact and portrait; offset shadows keep their proportion to the piece; no band of shade sits behind
controls. Audit every entry at real browser sizes in both languages before showing (`measuring.md`).
The first spotlight, as measured on 2026-10-28 at 1512 × 982 (a measurement, not the owner's words):
612 px wide, its ghost name cut by 52 px, its 240 px card casting the sheet's 14 / 16 px shadow, which
read as a black block, and a dark band behind its buttons.

> "it's not bad but i find it way too wide, there are some crops and some weird black shadows. it's a godd start, let's iterate. make it better. Make no mistakes" (2026-10-28, the first spotlight)

**Pieces sit on the shape.** On a slanted panel, a cut plate or any collage, every name, mark and
pictogram has a stated place on the shape (its axis, an edge, a corner), is counter-transformed on its
own and is measured inside the painted shape with clearance. Text over a frame's edge is Aubaine's
collage only when it is placed there on purpose.

> "bro th'as exactly what i told the other agent look at the screen, the developped version is atrocious, text is coming the divs, which is okay it'skinda our DA but that aint aestetic at all in this configuration, and the icon is just, idk it's just not positionned at all, it feels like dom is just doing whatever it wants" (2026-10-31, the first rebuild of the slanted doors)

**Not dead straight.** Cards and headers rest a degree or two off level, like paper.

> "it's still way too straight" (2026-10-27, the hub headers)

> "the cover still is way too straigh" (2026-10-27, the roster's cards)

**One layout for every entry of a screen.** Two entries compare at a glance; reserve the room the
longest entry needs.

> "i'd really like to have a beautiful layout that doesn't change much between things" (2026-10-28)

> "reduce font size of propeties (9 M, Moyenne, Humanoide ect...) so they always are in only one row" (2026-10-28)

**The card is the showcase.** Overlap the card rather than shrink it.

> "i don't like the fact that covers are smaller now, profile is the perfect size but maybe not the perfect place, it should stay the same size but be moved so the card can be really the showcase" (2026-10-28)

> "on medium it's not centered and still seems a side thing" (2026-10-28)

**The main action takes its row.**

> "the flex container of pause + side arrows + ouvrir la fleche should have ouvrir la fleche take the entire container" (2026-10-28)

**A list names a tree by its kind only.**

> "For the cards let's maybe only display : Archetype or only display Domain no need to say tree we already are in the skill trees." (2026-10-28)

**Never is not "not yet".** Where a value can exist but is not set, show « ? » rather than fake data or
nothing; where a kind of entry can never have it, show nothing.

> 'on unknown profile we should display a "?" instead of fake data or just not displaying a profile' (2026-10-28)

> "species don't have profiles, so it should be shown in them because they will never be, there is a huge diff between having the possibility of having profiels and just haven't had profiles filled yet" (2026-10-28)

**Drop what carries nothing.**

> 'the "profile" is not that usefull only the profile itself is usefull' (2026-10-28)

> "maybe adding a black background only to the graph it self instead of the whole profile thing ?" (2026-10-28)

**Flat controls over labelled groups.** A small section that lists destinations, such as
« Où l’obtenir », is one wrapping row of buttons, each with its kind's icon, deep linking to the most
specific target (a tree's node rather than the tree, an origin's anchor rather than the species page), a
native popover for a note. No label heads a group of buttons and no caption repeats a call to action,
as « Proposée par une Espèce » and « Voir l’espèce » did there until 2026-09-25.

> "just buttons… much simpler and better ui and ux" (2026-09-25)

The owner approved the result on 2026-09-25; no capture was kept.

**Level up, don't strip down.** When two components doing one job differ, give the plainer one the
richer one's treatment; the fault is the difference, not the richer one's weight. Remove an element only
when it causes the mismatch, such as a second vertical rule where the other component has none. The book
and policy rails were unified this way
(`docs/adr/0018-a-reader-reads-markdown-and-one-reading-page.md`, Decision 2).

> "keep the decorations, if dnd can do it so can we" (undated, the book sidebar)

## Pictures and materials

**One 3:4 picture per entry.** It serves the card, the sheet, the booklet's front and the social image
(`docs/adr/0053-hero-art-is-developed-on-the-gpu-over-its-plain-picture.md`, Decision 1). Never ask for
a second shape, and never offer post-processing as the cure for generated-art smoothing.

> "only constraint keep the 3:4 aspect ratio image" (2026-10-23)

> 'none fix the slop problem, 3_4 does because for some reason gpt image generated in 3:4 ain't sloppy and also if we don't do 16:9 + 3:4 it allows use to use less generative AI it's more "ethical"' (2026-10-23)

**No picture or video made for one page.** A page reuses what the game already has: covers, emblems,
heraldry, pictograms, or WebGL drawn from them. The Home video and the index pages' 16:9 banners predate
the rule; on 2026-10-28 the owner chose to change the index pages in a later batch.

> "HUBs should'nt have a picture / video for them anymore. just like specie and skill tree we will either reuse the covers or something like that, something built using threejs / webgl or icons but not something only for them" (2026-10-27)

**A seal for an entry without a cover, its initial at the centre of the logo's hexagons.**

> "the new programtically generated cover should be shown instead of the image placeholder" (2026-10-28)

> "i prefer names as icons are already showed on top right" (2026-10-28)

> "Please for the no-image covers have the logo centered." (2026-10-28)

**The card's frame stays bare; the emblem stands alone.**

> "also if you can remove crest and the corners svg of the fram, ithink ti's better without those" (2026-10-23)

> "Do you think we can try only th emplem with no seal ?" (2026-10-23)

> "can the emblems be bigger please ?" (2026-10-23), then "it's perfect but could add some relief on it", then "iactually could we roll back to the first one emblem please not the previous one the one before that one"

**Real materials, never drawn ones.** Heraldry, frames and hangers use scanned or baked materials lit on
the GPU, never a gradient pretending to be metal, and gold stays vibrant
(`docs/adr/0059-a-sub-species-may-fly-its-heraldry-as-cloth-and-a-painting-hangs-under-glass.md`): CC0
scans credited in `TEXTURE_WORKS`, models baked by `pnpm media:textures`, live shading lit by the same
room. Tint a metal's reflections by the metal itself and keep its highlights gold, not white; reach for a
scanned or modelled asset before drawing a material, and credit every third-party file. For the rebuild
of the Victoria arms the owner chose a translucent jewel enamel and the exact composition, with only the
rim made a stepped bezel (2026-10-27, the same record, Decision 7).

> "all that was made is ai-slop" (2026-10-26, the first drawn painting frame, banner and flag)

> "the ugly ai-slop banner hanger that seems to come from a 1970 bad cgi movie" (2026-10-26)

> "perfect could you just make the yellow / gold a little more vibrant it still had that weird dark-dusty effect." (2026-10-26)

> "it just looks like clay, and it's blurry, it really looks like old 3D games from 1980. Please update it to be profesisonnal quality grade just like Triple A Assets matching our stylised fantasy artistic directlion. Keep it extremly well optimized." (2026-10-27, the Victoria arms)

**Lit pieces: realism from light and shadow, not gloss.** Aim between glare and flat, and measure the
luminance at rest and at two far pointer positions (`measuring.md`).

> "please let's reduce ligthing and gloss it's unbearable", then "slgithly brighter and if you can slightly tilt it when hovering just like the card", "it seems blurry", "you can reput some realistic lighting but without being too blinding" and "more realistic add it still but still it should be not that glossy" (2026-10-26, the Victoria arms)

## Colour, marks and type

**The pointy-top hexagon is the mark.** Markers, bullets and badges are pointy-top hexagons like the
logo, never diamonds; the Atlas's landmark labels took hexagons, and the Eden map's emblem is a Celtic
tree of life inside a hexagon. Draw a hexagon that needs a glow or an outline as an inline SVG polygon,
since `clip-path` cuts shadows.

> "just like our logo or the charactersitc key term" (2026-10-16)

**« Codex » names the indexes**, after the Almanach's own property « Codex » in
`data/equipment/items/almanach.json` (settled 2026-10-16); the site is Aubaine, never "the codex".

**One colour and one pictogram per kind of content, everywhere** (`KIND_MARKS` in
`src/lib/game/kind-marks.ts`, `.claude/rules/frontend/kind-marks.md`). The owner picked the marks from
rendered previews on 2026-10-28; their "elf-tree" was read as `game-icons:elf-ear`, which the DNA
pictogram replaced as the Espèces mark on 2026-10-29.

> "i'd like (as a rule) to be sure that whenever we talk about skill trees or skills ect... to always reuse the same colors and icons, coherence is the key for leanring for users (as far as i know) so with those things i choose i'd like to have maybe some kind of enums or such taht can later be reused for keywords or sources on rules / skills ect...." (2026-10-28)

> "change it to dna please" (2026-10-29)

**Colours are identity, not families.** Each state and effect keeps its own colour; never group them into
one colour per family.

> "unicity of color kind of drive everything down" (2026-09-27)

> "part of the DNA of states and effect" (2026-09-27)

**The key colour comes from the entry's own painting.**

> "let's see if we can make the color of the epiteph, slab and frame ect... to be changed with the main color of the artwork, red for nnor, slight gold / beige for marchand ect..." (2026-10-23)

**No colour is reserved for a section.** Blue is an identity colour like any other, as Humain's azure and
the Règles kind blue show; the coverless species seal's violet equals the Compétences violet and stays
as approved (both settled 2026-10-30).

**The Elfe wears forest green.** Its cover reads a pale rose, as Humain's does, so the species writes the
`keyColour` `#4fa866` (OKLCH 0.66, 0.13, hue 150), the weight of Humain's azure.

> "let's have a greenish forest color for elves" (2026-11-02)

**Shorter labels.**

> "Characteristique Dominante should be reduced to characteristique" (2026-10-28)

## Motion

**Motion rides the load.** An animation may play over a real wait; it never adds one, and hand-offs are
instant (`docs/adr/0012-the-header-outlives-the-page.md`, Decision 3). Reuse the house crest
(`src/components/shell/LoadingCrest.astro`, `src/scripts/loading.ts`) or an entrance on arrival, never a
timer that holds the reader. The answer quoted below also asked for a bar with the logo alone on the
threshold page at `/`, the header's controls popping in once the home arrives
(`docs/adr/0021-the-root-is-a-threshold-that-routes-the-reader-by-language.md`, Decision 3).

> "you can use the loading animation too, but no need to wait before moving on, be instant" (2026-09-25)

**The empty screen between pages goes.** The brief of the page transitions, on hubs, indexes and sheets,
with their hovers. It reopens the crossfade of `docs/adr/0012-the-header-outlives-the-page.md`, Decision 3.

> "We are using Swup in order to create a single-page app / video game feel, except currently no transitions exists between the HUBs, indexes and indivudale pages. It's just a blank screen and then nothing else." (2026-11-01)

**The page change: what you chose becomes the next page.** Among four live looks the owner picked B, The
Pick, on 2026-11-01 (`docs/adr/0066-a-page-change-is-a-view-transition-where-the-choice-carries-across.md`).
They picked it from the descriptions, because the looks then moved too fast to tell apart (the next
ruling).

**A motion has to be seen.** The first timing met its numbers and showed nothing: a 300 ms flight on `--ease`
crossed most of its travel in 94 ms. Judge a motion by how long it takes to cross, and film it
(`measuring.md`, design:transit).

> "i don't see any diff really, it seems that everything is too quick to see, maybe cuz i'm on firefox or maybe cuz my pc is lagging idk." (2026-11-01)

**A draft card flies with its stamp.** A draft's card travels like any other, darkened and stamped
« Brouillon » as the roster shows it. Approved on 2026-11-01; no capture was kept.

**Livres closes like a book, the title leaving first.** The closing is the owner's idea. The first build
closed the book with the title on it, and the owner called it ugly: the title and the help button leave the
screen first, then the book closes, and Back runs it in reverse. The crest on the closed book and its throw
off the screen are the designer's, and the edge keeps to the 700 ms of the arrival rule.

> "Maybe for Livres -> any category we can try having the book closing itself and then having the rest arriving ?" (2026-11-01)

> "for the book thing maybe let's do Livres + helper on book goes out of screeen and then the book close cuz that just ugly the way you did it now and of course on back the book should do the same anim but reverse (he comes up, then opens, then title and help button descends)" (2026-11-01)

**The whole sheet travels, both ways.** Index to sheet is not one card shrinking: every part moves to its
counterpart, and Back reverses it as the book does.

> "when going back form specie / skill tree to their index, it seems like the animation is just a regualar one, instead of having the card, profile and such shrinking and going back into their index places, actually the whole Index to skill tree / species feels lame, because only the card is shrinking, and it's only one way, it should both, reversed just like the book, and all the elements should move like the profile epiteph characteristic and propreties ect... to really make it smooth. don't froget :  Video Game feel, profesionnal quality grade, not geneirc bullshit. make no mistakes" (2026-11-01)

**No frame nobody meant, and the title moves as paper.** Temporary pieces must paint exactly as what they
stand for, and leave as the motion ends, so no frame can show them. The title and the help button use the
house's paper moves (peel, fall, settle, stamp), never one plain slide. Check real painted frames with
`pnpm design:transit --pops`: a film sought frame by frame cannot see what paints before or after the motion.

> "Something werid happens on the last few frames when going back from a book category to the hub, there is like a frame that shows the aubaine logo at the end of the go back animation, it's clearly visible because it makes the whole left page white with the logo appearing altough it's only for a few ms. Fix it and make sure those kinda bugs don't happen in any other transitions or animations. also make the title + help button appearance / diseaparence smoother and matching our DA not that dumb animation we currently have that is tasteless. Professional grade work only. Make no mistakes." (2026-11-01)

**A page change is smooth, and Aubaine is not a comic book.** A flat wedge, a starburst, flipping cards and parts
slapping in flight were built on 2026-11-01 and rejected the same day. The cause was two errors: battle flourishes
read as menu language, and motion judged on Chromium while the owner uses Firefox. A page change carries pieces on
one curve, and the life comes from the approved arrivals on landing. Measure on real Firefox, on the GPU
(`measuring.md`). Check a reference's shipped code or footage before saying what it does.

> "bro wtf is this, we aint a comic book. it's heavy, not smooth at all, it's saccadé, it's shit. please refetch data you clearly don't have enough, this aint persona nor hextech nor deadlock, it's just shitty, it doesn't fit aubaine at all." (2026-11-01)

**Pieces should not only slide.** Settled on 2026-11-02: every part travels on one slow-in, slow-out curve, and
the life comes from the approved arrivals once it lands (the emblem presses, the radar unfolds, the grades
stamp), with no effect on the journey.

> "this just feel sloppy to have just sliding elemnts, DEADLOCK AND PERSON 5 designs do not just slide they animate they make things livings" (2026-11-01)

Approved on 2026-11-02. The values are in `src/scripts/page-score.ts`: every part travels 400 ms on
`--ease-carry`, in four masses 0 to 60 ms apart, reversed on Back. Film strips, index to sheet and back:
`../assets/approved/page-change-sheet-open.jpg`, `page-change-sheet-back.jpg`.

**On Back, what stays is whole when the pieces land.** The roster and the other doors fade in over the last
220 ms of the flight, not after it, so the screen never sits half empty once the pieces are home.

> "let's fix the back gap then" (2026-11-02, on the roster fading in only after the pieces had landed)

**The stage stays alive through a page change.** The living stage, its halftone and its shade never drop out
while pieces fly: the light keeps drifting from one page to the next, and the painting crossfades when it
changes. The stand-in that hid them during the motion was withdrawn on 2026-11-02.

> "the flares and others vfx are not loaded which mean when we arrive there is just a blurred background and nothing else and the rest (vfx, pointillé ect...) appears suddenly with no transtions. My hope is to be able to just not have them disapear and have a cool background transitions." (2026-11-02)

**The flying card replaces the sheet card's landing, on those visits only.** A direct load keeps the
approved arrival. The owner's pick among proposals, 2026-11-01, of "Flight replaces it".

**Back returns where you were.** The scroll comes back, the spotlight or the lit door returns to the entry
left, and the card flies home if it is on screen; a fresh visit still opens on the lead. The owner's pick
among proposals, 2026-11-01, of "Return where you were".

**The profile unfolds from its centre.**

> "The graph points should all begin at center and slide to the corect position creating a smooth animation" (2026-10-23)

**A lit piece leans like the card.**

> "slgithly brighter and if you can slightly tilt it when hovering just like the card" (2026-10-26)

## Tools for players

**Readable first.** In a tool for players, such as the Atlas, readability and use outrank the setting's
physics: keep the lore's structure (stars, seasons) and hold the output in a readable band, measured
before and after as the mean sRGB luma and the saturation of the canvas, with the interface hidden
(`docs/adr/0043-the-atlas-renders-scaled-tiers-under-three-stars-behind-a-fog-of-war.md`, Decision 2).
On 2026-10-16 the owner found the Atlas 'way too "bright"' once its light followed the triple-star bible,
and praised the Saison slider.

## Index by date

| Date | Rulings |
| --- | --- |
| 2026-09-25 | never delete art; motion rides the load; flat controls |
| 2026-09-27 | colours are identity, not families |
| 2026-10-16 | the hexagon is the mark; « Codex » names the indexes; the Atlas reads first |
| 2026-10-23 | the sheet's brief; one 3:4 picture; the key colour from the painting; a bare frame and a lone emblem; the profile's unfold; borrow nothing |
| 2026-10-26 | real materials; lit pieces calm; live side by side |
| 2026-10-27 | the sheet approved; the select screen's shape; every entry listed, drafts included; the first hub brief; no picture made for a page; headers never repeat the list; not dead straight; research before designing; the arms' enamel and composition |
| 2026-10-28 | show it live; the select screen approved and its review; in-game feel, web layout; hubs are not select screens; a category's page may take the select screen; nothing cut; one mark per kind; carry the references in files; other studios' pictures linked |
| 2026-10-29 | three games; the old directions wiped; the approved pieces untouched; book categories, Ressources and the Livres menu; both Codex looks; the Espèces DNA mark; a layout is read from the code |
| 2026-10-30 | professional grade, measured; plain beside composed; World of Warcraft out; the radial fan rejected outright; CADRAN is the Atlas boot's; the poster wall reformats an index, kept as Layout A; more references for `DESIGN.md`; B and C too plain; blurred stage light only; a door is its mark, its name and one line; the slanted doors back; category marks; no reserved colour; the sheet's arrival kept, new pieces under 700 ms |
| 2026-11-01 | the empty screen between pages goes; B, the pick carries across; a motion has to be seen; a draft card flies; Livres closes like a book; no frame nobody meant, the title moves as paper; the whole sheet travels, both ways; the flying card replaces the landing on those visits; Back returns where you were |
| 2026-10-31 | pieces sit on the shape; B+ ships; C+ and D kept, the poster wall dropped; this skill; accepted screenshots only; highest quality, many links; the contents spread opens Livres and the plate menu the Codex; every category listed, the empty ones saying so; the archives in Livres; Books left to the designer |
| 2026-11-01 | the help button's margin and the stage pages' print, by request |
| 2026-11-02 | the carry on one curve with live arrivals on landing, approved; what stays is whole when the pieces land; approvals recorded as what was approved; the stage stays alive through a page change; the Elfe wears forest green; a Codex door name holds one line on a desktop |
