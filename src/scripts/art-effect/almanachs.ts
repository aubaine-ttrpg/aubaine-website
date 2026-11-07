import {
  ALMANACH_MODEL,
  ALMANACH_PAGE_BOOT,
  ALMANACH_STYLE,
  type AlmanachStyle,
  almanachFitOf,
  almanachStyleOf,
} from '../../lib/art-effect/almanach-look'
import { almanachStyle } from '../../lib/art-effect/almanach-styles'
import { HTML_LANG, LOCALES, type Locale } from '../../lib/i18n/locales'
import { strings } from '../../lib/i18n/strings'
import { categoryGain, onSoundPreferences, soundPreferences } from '../sound-preferences'
import { isStill, STILLNESS_CHANGED } from '../stillness'
import { type Almanach, type AlmanachPicture, AlmanachUnavailable, mountAlmanach } from './almanach'
import { stayPlain } from './approach'

const ALMANACH = '[data-almanach]'
const PICTURE = 'img[data-almanach-picture]'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

type Mounted = { readonly almanach: Almanach; readonly release: () => void }

const almanachs = new Map<HTMLElement, Mounted>()
let unavailable = false

function focusOf(image: HTMLImageElement): readonly [number, number] | undefined {
  const [x, y] = (image.dataset['focus'] ?? '').split(/\s+/).map(Number)
  if (x === undefined || y === undefined || !Number.isFinite(x) || !Number.isFinite(y))
    return undefined
  return [x, y]
}

function picturesOf(host: HTMLElement): AlmanachPicture[] {
  return [...host.querySelectorAll<HTMLImageElement>(PICTURE)].map((image) => {
    const focus = focusOf(image)
    return {
      src: image.currentSrc || image.src,
      alt: image.alt,
      fit: almanachFitOf(image.dataset['fit']),
      ...(focus ? { focus } : {}),
    }
  })
}

function styleOf(host: HTMLElement): AlmanachStyle {
  const named = host.dataset['almanachStyle']
  if (named !== undefined) {
    const style = almanachStyle(named)
    if (!style) throw new Error(`no almanach style is named ${named}`)
    return style
  }
  const settings = host.dataset['almanachSettings']
  if (settings === undefined) return ALMANACH_STYLE
  const style = almanachStyleOf(JSON.parse(settings))
  if (!style) throw new Error(`an almanach carries invalid settings: ${settings}`)
  return style
}

function pageLocale(): Locale {
  const lang = document.documentElement.lang
  const locale = LOCALES.find((each) => HTML_LANG[each] === lang)
  if (!locale) throw new Error(`the page language ${lang} is none of the site's locales`)
  return locale
}

function motionNow(): 'full' | 'calm' {
  return isStill() || window.matchMedia(REDUCED_MOTION).matches ? 'calm' : 'full'
}

function effectsVolume(): number {
  return categoryGain(soundPreferences(), 'effects')
}

function mount(host: HTMLElement, pictures: readonly AlmanachPicture[]): void {
  const { crystalBoot, battery, ...look } = styleOf(host)
  const almanach = mountAlmanach(host, {
    model: ALMANACH_MODEL,
    pictures,
    look,
    boot: ALMANACH_PAGE_BOOT,
    crystalBoot,
    battery,
    motion: motionNow(),
    copy: strings(pageLocale()).almanachDevice,
    volume: effectsVolume(),
  })
  const quiet = onSoundPreferences(() => almanach.volume(effectsVolume()))
  const settle = (): void => almanach.motion(motionNow())
  window.addEventListener(STILLNESS_CHANGED, settle)
  const release = (): void => {
    quiet()
    window.removeEventListener(STILLNESS_CHANGED, settle)
  }
  almanachs.set(host, { almanach, release })
  almanach.ready.catch((error: unknown) => {
    if (error instanceof AlmanachUnavailable) unavailable = true
    release()
    almanachs.delete(host)
    stayPlain(host)
  })
}

export function syncAlmanachs(): void {
  for (const [host, mounted] of [...almanachs]) {
    if (host.isConnected) continue
    mounted.release()
    mounted.almanach.destroy()
    almanachs.delete(host)
  }
  for (const host of document.querySelectorAll<HTMLElement>(ALMANACH)) {
    if (almanachs.has(host)) continue
    if (unavailable) {
      stayPlain(host)
      continue
    }
    const pictures = picturesOf(host)
    if (pictures.length === 0) continue
    try {
      mount(host, pictures)
    } catch (error) {
      console.error(error)
      stayPlain(host)
    }
  }
}
