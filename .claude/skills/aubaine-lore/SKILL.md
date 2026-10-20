---
name: aubaine-lore
author: Kori
version: 1.0.0
last_updated: 2026-10-20
license: MIT
description: Write, transcribe, translate and audit Aubaine's lore, the histories of its peoples and trees under data/lore/ and the standalone lore to come. Three subagents (writer, canon verifier, editor) and owner checkpoints, starting from the owner's own text whenever there is one. Use for a species or tree lore page, its epigraph, its name lists, its English version, and any story or history of the setting.
argument-hint: [people, tree or event, and its source file]
---

# Aubaine Lore

## Authority

The repository is the only authority for Aubaine's canon. `.claude/rules/content/lore-prose.md`
holds the invariants, and `docs/runbooks/add-a-species.md` § The lore file the format: no
frontmatter, the page opens at `##`, an epigraph closes on `> :source[...]`, an image path reads
`../../media/art/<file>`. A rule under `.claude/rules/` wins over this file.

## Scope

`data/lore/**`, and standalone lore once a schema exists (`references/future-lore-types.md`). The
species file, its Compétences and the prose fields inside it belong to `aubaine-content`; a book
chapter belongs to `aubaine-prose`.

## The run

The main agent orchestrates, runs every command, and is the only one that talks to the owner. Each
step below that names a subagent gives it the brief, the files in scope and the ledger so far.

1. **Intake.** Open `tmp/lore-runs/<date>-<slug>/` and write the brief: the owner's request verbatim,
   the source text taken with `pdftotext -layout` when the source is a PDF, every character it hides
   that the repository refuses, and every page that shares a people, a place, a name or an event
   with this one, found by search and ordered newest first with `git log -1 --format=%cs`.
2. **C0.** Ask what the repository does not settle: where the name lists go, a name made unreadable
   by its source, a spelling two sources disagree on, which sections the page keeps.
3. **Write.** `aubaine-lore-writer` writes the French page (`references/lore.md`).
4. **Canon.** `aubaine-lore-canon` returns the claim table (`references/canon.md`).
5. **Fix.** The writer resolves each `new fact` and `contradiction` the owner has not approved.
   Every answer the owner gives in conversation goes into the brief verbatim and counts as the
   owner's text from then on. A fix that removes or changes owner text gets its own ledger row
   that quotes the owner's words it rests on.
6. **Edit.** `aubaine-lore-editor` reads the French for the tells (`references/lore-tells.md`).
7. **English.** The writer writes the English page in a second call, for an English reader
   (`.claude/skills/aubaine-prose/references/locale-en.md`), then the editor reads it.
8. **Check.** `pnpm data:check`. It covers refused phrases, image paths, `:source[...]`, headings and
   every `{{...}}` the page writes.
9. **C1.** The owner gets the page in both locales on `pnpm dev`, the ledger, and every inference
   and new fact for veto. Commit only on « commit ».

The ledger, its columns and the snapshot guard are the ones `aubaine-content` defines in
`.claude/skills/aubaine-content/SKILL.md` § The ledger.

## Refusals

- Do not invent a people, a place, a date, an institution, a cause or a relationship. A small
  concrete detail that dramatises a known fact is allowed and listed for veto.
- Do not rewrite a voice that already works. From the owner's text, change only slips, house
  typography and canon that has moved; a tell in the owner's text is a note.
- Do not let lore create a mechanic. What a people can do at the table is a Compétence.
- Do not swap a people the owner named for one that has a page.
- Do not mirror the French sentence for sentence in English.
- Do not claim a check passed unless it ran. Do not commit without « commit ».

## References

- `references/lore.md`: the craft, read end to end before writing.
- `references/canon.md`: the claim table.
- `references/lore-tells.md`: the tells of long narrative prose.
- `references/future-lore-types.md`: lore types without a schema yet.
- Shared, in `.claude/skills/aubaine-prose/references/`: `claims-and-evidence.md`, `ai-tells.md`,
  `locale-fr.md`, `locale-en.md`, `house-voice.md`.
- `{{...}}` references follow `.claude/skills/aubaine-content/references/keyword-logic.md`.
