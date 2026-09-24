# Add a set

Produces a set block on every piece that belongs to it, listing the tiered bonuses by number of pieces worn.

## The file to create

```
data/equipment/sets/<ID>.json
```

The filename is the set id. Existing sets use five capital letters: `TRAQU.json`, `BASTI.json`. The id inside the file must match the filename, and it is what each piece writes in its `set` field.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `id` | required | Identifiant, celui qu'une pièce nomme dans `set`. | any non empty string, matching the filename |
| `status` | optional | Maturité de l'entrée, de la moins arrêtée à la plus arrêtée. 'draft' est en cours d'écriture et n'est pas encore jouable ; 'playtest', 'beta' et 'draft' portent un badge ; 'balanced' n'en porte aucun mais interrompt l'héritage. Absent : la valeur est héritée de ce qui possède l'entrée, un arbre, une pièce d'équipement ou une panoplie, dans cet ordre. | `draft`, `playtest`, `beta`, `balanced` |
| `name` | required | The printed name of the set. | any non empty string |
| `bonuses` | required | Les paliers, par nombre de pièces croissant. | 1 or more tiers |
| `bonuses[].pieces` | required | Combien de pièces doivent être portées ensemble. Deux au minimum : un palier à une pièce est une propriété de cette pièce. | integer, 2 or more |
| `bonuses[].text` | required | The rule text of that tier. | any non empty string, with rule markup |
| `bonuses[].grants` | optional | Skills the tier grants, defined in `data/skills/`. | 1 or more skill ids that exist |

## A complete example

`data/equipment/sets/TRAQU.json`:

```json
{
  "id": "TRAQU",
  "name": "Panoplie du Traqueur",
  "bonuses": [
    {
      "pieces": 2,
      "text": "Vous gagnez la Compétence {{Sillage}}. Elle n'occupe aucune Mémoire et n'a pas à être apprise.",
      "grants": [
        "SILLA-01"
      ]
    },
    {
      "pieces": 4,
      "text": "La première fois que vous touchez une créature alors que vous êtes [[Caché]] au cours d'un combat, elle subit 1d6 dégâts supplémentaires."
    }
  ]
}
```

A piece joins the set by naming it. `data/equipment/items/capuche-de-traque.json`:

```json
{
  "name": "Capuche de traque",
  "section": "tetes",
  "position": 0,
  "kind": "Tête",
  "rarity": "uncommon",
  "art": "armure-de-cuir-1_1-og.png",
  "price": 10000,
  "set": "TRAQU",
  "headlines": [
    {
      "label": "Perception",
      "value": "1 Avantage"
    }
  ],
  "craft": {
    "discipline": "artisanat",
    "cost": 25,
    "materials": [
      "Cuir"
    ],
    "sequence": [
      "13 (Dex)"
    ]
  },
  "description": "Capuche doublée qui laisse les oreilles libres. Elle coupe le vent sans couper le bruit."
}
```

## What appears on the site

- `/fr/equipement` and `/en/equipment`: every piece carrying `"set": "TRAQU"` shows the set name and the list of tiers, in increasing piece order.
- A skill named in `grants` lists the set as one of the places it is obtained.
- The set file alone shows nothing. A set with no piece pointing at it is invisible.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails if a piece names a set that does not exist, or if a tier grants a skill id with no file.

## Traps

**A set's `status` is only ever inherited, never printed.** A set has no page of its own and its bonuses are not rendered anywhere, so the value shows up solely on the skills its tiers grant, and only where no tree and no item already cover them. `SILLA-01` is the case it exists for: the Traqueur set is its only owner.

**A one piece tier is not a set bonus.** The schema requires at least two: `Deux au minimum : un palier à une pièce est une propriété de cette pièce.` Put it in that piece's `properties` instead.

**Write the tiers in increasing piece order.** `Les paliers, par nombre de pièces croissant.`

**The link is declared on the piece, not on the set.** The set does not list its pieces. Each piece writes `"set": "<ID>"`. Adding a piece to a set means editing the piece file.

**A granted skill is usually `"showXp": false`.** It is never bought, so the gold XP token should not be shown on it.

**Rule markup works in `text`.** `{{Nom de compétence}}` for a skill, `[[Nom d'état]]` for a state. Both must resolve.

**Never write `"grants": null`.** Leave the key out on a tier that grants nothing.
