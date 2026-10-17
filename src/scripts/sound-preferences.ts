export const SOUND_CATEGORIES = ['ambience', 'effects', 'interface'] as const
export type SoundCategory = (typeof SOUND_CATEGORIES)[number]

export type SoundPreferences = {
  readonly muted: boolean
  readonly master: number
  readonly levels: Readonly<Record<SoundCategory, number>>
}

export const DEFAULT_SOUND: SoundPreferences = {
  muted: true,
  master: 0.7,
  levels: { ambience: 0.8, effects: 0.6, interface: 0.5 },
}

export const SOUND_CHANGED = 'aubaine:sound-changed'

const SOUND_KEY = 'aubaine.sound'

let current: SoundPreferences | undefined

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function volume(value: unknown, fallback: number): number {
  return typeof value === 'number' && value >= 0 && value <= 1 ? value : fallback
}

function parsed(text: string | null): unknown {
  if (text === null) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

export function readSoundPreferences(text: string | null): SoundPreferences {
  const value = parsed(text)
  const source = isRecord(value) ? value : {}
  const levels = isRecord(source['levels']) ? source['levels'] : {}
  const muted = source['muted']
  return {
    muted: typeof muted === 'boolean' ? muted : DEFAULT_SOUND.muted,
    master: volume(source['master'], DEFAULT_SOUND.master),
    levels: {
      ambience: volume(levels['ambience'], DEFAULT_SOUND.levels.ambience),
      effects: volume(levels['effects'], DEFAULT_SOUND.levels.effects),
      interface: volume(levels['interface'], DEFAULT_SOUND.levels.interface),
    },
  }
}

function storedText(): string | null {
  try {
    return window.localStorage.getItem(SOUND_KEY)
  } catch {
    return null
  }
}

export function soundPreferences(): SoundPreferences {
  current ??= readSoundPreferences(storedText())
  return current
}

function store(next: SoundPreferences): void {
  try {
    window.localStorage.setItem(SOUND_KEY, JSON.stringify(next))
  } catch {
    return
  }
}

export function setSoundPreferences(patch: Partial<SoundPreferences>): void {
  const next = { ...soundPreferences(), ...patch }
  current = next
  document.dispatchEvent(new Event(SOUND_CHANGED))
  store(next)
}

export function onSoundPreferences(listener: () => void): () => void {
  const fromOtherTab = (event: StorageEvent) => {
    if (event.key !== null && event.key !== SOUND_KEY) return
    current = readSoundPreferences(event.newValue)
    listener()
  }
  document.addEventListener(SOUND_CHANGED, listener)
  window.addEventListener('storage', fromOtherTab)
  return () => {
    document.removeEventListener(SOUND_CHANGED, listener)
    window.removeEventListener('storage', fromOtherTab)
  }
}

export function volumeGain(level: number): number {
  return level * level
}

export function masterGain(preferences: SoundPreferences): number {
  return preferences.muted ? 0 : volumeGain(preferences.master)
}

export function categoryGain(preferences: SoundPreferences, category: SoundCategory): number {
  return masterGain(preferences) * volumeGain(preferences.levels[category])
}
