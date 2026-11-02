import type { ArtEffect } from '../art-effect/effects'
import { artKeyColour } from '../art-key-colour'
import type { Locale } from '../i18n/locales'
import { pathFor } from '../i18n/routes'
import { strings } from '../i18n/strings'
import { KEY_FALLBACK } from '../key-colour'
import { type Corpus, label, type ResolvedTree } from './corpus'
import { categoryInk } from './kind-marks'
import { type LibraryItem, type LibrarySection, libraryKicker } from './library'
import type { ContentStatus } from './schema'
import { type CardSeal, categorySeal, SPECIES_SEAL, treeSeal, treeSealKey } from './seals'
import { type BadgedStatus, badgedStatus } from './status'

export type CardCharacteristic = {
  key: string
  iconName: string | undefined
  color: string
  label: string
}

export type Facet = { values: string; labels: string }

export type CardFacets = {
  id: string
  name: string
  status?: Facet
  kind?: Facet
  domains?: Facet
  characteristics?: Facet
}

export type CardOpen = { text: string; label: string }

export type EntryCard = {
  href: string
  download: boolean
  open: CardOpen
  name: string
  kicker: string
  keyColour: string
  status: ContentStatus | undefined
  badge: BadgedStatus | undefined
  cover: string | undefined
  effect: ArtEffect | undefined
  seal: CardSeal
  mark: string | undefined
  characteristics: CardCharacteristic[]
  facets: CardFacets
}

const CHARACTERISTIC_FALLBACK = '#8a7c5c'

function keyOf(cover: string | undefined, authored: string | undefined, fallback: string) {
  if (authored) return Promise.resolve(authored)
  return cover ? artKeyColour(cover) : Promise.resolve(fallback)
}

function statusLabelsOf(locale: Locale): Record<ContentStatus, string> {
  const t = strings(locale)
  return { draft: t.draft, playtest: t.playtest, beta: t.beta, balanced: t.balanced }
}

function treeCharacteristics(
  tree: ResolvedTree,
  corpus: Corpus,
  locale: Locale,
): CardCharacteristic[] {
  return tree.primeCharacteristics.map((key) => {
    const entry = corpus.characteristics.get(key)
    return {
      key,
      color: entry?.color ?? CHARACTERISTIC_FALLBACK,
      iconName: entry?.iconName,
      label: label(entry, locale, key),
    }
  })
}

export async function treeCards(corpus: Corpus, locale: Locale): Promise<EntryCard[]> {
  const t = strings(locale)
  const statusLabels = statusLabelsOf(locale)
  return Promise.all(
    corpus.trees.map(async (tree) => {
      const characteristics = treeCharacteristics(tree, corpus, locale)
      const seal = treeSeal(tree, corpus)
      const kind = tree.treeType === 'domain' ? 'domain' : 'archetype'
      const kindLabel = kind === 'domain' ? t.domains : t.archetypes
      const status = tree.status ?? 'balanced'
      return {
        href: pathFor('tree', locale, { tree: tree.id }),
        download: false,
        open: { text: t.openSheet, label: t.openSheetOf(tree.name) },
        name: tree.name,
        kicker: t.treeKindNoun(tree.treeType),
        keyColour: await keyOf(tree.cover, tree.keyColour, treeSealKey(tree, corpus)),
        status: tree.status,
        badge: badgedStatus(tree.status),
        cover: tree.cover,
        effect: tree.artEffect,
        seal,
        mark: seal.field,
        characteristics,
        facets: {
          id: tree.id,
          name: tree.name,
          kind: { values: kind, labels: kindLabel },
          status: { values: status, labels: statusLabels[status] },
          domains: {
            values: tree.domains.join(' '),
            labels: tree.domains
              .map((key) => label(corpus.domains.get(key), locale, key))
              .join('|'),
          },
          characteristics: {
            values: tree.primeCharacteristics.join(' '),
            labels: characteristics.map((item) => item.label).join('|'),
          },
        },
      }
    }),
  )
}

export async function speciesCards(corpus: Corpus, locale: Locale): Promise<EntryCard[]> {
  const t = strings(locale)
  const statusLabels = statusLabelsOf(locale)
  return Promise.all(
    corpus.species.map(async (entry) => {
      const status = entry.status ?? 'balanced'
      return {
        href: pathFor('speciesEntry', locale, { species: entry.id }),
        download: false,
        open: { text: t.openSheet, label: t.openSheetOf(entry.name) },
        name: entry.name,
        kicker: t.species,
        keyColour: await keyOf(entry.cover, entry.keyColour, KEY_FALLBACK),
        status: entry.status,
        badge: badgedStatus(entry.status),
        cover: entry.cover,
        effect: entry.artEffect,
        seal: SPECIES_SEAL,
        mark: undefined,
        characteristics: [],
        facets: {
          id: entry.id,
          name: entry.name,
          status: { values: status, labels: statusLabels[status] },
        },
      }
    }),
  )
}

export function libraryCardId(item: LibraryItem): string {
  return `${item.kind}-${item.id}`
}

async function libraryCard(item: LibraryItem, corpus: Corpus, locale: Locale): Promise<EntryCard> {
  const t = strings(locale)
  const { opening } = item
  const open = opening.download
    ? { text: t.download, label: t.downloadOf(item.name) }
    : { text: t.read, label: t.readOf(item.name) }
  const id = libraryCardId(item)
  if (item.kind === 'tree') {
    const seal = treeSeal(item.tree, corpus)
    const status = item.tree.status ?? 'balanced'
    return {
      href: opening.href,
      download: opening.download,
      open,
      name: item.name,
      kicker: libraryKicker(item, locale),
      keyColour: await keyOf(item.cover, item.tree.keyColour, treeSealKey(item.tree, corpus)),
      status: item.tree.status,
      badge: badgedStatus(item.tree.status),
      cover: item.cover,
      effect: item.tree.artEffect,
      seal,
      mark: seal.field,
      characteristics: treeCharacteristics(item.tree, corpus, locale),
      facets: {
        id,
        name: item.name,
        status: { values: status, labels: statusLabelsOf(locale)[status] },
      },
    }
  }
  const seal = categorySeal(item.category)
  return {
    href: opening.href,
    download: opening.download,
    open,
    name: item.name,
    kicker: libraryKicker(item, locale),
    keyColour: await keyOf(item.cover, undefined, categoryInk(item.category)),
    status: undefined,
    badge: undefined,
    cover: item.cover,
    effect: undefined,
    seal,
    mark: seal.field,
    characteristics: [],
    facets: { id, name: item.name },
  }
}

export function libraryCards(
  section: LibrarySection,
  corpus: Corpus,
  locale: Locale,
): Promise<EntryCard[]> {
  return Promise.all(section.items.map((item) => libraryCard(item, corpus, locale)))
}
