import type { SwupInstance } from '../swup'

const PLATE = '[data-plate][data-art-effect]'

type Runtime = typeof import('./plates')

let runtime: Promise<Runtime> | undefined

function syncEffects(): void {
  if (typeof WebGL2RenderingContext === 'undefined') return
  if (runtime === undefined && document.querySelector(PLATE) === null) return
  runtime ??= import('./plates')
  runtime.then(({ syncPlates }) => syncPlates()).catch((error: unknown) => console.error(error))
}

export function bindArtEffects(swup: SwupInstance): void {
  swup.hooks.on('page:view', syncEffects)
  syncEffects()
}
