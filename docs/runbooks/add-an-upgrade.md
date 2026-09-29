# Add an upgrade

Produces one extra block under a skill card, with its own title, its own XP price and its own rule text.

## The file to edit

```
data/skills/<ID>.json
```

No new file. An upgrade is an object inside the `upgrades` array of the skill it extends. It has no id, no position and no stat line of its own. From the schema: `Amélioration imbriquée : une extension de la Compétence de base, sans identifiant, sans position et sans ligne de stats propre. Deux améliorations peuvent partager un niveau.`

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `level` | required | Palier dans l'échelle de la Compétence. La base est implicitement au niveau 1. | integer 2 to 10 |
| `tier` | required | Palier de prix : PX rendu = 5 × tier. | integer 1 to 10 |
| `xpOverride` | optional | Prix saisi par le concepteur, qui remplace celui du tier. | integer 0 to 100 |
| `title` | required | The printed name of the upgrade. | any non empty string |
| `domains` | optional | Absent vaut hérité de la base, `[]` vaut explicitement aucun, rempli remplace. Ces trois états sont distincts et ne doivent jamais être confondus. | 0 to 2 keys from `data/meta/domains.json` |
| `characteristics` | optional | Absent vaut hérité, `[]` vaut explicitement aucune, rempli remplace. | keys from `data/meta/characteristics.json` |
| `description` | required | Texte de règle de l'amélioration, même balisage que la Compétence de base. | any non empty string |

Upgrades are rendered by increasing level, whatever order you write them in. Write them in order anyway.

## A complete example

`data/skills/RAGEXX-001.json`, whole file:

```json
{
  "id": "RAGEXX-001",
  "title": "Rage",
  "type": "active",
  "tier": 1,
  "domains": [
    "physical"
  ],
  "activation": "1 Action Bonus",
  "range": "Personnel",
  "duration": "jusqu'à 10 minutes",
  "energy": 2,
  "tags": {
    "practice": "rage",
    "schools": [
      "enhancement",
      "protection"
    ]
  },
  "description": "Le sang vous bat aux tempes et la douleur recule. Tant que {{RAGEXX-001}} dure, vous êtes {{enrage}}.\n\n{{RAGEXX-001}} dure jusqu'à la fin de votre prochain tour. Chacune des choses suivantes, au moment où elle arrive, la prolonge jusqu'à la fin de votre prochain tour.\n\n***Frapper.*** Vous portez une {{attaque}} contre une créature hostile.\n***Encaisser.*** Vous subissez des dégâts.\n***Contraindre.*** Vous forcez une créature hostile à effectuer un {{jet}} pour résister à l'une de vos Compétences.\n***Tenir.*** Vous dépensez une {{action-bonus}} à la prolonger.\n\n{{RAGEXX-001}} prend fin plus tôt si vous cessez d'être {{enrage}}.",
  "upgrades": [
    {
      "level": 2,
      "tier": 3,
      "title": "Rage ardente",
      "description": "Tant que {{RAGEXX-001}} dure, vos {{attaque|Attaques}} infligent 2 dégâts de plus."
    },
    {
      "level": 3,
      "tier": 7,
      "title": "Rage redoublée",
      "description": "Tant que {{RAGEXX-001}} dure, vos {{attaque|Attaques}} infligent 3 dégâts de plus au lieu de 2."
    },
    {
      "level": 4,
      "tier": 10,
      "title": "Rage sans fin",
      "description": "Tant que {{RAGEXX-001}} dure, vos {{attaque|Attaques}} infligent 4 dégâts de plus au lieu de 3, et {{RAGEXX-001}} peut durer jusqu'à 1 heure."
    }
  ]
}
```

Three upgrades at tier 3, 7 and 10, so 15 XP, 35 XP and 50 XP.

For a price above 50 XP you need `xpOverride`, because tier 10 stops at 50. `data/skills/AVIFLA-001.json` does it:

```json
    {
      "level": 4,
      "tier": 10,
      "xpOverride": 75,
      "title": "Fournaise",
      "description": "Lorsque vous lancez {{AVIFLA-001}}, vous pouvez dépenser 3 {{energie|Énergies}} de plus pour lancer Fournaise. Les flammes atteignent la taille d'une cabane, elles infligent 4d12 dégâts de Feu et chaque dimension de leur zone augmente de 4,5 m."
    }
```

## What appears on the site

On `/fr/arbre/barbare/RAGEXX-001` and `/en/tree/barbare/RAGEXX-001`, each upgrade is a block under the base card in the pane beside the plate, by increasing level, with its title, its XP price and its rule text. The plate node itself is unchanged: an upgrade never draws a node.

## How to check it

```
pnpm data:check
pnpm dev
```

## Traps

**`domains` and `characteristics` have three distinct states on an upgrade.**

- Key absent: inherited from the base skill.
- `[]`: explicitly none.
- Filled array: replaces the base entirely, it does not add to it.

The schema says it plainly: `Ces trois états sont distincts et ne doivent jamais être confondus.` Once a file has been flattened the difference between "absent" and "`[]`" cannot be recovered, so get it right the first time.

**An upgrade carries no tags.** A tag classifies the whole skill, so it lives on the base skill only. The schema rejects `tags` on an upgrade.

**Never write `"domains": null`.** Leave the key out. `null` is not one of the three states and `pnpm data:check` rejects it.

**XP is `5 × tier` unless `xpOverride` says otherwise.** Do not write both a tier and an override that agree; write the override only when the tier cannot reach the price you want.

**An upgrade is not a derived skill.** If the step needs its own node, its own stat line or its own position on the plate, it is a separate skill file with `evolvesFrom` pointing at the base, not an upgrade. `evolvesFrom` is `Réservé aux nœuds rattachés à une base, jamais aux améliorations imbriquées.`

**Same markup as the base.** `***gras***`, `{{clé}}`, `{{clé|texte}}`, blank line for a paragraph break. `{{enrage}}` prints the state's name, `Enragé`.
