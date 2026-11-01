import { expect, type Locator, type Page, test } from '@playwright/test'

import { BOOK_CATEGORIES } from '../../src/lib/game/schema'
import { HTML_LANG, LOCALES, type Locale } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'

const HUB_KINDS = ['books', 'almanach'] as const
const MENU = '[data-doors]'
const DOOR = '[data-door]'
const DOOR_LINK = '[data-door] a'
const STAGE_LAYER: Record<HubKind, string> = {
  books: '.au-sommaire__layer',
  almanach: '.au-plate-menu__layer',
}
const DARK_STAGE = 'rgb(6, 5, 13)'
const PRINT_INK = 'rgb(20, 16, 10)'
const PRINT_BODY = 'rgb(58, 52, 72)'
const TRANSPARENT = 'rgba(0, 0, 0, 0)'
const WHITE_PAPER = 'rgb(255, 255, 255)'
const SITE = 'https://aubaine.io'
const FOCUS_REACHES = [
  [320, 568],
  [390, 844],
  [640, 400],
  [820, 500],
] as const
const SCENE_FROM = 960
const CLOCK_START = new Date('2026-01-01T00:00:00Z')
const CLOCK_STILL = new Date('2026-01-01T00:01:00Z')
const SIZES = [
  [1512, 860],
  [1440, 789],
  [1366, 657],
  [1280, 610],
  [1024, 768],
  [820, 1180],
  [390, 844],
  [320, 568],
] as const

type HubKind = (typeof HUB_KINDS)[number]

type Door = { name: string; href: string; art: string; colours: string }

async function doorsOf(page: Page): Promise<Door[]> {
  return page.locator(DOOR).evaluateAll((doors) =>
    doors.map((door) => {
      const link = door.querySelector('a')
      const label = document.getElementById(link?.getAttribute('aria-labelledby') ?? '')
      return {
        name: label?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
        href: link?.getAttribute('href') ?? '',
        art: door.getAttribute('data-door-art') ?? '',
        colours: door.getAttribute('data-door-colours') ?? '',
      }
    }),
  )
}

async function live(page: Page): Promise<void> {
  await expect(page.locator(`${MENU}[data-live]`)).toHaveCount(1)
}

function litDoors(page: Page) {
  return page.locator(`${DOOR}[data-lit]`)
}

function hubCopy(kind: HubKind, locale: Locale): { title: string; lead: string } {
  const t = strings(locale)
  return kind === 'books'
    ? { title: t.books, lead: t.hubLead }
    : { title: t.almanach, lead: t.almanachLead }
}

function stemOf(url: string): string {
  const file = new URL(url, 'http://localhost').pathname.split('/').pop() ?? ''
  return file.split('.')[0] ?? ''
}

async function openingLight(page: Page): Promise<{ art: string; colours: string }> {
  return page.evaluate(() => {
    const stage = document.querySelector('[data-stage-host] :is([data-stage], [data-stage-field])')
    if (stage) {
      const colours = stage.getAttribute('data-stage-field')
      return colours === null
        ? { art: stage.getAttribute('data-stage') ?? '', colours: '' }
        : { art: '', colours }
    }
    const hero = document.querySelector<HTMLImageElement>('section.au-hero img')
    return { art: hero?.currentSrc || hero?.src || '', colours: '' }
  })
}

for (const locale of LOCALES) {
  for (const kind of HUB_KINDS) {
    const hub = pathFor(kind, locale)

    test(`${hub} opens on one title and one door per section`, async ({ page }) => {
      await page.goto(hub)
      await expect(page.locator('h1')).toHaveCount(1)
      const doors = await doorsOf(page)
      expect(doors.length).toBeGreaterThan(0)
      expect(new Set(doors.map((door) => door.href)).size).toBe(doors.length)
      for (const door of doors) {
        await expect(
          page.locator('main').getByRole('link', { name: door.name, exact: true }),
        ).toHaveCount(1)
      }
    })

    test(`${hub} leads each door to a page named as the door that offers something to open`, async ({
      page,
    }) => {
      const t = strings(locale)
      await page.goto(hub)
      for (const door of await doorsOf(page)) {
        await page.goto(door.href)
        await expect(page.locator('h1')).toHaveAccessibleName(door.name)
        const onward = page
          .locator('[data-entry], [data-release-link]')
          .or(page.locator('main').getByRole('link', { name: t.allDocs, exact: true }))
        await expect(onward.first(), door.href).toBeAttached()
      }
    })

    test(`${hub} shows on each door the light of the page it opens`, async ({ page }) => {
      await page.goto(hub)
      for (const door of await doorsOf(page)) {
        await page.goto(door.href)
        const light = await openingLight(page)
        if (door.art) expect(stemOf(light.art), door.href).toBe(stemOf(door.art))
        else expect(light.colours, door.href).toBe(door.colours)
      }
    })

    test(`${hub} header menu lists the doors of the hub, in their order`, async ({ page }) => {
      await page.goto(hub)
      const doors = (await doorsOf(page)).map((door) => door.href)
      const menu = await page
        .locator(`#site-header [data-menu]:has([data-nav="${kind}"]) [role="menu"]`)
        .locator('[data-menu-item]')
        .evaluateAll((items) => items.map((item) => item.getAttribute('href')))
      expect(menu).toEqual([hub, ...doors])
    })

    test(`${hub} keeps its help in the note beside its title`, async ({ page }) => {
      const t = strings(locale)
      const { title, lead } = hubCopy(kind, locale)
      await page.goto(hub)
      await expect(page.locator(MENU).getByText(lead)).toBeHidden()
      await page.getByRole('button', { name: t.hubAbout(title) }).click()
      await expect(page.locator('#hub-note')).toContainText(lead)
    })
  }

  test(`${pathFor('books', locale)} lists every category, and one with nothing yet says so and stays out of search`, async ({
    page,
    request,
  }) => {
    const t = strings(locale)
    await page.goto(pathFor('books', locale))
    const opened = (await doorsOf(page)).map((door) => door.href)
    const categories = BOOK_CATEGORIES.map((category) =>
      pathFor('bookCategory', locale, { category }),
    )
    expect(opened).toEqual([...categories, pathFor('archives', locale)])
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

test.describe('the lit door', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1512, height: 860 } })

  for (const kind of HUB_KINDS) {
    const hub = pathFor(kind, 'en')

    test(`on ${hub} the first door is lit at rest and never marked current`, async ({ page }) => {
      await page.goto(hub)
      await expect(litDoors(page)).toHaveCount(1)
      await expect(page.locator(DOOR).first()).toHaveAttribute('data-lit', '')
      await expect(page.locator(`${DOOR_LINK}[aria-current]`)).toHaveCount(0)
    })

    test(`on ${hub} pointing a door lights it, moves the stage and leaves it lit`, async ({
      page,
    }) => {
      await page.goto(hub)
      await live(page)
      const doors = await doorsOf(page)
      const target = doors.findIndex((door, index) => index > 0 && door.art !== '')
      expect(target, 'a door after the first opens on a painting').toBeGreaterThan(0)
      await page.locator(DOOR_LINK).nth(target).hover()
      await expect(page.locator(DOOR).nth(target)).toHaveAttribute('data-lit', '')
      await expect(litDoors(page)).toHaveCount(1)
      await expect(page.locator('[data-stage-host] [data-stage]')).toHaveAttribute(
        'data-stage',
        doors[target]?.art ?? '',
      )
      await page.mouse.move(2, 2)
      await expect(page.locator(DOOR).nth(target)).toHaveAttribute('data-lit', '')
    })

    test(`on ${hub} a door the pointer only crosses never takes the light or the stage`, async ({
      page,
    }) => {
      await page.clock.install({ time: CLOCK_START })
      await page.goto(hub)
      await live(page)
      await page.clock.pauseAt(CLOCK_STILL)
      const doors = await doorsOf(page)
      const target = doors.findIndex((door, index) => index > 0 && door.art !== '')
      expect(target, 'a door after the first opens on a painting').toBeGreaterThan(0)
      const stage = page.locator('[data-stage-host] [data-stage]')
      const opening = (await stage.getAttribute('data-stage')) ?? ''
      const box = await page.locator(DOOR_LINK).nth(target).boundingBox()
      if (!box) throw new Error('the door to cross has no box')
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await expect(page.locator(DOOR).nth(target)).toHaveAttribute('data-pointed', '')
      await page.mouse.move(1, 1)
      await page.clock.runFor(1000)
      await expect(page.locator(DOOR).first()).toHaveAttribute('data-lit', '')
      await expect(litDoors(page)).toHaveCount(1)
      await expect(stage).toHaveAttribute('data-stage', opening)
    })

    test(`on ${hub} keyboard focus that leaves the doors for a button leaves no door pointed`, async ({
      page,
    }) => {
      await page.goto(hub)
      await live(page)
      await page.locator(DOOR_LINK).nth(1).focus()
      await page.keyboard.press('Shift+Tab')
      await expect(page.locator(DOOR).first()).toHaveAttribute('data-pointed', '')
      await page.keyboard.press('Shift+Tab')
      await expect(page.locator(`${MENU} button`).first()).toBeFocused()
      await expect(page.locator(`${DOOR}[data-pointed]`)).toHaveCount(0)
      await expect(page.locator(DOOR).first()).toHaveAttribute('data-lit', '')
    })

    test(`on ${hub} keyboard focus on a button of the menu clears the pointed door and its intent`, async ({
      page,
    }) => {
      await page.clock.install({ time: CLOCK_START })
      await page.goto(hub)
      await live(page)
      await page.clock.pauseAt(CLOCK_STILL)
      const help = page.locator(`${MENU} button`).first()
      await help.focus()
      await page.keyboard.press('Shift+Tab')
      const box = await page.locator(DOOR_LINK).nth(2).boundingBox()
      if (!box) throw new Error('the door to point has no box')
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await expect(page.locator(DOOR).nth(2)).toHaveAttribute('data-pointed', '')
      await page.keyboard.press('Tab')
      await expect(help).toBeFocused()
      await expect(page.locator(`${DOOR}[data-pointed]`)).toHaveCount(0)
      await page.mouse.move(1, 1)
      await page.clock.runFor(1000)
      await expect(page.locator(DOOR).first()).toHaveAttribute('data-lit', '')
      await expect(litDoors(page)).toHaveCount(1)
    })

    test(`on ${hub} the keyboard lights the door it focuses at once`, async ({ page }) => {
      await page.clock.install({ time: CLOCK_START })
      await page.goto(hub)
      await live(page)
      await page.clock.pauseAt(CLOCK_STILL)
      await page.locator(DOOR_LINK).first().focus()
      await page.keyboard.press('Tab')
      await expect(page.locator(DOOR_LINK).nth(1)).toBeFocused()
      await expect(page.locator(DOOR).nth(1)).toHaveAttribute('data-lit', '')
      await expect(litDoors(page)).toHaveCount(1)
    })
  }
})

test('the doors are read in the order they are drawn', async ({ page }) => {
  for (const kind of HUB_KINDS) {
    for (const [width, height] of [
      [1512, 860],
      [390, 844],
    ] as const) {
      await page.setViewportSize({ width, height })
      await page.goto(pathFor(kind, 'fr'))
      const boxes = await page
        .locator(DOOR_LINK)
        .evaluateAll((links) => links.map((link) => link.getBoundingClientRect().toJSON()))
      const drawn = boxes
        .map((box, index) => ({
          index,
          column: box.left < width / 2 ? 0 : 1,
          top: Math.round(box.top / 40),
          left: box.left,
        }))
        .sort((a, b) => a.column - b.column || a.top - b.top || a.left - b.left)
        .map((box) => box.index)
      expect(drawn, `${kind} at ${width}`).toEqual(boxes.map((_, index) => index))
    }
  }
})

for (const [width, height] of SIZES) {
  test(`nothing on a Codex door is cut at ${width}x${height}, whichever door is lit`, async ({
    page,
  }) => {
    test.slow()
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const locale of LOCALES) {
      await page.mouse.move(1, 1)
      await page.goto(pathFor('almanach', locale))
      await live(page)
      const count = await page.locator(DOOR_LINK).count()
      const lit = width >= SCENE_FROM ? [...Array(count).keys()] : [0]
      for (const index of lit) {
        if (index > 0) {
          await page.locator(DOOR_LINK).nth(index).hover()
          await expect(page.locator(DOOR).nth(index)).toHaveAttribute('data-lit', '')
        }
        const problems = await page.evaluate(() => {
          const found: string[] = []
          const doc = document.documentElement
          const viewport = doc.clientWidth
          if (doc.scrollWidth - viewport !== 0) found.push('the page scrolls sideways')
          const column = document.querySelector('.au-plate-menu__doors')?.getBoundingClientRect()
          for (const door of document.querySelectorAll<HTMLElement>('[data-door]')) {
            const name =
              door.querySelector('[data-door-focus]')?.textContent?.replace(/\s+/g, ' ').trim() ??
              '?'
            const plates = door.querySelectorAll('.au-plate-door__plate')
            if (plates.length === 0) found.push(`${name}: it has no plate`)
            for (const plate of plates) {
              const box = plate.getBoundingClientRect()
              if (box.left < 0 || box.right > viewport)
                found.push(`${name}: a plate leaves the screen`)
              if (column && box.right > column.right + 1)
                found.push(
                  `${name}: a plate leaves the menu by ${Math.round(box.right - column.right)}px`,
                )
            }
            const line = door.querySelector('.au-plate-door__line')?.getBoundingClientRect()
            if (!line) found.push(`${name}: it has no line`)
            else if (line.left < 0 || line.right > viewport)
              found.push(`${name}: its line leaves the screen`)
            if (!door.hasAttribute('data-lit')) continue
            const scene = door.querySelector('.au-plate-door__scene')
            if (!scene || getComputedStyle(scene).display === 'none') continue
            const band = door.querySelector('.au-plate-door__band')?.getBoundingClientRect()
            const words = door.querySelector('[data-door-focus]')?.getBoundingClientRect()
            if (!band || !words) found.push(`${name}: its scene has no band or no name`)
            else if (words.right > band.left)
              found.push(
                `${name}: the lit name runs ${Math.round(words.right - band.left)}px into its band`,
              )
            const giant = door.querySelector('.au-plate-door__giant')?.getBoundingClientRect()
            if (!giant) found.push(`${name}: its scene has no pictogram`)
            else if (giant.left < 0 || giant.right > viewport)
              found.push(`${name}: its pictogram leaves the screen`)
          }
          return found
        })
        expect(problems, `almanach ${locale} at ${width}x${height}, door ${index + 1} lit`).toEqual(
          [],
        )
      }
    }
  })

  test(`nothing on the Livres contents is cut at ${width}x${height}, whichever entry is lit`, async ({
    page,
  }) => {
    test.slow()
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const locale of LOCALES) {
      await page.mouse.move(1, 1)
      await page.goto(pathFor('books', locale))
      await live(page)
      const count = await page.locator(DOOR_LINK).count()
      for (const index of [...Array(count).keys()]) {
        if (index > 0) {
          await page.locator(DOOR_LINK).nth(index).hover()
          await expect(page.locator(DOOR).nth(index)).toHaveAttribute('data-lit', '')
        }
        const problems = await page.evaluate(() => {
          const found: string[] = []
          const doc = document.documentElement
          const viewport = doc.clientWidth
          if (doc.scrollWidth - viewport !== 0) found.push('the page scrolls sideways')
          const section = document.querySelector('.au-sommaire')?.getBoundingClientRect()
          const sheet = document.querySelector('.au-sommaire__sheet')?.getBoundingClientRect()
          if (!section || !sheet) return [...found, 'the contents has no section or no sheet']
          const plates = document.querySelectorAll('.au-plates__plate')
          if (plates.length === 0) found.push('the contents has no title plate')
          for (const plate of plates) {
            const box = plate.getBoundingClientRect()
            if (box.left < 0 || box.right > viewport) found.push('a title plate leaves the screen')
            if (box.top < section.top) found.push('the section cuts the top of a title plate')
          }
          if (sheet.left < 0 || sheet.right > viewport) found.push('the sheet leaves the screen')
          const textOf = (words: Element): DOMRect => {
            const range = document.createRange()
            range.selectNodeContents(words)
            return range.getBoundingClientRect()
          }
          const inside = (
            reach: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom'>,
            frame: DOMRect,
          ): boolean =>
            reach.left >= frame.left - 1 &&
            reach.right <= frame.right + 1 &&
            reach.top >= frame.top - 1 &&
            reach.bottom <= frame.bottom + 1
          const links: DOMRect[] = []
          let above: { left: number; lineBottom: number } | undefined
          for (const door of document.querySelectorAll<HTMLElement>('[data-door]')) {
            const link = door.querySelector('a')
            if (!link) return [...found, 'an entry has no link']
            const name =
              document.getElementById(link.getAttribute('aria-labelledby') ?? '')?.textContent ??
              '?'
            const area = link.getBoundingClientRect()
            for (const piece of ['figure', 'name', 'mark', 'line']) {
              const element = door.querySelector(`.au-sommaire-entry__${piece}`)
              if (!element) {
                found.push(`${name}: it has no ${piece}`)
                continue
              }
              const box = element.getBoundingClientRect()
              if (box.width === 0) found.push(`${name}: its ${piece} has no width`)
              const run = piece === 'name' || piece === 'line' ? textOf(element) : box
              const reach = { left: run.left, right: run.right, top: box.top, bottom: box.bottom }
              if (!inside(reach, sheet)) found.push(`${name}: its ${piece} leaves the sheet`)
              if (!inside(reach, area)) found.push(`${name}: its ${piece} leaves its link`)
            }
            const words = door.querySelector('.au-sommaire-entry__name')
            const mark = door.querySelector('.au-sommaire-entry__mark')?.getBoundingClientRect()
            if (words && mark && textOf(words).right > mark.left + 1)
              found.push(`${name}: its name runs into its mark`)
            const overlapped = links.some(
              (other) =>
                area.top < other.bottom - 1 &&
                other.top < area.bottom - 1 &&
                area.left < other.right - 1 &&
                other.left < area.right - 1,
            )
            if (overlapped) found.push(`${name}: its link overlaps another entry`)
            links.push(area)
            const ringTop = area.top - Number.parseFloat(getComputedStyle(link).outlineOffset) - 2
            if (above && Math.abs(above.left - area.left) <= 1 && above.lineBottom > ringTop + 1)
              found.push(`${name}: its focus ring crosses the line above it`)
            const line = door.querySelector('.au-sommaire-entry__line')
            above = line ? { left: area.left, lineBottom: textOf(line).bottom } : undefined
          }
          return found
        })
        expect(problems, `books ${locale} at ${width}x${height}, entry ${index + 1} lit`).toEqual(
          [],
        )
      }
    }
  })

  test(`the pause square stays clear of the Livres contents at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height })
    for (const locale of LOCALES) {
      await page.goto(pathFor('books', locale))
      const pause = page.getByRole('button', { name: strings(locale).stagePause })
      await expect(pause).toBeVisible()
      const sheet = page.locator('.au-sommaire__sheet')
      await sheet.evaluate((paper) =>
        Promise.all(paper.getAnimations().map((animation) => animation.finished)),
      )
      const [square, paper] = await Promise.all([pause.boundingBox(), sheet.boundingBox()])
      if (!square || !paper) throw new Error(`books ${locale} draws no pause square or no sheet`)
      const apart =
        square.x >= paper.x + paper.width ||
        paper.x >= square.x + square.width ||
        square.y >= paper.y + paper.height ||
        paper.y >= square.y + square.height
      expect(apart, `books ${locale} at ${width}x${height}`).toBe(true)
    }
  })
}

test('forced colours draw no Livres numeral under the names', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto(pathFor('books', 'en'))
  await expect(page.locator(DOOR_LINK).first()).toBeVisible()
  await expect(page.locator('.au-sommaire-entry__figure')).toHaveCount(
    await page.locator(DOOR).count(),
  )
  const drawn = await page
    .locator('.au-sommaire-entry__figure')
    .evaluateAll(
      (figures) =>
        figures.filter((figure) => getComputedStyle(figure).visibility !== 'hidden').length,
    )
  expect(drawn).toBe(0)
})

test('print outlines the Livres numerals, keeps a white halo round each name and an entry whole', async ({
  page,
}) => {
  await page.goto(pathFor('books', 'en'))
  await page.emulateMedia({ media: 'print' })
  const entries = await page.locator(DOOR).count()
  expect(entries).toBeGreaterThan(0)
  await expect(page.locator('.au-sommaire-entry__figure')).toHaveCount(entries)
  await expect(page.locator('.au-sommaire-entry__name')).toHaveCount(entries)
  for (const entry of await page.locator(DOOR).all()) {
    await expect(entry).toHaveCSS('break-inside', 'avoid')
  }
  for (const figure of await page.locator('.au-sommaire-entry__figure').all()) {
    await expect(figure).toHaveCSS('color', TRANSPARENT)
    await expect(figure).toHaveCSS('-webkit-text-stroke-width', '1px')
  }
  for (const name of await page.locator('.au-sommaire-entry__name').all()) {
    await expect(name).toHaveCSS('text-shadow', /^rgb\(255, 255, 255\) 2px 0px 0px/)
  }
})

for (const kind of HUB_KINDS) {
  test(`the light theme keeps ${pathFor(kind, 'en')} a dark stage`, async ({ page }) => {
    await page.goto(pathFor(kind, 'en'))
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'))
    await expect(page.locator(MENU)).toHaveCSS('background-color', DARK_STAGE)
  })

  test(`print keeps the title and the doors of ${pathFor(kind, 'en')} and drops the stage`, async ({
    page,
  }) => {
    await page.goto(pathFor(kind, 'en'))
    await expect(page.locator(STAGE_LAYER[kind])).toBeAttached()
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator(`${MENU} h1`)).toBeVisible()
    await expect(page.locator(DOOR_LINK).first()).toBeVisible()
    await expect(page.locator(STAGE_LAYER[kind])).toBeHidden()
    if (kind === 'almanach')
      await expect(page.locator('.au-plate-door__scene').first()).toBeHidden()
  })
}

test('the Livres contents print on white paper under the dark theme', async ({ page }) => {
  await page.goto(pathFor('books', 'en'))
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveCSS('background-color', WHITE_PAPER)
  await expect(page.locator('[data-tip-root]')).toHaveCSS('background-color', WHITE_PAPER)
})

for (const [width, height] of FOCUS_REACHES) {
  test(`the keyboard finds the help button clear of the header at ${width}x${height}`, async ({
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

    await page.goto(pathFor('books', 'en'))
    await live(page)
    const help = page.getByRole('button', { name: t.hubAbout(t.books) })
    await page.locator(DOOR_LINK).last().focus()
    for (let step = await page.locator(DOOR).count(); step > 0; step--) {
      await page.keyboard.press('Shift+Tab')
    }
    await expect(help).toBeFocused()
    expect(await uncovered(help), 'Livres').toBe(true)

    for (const category of BOOK_CATEGORIES) {
      await page.goto(pathFor('bookCategory', 'en', { category }))
      if ((await page.locator('[data-entry]').count()) > 0) continue
      await page.locator('main').getByRole('link', { name: t.allDocs, exact: true }).focus()
      await page.keyboard.press('Shift+Tab')
      const focused = page.locator('.au-plates__about')
      await expect(focused).toBeFocused()
      expect(await uncovered(focused), category).toBe(true)
    }

    for (const path of [
      pathFor('almanach', 'en'),
      pathFor('trees', 'en'),
      pathFor('species', 'en'),
      pathFor('bookCategory', 'en', { category: 'rules' }),
    ]) {
      await page.goto(path)
      const about = page.locator('.au-plates__about')
      await about.focus()
      await page.keyboard.press('Tab')
      await about.evaluate((button) => {
        const { top } = button.getBoundingClientRect()
        window.scrollTo({ top: window.scrollY + top - 8, behavior: 'instant' })
      })
      await page.keyboard.press('Shift+Tab')
      await expect(about).toBeFocused()
      expect(await uncovered(about), path).toBe(true)
    }
  })
}

for (const kind of HUB_KINDS) {
  const hub = pathFor(kind, 'en')

  test(`a client visit to ${hub} binds its doors, and coming back binds them again`, async ({
    page,
  }) => {
    await page.goto(pathFor('trees', 'en'))
    await page.waitForFunction(() => 'swup' in window)
    await page.evaluate(() => Object.assign(window, { sameDocument: true }))

    await page.locator(`[data-nav="${kind}"]`).click()
    await expect(page).toHaveURL(hub)
    await live(page)
    await expect(litDoors(page)).toHaveCount(1)
    await page.locator(DOOR_LINK).nth(2).hover()
    await expect(page.locator(DOOR).nth(2)).toHaveAttribute('data-lit', '')
    await expect(litDoors(page)).toHaveCount(1)

    await page.locator(DOOR_LINK).nth(2).click()
    await expect(page).not.toHaveURL(hub)
    await expect(page.locator(MENU)).toHaveCount(0)

    await page.goBack()
    await expect(page).toHaveURL(hub)
    await live(page)
    await expect(litDoors(page)).toHaveCount(1)
    await page.locator(DOOR_LINK).nth(1).hover()
    await expect(page.locator(DOOR).nth(1)).toHaveAttribute('data-lit', '')
    await expect(litDoors(page)).toHaveCount(1)

    expect(await page.evaluate(() => 'sameDocument' in window)).toBe(true)
  })
}
