# Add a tag

Produces one new tag: a label a skill can carry in its card footer, with a definition in its tooltip, a value in one of the skills filters, and a word rule text can cite as « l'étiquette X ». Also the page to read before tagging a skill at all.

## Before anything: does the skill need a tag?

A skill has three reserved slots, and none of them is mandatory:

- **Pratique**: how the skill is practised. One at most.
- **École**: the family its effect belongs to. One or two, and each must accept the Pratique when one is set. A second École is kept for a skill whose effect truly belongs to both families, as Dépouille belongs to Illusion and to Nécromancie.
- **Spéciale**: a particularity that carries, or will carry, a rule. As many as needed.

For each slot, ask whether this skill needs it for balance, flavour or a combo. If the answer is no, leave the slot empty; if no slot applies, leave `tags` out of the skill. A base action is judged like any other skill; a skill that only changes the character sheet when bought carries no tag. The definitions in `data/meta/tags.json` guide the choice, they do not compute it: when a rule of thumb and the skill's flavour disagree, flavour and combos win.

## When a new tag is justified

Almost never. The list stays short on purpose, because every tag is a lever other rules can pull. Create one only when:

- no declared tag covers a skill that genuinely needs the slot, or
- a mechanic is shared across several trees and rules will need to cite it, the way `Cri` is. A class specific family counts.

Never create a tag for a single skill, and never create one in advance of the skills that carry it: `pnpm data:check` fails on a declared tag no skill carries.

## The file to edit

```
data/meta/tags.json
```

It holds three groups, `practices`, `schools` and `specials`. Add the entry to the group of its slot. Read the file for the current members; never work from a copy of the list.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `key` | required | Clé d'étiquette, telle qu'elle est déclarée dans data/meta/tags.json. | lowercase English kebab case, unique across the three groups |
| `practices` | schools only | Les Pratiques que cette École accepte : la matrice Pratique x École. Ouvrir une case est une décision d'équilibrage. | one or more keys from `practices` |
| `labelFr` | required | The printed French label. | unique across the file |
| `labelEn` | required | The printed English label. | unique across the file |
| `definitionFr` | required | Texte de l'infobulle de l'étiquette, en clair et sans balisage. | plain text |
| `definitionEn` | required | Texte anglais de l'infobulle. | plain text |

Key order is the order of this table.

## A complete example

An École accepting two Pratiques:

```json
{
  "key": "illusion",
  "practices": [
    "spell",
    "technique"
  ],
  "labelFr": "Illusion",
  "labelEn": "Illusion",
  "definitionFr": "L'art du faux-semblant. Ses Compétences trompent les sens et le jugement, font voir ce qui n'est pas et cachent ce qui est.",
  "definitionEn": "The art of false appearances. Its Skills deceive the senses and judgement, show what is not and hide what is."
}
```

A skill carrying it:

```json
"tags": {
  "practice": "spell",
  "schools": [
    "illusion"
  ]
},
```

## Writing the definition

A definition says what the tag means at the table, with a touch of flavour, in real sentences. An École describes what its Compétences do (« L'art du faux-semblant. Ses Compétences… »), never an order to the character. Never define a tag by listing the others it is not: the list grows and the definition drifts. Write French first through the `aubaine-prose` skill, then the English.

## The steps

1. Add the entry to `data/meta/tags.json`.
2. For a new Pratique, decide for every École whether it accepts it, and add the key to each `practices` list that should.
3. Tag the skills that need it, in the same change.
4. If rule text will cite it, write « l'étiquette » followed by the French label exactly.
5. Record the addition as an addendum in [0020](../adr/0020-skill-tags-are-three-optional-slots-and-every-hovered-word-is-defined.md).

## What appears on the site

- The chip in the footer of every skill that carries the tag, in both locales, with the definition on hover and keyboard focus.
- A new value in the Pratique, École or Spéciale filter on `/fr/competences` and `/en/skills`.
- A row on `/fr/regles` and `/en/rules`, filed under the `Étiquette` family, whose detail shows the definition. A tag a rule term reads, as `Sort` reads `spell`, has no row of its own: the rule term's row also files under the tags.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails on a tag declared twice, a label used twice, a tag no skill carries, a key used in the wrong slot, an École paired with a Pratique it does not accept, an École repeated on one skill, a third École, and a French citation of an undeclared label.

## Traps

**Rename a label, never a key.** Keys are machine values stored in every skill file. A new label changes the chip and the filter everywhere; a new key breaks every skill that used the old one.

**`spell` is read by code.** The `Sort` rule term in `RULE_TERMS` reads its tooltip from the `spell` tag. Renaming or removing that key stops the build.

**Retire a tag from every skill before removing it.** A skill naming an undeclared key fails the build.

**Tags are not keywords.** A tag label is not marked in prose. Only `Sort` marks, because it is also a rule term.

**Book chapters cache their tooltips.** Delete `node_modules/.astro` before rebuilding after a definition change, as [add-an-image.md](add-an-image.md) explains.
