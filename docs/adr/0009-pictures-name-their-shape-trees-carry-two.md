# ADR: A picture names its shape and its history, and a plate carries two of them

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-09-20
**Revised:** 2026-09-22, Decision 1 reaches `data/media/video/` and gains a fifth state, `compressed`
**Deciders:** Kori
**Scope:** How a file under `data/media/art/` and `data/media/items/` is named, and how a tree or a
book points at the pictures it needs. Does not cover the icon sets, which are Iconify names recorded
in `docs/third-party-assets.md`, nor the contract mechanism itself (0004).

---

## Context

The art for this wiki comes in three fixed shapes: a 16:9 plate at 1672 by 941, a 3:4 cover at 1086
by 1448, and a 1:1 item picture at 1254 by 1254.

Only the 16:9 plates were here to begin with, under bare names like `berserker.png`. A bare name
does not say what shape a file is, so nothing could tell a card's portrait from a hero's plate, and
the 3:4 covers had nowhere to go: the schema had a single `art` field. A bare name also does not say
whether a file is the one that came out of the generator. `data/media/art/` held both `bravado.png`
at 1672 by 941 and `bravado.jpg` at exactly twice that, with nothing to mark the second as an
enlargement of the first, and with `artImage()` globbing `*.png` only, so the enlargement was
unreachable.

---

## Decision 1: a picture's filename carries its aspect ratio and its edit state

### Decision

- Every file under `data/media/art/` and `data/media/items/` is named
  `<nom>-<rapport>-<état>.<extension>`.
- `<rapport>` is the aspect ratio in lowest terms with an underscore in place of the colon: `16_9`,
  `3_4`, `1_1`.
- `<état>` is exactly one of `og`, `cleaned`, `upscaled_2`, `upscaled_4`. `og` asserts that nothing
  has touched the file, so it never combines with another state.
- `<extension>` is `png` or `jpg`. `src/lib/media.ts` globs `*.{png,jpg}` for both folders.
- The rule is enforced by `mediaFile` in `src/lib/codex/schema.ts`, whose regex is
  `^[a-z0-9]+(?:-[a-z0-9]+)*-\d{1,2}_\d{1,2}-(?:og|cleaned|upscaled_[24])\.(?:png|jpg)$`, applied to
  `skillTree.cover`, `skillTree.banner`, `book.cover`, `book.banner` and `equipmentItem.art`.
- Covers and banners share `data/media/art/`. The name says which a file is, so a second folder
  would only repeat it.

### Rationale

- The two facts a name now carries are the two that cannot be recovered from a bare filename and
  that a reader needs before opening anything: what the file is for, and whether it is the original.
  Shape drives placement, and edit state drives which of several near-identical files to reference.
- Putting them in the name rather than in a sidecar ledger keeps them true. The previous repository
  kept them in `content/media/library.yaml`, and that ledger did not survive the move while the
  files did. A name travels with its file.
- The name can be checked against the file, so it cannot drift. `tests/data/integrity.test.ts` reads
  the header of every picture with `sharp`, already a devDependency in `package.json`, and fails when
  the declared ratio is more than one percent from the real pixels. Verified by introducing a
  deliberately mislabelled copy, which the test rejected with
  `declares 16_9 but is 1086x1448`.
- The tolerance is one percent rather than equality because the 16:9 masters are 1672 by 941, and
  exact 16:9 at that width would be 940.5. The ratio is a nominal description, not a pixel identity.
- `.claude/rules/content/schema-contract.md` says an invariant that cannot be expressed in the schema
  belongs in the integrity test. The shape of a name is expressible, so it is in the schema; the
  agreement between a name and the pixels behind it is not, so it is in the test.

### Alternatives considered

- **Keep bare names and record the shape in a field**: a `ratio` key beside every `art` value. This
  is the ledger again, one indirection shorter. It still lets the field and the file disagree, and
  it adds a key to three schemas to carry something the filename can hold for free. Reopen if a
  picture ever needs metadata that a filename genuinely cannot hold, such as a focal point for
  cropping.
- **A folder per shape**, `data/media/covers/` and `data/media/banners/`: the directory would carry
  the ratio and the name would only carry the state. Rejected because it needs a second glob in
  `src/lib/media.ts` and a second rule for authors, and it still cannot express the 1:1 item
  pictures without a third folder. Reopen if the site ever needs to treat covers and banners as
  genuinely different collections rather than two shapes of the same thing.
- **`-og-upscaled_2` for a derived file**, keeping `og` on everything that came from the generator
  and appending the edit: rejected because `og` then stops meaning anything checkable. The point of
  the token is that it is a claim about the bytes, and a file that has been enlarged is not the
  file that was generated.
- **4:5 for covers**, which is what the shape was assumed to be: rejected on the pixels. The masters
  are 1086 by 1448, which is exactly 3:4, and nothing in the source material is 4:5. Naming them
  `4_5` would have made the filename false, and re-cropping to make it true would have discarded
  90 pixels of art per cover.

### Caveats

- The convention does not apply to `data/media/icons/`, `data/media/pdf/`, `data/media/flags/`,
  `data/media/fonts/` or `data/media/video/`. An icon is named by its Iconify name, and a tree
  booklet is found at `data/media/pdf/<tree-id>.pdf` by filename alone. Two naming rules coexist in
  one tree, which is a real cost paid to keep the Iconify names resolvable.
- A file that no field names still costs bytes in the build. `src/lib/media.ts` globs
  `data/media/art/` eagerly, and Astro emits every asset the glob imports, so an unreferenced master
  ships at full size. Five imported illustrations did exactly that, adding 12.3 MB to `dist/` before
  they were moved to `data/media/unassigned/`, which nothing globs. Art with no field naming it
  belongs there until a field names it.
- `data/media/art/cuisinier-16_9-og.png` predates this record, is named by nothing, and still ships
  its 2.1 MB original. It is left alone here rather than deleted, and it is the reason
  `tests/data/integrity.test.ts` carries no orphan check yet: the check is right, but it fails on a
  file this record did not put there.

### Addendum (2026-09-22): the convention reaches video, and a re-encode is `compressed`

The caveat above lists `data/media/video/` among the folders the convention does not reach. That is
no longer true. A file there is now named `<nom>-<rapport>-<état>.mp4` on the same grammar, and the
one file in the folder is `le-bastion-16_9-compressed.mp4`. `data/media/icons/`, `data/media/pdf/`,
`data/media/flags/` and `data/media/fonts/` keep their exemption for the reasons the caveat gives.

The exemption was cheap while the folder held `le-bastion.mp4` and nothing else. The name said
neither what shape the clip was nor whether it was the render that came out of the generator, which
are the same two facts Decision 1 exists to carry, and the home hero cross fades the clip over a
`Banner` whose plate must match it. A bare name could not say that the two agreed.

`<état>` gains a fifth value, `compressed`, meaning re-encoded to a lower bitrate. The served clip
is not `og`: the generator produced 3 376 527 bps with an audio track, and
`data/media/video/le-bastion-16_9-compressed.mp4` is a transcode of it at 1 191 171 bytes with the
audio dropped, since the hero is `muted` and `aria-hidden`. `og` is a claim about the bytes, which
is the whole of the rationale above, so it cannot name a transcode. `cleaned` means noise removal
and is not overloaded to cover this. The four picture states are unchanged, and `compressed` is
accepted on video only, in `VIDEO_FILE` in `tests/data/integrity.test.ts`.

No master is kept beside the served clip, which is where video departs from pictures. Decision 1
keeps `bravado-16_9-og.png` next to its enlargement because `src/lib/media.ts` globs
`data/media/art/` and only what a field names is drawn. `data/media/video/` is copied whole into
`public/` by `tools/media/sync.ts`, which lists `video` in `PASSTHROUGH`, so a master left beside
the served file would be published and downloadable at full weight. The 3.4 MB render stays out of
the repository.

The rule is enforced by filename only. `tests/data/integrity.test.ts` checks the shape of the name
and that the ratio reads `16_9`, but it does not open the file to confirm it. `sharp` cannot read an
mp4, and `ffprobe` is not a dependency in `package.json`, so a check that shelled out to it would
pass or fail on what the machine happens to have installed. The agreement between a video's declared
ratio and its real pixels is therefore unverified by the suite, unlike every picture's. Reopen if a
second video arrives, or if a media probe becomes a dependency for another reason.

---

## Decision 2: a tree and a book carry `cover` and `banner`, not `art`

### Decision

- `skillTree.art` and `book.art` are renamed to `banner`, at 16:9.
- Both gain an optional `cover`, at 3:4.
- A card draws `cover ?? banner`. A hero draws `banner`. The social image is always cut from
  `banner`.
- `equipmentItem.art` keeps its name, at 1:1. An item has one picture and no second shape.

### Rationale

- The two fields exist because the two placements want opposite shapes. A card is a portrait and the
  3:4 plates were drawn for it; a hero is a wide band and the social image is 1200 by 630, built in
  `src/pages/[...path].astro`. One field cannot serve both without cropping one of them badly.
- `art` could not be kept as the name of one of them. Once a second picture field exists, `art`
  describes neither, and `.claude/rules/core/code-as-documentation.md` asks for domain names over
  vague ones. The rename cost fifteen tree files, three book files and eight call sites, all caught
  by `pnpm check` because both fields are typed.
- `cover` is optional because the shape does not exist for every plate. Nine of the fifteen trees
  have a 3:4 master in the previous repository: `berserker`, `draugar`, `druide`, `eau`, `feu`,
  `foudre`, `prestidigitateur`, `technomancien` and `terre`. The other six fall back to `banner`,
  which is what the card showed before, so the fallback is not a degraded state but the previous
  behaviour preserved.
- Verified end to end: `pnpm build` reports 433 pages, and the built `dist/fr/arbres/index.html`
  references a `3_4` derivative for those nine trees and a `16_9` one for the other six.

### Alternatives considered

- **One field, covers everywhere**: drop the 16:9 plates and let the 3:4 cover serve card, hero and
  social image. Rejected because a portrait cropped to a full width hero loses most of its subject,
  and letterboxed into 1200 by 630 it makes a poor social card. Reopen if the hero ever becomes a
  portrait band.
- **Keep `art` and add `cover` beside it**: the smallest diff, and the one that leaves `art` meaning
  "the wide one" by convention rather than by name. Rejected on the naming cost above. The field was
  being rewritten in every file anyway by Decision 1, so the marginal cost of also renaming it was a
  single line in the same script.
- **Derive the card portrait by cropping the banner at build time**: Astro can crop, and
  `getImage()` already does for the social image. Rejected because the 3:4 plates are separate
  artwork with different composition, not a crop of the 16:9 one. Reopen for the six trees that have
  no cover, where a crop would at least be a portrait.

### Caveats

- Five 3:4 illustrations were imported without a field naming them: `gladiator`, `hero`,
  `priestess`, `randome` and `rogue`. Assigning a picture to a tree is an editorial decision and not
  one this record makes. They sit in `data/media/unassigned/`, which no glob reads, until someone
  makes it. Moving one into `data/media/art/` and naming it in a `cover` is the whole of the work.
- Changing anything the term index reads, including `RULE_TERMS` in `src/lib/codex/build.ts`, does
  not invalidate rendered book prose, which is cached in `node_modules/.astro/data-store.json`. This
  was observed during this change: skill pages showed a new icon while book chapters kept the old
  one across a clean `dist` and `.astro` rebuild. The trap is recorded in
  `docs/runbooks/add-an-image.md`; it is a property of the content layer cache and not of this
  decision, but it bites hardest when media or icons change.

---

## Summary

| Item | Role | Where |
| ---- | ---- | ----- |
| `mediaFile` | the filename rule, applied to five fields | `src/lib/codex/schema.ts` |
| `cover`, `banner` | 3:4 and 16:9 on a tree and a book | `src/lib/codex/schema.ts` |
| `art` | 1:1 on an equipment item | `src/lib/codex/schema.ts` |
| ratio against pixels | the check that keeps a name honest | `tests/data/integrity.test.ts` |
| `artImage`, `itemImage` | resolve a filename to an `ImageMetadata` | `src/lib/media.ts` |
| `cover ?? banner` | the card fallback for the six trees without a cover | `src/components/views/Trees.astro` |
