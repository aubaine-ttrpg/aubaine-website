import { describe, expect, it } from 'vitest'

import {
  createGazetteer,
  describeRef,
  endpointLabel,
  featuredEntries,
  findEntries,
  type Gazetteer,
  hoverText,
  placeEntries,
  type Sheet,
} from '../../src/islands/atlas/describe'
import { TILE_TYPES } from '../../src/lib/atlas/vocabulary'
import { columnOf, rowOf } from '../../src/lib/atlas/world/grid'
import type { World } from '../../src/lib/atlas/world/model'
import type { AtlasRef } from '../../src/lib/atlas/world/refs'
import { altitudeMetres, skyAltitudeMetres } from '../../src/lib/atlas/world/relief'
import { tileMaxPace } from '../../src/lib/atlas/world/travel'
import type { Locale } from '../../src/lib/i18n/locales'
import { strings } from '../../src/lib/i18n/strings'
import { bookPaces, loadWorld } from './fixtures/atlas'

const LANG = { fr: 'fr-FR', en: 'en-GB' } as const

function gazetteerFor(locale: Locale): { g: Gazetteer; world: World } {
  const { authored, world } = loadWorld('archipel', locale)
  const g = createGazetteer({
    world,
    grid: authored.grid,
    locale,
    words: strings(locale).atlas,
    paces: bookPaces(locale),
    terrains: world.travel.terrains.map(({ key }) => ({ key, label: `terrain ${key}` })),
  })
  return { g, world }
}

const { g, world } = gazetteerFor('fr')
const t = strings('fr').atlas
const HEX_AREA = (Math.sqrt(3) / 2) * world.hexKm ** 2
const number = (value: number, digits = 0) =>
  new Intl.NumberFormat(LANG.fr, { maximumFractionDigits: digits }).format(value)
const place = (id: string) => {
  const found = world.places.find((entry) => entry.id === id)
  if (!found) throw new Error(`no place ${id}`)
  return found
}
const landmark = (id: string) => {
  const found = world.landmarks.find((entry) => entry.id === id)
  if (!found) throw new Error(`no landmark ${id}`)
  return found
}
const sheetOf = (ref: AtlasRef): Sheet => {
  const sheet = describeRef(g, ref)
  if (!sheet) throw new Error(`no sheet for ${JSON.stringify(ref)}`)
  return sheet
}
const fact = (sheet: Sheet, term: string) => sheet.facts.find((entry) => entry.term === term)?.value
const sectionNames = (sheet: Sheet, title: string) =>
  sheet.sections.find((entry) => entry.title === title)?.items.map((item) => item.name)
const hex = (tile: number) => t.hex(columnOf(g.grid, tile), rowOf(g.grid, tile))
const typeLabel = (code: number | undefined) =>
  world.vocabulary.tileTypes[TILE_TYPES[code ?? -1] ?? '']?.label ?? ''

describe('the entry of a surface hex', () => {
  const quarter = place('bastion-citadelle')
  const city = place('bastion')
  const tile = quarter.tiles[0] ?? -1
  const sheet = sheetOf({ kind: 'tile', tile })

  it('is named after the quarter it lies in and placed by its coordinates and tile type', () => {
    expect(sheet.title).toBe(quarter.name)
    expect(sheet.eyebrow).toBe(`${hex(tile)} · ${typeLabel(world.surface.type[tile])}`)
    expect(sheet.tone).toBe('gold')
  })

  it('gives the altitude, the area of one hex, its terrain and the pace a road allows', () => {
    const terrain =
      world.travel.terrains[world.travel.tileTerrains[world.surface.type[tile] ?? -1] ?? -1]
    const pace = tileMaxPace(world, tile)
    expect(fact(sheet, t.facts.altitude)).toBe(
      `${number(altitudeMetres(world.surface.level[tile] ?? 0, undefined))} m`,
    )
    expect(fact(sheet, t.facts.area)).toBe(`${number(HEX_AREA, 1)} km²`)
    expect(fact(sheet, t.facts.terrain)).toBe(`terrain ${terrain?.key}`)
    expect(fact(sheet, t.facts.maxPace)).toBe(
      bookPaces('fr').find((entry) => entry.key === pace)?.label,
    )
  })

  it('walks the places that hold it, from the continent down to the quarter', () => {
    const lineage = (index: number): number[] => {
      const parent = world.places[index]?.parent ?? -1
      return parent < 0 ? [index] : [...lineage(parent), index]
    }
    expect(sheet.crumbs.map((crumb) => crumb.ref)).toEqual(
      lineage(quarter.index).map((index) => ({ kind: 'place', place: index })),
    )
    expect(sheet.crumbs.some((crumb) => crumb.current)).toBe(false)
    expect(sectionNames(sheet, t.sections.member)?.[0]).toBe(quarter.name)
    expect(sectionNames(sheet, t.sections.member)?.[1]).toBe(city.name)
  })

  it('lists the establishments and the routes on the hex', () => {
    expect(sectionNames(sheet, t.sections.establishments)).toEqual(
      world.establishments
        .filter((entry) => entry.tile === tile && entry.stratum === 0)
        .map((entry) => entry.name),
    )
    expect([...(sectionNames(sheet, t.sections.routes) ?? [])].sort()).toEqual(
      world.routes
        .filter((route) => route.tiles.includes(tile))
        .map((route) => route.name)
        .sort(),
    )
    const establishment = sheet.sections.find((entry) => entry.kind === 'establishments')?.items[0]
    expect(establishment?.ref).toBeUndefined()
  })

  it('gives the depth of the sea, and no pace, on open water', () => {
    const water = Array.from(world.surface.water).findIndex(
      (wet, index) => wet === 1 && (world.surface.lake[index] ?? -1) < 0,
    )
    const ocean = sheetOf({ kind: 'tile', tile: water })
    expect(fact(ocean, t.facts.depth)).toBe(
      `${number(-altitudeMetres(world.surface.level[water] ?? 0, undefined))} m`,
    )
    expect(fact(ocean, t.facts.maxPace)).toBeUndefined()
    expect(ocean.crumbs.map((crumb) => crumb.name)).toEqual([
      world.places[world.surface.sea[water] ?? -1]?.name,
    ])
  })

  it('reads a lake at the height of its surface', () => {
    const lake = world.lakes[0]
    const tile = lake?.tiles[0] ?? -1
    expect(fact(sheetOf({ kind: 'tile', tile }), t.facts.altitude)).toBe(
      `${number(altitudeMetres(world.surface.level[tile] ?? 0, lake?.level))} m`,
    )
  })

  it('names the strata found below a hex that opens on a cavern', () => {
    const upper = world.underground.find((record) => record.level === 1)
    const tile = Array.from(upper?.cavern ?? []).findIndex(
      (cavern, index) => cavern >= 0 && (upper?.setting[index] ?? 0) > 0,
    )
    const below = sheetOf({ kind: 'tile', tile }).sections.find((entry) => entry.kind === 'strata')
    const cavern = world.places[upper?.cavern[tile] ?? -1]
    expect(below?.items.map((item) => item.ref)).toContainEqual({
      kind: 'place',
      place: cavern?.index,
    })
    expect(below?.items[0]?.detail.startsWith(t.stratum(1))).toBe(true)
  })
})

describe('the entry of an underground hex', () => {
  const hold = place('dolmhir')
  const record = world.underground.find((entry) => entry.level === hold.stratum)
  const tile = Array.from(hold.tiles).find((index) => (record?.quarter[index] ?? -1) >= 0) ?? -1
  const quarter = world.places[record?.quarter[tile] ?? -1]
  const sheet = sheetOf({ kind: 'under', level: hold.stratum, tile })

  it('is named after the finest place that holds it, in the amber of the strata', () => {
    expect(sheet.title).toBe(quarter?.name)
    expect(sheet.tone).toBe('underground')
    expect(sheet.eyebrow.startsWith(`${t.stratum(hold.stratum)} · ${hex(tile)} · `)).toBe(true)
  })

  it('gives the depth of its stratum, its rock and its setting', () => {
    expect(fact(sheet, t.facts.depth)).toBe(`≈ ${number(record?.depth ?? 0)} m`)
    expect(fact(sheet, t.facts.rock)).toBeTruthy()
    expect(fact(sheet, t.facts.setting)).toBeTruthy()
  })

  it('climbs from the hold to its realm, and links the hex on the surface above', () => {
    expect(sheet.crumbs.map((crumb) => crumb.name)).toContain(hold.name)
    expect(sheet.crumbs[0]?.name).toBe(world.places[record?.realm[tile] ?? -1]?.name)
    const above = sheet.sections.find((entry) => entry.kind === 'above')
    expect(above?.items.map((item) => item.ref)).toEqual([{ kind: 'tile', tile }])
  })
})

describe('the entry of a sky hex', () => {
  const sky = 0
  const sheet = sheetOf({ kind: 'sky', sky })
  const owner = world.places[world.sky.place[sky] ?? -1]

  it('is named after its quarter of the floating city', () => {
    expect(sheet.title).toBe(owner?.name)
    expect(sheet.tone).toBe('landmark')
  })

  it('gives its altitude and says it is airborne', () => {
    expect(fact(sheet, t.facts.altitude)).toBe(
      `${number(skyAltitudeMetres(world.sky.y[sky] ?? 0))} m`,
    )
    expect(fact(sheet, t.facts.position)).toBe(t.aloft)
  })

  it('lists its island and the establishments built on it', () => {
    const island = world.sky.islands[world.sky.island[sky] ?? -1]
    expect(sectionNames(sheet, t.sections.landmarks)).toEqual([
      world.landmarks[island?.landmark ?? -1]?.name,
    ])
    const built = world.establishments
      .filter((entry) => entry.aloft && world.sky.at[entry.tile] === sky)
      .map((entry) => entry.name)
    expect(sectionNames(sheet, t.sections.establishments)).toEqual(built)
  })
})

describe('the entry of a landmark', () => {
  it('names its kind and gives its height and the altitude of its hex', () => {
    const tree = landmark('arbre')
    const sheet = sheetOf({ kind: 'landmark', landmark: tree.index })
    expect(sheet.title).toBe(tree.name)
    expect(sheet.eyebrow).toBe(
      `${t.landmark} · ${world.vocabulary.landmarkKinds[tree.kind]?.label}`,
    )
    expect(fact(sheet, t.facts.height)).toBe(`${number(tree.height ?? 0)} m`)
    expect(fact(sheet, t.facts.altitude)).toBeTruthy()
    expect(sectionNames(sheet, t.sections.member)?.[0]).toBe(world.places[tree.place]?.name)
  })

  it('places a floating landmark in the air, with no strata or route below it', () => {
    const city = landmark('aerolys')
    const sheet = sheetOf({ kind: 'landmark', landmark: city.index })
    expect(fact(sheet, t.facts.altitude)).toBe(`${number(city.altitude ?? 0)} m`)
    expect(fact(sheet, t.facts.position)).toBe(t.aloft)
    expect(sheet.sections.map((entry) => entry.kind)).not.toContain('strata')
    expect(sheet.sections.map((entry) => entry.kind)).not.toContain('routes')
  })
})

describe('the entry of a place', () => {
  it('gives a country its area, its ruler, its people, its capital and its highest point', () => {
    const country = place('aubemont')
    const sheet = sheetOf({ kind: 'place', place: country.index })
    expect(sheet.eyebrow).toBe(world.vocabulary.placeKinds['country']?.label)
    expect(sheet.colour).toBe(country.color)
    expect(fact(sheet, t.facts.area)).toBe(`${number(country.tiles.length * HEX_AREA)} km²`)
    expect(fact(sheet, t.facts.hexes)).toBe(number(country.tiles.length))
    expect(fact(sheet, t.facts.ruler)).toBe(country.ruler)
    expect(fact(sheet, t.facts.population)).toBe(number(country.population ?? 0))
    expect(fact(sheet, t.facts.capital)).toBe(world.places[country.capital]?.name)
    expect(fact(sheet, t.facts.highest)).toBe(
      `${number(altitudeMetres(country.highestLevel, undefined))} m`,
    )
    expect(sectionNames(sheet, t.sections.subdivisions)).toEqual(
      country.children.map((index) => world.places[index]?.name),
    )
    expect(sheet.crumbs.at(-1)?.current).toBe(true)
  })

  it('gives an underground city its depth first, its quarters and the places above it', () => {
    const hold = place('dolmhir')
    const sheet = sheetOf({ kind: 'place', place: hold.index })
    const depth = world.underground.find((entry) => entry.level === hold.stratum)?.depth
    expect(sheet.facts[0]).toEqual({ term: t.facts.depth, value: `≈ ${number(depth ?? 0)} m` })
    expect(sectionNames(sheet, t.sections.subdivisions)).toEqual(
      hold.children.map((index) => world.places[index]?.name),
    )
    const establishments = sheet.sections.find((entry) => entry.kind === 'establishments')
    expect(establishments?.items.some((item) => item.detail.includes(' · '))).toBe(true)
    expect(sheet.sections.some((entry) => entry.kind === 'above')).toBe(true)
    expect(sheet.sections.some((entry) => entry.kind === 'routes')).toBe(false)
  })

  it('lists the establishments of a floating city from its sky hexes', () => {
    const city = place('cite-aerolys')
    const sheet = sheetOf({ kind: 'place', place: city.index })
    expect(sectionNames(sheet, t.sections.establishments)?.length).toBeGreaterThan(0)
    expect(fact(sheet, t.facts.hexes)).toBe(number(city.skyTiles.length))
  })

  it('names a natural area after its own kind', () => {
    const natural = world.places.find((entry) => entry.kind === 'natural' && entry.subtype)
    const sheet = sheetOf({ kind: 'place', place: natural?.index ?? -1 })
    expect(sheet.eyebrow).toBe(world.vocabulary.naturalKinds[natural?.subtype ?? '']?.label)
  })

  it('has no entry for a place that does not exist', () => {
    expect(describeRef(g, { kind: 'place', place: world.places.length })).toBeUndefined()
  })
})

describe('the hover text of the map', () => {
  it('names a hex after the landmark or the place it lies in, with its altitude', () => {
    const quarter = place('bastion-citadelle')
    const tile = quarter.tiles[0] ?? -1
    const text = hoverText(g, { kind: 'tile', tile })
    const below = world.landmarks.find((entry) => Array.from(entry.tiles).includes(tile))
    expect(text?.title).toBe(below?.name ?? `${quarter.name} · ${place('bastion').name}`)
    expect(text?.detail.endsWith(hex(tile))).toBe(true)
    expect(text?.detail).toContain('alt.')
  })

  it('names an underground hex after its cavern and its stratum', () => {
    const hold = place('dolmhir')
    const tile = hold.tiles[0] ?? -1
    const text = hoverText(g, { kind: 'under', level: hold.stratum, tile })
    expect(text?.title).toContain(hold.name)
    expect(text?.detail).toContain(t.stratum(hold.stratum))
    expect(text?.tone).toBe('underground')
  })

  it('gives a sky hex its altitude', () => {
    const text = hoverText(g, { kind: 'sky', sky: 0 })
    expect(text?.detail).toContain(`alt. ${number(skyAltitudeMetres(world.sky.y[0] ?? 0))} m`)
  })
})

describe('the names of the travel endpoints', () => {
  it('names a hex, an underground hex and a sky hex by their coordinates', () => {
    const tile = place('bastion').anchor
    expect(endpointLabel(g, { kind: 'tile', tile })).toBe(hex(tile))
    expect(endpointLabel(g, { kind: 'under', level: 2, tile })).toBe(
      `${t.stratum(2)} · ${hex(tile)}`,
    )
    expect(endpointLabel(g, { kind: 'sky', sky: 0 }).startsWith('Hex céleste ')).toBe(true)
  })

  it('names a city alone, and qualifies villages, underground places and landmarks', () => {
    const city = place('bastion')
    const village = world.places.find((entry) => entry.kind === 'village')
    const hold = place('dolmhir')
    const tree = landmark('arbre')
    expect(endpointLabel(g, { kind: 'place', place: city.index })).toBe(city.name)
    expect(endpointLabel(g, { kind: 'place', place: village?.index ?? -1 })).toBe(
      `${village?.name} · ${world.vocabulary.placeKinds['village']?.label}`,
    )
    expect(endpointLabel(g, { kind: 'place', place: hold.index })).toBe(
      `${hold.name} · ${t.stratum(hold.stratum)}`,
    )
    expect(endpointLabel(g, { kind: 'landmark', landmark: tree.index })).toBe(
      `${tree.name} · ${t.landmark}`,
    )
  })
})

describe('the place list', () => {
  it('jumps first to the featured places, then to the featured landmarks', () => {
    expect(featuredEntries(g).map((entry) => entry.name)).toEqual([
      ...world.featuredPlaces.map((index) => world.places[index]?.name),
      ...world.featuredLandmarks.map((index) => world.landmarks[index]?.name),
    ])
  })

  it('lists every place and landmark once, in alphabetical order', () => {
    const entries = placeEntries(g)
    expect(entries).toHaveLength(world.places.length + world.landmarks.length)
    const names = entries.map((entry) => entry.name)
    expect(names).toEqual([...names].sort(new Intl.Collator('fr').compare))
  })

  it('finds a place without its accents or its capitals, and nothing for an empty query', () => {
    const entries = placeEntries(g)
    const found = findEntries(g, entries, 'ferratre')
    expect(found.map((entry) => entry.ref)).toContainEqual({
      kind: 'place',
      place: place('ferratre').index,
    })
    expect(findEntries(g, entries, '   ')).toEqual([])
  })
})

describe('the entries in English', () => {
  const english = gazetteerFor('en')
  const words = strings('en').atlas

  it('speaks the English vocabulary and formats numbers the British way', () => {
    const country = english.world.places.find((entry) => entry.id === 'aubemont')
    const sheet = describeRef(english.g, { kind: 'place', place: country?.index ?? -1 })
    const kind = english.world.vocabulary.placeKinds[country?.kind ?? '']?.label
    expect(sheet?.eyebrow).toBe(kind)
    expect(kind).not.toBe(world.vocabulary.placeKinds[country?.kind ?? '']?.label)
    expect(sheet?.facts.find((entry) => entry.term === words.facts.population)?.value).toBe(
      new Intl.NumberFormat(LANG.en).format(country?.population ?? 0),
    )
    expect(endpointLabel(english.g, { kind: 'sky', sky: 0 }).startsWith('Sky hex ')).toBe(true)
  })
})
