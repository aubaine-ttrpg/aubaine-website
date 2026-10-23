# Add a skill tree

Produces one plate page with its cover, its lore and its nodes, a page per node where that skill opens beside the plate, plus a card in the tree index.

## The files to create

```
data/skill-trees/<id>.json
data/lore/skill-trees/<id>.md
```

The JSON carries the plate. The Markdown carries the prose the reader reads, and is optional: a tree with no file renders its plate and its skills alone, with no outline.

The filename is the id and the id becomes the URL. Lowercase letters, digits and hyphens, starting with a letter: `berserker`, `mage`, `feu`, `prestidigitateur`.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `id` | required | Identifiant de l'arbre, qui devient son URL. | `^[a-z][a-z0-9-]*$` |
| `status` | optional | Maturité de l'entrée, de la moins arrêtée à la plus arrêtée. 'draft' est en cours d'écriture et n'est pas encore jouable : les listes le masquent tant que le lecteur n'affiche pas les brouillons ; 'playtest', 'beta' et 'draft' portent un badge ; 'balanced' n'en porte aucun mais interrompt l'héritage. Absent : la valeur est héritée de ce qui possède l'entrée, un arbre, une Espèce, une pièce d'équipement ou une panoplie, dans cet ordre. | `draft`, `playtest`, `beta`, `balanced` |
| `name` | required | Titre rendu sur la planche. | any non empty string |
| `subtitle` | optional | Devise de l'arbre, rendue en italique sous le titre sur la page et sur la couverture du livret. Absente, le titre reste seul. | any non empty string |
| `descriptors` | optional | Un à quatre mots qui caractérisent l'entrée, rendus en étiquettes dans le héros, dans l'ordre écrit. Absent : le héros n'en porte pas. | 1 to 4 distinct keys from `data/meta/descriptors.json` |
| `profile` | optional | Profil de l'arbre tel que l'équipe le lit : six axes notés de F, le plus faible, à S, le plus fort, dans l'ordre F, D, C, B, A, S, sans note globale. Il ne change aucune règle. Rendu dans le héros en hexagone. Écrit à la main, jamais calculé. Absent : le héros n'a pas de profil. | object with all six axes below |
| `profile.damage` | required inside `profile` | Dégâts : ce que les Compétences de l'arbre infligent. | `F`, `D`, `C`, `B`, `A`, `S` |
| `profile.toughness` | required inside `profile` | Robustesse : ce que les Compétences de l'arbre aident à encaisser. | `F`, `D`, `C`, `B`, `A`, `S` |
| `profile.healing` | required inside `profile` | Soin : ce que les Compétences de l'arbre rendent et réparent. | `F`, `D`, `C`, `B`, `A`, `S` |
| `profile.utility` | required inside `profile` | Utilité : les problèmes que les Compétences de l'arbre résolvent sans infliger ni soigner. | `F`, `D`, `C`, `B`, `A`, `S` |
| `profile.freeform` | required inside `profile` | Liberté : ce que les Compétences de l'arbre laissent à l'interprétation de la table. | `F`, `D`, `C`, `B`, `A`, `S` |
| `profile.roleplay` | required inside `profile` | Roleplay : la place que les Compétences de l'arbre donnent au jeu de rôle. | `F`, `D`, `C`, `B`, `A`, `S` |
| `treeType` | required | Rendu en sous-titre : Espèce, Archétype ou Domaine. | `species`, `archetype`, `domain` |
| `size` | required | Nombre de Compétences que la planche est dessinée pour tenir. | `8` or `16` |
| `cover` | optional | Couverture au rapport 3:4, dans `data/media/art/` : l'unique illustration de l'arbre, sur sa carte, dans son héros, sur la couverture de son livret et dans sa vignette sociale. Absente, la planche 3:4 par défaut. | a `3_4` filename that exists, named per [add-an-image.md](add-an-image.md) |
| `artEffect` | optional | Effet de rendu que le navigateur applique à la couverture, sur la carte comme sur le héros : `film` pour « Pellicule », `oil` pour « Huile ». Absent : l'illustration telle quelle. | `film` or `oil` |
| `emblem` | optional | Emblème de l'entrée, dans `data/media/emblems/` : un SVG blanc sur fond transparent, fait de chemins seuls. `pnpm media:emblems` le ramène au cadre carré et à la marge que partagent tous les emblèmes, `pnpm media:stamp` lui donne ses droits. Rendu en relief, seul, en bas à droite de la carte du héros. Absent : la carte n'en porte pas. | a `.svg` file name in `data/media/emblems/` |
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

`data/skill-trees/mage.json`, cut to its centre and its first branch:

```json
{
  "id": "mage",
  "status": "playtest",
  "name": "Mage",
  "subtitle": "L'encre et les Glyphes",
  "treeType": "archetype",
  "size": 16,
  "cover": "bacchi-qui-travaille-3_4-og.png",
  "placements": [
    {
      "skill": "GRIMOI-001",
      "pos": {
        "x": 50,
        "y": 50.81
      }
    },
    {
      "skill": "ALPPRI-001",
      "pos": {
        "x": 50,
        "y": 37.92
      },
      "linked": [
        "GRIMOI-001"
      ]
    },
    {
      "skill": "CONVER-001",
      "pos": {
        "x": 50,
        "y": 26.14
      },
      "linked": [
        "ALPPRI-001"
      ]
    }
  ]
}
```

The skill at `50, 50.81` holds the centre and has no `linked`, and every branch links back to it. A tree may instead declare a `core` emblem, and its first ring then links to `CORE`; no tree does today.

## What appears on the site

- `/fr/arbres` and `/en/trees`: a new card in the tree index, with its cover, the computed domains and the skill count.
- `/fr/arbre/<id>` and `/en/tree/<id>`: the hero, its cover standing on the right and fading into the page, with the tree name on the left, then the lore beside its sticky outline when the tree has one, then the section « Arbre de compétences » at `#arbre`, which the outline names last. The section holds the filters, then the legend over the plate with its nodes and link lines, beside a pane of the same width that asks the reader to choose a skill.
- `/fr/arbre/<id>/<SKILL-ID>`: the same page with that skill's card in the pane and its node circled in gold. A node on the plate links here with `#arbre`, and with JavaScript only the pane changes.
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

**A profile is authored, never computed.** `profile` is the team's reading of the tree, six ranks from F to S with no overall grade, and it changes no rule. Nothing derives it from the skills, so a tree that changes its plate keeps its profile until someone rewrites it. The hero draws it as a hexagon only when all six ranks are written, which the schema requires.

**Descriptors are keys from `data/meta/descriptors.json`.** That file holds both labels, so the tree file writes keys only and no overlay is needed. A new word is a new entry there, chosen by the owner.

**Trailing `size` is a drawing hint, not a limit.** It says how many skills the plate is drawn to hold. The hard cap is 16 placements, from `placements`. Every tree in the repo uses `size: 16`, with 1 to 16 placements.

**An empty plate is legal only while the tree is a brouillon.** `"placements": []` announces a tree whose Compétences are not written yet. The schema refuses it on any other `status`, so a tree cannot be promoted out of `draft` while its plate is still bare.

**`core` is optional, and no tree uses it today.** Place a skill at `50, 50.81` and let it hold the centre.

**`linked: ["CORE"]` requires a `core`.** `pnpm data:check` fails on a `CORE` link in a tree that has no `core`.

**The id is the URL.** Changing it changes the address of every page under that tree and breaks existing links. Choose it once.

**Adding the file is enough.** The index card, the plate page and the per skill pages all appear on their own.
