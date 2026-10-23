import type { SwupInstance } from '../swup'

const PLATE = '[data-plate][data-art-effect]'
const STAGE = '[data-stage]'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

type Plates = typeof import('./plates')
type Stages = typeof import('./stage')

let plates: Promise<Plates> | undefined
let stages: Promise<Stages> | undefined

function report(error: unknown): void {
  console.error(error)
}

function syncEffects(): void {
  if (typeof WebGL2RenderingContext === 'undefined') return
  if (plates !== undefined || document.querySelector(PLATE) !== null) {
    plates ??= import('./plates')
    plates.then(({ syncPlates }) => syncPlates()).catch(report)
  }
  const still = window.matchMedia(REDUCED_MOTION).matches
  if (stages !== undefined || (!still && document.querySelector(STAGE) !== null)) {
    stages ??= import('./stage')
    stages.then(({ syncStages }) => syncStages()).catch(report)
  }
}

export function bindArtEffects(swup: SwupInstance): void {
  swup.hooks.on('page:view', syncEffects)
  syncEffects()
}
