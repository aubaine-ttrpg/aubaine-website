---
paths:
  - "src/**/*.{ts,tsx,astro}"
  - "tests/**/*"
  - "e2e/**/*"
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
