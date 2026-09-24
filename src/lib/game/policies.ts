import { type CollectionEntry, getCollection } from 'astro:content'

import { DEFAULT_LOCALE, type Locale } from '../i18n/locales.ts'
import { POLICY_KINDS, type PolicyKind } from '../i18n/routes.ts'

export type PolicyPage = {
  kind: PolicyKind
  title: string
  description: string
  entry: CollectionEntry<'policies'>
}

const TRANSLATED_ID = /\.[a-z]{2}$/

export async function policyPages(locale: Locale): Promise<PolicyPage[]> {
  const entries = await getCollection('policies')

  const canonical = new Map<PolicyKind, CollectionEntry<'policies'>>()
  for (const entry of entries) {
    if (TRANSLATED_ID.test(entry.id)) continue
    const kind = entry.data.kind
    if (kind === undefined) {
      throw new Error(`src/content/policies/${entry.id}.md declares no kind`)
    }
    const claimed = canonical.get(kind)
    if (claimed !== undefined) {
      throw new Error(`${claimed.id}.md and ${entry.id}.md both declare the policy kind ${kind}`)
    }
    canonical.set(kind, entry)
  }

  const overlays = new Map<string, CollectionEntry<'policies'>>()
  if (locale !== DEFAULT_LOCALE) {
    for (const entry of entries) {
      if (!entry.id.endsWith(`.${locale}`)) continue
      overlays.set(entry.id.slice(0, -(locale.length + 1)), entry)
    }
  }

  return POLICY_KINDS.map((kind) => {
    const base = canonical.get(kind)
    if (base === undefined) {
      throw new Error(`no file under src/content/policies/ declares the policy kind ${kind}`)
    }
    const entry = overlays.get(base.id) ?? base
    return { kind, title: entry.data.title, description: entry.data.description, entry }
  })
}
