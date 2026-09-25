# Add a state

Produces one card on the states page, and turns the state's name into a pastille with a tooltip everywhere rule text writes it between double square brackets.

## The file to create

```
data/states/<key>.json
```

The filename is the key. Lowercase, no accents, hyphens between words: `combustion.json`, `a-terre.json`, `poisse-explosive.json`. The state named `Enragé` lives in `enrage.json`.

## The fields

| Field | Required | What it means (from `schema.ts`) | Allowed values |
| --- | --- | --- | --- |
| `key` | required | Identifiant machine, employé par l'ancre de la planche. | `^[a-z][a-z0-9-]*$`, matching the filename |
| `name` | required | Nom imprimé, et ce qu'un texte de règle écrit entre doubles crochets. Il doit être unique. | any non empty string |
| `forms` | optional | Autres formes écrites du nom, accord et pluriel compris, reconnues dans un texte de règle. Le nom imprimé reste celui de `name`. | array of non empty strings |
| `kind` | required | Couleur de la pastille : ce que l'état fait à qui le porte. | `buff`, `debuff`, `neutral` |
| `icon` | required | Nom Iconify. Sans fichier correspondant dans `data/media/icons/`, l'état se rend sans icône. | `mdi:<name>` or `game-icons:<name>` |
| `color` | optional | Encre propre, lorsque les crans d'une même famille doivent se suivre à l'œil. | `#rrggbb`, lowercase hex |
| `description` | required | Ce que l'état fait, jusqu'où il s'accumule s'il s'accumule, et comment il prend fin. Quand il n'en fixe pas la durée, le DD ou les dégâts, la Compétence ou l'objet qui l'applique les indique. | any non empty string |

## A complete example

`data/states/combustion.json`:

```json
{
  "key": "combustion",
  "name": "Combustion",
  "kind": "buff",
  "icon": "mdi:fire",
  "description": "Combustion s'accumule sur vous jusqu'à 5.\n\nLorsque vous effectuez un Jet de dégâts qui inflige des dégâts de Feu, ajoutez 1 dégât par Combustion que vous portez."
}
```

## What appears on the site

- `/fr/etats` and `/en/states`: a card, sorted alphabetically with the others, showing the name, the kind as a coloured kicker and the rule text.
- Everywhere a skill, a state, an item or a set writes `[[Combustion]]`, the name becomes a coloured pastille with a tooltip carrying the kind and the first lines of the description.
- `/fr/recherche` and `/en/search`: a row under the states group.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails if two states share a printed name, and it fails on any `[[name]]` in any rule text that does not match a state.

## Traps

**The `name` is what rule text writes between double square brackets, and it must be unique.** Matching is case insensitive but otherwise exact, accents included. If you rename a state, every `[[old name]]` and `[[[old name]]]` in `data/skills/`, `data/states/`, `data/equipment/items/` and `data/equipment/sets/` breaks, and `pnpm data:check` will list every one of them.

**`[[[Nom d'état]]]`, with three brackets, is a marker stripped from the web rendering.** Several skills end with a line like `[[[Enragé]]]` to declare which state they attach to for the printed plates. It still has to name a state that exists, but it prints nothing on the site.

**The icon file may be missing and the state simply renders without one.** `Sans fichier correspondant dans data/media/icons/, l'état se rend sans icône.` Add the matching SVG under `data/media/icons/mdi/` or `data/media/icons/game-icons/`. See [add-an-image.md](add-an-image.md). `pnpm data:check` now fails when an icon named by the term index has no file, so a missing one is caught rather than silently dropped.

**A French state name that is an adjective needs its `forms`.** Automatic marking of a bare word is exact: `Entravé` is marked and `Entravée` is not, because the agreement makes it a different word. `forms` lists the other spellings, so write `["Entravée", "Entravés", "Entravées"]` beside `Entravé`. The tooltip and the printed name still come from `name`. This only affects bare words in prose; `[[Entravé]]` resolves on its own and is case insensitive.

**A state that accumulates says how far in its description.** There is no stack field and no counter printed beside the name: the cap is rule text, written once in the opening sentence, as `Combustion s'accumule sur vous jusqu'à 5.` does. A state that starts at a value and counts down, like `Agonie`, says that value where the state is gained.

**`kind` decides the colour, not `color`.** `buff` is green, `debuff` is orange, `neutral` is grey. Use `color` only to keep several steps of one family visually in order.

**Adding the file is enough.** The card, the pastille, the tooltip and the search row all appear on their own.
