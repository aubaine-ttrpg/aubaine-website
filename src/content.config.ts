import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

import {
  atlasEstablishments,
  atlasLandmarks,
  atlasPlaces,
  atlasRoutes,
  atlasSky,
  atlasStars,
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
const materials = defineCollection({ loader: jsonIn('materials'), schema: material })
const environments = defineCollection({ loader: jsonIn('environments'), schema: environment })

const catalogues = defineCollection({
  loader: glob({ base: './data/equipment', pattern: ['*.json', '!*.[a-z][a-z].json'], generateId }),
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

const atlasFile = (pattern: string) =>
  glob({ base: './data/atlas', pattern: [pattern], generateId })

const atlasVocabularyLists = defineCollection({
  loader: atlasFile('vocabularies.json'),
  schema: atlasVocabularies,
})
const atlasTravelRules = defineCollection({ loader: atlasFile('travel.json'), schema: atlasTravel })
const atlasStarSystem = defineCollection({ loader: atlasFile('stars.json'), schema: atlasStars })
const atlasWorlds = defineCollection({ loader: atlasFile('*/world.json'), schema: atlasWorld })
const atlasSurfaces = defineCollection({
  loader: atlasFile('*/surface.json'),
  schema: atlasSurface,
})
const atlasPlaceLists = defineCollection({
  loader: atlasFile('*/places.json'),
  schema: atlasPlaces,
})
const atlasLandmarkLists = defineCollection({
  loader: atlasFile('*/landmarks.json'),
  schema: atlasLandmarks,
})
const atlasRouteLists = defineCollection({
  loader: atlasFile('*/routes.json'),
  schema: atlasRoutes,
})
const atlasEstablishmentLists = defineCollection({
  loader: atlasFile('*/establishments.json'),
  schema: atlasEstablishments,
})
const atlasSkies = defineCollection({ loader: atlasFile('*/sky.json'), schema: atlasSky })
const atlasUndergrounds = defineCollection({
  loader: atlasFile('*/underground.json'),
  schema: atlasUnderground,
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
  materials,
  environments,
  catalogues,
  equipmentGuide,
  vocabularies,
  tags,
  books,
  bookPages,
  lore,
  policies,
  atlasVocabularyLists,
  atlasTravelRules,
  atlasStarSystem,
  atlasWorlds,
  atlasSurfaces,
  atlasPlaceLists,
  atlasLandmarkLists,
  atlasRouteLists,
  atlasEstablishmentLists,
  atlasSkies,
  atlasUndergrounds,
  translations,
}
