# Add an item

Produces one catalogue entry: a card in the equipment grid with its headline values, its rarity, its price, its properties and its craft block.

## The file to create

```
data/equipment/items/<slug>.json
```

The filename is the slug and the slug is the item's handle everywhere else. Lowercase, no accents, hyphens between words: `dague.json`, `pyro-catalyseur.json`, `capuche-de-traque.json`, `poudre-d-entrave.json`. There is no `id` field inside the file, the filename is the id.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `name` | required | The printed name. | any non empty string |
| `status` | optional | Maturité de l'entrée, de la moins arrêtée à la plus arrêtée. 'draft' est en cours d'écriture et n'est pas encore jouable : les listes le masquent tant que le lecteur n'affiche pas les brouillons ; 'playtest', 'beta' et 'draft' portent un badge ; 'balanced' n'en porte aucun mais interrompt l'héritage. Absent : la valeur est héritée de ce qui possède l'entrée, un arbre, une Espèce, une pièce d'équipement ou une panoplie, dans cet ordre. | `draft`, `playtest`, `beta`, `balanced` |
| `section` | required | Clé de la section du catalogue où la pièce est imprimée. | a `key` from `data/equipment/catalogue.json` |
| `position` | required | Rang dans sa section. | integer, 0 or more |
| `kind` | required | Nature de l'objet, rendue avec la rareté : Armure, Arme de mêlée. | free text |
| `rarity` | required | Clé de rareté, déclarée dans `data/meta/rarities.json`. | `common`, `uncommon`, `rare`, `very-rare`, `legendary`, `artifact` |
| `art` | optional | Illustration au rapport 1:1, dans `data/media/items/`. Plusieurs pièces peuvent partager la même. Absente, la fiche retombe sur l'illustration 1:1 par défaut. | a filename that exists, named per [add-an-image.md](add-an-image.md) |
| `price` | optional | Prix en pièces de bronze, la plus petite pièce : 100 bronze font 1 argent, 100 argent font 1 or. Un seul nombre. Absent : l'objet ne s'achète pas. | integer, 1 or more |
| `set` | optional | Identifiant d'une Panoplie déclarée dans `data/equipment/sets/`. | a set id that exists |
| `prerequisite` | optional | Condition à remplir pour équiper la pièce, rendue sous son nom : une Caractéristique et son seuil, une Espèce ou une sous-espèce. Absente : n'importe qui peut la porter. | free text, written like a skill's: `Être Squelette` |
| `headlines` | optional | Les valeurs par lesquelles l'entrée est consultée : CA et sa formule pour une armure, Dégâts pour une arme. L'entrée nomme elle-même son intitulé, le gabarit ne connaît aucun type d'objet. Absent : l'entrée n'a pas de bandeau, son texte suffit. | 1 or more `{ label, value }` |
| `stats` | optional | Cellules sous le bandeau. | `{ label, value }` pairs |
| `properties` | optional | Règles nommées portées par l'objet. Le nom porte sa ponctuation : « Finesse. » | `{ name, text }` pairs |
| `craft` | optional | Absent : l'objet ne se fabrique pas. | object, see below |
| `craft.discipline` | required inside `craft` | Clé déclarée dans `data/meta/disciplines.json`. | `artisanat`, `arcanes`, `technologie`, `science` |
| `craft.cost` | required inside `craft` | Valeur de matière totale à atteindre. | integer, 1 or more |
| `craft.materials` | required inside `craft` | Types de matière acceptés. Chacun doit être représenté. | 1 or more strings |
| `craft.sequence` | required inside `craft` | La fabrication dans l'ordre. Le travail physique précède le savoir. | 1 or more strings |
| `grants` | optional | Compétences accordées par la pièce, définies dans `data/skills/`. | 1 or more skill ids that exist |
| `text` | optional | Corps de l'entrée : ce que fait l'objet. | free text with rule markup |
| `description` | required | Une à deux phrases, rendues en italique sous le filet de pied. | any non empty string |

## A complete example

`data/equipment/items/dague.json`:

```json
{
  "name": "Dague",
  "section": "armes-melee",
  "position": 0,
  "kind": "Arme de mêlée",
  "rarity": "common",
  "art": "dague-1_1-og.png",
  "price": 200,
  "headlines": [
    {
      "label": "Dégâts",
      "value": "1d4 + Force"
    }
  ],
  "stats": [
    {
      "label": "Jet",
      "value": "Force + Mêlée"
    },
    {
      "label": "Portée",
      "value": "Contact (1,5m)"
    },
    {
      "label": "Type de dégâts",
      "value": "Perforants"
    },
    {
      "label": "Mains",
      "value": "1 main"
    }
  ],
  "properties": [
    {
      "name": "Finesse.",
      "text": "Cette arme peut utiliser Dextérité + Finesse à la place de Force + Mêlée. Lorsque vous le faites, utilisez également votre Dextérité à la place de votre Force pour ses dégâts."
    },
    {
      "name": "Légère.",
      "text": "Lorsque vous tenez une arme Légère dans chacune de vos mains et que vous effectuez une attaque avec l'une d'elles, vous pouvez utiliser votre Action bonus pour effectuer une attaque avec l'autre. Cette attaque n'ajoute pas sa Caractéristique à ses dégâts."
    },
    {
      "name": "Lancé (9m).",
      "text": "Cette arme peut être lancée sur une cible située jusqu'à 9 mètres. Lorsqu'elle est lancée, son Jet utilise Visée à la place de son Aptitude habituelle."
    }
  ],
  "craft": {
    "discipline": "artisanat",
    "cost": 2,
    "materials": [
      "Métal"
    ],
    "sequence": [
      "10 (Str)"
    ]
  },
  "description": "Lame de ceinture : on la garde à portée de main, on la lance au besoin."
}
```

An item that grants a skill, `data/equipment/items/pyro-catalyseur.json`:

```json
{
  "name": "Pyro-catalyseur",
  "section": "bijoux",
  "position": 0,
  "kind": "Bijou",
  "rarity": "common",
  "art": "pyro-catalyseur-1_1-og.png",
  "price": 1600,
  "headlines": [
    {
      "label": "Domaine",
      "value": "Feu"
    }
  ],
  "properties": [
    {
      "name": "Catalyseur.",
      "text": "Tant que cette pièce est équipée, vous pouvez activer vos Sorts, passifs comme actifs."
    },
    {
      "name": "Matériel.",
      "text": "Ce catalyseur peut être consommé comme matériau (Type : Catalyseur ; Valeur : 4)."
    }
  ],
  "craft": {
    "discipline": "arcanes",
    "cost": 16,
    "materials": [
      "Gemme"
    ],
    "sequence": [
      "12 (Dex)",
      "15 (Int)"
    ]
  },
  "grants": [
    "TRFEU-01"
  ],
  "description": "Gemme taillée où le feu tourne sans consumer sa monture. Elle chauffe la paume qui la tient."
}
```

## What appears on the site

- `/fr/equipement` and `/en/equipment`: a card in the catalogue grid, inside its section, at the rank given by `position`. The card carries the rarity badge, the price written in coins, the headline values, the stats, the properties and the craft block.
- The section and rarity filters on that page pick up the new values on their own.
- `/fr/recherche` and `/en/search`: a row under the items group.
- If the item has `grants`, the granted skill lists this item as one of the places it is obtained.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails on an unknown `section`, an unknown `rarity`, an unknown `craft.discipline`, an unknown `set`, or a `grants` id with no skill file.

## Traps

**An item's `status` carries to the skills it grants, but only where no tree already covers them.** A granting item is a fallback owner: a skill placed on a tree takes the tree's status, and the item's status reaches only the skills that no tree places, such as the catalyst skills.

**`price` is a single integer in bronze.** 100 bronze is 1 argent, 100 argent is 1 or. One number for one amount, because `{or: 1, argent: 0, bronze: 300}` and `{or: 1, argent: 3}` are the same money and nothing would say which was meant. Do not write `"2 pa"`, do not write a decimal, do not split the value across coins. Leave `price` out for an item that is not sold.

**The coins are a way of reading that number, and the site computes them.** `data/meta/coins.json` holds the three, each with its `bronzeValue`, and the price is split from the largest down with any coin that comes out at zero left out: `200` prints `2 argent`, `10400` prints `1 or 4 argent`, and `10001` prints `1 or 1 bronze` with no argent between them to read past.

**`headlines` names its own labels.** The template knows nothing about weapons or armour. Write `Dégâts` for a weapon, `CA` for armour, `Domaine` for a catalyst. Whatever you write in `label` is what is printed.

**`position` orders the item inside its section, and two items in the same section must not share one.** It is not a global rank.

**`grants` points at a skill that exists.** Create `data/skills/<ID>.json` first. A granted skill is usually written with `"showXp": false`, because it is never bought.

**A property name carries its own punctuation.** Write `"Finesse."` with the full stop, as the schema says: `Le nom porte sa ponctuation : « Finesse. »`

**Never write `"key": null`.** Leave the key out.

**Rule markup works in `text`, `description` and property texts.** `***gras***`, `[[Nom d'état]]`, `{{Nom de compétence}}`. Every name must resolve or `pnpm data:check` fails.

**Adding the file is enough.** The grid entry, the filter values and the search row all appear on their own.
