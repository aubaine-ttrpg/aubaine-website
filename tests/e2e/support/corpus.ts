import { resolve } from 'node:path'
import type { Corpus } from '../../../src/lib/game/build'
import { readCorpus } from '../../../src/lib/game/fs-sources'
import type { Locale } from '../../../src/lib/i18n/locales'

const root = resolve(import.meta.dirname, '../../..')
const corpora = new Map<Locale, Promise<Corpus>>()

export function corpus(locale: Locale): Promise<Corpus> {
  const read = corpora.get(locale) ?? readCorpus(root, locale)
  corpora.set(locale, read)
  return read
}
