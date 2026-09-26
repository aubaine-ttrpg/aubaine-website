# The data contract

Everything on the site comes from files under `data/`. There is no database, no admin panel and no build step you have to run by hand. You add a JSON or Markdown file, the page appears.

## One file per skill, trees as layout manifests

A skill is written once, in `data/skills/<ID>.json`. That file holds what the skill is: its name, its type, its price tier, its domains, its costs, its rule text, its upgrades. It holds nothing about where the skill is drawn.

A tree, in `data/skill-trees/<id>.json`, is a layout manifest. It lists placements, and each placement names a skill id, where its node sits on the plate (`pos`), and which nodes it draws a line to (`linked`).

The split exists for two reasons.

**A skill can sit in more than one tree.** Physique and Artisan can both sell the same node, at a different place on each plate, with a different parent on each. If `pos` lived in the skill file, the second tree could not place it.

**Equipment grants reference the same skill.** `data/equipment/items/pyro-catalyseur.json` writes `"grants": ["TRFEU-01"]`, and `data/equipment/sets/TRAQU.json` writes `"grants": ["SILLA-01"]`. Those are the same skill files the trees point at, not copies. A granted skill has no placement at all, and usually carries `"showXp": false` because it is never bought.

The same logic runs through the rest of the model. `data/skill-lists/basic-skills.json` and `data/skill-lists/common-bank.json` are lists of ids, in printing order. A skill belongs to a tree, a list, an item or a set by being named there, never by declaring it about itself.

Two things are computed from the skills a tree places, and must never be authored:

- The tree's **domains**, counted from the `domains` of its placed skills plus `core.domains`.
- The tree's **primary characteristics**, counted from the `characteristics` of its placed skills and their upgrades.

The tree schema has no field for either. Change the skills if the plate shows the wrong colour.

The other derived rule: **XP is `5 × tier`**, unless `xpOverride` replaces it. Tier 10 tops out at 50 XP, so anything dearer needs an override.

## Maturity is declared once and inherited downward

Not every entry is equally settled. A skill tree, a species, a skill, an equipment item and a set each accept an optional `status`, worth `draft`, `playtest`, `beta` or `balanced`, written from the least settled to the most. Draft prints a dashed outlined badge and means the entry is still being written, not yet ready to bring to a table. Playtest prints a yellow and black hazard badge, beta prints a quiet outlined one, and balanced prints nothing at all, because settled content is the normal case and a badge on it would be noise.

A skill that writes no `status` inherits one, which is what makes the field worth having: marking one tree marks every skill on its plate in a single edit. The owner is looked for in a fixed order, and the first one that declares anything wins.

1. The skill's own `status`.
2. The tree that places it.
3. The species that offers it, or imposes it through one of its sub-species.
4. An item that grants it.
5. A set tier that grants it.

The order is not arbitrary. A tree or a species is where a skill lives, and an item that hands the same skill out is only a second way to obtain it, so a settled tree skill is not dragged into playtest by one new catalyst. Where two owners sit on the same rung, the less settled one wins.

`balanced` exists so that a skill can contradict its tree. Absent means inherited, `balanced` means settled on purpose, and the two are not the same thing even though neither prints a badge.

Two kinds fall outside this. A skill list carries no status, so the Common Bank skills and the basic skills only ever badge from a `status` written on the skill itself. A set never prints a badge of its own either, because it has no page and its bonuses are rendered on the pieces; its status exists only to reach the skills its tiers grant.

## Translations sit beside the French file

French is the source language and the fallback. An English version is a sidecar overlay: the same path with `.en` before the extension.

```
data/skills/RAGER-01.json        the French entry
data/skills/RAGER-01.en.json     the English overlay
```

An overlay holds only the strings that change. Every key it leaves out falls back to French. An overlay may only carry the fields its kind allows, and an overlay that does not fit its shape is dropped whole, which leaves the entry in French on the English page. See `runbooks/add-a-translation.md`.

Markdown book pages follow the same rule: `02-l-ame.md` and `02-l-ame.en.md`.

Machine values are never translated. Ids, `key` fields, domain keys, characteristic keys, rarity keys and discipline keys are shared across locales.

## The `data/` tree

| Folder | One file is |
| --- | --- |
| `data/skills/` | one skill, named `<ID>.json` |
| `data/skill-trees/` | one plate, named `<tree-id>.json`, listing placements |
| `data/skill-lists/` | one ordered list of skill ids: the basic skills and the common bank |
| `data/species/` | one playable species, named `<id>.json`, listing the skills it offers |
| `data/states/` | one condition, named `<key>.json` |
| `data/equipment/catalogue.json` | the catalogue's id, its plates and its sections, in reading order |
| `data/equipment/guide.md` | the equipment guide, one page, with an `.en.md` twin |
| `data/equipment/items/` | one item, named `<slug>.json`, its slug being its id |
| `data/equipment/sets/` | one set, named `<ID>.json`, with its tiered bonuses |
| `data/books/<book-id>/` | one book: `book.json` plus one `NN-slug.md` per chapter, each a whole page |
| `data/meta/` | one controlled vocabulary per file. Read the directory for the current set |
| `data/media/` | covers and banners, item pictures, icons, PDFs, fonts, flags, video |
| `data/aubaine.json` | the version string printed in the footer |
| `data/media-captions.json` | the title, the description and the keywords a picture carries in its own bytes |
| `data/pdf/` | `releases.json`, the register of booklet tirages, and `notes.json`, the version log |

## A picture is named for its shape and its history

Every file under `data/media/art/` and `data/media/items/` is called `<nom>-<rapport>-<état>.<extension>`: `berserker-3_4-og.png`, `bravado-16_9-upscaled_2.jpg`. The ratio is written in lowest terms with an underscore in place of the colon, and the state is one of `og`, `cleaned`, `upscaled_2` and `upscaled_4`. The schema rejects any other shape of name.

Two facts about a picture are otherwise impossible to recover once it is on disk. The first is what it is for: a card wants a 3:4 portrait and a hero wants a 16:9 plate, and a file called `berserker.png` says neither. The second is whether it is the file that came out of the generator. `og` is a claim that nothing has touched it, which is why it never combines with `cleaned` or with an enlargement, and why the original stays in the repo next to anything derived from it.

`data/media/video/` follows the same grammar with an `mp4` extension and one further state, `compressed`, for a file re-encoded to a lower bitrate: `le-bastion-16_9-compressed.mp4`. A served clip is never `og`, and no master is kept beside it, because that folder is published whole.

`pnpm data:check` opens every picture and compares the declared ratio to the real pixels, so the name cannot drift from the image. A video's ratio is checked as a name only, for the reasons recorded in `docs/adr/0009-pictures-name-their-shape-trees-carry-two.md`.

A tree and a book each carry `cover` and `banner`. The card uses `cover` and falls back to `banner` when there is none; the hero and the social image always use `banner`.

Every picture field is optional, and none of them leaves a hole. A slot with nothing named draws the default plate for its ratio, held in `src/lib/media.ts`: a 3:4 one behind a card, a 16:9 one behind a hero, a 1:1 one on a skill or an item. Naming a real picture is still the point; the default keeps a page whole until one exists.

## A picture carries its rights, and says what it is

A file under `data/media/art/`, `data/media/items/`, `data/media/skills/` and `data/media/unassigned/`, along with the logos, the QR and the hero loop, holds its ownership in its own bytes: `Author` `Aubaine`, `Copyright` `© 2026 Aubaine. Sous licence CC BY-NC-SA 4.0.`, `Software` `Aubaine Catalyst`, `Source` `https://aubaine.io`, and an XMP packet repeating them for the software that reads XMP rather than text chunks. The same claim is written into every derivative the build emits and into every booklet `pnpm pdf` renders, so the copy a reader downloads carries what the footer prints. `pnpm media:stamp` writes it, `pnpm data:check` fails without it, and anything a generator left behind is removed in the same pass. `src/lib/rights/claim.ts` composes every one of those strings. The vocabulary is recorded in `docs/first-party-assets.md` and the decision in `docs/adr/0011-assets-carry-their-own-rights.md`.

Two fields are authored. `data/media-captions.json` maps a path under `data/media/` to a title, a description and its keywords, validated by `mediaCaptions`.

```json
{
  "file": "items/dague-1_1-og.png",
  "title": "Dague",
  "description": "Dague à lame courbe et garde dorée, sur fond bleu.",
  "keywords": ["arme", "objet"]
}
```

An entry is optional. A picture missing from the file is still stamped and simply carries no title and no description, which is what keeps adding a picture a one file job. It is a place to write a description, not a register to sign, and a description is written from the picture and from nothing else. There is no English overlay: a file has one set of bytes, both locales are served the same file, and the description is French like the rest of `data/`.

`data/media/icons/` and `data/media/fonts/` are never stamped. They are third party, and their terms are recorded in `docs/third-party-assets.md`. The two flags are stripped of what they arrived with and claimed by nobody.

## `schemas/` and `src/lib/game/schema.ts` are the same contract

`src/lib/game/schema.ts` is the contract, written once, in one place. Every field carries a French `.describe()` saying what it means. That file is what validates your JSON at build time, what types the site's code, and what the runbooks quote.

`schemas/` is where the JSON Schema emission of the same definitions belongs, for editors and external tools. It is generated by `pnpm schemas`, never edited by hand. When the two disagree, `schema.ts` wins and the emission is out of date: run `pnpm schemas` after any change to the contract.

## Writing files deterministically

Every file under `data/` follows the same four rules, and `pnpm data:check` enforces all of them.

**Two space indent.** Every level, no tabs.

**A trailing newline.** One, at the end of the file.

**No `null`, ever.** A key you do not want is a key you leave out. Writing `"domains": null` is rejected. This matters most on an upgrade, where an absent key, `[]` and a filled array mean three different things: inherited, explicitly none, and replaced.

**Fixed key order.** Write the keys in the order the schema declares them. A skill goes `id`, `status`, `title`, `type`, `tier`, `xpOverride`, `showXp`, `art`, `domains`, `characteristics`, `prerequisite`, `activation`, `range`, `duration`, `concentration`, `energy`, `karma`, `life`, `evolvesFrom`, `tags`, `description`, `upgrades`. Skipping optional keys is fine; reordering the ones you keep is not.

The practical test: the exact bytes of the file must equal `JSON.stringify(JSON.parse(file), null, 2) + "\n"`.

One more rule applies to `src/`, `tools/`, `tests/` and `docs/`: no U+2013 and no U+2014. Use a plain hyphen or rewrite the sentence.

## Rule text markup

The same markup works in a skill description, an upgrade description, a state description, an item `text`, an item property text and a set bonus text.

| You write | You get |
| --- | --- |
| `***gras***` | bold |
| `[[Nom d'état]]` | a state pastille with a tooltip |
| `{{Nom de compétence}}` | a cross reference with a tooltip |
| a blank line | a paragraph break |

A name inside brackets or braces must resolve exactly, accents included, or `pnpm data:check` fails. States resolve by `name`, skills by `title`.

Rule text cites a tag in plain words, « l'étiquette » followed by its French label exactly: `l'étiquette Vol de vie`. `pnpm data:check` fails on a label `data/meta/tags.json` does not declare.

## Tags are a closed vocabulary

A skill's `tags` is an object with three optional slots, `practice` (one key), `schools` (one or two) and `specials` (one or more), filled with keys from `data/meta/tags.json`. That file holds the labels, the tooltip definitions and, on each École, the Pratiques it accepts. A skill carries only the slots it needs, and none at all is a valid answer. [runbooks/add-a-tag.md](runbooks/add-a-tag.md) owns the procedure and [adr/0020](adr/0020-skill-tags-are-three-optional-slots-and-every-hovered-word-is-defined.md) the reasons.

Book chapters use the same markup, and it resolves the same way. They are rendered through the term index too, so a keyword spelled canonically is marked wherever it appears in prose. Markdown owns emphasis there, so write `**bold**` rather than `***gras***`.

## Where the book chapters came from

The chapters that explain resolution, combat, rests, progression and money were written from an
external design specification, version 0.2.1, that predates this repository. It is not a source of
truth here: where it disagreed with the shipped data or the printed book, the data won, and the
disagreements are listed below. The specification is an input, like a set of notes, and nothing in
`data/` may be derived from it without a shipped entry to agree with.

Where it disagreed and the data won:

| Topic | The specification said | The data says |
| --- | --- | --- |
| Difficulty class | `11 + Caractéristique + Aptitude` | `10 + ...`, in forty five files and in the printed book |
| `À terre` | Désavantage on every Jet | Désavantage on Attaques only |
| Material classifier | Tags | Types |
| Loot opportunity | one for the group | one for each character |
| Craft requirement | a required value for each Type | one total `craft.cost`, spread freely across the Types |
| Rarity names | Inhabituel, Épique | `Peu commun`, `Très rare`, from `data/meta/rarities.json` |
| Armour | light `14/15 + Dex`, heavy a fixed `20` to `22` | what each item carries, one step lower |

The armour row never reaches a page: a chapter may not restate a value an entry owns, so the
equipment chapter explains that armour replaces the Classe d'armure formula and lets each item print
its own.

## Known inconsistencies in the source material

These are recorded, not fixed. They come from the import and the hand written chapters, and knowing about them saves a wasted search.

**Three skill ids were renamed because they collided.** A skill id is unique across the whole repo, permanently. The first import to claim an id keeps it.

| Id | Kept by | The one that had to move |
| --- | --- | --- |
| `SURCH-01` | Technomancien's Surcharge | Feu's Surchauffe became `SCHAU-01` |
| `IMPRO-01` | the basic skill Improviser | Artisan's Improvisation became `IMPRV-01` |
| `BOUSC-01` | the basic skill Bousculer | Physique's Bousculade became `BOUSD-01` |

**The difficulty class formula was written two ways, and is now settled at `10`.** Skill prose in `data/skills/` writes a DC as `10 + Caractéristique + Aptitude`, in forty five files, and so does the printed Livre du joueur. An earlier external design spec wrote `11 + Caractéristique + Aptitude`. The shipped data and the printed book agree, so `10` is the rule and the chapters print it. No skill file was changed. An `aubaine.io` architecture decision record had assigned the difficulty ladder to that external spec; this repository does not inherit it, because `.claude/rules/content/authority.md` makes this repository the only authority.

**Four Common Bank passive skills carry `energy: 0`.** `CBEST-01`, `CBGUE-01`, `CBPIE-01` and `CBPOL-01` are passive and write `"energy": 0`. The schema allows it on purpose: `une Compétence passive ne coûte pas d'Énergie. energy: 0 reste permis pour marquer explicitement une absence de coût.` They print a `0 énergie` pill. If that is not intended, the fix is to remove the key, not to change the schema.
