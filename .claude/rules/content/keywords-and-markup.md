---
paths:
  - "data/skills/**/*.json"
  - "data/states/**/*.json"
  - "data/equipment/**/*.json"
  - "data/skill-lists/**/*.json"
---

# Keywords And Markup

Aubaine renders every load-bearing mechanical noun as an icon plus a colored term, so a reader can find what a rule depends on without reading the paragraph. Prose earns that rendering by spelling each keyword in its canonical form. The index is built in `src/lib/game/build.ts` and applied in `src/lib/game/richtext.ts`.

## Keyword classes

- Rule terms, including their inflected forms, from `RULE_TERMS` in `src/lib/game/build.ts`. `Avantage` is one. Read the declaration for the current set rather than assuming a fixed list.
- Characteristics, from `data/meta/characteristics.json`, matched on `labelFr` and `labelEn`.
- States, from each `data/states/*.json` `name`.
- Skills, from each `title`: skills placed on a tree, listed in `data/skill-lists/`, offered by a species, or granted by an item or a set bonus. The first source wins, so a skill a tree places links to its node.
- Aptitudes, from `data/meta/aptitudes.json`, matched on `labelFr`, `labelEn` and their written forms. See `vocabularies.md`.
- Tags are not keywords. A tag label is never marked in prose; only `Sort` marks, because it is also a rule term. Rule text cites a tag as « l'étiquette » followed by its French label spelled exactly, and `pnpm data:check` refuses a label `data/meta/tags.json` does not declare.

Each of these lists has a source of truth in the repository. Read it when you need the members. Do not copy a vocabulary into prose, a rule, or a comment, because the copy is what goes stale.

## Automatic terms

- A bare keyword in prose is linked automatically. Do not mark it up.
- Automatic linking is case sensitive. `Avantage` is linked, `avantage` is not. Write the canonical capitalization every time.
- A keyword must not touch a letter or a digit on either side. Inside a longer word it is not linked.
- The index is first wins, in the order rule terms, characteristics, aptitudes, states, skills. Two entries that share a name collide and the later one is never linked.
- Nothing validates capitalization. `pnpm data:check` will pass on a missed keyword, and the reader silently loses the icon, the color, and the tooltip.

## Explicit markup

The markup table in `docs/data-contract.md` is the reference, and `MARKUP` in `src/lib/game/richtext.ts` is what actually parses it.

- `***gras***` sets bold.
- `[[Nom d'état]]` marks a state. It resolves against a state `name`.
- `{{Nom de compétence}}` marks a skill. It resolves against a skill `title`.
- `[[[Nom d'état]]]` is a print only callout. It is stripped from the web rendering and expands to the full state text on the printed plates.
- A blank line separates paragraphs. A single newline is a line break.
- Explicit markup is case insensitive, but matches on nothing else. Accents, apostrophes, spacing, and punctuation must be exact or `pnpm data:check` fails.
- Do not use Markdown in a JSON field. A `#` heading, a list marker, a link, or an emphasis run other than `***gras***` renders literally.

## Typography that breaks matching

- Use the straight apostrophe `'`. Skill titles are written `Peau d'écorce` and `Chef-d'œuvre`. A curly apostrophe inside `[[...]]`, `{{...}}`, a state `name`, or a skill `title` fails the build. The printed plates render a curly apostrophe through the typesetter; that is the render, not the source.
- Do not insert a narrow no-break space or a no-break space before `:`, `;`, `?`, or `!`. There are none under `data/` today. One inside a keyword or a marked name breaks matching invisibly, because the character is not distinguishable on screen.
- Do not use U+2013 or U+2014 in prose. U+2014 is permitted only as the entire value of a stat field such as `range` or `duration`, where it is a display token meaning not applicable.
