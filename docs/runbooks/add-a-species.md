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
| `status` | optional | Maturité de l'entrée, de la moins arrêtée à la plus arrêtée. 'draft' est en cours d'écriture et n'est pas encore jouable : les listes affichent l'entrée assombrie sauf si le lecteur masque les brouillons ; 'playtest', 'beta' et 'draft' portent un badge ; 'balanced' n'en porte aucun mais interrompt l'héritage. Absent : la valeur est héritée de ce qui possède l'entrée, un arbre, une Espèce, une pièce d'équipement ou une panoplie, dans cet ordre. | `draft`, `playtest`, `beta`, `balanced` |
| `name` | required | Nom rendu en titre. | any non empty string |
| `subtitle` | optional | Devise de l'Espèce, rendue en italique sous le titre. Absente, le titre reste seul. | any non empty string |
| `descriptors` | optional | Un à quatre mots qui caractérisent l'entrée, rendus en étiquettes dans le héros, dans l'ordre écrit. Absent : le héros n'en porte pas. | 1 to 4 distinct keys from `data/meta/descriptors.json` |
| `cover` | optional | Couverture au rapport 3:4, dans `data/media/art/` : l'unique illustration de l'Espèce, sur sa carte, dans son héros et dans sa vignette sociale. Absente, la planche 3:4 par défaut. | a `3_4` filename that exists, named per [add-an-image.md](add-an-image.md) |
| `coverMirrored` | optional | La couverture se montre en miroir, retournée de gauche à droite, sur sa carte, dans son héros et, pour un arbre, sur la couverture de son livret ; le fichier reste l'original. Le fond flou du héros et la vignette sociale la gardent telle qu'elle est peinte. Absent : la couverture telle qu'elle est peinte. | `true`, never `false`: leave the key out instead |
| `artEffect` | optional | Effet de rendu que le navigateur applique à la couverture, sur la carte comme sur le héros : `film` pour « Pellicule », `oil` pour « Huile ». Absent : l'illustration telle quelle. | `film` or `oil` |
| `emblem` | optional | Emblème de l'entrée, dans `data/media/emblems/` : un SVG blanc sur fond transparent, fait de chemins seuls. `pnpm media:emblems` le ramène au cadre carré et à la marge que partagent tous les emblèmes, `pnpm media:stamp` lui donne ses droits. Rendu en relief, seul, en bas à droite de la carte du héros. Absent : la carte n'en porte pas. | a `.svg` file name in `data/media/emblems/` |
| `keyColour` | optional | Couleur clé de l'entrée, en hexadécimal à six chiffres minuscules, quand celle que la build lit dans la couverture ne la dit pas, ou pour la figer : elle teinte sa carte, les descripteurs, le cadre, le nom en filigrane et la dalle de son héros. Absente : la couleur clé lue dans la couverture, ou, sans couverture, celle que l'entrée tient par défaut. | `#` and six lowercase hex digits, on which the dark sticker ink reads at 4.5:1 or more |
| `movement` | optional | Vitesse de l'Espèce, quand elle s'écarte des 9 mètres par défaut. Absente : 9 mètres. | any non empty string |
| `types` | optional | Type(s) de créature de l'Espèce. La plupart sont Humanoïdes ; un peuple peut en cumuler deux, comme les Cindersöhls, Humanoïdes et Artificiels, ou les Nnors, Humanoïdes et Bêtes. Absent : l'Espèce n'en déclare pas encore, ou elle les tient de l'une de ses Espèces parentes. | keys from `data/meta/creature-types.json` |
| `size` | optional | Catégorie(s) de taille. Plusieurs valent un choix laissé au joueur à la création, jamais un cumul. Absente : l'Espèce n'en déclare pas encore, ou elle la tient de son origine. | keys from `data/meta/sizes.json` |
| `derivedFrom` | optional | D'où l'Espèce tient sa taille et sa Vitesse quand elle ne les fixe pas elle-même : `origin` pour une Espèce qui en était une autre avant, `parents` pour une Espèce née de deux autres. Exclut `size` et `movement`. | `origin` or `parents` |
| `languages` | optional | Langue(s) que l'Espèce parle, lit et écrit. Absent : l'Espèce n'en déclare pas encore, ou elle les tient de son origine ou de l'une de ses Espèces parentes, selon `derivedFrom`. | keys from `data/meta/languages.json` |
| `offered` | required | Compétences d'Espèce proposées au choix, définies dans `data/skills/`. Le personnage en retient deux à la création : elles sont Mémorisées sans occuper de Mémoire, ne coûtent pas de PX et ne se changent plus ensuite. Il peut acheter les autres plus tard, au prix imprimé. Une sous-espèce ajoute les siennes à celles-ci, et peut imposer l'une des deux. `[]` : l'Espèce n'en propose encore aucune. | skill ids, or `[]` |
| `subspeciesLabel` | optional | Le nom que l'Espèce donne à ses sous-espèces, celui que le lecteur lit en intertitre, dans le sommaire, dans la table Jouer et sur le filtre : `regional-origins` pour « Origines régionales », `subspecies` pour « Sous-espèces ». Absent : `regional-origins`. Ne s'écrit qu'avec `subspecies`. | `regional-origins` or `subspecies` |
| `naming` | optional | Comment le peuple donne ses noms, en un court paragraphe lu en tête de « Noms », dans la partie « En jeu » de sa page, avant ses listes. Même balisage qu'une Compétence. Absent : « Noms » ne montre que les listes, ou n'apparaît pas. | any non empty string, about 60 words, in the three moves of `.claude/skills/aubaine-lore/references/architecture.md` § What each part is for |
| `names` | optional | Les noms que porte une Espèce sans sous-espèce, chaque liste dans son ordre, lus sous « Noms » dans la partie « En jeu » de sa page. Ils ne se traduisent pas. Absent : elle n'en déclare pas encore. Une Espèce à sous-espèces les nomme une à une. | the same lists as `subspecies[].names`; refused beside `subspecies` |
| `givenNamesLabel` | optional | L'intitulé de ses prénoms qui ne suivent pas le genre, ceux de `names.given` comme ceux de ses sous-espèces, quand le peuple les nomme autrement : « Noms mixtes » pour les Elfes. Absent : « Prénoms ». Ne s'écrit qu'avec de tels prénoms. | any non empty string |
| `familyNames` | optional | Les noms de famille que portent toutes ses sous-espèces, dans leur ordre, lus une fois en tête de « Noms », avant les listes de chaque sous-espèce. Absent : chaque sous-espèce déclare les siens, ou n'en a pas. Ne s'écrit qu'avec `subspecies`, et jamais avec le `names.family` d'une sous-espèce. | a non empty list of names in their order; refused beside a sub-species' `names.family` |
| `familyNamesLabel` | optional | L'intitulé de ses noms de famille, ceux de `names.family` ou de `familyNames` comme ceux de ses sous-espèces, quand le peuple ne parle pas de noms de famille : « Yurtas » pour les Nnors, qui portent le nom de leur Yurta. Absent : « Noms de famille ». Ne s'écrit qu'avec des noms de famille. | any non empty string |
| `subspecies` | optional | Les sous-espèces de l'Espèce, présentées sur sa page et jamais sur une page à elles. Le personnage en choisit une à la création. Absent : l'Espèce n'en compte aucune. | an array of sub-species, see below |
| `subspecies[].id` | required inside a sub-species | Identifiant de la sous-espèce, unique dans son Espèce, et l'ancre de sa présentation. | `^[a-z][a-z0-9-]*$` |
| `subspecies[].name` | required inside a sub-species | Nom rendu en intertitre. L'overlay anglais le traduit quand c'est un nom commun, comme Fantôme, et le laisse tel quel quand c'est un nom propre, comme Landenheit. | any non empty string |
| `subspecies[].text` | required inside a sub-species | Présentation de la sous-espèce, même balisage qu'une Compétence. | any non empty string |
| `subspecies[].heraldry` | optional | La pièce héraldique de la sous-espèce : une bannière qu'on saisit, un drapeau qui flotte, ou des armoiries dont l'or prend la lumière. Absente : la présentation n'en porte pas. | `{ "kind": "banner", "name", "emblem", "field", "charge" }`, `{ "kind": "flag", "name", "picture" }` or `{ "kind": "arms", "name", "blazon", "arms" }`, see below |
| `subspecies[].names` | optional | Les noms que porte la sous-espèce, chaque liste dans son ordre, lus sous son nom dans « Noms », dans la partie « En jeu » de la page de son Espèce. Ils ne se traduisent pas. Absent : elle n'en déclare pas encore. | `masculine`, `feminine`, `given` and `family`, each optional and a non empty list of names in their order, at least one present. `given` holds the first names of a people that does not sort them by gender |
| `subspecies[].imposed` | optional | Compétence que la sous-espèce impose, définie dans `data/skills/` : l'une des deux Compétences d'Espèce que le personnage garde à la création, sans la choisir. Il choisit la seconde parmi celles de son Espèce et de sa sous-espèce. Elle porte la sous-espèce en Prérequis, n'appartient qu'à cette sous-espèce et ne figure dans aucun `offered`. Absente : le personnage choisit ses deux Compétences. | one skill id |
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
    "ESPHUM-001",
    "AMIXXX-001",
    "VOLSUR-001"
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
        "FORTEC-001",
        "INGTEC-001"
      ]
    }
  ],
  "roleplay": {
    "adulthood": "Vers 18 à 20 ans",
    "height": "Entre 1,60 m et 1,90 m"
  }
}
```

A Landenheit Humain chooses two out of ESPHUM-001, AMIXXX-001 and VOLSUR-001 plus FORTEC-001 and INGTEC-001. A skill a sub-species adds lives in that sub-species' `offered`, never in the species', and carries the sub-species as its `prerequisite`: `Être Humain du Landenheit`.

## Heraldry

A sub-species may carry one piece of heraldry, rendered under its heading. Its `name` is the caption
under it and the name of the figure for a screen reader, and the English overlay translates it as
`subspecies.<id>.heraldry.name`. Where it stands, beside the text or across the column, is
`HERALDRY_PLACEMENT` in `src/lib/game/derive.ts`.

```json
"heraldry": {
  "kind": "banner",
  "name": "Bannière de la maison Colbert",
  "emblem": "colbert.svg",
  "field": "#1f4e9e",
  "charge": "#efbe04"
}
```

- `banner` hangs from a wooden pole with gilt finials and a twisted gold cord, in a column left of
  the presentation, its top level with the text's first line; below 30rem it stands above the text
  instead. Its `emblem` is a white SVG in
  `data/media/emblems/`, framed by `pnpm media:emblems` like a species emblem. `field` is the colour of
  the velvet, `charge` the colour of the embroidered emblem, the galloon and the fringe. It stirs in a
  light wind for as long as it is on screen, and the reader can take hold of it and swing it. The
  round button at the right end of its caption's rule, like the flag's and the hero's, pauses every
  moving decoration of the page.
- `flag` flies across the width of the reading column, above the presentation, like a lore picture,
  with a linen heading and two grommets at its hoist and no pole. Its `picture` is the flat flag, a
  `3_2` file in `data/media/art/`. It flies as long as it is on screen, and the round button at the
  right end of its caption's rule, like the banner's and the hero's, pauses every moving decoration of
  the page.
- `arms` stand in the same column as a banner: a heater shield of translucent enamel set in gilt
  metal, its charges sculpted in relief with their drawn lines engraved, inside a stepped bezel. `arms` names the composition in `data/media/arms/`, an SVG whose
  tinctures are the enamels and whose charges are credited in `ARMS_WORKS`
  (`docs/third-party-assets.md`). `pnpm media:arms` bakes it into the maps and the still the page
  uses. `blazon` is the blazon, opened from the round button at the right end of the caption's rule;
  the English overlay translates it as `subspecies.<id>.heraldry.blazon`. The light follows the
  pointer, or the scroll without one, and the shield leans toward a hovering mouse like the hero's
  card.

All three draw on the shared GPU context of the hero (`src/scripts/art-effect/banners.ts`, `flags.ts`
and `arms.ts`), with the textures credited in `docs/third-party-assets.md`. Under reduced motion each
draws one still frame. Without JavaScript or WebGL2, on a software renderer and in print, the plain
banner, drawn from the same outline (`bannerOutline` in `src/lib/art-effect/presets.ts`), the flat
flag or the baked still of the arms stays; the banner and the flag also keep it on the low tier.

## The lore file

`data/lore/species/<id>.md` carries no frontmatter. Everything before its first `##` is the opening,
such as a paragraph and an epigraph: it is the first thing the page shows under the hero, above
`Jouer un <nom>`, so it never leans on a section. The `##` headings and what follows them are the
sections, shown after the pool, and each heading becomes an entry of the « Histoire » outline. The
file opens at the second heading level, never at the first: the page title is the `name` above.

```markdown
## Origines

![](../../media/art/feu-16_9-og.png)

Un premier bloc, illustré. Une référence marche ici comme dans une Compétence : {{agonie}},
{{ATTAQU-001}}, les {{jet|Jets}}. Un mot écrit sans balisage reste du texte.

## Coutumes

Un bloc sans image. Les tableaux, les listes et les listes de définitions marchent aussi, puisque
c'est du markdown ordinaire.
```

A quote is an ordinary markdown blockquote, drawn as a dialogue box. When someone says it, close the blockquote with a last line `> :source[...]`: the page prints that line as the quote's title, outside the box. Write every person the line names in bold: each prints on a black nameplate.

Two words in braces after the closing bracket stage the quote: the corner its title takes, then the background behind the box. `TITLE_CORNERS` and `QUOTE_BACKINGS` in `src/lib/game/book-markup.ts` list them, such as `bottom-right` and `echo`; without braces the title takes the top left and the box the slab, `tranche`. Any other word stops the build. The English line stages its quote with the same words, and `pnpm data:check` fails when the two differ.

```markdown
> « Arthur, vois ces stèles : tant d'hommes et d'elfes ont versé leur sang ici. »
>
> :source[**Jacques « Le Scellaire » Arsenault** s'adressant à **Arthur Colbert**.]{top-left tranche}
```

A blockquote whose paragraphs open on a bold speaker and a colon, `**Tiar :** « … »`, with two turns or more, is a dialogue: one box per turn, the speaker's name on a tag across its edge.

A turn may open on its speaker's portrait, a 1:1 picture in `data/media/art/` written before the name: `> ![](../../media/art/tiar-vyrefiel-severe-1_1-og.png) **Tiar :** « … »`. It stands beside the box, mirrored for the second speaker so the two face each other. A turn without one keeps the plain box. Pick each expression for the character as much as for the line.

A picture is an ordinary markdown image whose path is relative to the lore file, so it always reads
`../../media/art/<file>`, and `pnpm data:check` fails on a path that points anywhere else or at a
file that does not exist. Name the file per [add-an-image.md](add-an-image.md).

The ratio in the name sets the layout. A 16:9 or a 1:1 picture spans the column. A picture
narrower than it is tall, such as a 3:4 or an 11:12, on a line of its own or with its caption, sits
at the start of the text that follows it: that text wraps around it, then runs under it once it is
longer than the picture, up to the next heading. On a narrow screen the picture sits above the
text. Put it straight under the heading it illustrates.

A picture of either ratio can be cut to a shape: write the shape's key as the image title, in
quotes after the path. `PICTURE_MASKS` in `src/lib/game/book-markup.ts` lists the keys, such as
`torn`, and `pnpm data:check` fails on any other. The shape shows on screen only; print keeps the
rectangle.

A second word after the shape adds an effect: `PICTURE_RELIEFS` in the same file lists them, such as
`torch`, a warm light that follows the pointer across the picture's relief and stays inside it.
Without WebGL, or without JavaScript, the picture shows as it would without the word.

A painting takes `"glazed"` (`GLAZED_PICTURE`): a frame around it, the painting recessed behind its
lip, under a pane of glass. The frame's light and the faint reflection of a room in the glass follow
the pointer, or the scroll on a touch screen. Alone, the word hangs the scanned gilt frame. A second
word names another frame from `FRAME_KINDS` in `src/lib/art-effect/presets.ts`, such as `wood`, a
rustic frame of worn wood: `"glazed wood"`. It takes no third word. Without WebGL2, and in print, the
frame and its shadow stay still and the glass is left out. A 3:2 painting spans the column like a
16:9 picture; a portrait painting floats beside its text like any portrait picture.

```markdown
![Des naufragés tirent un coffre hors des vagues, au pied d'une falaise.](../../media/art/les-naufrages-de-la-venue-3_2-og.png "glazed")
:caption[« Les Naufragés de la Venue », toile peinte en 238 apr. V.]
```

A wide picture takes `"almanach"` (`ALMANACH_PICTURE`): the picture fills the tube of the default
almanach, with its power and zoom buttons at the end of the caption's line. Add the name of a style in `data/almanachs/`
after the word to dress the almanach in that style instead. The tube is wider than a 16:9 picture
and crops its top and bottom; to keep another point in view than the centre, follow with that point
as two percentages, across then down, the Dev Hub's « Point gardé »: `"almanach elfe 50% 20%"`
keeps the upper part. End the title on `mirrored` (`MIRRORED_PICTURE`) to show the picture
mirrored, left to right, on the tube and in its plain version; the file stays the original:
`"almanach elfe mirrored"`, or `"almanach mirrored"` in the default style. A portrait is refused, and `pnpm data:check` fails on a style that does not exist.
Design and save a style in the Dev Hub's Almanach page under `pnpm dev`. Without WebGL2 on a
graphics card, without JavaScript, and in print, the picture shows plain.

```markdown
![Une immense bibliothèque gothique aux bannières bleues, ses rayonnages sur plusieurs étages autour d'une sphère armillaire suspendue au-dessus d'un livre ouvert.](../../media/art/bibliotheque-des-oracles-16_9-og.png "almanach")
:caption[La bibliothèque de l'Académie des Oracles]
```

Inside a caption, set a title in guillemets, never in italics: the caption is already italic, and an
emphasis would break it into two lines.

A caption goes on the line directly under the picture, with no blank line between them, as
`:caption[...]`. The page prints it under the picture. `pnpm data:check` fails on a caption line
that does not follow a picture.

```markdown
## Au carrefour du sauvage et de la cité

![](../../media/art/nnor-marchand-3_4-og.png "torn")
:caption[Un émissaire marchand d'Araskha qui a posé son échoppe à Aïn-Dahab]

Les Nnors, fidèles à leurs montagnes, éprouvent une curiosité grandissante pour les cités voisines.
```

## The English overlay

`data/species/<id>.en.json` carries only the strings that change: `name`, `subtitle`, `movement`, `naming`, `givenNamesLabel`, `familyNamesLabel`, `subspecies` and `roleplay`. `types`, `size` and `languages` are never translated: they name keys, and the reader sees the `labelEn` from `data/meta/`. A sub-species is translated by its `id`: its `text` always, and its `name` when that name is a common noun, as the Mort-vivant's Fantôme becomes Ghost. A proper noun such as Landenheit stays as it is, and `names` never has an overlay. A name that is the same in both locales needs no overlay. See [add-a-translation.md](add-a-translation.md).

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

The lore is translated by a whole sibling file, `data/lore/species/<id>.en.md`, the way a book chapter is. Without one, the English page renders the French prose. The English page is written for its reader, never sentence for sentence, but it keeps the French page's frame: the same number of `##` sections, the same pictures in the same order and the same quote staging. `pnpm data:check` fails when they differ, and when a lore page carries a definition line (`: `), the shape a name list once took there: a people's names are data in its species file.

## What appears on the site

- `/fr/especes` and `/en/species`: a new card in the species index, with its cover, and the size of its pool.
- `/fr/espece/<id>` and `/en/species/<id>`: the hero, a dark stage in both themes, its cover framed as a card on the right over a backdrop drawn from the cover's own colours, with « Espèce », the title, the descriptors and the three plates on the left. Then the page reads in two parts. « En jeu » comes first, beside the sticky outline of the whole page: the lore's opening, then `Jouer un <nom>` with the roleplay text and a table of the roleplay facts, the languages and links to each sub-species, then `Origines régionales` or `Sous-espèces`, as `subspeciesLabel` says, with each sub-species' presentation and its imposed Compétence, then « Noms »: the `naming` paragraph, the people's own lists (`names`, or `familyNames` for a species with sub-species), then each sub-species' lists under its name; then the pool under `Compétences d'Espèce`. « Histoire » follows: the lore's sections beside a sticky outline of their own. The pool is the Codex list itself: rows, a sticky detail card and the filter bar, with a facet named by the same word. The rows run the species' own skills first, then each sub-species' imposed Compétence, marked « Imposée », and its own, in the order the file declares them, alphabetical inside each group, and they print no PX.
- `/fr/competences`: every skill the species or one of its sub-species offers or imposes gains a "Proposée par une Espèce" source, naming the sub-species when there is one, and a species facet.

## How to check it

```
pnpm data:check
pnpm dev
```

Then open `/fr/especes` and click through to the new species.

## Traps

**A species grants exactly two Compétences.** That number is canon from `data/books/livre-du-joueur/09-les-especes.md`, so it is `SPECIES_SKILL_CHOICES` in `src/lib/game/derive.ts` and not a field. Do not add one. The page states the rule and lists the pool; it does not let a reader pick, because a character sheet is not what Aubaine is.

**The hero carries three plates and the file authors no icon.** They are built from `types`, `movement` and `size`, in that order, and each takes the icon of the rule term it shows, Type de créature, Vitesse and Taille, named in `SPECIES_PLATE_TERMS` in `src/lib/game/derive.ts`, so a plate and the rules never draw a word with two icons. A species that declares neither `types`, `size` nor `derivedFrom` shows the movement alone.

**A derived Espèce declares neither size nor movement, and shows one plate instead of two.** `derivedFrom` says where both come from: a Mort-vivant keeps the size and the Vitesse of the Espèce it was, a Scothan takes them from the parent Espèce its Compétence Chair de l'un names. Two plates would have repeated the same sentence, so the hero renders a single one under `SPECIES_ORIGIN_ICON`. The schema refuses an entry that writes `size` or `movement` beside `derivedFrom`.

**Several sizes mean a choice, several types mean a cumulation.** `size` renders joined by `ou`, because a species that declares Moyenne and Petite lets the player pick one at creation. `types` renders joined by a middot, because a Cindersöhls is Humanoïde **and** Artificiel at once.

**The plates carry gameplay, the roleplay table carries the rest.** Type, Vitesse and catégorie de taille are rules a table consults, so they stay on the three plates. Age, lifespan and height are roleplay, so they live in `roleplay` and render in the `Jouer un <nom>` table. Height is not the size category: never write one to mean the other.

**The `Jouer un <nom>` heading is built, not authored.** It reads « Jouer un » followed by the `name`, and "Playing … characters" in English. Every species so far takes « un ». A name that needs « une » needs `playingAs` in `src/lib/i18n/strings.ts` changed first.

**An icon set has to be credited before it can ship.** `data/media/icons/` holds one directory per Iconify prefix, and `pnpm data:check` fails when a directory is not named by `ICON_SETS` in `src/lib/rights/attribution.ts`. Adding a file to a set already declared there needs nothing else; adding a new set needs a row in that module, which the credits page then renders on its own.

**There is no free text on the plates.** Every value is a key from a controlled vocabulary in `data/meta/`, so `pnpm data:check` rejects a type or a size the game has not declared.

**Descriptors are keys too.** `descriptors` names one to four words from `data/meta/descriptors.json`, which holds both labels, so the overlay never repeats them. A new word is a new entry there, chosen by the owner, and `pnpm data:check` rejects a key the file does not declare. A word the owner wants crossed out on its sticker carries `"effect": "struck"` there; a word written « ...Mot » that should hold its dots before it lands carries `"effect": "suspense"`. Every entry that names the word plays its effect.

**The outline builds itself, in two parts.** « En jeu » numbers `Jouer un <nom>`, then `Origines régionales` or `Sous-espèces` with each sub-species nested under it, when the species has them, then « Noms » when the species has a `naming` paragraph or a name list, then the pool. « Noms » is one entry: its sub-species headings are not listed. « Histoire » numbers every `##` of the lore file from 01 again. The outline beside the opening shows both parts, the one beside the lore shows « Histoire » alone. Nothing is authored for either, and an outline only appears when it has more than one entry.

**At creation a character keeps two species skills, or none yet.** Offering one skill leaves the second unfilled, and `pnpm data:check` fails on it unless a sub-species imposes the other. The count that matters is what a character picks from: the species' `offered` alone when there is no sub-species, and the species' plus each sub-species' own otherwise. A sub-species offering nothing of its own is fine as long as its species offers two. An imposed Compétence fills one of the two, so a sub-species that imposes one needs at least one other to pick from, and an empty pool beside it is refused.

**An imposed Compétence belongs to one sub-species.** It goes in that sub-species' `imposed`, never in any `offered`, and carries the sub-species as its `prerequisite`: `Être Fantôme`, EN `Ghost`. No one buys it, since its sub-species always has it and no one else may, so it writes `"showXp": false` and stays out of the Banque Commune.

**A sub-species lives inside its species.** The reader meets it as a « sous-espèce », or as an « origine régionale » where its Espèce calls it that, as Humain does: both names mean the same thing. A people split by region takes `regional-origins`; an Espèce that truly has sub-species, as the Mort-vivant has its forms, takes `subspecies`. Rule text that must reach every Espèce names both. It has no file, no page and no URL of its own, only an anchor on the species page, `#origine-<id>`. It adds to its species and never replaces it, and a skill is offered or imposed once across a species and its sub-species. All of it is enforced by `pnpm data:check`.

**Every species skill a character can buy also goes in the Banque Commune.** Add its id to `data/skill-lists/common-bank.json` as well as to `offered`. A character keeps two for free at creation, which is why the species page prints no PX, and buys the others later from the Banque Commune, which prints the price. The skill's `prerequisite` is what reserves it to the species, or to its sous-espèce or origine régionale. Two kinds stay out of it: a Compétence a sub-species imposes, which no one buys (see the trap above), and Scothan's two Compétences, which are both kept at creation and are unique to each Scothan, so they are offered by the Scothan page alone. The term index reads every species pool, so a `{{...}}` naming one still links to it there.

**Name lists are data, copied, never translated.** `names`, `subspecies[].names` and `familyNames` keep each list in the order and spelling the author gave, and the English overlay cannot carry them. A list never goes in the lore file, and neither does the naming custom: it is `naming`, the paragraph that opens « Noms », which aubaine-content writes and its translator puts into English.

**A list every sub-species shares is written once, on the species.** Two sub-species with the same family names give them through `familyNames`, as the Nnors give their Yurtas, and « Noms » shows them once, before the sub-species' own lists. `pnpm data:check` refuses two sub-species of one species that carry the same list, and `familyNames` beside a sub-species' own `names.family`.

**A species has one picture.** The 3:4 `cover` is its card, its hero and its social image, which is cut from the top of the portrait. There is no 16:9 banner to generate. `artEffect` changes how the browser renders that picture, never the file.

**A species is not a planche.** It has no `placements`, no `pos`, no plate and no booklet. If a set of Compétences wants a plate, it is an Arbre, not an Espèce.

**A species' `status` carries to every skill it offers.** It is a rung of the ladder in `docs/adr/0010-maturity-is-inherited-down-an-ownership-ladder.md`, between the trees and the equipment. A skill escapes it only by writing its own `status`.

**The id is the URL.** Changing it breaks every existing link to that species. Choose it once.

**Adding the file is enough.** The index card and the species page appear on their own.
