# English writing reference

English is `en-GB`. It exists only as an overlay beside the French file, and it is the second
editorial surface, not a gloss. `docs/runbooks/add-a-translation.md` owns the field allowlist and the
worked examples.

## The overlay

- Same path, `.en` before the extension. `data/skills/RAGEXX-001.en.json` beside `RAGEXX-001.json`.
- It holds only the strings that change. Every key it omits falls back to French.
- It may carry only the fields its kind allows. One disallowed or misspelled key drops the whole
  overlay and the entry renders in French on the English page, with no error anywhere. If an English
  page is stubbornly French, check the field names first.
- Three fields are keyed maps rather than arrays: skill `upgrades` by the level as a string, set
  `bonuses` by the tier's `pieces` as a string, and catalogue `sections` by the section `key`.
- Never write an explicit `null`. Omitting a key is how you say keep the French.
- Never translate a machine value: ids, `key` fields, and domain, characteristic, rarity,
  discipline, and tag keys. A tag's English label comes from `labelEn` in `data/meta/tags.json`.

## Terminology

Choose one English term per Aubaine concept and use it everywhere. Record the choice by using it
consistently; there is no glossary file to write it into.

Where the French term is one another game also uses, the English side is not obliged to borrow that
game's English term, and is not forbidden from it either. Pick what reads naturally for the mechanic
Aubaine actually has.

Do not invent an official sounding English name for a concept that has not been given one. Leave it
untranslated and say so.

`data/meta/*.json` carries `labelEn` for every domain, characteristic, rarity, discipline, and node
type. Use it exactly.

## References keep their key

An overlay writes the same key as the French: `{{enrage}}`, `{{RAGEXX-001}}`, never a translated
name. Written alone, a reference prints the entry's English label, so an overlay writes `{{energie}}`
and gets "Energy"; an entry nobody has translated yet prints its French label there. A plural goes in
the written text, `{{jet|Rolls}}`, which prints exactly as written. A French string the English page
falls back to keeps its French labels. `pnpm data:check` resolves each key in the locale it is
written in.

Keep the capitals English game terms are given in `RULE_TERMS` and in `labelEn`. As in French, they
are style: only a `{{...}}` links.

## Voice

- Direct subject verb object sentences for mechanics.
- Concise, second person, present tense.
- British spelling.
- The Oxford comma where it prevents ambiguity.
- A translation may never change how a rule executes. If the English admits a different resolution
  than the French, the translation is wrong.

## Localized, not mirrored

A French entry and its overlay that map sentence for sentence are a tell, and the pair is where it
shows. Resolve the concept first, then write the sentence a native reader would write: the clause
order, the connectors and the idiom are English decisions, not French ones carried across.

Rule text is the limit of this. A chapter may reorganise a sentence freely, and an entry may not
reorganise a mechanic. Same resolution, same order of operations, English phrasing.

Read the two versions side by side before finishing. Identical rhythm across a pair usually means
the English was produced from the French sentence rather than from the concept.
