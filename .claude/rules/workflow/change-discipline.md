# Change Discipline

- Inspect nearby implementation and tests before editing.
- Follow existing patterns when they are sound.
- Keep diffs scoped to the requested task.
- Do not reformat unrelated files.
- Do not rename unrelated symbols.
- Do not reorder content without a functional or editorial reason.
- Do not modify generated output by hand.
- Regenerate derived artifacts from their source.
- Update tests and schemas in the same change as behavior or content model changes.
- When changing a shared contract, update every caller before considering the task complete.
- Do not add temporary compatibility code when all callers can be migrated safely in one change.
