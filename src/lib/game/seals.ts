import { KEY_FALLBACK, readableOnNight } from '../key-colour.ts'
import type { Corpus, ResolvedTree } from './corpus.ts'
import { frame } from './derive.ts'
import type { FieldColours } from './hubs.ts'

export type CardSeal = { field: string; colours: FieldColours }

const DOMAIN_FALLBACK = '#2a2a2e'
const SPECIES_FIELD = 'var(--accent)'

export const SPECIES_SEAL: CardSeal = { field: SPECIES_FIELD, colours: [SPECIES_FIELD] }

function domainColours(tree: ResolvedTree, corpus: Corpus): string[] {
  return tree.domains.map((key) => corpus.domains.get(key)?.color ?? DOMAIN_FALLBACK)
}

export function treeSeal(tree: ResolvedTree, corpus: Corpus): CardSeal {
  const [first = DOMAIN_FALLBACK, ...rest] = domainColours(tree, corpus)
  return { field: frame([first, ...rest]), colours: [first, ...rest] }
}

export function treeSealKey(tree: ResolvedTree, corpus: Corpus): string {
  return readableOnNight(domainColours(tree, corpus)[0] ?? KEY_FALLBACK)
}
