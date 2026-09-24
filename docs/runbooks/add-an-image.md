# Add an image

Produces the plate behind a hero, the portrait on a card, the picture on an item, the glyph on a state pastille, the loop behind the home hero, or a downloadable PDF.

## Name the file first

Every picture under `data/media/art/` and `data/media/items/`, and every video under `data/media/video/`, is named the same way. The schema rejects any other picture name, and `pnpm data:check` rejects any other video name.

```
<nom>-<rapport>-<état>.<extension>
```

| Part | What it is | Values in use |
| --- | --- | --- |
| `<nom>` | lowercase, hyphens, no accents | `berserker`, `bibliotheque-des-oracles` |
| `<rapport>` | the aspect ratio in lowest terms, `_` instead of `:` | `16_9` for a banner or a video, `3_4` for a cover, `1_1` for an item |
| `<état>` | what has been done to the file since it left the generator | `og`, `cleaned`, `upscaled_2`, `upscaled_4`, and `compressed` on a video |
| `<extension>` | `png` or `jpg` for a picture, `mp4` for a video. Nothing else is picked up | |

`og` means the file has never been retouched, so it never combines with another state. A file that has been enlarged is `upscaled_2` or `upscaled_4`, not `og-upscaled_2`. A file that has been run through noise removal is `cleaned`. A video that has been re-encoded to a lower bitrate is `compressed`, and that state exists for video only.

```
berserker-16_9-og.png            1672 x 941    a banner, untouched
berserker-3_4-og.png             1086 x 1448   the cover of the same plate
bravado-16_9-upscaled_2.jpg      3344 x 1882   the 2x enlargement of bravado-16_9-og.png
dague-1_1-og.png                 1254 x 1254   an item picture
le-bastion-16_9-compressed.mp4   1280 x 720    the home hero loop, re-encoded
```

The ratio has to describe the real pixels. `pnpm data:check` opens every picture and fails if it does not, so a picture cannot be mislabelled by accident. It does not open a video: `sharp` cannot read an mp4 and `ffprobe` is not a dependency, so a video's ratio is checked as a name and trusted.

Keeping the original beside a retouched version is the point of the state part. `bravado-16_9-og.png` stays in the repo even though every page draws the enlargement.

## Where the file goes

| Folder | Holds | Format |
| --- | --- | --- |
| `data/media/art/` | covers, banners, hero and social images | `.png`, `.jpg` |
| `data/media/items/` | item pictures | `.png`, `.jpg` |
| `data/media/icons/mdi/` | Iconify `mdi:` icons | `.svg`, named after the part following the colon |
| `data/media/icons/game-icons/` | Iconify `game-icons:` icons | `.svg`, same rule |
| `data/media/pdf/` | the booklets `pnpm pdf` renders | `.pdf`, named by the release, never by hand |
| `data/media/unassigned/` | pictures kept but not yet placed | named by the convention, read by nothing |
| `data/media/items/placeholder-1_1-og.png`, `data/media/art/placeholder-3_4-og.png`, `data/media/art/placeholder-16_9-og.png` | the default plate for each ratio | named by `src/lib/media.ts`, not by a field |
| `data/media/video/` | the loop behind the home hero | `.mp4`, named by the convention, read by `src/components/views/Home.astro` |
| `data/media/flags/`, `data/media/fonts/` | interface assets | as is, used by the shell rather than by content |

A picture with no field naming it goes in `data/media/unassigned/`, not in `art/`. `src/lib/media.ts` globs `data/media/art/` eagerly, and Astro emits every asset the glob imports, so an unreferenced master ships to the browser at full size even though no page shows it. Five illustrations added 12.3 MB to `dist/` that way. To place one, move it into `art/` and name it in a `cover` or a `banner` in the same change.

Covers and banners share `data/media/art/`. The ratio in the name says which one a file is, so a second folder would only repeat it.

## Stamp it before you commit it

A picture in this repository says who owns it, in its own bytes. `pnpm media:stamp` writes that claim into every file under `data/media/art/`, `data/media/items/`, `data/media/skills/` and `data/media/unassigned/`, into the logos, the QR and the hero loop, and removes whatever provenance the generator left behind. Run it after you drop a file in, before you commit.

```
pnpm media:stamp
pnpm data:check
```

Four of the six fields are the same on every file: `Author` is `Aubaine`, `Copyright` is `© 2026 Aubaine. Sous licence CC BY-NC-SA 4.0.`, `Software` is `Aubaine Catalyst`, `Source` is `https://aubaine.io`. `Title` and `Description` come from `data/media-captions.json` and are absent until you write them. The same values are repeated in an XMP packet, because `exiftool` and Finder read one thing and a picture desk reads another. [../first-party-assets.md](../first-party-assets.md) holds the full vocabulary.

Running it twice changes nothing. It rewrites metadata and never touches a pixel, so a stamped file decodes to the same raster it did before; only its size and its hash move. The first run took 79 files and removed 1367 KB, because sixty of the sixty nine PNGs arrived carrying 21 to 28 KB of provenance from the service that produced them, and `data/media/flags/fr.svg` was 7997 bytes for a tricolour that draws in 261.

`data/media/icons/` and `data/media/fonts/` are third party and are never stamped. Writing an Aubaine copyright into a Pictogrammers file would be a false claim, and the tables in `src/lib/rights/ownership.ts` are what keep that true. The flags are stripped and claimed by nobody, for the same reason. Add a new folder under `data/media/` and `pnpm data:check` fails until one of those tables names it.

## Say what the picture is

A picture with nothing written about it is still stamped. It simply carries no `Title` and no `Description`. To give it one, add an entry to `data/media-captions.json`, keyed by the path under `data/media/`.

```json
{
  "file": "items/dague-1_1-og.png",
  "title": "Dague",
  "description": "Dague à lame courbe et garde dorée, sur fond bleu.",
  "keywords": ["arme", "objet"]
}
```

`title` is the picture's name and the tool writes `Dague · Aubaine` from it, so do not write the studio yourself. `description` is one French sentence saying what is in the frame, written for someone who cannot see it. `keywords` holds only what is specific to this picture: `Aubaine`, `jeu de rôle` and `illustration` go on every file and are not repeated here.

Write the description from the picture. Not from the filename, not from the item that references it, not from the tree it sits under. Eighteen pictures serve thirty eight items, so the item is the wrong place to look even when there is one, and its prose describes a weapon's rules rather than a frame. A sentence that does not match the picture is worse than the silence, and silence is what an absent entry produces.

The nine item pictures stamped by hand seeded the file, and their sentences are the register to match: one clause for the subject, one for the background. `Revolver à barillet d'acier et ornements dorés, sur fond de flammes.`

There is no English overlay. A file has one set of bytes, both locales are served the same file, and the description is French like the rest of `data/`.

If you edit a picture's metadata by hand, `pnpm media:stamp` refuses to run rather than flatten what you wrote, and tells you to run `pnpm media:stamp --adopt`, which pulls the embedded title, description and keywords into the sidecar without overwriting anything already there.

## How each one is referenced

| Where | Field | What you write |
| --- | --- | --- |
| `data/skill-trees/<id>.json` | `cover` | Couverture au rapport 3:4. Example: `"cover": "berserker-3_4-og.png"` |
| `data/skill-trees/<id>.json` | `banner` | Bannière au rapport 16:9. Example: `"banner": "berserker-16_9-og.png"` |
| `data/books/<id>/book.json` | `cover`, `banner` | The same two fields, the same two ratios |
| `data/equipment/catalogue.json` | `cover`, `banner`, `backCover` | The same fields again. `cover` and `backCover` are the two faces of the equipment booklet, `banner` is the plate behind the hero at `/fr/equipement` |
| `data/equipment/items/<slug>.json` | `art` | Illustration au rapport 1:1. Example: `"art": "dague-1_1-og.png"` |
| `data/states/<key>.json` | `icon` | Nom Iconify. Example: `"icon": "mdi:fire"` needs `data/media/icons/mdi/fire.svg` |
| a booklet | no field | `pnpm pdf` renders it and registers it in `data/pdf/releases.json` |

Several items may name the same picture, and eighteen pictures currently serve thirty eight items. Name the file after whichever piece it draws, not after the slug that happens to reference it first.

## A complete example

`data/skill-trees/berserker.json` names both plates in its head:

```json
{
  "id": "berserker",
  "name": "Berserker",
  "treeType": "archetype",
  "size": 16,
  "cover": "berserker-3_4-og.png",
  "banner": "berserker-16_9-og.png",
  "placements": [
```

`cover` is the portrait on the card at `/fr/arbres`. `banner` is the wide plate behind the hero at `/fr/arbre/berserker` and the source of the social image. The hero also shows a booklet download button, with no field naming it: `pnpm pdf` renders one booklet per tree per locale and `data/pdf/releases.json` is what the page reads.

`data/states/combustion.json` names its icon:

```json
{
  "key": "combustion",
  "name": "Combustion",
  "kind": "buff",
  "icon": "mdi:fire",
  "stacks": 5,
  "description": "Combustion s'accumule sur vous jusqu'à 5.\n\nLorsque vous effectuez un Jet de dégâts qui inflige des dégâts de Feu, ajoutez 1 dégât par Combustion que vous portez."
}
```

That needs `data/media/icons/mdi/fire.svg` to exist.

Icons come from the Iconify API and are committed as plain SVG. Only `mdi` and `game-icons` are accepted by the schema, and both carry an upstream licence recorded in [../third-party-assets.md](../third-party-assets.md).

## Replacing the home hero loop

The home hero paints a plate and cross fades a silent 16:9 loop over it. No field names either one; both are written in `src/components/views/Home.astro`, and the plate has to be the frame the loop starts from or the fade shows two different pictures.

Re-encode the render before committing it. A generator hands back several megabytes and an audio track the hero can never play, and the folder is served as is. About 1.2 MB for eight seconds is the budget the current loop sets.

```
ffmpeg -i <render>.mp4 -c:v libx264 -b:v 1200k -pass 1 -preset slow -pix_fmt yuv420p -an -f mp4 /dev/null
ffmpeg -i <render>.mp4 -c:v libx264 -b:v 1200k -pass 2 -preset slow -pix_fmt yuv420p -an -movflags +faststart data/media/video/<nom>-16_9-compressed.mp4
pnpm media:stamp
```

`-an` drops the audio, `+faststart` lets the browser start playing before the file has arrived, and the geometry and duration are left alone. Check the result with `ffprobe` and name the state `compressed`, never `og`.

`pnpm media:stamp` then remuxes the file through ffmpeg once more to write `title`, `artist`, `copyright`, `comment` and `date` into it, copying the stream rather than re-encoding it, so the picture that comes out is the one that went in. It is the one format the tool cannot write itself: MP4 atoms need a muxer, and ffmpeg is a tool you run here rather than a dependency of this repository.

Then point both halves of the hero at the new files in `src/components/views/Home.astro`, the `art` on the `Banner` and the URL on `data-hero-video`.

## What appears on the site

- `cover` on a tree: the portrait on the card at `/fr/arbres`. Absent, the card falls back to `banner`.
- `banner` on a tree: the plate behind the hero on `/fr/arbre/<id>`, and the social preview for that page and its nodes.
- `cover` and `banner` on a book: the card at `/fr/livres` and the hero on each chapter.
- `cover` and `backCover` on the catalogue: the two faces of the equipment booklet. `banner`: the plate behind the hero at `/fr/equipement`.
- `art` on an item: the picture on its card and in its detail panel at `/fr/equipement`.
- a skill has no picture field. Its detail panel at `/fr/competences` draws the 1:1 default plate.
- `icon` on a state: the glyph inside the pastille wherever `[[Nom]]` appears, and on the card at `/fr/etats`.
- a booklet in `data/media/pdf/`: the download button on the card at `/fr/livres` and in the hero of `/fr/arbre/<tree-id>`, resolved through `data/pdf/releases.json`.
- `data/media/video/<nom>-16_9-compressed.mp4`: the loop behind the home hero, over the plate it fades in from.

The social image is always cut from `banner`, never from `cover`. A 3:4 portrait letterboxed into 1200 by 630 is a bad card, so do not swap them.

## When no field names a picture

Nothing renders an empty frame. A slot with nothing named draws the default plate for its ratio, and `src/lib/media.ts` is the one place those three filenames live.

| Slot | Falls back to |
| --- | --- |
| a tree or book card, after `cover ?? banner` | `placeholder-3_4-og.png` for a tree, `placeholder-16_9-og.png` for a book |
| a tree or book hero | `placeholder-16_9-og.png` |
| an item or a skill in a detail panel | `placeholder-1_1-og.png` |

The social image is the exception. It is cut from `banner`, and a page with none falls back to `le-bastion-16_9-og.png` in `src/pages/[...path].astro`, the site's default social plate. A grey placeholder makes a worse preview than a real plate, and most pages with no `banner` are index pages that never had one.

A default is not a placement. It keeps the page whole while a plate is missing, and the field is still the thing to fill.

## How to check it

```
pnpm data:check
pnpm dev
```

`pnpm data:check` fails when a name breaks the convention, when the ratio in a name does not match the pixels, and when a tree, a book or an item points at a file that is not on disk. It also fails when an owned file carries no ownership claim or a stale one, when anything still carries a foreign provenance marker, when a caption names a file that is not there, and when a picture carries a description that `data/media-captions.json` does not. The fix for all four is `pnpm media:stamp`.

## Traps

**A missing state icon is not an error.** `Sans fichier correspondant dans data/media/icons/, l'état se rend sans icône.` Nothing warns you. Today all fifteen states resolve; keep it that way by adding the SVG in the same change as the state.

**Only `.png` and `.jpg` are picked up.** A `.webp` or an `.avif` in `data/media/art/` is invisible to the build and nothing warns you. Astro converts to WebP at build time anyway, so commit the master, not a converted copy.

**Book prose is cached across builds.** Chapters under `data/books/` are rendered through the term index at markdown compile time, and the result is stored in `node_modules/.astro/data-store.json`. Changing a state icon, a `data/meta/` entry (a definition included) or `RULE_TERMS` in `src/lib/game/build.ts` does not invalidate it, so a rebuilt site can keep serving the old glyph or the old tooltip text inside book chapters while every other page shows the new one. Delete `node_modules/.astro` and rebuild when you change anything the term index reads.

**A booklet is not a file you add.** `pnpm pdf` writes it, names it `<slug>-<locale>-v<version>_<styleHash>_<contentHash>.pdf`, and registers it in `data/pdf/releases.json`, which `bookletHref` in `src/lib/media.ts` reads. Dropping a PDF into `data/media/pdf/` by hand puts a file on disk that no page links and no manifest knows.

**Do not put media in `public/`.** `pnpm media:sync` wipes and rewrites `public/icons`, `public/flags`, `public/pdf`, `public/video` and `public/fonts` on every `pnpm dev` and every `pnpm build`. Anything you leave there by hand is deleted. `art` and `items` are not copied at all: they go through Astro's image pipeline instead.

**Masters are large and nothing shrinks the committed file.** A banner is around 2.5 MB and a cover around 2.6 MB. The build emits WebP derivatives, but the file you commit stays the size you committed. Import a picture only when a field will name it.

**Stamping a picture renames every booklet it appears in.** `src/lib/booklet/fingerprint.ts` hashes what a booklet draws into that booklet's `contentHash`, and `contentHash` is in the filename: `berserker-fr-v0.2.1_eb7edff5_f715aba6.pdf`. It hashes the picture with its metadata stripped, so a caption edit is free, but the pixels are not: a retouched plate renames every PDF that plate reaches. Run `pnpm pdf` in the same change.

**`pnpm pdf` adds, it never removes.** A rebuild writes the new filenames and leaves the old ones on disk, and the manifest keeps every entry it already had. Left alone, `data/media/pdf/` grows a second complete set under the same version, which the archive page then shows as one generation with two of everything. Delete the superseded files and reset `data/pdf/releases.json` in the same change, or bump `data/aubaine.json` first so the two sets are two versions.

**A derivative only carries what its master carried at build time.** The browser never fetches a master; it fetches a WebP from `dist/_astro/`, emitted through the service named in `astro.config.mjs`. Stamp before you build. A picture stamped after a build keeps shipping the unstamped derivative until the pipeline emits a new one.

**A description you did not write does not exist.** An entry missing from `data/media-captions.json` costs nothing: the file is still stamped, still carries its copyright, and simply has no description. An entry invented from the filename costs a wrong sentence in a file that leaves the repository and never comes back. Nine descriptions exist because somebody looked at nine pictures.
