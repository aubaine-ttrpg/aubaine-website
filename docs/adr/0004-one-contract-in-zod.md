# ADR: One contract in Zod, JSON Schema generated, one corpus builder

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-20
**Deciders:** Kori
**Scope:** What validates the data, where the published contract comes from, and how the same data
layer is reachable from Astro, from tests, and from tools. Does not cover the file layout itself
(0002) or translation merging (0003).

---

## Context

The data under `data/` has two audiences with different needs. Astro needs a runtime validator that
content collections can use. A person, and later the Editor, needs a published contract they can
read and validate against without running Astro.

The obvious answer is both: JSON Schema for the contract, Zod for the collections. That is two
descriptions of one truth, and `.claude/rules/quality/dependencies.md` says not to add a second
library for schema validation when one is established. The corpus also has to be readable outside
Astro, because the content layer store is not reachable from Vitest, which is where the integrity
checks needed to run.

---

## Decision 1: `src/lib/codex/schema.ts` is the only validator

### Decision

- Every shape is declared once, in Zod, in `src/lib/codex/schema.ts`, 503 lines.
- Astro content collections in `src/content.config.ts` use those schemas directly.
- No second validation library is installed. `ajv` and `ajv-formats` were added early and removed
  when this was settled.
- Field documentation lives in the schema as `.describe()`, in French, so the contract and its
  explanation cannot drift apart.

### Rationale

- Zod ships with Astro. Using it costs nothing and removes a dependency rather than adding one.
- `.describe()` keeps the meaning of a field next to its type. The runbooks quote those strings
  rather than restating them, which is the only way a field's explanation stays correct when its
  type changes.
- The refinements express real game rules that a shape alone cannot, such as a passive skill not
  carrying an energy cost above zero.

### Alternatives considered

- **Hand written JSON Schema as the contract, Zod for the collections**: rejected. Two descriptions
  of one truth, kept in sync by discipline. This was the original plan and was abandoned when the
  duplication became concrete.
- **JSON Schema as the source, Zod generated from it**: rejected. It puts the less expressive
  language in charge, and the conditional rules would have to move somewhere else anyway.

---

## Decision 2: `schemas/` is generated, never hand edited

### Decision

- `pnpm schemas` runs `tools/schemas/emit.ts`, which calls `z.toJSONSchema` and writes nine files to
  `schemas/`.
- The generated files are committed, because they are the artefact an external consumer reads.
- `tools/schemas/emit.ts --check` regenerates into memory and fails if a committed file differs.

### Rationale

- The Editor, and anyone validating a file by hand, needs draft 2020-12 JSON Schema. Generating it
  means it cannot disagree with what the site actually enforces.
- The French `.describe()` text survives the conversion into `description`, so the published
  contract carries the same explanation the runbooks quote.
- Committing the output keeps it available without a build step, and the check mode is what stops it
  going stale.

### Caveats

- `schemas/` is generated output living beside authored source, which
  `.claude/rules/quality/repository-hygiene.md` asks to keep clearly separated. The separation here
  is by directory and by the header this record provides; the alternative, gitignoring it, would
  defeat the reason it exists.

---

## Decision 3: Shape in the schema, references in the tests

### Decision

- The schema validates the shape of one file in isolation: types, ranges, patterns, required fields,
  and the rules that depend only on that file.
- It deliberately does not enumerate the members of the controlled vocabularies. `domains` and
  `characteristics` are typed as `string`, not as an enum.
- Cross-file correctness lives in `tests/data/integrity.test.ts`, 19 checks covering vocabulary
  membership, placement and link resolution, `evolvesFrom`, `grants`, set references, the state and
  skill names used in rule text markup, media existence, uniqueness, and the authoring invariants.

### Rationale

- The vocabularies have a source of truth in the repository, `data/meta/`. Copying their members
  into the schema would be the copied list that
  `.claude/rules/meta/rule-maintenance.md` calls a defect with a delay on it: adding a domain would
  mean editing code.
- A reference check needs the whole corpus loaded, which a per-file schema cannot see by
  construction.

---

## Decision 4: One corpus builder, two loaders

### Decision

- `buildCorpus(sources, locale)` in `src/lib/codex/build.ts` is a pure function over plain arrays.
  It resolves overlays, placements, grants, provenance, and the tooltip term index.
- `src/lib/codex/corpus.ts` feeds it from `astro:content` and caches per locale.
- `src/lib/codex/fs-sources.ts` feeds it from disk with `node:fs`, validating through the same Zod
  schemas.
- `tests/data/integrity.test.ts` uses the filesystem loader, so the checks run without the Astro
  runtime.

### Rationale

- The content layer store was not reachable from Vitest, so the choice was between mocking the data
  layer and making it injectable. Mocking would have tested a fake, which
  `.claude/rules/quality/testing.md` forbids.
- Splitting the loader from the builder means the tests exercise the real resolution logic, the same
  code the site renders with, rather than a parallel implementation.
- It also gives the Editor a way in. Reading the resolved corpus from a script needs
  `readCorpus(root, locale)` and nothing else.

### Caveats

- Two loaders means two ways to enumerate the same files, and they can disagree about which files
  exist. They are kept aligned by both filtering translated files with the same pattern, and by the
  integrity tests asserting the same entity counts the site builds with.
- `fs-sources.ts` uses Node APIs and must never be imported from a page or an island.
  `.claude/rules/architecture/runtime-boundaries.md` covers this; the file location is the signal.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Zod schemas | The only validator, with French field docs | `src/lib/codex/schema.ts` |
| Published contract | Generated, committed, drift checked | `schemas/`, `tools/schemas/emit.ts` |
| Collections | Validate at build through the same schemas | `src/content.config.ts` |
| Reference checks | Whole corpus, outside the schema | `tests/data/integrity.test.ts` |
| Builder | Pure, source injectable | `src/lib/codex/build.ts` |
| Loaders | Astro content layer, and the filesystem | `corpus.ts`, `fs-sources.ts` |
