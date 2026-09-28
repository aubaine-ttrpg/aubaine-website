# Add an environment

Produces one environment in the Matériaux index: its Loot Die and its Loot Table, the table the basic skill Récolter rolls on once per Repos long.

## The file to create

```
data/environments/<slug>.json
```

The filename is the slug and the id, lowercase with hyphens and no accents: `foret.json`, `souterrain.json`. It must not equal a material's slug, because both open in the same index.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `name` | required | Nom imprimé de l'environnement. | any non empty string |
| `status` | optional | Maturité de l'entrée, de la moins arrêtée à la plus arrêtée. 'draft' est en cours d'écriture et n'est pas encore jouable : les listes le masquent tant que le lecteur n'affiche pas les brouillons ; 'playtest', 'beta' et 'draft' portent un badge ; 'balanced' n'en porte aucun mais interrompt l'héritage. Absent : la valeur est héritée de ce qui possède l'entrée, un arbre, une Espèce, une pièce d'équipement ou une panoplie, dans cet ordre. | `draft`, `playtest`, `beta`, `balanced` |
| `icon` | required | Nom Iconify de l'icône, dessinée devant le nom de l'environnement. | an `mdi:` or `game-icons:` name whose SVG is on disk |
| `die` | required | Nombre de faces du Dé de butin de cet environnement, que lance la Compétence Récolter. | integer, 2 or more |
| `description` | required | Une phrase : ce que l'environnement recouvre et ce qu'on y ramasse. Aucune règle. | one sentence of plain text |
| `loot` | required | La Table de butin, du plus petit résultat au plus grand. Les lignes couvrent chaque face du dé, une seule fois chacune. | 1 or more rows |
| `loot[].from` | required | Premier résultat du dé qui donne cette ligne. | integer, 1 or more |
| `loot[].to` | required | Dernier résultat du dé qui donne cette ligne. | integer, at least `from` |
| `loot[].material` | required | Matériau obtenu, le nom de son fichier dans data/materials/. | a material slug that exists |
| `loot[].quantity` | required | Combien de ce matériau la ligne donne. | integer, 1 or more |

## A complete example

`data/environments/cote.json`:

```json
{
  "name": "Côte",
  "status": "playtest",
  "icon": "game-icons:wave-crest",
  "die": 8,
  "description": "Grèves, falaises et laisses de mer, que la marée vide et remplit deux fois par jour.",
  "loot": [
    {
      "from": 1,
      "to": 2,
      "material": "algue",
      "quantity": 1
    },
    {
      "from": 3,
      "to": 3,
      "material": "algue",
      "quantity": 2
    },
    {
      "from": 4,
      "to": 4,
      "material": "bois-flotte",
      "quantity": 1
    },
    {
      "from": 5,
      "to": 5,
      "material": "bois-flotte",
      "quantity": 2
    },
    {
      "from": 6,
      "to": 6,
      "material": "coquillage-nacre",
      "quantity": 1
    },
    {
      "from": 7,
      "to": 7,
      "material": "coquillage-nacre",
      "quantity": 2
    },
    {
      "from": 8,
      "to": 8,
      "material": "perle",
      "quantity": 1
    }
  ]
}
```

## What appears on the site

- `/fr/materiaux` and `/en/materials`: a row in the list with its Loot Die, and a detail holding the whole Loot Table, each material in it linked to its own entry.
- Every material the table names lists this environment under « Où le trouver », with the rolls that give it.
- `/fr/recherche` and `/en/search`: a row under Matériaux.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails when the rows skip a face, repeat one or run past the die, when a row names a material that does not exist, and when the icon has no SVG under `data/media/icons/`.

## Traps

**The rows cover every face once, in order.** The first row starts at 1, each row starts where the last one stopped, and the last one ends on `die`. A single face is a row whose `from` equals its `to`.

**Build the table like a hunt's reward.** The low faces give the ordinary find, a face above them gives two of it, and the top face gives the find worth the roll. Two rows may name the same material with different quantities.

**A richer place rolls a larger die.** A larger die makes room for more rows, and so for more materials and more steps between the ordinary and the excellent.

**Fetch the icon before naming it.** Icons come from the Iconify API as plain SVG, the way [add-an-image.md](add-an-image.md) and [../third-party-assets.md](../third-party-assets.md) describe.

**The English overlay carries `name` and `description`.** The table itself is numbers and slugs, and is never translated.
