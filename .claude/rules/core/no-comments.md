---
paths:
  - "src/**/*"
  - "astro.config.*"
  - "vite.config.*"
  - "tsconfig*.json"
  - "wrangler.*"
  - "*.config.*"
---

# No Source Comments

- Do not add line comments, block comments, documentation comments, JSX comments, HTML comments, CSS comments, TODO comments, FIXME comments, or commented out code.
- Do not use TSDoc or JSDoc as a substitute for clear types and naming.
- Do not use suppression comments for TypeScript, ESLint, formatters, bundlers, coverage, or test runners.
- Fix the underlying contract or configure the tool centrally instead.
- Do not manually edit generated or vendored files.
- If a third party tool requires an authored source directive comment with no configuration alternative, do not introduce it silently. Surface the incompatibility before changing the rule.
