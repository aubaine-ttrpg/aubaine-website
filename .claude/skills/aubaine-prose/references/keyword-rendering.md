# Keyword rendering

Aubaine sets every load-bearing mechanical noun as an icon plus a coloured term. A player scanning a
plate finds what a rule depends on without reading the paragraph. This is the part of the house voice
that has to survive a rewrite of the prose around it.

The index is built in `src/lib/game/build.ts` and applied in `src/lib/game/richtext.ts`. The
printed plates in `data/media/pdf/` show the result.

## The classes

| Class | Render | List |
| --- | --- | --- |
| Rule terms | own colour and icon, marked wherever they appear | `RULE_TERMS` in `src/lib/game/build.ts` |
| Characteristics | per term colour and icon | `data/meta/characteristics.json` |
| Aptitudes | one shared colour and one shared icon, own definition | `data/meta/aptitudes.json` |
| States | kind colour and the state icon | each `data/states/*.json` `name` and `forms` |
| Skills | badge, plus a tooltip carrying type, tree, and the opening of the description | each skill `title` |

Rule terms, Caractéristiques and Aptitudes each show their own definition in the tooltip, read from
`RULE_TERMS` and the `definitionFr` and `definitionEn` fields of their vocabulary file. Tags are not in
the index: each chip in a card footer shows its definition from `data/meta/tags.json`, and a tag
label is never marked in prose.

A skill enters the index if it is placed on a tree, named in a skill list, offered by a species,
or granted by an item or a set bonus, in that order. A skill only equipment grants links to its
entry in the skills index.

The index is first wins, in the order above. Two entries sharing a name collide, and the later one
never links.

Every one of those lists grows. Read its source when you need the members, and never write a copy of
a vocabulary into prose, a rule, or a reference file: the copy is what falls out of date, and an
agent trusting the copy will miss terms that have since been added.

## What the writer controls

- A bare keyword links automatically. Do not mark it up.
- Automatic linking compares the exact spelling, capital letters included. `Avantage` links,
  `avantage` does not. The pattern itself is case insensitive; the exactness comes from a spelling
  check applied to each hit.
- A word that changes shape is a different spelling, so it needs its own entry. French agreement is
  the common case: `Entravé` links and `Entravée` does not unless the state lists it under `forms`.
  Rule terms carry the same thing inline, which is why `RULE_TERMS` writes `['Avantage', 'Avantages']`.
  `Mémorisée` is the one rule term that also lists lowercase verb forms, `mémorisez` among them,
  because memorising and being Mémorisée are one state: write the verb in lowercase and it still marks.
- Index keys are lowercased and the index is first wins, so two spellings that differ only in case
  collapse into one entry and only the first can ever render. `Action Bonus` is the canonical form.
- A keyword must not touch a letter or digit on either side.
- `pnpm data:check` catches a state word that rule text writes but the index cannot mark, and it
  fails when an icon the index names has no file. Nothing checks the other classes, so the build
  still passes on a missed characteristic, Aptitude, or rule term and the reader quietly loses the
  affordance. Capitalization is a rendering decision, not a typographic preference.
- `[[...]]` and `{{...}}` are matched case insensitively but must otherwise be exact, accents,
  apostrophes, and spacing included, or `pnpm data:check` fails.
- `[[[...]]]` is stripped from the web and expands to the full state text on the printed plates. Use
  it when a plate should carry a state's rules beside the skill that applies it.

## What the writer does not control

Activation, range, duration, the rest recharge, and the energy, karma, and life costs are fields. The render builds the
stat line from them with its own icons. Never restate them in prose.

## Book chapters

Chapters go through the index too, by way of a rehype plugin registered in `astro.config.mjs`. The
locale comes from the filename, so `02-l-ame.en.md` is marked against the English index.

The plugin skips `code`, `pre`, existing links and every heading, so a formula and a section title
stay plain. Everything else runs through the same `parseRuns` as an entry, which is why there is one
matcher and not two.

A chapter glosses each rule term, characteristic and Aptitude **once**, at its first appearance, the
way a printed rulebook does. Marking every occurrence turned a paragraph naming several pairs into a
wall of pills. States and Skills are exempt: an author who writes `[[Agonie]]` or `{{Attaquer}}` asked
for that mark, so it renders every time.

Astro caches compiled markdown in `node_modules/.astro`, keyed on the markdown, not on the plugin. A
change to the plugin therefore does nothing until that directory is removed. Deleting `.astro` at the
repository root is not enough and is the easy mistake to make.
