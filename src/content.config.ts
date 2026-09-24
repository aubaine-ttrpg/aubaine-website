import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

import {
  book,
  equipmentCatalogue,
  equipmentItem,
  equipmentSet,
  policy,
  skill,
  skillList,
  skillTree,
  species,
  state,
  TAG_TAXONOMY_FILE,
  tagTaxonomy,
  vocabulary,
} from './lib/game/schema'

const generateId = ({ entry }: { entry: string }) => entry.replace(/\.(json|md)$/, '')

const CANONICAL_JSON = ['**/*.json', '!**/*.[a-z][a-z].json']
const TRANSLATED_JSON = ['**/*.[a-z][a-z].json']

const jsonIn = (dir: string) => glob({ base: `./data/${dir}`, pattern: CANONICAL_JSON, generateId })

const skills = defineCollection({ loader: jsonIn('skills'), schema: skill })
const skillTrees = defineCollection({ loader: jsonIn('skill-trees'), schema: skillTree })
const skillLists = defineCollection({ loader: jsonIn('skill-lists'), schema: skillList })
const speciesEntries = defineCollection({ loader: jsonIn('species'), schema: species })
const states = defineCollection({ loader: jsonIn('states'), schema: state })
const equipmentItems = defineCollection({
  loader: jsonIn('equipment/items'),
  schema: equipmentItem,
})
const equipmentSets = defineCollection({ loader: jsonIn('equipment/sets'), schema: equipmentSet })

const catalogues = defineCollection({
  loader: glob({ base: './data/equipment', pattern: ['*.json'], generateId }),
  schema: equipmentCatalogue,
})

const prose = z.object({ title: z.string().min(1), description: z.string().min(1).optional() })

const equipmentGuide = defineCollection({
  loader: glob({ base: './data/equipment', pattern: ['*.md'], generateId }),
  schema: prose,
})

const vocabularies = defineCollection({
  loader: glob({
    base: './data/meta',
    pattern: [...CANONICAL_JSON, `!${TAG_TAXONOMY_FILE}`],
    generateId,
  }),
  schema: z.object({ entries: vocabulary }),
})

const tags = defineCollection({
  loader: glob({ base: './data/meta', pattern: [TAG_TAXONOMY_FILE], generateId }),
  schema: tagTaxonomy,
})

const books = defineCollection({
  loader: glob({ base: './data/books', pattern: ['*/book.json'], generateId }),
  schema: book,
})

const bookPages = defineCollection({
  loader: glob({ base: './data/books', pattern: ['**/*.md'], generateId }),
  schema: prose,
})

const lore = defineCollection({
  loader: glob({ base: './data/lore', pattern: ['**/*.md'], generateId }),
  schema: z.object({}).strict(),
})

const policies = defineCollection({
  loader: glob({ base: './src/content/policies', pattern: ['*.md'], generateId }),
  schema: policy,
})

const translations = defineCollection({
  loader: glob({ base: './data', pattern: TRANSLATED_JSON, generateId }),
  schema: z.record(z.string(), z.unknown()),
})

export const collections = {
  skills,
  skillTrees,
  skillLists,
  speciesEntries,
  states,
  equipmentItems,
  equipmentSets,
  catalogues,
  equipmentGuide,
  vocabularies,
  tags,
  books,
  bookPages,
  lore,
  policies,
  translations,
}
