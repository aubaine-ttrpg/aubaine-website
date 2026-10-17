import { describe, expect, it } from 'vitest'

import {
  categoryGain,
  DEFAULT_SOUND,
  readSoundPreferences,
  type SoundPreferences,
} from '../../src/scripts/sound-preferences'

describe('the sound preferences a browser keeps', () => {
  it('start muted when nothing is stored', () => {
    expect(readSoundPreferences(null)).toEqual(DEFAULT_SOUND)
    expect(DEFAULT_SOUND.muted).toBe(true)
  })

  it('fall back to the defaults when the stored text is not JSON', () => {
    expect(readSoundPreferences('{muted')).toEqual(DEFAULT_SOUND)
  })

  it('keep every valid field and lose only the one that is wrong', () => {
    const stored = JSON.stringify({
      muted: false,
      master: 2,
      levels: { ambience: 0.3, effects: 'loud', interface: 0 },
    })
    expect(readSoundPreferences(stored)).toEqual({
      muted: false,
      master: DEFAULT_SOUND.master,
      levels: { ambience: 0.3, effects: DEFAULT_SOUND.levels.effects, interface: 0 },
    })
  })
})

describe('the gain of a category', () => {
  const unmuted: SoundPreferences = {
    muted: false,
    master: 0.5,
    levels: { ambience: 1, effects: 0.5, interface: 0 },
  }

  it('is silent while muted, whatever the volumes', () => {
    expect(categoryGain({ ...unmuted, muted: true }, 'ambience')).toBe(0)
  })

  it('multiplies the master and the category on a squared curve', () => {
    expect(categoryGain(unmuted, 'ambience')).toBe(0.25)
    expect(categoryGain(unmuted, 'effects')).toBe(0.0625)
    expect(categoryGain(unmuted, 'interface')).toBe(0)
  })
})
