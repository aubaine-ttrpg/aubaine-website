# ADR: Every link is an explicit reference by key

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-27
**Revised:** 2026-09-27, references inside an inline formula render, and the Livre du joueur links every word in its game sense (addendum in Decision 3)
**Deciders:** Kori
**Scope:** How rule text, definitions, list notes, book chapters, lore and the equipment guide link a
word to its entry: the markup read by `src/lib/game/richtext.ts`, the term index built in
`src/lib/game/build.ts`, the chapter pass in `src/lib/game/book-markup.ts`, and the states a booklet
collects in `src/lib/booklet/fingerprint.ts`. Amends 0018 Decision 1, 0019 Decision 4, 0023
Decision 2 and 0027 Decisions 1 and 2, which described linking by spelling. Does not cover the
Caractéristique badges in an item's stat line, which read a structured field rather than prose.

---

## Context

Until now a word linked by its spelling. The term index held every written form of every entry, a
capitalised word in rule text became a pill wherever it matched, `[[Nom]]` named a state and
`{{Titre}}` a skill, and a chapter marked a rule term, a Caractéristique or an Aptitude at its first
appearance. That made capitals decide what linked, needed a registered form for every inflection
(`Entravée`, `Entravés`, `Entravées`), let entries collide on one spelling, and made a common word
dangerous as a term, which is how « apprenez » could not join Apprise without lighting up nine skills
that use it for learning a fact. On 2026-09-26 the owner decided that every link is written, and
nothing links by its spelling any more.

---

## Decision 1: A link is `{{clé}}` or `{{clé|texte}}`, and a bare word is text

### Decision

- `{{clé}}` links the entry its key names and prints the entry's default label. `{{clé|texte}}`
  links the same entry and prints `texte` as written, as plain text. `***gras***` is unchanged.
- A word written without markup never links, whatever its capitals. `[[Nom]]` and `{{Titre}}` are
  retired.
- A key is derived and stored nowhere: the `slugify` of a rule term's French label, of a
  Caractéristique's or an Aptitude's `labelFr`, a state's `key`, or a skill's id. A skill id's shape,
  `^[A-Z0-9]{6}-[0-9]{3}$`, cannot meet the lowercase keys (`REFERENCE_KEY` in
  `src/lib/game/richtext.ts`).
- `buildTermIndex` keeps one map from key to record and throws when two glossary entries answer to one
  key. `tests/data/integrity.test.ts` refuses `[[`, a `{{…}}` that is not a key, and a key that does
  not resolve in the locale it is written in, across rule text, definitions, list notes and authored
  prose, and it refuses a reference in a Markdown heading, where the chapter pass does not look.

### Rationale

- One key names one entry, so nothing collides and a common word stays safe as plain text. The
  writer chooses the printed word, so a plural or an agreement needs no registered form.
- The keys already existed: the Règles rows use the same rule term slug (0023), and every state's
  `key` equals the slug of its name, checked before the change.
- The migration kept every page as it rendered. The data conversion (91a0344, 340 files), the chapter
  and guide conversion (22c6802, 34 files, 533 references) and this change each built a site
  identical to the one before, page by page with volatile island ids normalised, in both locales.
  The only differences were repairs, recorded in Decision 3.

### Alternatives considered

- **Keep spelling links and add an exception list for words like « apprenez »**: rejected; every new
  term would need its own exceptions, and capitals would still decide what links. Reopens if writing
  references proves too heavy for authors, measured by missing links, not by preference.
- **Keep `[[Nom]]` for states beside keys for the rest**: rejected; two syntaxes for one act, and a
  state name would stay a spelling to match.
- **Key a Caractéristique or an Aptitude by its English machine key**: rejected, so that every key in
  prose is read from the French word an author sees. Reopens if authors come to write the machine
  keys anywhere else.

### Caveats

- Nothing links unless someone writes it, so a new rule term shows up in no text until authors write
  it there.
- The Caractéristique badges of an item's stat line still find `Force` or `Dextérité` by label in
  `statRuns` (`src/lib/game/derive.ts`). That is a structured field, not prose, and it now reads
  labels only.

---

## Decision 2: The default label speaks the language of the text

### Decision

- A bare `{{clé}}` prints the entry's label in the language the string is written in. The English
  build pins each bare reference in an inherited French string to its French label before the overlay
  merges (`inherited` in `src/lib/game/build.ts`, `pinReferenceLabels` in
  `src/lib/game/richtext.ts`), so only a string from an `.en` overlay prints English labels. A chapter
  gets the same result from its file: a `.md` is French and a `.en.md` is English.

### Rationale

- Most skills and states have no English overlay, so English pages show their French text. Resolved
  against the page's locale, a reference printed « sa Speed » and « 1 Disadvantage » inside a French
  sentence, which a comparison of two builds caught before the data conversion was committed. With the
  pin, the same comparison showed no such page (3e78325).

### Alternatives considered

- **Resolve every label in the page's locale**: rejected for the mixed sentences above.
- **Refuse a bare reference in French text shown on English pages**: rejected; it would force a
  written text onto every reference until each entry is translated.

---

## Decision 3: A chapter links what its author writes

### Decision

- The chapter pass renders every `{{…}}` as a pill and every bare word as text. The first appearance
  rule is gone, along with the `seen` set that applied it.
- The conversion kept exactly the links a page showed: a rule term, a Caractéristique or an Aptitude
  became a reference at its first appearance only, and a state or a skill everywhere it rendered.

### Rationale

- The owner wants the links a reader saw kept, since they show that two words are the same thing, and
  will remove any that prove useless by hand.
- Nine explicit markers were repaired on the way (1348090). `{{Attaque d'opportunité}}` and
  `{{Nature's Cover}}` had rendered as plain text, because typographic quotes curled the apostrophe
  before the name was looked up. Written by id, they link.

### Alternatives considered

- **Keep marking a glossed word at its first appearance automatically**: rejected; that is linking by
  spelling in another place, and the author could not decide against it.

### Addendum (2026-09-27): formulas link, and the handbook links every game word

- The chapter pass reads inline code. A formula such as `` `{{ca}} = 12 + {{dexterite}}` `` keeps its
  code look and its words become pills; a fenced code block and a heading still render none, and
  `pnpm data:check` refuses a reference in either. Seventy eight words sat inside formulas.
- On the owner's request the Livre du joueur links every word used in its game sense, not only its
  first appearance: 891 references were added across both locales, lowercase game senses included
  (« une créature {{cache|cachée}} », « {{apprise|apprenez}} »), and the visible text of every page
  stayed the same apart from two verbs set in lower case. Three older links that named the wrong
  entry became plain text: the damage rule Résistance, the weapon property Finesse, and melee reach.
- A reference followed by an apostrophe made the typography curl it the wrong way, so a possessive
  is written inside the reference, `{{aptitude|Aptitude's}}`, and `pnpm data:check` refuses `}}'`.

---

## Decision 4: Inflected forms are retired, and definitions carry references

### Decision

- `forms` on states, `formsFr` and `formsEn` on vocabularies, and every spelling after the first in
  `RULE_TERMS` are removed, from `src/lib/game/schema.ts`, the emitted schemas and the fifteen state
  files that carried forms. `RULE_TERMS` holds one label per locale.
- A rule term definition, a Caractéristique, Aptitude or tag definition and the Common Bank note may
  carry references. The Règles detail and the booklets' « Mots de règle » render them with their links
  from the glossary term's `definition`. Tooltips, the tag hints on a skill entry and the source
  popover show the same text flattened. The 50 definitions whose words linked on the Règles page were
  converted one for one, with 100 references.
- A booklet collects its states from the state references its skills write, and from those states'
  own texts, instead of searching for names and forms as substrings (`statesNamedIn` in
  `src/lib/booklet/fingerprint.ts`).

### Rationale

- Forms existed only so the matcher could find a word; with written references they had no reader
  left, which is why they go in the same change rather than lingering as dead fields.
- The Règles page showed those definitions with inline links, and removing the matcher without
  converting them would have dropped every one; the page-by-page comparison is what found them.
- A substring search could not see `{{a-terre}}`, and it was the same spelling logic the owner
  retired.

### Alternatives considered

- **Keep definitions as plain text and accept the lost links on the Règles page**: rejected; it breaks
  the one-for-one rule of Decision 3 for one page.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Markup | `{{clé}}`, `{{clé\|texte}}`, `***gras***` | `parseRuns` in `src/lib/game/richtext.ts` |
| Keys | One record per word | `buildTermIndex` and `referenceLabels` in `src/lib/game/build.ts` |
| Label language | Inherited French text keeps French labels | `inherited` in `src/lib/game/build.ts` |
| Chapters | Every reference renders, no first appearance rule | `rehypeCodexTerms` in `src/lib/game/book-markup.ts` |
| Booklet states | Collected from references | `statesUsedBy` in `src/lib/booklet/fingerprint.ts` |
| Checks | Every key resolves, no `[[`, no reference in a heading | `tests/data/integrity.test.ts` |
