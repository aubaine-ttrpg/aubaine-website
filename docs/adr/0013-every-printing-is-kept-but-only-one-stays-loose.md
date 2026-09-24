# ADR: Every printing is kept, but only one generation stays loose

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-22
**Deciders:** Kori
**Scope:** Where a booklet PDF lives once a newer one exists, the address its history is read at, and
what a codex version has to carry before it may ship. Does not cover how a booklet is rendered, which
is `tools/pdf/render.ts`, nor the release identity itself, which `src/lib/booklet/release.ts` owns.
Extends the URL scheme of 0005 with one more section, and inherits the static output of 0006 and the
swap containers of 0012.

---

## Context

A booklet filename carries its version and two digests, so a reprint never overwrites its
predecessor, and `writeManifest` in `tools/pdf/render.ts` merges into the previous manifest keyed by
`file` and deletes nothing. Every printing the project has made was therefore already on disk, in
`data/media/pdf/`, copied wholesale into `public/pdf/` by `tools/media/sync.ts` on every build and
served immutable for a year by `public/_headers`.

None of it was reachable. A tree page offered one file through `bookletHref`, and the reading side
that would have shown the rest was written and never called: `generations`, `notes`, `noteFor` and
`supersededReleases` in `src/lib/booklet/manifest.ts` had no consumer, `data/pdf/notes.json` held an
empty array, and `src/lib/codex/schema.ts` described the `bytes` field as being "pour la page des
archives", a page that did not exist.

Growth is the reason this cannot simply stay as it is. `styleHash` digests every file under
`styles`, `components/primitives`, `components/print` and `scripts`, listed as `STYLE_DIRECTORIES` in
`src/lib/booklet/fingerprint.ts`, so it is one value shared by all booklets and it moves whenever any
of those files changes. Because the digest is in the filename and nothing prunes, a single stylesheet
edit deposits another 36 PDFs. The manifest reached 108 releases across three style digests, all of
them version 0.2.1, before anything read it.

---

## Decision 1: One generation is loose, older ones are zipped, reprints are dropped

### Decision

- A release is in one of three states, decided by `planArchive` in `tools/pdf/archive.ts`.
- **Loose**: it belongs to the newest codex version. It stays a file in `data/media/pdf/`, and its
  manifest row carries no `archive` key.
- **Archived**: it belongs to an older version. It moves into `data/media/pdf-archive/`, inside one
  zip per version per locale named by `archiveFile` in `src/lib/booklet/release.ts`, and its row
  gains an `archive` key naming that zip.
- **Stale**: another printing of the same booklet exists at the same version. The file is deleted and
  the row is removed. A reprint is not history.
- `pnpm pdf:archive` performs it; `pnpm pdf:archive:check` reports and exits non zero.

### Rationale

- File count, not bytes, is the cost being managed. Zipping the 36 files measured 52 MB loose against
  44.4 MB at `zip -9`, a 15 percent saving that would not on its own justify the machinery. Ten
  versions kept loose would instead put 360 files in one directory, and the split holds
  `data/media/pdf/` at one generation while `data/media/pdf-archive/` grows by two entries a version.
- The current generation has to stay loose because the download button on a tree, book or equipment
  page links one PDF directly, and that is the path almost every reader takes.
- Dropping a same-version reprint is what makes "one version is one generation" true. Without it the
  archive page showed 54 booklets for v0.2.1, because three style digests were each counted, which is
  not a history a reader can use.
- An absent `archive` key meaning loose follows the convention that
  `.claude/rules/content/data-authoring.md` already sets for every optional field, so no `null` is
  ever written.

### Alternatives considered

- **Keep every printing loose**: the shape this repository already had. Rejected on directory growth,
  36 files per version and more on every style edit. Reopens if the booklet set shrinks enough that
  the count stops mattering.
- **Publish superseded generations as GitHub release assets and drop them from the repository**: the
  only option where repository size is constant rather than linear in version count. Rejected for now
  because the project is not yet under version control, recorded as "init git" in
  `tasks/AUBAINE-001.md`, so there is no remote to publish to. `tasks/AUBAINE-003.md` carries it, and
  it reopens the moment the repository is published.
- **One zip per version holding both locales**: half the entries in the archive directory. Rejected
  because a French reader would download the English booklets to reach the French ones.

### Caveats

- Only the newest version's booklets can be downloaded one at a time. Reaching a single older booklet
  means taking that generation's whole zip. This trades a reader's convenience for a bounded
  directory, and it is the cost of Decision 1 rather than an oversight.
- History still grows by roughly one zip per version per locale, so a clone deepens over time even
  though the working tree does not. `CONTRIBUTING.md` carries the shallow clone guidance.
- `tools/pdf/archive.ts` shells out to `zip`, which Node does not provide. It fails loudly when the
  binary is absent rather than falling back to an uncompressed copy.

---

## Decision 2: The history is read under one archives section, keyed by the booklet slug

### Decision

- `/{locale}/archives` lists every generation, its authored note, and its booklets.
- `/{locale}/archives/<slug>` lists every version of one booklet.
- `archives` and `archive` join `ViewKind` and the `SEGMENT` table in `src/lib/i18n/routes.ts`, and
  `RouteParams` gains `slug`. Both segments are spelled `archives` in French and English.
- Neither kind appears in `NAV_SECTIONS`, so `sectionFor` returns `undefined` for them, as it already
  did for `search` and `notFound`.
- A tree, a book and the equipment index link their own history beside their existing download
  button; the footer links the index.

### Rationale

- The slug alone identifies a booklet, so the path needs no kind segment. Every id is unique across
  the whole repository by the rule in `.claude/rules/content/data-authoring.md`, and the eighteen
  slugs in `data/pdf/releases.json` are distinct. A test in `tests/data/integrity.test.ts` holds it,
  because the URL now depends on it.
- Nesting the history under the entity instead, at `/fr/arbre/feu/versions`, would have placed it
  beside the node routes `/fr/arbre/feu/<SKILL-ID>` and the chapter routes
  `/fr/livres/<book>/<chapter>`. The second is the dangerous one: `bookChapterRef` in
  `src/lib/i18n/routes.ts` reads any `/{locale}/livres/{book}/{chapter}` path as a chapter, so
  `src/scripts/book.ts` would have narrowed the swap to `#book-nav` and `#book-body`, which a history
  page does not render. It would have worked on a cold load and failed silently on every client
  navigation. A flat section cannot express that bug.
- Keeping the booklet kind out of the path also avoids `/fr/archives/equipement/equipement`, since
  the catalogue id in `data/equipment/catalogue.json` is `equipement` and the French segment for the
  equipment kind is the same word.
- 471 pages build, reported by `pnpm build`, against 433 before: two index pages and thirty six
  booklet histories.

### Alternatives considered

- **`/{locale}/archives/<kind>/<slug>`**: uniform three segments and immune to a future slug
  collision. Rejected on the doubled equipment segment and on a second route parameter that four
  modules destructure. Reopens if a booklet slug ever has to be reused across kinds, which the
  integrity test would catch first.
- **A history section on the entity page rather than its own address**: no new routes. Rejected
  because the history would have no URL to link or share, and every tree page would carry it.

---

## Decision 3: A version does not ship without an authored note

### Decision

- `data/pdf/notes.json` must hold a `pdfNote` for every distinct version in `data/pdf/releases.json`,
  with non empty `fr` and `en`.
- `tests/data/integrity.test.ts` fails when one is missing, when a note names a version no booklet
  carries, or when a note's date is not a real calendar day.

### Rationale

- The derived facts a row can show, a date, a size and a sheet count, do not tell a reader what
  changed. The note is the only part that does, and an optional field that blocks nothing is an
  optional field that stays empty: `data/pdf/notes.json` was `{"notes": []}` for the whole life of
  the manifest.
- The gate also enforces the editorial discipline the version scheme depends on. A version is meant
  to be one deliberate change rather than a typo, and having to write a sentence about it is the
  cheapest available brake.
- The calendar day check closes a gap the schema cannot express: `DATE` in `src/lib/codex/schema.ts`
  is `/^\d{4}-\d{2}-\d{2}$/`, which accepts `2026-13-45`.

### Alternatives considered

- **Render a version with no note**: never blocks a build. Rejected because a blank history row is
  indistinguishable from a version nobody bothered to describe, and nothing would ever prompt the
  writing.

### Caveats

- `pnpm pdf` can leave the repository failing `pnpm data:check` until a human writes the note. That
  is the intent, and the failure message names the version and the file.
