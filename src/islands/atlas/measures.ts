import { HTML_LANG, type Locale } from '../../lib/i18n/locales'
import type { UiStrings } from '../../lib/i18n/strings'

export type AtlasWords = UiStrings['atlas']

export type Measures = {
  number: (value: number, fraction?: number) => string
  metres: (value: number) => string
  kilometres: (value: number) => string
  area: (value: number, fraction?: number) => string
  duration: (days: number, hours: number, hoursPerDay: number) => string
}

const SHORT_DISTANCE_KM = 20

export function createMeasures(locale: Locale, words: AtlasWords): Measures {
  const formats = new Map<number, Intl.NumberFormat>()
  const number = (value: number, fraction = 0) => {
    let format = formats.get(fraction)
    if (!format) {
      format = new Intl.NumberFormat(HTML_LANG[locale], { maximumFractionDigits: fraction })
      formats.set(fraction, format)
    }
    return format.format(value)
  }
  return {
    number,
    metres: (value) => words.metres(number(value)),
    kilometres: (value) => words.kilometres(number(value, value < SHORT_DISTANCE_KM ? 1 : 0)),
    area: (value, fraction = 0) => words.squareKilometres(number(value, fraction)),
    duration: (days, hours, hoursPerDay) => {
      let whole = Math.floor(days + 1e-6)
      let rest = Math.round((days - whole) * hoursPerDay)
      if (rest >= hoursPerDay) {
        whole += 1
        rest = 0
      }
      if (whole > 0) {
        return rest > 0 ? words.daysHours(number(whole), number(rest)) : words.days(number(whole))
      }
      const rounded = Math.round(hours)
      return rounded > 0 ? words.hours(number(rounded)) : words.underAnHour
    },
  }
}
