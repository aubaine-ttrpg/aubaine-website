---
paths:
  - "src/pages/**/*"
  - "src/layouts/**/*"
  - "src/components/**/*seo*"
  - "src/components/**/*schema*"
  - "src/lib/**/*schema*"
---

# Structured Data

- Generate JSON LD from the same validated data used to render the page.
- Never invent structured data values that are absent from visible content or trusted source data.
- Keep one shared graph builder instead of scattered JSON snippets.
- Use the narrowest accurate Schema.org types.
- Give graph entities stable absolute `@id` values when cross references are useful.
- Keep canonical page URL and structured data URLs aligned.
- Localize names and descriptions with the page locale.
- Do not mark hidden or unavailable content as visible structured data.
- Do not add FAQ markup solely for search appearance.
- Add question and answer schema only when it accurately represents visible user facing content and has a product purpose beyond chasing a rich result.
- Validate JSON LD serialization.
- Escape authored strings safely.
- Keep structured data correct after Swup head replacement.
