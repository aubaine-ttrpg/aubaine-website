---
paths:
  - "src/**/*.{ts,tsx,astro}"
  - "tests/**/*"
  - "data/**/*"
  - "**/*.{test,spec}.{ts,tsx}"
  - "playwright.config.*"
  - "vitest.config.*"
---

# Testing

- Prefer behavior focused tests over implementation focused tests.
- Use Vitest for pure logic, schemas, utilities, and isolated component behavior.
- Use Playwright for routing, locale behavior, Swup navigation, metadata persistence, accessibility critical flows, and integrated browser interactions.
- Test both normal document navigation and enhanced Swup navigation for critical routes.
- Test back and forward navigation when client navigation affects state.
- Test keyboard operation for custom interactions.
- Test reduced motion behavior for animated interactions.
- Test 404 and redirect behavior for routing changes.
- Test canonical and alternate locale metadata for SEO critical templates.
- Keep fixtures minimal and representative.
- Avoid broad HTML snapshots when focused assertions communicate the contract better.
- Do not mock the unit under test.
- Make tests deterministic and independent of execution order.
- Add a regression test for a bug fix when the behavior is reasonably testable.

## Behaviour, never inventory

- A test asserts what code decides. It never writes a literal that mirrors `data/`: a count of entries, a roster or order of ids, or an entry's authored text, number or status.
- Take an expected value from the page under test, from the source of truth (`readCorpus` in `src/lib/game/fs-sources.ts`, a data file, an exported constant), or from an input the test builds itself. In Playwright, `tests/e2e/support/corpus.ts` reads the corpus and `tests/e2e/support/results.ts` writes a results label.
- A real entry may be the page or record a test visits. When the test needs a property, such as a draft, a sub-species or a set of two pieces, pick the entry by that property from the data.
- Check a rule over content as a loop over every entry, never as a snapshot of the entries that exist today.
- A test that fails because content grew, shrank, was renamed or was reordered, with no rule broken, pins the inventory. Fix the test, never the content.
