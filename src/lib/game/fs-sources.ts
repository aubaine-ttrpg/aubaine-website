import { readdir, readFile } from 'node:fs/promises'
import { join, relative, resolve, sep } from 'node:path'
import { z } from 'astro/zod'
import type { Locale } from '../i18n/locales.ts'
import { buildCorpus, type Corpus, type CorpusSources, type Entry } from './build.ts'
import {
  type AtlasEstablishments,
  type AtlasLandmarks,
  type AtlasPlaces,
  type AtlasRoutes,
  type AtlasSky,
  type AtlasSurface,
  type AtlasTravel,
  type AtlasUnderground,
  type AtlasVocabularies,
  type AtlasWorld,
  atlasEstablishments,
  atlasLandmarks,
  atlasPlaces,
  atlasRoutes,
  atlasSky,
  atlasSurface,
  atlasTravel,
  atlasUnderground,
  atlasVocabularies,
  atlasWorld,
  book,
  environment,
  equipmentCatalogue,
  equipmentItem,
  equipmentSet,
  material,
  skill,
  skillList,
  skillTree,
  species,
  state,
  TAG_TAXONOMY_FILE,
  tagTaxonomy,
  vocabulary,
} from './schema.ts'

const TRANSLATED = /\.[a-z]{2}\.json$/

async function jsonFilesIn(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => join(entry.parentPath, entry.name))
    .sort()
}

function idFor(base: string, file: string): string {
  return relative(base, file)
    .split(sep)
    .join('/')
    .replace(/\.json$/, '')
}

async function loadEntries<T>(
  base: string,
  schema: z.ZodType<T>,
  options: { translated: boolean; except?: string },
): Promise<Entry<T>[]> {
  const files = (await jsonFilesIn(base)).filter(
    (file) =>
      (options.translated ? TRANSLATED.test(file) : !TRANSLATED.test(file)) &&
      relative(base, file) !== options.except,
  )
  const out: Entry<T>[] = []
  for (const file of files) {
    const raw: unknown = JSON.parse(await readFile(file, 'utf8'))
    const parsed = schema.safeParse(raw)
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n  ')
      throw new Error(`${idFor(base, file)} does not match its schema\n  ${issues}`)
    }
    out.push({ id: idFor(base, file), data: parsed.data })
  }
  return out
}

export async function readSources(root: string): Promise<CorpusSources> {
  const data = resolve(root, 'data')
  const at = (dir: string) => resolve(data, dir)
  const untranslated = { translated: false }

  const [
    skills,
    skillTrees,
    skillLists,
    speciesEntries,
    states,
    equipmentItems,
    equipmentSets,
    materials,
    environments,
    vocabularies,
  ] = await Promise.all([
    loadEntries(at('skills'), skill, untranslated),
    loadEntries(at('skill-trees'), skillTree, untranslated),
    loadEntries(at('skill-lists'), skillList, untranslated),
    loadEntries(at('species'), species, untranslated),
    loadEntries(at('states'), state, untranslated),
    loadEntries(at('equipment/items'), equipmentItem, untranslated),
    loadEntries(at('equipment/sets'), equipmentSet, untranslated),
    loadEntries(at('materials'), material, untranslated),
    loadEntries(at('environments'), environment, untranslated),
    loadEntries(at('meta'), z.object({ entries: vocabulary }), {
      ...untranslated,
      except: TAG_TAXONOMY_FILE,
    }),
  ])

  const tagsRaw: unknown = JSON.parse(
    await readFile(resolve(at('meta'), TAG_TAXONOMY_FILE), 'utf8'),
  )
  const tags: Entry<z.infer<typeof tagTaxonomy>>[] = [
    { id: 'tags', data: tagTaxonomy.parse(tagsRaw) },
  ]

  const catalogueRaw: unknown = JSON.parse(
    await readFile(resolve(data, 'equipment/catalogue.json'), 'utf8'),
  )
  const catalogues: Entry<z.infer<typeof equipmentCatalogue>>[] = [
    { id: 'catalogue', data: equipmentCatalogue.parse(catalogueRaw) },
  ]

  const bookDirs = (await readdir(at('books'), { withFileTypes: true })).filter((entry) =>
    entry.isDirectory(),
  )
  const books: Entry<z.infer<typeof book>>[] = []
  for (const dir of bookDirs) {
    const raw: unknown = JSON.parse(
      await readFile(resolve(at('books'), dir.name, 'book.json'), 'utf8'),
    )
    books.push({ id: `${dir.name}/book`, data: book.parse(raw) })
  }

  const translationFiles = (await jsonFilesIn(data)).filter(
    (file) => TRANSLATED.test(file) && !file.includes(`${sep}media${sep}`),
  )
  const translations = await Promise.all(
    translationFiles.map(async (file) => ({
      id: idFor(data, file),
      data: JSON.parse(await readFile(file, 'utf8')) as unknown,
    })),
  )

  return {
    skills,
    skillTrees,
    skillLists,
    speciesEntries,
    states,
    equipmentItems,
    equipmentSets,
    materials,
    environments,
    catalogues,
    vocabularies,
    tags,
    books,
    translations,
  }
}

export type AtlasWorldSources = {
  id: string
  world: AtlasWorld
  surface: AtlasSurface
  places: AtlasPlaces
  landmarks: AtlasLandmarks
  routes: AtlasRoutes
  establishments: AtlasEstablishments
  sky: AtlasSky
  underground: AtlasUnderground
}

export type AtlasSources = {
  vocabularies: AtlasVocabularies
  travel: AtlasTravel
  worlds: AtlasWorldSources[]
}

async function parsedFile<T>(path: string, schema: z.ZodType<T>, label: string): Promise<T> {
  const parsed = schema.safeParse(JSON.parse(await readFile(path, 'utf8')))
  if (parsed.success) return parsed.data
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n  ')
  throw new Error(`${label} does not match its schema\n  ${issues}`)
}

export async function readAtlasSources(root: string): Promise<AtlasSources> {
  const base = resolve(root, 'data/atlas')
  const part = <T>(world: string, file: string, schema: z.ZodType<T>) =>
    parsedFile(resolve(base, world, `${file}.json`), schema, `atlas/${world}/${file}`)
  const worldIds = (await readdir(base, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
  const worlds = await Promise.all(
    worldIds.map(async (id) => ({
      id,
      world: await part(id, 'world', atlasWorld),
      surface: await part(id, 'surface', atlasSurface),
      places: await part(id, 'places', atlasPlaces),
      landmarks: await part(id, 'landmarks', atlasLandmarks),
      routes: await part(id, 'routes', atlasRoutes),
      establishments: await part(id, 'establishments', atlasEstablishments),
      sky: await part(id, 'sky', atlasSky),
      underground: await part(id, 'underground', atlasUnderground),
    })),
  )
  return {
    vocabularies: await parsedFile(
      resolve(base, 'vocabularies.json'),
      atlasVocabularies,
      'atlas/vocabularies',
    ),
    travel: await parsedFile(resolve(base, 'travel.json'), atlasTravel, 'atlas/travel'),
    worlds,
  }
}

export async function readCorpus(root: string, locale: Locale): Promise<Corpus> {
  return buildCorpus(await readSources(root), locale)
}
