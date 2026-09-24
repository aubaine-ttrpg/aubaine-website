---
paths:
  - "src/**/*.{ts,tsx,astro}"
---

# Error Handling

- Fail fast on violated internal invariants during development and build.
- Return useful user facing states for expected recoverable failures.
- Do not catch an error only to ignore it.
- Preserve meaningful causal information when translating errors across boundaries.
- Keep internal error detail out of public production responses.
- Distinguish validation failures, missing resources, authorization failures, dependency failures, and unexpected defects.
- Do not use exceptions for ordinary control flow when a typed result expresses the state more clearly.
