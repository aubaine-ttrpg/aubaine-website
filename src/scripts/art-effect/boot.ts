import type { SwupInstance } from '../swup'
import { stayPlain } from './approach'

const PLATE = '[data-plate][data-art-effect]'
const STAGE = '[data-stage], [data-stage-field]'
const BANNER = '[data-drape="banner"]'
const FLAG = '[data-drape="flag"]'
const GLAZE = '.au-prose__frame'
const ARMS = '[data-drape="arms"]'
const SEAL = '[data-drape="seal"]'
const ALMANACH = '[data-almanach]'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const AFTER_THE_PAGE_SETS_ITS_STAGE = { priority: 1 }
const LIT_BOUND = 'data-lit-bound'

type Plates = typeof import('./plates')
type Stages = typeof import('./stage')
type Banners = typeof import('./banners')
type Flags = typeof import('./flags')
type Glazes = typeof import('./glazes')
type Arms = typeof import('./arms')
type Seals = typeof import('./seal')
type Almanachs = typeof import('./almanachs')

let plates: Promise<Plates> | undefined
let stages: Promise<Stages> | undefined
let banners: Promise<Banners> | undefined
let flags: Promise<Flags> | undefined
let glazes: Promise<Glazes> | undefined
let arms: Promise<Arms> | undefined
let seals: Promise<Seals> | undefined
let almanachs: Promise<Almanachs> | undefined

function report(error: unknown): void {
  console.error(error)
}

function leavePlain(selector: string): (error: unknown) => void {
  return (error) => {
    report(error)
    for (const piece of document.querySelectorAll(selector)) stayPlain(piece)
  }
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
    banners.then(({ syncBanners }) => syncBanners()).catch(leavePlain(BANNER))
  }
  if (flags !== undefined || document.querySelector(FLAG) !== null) {
    flags ??= import('./flags')
    flags.then(({ syncFlags }) => syncFlags()).catch(leavePlain(FLAG))
  }
  if (glazes !== undefined || document.querySelector(GLAZE) !== null) {
    glazes ??= import('./glazes')
    glazes.then(({ syncGlazes }) => syncGlazes()).catch(leavePlain(GLAZE))
  }
  if (arms !== undefined || document.querySelector(ARMS) !== null) {
    arms ??= import('./arms')
    arms.then(({ syncArms }) => syncArms()).catch(leavePlain(ARMS))
  }
  if (seals !== undefined || document.querySelector(SEAL) !== null) {
    seals ??= import('./seal')
    seals.then(({ syncSeals }) => syncSeals()).catch(leavePlain(SEAL))
  }
  if (almanachs !== undefined || document.querySelector(ALMANACH) !== null) {
    almanachs ??= import('./almanachs')
    almanachs.then(({ syncAlmanachs }) => syncAlmanachs()).catch(leavePlain(ALMANACH))
  }
}

export function bindArtEffects(swup: SwupInstance): void {
  document.documentElement.setAttribute(LIT_BOUND, '')
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
