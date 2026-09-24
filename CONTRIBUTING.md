# Contributing to Aubaine.io

This document is the authoritative source of truth for branch naming, change
partitioning, staging, commit construction, commit messages, validation, and
history safety in this project. Humans, automation, and AI agents MUST follow it.

The keywords **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, **SHOULD NOT**, and
**MAY** are normative.

## 1. Governing principles

Every commit MUST:

- have one clear responsibility;
- represent one coherent logical change;
- be independently understandable and reviewable;
- leave the repository in a coherent state;
- preserve buildability and testability where the repository supports them;
- contain only intentional changes required for its stated purpose;
- be reversible without silently reverting unrelated work;
- communicate intent accurately through its message.

A commit is atomic when all included changes are necessary for one purpose and
no included change can be removed without making that purpose incomplete.
Small file count alone does not make a commit atomic, and one file MAY require
multiple commits when it contains separable changes.

Never commit secrets, credentials, tokens, private keys, personal data,
proprietary data, production data, or environment-specific configuration.

## 2. Before changing or committing

Before creating a branch or commit, contributors MUST:

1. read repository-local instructions and identify required checks;
2. inspect the current branch and its upstream;
3. inspect the working tree, staged changes, unstaged changes, and untracked
   files;
4. understand the intended behavior and acceptance criteria;
5. distinguish authored changes from pre-existing or unrelated user changes;
6. search the diff for sensitive information and accidental artifacts;
7. determine whether the work should be split into multiple commits.

Contributors MUST NOT discard, overwrite, stage, or commit unrelated user work.

### 2.1 Cloning

The working tree holds one generation of booklet PDFs and one zip per superseded generation, as
`docs/adr/0013-every-printing-is-kept-but-only-one-stays-loose.md` decided. The tree therefore stays
roughly flat while history accrues a zip per version per locale.

Contributors SHOULD clone shallow:

```
git clone --depth 1 <url>
```

A contributor who needs earlier history MUST deepen deliberately, with `git fetch --deepen` or
`git fetch --unshallow`, rather than cloning the full history by default.

## 3. Branch conventions

Branch names follow [Conventional Branch 1.1.0](https://conventionalbranch.org/).

### 3.1 Required structure

Use:

```text
<type>/<description>
```

Long-lived trunk branches are limited to `main` and do
not use a prefix.

### 3.2 Allowed purpose prefixes

Use exactly one of:

- `feature/` or `feat/` — introduce a capability;
- `bugfix/` or `fix/` — correct a defect;
- `hotfix/` — correct an urgent production or security defect;
- `release/` — prepare a release;
- `chore/` — maintenance, documentation, tests, CI, refactoring, dependencies,
  tooling, or other non-feature work.

AI-authored branches MAY instead use a registered Conventional Branch source
prefix: `ai/`, `claude/`, `codex/`, `copilot/`, or `cursor/`. The description
MUST still state the work clearly.

Custom prefixes MUST NOT be introduced without changing this document.

### 3.3 Description requirements

The description MUST:

- use lowercase ASCII letters, digits, and hyphens;
- use dots only in version-like values such as `v2.1.0`;
- be concise, specific, and purpose-driven;
- include an issue identifier when one exists;
- contain no spaces, underscores, uppercase letters, or other punctuation;
- contain no leading, trailing, or consecutive hyphens or dots.

Prefer a verb-object description that names the outcome.

Valid examples:

```text
feature/issue-123-add-passkey-login
fix/issue-481-handle-empty-response
hotfix/rotate-compromised-key
release/v2.4.0
chore/update-api-documentation
codex/issue-923-add-cache-tests
```

Invalid examples:

```text
Feature/Add-Login
feature/new--login
feature/-new-login
feature/new-login-
fix/header_bug
misc/some-task
```

### 3.4 Branch safety

Contributors MUST branch from the repository's designated current base branch.
They SHOULD update the base before beginning work when doing so will not destroy
or rewrite local changes.

Contributors MUST NOT commit directly to a protected or shared trunk branch
unless the repository explicitly permits it and the user requested it.

## 4. Commit partitioning and single responsibility

Changes MUST be split when they have independently reviewable purposes. Typical
separate responsibilities include:

- behavior changes;
- bug fixes;
- refactoring without behavior change;
- formatting-only changes;
- tests;
- documentation;
- dependency changes;
- generated artifacts;
- configuration or CI changes;
- file moves or renames;
- cleanup unrelated to the primary task.

A test that directly proves a behavior change or regression fix SHOULD normally
be committed with that change. Test infrastructure, broad test cleanup, or
unrelated coverage improvements SHOULD be separate.

A required documentation or generated-file update MAY be included with the
change that makes it necessary when separating it would leave either commit
incomplete or misleading.

Do not create artificial micro-commits that cannot stand alone, such as a commit
that adds a call before the implementation it requires. Atomicity takes priority
over minimizing diff size.

Dependency additions, removals, and upgrades SHOULD be isolated unless they are
inseparable from the feature or fix that requires them. Lockfiles MUST accompany
the manifest change that produced them.

## 5. Staging discipline

Before staging, contributors MUST review both tracked and untracked changes.

Files and hunks MUST be staged deliberately according to the planned commit.
Interactive or path-specific staging SHOULD be used when a file contains changes
for more than one responsibility.

Contributors MUST review the complete staged diff immediately before committing.

Broad staging commands such as `git add .` or `git add -A` MUST NOT be used
without first proving that every affected path belongs in the same commit.

The staged set MUST NOT contain:

- unrelated edits;
- temporary debugging code;
- commented-out experiments;
- editor, cache, log, coverage, or build artifacts not intentionally tracked;
- unexplained binary changes;
- generated files not produced by the documented generator;
- changes consisting only of accidental line-ending or formatting churn;
- sensitive information.

Partial staging MUST NOT produce a commit that is syntactically invalid,
unbuildable, internally inconsistent, or misleading.

## 6. Commit message format

Commit messages follow the official [Gitmoji specification](https://gitmoji.dev/specification)
and this project's stricter rules.

### 6.1 Subject structure

Use:

```text
<intention> [(scope)]: <message>
```

Requirements:

- `<intention>` MUST be exactly one official Gitmoji in Unicode or official
  `:shortcode:` form.
- `(scope)` SHOULD be present when it provides stable, useful context.
- A colon MUST follow the Gitmoji or closing scope.
- `<message>` MUST be an imperative, present-tense summary of the staged change.

Examples:

```text
✨ (auth): add passkey sign-in
🐛 (api): handle empty upstream responses
📝: document local development setup
♻️ (billing): extract invoice validation
✅ (parser): cover malformed input
⬆️: upgrade supported dependencies
```

Equivalent shortcode examples:

```text
:sparkles: (auth): add passkey sign-in
:bug: (api): handle empty upstream responses
:memo:: document local development setup
```

### 6.2 Subject quality

The subject MUST:

- describe the effect of the staged diff;
- use one Gitmoji representing the primary intention;
- begin the message with a lowercase imperative verb unless a proper noun or
  identifier requires otherwise;
- be specific and concise;
- omit a trailing period;
- avoid implementation diary language such as `I changed` or `worked on`;
- avoid vague summaries such as `update`, `changes`, `fix stuff`, `cleanup`,
  `work`, or `misc` without concrete context.

The subject SHOULD be at most 72 characters and MUST NOT exceed 100 characters,
counting the Gitmoji, scope, punctuation, and spaces.

### 6.3 Scope

A scope MUST be lowercase, concise, and stable. Prefer the affected component,
package, subsystem, or domain. Do not use a file name as scope unless that file
is itself a stable public unit.

Omit the scope when the change is repository-wide or when no scope improves
understanding. Do not invent a scope merely to fill the optional field.

### 6.4 Gitmoji selection

Use the current official Gitmoji list. Common intentions include:

- `✨` `:sparkles:` — introduce a feature;
- `🐛` `:bug:` — fix a bug;
- `🚑️` `:ambulance:` — critical hotfix;
- `🩹` `:adhesive_bandage:` — simple non-critical fix;
- `📝` `:memo:` — add or update documentation;
- `✅` `:white_check_mark:` — add, update, or pass tests;
- `🧪` `:test_tube:` — add a failing test;
- `♻️` `:recycle:` — refactor code;
- `🎨` `:art:` — improve code structure or formatting;
- `⚡️` `:zap:` — improve performance;
- `🔒️` `:lock:` — fix security or privacy issues;
- `⬆️` `:arrow_up:` — upgrade dependencies;
- `⬇️` `:arrow_down:` — downgrade dependencies;
- `📌` `:pushpin:` — pin dependencies;
- `➕` `:heavy_plus_sign:` — add a dependency;
- `➖` `:heavy_minus_sign:` — remove a dependency;
- `👷` `:construction_worker:` — add or update CI;
- `💚` `:green_heart:` — fix CI;
- `🔧` `:wrench:` — add or update configuration;
- `🔨` `:hammer:` — add or update development scripts;
- `🔥` `:fire:` — remove code or files;
- `🚚` `:truck:` — move or rename resources;
- `💥` `:boom:` — introduce a breaking change;
- `⏪️` `:rewind:` — revert changes;
- `🔖` `:bookmark:` — create a release or version tag.

When multiple Gitmoji intentions appear equally applicable, contributors MUST
identify the primary responsibility or split the changes. Multiple Gitmoji MUST
NOT be placed in one subject.

### 6.5 Body

A body SHOULD be included when the reason, constraints, trade-offs, operational
impact, or non-obvious behavior cannot be understood from the subject and diff.

When present, the body MUST:

- be separated from the subject by one blank line;
- explain why the change is needed and relevant consequences;
- describe behavior and decisions rather than narrating the editing process;
- wrap prose at approximately 72 characters where practical;
- contain only claims supported by the actual change and performed validation.

### 6.6 Footers

Issue references, sign-offs, co-authorship, and other trailers MUST use the
hosting platform's or repository's expected syntax and MUST be truthful.

A breaking change MUST include a `BREAKING CHANGE:` footer that states the
incompatibility and migration path. The `💥` Gitmoji alone is not sufficient.

Do not add `Co-authored-by`, `Signed-off-by`, issue references, or review trailers
without verified values and a legitimate reason.

## 7. Validation before commit

Before committing, contributors MUST run every applicable repository-provided
check needed to establish that the staged change is coherent. Depending on the
repository, this MAY include:

- formatting;
- linting;
- type checking;
- unit, integration, regression, or end-to-end tests;
- static or security analysis;
- builds;
- generated-file verification;
- documentation validation.

Validation SHOULD be proportional to the risk and surface area of the change.
Targeted checks MAY precede broader checks, but required checks MUST NOT be
silently omitted.

Contributors MUST NOT weaken, delete, skip, silence, or bypass a failing test,
hook, or quality gate merely to make a commit succeed.

Unavailable, skipped, or failing checks MUST be disclosed accurately. A commit
message MUST NOT claim that tests pass unless those tests actually ran and
passed.

## 8. Commit execution

Immediately before creating a commit, contributors MUST verify:

1. the current branch is correct;
2. the staged diff exactly matches one responsibility;
3. no sensitive or accidental content is staged;
4. required generated files and lockfiles are consistent;
5. applicable validation has completed or any limitation is known;
6. the message describes the staged diff and follows this document.

Commits MUST NOT be created with `--no-verify` or equivalent bypasses unless the
user explicitly authorizes the bypass and the reason is recorded.

Empty commits MUST NOT be created unless explicitly required for a documented
workflow and requested by the user.

Commit signing and sign-off requirements MUST follow repository policy. They
MUST NOT be invented or disabled for convenience.

## 9. Post-commit verification

After committing, contributors MUST inspect the resulting commit and working
 tree to verify that:

- the commit contains the intended paths and patch;
- the subject and body are correct;
- unrelated work remains untouched;
- no intended change was accidentally omitted;
- the repository state is understood.

A clean working tree MUST NOT be treated as proof that the commit was correct.
A non-clean tree MAY be valid when it contains intentionally uncommitted work.

## 10. History safety

Published or shared history MUST be treated as immutable by default.

Contributors MUST NOT amend, rebase, reset, squash, cherry-pick, force-push, or
otherwise rewrite history unless the user explicitly requests the operation and
its scope is understood.

When rewriting unpublished local commits is explicitly requested, contributors
MUST preserve all user work, create a recovery path when appropriate, and verify
the rewritten history before any push.

Reverts MUST use `⏪️` `:rewind:` and explain why the original change is being
reverted. They SHOULD reference the reverted commit or pull request.

Merge commits SHOULD be created only when required by the repository's chosen
workflow. Do not manufacture merge commits for ordinary local work.

## 11. Commit review checklist

A commit is compliant only when every applicable answer is yes:

- Does it have exactly one coherent responsibility?
- Is every staged hunk required for that responsibility?
- Is the commit independently understandable and safely reversible?
- Does it leave the repository coherent?
- Are unrelated and pre-existing changes excluded?
- Are secrets, artifacts, and accidental churn absent?
- Were required generated files and lockfiles handled correctly?
- Were applicable checks actually run or limitations disclosed?
- Does the Gitmoji represent the primary intention?
- Is the subject imperative, specific, truthful, and within the length limit?
- Are body and footers present only when needed and factually correct?
- Is the branch name compliant?
- Was history preserved unless rewriting was explicitly requested?

Any no answer MUST be resolved or reported before the commit is approved.

## 12. Policy changes

Changes to branch or commit policy MUST modify this file directly and explain the
rationale. Skills, templates, prompts, hooks, and automation MUST defer to this
file and MUST NOT become competing sources of truth.
