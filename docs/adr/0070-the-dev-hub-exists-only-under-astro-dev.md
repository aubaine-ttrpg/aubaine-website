# ADR: The Dev Hub exists only under astro dev

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-11-06
**Deciders:** Kori
**Scope:** The Dev Hub: the pages of tools that make the site, their route, their link in the top bar,
the endpoint that saves what they make, and their words. Its first tool designs the almanach styles of
0069. Does not cover the gated prototype page of the `aubaine-design` skill, which stays as it is.

---

## Context

The owner wants tools that live beside the site while it is developed, reached from its top bar like
Astro's own dev toolbar, and that never reach production, the preview, a release or the tests. The
first is the almanach previewer: it designs a style and saves it under `data/almanachs/` for a page to
use. A tool that writes files needs the dev server, which a static build does not have.

---

## Decision 1: An integration injects the Dev Hub's routes under astro dev only

### Decision

- `src/dev/integration.ts` adds the Dev Hub to `astro.config.mjs`. `devHubRuns(command, environment)`
  is true for the `dev` command when `VITEST` is not set; only then does it inject
  `/[locale]/dev` and `/[locale]/dev/almanach`, whose pages live in `src/dev/pages/`.
- `dev` is a view kind in `src/lib/i18n/routes.ts`, so the Dev Hub's pages use `Base.astro`: the top
  bar, the Swup containers, the language switch, and `noIndex`. It is not in `IMPLEMENTED_VIEWS`, so the
  catch-all never builds it and the sitemap never lists it.
- `Header.astro` shows a « Dev Hub » link as its last control when `import.meta.env.MODE` is
  `development`, which it is under `astro dev` alone.

### Rationale

- Astro runs integrations with the `dev` command under Vitest too: `getViteConfig` maps `serve` to
  `dev` (verified in `node_modules/astro/dist/config/index.js`, Astro 7.3.3), hence the `VITEST` guard.
- Injected routes exist only when injected; pages under `src/pages/` are compiled by every build even
  when they produce no path.
- `tests/unit/dev-hub.test.ts` checks the gate for `dev`, `build`, `preview`, `sync` and Vitest;
  `tests/e2e/almanach.spec.ts` checks on the built site that `/fr/dev` answers 404, that the top bar
  has no Dev Hub link, and that `dist/` holds no Dev Hub file.

### Alternatives considered

- **A page under `src/pages/` gated by an environment variable**, like the prototype page: rejected; it
  builds whenever the variable is set and is compiled by every build. Reopens if a tool must also run
  on a built preview.
- **An app in Astro's dev toolbar**: rejected; the owner asked for the site's own top bar. Reopens if
  a tool needs no page of its own.

### Caveats

- A dev server started before the integration changed does not take it until it restarts: on
  2026-11-06 the running `astro dev` kept answering 404 for `/fr/dev` after `astro.config.mjs` gained
  the Dev Hub, while its components reloaded.

---

## Decision 2: The previewer saves a style through a dev server endpoint

### Decision

- `astro:server:setup` adds `PUT /__aubaine/almanachs/<name>` (`src/dev/almanach-store.ts`). It
  accepts a same-origin request with a name in lowercase with dashes and a body of at most 16,384
  bytes, validates the body with `almanachStyle`, and writes `data/almanachs/<name>.json` as two-space
  JSON ending in a newline.
- The previewer keeps the opened style and the chosen pictures in its address (`?almanach=` and
  `?images=`), so the reload a save may cause reopens the same work.

### Rationale

- Astro's dev handler passes `/__` paths on to other middleware (verified in
  `node_modules/astro/dist/vite-plugin-astro-server/plugin.js`), and the endpoint never exists in a
  build.
- The file it writes is the file the contract checks, so a saved style is valid by construction;
  `tests/unit/dev-hub.test.ts` covers the refusals.

### Alternatives considered

- **Copying the JSON by hand from the previewer**: kept as a fallback, since the previewer shows the
  file; rejected as the main path, since the owner asked to save a style for later use.

---

## Decision 3: The Dev Hub's words are French and stay out of strings.ts

### Decision

- The Dev Hub's copy lives in `src/dev/copy.ts`, in French, and its pages wrap their content in
  `lang="fr"`. The almanach's own words still come from `strings.ts`, in the previewer's chosen
  language.

### Rationale

- The Dev Hub is the owner's tool, like the prototype index whose text is French
  (`.claude/skills/aubaine-design/references/prototypes.md`). Words in `strings.ts` would ship to
  readers in every chunk that imports it; this is the one exception to keeping interface strings
  there (`.claude/rules/architecture/i18n-routing.md`).

### Alternatives considered

- **Both languages in `strings.ts`**: rejected on the shipped weight and on copy no reader sees.
  Reopens if someone other than the owner uses the Dev Hub.
