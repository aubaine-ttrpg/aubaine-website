import { getCollection } from 'astro:content'

import { hasBooklet, releases } from '../booklet/manifest.ts'
import type { BookletKind } from '../booklet/release.ts'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../i18n/locales.ts'
import { type RouteParams, segmentsFor, type ViewKind } from '../i18n/routes.ts'
import { strings } from '../i18n/strings.ts'
import type { Corpus } from './build.ts'
import { corpus } from './corpus.ts'
import { treeTypeLabel } from './derive.ts'
import { policyPages } from './policies.ts'
import { flattenText } from './richtext.ts'

export const ARCHIVES_ART = 'bureau-de-archibald-16_9-og.png'

export type BookletHead = { title: string; banner?: string | undefined }

export function bookletHead(data: Corpus, kind: BookletKind, slug: string): BookletHead {
  if (kind === 'tree') {
    const tree = data.treesById.get(slug)
    return tree ? { title: tree.name, banner: tree.banner } : { title: slug }
  }
  if (kind === 'book') {
    const book = data.books.find((entry) => entry.id === slug)
    return book ? { title: book.title, banner: book.banner } : { title: slug }
  }
  return { title: data.catalogue.name, banner: data.catalogue.banner }
}

export type PageDescriptor = {
  kind: ViewKind
  locale: Locale
  params: RouteParams
  title: string
  description: string
  ogArt?: string | undefined
  noIndex?: boolean | undefined
}

const TRANSLATED_ID = /\.[a-z]{2}$/

export type PageRoute = { path: string; page: PageDescriptor }

function describe(
  locale: Locale,
  kind: ViewKind,
  title: string,
  description: string,
): PageDescriptor {
  return { kind, locale, params: {}, title, description }
}

export type ChapterHead = { title: string; description?: string | undefined }

export async function bookChapterHeads(locale: Locale): Promise<Map<string, ChapterHead>> {
  const pages = await getCollection('bookPages')
  const heads = new Map<string, ChapterHead>()
  for (const entry of pages) {
    if (TRANSLATED_ID.test(entry.id)) continue
    heads.set(entry.id, { title: entry.data.title, description: entry.data.description })
  }
  if (locale !== DEFAULT_LOCALE) {
    for (const entry of pages) {
      if (!entry.id.endsWith(`.${locale}`)) continue
      const base = entry.id.slice(0, -(locale.length + 1))
      heads.set(base, { title: entry.data.title, description: entry.data.description })
    }
  }
  return heads
}

export async function pageRoutes(): Promise<PageRoute[]> {
  const routes: PageRoute[] = []

  for (const locale of LOCALES) {
    const data = await corpus(locale)
    const t = strings(locale)
    const TREE_TYPE_LABELS = {
      archetypes: t.archetypes,
      domains: t.domains,
      species: t.speciesIndex,
    }
    const heads = await bookChapterHeads(locale)

    const pages: PageDescriptor[] = [
      describe(locale, 'home', t.heroTitle, t.heroLead(data.trees.length, data.species.length)),
      describe(locale, 'books', t.resources, t.hubLead),
      describe(locale, 'almanach', t.almanach, t.almanachLead),
      describe(locale, 'trees', t.trees, t.treesLead),
      describe(locale, 'species', t.speciesIndex, t.speciesLead),
      describe(locale, 'skills', t.spells, t.spellsLead),
      {
        ...describe(locale, 'equipment', t.items, t.itemsLead),
        ogArt: data.catalogue.banner,
      },
      describe(locale, 'baseActions', t.rules, t.rulesLead),
      describe(locale, 'states', t.states_, t.statesLead),
      { ...describe(locale, 'archives', t.archives, t.archivesLead), ogArt: ARCHIVES_ART },
      { ...describe(locale, 'search', t.searchTitle, t.searchTitle), noIndex: true },
      { ...describe(locale, 'notFound', t.errorTitle, t.errorBody), noIndex: true },
    ]

    for (const policy of await policyPages(locale)) {
      pages.push(describe(locale, policy.kind, policy.title, policy.description))
    }

    for (const tree of data.trees) {
      const kindLabel = treeTypeLabel(tree.treeType, TREE_TYPE_LABELS)
      pages.push({
        kind: 'tree',
        locale,
        params: { tree: tree.id },
        title: tree.name,
        description: `${kindLabel} · ${t.plate} · ${tree.skills.length} ${t.nodes}`,
        ogArt: tree.banner,
      })
      for (const placement of tree.placements) {
        pages.push({
          kind: 'tree',
          locale,
          params: { tree: tree.id, node: placement.skill.id },
          title: `${placement.skill.title} · ${tree.name}`,
          description: flattenText(placement.skill.description, 160),
          ogArt: tree.banner,
        })
      }
    }

    for (const entry of data.species) {
      pages.push({
        kind: 'speciesEntry',
        locale,
        params: { species: entry.id },
        title: entry.name,
        description: `${t.species} · ${entry.pool.length} ${t.entries_}`,
        ogArt: entry.banner,
      })
    }

    for (const book of data.books) {
      for (const chapter of book.chapters) {
        const head = heads.get(`${book.id}/${chapter.file}`)
        pages.push({
          kind: 'book',
          locale,
          params: { book: book.id, chapter: chapter.slug },
          title: `${head?.title ?? book.title} · ${book.title}`,
          description: head?.description ?? book.description,
          ogArt: book.banner,
        })
      }
    }

    const booklets = new Map<string, BookletKind>()
    for (const release of releases()) {
      if (release.locale !== locale || !hasBooklet(release.slug)) continue
      if (!booklets.has(release.slug)) booklets.set(release.slug, release.kind)
    }

    for (const [slug, kind] of booklets) {
      const head = bookletHead(data, kind, slug)
      pages.push({
        kind: 'archive',
        locale,
        params: { slug },
        title: `${head.title} · ${t.archives}`,
        description: t.archiveLead,
        ogArt: head.banner ?? ARCHIVES_ART,
      })
    }

    for (const page of pages) {
      routes.push({
        path: [locale, ...segmentsFor(page.kind, locale, page.params)].join('/'),
        page,
      })
    }
  }

  return routes
}
