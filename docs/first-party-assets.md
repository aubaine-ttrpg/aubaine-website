# First party assets

Everything under `data/media/` that is not an icon or a font is original Aubaine work, and every one
of those files says so in its own bytes. The licences that come the other way are recorded in
[third-party-assets.md](third-party-assets.md); this file is the other side of that line. The
decision behind it is [adr/0011-assets-carry-their-own-rights.md](adr/0011-assets-carry-their-own-rights.md).

## What the claim says

| Field | Value |
| --- | --- |
| `Title` | `<le titre> · Aubaine`, when a caption gives one |
| `Author` | `Aubaine` |
| `Description` | one French sentence, when a caption gives one |
| `Copyright` | `© 2026 Aubaine. Sous licence CC BY-NC-SA 4.0.` |
| `Software` | `Aubaine Catalyst` |
| `Source` | `https://aubaine.io` |

Four of the six are the same on every file in the repository. `Title` and `Description` come from
`data/media-captions.json`, and a file with no entry there carries the other four and nothing else.
`src/lib/rights/claim.ts` composes every one of those strings and is the only place any of them
exist.

The same values are repeated in an XMP packet under six namespaces: `dc` for the title, creator,
description, subject and rights; `xmp` for `CreatorTool`; `xmpRights` for `Marked`, `WebStatement`
and `UsageTerms`; `photoshop` for `Credit` and `Source`; `plus` for `LicensorName` and `LicensorURL`;
and `cc` for `license`, `attributionName` and `attributionURL`. Two spellings exist because two
populations of software read two different things: `exiftool`, Finder and Explorer read the text
chunks and the EXIF block, while a picture desk, a CMS and Lightroom read XMP. The packet is 1727
bytes with the licence alone and 2014 bytes with a caption.

`dc:subject` is the keyword list. `Aubaine`, `jeu de rôle` and `illustration` are written on every
file; `data/media-captions.json` supplies only what is specific to one picture, such as `arme` and
`objet` on `items/dague-1_1-og.png`.

Where each format carries it:

| Format | XMP | EXIF | Native |
| --- | --- | --- | --- |
| PNG | `iTXt` keyed `XML:com.adobe.xmp` | no | `tEXt` for ASCII values, `iTXt` for the rest |
| JPEG | APP1, the XMP namespace | APP1, `Exif\0\0` | no |
| WebP | an `XMP ` chunk | an `EXIF` chunk | no |
| SVG | a `<metadata>` element | no | no |
| PDF | a `/Metadata` stream on `/Root` | no | `/Info` Title, Author, Keywords, Creator |
| MP4 | no | no | `title`, `artist`, `copyright`, `comment`, `date` |

PNG defines `tEXt` as ISO-8859-1, so an accented value there reads back as `dorÃ©e`. Anything that is
not plain ASCII goes into an uncompressed `iTXt`, which is UTF-8 by definition.

## What is stamped, what is only stripped, what is left alone

| Path | What happens | Written by |
| --- | --- | --- |
| `art/`, `items/`, `skills/`, `unassigned/` | stripped, then stamped | `pnpm media:stamp` |
| `video/` | stripped, then stamped through ffmpeg | `pnpm media:stamp` |
| the three logo SVGs and `qr-aubaine.png` | stamped | `pnpm media:stamp` |
| `flags/` | stripped, nothing written | `pnpm media:stamp` |
| `fonts/`, `icons/` | untouched | nothing: they are not ours |
| `dist/_astro/*.webp`, `*.jpeg`, `*.png` | stamped as they are emitted | `src/lib/rights/image-service.ts` |
| `pdf/` | stamped as each booklet is rendered | `tools/pdf/render.ts` |

`src/lib/rights/ownership.ts` holds those five tables, and `pnpm data:check` fails when a directory
appears under `data/media/` that none of them names. That is what keeps the claim honest as the tree
grows: a new folder is a decision, not an oversight.

The two flags are stripped and never stamped. A French tricolour and a Union Jack are not original
Aubaine work, and writing `© Aubaine` onto one would be the same false claim that keeps the fonts and
the icons out of scope.

## Why the foreign manifest is removed

Sixty of the sixty nine PNGs under `data/media/` arrived carrying a `caBX` chunk: a signed C2PA
manifest written by the service that produced the file, at 21 to 28 KB each and about 1.4 MB in
total. Both flags carried the same block as base64, and `fr.svg` was 7997 bytes for a tricolour that
draws in 261.

It is removed for three reasons, all checkable. It is signed against bytes that stop existing the
moment anything edits the file, and every picture the site serves is an edit, because the derivatives
in `dist/_astro/` are re-encodes. Nobody read it, because those same derivatives carried no metadata
at all, so the manifest never reached a browser. And the claim the repository actually needs to make,
who owns this and under what terms, was not in it.

The reasoning is the one [third-party-assets.md](third-party-assets.md) already gives for the icons,
applied to the pictures. Removing the block cost no pixels: a stripped file decodes to the same
raster, which `tests/data/integrity.test.ts` asserts for WebP by comparing the decode before and
after.

Removal is one way. The signature cannot be regenerated here, so a stripped manifest is gone for
good. The pixels are not.

## The captions are authored, never invented

`data/media-captions.json` maps a path under `data/media/` to a title, a description and its
keywords, and is validated by `mediaCaptions` in `src/lib/game/schema.ts`.

```json
{
  "captions": [
    {
      "file": "items/dague-1_1-og.png",
      "title": "Dague",
      "description": "Dague à lame courbe et garde dorée, sur fond bleu.",
      "keywords": ["arme", "objet"]
    }
  ]
}
```

An entry is optional, which is what keeps adding a picture a one file job. It is a place to write a
description, not a register to sign.

A description is written by looking at the picture. Not at the filename, not at the item that
references it, not at the tree it sits under. Eighteen pictures serve thirty eight items, so the item
is the wrong place to look even when there is one, and `.claude/rules/content/authority.md` forbids
inventing a credit. The same rule governs a caption.

Nine item pictures seeded the file. Their sentences existed nowhere else in the repository, which is
why they were read out of the PNGs rather than rewritten, and they are the register to match: one
clause for the subject, one for the background. `Revolver à barillet d'acier et ornements dorés, sur
fond de flammes.`

The tool protects them. When a picture carries a description that `data/media-captions.json` does
not, the run refuses and names `pnpm media:stamp --adopt` as the fix, which reads the embedded title,
description and keywords into the sidecar without overwriting anything already there. A hand edited
file can never be silently flattened.

There is no English overlay. A file has one set of bytes, both locales are served the same file, and
the description is French like the rest of `data/`.

## The derivative is the copy that leaves

Nobody outside this repository holds a master. `src/lib/media.ts` hands every picture to Astro's
image pipeline and the build writes WebP and JPEG into `dist/_astro/`. Sharp drops metadata it is not
told to keep, so those files carried nothing at all.

`astro.config.mjs` names a service at `src/lib/rights/image-service.ts` that wraps Astro's sharp
service and writes the licence block onto what it emits, at roughly 1.8 KB a file. It writes the
block onto the encoded container rather than running a second sharp pass, so no derivative is
re-encoded and no lossy file gains a second generation.

It writes the licence, never the caption. The service receives an already hashed `/_astro/...` path,
so mapping back to a master would be guesswork, and a caption edit would churn the whole build for a
string no page prints. Editorial captions never change build output, and that is worth more than a
description on a thumbnail.

The booklets are the same argument in another format. Chromium wrote `/Creator (Chromium)` and
`/Producer (Skia/PDF m153)` with no author and no rights, and a booklet is the artefact most likely
to be passed around a table. `tools/pdf/render.ts` stamps the bytes Chromium returns before they
reach disk, so a booklet is owned the instant the file exists. `/Creator` becomes `Aubaine Catalyst`;
`/Producer` is left alone, because it names the library that wrote the bytes and that is true.

## How to check it

```
pnpm media:stamp:check
pnpm data:check
```

`pnpm media:stamp:check` reports what is not owned and writes nothing. `pnpm data:check` is the gate:
it fails when an owned file is missing the claim or carries a stale one, when anything still carries
a foreign marker, when a caption names a file that is not on disk, when a picture describes itself
off the record, or when a directory appears that no table declares. The fix for all of them is
`pnpm media:stamp`, except for a booklet, which is `pnpm pdf --force`.
