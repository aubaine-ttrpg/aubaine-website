# Runbooks

One job per page. Every job is done by adding or editing a file under `data/`. There is no index to update, no registry to register in, no code to change.

## Which file do I open?

| I want to | Open |
| --- | --- |
| Write a new skill that a tree will sell | [add-a-skill.md](add-a-skill.md) |
| Add a level 2, 3, 4 step under a skill that already exists | [add-an-upgrade.md](add-an-upgrade.md) |
| Create a new archetype or domain plate | [add-a-skill-tree.md](add-a-skill-tree.md) |
| Put an existing skill on a plate, move it, or link it | [place-a-skill-on-a-tree.md](place-a-skill-on-a-tree.md) |
| Create a playable species, or a sub-species | [add-a-species.md](add-a-species.md) |
| Add a weapon, armour, jewel or consumable | [add-an-item.md](add-an-item.md) |
| Group pieces into a set with tiered bonuses | [add-a-set.md](add-a-set.md) |
| Add a condition that rule text names between double square brackets | [add-a-state.md](add-a-state.md) |
| Add something every creature can do, with no XP cost | [add-a-base-action.md](add-a-base-action.md) |
| Add a skill anyone can buy without a tree | [add-a-common-bank-skill.md](add-a-common-bank-skill.md) |
| Tag a skill, or add, rename or retire a tag | [add-a-tag.md](add-a-tag.md) |
| Start a new book, or attach a PDF | [add-a-book.md](add-a-book.md) |
| Write a chapter inside a book | [add-a-book-page.md](add-a-book-page.md) |
| Put an English version next to a French file | [add-a-translation.md](add-a-translation.md) |
| Add a plate banner, an item picture, an icon or a PDF | [add-an-image.md](add-an-image.md) |

## Read once, before the first edit

[../data-contract.md](../data-contract.md) explains the shape of `data/`: why a skill lives in one file and trees only point at it, how translations sit beside the French file, and the writing rules every JSON file follows.

## The two commands

```
pnpm data:check
pnpm dev
```

`pnpm data:check` validates every file against the schema and checks that every reference resolves. `pnpm dev` serves the site at `http://localhost:4321`.

## The rules that bite hardest

- A skill id is used once, for ever, across the whole repo.
- Never write `"key": null`. Leave the key out.
- `energy: 0` and no `energy` key are two different things.
- `pos` and `linked` belong to the tree file, never to the skill file.
- Tags are optional and come only from `data/meta/tags.json`. A skill carries only the slots it needs.
- A tree's domains and characteristics are computed. Do not author them.
- A picture you commit carries its own copyright. `pnpm data:check` fails until `pnpm media:stamp` has run.
