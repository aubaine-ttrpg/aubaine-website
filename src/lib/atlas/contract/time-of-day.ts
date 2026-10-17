export const DEFAULT_HOUR = 16.6
export const DEFAULT_SEASON = 0.6

export function normalHour(hour: number): number {
  return ((hour % 24) + 24) % 24
}

export function normalSeason(season: number): number {
  return ((season % 1) + 1) % 1
}
