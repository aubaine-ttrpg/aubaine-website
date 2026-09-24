---
paths:
  - "src/**/*.{css,scss,astro,tsx}"
---

# Styling

- Maintain a compact token layer for color, spacing, typography, radius, elevation, and motion timing.
- Use logical properties where they improve international layout support.
- Keep focus styles visible.
- Do not encode meaning through color alone.
- Support narrow mobile layouts without horizontal scrolling.
- Avoid fixed heights for text containers.
- Allow translated text to expand without clipping.
- Avoid fragile selectors that depend on deep DOM structure.
- Keep global styles limited to reset, tokens, typography defaults, document shell, and deliberate utilities.
- Keep component specific styles close to the component.
- Avoid `!important` unless overriding an external style that cannot be controlled another way.
- Prefer responsive CSS over JavaScript viewport checks.
- Respect browser zoom and user font scaling.
