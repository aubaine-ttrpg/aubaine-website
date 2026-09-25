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

By convention, bank skill ids begin with `CB`: `CBREP-01`, `CBOMB-01`, `CBGUE-01`. Only three characters are left for the name, so pick them from the title.

## The fields

The skill file uses the ordinary skill schema. See [add-a-skill.md](add-a-skill.md) for the full table. What a bank skill does differently:

| Field | Value for a bank skill | Why |
| --- | --- | --- |
| `id` | starts with `CB` | Keeps the bank readable at a glance. Not enforced by the schema. |
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

`data/skills/CBREP-01.json`:

```json
{
  "id": "CBREP-01",
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
    "school": "mobility"
  },
  "description": "Vous décrochez du contact sans laisser d'ouverture derrière vous.\n\nVous effectuez l'Action de base {{Se désengager}} avec une Action Bonus au lieu d'une Action."
}
```

`data/skill-lists/common-bank.json`, whole file:

```json
{
  "name": "Banque Commune",
  "subtitle": "Compétences libres · aucun arbre, aucun prérequis",
  "note": "Les Compétences de la Banque Commune sont indépendantes les unes des autres. N'importe quel personnage peut en acheter une à tout moment, quels que soient ses arbres : elles ne demandent que leur coût en PX. Rien n'empêche un marchand de se glisser dans l'ombre, ni un artisan de reprendre son souffle au milieu d'une mêlée.",
  "skills": [
    "CBREP-01",
    "CBOMB-01",
    "CBELA-01",
    "CBMAI-01",
    "CBGAR-01",
    "CBEST-01",
    "CBGUE-01",
    "CBPIE-01",
    "CBBAR-01",
    "CBFOR-01",
    "CBPOL-01"
  ]
}
```

`tier: 2` with no `xpOverride` means 10 XP.

## What appears on the site

- `/fr/competences` and `/en/skills`: a card in the skill index, with `Banque Commune` as its source, filterable by that source alongside the trees.
- Anywhere rule text writes `{{Repli vif}}`, the name becomes a cross reference with a tooltip carrying the type, the list name and the first lines of the description, and the link opens the skill's entry in the skill index.
- `/fr/recherche` and `/en/search`: a row under the skills group.
- Anywhere rule text or a chapter writes `Banque Commune` (`Common Bank` in English), the words carry the rule term's icon and a tooltip that reads the list's `note`.

A bank skill never appears on a plate. It has no placement, no `pos` and no `linked`.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails if `common-bank.json` names an id with no skill file.

## Traps

**The id is permanent and unique across the whole repo.** The `CB` prefix leaves three characters for the name, which makes collisions easy. Check that `data/skills/<ID>.json` does not already exist before you pick one.

**`energy: 0` is not the same as no `energy`.** Most bank skills write `"energy": 0` on purpose, to say the skill costs nothing where a reader would expect a cost. Leaving the key out says the skill has no energy line at all. Both are legal. Mean the one you write.

**A passive bank skill may not carry an energy cost above 0.** `"energy": 0` on a passive is allowed and is used by four bank skills today. Anything above 0 is rejected by the schema: `une Compétence passive ne coûte pas d'Énergie.`

**A species skill is listed here too, and keeps its own id.** A Compétence d'Espèce that a character did not keep at creation is bought from the Banque Commune, so its id goes in `common-bank.json` without the `CB` prefix, and its `prerequisite` reserves it to its species or its origine régionale. See [add-a-species.md](add-a-species.md).

**Two steps, and the second one is easy to forget.** A skill file that no list and no tree names appears nowhere.

**Never write `"key": null`.** Leave the key out.

**The list's `note` is a definition.** It is the tooltip of the rule term `Banque Commune`, in both locales, so editing it rewrites that tooltip everywhere the words appear. Keep it a definition of the Banque Commune, and keep `common-bank.en.json` saying the same thing. The build fails if the note is removed.

**`{{Se désengager}}` must name a skill title exactly.** Cross references resolve by title, not by id, and `pnpm data:check` fails on a name that matches nothing.
