# Add a base action

Produces one card on the base actions page: something every creature can do, that costs no XP and belongs to no tree.

## The files to create and edit

Create the skill:

```
data/skills/<ID>.json
```

Then add its id to the list, in printing order:

```
data/skill-lists/basic-skills.json
```

Two steps. A skill file on its own is not a base action; the list is what makes it one.

## The fields

The skill file uses the ordinary skill schema. See [add-a-skill.md](add-a-skill.md) for the full table. What a base action does differently:

| Field | Value for a base action | Why |
| --- | --- | --- |
| `showXp` | `false` | Absent vaut true. false pour une Compétence octroyée par un équipement ou par un autre nœud, et jamais achetée : le jeton doré disparaît. |
| `tier` | `1` | Required by the schema, but the price is never shown. |
| `energy` | leave out | A base action has no energy cost line. |
| `domains` | `[]` | `[]` vaut Neutre. |

The list file, `data/skill-lists/basic-skills.json`:

| Field | Required | What it means | Allowed values |
| --- | --- | --- | --- |
| `name` | required | The printed name of the list. | any non empty string |
| `subtitle` | optional | The line under the name. | any non empty string |
| `note` | optional | A paragraph printed with the list. | any non empty string |
| `skills` | required | Identifiants, dans l'ordre d'impression. | 1 or more skill ids that exist |

## A complete example

`data/skills/IMPRO-01.json`:

```json
{
  "id": "IMPRO-01",
  "title": "Improviser",
  "type": "active",
  "tier": 1,
  "showXp": false,
  "domains": [],
  "characteristics": [
    "any"
  ],
  "activation": "1 Action",
  "range": "Spéciale",
  "duration": "Spéciale",
  "description": "Vous tentez quelque chose qu'aucune Compétence ne couvre. Dites ce que votre personnage cherche à obtenir et comment il s'y prend.\n\nLe MJ répond trois choses : si c'est possible, ce que la tentative coûte et risque, et quel Jet la tranche. Une tentative dont l'issue ne fait aucun doute aboutit sans Jet.\n\nCette page n'est pas une liste fermée. Les Compétences qui suivent sont celles qui reviennent à toutes les tables ; tout ce que la fiction autorise se joue de la même manière."
}
```

`data/skill-lists/basic-skills.json`, whole file:

```json
{
  "name": "Compétences de base",
  "subtitle": "Ce que toute créature sait faire",
  "skills": [
    "IMPRO-01",
    "ATTAQ-01",
    "OPPOR-01",
    "COURI-01",
    "DESEN-01",
    "ESQUI-01",
    "AIDER-01",
    "CACHE-01",
    "CHERC-01",
    "BOUSC-01",
    "AGRIP-01",
    "PREPA-01",
    "FUITE-01"
  ]
}
```

## What appears on the site

- `/fr/actions-de-base` and `/en/base-actions`: a card in the grid, with the type as a kicker, the rule text, and an `activation · range` line at the foot. The cards are sorted alphabetically by title, so the order in `skills` does not decide the screen order; it decides the printed order.
- Anywhere rule text writes `{{Improviser}}`, the name becomes a cross reference with a tooltip that links back to this page.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails if `basic-skills.json` names an id with no skill file.

## Traps

**The id is permanent and unique across the whole repo.** Base actions were imported first, so they hold the plain ids. `IMPRO-01` is the base action Improviser; Artisan's Improvisation had to become `IMPRV-01`. `BOUSC-01` is the base action Bousculer; Physique's Bousculade had to become `BOUSD-01`. See [../data-contract.md](../data-contract.md).

**`showXp: false`, not `xpOverride: 0`.** `tier` is required and the schema has no way to omit a price, so you hide the token instead. A base action costs no XP and no Memory.

**Leave `tags` out.** Every character has every base action from the start, so a tag on one would make each combo that cites the tag apply to everyone. See [add-a-tag.md](add-a-tag.md).

**Leave `energy` out entirely.** A base action has no energy cost. Writing `"energy": 0` would print a `0 énergie` pill, which says something different: that the skill has an energy line and it reads zero.

**Two steps, and the second one is easy to forget.** Adding `data/skills/<ID>.json` without adding the id to `basic-skills.json` produces a skill that appears nowhere.

**A manoeuvre that replaces an attack writes `"activation": "1 Attaque"`.** From the schema: `1 Attaque pour une manœuvre qui remplace une Attaque`.

**A reaction states its trigger at the head of its description, never in `activation`.** `Une Réaction énonce son déclencheur en tête de sa description, jamais ici.`

**Never write `"key": null`.** Leave the key out.
