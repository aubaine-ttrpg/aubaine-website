# Add a basic skill

Produces one Compétence de base: something every creature can do, that costs no XP and belongs to no tree. It is listed in the skills index and on the Rules page.

## The files to create and edit

Create the skill:

```
data/skills/<ID>.json
```

Then add its id to the list, in printing order:

```
data/skill-lists/basic-skills.json
```

Two steps. A skill file on its own is not a basic skill; the list is what makes it one.

## The fields

The skill file uses the ordinary skill schema. See [add-a-skill.md](add-a-skill.md) for the full table. What a basic skill does differently:

| Field | Value for a basic skill | Why |
| --- | --- | --- |
| `showXp` | `false` | Absent vaut true. false pour une Compétence octroyée par un équipement ou par un autre nœud, et jamais achetée : le jeton doré disparaît. |
| `tier` | `1` | Required by the schema, but the price is never shown. |
| `energy` | leave out | A basic skill has no energy cost line. |
| `domains` | `[]` | `[]` vaut Neutre. |

The list file, `data/skill-lists/basic-skills.json`:

| Field | Required | What it means | Allowed values |
| --- | --- | --- | --- |
| `name` | required | The printed name of the list. | any non empty string |
| `subtitle` | optional | The line under the name. | any non empty string |
| `note` | optional | A paragraph printed with the list. It is also the note behind the `Compétences de base` source button in the skills index. | any non empty string |
| `skills` | required | Identifiants, dans l'ordre d'impression. | 1 or more skill ids that exist |

## A complete example

`data/skills/IMPROV-001.json`:

```json
{
  "id": "IMPROV-001",
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
  "description": "Vous tentez quelque chose qu'aucune Compétence ne couvre. Dites ce que votre personnage cherche à obtenir et comment il s'y prend.\n\nLe MJ répond trois choses : si c'est possible, ce que la tentative coûte et risque, et quel {{jet}} la tranche. Une tentative dont l'issue ne fait aucun doute aboutit sans {{jet}}.\n\nCette page n'est pas une liste fermée. Les Compétences qui suivent sont celles qui reviennent à toutes les tables ; tout ce que la fiction autorise se joue de la même manière."
}
```

`data/skill-lists/basic-skills.json`, whole file:

```json
{
  "name": "Compétences de base",
  "subtitle": "Ce que toute créature sait faire",
  "note": "Toute créature possède les Compétences de base, du premier round de la première séance à la fin de la campagne. Elles ne coûtent pas de PX, n'occupent pas de Mémoire, ne demandent pas d'Énergie, et aucun Arbre ne les vend.",
  "skills": [
    "IMPROV-001",
    "ATTAQU-001",
    "ATTOPP-001",
    "COURIR-001",
    "DESENG-001",
    "ESQUIV-001",
    "AIDERX-001",
    "CACHER-001",
    "CHERCH-001",
    "BOUSCU-001",
    "AGRIPP-001",
    "PREPAR-001",
    "FUITEX-001"
  ]
}
```

## What appears on the site

- `/fr/competences` and `/en/skills`: a row in the skill index, with `Compétences de base` as its source, filterable by that source alongside the trees and the Banque Commune. Its source button opens the list's `note`.
- `/fr/regles` and `/en/rules`: a row filed under the `Compétence de base` family, whose detail is the full skill card.
- Both lists sort alphabetically by title, so the order in `skills` does not decide the screen order; it decides the printed order.
- Anywhere rule text writes `{{IMPROV-001}}`, the title prints as a link with a tooltip, and the link opens the skill's entry in the skill index. The reference names the skill by its id, never by its title.
- `/fr/recherche` and `/en/search`: a row under the skills group.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails if `basic-skills.json` names an id with no skill file.

## Traps

**The id is drawn from the French title, and the first skill to hold the letters keeps them.** Basic skills were given their ids first, so they hold the plain letters. `IMPROV-001` is the basic skill Improviser; Artisan's Improvisation takes the next free letters, `IMPROI-001`. See [choose-a-skill-id.md](choose-a-skill-id.md).

**`showXp: false`, not `xpOverride: 0`.** `tier` is required and the schema has no way to omit a price, so you hide the token instead. A basic skill costs no XP and no Memory.

**A tag on a basic skill reaches everyone.** Every character has every basic skill, so a combo that cites one of its tags applies to the whole table. Judge each slot as for any other skill, by the test in [add-a-tag.md](add-a-tag.md), and fill it only when the skill needs it: `ESQUIV-001` carries Technique and Protection, `RECOLT-001` only Technique.

**Leave `energy` out entirely.** A basic skill has no energy cost. Writing `"energy": 0` would print a `0 énergie` pill, which says something different: that the skill has an energy line and it reads zero.

**Two steps, and the second one is easy to forget.** Adding `data/skills/<ID>.json` without adding the id to `basic-skills.json` produces a skill that appears nowhere.

**The list has an English overlay.** `data/skill-lists/basic-skills.en.json` carries the `name`, `subtitle` and `note` shown on `/en/`. An edit to the French `note` leaves the English one saying something else until you edit it too.

**A manoeuvre that replaces an attack writes `"activation": "1 Attaque"`.** From the schema: `1 Attaque pour une manœuvre qui remplace une Attaque`.

**A reaction states its trigger at the head of its description, never in `activation`.** `Une Réaction énonce son déclencheur en tête de sa description, jamais ici.`

**Never write `"key": null`.** Leave the key out.
