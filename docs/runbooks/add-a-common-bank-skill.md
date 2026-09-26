# Add a common bank skill

Produces one skill any character can buy with XP without belonging to a tree, reserved only by the `prerequisite` it may carry.

## The files to create and edit

Create the skill:

```
data/skills/<ID>.json
```

Then add its id to the list, in printing order:

```
data/skill-lists/common-bank.json
```

Two steps. The skill file alone puts the skill nowhere; the list is what makes it a bank skill.

## The fields

The skill file uses the ordinary skill schema. See [add-a-skill.md](add-a-skill.md) for the full table. What a bank skill does differently:

| Field | Value for a bank skill | Why |
| --- | --- | --- |
| `domains` | `[]` | A bank skill belongs to no domain. `[]` vaut Neutre. |
| `tier` | the real price tier | It is bought, so the XP token is shown. Leave `showXp` out. |

The list file, `data/skill-lists/common-bank.json`:

| Field | Required | What it means | Allowed values |
| --- | --- | --- | --- |
| `name` | required | The printed name of the list. | any non empty string |
| `subtitle` | optional | The line under the name. | any non empty string |
| `note` | optional | A paragraph printed with the list. It is also the tooltip of the rule term `Banque Commune`. | any non empty string |
| `skills` | required | Identifiants, dans l'ordre d'impression. | 1 or more skill ids that exist |

## A complete example

`data/skills/REPVIF-001.json`:

```json
{
  "id": "REPVIF-001",
  "title": "Repli vif",
  "type": "active",
  "tier": 2,
  "domains": [],
  "characteristics": [
    "dexterity"
  ],
  "activation": "1 Action Bonus",
  "range": "Personnelle",
  "duration": "Instantanée",
  "energy": 0,
  "tags": {
    "practice": "manoeuvre",
    "schools": [
      "mobility"
    ]
  },
  "description": "Vous décrochez du contact sans laisser d'ouverture derrière vous.\n\nVous jouez la Compétence de base {{Se désengager}} avec une Action Bonus au lieu d'une Action."
}
```

`data/skill-lists/common-bank.json`, whole file:

```json
{
  "name": "Banque Commune",
  "subtitle": "Compétences libres · aucun arbre, aucun prérequis",
  "note": "Les Compétences de la Banque Commune sont indépendantes les unes des autres. N'importe quel personnage peut en acheter une à tout moment, quels que soient ses arbres : elles ne demandent que leur coût en PX. Rien n'empêche un marchand de se glisser dans l'ombre, ni un artisan de reprendre son souffle au milieu d'une mêlée.",
  "skills": [
    "REPVIF-001",
    "PASDIS-001",
    "ELANXX-001",
    "MAILES-001",
    "GARHAU-001",
    "OEIEST-001",
    "INSGUE-001",
    "PIESUR-001",
    "BARATI-001",
    "BRIFOR-001",
    "LANPAS-001"
  ]
}
```

`tier: 2` with no `xpOverride` means 10 XP.

## What appears on the site

- `/fr/competences` and `/en/skills`: a card in the skill index, with `Banque Commune` as its source, filterable by that source alongside the trees.
- Anywhere rule text writes `{{Repli vif}}`, the name becomes a cross reference with a tooltip carrying the type, the list name and the first lines of the description, and the link opens the skill's entry in the skill index.
- `/fr/recherche` and `/en/search`: a row under the skills group.
- Anywhere rule text or a chapter writes `Banque Commune` (`Common Bank` in English), the words carry the rule term's icon and a tooltip that reads the list's `note`. The rule term also has a row on `/fr/regles` and `/en/rules`, whose detail is that `note`.

A bank skill never appears on a plate. It has no placement, no `pos` and no `linked`.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails if `common-bank.json` names an id with no skill file.

## Traps

**The id is drawn from the French title, like any other skill's.** A bank skill carries no prefix: run `pnpm skill:id "<titre>"` and use what it prints. See [choose-a-skill-id.md](choose-a-skill-id.md).

**`energy: 0` is not the same as no `energy`.** Most bank skills write `"energy": 0` on purpose, to say the skill costs nothing where a reader would expect a cost. Leaving the key out says the skill has no energy line at all. Both are legal. Mean the one you write.

**A passive bank skill may not carry an energy cost above 0.** `"energy": 0` on a passive is allowed and is used by four bank skills today. Anything above 0 is rejected by the schema: `une Compétence passive ne coûte pas d'Énergie.`

**A species skill is listed here too, and keeps its own id.** A Compétence d'Espèce that a character did not keep at creation is bought from the Banque Commune, so its id goes in `common-bank.json` unchanged, and its `prerequisite` reserves it to its species or its sous-espèce or origine régionale. A Compétence a sub-species imposes never goes here, because no one buys it. See [add-a-species.md](add-a-species.md).

**Two steps, and the second one is easy to forget.** A skill file that no list and no tree names appears nowhere.

**Never write `"key": null`.** Leave the key out.

**The list's `note` is a definition.** It is the tooltip of the rule term `Banque Commune`, in both locales, so editing it rewrites that tooltip everywhere the words appear. Keep it a definition of the Banque Commune, and keep `common-bank.en.json` saying the same thing. The build fails if the note is removed.

**`{{Se désengager}}` must name a skill title exactly.** Cross references resolve by title, not by id, and `pnpm data:check` fails on a name that matches nothing.
