---
paths:
  - "data/skills/**/*.json"
  - "data/states/**/*.json"
  - "data/equipment/**/*.json"
  - "data/skill-lists/**/*.json"
---

# Keywords And Markup

Aubaine renders every load-bearing mechanical noun as an icon plus a colored term, so a reader can find what a rule depends on without reading the paragraph. The author asks for that rendering with an explicit reference by key, and nothing links by its spelling. The index is built in `src/lib/game/build.ts` and applied in `src/lib/game/richtext.ts`. `docs/adr/0029-every-link-is-an-explicit-reference-by-key.md` records why.

## Keyword classes and their keys

- Rule terms, from `RULE_TERMS` in `src/lib/game/build.ts`. The key is the `slugify` of the French label: `{{avantage}}`, `{{action-bonus}}`. Read the declaration for the current set rather than assuming a fixed list.
- Characteristics, from `data/meta/characteristics.json`. The key is the `slugify` of `labelFr`, not the machine `key`: `{{dexterite}}`.
- Aptitudes, from `data/meta/aptitudes.json`, keyed the same way: `{{visee}}`. See `vocabularies.md`.
- States, from `data/states/`. The key is the state `key`, which is its file name: `{{a-terre}}`.
- Skills, by `id`: `{{TRAFEU-001}}`. A skill placed on a tree, listed in `data/skill-lists/`, offered by a species, or granted by an item or a set bonus links to the first of those, so a skill a tree places links to its node.
- Equipment items, by file name: `{{dague}}`. The reference shows the icon of the item's slot and links to its entry on the equipment page.
- Skill trees, by `id`: `{{feu}}`. The reference shows the tree icon in the colour of the tree's leading Domaine and links to the tree's page.
- Tags, from `data/meta/tags.json`, keyed like Aptitudes by the `slugify` of `labelFr`: `{{illusion}}`, `{{vol-de-vie}}`. They share one colour and one icon. A tag a rule term reads answers to that rule term instead: `{{sort}}` reads the `spell` tag. Rule text names a tag by its key, as « un {{sort}} d'{{illusion}} » or « une {{rage}} », and never writes « étiquette »: `pnpm data:check` refuses the word in rule text.

Each of these lists has a source of truth in the repository. Read it when you need the members. Do not copy a vocabulary into prose, a rule, or a comment, because the copy is what goes stale.

## References

- `{{clé}}` links the entry the key names and prints its default label: the entry's label in the language the string is written in. A French string prints French labels, and so does a French string an English page falls back to. Only a string from an `.en` overlay prints English labels.
- `{{clé|texte}}` links the same entry and prints `texte` exactly as written, as plain text with no markup inside. Plurals and agreements are written this way: `{{entrave|Entravée}}`, `{{energie|Énergies}}`. No entry lists inflected forms, so no wording has to be declared before it is used.
- A word written without markup is plain text and never links, whatever its capitals. Reference every occurrence of a word used in the gameplay sense its entry defines, such as « vous fait {{memorisee|mémoriser}} » or « un {{sort}} ». A word used in its ordinary French sense stays plain. Write the term rather than a paraphrase: « un {{sort}} », not « une Compétence qui porte l'étiquette Sort ».
- A key is exact: lowercase with hyphens for everything but a skill id, and no accents. `pnpm data:check` fails on a key that does not resolve in the locale its string is written in.
- Two entries never share a key. A skill id has its own shape, and the build stops when two other entries answer to the same key.
- Renaming a skill `title` or a state `name` moves no reference. It changes the default label wherever a reference writes no text of its own.
- Definitions and the Common Bank's `note` carry references the same way. The Rules page links them, and a tooltip shows the same text flattened, labels or written text and never braces. See `vocabularies.md`.

## Explicit markup

The markup table in `docs/data-contract.md` is the reference, and `MARKUP` in `src/lib/game/richtext.ts` is what actually parses it.

- `***gras***` sets bold.
- `{{clé}}` and `{{clé|texte}}` reference an entry, as above.
- `[[...]]` is retired, and a skill is never referenced by its title. `pnpm data:check` fails on `[[` anywhere.
- Rule text has no print-only markup. A tree or catalogue booklet prints every state and rule word its entries reference by key, with its definition, on its last pages.
- A blank line separates paragraphs. A single newline is a line break.
- Do not use Markdown in a JSON field. A `#` heading, a list marker, a link, or an emphasis run other than `***gras***` renders literally.

## Typography

- Use the straight apostrophe `'`. Skill titles are written `Peau d'écorce` and `Chef-d'œuvre`, and `pnpm data:check` fails on a curly apostrophe in a data file. The printed plates render a curly apostrophe through the typesetter; that is the render, not the source.
- Do not insert a narrow no-break space or a no-break space before `:`, `;`, `?`, or `!`. There are none under `data/` today, and `pnpm data:check` refuses one, because the character is not distinguishable on screen.
- Do not use U+2013 or U+2014 in prose. U+2014 is permitted only as the entire value of a stat field such as `range` or `duration`, where it is a display token meaning not applicable.
