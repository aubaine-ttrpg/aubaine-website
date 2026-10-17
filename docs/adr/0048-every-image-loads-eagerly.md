# ADR: Every image loads eagerly

**Project:** Aubaine, the wiki
**Status:** Accepted
**Date:** 2026-10-17
**Deciders:** Kori
**Scope:** The `loading` attribute on every image Astro renders: `<Image>`, `<Picture>`, and the
pictures in markdown and content collection entries. Gives the image service that 0011 Decision 4
introduced for rights a second job, without changing what it stamps. Does not cover image sizes, the
hero's fetch priority, the home loop video, or the Atlas sounds (0045).

---

## Context

Images were blank when the reader scrolled them into view, or reached them through a page
transition, and filled in a moment later. They were lazy: Astro 7.3.3 gives every image it renders
`loading="lazy"` unless told otherwise, and `src/components/primitives/Banner.astro` chose lazy for
itself on every banner but the heroes. Before this change, 394 `<img>` on 146 of the 770 pages that
`pnpm build` writes to `dist/` were lazy: 138 card banners, 136 markdown pictures and 120 item arts.
A lazy image is fetched only as it nears the viewport, so the reader watches it arrive.

---

## Decision 1: The image service sets `loading="eager"` on every image

### Decision

- `src/lib/rights/image-service.ts` overrides `getHTMLAttributes`. It takes the sharp service's
  attributes and sets `loading: 'eager'`, and fails the build if the sharp service has no
  `getHTMLAttributes` to take them from.
- This reaches every image whose HTML attributes Astro asks the service for: `<Image>`, `<Picture>`,
  and the pictures in markdown and content collection entries.
- There is no opt-out. A `loading="lazy"` passed to an image is overwritten.
- `Banner.astro` no longer sets `loading`. Its `priority` prop still gives the heroes
  `fetchpriority="high"` and `decoding="sync"`.
- `.claude/rules/frontend/media.md` carries the rule for contributors.

### Rationale

- The owner wants an image to be there when the reader reaches it, by scrolling or by a Swup visit.
  An eager image is fetched with its page.
- One owner reaches every source. Astro's `getImage` fills `loading ??= "lazy"` before it calls the
  service, and builds every rendered image's attributes from `service.getHTMLAttributes` (verified
  in `node_modules/astro/dist/assets/internal.js`). Markdown and content collection pictures go
  through the same `getImage` (`node_modules/astro/dist/vite-plugin-markdown/images.js`,
  `node_modules/astro/dist/content/runtime.js`). The service therefore covers the banners, the item
  arts, the markdown pictures and any image added later.
- Because the default is filled before the service runs, the service cannot tell an author's `lazy`
  from Astro's. An unconditional override is the only form with one owner, and that is why there is
  no opt-out.
- `tests/e2e/images.spec.ts` checks, at 1280 by 700 and without scrolling, that every image on
  `/fr/arbres`, `/fr/espece/humain` and `/fr/equipement`, and on `/fr/arbres` after a Swup visit,
  is eager and has loaded. It failed on the build before this change and passes after. Once the
  network went idle, 13 of 26 images on `/fr/arbres` and 59 of 61 on `/fr/equipement` were still
  unloaded before the change, and none are after.
- The raw `<img>` in `src/components/print/` carry no `loading` attribute, so they already loaded
  eagerly. The CSS background art in `ItemThumb.astro` and `NodeShape.astro` was never lazy.

### Alternatives considered

- **`loading="eager"` written in `Banner.astro` and `ItemEntry.astro`, with a rehype plugin for
  markdown pictures**: three owners for one policy, and a new `<Image>` would fall back to Astro's
  lazy default. Rejected on that drift. Reopens if one image genuinely needs lazy loading, since this
  is the only form that leaves room for an opt-out.
- **Astro's `priority` prop on every image**: it makes an image eager, but it also sets
  `fetchpriority="high"` and `decoding="sync"` (verified in `internal.js`), so every image would
  compete with the hero. Rejected on that cost to the hero. Reopens if Astro separates eager loading
  from fetch priority in `priority`.

### Caveats

- Every page now downloads all its images up front. Image bytes received before network idle, at
  1280 by 700 without scrolling, measured with Playwright against `astro preview`. "Before" is the
  same build with the old lazy markup replayed:

  | Page                | Before                 | After                  |
  | ------------------- | ---------------------- | ---------------------- |
  | `/fr/arbres`        | 20 images, 2684 KB     | 28 images, 4319 KB     |
  | `/fr/especes`       | 3 images, 168 KB       | 8 images, 988 KB       |
  | `/fr/equipement`    | 5 images, 182 KB       | 47 images, 526 KB      |
  | `/fr/almanach`      | 8 images, 1075 KB      | 8 images, 1075 KB      |
  | `/fr/espece/humain` | 7 images, 67 KB        | 7 images, 67 KB        |

  This trades bandwidth on the image-heavy indexes for images that are present on arrival.
- Much of the `/fr/arbres` weight comes from `Banner.astro` asking for `sizes="100vw"` even inside
  a card, so each card fetches a plate sized for the full viewport width. Fixing `sizes` is a
  separate change that would lower this cost.
- An author who writes `loading="lazy"` gets an eager image without a warning. `media.md` says not
  to pass `loading`.
