import { HTML_LANG, isLocale } from '../lib/i18n/locales'
import { bindBook } from './book'
import { bindBrowse } from './browse'
import { bindLoading } from './loading'
import { type SwupVisit, swupInstance, withSwup } from './swup'

const THEME_KEY = 'aubaine.theme'
const SEARCH_DELAY = 320
const HEADER_CONTAINER = '#site-header'

type Theme = 'dark' | 'light'

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

function syncThemeButtons(): void {
  const pressed = currentTheme() === 'dark' ? 'true' : 'false'
  for (const button of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
    button.setAttribute('aria-pressed', pressed)
  }
}

function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {
    return
  } finally {
    syncThemeButtons()
  }
}

function closeAll(except?: Element): void {
  for (const menu of document.querySelectorAll<HTMLElement>('[data-menu]')) {
    if (menu === except) continue
    setMenuOpen(menu, false)
  }
  const lang = document.querySelector<HTMLElement>('[data-lang]')
  if (lang && lang !== except) setLangOpen(lang, false)
}

function setMenuOpen(menu: HTMLElement, open: boolean): void {
  const trigger = menu.querySelector<HTMLElement>('[data-menu-trigger]')
  const panel = menu.querySelector<HTMLElement>('[data-menu-panel]')
  if (!trigger || !panel) return
  trigger.setAttribute('aria-expanded', open ? 'true' : 'false')
  panel.hidden = !open
}

function setLangOpen(wrapper: HTMLElement, open: boolean): void {
  const trigger = wrapper.querySelector<HTMLElement>('[data-lang-trigger]')
  const panel = wrapper.querySelector<HTMLElement>('[data-lang-panel]')
  if (!trigger || !panel) return
  trigger.setAttribute('aria-expanded', open ? 'true' : 'false')
  panel.hidden = !open
  if (!open) return
  const box = wrapper.getBoundingClientRect()
  const alignLeft = box.left < window.innerWidth - box.right
  panel.style.left = alignLeft ? '0px' : 'auto'
  panel.style.right = alignLeft ? 'auto' : '0px'
}

function placeTip(host: HTMLElement): void {
  const tip = host.querySelector<HTMLElement>('[data-tip]')
  if (!tip) return
  const pad = 12
  let left = pad
  let right = document.documentElement.clientWidth - pad
  let top = Math.max(pad, headerHeight() + 8)
  let bottom = window.innerHeight - pad

  for (let node = host.parentElement; node && node !== document.body; node = node.parentElement) {
    const styles = getComputedStyle(node)
    if (styles.overflowX === 'visible' && styles.overflowY === 'visible') continue
    const box = node.getBoundingClientRect()
    if (styles.overflowX !== 'visible') {
      left = Math.max(left, box.left + 2)
      right = Math.min(right, box.right - 2)
    }
    if (styles.overflowY !== 'visible') {
      top = Math.max(top, box.top + 2)
      bottom = Math.min(bottom, box.bottom - 2)
    }
  }

  tip.style.left = '0px'
  tip.style.top = 'auto'
  tip.style.bottom = 'calc(100% + 9px)'
  tip.style.maxWidth = `${Math.max(180, Math.min(330, right - left))}px`
  tip.style.maxHeight = `${Math.max(110, bottom - top)}px`
  tip.style.overflowX = 'clip'
  tip.style.overflowY = 'auto'

  const anchor = host.getBoundingClientRect()
  const width = Math.min(tip.offsetWidth || 330, 330)
  const height = tip.offsetHeight || 150
  tip.style.left = `${Math.round(Math.min(Math.max(left, anchor.left), Math.max(left, right - width)) - anchor.left)}px`

  const above = anchor.top - height - 9
  const below = anchor.bottom + 9
  const y = above >= top ? above : below + height <= bottom ? below : Math.max(top, bottom - height)
  if (y !== above) {
    tip.style.bottom = 'auto'
    tip.style.top = `${Math.round(y - anchor.top)}px`
  }
}

function headerHeight(): number {
  const header = document.querySelector<HTMLElement>('[data-shell-header]')
  return header ? Math.round(header.getBoundingClientRect().height) : 64
}

function publishMetrics(): void {
  const height = headerHeight()
  const root = document.documentElement
  root.style.setProperty('--header-h', `${height}px`)
  root.style.setProperty('--sticky-top', `${height + 20}px`)
  root.style.setProperty('--sticky-max', `calc(100dvh - ${height + 40}px)`)
}

let headerObserver: ResizeObserver | null = null

function watchHeader(): void {
  headerObserver?.disconnect()
  publishMetrics()
  const header = document.querySelector<HTMLElement>('[data-shell-header]')
  if (!header || typeof ResizeObserver === 'undefined') return
  headerObserver = new ResizeObserver(publishMetrics)
  headerObserver.observe(header)
}

function startHeroVideo(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  for (const video of document.querySelectorAll<HTMLVideoElement>('[data-hero-video]')) {
    const source = video.dataset.heroVideo
    if (!source || video.dataset.started === 'true') continue
    video.dataset.started = 'true'
    video.muted = true
    video.loop = true
    const reveal = () => {
      video.style.opacity = '1'
    }
    video.addEventListener('playing', reveal)
    const start = () => {
      const played = video.play()
      if (played && typeof played.catch === 'function') {
        played.catch(() => {
          video.style.opacity = '0'
        })
      }
    }
    video.addEventListener('canplay', start, { once: true })
    video.src = source
  }
}

let searchTimer: number | undefined
let searchNavigation = false

function scheduleSearch(input: HTMLInputElement): void {
  const form = input.closest<HTMLFormElement>('[data-search-form]')
  const action = form?.dataset.searchAction
  if (!action) return
  window.clearTimeout(searchTimer)
  const value = input.value.trim()
  const target = value ? `${action}?q=${encodeURIComponent(value)}` : action
  if (document.querySelector('[data-search-results]')) return
  searchTimer = window.setTimeout(() => {
    const swup = swupInstance()
    if (!swup) {
      window.location.assign(target)
      return
    }
    searchNavigation = true
    swup.navigate(target)
  }, SEARCH_DELAY)
}

function bindOnce(): void {
  document.addEventListener(
    'pointerover',
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const term = target.closest<HTMLElement>('[data-term]')
      if (term) placeTip(term)
      const menu = target.closest<HTMLElement>('[data-menu]')
      if (menu) {
        closeAll(menu)
        setMenuOpen(menu, true)
      }
    },
    true,
  )

  document.addEventListener(
    'focusin',
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const term = target.closest<HTMLElement>('[data-term]')
      if (term) placeTip(term)
      const menu = target.closest<HTMLElement>('[data-menu]')
      if (menu) {
        closeAll(menu)
        setMenuOpen(menu, true)
      }
    },
    true,
  )

  document.addEventListener('pointerout', (event) => {
    const target = event.target
    const related = event.relatedTarget
    if (!(target instanceof Element)) return
    const menu = target.closest<HTMLElement>('[data-menu]')
    if (!menu) return
    if (related instanceof Node && menu.contains(related)) return
    setMenuOpen(menu, false)
  })

  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const themeButton = target.closest<HTMLElement>('[data-theme-toggle]')
    if (themeButton) {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark')
      return
    }

    const langTrigger = target.closest<HTMLElement>('[data-lang-trigger]')
    if (langTrigger) {
      event.stopPropagation()
      const wrapper = langTrigger.closest<HTMLElement>('[data-lang]')
      if (!wrapper) return
      const open = langTrigger.getAttribute('aria-expanded') === 'true'
      closeAll(wrapper)
      setLangOpen(wrapper, !open)
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return
    closeAll()
  })

  document.addEventListener('pointerdown', (event) => {
    const target = event.target
    if (target instanceof Element && target.closest('[data-lang]')) return
    closeAll()
  })

  document.addEventListener('input', (event) => {
    const target = event.target
    if (target instanceof HTMLInputElement && target.matches('[data-search-input]')) {
      scheduleSearch(target)
    }
  })

  window.addEventListener('resize', publishMetrics)
}

function setActiveSection(section: string | undefined): void {
  for (const link of document.querySelectorAll<HTMLElement>('[data-nav]')) {
    const active = section !== undefined && link.dataset['nav'] === section
    link.toggleAttribute('data-active', active)
    if (active) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  }
}

function currentSection(): string | undefined {
  return document.querySelector<HTMLElement>('#swup')?.dataset['section']
}

function syncLanguageLinks(): void {
  for (const option of document.querySelectorAll<HTMLAnchorElement>('[data-lang-option]')) {
    const locale = option.dataset['langOption']
    if (locale === undefined || !isLocale(locale)) continue
    const alternate = document.querySelector<HTMLLinkElement>(
      `link[rel="alternate"][hreflang="${HTML_LANG[locale]}"]`,
    )
    if (!alternate) continue
    option.setAttribute('href', new URL(alternate.href, window.location.origin).pathname)
  }
}

function localeOf(url: string): string | undefined {
  const [first] = new URL(url, window.location.origin).pathname.split('/').filter(Boolean)
  return first !== undefined && isLocale(first) ? first : undefined
}

function crossesLocale(visit: SwupVisit): boolean {
  return localeOf(visit.from.url) !== localeOf(visit.to.url)
}

function onVisitStart(visit: SwupVisit): void {
  if (crossesLocale(visit) && !visit.containers.includes(HEADER_CONTAINER)) {
    visit.containers = [HEADER_CONTAINER, ...visit.containers]
  }
  if (searchNavigation && visit.a11y) visit.a11y.focus = false
  searchNavigation = false

  const section = visit.trigger?.el?.closest<HTMLElement>('[data-nav]')?.dataset['nav']
  if (section !== undefined) setActiveSection(section)
}

function onPageView(): void {
  syncThemeButtons()
  syncLanguageLinks()
  watchHeader()
  startHeroVideo()
  const params = new URLSearchParams(window.location.search)
  const query = params.get('q') ?? ''
  for (const input of document.querySelectorAll<HTMLInputElement>('[data-search-input]')) {
    if (input !== document.activeElement) input.value = query
  }
}

bindOnce()
onPageView()

withSwup((swup) => {
  swup.hooks.on('page:view', onPageView)
  swup.hooks.on('content:replace', () => {
    window.clearTimeout(searchTimer)
    headerObserver?.disconnect()
    setActiveSection(currentSection())
  })
  bindBook(swup)
  bindBrowse(swup)
  bindLoading(swup)
  swup.hooks.on('visit:start', onVisitStart)
})
