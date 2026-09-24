# Architecture Decision Records

The canonical record of significant technical decisions for the Aubaine wiki. Other documents link
here; they do not restate these decisions. Write a new one following [`template.md`](template.md),
through the `.claude/skills/aubaine-adr` skill.

## When to write one

A choice that is hard to reverse, or that a future contributor will reasonably question. For this
repository the recurring triggers are the data model under `data/`, the contract in
`src/lib/game/schema.ts`, the URL scheme, the amount of client JavaScript, the boundary between
build time and request time, and anything that changes what the site is allowed to look like.

The test is whether "why did you not just do Y?" is a fair question. If it is, the answer belongs
here rather than in a commit message.

A trivial or easily reversible choice does not need a record. The set is only useful while it stays
small.

## Browsing the records

There is deliberately no hand-maintained summary table here. Copying each record's decision into a
second place drifts the moment one changes, which is the same reason
`.claude/rules/meta/rule-maintenance.md` forbids enumerating a list that already has a source of
truth in the repository. The canonical list is this folder, and the canonical summary of each record
is its `# ADR:` heading and its `**Status:**` line.

- Browse them: `ls docs/adr/[0-9]*.md`
- Read every title and status at a glance: `grep -HE '^# ADR|^\*\*Status' docs/adr/[0-9]*.md`
- A rendered index should be generated from the files, never hand kept.

## Format

No YAML frontmatter. A record opens with `# ADR: <title>`, then the bold header block
(`Project`, `Status`, `Date`, `Deciders`, `Scope`), then `## Context`, then one or more
`## Decision N:` blocks each carrying `### Decision`, `### Rationale`,
`### Alternatives considered` and an optional `### Caveats`.

A record is scoped to a topic and may hold several numbered decisions. It is not one decision per
file.

Filenames are `NNNN-lowercase-kebab-slug.md`, four digits, zero padded, incremental from `0001`.
`README.md` and `template.md` carry no number. A number is never reused, and a record is never
written to a path that already exists.

## Amending and superseding

- **Proposed**: edit freely until the decision is accepted. A proposed record must carry an
  `## Open questions` section.
- **Accepted**: the decision is not rewritten. Two evolutions are sanctioned.
  - **Amendment**, when new information extends or corrects detail without reversing the decision:
    add a `**Revised:** YYYY-MM-DD, <what changes>` line to the header block, and an
    `### Addendum (YYYY-MM-DD): <title>` block inside the decision it affects.
  - **Supersede**, when the decision itself is reversed: write a new record with a new number, and
    set the old one to `**Status:** Superseded by NNNN-<slug>`.

Never delete a record. The audit trail is the point.

## Evidence

A record does not assert a version, a measurement, or a vendor limit that was not verified. Name the
file or the command the claim came from, the way the existing records name `astro.config.mjs`,
`src/lib/game/build.ts` or `public/_headers`. A figure that could not be checked is written as
unverified rather than stated as fact.
