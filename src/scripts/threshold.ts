import { preferredLocale } from '../lib/i18n/locales'
import type { SwupFailArgs, SwupFailHandler, SwupInstance, SwupVisit } from './swup'

const THRESHOLD = '[data-threshold]'
const HEADER = '[data-shell-header]'
const ARRIVING = 'data-arriving'

function destinationFrom(threshold: HTMLElement): string {
  const locale = preferredLocale(navigator.languages)
  const link = threshold.querySelector<HTMLAnchorElement>(`a[hreflang="${locale}"]`)
  if (!link) throw new Error(`The threshold offers no link to the ${locale} home`)
  return link.pathname
}

function markArrivingHeader(): void {
  document.querySelector(HEADER)?.setAttribute(ARRIVING, '')
}

function replaceNatively(
  visit: SwupVisit,
  args: SwupFailArgs,
  defaultHandler?: SwupFailHandler,
): void {
  if (visit.history.action !== 'replace') {
    defaultHandler?.(visit, args)
    return
  }
  console.error(args.error)
  window.location.replace(visit.to.url + (visit.to.hash ?? ''))
}

export function bindThreshold(swup: SwupInstance): void {
  const threshold = document.querySelector<HTMLElement>(THRESHOLD)
  if (!threshold) return
  swup.hooks.replace('visit:fail', replaceNatively)
  swup.hooks.once('content:replace', markArrivingHeader)
  swup.navigate(destinationFrom(threshold), { history: 'replace' })
}
