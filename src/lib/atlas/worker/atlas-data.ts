import { DEFAULT_LOCALE, type Locale } from '../../i18n/locales.ts'
import type { WorldFiles, WorldOverlays } from '../world/decode.ts'

const ROOT = '/data/atlas/'

const URLS = import.meta.glob<string>('/data/atlas/**/*.json', {
  query: '?url&no-inline',
  import: 'default',
  eager: true,
})

const WORLD_PARTS = [
  'world',
  'surface',
  'places',
  'landmarks',
  'routes',
  'establishments',
  'sky',
  'underground',
] as const satisfies readonly (keyof WorldFiles)[]

const OVERLAY_PARTS = [
  'world',
  'places',
  'landmarks',
  'routes',
  'establishments',
] as const satisfies readonly (keyof WorldOverlays)[]

export type AtlasData = {
  files: WorldFiles
  overlays: WorldOverlays
  vocabulary: unknown
  travel: unknown
  stars: unknown
}

export class AtlasDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AtlasDataError'
  }
}

function worldFolder(world: string): string {
  if (URLS[`${ROOT}${world}/world.json`] === undefined) {
    throw new AtlasDataError(`the Atlas has no world called ${world}`)
  }
  return world
}

async function fetchJson(path: string): Promise<unknown> {
  const url = URLS[ROOT + path]
  if (url === undefined) throw new AtlasDataError(`no data file at ${path}`)
  const response = await fetch(url)
  if (!response.ok) throw new AtlasDataError(`${path} answered ${response.status}`)
  return response.json()
}

async function fetchOverlay(path: string): Promise<unknown> {
  return URLS[ROOT + path] === undefined ? undefined : fetchJson(path)
}

export async function loadAtlasData(locale: Locale, key: string): Promise<AtlasData> {
  const folder = worldFolder(key)
  const [parts, overlays, vocabulary, travel, stars] = await Promise.all([
    Promise.all(WORLD_PARTS.map((part) => fetchJson(`${folder}/${part}.json`))),
    locale === DEFAULT_LOCALE
      ? Promise.resolve(OVERLAY_PARTS.map(() => undefined))
      : Promise.all(OVERLAY_PARTS.map((part) => fetchOverlay(`${folder}/${part}.${locale}.json`))),
    fetchJson('vocabularies.json'),
    fetchJson('travel.json'),
    fetchJson('stars.json'),
  ])
  const [world, surface, places, landmarks, routes, establishments, sky, underground] = parts
  const [worldOverlay, placeOverlay, landmarkOverlay, routeOverlay, establishmentOverlay] = overlays
  return {
    files: { world, surface, places, landmarks, routes, establishments, sky, underground },
    overlays: {
      world: worldOverlay,
      places: placeOverlay,
      landmarks: landmarkOverlay,
      routes: routeOverlay,
      establishments: establishmentOverlay,
    },
    vocabulary,
    travel,
    stars,
  }
}
