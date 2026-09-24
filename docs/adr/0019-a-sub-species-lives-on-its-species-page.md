# ADR: A sub-species lives on its species page, and roleplay sits apart from the rules

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-23
**Revised:** 2026-09-23, the reader sees « Origines régionales », species skills join the Banque Commune, and rule terms grow (addenda in Decisions 1, 3 and 4)
**Revised:** 2026-09-23, `Sort` becomes a rule term with its own colour, and Second souffle moves its rest limit to `recharge` (Decision 4)
**Revised:** 2026-09-24, `Sort` reads its definition from its tag and its rule covers passive Sorts (0020, addendum in Decision 4)
**Deciders:** Kori
**Scope:** The `subspecies`, `roleplay` and `languages` fields on `species` in
`src/lib/game/schema.ts`, the `languages` vocabulary in `data/meta/`, the sections of the species
page below the lore, the list that renders a species' skills, and the `recharge` field on a skill.
Reverses Decision 5 of 0014 and the "no `age` or `height` field" bullet of its Decision 4, and
extends its Decisions 2 and 7. Extends 0006 Decisions 2 and 3. Does not cover where lore prose is
authored (0018), the overlay mechanism (0003) or the ownership ladder (0010).

---

## Context

The first real species arrived: the author's Humain, whose four regional origins (Nouvelle-Aubaine,
Landenheit, Victoria, Al-Wahaa) sit inside the one Humain document, each with a paragraph, three
name lists and skills of its own. 0014 had modelled a sub-species as a separate species file naming
a `parent`, with its own page, and no file had ever used it (`parent` appeared in no file under
`data/species/`, verified by search before the change). The same request asked for a "Jouer un
Humain" section laid out like the traits block of the SRD books, for the species pool to reuse the
Almanach skill list, and for a skill to show on its card that it recharges on a rest.

---

## Decision 1: A sub-species is an entry inside its species

### Decision

- `species.subspecies` is an array of `{ id, name, text, names?, offered }`. `parent` leaves the
  schema, and with it `ResolvedSpecies.stock`, the "Sous-espèce de" link and the children nav in
  `src/components/views/Species.astro`, and the `speciesStock` string.
- A sub-species has no file, no route and no page. It renders as an `<article>` under a
  `Sous-espèces` heading on its species page, anchored by `subspeciesAnchor` in
  `src/lib/game/derive.ts`, which gives `sous-espece-<id>`.
- The pool a character picks two from is `speciesPool(species.offered, sub.offered)` for their
  sub-species. The page lists every skill of the species and its sub-species, folded with the same
  function.
- `SkillOrigin.species` entries gain an optional `subspecies`, so the Almanach provenance names the
  sub-species and links to its anchor. The maturity ladder is unchanged: a sub-species skill
  inherits its species' `status`.
- A sub-species' skills carry the sub-species as their `prerequisite`, which
  `data/books/livre-du-joueur/09-les-especes.md` now states.
- `names` holds three lists, masculine and feminine first names and family names, in the order and
  spelling the author gave. The English overlay translates a sub-species' `text` by its `id` and
  cannot carry its `name` or its `names`.
- `tests/data/integrity.test.ts` checks that sub-species ids are unique per species, that every
  offered id exists, that a skill is offered once across a species and its sub-species, that every
  creation choice is empty or holds at least `SPECIES_SKILL_CHOICES`, that no name repeats within a
  list, and that an overlay translates only sub-species that exist.

### Rationale

- The decider stated the model outright: one species includes its sub-species, and there is no new
  page. The author's own document already reads that way, and a reader choosing a region wants the
  other regions beside it, not three links away.
- Reversing 0014 Decision 5 cost no migration because nothing used it. Its additive rule survives
  intact: `speciesPool` still puts the species first and the sub-species after it without
  duplicates. `tests/unit/derive.test.ts` covers the function, and `tests/data/integrity.test.ts`
  checks the fold across every sub-species on the real corpus.
- The names are data rather than prose because the English overlay would otherwise copy 229 names
  it may not translate, and one fact must be stored once (`.claude/rules/content/data-authoring.md`).
- Keying the overlay by `id` avoids the rank-shift trap 0014 Decision 3 recorded for lore blocks.

### Alternatives considered

- **Keep `parent` and one page per sub-species**: rejected by the decider. It would reopen if a
  sub-species grew a lore of its own long enough to need a separate outline.
- **Write each sub-species as a section of the lore Markdown (0018)**: rejected because the skills a
  sub-species adds have to be structured to build the creation pools and the provenance, and a name
  list in prose would be copied whole into the `.en.md` twin.

### Caveats

- The anchors are French in both locales, as every machine value is.
- Victoria and Al-Wahaa are not written yet, so the Humain page carries two sub-species of four.

### Addendum (2026-09-23): the reader sees « Origines régionales »

The decider refused « sous-espèce » in anything a reader sees: splitting a people into sub-species
reads as race, which a TTRPG should not print. `subspecies` stays the data name, and every surface
says « origine régionale » / "regional origin": the section heading, the filter facet, the Jouer
table row, the rail and chapters 03 and 09. The anchors follow the words a reader can see in the
address bar: the section is `#origines-regionales` and each origin `#origine-<id>`, still built by
`subspeciesAnchor`. The rail now nests each origin under its section entry, through the one level
of nesting `SectionTrail` already supports.

---

## Decision 2: Roleplay facts are a table below the lore, never a plate

### Decision

- `species.roleplay` is `{ adulthood?, lifespan?, height?, text? }`, with a refine refusing an empty
  object. `species.languages` names keys from `data/meta/languages.json`.
- The species page renders a `Jouer un <nom>` section after the sub-species: the roleplay `text`,
  then a definition list of Âge adulte, Espérance de vie, Taille, Langues and the sub-species as
  links to their anchors.
- The heading is built by `playingAs` in `src/lib/i18n/strings.ts`: « Jouer un <nom> » in French
  and "Playing <name> characters" in English.
- The hero keeps exactly three plates, as 0014 Decision 4 set them.
- `data/meta/languages.json` holds the nineteen languages of the "Langues courantes" and "Langues
  rares" tables of `tmp/srd/FR_SRD_CC_v5.2.1.pdf`, pages 21 and 22, at the decider's direction.

### Rationale

- The decider drew the line: the three plates carry gameplay data a table consults, and the rest is
  roleplay. That keeps the plates exactly as 0014 made them and reverses only the refusal of an age
  or height field, whose reason was that such a value does not belong on a plate.
- Height is not the size category. A Humain is Moyenne on a plate and "Entre 1,60 m et 1,90 m" in
  the table, and the field description says so.
- The decider asked for a table rather than prose. A definition list is the markup for name and
  value pairs, and `.au-prose dl` in `src/styles/prose.css` already lays it out as a two column grid
  above `48rem`, the way the book chapters present resources.
- The heading is computed because a data file says nothing about where it is shown
  (`.claude/rules/content/data-authoring.md`). Every one of the seventeen species names takes « un »,
  and the English form avoids choosing between "a" and "an".
- `languages` is a top level fact beside `types` and `size`, for the same reason: nesting it in the
  section that renders it would shape data by its display.

### Alternatives considered

- **Run-in labels in the roleplay prose**, as the SRD 5.1 traits block does: rejected by the decider
  in favour of a table.
- **An authored heading per species**: rejected because it puts presentation in `data/`. It reopens
  the day a species name needs « une ».
- **A fourth plate for languages**: rejected because a language is roleplay by the decider's split,
  and 0014 Decision 4 fixes the plates at three.

### Caveats

- `.claude/rules/content/authority.md` treats everything under `data/` as original Aubaine text. The
  language names come from another game's reference document because the decider asked for them.
  Single names carry no credit, but four of them carry that game's cosmology: Langue multiverselle
  des signes, Commun des profondeurs, Profond and Argot des voleurs.
- `playingAs` hard codes « un ». A species whose name takes « une » needs the string changed first,
  which `docs/runbooks/add-a-species.md` records as a trap.

---

## Decision 3: The species pool is the Almanach list

### Decision

- The entry builders leave `src/components/views/Browse.astro` for `src/lib/game/browse-entries.ts`:
  `skillBrowseEntries`, `equipmentBrowseEntries` and `originSkills`.
- The rows, the sticky detail panel, the provenance block, the filter bar and their styles leave it
  for `src/components/primitives/BrowseList.astro`, which both the Almanach views and the species
  page render.
- `FilterBar.astro` gains a `speciesSkills` variant whose first group is a `sub` facet: the
  sub-species, or the species itself for its base skills.
- On a species page the row names the sub-species rather than the species, and the provenance drops
  the group that would link the page to itself.

### Rationale

- The decider asked for the exact component of the Almanach list, with fewer skills.
- It keeps 0006 Decision 3 true. The filter bar is still the only island, and it still reads
  `[data-entry]` from the rendered DOM, so a new list costs attributes and no payload.
- It keeps 0006 Decision 2 true. `src/scripts/browse.ts` resolves the first `[data-browse]` on
  whatever page it runs, so the species page selects through links and `:target` without
  JavaScript and through the script with it, unchanged. `tests/e2e/browse.spec.ts` still finds the
  raw `data-rows data-no-swup` attribute order it asserts.

### Alternatives considered

- **Keep the two column card stack the species page used**: rejected by the decider.
- **Give `Browse.astro` a skill subset and a flag to hide its hero**: rejected because the view owns
  the hero, the help panel and the booklet, and a flag would couple one page to another page's
  chrome.

### Caveats

- Every species page now ships the filter island, loaded `client:idle`, where it shipped none.
- One list per page remains an assumption of both `browse.ts` and the island's document wide
  `[data-entry]` query. A second list on one page would break selection and counts silently.

### Addendum (2026-09-23): grouped rows, no price on the species page, and the Banque Commune

- On a species page the rows run the species' own skills first, then each origine régionale in the
  order the file declares them, alphabetical inside each group, as the decider asked. The Almanach
  keeps its single alphabetical order.
- The species page prints no PX, neither on a row nor on the card. The two skills kept at creation
  cost nothing, and a price beside them read as the cost of playing them. `SkillEntry` gains a
  `priced` prop, false only in that context.
- The species skills are also entries of `data/skill-lists/common-bank.json`, because the decider
  set the Banque Commune as where a character buys the ones not kept at creation, at the printed
  price and reserved by their `prerequisite`. Chapters 04 and 09 say so. Being in that list also
  puts them in the term index and in the search page, which they were not before.
- The species index card no longer prints the size of the pool, at the decider's request. The
  `meta` slot of `CoverCard` had no other caller and is removed.

---

## Decision 4: A rest limit is a field on the skill

### Decision

- `skill.recharge` is `'short-rest'` or `'long-rest'`. `src/components/primitives/SkillEntry.astro`
  prints it on the stat line as « 1 fois par Repos court » or « 1 fois par Repos long ».
- A Repos long also recharges a `short-rest` skill, which
  `data/books/livre-du-joueur/06-repos-et-progression.md` states.
- `Repos court` and `Repos long` join `RULE_TERMS` in `src/lib/game/build.ts`, with `Mémorisée` and
  `Expertise`, which the same skills introduced.

### Rationale

- Activation, range and duration are fields that a description never restates
  (`.claude/skills/aubaine-prose/references/keyword-rendering.md`). A rest limit is the same kind of
  fact, and the decider asked for it on the skill card.
- The print route renders skills through `SkillEntry.astro`, so a booklet carries the limit without
  a second implementation.

### Alternatives considered

- **Keep writing the limit in the description**: rejected for new skills. Five existing tree skills
  still do (SECSO-01, CHIRU-01, FLAIR-01, INTFC-01, CHASS-01) and are left as they are, because
  rewriting them was not asked.
- **A number of uses per rest**: rejected as speculative, since every limit the decider gave is once
  per rest. It reopens with the first skill usable twice.

### Caveats

- Until those five skills move to the field, a rest limit is expressed two ways in the corpus.

### Addendum (2026-09-23): Caractéristique and Aptitude become rule terms, Compétence does not

- `Caractéristique` and `Aptitude` join `RULE_TERMS`, in both numbers and both locales. They are the
  two halves of every `Jet`, the corpus already writes them capitalised every time (89 and 65
  occurrences, counted before the change), and a reader meeting one in an entry now gets its
  definition in the tooltip. `Aptitude` wears the class colour and `APTITUDE_ICON`, so the generic
  word and the named Aptitudes read as one family.
- `Jet` stays: it is the word that tells a reader a roll happens.
- `Compétence` stays unmarked. Every entry is one and most say « cette Compétence », so the pill
  would sit on every card and carry no signal.
- `Mémorisée` also lists its lowercase verb forms (`mémoriser`, `mémorisez`, `mémorise`, and in
  English `memorise`, `memorising`), because memorising and being Mémorisée are one state. It is the
  only rule term whose lowercase form marks.

### Addendum (2026-09-23): `Sort` is a rule term, and the rest limits were sorted

- `Sort` joins `RULE_TERMS`, with `Spell` in English. It is a tag with a rule behind it: a skill
  tagged Sort is cast only with a Catalyseur equipped, which the Catalyseur items already said and
  chapter 04 of the Livre du joueur now states, along with what tags are for. Seventy five skills
  carry the tag, so the word gets its own colour, `--term-spell` in `src/styles/tokens.css` for both
  themes and in `src/styles/print.css`, and the `game-icons:magic-swirl` glyph.
- Of the five skills this decision named, only Second souffle limited the whole skill to one use
  per rest, so it now writes `recharge` and drops the sentence. The other four limit one effect or
  one target (a reroll, a first success, a patient, a rebuild), which the field cannot say, so they
  keep their sentence, now written `Repos court` and `Repos long` so the terms mark.

### Addendum (2026-09-24): `Sort` is defined by its tag, passives included

- The `Sort` rule term no longer carries text of its own: its tooltip reads the definition of the
  `spell` tag in `data/meta/tags.json`, so the word is defined once (0020 Decision 1).
- The rule now names passives: a Sort needs a Catalyseur equipped to be activated, whether it is
  passive or active. The Catalyseur property on the catalyst items says the same.
