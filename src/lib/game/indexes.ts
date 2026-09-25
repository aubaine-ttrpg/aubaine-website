import type { Locale } from '../i18n/locales.ts'
import { INDEX_KINDS, type IndexKind, pathFor } from '../i18n/routes.ts'
import { strings } from '../i18n/strings.ts'
import { bookletHref } from '../media.ts'
import type { ResolvedBook } from './build.ts'

export type IndexDescriptor = {
  kind: IndexKind
  art: string
  mark: string
  title: string
  description: string
}

const DESCRIPTIONS: Record<IndexKind, Record<Locale, string>> = {
  trees: {
    fr: 'Quinze archétypes et huit domaines, chacun avec sa planche imprimée et ses compétences.',
    en: 'Fifteen archetypes and eight domains, each with its printed plate and full skill list.',
  },
  species: {
    fr: 'Les Espèces jouables, les Compétences que chacune propose et le déplacement qu’elle fixe.',
    en: 'The playable Species, the Skills each one offers and the movement it sets.',
  },
  skills: {
    fr: 'Toutes les compétences du codex, arbres, Banque Commune et Compétences de base, avec les endroits où chacune s’obtient.',
    en: 'Every skill in the codex, trees, Common Bank and Basic Skills alike, with where each one can be obtained.',
  },
  equipment: {
    fr: 'Protections, armes, bijoux et consommables, avec leurs stats, propriétés et fabrication.',
    en: 'Armour, weapons, jewels and consumables, with their stats, properties and craft.',
  },
  rules: {
    fr: 'Mots de règle, Caractéristiques, Aptitudes, états, étiquettes et Compétences de base, avec la définition ou la règle de chacun.',
    en: 'Rule words, Characteristics, Aptitudes, states, tags and basic Skills, each with its definition or its rule.',
  },
}

const ART: Record<IndexKind, string> = {
  trees: 'bravado-16_9-upscaled_2.jpg',
  species: 'ikyrio-16_9-og.png',
  skills: 'bacchi-qui-travaille-16_9-og.png',
  equipment: 'forge-d-izequiel-16_9-og.png',
  rules: 'priest-16_9-og.png',
}

const MARK: Record<IndexKind, string> = {
  trees: '#efbe04',
  species: '#b8601e',
  skills: '#8a5cc4',
  equipment: '#a84d16',
  rules: '#4f7a2e',
}

export function indexDescriptors(locale: Locale): IndexDescriptor[] {
  const t = strings(locale)
  const titles: Record<IndexKind, string> = {
    trees: t.trees,
    species: t.speciesIndex,
    skills: t.spells,
    equipment: t.items,
    rules: t.rules,
  }
  return INDEX_KINDS.map((kind) => ({
    kind,
    art: ART[kind],
    mark: MARK[kind],
    title: titles[kind],
    description: DESCRIPTIONS[kind][locale],
  }))
}

export const BOOK_DOTS = ['#efbe04', '#8a5cc4', '#4f7a2e', '#2f6ea8'] as const

export function bookDot(order: number): string {
  return BOOK_DOTS[order % BOOK_DOTS.length] as string
}

export type BookLink = { href: string; download: boolean }

export function bookLink(book: ResolvedBook, locale: Locale): BookLink | undefined {
  const first = book.chapters[0]
  if (first) {
    return {
      href: pathFor('book', locale, { book: book.id, chapter: first.slug }),
      download: false,
    }
  }
  const pdf = bookletHref('book', book.id, locale)
  return pdf ? { href: pdf, download: true } : undefined
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
