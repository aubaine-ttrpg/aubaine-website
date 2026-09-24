---
paths:
  - "data/**/*.json"
  - "data/**/*.md"
  - "src/lib/game/schema.ts"
  - "docs/**/*.md"
---

# Authority

- Aubaine is an original game. The repository is the only authority for its mechanics, terminology, canon, taxonomy, progression, units, and balance.
- Resolve any content question in this order: `src/lib/game/schema.ts`, `docs/data-contract.md`, `docs/runbooks/`, existing sibling entries under `data/`, `data/meta/*.json`.
- Everything under `data/` is original Aubaine text. No schema carries a provenance or attribution field, and every schema is strict, so an entry that would need a source credit cannot be expressed and does not belong there.
- Where Aubaine vocabulary resembles that of another game, the Aubaine usage is canonical and must not be corrected toward the other game.
- Do not infer a missing mechanic, field, term, or value from another game, from a similar entry, or from prose.
- Never invent a quotation, a citation, a date, or a credit.
- Do not present interpretation as canon. A reading that the repository does not state is a question, not a rule.
- When a required decision is missing, surface the gap instead of inventing a plausible value.
- When the repository contradicts itself, record the contradiction as `docs/data-contract.md` already does for the difficulty class formula. Do not resolve it silently.
