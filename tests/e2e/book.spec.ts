import { expect, type Page, test } from '@playwright/test'

const CHAPTER = '/fr/livres/livre-du-joueur/comment-jouer'
const NEXT_CHAPTER = '/fr/livres/livre-du-joueur/creer-un-personnage'
const OTHER_BOOK = '/fr/livres/livre-du-mj/diriger-une-partie'

async function markHero(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelector('main h1')?.setAttribute('data-kept', 'true')
  })
}

async function headerHeight(page: Page): Promise<number> {
  const box = await page.locator('[data-shell-header]').boundingBox()
  return box?.height ?? 0
}

function headingSelector(hash: string): string {
  return `#book-body [id="${hash.replace(/^#/, '')}"]`
}

test('a chapter switch leaves the hero mounted', async ({ page }) => {
  await page.goto(CHAPTER)
  await markHero(page)

  await page.locator(`#book-nav a[href="${NEXT_CHAPTER}"]`).click()
  await expect(page).toHaveURL(NEXT_CHAPTER)

  await expect(page.locator('main h1[data-kept]')).toHaveCount(1)
  await expect(page.locator('h1')).toHaveCount(1)
})

test('a chapter switch swaps the text and the sidebar', async ({ page }) => {
  await page.goto(CHAPTER)
  const before = await page.locator('#book-body [data-book-title]').textContent()

  await page.locator(`#book-nav a[href="${NEXT_CHAPTER}"]`).click()
  await expect(page).toHaveURL(NEXT_CHAPTER)

  await expect(page.locator('#book-body [data-book-title]')).not.toHaveText(before ?? '')
  await expect(page.locator('#book-nav a[aria-current="page"]')).toHaveCount(1)
  await expect(page.locator('#book-nav a[aria-current="page"]')).toHaveAttribute(
    'href',
    NEXT_CHAPTER,
  )
})

test('a chapter switch keeps the head and the locale switch correct', async ({ page }) => {
  await page.goto(CHAPTER)
  await page.locator(`#book-nav a[href="${NEXT_CHAPTER}"]`).click()
  await expect(page).toHaveURL(NEXT_CHAPTER)

  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    `https://aubaine.io${NEXT_CHAPTER}`,
  )
  await expect(page.locator('link[rel=alternate][hreflang="en-GB"]')).toHaveAttribute(
    'href',
    'https://aubaine.io/en/books/livre-du-joueur/creer-un-personnage',
  )
  await expect(page.locator('[data-lang-option][href^="/en"]')).toHaveAttribute(
    'href',
    '/en/books/livre-du-joueur/creer-un-personnage',
  )
})

test('a chapter switch returns to the top of the chapter text', async ({ page }) => {
  await page.goto(CHAPTER)
  await page.evaluate(() => window.scrollTo(0, 2000))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)

  await page.locator(`#book-nav a[href="${NEXT_CHAPTER}"]`).click()
  await expect(page).toHaveURL(NEXT_CHAPTER)

  const header = await headerHeight(page)
  await expect
    .poll(async () => {
      const box = await page.locator('#book-body').boundingBox()
      return box?.y ?? Number.NEGATIVE_INFINITY
    })
    .toBeGreaterThanOrEqual(header)
})

test('a chapter switch announces the chapter, not the book', async ({ page }) => {
  await page.goto(CHAPTER)
  await page.locator(`#book-nav a[href="${NEXT_CHAPTER}"]`).click()
  await expect(page).toHaveURL(NEXT_CHAPTER)

  const chapter = (await page.locator('#book-body [data-book-title]').textContent())?.trim()
  const book = (await page.locator('main h1').textContent())?.trim()
  expect(chapter).toBeTruthy()
  expect(chapter).not.toBe(book)

  await expect
    .poll(() => page.locator('#swup-announcer').textContent(), { timeout: 15_000 })
    .toContain(chapter ?? '')
})

test('another book replaces the hero', async ({ page }) => {
  await page.goto(CHAPTER)
  await markHero(page)

  await page.locator(`[data-book-footer] a[href="${OTHER_BOOK}"]`).click()
  await expect(page).toHaveURL(OTHER_BOOK)

  await expect(page.locator('main h1[data-kept]')).toHaveCount(0)
  await expect(page.locator('h1')).toHaveCount(1)
})

test('the other books and the version history close the chapter, not the sidebar', async ({
  page,
}) => {
  await page.goto(CHAPTER)

  const footer = page.locator('#book-body [data-book-footer]')
  await expect(footer.locator(`a[href="${OTHER_BOOK}"]`)).toBeVisible()
  await expect(footer.locator('[data-versions]')).toBeVisible()
  await expect(page.locator(`#book-nav a[href="${OTHER_BOOK}"]`)).toHaveCount(0)
  await expect(page.locator('#book-nav [data-versions]')).toHaveCount(0)

  const pager = await page.locator('#book-body nav').last().boundingBox()
  const closing = await footer.boundingBox()
  expect(pager).not.toBeNull()
  expect(closing).not.toBeNull()
  if (!pager || !closing) return
  expect(closing.y).toBeGreaterThanOrEqual(pager.y + pager.height)
})

test('back and forward restore each chapter', async ({ page }) => {
  await page.goto(CHAPTER)
  await page.locator(`#book-nav a[href="${NEXT_CHAPTER}"]`).click()
  await expect(page).toHaveURL(NEXT_CHAPTER)

  await page.goBack()
  await expect(page).toHaveURL(CHAPTER)
  await expect(page.locator('#book-nav a[aria-current="page"]')).toHaveAttribute('href', CHAPTER)

  await page.goForward()
  await expect(page).toHaveURL(NEXT_CHAPTER)
  await expect(page.locator('#book-nav a[aria-current="page"]')).toHaveAttribute(
    'href',
    NEXT_CHAPTER,
  )
})

test('a sub chapter link lands below the sticky header', async ({ page }) => {
  await page.goto(CHAPTER)
  const link = page.locator('#book-nav .au-trail[data-inset] a').first()
  const hash = await link.getAttribute('href')
  expect(hash).toBeTruthy()

  await link.click()
  const header = await headerHeight(page)
  const heading = page.locator(headingSelector(hash ?? ''))

  await expect
    .poll(async () => (await heading.boundingBox())?.y ?? Number.NEGATIVE_INFINITY)
    .toBeGreaterThanOrEqual(header)
  await expect
    .poll(async () => (await heading.boundingBox())?.y ?? Number.POSITIVE_INFINITY)
    .toBeLessThan(header + 120)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('a sub chapter link still lands below the sticky header', async ({ page }) => {
    await page.goto(CHAPTER)
    const link = page.locator('#book-nav .au-trail[data-inset] a').first()
    const hash = await link.getAttribute('href')

    await link.click()
    const header = await headerHeight(page)
    const heading = page.locator(headingSelector(hash ?? ''))

    await expect
      .poll(async () => (await heading.boundingBox())?.y ?? Number.NEGATIVE_INFINITY)
      .toBeGreaterThanOrEqual(header)
  })
})

test('the theme toggle stays in sync after a client navigation', async ({ page }) => {
  await page.goto(CHAPTER)
  await page.locator('[data-theme-toggle]').click()
  const theme = await page.locator('html').getAttribute('data-theme')

  await page.locator(`#book-nav a[href="${NEXT_CHAPTER}"]`).click()
  await expect(page).toHaveURL(NEXT_CHAPTER)

  await expect(page.locator('html')).toHaveAttribute('data-theme', theme as string)
  await expect(page.locator('[data-theme-toggle]').first()).toHaveAttribute(
    'aria-pressed',
    theme === 'dark' ? 'true' : 'false',
  )
})

test('a chapter ships its prose and its outline', async ({ page }) => {
  await page.goto(CHAPTER)

  const prose = page.locator('#book-body .au-prose')
  await expect(prose.locator('p').first()).toBeVisible()
  expect((await prose.innerText()).trim().length).toBeGreaterThan(400)
  await expect(page.locator('#book-nav .au-trail[data-inset] a').first()).toBeVisible()
})

test('the chapter body is not a scroll container', async ({ page }) => {
  await page.goto(CHAPTER)

  const prose = page.locator('#book-body .au-prose')
  const overflow = await prose.evaluate((node) => {
    const styles = getComputedStyle(node)
    return `${styles.overflowX} ${styles.overflowY}`
  })
  expect(overflow).toBe('visible visible')
  expect(await prose.evaluate((node) => node.scrollWidth - node.clientWidth)).toBe(0)
})
