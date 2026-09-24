---
name: aubaine-commit
author: Kori
version: 1.0.0
last_updated: 2026-07-10
license: MIT
description: Create, split, validate, and review Git commits using the repository's CONTRIBUTING.md as the sole source of truth. Use for branch naming, staging, atomic commit planning, Gitmoji commit messages, commit execution, history cleanup, or commit-policy review.
---

# Aubaine Commit

## Authority

The repository's `CONTRIBUTING.md` is the sole source of truth for all
branch and commit policy enforced by this skill.

Before doing any work:

1. Read `CONTRIBUTING.md` completely.
2. Apply its current requirements exactly.
3. Do not duplicate, replace, weaken, or infer policy from this file.
4. Re-read the relevant sections before creating or approving a commit.
5. Never modify `CONTRIBUTING.md` unless the user explicitly requests a policy
   change.
6. When repository-local instructions conflict with this packaged policy, stop
   and report the conflict unless a higher-priority instruction clearly resolves
   it.

## Operating procedure

For every branch or commit request:

1. Inspect the repository state, current branch, upstream relationship, status,
   staged diff, unstaged diff, and relevant recent history.
2. Read repository-local contributor instructions and required validation
   commands when available.
3. Classify the changed paths by logical responsibility and identify unrelated,
   accidental, generated, sensitive, or unsafe changes.
4. Propose or perform the smallest coherent commit partition that satisfies
   `CONTRIBUTING.md`.
5. Stage files or hunks deliberately. Never use broad staging as a substitute for
   reviewing the diff.
6. Run the applicable validation required by the repository and policy.
7. Build the commit message from the actual staged diff, using the required
   Gitmoji format and branch conventions.
8. Review the final staged patch immediately before committing.
9. Create the commit only when explicitly requested or when commit creation is
   unambiguously part of the task.
10. Verify the resulting commit and working-tree state after creation.

## Safety boundaries

- Never commit secrets, credentials, private keys, tokens, personal data, or
  environment-specific configuration.
- Never bypass hooks, checks, signatures, or branch protection without explicit
  authorization and a documented reason.
- Never amend, rebase, reset, squash, force-push, or rewrite shared history unless
  the user explicitly requests that exact operation and the consequences are
  understood.
- Never stage or commit unrelated changes merely to obtain a clean tree.
- Never claim that tests, hooks, checks, or reviews passed unless they actually
  ran successfully.
- Never invent issue identifiers, scopes, breaking changes, co-authors, sign-offs,
  or validation results.
- Never discard user work.

## Output discipline

When not asked to execute Git commands, return one ready-to-use recommendation:

- a compliant branch name;
- an atomic commit plan;
- an exact commit message;
- the exact command sequence needed; or
- a precise compliance review.

State blockers and residual risks plainly. Prefer correctness and traceability
over speed or cosmetic history.
