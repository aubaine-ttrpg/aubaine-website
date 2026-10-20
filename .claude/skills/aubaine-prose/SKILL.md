---
name: aubaine-prose
author: Kori
version: 3.0.0
last_updated: 2026-10-20
license: MIT
description: Write, rewrite, translate and audit Aubaine's explanatory and site prose, through a writer and an editor subagent. Covers the book chapters under data/books/, the tooltip definitions of rule terms, Caractéristiques, Aptitudes and tags, the Banque Commune note, the interface copy in src/lib/i18n/strings.ts, the policy pages in src/content/policies/, and the titles and meta descriptions composed from them. Holds the house voice, the locale conventions and the tells every Aubaine writing skill shares.
argument-hint: [surface and locale]
---

# Aubaine Prose

## Which skill writes what

| Surface | Skill |
| --- | --- |
| An entity file under `data/`: rule text, structured fields, flavour fields, its English overlay | `aubaine-content` |
| A lore page under `data/lore/`, and any history or story of the setting | `aubaine-lore` |
| A book chapter, a tooltip definition, the Banque Commune `note`, `strings.ts`, a policy page | this skill |

The voice, the locale references and the tells in `references/` are shared: the other two skills read
them here by path.

## Authority

`src/lib/game/schema.ts`, `docs/data-contract.md` and `docs/runbooks/` are the sole source of truth for
the shape of everything under `data/`; `references/site-copy.md` holds the surfaces outside it. A rule
under `.claude/rules/` wins over this file. Aubaine is an original game and the repository is its only
authority. Every list this work leans on has a source of truth in the repository: `data/meta/`,
`RULE_TERMS` in `src/lib/game/build.ts`, the state and skill files, the book chapters, and
`BANNED_PHRASES` in `tests/data/integrity.test.ts`. Read the source, never a copy.

## Registers

Where the text renders sets the register. A chapter teaches, a definition says what a thing is, an
interface label is read in passing, and a policy page is the project speaking in its own name.
`references/house-voice.md` and `references/reference-voice.md` hold them, and keeping them
distinguishable is the standing job.

## The run

The main agent orchestrates, runs every command and talks to the owner.

1. **Intake.** Name the surface, the locales and the register reference that governs it:
   `references/reference-voice.md` for a chapter or a definition, `references/site-copy.md` for the
   interface and the policies. For a chapter, open `docs/runbooks/add-a-book-page.md`. Settle every
   fact the text will lean on before drafting; a gap found now is a question.
2. **Write.** `aubaine-prose-writer` writes the text. An interface string is written as its French
   and English pair in one sitting. A chapter that prints a formula takes it from
   `.claude/skills/aubaine-content/references/formulary.md`, and every `{{...}}` follows
   `.claude/skills/aubaine-content/references/keyword-logic.md`.
3. **Edit.** `aubaine-prose-editor` reads the text against `references/ai-tells.md` and
   `references/style-checklist.md`. A finding about wording the owner kept is a note.
4. **Check.** `pnpm data:check`, and `pnpm check` when `strings.ts` changed. Run `pnpm dev` and read
   the page in both locales, and check what the opening becomes downstream (`references/site-copy.md`).
5. **Owner.** Report the file and what it now says, the notes and the questions. Commit only on
   « commit ».

## Refusals

- Do not write markup where nothing parses it: `***gras***` in a book chapter, a `{{...}}` in an
  interface string or a policy page.
- Do not write the antithesis outside a book chapter, in either locale.
- Do not let a chapter change a mechanic or restate a value an entry owns. A rule the explanation
  needs and nobody wrote is a gap to report.
- Do not frame Aubaine against another game.
- Do not invent a fact, a quotation, a credit or a designer's intent.
- Do not rewrite text you were not asked to touch. Drift is a report.
- Do not claim `pnpm data:check` passed unless it ran.

## References

- `references/source-hierarchy.md`, `references/claims-and-evidence.md`
- `references/editorial-workflow.md`, `references/validation.md`, `references/site-copy.md`
- `references/house-voice.md`, `references/reference-voice.md`, `references/flavor.md`
- `references/ai-tells.md`, `references/revising-an-entry.md`
- `references/locale-fr.md`, `references/locale-en.md`
- `references/style-checklist.md`
- `references/future-content-types.md` for content types Aubaine does not have yet
