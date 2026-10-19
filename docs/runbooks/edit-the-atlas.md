# Edit the Atlas

Produces a change to the world map at `/fr/atlas` and `/en/atlas`: its terrain, its borders, its places, its landmarks, its routes, its establishments, its floating islands, its underground, the stars that light it, or the rules of its travel planner.

## The files

Each folder under `data/atlas/` is one world, and the Atlas opens the one `OPENING_WORLD` names in `src/lib/atlas/contract/worlds.ts`. Today that is `data/atlas/archipel/`, a placeholder world published as a draft; `data/atlas/eden/` is an empty world of open sea, waiting for the continent. Three files serve every world.

| File | What it holds |
| --- | --- |
| `data/atlas/vocabularies.json` | The words of the map: tile types with their descriptions, rocks, underground settings, place kinds, natural kinds, landmark kinds, route kinds, establishment kinds, vessels, and the travel terrains that have no environment |
| `data/atlas/travel.json` | The travel planner's rules, apart from the paces, which it reads from the Livre du joueur |
| `data/atlas/stars.json` | The three stars of the sky: the colour, direct light and apparent size of each, and the orbit of the far pair |
| `<world>/world.json` | The world's name, its status, its grid, the places offered when nothing is selected, and its emblem |
| `<world>/surface.json` | The surface, in layers, and the cave entrances |
| `<world>/places.json` | Every named place: continents, countries, regions, cities, villages, quarters, natural areas, seas, and every underground place |
| `<world>/landmarks.json` | The landmarks, set on a hex but drawn off the grid |
| `<world>/routes.json` | Roads, footpaths, rail lines, sea lanes, rivers and sky lanes |
| `<world>/establishments.json` | Taverns, temples, forges and the like, each in a place |
| `<world>/sky.json` | The floating islands, hex by hex |
| `<world>/underground.json` | Each underground level, in layers |

Places, landmarks, routes, establishments and the world name take English overlays, keyed by id. See [add-a-translation.md](add-a-translation.md).

`docs/adr/0041-the-atlas-is-a-shell-mounted-map-fed-by-a-worker-from-its-world-data.md` records why the world is split this way.

## Reading a layer

A layer is a legend and one string per row of the grid, north to south. Each character is one hex, west to east, and the legend says what it means. A dot is an empty hex.

```json
"sea": {
  "legend": {
    "O": "opale",
    "P": "ocean-du-ponant"
  },
  "rows": [
    "PPPP....OOOO",
    "PPP......OOO"
  ]
}
```

Odd rows sit half a hex further east than even rows. Every row has as many characters as `world.json` has `columns`, and there are as many rows as it has `rows`. Every character a legend declares must appear in the rows, and every character in the rows except the dot must be declared.

A legend character is any printable ASCII character but the dot and the space. Pick ones that read well: the `type` layer uses `~` for open sea and `F` for forest.

## The surface layers

| Layer | One hex holds | Notes |
| --- | --- | --- |
| `height` | its height step | Land and lake surfaces go from 1 to 13, each step 160 m. The sea goes from -1, the shallows, to -4, the abyss. 0 does not exist |
| `type` | its tile type | A key of `tileTypes` in `vocabularies.json`. The sea types need a negative height, a lake and the land a positive one |
| `landmass` | its continent or island | A `continent` place |
| `political` | its region, or its country where it has no region | The country of a region is that region's parent |
| `settlement` | its quarter, or its village | A city is the parent of its quarters |
| `sea` | its sea or ocean | A `sea` place |
| `relief` | its mountain range or volcano | A `natural` place of kind `range` or `volcano` |
| `cover` | the smallest natural area covering it | A `natural` place of any other kind. Its parents cover the hex too |

A lake is a group of touching `lake` hexes, all at one height step: the step of its surface.

Everything else is derived when the map loads: where the water is, the slopes between hexes, which places hold a hex, the centre of each place, where its label goes, what lies under a hex, and the list of places the travel planner offers.

`caves` lists the cave entrances: a hex, the side it opens on, and its kind, which only sets the colour of the glow. The sides are numbered 0 to the east, then clockwise: 1 south-east, 2 south-west, 3 west, 4 north-west, 5 north-east. The hex on that side must be lower, so the entrance sits in a cliff.

## Places

Every place has an `id`, a `kind`, a `name`, and optionally a `parent` and a `description`. A hex in a place belongs to all of its parents too. Some kinds carry more.

| Kind | Parent | Also carries |
| --- | --- | --- |
| `continent` | none | |
| `country` | a continent, or none | `color`, and optionally `capital` (one of its cities), `ruler`, `government`, `population` |
| `region` | a country, required | |
| `city`, `village` | a region, a country or a continent | `style`, the look of its houses, and optionally `population` |
| `quarter` | a city, required | |
| `natural` | another natural place, or none | `subtype`, a key of `naturalKinds` |
| `sea` | none | |
| `realm` | none | |
| `network` | a realm, required | |
| `cavern` | a network, a realm, or none | |
| `hold` | a realm, or none | optionally `ruler`, `population` |
| `hold-quarter` | a hold, required | |

A place must appear on at least one hex, itself or through a place it holds. A city's quarters are drawn in the `settlement` layer; the city has no character of its own there.

## Landmarks

A landmark sits on a `tile` and optionally belongs to a `place`. A landmark on the ground carries a `footprint`, the radius of the ground it covers in hex radii (a hex is two radii from point to point), and optionally the `altitude` of its summit. A `skycity` or a `skyisle` floats instead: it carries the `altitude` it floats at, in metres, and `sky.json` must give it an island centred on its hex. `height` and `length` are approximate measures in metres.

## Routes

A route starts on a hex and follows `steps`, one digit per move to a neighbour, numbered like the cave sides: 0 east, then clockwise to 5 north-east. Roads and footpaths stay on land. A rail line may cross the shallows but never a lake or deeper water.

A sky lane joins two ends, each a `landmark` or a `place`.

## Establishments, floating islands and the underground

An establishment names its `place`, a quarter, a village, a cavern or a hold quarter, and the `tile` it stands on, which must belong to that place on that place's level.

A floating island lists its hexes, each with a tile type and the place it belongs to, a quarter or a natural area. The hexes nearer the centre of a sky city stand higher.

Each underground level has four layers. `rock` is the stone, `setting` the kind of space (`rock` is solid rock), `floor` the height of the ground on the map (0.6 for solid rock, lower for a carved hall), and `place` the smallest underground place of the hex. Every open hex has a place, and solid rock has none.

## What dresses the map

The scenery follows the data. Nothing is drawn because of an id.

- An establishment dresses the place it stands in. A `harbour` puts piers, boats and harbour halls on a city's coast, and a `forge` puts workshop halls and chimney smoke in its quarter, or forge halls and embers in a hold quarter. `ESTABLISHMENT_DRESSINGS` in `src/lib/atlas/vocabulary.ts` holds every pairing; read it there.
- A city or a village with `features` set to `["walls"]` gets a ring of walls. A natural place can carry `["windmills"]`, and a floating island's landmark one or more ornaments, such as `"chains"`. The allowed features are the `*_FEATURES` lists in `src/lib/atlas/vocabulary.ts`.

## What the reader has not discovered

Nothing is authored for the fog of war. The Atlas reveals the sea around every land and lake hex, every floating island, every landmark and every route, sky lanes included. Fog named « L'Inconnue » covers the rest, and hovering it reads « Pas encore découvert ». Its edge is irregular, a wide open sea lies between the coast and the fog, and that sea continues past the grid, so the map never ends on a straight line.

A sea as a place reveals nothing by itself. To reveal more of the ocean, give it what a reader would know it by, such as a sea lane. A hex under the fog cannot be selected, its label is hidden, and a link to it opens nothing. `src/lib/atlas/kernel/reveal.ts` holds the reach of each kind of hex.

## The parchment

The 2D style (« Parchemin ») is drawn from the same files; nothing is authored for it. Every hex takes the wash of its tile type, or of its setting or rock underground, and is filled with a light pattern of copies of that type's glyph, set in a hexagon pointing north like the hex itself. A landmark, a city, a village, a hold or a surface cave mouth replaces the pattern of its hex with one large glyph: a landmark first, then a settlement, then a cave. Routes run from hex centre to hex centre, and the fog of war leaves the Unknown as blank paper. `docs/adr/0049-the-parchment-is-a-lit-hex-chart-the-same-engine-draws-behind-a-3d-2d-switch.md` records why.

- `src/lib/atlas/contract/parchment.ts` maps every landmark kind and settlement to its glyph, and every tile type and setting to a pattern: a glyph and a spread. `forest` takes a `dense` pattern of `beech`, for one. Read it for the rest.
- A pattern's glyph is one thing that occurs many times in that terrain, such as a tree, a reed or a rock, never a scene. Its spread follows the terrain: `dense` draws 19 small copies, `scattered` 7 larger ones.
- `src/lib/atlas/engine/parchment-palette.ts` holds the washes and inks. The `--atlas-paper` and `--atlas-ink*` tokens in `src/components/views/Atlas.astro` must match its inks, and `pnpm test` fails when they drift.
- The spacing, rings and size of each spread are `PATTERN_LATTICES` in `src/lib/atlas/engine/materials/library.ts`, and the ink is `PATTERN_INK`.

To give a type another glyph, or a new kind its glyph:

1. Fetch the game-icons glyph as `docs/third-party-assets.md` describes. The file must hold a single path.
2. Add its name to `PARCHMENT_GLYPHS` and to the table that uses it.
3. Add its raw import to `src/lib/atlas/engine/parchment-glyphs.ts`; a missing one fails `pnpm check`.

`pnpm data:check` fails on a glyph without a file, a file with several paths, or a glyph no table uses.

## The stars

`stars.json` sets the light over the map. `primary` is the star the planet circles, `warm` and `hot` the far pair. Each star has a `temperature` in kelvins, which gives its colour, an `illuminance` in lux at the zenith, and an apparent `diameter` in degrees; `hot` may add a `tint`. `pair` gives the distance of the pair, the gap between its two stars, and its two periods.

The values are the reference values of `docs/aubaine/triple_star_lighting_bible_godot_2_5d.docx`. The hour slider moves the three stars along one arc that rises at 6 and sets at 18. The Saison slider moves the pair around the sky through its cycle with the primary, about 409 days with the current values.

## The travel rules

`travel.json` holds the hours travelled per day, with and without a crew in shifts, the terrains with their fastest pace on foot and on skis, the terrain of each tile type, the step a road adds and the tile types that count as roads, the speed per metre of flying Vitesse, the vessels' speeds, and the dirigeable and rail speeds. A terrain that has an Aubaine environment takes that environment's name; the others take theirs from `terrains` in `vocabularies.json`.

The paces themselves, with their distances and effects, are the table of `data/books/livre-du-joueur/08-l-exploration.md`. Change them there.

## How to check it

```
pnpm data:check
pnpm dev
```

Then open `/fr/atlas` and `/en/atlas`. `pnpm data:check` validates every file against `src/lib/game/schema.ts`, checks every rule on this page, and fails on any reference that does not resolve.

## Adding or replacing a world

A new world is a new folder with the eight files above. The smallest valid world is `data/atlas/eden/`: one sea covering the grid, and every list empty. Its `kind` sorts it in the map switcher: `land` (« Contrées ») for a stretch one travels, `area` (« Zones ») for a place at the scale of a scene, such as a dungeon, an interior or a battlefield. The reader reaches any world from the hexagon at the top of the rail, and the address names it as `?map=<folder>`. Edit a world's files in place, or replace them whole with files of the same shape, and change `status` in `world.json` once it is no longer a draft.

`emblem` in `world.json` names an SVG in `data/media/` whose name ends in `-emblem.svg`, such as `atlas-eden-emblem.svg`, drawn in the hexagon that stands for the world. The file must be declared as owned in `src/lib/rights/ownership.ts` and stamped with `pnpm media:stamp`. A world without an emblem shows the Aubaine logo.
