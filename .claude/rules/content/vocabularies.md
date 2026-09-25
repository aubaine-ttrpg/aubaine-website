---
paths:
  - "data/meta/**/*.json"
  - "src/lib/game/build.ts"
---

# Vocabularies

`data/meta/` holds one file per controlled vocabulary. Together they are the codex taxonomy and its glossary, and every entry pairs a stable machine `key` with `labelFr` and `labelEn`. Read the directory for the current set; `domains.json` is the shape they all follow.

- These lists are the whole taxonomy. An entry may only name a key that is declared there, and `pnpm data:check` enforces it.
- Adding, removing, or renaming a key is a product decision that changes the schema surface, not an authoring step.
- A key is a machine value. It is never translated and never shown to a reader.
- `labelFr` and `labelEn` are what the reader sees and what the term index matches on. Changing one changes how keywords link across the whole codex.
- The vocabulary schema is strict and narrow. Read `vocabulary` in `src/lib/game/schema.ts` for the fields it allows. `formsFr` and `formsEn` carry the other written forms of a label, agreement and plural included, so that a bare word is still marked in rule text. They are spellings, not a glossary.
- `definitionFr` and `definitionEn` are the tooltip text of a word, written together or not at all, in plain text. Only the vocabularies whose words carry a tooltip hold them: `characteristics.json` (every entry but the `any` marker) and `aptitudes.json`. `pnpm data:check` requires them there and refuses them anywhere else. Aliases, gender and usage notes still have no field.
- A definition is the source of truth for its word. A chapter that restates the word follows it.
- The Rules page, `/fr/regles`, shows the same definition in the detail of each rule term, Caractéristique, Aptitude and tag. `ruleBrowseEntries` in `src/lib/game/browse-entries.ts` reads the words from the `glossary` that `src/lib/game/build.ts` also builds the term index from, and the tags from `data/meta/tags.json`, so a tooltip and its Rules entry cannot disagree.
- A terminology decision that does not fit the schema belongs in prose, in `docs/`, not in a data file.

## Rule terms

- Rule terms are a vocabulary of their own, declared in `RULE_TERMS` in `src/lib/game/build.ts` rather than in `data/meta/`. `Avantage` is one of them. Read the declaration for the current set and never work from a copy of it.
- Each entry carries its own colour and icon, lists its inflected forms per locale, and carries its tooltip `definition` in both locales. It is matched wherever it appears in rule text.
- `Sort` carries no text of its own: it reads the definition of the `spell` tag in `data/meta/tags.json`, so the word is defined once.
- `Banque Commune` carries none either: it reads the `note` of `data/skill-lists/common-bank.json`, the same paragraph the skills index shows on the Common Bank's label.
- Changing that list changes the rendering of every entry. Treat it as a vocabulary change, not a code change.
- It lives in code only for historical reasons. Do not treat that as licence to hard code any other vocabulary.

## Aptitudes

- Aptitudes are a keyword class of their own, declared in `data/meta/aptitudes.json` and merged into the term index after the characteristics and before the states.
- They share one colour, `--term-apt`, and one icon, `APTITUDE_ICON` in `src/lib/game/build.ts`, because they are a class rather than individually marked concepts. Any Caractéristique can pair with any Aptitude, so a per Aptitude icon or colour would draw a binding the rules do not have.
- An aptitude entry therefore carries no `iconName`. The schema still allows the field, because the other vocabularies use it; do not add it back here.
- Each Aptitude carries its own definition: they share a colour and an icon, not a meaning.
- Four of them, `Artisanat`, `Arcanes`, `Technologie` and `Science`, are also the craft disciplines. That is one concept, not two: a discipline is the Aptitude you roll. The disciplines are never put in the term index, so the Aptitude entry serves both.

## Tags

- Skill tags are a vocabulary of their own, declared in `data/meta/tags.json` with its own schema, `tagTaxonomy`, in three groups: `practices`, `schools` and `specials`. Read the file for the current members and never work from a copy of it.
- Each tag carries its labels and its tooltip definition in both locales. Each École lists the Pratiques it accepts: that list is the Pratique x École matrix.
- A skill's `tags` fills only the slots it needs, and none is mandatory. Tags are not keywords and are never marked in prose.
- Adding, renaming or retiring a tag is a product decision. `docs/runbooks/add-a-tag.md` owns the procedure and `docs/adr/0020-skill-tags-are-three-optional-slots-and-every-hovered-word-is-defined.md` the reasons.
