---
paths:
  - "src/content.config.ts"
  - "src/lib/game/**/*.ts"
  - "schemas/**/*.schema.json"
  - "tools/schemas/emit.ts"
---

# Schema Contract

- `src/lib/game/schema.ts` is the contract. It is the single definition of every content type, it types the site, and it validates `data/` at build time.
- Every field carries a French `.describe()` that states what it means. The runbooks quote it. Keep it accurate when a field changes.
- Every entity schema is strict. An unknown key is rejected, and because sources are parsed with `safeParse` the entry is dropped rather than failing loudly.
- Adding, removing, or renaming a field is a product decision. It changes the runbook, the emitted JSON Schema, and every existing file of that kind.
- `schemas/*.schema.json` is generated from the Zod definitions by `pnpm schemas`. Never edit it by hand. When the two disagree, `schema.ts` wins and the emission is stale.
- `src/content.config.ts` declares the Astro collections over `./data/` with glob loaders. It separates canonical files from translation overlays by filename, and that idiom is the one to reuse anywhere the distinction is needed.
- Shape validation happens at load. Reference resolution does not: placements, `grants`, `evolvesFrom`, item sets, and the names inside `[[...]]` and `{{...}}` are enforced by `tests/data/integrity.test.ts`.
- A new invariant that cannot be expressed in the schema belongs in that test, not in a comment and not in prose.
- Keep derived values out of the schema. A tree's domains and primary characteristics are computed, so no field exists for them.
- Prefer modelling an invalid state out of existence over validating it later.
