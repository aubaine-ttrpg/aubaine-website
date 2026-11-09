# Page architecture

What each part of a lore page is for, where each fact lives, and what leaves the page. It is the
lens of `aubaine-lore-gameplay` and the method of the brief's fact map. The craft of telling the
history is `lore.md`; the certainty of each claim is `canon.md`.

## The species page

Under the hero, `src/components/views/Species.astro` prints the opening, then the part « En jeu »,
then the part « Histoire ». The lore page gives the opening (everything before its first `##`) and
« Histoire » (its `##` sections). The species file gives « En jeu », which opens on « Jouer un
<nom> »; `docs/adr/0060-the-species-page-reads-its-play-part-first-and-its-lore-after.md` and
`docs/adr/0074-the-noms-section-opens-on-the-naming-custom-and-reads-every-list-of-a-people.md` set the order of its sections: read them and the view rather than a copy here.
aubaine-content writes that prose; a lore run hands it the fact map.

### What each part is for

- **The opening** is a species summary, the paragraph a published book puts first: what the people
  is, where and how they live, the sound and feel of it, what they love. It holds no history, event,
  war or date; the chapters tell those. About 60 to 130 words. When the owner wrote one, it is the
  opening. In an opening a writer drafts, each sentence says one of these things, in the present, and
  no other people frames it: no enemy, no rival, no outside contempt. A sentence of the owner's
  opening that does not stays where it is (`lore.md` § Start from the owner's text).
- **The epigraph** is the page's one scene (`lore.md` § Quotes and dialogue).
- **« Jouer un <nom> »** says what a character of this people grew up with and carries, in the
  second person and the present tense. It states, and never asks:
  - how they were raised: the customs they kept and what the people expects of them;
  - what they were taught, and where the canon says belief divides the people;
  - what that upbringing left in them: a habit, a skill, a way of speaking, something kept from home;
  - how others treat them, as what strangers do, each view held by whoever holds it;
  - why one of them leaves (sent with the people's blessing, cast out, or with nothing left to return
    to), how each feels about home, and which ties and duties the canon says survive the leaving.

  It holds only what the canon holds: an item the canon lacks is a question for the owner, never a
  sentence a writer adds. A belief the canon gives every member is stated as theirs; where the canon
  leaves members free, the part says so, and where members live a custom in more than one way, it
  states the ways as facts of the people, never as camps to choose between. A city, a war or an
  origin enters only through what it left in the character today, never as a description or a
  history. No question appears, not even a rhetorical one in the people's voice: a question pushes a
  player toward a side. The handbook says a character may depart from their people
  (`data/books/livre-du-joueur/04-les-especes.md` § Jouer son Espèce), so the part states the norm
  plainly and never repeats that freedom.
- **« Noms »** opens on `naming`, one short paragraph on how the people names its members, then the
  name lists. When the owner wrote the people's naming custom, that text is the paragraph, moved as
  written; a shorter one needs the owner's words, and the report lists every detail it leaves out. A
  paragraph a writer drafts from the canon runs about 60 words, where a published book's names
  paragraph runs 30 to 120 (`research.md` § Naming customs). Either way it makes three moves, as far
  as the canon goes:
  - which names a member carries and in what order, with the people's reason;
  - who gives each name and when, and whether it changes over a life;
  - what names draw on, and any second name and who uses it.

  It states the custom as it holds today; how the custom came to be belongs to « Histoire ». It
  invents no example, no meaning for a listed name and no giver the canon does not name: a gap is a
  question for the owner. One paragraph serves the whole people, and a sub-species whose custom differs gets its
  difference as a clause of it. A kind of name with no list, or a label the paragraph contradicts, is
  a question, never a list a writer makes. The lists are data no lore pass touches;
  `docs/runbooks/add-a-species.md` says how « Noms » groups them.
- **« Histoire »** holds one subject per section, and a section's paragraphs share it and follow from
  one another. A broad category such as culture is not a subject, and a title that lists a
  section's contents (« Chants, rites et lames ») is the sign of
  paragraphs that share nothing but the title: each moves to the section of its subject or takes one
  of its own, and a new title never settles it (owner, 2026-11-08). Its titles are narrative, the
  way a lore book names its chapters, from the chapter's own matter: « Un mauvais présage »,
  « Le dernier adieu », « Les derniers Galwariens ». A title names what the chapter tells or what it
  changed for the people. A plain label such as « Société » or « Culture » is refused, and so are a
  pun, an idiom and a tagline that sums up the people in one trait. The naming custom is not a
  chapter: it opens
  « Noms ». Choose the sections from what the canon holds, never from a template: a heading with
  nothing of its own behind it is cut (`.claude/skills/aubaine-prose/references/ai-tells.md`
  § Shape). Common subjects for a people:
  - where they came from, and what made them;
  - where and how they live;
  - power and institutions;
  - what they make and celebrate;
  - how they train and fight;
  - what they believe and forbid;
  - the turning points that still weigh on them;
  - the body.
- **Society and culture never share a section.** Society is who decides, who obeys, what is owed and
  to whom, and how status is won and lost. Culture is what people do, make, celebrate, believe and
  forbid, and holds several subjects (above). An ideal goes where people live by it or against it,
  with the gap between the ideal and the life shown when the canon holds one.
- **A heading about heritage names which heritage it tells.** It may be the story behind a blood
  trait or a gift that a Compétence makes playable, a cultural inheritance, or the body. A
  Compétence holds the mechanic, and the page never restates its rule.

## The tree page

Lore first, then the plate
(`docs/adr/0025-a-tree-node-is-its-skills-page-and-the-plate-sits-beside-it.md` Decision 1). There
is no play part. The opening and the sections tell the tradition the tree belongs to: who practised
it, where it came from, and what it costs or changes. What a character can do with it is the tree's
Compétences.

## One home per fact

A species page reads as two sides: the opening with « En jeu », and « Histoire ». On each side,
every fact lives in one part, the one whose subject it governs; another part of that side may name
it in a bare noun when it needs it, and adds only a new consequence, interpretation or point of view.
A repeated noun is not redundancy; a repeated piece of information is. Across the two sides the owner
allows a light repeat (`rulings.md` § All peoples, 2026-11-08): the opening or « En jeu » may restate
a fact « Histoire » tells, for its own job, and never retells a section. The epigraph keeps its own
rule (`lore.md` § Quotes and dialogue). A tree page has no play part, so the whole page is one side.

An event several peoples share is told in full on one page, the page of the people it shaped most or
the page of the event once one exists. Every other page says only what it did to its own people, in
its own words.

`pnpm lore:survey <target>` counts each term per part and pairs similar sentences across parts,
including `roleplay.text`. It directs the reading; it never decides a cut. A pair across the two sides
is a finding only when one retells the other.

## The fact map

The brief lists every fact the page holds, and every fact about this people a neighbour page tells,
with the page that holds it:

```
| F# | Fact | Status | Home | Action | Owner words | Note |
```

`Status` comes from `canon.md`. `Owner words` cites the owner's words that allow a change to wording
the owner wrote or, on a page of the owner's, a sentence the page gains or keeps that is not the
owner's. A change that `lore.md` § Start from the owner's text does not allow without words, and that
has none, is a note, and such a sentence is a `PROPOSE` row. A lore page in `write` with no owner text
cites the brief's fact for each of its sentences instead.

| Action | Meaning |
| --- | --- |
| KEEP | Stays in its part, as worded. |
| REWRITE | Stays in its part, worded anew. |
| ADD | A sentence the owner's words ask for, in the part those words name or the part whose subject it governs. |
| MOVE | Changes part on this page. |
| MERGE | Two statements of one fact on one side become one, in its home. |
| CUT | Removed: a repeat on one side whose fact keeps its home, or ornament that asserts nothing. |
| CLARIFY | Kept, with its holder, its certainty or its cause made explicit from the canon. |
| MYSTERY | Kept open, as `canon.md` § Certainty survives every edit says. |
| PROPOSE | A move to a page outside the run, or, on a page of the owner's, a sentence no words of the owner ask for, whether the canon lacks its fact or a neighbour page already holds it. It goes to the owner, and leaves the page within the reach of the revision (`lore.md` § Start from the owner's text). |

On the owner's text, each action follows `lore.md` § Start from the owner's text: without the words
it needs, the row is a note for the owner, and a `MOVE` keeps the owner's words as written.

No fact the owner wrote is lost. It leaves the page only when another page already carries it, or
the owner's words drop it, and the report lists it; otherwise it stays in its best home here, and the
move to elsewhere is a `PROPOSE` row.

## Progressive disclosure

- Establish an idea once on its side, in its home. Deepen it later only where the new section has its
  own reason to return to it.
- The opening introduces; « Jouer » applies; the sections tell. On a species page, the opening and
  « En jeu » may restate a fact the sections tell, lightly (§ One home per fact); none of them
  retells another.
- Each section stands alone, since a reader opens any section from the outline (`lore.md` § Tell it
  as history).

## The subject test

Every paragraph of a species page, its lore and its species prose, has its own people as its
subject. Another people enters only through this people:

- its view of them, marked as theirs, measured by this people's own values and named in this
  people's words;
- a bond with them, such as a trade, a debt, a war, a shared descent or a borrowed word, told for
  what it did to this people or what this people does because of it;
- a contrast of one clause at most, which ends on this people.

A sentence about another people's own nature, history or ways belongs on that people's page. A
narrator's verdict on another people, another people used as a yardstick or a punchline, and a
roster of what every people thinks are refused. Kin peoples each tell their bond from their own
side, on their own page. A paragraph of the owner's that fails the test stays where it is
(`lore.md` § Start from the owner's text).

## What leaves the page

A fact can be true and still sit in the wrong place. It leaves the part, or the page, when:

- it belongs to the world, to another people or to an institution another page owns (§ The subject
  test). Who the Oracles or the Weitzguard are is told where they are, not re-explained on every
  page that names them;
- it matters to history but not to play, and it sits in « Jouer »;
- it governs another subject on the same page, as the Oracles' human-only choice belongs with the
  Oracles, not between two sentences on the Weitzguard (`lore-tells.md` § The tells, the stray fact);
- it is a facilitator's secret: there is no MJ-facing surface yet, so it is a `PROPOSE` row.

## Lore and mechanics

Lore tells history and what people believe; a Compétence makes it playable. A lore sentence about
what a people can do agrees with the rule text, and never states a number, a cost or a rule.

A magic has a source and a use the game holds (`.claude/rules/content/authority.md`, which also
says where a magic the game lacks may stand). A page has a people, a faith or an office practise
only a magic whose domain `data/meta/domains.json` holds and that a Compétence the game gives them
draws on through its `domains`, its `tags` naming the practice and the school
(`data/meta/tags.json`). Read those files as they stand, never from an example. As a people's
practice, any other magic is a question for the owner, never a mystery kept open: in
« tissus infusés de magie lunaire » the owner struck « lunaire » and kept « magie » (2026-11-08). A
page also gives a people no tree, Archétype, calling or language the game does not give them, even
through an adjective; `.claude/skills/aubaine-content/references/writing.md` § House craft says the
same of flavour, for a tree, an Archétype or a calling: « méditation druidique » made every elf and
drow a druid. The owner struck the five « druidique » of the elf page as a stock word that dressed
the elves as druids (2026-11-08; `lore-tells.md`, the archetype word).

## Lore types without a schema

Locations, factions and standalone lore are planned and not yet modelled. Nothing here is
authoritative: there is no schema, no runbook and no directory for any of it. When one becomes
real, the schema is written first, a runbook follows, and this guidance becomes the editorial half
of that work. A field named below is a suggestion for a future schema, never a key to add to a file
today; schemas are strict and an unknown key drops the entry.

- **A location** opens with what and where the place is, and gives what characters can notice, do,
  learn, buy, risk or change there. Useful sections: overview, first impression, features, people,
  services or resources, dangers, secrets, connections, current events. No brochure: not every place
  is ancient, bustling, hidden or imposing, and scale serves navigation or play.
- **A faction** is defined by what it wants and what it does. Useful sections: purpose, methods,
  structure, resources, public reputation, internal tensions, allies, rivals, membership, current
  agenda, restricted truths. An internally diverse faction shows the fault line that produces
  decisions, never an adjective. Give its motive, what it will and will not do because of it, what
  it costs a member to break ranks, and its present project: what follows if nobody steps in, and
  how word of it reaches the characters.
- **Standalone lore** opens with identity, not atmosphere. Useful sections: overview, appearance or
  geography, customs, history, relationships, present situation, rumours, restricted truths, related
  entries. Use dates only where the calendar supports them, and no invented precision such as an
  exact population, a founding year or a distance.
