import { DEFAULT_LOCALE, type Locale } from '../i18n/locales.ts'
import { pathFor } from '../i18n/routes.ts'
import { strings } from '../i18n/strings.ts'
import {
  characteristicKey,
  collator,
  primeCharacteristics,
  slugify,
  speciesPool,
  treeDomains,
  VARIABLE_CHARACTERISTIC,
} from './derive.ts'
import { buildTermPattern, flattenText, type TermIndex, type TermRecord } from './richtext.ts'
import type {
  Book,
  ContentStatus,
  EquipmentCatalogue,
  EquipmentItem,
  EquipmentSet,
  GameState,
  Skill,
  SkillList,
  SkillTree,
  Species,
  Subspecies,
  TagKind,
  TagTaxonomy,
  VocabularyEntry,
} from './schema.ts'
import { overlays } from './schema.ts'
import { inheritedStatus } from './status.ts'

export type ResolvedPlacement = {
  skill: Skill
  pos?: { x: number; y: number } | undefined
  linked?: string[] | undefined
}

export type ResolvedTree = Omit<SkillTree, 'placements'> & {
  placements: ResolvedPlacement[]
  skills: Skill[]
  domains: string[]
  primeCharacteristics: string[]
}

export type ResolvedSubspecies = Subspecies & { offeredSkills: Skill[] }

export type ResolvedSpecies = Omit<Species, 'subspecies'> & {
  offeredSkills: Skill[]
  subspecies: ResolvedSubspecies[]
  pool: Skill[]
}

export type ResolvedSection = {
  key: string
  title: string
  family: string
  slot?: string | undefined
  items: EquipmentItem[]
}

export type SkillOrigin = {
  trees: { id: string; name: string }[]
  species: { id: string; name: string; subspecies?: { id: string; name: string } }[]
  basic: boolean
  bank: boolean
  items: { slug: string; name: string; section: string }[]
  sets: { id: string; name: string }[]
}

export type ResolvedBook = Book & { hasChapters: boolean }

export type ResolvedTag = {
  key: string
  kind: TagKind
  labelFr: string
  labelEn: string
  definitionFr: string
  definitionEn: string
  practices?: string[] | undefined
}

type GlossaryWord = {
  key: string
  spellings: string[]
  record: Omit<TermRecord, 'spelling'>
}

export type GlossaryTerm = GlossaryWord &
  (
    | { family: 'rule'; tag: string | undefined }
    | { family: 'characteristic' | 'aptitude' }
    | { family: 'state'; state: GameState }
  )

export type Corpus = {
  locale: Locale
  creatureTypes: Map<string, VocabularyEntry>
  sizes: Map<string, VocabularyEntry>
  languages: Map<string, VocabularyEntry>
  domains: Map<string, VocabularyEntry>
  characteristics: Map<string, VocabularyEntry>
  aptitudes: Map<string, VocabularyEntry>
  nodeTypes: Map<string, VocabularyEntry>
  rarities: Map<string, VocabularyEntry>
  disciplines: Map<string, VocabularyEntry>
  coins: Map<string, VocabularyEntry>
  slots: Map<string, VocabularyEntry>
  tags: Map<string, ResolvedTag>
  skills: Map<string, Skill>
  trees: ResolvedTree[]
  treesById: Map<string, ResolvedTree>
  species: ResolvedSpecies[]
  speciesById: Map<string, ResolvedSpecies>
  states: GameState[]
  statesByName: Map<string, GameState>
  basic: SkillList & { resolved: Skill[] }
  bank: SkillList & { resolved: Skill[] }
  catalogue: EquipmentCatalogue
  sections: ResolvedSection[]
  items: EquipmentItem[]
  itemsBySlug: Map<string, EquipmentItem>
  sets: Map<string, EquipmentSet>
  origins: Map<string, SkillOrigin>
  skillStatus: Map<string, ContentStatus>
  books: ResolvedBook[]
  glossary: GlossaryTerm[]
  terms: TermIndex
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export type OverlayLookup = (path: string) => Record<string, unknown> | undefined

export function overlayLookupFrom(
  entries: { id: string; data: unknown }[],
  locale: Locale,
): OverlayLookup {
  if (locale === DEFAULT_LOCALE) return () => undefined
  const map = new Map<string, Record<string, unknown>>()
  for (const entry of entries) {
    if (!entry.id.endsWith(`.${locale}`)) continue
    if (isRecord(entry.data)) map.set(entry.id.slice(0, -(locale.length + 1)), entry.data)
  }
  return (path) => map.get(path)
}

function mergeSkill(base: Skill, patch: Record<string, unknown> | undefined): Skill {
  if (!patch) return base
  const parsed = overlays.skill.safeParse(patch)
  if (!parsed.success) return base
  const { upgrades: upgradePatch, ...rest } = parsed.data
  const merged: Skill = { ...base, ...pruned(rest) }
  if (upgradePatch && base.upgrades) {
    merged.upgrades = base.upgrades.map((upgrade) => {
      const item = upgradePatch[String(upgrade.level)]
      return item ? { ...upgrade, ...pruned(item) } : upgrade
    })
  }
  return merged
}

type Defined<T> = { [K in keyof T]?: Exclude<T[K], undefined> }

function pruned<T extends Record<string, unknown>>(value: T): Defined<T> {
  const out: Record<string, unknown> = {}
  for (const [key, inner] of Object.entries(value)) {
    if (inner !== undefined) out[key] = inner
  }
  return out as Defined<T>
}

function vocabularyMap(entries: VocabularyEntry[]): Map<string, VocabularyEntry> {
  return new Map(entries.map((entry) => [entry.key, entry]))
}

type Labelled = { labelFr: string; labelEn: string }

type Glossed = { definitionFr?: string | undefined; definitionEn?: string | undefined }

export function label(entry: Labelled | undefined, locale: Locale, fallback: string): string {
  if (!entry) return fallback
  return locale === 'en' ? entry.labelEn : entry.labelFr
}

export function definition(entry: Glossed | undefined, locale: Locale): string | undefined {
  if (!entry) return undefined
  return locale === 'en' ? entry.definitionEn : entry.definitionFr
}

function resolveTags(taxonomy: TagTaxonomy): Map<string, ResolvedTag> {
  const map = new Map<string, ResolvedTag>()
  for (const entry of taxonomy.practices) map.set(entry.key, { ...entry, kind: 'practice' })
  for (const entry of taxonomy.schools) map.set(entry.key, { ...entry, kind: 'school' })
  for (const entry of taxonomy.specials) map.set(entry.key, { ...entry, kind: 'special' })
  return map
}

export type CorpusSources = {
  skills: Entry<Skill>[]
  skillTrees: Entry<SkillTree>[]
  skillLists: Entry<SkillList>[]
  speciesEntries: Entry<Species>[]
  states: Entry<GameState>[]
  equipmentItems: Entry<EquipmentItem>[]
  equipmentSets: Entry<EquipmentSet>[]
  catalogues: Entry<EquipmentCatalogue>[]
  vocabularies: Entry<{ entries: VocabularyEntry[] }>[]
  tags: Entry<TagTaxonomy>[]
  books: Entry<Book>[]
  translations: { id: string; data: unknown }[]
}

export type Entry<T> = { id: string; data: T }

export function buildCorpus(sources: CorpusSources, locale: Locale): Corpus {
  const t = strings(locale)
  const overlayOf = overlayLookupFrom(sources.translations, locale)

  const skillEntries = sources.skills
  const treeEntries = sources.skillTrees
  const listEntries = sources.skillLists
  const speciesSources = sources.speciesEntries
  const stateEntries = sources.states
  const itemEntries = sources.equipmentItems
  const setEntries = sources.equipmentSets
  const catalogueEntries = sources.catalogues
  const vocabularyEntries = sources.vocabularies
  const bookEntries = sources.books

  const vocabularyFor = (id: string): Map<string, VocabularyEntry> => {
    const found = vocabularyEntries.find((entry) => entry.id === id)
    return vocabularyMap(found ? found.data.entries : [])
  }

  const creatureTypes = vocabularyFor('creature-types')
  const sizes = vocabularyFor('sizes')
  const languages = vocabularyFor('languages')
  const domains = vocabularyFor('domains')
  const characteristics = vocabularyFor('characteristics')
  const aptitudes = vocabularyFor('aptitudes')
  const nodeTypes = vocabularyFor('node-types')
  const rarities = vocabularyFor('rarities')
  const disciplines = vocabularyFor('disciplines')
  const coins = vocabularyFor('coins')
  const slots = vocabularyFor('slots')

  const taxonomyEntry = sources.tags.find((entry) => entry.id === 'tags')
  if (!taxonomyEntry) throw new Error('data/meta/tags.json is missing')
  const tags = resolveTags(taxonomyEntry.data)

  const skills = new Map<string, Skill>()
  for (const entry of skillEntries) {
    skills.set(entry.data.id, mergeSkill(entry.data, overlayOf(`skills/${entry.data.id}`)))
  }

  const trees: ResolvedTree[] = []
  for (const entry of treeEntries) {
    const patch = overlays.skillTree.safeParse(overlayOf(`skill-trees/${entry.data.id}`) ?? {})
    const localized = patch.success ? pruned(patch.data) : {}
    const placements: ResolvedPlacement[] = []
    for (const placement of entry.data.placements) {
      const skill = skills.get(placement.skill)
      if (!skill) continue
      placements.push({ skill, pos: placement.pos, linked: placement.linked })
    }
    const treeSkills = placements.map((placement) => placement.skill)
    const core = entry.data.core
      ? { ...entry.data.core, ...pruned(localized.core ?? {}) }
      : undefined
    trees.push({
      ...entry.data,
      ...pruned({ name: localized.name }),
      core,
      placements,
      skills: treeSkills,
      domains: treeDomains(treeSkills, entry.data.core?.domains ?? []),
      primeCharacteristics: primeCharacteristics(treeSkills),
    })
  }
  trees.sort((a, b) => collator(locale).compare(a.name, b.name))

  const localizedSpecies = new Map<string, Species>()
  for (const entry of speciesSources) {
    const patch = overlays.species.safeParse(overlayOf(`species/${entry.data.id}`) ?? {})
    if (!patch.success) {
      localizedSpecies.set(entry.data.id, entry.data)
      continue
    }
    const { subspecies: subspeciesPatch, roleplay: roleplayPatch, ...rest } = patch.data
    const merged: Species = { ...entry.data, ...pruned(rest) }
    if (subspeciesPatch && entry.data.subspecies) {
      merged.subspecies = entry.data.subspecies.map((sub) => {
        const item = subspeciesPatch[sub.id]
        return item ? { ...sub, ...pruned(item) } : sub
      })
    }
    if (roleplayPatch && entry.data.roleplay) {
      merged.roleplay = { ...entry.data.roleplay, ...pruned(roleplayPatch) }
    }
    localizedSpecies.set(entry.data.id, merged)
  }

  const skillsOf = (ids: string[]): Skill[] =>
    ids.map((id) => skills.get(id)).filter((value): value is Skill => Boolean(value))

  const species: ResolvedSpecies[] = []
  for (const entry of localizedSpecies.values()) {
    const offeredSkills = skillsOf(entry.offered)
    const subspecies = (entry.subspecies ?? []).map((sub) => ({
      ...sub,
      offeredSkills: skillsOf(sub.offered),
    }))
    species.push({
      ...entry,
      offeredSkills,
      subspecies,
      pool: subspecies.reduce((pool, sub) => speciesPool(pool, sub.offeredSkills), offeredSkills),
    })
  }
  species.sort((a, b) => collator(locale).compare(a.name, b.name))
  const speciesById = new Map(species.map((entry) => [entry.id, entry]))

  const states: GameState[] = stateEntries
    .map((entry) => {
      const patch = overlays.state.safeParse(overlayOf(`states/${entry.data.key}`) ?? {})
      return patch.success ? { ...entry.data, ...pruned(patch.data) } : entry.data
    })
    .sort((a, b) => collator(locale).compare(a.name, b.name))

  const resolveList = (id: string): SkillList & { resolved: Skill[] } => {
    const found = listEntries.find((entry) => entry.id === id)
    const base: SkillList = found ? found.data : { name: id, skills: [] }
    const patch = overlays.skillList.safeParse(overlayOf(`skill-lists/${id}`) ?? {})
    const localized = patch.success ? pruned(patch.data) : {}
    return {
      ...base,
      ...localized,
      resolved: base.skills
        .map((key) => skills.get(key))
        .filter((value): value is Skill => Boolean(value)),
    }
  }

  const basic = resolveList('basic-skills')
  const bank = resolveList('common-bank')

  const catalogueEntry = catalogueEntries.find((entry) => entry.id === 'catalogue')
  if (!catalogueEntry) throw new Error('data/equipment/catalogue.json is missing')
  const cataloguePatch = overlays.equipmentCatalogue.safeParse(
    overlayOf('equipment/catalogue') ?? {},
  )
  const catalogueLocalized = cataloguePatch.success ? pruned(cataloguePatch.data) : {}
  const catalogue: EquipmentCatalogue = {
    ...catalogueEntry.data,
    ...pruned({ name: catalogueLocalized.name, subtitle: catalogueLocalized.subtitle }),
    sections: catalogueEntry.data.sections.map((section) => ({
      ...section,
      title: catalogueLocalized.sections?.[section.key] ?? section.title,
    })),
  }

  const itemsBySlug = new Map<string, EquipmentItem>()
  for (const entry of itemEntries) {
    const patch = overlays.equipmentItem.safeParse(overlayOf(`equipment/items/${entry.id}`) ?? {})
    if (!patch.success) {
      itemsBySlug.set(entry.id, entry.data)
      continue
    }
    const { craft: craftPatch, ...rest } = patch.data
    const merged: EquipmentItem = { ...entry.data, ...pruned(rest) }
    if (craftPatch && entry.data.craft) {
      merged.craft = { ...entry.data.craft, ...pruned(craftPatch) }
    }
    itemsBySlug.set(entry.id, merged)
  }

  const sections: ResolvedSection[] = catalogue.sections.map((section) => ({
    key: section.key,
    title: section.title,
    family: section.family,
    ...(section.slot === undefined ? {} : { slot: section.slot }),
    items: [...itemsBySlug.entries()]
      .filter(([, item]) => item.section === section.key)
      .map(([, item]) => item)
      .sort((a, b) => a.position - b.position),
  }))
  const items = sections.flatMap((section) => section.items)

  const sets = new Map<string, EquipmentSet>()
  for (const entry of setEntries) {
    const patch = overlays.equipmentSet.safeParse(
      overlayOf(`equipment/sets/${entry.data.id}`) ?? {},
    )
    const localized = patch.success ? pruned(patch.data) : {}
    sets.set(entry.data.id, {
      ...entry.data,
      ...pruned({ name: localized.name }),
      bonuses: entry.data.bonuses.map((bonus) => ({
        ...bonus,
        text: localized.bonuses?.[String(bonus.pieces)]?.text ?? bonus.text,
      })),
    })
  }

  const origins = new Map<string, SkillOrigin>()
  const origin = (id: string): SkillOrigin => {
    let found = origins.get(id)
    if (!found) {
      found = { trees: [], species: [], basic: false, bank: false, items: [], sets: [] }
      origins.set(id, found)
    }
    return found
  }
  for (const tree of trees) {
    for (const skill of tree.skills) origin(skill.id).trees.push({ id: tree.id, name: tree.name })
  }
  for (const entry of species) {
    for (const skill of entry.offeredSkills) {
      origin(skill.id).species.push({ id: entry.id, name: entry.name })
    }
    for (const sub of entry.subspecies) {
      for (const skill of sub.offeredSkills) {
        origin(skill.id).species.push({
          id: entry.id,
          name: entry.name,
          subspecies: { id: sub.id, name: sub.name },
        })
      }
    }
  }
  for (const skill of basic.resolved) origin(skill.id).basic = true
  for (const skill of bank.resolved) origin(skill.id).bank = true
  for (const [slug, item] of itemsBySlug) {
    const section = catalogue.sections.find((entry) => entry.key === item.section)
    for (const id of item.grants ?? []) {
      origin(id).items.push({ slug, name: item.name, section: section?.title ?? item.section })
    }
  }
  for (const set of sets.values()) {
    for (const bonus of set.bonuses) {
      for (const id of bonus.grants ?? []) origin(id).sets.push({ id: set.id, name: set.name })
    }
  }

  const treeStatusById = new Map(trees.map((tree) => [tree.id, tree.status]))
  const skillStatus = new Map<string, ContentStatus>()
  for (const skill of skills.values()) {
    const source = origins.get(skill.id)
    const resolved = inheritedStatus(skill.status, [
      (source?.trees ?? []).map((tree) => treeStatusById.get(tree.id)),
      (source?.species ?? []).map((entry) => speciesById.get(entry.id)?.status),
      (source?.items ?? []).map((item) => itemsBySlug.get(item.slug)?.status),
      (source?.sets ?? []).map((set) => sets.get(set.id)?.status),
    ])
    if (resolved) skillStatus.set(skill.id, resolved)
  }

  const books: ResolvedBook[] = bookEntries
    .map((entry) => {
      const patch = overlays.book.safeParse(overlayOf(`books/${entry.data.id}/book`) ?? {})
      const localized = patch.success ? pruned(patch.data) : {}
      return { ...entry.data, ...localized, hasChapters: entry.data.chapters.length > 0 }
    })
    .sort((a, b) => a.order - b.order)

  const glossary = buildGlossary({ locale, characteristics, aptitudes, tags, states, bank, t })
  const terms = buildTermIndex({ locale, characteristics, glossary, trees, basic, bank, t })

  return {
    locale,
    creatureTypes,
    sizes,
    languages,
    domains,
    characteristics,
    aptitudes,
    nodeTypes,
    rarities,
    disciplines,
    coins,
    slots,
    tags,
    skills,
    trees,
    treesById: new Map(trees.map((tree) => [tree.id, tree])),
    species,
    speciesById,
    states,
    statesByName: new Map(states.map((state) => [state.name.toLowerCase(), state])),
    basic,
    bank,
    catalogue,
    sections,
    items,
    itemsBySlug,
    sets,
    origins,
    skillStatus,
    books,
    glossary,
    terms,
  }
}

type GlossaryInput = {
  locale: Locale
  characteristics: Map<string, VocabularyEntry>
  aptitudes: Map<string, VocabularyEntry>
  tags: Map<string, ResolvedTag>
  states: GameState[]
  bank: SkillList
  t: ReturnType<typeof strings>
}

type TermInput = {
  locale: Locale
  characteristics: Map<string, VocabularyEntry>
  glossary: GlossaryTerm[]
  trees: ResolvedTree[]
  basic: SkillList & { resolved: Skill[] }
  bank: SkillList & { resolved: Skill[] }
  t: ReturnType<typeof strings>
}

const APTITUDE_ICON = 'mdi/rhombus-outline'

type RuleTerm = {
  fr: readonly [string, ...string[]]
  en: readonly [string, ...string[]]
  color: string
  icon: string
} & ({ definition: Record<Locale, string> } | { tag: string } | { skillList: 'bank' })

const RULE_TERMS: readonly RuleTerm[] = [
  {
    fr: ['Avantage', 'Avantages'],
    en: ['Advantage', 'Advantages'],
    color: 'var(--term-adv)',
    icon: 'mdi/chevron-double-up',
    definition: {
      fr: "Ajoute un d12 au Jet. Gardez les deux meilleurs dés. Un Avantage et un Désavantage s'annulent.",
      en: 'Adds a d12 to the Roll. Keep the two highest dice. An Advantage and a Disadvantage cancel out.',
    },
  },
  {
    fr: ['Désavantage', 'Désavantages'],
    en: ['Disadvantage', 'Disadvantages'],
    color: 'var(--term-dis)',
    icon: 'mdi/chevron-double-down',
    definition: {
      fr: "Ajoute un d12 au Jet. Gardez les deux moins bons dés. Un Désavantage et un Avantage s'annulent.",
      en: 'Adds a d12 to the Roll. Keep the two lowest dice. A Disadvantage and an Advantage cancel out.',
    },
  },
  {
    fr: ['Attaque', 'Attaques'],
    en: ['Attack', 'Attacks'],
    color: 'var(--term-atk)',
    icon: 'game-icons/crossed-swords',
    definition: {
      fr: "Un Jet porté contre la CA d'une cible pour la toucher.",
      en: "A Roll made against a target's AC to hit it.",
    },
  },
  {
    fr: ['Jet', 'Jets'],
    en: ['Roll', 'Rolls'],
    color: 'var(--term-roll)',
    icon: 'game-icons/rolling-dices',
    definition: {
      fr: '2d12 + une Caractéristique + une Aptitude, comparé à un DD, à une CA ou à un Jet opposé.',
      en: '2d12 + one Characteristic + one Aptitude, measured against a DC, an AC or an Opposed Roll.',
    },
  },
  {
    fr: ['Sort', 'Sorts'],
    en: ['Spell', 'Spells'],
    color: 'var(--term-spell)',
    icon: 'game-icons/magic-swirl',
    tag: 'spell',
  },
  {
    fr: ['Caractéristique', 'Caractéristiques'],
    en: ['Characteristic', 'Characteristics'],
    color: 'var(--accent-ink)',
    icon: 'mdi/hexagon',
    definition: {
      fr: "L'une des six valeurs de base d'un personnage. Elle forme la moitié de chaque Jet.",
      en: "One of a character's six core scores. It makes up half of every Roll.",
    },
  },
  {
    fr: ['Aptitude', 'Aptitudes'],
    en: ['Aptitude', 'Aptitudes'],
    color: 'var(--term-apt)',
    icon: APTITUDE_ICON,
    definition: {
      fr: 'Un domaine de savoir-faire. Elle forme la moitié de chaque Jet.',
      en: 'A field of know-how. It makes up half of every Roll.',
    },
  },
  {
    fr: ['DD'],
    en: ['DC'],
    color: 'var(--term-roll)',
    icon: 'mdi/bullseye-arrow',
    definition: {
      fr: "La difficulté qu'un Jet doit atteindre, fixée par le MJ ou par une règle.",
      en: 'The difficulty a Roll has to reach, set by the GM or by a rule.',
    },
  },
  {
    fr: ['CA'],
    en: ['AC'],
    color: 'var(--term-roll)',
    icon: 'game-icons/breastplate',
    definition: {
      fr: "La Classe d'armure, le total qu'une Attaque doit atteindre pour vous toucher.",
      en: 'Armour Class, the total an Attack has to reach to hit you.',
    },
  },
  {
    fr: ['Action Bonus'],
    en: ['Bonus Action', 'Bonus Actions'],
    color: 'var(--term-bonus)',
    icon: 'mdi/triangle',
    definition: {
      fr: "Une action rapide faite durant votre tour. Vous en avez une par tour. Généralement réservée aux Compétences qui l'indiquent.",
      en: 'A quick action taken during your turn. You have one per turn. Usually reserved for Skills that say so.',
    },
  },
  {
    fr: ['Réaction', 'Réactions'],
    en: ['Reaction', 'Reactions'],
    color: 'var(--term-reaction)',
    icon: 'mdi/rhombus',
    definition: {
      fr: 'Une action jouée hors de votre tour, en réponse à un déclencheur. Vous en avez une par tour.',
      en: 'An action played outside your turn, in response to a trigger. You have one per turn.',
    },
  },
  {
    fr: ['Action', 'Actions'],
    en: ['Action', 'Actions'],
    color: 'var(--term-action)',
    icon: 'mdi/circle',
    definition: {
      fr: "L'action principale de votre tour. Vous en avez une par tour.",
      en: 'The main action of your turn. You have one per turn.',
    },
  },
  {
    fr: ['Passif', 'Passive'],
    en: ['Passive'],
    color: 'var(--term-passive)',
    icon: 'mdi/square',
    definition: {
      fr: "Une Compétence qui s'applique sans coûter d'action.",
      en: 'A Skill that applies without costing an action.',
    },
  },
  {
    fr: ['Déplacement', 'Déplacements'],
    en: ['Movement', 'Movements'],
    color: 'var(--term-move)',
    icon: 'game-icons/walking-boot',
    definition: {
      fr: "La distance que vous parcourez à votre tour, jusqu'à votre Vitesse.",
      en: 'The distance you cover on your turn, up to your Speed.',
    },
  },
  {
    fr: ['Prérequis'],
    en: ['Prerequisite', 'Prerequisites'],
    color: 'var(--term-roll)',
    icon: 'mdi/lock',
    definition: {
      fr: 'Une condition à remplir pour acheter une Compétence.',
      en: 'A condition to meet to buy a Skill.',
    },
  },
  {
    fr: ['Banque Commune'],
    en: ['Common Bank'],
    color: 'var(--accent-ink)',
    icon: 'mdi/bank',
    skillList: 'bank',
  },
  {
    fr: ['PdV'],
    en: ['HP'],
    color: 'var(--term-res)',
    icon: 'game-icons/heart-organ',
    definition: {
      fr: "Les Points de vie, ce qu'une créature peut encaisser. À 0, elle tombe en Agonie.",
      en: 'Hit Points, what a creature can take. At 0, it falls into Agonie.',
    },
  },
  {
    fr: ['Énergie'],
    en: ['Energy'],
    color: 'var(--term-res)',
    icon: 'mdi/lightning-bolt',
    definition: {
      fr: 'La réserve qui paie le coût des Compétences.',
      en: 'The reserve that pays the cost of Skills.',
    },
  },
  {
    fr: ['Mémoire'],
    en: ['Memory'],
    color: 'var(--term-res)',
    icon: 'mdi/memory',
    definition: {
      fr: 'Le nombre de Compétences que vous pouvez avoir Mémorisées en même temps.',
      en: 'The number of Skills you can have Memorised at the same time.',
    },
  },
  {
    fr: ['Mémorisée', 'Mémorisées', 'Mémorisé', 'Mémorisés', 'mémoriser', 'mémorisez', 'mémorise'],
    en: ['Memorised', 'memorise', 'memorising'],
    color: 'var(--term-res)',
    icon: 'mdi/brain',
    definition: {
      fr: "Se dit d'une Compétence que vous portez et pouvez jouer. Vous pouvez changer les vôtres pendant un repos.",
      en: 'Said of a Skill you carry and can play. You can change yours during a rest.',
    },
  },
  {
    fr: ['Expertise'],
    en: ['Expertise'],
    color: 'var(--term-adv)',
    icon: 'mdi/medal',
    definition: {
      fr: "Donne 1 Avantage à chaque Jet qui emploie l'Aptitude concernée.",
      en: 'Gives 1 Advantage on every Roll that uses the Aptitude in question.',
    },
  },
  {
    fr: ['Repos court', 'Repos courts'],
    en: ['Short Rest', 'Short Rests'],
    color: 'var(--term-res)',
    icon: 'mdi/campfire',
    definition: {
      fr: 'Dix minutes de pause, durant lesquelles vous pouvez faire une activité légère, qui rendent la moitié de vos PdV et de votre Énergie maximum. Vous pouvez faire au maximum 2 Repos courts par Repos long.',
      en: 'Ten minutes of pause, during which you can do light activity, that restore half your maximum HP and Energy. You can take at most 2 Short Rests per Long Rest.',
    },
  },
  {
    fr: ['Repos long', 'Repos longs'],
    en: ['Long Rest', 'Long Rests'],
    color: 'var(--term-res)',
    icon: 'mdi/bed',
    definition: {
      fr: 'Huit heures de sommeil, une fois par jour, qui rendent tous vos PdV et toute votre Énergie.',
      en: 'Eight hours of sleep, once per day, that restore all your HP and all your Energy.',
    },
  },
  {
    fr: ['Karma'],
    en: ['Karma'],
    color: 'var(--term-res)',
    icon: 'game-icons/spiked-halo',
    definition: {
      fr: 'Des points accordés par le MJ. Par défaut, un point peut ajouter un Avantage ou un Désavantage au Jet de votre choix.',
      en: 'Points granted by the GM. By default, a point can add an Advantage or a Disadvantage to the Roll of your choice.',
    },
  },
]

const FALLBACK_ICON = 'mdi/hexagon'

function iconPath(name: string | undefined): string {
  return name ? name.replace(':', '/') : FALLBACK_ICON
}

function spellingsOf(entry: VocabularyEntry): string[] {
  return [entry.labelFr, ...(entry.formsFr ?? []), entry.labelEn, ...(entry.formsEn ?? [])]
}

function typeLabel(type: Skill['type'], t: ReturnType<typeof strings>): string {
  if (type === 'passive') return t.passive
  if (type === 'special') return t.special
  return t.active
}

function requiredDefinition(entry: Glossed, locale: Locale, where: string): string {
  const text = definition(entry, locale)
  if (text === undefined) throw new Error(`${where} has no ${locale} definition`)
  return text
}

function ruleTermDefinition(
  rule: RuleTerm,
  tags: Map<string, ResolvedTag>,
  bank: SkillList,
  locale: Locale,
): string {
  if ('definition' in rule) return rule.definition[locale]
  if ('skillList' in rule) {
    if (!bank.note?.trim()) {
      throw new Error(
        `rule term ${rule.fr[0]} reads the note of data/skill-lists/common-bank.json, which has none`,
      )
    }
    return bank.note
  }
  const tag = tags.get(rule.tag)
  if (!tag)
    throw new Error(
      `rule term ${rule.fr[0]} reads the tag ${rule.tag}, which data/meta/tags.json does not declare`,
    )
  return requiredDefinition(tag, locale, `data/meta/tags.json ${tag.key}`)
}

function buildGlossary(input: GlossaryInput): GlossaryTerm[] {
  const { locale, characteristics, aptitudes, tags, states, bank, t } = input
  const english = locale === 'en'
  const glossary: GlossaryTerm[] = []

  for (const rule of RULE_TERMS) {
    glossary.push({
      family: 'rule',
      key: slugify(rule.fr[0]),
      tag: 'tag' in rule ? rule.tag : undefined,
      spellings: [...rule.fr, ...rule.en],
      record: {
        family: 'rule',
        kind: t.ruleTerm,
        title: english ? rule.en[0] : rule.fr[0],
        meta: '',
        color: rule.color,
        icon: rule.icon,
        text: ruleTermDefinition(rule, tags, bank, locale),
      },
    })
  }

  for (const entry of characteristics.values()) {
    if (entry.key === VARIABLE_CHARACTERISTIC) continue
    glossary.push({
      family: 'characteristic',
      key: entry.key,
      spellings: spellingsOf(entry),
      record: {
        family: 'characteristic',
        kind: t.characteristic,
        title: english ? entry.labelEn : entry.labelFr,
        meta: '',
        color: entry.color ?? 'var(--accent-ink)',
        icon: iconPath(entry.iconName),
        text: requiredDefinition(entry, locale, `data/meta/characteristics.json ${entry.key}`),
      },
    })
  }

  for (const entry of aptitudes.values()) {
    glossary.push({
      family: 'aptitude',
      key: entry.key,
      spellings: spellingsOf(entry),
      record: {
        family: 'aptitude',
        kind: t.aptitude,
        title: english ? entry.labelEn : entry.labelFr,
        meta: '',
        color: entry.color ?? 'var(--term-apt)',
        icon: APTITUDE_ICON,
        text: requiredDefinition(entry, locale, `data/meta/aptitudes.json ${entry.key}`),
      },
    })
  }

  for (const state of states) {
    const kindLabel =
      state.kind === 'buff' ? t.buff : state.kind === 'debuff' ? t.debuff : t.neutral
    glossary.push({
      family: 'state',
      key: state.key,
      state,
      spellings: [state.name, ...(state.forms ?? [])],
      record: {
        family: 'state',
        kind: t.states,
        title: state.name,
        meta: kindLabel,
        color:
          state.kind === 'buff'
            ? 'var(--state-buff)'
            : state.kind === 'debuff'
              ? 'var(--state-debuff)'
              : 'var(--state-neutral)',
        icon: iconPath(state.icon),
        text: flattenText(state.description, 240),
      },
    })
  }

  return glossary
}

function buildTermIndex(input: TermInput): TermIndex {
  const { locale, characteristics, glossary, trees, basic, bank, t } = input
  const map = new Map<string, TermRecord>()

  const put = (name: string, record: Omit<TermRecord, 'spelling'>): void => {
    const key = name.toLowerCase()
    if (!key || map.has(key)) return
    map.set(key, { ...record, spelling: name })
  }

  for (const term of glossary) {
    for (const word of term.spellings) put(word, term.record)
  }

  for (const tree of trees) {
    for (const skill of tree.skills) {
      const first = skill.characteristics?.[0]
      put(skill.title, {
        family: 'skill',
        skillId: skill.id,
        kind: t.spells,
        title: skill.title,
        meta: `${typeLabel(skill.type, t)} · ${tree.name}`,
        color: 'var(--accent-ink)',
        icon: first
          ? iconPath(characteristics.get(characteristicKey(first))?.iconName)
          : 'mdi/hexagon',
        text: flattenText(skill.description, 240),
        href: pathFor('tree', locale, { tree: tree.id, node: skill.id }),
      })
    }
  }

  for (const skill of basic.resolved) {
    put(skill.title, {
      family: 'skill',
      skillId: skill.id,
      kind: t.basic,
      title: skill.title,
      meta: typeLabel(skill.type, t),
      color: 'var(--accent-ink)',
      icon: 'mdi/hexagon',
      text: flattenText(skill.description, 240),
      href: `${pathFor('skills', locale)}#e-${skill.id}`,
    })
  }

  for (const skill of bank.resolved) {
    const first = skill.characteristics?.[0]
    put(skill.title, {
      family: 'skill',
      skillId: skill.id,
      kind: bank.name,
      title: skill.title,
      meta: `${typeLabel(skill.type, t)} · ${bank.name}`,
      color: 'var(--accent-ink)',
      icon: first
        ? iconPath(characteristics.get(characteristicKey(first))?.iconName)
        : 'mdi/hexagon',
      text: flattenText(skill.description, 240),
      href: `${pathFor('skills', locale)}#e-${skill.id}`,
    })
  }

  return { map, pattern: buildTermPattern([...map.keys()]) }
}
