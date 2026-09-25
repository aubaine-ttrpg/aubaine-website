---
name: aubaine-prose
author: Kori
version: 2.1.0
last_updated: 2026-09-24
license: MIT
description: Write, rewrite, translate, audit, and validate every word a reader sees on Aubaine: the codex under data/, the interface copy in src/lib/i18n/strings.ts, the policy pages in src/content/policies/, the tooltip definitions of rule terms, Caractéristiques, Aptitudes and tags, and the titles and meta descriptions composed from them. Use for skills, upgrades, skill trees, skill lists, states, equipment items, sets, species, the catalogue, book chapters, English overlays, interface labels, policy prose, and editorial audits of game prose.
---

# Aubaine Prose

## Authority

`src/lib/game/schema.ts`, `docs/data-contract.md`, and `docs/runbooks/` are the sole source of
truth for the shape of everything under `data/`. That contract does not reach a surface outside
`data/`; `references/site-copy.md` holds the other three.

Before doing any work:

1. Read the runbook for the entity you are about to touch, completely.
2. Apply its current requirements exactly.
3. Do not duplicate, replace, weaken, or infer the contract from this file.
4. Never modify `schema.ts`, `docs/data-contract.md`, or a runbook unless the user explicitly
   requests a contract change.
5. When a repository rule under `.claude/rules/` conflicts with this file, the rule wins.

Aubaine is an original game and the repository is its only authority. Nothing outside it defines an
Aubaine mechanic, term, unit, cost, progression step, or setting fact. Where Aubaine vocabulary
resembles that of another game, the Aubaine usage is canonical and must not be corrected toward the
other game.

Every list this work leans on has a source of truth in the repository and every one of them grows:
`data/meta/` for the controlled vocabularies (`data/meta/tags.json` for the skill tags),
`RULE_TERMS` in `src/lib/game/build.ts` for the rule terms and their definitions, the state and skill files for their own names, the book chapters for the language the game
uses in prose, and `BANNED_PHRASES` in `tests/data/integrity.test.ts` for the phrasings the
repository refuses. Read the source when you need the members. Never work from a copy.

## Which runbook

`docs/runbooks/README.md` routes every job under `data/`. Open it rather than guessing the shape of
a file.

## Registers

Where the text renders sets the register. Rule text executes at a table, flavour gives an entry
identity, a chapter teaches, an interface label is read in passing, and a policy page is the project
speaking in its own name. `references/house-voice.md` and `references/reference-voice.md` hold the
set, and keeping them distinguishable is the standing job.

## Operating procedure

1. Identify the surface, then the entity kind and the locale.
2. Open its runbook and read the field table and the traps.
3. Read two or three settled sibling files before drafting, to match the established register and
   terminology. `references/editorial-workflow.md` says which entries count; a `draft` never does.
4. Settle every fact you cannot verify before drafting around it. A gap surfaced now is a question;
   the same gap discovered at review is a rewrite.
5. Build the mechanical skeleton from the schema fields first. Write prose only once the mechanic is
   internally complete.
6. Apply the keyword discipline in `references/keyword-rendering.md`. Canonical spelling is what
   makes a term render with its icon and colour, and it reaches `data/` only.
7. Check what the first sentence becomes downstream. `references/site-copy.md` explains why an
   entry's opening is also its meta description.
8. Write the keys in schema declaration order, two space indent, one trailing newline, and never an
   explicit `null`.
9. Run `pnpm data:check`, and `pnpm check` as well when a TypeScript file changed.
10. Run `pnpm dev` and look at the page in both locales.
11. Report the file and what it does, not the process that produced it.

## Refusals

- Do not add a field the schema does not declare. Schemas are strict and an unknown key silently
  drops the entry.
- Do not author a derived value. A tree's domains and primary characteristics are computed, and XP is
  `5 × tier` unless `xpOverride` replaces it.
- Do not reuse an existing entity id.
- Do not translate a machine value: ids, `key` fields, and domain, characteristic, rarity,
  discipline, and tag keys.
- Do not tag a skill to fill a slot, and do not invent a tag. A skill carries only the tags it needs;
  `docs/runbooks/add-a-tag.md` says when a new one is justified.
- Do not write markup where nothing parses it: rule text markup in a book chapter, Markdown headings
  in a JSON field, or either one in an interface string or a policy page.
- Do not put `pos` or `linked` in a skill file. They belong to the tree.
- Do not write the antithesis outside a book chapter, in either locale.
- Do not ship an entry that carries no detail only that entry could carry. Say so and stop.
- Do not rewrite text you were not asked to touch. Drift you noticed is a report, not a diff.
- Do not invent a mechanic, a value, or a term to fill a gap. Surface the gap instead.
- Do not claim `pnpm data:check` passed unless it actually ran.

## References

- `references/source-hierarchy.md`
- `references/editorial-workflow.md`, `references/validation.md`
- `references/keyword-rendering.md`, `references/site-copy.md`
- `references/house-voice.md`, `references/flavor.md`, `references/reference-voice.md`,
  `references/naming.md`
- `references/ai-tells.md`, `references/claims-and-evidence.md`,
  `references/one-entry-one-job.md`, `references/revising-an-entry.md`
- `references/locale-fr.md`, `references/locale-en.md`
- `references/style-checklist.md`, `references/clarity-checklist.md`
- `references/future-content-types.md` for content types the codex does not have yet
