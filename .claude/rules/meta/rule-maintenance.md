# Rule Maintenance

- Keep one topic per rule file.
- Keep global rules rare and concise.
- Add `paths` frontmatter whenever a rule only matters for part of the repository.
- Prefer specific, testable instructions over broad preferences.
- Remove duplicate or contradictory instructions instead of adding precedence explanations.
- Never enumerate the members of a list that has a source of truth in the repository. Name the source, give one member as an example, and say to read it.
- A copied list is a defect with a delay on it. The source grows, the copy does not, and an agent that trusts the copy treats the missing members as if they did not exist.
- Update a rule when project architecture changes permanently.
- Do not turn one off task instructions into permanent repository rules.
- Move repeatable procedures into project skills when they do not need to remain in context during normal work.
- Keep the root `CLAUDE.md` focused on invariants that apply in nearly every task.
