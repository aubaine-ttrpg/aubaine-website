import type { IndexKind } from '../i18n/routes.ts'
import { readableOnNight } from '../key-colour.ts'

export type KindMark = { colour: string; icon: string }

export const KIND_MARKS = {
  trees: { colour: '#efbe04', icon: 'game-icons:family-tree' },
  species: { colour: '#c9563c', icon: 'mdi:dna' },
  skills: { colour: '#8a5cc4', icon: 'game-icons:spell-book' },
  equipment: { colour: '#a84d16', icon: 'game-icons:battle-gear' },
  materials: { colour: '#4f8a2e', icon: 'game-icons:ore' },
  rules: { colour: '#3f86b8', icon: 'game-icons:rule-book' },
} as const satisfies Record<IndexKind, KindMark>

export function kindInk(kind: IndexKind): string {
  return readableOnNight(KIND_MARKS[kind].colour)
}
