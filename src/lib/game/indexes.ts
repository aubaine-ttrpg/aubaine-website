import type { Locale } from '../i18n/locales.ts'
import { INDEX_KINDS, type IndexKind } from '../i18n/routes.ts'
import { strings } from '../i18n/strings.ts'
import { PLACEHOLDER_BANNER } from '../media.ts'
import type { BrowseIndex } from './browse-entries.ts'
import type { Corpus } from './build.ts'
import { KIND_MARKS, type KindMark } from './kind-marks.ts'

const INDEX_ART: Record<Exclude<BrowseIndex, 'equipment'>, string> = {
  skills: 'bacchi-qui-travaille-16_9-og.png',
  materials: 'eau-16_9-upscaled_4.jpg',
  rules: 'priest-16_9-og.png',
}

export function indexArt(index: BrowseIndex, corpus: Corpus): string {
  if (index === 'equipment') return corpus.catalogue.banner ?? PLACEHOLDER_BANNER
  return INDEX_ART[index]
}

export type IndexDescriptor = {
  kind: IndexKind
  mark: KindMark
  title: string
  description: string
}

const DESCRIPTIONS: Record<IndexKind, Record<Locale, string>> = {
  trees: {
    fr: 'Quinze archétypes et huit domaines, chacun prêt à imprimer, avec ses compétences.',
    en: 'Fifteen archetypes and eight domains, each with its printed plate and full skill list.',
  },
  species: {
    fr: 'Les Espèces jouables, les Compétences que chacune propose et le déplacement qu’elle fixe.',
    en: 'The playable Species, the Skills each one offers and the movement it sets.',
  },
  skills: {
    fr: 'Toutes les compétences d’Aubaine, arbres, Banque Commune et Compétences de base, avec les endroits où chacune s’obtient.',
    en: 'Every skill in Aubaine, trees, Common Bank and Basic Skills alike, with where each one can be obtained.',
  },
  equipment: {
    fr: 'Protections, armes, bijoux et consommables, avec leurs stats, propriétés et fabrication.',
    en: 'Armour, weapons, jewels and consumables, with their stats, properties and craft.',
  },
  materials: {
    fr: 'Les matériaux ordinaires, leurs Types et leur Valeur, et la Table de butin de chaque environnement.',
    en: 'Ordinary materials, their Types and Value, and the Loot Table of every environment.',
  },
  rules: {
    fr: 'Mots de règle, Caractéristiques, Aptitudes, états, étiquettes et Compétences de base, avec la définition ou la règle de chacun.',
    en: 'Rule words, Characteristics, Aptitudes, states, tags and basic Skills, each with its definition or its rule.',
  },
}

export function indexDescriptors(locale: Locale): IndexDescriptor[] {
  const t = strings(locale)
  const titles: Record<IndexKind, string> = {
    trees: t.trees,
    species: t.speciesIndex,
    skills: t.spells,
    equipment: t.items,
    materials: t.materials,
    rules: t.rules,
  }
  return INDEX_KINDS.map((kind) => ({
    kind,
    mark: KIND_MARKS[kind],
    title: titles[kind],
    description: DESCRIPTIONS[kind][locale],
  }))
}

export const BOOK_DOTS = ['#efbe04', '#8a5cc4', '#4f7a2e', '#2f6ea8'] as const

export function bookDot(order: number): string {
  return BOOK_DOTS[order % BOOK_DOTS.length] as string
}

export const RARITY_ORDER = [
  'common',
  'uncommon',
  'rare',
  'very-rare',
  'legendary',
  'artifact',
] as const

export const CONCAVE_CLIP =
  'polygon(16% 0%, 84% 0%, 84.4% 3.6%, 85.6% 6.9%, 87.5% 10%, 90% 12.5%, 93.1% 14.4%, 96.4% 15.6%, 100% 16%, 100% 84%, 96.4% 84.4%, 93.1% 85.6%, 90% 87.5%, 87.5% 90%, 85.6% 93.1%, 84.4% 96.4%, 84% 100%, 16% 100%, 15.6% 96.4%, 14.4% 93.1%, 12.5% 90%, 10% 87.5%, 6.9% 85.6%, 3.6% 84.4%, 0% 84%, 0% 16%, 3.6% 15.6%, 6.9% 14.4%, 10% 12.5%, 12.5% 10%, 14.4% 6.9%, 15.6% 3.6%)'

export const NODE_SHAPE = {
  active: { clip: 'none', radius: '50%' },
  passive: { clip: 'none', radius: '15%' },
  special: { clip: CONCAVE_CLIP, radius: '0' },
} as const
