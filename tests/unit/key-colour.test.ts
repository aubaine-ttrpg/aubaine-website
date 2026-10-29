import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { artKeyColour } from '../../src/lib/art-key-colour'
import {
  contrastOf,
  DARK_INK,
  hexOf,
  KEY_FALLBACK,
  keyColour,
  oklchOf,
  type Rgb,
  readableOnNight,
  rgbFromHex,
  rgbOf,
} from '../../src/lib/key-colour'

const STICKER_INK: Rgb = [0x20, 0x18, 0x0a]
const AA_TEXT = 4.5

const many = (colour: Rgb, count: number): Rgb[] => Array.from({ length: count }, () => colour)

describe('the OKLCH round trip', () => {
  it('gives back the colour it was given', () => {
    for (const colour of [
      [239, 190, 4],
      [232, 90, 72],
      [20, 30, 200],
      [128, 128, 128],
    ] as const) {
      const back = rgbOf(oklchOf(colour))
      for (const [index, channel] of back.entries()) {
        expect(Math.abs(channel - (colour[index] ?? Number.NaN))).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('the key colour of a picture', () => {
  it('has none when the picture has no lit colour', () => {
    expect(keyColour([...many([128, 128, 128], 50), ...many([30, 5, 5], 50)])).toBeUndefined()
  })

  it('follows the hue that covers most of the lit picture', () => {
    const sand: Rgb = [217, 180, 143]
    const cloth: Rgb = [200, 40, 40]
    const key = keyColour([...many(sand, 70), ...many(cloth, 30)])
    expect(key?.hue).toBeCloseTo(oklchOf(sand).hue, 0)
  })

  it('stays soft for a muted picture and turns strong for a saturated one', () => {
    const muted = keyColour(many([217, 190, 160], 40))
    const vivid = keyColour(many([230, 40, 30], 40))
    expect(muted?.chroma ?? 1).toBeLessThan(vivid?.chroma ?? 0)
    expect(muted?.lightness ?? 0).toBeGreaterThan(vivid?.lightness ?? 1)
  })

  it('keeps dark sticker ink readable on every hue it can return', () => {
    for (let hue = 0; hue < 360; hue += 5) {
      const strongest = keyColour(many(rgbOf({ lightness: 0.6, chroma: 0.25, hue }), 10))
      if (!strongest) throw new Error(`no key colour for hue ${hue}`)
      expect(contrastOf(rgbOf(strongest), STICKER_INK), `hue ${hue}`).toBeGreaterThanOrEqual(
        AA_TEXT,
      )
    }
  })
})

describe('the key colour Aubaine reads from its covers', () => {
  it('writes a hex colour that keeps the sticker ink readable, on every 3:4 cover', async () => {
    const covers = (await readdir(resolve(import.meta.dirname, '../../data/media/art'))).filter(
      (file) => file.endsWith('-3_4-og.png'),
    )
    expect(covers).not.toHaveLength(0)
    for (const cover of covers) {
      const key = await artKeyColour(cover)
      expect(key, cover).toMatch(/^#[0-9a-f]{6}$/)
      expect(contrastOf(rgbFromHex(key), STICKER_INK), cover).toBeGreaterThanOrEqual(AA_TEXT)
    }
  })

  it('keeps the sticker ink readable on every key colour a species writes for itself', async () => {
    const directory = resolve(import.meta.dirname, '../../data/species')
    const files = (await readdir(directory)).filter(
      (file) => file.endsWith('.json') && !/\.[a-z]{2}\.json$/.test(file),
    )
    for (const file of files) {
      const entry: { keyColour?: string } = JSON.parse(
        await readFile(resolve(directory, file), 'utf8'),
      )
      if (!entry.keyColour) continue
      expect(contrastOf(rgbFromHex(entry.keyColour), STICKER_INK), file).toBeGreaterThanOrEqual(
        AA_TEXT,
      )
    }
  })

  it('falls back to a house gold written in hex', () => {
    expect(hexOf(rgbFromHex(KEY_FALLBACK))).toBe(KEY_FALLBACK)
  })
})

describe('a colour lifted to read on night', () => {
  it('keeps a colour that already reads on night', () => {
    expect(readableOnNight('#efe4cc')).toBe('#efe4cc')
  })

  it('lifts a deep colour just enough, keeping its hue', () => {
    const deep = '#2f6cae'
    const lifted = readableOnNight(deep)
    const contrast = contrastOf(rgbFromHex(lifted), rgbFromHex(DARK_INK))
    expect(contrast).toBeGreaterThanOrEqual(AA_TEXT)
    expect(contrast).toBeLessThan(AA_TEXT + 0.3)
    const before = oklchOf(rgbFromHex(deep)).hue
    const after = oklchOf(rgbFromHex(lifted)).hue
    expect(Math.abs(((before - after + 540) % 360) - 180)).toBeLessThan(6)
  })

  it('reads at AA contrast on every Caractéristique colour', async () => {
    const source = await readFile(
      resolve(import.meta.dirname, '../../data/meta/characteristics.json'),
      'utf8',
    )
    const entries: { key: string; color?: string }[] = JSON.parse(source).entries
    for (const { key, color } of entries) {
      if (!color) continue
      const contrast = contrastOf(rgbFromHex(readableOnNight(color)), rgbFromHex(DARK_INK))
      expect(contrast, `${key} ${color}`).toBeGreaterThanOrEqual(AA_TEXT)
    }
  })

  it('refuses a colour that is not six digit hex', () => {
    expect(() => rgbFromHex('red')).toThrow(/hex/)
  })
})
