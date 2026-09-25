# Lore

Species and tree lore under `data/lore/` is the one place Aubaine tells history. It reads the way
a roleplaying book tells it: full paragraphs, events in the past, and a world that reacts. A section
of two dry sentences that states a fact and moves on is refused.

Lore is not flavour, which is the one or two sentences an item carries (`flavor.md`), and the
compact default of `house-voice.md` does not apply to it. Rule text stays tight; lore opens up.

## Start from the owner's text

When the owner supplies a source (a PDF, a note, a message), that text is the draft. Transcribe it,
then give it a light pass: spelling and grammar slips, house typography, and canon that has moved
since it was written. Do not rewrite a voice that already works.

Take a PDF's text layer rather than retyping the page, so accents and names survive:
`pdftotext -layout source.pdf out.txt`. Name lists stay verbatim.

## Check the canon against its neighbours

Before drafting, read every lore page and rule text that shares a people, a place or an event with
this one, newest first. A term renamed on one page is renamed on all of them. A claim a newer page
contradicts is corrected, not kept out of fidelity to the source. When two sources disagree and
neither is clearly newer, ask.

A people, a creature, a place or a name the owner wrote is canon even when `data/` has no entry for
it yet. A troll with no species page is still a troll: its absence from `data/` is not a slip to
correct, and it is never swapped for a people that does have a page.

## Keep the page on its subject

A species page opens on who they are and stays with them. Other peoples enter through what they did
to this people or with them, the way elves and humans enter the Scothan page, never as a paragraph
about themselves. Do not re-explain an institution another entry owns, such as who the Oracles or
the Weitzguard are.

## Tell it as history

- Events take the past (passé simple and imparfait in French), and what still holds today takes the
  present.
- Give causes and consequences inside the world: who curses whom, who hides what, and why. The
  children of the Nnors de Charon are cursed in the towns they pass through because everyone knows a
  Nnor never gives life outside its own cycle; the reason is what makes the sentence lore.
- Say what happened, to whom. A section built from « pouvait » and « peut » is a list of
  possibilities dressed as history.
- Carry a section with a person and a moment when the canon has one: Sombrecœur refusing to cover
  her antlers, Figaro under his wool cap. One such moment per section is plenty.
- Length follows the canon covered: a few sentences per paragraph, one to three paragraphs per
  section, and no padding to reach it.

## Dialogue

An epigraph or a quoted exchange closes on `> :source[...]`, naming who speaks and, when it matters,
where and when. Emotion lives inside the lines, in ellipses and interjections (« … Votre Majesté »,
« Humpf », « Huh… »), never in stage directions such as *(Un silence.)*.

## What a narrative inference may add

A small concrete detail that dramatises a known fact is welcome: a wool cap, a spring tournament, a
sister at the bedside. A new fact about the world is not: a people, a place, a date, an institution,
a cause, or a relationship between named characters. List every inference in the report so the
owner can veto it. `claims-and-evidence.md` covers the single word that asserts canon on its own.

## Before calling it done

Run the lore checks in `ai-tells.md` over the whole page, not section by section. Read the French and
the English as two texts written for two readers (`locale-en.md`). Then look at the page in the
build: the outline built from the headings, the epigraph and its caption, the name lists.
