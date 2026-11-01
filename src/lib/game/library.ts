import { hasBooklet, printedBooklets } from '../booklet/manifest.ts'
import type { BookletKind } from '../booklet/release.ts'
import type { Locale } from '../i18n/locales.ts'
import { pathFor } from '../i18n/routes.ts'
import { strings } from '../i18n/strings.ts'
import { bookletHref } from '../media.ts'
import type { Corpus, ResolvedBook, ResolvedTree } from './build.ts'
import {
  BOOK_CATEGORIES,
  type BookCategory,
  type ContentStatus,
  type EquipmentCatalogue,
} from './schema.ts'

export type Opening = { href: string; download: boolean }

type PrintedKind = Exclude<BookletKind, 'book'>

type ItemBase = {
  id: string
  category: BookCategory
  name: string
  cover: string | undefined
  status: ContentStatus | undefined
  opening: Opening
}

export type LibraryItem =
  | (ItemBase & { kind: 'book'; book: ResolvedBook })
  | (ItemBase & { kind: 'tree'; tree: ResolvedTree })
  | (ItemBase & { kind: 'equipment'; catalogue: EquipmentCatalogue })

export type LibrarySection = {
  category: BookCategory
  items: readonly LibraryItem[]
}

export function libraryKicker(item: LibraryItem, locale: Locale): string {
  const t = strings(locale)
  switch (item.kind) {
    case 'tree':
      return t.treeBooklet
    case 'book':
      return t.bookCategories[item.category].one
    case 'equipment':
      return t.catalogueKicker
  }
}

const PRINTED: Record<PrintedKind, { category: BookCategory; rank: number }> = {
  equipment: { category: 'resources', rank: 1 },
  tree: { category: 'resources', rank: 2 },
}

const BOOK_RANK = 0

export function bookOpening(book: ResolvedBook, locale: Locale): Opening | undefined {
  const first = book.chapters[0]
  if (first) {
    return {
      href: pathFor('book', locale, { book: book.id, chapter: first.slug }),
      download: false,
    }
  }
  if (!hasBooklet(book.id)) return undefined
  const pdf = bookletHref('book', book.id, locale)
  return pdf ? { href: pdf, download: true } : undefined
}

function printedOpening(kind: PrintedKind, slug: string, locale: Locale): Opening {
  const href = bookletHref(kind, slug, locale)
  if (!href) throw new Error(`the ${kind} booklet ${slug} is printed but has no ${locale} file`)
  return { href, download: true }
}

function printedItem(corpus: Corpus, locale: Locale, kind: PrintedKind, slug: string): LibraryItem {
  const { category } = PRINTED[kind]
  const opening = printedOpening(kind, slug, locale)
  if (kind === 'tree') {
    const tree = corpus.treesById.get(slug)
    if (!tree) throw new Error(`the PDF register prints a sheet for ${slug}, which is not a tree`)
    return {
      kind,
      id: slug,
      category,
      name: tree.name,
      cover: tree.cover,
      status: tree.status,
      opening,
      tree,
    }
  }
  if (corpus.catalogue.id !== slug) {
    throw new Error(`the PDF register prints ${slug}, which is not the equipment catalogue`)
  }
  return {
    kind,
    id: slug,
    category,
    name: corpus.catalogue.name,
    cover: corpus.catalogue.cover,
    status: undefined,
    opening,
    catalogue: corpus.catalogue,
  }
}

function rankOf(item: LibraryItem): number {
  return item.kind === 'book' ? BOOK_RANK : PRINTED[item.kind].rank
}

function orderOf(item: LibraryItem): number {
  return item.kind === 'book' ? item.book.order : 0
}

export function libraryItems(corpus: Corpus, locale: Locale): LibraryItem[] {
  const items: LibraryItem[] = []
  for (const book of corpus.books) {
    const opening = bookOpening(book, locale)
    if (!opening) continue
    items.push({
      kind: 'book',
      id: book.id,
      category: book.category,
      name: book.title,
      cover: book.cover,
      status: undefined,
      opening,
      book,
    })
  }
  for (const { kind, slug } of printedBooklets()) {
    if (kind === 'book') continue
    items.push(printedItem(corpus, locale, kind, slug))
  }
  const collator = new Intl.Collator(locale)
  return items.sort(
    (a, b) => rankOf(a) - rankOf(b) || orderOf(a) - orderOf(b) || collator.compare(a.name, b.name),
  )
}

export function library(corpus: Corpus, locale: Locale): LibrarySection[] {
  const items = libraryItems(corpus, locale)
  return BOOK_CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  }))
}

export function librarySection(
  corpus: Corpus,
  locale: Locale,
  category: BookCategory,
): LibrarySection {
  const section = library(corpus, locale).find((entry) => entry.category === category)
  if (!section) throw new Error(`${category} is not a book category`)
  return section
}
