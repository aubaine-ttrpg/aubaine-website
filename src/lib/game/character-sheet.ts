import type { ArtEffect } from '../art-effect/effects'
import { latestRelease } from '../booklet/manifest'
import type { Locale } from '../i18n/locales'
import { strings } from '../i18n/strings'
import { type Corpus, label, type ResolvedSpecies, type ResolvedTree } from './corpus'
import {
  characteristicKey,
  DEFAULT_MOVEMENT_METRES,
  formatNumber,
  SPECIES_ORIGIN_ICON,
  SPECIES_PLATE_TERMS,
} from './derive'
import { categoryInk } from './kind-marks'
import { type LibraryItem, libraryKicker } from './library'
import type { Profile } from './profile'
import { type CardSeal, categorySeal, SPECIES_SEAL, treeSeal, treeSealKey } from './seals'
import { type BadgedStatus, badgedStatus } from './status'

export type Trait = {
  iconName: string | undefined
  color: string
  label: string
  text: string
}

export type TraitSet = { label: string; plates: readonly [Trait, ...Trait[]] }

export type SheetProfile =
  | { kind: 'none' }
  | { kind: 'pending' }
  | { kind: 'ranked'; ranks: Profile }

export type CharacterSheet = {
  name: string
  subtitle: string | undefined
  kind: string
  status: BadgedStatus | undefined
  descriptors: string[]
  traits: TraitSet | undefined
  profile: SheetProfile
  cover: string | undefined
  seal: CardSeal
  effect: ArtEffect | undefined
  emblem: string | undefined
  keyColour: string | undefined
}

export const PLATE_PAPER = '#efe4cc'
const CHAPTERS_ICON = 'mdi:book-multiple'
const SHEETS_ICON = 'mdi:layers-triple'
const CHARACTERISTIC_FALLBACK = '#8a7c5c'

function traitSet(label: string, traits: readonly Trait[]): TraitSet | undefined {
  const [first, ...rest] = traits
  return first ? { label, plates: [first, ...rest] } : undefined
}

function descriptorLabels(corpus: Corpus, locale: Locale, keys: readonly string[]): string[] {
  return keys.map((key) => label(corpus.descriptors.get(key), locale, key))
}

function treeKeyColour(tree: ResolvedTree, corpus: Corpus): string | undefined {
  return tree.keyColour ?? (tree.cover ? undefined : treeSealKey(tree, corpus))
}

export function treeSheet(tree: ResolvedTree, corpus: Corpus, locale: Locale): CharacterSheet {
  const t = strings(locale)
  const primes = tree.primeCharacteristics.map((key) => {
    const entry = corpus.characteristics.get(characteristicKey(key))
    return {
      color: entry?.color ?? CHARACTERISTIC_FALLBACK,
      iconName: entry?.iconName,
      label: entry ? (locale === 'en' ? entry.labelEn : entry.labelFr) : key,
    }
  })
  return {
    name: tree.name,
    subtitle: tree.subtitle,
    kind: t.treeEyebrow(tree.treeType),
    status: badgedStatus(tree.status),
    descriptors: descriptorLabels(corpus, locale, tree.descriptors ?? []),
    traits: traitSet(
      primes.length > 1 ? t.primeChars : t.primeChar,
      primes.map((prime) => ({
        iconName: prime.iconName,
        color: prime.color,
        label: t.primeChar,
        text: prime.label,
      })),
    ),
    profile: tree.profile ? { kind: 'ranked', ranks: tree.profile } : { kind: 'pending' },
    cover: tree.cover,
    seal: treeSeal(tree, corpus),
    effect: tree.artEffect,
    emblem: tree.emblem,
    keyColour: treeKeyColour(tree, corpus),
  }
}

export function speciesSheet(
  species: ResolvedSpecies,
  corpus: Corpus,
  locale: Locale,
): CharacterSheet {
  const t = strings(locale)
  const named = (map: Corpus['creatureTypes'], keys: string[]): string[] =>
    keys.map((key) => label(map.get(key), locale, key))
  const termIcon = (reference: string): string => {
    const icon = corpus.terms.keys.get(reference)?.icon
    if (!icon)
      throw new Error(`the species plates name the rule term {{${reference}}}, which has no icon`)
    return icon
  }

  const creatureTypes = named(corpus.creatureTypes, species.types ?? [])
  const sizes = named(corpus.sizes, species.size ?? [])
  const derived =
    species.derivedFrom === 'origin'
      ? t.sizeFromOrigin
      : species.derivedFrom === 'parents'
        ? t.sizeFromOrigins
        : undefined

  const plates = [
    ...(creatureTypes.length > 0
      ? [
          {
            icon: termIcon(SPECIES_PLATE_TERMS.type),
            label: t.creatureType,
            value: creatureTypes.join(' · '),
          },
        ]
      : []),
    ...(derived
      ? [{ icon: SPECIES_ORIGIN_ICON, label: t.speciesOrigin, value: derived }]
      : [
          {
            icon: termIcon(SPECIES_PLATE_TERMS.movement),
            label: t.movement,
            value: species.movement ?? `${formatNumber(DEFAULT_MOVEMENT_METRES, locale)} m`,
          },
          ...(sizes.length > 0
            ? [
                {
                  icon: termIcon(SPECIES_PLATE_TERMS.size),
                  label: t.sizeCategory,
                  value: sizes.join(` ${t.or} `),
                },
              ]
            : []),
        ]),
  ]

  return {
    name: species.name,
    subtitle: species.subtitle,
    kind: t.species,
    status: badgedStatus(species.status),
    descriptors: descriptorLabels(corpus, locale, species.descriptors ?? []),
    traits: traitSet(
      t.speciesVitals,
      plates.map((plate) => ({
        iconName: plate.icon,
        color: PLATE_PAPER,
        label: plate.label,
        text: plate.value,
      })),
    ),
    profile: { kind: 'none' },
    cover: species.cover,
    seal: SPECIES_SEAL,
    effect: species.artEffect,
    emblem: species.emblem,
    keyColour: species.keyColour,
  }
}

function libraryTraits(item: LibraryItem, locale: Locale): TraitSet | undefined {
  const t = strings(locale)
  const chapters = item.kind === 'book' ? item.book.chapters.length : 0
  const sheets = latestRelease(item.kind, item.id, locale)?.pages
  return traitSet(t.libraryFacts, [
    ...(chapters > 0
      ? [
          {
            iconName: CHAPTERS_ICON,
            color: PLATE_PAPER,
            label: t.chaptersLabel,
            text: formatNumber(chapters, locale),
          },
        ]
      : []),
    ...(sheets !== undefined
      ? [
          {
            iconName: SHEETS_ICON,
            color: PLATE_PAPER,
            label: t.releasePages,
            text: formatNumber(sheets, locale),
          },
        ]
      : []),
  ])
}

export function librarySheet(item: LibraryItem, corpus: Corpus, locale: Locale): CharacterSheet {
  const traits = libraryTraits(item, locale)
  if (item.kind === 'tree') {
    return {
      name: item.name,
      subtitle: item.tree.subtitle,
      kind: libraryKicker(item, locale),
      status: badgedStatus(item.tree.status),
      descriptors: descriptorLabels(corpus, locale, item.tree.descriptors ?? []),
      traits,
      profile: { kind: 'none' },
      cover: item.cover,
      seal: treeSeal(item.tree, corpus),
      effect: item.tree.artEffect,
      emblem: item.tree.emblem,
      keyColour: treeKeyColour(item.tree, corpus),
    }
  }
  return {
    name: item.name,
    subtitle: item.kind === 'book' ? item.book.description : item.catalogue.subtitle,
    kind: libraryKicker(item, locale),
    status: undefined,
    descriptors: [],
    traits,
    profile: { kind: 'none' },
    cover: item.cover,
    seal: categorySeal(item.category),
    effect: undefined,
    emblem: undefined,
    keyColour: item.cover ? undefined : categoryInk(item.category),
  }
}
