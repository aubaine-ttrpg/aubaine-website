# Aubaine

The wiki for the Aubaine tabletop roleplaying game, in French and English.

Astro with React islands, Swup navigation, Motion for React, TypeScript, and a fully prerendered
static build for Cloudflare.

## Adding content

You do not need to touch any code to add a skill, an item, a state or a book page. Drop a file into
`data/` and it appears on the site, in the indexes, in the search results and in the rule-text
tooltips.

Start at [`docs/runbooks/README.md`](docs/runbooks/README.md). It says which file to open for which
job. [`docs/data-contract.md`](docs/data-contract.md) explains the model behind it.

```
data/
  meta/            the closed lists: domains, characteristics, node types, rarities, disciplines
  skills/          one file per skill, the single definition of each
  skill-trees/     layout only: which skills sit where on a plate, and what links to what
  skill-lists/     the basic skills and the Common Bank, as ordered lists of skill ids
  equipment/       the catalogue, one file per item, one file per set
  states/          one file per state
  books/           one folder per book: book.json plus one Markdown file per page
  media/           art, item images, icons, flags, fonts, PDFs, video
schemas/           the published JSON Schema contracts, generated from src/lib/game/schema.ts
```

French is the canonical language. English lives in sidecar overlay files next to the original
(`RAGER-01.en.json` beside `RAGER-01.json`) and holds only the translated strings. Anything missing
falls back to French. See [`docs/runbooks/add-a-translation.md`](docs/runbooks/add-a-translation.md).

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Produce the static site in `dist/` |
| `pnpm preview` | Serve the built site |
| `pnpm data:check` | Validate every data file and every cross reference |
| `pnpm check` | Astro and TypeScript checks |
| `pnpm lint` / `pnpm format` | Biome |
| `pnpm test` | Unit tests over the data layer |
| `pnpm test:e2e` | Playwright browser tests |
| `pnpm schemas` | Regenerate `schemas/` from the Zod contract |
| `pnpm verify` | Lint, data check, type check, tests and build, in order |

## How it is put together

`src/lib/game/` is the only code that knows the shape of the data. It loads the files, applies the
locale overlay, resolves placements into skills, computes everything the design derives (XP from
tier, a tree's dominant domains and primary characteristics, cost pills, provenance) and builds the
tooltip term index. Nothing in it reaches the browser.

`src/pages/[...path].astro` is a single catch-all. Every route in both languages comes from
`src/lib/game/pages.ts`, which reads the same collections, so a new data file becomes a new page
with no route to register.

Pages are static HTML. React is used only where the design needs real interaction: the filter bar
and its facet modal. Skill tree nodes, book pages and browse entries are ordinary links, so every
page works with JavaScript disabled.

## Licence

Code is [MIT](LICENSE). Game content, everything under `data/`, is
[CC BY-NC-SA 4.0](LICENSE-CONTENT), which is the claim the footer prints on every page. The icons
under `data/media/icons/` and the fonts under `data/media/fonts/` are third party and carry their own
terms, declared in `src/lib/rights/attribution.ts` and explained in
[docs/third-party-assets.md](docs/third-party-assets.md).

The site says all of this in its own words too. `src/content/policies/` holds the licences page, the
AI policy, the credits and the privacy note, in French with an English overlay, and the footer links
them from every page.
