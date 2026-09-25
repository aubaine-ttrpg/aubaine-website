export const LOCALES = ['fr', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'fr'

export const HTML_LANG: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' }

export const OG_LOCALE: Record<Locale, string> = { fr: 'fr_FR', en: 'en_GB' }

export const LOCALE_NAME: Record<Locale, string> = { fr: 'Français', en: 'English' }

export const LOCALE_FLAG: Record<Locale, string> = { fr: '/flags/fr.svg', en: '/flags/gb.svg' }

export const LINGUA_FRANCA: Locale = 'en'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export function preferredLocale(languages: readonly string[]): Locale {
  for (const tag of languages) {
    const [language = ''] = tag.toLowerCase().split('-')
    if (isLocale(language)) return language
  }
  return LINGUA_FRANCA
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'fr' ? 'en' : 'fr'
}
