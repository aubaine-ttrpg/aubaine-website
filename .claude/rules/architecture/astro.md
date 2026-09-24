---
paths:
  - "src/**/*.astro"
  - "astro.config.*"
  - "src/pages/**/*"
  - "src/layouts/**/*"
---

# Astro

- Prefer Astro components for static and server rendered UI.
- Keep page files thin. Compose layouts, view components, content queries, and domain helpers.
- Keep layouts responsible for document structure, metadata, navigation shell, and shared semantics.
- Avoid client directives unless browser interactivity requires hydration.
- Choose the least eager client directive that satisfies the interaction.
- Never hydrate a component solely for styling or static content rendering.
- Use `astro:assets` for local image optimization.
- Keep route data loading deterministic when pre-rendering.
- Fail builds for invalid required content instead of silently omitting it.
- Keep canonical URL construction centralized.
- Keep locale parsing and route generation centralized.
- Avoid browser globals in Astro frontmatter.
- Avoid Node specific APIs in code that may execute in Cloudflare runtime paths.
- Prefer explicit props contracts over broad object spreading between layout layers.
