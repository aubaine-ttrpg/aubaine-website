# Add a skill tree

Produces one plate page with its banner, its nodes and the list of its skills underneath, plus a card in the tree index.

## The files to create

```
data/skill-trees/<id>.json
data/lore/skill-trees/<id>.md
```

The JSON carries the plate. The Markdown carries the prose the reader reads, and is optional: a tree with no file renders its plate and its skills alone.

The filename is the id and the id becomes the URL. Lowercase letters, digits and hyphens, starting with a letter: `berserker`, `mage`, `feu`, `prestidigitateur`.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `id` | required | Identifiant de l'arbre, qui devient son URL. | `^[a-z][a-z0-9-]*$` |
| `status` | optional | Maturité de l'entrée, de la moins arrêtée à la plus arrêtée. 'draft' est en cours d'écriture et n'est pas encore jouable ; 'playtest', 'beta' et 'draft' portent un badge ; 'balanced' n'en porte aucun mais interrompt l'héritage. Absent : la valeur est héritée de ce qui possède l'entrée, un arbre, une Espèce, une pièce d'équipement ou une panoplie, dans cet ordre. | `draft`, `playtest`, `beta`, `balanced` |
| `name` | required | Titre rendu sur la planche. | any non empty string |
| `treeType` | required | Rendu en sous-titre : Espèce, Archétype ou Domaine. | `species`, `archetype`, `domain` |
| `size` | required | Nombre de Compétences que la planche est dessinée pour tenir. | `8` or `16` |
| `cover` | optional | Couverture au rapport 3:4, dans `data/media/art/`. Absente, la carte retombe sur la bannière, puis sur la planche 3:4 par défaut. | a filename that exists, named per [add-an-image.md](add-an-image.md) |
| `banner` | optional | Bannière au rapport 16:9, dans `data/media/art/`. Absente, le héros retombe sur la planche 16:9 par défaut. | a filename that exists, named per [add-an-image.md](add-an-image.md) |
| `core` | optional | Cœur de l'arbre. Absent : un nœud tient le centre. | object, see below |
| `core.label` | required inside `core` | The word printed inside the emblem. | any non empty string |
| `core.sublabel` | optional | The line printed under the emblem. | any non empty string |
| `core.domains` | optional | Bordure de l'emblème. | 0 to 2 keys from `data/meta/domains.json` |
| `core.pos` | optional | Défaut : 50, 50.81. | `{ "x": 0-100, "y": 0-100 }` |
| `placements` | required | Les Compétences de l'arbre et leur mise en page. L'ordre n'a pas d'effet au rendu. Vide : l'arbre est annoncé mais sa planche est encore nue, ce que seul un brouillon peut être. | 0 to 16 placements, see [place-a-skill-on-a-tree.md](place-a-skill-on-a-tree.md) |

There is no `domains` field and no `characteristics` field on a tree. Both are computed. See the traps.

## The lore file

`data/lore/skill-trees/<id>.md` carries no frontmatter, and follows the same convention as a species lore file. Its `##` headings become the numbered sections of the sticky outline beside the text, a picture is written `![](../../media/art/<file>)`, and the markup of a Compétence works inside it. `data/lore/skill-trees/<id>.en.md` translates it as a whole file. See [add-a-species.md](add-a-species.md) for a worked example.

## A complete example

`data/skill-trees/mage.json` is the only tree with a `core`:

```json
{
  "id": "mage",
  "name": "Mage",
  "treeType": "archetype",
  "size": 16,
  "core": {
    "label": "Mage",
    "sublabel": "Archétype",
    "domains": [
      "psychic"
    ],
    "pos": {
      "x": 50,
      "y": 50.81
    }
  },
  "placements": [
    {
      "skill": "PASSE-01",
      "pos": {
        "x": 50,
        "y": 37.7
      },
      "linked": [
        "CORE"
      ]
    },
    {
      "skill": "PASSE-02",
      "pos": {
        "x": 50,
        "y": 24
      },
      "linked": [
        "PASSE-01"
      ]
    }
  ]
}
```

Without a `core`, one skill holds the centre instead. `data/skill-trees/berserker.json` does that: `RAGER-01` sits at `50, 50.81` and every branch links back to it.

## What appears on the site

- `/fr/arbres` and `/en/trees`: a new card in the tree index, with the cover when the tree has one and the banner otherwise, the computed domains and the skill count.
- `/fr/arbre/<id>` and `/en/tree/<id>`: the hero with the banner and the tree name, the plate with its nodes and link lines, then the lore beside its sticky outline when the tree has one, then the skill list under the heading `Compétences` with one card per placement, sorted by tier.
- `/fr/arbre/<id>/<SKILL-ID>`: the same page with one card and one node highlighted.
- If `data/media/pdf/<id>.pdf` exists, a booklet download button appears in the hero. The filename must be the tree id.

## How to check it

```
pnpm data:check
pnpm dev
```

Then open `/fr/arbres` and click through to the new plate.

## Traps

**A tree's `status` carries to every skill it places.** Marking one tree `playtest` badges the plate, the tree card, and all sixteen skill cards in one edit. A skill escapes it only by writing its own `status`, and `"status": "balanced"` is how a settled skill sits inside a playtest tree without a badge.

**A tree's `domains` and primary characteristics are computed, never authored.** The domain badge on the plate and the characteristic banners in the hero are counted from the skills the tree places, plus `core.domains` if there is a core. If a plate shows the wrong domain, change the skills, not the tree file. The schema has no field to override it.

**Trailing `size` is a drawing hint, not a limit.** It says how many skills the plate is drawn to hold. The hard cap is 16 placements, from `placements`. Every tree in the repo uses `size: 16`, with 2 to 16 placements.

**An empty plate is legal only while the tree is a brouillon.** `"placements": []` announces a tree whose Compétences are not written yet. The schema refuses it on any other `status`, so a tree cannot be promoted out of `draft` while its plate is still bare.

**`core` is optional and rare.** Only `mage` has one. Without it, place a skill at `50, 50.81` and let it hold the centre.

**`linked: ["CORE"]` requires a `core`.** `pnpm data:check` fails on a `CORE` link in a tree that has no `core`.

**The id is the URL.** Changing it changes the address of every page under that tree and breaks existing links. Choose it once.

**Adding the file is enough.** The index card, the plate page and the per skill pages all appear on their own.
