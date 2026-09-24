# Repository Hygiene

- Do not commit build output unless deployment architecture explicitly requires tracked artifacts.
- Do not commit local environment files, secrets, editor state, caches, temporary exports, or debug captures.
- Keep example environment files free of real secret values.
- Keep generated artifacts clearly separated from authored source.
- Remove obsolete files in the same change that makes them unnecessary.
- Avoid duplicate configuration for the same tool.
- Keep file names descriptive and consistent with nearby domain language.
