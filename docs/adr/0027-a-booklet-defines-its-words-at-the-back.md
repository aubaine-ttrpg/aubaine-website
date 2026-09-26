# ADR: A booklet defines its words at the back, and rule text carries no print markup

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-26
**Deciders:** Kori
**Scope:** The printed tree and catalogue booklets built by `src/pages/print/[...booklet].astro`,
the booklet fingerprint in `src/lib/booklet/fingerprint.ts`, and the rule text markup that
`docs/data-contract.md` lists. Retires the three-bracket marker `[[[Nom d'état]]]`. Does not cover
the book booklets, whose chapters teach the words themselves, nor the tooltips of the site (0020,
0023).

---

## Context

On the site every coloured word carries a tooltip. On paper it cannot, so two mechanisms grew side
by side. A rule text could end with `[[[Nom d'état]]]`, and the skill card then printed that state's
full text inside the card; and every tree booklet already ended with an « États » page listing each
state its skills name. Nine skills used the marker. Each state they expanded was also on the last
page, and the choice was uneven: in the Eau booklet Lame d'eau expanded Trempé while Emprise du gel
and Maelström named it without doing so. Rule words such as Jet, DD, Avantage or Caractéristique were
coloured in the booklets and defined nowhere in them.

---

## Decision 1: Rule text carries no print markup

### Decision

- `[[[Nom d'état]]]` is retired. The nine skills that ended with it lose that line, and the skill card
  no longer prints a state inside itself on any surface.
- `tests/data/integrity.test.ts` refuses a triple bracket anywhere in rule text.
- A state named in rule text keeps its double-bracket or automatic marking, so it stays coloured and
  iconed wherever it appears.

### Rationale

- One place to look is easier to learn at the table than a card that sometimes explains a state and
  sometimes does not.
- The expanded block duplicated the last page and broke the two-column flow of the skills pages.

### Alternatives considered

- **Keep the marker and apply it to every state a skill names**: rejected; every card that names a
  state would grow by its full text, and most states would print several times per booklet. Reopens
  if a booklet ever loses its closing pages.

---

## Decision 2: A booklet ends on the words it uses

### Decision

- A tree or catalogue booklet closes on « Mots de règle », then « États ». The first lists every rule
  term, Caractéristique and Aptitude its rule text marks, in alphabetical order, each with the
  definition the site shows in its tooltip; the second is the states page it already had.
- The words are collected by parsing the rule text with the same term index the site uses
  (`ruleRuns` in `src/lib/game/richtext.ts`), so a word is listed exactly when it is coloured.
- The footer of every skills page reads « Mots de règle et états : définis en fin de livret ».

### Rationale

- A printed booklet can then be read alone, the way the site can be read without leaving the page.
- Collecting by parsing rather than by substring keeps short spellings from matching inside longer
  words, such as `CA` inside `Caractéristique`.

### Alternatives considered

- **Leave the rule words to the Livre du joueur**: rejected by the decider, who asked for the rulings
  and the states in one place. Reopens if the list grows long enough to crowd a short booklet.

### Caveats

- Tags are still not defined in a booklet: the Pratique, École and Spéciale line on each card relies
  on the reader knowing them.

---

## Decision 3: The fingerprint hashes the words it prints

### Decision

- `treeContentHash` and `catalogueContentHash` add the title and definition of every listed rule
  word, so a changed definition marks the booklet out of date.

### Rationale

- Rule term definitions live in `RULE_TERMS` in `src/lib/game/build.ts`, outside the data files the
  fingerprint reads, so without this a booklet could print a stale definition and still pass
  `pnpm pdf:check`.

### Alternatives considered

- **Hash `src/lib/game/build.ts` whole**: rejected; any code change there would mark every booklet
  out of date. Reopens if the rule terms move to a data file, as 0020 Decision 1 anticipates.
