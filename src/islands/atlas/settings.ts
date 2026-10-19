import { isView, type View } from '../../lib/atlas/contract/camera'
import {
  DEFAULT_DISPLAY,
  EFFECT_GROUPS,
  LABEL_GROUPS,
  type MapDisplay,
  ROUTE_LAYERS,
} from '../../lib/atlas/contract/display'
import { isFields } from '../../lib/atlas/contract/fields'
import { isQualityChoice, type QualityChoice } from '../../lib/atlas/contract/quality'
import { DEFAULT_STYLE, isMapStyle, type MapStyle } from '../../lib/atlas/contract/style'

export type AtlasSettings = {
  quality: QualityChoice
  screen: boolean
  style: MapStyle
  legend: boolean
  display: MapDisplay
}

export const DEFAULT_SETTINGS: AtlasSettings = {
  quality: 'auto',
  screen: true,
  style: DEFAULT_STYLE,
  legend: true,
  display: DEFAULT_DISPLAY,
}

const SETTINGS_KEY = 'aubaine.atlas.settings'
const VIEW_KEY = 'aubaine.atlas.view'

function stored(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function store(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    return
  }
}

function parsed(text: string | null): unknown {
  if (text === null) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const flag = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback)

function flags<K extends string>(
  value: unknown,
  keys: readonly K[],
  fallback: Readonly<Record<K, boolean>>,
): Record<K, boolean> {
  const source = isFields(value) ? value : {}
  const result: Record<K, boolean> = { ...fallback }
  for (const key of keys) result[key] = flag(source[key], fallback[key])
  return result
}

function readDisplay(value: unknown): MapDisplay {
  const source = isFields(value) ? value : {}
  return {
    labels: flags(source['labels'], LABEL_GROUPS, DEFAULT_DISPLAY.labels),
    borders: flag(source['borders'], DEFAULT_DISPLAY.borders),
    grid: flag(source['grid'], DEFAULT_DISPLAY.grid),
    routes: flags(source['routes'], ROUTE_LAYERS, DEFAULT_DISPLAY.routes),
    effects: flags(source['effects'], EFFECT_GROUPS, DEFAULT_DISPLAY.effects),
  }
}

export function storedSettings(): AtlasSettings {
  const value = parsed(stored(SETTINGS_KEY))
  const source = isFields(value) ? value : {}
  return {
    quality: isQualityChoice(source['quality']) ? source['quality'] : DEFAULT_SETTINGS.quality,
    screen: flag(source['screen'], DEFAULT_SETTINGS.screen),
    style: isMapStyle(source['style']) ? source['style'] : DEFAULT_SETTINGS.style,
    legend: flag(source['legend'], DEFAULT_SETTINGS.legend),
    display: readDisplay(source['display']),
  }
}

export function storeSettings(settings: AtlasSettings): void {
  store(SETTINGS_KEY, JSON.stringify(settings))
}

export function storedView(): View | undefined {
  const value = stored(VIEW_KEY)
  return isView(value) ? value : undefined
}

export function storeView(view: View): void {
  store(VIEW_KEY, view)
}
