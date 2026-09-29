# Place a skill on a tree

Produces one node on a plate, the line that joins it to its parent, and a page for that node where its card opens beside the plate.

## The file to edit

```
data/skill-trees/<tree-id>.json
```

No new file. A placement is an object inside the `placements` array of the tree. The skill itself already exists in `data/skills/<ID>.json` and is not touched.

The same skill can be placed in more than one tree. That is why the layout lives here and not in the skill file.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `skill` | required | Identifiant de la Compétence posée, définie dans `data/skills/`. | `^[A-Z0-9]{6}-[0-9]{3}$` |
| `pos` | optional | Absent : la Compétence est listée avec l'arbre mais n'a pas de pastille sur la planche. | `{ "x": 0-100, "y": 0-100 }` |
| `linked` | optional | Parents vers lesquels tracer un trait. Le trait compte au jeu : une Compétence ne s'achète que reliée à une Compétence déjà Apprise, et seul le cœur, sans lien, s'achète en premier. `CORE` vise le cœur de l'arbre. Déclaré d'un seul côté : jamais de doublon inverse. | 1 or more skill ids already placed in this tree, or the literal `CORE` |

`pos` is: `Centre du nœud, en pourcentage de la planche, origine en haut à gauche.` `x: 0` is the left edge, `y: 0` is the top edge. The schema adds: `Posé à l'intégration, pas à l'autorat.`

## A complete example

`data/skill-trees/barbare.json`, whole file. `RAGEXX-001` sits at the centre with no `linked`, every other node names its single parent:

```json
{
  "id": "barbare",
  "status": "playtest",
  "name": "Barbare",
  "subtitle": "Les forces de la nature",
  "treeType": "archetype",
  "size": 16,
  "cover": "barbare-3_4-og.png",
  "banner": "barbare-16_9-og.png",
  "backCover": "barbare-dos-3_4-og.png",
  "placements": [
    {
      "skill": "RAGEXX-001",
      "pos": {
        "x": 50,
        "y": 50.81
      }
    },
    {
      "skill": "CRIEFF-001",
      "pos": {
        "x": 50,
        "y": 37.92
      },
      "linked": [
        "RAGEXX-001"
      ]
    },
    {
      "skill": "CRIPRI-001",
      "pos": {
        "x": 50,
        "y": 26.14
      },
      "linked": [
        "CRIEFF-001"
      ]
    },
    {
      "skill": "CRICOL-001",
      "pos": {
        "x": 72.44,
        "y": 31.91
      },
      "linked": [
        "CRIEFF-001"
      ]
    },
    {
      "skill": "CRIRAL-001",
      "pos": {
        "x": 27.56,
        "y": 31.91
      },
      "linked": [
        "CRIEFF-001"
      ]
    },
    {
      "skill": "BONSAU-001",
      "pos": {
        "x": 65.79,
        "y": 44.37
      },
      "linked": [
        "RAGEXX-001"
      ]
    },
    {
      "skill": "FOULOU-001",
      "pos": {
        "x": 83.71,
        "y": 44.42
      },
      "linked": [
        "BONSAU-001"
      ]
    },
    {
      "skill": "PEABRU-001",
      "pos": {
        "x": 65.79,
        "y": 57.25
      },
      "linked": [
        "RAGEXX-001"
      ]
    },
    {
      "skill": "MONMUS-001",
      "pos": {
        "x": 83.71,
        "y": 57.2
      },
      "linked": [
        "PEABRU-001"
      ]
    },
    {
      "skill": "INSDAN-001",
      "pos": {
        "x": 74.68,
        "y": 68.25
      },
      "linked": [
        "PEABRU-001"
      ]
    },
    {
      "skill": "SENBET-001",
      "pos": {
        "x": 50,
        "y": 63.7
      },
      "linked": [
        "RAGEXX-001"
      ]
    },
    {
      "skill": "ATTTEM-001",
      "pos": {
        "x": 34.21,
        "y": 57.25
      },
      "linked": [
        "RAGEXX-001"
      ]
    },
    {
      "skill": "TOURBI-001",
      "pos": {
        "x": 19.78,
        "y": 63.15
      },
      "linked": [
        "ATTTEM-001"
      ]
    },
    {
      "skill": "COUBRU-001",
      "pos": {
        "x": 30.5,
        "y": 70.5
      },
      "linked": [
        "ATTTEM-001"
      ]
    },
    {
      "skill": "ESTFER-001",
      "pos": {
        "x": 34.21,
        "y": 44.37
      },
      "linked": [
        "RAGEXX-001"
      ]
    },
    {
      "skill": "POITIT-001",
      "pos": {
        "x": 17.21,
        "y": 42.37
      },
      "linked": [
        "ESTFER-001"
      ]
    }
  ]
}
```

In a tree with a `core` emblem, the first ring links to the literal `CORE` instead, as `"linked": ["CORE"]`. No tree has one today.

## What appears on the site

- `/fr/arbre/barbare` and `/en/tree/barbare`: the node appears on the plate at `pos`, with a line drawn to each entry in `linked`, and the tree's filters count it.
- `/fr/arbre/barbare/RAGEXX-001` and `/en/tree/barbare/RAGEXX-001`: that node is circled in gold, the lines that touch it are drawn gold, and its card opens in the pane beside the plate. Choosing the node on the tree page leads here.
- `/fr/arbres` and `/en/trees`: the tree's skill count and computed domains change, because both are counted from the placements.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails if the skill id does not exist, if `linked` names a skill that is not placed in the same tree, or if `linked` names `CORE` in a tree with no `core`.

## Traps

**`pos` and `linked` belong here, never in the skill file.** One skill can sit in more than one tree, at a different place in each. The skill schema is strict and rejects both keys.

**`linked` is declared on one side only.** If `ATTTEM-001` lists `RAGEXX-001`, do not also add `ATTTEM-001` to `RAGEXX-001`. The line is drawn once. The mirror link draws the same line twice and makes the file lie about which node is the parent.

**`linked` may contain the literal `CORE`, and only when the tree has a `core`.** No tree has one today. In a tree without a core, the centre node has no `linked` at all.

**A placement with no `pos` is listed with the tree but draws no dot on the plate.** That is the schema's intent: `Absent : la Compétence est listée avec l'arbre mais n'a pas de pastille sur la planche.` On the web it is a link under the plate, headed « Pas encore sur la planche », and it keeps its own node page. The booklet lists it with the other skills.

**16 placements maximum.** The schema caps `placements` at 16.

**Order does not change the drawing.** `L'ordre n'a pas d'effet au rendu.` It does set the order in which the keyboard reaches the nodes on the web plate, so keep the array a readable walk of the tree, the way `barbare.json` lists the centre and then each branch. The booklet lists the skills roots first, then alphabetically, through `treeSkillOrder` in `src/lib/game/derive.ts`.

**Never write `"pos": null` or `"linked": null`.** Leave the key out.
