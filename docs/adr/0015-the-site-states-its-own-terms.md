# ADR: The site states its own terms, and the credits are code

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-23
**Deciders:** Kori
**Scope:** Where the licensing, AI, credits and privacy prose lives, how third party attribution is
stored and enforced, what the footer reaches, and the rename of the version file with its
consequence for the booklets. Does not cover the URL scheme (0005), which the new routes merely
extend, the header's swap behaviour (0012), or the printing lifecycle (0013), whose stale rule this
record relies on.

---

## Context

`LICENSE`, `LICENSE-CONTENT` and `src/lib/rights/claim.ts` already settled that the code is MIT and
that everything under `data/` is CC BY-NC-SA 4.0. A reader of the site could not find that out. The
footer printed the licence identifier as inert text and linked nothing, and it carried
`display:none` on the home page, which is where a search result lands.

Two obligations were unmet in the same place. `docs/third-party-assets.md` records that the
Game-icons.net set is CC BY 3.0 and asks that the credit be kept "in the site footer or colophon if
one is ever added"; no such credit existed on the site. And the project's illustrations come from an
image model, which the repository knew privately (`FOREIGN_PROVENANCE` in
`src/lib/rights/ownership.ts` names the markers `pnpm media:stamp` strips) and said nowhere publicly.

Three drift defects surfaced while reading the same files. `src/lib/i18n/strings.ts` baked a literal
codex version into four keys in both locales, and `data/aubaine.json` had moved past it, so the site
printed a version it did not have. `src/components/shell/Footer.astro` hard-coded the licence
identifier that `claim.ts` owns. And the icon and font attributions existed only as prose tables in
`docs/third-party-assets.md`, with the font list duplicated a second time as `FAMILIES` in
`tools/fonts/build.ts`.

---

## Decision 1: Policy prose lives in `src/content/policies/`, not under `data/`

### Decision

- A `policies` collection in `src/content.config.ts`, based on `./src/content/policies` rather than
  `./data/`, validated by `policy` in `src/lib/game/schema.ts`.
- French canonical with an `.en.md` overlay, the arrangement 0003 set for the rest of the corpus.
- The canonical file declares its route in frontmatter as `kind`; the overlay omits it and inherits
  the route of the file it translates.
- `policyPages(locale)` in `src/lib/game/policies.ts` resolves the pair and is the one reader.
  `pageRoutes()` and the footer both call it.

### Rationale

- `data/` is the game codex, and the rules scoped to it say so. `.claude/rules/content/authority.md`
  declares everything under `data/` original Aubaine game text whose questions resolve against the
  schema and the runbooks, and `editorial-style.md` binds `data/**/*.md` to three registers: rule
  text, item flavour, and book chapters. A privacy note is none of those. Putting it under `data/`
  would either bend those registers or quietly exempt a directory from them.
- Declaring the route in the file, rather than deriving it from the filename, means the mapping from
  content to URL is written once and read by `policyPages`. A filename convention would need a second
  table to turn `politique-ia` into the `aiPolicy` kind.
- `policyPages` throws when a kind has no file or two files claim one, so a missing policy fails the
  build instead of silently dropping a route, which is what
  `.claude/rules/architecture/astro.md` asks for.

### Alternatives considered

- **A `data/policies/` collection**: consistent with "drop a file into `data/` and it appears", and it
  would have reused the existing glob idiom unchanged. Rejected because it pulls site chrome into the
  directory whose rules govern game canon. Reopens if the content rules ever gain a register for
  non-canon prose.
- **The prose in `src/lib/i18n/strings.ts`**: type safe, and a missing English key becomes a compile
  error. Rejected because that module holds interface labels, and four pages of prose in two locales
  would bury them. Markdown also gives these pages the `au-prose` typography that `Book.astro`
  already uses.
- **One combined page with anchors**: fewer routes. Rejected because the AI policy is the page most
  likely to be linked on its own, and an anchor is not a citable address.

### Caveats

- `src/content/policies/` is the only collection not based on `./data/`, so the loader list no longer
  reads as one rule. The base path is the only thing that says which body of content a file belongs
  to.

---

## Decision 2: Third party attribution is a typed table, and the build refuses an uncredited set

### Decision

- `src/lib/rights/attribution.ts` holds `ICON_SETS` and `FONT_FAMILIES`, each row carrying the
  identifier, the human name, the licence and its URL, and for a font the Google Fonts query and the
  token it feeds.
- `tools/fonts/build.ts` iterates that table instead of its own `FAMILIES`, and emits the `--font-*`
  token block from it rather than from a hand written list.
- `src/lib/game/schema.ts` builds the icon name pattern from the table's prefixes, replacing the
  same regex literal written out twice.
- `src/components/primitives/Attribution.astro` renders both tables on the credits page.
- `tests/data/integrity.test.ts` fails when a directory under `data/media/icons/` is not declared,
  when a declared set has no directory, when a `.woff2` under `data/media/fonts/` belongs to no
  declared family, or when a declared family has no file.
- `docs/third-party-assets.md` keeps the reasoning and points at the module for the membership.

### Rationale

- A credits page that retyped the doc tables would have been a third copy of a list that grows, which
  `.claude/rules/meta/rule-maintenance.md` forbids in as many words: a copied list is a defect with a
  delay on it.
- The gate is what makes the credit reliable rather than merely present. Adding an undeclared
  directory under `data/media/icons/` was confirmed to fail `pnpm data:check` with the two lists
  printed side by side. This is the mechanism `ownership.ts` already uses to keep the media tree
  classified, applied to the obligation that CC BY 3.0 actually imposes.
- Folding the font list into the same table means a family cannot be fetched by
  `tools/fonts/build.ts` without carrying the licence the credits page prints. The previous
  arrangement let the two drift apart silently.

### Alternatives considered

- **Keep the tables in the doc and copy them into the page**: no new module. Rejected because it
  doubles a growing list and leaves the CC BY 3.0 obligation depending on someone remembering to edit
  two files.
- **Keep `FAMILIES` in `tools/fonts/build.ts` and add a separate licence table keyed by slug**:
  smaller diff in the tool. Rejected because the slug list would then exist twice, which is the defect
  being removed; a test asserting the two agree would be a guard around a duplication rather than its
  removal.
- **Generate the credits page from the Iconify API and the Google Fonts metadata at build time**:
  authoritative at the source. Rejected because it puts a network call in the build, and the licences
  in question change on a scale of years. Reopens if the sets ever grow past what a reviewer can read.

---

## Decision 3: The footer carries the brand, the version and the terms, on every page

### Decision

- `src/components/shell/Footer.astro` is rebuilt as a brand block, two link columns and a licence
  line. The hexagon from `Logo.astro` and the wordmark sit left, with the codex version beneath.
- The `display:none` on `kind === 'home'` is removed, and `kind` leaves the component's props.
- The codex column links the hubs through `pathFor`. The project column maps over `POLICY_KINDS`
  with the titles `policyPages(locale)` returns, so a new policy file becomes a footer link with
  nothing to register.
- The version is read from `AUBAINE_VERSION` in `src/lib/game/version.ts`. The holder, the year and
  the licence identifier come from `claim.ts`, and the identifier links the licences page.
- `id="site-footer"` and the `data-footer-archives` hook are kept.

### Rationale

- The identifier is no longer written in the footer at all, so the defect it carried cannot recur.
  `tests/data/integrity.test.ts` already asserted `copyright` against `HOLDER`; the same block now
  covers the colophon's licence line, and a new assertion rejects any interface string carrying a
  version-shaped literal.
- The hook and the id are load bearing beyond this component. `astro.config.mjs` lists
  `'#site-footer'` as a Swup container and `CHAPTER_CONTAINERS` in `src/scripts/book.ts` lists it
  again for a chapter switch; `tests/e2e/navigation.spec.ts` clicks `[data-footer-archives]` and
  asserts it survives the swap. Renaming either would have broken a contract this record does not
  touch.
- Showing the footer on the home page is what makes the terms reachable from the page most people
  arrive on. It was hidden for the full bleed hero, and a bordered band below the fold is a small
  price for the licence being one scroll away.
- `Logo.astro` hard-codes the dark theme gold, so the footer passes `color="var(--gold)"` and the
  mark follows both themes. The header's call is left as it is, because the header bar is
  deliberately dark in both themes.

### Alternatives considered

- **Leave the footer hidden on home and link the policies from the header**: preserves the hero.
  Rejected because the header is already carrying two menus, a search field, a theme control and a
  language control, and a legal link is not a navigation destination people hunt for.
- **A single inline row of policy links**: shorter footer. Rejected because the brand block and the
  version need a column of their own, and two labelled columns make the codex links and the project
  links distinguishable without reading them.

### Caveats

- The footer now awaits `policyPages(locale)` on every page render. The collection is cached by
  Astro, and `Header.astro` already does comparable work through `indexDescriptors`, but it is work
  the previous footer did not do.

---

## Decision 4: The version file is `data/aubaine.json`, and the booklets are reprinted

### Decision

- `data/codex.json` becomes `data/aubaine.json`, and every reference follows: `Footer.astro`,
  `src/pages/print/[...booklet].astro`, `src/lib/booklet/fingerprint.ts`, `tools/pdf/render.ts` and
  the `describe` text in `src/lib/game/schema.ts`.
- The blob key inside `fingerprint.ts` is renamed with the file, from `'codex.json'` to
  `'aubaine.json'`.
- Every booklet is reprinted at the same codex version, and the superseded printings are deleted
  rather than archived.

### Rationale

- The blob key is hashed into the content hash. `digest` in `src/lib/booklet/fingerprint.ts` walks
  the sorted keys and feeds each key into the payload alongside its bytes, so the key string is part
  of the result and every booklet filename changes with it. Leaving the key at `'codex.json'` while
  the file is named otherwise would have kept the hashes stable at the cost of a literal that matches
  nothing on disk.
- The reprint is safe because 0013 already classifies it. A printing of the same booklet at the same
  version is **stale**, not a new generation: `planArchive` in `tools/pdf/archive.ts` deletes the file
  and removes the row, so no false generation enters the archive and `data/pdf/notes.json` is owed
  nothing. Confirmed by running `pnpm pdf --force` then `pnpm pdf:archive`, which reported the
  superseded printings removed, followed by `pnpm pdf:check` and `pnpm pdf:archive:check` reporting
  every booklet current.
- The style hash moved in the same run, independently of the key, because
  `src/components/print/Colophon.astro` changed when its licence line became a call against
  `claim.ts`.

### Alternatives considered

- **Keep the blob key at `'codex.json'` behind a named constant**: no booklet is re-rendered and no
  published filename changes. Rejected when asked, in favour of one name for one file. Reopens if a
  future rename lands at a moment when reprinting the whole set is too expensive, since 0013 makes
  the reprint cheap only while a generation is small.
- **Bump the codex version so the old printings become a real generation**: would have preserved the
  old files under an archive. Rejected because nothing about the game data changed, and a version is
  a statement about content.

### Caveats

- The reprint restored booklets for targets that had none on disk, so the published set grew from the
  slugs that happened to be rendered last time to every tree, both handbooks and the equipment
  catalogue. That is the set `pnpm pdf` considers owed, and `pnpm pdf:check` would have reported the
  gap at any point before this change, but the growth arrived as a side effect of a rename rather
  than as a decision of its own.

---

## Decision 5: The project is Aubaine, and nothing visible calls it the codex

### Decision

- No page prints the word Codex as a name. The footer's brand block is the hexagon, the wordmark and
  the bare version; the licence line carries the holder, the year and the licence identifier.
- Every site page eyebrow is removed, meaning the uppercase kicker that sat above the `h1` on the
  home page, the hubs, the indexes, the search results, a booklet history, a book chapter and the
  policy pages. The printed covers keep theirs, which reads `Aubaine`.
- `spellsEyebrow` and `itemsEyebrow` also served as the meta description for the skills and equipment
  pages. They become `spellsLead` and `itemsLead`, written as real descriptions rather than kickers.
  `searchEyebrow` becomes `searchTitle`, which is all it was still doing.
- `src/lib/codex/` becomes `src/lib/game/`, the `@codex` alias becomes `@game`, `codexVersion`
  becomes `aubaineVersion` and `CODEX_VERSION` becomes `AUBAINE_VERSION`.

### Rationale

- The site is Aubaine's, and Codex was never its name. It read as a product name in the footer's
  version line and in the kickers above three index pages, which is the one place a reader would take
  it for one.
- The word survives where it is a common noun for the reference work, in the search placeholder, the
  loading and error text and the empty states. That usage was never the problem, and replacing it
  would cost a sentence each for no gain.
- The rename is contract neutral. `pnpm schemas` re-emitted every file under `schemas/` and
  `node tools/schemas/emit.ts --check` then reported them up to date, with the icon pattern
  byte identical to the one the inline regex produced.
- Removing the eyebrows removes a line of chrome from every hero and leaves the `h1` at the top of
  its block, which is where the heading order already said it was.

### Alternatives considered

- **Keep the eyebrows and only fix the ones naming Codex**: a three line diff. Rejected when asked,
  on the grounds that none of them earned its space.
- **Rename only what a reader sees and leave `src/lib/codex/`**: no mechanical diff across the
  repository. Rejected when asked, because the module name is what keeps the word alive in every
  import and in the rules that point at the schema.
- **Name the module `src/lib/aubaine/` or `src/lib/almanach/`**: both were offered. `game` was chosen
  as the one that says what is inside rather than whose it is, next to `rights/`, `booklet/` and
  `i18n/`.

### Caveats

- Accepted records 0002 to 0014 name `src/lib/codex/` and are not rewritten, because
  `docs/adr/README.md` forbids editing an accepted decision. This decision is the map from the old
  path to the new one.
- The booklet style hash covers `components/primitives` and `components/print`, so the credits
  component and the colophon change moved it. The booklets were reprinted a second time, under the
  same rule Decision 4 relies on.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| Policy prose | French canonical, English overlay, route declared in frontmatter | `src/content/policies/`, `src/lib/game/policies.ts` |
| Routes | Four kinds on the existing catch-all | `src/lib/i18n/routes.ts`, `src/lib/game/pages.ts` |
| Attribution | One typed table, read by the tool, the schema and the page | `src/lib/rights/attribution.ts` |
| Credit gate | An undeclared icon set or font family fails the data check | `tests/data/integrity.test.ts` |
| Footer | Brand, version, two columns, licence line, every page | `src/components/shell/Footer.astro` |
| Version | One name, one owner, no literal in any string | `data/aubaine.json`, `src/lib/game/version.ts` |
| Naming | No visible Codex, no page eyebrows, the module renamed | `src/lib/game/`, `src/lib/i18n/strings.ts` |
