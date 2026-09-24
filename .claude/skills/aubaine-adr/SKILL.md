---
name: aubaine-adr
author: Kori
version: 1.0.0
last_updated: 2026-09-20
license: MIT
description: Write, amend, or supersede an Architecture Decision Record under docs/adr/ in the Aubaine format. Use whenever a decision should be recorded or formalized, whether the user says "ADR", "document this decision", "record this choice", "acte ce choix", "note de décision", or describes a technical trade-off worth engraving.
argument-hint: [decision topic]
allowed-tools: Read Write Glob Grep Bash(ls *)
---

# Aubaine ADR

## Authority

[`docs/adr/README.md`](../../../docs/adr/README.md) and
[`docs/adr/template.md`](../../../docs/adr/template.md) are the sole source of truth for the record
format, the numbering, and the amend and supersede policy.

Before doing any work:

1. Read both files completely.
2. Follow the template skeleton exactly. Do not deviate from the section order or the section names.
3. Do not duplicate, replace, weaken, or infer the format from this file.
4. Never modify `docs/adr/README.md` or `docs/adr/template.md` unless the user explicitly requests a
   format change.
5. When a repository rule under `.claude/rules/` conflicts with this file, the rule wins.

Records are written in English, like the rest of the repository's documentation, even though the
game content under `data/` is French.

## What to produce

A Markdown file in `docs/adr/`, named `NNNN-lowercase-kebab-slug.md`. Four digits, zero padded, a
hyphen, then a slug with accents stripped.

The number is incremental. List `docs/adr/` yourself, take the highest number present, and add one.
Start at `0001` when there is none. `README.md` and `template.md` carry no number, so ignore them.
Never reuse or reassign a number, and never write to an `NNNN-` path that already exists. If the
target file exists, the number was computed wrong; recompute it.

## Conventions

- **Scope a record to a topic, not to an atom.** A record holds one or several numbered decisions
  that belong to the same question. Do not split one question across files, and do not pad a record
  to two decisions to fill the skeleton.
- **Ground truth is the repository, then the records, then the rules**, in that order: the files
  themselves, then `docs/adr/` for what is already decided, then `.claude/rules/` for standing
  requirements. If the record would contradict a rule or an earlier record, say so explicitly before
  proposing it. Never silently reverse a declared default. `.claude/CLAUDE.md` routes to authority
  rather than being one, so it is not a fact source.
- **Verify, never assume.** Open the file before citing it. Read `package.json` and the lockfile
  before asserting a version, `astro.config.mjs` before asserting build behaviour, and
  `public/_headers` before quoting a cache or security header. Record the versions the decision was
  made against; the header carries the date that dates them.
- **Mark what you could not check.** For a vendor limit, quota, price, or platform behaviour you
  cannot reach a primary source for, write the figure as unverified rather than stating it as fact.
- **Name the evidence in the rationale.** The house style writes "verified in `src/lib/game/build.ts`"
  or "421 pages, reported by `pnpm build`", not "the build shows".
- **Reject alternatives with a reason and a reopen condition.** An alternative is never dismissed;
  it is rejected on a named cost, and the record says what would bring it back.
- **Admit the cost in `### Caveats`.** If a decision trades a higher priority concern for a lower
  one, the caveat section is where that is stated. Accessibility, correctness, and factual accuracy
  outrank performance and polish, so a trade against them is recorded, not buried.
- **Do not invent.** No fabricated benchmarks, quotations, conformance claims, or game canon. The
  rules under `.claude/rules/core/text-integrity.md` and `.claude/rules/content/` apply to a record
  exactly as they apply to a page.
- **Never type U+2013 or U+2014.** Use a colon in the title, "to" in a numeric range, and commas,
  parentheses, or separate sentences elsewhere. This is enforced by `pnpm data:check`.

## Process

1. List `docs/adr/` yourself with `Glob` or `ls -1 docs/adr/`. Do not conclude the folder is empty
   because an injected listing was absent or blocked.
2. If the topic is empty, ask for it before writing anything.
3. Gather context: the decision from the conversation, the files it touches, and neighbouring records
   for consistency and for the cross references in `Scope`.
4. Open every file the record will cite, and confirm the claim, before writing the record.
5. Write the file following `template.md`.
6. If points remain unsettled, set `**Status:** Proposed` and list them under `## Open questions`.
7. Do not add a hand-maintained index. `docs/adr/README.md` refuses one on purpose.
8. Report any contradiction with a rule or an earlier record.
9. Run `pnpm data:check`. Its banned dash guard scans `docs/`, so it is what proves the new record is
   clean.

## Amending and superseding

Keep the filename, number included. `docs/adr/README.md` is the single source of truth for the
policy; the short version is that a proposed record may be edited freely, an accepted decision is
never rewritten, an extension becomes a `**Revised:**` header line plus an `### Addendum` block, and
a reversal becomes a new record with the old one marked superseded.

Never delete a record.

## Safety boundaries

- Never invent a decision the user did not make, or a rationale they did not give.
- Never record a version, measurement, limit, or conformance status that was not verified.
- Never claim a check, test, or build passed unless it actually ran.
- Never rewrite an accepted decision in place, and never delete a record.
- Never renumber an existing record.
- Never treat a ticket, a chat message, or this file as a substitute for reading the code.
