# Add a state

Produces one entry on the Rules page, and a pastille with a tooltip everywhere rule text references the state by its key, between double braces.

## The file to create

```
data/states/<key>.json
```

The filename is the key. Lowercase, no accents, hyphens between words: `combustion.json`, `a-terre.json`, `poisse-explosive.json`. The state named `Enragé` lives in `enrage.json`, and rule text references it as `{{enrage}}`.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `key` | required | Identifiant machine, employé par l'ancre de la planche et par `{{clé}}` dans un texte de règle. | `^[a-z][a-z0-9-]*$`, matching the filename |
| `name` | required | Nom imprimé, et libellé par défaut d'une référence `{{clé}}` vers cet état. Il doit être unique. | any non empty string |
| `kind` | required | Ce que l'état fait à qui le porte, et la couleur de sa pastille. Clé déclarée dans data/meta/state-kinds.json, dont chaque valeur est un mot-clé : {{nefaste}}. | a key from `data/meta/state-kinds.json` |
| `type` | optional | Famille de l'état, que d'autres Compétences peuvent viser en bloc. Clé déclarée dans data/meta/state-types.json, dont chaque valeur est un mot-clé : {{type-etat-magie}}. Absent : l'état n'appartient à aucune famille. | a key from `data/meta/state-types.json` |
| `follows` | optional | Clé de l'état dont celui-ci est le cran suivant, comme poisse-solide après poisse-liquide. Les états se rangent par ordre alphabétique, et une chaîne de crans se range à la place de son premier cran, dans l'ordre des crans. | a state `key` from `data/states/` |
| `icon` | required | Nom Iconify. Sans fichier correspondant dans `data/media/icons/`, l'état se rend sans icône. | `mdi:<name>` or `game-icons:<name>` |
| `color` | optional | Encre propre de l'état, que portent son titre et chaque pastille qui le nomme, par exemple pour distinguer les crans d'une même famille. | `#rrggbb`, lowercase hex |
| `description` | required | Ce que l'état fait, jusqu'où il s'accumule s'il s'accumule, et comment il prend fin. Quand il n'en fixe pas la durée, le DD ou les dégâts, la Compétence ou l'objet qui l'applique les indique. | any non empty string |

## A complete example

`data/states/combustion.json`:

```json
{
  "key": "combustion",
  "name": "Combustion",
  "kind": "buff",
  "type": "magic",
  "icon": "mdi:fire",
  "description": "{{combustion}} s'accumule sur vous jusqu'à 5.\n\nLorsque vous effectuez un {{jet}} de dégâts qui inflige des dégâts de Feu, ajoutez 1 dégât par {{combustion}} que vous portez.\n\nAu début d'un combat, vous perdez toute votre {{combustion}}."
}
```

## What appears on the site

- `/fr/regles` and `/en/rules`: a row, sorted alphabetically among every rule entry and filterable by the `État` family, by its effect and by its type, whose detail shows the name and the rule text.
- Everywhere a skill, a state, an item, a set or a chapter writes `{{combustion}}`, a coloured pastille prints the name, with a tooltip carrying the kind, the type when there is one, and the first lines of the description. `{{combustion|texte}}` prints `texte` in the same pastille.
- `/fr/recherche` and `/en/search`: a row under the rules group.

## Choosing the type

A type is the family a Compétence can reach in one sentence: « un état de {{type-etat-magie}} » names every state of that type, whatever its kind. A state that belongs to no family stays untyped, and only a Compétence that names it, or that names its kind (« un état {{nefaste}} »), reaches it. Typing a state therefore makes it easier to end, resist or strip, and that is a balance decision for the owner. Add a type to `data/meta/state-types.json` only with the first state that needs it.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails if two states share a printed name, and it fails on any `{{...}}` whose key matches no entry.

## Traps

**Rule text references the state by its key, never by its `name`.** The key is the filename and does not change. Renaming a state moves no reference: it changes the default label everywhere a reference writes no text of its own, so read those sentences again after a rename. The `name` must still be unique.

**A booklet defines its states at the back.** A tree or catalogue booklet prints every state its rule text references by key, in full, on its last pages beside the rule words it references. Nothing in the rule text asks for it, and `pnpm data:check` refuses `[[` anywhere.

**The icon file may be missing and the state simply renders without one.** `Sans fichier correspondant dans data/media/icons/, l'état se rend sans icône.` Add the matching SVG under `data/media/icons/mdi/` or `data/media/icons/game-icons/`. See [add-an-image.md](add-an-image.md). `pnpm data:check` now fails when an icon named by the term index has no file, so a missing one is caught rather than silently dropped.

**An agreement is written text, not a field.** A French state name that is an adjective agrees with what carries it, and no state lists its other forms. `{{entrave}}` prints `Entravé`; write the agreed form after the bar, `{{entrave|Entravée}}` or `{{entrave|Entravées}}`. The tooltip still comes from `name`, and a bare `Entravée` is plain text.

**A state that accumulates says how far in its description.** There is no stack field and no counter printed beside the name: the cap is rule text, written once in the opening sentence, as `{{combustion}} s'accumule sur vous jusqu'à 5.` does. A state that starts at a value and counts down, like `Agonie`, says that value where the state is gained.

**`kind` gives the colour unless `color` gives the state its own.** Without `color`, a `buff` is gold, a `debuff` red and a `neutral` state blue-grey, from the `--state-` tokens in `src/styles/tokens.css`. With it, the state's heading and every pill that names it wear that colour, as the Poisse and Vent states do; `stateInk` in `src/lib/game/derive.ts` keeps its hue and adjusts its lightness so it stays legible on the dark theme, the light theme and paper.

**Adding the file is enough.** The Rules entry, the pastille, the tooltip and the search row all appear on their own.
