# ADR: Design work runs through the aubaine-design skill, and DESIGN.md documents the look

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-31
**Deciders:** Kori
**Scope:** Where the instructions, the owner's rulings, the research and the measuring tools of design
work live, what `DESIGN.md` is for, and which screenshots the repository keeps. Extends to design the
pattern 0050 set for writing: a skill with subagents and owner checkpoints. Changes no page; 0063
records the hub layout this work produced.

---

## Context

The committed `DESIGN.md` (306 lines at `bee2bab`, `git show bee2bab:DESIGN.md | wc -l`) mixed three
things: a description of the look, working rules for whoever designs (its Do's and Don'ts), and a dated
log of the owner's decisions. The uncommitted rebuild that followed it reached 1,054 lines, beside
working notes that were never committed: a value-by-value spec of the approved pieces, three research
dossiers and twelve screenshots, seven of them of rejected designs. Every design round also rewrote its
own measuring scripts in a scratch folder. That day the owner asked for a skill: "most of
your work should go to a new aubaine-design skill, lots of things you did should acutally be in this
skill, with DESIGN.md and other things being docs", "do not put the screenshots of rejections", and
"highest quality skill, with references, many many many many links ect... only best practices".

---

## Decision 1: The skill holds the instructions, and `DESIGN.md` documents the look

### Decision

- `.claude/skills/aubaine-design/SKILL.md` routes the work, names the authorities, runs it in nine steps
  with two owner checkpoints, C0 before building and C1 at the live review, and lists its refusals.
- Its references hold what a designer reads on demand: `rulings.md`, every design ruling with its date
  and the owner's words; `approved-pieces.md`, the spec of the approved pieces and the door contract;
  `prototypes.md`, the gated page, the kept layouts and how a pick ships; `measuring.md`;
  `research.md` with the dossiers `persona-5.md`, `deadlock.md` and `hextech.md`; `web-platform.md`
  and `accessibility.md`.
- `DESIGN.md` keeps the description: the direction, the approved pieces, the principles with their
  sources, colours, type, layout, depth, shapes, components, motion, pictures, accessibility and
  references. Its working rules, do's and don'ts, captures table, research index and decision log moved
  to the skill.
- The uncommitted working notes are not added to `docs/`: their spec and dossiers became the skill's
  references.
- `.claude/rules/frontend/design.md` sends design work to the skill and names its sources instead of
  copying them.
- A correction the owner makes to a design is written into `rulings.md`, dated and quoted, in the same
  change.

### Rationale

- The owner asked for it, in the words quoted above.
- An agent loads a skill's body only when the task needs it and its references only when it reads them,
  which is the progressive disclosure the Agent Skills guidance describes
  (https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices). The rulings and the
  spec stop costing context on tasks that are not design work.
- Each fact has one home: a value in the code, its description in `DESIGN.md`, the owner's ruling about
  it in `rulings.md`.
- `.claude/rules/meta/rule-maintenance.md` already moves repeatable procedures into skills when they
  need not stay in context.

### Alternatives considered

- **Keep everything in `DESIGN.md`**: rejected by the owner on 2026-10-31. Reopens if the skill stops
  being loaded for design work.
- **Split the rulings into rule files under `.claude/rules/`**: rejected; a rule loads with every
  matching file and is meant to stay short, while the rulings run to hundreds of lines with quotations.
  Reopens for a ruling that must hold on every task, which then becomes a one-line rule.

### Caveats

- `DESIGN.md` and `approved-pieces.md` both state values, at two depths. The code decides when they
  disagree, and both are corrected in the change that moves a value.
- Some quotations in `rulings.md` come from earlier notes whose conversations are no longer on disk;
  they are kept as recorded at the time.

---

## Decision 2: Only screenshots of accepted pieces are kept, inside the skill

### Decision

- `.claude/skills/aubaine-design/assets/approved/` holds five captures of the approved pieces: the
  Marchand and Drow sheets, the Arbres select screen, the Codex plate menu and the Livres contents. They
  were taken on 2026-10-31 from the built site at 1512 × 860 with the living stage drawn, and saved
  1400 px wide, 64 to 149 KB each (`ls -l`).
- A rejected design is recorded in words in `rulings.md`. The twelve working captures were never
  committed and are not kept.
- Other studios' screens stay out of the repository and are linked from the dossiers.

### Rationale

- The owner on 2026-10-31: "rather just put screenshots if you want in the skill of accepted things no
  need to have 3412321 pictures each time i reject something".
- A capture of an accepted piece shows a designer what to match; a capture of a rejection showed what
  the words in `rulings.md` already say.

### Alternatives considered

- **Keep the rejection captures as evidence**: rejected by the owner. Reopens if a rejection cannot be
  told in words.

### Caveats

- A capture can drift from the code. `approved-pieces.md` dates each one, and a new capture replaces it
  when an approved piece changes at the owner's request.

---

## Decision 3: Two subagents, and two measuring tools in `tools/design/`

### Decision

- `.claude/agents/aubaine-design-researcher.md` (Read, Grep, Glob, WebFetch, WebSearch) finds and reads
  in-game screens and the makers' words; `.claude/agents/aubaine-design-critic.md` (Read, Grep, Glob)
  judges a direction or a prototype through one lens. Neither edits a file or runs a command: the main
  agent captures the pictures, runs the tools and writes. 0050 Decision 2 keeps commands with the main
  agent in the writing skills the same way, though their passes edit.
- `tools/design/audit.ts` (`pnpm design:audit`) measures how far inside its frame or the screen every
  piece sits, with corner probes that follow transforms, at the browser sizes that matter, in every
  pointed state; `tools/design/pixels.ts` (`pnpm design:pixels`) captures pages and counts the pixels
  that changed. Both run on `playwright-core`, and `pixels.ts` also on `sharp`, both already in
  `package.json`.
- The banned-dash guard of `tests/data/integrity.test.ts` also scans `.claude/agents`, `.claude/rules`
  and the house skills, the `aubaine-` folders of `.claude/skills`.

### Rationale

- Each design round had rewritten the same audits by hand; a tool makes them repeatable and the
  numbers comparable. Checked on 2026-10-31: over 140 states each, the audit measured the plate menu,
  the slanted doors (every piece at least 12.9 px inside its skewed panel) and the Sommaire spread, and
  flagged a mistyped selector; the pixel tool reproduced earlier captures exactly, 9 of 9.
- The tools live under `tools/`, where `tsc` type-checks them: a TypeScript file under `.claude/` is
  outside the program, verified with `tsc --listFilesOnly` on 2026-10-31.
- The vendored skills under `.claude/skills/` (`playwright-cli`, `design-taste-frontend`) contain
  dashes and are not edited, so the guard scans only the authored folders.

### Alternatives considered

- **Scripts inside the skill folder**: rejected; they would escape `tsc` and Biome's tool settings.
  Reopens if skills become portable outside this repository.
- **End-to-end tests alone**: rejected; tests guard what ships, while a prototype needs its numbers
  before the owner picks. A shipped layout turns its audit into a test.

### Caveats

- The audit sets a static piece to `position: relative` for the instant it reads its corners, which can
  change how an absolutely positioned child inside it lays out; it reads images, canvases, form fields
  and SVG elements by their box.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| `aubaine-design` | the design workflow, rulings, spec, research and methods | `.claude/skills/aubaine-design/` |
| `DESIGN.md` | the look, documented | repository root |
| Accepted captures | what the approved pieces look like | `.claude/skills/aubaine-design/assets/approved/` |
| Subagents | research and critique, read only | `.claude/agents/aubaine-design-researcher.md`, `.claude/agents/aubaine-design-critic.md` |
| Tools | crop and geometry audit, pixel identity | `tools/design/audit.ts`, `tools/design/pixels.ts` |
