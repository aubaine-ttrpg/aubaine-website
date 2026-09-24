# French writing reference

French is the canonical authoring language of the codex, not a translation target. It is the source
and the fallback: an entry with no English overlay renders in French on the English page.

## Vocabulary

Aubaine's terms are Aubaine's, whatever they resemble elsewhere. Do not replace one with a literary
synonym, and do not correct one because another game uses it. One term for one mechanic, everywhere.

Where to read the vocabulary, in order:

- `data/meta/*.json` for the controlled vocabularies. Use `labelFr` exactly.
- `RULE_TERMS` in `src/lib/game/build.ts` for the rule terms.
- `data/states/*.json` for state names, and the skill `title` fields for skill names.
- The book chapters under `data/books/` for everything the game names in prose but does not store in
  a vocabulary: the resources, the currencies, the roll vocabulary, the facilitator, and the parts of
  a character.

That last group is the one to be careful with, because nothing validates it. `MJ`, `Jet`, `PdV`, and
`Action Bonus` are examples of it, not the whole of it. Read the chapters before inventing a term,
and reuse what is there.

Capitalize game terms mid sentence, as the codex already does. This is not decoration: it is what
makes the term render with its icon and colour. See `keyword-rendering.md`.

## Typography in source

- Straight apostrophe `'`. Never the curly one. Titles are `Peau d'écorce` and `Chef-d'œuvre`, and a
  curly apostrophe inside a name or a marked reference fails the build. The plates render a curly
  apostrophe through the typesetter; that is the render, not the source.
- No narrow no-break space and no no-break space before `:`, `;`, `?`, or `!`. There are none under
  `data/` today, and one inside a keyword or a marked name breaks matching invisibly.
- Guillemets for quoted speech and for a named example: `« Navigation »`.
- Decimal comma, and a regular space between the number and the unit: `1,5 m`, `9 m`.
- Never U+2013 or U+2014 in prose. The em dash appears under `data/` only as the whole value of a
  stat field, meaning not applicable.
- Œ and œ ligatures where French requires them.

## Rules voice

Short clauses, direct verbs, concrete nouns, explicit logical connectors.

Second person present for anything the character does. The state descriptions use the third person,
because they describe a creature in that state.

Avoid calques from English when an idiomatic French construction is clearer. Avoid unnecessary
passive voice.

Use one phrasing for one recurring mechanical relationship. Consistency reads as rigour here, not as
repetition.

## Known drift to avoid repeating

`PdV` against `PV`, `Action Bonus` against `Action bonus`, and `1,5 m` against `1,5m` all appear in
the current data. The majority form is listed above. Do not propagate the minority one, and do not
mass-correct existing files as a side effect of writing a new one.
