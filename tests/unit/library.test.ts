import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { printedBooklets } from '../../src/lib/booklet/manifest'
import { readCorpus } from '../../src/lib/game/fs-sources'
import { bookOpening, library, libraryItems } from '../../src/lib/game/library'
import { BOOK_CATEGORIES } from '../../src/lib/game/schema'
import { LOCALES } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'

const root = resolve(import.meta.dirname, '../..')

const shelf = (sections: ReturnType<typeof library>) =>
  sections.flatMap((section) =>
    section.items.map((item) => `${section.category}/${item.kind}/${item.id}`),
  )

describe('the library behind the books hub', () => {
  for (const locale of LOCALES) {
    it(`lists every category once, in its order, empty or not (${locale})`, async () => {
      const corpus = await readCorpus(root, locale)
      const sections = library(corpus, locale)
      expect(sections.map((section) => section.category)).toEqual([...BOOK_CATEGORIES])
      for (const section of sections) {
        for (const item of section.items) expect(item.category, item.id).toBe(section.category)
      }
    })

    it(`files every book that opens in its own category, once (${locale})`, async () => {
      const corpus = await readCorpus(root, locale)
      const items = libraryItems(corpus, locale)
      for (const book of corpus.books) {
        const listed = items.filter((item) => item.kind === 'book' && item.id === book.id)
        expect(listed, book.id).toHaveLength(bookOpening(book, locale) ? 1 : 0)
        for (const item of listed) expect(item.category, book.id).toBe(book.category)
      }
    })

    it(`opens a book at its first chapter, or downloads its PDF (${locale})`, async () => {
      const corpus = await readCorpus(root, locale)
      for (const item of libraryItems(corpus, locale)) {
        if (item.kind !== 'book') {
          expect(item.opening.download, item.id).toBe(true)
          continue
        }
        const first = item.book.chapters[0]
        if (first) {
          expect(item.opening).toEqual({
            href: pathFor('book', locale, { book: item.book.id, chapter: first.slug }),
            download: false,
          })
        } else {
          expect(item.opening.download, item.id).toBe(true)
        }
      }
    })

    it(`files every printed booklet that is not a book under resources, once (${locale})`, async () => {
      const corpus = await readCorpus(root, locale)
      const items = libraryItems(corpus, locale)
      for (const { kind, slug } of printedBooklets()) {
        if (kind === 'book') continue
        const listed = items.filter((item) => item.kind === kind && item.id === slug)
        expect(listed, `${kind} ${slug}`).toHaveLength(1)
        expect(listed[0]?.category, `${kind} ${slug}`).toBe('resources')
      }
    })

    it(`never lists one item twice (${locale})`, async () => {
      const corpus = await readCorpus(root, locale)
      const keys = libraryItems(corpus, locale).map((item) => `${item.kind}/${item.id}`)
      expect(new Set(keys).size).toBe(keys.length)
    })
  }

  it('lists the same items in every locale', async () => {
    const [first, ...others] = await Promise.all(
      LOCALES.map(async (locale) => shelf(library(await readCorpus(root, locale), locale))),
    )
    for (const other of others) expect(other).toEqual(first)
  })

  it('leaves off a book that has neither a chapter nor a printed PDF', async () => {
    const corpus = await readCorpus(root, 'fr')
    const [book] = corpus.books
    if (!book) throw new Error('the corpus has no book to copy')
    expect(
      bookOpening({ ...book, id: 'sans-tirage', chapters: [], hasChapters: false }, 'fr'),
    ).toBeUndefined()
  })
})
