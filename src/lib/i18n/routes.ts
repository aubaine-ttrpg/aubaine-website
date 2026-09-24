import { isLocale, LOCALES, type Locale } from './locales.ts'

export const VIEW_KINDS = [
  'home',
  'books',
  'book',
  'almanach',
  'trees',
  'tree',
  'species',
  'speciesEntry',
  'skills',
  'equipment',
  'baseActions',
  'states',
  'archives',
  'archive',
  'licences',
  'aiPolicy',
  'credits',
  'privacy',
  'search',
  'notFound',
] as const

export type ViewKind = (typeof VIEW_KINDS)[number]

type SegmentMap = Record<Locale, string>

const SEGMENT: Record<Exclude<ViewKind, 'home'>, SegmentMap> = {
  books: { fr: 'livres', en: 'books' },
  book: { fr: 'livres', en: 'books' },
  almanach: { fr: 'almanach', en: 'almanach' },
  trees: { fr: 'arbres', en: 'trees' },
  tree: { fr: 'arbre', en: 'tree' },
  species: { fr: 'especes', en: 'species' },
  speciesEntry: { fr: 'espece', en: 'species' },
  skills: { fr: 'competences', en: 'skills' },
  equipment: { fr: 'equipement', en: 'equipment' },
  baseActions: { fr: 'actions-de-base', en: 'base-actions' },
  states: { fr: 'etats', en: 'states' },
  archives: { fr: 'archives', en: 'archives' },
  archive: { fr: 'archives', en: 'archives' },
  licences: { fr: 'licences', en: 'licences' },
  aiPolicy: { fr: 'politique-ia', en: 'ai-policy' },
  credits: { fr: 'credits', en: 'credits' },
  privacy: { fr: 'confidentialite', en: 'privacy' },
  search: { fr: 'recherche', en: 'search' },
  notFound: { fr: '404', en: '404' },
}

export type RouteParams = {
  tree?: string | undefined
  node?: string | undefined
  species?: string | undefined
  book?: string | undefined
  chapter?: string | undefined
  slug?: string | undefined
}

export function segmentsFor(kind: ViewKind, locale: Locale, params: RouteParams = {}): string[] {
  if (kind === 'home') return []
  const head = SEGMENT[kind][locale]
  if (kind === 'tree') {
    const tail = [params.tree, params.node].filter((v): v is string => v !== undefined)
    return [head, ...tail]
  }
  if (kind === 'speciesEntry') {
    const tail = [params.species].filter((v): v is string => v !== undefined)
    return [head, ...tail]
  }
  if (kind === 'book') {
    const tail = [params.book, params.chapter].filter((v): v is string => v !== undefined)
    return [head, ...tail]
  }
  if (kind === 'archive') {
    const tail = [params.slug].filter((v): v is string => v !== undefined)
    return [head, ...tail]
  }
  return [head]
}

export function pathFor(kind: ViewKind, locale: Locale, params: RouteParams = {}): string {
  return `/${[locale, ...segmentsFor(kind, locale, params)].join('/')}`
}

export function bookChapterRef(pathname: string): string | undefined {
  const [locale, section, book, chapter, ...rest] = pathname.split('/').filter(Boolean)
  if (locale === undefined || section === undefined) return undefined
  if (book === undefined || chapter === undefined || rest.length > 0) return undefined
  if (!isLocale(locale) || SEGMENT.book[locale] !== section) return undefined
  return `${locale}/${book}`
}

export function urlFor(
  kind: ViewKind,
  locale: Locale,
  site: URL | string,
  params: RouteParams = {},
): string {
  return new URL(pathFor(kind, locale, params), site).href
}

export function alternatesFor(
  kind: ViewKind,
  site: URL | string,
  params: RouteParams = {},
): { locale: Locale; href: string }[] {
  return LOCALES.map((locale) => ({ locale, href: urlFor(kind, locale, site, params) }))
}

export const INDEX_KINDS = [
  'trees',
  'species',
  'skills',
  'equipment',
  'baseActions',
  'states',
] as const

export type IndexKind = (typeof INDEX_KINDS)[number]

export const POLICY_KINDS = ['licences', 'aiPolicy', 'credits', 'privacy'] as const

export type PolicyKind = (typeof POLICY_KINDS)[number]

export function isPolicyKind(kind: ViewKind): kind is PolicyKind {
  return (POLICY_KINDS as readonly ViewKind[]).includes(kind)
}

export const NAV_SECTIONS = [
  { id: 'home', kinds: ['home'] },
  { id: 'books', kinds: ['books', 'book'] },
  {
    id: 'almanach',
    kinds: [
      'almanach',
      'trees',
      'tree',
      'species',
      'speciesEntry',
      'skills',
      'equipment',
      'baseActions',
      'states',
    ],
  },
] as const satisfies readonly { id: string; kinds: readonly ViewKind[] }[]

export type NavSection = (typeof NAV_SECTIONS)[number]['id']

export function sectionFor(kind: ViewKind): NavSection | undefined {
  return NAV_SECTIONS.find((section) => (section.kinds as readonly ViewKind[]).includes(kind))?.id
}
