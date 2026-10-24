import { formatNumber } from '../../../src/lib/game/derive'
import type { Locale } from '../../../src/lib/i18n/locales'
import { strings } from '../../../src/lib/i18n/strings'

export function resultLabel(count: number, locale: Locale): string {
  const words = strings(locale)
  return `${formatNumber(count, locale)} ${count === 1 ? words.result : words.results}`
}
