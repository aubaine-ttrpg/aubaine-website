# Add a material

Produces one entry in the Matériaux index: its Types, its Valeur, and every environment whose Loot Table gives it.

## The file to create

```
data/materials/<slug>.json
```

The filename is the slug, and the slug is the material's id: lowercase, no accents, hyphens between words, as `branche-morte.json` or `coeur-d-if.json`. An environment's Loot Table names the material by that slug. A material and an environment never share a slug, because both open in the same index.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `name` | required | Nom imprimé du matériau. | any non empty string |
| `status` | optional | Maturité de l'entrée, de la moins arrêtée à la plus arrêtée. 'draft' est en cours d'écriture et n'est pas encore jouable : les listes le masquent tant que le lecteur n'affiche pas les brouillons ; 'playtest', 'beta' et 'draft' portent un badge ; 'balanced' n'en porte aucun mais interrompt l'héritage. Absent : la valeur est héritée de ce qui possède l'entrée, un arbre, une Espèce, une pièce d'équipement ou une panoplie, dans cet ordre. | `draft`, `playtest`, `beta`, `balanced` |
| `types` | required | Types de matière, des clés déclarées dans data/meta/material-types.json. Dans une même fabrication, le matériau ne compte que pour l'un d'eux. | 1 or more keys from `data/meta/material-types.json` |
| `value` | required | Valeur de matière : ce que le matériau apporte au coût d'une recette, et ce qu'il rapporte revendu, en pièces d'argent. | integer, 1 or more |
| `description` | required | Une phrase de saveur : l'allure du matériau, là où on le trouve. Aucune règle. | one sentence of plain text |

## A complete example

`data/materials/bois-petrifie.json`, a material with two Types:

```json
{
  "name": "Bois pétrifié",
  "status": "playtest",
  "types": [
    "bois",
    "gemme"
  ],
  "value": 3,
  "description": "Tronc changé en pierre, veiné de couleurs sous le sable."
}
```

## What appears on the site

- `/fr/materiaux` and `/en/materials`: a row in the list, with its Types, its Valeur and the environments that give it. Its detail lists each of those environments with its Loot Die and the rolls that give the material.
- `/fr/recherche` and `/en/search`: a row under Matériaux.
- A material that no Loot Table names is still listed. Its detail simply has no « Où le trouver ».

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails on a Type that `data/meta/material-types.json` does not declare, and on a slug an environment already uses.

## Traps

**A Type is a key, not a label.** Write `metal`, not `Métal`. Recipes are the exception: `craft.materials` on an item still names Types by their French label, `"Métal"`, and `pnpm data:check` refuses a label the vocabulary does not declare.

**The land gives what you gather or find lying there.** A branch, an ore, a shed skin or a bleached bone comes from an environment. A part you have to take from a creature, such as a Peau de loup, is that creature's loot, not the forest's.

**Valeur follows the find.** The materials environments give today run from 1, the ordinary find, to 3, the find at the top of a table.

**The English overlay carries `name` and `description`.** Nothing else in the file is translated.
