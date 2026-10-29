import { getEntry } from 'astro:content'

import { DEFAULT_LOCALE, type Locale } from '../i18n/locales.ts'
import { pathFor } from '../i18n/routes.ts'
import { corpus } from './corpus.ts'

export type ChapterRef = { readonly book: string; readonly file: string }

export type BookChapter = { title: string; body: string; href: string }

export async function bookChapter(locale: Locale, ref: ChapterRef): Promise<BookChapter> {
  const id = `${ref.book}/${ref.file}`
  const page =
    (locale === DEFAULT_LOCALE ? undefined : await getEntry('bookPages', `${id}.${locale}`)) ??
    (await getEntry('bookPages', id))
  const book = (await corpus(locale)).books.find((entry) => entry.id === ref.book)
  const chapter = book?.chapters.find((entry) => entry.file === ref.file)
  if (!page?.body || !chapter) throw new Error(`the chapter ${id} is missing`)
  return {
    title: page.data.title,
    body: page.body,
    href: pathFor('book', locale, { book: ref.book, chapter: chapter.slug }),
  }
}
