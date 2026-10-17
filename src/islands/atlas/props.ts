import {
  FieldError,
  fields,
  list,
  oneOf,
  optionalText,
  positive,
  text,
} from '../../lib/atlas/contract/fields'
import { MAP_KINDS, type MapKind, PACES, type Pace } from '../../lib/atlas/vocabulary'
import type { BadgedStatus } from '../../lib/game/status'
import { LOCALES, type Locale } from '../../lib/i18n/locales'
import type { AtlasBootCopy } from '../../scripts/atlas-boot'

export type AtlasPaceRow = { key: Pace; label: string; kmh: number; kmPerDay: number }

export type AtlasTerrainLabel = { key: string; label: string; href?: string }

export type AtlasWorldCard = {
  key: string
  name: string
  kind: MapKind
  badge?: BadgedStatus
  emblem?: string
  columns: number
  rows: number
  hexKm: number
}

export type AtlasProps = {
  locale: Locale
  worlds: AtlasWorldCard[]
  opening: string
  chapter: { title: string; href: string }
  paces: AtlasPaceRow[]
  terrains: AtlasTerrainLabel[]
  boot: AtlasBootCopy
}

const BADGES = ['draft', 'playtest', 'beta'] as const satisfies readonly BadgedStatus[]

function pace(value: unknown, path: string): AtlasPaceRow {
  const row = fields(value, path)
  return {
    key: oneOf(row['key'], PACES, `${path}.key`),
    label: text(row['label'], `${path}.label`),
    kmh: positive(row['kmh'], `${path}.kmh`),
    kmPerDay: positive(row['kmPerDay'], `${path}.kmPerDay`),
  }
}

function terrain(value: unknown, path: string): AtlasTerrainLabel {
  const row = fields(value, path)
  const named = { key: text(row['key'], `${path}.key`), label: text(row['label'], `${path}.label`) }
  const href = optionalText(row['href'], `${path}.href`)
  return href === undefined ? named : { ...named, href }
}

function bootCopy(value: unknown): AtlasBootCopy {
  const copy = fields(value, 'boot')
  return {
    label: text(copy['label'], 'boot.label'),
    brandLine: text(copy['brandLine'], 'boot.brandLine'),
    catalyst: text(copy['catalyst'], 'boot.catalyst'),
    title: text(copy['title'], 'boot.title'),
    syncing: text(copy['syncing'], 'boot.syncing'),
    waiting: text(copy['waiting'], 'boot.waiting'),
    granted: text(copy['granted'], 'boot.granted'),
    failed: text(copy['failed'], 'boot.failed'),
    percentSign: text(copy['percentSign'], 'boot.percentSign'),
    skip: text(copy['skip'], 'boot.skip'),
  }
}

function worldCard(value: unknown, path: string): AtlasWorldCard {
  const card = fields(value, path)
  const badge =
    card['badge'] === undefined ? undefined : oneOf(card['badge'], BADGES, `${path}.badge`)
  const emblem = optionalText(card['emblem'], `${path}.emblem`)
  return {
    key: text(card['key'], `${path}.key`),
    name: text(card['name'], `${path}.name`),
    kind: oneOf(card['kind'], MAP_KINDS, `${path}.kind`),
    columns: positive(card['columns'], `${path}.columns`),
    rows: positive(card['rows'], `${path}.rows`),
    hexKm: positive(card['hexKm'], `${path}.hexKm`),
    ...(badge ? { badge } : {}),
    ...(emblem ? { emblem } : {}),
  }
}

export function readAtlasProps(raw: string | undefined): AtlasProps {
  const props = fields(JSON.parse(raw ?? 'null'), 'props')
  const chapter = fields(props['chapter'], 'chapter')
  const worlds = list(props['worlds'], 'worlds').map((entry, index) =>
    worldCard(entry, `worlds[${index}]`),
  )
  const opening = text(props['opening'], 'opening')
  if (!worlds.some((world) => world.key === opening)) {
    throw new FieldError('opening', 'one of the worlds')
  }
  return {
    locale: oneOf(props['locale'], LOCALES, 'locale'),
    worlds,
    opening,
    chapter: {
      title: text(chapter['title'], 'chapter.title'),
      href: text(chapter['href'], 'chapter.href'),
    },
    paces: list(props['paces'], 'paces').map((entry, index) => pace(entry, `paces[${index}]`)),
    terrains: list(props['terrains'], 'terrains').map((entry, index) =>
      terrain(entry, `terrains[${index}]`),
    ),
    boot: bootCopy(props['boot']),
  }
}
