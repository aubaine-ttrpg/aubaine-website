import { HTML_LANG, type Locale } from '../i18n/locales.ts'

const KILOBYTE = 1000
const MEGABYTE = 1000 * KILOBYTE

const SIZE_FORMATS = new Map<string, Intl.NumberFormat>()
const DATE_FORMATS = new Map<Locale, Intl.DateTimeFormat>()

function sizeFormat(locale: Locale, unit: 'kilobyte' | 'megabyte'): Intl.NumberFormat {
  const key = `${locale}/${unit}`
  const known = SIZE_FORMATS.get(key)
  if (known) return known
  const made = new Intl.NumberFormat(HTML_LANG[locale], {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: 1,
  })
  SIZE_FORMATS.set(key, made)
  return made
}

export function formatBytes(bytes: number, locale: Locale): string {
  return bytes >= MEGABYTE
    ? sizeFormat(locale, 'megabyte').format(bytes / MEGABYTE)
    : sizeFormat(locale, 'kilobyte').format(bytes / KILOBYTE)
}

export function formatReleaseDate(value: string, locale: Locale): string {
  const known = DATE_FORMATS.get(locale)
  const format =
    known ??
    new Intl.DateTimeFormat(HTML_LANG[locale], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    })
  if (!known) DATE_FORMATS.set(locale, format)
  const day = value.slice(0, 10)
  return format.format(new Date(`${day}T00:00:00Z`))
}
