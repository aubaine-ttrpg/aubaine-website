import type { AtlasProps, AtlasWorldCard } from './props'

export const WORLD_PARAM = 'map'

type Worlds = Pick<AtlasProps, 'worlds' | 'opening'>

export function chosenWorld(
  { worlds, opening }: Worlds,
  search: string,
): { world: AtlasWorldCard; known: boolean } {
  const asked = new URLSearchParams(search).get(WORLD_PARAM)
  const named = asked === null ? undefined : worlds.find((world) => world.key === asked)
  const fallback = worlds.find((world) => world.key === opening)
  if (!fallback) throw new Error(`the Atlas opens ${opening}, which is not among its worlds`)
  return { world: named ?? fallback, known: asked === null || named !== undefined }
}

export function worldUrl(
  location: { pathname: string; search: string },
  key: string,
  opening: string,
): string {
  const params = new URLSearchParams(location.search)
  if (key === opening) params.delete(WORLD_PARAM)
  else params.set(WORLD_PARAM, key)
  const query = params.toString()
  return query ? `${location.pathname}?${query}` : location.pathname
}
