# Third party assets

Everything under `data/` is original Aubaine work except the icon set, the fonts, the sounds, the
textures and the heraldic charges of the arms. All five are redistributed here under their upstream
licences. The icon, font and charge licences require the attribution below; the sounds and the
textures are CC0 and are credited all the same.
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

`pnpm media:stamp` never opens `data/media/icons/`, `data/media/fonts/`, `data/media/sounds/`,
`data/media/textures/` or `data/media/arms/`. Writing an Aubaine
copyright into a Pictogrammers file or an SIL licensed font would be a false claim, and the tables in
`src/lib/rights/ownership.ts` are what keep that true. `pnpm data:check` fails if a new directory
appears under `data/media/` that those tables do not name, so a future set has to be classified
before it can ship.

## Adding one

Fetch it from `https://api.iconify.design/<prefix>.json?icons=<name>` and write the body into
`data/media/icons/<prefix>/<name>.svg`. The API refuses a request without a browser-like
`User-Agent`. The sets the schema declares are `ICON_SETS` in
[`src/lib/rights/attribution.ts`](../src/lib/rights/attribution.ts), `game-icons` among them, so a
new set is a contract change and a new licence to record here. See
[runbooks/add-an-image.md](runbooks/add-an-image.md).

The Atlas parchment draws game-icons paths into a canvas in the browser and uses them as a texture
on the map; the files themselves are still the committed ones, never fetched from Iconify at run
time. [runbooks/edit-the-atlas.md](runbooks/edit-the-atlas.md) says how to add one.

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

## Sounds

The Atlas plays recordings under CC0 1.0, from BigSoundBank and from Kenney's Interface Sounds. Each
is cut, levelled and encoded by `pnpm media:sounds` into `data/media/sounds/<name>.mp3`, and the
Atlas imports them as hashed files under `/_astro/`, so they share the immutable cache and never
pass through `tools/media/sync.ts`.

`SOUND_WORKS` in [`src/lib/rights/attribution.ts`](../src/lib/rights/attribution.ts) names every
work, its author as its source page gives it, that page, and its licence. One row credits Sea: Waves
to DenisChardonnet under CC0 1.0. Each work also lists its cuts: the file it produces, the upstream
file it is cut from, and the window, shape and filter used. Read the module for the rest.

The credits page renders the same rows. `pnpm data:check` fails when a file under
`data/media/sounds/` is credited by no work, when a credited file is missing, or when the files on
disk differ from the sounds the Atlas plays (`ATLAS_SOUNDS` in `src/islands/atlas/sound.ts`).

CC0 asks for no attribution. The works are credited because the site credits every file it did not
make, and because the author and source of each file are what make its licence checkable.

### Adding one

1. Download the original from its source page into `tmp/sounds/`, under the name its cut gives as
   `original`. BigSoundBank serves its files from a form on each page, behind a browser check, so
   download from a browser rather than with `curl`.
2. Copy the title and the author exactly as the source page prints them, and confirm the licence
   there. A title or author that contains an en or em dash cannot be committed, because
   `pnpm data:check` refuses both characters in `src/`; choose another recording.
3. Add the work and its cut to `SOUND_WORKS`, then run `pnpm media:sounds`. The loudness, sample
   rate and encoding of each shape are set in `tools/media/sounds.ts`, and every file leaves it with
   its metadata removed.
4. Make the Atlas play it, through `BEDS` or `CALLS` in `src/lib/atlas/world/soundscape.ts` or
   `CUES` in `src/islands/atlas/sound.ts`, and listen to it on `pnpm dev` before it ships.

## Textures

The framed paintings, the Colbert banner, the Landenheit flag and the wax seals use works from Poly
Haven under CC0 1.0: a scanned picture frame, two fabric scans, two wood scans, a plaster scan and a
room HDRI. `pnpm media:textures` (`tools/media/textures.ts`) makes every file under
`data/media/textures/` from its original, downloaded into `tmp/textures/`. It decodes the HDRI into
four packed levels of the room, cuts each fabric's displacement map into a square tile, renders the
gilt frame's glTF front on with three.js in Chromium (the lit frame, its surface and its relief),
models and renders the wooden frame from the Wood Table Worn scan the same way, and models and
renders the banner's hanger (a pole in the Dark Wood scan, gilt finials, a twisted cord), all lit by
the same room. None of these textures ships three.js to a reader; the scripts import the files as
hashed assets under `/_astro/`, `src/styles/prose.css` draws the lit frame as a `border-image`, and
`Heraldry.astro` places the hanger.

`TEXTURE_WORKS` in [`src/lib/rights/attribution.ts`](../src/lib/rights/attribution.ts) names every
work, its authors as its source page gives them, that page, and its licence. Each work also lists its
cuts: the file it produces, the upstream file it is made from, and what the cut does to it, such as
the frame's retouch over a chip of bare gesso in one corner. One row credits Rough Linen to colormass
and Rico Cilliers under CC0 1.0. Read the module for the rest. A seal's surface cut makes no file of
its own: it names the scan's height and roughness maps and the width the source states for it in
millimetres, and `pnpm media:seal` bakes it into each seal's relief and finish maps at the seal's
size.

The credits page renders the same rows. `pnpm data:check` fails when a file under
`data/media/textures/` is credited by no cut, or when a credited file is missing.

### Adding one

1. Download the original into `tmp/textures/`, under the name its cut gives as `original`.
   `https://api.polyhaven.com/files/<asset>` lists every file of an asset and its address.
2. Copy the title and the authors exactly as the asset page prints them, and confirm the licence
   there.
3. Add the work and its cut to `TEXTURE_WORKS`, then run `pnpm media:textures`, or `pnpm media:seal`
   for a seal's surface. A frame's size, slice and exposure are its row of `FRAMES` in
   `src/lib/art-effect/presets.ts`, and the tool refuses a bake whose moulding does not measure that
   slice.
4. Read the result on `pnpm dev` in both themes before it ships.

## Heraldry

The arms of a sub-species are composed in [Armoria](https://azgaar.github.io/Armoria/), by Azgaar,
whose code is under the MIT licence; the heater shield outline and the partition lines are its own.
Its charges come from several sources under several licences, which it records in the `<metadata>` of
each charge file and on its License screen. The four charges of the arms of Victoria are WappenWiki
drawings under CC BY-NC-SA 3.0, which Aubaine's CC BY-NC-SA 4.0 may carry, since 3.0 lets an
adaptation be shared under a later version with the same elements.

A composition is one SVG in `data/media/arms/`: the shield, the tinctures as the enamel fills, and
each charge as a `<g class="charge">` that keeps the `source` and `license` Armoria gives it.
`ARMS_WORKS` in [`src/lib/rights/attribution.ts`](../src/lib/rights/attribution.ts) names Armoria and
every charge, and `ARMS_COMPOSITIONS` says which works each composition uses. `pnpm media:arms`
(`tools/media/arms.ts`) bakes each composition into its maps and its still, beside it in
`data/media/arms/`; the page imports them as hashed files, never through Astro's image pipeline,
which would write Aubaine's claim into an adaptation of someone else's drawing.

The credits page renders the Heraldry table from `ARMS_WORKS`, and says how the arms use the charges,
as CC BY-NC-SA 3.0 asks of an adaptation. `pnpm data:check` fails when a file in `data/media/arms/` is
credited by no composition, when a composition draws a charge it does not credit or credits one it
does not draw, when a credited licence differs from the one the charge carries, or when a work is
under a licence other than MIT or CC BY-NC-SA 3.0.

### Adding one

1. Compose the arms in Armoria, and export them as SVG, or take the recipe Armoria writes into the
   PNG it downloads and open it with `?coa=` to export the same arms. Keep that PNG beside the
   composition as its `source`, as `victoria-armoria.png` is kept.
2. Check the License screen: a charge under a licence that forbids a non-commercial adaptation,
   such as the Free Art Licence, cannot ship in a CC BY-NC-SA shield. Pick another charge.
3. Keep the export's charges, shield clip and division clip, and write the composition as
   `victoria.svg` is written: a `field` rect, a `division` group, a `charges` group of `<use>`, an
   `outline` path, and the enamel colours as fills.
4. Add the works and the composition to `ARMS_WORKS` and `ARMS_COMPOSITIONS`, run
   `pnpm media:arms`, and read the result on `pnpm dev` in both themes before it ships.

