import type { SwupInstance } from '../swup'

const PLATE = '[data-plate][data-art-effect]'
const STAGE = '[data-stage], [data-stage-field]'
const BANNER = '[data-drape="banner"]'
const FLAG = '[data-drape="flag"]'
const GLAZE = '.au-prose__frame'
const ARMS = '[data-drape="arms"]'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

type Plates = typeof import('./plates')
type Stages = typeof import('./stage')
type Banners = typeof import('./banners')
type Flags = typeof import('./flags')
type Glazes = typeof import('./glazes')
type Arms = typeof import('./arms')

let plates: Promise<Plates> | undefined
let stages: Promise<Stages> | undefined
let banners: Promise<Banners> | undefined
let flags: Promise<Flags> | undefined
let glazes: Promise<Glazes> | undefined
let arms: Promise<Arms> | undefined

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
  if (banners !== undefined || document.querySelector(BANNER) !== null) {
    banners ??= import('./banners')
    banners.then(({ syncBanners }) => syncBanners()).catch(report)
  }
  if (flags !== undefined || document.querySelector(FLAG) !== null) {
    flags ??= import('./flags')
    flags.then(({ syncFlags }) => syncFlags()).catch(report)
  }
  if (glazes !== undefined || document.querySelector(GLAZE) !== null) {
    glazes ??= import('./glazes')
    glazes.then(({ syncGlazes }) => syncGlazes()).catch(report)
  }
  if (arms !== undefined || document.querySelector(ARMS) !== null) {
    arms ??= import('./arms')
    arms.then(({ syncArms }) => syncArms()).catch(report)
  }
}

export function bindArtEffects(swup: SwupInstance): void {
  swup.hooks.on('page:view', (visit) => {
    if (!visit.animation.animate) syncEffects()
  })
  swup.hooks.on('visit:end', (visit) => {
    if (visit.animation.animate) syncEffects()
  })
  syncEffects()
}
