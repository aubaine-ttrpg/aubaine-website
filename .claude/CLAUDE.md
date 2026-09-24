# Project Instructions

## Product

Build and maintain a multilingual TTRPG showcase and wiki with Astro, React islands, Swup navigation, Motion for React, TypeScript, and Cloudflare deployment.

The site is content first. Prefer static HTML, semantic markup, minimal client JavaScript, durable URLs, accurate metadata, fast navigation, strong accessibility, and trustworthy editorial content.

## Working Principles

- Read the relevant files before changing them.
- Make the smallest coherent change that fully solves the task.
- Preserve sound architecture unless the task requires changing it.
- Prefer deletion and simplification over additional abstraction.
- Prefer browser, Astro, React, Swup, Motion, and Cloudflare primitives before adding dependencies.
- Do not create speculative abstractions for hypothetical future needs.
- Do not duplicate logic, schemas, route rules, metadata generation, or content transforms.
- Do not leave placeholders, TODO markers, FIXME markers, dead code, or temporary compatibility layers.
- Do not restate repository constraints or narrate them back unless explicitly asked.
- Do not mention AI authorship, AI detection, humanization, prompt instructions, or optimization tactics in published copy.
- Never use Unicode U+2013 or U+2014 in authored repository text.
- Do not add comments to authored source or configuration files.

## Architecture

- Astro owns pages, layouts, routing, content rendering, metadata, and static output.
- React is reserved for interactive islands that need client state, lifecycle, gestures, or complex animation.
- Swup owns cross page client navigation and page transition lifecycle.
- Motion for React owns state driven animation inside React islands.
- Avoid multiple systems controlling the same transition or lifecycle.
- Prefer build time work over request time work.
- Prefer static output. Add Cloudflare runtime rendering only when a feature requires request time behavior.
- Keep browser, build, server, and Cloudflare runtime boundaries explicit.

## Language And Types

- Author project code in TypeScript wherever the toolchain supports it.
- Use Astro's strictest TypeScript configuration for a new project unless a verified dependency requires a narrower setting.
- Do not add new JavaScript or JSX source files when TypeScript or TSX is supported.
- Do not bypass type errors with assertions or suppression directives when the contract can be modeled correctly.

## Content

- Use Astro content collections for structured editorial content.
- Validate authored data with schemas.
- Treat translations as first class content.
- Never invent TTRPG canon, rules, statistics, quotations, sources, dates, or relationships.
- Keep factual content, mechanical rules, and editorial interpretation distinguishable.

## Quality

- Accessibility is a release requirement.
- SEO, locale metadata, and structured data must be correct on the initial response and after Swup navigation.
- Performance changes require measurable benefit or a clear reduction in shipped work.
- Validate untrusted input at trust boundaries.
- User facing failures must provide a useful recovery path.

## Verification

Before finishing a code change:

1. Format touched files with the repository formatter.
2. Run the repository linter.
3. Run Astro and TypeScript checks.
4. Run relevant unit or integration tests.
5. Run relevant end to end tests for routing, navigation, locale, metadata, or interactive behavior.
6. Run a production build when build output, routing, metadata, content, or deployment behavior changed.
7. Check changed authored text for Unicode U+2013 and U+2014.
8. Review the diff for accidental comments, dead code, duplicated logic, and unrelated edits.

The repository commands are `pnpm data:check`, `pnpm check`, `pnpm test`, `pnpm test:e2e`, `pnpm lint`, `pnpm format` and `pnpm build`. `pnpm verify` runs the sequence. The package manager is pnpm, pinned by the lockfile.

## Git

Do not commit, amend, rebase, push, or create tags unless explicitly asked.

When a commit is explicitly requested, follow `CONTRIBUTING.md`. It is the sole source of truth for
branch names, commit partitioning, staging, message format, validation and history safety.
