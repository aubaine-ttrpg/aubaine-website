import { getCollection, getEntry } from 'astro:content'

import { OPENING_WORLD } from '../atlas/contract/worlds.ts'
import type { MapKind, Pace } from '../atlas/vocabulary.ts'
import { DEFAULT_LOCALE, type Locale } from '../i18n/locales.ts'
import { pathFor } from '../i18n/routes.ts'
import { corpus, label } from './corpus.ts'
import { type ContentStatus, overlays } from './schema.ts'
import { readTravelBook } from './travel-book.ts'

const TRAVEL_CHAPTER = { book: 'livre-du-joueur', file: '08-l-exploration' } as const

export type AtlasHead = { name: string; status: ContentStatus | undefined }

export type AtlasWorldEntry = {
  key: string
  name: string
  status: ContentStatus | undefined
  kind: MapKind
  emblem: string | undefined
  columns: number
  rows: number
  hexKm: number
}

export type AtlasPaceRow = { key: Pace; label: string; kmh: number; kmPerDay: number }

export type AtlasTerrain = { key: string; label: string; href?: string | undefined }

export type AtlasView = {
  head: AtlasHead
  worlds: AtlasWorldEntry[]
  opening: string
  chapter: { title: string; href: string }
  paces: AtlasPaceRow[]
  effects: { key: Pace; source: string }[]
  rule: string
  terrains: AtlasTerrain[]
}

async function translated(locale: Locale, id: string): Promise<unknown> {
  if (locale === DEFAULT_LOCALE) return undefined
  const overlay = `${id}.${locale}`
  const [entry] = await getCollection('translations', (candidate) => candidate.id === overlay)
  return entry?.data
}

async function translatedName(locale: Locale, id: string, name: string): Promise<string> {
  const patch = overlays.atlasWorld.safeParse((await translated(locale, `atlas/${id}`)) ?? {})
  return (patch.success ? patch.data.name : undefined) ?? name
}

export async function atlasWorlds(locale: Locale): Promise<AtlasWorldEntry[]> {
  const entries = await getCollection('atlasWorlds')
  const worlds = await Promise.all(
    entries.map(async (entry) => ({
      key: entry.id.slice(0, -'/world'.length),
      name: await translatedName(locale, entry.id, entry.data.name),
      status: entry.data.status,
      kind: entry.data.kind,
      emblem: entry.data.emblem,
      columns: entry.data.columns,
      rows: entry.data.rows,
      hexKm: entry.data.hexKm,
    })),
  )
  return worlds.sort((a, b) => a.name.localeCompare(b.name, locale))
}

export async function atlasHead(locale: Locale): Promise<AtlasHead> {
  const world = await getEntry('atlasWorlds', `${OPENING_WORLD}/world`)
  if (!world) throw new Error(`the Atlas opens ${OPENING_WORLD}, which has no world.json`)
  return {
    name: await translatedName(locale, world.id, world.data.name),
    status: world.data.status,
  }
}

async function travelChapter(
  locale: Locale,
): Promise<{ title: string; body: string; href: string }> {
  const id = `${TRAVEL_CHAPTER.book}/${TRAVEL_CHAPTER.file}`
  const page =
    (locale === DEFAULT_LOCALE ? undefined : await getEntry('bookPages', `${id}.${locale}`)) ??
    (await getEntry('bookPages', id))
  const book = (await corpus(locale)).books.find((entry) => entry.id === TRAVEL_CHAPTER.book)
  const chapter = book?.chapters.find((entry) => entry.file === TRAVEL_CHAPTER.file)
  if (!page?.body || !chapter) throw new Error(`the travel chapter ${id} is missing`)
  return {
    title: page.data.title,
    body: page.body,
    href: pathFor('book', locale, { book: TRAVEL_CHAPTER.book, chapter: chapter.slug }),
  }
}

export async function atlasView(locale: Locale): Promise<AtlasView> {
  const [head, worlds, chapter, data, rules, words] = await Promise.all([
    atlasHead(locale),
    atlasWorlds(locale),
    travelChapter(locale),
    corpus(locale),
    getEntry('atlasTravelRules', 'travel'),
    getEntry('atlasVocabularyLists', 'vocabularies'),
  ])
  if (!rules || !words) throw new Error('the Atlas travel rules or vocabularies are missing')
  const book = readTravelBook(chapter.body)
  const ownWords = new Map(words.data.terrains.map((word) => [word.key, word]))
  const terrains = rules.data.terrains.map((terrain): AtlasTerrain => {
    if (terrain.environment === undefined) {
      const word = ownWords.get(terrain.key)
      if (!word) throw new Error(`the terrain ${terrain.key} has no name`)
      return { key: terrain.key, label: label(word, locale, terrain.key) }
    }
    const environment = data.environments.get(terrain.environment)
    if (!environment) throw new Error(`the terrain ${terrain.key} names a missing environment`)
    return {
      key: terrain.key,
      label: environment.name,
      href: `${pathFor('materials', locale)}#e-${terrain.environment}`,
    }
  })
  return {
    head,
    worlds,
    opening: OPENING_WORLD,
    chapter: { title: chapter.title, href: chapter.href },
    paces: book.paces.map(({ key, label, kmh, kmPerDay }) => ({ key, label, kmh, kmPerDay })),
    effects: book.paces.map(({ key, effect }) => ({ key, source: effect })),
    rule: book.rule,
    terrains,
  }
}
