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

`data/skills/RAGER-01.json`, whole file:

```json
{
  "id": "RAGER-01",
  "title": "Rage",
  "type": "active",
  "tier": 1,
  "domains": [
    "blood"
  ],
  "activation": "1 Action Bonus",
  "range": "Personnelle",
  "duration": "Jusqu'à la fin de votre prochain tour",
  "energy": 2,
  "tags": {
    "practice": "manoeuvre",
    "school": "enhancement"
  },
  "description": "Vous entrez en rage. Vous êtes [[Enragé]] jusqu'à la fin de votre prochain tour.\n\nChacune des choses suivantes la prolonge d'un tour de plus, au moment où elle arrive.\n\n***Frapper.*** Vous effectuez un Jet d'Attaque contre un ennemi.\n***Encaisser.*** Vous subissez des dégâts.\n***Contraindre.*** Vous forcez un ennemi à effectuer un Jet pour résister à l'une de vos Compétences.\n***Tenir.*** Vous dépensez une Action Bonus à la prolonger.\n\nLa rage ne dure pas plus de 10 minutes d'affilée.\n\n[[[Enragé]]]",
  "upgrades": [
    {
      "level": 2,
      "tier": 3,
      "title": "Fureur",
      "description": "Tant que vous êtes [[Enragé]], vos Attaques infligent 2 dégâts de plus."
    },
    {
      "level": 3,
      "tier": 7,
      "title": "Fureur redoublée",
      "description": "Tant que vous êtes [[Enragé]], vos Attaques infligent 3 dégâts de plus au lieu de 2."
    },
    {
      "level": 4,
      "tier": 10,
      "title": "Fureur sans fin",
      "description": "Tant que vous êtes [[Enragé]], vos Attaques infligent 4 dégâts de plus au lieu de 3, et votre rage peut durer 1 heure d'affilée au lieu de 10 minutes."
    }
  ]
}
```

Three upgrades at tier 3, 7 and 10, so 15 XP, 35 XP and 50 XP.

For a price above 50 XP you need `xpOverride`, because tier 10 stops at 50. `data/skills/AVIVE-01.json` does it:

```json
    {
      "level": 4,
      "tier": 10,
      "xpOverride": 75,
      "title": "Fournaise",
      "description": "Lorsque vous lancez Aviver les flammes, vous pouvez dépenser 3 Énergies de plus pour lancer Fournaise. Les flammes atteignent la taille d'une cabane, elles infligent 4d12 dégâts de Feu et chaque dimension de leur zone augmente de 4,5 m."
    }
```

## What appears on the site

On `/fr/arbre/berserker/RAGER-01` and `/en/tree/berserker/RAGER-01`, each upgrade is a block under the base card in the skill list, by increasing level, with its title, its XP price and its rule text. The plate node itself is unchanged: an upgrade never draws a node.

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

**Same markup as the base.** `***gras***`, `[[Nom d'état]]`, `{{Nom de compétence}}`, `[[[Nom d'état]]]`, blank line for a paragraph break.
