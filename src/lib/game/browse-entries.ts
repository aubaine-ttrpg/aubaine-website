import type { Locale } from '../i18n/locales.ts'
import { pathFor } from '../i18n/routes.ts'
import { strings } from '../i18n/strings.ts'
import { type Corpus, label, type ResolvedSpecies } from './build.ts'
import {
  characteristicKey,
  collator,
  EM_DASH,
  formatNumber,
  formatPrice,
  hasCost,
  priceInCoins,
  showsXp,
  skillTags,
  slugify,
  subspeciesAnchor,
  typeLabelFor,
  xpOf,
} from './derive.ts'
import {
  type ContentStatus,
  type EquipmentItem,
  type Skill,
  TAG_KINDS,
  type TagKind,
} from './schema.ts'
import { type BadgedStatus, badgedStatus } from './status.ts'

type SourceLink = { title: string; sub: string; href: string }
type SourceGroup =
  | { kind: 'links'; label: string; links: SourceLink[] }
  | { kind: 'note'; label: string; note: string }
type FacetValue = { value: string; label: string }
type Facet = { group: string; values: string[]; labels: string[] }

type BrowseEntity =
  | { kind: 'skill'; skill: Skill; priced: boolean }
  | { kind: 'item'; item: EquipmentItem }

type CoinPart = { amount: string; name: string; color: string; iconName: string | undefined }

export type BrowseEntry = {
  id: string
  entity: BrowseEntity
  title: string
  mark: string
  sub: string
  aside: string
  value: string
  coins: CoinPart[]
  attrs: Record<string, string>
  status: BadgedStatus | undefined
  sources: SourceGroup[]
}

const DOMAIN_FALLBACK = '#2a2a2e'
const RARITY_FALLBACK = '#6b6459'
const NEUTRAL = 'neutral'

const facetToken = (value: string): string => slugify(value) || 'none'

function facet(group: string, values: FacetValue[]): Facet {
  const seen = new Set<string>()
  const out: Facet = { group, values: [], labels: [] }
  for (const entry of values) {
    const token = facetToken(entry.value)
    if (seen.has(token)) continue
    seen.add(token)
    out.values.push(token)
    out.labels.push(entry.label)
  }
  return out
}

function attributesFor(id: string, title: string, facets: Facet[]): Record<string, string> {
  const out: Record<string, string> = { 'data-entry': id, 'data-name': title.toLowerCase() }
  for (const group of facets) {
    out[`data-facet-${group.group}`] = group.values.join(' ')
    out[`data-facet-${group.group}-labels`] = group.labels.join('|')
  }
  return out
}

const TAG_FACET_GROUPS: Record<TagKind, string> = { practice: 'pra', school: 'sch', special: 'spe' }

function tagFacets(skill: Skill, corpus: Corpus, locale: Locale): Facet[] {
  const slots = skillTags(skill.tags)
  return TAG_KINDS.map((kind) =>
    facet(
      TAG_FACET_GROUPS[kind],
      slots
        .filter((slot) => slot.kind === kind)
        .map(({ key }) => ({ value: key, label: label(corpus.tags.get(key), locale, key) })),
    ),
  )
}

function statusFacet(status: ContentStatus | undefined, locale: Locale): Facet {
  const t = strings(locale)
  const labels: Record<ContentStatus, string> = {
    draft: t.draft,
    playtest: t.playtest,
    beta: t.beta,
    balanced: t.balanced,
  }
  const key = status ?? 'balanced'
  return facet('sta', [{ value: key, label: labels[key] }])
}

export function originSkills(corpus: Corpus): Skill[] {
  return [...corpus.origins.keys()].flatMap((id) => {
    const skill = corpus.skills.get(id)
    return skill ? [skill] : []
  })
}

export function skillBrowseEntries(
  skills: Skill[],
  corpus: Corpus,
  locale: Locale,
  species?: ResolvedSpecies,
): BrowseEntry[] {
  const t = strings(locale)
  const bankName = corpus.bank.name
  const typeLabels = { active: t.active, passive: t.passive, special: t.special }
  const domainColor = (key: string): string => corpus.domains.get(key)?.color ?? DOMAIN_FALLBACK
  const domainLabel = (key: string): string => label(corpus.domains.get(key), locale, key)
  const subspeciesOf = new Map(
    (species?.subspecies ?? []).flatMap((sub) =>
      sub.offeredSkills.map((skill) => [skill.id, sub] as const),
    ),
  )
  const groupRank = new Map(
    (species?.subspecies ?? []).map((sub, position) => [sub.id, position + 1] as const),
  )
  const rankOf = (skill: Skill): number => {
    const sub = subspeciesOf.get(skill.id)
    return sub ? (groupRank.get(sub.id) ?? 0) : 0
  }

  const out = skills.map((skill): BrowseEntry => {
    const source = corpus.origins.get(skill.id)
    if (!source) throw new Error(`${skill.id} is listed but nothing offers it`)
    const elsewhere = species
      ? source.species.filter((entry) => entry.id !== species.id)
      : source.species

    const domains = skill.domains.length > 0 ? skill.domains : [NEUTRAL]
    const tint = domainColor(domains[0] as string)
    const domainText = domains.map(domainLabel).join(' + ')
    const typeText = typeLabelFor(skill.type, typeLabels)
    const within = species ? (subspeciesOf.get(skill.id) ?? species) : undefined
    const src = within
      ? within.name
      : source.trees.length > 0
        ? source.trees.map((tree) => tree.name).join(' + ')
        : source.species.length > 0
          ? source.species.map((entry) => entry.name).join(' + ')
          : source.bank
            ? bankName
            : t.other_
    const activation = skill.activation || EM_DASH
    const xpLabel = !species && showsXp(skill) ? `${formatNumber(xpOf(skill), locale)} ${t.xp}` : ''

    const acquisition: FacetValue[] = []
    if (source.trees.length > 0) acquisition.push({ value: 'tree', label: t.fromTrees })
    if (source.species.length > 0) acquisition.push({ value: 'species', label: t.fromSpecies })
    if (source.bank) acquisition.push({ value: 'bank', label: bankName })
    if (source.items.length > 0) acquisition.push({ value: 'item', label: t.fromItems })
    if (acquisition.length === 0) acquisition.push({ value: 'other', label: t.other_ })

    const costs: FacetValue[] = []
    if (hasCost(skill.energy)) costs.push({ value: 'energy', label: t.energy })
    if (hasCost(skill.karma)) costs.push({ value: 'karma', label: t.karma })
    if (skill.life) costs.push({ value: 'life', label: t.life })
    if (costs.length === 0) costs.push({ value: 'free', label: t.freeCost })

    const characteristics = (skill.characteristics ?? []).map((key) => {
      const canonical = characteristicKey(key)
      return { value: canonical, label: label(corpus.characteristics.get(canonical), locale, key) }
    })
    if (characteristics.length === 0) characteristics.push({ value: 'none', label: t.noJet })

    const tier = skill.tier || 1

    const sources: SourceGroup[] = []
    if (source.trees.length > 0) {
      sources.push({
        kind: 'links',
        label: t.fromTrees,
        links: source.trees.map((tree) => ({
          title: tree.name,
          sub: t.openTree,
          href: pathFor('tree', locale, { tree: tree.id }),
        })),
      })
    }
    if (elsewhere.length > 0) {
      sources.push({
        kind: 'links',
        label: t.fromSpecies,
        links: elsewhere.map((entry) => ({
          title: entry.subspecies ? `${entry.name} · ${entry.subspecies.name}` : entry.name,
          sub: t.openSpecies,
          href:
            pathFor('speciesEntry', locale, { species: entry.id }) +
            (entry.subspecies ? `#${subspeciesAnchor(entry.subspecies.id)}` : ''),
        })),
      })
    }
    if (source.items.length > 0) {
      sources.push({
        kind: 'links',
        label: t.fromItems,
        links: source.items.map((item) => ({
          title: item.name,
          sub: t.openItem,
          href: `${pathFor('equipment', locale)}#e-${item.slug}`,
        })),
      })
    }
    if (source.bank) sources.push({ kind: 'note', label: bankName, note: t.bankNote })
    if (sources.length === 0 && !species) {
      sources.push({ kind: 'note', label: t.other_, note: t.otherNote })
    }

    return {
      id: skill.id,
      entity: { kind: 'skill', skill, priced: !species },
      title: skill.title,
      mark: tint,
      sub: `${typeText} · ${domainText} · ${src}`,
      aside: `${activation} · ${skill.range || EM_DASH}`,
      value: xpLabel,
      coins: [],
      attrs: attributesFor(skill.id, skill.title, [
        ...(within ? [facet('sub', [{ value: within.id, label: within.name }])] : []),
        facet('acq', acquisition),
        facet(
          'dom',
          domains.map((key) => ({ value: key, label: domainLabel(key) })),
        ),
        facet('typ', [{ value: skill.type, label: typeText }]),
        facet('cost', costs),
        facet('act', [{ value: activation, label: activation }]),
        facet('chr', characteristics),
        facet('tier', [{ value: `t${tier}`, label: `${t.level} ${tier}` }]),
        ...tagFacets(skill, corpus, locale),
        statusFacet(corpus.skillStatus.get(skill.id), locale),
      ]),
      status: badgedStatus(corpus.skillStatus.get(skill.id)),
      sources,
    }
  })

  const compare = collator(locale)
  const rank = new Map(skills.map((skill) => [skill.id, rankOf(skill)]))
  return out.sort(
    (a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0) || compare.compare(a.title, b.title),
  )
}

const propertyFacetName = (name: string): string =>
  name.replace(/[.]$/, '').replace(/\s*\(.*\)$/, '')

export function equipmentBrowseEntries(corpus: Corpus, locale: Locale): BrowseEntry[] {
  const slugs = new Map<EquipmentItem, string>()
  for (const [slug, item] of corpus.itemsBySlug) slugs.set(item, slug)
  const sectionTitles = new Map(corpus.sections.map((section) => [section.key, section.title]))
  const compare = collator(locale)

  return corpus.items
    .map((item) => {
      const slug = slugs.get(item) ?? slugify(item.name)
      const sectionTitle = sectionTitles.get(item.section) ?? item.section
      const rarity = corpus.rarities.get(item.rarity)
      const rarityColor = rarity?.color ?? RARITY_FALLBACK
      const rarityLabel = label(rarity, locale, item.rarity)
      const price = formatPrice(item.price, corpus.coins.values(), locale) ?? EM_DASH
      const coins: CoinPart[] = priceInCoins(item.price, [...corpus.coins.values()]).map((part) => {
        const coin = corpus.coins.get(part.key)
        return {
          amount: formatNumber(part.amount, locale),
          name: label(coin, locale, part.key),
          color: coin?.color ?? 'var(--gold)',
          iconName: coin?.iconName,
        }
      })
      const setName = item.set ? (corpus.sets.get(item.set)?.name ?? item.set) : ''
      const properties = item.properties ?? []

      const disciplineLabel = item.craft
        ? label(corpus.disciplines.get(item.craft.discipline), locale, item.craft.discipline)
        : ''

      return {
        id: slug,
        entity: { kind: 'item', item },
        title: item.name,
        mark: rarityColor,
        sub: `${sectionTitle} · ${rarityLabel}`,
        aside: item.headlines.map((headline) => `${headline.label} ${headline.value}`).join(' · '),
        value: price,
        coins,
        attrs: attributesFor(slug, item.name, [
          facet('cat', [{ value: item.section, label: sectionTitle }]),
          facet('rar', [{ value: item.rarity, label: rarityLabel }]),
          facet(
            'craft',
            item.craft
              ? [
                  {
                    value: item.craft.discipline,
                    label: disciplineLabel,
                  },
                ]
              : [],
          ),
          facet(
            'stat',
            item.headlines.map((headline) => ({ value: headline.label, label: headline.label })),
          ),
          facet(
            'prop',
            properties.map((property) => ({
              value: propertyFacetName(property.name),
              label: propertyFacetName(property.name),
            })),
          ),
          facet('set', item.set ? [{ value: item.set, label: setName }] : []),
          statusFacet(item.status, locale),
        ]),
        status: badgedStatus(item.status),
        sources: [],
      } satisfies BrowseEntry
    })
    .sort((a, b) => compare.compare(a.title, b.title))
}
