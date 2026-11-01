import type { IndexKind } from '../i18n/routes.ts'
import { readableOnNight } from '../key-colour.ts'
import type { BookCategory } from './schema.ts'

export type KindMark = { colour: string; icon: string }

export const KIND_MARKS = {
  trees: { colour: '#efbe04', icon: 'game-icons:family-tree' },
  species: { colour: '#c9563c', icon: 'mdi:dna' },
  skills: { colour: '#8a5cc4', icon: 'game-icons:spell-book' },
  equipment: { colour: '#a84d16', icon: 'game-icons:battle-gear' },
  materials: { colour: '#4f8a2e', icon: 'game-icons:ore' },
  rules: { colour: '#3f86b8', icon: 'game-icons:rule-book' },
} as const satisfies Record<IndexKind, KindMark>

export const CATEGORY_MARKS = {
  rules: { colour: '#2fa39a', icon: 'game-icons:book-cover' },
  resources: { colour: '#c0457e', icon: 'game-icons:folded-paper' },
  adventures: { colour: '#d98a2b', icon: 'game-icons:wax-seal' },
  stories: { colour: '#b9b4d6', icon: 'game-icons:quill-ink' },
} as const satisfies Record<BookCategory, KindMark>

export function kindInk(kind: IndexKind): string {
  return readableOnNight(KIND_MARKS[kind].colour)
}

export function categoryInk(category: BookCategory): string {
  return readableOnNight(CATEGORY_MARKS[category].colour)
}
