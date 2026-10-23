import { formatNumber, slugify } from '../lib/game/derive'
import { HTML_LANG, isLocale } from '../lib/i18n/locales'
import type { SwupInstance, SwupVisit } from './swup'

const SEARCH_DELAY = 320

let searchTimer: number | undefined
let searchNavigation = false

export function queryTerms(query: string): string[] {
  return slugify(query).split('-').filter(Boolean)
}

export function nameMatches(name: string, terms: string[]): boolean {
  return terms.every((term) => name.includes(term))
}

function resultsPage(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-search-results]')
}

function searchField(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>('[data-search-input]')
}

function searchPath(input: HTMLInputElement): string | undefined {
  const action = input.form?.dataset['searchAction']
  if (!action) return undefined
  const query = input.value.trim()
  return query ? `${action}?q=${encodeURIComponent(query)}` : action
}

function filterRows(results: HTMLElement, query: string): number {
  const terms = queryTerms(query)
  let shown = 0
  for (const group of results.querySelectorAll<HTMLElement>('[data-search-group]')) {
    let shownInGroup = 0
    for (const row of group.querySelectorAll<HTMLElement>('[data-search-row]')) {
      const name = row.dataset['name']
      const matched = name !== undefined && nameMatches(name, terms)
      row.hidden = !matched
      if (matched) shownInGroup += 1
    }
    group.hidden = shownInGroup === 0
    shown += shownInGroup
  }
  return shown
}

function describeResults(results: HTMLElement, query: string, shown: number): void {
  const title = results.querySelector<HTMLElement>('[data-search-title]')
  const heading = query ? title?.dataset['titleFor'] : title?.dataset['title']
  if (title && heading !== undefined) title.textContent = query ? `${heading} ${query}` : heading

  const count = results.querySelector<HTMLElement>('[data-search-count]')
  const locale = results.dataset['locale']
  if (count && locale !== undefined && isLocale(locale)) {
    const one = new Intl.PluralRules(HTML_LANG[locale]).select(shown) === 'one'
    const label = one ? count.dataset['result'] : count.dataset['results']
    if (label !== undefined) count.textContent = `${formatNumber(shown, locale)} ${label}`
  }

  const empty = results.querySelector<HTMLElement>('[data-search-empty]')
  if (empty) empty.hidden = shown > 0
}

function showResults(results: HTMLElement, input: HTMLInputElement): void {
  const query = input.value.trim()
  describeResults(results, query, filterRows(results, query))
  const path = searchPath(input)
  if (path && path !== `${window.location.pathname}${window.location.search}`) {
    window.history.replaceState(window.history.state, '', path)
  }
}

function openResults(swup: SwupInstance, input: HTMLInputElement, keepFocus: boolean): void {
  const path = searchPath(input)
  if (!path) return
  searchNavigation = keepFocus
  swup.navigate(path)
}

function onInput(swup: SwupInstance, event: Event): void {
  const input = event.target
  if (!(input instanceof HTMLInputElement) || !input.matches('[data-search-input]')) return
  window.clearTimeout(searchTimer)
  const results = resultsPage()
  if (results) {
    showResults(results, input)
    return
  }
  if (!input.value.trim()) return
  searchTimer = window.setTimeout(() => openResults(swup, input, true), SEARCH_DELAY)
}

function onSubmit(swup: SwupInstance, event: SubmitEvent): void {
  const form = event.target
  if (!(form instanceof HTMLFormElement) || !form.matches('[data-search-form]')) return
  const input = form.querySelector<HTMLInputElement>('[data-search-input]')
  if (!input) return
  event.preventDefault()
  window.clearTimeout(searchTimer)
  const results = resultsPage()
  if (results) showResults(results, input)
  else openResults(swup, input, false)
}

function onVisitStart(visit: SwupVisit): void {
  if (searchNavigation && visit.a11y) visit.a11y.focus = false
  searchNavigation = false
}

function syncWithPage(): void {
  const input = searchField()
  if (!input) return
  if (input !== document.activeElement) {
    input.value = new URLSearchParams(window.location.search).get('q') ?? ''
  }
  const results = resultsPage()
  if (results) showResults(results, input)
}

function onContentReplace(): void {
  window.clearTimeout(searchTimer)
  syncWithPage()
}

export function bindSearch(swup: SwupInstance): void {
  document.addEventListener('input', (event) => onInput(swup, event))
  document.addEventListener('submit', (event) => onSubmit(swup, event))
  swup.hooks.on('visit:start', onVisitStart)
  swup.hooks.on('content:replace', onContentReplace)
  syncWithPage()
}
