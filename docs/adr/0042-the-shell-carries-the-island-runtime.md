# ADR: The shell carries the island runtime, so an island reached through Swup hydrates

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-15
**Deciders:** Kori
**Scope:** How an Astro island on a page reached by a Swup visit gets the runtime that hydrates it:
`FilterBar` today, any island later. Amends 0006 Decision 3, 0022 Decision 1 and 0041 Decision 1.
Does not cover the content security policy itself (0022), Swup's containers and transitions (0007),
or the Atlas, which mounts from the shell for its own reason (0041).

---

## Context

`src/islands/FilterBar.tsx` filters every list on the site: the Arbres, the Espèces, each tree's
nodes and every browse page. Astro writes the runtime that hydrates it inline, just before the first
island of a page and so inside the `#swup` container, and Swup runs no script it swaps in. A reader
whose first document had no island, such as Home, a book chapter or the Atlas, reached a list
through Swup and found a filter that did nothing until a reload. 0022 had made the same filter work
on a first load in production; this record covers every visit after it. Versions, read from
`pnpm-lock.yaml`: `astro@7.3.3`, `@swup/astro@1.8.0`, `swup@4.10.0`.

---

## Decision 1: The shell defines the island runtime on every page

### Decision

- `src/scripts/islands.ts` imports Astro's island element from
  `astro/runtime/server/astro-island.js`, and `enableIslands()` registers the client directives of
  `CLIENT_DIRECTIVES` (`src/scripts/island-directives.ts`, `idle` today) in Astro's directive
  registry, announcing each with its `astro:<directive>` event. `src/scripts/shell.ts` calls it
  before anything else.
- Every page therefore defines `astro-island`, whatever page the reader arrived on. An island that a
  later Swup visit inserts upgrades and hydrates like one on a first load.
- `tests/unit/islands.test.ts` fails when a template under `src/` uses a `client:` directive the
  shell does not register.
- `tests/e2e/filters.spec.ts` starts on Home and on the Atlas, reaches the Trees through Swup and
  filters them by name. A third test leaves the Trees and comes back.

### Rationale

- The inline runtime sits inside the swapped container. In `dist/fr/arbres/index.html` the `idle`
  directive script and the `astro-island` script precede the island within `#swup`, as
  `getPrescripts` writes them (`astro/dist/runtime/server/scripts.js:31`). `reloadScripts: false`
  (`astro.config.mjs:57`) keeps Swup's scripts plugin out (`@swup/astro/dist/script.js:68`).
- The two visit tests in `tests/e2e/filters.spec.ts` failed on the build without this change, with
  `astro-island[ssr]` still present after the visit, and pass with it. Probed the same way on
  2026-10-15, the list on the Arbres, the Espèces, Compétences, Équipement, Matériaux, Règles, a tree
  page and a species page hydrates after a Swup visit from Home, and again after going back and
  forward.
- Unmounting needs nothing more. `@swup/astro` dispatches `astro:after-swap` on every
  `content:replace` (`@swup/astro/dist/script.js:133`), the event a removed island waits for
  (`astro/dist/runtime/server/astro-island.js:32`) before the React renderer unmounts it on
  `astro:unmount` (`@astrojs/react/dist/client.js:97`). The third test asserts the unmount.
- The element definition is guarded (`astro-island.js:197`), and registering a directive again only
  replaces an equivalent function, so the copies Astro still writes inline on island pages stay
  harmless.
- `src/scripts/islands.ts` bundled alone is 4,499 bytes, 1,842 gzipped (esbuild 0.28.2, minified).
  The shell bundle went from 28,623 to 33,075 bytes, downloaded once and cached for every page.

### Alternatives considered

- **Swup's scripts plugin (`reloadScripts: true`)**: would run every inline script of each new page.
  `.claude/rules/frontend/swup.md` forbids it unless third party code makes lifecycle control
  impossible, which this is not. Reopens if that rule changes.
- **Astro's prebuilt runtime inline in every head**: no code of ours, but every page load pays for
  it. Inserted into `dist/fr/index.html`, the two scripts take Home from 6,057 to 7,973 bytes
  gzipped (`gzip -9`). Rejected. Reopens if the shell bundle stops being cached across pages.
- **A shell-mounted React root for the filter, like the Atlas**: would rebuild, outside Astro, the
  hydration markup, the serialised props and the identifier prefix that `@astrojs/react` already
  produces. Rejected. Reopens if the site drops Astro islands.
- **Registering every built-in directive**: ships code for directives no template uses. Rejected; the
  unit test makes a missing registration fail instead.

### Caveats

- The module path and the registry are Astro internals. The runtime reads a global
  `Astro[directive]` (`astro-island.js:94`), which Astro's inline directive scripts fill and
  `enableIslands()` fills the same way. Both were verified against `astro@7.3.3`, and an upgrade may
  move either; `tests/e2e/filters.spec.ts` would then fail rather than pass.
