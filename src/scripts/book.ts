import { bookChapterRef } from '../lib/i18n/routes'
import type { SwupInstance, SwupVisit } from './swup'

const CHAPTER_CONTAINERS = ['#site-footer', '#book-nav', '#book-body']
const CHAPTER_BODY = '#book-body'
const CHAPTER_TITLE = '#book-body [data-book-title]'

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

function chapterRef(url: string): string | undefined {
  return bookChapterRef(new URL(url, window.location.origin).pathname)
}

function staysInsideOneBook(visit: SwupVisit): boolean {
  const from = chapterRef(visit.from.url)
  return from !== undefined && from === chapterRef(visit.to.url)
}

export function bindBook(swup: SwupInstance): void {
  swup.hooks.replace('scroll:anchor', (_visit, { hash }) => {
    const anchor = swup.getAnchorElement(hash)
    if (!anchor) return false
    anchor.scrollIntoView({ behavior: scrollBehavior() })
    return true
  })

  swup.hooks.on('visit:start', (visit) => {
    if (!staysInsideOneBook(visit)) return
    visit.containers = CHAPTER_CONTAINERS
    visit.animation.animate = false
    if (visit.a11y) visit.a11y.focus = { selector: CHAPTER_BODY, wait: true }
    if (visit.history.popstate || visit.to.hash) return
    visit.scroll.target = CHAPTER_BODY
  })

  swup.hooks.on('content:replace', (visit) => {
    if (!visit.a11y || !staysInsideOneBook(visit)) return
    const title = document.querySelector(CHAPTER_TITLE)?.textContent?.trim()
    if (title) visit.a11y.announce = title
  })
}
