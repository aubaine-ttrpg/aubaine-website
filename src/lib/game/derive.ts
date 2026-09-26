import type { Locale } from '../i18n/locales.ts'
import { buildTermPattern } from './richtext.ts'
import type {
  EquipmentItem,
  EquipmentSet,
  Skill,
  SkillTags,
  SkillTree,
  SubspeciesLabel,
  TagKind,
  Upgrade,
  VocabularyEntry,
} from './schema.ts'

export const XP_PER_TIER = 5

export const MAIN_CHARACTERISTICS = [
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'spirit',
  'charisma',
] as const

export const CHARACTERISTIC_ALIASES: Record<string, string> = { endurance: 'constitution' }

export const NEUTRAL_DOMAIN = 'neutral'

export const VARIABLE_CHARACTERISTIC = 'any'

export const SPECIES_SKILL_CHOICES = 2

export const SPECIES_PLATE_ICONS = {
  type: 'mdi:shape',
  movement: 'game-icons:walking-boot',
  size: 'material-symbols:people-size-increase-rounded',
  derived: 'mdi:dna',
} as const

export const DEFAULT_MOVEMENT_METRES = 9

export const DEFAULT_SUBSPECIES_LABEL: SubspeciesLabel = 'regional-origins'

export const SUBSPECIES_SECTIONS: Record<SubspeciesLabel, string> = {
  'regional-origins': 'origines-regionales',
  subspecies: 'sous-especes',
}

export function subspeciesAnchor(id: string): string {
  return `origine-${id}`
}

export function subspeciesSkills(sub: {
  imposedSkill: Skill | undefined
  offeredSkills: Skill[]
}): Skill[] {
  return sub.imposedSkill ? [sub.imposedSkill, ...sub.offeredSkills] : sub.offeredSkills
}

export function speciesPool(inherited: Skill[], own: Skill[]): Skill[] {
  const seen = new Set(inherited.map((skill) => skill.id))
  return [...inherited, ...own.filter((skill) => !seen.has(skill.id))]
}

export function characteristicKey(key: string): string {
  return CHARACTERISTIC_ALIASES[key] ?? key
}

export function xpOf(
  entry: Pick<Skill, 'tier' | 'xpOverride'> | Pick<Upgrade, 'tier' | 'xpOverride'>,
): number {
  return entry.xpOverride ?? (entry.tier || 1) * XP_PER_TIER
}

export function showsXp(skill: Pick<Skill, 'showXp'>): boolean {
  return skill.showXp !== false
}

export function hasCost(value: number | undefined): value is number {
  return value !== undefined && value !== null
}

export function frame(colors: string[]): string {
  if (colors.length === 0) return '#2a2a2e'
  if (colors.length === 1) return colors[0] as string
  return `linear-gradient(135deg,${colors[0]} 0 50%,${colors[1]} 50% 100%)`
}

function tally(keys: Iterable<string>): Map<string, number> {
  const counts = new Map<string, number>()
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1)
  return counts
}

export function treeDomains(skills: Skill[], coreDomains: string[] = []): string[] {
  const keys: string[] = []
  for (const skill of skills)
    for (const key of skill.domains) if (key !== NEUTRAL_DOMAIN) keys.push(key)
  for (const key of coreDomains) if (key !== NEUTRAL_DOMAIN) keys.push(key)

  const counts = tally(keys)
  if (counts.size === 0) return []

  const ordered = [...counts.keys()].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))
  const ranks = [...new Set(ordered.map((key) => counts.get(key) ?? 0))]
  const first = ordered.filter((key) => counts.get(key) === ranks[0])
  if (first.length > 2) return []
  if (first.length === 2 || ranks.length < 2) return first

  const second = ordered.filter((key) => counts.get(key) === ranks[1])
  const holds = (ranks[1] as number) * 2 >= (ranks[0] as number)
  return second.length === 1 && holds ? [...first, ...second] : first
}

export type TagSlot = { key: string; kind: TagKind }

export function skillTags(tags: SkillTags | undefined): TagSlot[] {
  if (!tags) return []
  const slots: TagSlot[] = []
  if (tags.practice) slots.push({ key: tags.practice, kind: 'practice' })
  for (const key of tags.schools ?? []) slots.push({ key, kind: 'school' })
  for (const key of tags.specials ?? []) slots.push({ key, kind: 'special' })
  return slots
}

export function primeCharacteristics(skills: Skill[]): string[] {
  const keys: string[] = []
  for (const skill of skills) {
    for (const key of skill.characteristics ?? []) keys.push(characteristicKey(key))
    for (const upgrade of skill.upgrades ?? []) {
      for (const key of upgrade.characteristics ?? []) keys.push(characteristicKey(key))
    }
  }

  const counts = tally(keys)
  if (counts.size === 0) return [VARIABLE_CHARACTERISTIC]

  const max = Math.max(...counts.values())
  const winners = [...counts.keys()]
    .filter((key) => (counts.get(key) ?? 0) >= max - 1)
    .sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))

  const main = winners.filter((key) => (MAIN_CHARACTERISTICS as readonly string[]).includes(key))
  if (main.length >= 3 || main.length === 0) return [VARIABLE_CHARACTERISTIC]
  return main
}

export function primeCharacteristicCounts(skills: Skill[]): Map<string, number> {
  const keys: string[] = []
  for (const skill of skills) {
    for (const key of skill.characteristics ?? []) keys.push(characteristicKey(key))
    for (const upgrade of skill.upgrades ?? []) {
      for (const key of upgrade.characteristics ?? []) keys.push(characteristicKey(key))
    }
  }
  return tally(keys)
}

export function treeSkillCount(tree: SkillTree): number {
  return tree.placements.length
}

export type StatRun = { text: string; characteristic?: string }

export function characteristicSpellings(entries: Iterable<VocabularyEntry>): Map<string, string> {
  const spellings = new Map<string, string>()
  for (const entry of entries) {
    const words = [entry.labelFr, ...(entry.formsFr ?? []), entry.labelEn, ...(entry.formsEn ?? [])]
    for (const word of words) spellings.set(word.toLowerCase(), entry.key)
  }
  return spellings
}

export function statRuns(value: string, spellings: Map<string, string>): StatRun[] {
  const pattern = buildTermPattern([...spellings.keys()])
  if (!pattern) return [{ text: value }]

  const runs: StatRun[] = []
  let at = 0
  pattern.lastIndex = 0
  let match = pattern.exec(value)
  while (match !== null) {
    const key = spellings.get(match[0].toLowerCase())
    if (key !== undefined) {
      if (match.index > at) runs.push({ text: value.slice(at, match.index) })
      runs.push({ text: match[0], characteristic: key })
      at = match.index + match[0].length
    }
    match = pattern.exec(value)
  }
  if (at < value.length) runs.push({ text: value.slice(at) })
  return runs
}

export type OrderablePlacement = { skill: Skill; linked?: string[] | undefined }

export function isTreeRoot(placement: OrderablePlacement): boolean {
  return (placement.linked ?? []).every((target) => target === 'CORE')
}

export function treeSkillOrder(placements: OrderablePlacement[], locale: Locale): Skill[] {
  const compare = collator(locale)
  return [...placements]
    .sort(
      (a, b) =>
        Number(isTreeRoot(b)) - Number(isTreeRoot(a)) ||
        compare.compare(a.skill.title, b.skill.title),
    )
    .map((placement) => placement.skill)
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function initialOf(value: string): string {
  const first = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .charAt(0)
    .toUpperCase()
  if (/[A-Z]/.test(first)) return first
  return /[0-9]/.test(first) ? '0\u20139' : '#'
}

const NUMBER_FORMATS = new Map<Locale, Intl.NumberFormat>()

export function formatNumber(value: number, locale: Locale): string {
  let format = NUMBER_FORMATS.get(locale)
  if (!format) {
    format = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR')
    NUMBER_FORMATS.set(locale, format)
  }
  return format.format(value)
}

const COLLATORS = new Map<Locale, Intl.Collator>()

export function collator(locale: Locale): Intl.Collator {
  let value = COLLATORS.get(locale)
  if (!value) {
    value = new Intl.Collator(locale === 'en' ? 'en' : 'fr', { numeric: true, sensitivity: 'base' })
    COLLATORS.set(locale, value)
  }
  return value
}

export type Coin = {
  key: string
  bronzeValue?: number | undefined
  labelFr: string
  labelEn: string
}

export type CoinAmount = { key: string; amount: number; bronzeValue: number }

export function priceInCoins(
  price: number | undefined,
  coins: Iterable<{ key: string; bronzeValue?: number | undefined }>,
): CoinAmount[] {
  if (price === undefined) return []
  const ladder = [...coins]
    .filter((coin): coin is { key: string; bronzeValue: number } => coin.bronzeValue !== undefined)
    .sort((a, b) => b.bronzeValue - a.bronzeValue)
  const parts: CoinAmount[] = []
  let remaining = price
  for (const coin of ladder) {
    const amount = Math.floor(remaining / coin.bronzeValue)
    if (amount === 0) continue
    parts.push({ key: coin.key, amount, bronzeValue: coin.bronzeValue })
    remaining -= amount * coin.bronzeValue
  }
  return parts
}

export function formatPrice(
  price: number | undefined,
  coins: Iterable<Coin>,
  locale: Locale,
): string | undefined {
  const ladder = [...coins]
  const parts = priceInCoins(price, ladder)
  if (parts.length === 0) return undefined
  const byKey = new Map(ladder.map((coin) => [coin.key, coin]))
  return parts
    .map((part) => {
      const coin = byKey.get(part.key)
      const name = coin ? (locale === 'en' ? coin.labelEn : coin.labelFr) : part.key
      return `${formatNumber(part.amount, locale)} ${name}`
    })
    .join(' ')
}

export function cataloguePieceCount(items: Iterable<EquipmentItem>, setId: string): number {
  let count = 0
  for (const item of items) {
    if (item.set === setId) count += 1
  }
  return count
}

export function setRarity(items: Iterable<EquipmentItem>, setId: string): string {
  const worn = [...items].filter((item) => item.set === setId)
  const first = worn[0]
  if (!first) throw new Error(`set ${setId} is named by no piece, so it has no rarity`)
  const odd = worn.find((item) => item.rarity !== first.rarity)
  if (odd) {
    throw new Error(
      `set ${setId} mixes rarities: ${first.name} is ${first.rarity} and ${odd.name} is ${odd.rarity}. A panoply is printed under one rarity, so its pieces must share it.`,
    )
  }
  return first.rarity
}

export type CatalogueSection = {
  key: string
  title: string
  family: string
  slot?: string | undefined
  items: EquipmentItem[]
}

export type CatalogueGroup = {
  section: CatalogueSection
  lead: EquipmentItem
  rest: EquipmentItem[]
}

export type CataloguePanoply = { set: EquipmentSet; pieces: EquipmentItem[] }

export type CatalogueFamily = {
  key: string
  title: string
  groups: CatalogueGroup[]
  panoplies: CataloguePanoply[]
}

export type CatalogueRarity = { key: string; label: string; families: CatalogueFamily[] }

export const PANOPLY_FAMILY = 'panoplies'

export function catalogueByRarity(
  rarities: Iterable<VocabularyEntry>,
  families: Iterable<{ key: string; title: string }>,
  sections: Iterable<CatalogueSection>,
  sets: Iterable<EquipmentSet>,
  items: Iterable<EquipmentItem>,
  locale: Locale,
  panoplyTitle: string,
): CatalogueRarity[] {
  const allSections = [...sections]
  const allFamilies = [...families]
  const allItems = [...items]
  const allSets = [...sets]
  const sectionRank = new Map(allSections.map((section, at) => [section.key, at]))
  const out: CatalogueRarity[] = []

  for (const rarity of rarities) {
    const blocks: CatalogueFamily[] = []

    for (const family of allFamilies) {
      const groups: CatalogueGroup[] = []
      for (const section of allSections) {
        if (section.family !== family.key) continue
        const [lead, ...rest] = section.items.filter(
          (item) => item.rarity === rarity.key && item.set === undefined,
        )
        if (lead) groups.push({ section, lead, rest })
      }
      if (groups.length > 0) blocks.push({ ...family, groups, panoplies: [] })
    }

    const panoplies: CataloguePanoply[] = allSets
      .filter((set) => setRarity(allItems, set.id) === rarity.key)
      .map((set) => ({
        set,
        pieces: allItems
          .filter((item) => item.set === set.id)
          .sort(
            (a, b) =>
              (sectionRank.get(a.section) ?? 0) - (sectionRank.get(b.section) ?? 0) ||
              a.position - b.position,
          ),
      }))

    if (panoplies.length > 0) {
      blocks.push({ key: PANOPLY_FAMILY, title: panoplyTitle, groups: [], panoplies })
    }

    if (blocks.length > 0) {
      out.push({
        key: rarity.key,
        label: locale === 'en' ? rarity.labelEn : rarity.labelFr,
        families: blocks,
      })
    }
  }
  return out
}

export type CostPill = { key: string; label: string; fg: string; bc: string; bg: string }

export function costPills(
  skill: Pick<Skill, 'energy' | 'karma' | 'life'>,
  locale: Locale,
  labels: { energy: string; karma: string; life: string },
): CostPill[] {
  const out: CostPill[] = []
  if (hasCost(skill.energy)) {
    out.push({
      key: 'energy',
      label: `${formatNumber(skill.energy, locale)}\u00a0${labels.energy}`,
      fg: 'var(--accent-ink)',
      bc: 'var(--accent-line)',
      bg: 'transparent',
    })
  }
  if (hasCost(skill.karma)) {
    out.push({
      key: 'karma',
      label: `${formatNumber(skill.karma, locale)}\u00a0${labels.karma}`,
      fg: '#d9a4e8',
      bc: '#8a5cc4',
      bg: 'transparent',
    })
  }
  if (skill.life) {
    out.push({
      key: 'life',
      label: `${skill.life}\u00a0${labels.life}`,
      fg: '#e8a49a',
      bc: '#a84d16',
      bg: 'transparent',
    })
  }
  return out
}

export const EM_DASH = '\u2014'

export function statLine(
  skill: Pick<Skill, 'activation' | 'range' | 'duration' | 'concentration'>,
  labels: { activation: string; range: string; duration: string },
): { key: string; label: string; value: string }[] {
  return [
    { key: 'activation', label: labels.activation, value: skill.activation || EM_DASH },
    { key: 'range', label: labels.range, value: skill.range || EM_DASH },
    {
      key: 'duration',
      label: labels.duration,
      value: (skill.concentration ? 'Concentration \u00b7 ' : '') + (skill.duration || EM_DASH),
    },
  ]
}

export function typeLabelFor(
  type: Skill['type'],
  labels: { active: string; passive: string; special: string },
): string {
  if (type === 'passive') return labels.passive
  if (type === 'special') return labels.special
  return labels.active
}

export function treeTypeLabel(
  treeType: SkillTree['treeType'],
  labels: { archetypes: string; domains: string; species: string },
): string {
  if (treeType === 'domain') return labels.domains
  if (treeType === 'species') return labels.species
  return labels.archetypes
}
