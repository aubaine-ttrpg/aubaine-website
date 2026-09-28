# Add a translation

Produces the English version of one entry. Anything you do not translate keeps showing the French.

## The file to create

Next to the French file, same name, with `.en` before the extension.

| French file | English file |
| --- | --- |
| `data/skills/RAGEXX-001.json` | `data/skills/RAGEXX-001.en.json` |
| `data/skill-trees/berserker.json` | `data/skill-trees/berserker.en.json` |
| `data/skill-lists/common-bank.json` | `data/skill-lists/common-bank.en.json` |
| `data/states/combustion.json` | `data/states/combustion.en.json` |
| `data/equipment/items/dague.json` | `data/equipment/items/dague.en.json` |
| `data/equipment/sets/FAEBI.json` | `data/equipment/sets/FAEBI.en.json` |
| `data/equipment/catalogue.json` | `data/equipment/catalogue.en.json` |
| `data/materials/branche-morte.json` | `data/materials/branche-morte.en.json` |
| `data/environments/foret.json` | `data/environments/foret.en.json` |
| `data/books/livre-du-joueur/book.json` | `data/books/livre-du-joueur/book.en.json` |
| `data/books/livre-du-joueur/03-creer-un-personnage.md` | `data/books/livre-du-joueur/03-creer-un-personnage.en.md` |

French is the source and the fallback. The English file is an overlay: it holds only the strings that change, and every key it leaves out falls back to the French one.

## The fields

An overlay may only carry the fields listed below, for its kind. Every one of them is optional. Anything else makes the overlay invalid, and an invalid overlay is silently ignored, which leaves the whole entry in French.

| Kind | Fields you may translate |
| --- | --- |
| skill | `title`, `prerequisite`, `activation`, `range`, `duration`, `description`, `upgrades` |
| skill tree | `name`, `core.label`, `core.sublabel` |
| skill list | `name`, `subtitle`, `note` |
| species | `name`, `subtitle`, `movement`, `subspecies`, `roleplay` |
| equipment item | `name`, `kind`, `prerequisite`, `headlines`, `stats`, `properties`, `craft.materials`, `craft.sequence`, `text`, `description` |
| equipment set | `name`, `description`, `bonuses` |
| catalogue | `name`, `subtitle`, `sections` |
| material | `name`, `description` |
| environment | `name`, `description` |
| state | `name`, `description` |
| book | `title`, `description` |
| book page | `title` in the frontmatter, and the body |

Four of these are keyed maps rather than arrays:

| Field | Keyed by | From `schema.ts` |
| --- | --- | --- |
| skill `upgrades` | the upgrade's `level`, as a string | Améliorations traduites, keyées par leur niveau sous forme de chaîne. |
| species `subspecies` | the sub-species' `id` | Noms et présentations traduits, keyés par l'identifiant de la sous-espèce. Un nom ne se traduit que s'il est un nom commun. Each value is `{ "name": "...", "text": "..." }`, either key optional. |
| set `bonuses` | the tier's `pieces`, as a string | each value is `{ "text": "..." }` |
| catalogue `sections` | the section's `key` | each value is the translated title |

Never translate a key, an id, a domain key, a characteristic key, a rarity key, a discipline key or a tag key. Those are machine values and they are shared across locales. A skill's tags are keys, so they never appear in an overlay: the English page reads each tag's `labelEn` from `data/meta/tags.json`.

## A complete example

`data/skill-lists/common-bank.en.json`:

```json
{
  "name": "Common Bank",
  "subtitle": "Free skills · no tree required",
  "note": "{{banque-commune}} skills are independent from one another. Any character may buy one at any time, whatever their trees: they cost XP and whatever {{prerequis}} some of them carry."
}
```

`data/books/livre-du-joueur/book.en.json`:

```json
{
  "title": "Player Handbook",
  "description": "Everything you need to play: the three golden rules, the Roll, building a character, the Trees, equipment, exploration, social interaction, combat and progression."
}
```

A skill overlay with upgrades would look like this. Keys not listed stay French:

```json
{
  "title": "Rage",
  "duration": "Until the end of your next turn",
  "description": "You fly into a rage. You are {{enrage}} until the end of your next turn.",
  "upgrades": {
    "2": {
      "title": "Fury",
      "description": "While you are {{enrage}}, your {{attaque|Attacks}} deal 2 extra damage."
    }
  }
}
```

## What appears on the site

The `/en/` half of the site. `/en/tree/berserker`, `/en/rules`, `/en/equipment`, `/en/books`. Every French page has an English twin at the same position, and the language switch in the header moves between them. An entry with no overlay shows its French text on the English page.

## How to check it

```
pnpm data:check
pnpm dev
```

Then open the `/en/` page and compare it against the `/fr/` one.

`pnpm data:check` fails if an overlay targets a file that does not exist, and it checks that both locales build with the same number of skills, trees and items.

## Traps

**An invalid overlay is ignored without an error at render time.** If you add a field the overlay does not allow, or misspell one, the loader drops the whole overlay and the entry stays French on the English page. If an English page is stubbornly French, check the overlay's field names first.

**A reference keeps its key in every locale.** The overlay writes `{{enrage}}` and `{{RAGEXX-001}}` exactly as the French file does, never a translated name, and `pnpm data:check` resolves each key in the locale it is written in.

**A reference prints the labels of the language its string is written in.** In an overlay, `{{energie}}` prints `Energy`, and `{{enrage}}` prints the state's English name once `data/states/enrage.en.json` gives it one, `Enragé` until then. A French string the English page falls back to keeps its French labels. Write a plural as text after the bar: `{{jet|Rolls}}`.

**Upgrades are keyed by level as a string, not by array position.** `"2"`, not `2`, and not the first element of a list. An upgrade level with no key keeps its French title and text.

**An overlay must target a file that exists.** Renaming or deleting a French file without doing the same to its `.en.json` makes `pnpm data:check` fail with `overlay ... targets nothing`.

**The overlay holds only what changes.** Do not copy the whole French file and translate in place. Extra keys are at best ignored and at worst invalidate the overlay.

**Never write `"key": null`.** Leave the key out. A key you leave out is exactly how you say "keep the French".
