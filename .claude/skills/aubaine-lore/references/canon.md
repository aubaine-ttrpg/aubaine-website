# Canon

The lens of `aubaine-lore-canon`, which reads and edits nothing. It turns a page into a ledger of
claims, says what in the repository supports each one, and says how sure the world itself is of it.
The repository is the only authority for Aubaine's canon (`.claude/rules/content/authority.md`).

## What counts as a claim

- A proper noun: a people, a place, a person, a deity, an institution, an event.
- A cause: why something happened or holds.
- An agent: who did it, who decides, who rules.
- A relationship between named peoples or characters.
- A date, an era, an order of events.
- A number: a lifespan, a height, a count, a distance.
- A single word that asserts on its own, such as « exilé », « conquis » or « fondé »
  (`.claude/skills/aubaine-prose/references/claims-and-evidence.md` § A single word can assert
  canon).
- A belief, a doctrine or a custom said to hold for a whole people.
- A magic a people, a faith or an office practises, and anything else of the kinds
  `architecture.md` § Lore and mechanics names (a tree, for one) that a page gives a people, even
  through an adjective such as « druidique ». Read that section for the whole list.
- A sentence a player could act on at the table. Lore never creates a mechanic; such a sentence is a
  finding for the Compétences, not for the page.

## Where support comes from

Look in this order and stop at the first that settles the claim.

1. The owner's text for this run (`lore.md` § Start from the owner's text), and every owner answer
   `request.md` records verbatim, which settles canon; only wording the owner writes for the page is
   owner text.
2. A ruling in `rulings.md` that no page carries yet.
3. Another lore page, a book chapter or an entity file that shares the people, the place or the
   event, newest first by `git log -1 --format=%cs`. The species file and the rule text of its
   Compétences say what a people can do; `data/meta/domains.json` and the `domains` and `tags` of
   the Compétences say which magic exists, `data/meta/languages.json` which tongues exist, and the
   species file's `languages` which of them the people speaks.

When two sources disagree, the newer one wins if it is clearly newer, and the older page is
corrected or reported. When neither is clearly newer, the claim goes to the owner. Two sources that cannot both hold stay a
`CONFLICT` for the owner; they are never recast as two in-world accounts to explain the gap away. A `draft` entry
settles nothing, and neither do the drafts and findings of a run folder, an earlier version in git,
an archived generation or `tmp/old-aubaine`: they tell where an idea came from, never what is true
now. The owner's words a run folder records verbatim, in `request.md` or a brief's quoted answers,
are support: an answer settles canon, and the wording a message gives for the page is owner text.

## The ledger

```
| # | Claim, quoted | Kind | Support (file:line) | Status | Note |
```

| Status | Meaning | What the run does |
| --- | --- | --- |
| `CANON` | A source states it as true in the world. | Keeps it, in its home. |
| `BELIEF` | A source gives it as what someone in the world holds: a people, a faith, a speaker. | Keeps it attributed to who holds it. |
| `DISPUTED` | Sources, or people inside the world, give more than one account, and the canon has not chosen. | Keeps every account it has and chooses none. |
| `MYSTERY` | The owner or the canon leaves it open on purpose: a page says nobody knows, or a ruling keeps it open. | Keeps it open. Only the owner makes a mystery. |
| `UNKNOWN` | No source says, and nothing marks the gap as deliberate. | Reports it. Never fills it, never writes it as a mystery. |
| `CONFLICT` | Two sources state things that cannot both hold. | Follows the newer source when it is clearly newer; otherwise asks. |
| `PROPOSAL` | The page adds a people, a place, a date, an institution, a cause, a relationship or a magic that no source holds. | Removes it unless the owner approves it. |
| `INFERENCE` | A small concrete detail that dramatises a known fact. | Allowed only in `write` with no owner text (`lore.md` § Start from the owner's text), listed for the owner's veto; anywhere else, a `PROPOSAL`. |

`UNKNOWN` and `MYSTERY` never merge. An unknown is a gap in the repository; a mystery is a gap in
the world that the owner chose.

## Certainty survives every edit

- A `BELIEF` stays attributed in the prose to whoever holds it. Name the holder rather than writing
  « on dit que » when the canon knows who says it.
- A belief is marked once, by a verb whose subject is its holder (the elders hold, the priestesses
  teach), and the mark holds until the account ends; the narrator's fact then resumes in a sentence
  of its own. « Savent » and "know" are kept for what the canon holds true. A fact the narrator
  states never turns, on a later page, into one speaker's view.
- A `DISPUTED` claim keeps its accounts. A revision never picks one because it reads better.
- A `MYSTERY` stays open. It may gain partial evidence the canon already holds; it never gains an
  answer, and never a hint that implies one. State its effect as settled and active in play, and its
  cause as open; list candidate causes only when the owner writes them. When the canon holds the
  answer and the page only withholds it, nothing on the page may contradict that answer.
- A `DISPUTED` event is told by first stating what every account accepts, then each account on a
  verb of saying whose subject is its holder, with what that holder gains by it where the canon gives
  it. Accounts differ only where the canon lets them, and a verdict inside an account stays its
  holder's.
- A blank left for the table sits only where the ledger finds no canon, and never reopens what the
  owner has ruled. No part puts a question to the player.
- The owner's modality is kept. What the owner gives as a state of affairs is never hardened into a
  rule: « jusqu'ici, seuls des humains ont été choisis » is not « réservés aux humains »
  (`lore.md` § What a narrative inference may add).
- What the world does not know may still be known to the facilitator. No schema holds MJ-facing
  text today, so a hidden truth is a `PROPOSAL` for the owner, never prose on a player page.

## Provenance

At intake, when the page exists, the pass marks each sentence of the French page and of its species
prose by who wrote it, starting from `pnpm lore:owner-text`; at the checks, the tool sorts the page again
(`SKILL.md` § The run, step 10). A lore page in `write` with no owner text has no provenance pass
for its lore: each of its sentences traces to the brief's fact map.

```
| # | Sentence, quoted | Part | Provenance | Evidence | Note |
```

| Provenance | Meaning | What the run does |
| --- | --- | --- |
| `OWNER` | It is owner text (`lore.md` § Start from the owner's text), or differs from it only by typography, a slip or canon that has moved. | Keeps it, worded as the owner wrote it. |
| `ASKED` | A writer wrote it where the owner's words ask for it. Evidence quotes those words and where they stand (`lore.md` § Start from the owner's text). | Keeps it as writer text, reviewed like any draft. |
| `UNASKED` | A writer wrote it with no words of the owner behind it: under a general licence, a ruling or a direction, or to carry a neighbour page's fact. | A `PROPOSE` row: it goes to the owner, and leaves the page within the reach of the revision (`lore.md` § Start from the owner's text). |
| `UNTRACED` | Nothing tells who wrote it. | Asks the owner. |

Evidence for a writer sentence names the run that wrote it, from the run folders and `git log`. A
committed sentence is not `OWNER` for being committed, and a ruling or a direction is never the
owner's words asking for a sentence.

## Cross-checks

- The page against its species file and its Compétences: a lore sentence about what the people can
  do agrees with the rule text that makes them do it.
- Every magic, and anything else of the kinds `architecture.md` § Lore and mechanics names, that
  the page gives the people, against the game. One the game lacks, or does not give the people, is
  never a `MYSTERY` or a gap kept open: a writer's is a `PROPOSAL`, and the owner's a `CONFLICT`
  with the game that goes to the owner whichever source is newer.
- The page against every page that names the same people. The Scothan page already says how the
  Nnors de Charon give life, and the Nnor page may not contradict it.
- Names: every name is spelled as in the species file and the owner's lists.
- Terms renamed since the source was written are renamed on the page.
- Every surface that states the same fact, in both locales: a caption, an image's alt text, a
  quote's source line, the species file's prose. A fact keeps one status on every surface and every
  page.

## Parity mode

Given the French and the English editions of a page, and the reader prose of the species file in
both locales, the pass builds both ledgers and compares them claim by claim. It reports drift:

- one edition asserts what the other only suggests or attributes;
- a dispute, an ambiguity or a mystery becomes a certainty in one edition;
- a fact, a date, a cause or a relationship exists in one edition only;
- a distinction disappears: one kingdom becomes all elves, a belief becomes doctrine;
- a magical concept or a rule reads differently;
- one edition reveals what the other keeps hidden;
- a setting name differs from the English counterpart that other English pages already use. Search
  `data/**/*.en.*` for the French name and its counterpart before accepting a new one. A name with
  a meaning has an English counterpart; a name without one keeps its spelling.

Sentence shape, order, rhythm and imagery may differ. That is two editions, not drift.

## Request mode

The last check of a revision (`SKILL.md` § The run, step 10). Given only `request.md`, `c0.md`, the
brief, `rulings.md`, `baseline/` and the files in scope, and, for the ruling on magic,
`architecture.md` § Lore and mechanics and the game files that section and § Where support comes
from name, the pass states, for each request, and each ruling of § All peoples and of the people in
scope, whether the French and the English editions meet it, with the line that proves it, and
whether the run broke an answer of an earlier round, against `baseline/`. A change in the files that
no request, ruling, line of `c0.md` or brief row explains is reported too; when `request.md` records
that the owner waived C0, there is no `c0.md`.

```
| # | Request or ruling, quoted | Met in French | Met in English | Proof | Note |
```

## What goes to the owner

Every `CONFLICT` with no clearly newer source, every `PROPOSAL`, every `UNKNOWN` a section cannot
stand without, every magic, or anything else of the kinds `architecture.md` § Lore and mechanics
names, that a page gives a people and the game lacks or does not give them, every `INFERENCE`, every
`UNASKED` and `UNTRACED` sentence, and every place where a
page seems to answer a `MYSTERY`. A `CONFLICT` goes with the narrowest reading of the held fact that
would admit the new point, put as a question: only the owner bends a fact.

## What this pass returns

The report `review.md` § The report defines, with the ledger as its findings: the ledger, then the
inferences and proposals, then each conflict with both sources quoted, then, in parity mode, the
drift list. A provenance pass returns the provenance table instead of the ledger, and a request
check its table, then what is not met.
