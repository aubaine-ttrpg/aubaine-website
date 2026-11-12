# Lore

Species and tree lore under `data/lore/` is the one place Aubaine tells history. It reads the way
a roleplaying book tells it: full paragraphs, events in the past, and a world that reacts. A section
of two dry sentences that states a fact and moves on is refused.

Lore is not flavour, which is the one or two sentences an item carries (`.claude/skills/aubaine-prose/references/flavor.md`), and the
compact default of `.claude/skills/aubaine-prose/references/house-voice.md` does not apply to it. Rule text stays tight; lore opens up.

This file is the craft. Where each fact goes and what each part of a page is for is
`architecture.md`; how sure the world is of a claim is `canon.md`.

## Start from the owner's text

When the owner supplies owner text (defined below), that text is the draft. Transcribe it, then give
it a light pass: spelling and grammar slips, house typography, and canon that has moved since it was
written; then move, split and retitle as a revision may (below), each listed in the report. Keep the
owner's voice; what does not work in it is a note for the owner.

Owner text is what the owner wrote for the page: their sources, such as an export, a PDF or a note,
and the wording their messages give for the page. A sentence a message quotes in order to change or
remove it is not owner text, and neither is an answer that settles canon (`rulings.md`) or picks an
option a writer offered: that option's sentence is writer text the owner asked for. A page of the
owner's is a page whose lore or species prose holds any owner text. A lore page drafted in `write`
where the owner gave no lore text is a page in `write` with no owner text even when its species
prose holds some: its sentences cite the brief's facts, no rule for a page of the owner's applies to
them, and the owner text of its species prose keeps every rule of this section.

The reach of a revision is what the owner's words that opened it name, widened only by the brief the
owner approves at C0. Every change below stays within it; outside it, what a pass finds is a note
or a proposal for the owner.

A sentence an earlier run wrote stays writer text even once committed: `pnpm lore:owner-text` sorts
the page against the owner's sources, and the run folders and `git log` tell who wrote the rest. A
sentence nobody can trace is a question for the owner. On a page of the owner's, a writer sentence
enters or stays only where the owner's words ask for it, and the brief cites those words beside it;
without them it is a `PROPOSE` row, even when another page already holds its fact, and it leaves the
page within the reach of the revision. The owner's words are a passage of this run's or an earlier
run's `request.md`, a passage an earlier run's brief quotes verbatim, or a standing request
`rulings.md` records with the line it comes from. A ruling or a direction settles canon or tone, and
asks for no sentence. Writer text the owner asked for is reviewed like any draft; once the owner has
seen it, it changes only on the owner's words or an accepted BLOCKER or MAJOR finding, listed for the
owner.

Take a PDF's text layer rather than retyping the page, so accents and names survive:
`pdftotext -layout source.pdf out.txt`. Name lists stay verbatim and go to the species file.

What a revision may do to the owner's text, and on whose words:

- with no further words: move a sentence or a paragraph, split a paragraph between two of its
  sentences, retitle a chapter, and fix a slip, the house typography or canon that has moved (a
  renamed name or term, or a claim a ruling or a newer page corrects), each added to the brief's list
  of allowed changes and listed in the report;
- only on a fact-map row that cites the owner's words naming the passage: reword, cut, merge, split
  or clarify an owner sentence, or add a sentence beside it.

Two kinds of owner text move only on the owner's words naming them, and are otherwise a note for
the owner: a sentence of the owner's opening that is not a species summary (`architecture.md`
§ What each part is for), and a paragraph that fails the subject test (`architecture.md` § The
subject test).

A licence to delete weak prose or to restructure opens no owner sentence. A phrase of the owner's
that repeats, on the same side of the page, a fact told in its home or a value a field already
carries (`architecture.md` § One home per fact), stays where the owner
wrote it and is a note for the owner. Lore the owner wrote elsewhere, such as an older export or
another page, comes in where the owner's words ask for it, and is a proposal otherwise. A fact the
owner wrote is never lost (`architecture.md` § The fact map), and any tell found in the owner's text
stays a note. Check the rule mechanically with `pnpm lore:owner-text`: every owner sentence is found
in the revision, or on the brief's list of allowed changes.

## Check the canon against its neighbours

Before drafting, read every lore page and rule text that shares a people, a place or an event with
this one, newest first. A term renamed on one page is renamed on all of them. A claim a newer page
contradicts is corrected, not kept out of fidelity to the source. When two sources disagree and
neither is clearly newer, ask.

A people, a creature, a place or a name the owner wrote is canon even when `data/` has no entry for
it yet. A troll with no species page is still a troll: its absence from `data/` is not a slip to
correct, and it is never swapped for a people that does have a page.

## Tell it as history

These bullets say what a writer looks for in the canon. On a page of the owner's, a sentence they
suggest goes in only where the owner's words ask for it.

- Events take the past (passé simple and imparfait in French), and what still holds today takes the
  present.
- Give causes and consequences inside the world: who curses whom, who hides what, and why. The
  children of the Nnors de Charon are cursed in the towns they pass through because everyone knows a
  Nnor never gives life outside its own cycle; the reason is what makes the sentence lore.
- Say what happened, to whom. A section built from « pouvait » and « peut » is a list of
  possibilities dressed as history.
- Follow each event into the present through one trace the canon holds: a name, a grudge, a habit,
  a date counted from it. A belief about its cause stays with whoever holds it.
- A history stops at the present of play. No page tells what happens next, and a living figure is
  shown by what they do now, never by a foretold fate.
- An older event or person may be named in passing with one concrete fact the canon holds, so a
  facilitator can answer a player who asks; its story is told on the page that owns it, or nowhere.
- In `write` with no owner text, carry a section with a person and a moment when the canon has one:
  Sombrecœur refusing to cover her antlers, Figaro under his wool cap. One such moment per section is
  plenty. On a page of the owner's, a moment comes in only where the owner's words ask for it.
- Length follows the canon covered, with no padding to reach it.
- Aerate the page. A paragraph past about 100 words splits in two at its natural turn, such as the
  body and then the horns. The split moves no word and applies to the owner's text too, as the
  owner asked on 2026-10-24: in `write`, and in a revision within the reach § Start from the owner's
  text gives.
- A section holds one subject, and its heading names what it tells (`architecture.md` § What each
  part is for). A cycle told in order, from
  birth to the office and back, stays one section whatever its paragraph count. Split a long section
  only where each half has a subject and a heading of its own: on 2026-10-24 the owner had a
  seven-paragraph cycle cut in two fused back, because the first heading no longer named what its half
  told.
- A heading may lead with `:icon[set:name]`, the pictogram the owner picked for its title's frame, as
  `## :icon[game-icons:ship-wreck] La Venue`. A move or a retitle keeps it, the English heading carries
  the same one, and a new section gets one only when the owner names it (`docs/runbooks/add-a-species.md`
  § The lore file).
- Each section stands alone. A reader opens any section from the outline, so its first paragraph
  never leans on a word whose sense only an earlier section gives: name the lineage, the place or
  the person again rather than writing « la lignée », « l'antre » or « son géniteur ». The owner refused, on 2026-10-24, a section that could be read only
  after the one before it.

## Quotes and dialogue

An epigraph or a quoted exchange closes on `> :source[...]`, naming who speaks and, when it matters,
where and when. Every person that line names is bold, the speaker, whom they address, a god the scene
turns on: each prints on a nameplate. The words in braces after it, its title's corner and its
background, are staged as `docs/runbooks/add-a-species.md` says, the same in both languages. A turn
may open on its speaker's portrait, as the same runbook shows; its expression follows who the character
is as much as the line. Emotion lives inside the lines, in ellipses and interjections (« … Votre Majesté »,
« Humpf », « Huh… »), never in stage directions such as *(Un silence.)*.

What a quote is for:

- **It is the page's one scene.** A named person, at a moment the canon holds, wants something from
  the one they address: a demand, a refusal, a bargain, a reproach, a vow. The reader learns the
  people from what the speaker takes for granted.
- **Who speaks is a named character the canon holds,** a member of the people or someone the canon
  binds to them. Never a real author or book, a verse form, a saying or an unnamed voice: the quote is
  a scene. A speaker's name that breaks the people's naming custom is a
  question for the owner, and the name lists never change to hold it.
- **A quote a writer drafts is short enough to read at a glance,** a few sentences and seldom past
  about 120 words, so it never competes with the opening it sits over. The owner's quote keeps its
  length, and grows only by a line the owner's words ask for.
- **It does one job, which the brief names:** a mood, a detail, an opposing view or a frame. It may
  carry the page's central tension in one person, or a trace the people leave, read by a witness.
- **Another people is never its joke.** A line whose joke lands on another people, or that gives
  several peoples one trait each, is refused, and so is a name or a term the canon lacks.
- **It speaks to someone inside the world,** never to the reader, and asks the reader nothing.
- **A line a writer adds to the owner's quote needs the owner's words,** as any added sentence does,
  even one drawn from the owner's account of the moment; the brief lists it line by line for the owner
  to keep or strike, and a line the owner strikes is never replaced.
- **Every line fits its moment.** The source line names one moment, and nothing in the speech
  belongs to another one: a speech at the end of a long war does not sound like its first day.
- **A character keeps one voice across pages.** Their diction comes from their people, their rank and
  what they have lived. The voice changes between two moments only for a cause the canon holds, and
  the brief names it.
- **The stakes are present in the scene.** Concrete losses, people and places, rather than « ce
  chaos » or « une cause »; the feeling stays in the lines and is never named by the narrator.
- **It never tells the listener what they already know,** and it never summarises the people or the
  setting. A fact the sections tell is not repeated in the quote.
- **It stops on the act,** never on a moral, a creed or a slogan.
- **It may hint at what the sections state, and never carries an event they do not tell.**
- **The speaker's interest shows in what the line excuses or leaves out,** never in a narrator's
  comment, and the page's history is never told through a voice with a stake in it.
- **A silent listener, or a god, is drawn only through the speaker's words.** What a god says is
  canon, and only the owner sets it.
- **The source line names who, to whom, where and when, each once,** with one time marker and no
  proper noun the canon lacks. Two pages vary its verb. A speaker who recurs keeps one name and title
  in every source line.
- **A pause is a new paragraph in the same quote:** an empty `>` line between two quoted lines, one
  « at the start of the speech and one » at its end, never a repeated « at the new paragraph (the page
  hides only the outer marks).
- **Two quotes that share a moment share no line, question or image.** Read every species quote side
  by side before calling one done.

Dialogue and in-world text in general:

- A speaker has a purpose, never an exposition channel. Give speakers distinct priorities through
  word choice, sentence length, assumptions and what they refuse to explain.
- Do not encode an accent through eye dialect unless the setting requires it and the result stays
  respectful and readable. Avoid generic fantasy archaism unless a culture uses it deliberately.
- An in-world document reveals its author through practical details: omissions, euphemisms, jargon,
  bias and its intended reader.
- Do not use quotation marks to invent authority. A quote is lore and needs a speaker.

## Dates

- Eden counts its years from the last day of the battle of Brécelann and the peace treaty between
  elves and humans, its year 0. The data/lore/species/humain.md page tells the convention; a date
  is written as French writes « av. J.-C. » and « apr. J.-C. »: « 238 apr. V. », « 12 av. V. ».
- A page never states the current year of the setting: a table plays in whatever year it chooses.

## What a narrative inference may add

Only in `write` with no owner text is a small concrete detail that dramatises a known fact welcome,
inside a sentence the page needs: a wool cap, a spring tournament, a sister at the bedside. Anywhere
else it is a `PROPOSAL`, off the page (`canon.md`, `INFERENCE`). A new fact about the world is never
welcome: a people, a place, a date, an institution, a cause, a magic, or a
relationship between named characters. List every inference in the report so the
owner can veto it. `.claude/skills/aubaine-prose/references/claims-and-evidence.md` covers the single word that asserts canon on its own.

Keep the owner's modality. What the owner gives as a state of affairs is never hardened into a rule:
the Oracles are the six strongest users of primordial magic, an office open to every people that only
humans have held so far, so the page writes « jusqu'ici, seuls des humains ont été choisis », never
« réservés aux humains ».

## Revising a page

A revision works on the page three times, within its reach (§ Start from the owner's text), in this
order, and each pass finishes before the next starts. On the owner's text, each pass changes only
what that section allows, and on writer text the owner has seen, only what the owner's words or an
accepted BLOCKER or MAJOR finding name.

1. **Structure.** Apply the fact map: each fact in its home, each part doing its job, a writer's
   repeats on one side of the page merged (`architecture.md` § One home per fact) and the owner's
   only on a `MERGE` row that cites the owner's words, moves made (`architecture.md`). No sentence is
   polished yet.
2. **Story and play.** In each section, find the causes and consequences the canon already holds, the
   person and the moment that carry it, what still weighs on the living, and what a character could
   want or refuse because of it. On a page of the owner's this pass finds and moves; it adds a sentence
   only where the owner's words ask for one, and what it finds missing is a question for the owner.
   Do not add decorative prose to fill what the structure pass removed.
3. **Lines.** Rhythm, transitions, word choice and the tells (`lore-tells.md`), on the writer's
   sentences the first two passes left; in the owner's, only slips, typography and canon that has
   moved.

For each paragraph, ask what it adds, why the reader needs it here, whether it is specific to
Aubaine, whether it is already said elsewhere on its side of the page, whether it keeps its
uncertainty, and whether a
demanding editor would keep it. A writer paragraph that fails is cut or rewritten within the limit
the first paragraph of this section sets; an owner paragraph that fails is a note for the owner, and
one that passes is left alone.

## Causal coherence

A culture is not a list of pleasing traits. Its history, land, beliefs, institutions, conflicts and
customs explain each other where the canon lets them: the elves trade for the metal they refuse to
mine, the Nnors de Charon are cursed in towns because everyone knows a Nnor gives life only in its
cycle. Not every custom needs an origin, and not every practice is rational, but the reader should
be able to see why a people lives as it does. Prefer the consequence that still holds to the ornamental fact.
A people is never one personality: show what divides them, the ideal against the life lived, and the
individual against the custom, when the canon holds it, and invent no faction to fill a checklist. A
division reads best as different answers to one shared event, and a history reads best through what
it left in families and loyalties. Settled facts stay plain; where the canon disputes their meaning,
each account belongs to someone the canon names.

## Mystery

A mystery is chosen (`canon.md`). It holds when it rests on something: partial evidence, testimony
that conflicts, records lost, an institution with a reason to hide, a consequence that outlived its
cause, two peoples who read the same event differently. Do not explain an ancient event because the
explanation would fit on the page. Do not end sections on ominous hints, and do not let a sentence
promise a significance it never gives (`lore-tells.md` § The tells, the fake mystery). A player
still learns what their character would know.

A mystery the owner keeps open stays open on purpose. State what the canon holds about what happened
and what holds whatever the answer, and leave the cause open. Where the owner keeps several readings,
each stays with the people, faith or school that holds it, weighted only as the canon weights it, and
the narrator rules on none. A turn back to the settled effect, such as « quoi qu'il en soit », brings
no new fact with it, and the narrator never hints. The questions people in the world asked stay
theirs: none is put to the player.

## The two editions

French and English are two editions of one canon, each written for its reader. The English page is
written from the brief, its fact map and the canon ledger, never from the French sentences. Its
claims and their certainty match the French (`canon.md` § Parity mode); its sentences, order and
images need not.

- Events in the passé simple and the imparfait become the English simple past and its progressive
  forms; what still holds stays in the present in both.
- Dates follow each page's convention: the French « 238 apr. V. » and the English form
  `data/lore/species/humain.en.md` uses.
- A meaningful name takes the English counterpart other English pages already use; a name without a
  meaning keeps its spelling. Decide name by name whether the meaning does work, and keep each
  people's naming pattern the same in both editions.
- When the owner coins a name, its English counterpart is settled the same day, with the owner, and
  recorded in `rulings.md` until a page carries it. A published name or term is never re-rendered
  silently; a change is a ruling.
- `.claude/skills/aubaine-prose/references/locale-fr.md` and `locale-en.md` hold the typography,
  the vocabulary and the overlay rules.

## Examples from a revision

Each example is a writer's draft from the Elfe revision of 2026-11-07 and 2026-11-08, never the
owner's text, with what was wrong and what replaced it.

- **The synonym-rotated repeat.** The opening said « leurs grandes cités s'élèvent à l'ombre des
  arbres-mondes qu'elle fit naître », while the cities section opens on « Au pied de chaque
  arbre-monde s'érige une grande cité ». New words, same fact: the survey missed it, the editor did
  not. The writer's sentence went: no words of the owner asked for it, and the owner's own opening
  already said where they live. Between the opening and a section such a light restatement is now
  allowed (owner, 2026-11-08); between two sections it is still a repeat.
- **The invented camp.** « Jouer » said « Les uns s'y tiennent même quand les leurs tombent ; les
  autres prennent les armes ». The canon gives that dilemma to Tiar alone; splitting the people into
  two camps was a new fact. A question to the player was no cure: it pushed the player toward a
  side. « Jouer » states the teaching the character grew up with, and the dilemma stays Tiar's.
- **The partner nobody named.** « les unions entre elfes et humains » rested on a Scothan page that
  says only « ces unions-là ». The page now writes « les unions ». A single word can add a
  relationship (`canon.md` § What counts as a claim).
- **The calque of the owner's English.** « laisser la vie être la vie » rendered "let life be life"
  word for word; French says « laisser la vie suivre son cours ». The English edition keeps the
  owner's own phrase.
- **The ruling read as a request.** « Chez eux règne la Matriarchie. » closed the owner's opening
  because a ruling said the Matriarchie is how elven societies work. A ruling settles canon; it asked
  for no sentence, and the owner struck it.
- **The imported fact.** A revision brought four facts from neighbour pages under the request's
  general objectives: Sombrecœur's antlers, the rite of the dead, the calendar and the unions. No
  words of the owner asked for them, so each left the page and went to the owner as a proposal, and
  each fact kept its home page.
- **The line drawn from the owner's account.** Asked to rework Tiar's quote, the writer turned each
  point of the owner's account of the moment into a line. The owner struck one of them: a line drawn
  from the owner's account is still writer text, listed for the owner line by line.
- **The paragraph about other peoples.** « Les derniers Galwariens » held a paragraph whose subjects
  were the drows, the Fir Bolg, the orcs, the trolls and the goblins. The owner struck it: a people's
  page talks about that people, and the others enter through its view or its bond
  (`architecture.md` § The subject test).
- **The fix that converged.** Two sound fixes, one in the war section and one in « Jouer », both chose
  "hide behind arrogance", and the survey paired them at 0.50. Reread the survey after every fix
  round. Since 2026-11-08 « Jouer » may restate the war section lightly (`architecture.md` § One home
  per fact); the lesson holds for two parts on one side.
- **The title that tied nothing.** A round-1 finding said one elf chapter held three subjects, the
  arts, the faith and the combat training; the writer answered with titles that listed them, « Arts,
  foi et armes », then « Chants, rites et lames ». A title settles nothing: the arts went to the
  cities they flourish in, the faith to the goddess's gift, and the combat training to a chapter of
  its own.

## Before calling it done

Run the checks in `lore-tells.md` over the whole page, not section by section. Read the French and
the English as two texts written for two readers (`.claude/skills/aubaine-prose/references/locale-en.md`). Then look at the page in the
run's private build (`SKILL.md` § The run, step 10): the outline built from the headings, the
epigraph and its caption.
