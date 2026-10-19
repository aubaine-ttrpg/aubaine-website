export const MAP_STYLES = ['3d', 'parchment'] as const
export type MapStyle = (typeof MAP_STYLES)[number]

export const DEFAULT_STYLE: MapStyle = '3d'

export function isMapStyle(value: unknown): value is MapStyle {
  return MAP_STYLES.some((style) => style === value)
}
