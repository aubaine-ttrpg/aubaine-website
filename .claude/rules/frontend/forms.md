---
paths:
  - "src/**/*.{astro,tsx}"
  - "src/pages/api/**/*"
  - "src/actions/**/*"
---

# Forms

- Prefer native HTML form semantics and progressive enhancement.
- Keep the form usable without client JavaScript when the feature allows it.
- Validate on the server or trusted runtime even when client validation exists.
- Preserve submitted values on recoverable validation errors.
- Put errors next to the relevant field and provide a useful error summary for complex forms.
- Do not disable submission without explaining why through the UI state.
- Prevent accidental duplicate submissions for state changing requests.
- Keep success states explicit and accessible.
- Do not collect data that the feature does not need.
