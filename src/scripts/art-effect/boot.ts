import type { SwupInstance } from '../swup'

const PLATE = '[data-plate][data-art-effect]'
const STAGE = '[data-stage], [data-stage-field]'
const BANNER = '[data-drape="banner"]'
const FLAG = '[data-drape="flag"]'
const GLAZE = '.au-prose__frame'
const ARMS = '[data-drape="arms"]'
const ALMANACH = '[data-almanach]'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const AFTER_THE_PAGE_SETS_ITS_STAGE = { priority: 1 }

type Plates = typeof import('./plates')
type Stages = typeof import('./stage')
type Banners = typeof import('./banners')
type Flags = typeof import('./flags')
type Glazes = typeof import('./glazes')
type Arms = typeof import('./arms')
type Almanachs = typeof import('./almanachs')

let plates: Promise<Plates> | undefined
let stages: Promise<Stages> | undefined
let banners: Promise<Banners> | undefined
let flags: Promise<Flags> | undefined
let glazes: Promise<Glazes> | undefined
let arms: Promise<Arms> | undefined
let almanachs: Promise<Almanachs> | undefined

function report(error: unknown): void {
  console.error(error)
}

function syncStage(): Promise<void> {
  if (typeof WebGL2RenderingContext === 'undefined') return Promise.resolve()
  const still = window.matchMedia(REDUCED_MOTION).matches
  if (stages === undefined && (still || document.querySelector(STAGE) === null)) {
    return Promise.resolve()
  }
  stages ??= import('./stage')
  return stages.then(({ syncStages }) => syncStages()).catch(report)
}

function syncEffects(): void {
  if (typeof WebGL2RenderingContext === 'undefined') return
  if (plates !== undefined || document.querySelector(PLATE) !== null) {
    plates ??= import('./plates')
    plates.then(({ syncPlates }) => syncPlates()).catch(report)
  }
  void syncStage()
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
  if (almanachs !== undefined || document.querySelector(ALMANACH) !== null) {
    almanachs ??= import('./almanachs')
    almanachs.then(({ syncAlmanachs }) => syncAlmanachs()).catch(report)
  }
}

export function bindArtEffects(swup: SwupInstance): void {
  swup.hooks.on(
    'page:view',
    (visit) => {
      if (visit.animation.animate) return syncStage()
      syncEffects()
      return Promise.resolve()
    },
    AFTER_THE_PAGE_SETS_ITS_STAGE,
  )
  swup.hooks.on('visit:end', (visit) => {
    if (visit.animation.animate) syncEffects()
  })
  syncEffects()
}
