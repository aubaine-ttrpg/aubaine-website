---
paths:
  - "src/**/*.tsx"
---

# React Islands

- Use React only for behavior that needs client state, effects, gestures, complex animation, or browser lifecycle.
- Keep islands small and leaf oriented.
- Pass serializable data from Astro into islands.
- Do not duplicate page data fetching inside hydrated components when Astro already has the data.
- Do not make React the global application shell unless architecture is intentionally changed.
- Keep state local unless multiple interactive islands demonstrably require shared client state.
- Avoid document wide context providers for isolated interactions.
- Derive state instead of synchronizing duplicated state through effects.
- Use effects only for external synchronization.
- Clean up every event listener, observer, timer, subscription, and imperative instance created by an effect.
- Preserve semantic HTML inside interactive components.
- Keep keyboard behavior equivalent to pointer behavior.
- Keep initial rendering deterministic to avoid hydration mismatch.
