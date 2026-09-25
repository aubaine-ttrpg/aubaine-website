# Add a species

Produces one species page, its lore, its sub-species, its roleplay facts and the Compétences it proposes, plus a card in the species index.

## The files to create

```
data/species/<id>.json
data/lore/species/<id>.md
```

The JSON carries the structure. The Markdown carries the prose the reader reads, and is optional: a species with no file simply renders its hero and its pool.

The filename is the id and the id becomes the URL. Lowercase letters, digits and hyphens, starting with a letter: `humain`, `fir-bolg`, `cindersohls`. Accents are stripped from the slug, never from the `name`.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `id` | required | Identifiant de l'Espèce, qui devient son URL. | `^[a-z][a-z0-9-]*$` |
| `status` | optional | Maturité de l'entrée, de la moins arrêtée à la plus arrêtée. 'draft' est en cours d'écriture et n'est pas encore jouable ; 'playtest', 'beta' et 'draft' portent un badge ; 'balanced' n'en porte aucun mais interrompt l'héritage. Absent : la valeur est héritée de ce qui possède l'entrée, un arbre, une Espèce, une pièce d'équipement ou une panoplie, dans cet ordre. | `draft`, `playtest`, `beta`, `balanced` |
| `name` | required | Nom rendu en titre. | any non empty string |
| `subtitle` | optional | Devise de l'Espèce, rendue en italique sous le titre. Absente, le titre reste seul. | any non empty string |
| `cover` | optional | Couverture au rapport 3:4, dans `data/media/art/`. Absente, la carte retombe sur la bannière, puis sur la planche 3:4 par défaut. | a filename that exists, named per [add-an-image.md](add-an-image.md) |
| `banner` | optional | Bannière au rapport 16:9, dans `data/media/art/`. Absente, le héros retombe sur la planche 16:9 par défaut. | a filename that exists, named per [add-an-image.md](add-an-image.md) |
| `movement` | optional | Déplacement de l'Espèce, quand il s'écarte des 9 mètres par défaut. Absent : 9 mètres. | any non empty string |
| `types` | optional | Type(s) de créature de l'Espèce. La plupart sont Humanoïdes ; un peuple façonné en cumule deux, Humanoïde et Artificiel. Absent : l'Espèce n'en déclare pas encore. | keys from `data/meta/creature-types.json` |
| `size` | optional | Catégorie(s) de taille. Plusieurs valent un choix laissé au joueur à la création, jamais un cumul. Absente : l'Espèce n'en déclare pas encore, ou elle la tient de son origine. | keys from `data/meta/sizes.json` |
| `derivedFrom` | optional | D'où l'Espèce tient sa taille et son Déplacement quand elle ne les fixe pas elle-même : `origin` pour une Espèce qui en était une autre avant, `parents` pour une Espèce née de deux autres. Exclut `size` et `movement`. | `origin` or `parents` |
| `languages` | optional | Langue(s) que l'Espèce parle, lit et écrit. Absent : l'Espèce n'en déclare pas encore. | keys from `data/meta/languages.json` |
| `offered` | required | Compétences d'Espèce proposées au choix, définies dans `data/skills/`. Le personnage en retient deux à la création : elles sont Mémorisées sans occuper de Mémoire, ne coûtent pas de PX et ne se changent plus ensuite. Il peut acheter les autres plus tard, au prix imprimé. Une sous-espèce ajoute les siennes à celles-ci. `[]` : l'Espèce n'en propose encore aucune. | skill ids, or `[]` |
| `subspecies` | optional | Les sous-espèces de l'Espèce, présentées sur sa page et jamais sur une page à elles. Le personnage en choisit une à la création. Absent : l'Espèce n'en compte aucune. | an array of sub-species, see below |
| `subspecies[].id` | required inside a sub-species | Identifiant de la sous-espèce, unique dans son Espèce, et l'ancre de sa présentation. | `^[a-z][a-z0-9-]*$` |
| `subspecies[].name` | required inside a sub-species | Nom rendu en intertitre. Il ne se traduit pas. | any non empty string |
| `subspecies[].text` | required inside a sub-species | Présentation de la sous-espèce, même balisage qu'une Compétence. | any non empty string |
| `subspecies[].names` | optional | Les noms que porte la sous-espèce. Ils ne se traduisent pas. Absent : elle n'en déclare pas encore. | `masculine`, `feminine` and `family`, each a non empty list of names in their order |
| `subspecies[].offered` | required inside a sub-species | Compétences que la sous-espèce ajoute à celles de son Espèce, définies dans `data/skills/`. Elles portent la sous-espèce en Prérequis. `[]` : elle n'en ajoute encore aucune. | skill ids, or `[]` |
| `roleplay` | optional | Ce qui sert à incarner l'Espèce plutôt qu'à la jouer mécaniquement. Absent : l'Espèce n'en déclare rien encore. | at least one of the four keys below |
| `roleplay.adulthood` | optional | Âge auquel un membre de l'Espèce devient adulte. | any non empty string |
| `roleplay.lifespan` | optional | Durée de vie d'un membre de l'Espèce. | any non empty string |
| `roleplay.height` | optional | Stature, en mètres. Distincte de la catégorie de taille, qui est une règle. | any non empty string |
| `roleplay.text` | optional | Ce qu'un joueur lit avant d'incarner l'Espèce, même balisage qu'une Compétence. | any non empty string |

Write the keys in that order. The exact bytes of the file must equal `JSON.stringify(JSON.parse(file), null, 2) + "\n"`.

## A complete example

```json
{
  "id": "humain",
  "status": "draft",
  "name": "Humain",
  "types": [
    "humanoid"
  ],
  "size": [
    "medium"
  ],
  "languages": [
    "common"
  ],
  "offered": [
    "ESHUM-01",
    "ESHUM-02",
    "ESHUM-03"
  ],
  "subspecies": [
    {
      "id": "landenheit",
      "name": "Landenheit",
      "text": "***En tant que citoyen du Landenheit***, vous incarnez la rigueur mécanique et l'audace scientifique de votre Empire.",
      "names": {
        "masculine": [
          "Alaric",
          "Baldric"
        ],
        "feminine": [
          "Adalheid",
          "Agnetha"
        ],
        "family": [
          "Eisenmann",
          "Eisenfeld"
        ]
      },
      "offered": [
        "ESHUM-06",
        "ESHUM-07"
      ]
    }
  ],
  "roleplay": {
    "adulthood": "Vers 18 à 20 ans",
    "height": "Entre 1,60 m et 1,90 m"
  }
}
```

A Landenheit Humain chooses two out of ESHUM-01, 02 and 03 plus ESHUM-06 and 07. A skill a sub-species adds lives in that sub-species' `offered`, never in the species', and carries the sub-species as its `prerequisite`: `Être Humain du Landenheit`.

## The lore file

`data/lore/species/<id>.md` carries no frontmatter. Its `##` headings become the sections of the
sticky outline beside the text, so the file opens at the second heading level, never at the first:
the page title is the `name` above.

```markdown
## Origines

![](../../media/art/feu-16_9-og.png)

Un premier bloc, illustré. Le balisage d'une Compétence marche ici : [[Agonie]], {{Attaquer}} et
les mots du codex se posent seuls.

## Coutumes

Un bloc sans image. Les tableaux, les listes et les listes de définitions marchent aussi, puisque
c'est du markdown ordinaire.
```

A quote is an ordinary markdown blockquote, framed on its own. When someone says it, close the blockquote with a last line `> :source[...]`: the page prints that line as the attribution, under the quote and outside it.

```markdown
> « Arthur, vois ces stèles : tant d'hommes et d'elfes ont versé leur sang ici. »
>
> :source[Jacques « Le Scéllaire » Arsenault s'adressant à Arthur Gwynnor.]
```

A picture is an ordinary markdown image whose path is relative to the lore file, so it always reads
`../../media/art/<file>`, and `pnpm data:check` fails on a path that points anywhere else or at a
file that does not exist. Name the file per [add-an-image.md](add-an-image.md).

## The English overlay

`data/species/<id>.en.json` carries only the strings that change: `name`, `subtitle`, `movement`, `subspecies` and `roleplay`. `types`, `size` and `languages` are never translated: they name keys, and the reader sees the `labelEn` from `data/meta/`. A sub-species is translated by its `id`, and only its `text`: its `name` and its `names` stay as they are, like every proper noun. A name that is the same in both locales needs no overlay. See [add-a-translation.md](add-a-translation.md).

```json
{
  "name": "Human",
  "subspecies": {
    "landenheit": {
      "text": "***As a citizen of Landenheit***, you embody the mechanical rigour and scientific daring of your Empire."
    }
  },
  "roleplay": {
    "adulthood": "Around 18 to 20 years",
    "height": "Between 1.60 m and 1.90 m"
  }
}
```

The lore is translated by a whole sibling file, `data/lore/species/<id>.en.md`, the way a book chapter is. Without one, the English page renders the French prose.

## What appears on the site

- `/fr/especes` and `/en/species`: a new card in the species index, with the cover when the species has one and the banner otherwise, and the size of its pool.
- `/fr/espece/<id>` and `/en/species/<id>`: the hero carrying its three plates, then the lore beside its sticky outline, then `Origines régionales` with each sub-species' presentation and names, then `Jouer un <nom>` with the roleplay text and a table of the roleplay facts, the languages and links to each origin, then the pool under `Compétences d'Espèce`. The pool is the Almanach list itself: rows, a sticky detail card and the filter bar, with an Origine régionale facet. The rows run the species' own skills first, then each origin's in the order the file declares them, alphabetical inside each group, and they print no PX.
- `/fr/competences`: every skill the species or one of its sub-species offers gains a "Proposée par une Espèce" source, naming the sub-species when there is one, and a species facet.

## How to check it

```
pnpm data:check
pnpm dev
```

Then open `/fr/especes` and click through to the new species.

## Traps

**A species grants exactly two Compétences.** That number is canon from `data/books/livre-du-joueur/09-les-especes.md`, so it is `SPECIES_SKILL_CHOICES` in `src/lib/game/derive.ts` and not a field. Do not add one. The page states the rule and lists the pool; it does not let a reader pick, because a character sheet is not what the codex is.

**The hero carries three plates and the file authors no icon.** They are built from `types`, `movement` and `size`, in that order, and their icons are `SPECIES_PLATE_ICONS` in `src/lib/game/derive.ts`. A species that declares neither `types` nor `size` shows the movement alone.

**A derived Espèce declares neither size nor movement, and shows one plate instead of two.** `derivedFrom` says where both come from: a Mort-vivant keeps the size and the Déplacement of the Espèce it was, a Scothan takes them from the two Espèces it was born of. Two plates would have repeated the same sentence, so the hero renders a single one under `SPECIES_PLATE_ICONS.derived`. The schema refuses an entry that writes `size` or `movement` beside `derivedFrom`.

**Several sizes mean a choice, several types mean a cumulation.** `size` renders joined by `ou`, because a species that declares Moyenne and Petite lets the player pick one at creation. `types` renders joined by a middot, because a Cindersöhls is Humanoïde **and** Artificiel at once.

**The plates carry gameplay, the roleplay table carries the rest.** Type, Déplacement and catégorie de taille are rules a table consults, so they stay on the three plates. Age, lifespan and height are roleplay, so they live in `roleplay` and render in the `Jouer un <nom>` table below the lore. Height is not the size category: never write one to mean the other.

**The `Jouer un <nom>` heading is built, not authored.** It reads « Jouer un » followed by the `name`, and "Playing … characters" in English. Every species so far takes « un ». A name that needs « une » needs `playingAs` in `src/lib/i18n/strings.ts` changed first.

**An icon set has to be credited before it can ship.** `data/media/icons/` holds one directory per Iconify prefix, and `pnpm data:check` fails when a directory is not named by `ICON_SETS` in `src/lib/rights/attribution.ts`. Adding a file to a set already declared there needs nothing else; adding a new set needs a row in that module, which the credits page then renders on its own.

**There is no free text on the plates.** Every value is a key from a controlled vocabulary in `data/meta/`, so `pnpm data:check` rejects a type or a size the game has not declared.

**The lore outline builds itself.** Every `##` in the lore file becomes a numbered entry in the rail beside the text, followed by `Origines régionales`, with each origin nested under it, and `Jouer un <nom>` when the species has them, and by a last entry pointing at the pool. Nothing is authored for it, and the rail only appears when there is more than one entry.

**Every choice at creation is empty or holds at least two.** Offering one skill is not a choice, and `pnpm data:check` fails on it. The count that matters is what a character picks from: the species' `offered` alone when there is no sub-species, and the species' plus each sub-species' own otherwise. A sub-species offering nothing of its own is fine as long as its species offers two.

**A sub-species lives inside its species, and the reader calls it an origine régionale.** `subspecies` is the data name only: the page, the filter and the rulebook say « origine régionale », never « sous-espèce ». It has no file, no page and no URL of its own, only an anchor on the species page, `#origine-<id>`. It adds to its species and never replaces it, and a skill is offered once across a species and its sub-species. All of it is enforced by `pnpm data:check`.

**Every species skill also goes in the Banque Commune.** Add its id to `data/skill-lists/common-bank.json` as well as to `offered`. A character keeps two for free at creation, which is why the species page prints no PX, and buys the others later from the Banque Commune, which prints the price. The skill's `prerequisite` is what reserves it to the species, or to its origine régionale.

**Names are copied, never translated.** `subspecies[].names` keeps each list in the order and spelling the author gave, and the English overlay cannot carry them.

**A species is not a planche.** It has no `placements`, no `pos`, no plate and no booklet. If a set of Compétences wants a plate, it is an Arbre, not an Espèce.

**A species' `status` carries to every skill it offers.** It is a rung of the ladder in `docs/adr/0010-maturity-is-inherited-down-an-ownership-ladder.md`, between the trees and the equipment. A skill escapes it only by writing its own `status`.

**The id is the URL.** Changing it breaks every existing link to that species. Choose it once.

**Adding the file is enough.** The index card and the species page appear on their own.
