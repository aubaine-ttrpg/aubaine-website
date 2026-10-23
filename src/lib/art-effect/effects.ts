export const ART_EFFECTS = ['film', 'oil'] as const

export type ArtEffect = (typeof ART_EFFECTS)[number]

export function isArtEffect(value: unknown): value is ArtEffect {
  return ART_EFFECTS.some((effect) => effect === value)
}
