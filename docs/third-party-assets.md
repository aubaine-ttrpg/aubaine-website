# Third party assets

Everything under `data/` is original Aubaine work except the icon set and the fonts. Both are
redistributed here under their upstream licences, and those licences require the attribution below.
What the original work says about itself is the other half of that sentence, recorded in
[first-party-assets.md](first-party-assets.md).

## Icons

The sets are pulled from the Iconify API and committed as plain SVG under `data/media/icons/`, one
directory per Iconify prefix. `tools/media/sync.ts` copies the directory into `public/icons/` and
nothing rewrites it, so the file on disk is the file the browser fetches.

`ICON_SETS` in [`src/lib/rights/attribution.ts`](../src/lib/rights/attribution.ts) names every set,
its author and its licence. One row reads `mdi`, Material Design Icons, Pictogrammers, Apache License
2.0. Read the module for the rest; it is the only list, and no second copy is kept here.

That table is not documentation. The credits page renders it, `schema.ts` builds the `<prefix>:<name>`
pattern from its prefixes, and `pnpm data:check` fails when a directory under `data/media/icons/` is
not named by it. An uncredited set therefore cannot ship.

CC BY 3.0 requires that Game-icons.net be credited wherever its icons are used. The credits page is
where that credit now lives, on the site rather than only in this file.

## Why the files are plain

An icon is drawn as a CSS mask, so only its geometry is ever read. A fetched icon is written as a
single `<svg>` element with its `viewBox` and its body, and nothing else. Earlier files carried a
C2PA provenance block, added by the tool that produced them, that was eight to eleven kilobytes of
base64 for a few hundred bytes of path. That metadata described the local conversion rather than the
upstream work, it was never read, and it is no longer kept.

The same kind of block, from the same kind of tool, sat on sixty of the sixty nine PNGs under
`data/media/` and on both flags in `data/media/flags/`, where `fr.svg` was 7997 bytes for a 261 byte
tricolour. It is removed there for the reasons above and for one more: a picture here is Aubaine's
work and now says so in its own bytes, which is recorded in
[first-party-assets.md](first-party-assets.md). An icon is not, and says nothing. The two flags are
stripped on the same grounds and claimed by nobody: a national flag is not original Aubaine work.

`pnpm media:stamp` never opens `data/media/icons/` or `data/media/fonts/`. Writing an Aubaine
copyright into a Pictogrammers file or an SIL licensed font would be a false claim, and the tables in
`src/lib/rights/ownership.ts` are what keep that true. `pnpm data:check` fails if a new directory
appears under `data/media/` that those tables do not name, so a future set has to be classified
before it can ship.

## Adding one

Fetch it from `https://api.iconify.design/<prefix>.json?icons=<name>` and write the body into
`data/media/icons/<prefix>/<name>.svg`. The API refuses a request without a browser-like
`User-Agent`. Only `mdi` and `game-icons` are declared by the schema, so a third set is a contract
change and a new licence to record here. See [runbooks/add-an-image.md](runbooks/add-an-image.md).

## Fonts

The families under `data/media/fonts/` are fetched from Google Fonts by `tools/fonts/build.ts`, which
also writes `src/styles/fonts.css`. Only the `latin` and `latin-ext` subsets are kept.
`tools/media/sync.ts` copies the directory into `public/fonts/`.

`FONT_FAMILIES` in [`src/lib/rights/attribution.ts`](../src/lib/rights/attribution.ts) names every
family, the Google Fonts query it is fetched with, the token it feeds and its licence. One row reads
`cinzel`, Cinzel, `--font-display`, SIL Open Font License 1.1. Read the module for the rest.

It is the list `tools/fonts/build.ts` iterates, so a family cannot be fetched without being credited,
and `pnpm data:check` fails when a `.woff2` on disk belongs to no declared family or a declared family
has no file. The credits page renders the same rows.

Each licence is the one `METADATA.pb` declares in the `google/fonts` repository, checked there rather
than assumed; every family reports `license: "OFL"`, Tinos included, which sits under `ofl/` there
and not under `apache/`.

Tinos is metrically compatible with Times New Roman and is embedded so the cover title does not
depend on a font the rendering machine happens to have. Before it was added, the printed covers fell
back to whatever serif the host provided, which is why the inherited booklets carry Liberation Serif.
`pdffonts` reports the embedded face as `Times-Roman`, the PostScript name Tinos declares for that
compatibility.
