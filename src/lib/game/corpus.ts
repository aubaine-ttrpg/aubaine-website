import { getCollection } from 'astro:content'

import type { Locale } from '../i18n/locales.ts'
import { buildCorpus, type Corpus } from './build.ts'

export type {
  Corpus,
  CorpusSources,
  Entry,
  ResolvedBook,
  ResolvedPlacement,
  ResolvedSection,
  ResolvedSpecies,
  ResolvedSubspecies,
  ResolvedTree,
  SkillOrigin,
} from './build.ts'
export { definition, label } from './build.ts'

const CACHE = new Map<Locale, Promise<Corpus>>()

async function load(locale: Locale): Promise<Corpus> {
  const [
    skills,
    skillTrees,
    skillLists,
    speciesEntries,
    states,
    equipmentItems,
    equipmentSets,
    catalogues,
    vocabularies,
    tags,
    books,
    translations,
  ] = await Promise.all([
    getCollection('skills'),
    getCollection('skillTrees'),
    getCollection('skillLists'),
    getCollection('speciesEntries'),
    getCollection('states'),
    getCollection('equipmentItems'),
    getCollection('equipmentSets'),
    getCollection('catalogues'),
    getCollection('vocabularies'),
    getCollection('tags'),
    getCollection('books'),
    getCollection('translations'),
  ])

  return buildCorpus(
    {
      skills,
      skillTrees,
      skillLists,
      speciesEntries,
      states,
      equipmentItems,
      equipmentSets,
      catalogues,
      vocabularies,
      tags,
      books,
      translations,
    },
    locale,
  )
}

export function corpus(locale: Locale): Promise<Corpus> {
  let value = CACHE.get(locale)
  if (!value) {
    value = load(locale)
    CACHE.set(locale, value)
  }
  return value
}
