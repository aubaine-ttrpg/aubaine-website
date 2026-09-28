import { DEFAULT_LOCALE, type Locale } from '../i18n/locales.ts'
import { pathFor, treeNodeHref } from '../i18n/routes.ts'
import { strings } from '../i18n/strings.ts'
import {
  characteristicKey,
  collator,
  DEFAULT_SUBSPECIES_LABEL,
  inCranOrder,
  inkOf,
  primeCharacteristics,
  slugify,
  speciesPool,
  stateInk,
  subspeciesSkills,
  treeDomains,
  treeTypeLabel,
  VARIABLE_CHARACTERISTIC,
} from './derive.ts'
import {
  flattenText,
  type LabelOf,
  pinReferenceLabels,
  type TermIndex,
  type TermRecord,
} from './richtext.ts'
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
  SubspeciesLabel,
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

export type ResolvedSubspecies = Subspecies & {
  offeredSkills: Skill[]
  imposedSkill: Skill | undefined
}

export type ResolvedSpecies = Omit<Species, 'subspecies' | 'subspeciesLabel'> & {
  subspeciesLabel: SubspeciesLabel
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
  reference: string
  record: TermRecord
}

export type GlossaryTerm = GlossaryWord &
  (
    | { family: 'rule'; tag: string | undefined; definition: string }
    | { family: 'characteristic' | 'aptitude'; definition: string }
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

  const sourceLabels = referenceLabels({
    locale: DEFAULT_LOCALE,
    characteristics,
    aptitudes,
    states: stateEntries.map((entry) => entry.data),
    skills: new Map(skillEntries.map((entry) => [entry.data.id, entry.data])),
  })
  const inherited = (text: string): string =>
    locale === DEFAULT_LOCALE ? text : pinReferenceLabels(text, (key) => sourceLabels.get(key))

  const skills = new Map<string, Skill>()
  for (const entry of skillEntries) {
    const base: Skill = {
      ...entry.data,
      description: inherited(entry.data.description),
      ...(entry.data.upgrades === undefined
        ? {}
        : {
            upgrades: entry.data.upgrades.map((upgrade) => ({
              ...upgrade,
              description: inherited(upgrade.description),
            })),
          }),
    }
    skills.set(entry.data.id, mergeSkill(base, overlayOf(`skills/${entry.data.id}`)))
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
    const base: Species = {
      ...entry.data,
      ...(entry.data.subspecies === undefined
        ? {}
        : {
            subspecies: entry.data.subspecies.map((sub) => ({ ...sub, text: inherited(sub.text) })),
          }),
      ...(entry.data.roleplay?.text === undefined
        ? {}
        : { roleplay: { ...entry.data.roleplay, text: inherited(entry.data.roleplay.text) } }),
    }
    const patch = overlays.species.safeParse(overlayOf(`species/${entry.data.id}`) ?? {})
    if (!patch.success) {
      localizedSpecies.set(entry.data.id, base)
      continue
    }
    const { subspecies: subspeciesPatch, roleplay: roleplayPatch, ...rest } = patch.data
    const merged: Species = { ...base, ...pruned(rest) }
    if (subspeciesPatch && base.subspecies) {
      merged.subspecies = base.subspecies.map((sub) => {
        const item = subspeciesPatch[sub.id]
        return item ? { ...sub, ...pruned(item) } : sub
      })
    }
    if (roleplayPatch && base.roleplay) {
      merged.roleplay = { ...base.roleplay, ...pruned(roleplayPatch) }
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
      imposedSkill: sub.imposed === undefined ? undefined : skills.get(sub.imposed),
    }))
    species.push({
      ...entry,
      subspeciesLabel: entry.subspeciesLabel ?? DEFAULT_SUBSPECIES_LABEL,
      offeredSkills,
      subspecies,
      pool: subspecies.reduce(
        (pool, sub) => speciesPool(pool, subspeciesSkills(sub)),
        offeredSkills,
      ),
    })
  }
  species.sort((a, b) => collator(locale).compare(a.name, b.name))
  const speciesById = new Map(species.map((entry) => [entry.id, entry]))

  const states: GameState[] = inCranOrder(
    stateEntries.map((entry) => {
      const base: GameState = { ...entry.data, description: inherited(entry.data.description) }
      const patch = overlays.state.safeParse(overlayOf(`states/${entry.data.key}`) ?? {})
      return patch.success ? { ...base, ...pruned(patch.data) } : base
    }),
    collator(locale).compare,
  )

  const resolveList = (id: string): SkillList & { resolved: Skill[] } => {
    const found = listEntries.find((entry) => entry.id === id)
    const canonical: SkillList = found ? found.data : { name: id, skills: [] }
    const base: SkillList =
      canonical.note === undefined ? canonical : { ...canonical, note: inherited(canonical.note) }
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
    const base: EquipmentItem = {
      ...entry.data,
      ...(entry.data.text === undefined ? {} : { text: inherited(entry.data.text) }),
      ...(entry.data.properties === undefined
        ? {}
        : {
            properties: entry.data.properties.map((property) => ({
              ...property,
              text: inherited(property.text),
            })),
          }),
    }
    const patch = overlays.equipmentItem.safeParse(overlayOf(`equipment/items/${entry.id}`) ?? {})
    if (!patch.success) {
      itemsBySlug.set(entry.id, base)
      continue
    }
    const { craft: craftPatch, ...rest } = patch.data
    const merged: EquipmentItem = { ...base, ...pruned(rest) }
    if (craftPatch && base.craft) {
      merged.craft = { ...base.craft, ...pruned(craftPatch) }
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
      ...pruned({ name: localized.name, description: localized.description }),
      bonuses: entry.data.bonuses.map((bonus) => ({
        ...bonus,
        text: localized.bonuses?.[String(bonus.pieces)]?.text ?? inherited(bonus.text),
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
      for (const skill of subspeciesSkills(sub)) {
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

  const labels = referenceLabels({ locale, characteristics, aptitudes, states, skills })
  const labelOf: LabelOf = (key) => labels.get(key)
  const glossary = buildGlossary({
    locale,
    characteristics,
    aptitudes,
    tags,
    states,
    bank,
    labelOf,
    t,
  })
  const equipmentGrants = [
    ...items.flatMap((item) => (item.grants ?? []).map((id) => ({ id, source: item.name }))),
    ...[...sets.values()].flatMap((set) =>
      set.bonuses.flatMap((bonus) => (bonus.grants ?? []).map((id) => ({ id, source: set.name }))),
    ),
  ].flatMap(({ id, source }) => {
    const skill = skills.get(id)
    return skill ? [{ skill, source }] : []
  })
  const terms = buildTermIndex({
    locale,
    characteristics,
    glossary,
    trees,
    basic,
    bank,
    species,
    equipmentGrants,
    itemsBySlug,
    sections,
    rarities,
    slots,
    domains,
    labelOf,
    t,
  })

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
  labelOf: LabelOf
  t: ReturnType<typeof strings>
}

type TermInput = {
  locale: Locale
  characteristics: Map<string, VocabularyEntry>
  glossary: GlossaryTerm[]
  trees: ResolvedTree[]
  basic: SkillList & { resolved: Skill[] }
  bank: SkillList & { resolved: Skill[] }
  species: ResolvedSpecies[]
  equipmentGrants: EquipmentGrant[]
  itemsBySlug: Map<string, EquipmentItem>
  sections: ResolvedSection[]
  rarities: Map<string, VocabularyEntry>
  slots: Map<string, VocabularyEntry>
  domains: Map<string, VocabularyEntry>
  labelOf: LabelOf
  t: ReturnType<typeof strings>
}

type LabelInput = {
  locale: Locale
  characteristics: Map<string, VocabularyEntry>
  aptitudes: Map<string, VocabularyEntry>
  states: GameState[]
  skills: Map<string, Skill>
}

type EquipmentGrant = { skill: Skill; source: string }

const APTITUDE_ICON = 'mdi/rhombus-outline'

type RuleTerm = {
  fr: string
  en: string
  color: string
  icon: string
} & ({ definition: Record<Locale, string> } | { tag: string } | { skillList: 'bank' })

const RULE_TERMS: readonly RuleTerm[] = [
  {
    fr: 'Avantage',
    en: 'Advantage',
    color: 'var(--term-adv)',
    icon: 'mdi/chevron-double-up',
    definition: {
      fr: "Ajoute un d12 au {{jet}}. Gardez les deux meilleurs dés. Un {{avantage}} et un {{desavantage}} s'annulent.",
      en: 'Adds a d12 to the {{jet}}. Keep the two highest dice. An {{avantage}} and a {{desavantage}} cancel out.',
    },
  },
  {
    fr: 'Désavantage',
    en: 'Disadvantage',
    color: 'var(--term-dis)',
    icon: 'mdi/chevron-double-down',
    definition: {
      fr: "Ajoute un d12 au {{jet}}. Gardez les deux moins bons dés. Un {{desavantage}} et un {{avantage}} s'annulent.",
      en: 'Adds a d12 to the {{jet}}. Keep the two lowest dice. A {{desavantage}} and an {{avantage}} cancel out.',
    },
  },
  {
    fr: 'Attaque',
    en: 'Attack',
    color: 'var(--term-atk)',
    icon: 'game-icons/crossed-swords',
    definition: {
      fr: "Un {{jet}} porté contre la {{ca}} d'une cible pour la toucher.",
      en: "A {{jet}} made against a target's {{ca}} to hit it.",
    },
  },
  {
    fr: 'Jet',
    en: 'Roll',
    color: 'var(--term-roll)',
    icon: 'game-icons/rolling-dices',
    definition: {
      fr: '2d12 + une {{caracteristique}} + une {{aptitude}}, comparé à un {{dd}}, à une {{ca}} ou à un {{jet}} opposé.',
      en: '2d12 + one {{caracteristique}} + one {{aptitude}}, measured against a {{dd}}, an {{ca}} or an Opposed {{jet}}.',
    },
  },
  {
    fr: 'Sort',
    en: 'Spell',
    color: 'var(--term-spell)',
    icon: 'game-icons/magic-swirl',
    tag: 'spell',
  },
  {
    fr: 'Concentration',
    en: 'Concentration',
    color: 'var(--term-spell)',
    icon: 'game-icons/brain',
    definition: {
      fr: "L'attention que vous demande une Compétence qui dure : elle agit tant que vous la maintenez, dans la limite de sa durée. Vous ne maintenez qu'une Compétence de {{concentration}} à la fois : en jouer une autre met fin à la première. Chaque fois que vous subissez des dégâts, effectuez un {{jet}} de {{constitution}} + {{volonte}} contre un {{dd}} de 15 : en cas d'échec, votre {{concentration}} prend fin. Elle prend fin aussi lorsque vous gagnez {{agonie}}, lorsque vous êtes {{endormi}}, {{sonne}} ou {{enrage}}, et lorsque vous y mettez fin, ce qui ne vous coûte rien.",
      en: 'The attention a lasting Skill asks of you: it acts while you maintain it, up to its duration. You maintain only one {{concentration}} Skill at a time: playing another ends the first. Each time you take damage, make a {{jet}} of {{constitution}} + {{volonte}} against a {{dd}} of 15: on a failure, your {{concentration}} ends. It also ends when you gain {{agonie}}, when you are {{endormi}}, {{sonne}} or {{enrage}}, and when you end it, which costs nothing.',
    },
  },
  {
    fr: 'Glyphe',
    en: 'Glyph',
    color: 'var(--term-spell)',
    icon: 'mdi/star-four-points',
    definition: {
      fr: "Une marque de magie aux couleurs d'un Domaine, qui se pose sur vous et en porte le nom, comme un {{glyphe}} de Feu. Vous en gagnez lorsqu'une Compétence le dit, et d'autres Compétences les lisent ou les dépensent. Vous n'en portez qu'un par Domaine, et 4 au plus : gagner un {{glyphe}} que vous portez déjà ne change rien, et en gagner un cinquième vous fait choisir celui que vous perdez, y compris le nouveau. Vous perdez tous vos {{glyphe|Glyphes}} lorsque vous terminez l'un de vos tours sans avoir lancé de {{sort}} pendant ce tour, et au début d'un combat.",
      en: "A mark of magic in a Domain's colours that settles on you and is named after that Domain, such as a Fire {{glyphe}}. You gain one when a Skill says so, and other Skills read or spend them. You carry at most one per Domain and 4 in all: gaining a {{glyphe}} you already carry changes nothing, and gaining a fifth makes you choose one to lose, including the new one. You lose all your {{glyphe|Glyphs}} at the start of a combat, and whenever you end one of your turns without having cast a {{sort}} during it.",
    },
  },
  {
    fr: 'Caractéristique',
    en: 'Characteristic',
    color: 'var(--accent-ink)',
    icon: 'mdi/hexagon',
    definition: {
      fr: "L'une des six valeurs de base d'un personnage. Elle forme la moitié de chaque {{jet}}.",
      en: "One of a character's six core scores. It makes up half of every {{jet}}.",
    },
  },
  {
    fr: 'Aptitude',
    en: 'Aptitude',
    color: 'var(--term-apt)',
    icon: APTITUDE_ICON,
    definition: {
      fr: 'Un domaine de savoir-faire. Elle forme la moitié de chaque {{jet}}.',
      en: 'A field of know-how. It makes up half of every {{jet}}.',
    },
  },
  {
    fr: 'DD',
    en: 'DC',
    color: 'var(--term-roll)',
    icon: 'mdi/bullseye-arrow',
    definition: {
      fr: "La difficulté qu'un {{jet}} doit atteindre, fixée par le MJ ou par une règle.",
      en: 'The difficulty a {{jet}} has to reach, set by the GM or by a rule.',
    },
  },
  {
    fr: 'CA',
    en: 'AC',
    color: 'var(--term-roll)',
    icon: 'game-icons/breastplate',
    definition: {
      fr: "La Classe d'armure, le total qu'une {{attaque}} doit atteindre pour vous toucher.",
      en: 'Armour Class, the total an {{attaque}} has to reach to hit you.',
    },
  },
  {
    fr: 'Action Bonus',
    en: 'Bonus Action',
    color: 'var(--term-bonus)',
    icon: 'mdi/triangle',
    definition: {
      fr: "Une action rapide faite durant votre tour. Vous en avez une par tour. Généralement réservée aux Compétences qui l'indiquent.",
      en: 'A quick action taken during your turn. You have one per turn. Usually reserved for Skills that say so.',
    },
  },
  {
    fr: 'Réaction',
    en: 'Reaction',
    color: 'var(--term-reaction)',
    icon: 'mdi/rhombus',
    definition: {
      fr: 'Une action jouée en réponse à un déclencheur, le plus souvent hors de votre tour. Vous en avez une par round, et elle revient au début de votre tour.',
      en: 'An action played in response to a trigger, most often outside your turn. You have one per round, and it comes back at the start of your turn.',
    },
  },
  {
    fr: 'Action',
    en: 'Action',
    color: 'var(--term-action)',
    icon: 'mdi/circle',
    definition: {
      fr: "L'action principale de votre tour. Vous en avez une par tour.",
      en: 'The main action of your turn. You have one per turn.',
    },
  },
  {
    fr: 'Passif',
    en: 'Passive',
    color: 'var(--term-passive)',
    icon: 'mdi/square',
    definition: {
      fr: "Une Compétence qui s'applique sans coûter d'action.",
      en: 'A Skill that applies without costing an action.',
    },
  },
  {
    fr: 'Déplacement',
    en: 'Movement',
    color: 'var(--term-move)',
    icon: 'game-icons/walking-boot',
    definition: {
      fr: "La distance que vous parcourez à votre tour, jusqu'à votre {{vitesse}}.",
      en: 'The distance you cover on your turn, up to your {{vitesse}}.',
    },
  },
  {
    fr: 'Vitesse',
    en: 'Speed',
    color: 'var(--term-move)',
    icon: 'mdi/speedometer',
    definition: {
      fr: "L'allure que votre corps sait tenir : la distance que vous pouvez parcourir à chacun de vos tours, 9 mètres sauf si votre Espèce en fixe une autre.",
      en: 'The pace your body can hold: the distance you can cover on each of your turns, 9 metres unless your Species sets another.',
    },
  },
  {
    fr: 'Taille',
    en: 'Size',
    color: 'var(--term-move)',
    icon: 'material-symbols/people-size-increase-rounded',
    definition: {
      fr: "Le gabarit d'une créature, rangé en catégories, du plus menu au plus colossal. La vôtre vient de votre Espèce.",
      en: "A creature's build, sorted into categories from the slightest to the most colossal. Yours comes from your Species.",
    },
  },
  {
    fr: 'Terrain difficile',
    en: 'Difficult Terrain',
    color: 'var(--term-move)',
    icon: 'mdi/terrain',
    definition: {
      fr: "Un terrain qui ralentit la marche, comme des gravats, une pente raide, une eau jusqu'aux genoux ou une foule serrée. Chaque mètre qu'on y parcourt coûte deux mètres de {{deplacement|déplacement}}.",
      en: 'Terrain that slows the going, such as rubble, a steep slope, knee-deep water or a packed crowd. Each metre crossed there costs two metres of {{deplacement|movement}}.',
    },
  },
  {
    fr: 'Prérequis',
    en: 'Prerequisite',
    color: 'var(--term-roll)',
    icon: 'mdi/lock',
    definition: {
      fr: 'Une condition à remplir pour acheter une Compétence ou pour équiper un objet.',
      en: 'A condition to meet to buy a Skill or to equip an item.',
    },
  },
  {
    fr: 'Banque Commune',
    en: 'Common Bank',
    color: 'var(--accent-ink)',
    icon: 'mdi/bank',
    skillList: 'bank',
  },
  {
    fr: 'PdV',
    en: 'HP',
    color: 'var(--term-res)',
    icon: 'game-icons/heart-organ',
    definition: {
      fr: "Les Points de vie, ce qu'une créature peut encaisser. À 0, elle tombe en {{agonie}}.",
      en: 'Hit Points, what a creature can take. At 0, it falls into {{agonie}}.',
    },
  },
  {
    fr: 'Énergie',
    en: 'Energy',
    color: 'var(--term-res)',
    icon: 'mdi/lightning-bolt',
    definition: {
      fr: 'La réserve qui paie le coût des Compétences.',
      en: 'The reserve that pays the cost of Skills.',
    },
  },
  {
    fr: 'Mana',
    en: 'Mana',
    color: 'var(--term-res)',
    icon: 'game-icons/crystal-shine',
    definition: {
      fr: "Une réserve de magie mise de côté, qui ne sert qu'aux {{sort|Sorts}}. Chaque point de {{mana}} paie 1 {{energie}} du coût d'un {{sort}}, y compris l'{{energie}} que ce {{sort}} vous laisse dépenser en plus, et vous pouvez mêler {{mana}} et {{energie}} pour payer un même {{sort}}. Ce que vous payez en {{mana}} compte comme de l'{{energie}} dépensée, et un {{sort}} dont le coût dépasse votre {{energie}} et votre {{mana}} réunis ne peut pas être lancé. La Compétence qui vous accorde du {{mana}} en fixe le maximum et dit ce qui le remplit.",
      en: "A reserve of magic set aside for {{sort|Spells}} alone. Each point of {{mana}} pays 1 {{energie}} of a {{sort|Spell's}} cost, including any extra {{energie}} that {{sort}} lets you spend, and you can pay for one {{sort}} with a mix of {{mana}} and {{energie}}. What you pay in {{mana}} counts as {{energie}} spent, and a {{sort}} whose cost exceeds your {{energie}} and {{mana}} combined cannot be cast. The Skill that grants you {{mana}} sets its maximum and says what refills it.",
    },
  },
  {
    fr: 'Mémoire',
    en: 'Memory',
    color: 'var(--term-res)',
    icon: 'game-icons/bookshelf',
    definition: {
      fr: 'Le nombre de Compétences que vous pouvez avoir {{memorisee|Mémorisées}} en même temps.',
      en: 'The number of Skills you can have {{memorisee}} at the same time.',
    },
  },
  {
    fr: 'Mémorisée',
    en: 'Memorised',
    color: 'var(--term-res)',
    icon: 'mdi/brain',
    definition: {
      fr: "Se dit d'une Compétence que vous portez et pouvez jouer. Vous pouvez changer les vôtres pendant un repos.",
      en: 'Said of a Skill you carry and can play. You can change yours during a rest.',
    },
  },
  {
    fr: 'Apprise',
    en: 'Learned',
    color: 'var(--term-res)',
    icon: 'mdi/book-check',
    definition: {
      fr: "Se dit d'une Compétence que vous avez acquise, que vous l'ayez achetée ou reçue. Une Compétence {{apprise}} ne s'apprend pas une seconde fois.",
      en: 'Said of a Skill you have acquired, whether you bought it or were given it. A {{apprise}} Skill is never learned a second time.',
    },
  },
  {
    fr: 'Expertise',
    en: 'Expertise',
    color: 'var(--term-adv)',
    icon: 'mdi/medal',
    definition: {
      fr: "Donne 1 {{avantage}} à chaque {{jet}} qui emploie l'{{aptitude}} concernée.",
      en: 'Gives 1 {{avantage}} on every {{jet}} that uses the {{aptitude}} in question.',
    },
  },
  {
    fr: 'Repos court',
    en: 'Short Rest',
    color: 'var(--term-res)',
    icon: 'mdi/campfire',
    definition: {
      fr: 'Dix minutes de pause, durant lesquelles vous pouvez faire une activité légère, qui rendent la moitié de vos {{pdv}} et de votre {{energie}} maximum. Vous pouvez faire au maximum 2 {{repos-court|Repos courts}} par {{repos-long}}.',
      en: 'Ten minutes of pause, during which you can do light activity, that restore half your maximum {{pdv}} and {{energie}}. You can take at most 2 {{repos-court|Short Rests}} per {{repos-long}}.',
    },
  },
  {
    fr: 'Repos long',
    en: 'Long Rest',
    color: 'var(--term-res)',
    icon: 'mdi/bed',
    definition: {
      fr: 'Huit heures de sommeil, une fois par jour, qui rendent tous vos {{pdv}} et toute votre {{energie}}.',
      en: 'Eight hours of sleep, once per day, that restore all your {{pdv}} and all your {{energie}}.',
    },
  },
  {
    fr: 'Karma',
    en: 'Karma',
    color: 'var(--term-res)',
    icon: 'game-icons/abstract-107',
    definition: {
      fr: 'Des points accordés par le MJ. Par défaut, un point peut ajouter un {{avantage}} ou un {{desavantage}} au {{jet}} de votre choix.',
      en: 'Points granted by the GM. By default, a point can add an {{avantage}} or a {{desavantage}} to the {{jet}} of your choice.',
    },
  },
  {
    fr: 'Âme',
    en: 'Soul',
    color: 'var(--term-res)',
    icon: 'game-icons/spark-spirit',
    definition: {
      fr: "Ce qui fait d'un personnage quelqu'un, au-delà de ses chiffres. Elle réunit sa {{phobie}}, sa {{manie}}, son {{defaut}}, sa {{specialite}} et son {{don}}, et se décide avec le MJ à la création.",
      en: 'What makes a character someone, beyond their numbers. It gathers their {{phobie}}, {{manie}}, {{defaut}}, {{specialite}} and {{don}}, and is decided with the GM at creation.',
    },
  },
  {
    fr: 'Phobie',
    en: 'Phobia',
    color: 'var(--term-res)',
    icon: 'game-icons/spider-alt',
    definition: {
      fr: 'Une peur qui pèse sur les décisions du personnage, du vertige à la terreur des araignées. Elle porte un emplacement de {{karma}}, que le MJ remplit souvent quand elle lui coûte quelque chose.',
      en: "A fear that weighs on the character's decisions, from vertigo to a terror of spiders. It carries a {{karma}} slot, which the GM often fills when it costs them something.",
    },
  },
  {
    fr: 'Manie',
    en: 'Mania',
    color: 'var(--term-res)',
    icon: 'game-icons/cycle',
    definition: {
      fr: 'Une habitude, une obsession ou un geste qui revient sans cesse : compter ses pas, ramasser tout ce qui brille. Elle porte un emplacement de {{karma}}.',
      en: 'A habit, an obsession or a gesture that keeps coming back: counting every step, picking up anything that glitters. It carries a {{karma}} slot.',
    },
  },
  {
    fr: 'Défaut',
    en: 'Flaw',
    color: 'var(--term-res)',
    icon: 'game-icons/cracked-mask',
    definition: {
      fr: "Un trait durable qui attire des ennuis au personnage, comme l'orgueil, l'avidité ou une langue trop bien pendue. Il porte un emplacement de {{karma}}.",
      en: 'A lasting trait that draws trouble towards the character, such as pride, greed or a tongue too quick for its own good. It carries a {{karma}} slot.',
    },
  },
  {
    fr: 'Spécialité',
    en: 'Speciality',
    color: 'var(--term-apt)',
    icon: 'mdi/rhombus-split',
    definition: {
      fr: "Une {{aptitude}} que vous inventez, au champ étroit : la peinture, les pièges, la cuisine. Quand elle s'applique, elle entre dans le {{jet}} comme une {{aptitude}} ordinaire et lui donne 1 {{avantage}}.",
      en: 'An {{aptitude}} you invent, with a narrow field: painting, traps, cooking. When it applies, it enters the {{jet}} like an ordinary {{aptitude}} and gives it 1 {{avantage}}.',
    },
  },
  {
    fr: 'Don',
    en: 'Gift',
    color: 'var(--term-res)',
    icon: 'game-icons/magic-palm',
    definition: {
      fr: "Une faculté exceptionnelle qui n'appartient qu'à vous : vos peintures prennent vie, vous parlez aux morts, vous recevez des prémonitions. Il vous ouvre une information, une permission ou une occasion qu'aucun autre personnage n'aurait.",
      en: 'An exceptional faculty that belongs to you alone: your paintings come to life, you speak to the dead, you receive premonitions. It opens up information, permission or an opportunity no other character would have.',
    },
  },
]

const FALLBACK_ICON = 'mdi/hexagon'

function iconPath(name: string | undefined): string {
  return name ? name.replace(':', '/') : FALLBACK_ICON
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
        `rule term ${rule.fr} reads the note of data/skill-lists/common-bank.json, which has none`,
      )
    }
    return bank.note
  }
  const tag = tags.get(rule.tag)
  if (!tag)
    throw new Error(
      `rule term ${rule.fr} reads the tag ${rule.tag}, which data/meta/tags.json does not declare`,
    )
  return requiredDefinition(tag, locale, `data/meta/tags.json ${tag.key}`)
}

function ruleReference(rule: RuleTerm): string {
  return slugify(rule.fr)
}

function vocabularyReference(entry: VocabularyEntry): string {
  return slugify(entry.labelFr)
}

function ruleLabel(rule: RuleTerm, english: boolean): string {
  return english ? rule.en : rule.fr
}

function vocabularyLabel(entry: VocabularyEntry, english: boolean): string {
  return english ? entry.labelEn : entry.labelFr
}

function referenceLabels(input: LabelInput): Map<string, string> {
  const english = input.locale === 'en'
  const labels = new Map<string, string>()
  for (const rule of RULE_TERMS) labels.set(ruleReference(rule), ruleLabel(rule, english))
  for (const entry of input.characteristics.values()) {
    if (entry.key === VARIABLE_CHARACTERISTIC) continue
    labels.set(vocabularyReference(entry), vocabularyLabel(entry, english))
  }
  for (const entry of input.aptitudes.values()) {
    labels.set(vocabularyReference(entry), vocabularyLabel(entry, english))
  }
  for (const state of input.states) labels.set(state.key, state.name)
  for (const skill of input.skills.values()) labels.set(skill.id, skill.title)
  return labels
}

function buildGlossary(input: GlossaryInput): GlossaryTerm[] {
  const { locale, characteristics, aptitudes, tags, states, bank, labelOf, t } = input
  const english = locale === 'en'
  const glossary: GlossaryTerm[] = []

  for (const rule of RULE_TERMS) {
    const definition = ruleTermDefinition(rule, tags, bank, locale)
    glossary.push({
      family: 'rule',
      key: ruleReference(rule),
      reference: ruleReference(rule),
      tag: 'tag' in rule ? rule.tag : undefined,
      definition,
      record: {
        family: 'rule',
        kind: t.ruleTerm,
        title: ruleLabel(rule, english),
        meta: '',
        color: rule.color,
        icon: rule.icon,
        text: flattenText(definition, labelOf),
      },
    })
  }

  for (const entry of characteristics.values()) {
    if (entry.key === VARIABLE_CHARACTERISTIC) continue
    const definition = requiredDefinition(
      entry,
      locale,
      `data/meta/characteristics.json ${entry.key}`,
    )
    glossary.push({
      family: 'characteristic',
      key: entry.key,
      reference: vocabularyReference(entry),
      definition,
      record: {
        family: 'characteristic',
        kind: t.characteristic,
        title: vocabularyLabel(entry, english),
        meta: '',
        color: entry.color ?? 'var(--accent-ink)',
        icon: iconPath(entry.iconName),
        text: flattenText(definition, labelOf),
      },
    })
  }

  for (const entry of aptitudes.values()) {
    const definition = requiredDefinition(entry, locale, `data/meta/aptitudes.json ${entry.key}`)
    glossary.push({
      family: 'aptitude',
      key: entry.key,
      reference: vocabularyReference(entry),
      definition,
      record: {
        family: 'aptitude',
        kind: t.aptitude,
        title: vocabularyLabel(entry, english),
        meta: '',
        color: entry.color ?? 'var(--term-apt)',
        icon: APTITUDE_ICON,
        text: flattenText(definition, labelOf),
      },
    })
  }

  for (const state of states) {
    const kindLabel =
      state.kind === 'buff' ? t.buff : state.kind === 'debuff' ? t.debuff : t.neutral
    glossary.push({
      family: 'state',
      key: state.key,
      reference: state.key,
      state,
      record: {
        family: 'state',
        kind: t.states,
        title: state.name,
        meta: kindLabel,
        color: stateInk(state),
        icon: iconPath(state.icon),
        text: flattenText(state.description, labelOf, 240),
      },
    })
  }

  return glossary
}

function buildTermIndex(input: TermInput): TermIndex {
  const {
    locale,
    characteristics,
    glossary,
    trees,
    basic,
    bank,
    species,
    equipmentGrants,
    itemsBySlug,
    sections,
    rarities,
    slots,
    domains,
    labelOf,
    t,
  } = input
  const keys = new Map<string, TermRecord>()

  const putSkill = (skill: Skill, record: TermRecord): void => {
    if (!keys.has(skill.id)) keys.set(skill.id, record)
  }

  for (const term of glossary) {
    if (keys.has(term.reference)) {
      throw new Error(`two glossary entries answer to the reference {{${term.reference}}}`)
    }
    keys.set(term.reference, term.record)
  }

  for (const tree of trees) {
    for (const skill of tree.skills) {
      putSkill(skill, {
        family: 'skill',
        skillId: skill.id,
        kind: t.spells,
        title: skill.title,
        meta: `${typeLabel(skill.type, t)} · ${tree.name}`,
        color: 'var(--accent-ink)',
        icon: skillIcon(skill, characteristics),
        text: flattenText(skill.description, labelOf, 240),
        href: treeNodeHref(locale, tree.id, skill.id),
      })
    }
  }

  for (const skill of basic.resolved) {
    putSkill(skill, {
      family: 'skill',
      skillId: skill.id,
      kind: t.basic,
      title: skill.title,
      meta: typeLabel(skill.type, t),
      color: 'var(--accent-ink)',
      icon: 'mdi/hexagon',
      text: flattenText(skill.description, labelOf, 240),
      href: `${pathFor('skills', locale)}#e-${skill.id}`,
    })
  }

  for (const skill of bank.resolved) {
    putSkill(skill, {
      family: 'skill',
      skillId: skill.id,
      kind: bank.name,
      title: skill.title,
      meta: `${typeLabel(skill.type, t)} · ${bank.name}`,
      color: 'var(--accent-ink)',
      icon: skillIcon(skill, characteristics),
      text: flattenText(skill.description, labelOf, 240),
      href: `${pathFor('skills', locale)}#e-${skill.id}`,
    })
  }

  for (const entry of species) {
    for (const skill of entry.pool) {
      putSkill(skill, {
        family: 'skill',
        skillId: skill.id,
        kind: t.speciesOffer,
        title: skill.title,
        meta: `${typeLabel(skill.type, t)} · ${entry.name}`,
        color: 'var(--accent-ink)',
        icon: skillIcon(skill, characteristics),
        text: flattenText(skill.description, labelOf, 240),
        href: `${pathFor('speciesEntry', locale, { species: entry.id })}#e-${skill.id}`,
      })
    }
  }

  for (const { skill, source } of equipmentGrants) {
    putSkill(skill, {
      family: 'skill',
      skillId: skill.id,
      kind: t.fromItems,
      title: skill.title,
      meta: `${typeLabel(skill.type, t)} · ${source}`,
      color: 'var(--accent-ink)',
      icon: skillIcon(skill, characteristics),
      text: flattenText(skill.description, labelOf, 240),
      href: `${pathFor('skills', locale)}#e-${skill.id}`,
    })
  }

  const slotOf = new Map(sections.map((section) => [section.key, section.slot]))
  for (const [slug, item] of itemsBySlug) {
    if (keys.has(slug)) {
      throw new Error(
        `item ${slug} answers to the reference {{${slug}}}, which another entry holds`,
      )
    }
    const slot = slotOf.get(item.section)
    keys.set(slug, {
      family: 'item',
      itemSlug: slug,
      kind: t.items,
      title: item.name,
      meta: `${item.kind} · ${label(rarities.get(item.rarity), locale, item.rarity)}`,
      color: 'var(--accent-ink)',
      icon: slot ? iconPath(slots.get(slot)?.iconName) : null,
      text: flattenText(item.text ?? item.description, labelOf, 240),
      href: `${pathFor('equipment', locale)}#e-${slug}`,
    })
  }

  const treeTypes = { archetypes: t.archetype, domains: t.domain, species: t.species }
  for (const tree of trees) {
    if (keys.has(tree.id)) {
      throw new Error(
        `tree ${tree.id} answers to the reference {{${tree.id}}}, which another entry holds`,
      )
    }
    const domain = tree.domains[0] ? domains.get(tree.domains[0]) : undefined
    keys.set(tree.id, {
      family: 'tree',
      kind: t.trees,
      title: tree.name,
      meta: treeTypeLabel(tree.treeType, treeTypes),
      color: domain?.color ? inkOf(domain.color) : 'var(--accent-ink)',
      icon: 'mdi/family-tree',
      text: tree.subtitle ?? '',
      href: pathFor('tree', locale, { tree: tree.id }),
    })
  }

  return { keys }
}

function skillIcon(skill: Skill, characteristics: Map<string, VocabularyEntry>): string {
  const first = skill.characteristics?.[0]
  return first ? iconPath(characteristics.get(characteristicKey(first))?.iconName) : 'mdi/hexagon'
}
