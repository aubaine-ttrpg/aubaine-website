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

export function loadWorld(
  folder: string,
  locale: Locale = 'fr',
): { authored: AuthoredWorld; world: World } {
  const authored = decodeWorld(worldFiles(folder), worldOverlays(folder, locale))
  const world = deriveWorld(
    authored,
    decodeVocabulary(atlasFile('vocabularies.json'), locale),
    decodeTravel(atlasFile('travel.json')),
    locale,
  )
  return { authored, world }
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
