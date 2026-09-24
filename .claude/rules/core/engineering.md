# Engineering

- Optimize for correctness, clarity, maintainability, accessibility, and low runtime cost.
- Prefer platform and framework primitives before custom infrastructure.
- Keep modules focused on one responsibility.
- Keep public interfaces smaller than implementations.
- Make invalid states difficult to represent with types and schemas.
- Keep side effects at system boundaries.
- Prefer pure transformations where practical.
- Return early instead of nesting deeply.
- Prefer explicit data flow over hidden shared state.
- Do not silently catch errors.
- Do not add fallback behavior that hides broken invariants.
- Remove obsolete paths when replacing an implementation.
- Avoid compatibility layers unless a public contract requires them.
- Avoid generic utility dumping grounds. Name modules after the domain responsibility they own.
