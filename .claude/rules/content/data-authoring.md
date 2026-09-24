---
paths:
  - "data/**/*.json"
  - "data/**/*.md"
---

# Data Authoring

`docs/data-contract.md` and the matching runbook in `docs/runbooks/` are the source of truth for the shape of every file under `data/`. Read the runbook before the first edit. The rules below are the invariants to hold before opening anything.

## One entity, one file

- A file under `data/` describes one entity and says nothing about where it is shown.
- An entity belongs to a tree, a list, an item, or a set by being named there, never by declaring it about itself.
- Relate entities by reference, through the fields the schema provides for it, such as a tree placement or `grants`. Never copy an entity's text into another entity.
- When a rules object grants another, reference it instead of restating it.

## Identity

- An id is permanent and unique across the whole repository, including across trees. Check that the file does not already exist before inventing one.
- A skill `title` and a state `name` are identifiers as well as labels: they are what `{{...}}` and `[[...]]` resolve against and what the term index matches. Renaming one is a repository wide change.
- A state `name` must be unique.
- Machine values, meaning ids, `key` fields, and domain, characteristic, rarity, discipline and tag keys, are shared across locales and are never translated.

## Derived values

- Never author a value the codex computes. A tree's domains and primary characteristics are counted from the skills it places, and the schema has no field for either.
- XP is `5 × tier` unless `xpOverride` replaces it.
- If a plate shows the wrong colour, change the skills, not the tree.

## Determinism

- Two space indent, one trailing newline, keys in the order the schema declares them.
- The exact bytes must equal `JSON.stringify(JSON.parse(file), null, 2) + "\n"`.
- Never write an explicit `null`. Leave the key out. On an upgrade, an absent key, `[]`, and a filled array mean inherited, explicitly none, and replaced.
- `pnpm data:check` enforces all of the above.

## Consistency

- Before adding a fact, search `data/` for the same entity or concept. One fact is stored once and referenced elsewhere.
- Do not resolve a contradiction between two files silently. Decide whether it is a stale entry, a locale error, or a real disagreement, and fix the source rather than writing prose that hides it.
- Adding the file is enough. There is no index, no registry, and no code change.
