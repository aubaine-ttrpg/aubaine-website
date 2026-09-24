# ADR: An asset carries its own rights, in one vocabulary, and nobody else's provenance

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-22
**Deciders:** Kori
**Scope:** How a first party file under `data/media/` declares its author and its licence in its own
bytes, what is removed from it, and how the same claim reaches the derivatives the build emits and
the booklets `pnpm pdf` renders. Does not cover how a picture is named, which is 0009, nor the icon
and font terms, which are upstream licences recorded in `docs/third-party-assets.md`.

---

## Context

`LICENSE` is MIT for the code and `LICENSE-CONTENT` is CC BY-NC-SA 4.0 for everything under `data/`,
and `src/lib/i18n/strings.ts` prints `© Aubaine` with that licence in the footer of every page. None
of that travels with a file. A picture saved from the site, a booklet mailed to a table, a master
copied out of a backup: each one left the repository carrying no claim at all, or carrying somebody
else's.

Somebody else's was not hypothetical. Sixty of the sixty nine PNGs under `data/media/art/`,
`data/media/items/` and `data/media/unassigned/` carried a `caBX` chunk, a signed C2PA manifest from
the service that produced the file, at 21 to 28 KB each and about 1.4 MB in total. Both flags carried
the same block as base64: `data/media/flags/fr.svg` was 7997 bytes, of which 7736 were that block and
261 were the tricolour. All the booklets in `data/media/pdf/` said `/Creator (Chromium)` and
`/Producer (Skia/PDF m153)` with no author and no rights. The three JPEGs carried only a JFIF header
and the one MP4 only encoder tags.

The file the public actually holds carried least of all. Nobody fetches a master: the build emits
WebP and JPEG through Astro's image pipeline, sharp drops what it is not told to keep, and every one
of those derivatives was anonymous.

Meanwhile nine item pictures already carried a full Aubaine block, written by hand, whose French
descriptions existed nowhere else in the repository.

---

## Decision 1: the rights live in the file, written by one tool

### Decision

- Every first party picture under `data/media/art/`, `data/media/items/`, `data/media/skills/` and
  `data/media/unassigned/`, the three logo SVGs, `qr-aubaine.png` and the hero loop carry `Author`,
  `Copyright`, `Software` and `Source`, plus `Title` and `Description` when one is authored, plus an
  XMP packet repeating them under `dc`, `xmp`, `xmpRights`, `photoshop`, `plus` and `cc`.
- `Author` is `Aubaine`, `Copyright` is `© 2026 Aubaine. Sous licence CC BY-NC-SA 4.0.`, `Software`
  is `Aubaine Catalyst`, `Source` is `https://aubaine.io`. `src/lib/rights/claim.ts` composes all of
  them and is the only place any of those strings exist.
- `tools/media/stamp.ts` is the only writer, run as `pnpm media:stamp`. It never touches pixels.
- `src/lib/rights/ownership.ts` holds the five tables that say which directories are owned, which are
  only stripped, which are foreign and which are generated. It has no side effects, so the tests read
  the same tables the tool does.
- `data/media/fonts/` and `data/media/icons/` are never opened. Their terms are upstream and are
  recorded in `docs/third-party-assets.md`.

### Rationale

- The claim has to travel with the bytes, because the bytes are what leaves. `LICENSE-CONTENT` and
  the footer string in `src/lib/i18n/strings.ts` are both true and both stay behind.
- The vocabulary is not invented. The nine files already stamped by hand define the shape, and the
  tool reproduces what was already in the repository rather than designing something new.
- Both spellings are kept because two populations of software read two different things. `exiftool`
  and ordinary viewers read the PNG text chunks and the EXIF block; a picture desk, a CMS and
  Lightroom read XMP. The packet is 1727 bytes with the licence alone and 2014 bytes with a caption,
  measured on `items/dague-1_1-og.png`.
- One writer, not a convention. Nine files took a human; seventy nine would not survive being done by
  hand, and the twelfth contributor would invent a twelfth spelling of the copyright line.
- Enforcement goes in `tests/data/integrity.test.ts` rather than the schema, because the invariant is
  about bytes rather than about a field, which is what `.claude/rules/content/schema-contract.md`
  asks for. The test asserts byte equality against what the writer would produce right now, so "is it
  stamped" and "is it current" are one question.

### Alternatives considered

- **Leave the files plain and rely on `LICENSE-CONTENT`**: the smallest change, and what the
  repository did until now. Rejected because the licence file is the one artefact that never
  accompanies a copied picture.
- **A JSON ledger of rights, no bytes touched**: this is `content/media/library.yaml` again, and 0009
  records what happened to it. A ledger and a file drift the moment one moves without the other.
- **XMP only, no text chunks and no EXIF**: fewer bytes and standards conformant. Rejected because
  Finder, Explorer and stock tools read `Copyright` and `Artist` out of EXIF and ignore XMP entirely.
- **Stamp at build time only, leaving the masters plain**: rejected because the master is the file a
  contributor copies, a backup holds and a second repository imports.

### Caveats

- PNG defines `tEXt` as ISO-8859-1. The nine hand stamped files held UTF-8 in it, so a conformant
  reader showed `Dague Â· Aubaine` and `dorÃ©e`. The writer puts ASCII values in `tEXt` and everything
  else in an uncompressed `iTXt`, and those nine files were rewritten once to fix it.
- Those files also keyed their XMP chunk `XMP`. The XMP specification says `XML:com.adobe.xmp`, which
  is what sharp and exiftool look for, and the writer uses it.
- `YEAR` in `src/lib/rights/claim.ts` is a constant. Deriving it from the clock would restamp every
  master each January, break idempotency across a year boundary and rename every booklet with it.

---

## Decision 2: foreign provenance is removed, and the flags are claimed by nobody

### Decision

- `pnpm media:stamp` deletes the `caBX` chunk from every picture it touches, the APP1, APP11 and
  APP13 metadata segments from every JPEG, and the `<metadata>` block and the dead `xmlns:c2pa`
  attribute from `data/media/flags/fr.svg` and `gb.svg`.
- The two flags are stripped and not stamped. They are interface shapes, like the icons.
- `FOREIGN_PROVENANCE` in `src/lib/rights/ownership.ts` names the six markers the test refuses, and
  the test reads every owned, stripped and generated file looking for them.
- The Aubaine block asserts authorship, licence and subject. It makes no claim about how a file was
  produced beyond `Software`, which names the tool that wrote the metadata.

### Rationale

- The manifest is signed against bytes that stop existing at the first edit, and every picture the
  site serves is an edit: the WebP and JPEG files in `dist/_astro/` are re-encodes. No manifest on any
  master was valid on any file a reader received.
- Nothing read it. Those derivatives carried no metadata at all before this change, so the block
  never reached a browser from this site.
- It was expensive for what it said: 21 to 28 KB per file, about 1.4 MB across sixty files, and 7736
  of the 7997 bytes of a flag whose drawing is 261 bytes. That ratio is the one
  `docs/third-party-assets.md` already cites when it records removing eight to eleven kilobytes of
  base64 from the icons for a few hundred bytes of path.
- Removing it costs no pixels. Every stripped file decodes to the same raster it did before, which is
  asserted for WebP in `tests/data/integrity.test.ts` and was checked against ImageMagick's signature
  for PNG.
- A French tricolour and a Union Jack are not original Aubaine work. Writing `© Aubaine` onto one
  would be the same false claim that correctly kept the fonts and the icons out of scope. `fr.svg` is
  now 223 bytes and `gb.svg` 613 bytes, and the test holds both under a kilobyte so a tool cannot
  quietly put the block back.

### Alternatives considered

- **Keep the manifest beside the Aubaine block**: two claims in one file, one of which is
  unverifiable here and invalid on every derivative. Reopen if the repository ever holds a signing
  certificate of its own, at which point the right move is to write a manifest that describes
  Aubaine's work rather than to preserve one that does not.
- **Strip the derivatives, keep the masters**: half a rule, and it keeps the weight in the artefact
  that gets backed up and copied.
- **Leave the flags alone because they are small**: `fr.svg` was thirty times the size of the drawing
  it contained.

### Caveats

- Removal is one way. The signature cannot be regenerated here, so a stripped manifest is gone. The
  pixels are recoverable from any copy; the manifest is not.
- Stripping a provenance record does not change how a file was produced, and a platform that scans an
  upload may reach its own conclusion. The claim this repository makes is about authorship and
  licence, which is the claim it is entitled to make.

---

## Decision 3: the caption is authored in `data/media-captions.json`, and never invented

### Decision

- `data/media-captions.json` maps a path under `data/media/` to a `title`, an optional `description`
  and optional `keywords`, validated by `mediaCaptions` in `src/lib/codex/schema.ts`.
- An entry is optional. A file with none is still stamped and simply carries no title and no
  description.
- `keywords` holds only the picture specific terms. `Aubaine`, `jeu de rôle` and `illustration` are
  constant and written by the tool.
- The tool refuses to run when a picture carries a description the file does not have, and names
  `pnpm media:stamp --adopt` as the fix. That is a permanent invariant, not a migration flag.
- There is no `.en.json` overlay.

### Rationale

- This is the case 0009 left open when it rejected a sidecar ledger: a picture needing metadata that
  a filename cannot hold. `Dague à lame courbe et garde dorée, sur fond bleu.` cannot go in a
  filename.
- It is not the ledger 0009 rejected, on the property that made the ledger fail. After stamping, the
  truth is in the file's bytes; the sidecar is the source text the stamp is written from; and
  `tests/data/integrity.test.ts` compares the two, so they cannot drift. `library.yaml` was checked by
  nothing.
- Optional, so `docs/runbooks/README.md` keeps its promise that there is no registry to register in.
  Adding a picture is still one file and one command.
- The caption cannot live on the item that shows the picture. Eighteen pictures serve thirty eight
  items, so it would land on whichever slug referenced it first, and
  `.claude/rules/content/authority.md` states that no entry under `data/` carries attribution.
- Never invented, for the reason that rule forbids inventing a credit. The nine seeds were read out
  of the PNGs rather than rewritten, because they were the only copy of that text.
- One locale, because a file has one set of bytes and both locales are served the same file. French
  is canonical here as everywhere else, which is 0003.

### Alternatives considered

- **Derive a caption from the filename or from the referencing entry**: `dague-1_1-og.png` gives
  "Dague", which is a name and not a description, and the item's prose describes a weapon's rules
  rather than a frame. Rejected as invention.
- **Two files, following the overlay idiom of 0003**: the overlay idiom exists for pages rendered per
  locale, and a PNG is not rendered. Reopen if `dc:description` ever needs a second `rdf:li` with
  `xml:lang="en"`, which XMP allows and a PNG text chunk does not.
- **Mandatory entries**: rejected on the runbook promise above. The half that matters legally is
  constant and is written whether or not anybody writes prose.

---

## Decision 4: what the master carries, the derivative and the booklet carry

### Decision

- `astro.config.mjs` names an image service at `src/lib/rights/image-service.ts`. It wraps Astro's
  sharp service, and writes the licence block onto every WebP, JPEG and PNG the build emits.
- The service writes the licence block only, never the caption.
- `tools/pdf/render.ts` calls `stampPdf` on the bytes Chromium returns, before the atomic write, so a
  booklet is stamped the instant the file exists. `/Creator` becomes `Aubaine Catalyst` and
  `/Producer (Skia/PDF m153)` is left alone.
- `src/lib/booklet/fingerprint.ts` hashes the stripped bytes of a picture, not the file as it sits on
  disk.

### Rationale

- The derivative is the only copy anyone outside this repository holds, and it held nothing. All 241
  raster files in `dist/_astro/` now carry the claim, at roughly 1.8 KB each.
- A booklet is the most portable artefact the project produces and the one most likely to be passed
  around a table.
- The block is written onto the encoded container rather than through a second sharp pass, so no
  derivative is re-encoded and no lossy file gains a second generation. `tests/data/integrity.test.ts`
  decodes a stamped WebP back to raw pixels and compares, because a malformed VP8X header would break
  every image on the site at once.
- The caption is left out of derivatives because the service receives an already hashed
  `/_astro/...` path and mapping it back to a master is fragile, and because it would make `dist/`
  churn whenever a French caption gains a comma. The invariant worth having is that editorial
  captions never change build output.
- `contentHash` should mean what a booklet renders. Hashing the file as it sits made a caption edit
  rename every booklet that drew the picture, for a string no booklet prints. Hashing the stripped
  bytes costs one rename, in this change, and none afterwards.

### Alternatives considered

- **Serve the masters**: a banner is around 2.5 MB.
- **Accept plain derivatives**: today's behaviour before this change, which means the only copy the
  public holds is the only copy with no claim on it.
- **A second sharp pass with `withXmp` and `withExif`**: one line instead of a WebP writer, and it
  re-encodes every derivative. Rejected as a silent visual regression with no test that would catch
  it.

### Caveats

- The service depends on the default export shape of `astro/assets/services/sharp`, and on
  `validateOptions` running before the cache key is computed. It reads
  `baseService.propertiesToHash` rather than copying Astro's list, and appends one key derived from
  the rendered XMP, so a change to the claim invalidates every cached derivative. Re-read this on the
  next Astro major.
- An output format with no writer throws rather than passing through unstamped. Today the build emits
  WebP, JPEG, PNG and SVG passthrough; an `avif` would need a writer.
- The print build embeds stamped JPEG plates, so a booklet carries the licence block once per plate
  in addition to the document metadata stream. Harmless, and it means a plate extracted from a PDF
  still names its owner. Those embedded packets are French in both locales, because a derivative is
  one file serving both.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| the vocabulary | every string the claim is made of | `src/lib/rights/claim.ts` |
| the tables | what is owned, stripped, foreign, generated | `src/lib/rights/ownership.ts` |
| the writers | one module per container format | `src/lib/rights/{png,jpeg,webp,svg,pdf,mp4}.ts` |
| `pnpm media:stamp` | the only writer of masters, idempotent | `tools/media/stamp.ts` |
| `mediaCaptions` | the authored title, description and keywords | `src/lib/codex/schema.ts` |
| the claim on a derivative | the copy the public holds | `src/lib/rights/image-service.ts` |
| the claim on a booklet | the copy that gets passed around | `tools/pdf/render.ts` |
| the gate | stamped, current, and no foreign provenance | `tests/data/integrity.test.ts` |
