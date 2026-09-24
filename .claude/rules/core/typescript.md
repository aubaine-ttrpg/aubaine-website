---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "tsconfig*.json"
  - "astro.config.ts"
  - "vite.config.ts"
---

# TypeScript

- Use TypeScript for all new project logic and React components.
- For a new Astro project, extend `astro/tsconfigs/strictest` unless a verified incompatibility requires otherwise.
- Keep strictness enabled when adding or changing configuration.
- Do not use `any` when `unknown`, a generic, a union, or a concrete type can represent the value.
- Narrow untrusted values before use.
- Avoid non null assertions.
- Avoid type assertions that merely silence the compiler.
- Prefer `satisfies` when validating an inferred object shape without widening it.
- Prefer discriminated unions for variant domain data.
- Prefer string unions or const objects over TypeScript enums for serializable domain values.
- Make exported contracts explicit when inference would hide an important public boundary.
- Keep internal implementation types inferred when that is clearer.
- Use type only imports when the import is used only as a type.
- Keep runtime validation for external data even when TypeScript types exist.
- Exhaustively handle finite variants.
- Do not suppress compiler errors.
- Do not add ambient global declarations when a typed module or platform type can model the dependency.
- Keep browser only and server only types from leaking across runtime boundaries.
