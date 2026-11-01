import { expect, type Locator, test } from '@playwright/test'

import { BOOK_CATEGORIES } from '../../src/lib/game/schema'
import { HTML_LANG, LOCALES } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'

const PRINT_INK = 'rgb(20, 16, 10)'
const PRINT_BODY = 'rgb(58, 52, 72)'
const WHITE_PAPER = 'rgb(255, 255, 255)'
const SITE = 'https://aubaine.io'
const FOCUS_REACHES = [
  [320, 568],
  [390, 844],
  [640, 400],
  [820, 500],
] as const

for (const locale of LOCALES) {
  test(`the Livres menu of ${pathFor('books', locale)} lists every category, in their order`, async ({
    page,
  }) => {
    await page.goto(pathFor('books', locale))
    const menu = await page
      .locator('#site-header [data-menu]:has([data-nav="books"]) [role="menu"]')
      .locator('[data-menu-item]')
      .evaluateAll((items) => items.map((item) => item.getAttribute('href')))
    expect(menu).toEqual([
      pathFor('books', locale),
      ...BOOK_CATEGORIES.map((category) => pathFor('bookCategory', locale, { category })),
    ])
  })

  test(`every category of ${pathFor('books', locale)} has its page, and one with nothing yet says so and stays out of search`, async ({
    page,
    request,
  }) => {
    const t = strings(locale)
    const sitemap = await (await request.get('/sitemap.xml')).text()
    for (const category of BOOK_CATEGORIES) {
      const path = pathFor('bookCategory', locale, { category })
      expect((await page.goto(path))?.status(), path).toBe(200)
      for (const other of LOCALES) {
        await expect(
          page.locator(`link[rel=alternate][hreflang="${HTML_LANG[other]}"]`),
        ).toHaveAttribute('href', `${SITE}${pathFor('bookCategory', other, { category })}`)
      }
      if ((await page.locator('[data-entry]').count()) > 0) {
        await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', `${SITE}${path}`)
        continue
      }
      await expect(page.locator('link[rel=canonical]')).toHaveCount(0)
      await expect(page.getByText(t.bookCategories[category].empty, { exact: true })).toBeVisible()
      await expect(page.getByText(t.emptyCategoryBody, { exact: true })).toBeVisible()
      await expect(
        page.locator('main').getByRole('link', { name: t.allDocs, exact: true }),
      ).toHaveAttribute('href', pathFor('books', locale))
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
      expect(sitemap, path).not.toContain(`${path}<`)
    }
  })
}

for (const locale of LOCALES) {
  test(`print sets an empty book category of ${pathFor('books', locale)} in dark ink and drops its stage`, async ({
    page,
  }) => {
    const t = strings(locale)
    for (const category of BOOK_CATEGORIES) {
      await page.emulateMedia({ media: 'screen', colorScheme: 'dark' })
      await page.goto(pathFor('bookCategory', locale, { category }))
      if ((await page.locator('[data-entry]').count()) > 0) continue
      await expect(page.locator('.au-empty-stage__layer')).toBeAttached()
      await page.emulateMedia({ media: 'print', colorScheme: 'dark' })
      await expect(page.locator('.au-empty-stage__layer')).toBeHidden()
      await expect(page.locator('html')).toHaveCSS('background-color', WHITE_PAPER)
      await expect(page.locator('[data-tip-root]')).toHaveCSS('background-color', WHITE_PAPER)
      await expect(page.getByText(t.bookCategories[category].empty, { exact: true })).toHaveCSS(
        'color',
        PRINT_INK,
      )
      await expect(page.getByText(t.emptyCategoryBody, { exact: true })).toHaveCSS(
        'color',
        PRINT_BODY,
      )
    }
  })
}

for (const [width, height] of FOCUS_REACHES) {
  test(`the keyboard finds the help button of an empty category clear of the header at ${width}x${height}`, async ({
    page,
  }) => {
    const t = strings('en')
    await page.setViewportSize({ width, height })
    const uncovered = (button: Locator) =>
      button.evaluate((element) => {
        const box = element.getBoundingClientRect()
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
        return hit !== null && element.contains(hit)
      })

    for (const category of BOOK_CATEGORIES) {
      await page.goto(pathFor('bookCategory', 'en', { category }))
      if ((await page.locator('[data-entry]').count()) > 0) continue
      await page.locator('main').getByRole('link', { name: t.allDocs, exact: true }).focus()
      await page.keyboard.press('Shift+Tab')
      const focused = page.locator('.au-plates__about')
      await expect(focused).toBeFocused()
      expect(await uncovered(focused), category).toBe(true)
    }
  })
}
