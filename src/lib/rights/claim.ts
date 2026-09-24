import type { Locale } from '../i18n/locales.ts'

export const HOLDER = 'Aubaine'
export const YEAR = '2026'
export const SITE = 'https://aubaine.io'
export const CREATOR_TOOL = 'Aubaine Catalyst'

export const LICENCE = {
  id: 'CC BY-NC-SA 4.0',
  deed: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
} as const

const RIGHTS: Record<Locale, string> = {
  fr: `© ${YEAR} ${HOLDER}. Sous licence ${LICENCE.id}.`,
  en: `© ${YEAR} ${HOLDER}. Licensed under ${LICENCE.id}.`,
}

const USAGE_TERMS: Record<Locale, string> = {
  fr: "Attribution, Pas d'Utilisation Commerciale, Partage dans les Mêmes Conditions 4.0 International (CC BY-NC-SA 4.0).",
  en: 'Attribution, NonCommercial, ShareAlike 4.0 International (CC BY-NC-SA 4.0).',
}

export const BASE_KEYWORDS: readonly string[] = [HOLDER, 'jeu de rôle', 'illustration']

const BOOKLET_KEYWORDS: Record<Locale, readonly string[]> = {
  fr: [HOLDER, 'jeu de rôle', 'livret'],
  en: [HOLDER, 'tabletop role-playing game', 'booklet'],
}

export type AssetClaim = {
  title: string | undefined
  description: string | undefined
  creator: string
  rights: string
  usageTerms: string
  licenceUrl: string
  webStatement: string
  source: string
  creatorTool: string
  keywords: readonly string[]
}

export type AssetCaption = {
  title: string
  description?: string | undefined
  keywords?: readonly string[] | undefined
}

function signed(title: string): string {
  return `${title} · ${HOLDER}`
}

function merged(
  specific: readonly string[] | undefined,
  base: readonly string[],
): readonly string[] {
  const out: string[] = []
  for (const keyword of [...base, ...(specific ?? [])]) {
    if (!out.includes(keyword)) out.push(keyword)
  }
  return out
}

function claim(locale: Locale): Omit<AssetClaim, 'title' | 'description' | 'keywords'> {
  return {
    creator: HOLDER,
    rights: RIGHTS[locale],
    usageTerms: USAGE_TERMS[locale],
    licenceUrl: LICENCE.deed,
    webStatement: SITE,
    source: SITE,
    creatorTool: CREATOR_TOOL,
  }
}

export function licenceClaim(): AssetClaim {
  return {
    ...claim('fr'),
    title: undefined,
    description: undefined,
    keywords: BASE_KEYWORDS,
  }
}

export function pictureClaim(caption: AssetCaption | undefined): AssetClaim {
  return {
    ...claim('fr'),
    title: caption ? signed(caption.title) : undefined,
    description: caption?.description,
    keywords: merged(caption?.keywords, BASE_KEYWORDS),
  }
}

export function bookletClaim(title: string, locale: Locale): AssetClaim {
  return {
    ...claim(locale),
    title: signed(title),
    description: undefined,
    keywords: BOOKLET_KEYWORDS[locale],
  }
}
