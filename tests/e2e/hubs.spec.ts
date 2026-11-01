import { expect, type Locator, type Page, test } from '@playwright/test'

import { BOOK_CATEGORIES } from '../../src/lib/game/schema'
import { HTML_LANG, LOCALES } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'

const HUB_KINDS = ['almanach'] as const
const MENU = '[data-doors]'
const DOOR = '[data-door]'
const DOOR_LINK = '[data-door] a'
const STAGE_LAYER: Record<HubKind, string> = {
  almanach: '.au-plate-menu__layer',
}
const DARK_STAGE = 'rgb(6, 5, 13)'
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
      await page.goto(hub)
      for (const door of await doorsOf(page)) {
        await page.goto(door.href)
        await expect(page.locator('h1')).toHaveAccessibleName(door.name)
        await expect(page.locator('[data-entry]').first(), door.href).toBeAttached()
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
      await page.goto(hub)
      await expect(page.locator(MENU).getByText(t.almanachLead)).toBeHidden()
      await page.getByRole('button', { name: t.hubAbout(t.almanach) }).click()
      await expect(page.locator('#hub-note')).toContainText(t.almanachLead)
    })
  }

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
}

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
    await expect(page.locator('.au-plate-door__scene').first()).toBeHidden()
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
