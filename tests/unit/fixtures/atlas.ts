import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  type AuthoredWorld,
  decodeTravel,
  decodeVocabulary,
  decodeWorld,
  type WorldFiles,
  type WorldOverlays,
} from '../../../src/lib/atlas/world/decode'
import { deriveWorld } from '../../../src/lib/atlas/world/derive'
import type { World } from '../../../src/lib/atlas/world/model'
import { readTravelBook } from '../../../src/lib/game/travel-book'
import type { Locale } from '../../../src/lib/i18n/locales'

const root = resolve(import.meta.dirname, '../../..')

export function atlasFile(path: string): unknown {
  return JSON.parse(readFileSync(resolve(root, 'data/atlas', path), 'utf8'))
}

export function worldFiles(folder: string): WorldFiles {
  return {
    world: atlasFile(`${folder}/world.json`),
    surface: atlasFile(`${folder}/surface.json`),
    places: atlasFile(`${folder}/places.json`),
    landmarks: atlasFile(`${folder}/landmarks.json`),
    routes: atlasFile(`${folder}/routes.json`),
    establishments: atlasFile(`${folder}/establishments.json`),
    sky: atlasFile(`${folder}/sky.json`),
    underground: atlasFile(`${folder}/underground.json`),
  }
}

export function worldOverlays(folder: string, locale: Locale): WorldOverlays {
  if (locale === 'fr') return {}
  return {
    places: atlasFile(`${folder}/places.${locale}.json`),
    landmarks: atlasFile(`${folder}/landmarks.${locale}.json`),
    routes: atlasFile(`${folder}/routes.${locale}.json`),
    establishments: atlasFile(`${folder}/establishments.${locale}.json`),
  }
}

export function worldFrom(
  files: WorldFiles,
  overlays: WorldOverlays = {},
  locale: Locale = 'fr',
): { authored: AuthoredWorld; world: World } {
  const authored = decodeWorld(files, overlays)
  const world = deriveWorld(
    authored,
    decodeVocabulary(atlasFile('vocabularies.json'), locale),
    decodeTravel(atlasFile('travel.json')),
    locale,
  )
  return { authored, world }
}

export function loadWorld(
  folder: string,
  locale: Locale = 'fr',
): { authored: AuthoredWorld; world: World } {
  return worldFrom(worldFiles(folder), worldOverlays(folder, locale), locale)
}

export function oceanWorldFiles(columns: number, rows: number): WorldFiles {
  const layer = (legend: Record<string, string | number>, cell: string) => ({
    legend,
    rows: Array.from({ length: rows }, () => cell.repeat(columns)),
  })
  const empty = layer({}, '.')
  return {
    world: { name: 'Océan', columns, rows, hexKm: 5, featured: { places: [], landmarks: [] } },
    surface: {
      height: layer({ d: -4 }, 'd'),
      type: layer({ '#': 'deep' }, '#'),
      landmass: empty,
      political: empty,
      settlement: empty,
      sea: layer({ O: 'ocean' }, 'O'),
      relief: empty,
      cover: empty,
      caves: [],
    },
    places: { places: [{ id: 'ocean', kind: 'sea', name: 'Océan' }] },
    landmarks: { landmarks: [] },
    routes: { routes: [], skyLanes: [] },
    establishments: { establishments: [] },
    sky: { islands: [] },
    underground: { levels: [] },
  }
}

export function bookPaces(locale: Locale = 'fr') {
  const file = locale === 'fr' ? '08-l-exploration.md' : `08-l-exploration.${locale}.md`
  const markdown = readFileSync(resolve(root, 'data/books/livre-du-joueur', file), 'utf8')
  return readTravelBook(markdown).paces
}

export function finish<T>(steps: Generator<unknown, T>): T {
  for (;;) {
    const step = steps.next()
    if (step.done) return step.value
  }
}
