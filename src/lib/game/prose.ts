import { type CollectionEntry, getCollection, type RenderResult, render } from 'astro:content'

import { DEFAULT_LOCALE, type Locale } from '../i18n/locales.ts'

type ProseCollection = 'bookPages' | 'equipmentGuide' | 'lore' | 'policies'

export type ProseEntry = CollectionEntry<ProseCollection>

export function renderProse(entry: ProseEntry): Promise<RenderResult> {
  if (entry.rendered === undefined) {
    throw new Error(
      `${entry.collection} entry ${entry.id} (${entry.filePath ?? 'unknown file'}) carries no rendered markdown. The content store cached a failed render and never retried it. Delete the store and run again: .astro/data-store.json in dev, node_modules/.astro/data-store.json for a build.`,
    )
  }
  return render(entry)
}

export type LoreOwner = 'species' | 'skill-trees'

let lorePages: Promise<Map<string, CollectionEntry<'lore'>>> | undefined

function loreIndex(): Promise<Map<string, CollectionEntry<'lore'>>> {
  lorePages ??= getCollection('lore').then(
    (entries) => new Map(entries.map((entry) => [entry.id, entry])),
  )
  return lorePages
}

export async function loreFor(
  owner: LoreOwner,
  id: string,
  locale: Locale,
): Promise<RenderResult | undefined> {
  const pages = await loreIndex()
  const canonical = pages.get(`${owner}/${id}`)
  if (!canonical) return undefined
  const translated = locale === DEFAULT_LOCALE ? undefined : pages.get(`${owner}/${id}.${locale}`)
  return renderProse(translated ?? canonical)
}
