import { type CollectionEntry, getCollection, type RenderResult, render } from 'astro:content'

import { DEFAULT_LOCALE, type Locale } from '../i18n/locales.ts'
import { LORE_PARTS, type LorePart, lorePartId } from './lore-parts.ts'

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

export type Lore = Record<LorePart, RenderResult | undefined>

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
): Promise<Lore | undefined> {
  const pages = await loreIndex()
  const exists = (page: string): boolean =>
    LORE_PARTS.some((part) => pages.has(lorePartId(page, part)))
  const canonical = `${owner}/${id}`
  if (!exists(canonical)) return undefined
  const translated = `${canonical}.${locale}`
  const page = locale !== DEFAULT_LOCALE && exists(translated) ? translated : canonical
  const renderPart = (part: LorePart): Promise<RenderResult | undefined> => {
    const entry = pages.get(lorePartId(page, part))
    return entry ? renderProse(entry) : Promise.resolve(undefined)
  }
  return { opening: await renderPart('opening'), sections: await renderPart('sections') }
}
