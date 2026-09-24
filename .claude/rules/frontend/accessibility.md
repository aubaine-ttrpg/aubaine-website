---
paths:
  - "src/**/*.{astro,tsx,html}"
---

# Accessibility

- Target WCAG 2.2 AA behavior for public UI.
- Use semantic elements before ARIA.
- Every page has one clear `main` landmark and one descriptive `h1`.
- Maintain logical heading order.
- Use native buttons, links, inputs, selects, and dialogs whenever possible.
- Every control has an accessible name.
- Every form field has a programmatic label.
- Associate validation errors with the relevant field and announce them when appropriate.
- Keyboard users must be able to reach, operate, and leave every interaction.
- Focus order follows visual and reading order.
- Do not remove visible focus indication.
- Modal interactions restore focus to a meaningful origin when closed.
- Informative images need useful alternative text. Decorative images use empty alternative text.
- Icon only controls need accessible names.
- Do not autoplay motion, audio, or video that the user cannot stop.
- Respect reduced motion.
- Swup navigation must announce the new page and leave focus in a useful location.
- Test meaningful flows by keyboard in addition to automated audits.
