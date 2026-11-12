import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, type Page, test } from '@playwright/test'

import { SUBSPECIES_SECTIONS } from '../../src/lib/game/derive'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../../src/lib/i18n/locales'
import { type PolicyKind, pathFor, TREE_ANCHOR } from '../../src/lib/i18n/routes'
import { rgbFromHex } from '../../src/lib/key-colour'
import { corpus } from './support/corpus'

const POLICIES: readonly PolicyKind[] = ['licences', 'aiPolicy', 'credits', 'privacy']
const NARROW = [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
] as const
const TITLES = '.au-titles :is(.au-head > h2, .au-head > h3, .au-title h1)'
const SPECIES_SECTION_IDS = ['jouer', ...Object.values(SUBSPECIES_SECTIONS), 'noms', 'skills']

async function readingPages(locale: Locale): Promise<string[]> {
  const data = await corpus(locale)
  return [
    ...data.books.flatMap((book) =>
      book.chapters.map((chapter) =>
        pathFor('book', locale, { book: book.id, chapter: chapter.slug }),
      ),
    ),
    ...data.species.map((species) => pathFor('speciesEntry', locale, { species: species.id })),
    ...data.trees.map((tree) => pathFor('tree', locale, { tree: tree.id })),
    ...POLICIES.map((kind) => pathFor(kind, locale)),
  ]
}

async function speciesWithQuotes(): Promise<string[]> {
  const directory = resolve(import.meta.dirname, '../../data/lore/species')
  const quoted: string[] = []
  for (const file of await readdir(directory)) {
    if (!file.endsWith('.md') || file.endsWith('.en.md')) continue
    const lines = (await readFile(resolve(directory, file), 'utf8')).split('\n')
    if (lines.some((line) => line.startsWith('> '))) quoted.push(file.replace(/\.md$/, ''))
  }
  return quoted
}

function framesOfEachTitle(page: Page) {
  return page.locator(TITLES).evaluateAll((titles) =>
    titles.map((title) => {
      const host = title.closest('.au-head, .au-title')
      const frames = [...(host?.querySelectorAll(':scope > .au-frame') ?? [])].filter(
        (frame) => getComputedStyle(frame).display !== 'none',
      )
      const face = frames[0]?.querySelector('.au-frame__face')
      return {
        title: (title.textContent ?? '').trim(),
        frames: frames.length,
        hidden: frames.every((frame) => frame.getAttribute('aria-hidden') === 'true'),
        face: frames[0]?.getAttribute('data-face') ?? '',
        picture: face ? getComputedStyle(face, '::after').backgroundImage : '',
        icon: frames[0]?.querySelector('svg') !== null,
      }
    }),
  )
}

function titlePictograms(page: Page, ids: readonly string[]) {
  return page.evaluate(
    (wanted) =>
      [...document.querySelectorAll('.au-titles .au-head')].flatMap((head) => {
        const frame = head.querySelector(':scope > .au-frame')
        const id = head.querySelector(':scope > :is(h2, h3)')?.id ?? ''
        const isPictogram = frame?.getAttribute('data-face') === 'icon'
        if (!frame || (!wanted.includes(id) && !isPictogram)) return []
        const pictograms = frame.querySelectorAll('svg')
        const first = pictograms[0]
        return [
          {
            id,
            face: frame.getAttribute('data-face'),
            pictograms: pictograms.length,
            ink: first ? getComputedStyle(first).color : '',
            key: getComputedStyle(frame).getPropertyValue('--key-paper').trim(),
          },
        ]
      }),
    ids,
  )
}

function sidewaysScroll(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

test.describe('reading pages', () => {
  test.use({ viewport: { width: 1512, height: 860 } })

  for (const locale of LOCALES) {
    test(`every title in ${locale} carries one frame, a pictogram, a painting or the unset picture, and the side list keeps its words`, async ({
      page,
    }) => {
      test.setTimeout(240_000)
      for (const path of await readingPages(locale)) {
        await page.goto(path)
        expect(await sidewaysScroll(page), path).toBe(0)
        for (const title of await framesOfEachTitle(page)) {
          const where = `${path} « ${title.title} »`
          expect(title.frames, where).toBe(1)
          expect(title.hidden, where).toBe(true)
          if (title.face === 'icon') expect(title.icon, where).toBe(true)
          else {
            expect(['unset', 'painting'], where).toContain(title.face)
            expect(title.picture, where).toContain('url(')
          }
        }
        const trail = await page.locator('.au-aside .au-trail a[href^="#"]').evaluateAll((links) =>
          links.map((link) => {
            const target = document.getElementById(link.getAttribute('href')?.slice(1) ?? '')
            return {
              link: (link.querySelector('.au-trail__text')?.textContent ?? '').trim(),
              target: (target?.textContent ?? '').trim(),
              heading: target?.matches('h2, h3') ?? false,
            }
          }),
        )
        for (const entry of trail.filter((item) => item.heading)) {
          expect(entry.target, path).toBe(entry.link)
        }
      }
    })
  }
})

test('a species or tree page inks every title pictogram in its own key colour', async ({
  page,
}) => {
  test.setTimeout(240_000)
  for (const locale of LOCALES) {
    const data = await corpus(locale)
    const pages = [
      ...data.species.map((species) => ({
        path: pathFor('speciesEntry', locale, { species: species.id }),
        ids: SPECIES_SECTION_IDS,
        always: 'skills',
      })),
      ...data.trees.map((tree) => ({
        path: pathFor('tree', locale, { tree: tree.id }),
        ids: [TREE_ANCHOR],
        always: TREE_ANCHOR,
      })),
    ]
    for (const { path, ids, always } of pages) {
      await page.goto(path)
      const pictograms = await titlePictograms(page, ids)
      expect(
        pictograms.map((pictogram) => pictogram.id),
        path,
      ).toContain(always)
      for (const pictogram of pictograms) {
        const where = `${path} #${pictogram.id}`
        expect(pictogram.face, where).toBe('icon')
        expect(pictogram.pictograms, where).toBe(1)
        const [red, green, blue] = rgbFromHex(pictogram.key)
        expect(pictogram.ink, where).toBe(`rgb(${red}, ${green}, ${blue})`)
      }
    }
  }
})

test('a lore title that leads with an icon shows it in its frame and keeps only its words', async ({
  page,
}) => {
  const lorePages = [
    {
      folder: 'species',
      path: (locale: Locale, species: string) => pathFor('speciesEntry', locale, { species }),
    },
    {
      folder: 'skill-trees',
      path: (locale: Locale, tree: string) => pathFor('tree', locale, { tree }),
    },
  ]
  let checked = 0
  for (const { folder, path } of lorePages) {
    const directory = resolve(import.meta.dirname, '../../data/lore', folder)
    for (const file of await readdir(directory)) {
      const markdown = await readFile(resolve(directory, file), 'utf8')
      const titles = [...markdown.matchAll(/^## :icon\[[^\]]+\] (.+)$/gm)].map((match) =>
        (match[1] ?? '').replaceAll("'", '’'),
      )
      if (titles.length === 0) continue
      const locale = LOCALES.find((entry) => file.endsWith(`.${entry}.md`)) ?? DEFAULT_LOCALE
      const pagePath = path(locale, file.replace(/(\.[a-z]{2})?\.md$/, ''))
      await page.goto(pagePath)
      for (const title of titles) {
        const heads = await page.evaluate(
          (wanted) =>
            [...document.querySelectorAll('.au-titles .au-head[data-level="2"]')]
              .filter((head) => head.querySelector(':scope > h2')?.textContent?.trim() === wanted)
              .map((head) => ({
                face: head.querySelector(':scope > .au-frame')?.getAttribute('data-face'),
                inTitle: head.querySelectorAll(':scope > h2 svg').length,
              })),
          title,
        )
        expect(heads, `${pagePath} « ${title} »`).toEqual([{ face: 'icon', inTitle: 0 }])
        checked += 1
      }
    }
  }
  expect(checked).toBeGreaterThan(0)
})

test('a sub-species with its own art paints it in every frame of its titles, the others keep the unset picture', async ({
  page,
}) => {
  test.setTimeout(120_000)
  for (const locale of LOCALES) {
    const data = await corpus(locale)
    for (const species of data.species.filter((entry) => entry.subspecies.length > 0)) {
      const path = pathFor('speciesEntry', locale, { species: species.id })
      await page.goto(path)
      const frames = await page
        .locator('.au-species-play .au-head[data-level="3"]')
        .evaluateAll((heads) =>
          heads.map((head) => {
            const frame = head.querySelector(':scope > .au-frame')
            const face = frame?.querySelector('.au-frame__face')
            return {
              title: (head.querySelector('h3')?.textContent ?? '').trim(),
              face: frame?.getAttribute('data-face') ?? '',
              picture: face ? getComputedStyle(face, '::after').backgroundImage : '',
            }
          }),
        )
      for (const sub of species.subspecies) {
        const where = `${path} « ${sub.name} »`
        const own = frames.filter((frame) => frame.title === sub.name)
        expect(own.length, where).toBeGreaterThan(0)
        for (const frame of own) {
          expect(frame.face, where).toBe(sub.art === undefined ? 'unset' : 'painting')
          expect(frame.picture, where).toContain('url(')
          if (sub.art !== undefined) {
            expect(frame.picture, where).toContain(`/${sub.art.replace(/\.(png|jpg)$/, '')}.`)
          }
        }
      }
    }
  }
})

test('a chapter title carries its book’s pictogram and its number from the side list', async ({
  page,
}) => {
  for (const locale of LOCALES) {
    const book = (await corpus(locale)).books.find((entry) => entry.chapters.length > 1)
    const chapter = book?.chapters[1]
    if (!book || !chapter) throw new Error('no book has two chapters')
    await page.goto(pathFor('book', locale, { book: book.id, chapter: chapter.slug }))
    const title = page.locator('#book-body .au-title')
    await expect(title).toHaveAttribute('data-look', 'chapter')
    await expect(title.locator(':scope > .au-frame')).toHaveAttribute('data-face', 'icon')
    const number = await page
      .locator('#book-nav a[aria-current="page"] .au-trail__num')
      .textContent()
    await expect(title.locator('.au-title__ghost')).toHaveText(number?.trim() ?? '')
    await expect(page.locator('h1')).toHaveAttribute('data-book-title', '')
  }
})

test('on a phone every title plate stays on screen and nothing scrolls sideways', async ({
  page,
}) => {
  const quoted = await speciesWithQuotes()
  for (const locale of LOCALES) {
    const data = await corpus(locale)
    const book = data.books.find((entry) => entry.chapters.length > 0)
    const chapter = book?.chapters[0]
    if (!book || !chapter) throw new Error('no book has a chapter')
    const paths = [
      pathFor('book', locale, { book: book.id, chapter: chapter.slug }),
      pathFor('licences', locale),
      ...quoted.map((species) => pathFor('speciesEntry', locale, { species })),
    ]
    for (const size of NARROW) {
      await page.setViewportSize(size)
      for (const path of paths) {
        await page.goto(path)
        expect(await sidewaysScroll(page), `${path} at ${size.width}`).toBe(0)
        const edges = await page.locator(TITLES).evaluateAll((titles) =>
          titles.map((title) => {
            const box = title.getBoundingClientRect()
            return { left: box.left, right: box.right, title: (title.textContent ?? '').trim() }
          }),
        )
        for (const edge of edges) {
          const where = `${path} at ${size.width} « ${edge.title} »`
          expect(edge.left, where).toBeGreaterThanOrEqual(0)
          expect(edge.right, where).toBeLessThanOrEqual(size.width)
        }
      }
    }
  }
})

test('a quote never runs into the title after it', async ({ page }) => {
  for (const locale of LOCALES) {
    for (const species of await speciesWithQuotes()) {
      await page.goto(pathFor('speciesEntry', locale, { species }))
      const gaps = await page.locator('.au-titles figure.au-quote').evaluateAll((figures) =>
        figures.flatMap((figure) => {
          let next = figure.nextElementSibling
          while (next && !next.matches('.au-head, section')) next = next.nextElementSibling
          const head = next?.matches('section') ? next.querySelector('.au-head') : next
          if (!head) return []
          const pieces = [...head.querySelectorAll(':scope > .au-frame, :scope > :is(h2, h3)')]
          const top = Math.min(...pieces.map((piece) => piece.getBoundingClientRect().top))
          return [top - figure.getBoundingClientRect().bottom]
        }),
      )
      for (const gap of gaps) expect(gap, `${locale} ${species}`).toBeGreaterThan(0)
    }
  }
})

test('a jump from the side list lands every title clear of the header', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const species = (await corpus('fr')).species.find((entry) => entry.subspecies.length > 0)
  if (!species) throw new Error('no species has sub-species')
  await page.goto(pathFor('speciesEntry', 'fr', { species: species.id }))
  const links = await page
    .locator('.au-aside .au-trail a[href^="#"]')
    .evaluateAll((items) => items.map((item) => item.getAttribute('href') ?? ''))
  for (const hash of links) {
    const target = page.locator(`[id="${hash.slice(1)}"]`)
    if (!(await target.evaluate((node) => node.matches('h2, h3')))) continue
    await page.locator(`.au-aside .au-trail a[href="${hash}"]`).first().click()
    await expect
      .poll(() =>
        page.evaluate((id) => {
          const heading = document.getElementById(id)
          const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0
          const host = heading?.closest('.au-head')
          const pieces = [heading, host?.querySelector(':scope > .au-frame')].filter(
            (piece): piece is Element => piece instanceof Element,
          )
          return Math.min(...pieces.map((piece) => piece.getBoundingClientRect().top)) - header
        }, hash.slice(1)),
      )
      .toBeGreaterThanOrEqual(8)
  }
})

for (const media of [
  { media: 'print', forcedColors: 'none' },
  { media: 'screen', forcedColors: 'active' },
] as const) {
  test(`${media.media === 'print' ? 'print' : 'forced colours'} keeps today’s plain titles`, async ({
    page,
  }) => {
    const book = (await corpus('fr')).books.find((entry) => entry.chapters.length > 0)
    const chapter = book?.chapters[0]
    const species = (await corpus('fr')).species.find((entry) => entry.subspecies.length > 0)
    if (!book || !chapter || !species) throw new Error('the corpus lacks a chapter or a species')
    for (const path of [
      pathFor('book', 'fr', { book: book.id, chapter: chapter.slug }),
      pathFor('speciesEntry', 'fr', { species: species.id }),
    ]) {
      await page.goto(path)
      await page.emulateMedia(media)
      const shown = await page
        .locator('.au-titles .au-frame')
        .evaluateAll(
          (frames) => frames.filter((frame) => getComputedStyle(frame).display !== 'none').length,
        )
      expect(shown, path).toBe(0)
      const tilts = await page
        .locator('.au-titles .au-head, .au-titles .au-title__plate')
        .evaluateAll((pieces) => pieces.map((piece) => getComputedStyle(piece).rotate))
      for (const tilt of tilts) expect(tilt, path).toBe('none')
    }
  })
}
