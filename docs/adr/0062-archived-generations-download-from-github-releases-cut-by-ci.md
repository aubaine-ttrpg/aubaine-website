# ADR: Archived generations download from GitHub Releases cut by CI

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-29
**Deciders:** Kori
**Scope:** Where a reader downloads a superseded booklet generation, and how that download comes to
exist. Does not cover which printings are loose, archived or stale, nor the zip naming, which stay
with Decision 1 of 0013; nor the crawl headers on the loose PDFs, which stay with Decision 4 of 0040.
Leaves step 3 of `tasks/AUBAINE-003.md`, taking the zips out of git, open.

---

## Context

`tools/media/sync.ts` copied `data/media/pdf-archive/` into `public/` on every build, so each
archived zip shipped as a static asset at `/pdf-archive/<zip>`. The first generation archived, 0.2.1
in b106902, made two zips of 38,705,315 and 38,598,831 bytes (36.9 and 36.8 MiB). The Workers Builds
deploy of 2026-10-29 then failed in `wrangler deploy` (wrangler 4.156.0) with "Cloudflare Workers
supports assets with sizes of up to 25 MiB", naming `dist/pdf-archive/aubaine-v0.2.1-en.zip`. The
limit is the one wrangler enforced in that log; it was not checked against Cloudflare's documentation.
The repository is public on GitHub as `aubaine-ttrpg/aubaine-website`, the condition 0013 set for
reopening release assets.

---

## Decision 1: An archived generation downloads from its GitHub Release

### Decision

- `releaseHref` in `src/lib/media.ts` sends an archived row to
  `https://github.com/aubaine-ttrpg/aubaine-website/releases/download/<tag>/<zip>`, with the tag from
  `releaseTag` in `src/lib/booklet/release.ts`. A loose row still links `/pdf/<file>`.
- `tools/media/sync.ts` no longer copies `data/media/pdf-archive/` into `public/`, and the
  `/pdf-archive/*` block leaves `public/_headers`.
- The zips stay committed in `data/media/pdf-archive/`. `pnpm pdf:archive` writes them there, the
  release is cut from them, and `tests/data/integrity.test.ts` still checks them on disk.
- `tools/deploy/asset-limit.ts` runs at the end of `pnpm build` and fails, naming each file, when a
  file in `dist/` exceeds 25 MiB.

### Rationale

- The limit cannot be met by the archive. Zipping the 28 loose 0.3.0 booklets per locale at `zip -9`
  measured 38,651,341 bytes in French and 38,746,826 in English, so the next generation archived would
  fail the same way, and the booklet set only grows.
- The tag in the href is derived from the row's version, which is safe because the integrity test
  "names each archive after its own version and locale" holds `archive` equal to
  `archiveFile(version, locale)`.
- The release link needs no client change. Swup skips `[download]` links (`triggerWillOpenNewWindow`
  in swup 4.10.0), and the `Content-Security-Policy` in `public/_headers` does not govern a
  navigation.
- The build guard catches the failure on `pnpm verify` before a push. Run against the `dist/` of
  2026-10-29 it named both 0.2.1 zips and exited 1.

### Alternatives considered

- **Link the committed file on `main` through raw.githubusercontent.com**: checked on 2026-10-29, it
  served the zip with `200` and `application/zip`, and it needs no release. Rejected because the link
  dies the moment step 3 of `tasks/AUBAINE-003.md` takes the zips out of git. Reopens if GitHub
  Actions becomes unavailable to the repository.
- **A Cloudflare R2 bucket on an aubaine.io subdomain**: keeps every download on one domain. Rejected
  because the bucket and its domain have to be set up by hand in the Cloudflare account that owns
  aubaine.io, and each generation uploaded to it. Reopens if GitHub becomes unreachable for readers or
  the repository goes private.
- **Split each generation into zips under 25 MiB**: keeps the files on aubaine.io. Rejected because
  `ARCHIVE_FILE` would gain a part number and the number of parts would grow with the booklet set.

### Caveats

- An archive download now leaves aubaine.io and depends on GitHub being reachable.
- The site and the release deploy from the same push in parallel, so a newly archived row can link a
  release that does not exist yet until the workflow finishes, or until it is re-run if it fails.
- The zips are kept twice, in git and on the release. The repository growth that step 3 of
  `tasks/AUBAINE-003.md` exists to stop is unchanged.

---

## Decision 2: A GitHub Action cuts one release per archived generation

### Decision

- `.github/workflows/pdf-release.yml` runs on a push to `main` that touches
  `data/media/pdf-archive/**` or the workflow itself, and on manual dispatch. It runs
  `pnpm pdf:publish` with the workflow's own token and `contents: write`.
- `planPublish` in `tools/pdf/publish.ts` groups the zips by version and drops every version whose tag
  already has a release. Each remaining version becomes one release: tag `v<version>`, title
  `Aubaine v<version>`, both locale zips as assets, and that version's French and English note from
  `data/pdf/notes.json` as the body. It is created with `--latest=false`.
- The tag points at the last commit where `data/aubaine.json` named that version. For 0.2.1 that is
  55e58d5, reported by `pnpm pdf:publish:check`.
- `pnpm pdf:publish:check` lists what is pending and exits non zero, without writing anything.

### Rationale

- A git tag cannot carry a file. A release asset is uploaded through the GitHub API, and the owner
  pushes over SSH, which never reaches that API. A workflow ties the upload to the push that archives
  the generation, so there is no manual step to forget.
- It runs on `main` rather than on a tag push because a tag triggered workflow runs the workflow file
  of the tagged commit. No commit of 0.2.1 has one, so 0.2.1 could never be backfilled that way, and a
  version's zip only exists once the next version is printed.
- Tagging the last commit of the generation means `git checkout v0.2.1` shows the codex as it was,
  rather than the commit that printed 0.3.0.
- `--latest=false` because an archived generation is never the current one, which stays loose on the
  site (0013).
- Decision 3 of 0013 already guarantees a note for every version, so a release body is never empty.

### Alternatives considered

- **Upload each release by hand on github.com**: no CI at all. Rejected by the owner for a git only
  flow, and because a forgotten upload is a dead link. Reopens if the workflow is disabled.
- **Tag the commit that archives the generation**: no history walk. Rejected because `v0.2.1` would
  then check out version 0.3.0.

### Caveats

- This is the first CI in the repository. The workflow checks out full history with `filter:
  blob:none` to walk `data/aubaine.json`, and installs dependencies with `--ignore-scripts`, which is
  safe because `tools/pdf/publish.ts` loads only `astro` and `zod` from `node_modules`.
