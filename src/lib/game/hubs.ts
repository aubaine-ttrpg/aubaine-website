import type { ChapterRef } from './book-chapters.ts'
import type { ContentStatus } from './schema.ts'

export type LeadCandidate = {
  name: string
  status?: ContentStatus | undefined
  cover?: string | undefined
}

export type FieldColours = readonly [string, ...string[]]

export const HUB_CHAPTERS = {
  trees: { book: 'livre-du-joueur', file: '05-les-arbres-et-les-competences' },
  species: { book: 'livre-du-joueur', file: '04-les-especes' },
} as const satisfies Record<string, ChapterRef>

const FIELD_SPOTS = ['28% 30%', '74% 66%', '58% 16%', '20% 78%'] as const
const FIELD_NIGHT = '#06050d'
const FIELD_GROUND = '40%'

function leadRank(entry: LeadCandidate): number {
  const covered = entry.cover !== undefined
  if (entry.status !== 'draft') return covered ? 0 : 1
  return covered ? 2 : 3
}

export function leadFirst<T extends LeadCandidate>(entries: readonly T[]): T[] {
  return [...entries].sort((a, b) => leadRank(a) - leadRank(b))
}

export function leadOrder<T extends LeadCandidate>(entries: readonly T[], locale: string): T[] {
  const collator = new Intl.Collator(locale)
  return leadFirst([...entries].sort((a, b) => collator.compare(a.name, b.name)))
}

export function fieldBackdrop(colours: FieldColours): string {
  const spots = colours.map(
    (colour, index) =>
      `radial-gradient(62% 72% at ${FIELD_SPOTS[index % FIELD_SPOTS.length]}, color-mix(in srgb, ${colour} 80%, transparent) 0%, transparent 74%)`,
  )
  const first = colours[0]
  const last = colours[colours.length - 1] ?? first
  const night = (colour: string) => `color-mix(in srgb, ${colour} ${FIELD_GROUND}, ${FIELD_NIGHT})`
  return [...spots, `linear-gradient(135deg, ${night(first)}, ${night(last)})`].join(', ')
}
