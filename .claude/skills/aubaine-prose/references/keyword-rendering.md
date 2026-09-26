# Keyword rendering

Aubaine sets every load-bearing mechanical noun as an icon plus a coloured term. A player scanning a
plate finds what a rule depends on without reading the paragraph. This is the part of the house voice
that has to survive a rewrite of the prose around it.

Every link is an explicit reference by key, written by the author. A word without markup never
links. The index is built in `src/lib/game/build.ts` and applied in `src/lib/game/richtext.ts`, and
`docs/adr/0029-every-link-is-an-explicit-reference-by-key.md` records why. The printed plates in
`data/media/pdf/` show the result.

## The classes

| Class | Render | Key | List |
| --- | --- | --- | --- |
| Rule terms | own colour and icon | `slugify` of the French label, `{{action-bonus}}` | `RULE_TERMS` in `src/lib/game/build.ts` |
| Characteristics | per term colour and icon | `slugify` of `labelFr`, `{{dexterite}}` | `data/meta/characteristics.json` |
| Aptitudes | one shared colour and one shared icon, own definition | `slugify` of `labelFr`, `{{visee}}` | `data/meta/aptitudes.json` |
| States | kind colour and the state icon | the state `key`, its file name, `{{a-terre}}` | `data/states/` |
| Skills | badge, plus a tooltip carrying type, tree, and the opening of the description | the skill `id`, `{{TRAFEU-001}}` | `data/skills/` |

A Caractéristique's key comes from its French label, not from its English machine `key`: `{{dexterite}}`,
never `{{dexterity}}`.

Rule terms, Caractéristiques and Aptitudes each show their own definition in the tooltip, read from
`RULE_TERMS` and the `definitionFr` and `definitionEn` fields of their vocabulary file. Tags are not in
the index: each chip in a card footer shows its definition from `data/meta/tags.json`, and a tag
label never links. A definition, a tag's included, may itself carry references by key. The Rules page
renders them as links; a tooltip or a chip shows the same text flattened, each reference printing its
label or its written text, never its braces.

A skill enters the index if it is placed on a tree, named in a skill list, offered by a species,
or granted by an item or a set bonus, and it links to the first of those, in that order. A skill only
equipment grants links to its entry in the skills index.

Keys do not collide. A skill id has its own shape, and the build stops when two other entries answer
to the same key.

Every one of those lists grows. Read its source when you need the members, and never write a copy of
a vocabulary into prose, a rule, or a reference file: the copy is what falls out of date, and an
agent trusting the copy will miss terms that have since been added.

## What the writer controls

- `{{clé}}` links the entry and prints its default label: its label in the language the string is
  written in. A French string prints French labels, and so does a French string an English page
  falls back to. Only a string from an `.en` overlay prints English labels: an overlay writes
  `{{energie}}` and gets "Energy".
- `{{clé|texte}}` links the same entry and prints `texte` exactly as written, as plain text with no
  markup inside. Plurals and agreements go there: `{{entrave|Entravée}}`, `{{energie|Énergies}}`,
  `{{RAGEXX-001|cette Compétence}}`. No entry carries a list of inflected forms, so any wording is
  available without declaring it first.
- A word without markup is plain text and never links, whatever its capitals. A common word used in
  its ordinary sense is therefore safe as it is, and capitals stay a matter of house style.
- Reference what the reader should reach. Linking every occurrence turns a paragraph naming several
  pairs into a wall of pills.
- `pnpm data:check` fails on a key that does not resolve in the locale its string is written in, on
  `[[` anywhere, and on an icon the index names that has no file. It cannot see a term the author
  meant to link and left bare, nor written text that no longer agrees with its sentence: only
  reading the page catches those.
- Renaming a skill title or a state name moves no reference. It changes the default label wherever a
  reference writes no text, so read those sentences again after a rename.
- A tree or catalogue booklet prints every state and rule word its entries reference by key, with its
  definition, on its last pages. Nothing in the rule text asks for it beyond the reference.

## What the writer does not control

Activation, range, duration, the rest recharge, and the energy, karma, and life costs are fields. The render builds the
stat line from them with its own icons. Never restate them in prose.

## Book chapters

Chapters, the lore pages and the equipment guide resolve their references through a rehype plugin
registered in `astro.config.mjs`. The locale comes from the filename, so
`03-creer-un-personnage.en.md` resolves against the English index and prints English labels.

The plugin skips `code`, `pre`, existing links and every heading, so a formula and a section title
stay plain. Everything else runs through the same `parseRuns` as an entry, which is why there is one
matcher and not two.

The author chooses every link in a chapter, exactly as in an entry. Every `{{...}}` renders, every
time it is written, and nothing is marked on the author's behalf, at a first appearance or anywhere
else.

Astro caches compiled markdown in `node_modules/.astro`, keyed on the markdown, not on the plugin. A
change to the plugin therefore does nothing until that directory is removed. Deleting `.astro` at the
repository root is not enough and is the easy mistake to make.
