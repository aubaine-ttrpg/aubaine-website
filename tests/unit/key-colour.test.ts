import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { artKeyColour } from '../../src/lib/art-key-colour'
import {
  contrastOf,
  DARK_INK,
  hexOf,
  inkOn,
  KEY_FALLBACK,
  keyColour,
  LIGHT_INK,
  oklchOf,
  type Rgb,
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
  it('is a strong red for the Nnor', async () => {
    const key = oklchOf(rgbFromHex(await artKeyColour('nnor-3_4-og.png')))
    expect(key.hue).toBeGreaterThan(15)
    expect(key.hue).toBeLessThan(40)
    expect(key.chroma).toBeGreaterThan(0.14)
  })

  it('is a soft warm beige for the Marchand', async () => {
    const key = oklchOf(rgbFromHex(await artKeyColour('nnor-marchand-3_4-og.png')))
    expect(key.hue).toBeGreaterThan(40)
    expect(key.hue).toBeLessThan(85)
    expect(key.chroma).toBeLessThan(0.08)
    expect(key.lightness).toBeGreaterThan(0.8)
  })

  it('writes a hex colour, and falls back to the house gold only for a picture without colour', async () => {
    expect(await artKeyColour('nnor-3_4-og.png')).toMatch(/^#[0-9a-f]{6}$/)
    expect(hexOf(rgbFromHex(KEY_FALLBACK))).toBe(KEY_FALLBACK)
  })
})

describe('the ink on a coloured plate', () => {
  it('is dark on a light paper and light on a deep one', () => {
    expect(inkOn('#efe4cc')).toBe(DARK_INK)
    expect(inkOn('#2f6cae')).toBe(LIGHT_INK)
  })

  it('reads at AA contrast on every Caractéristique colour', async () => {
    const source = await readFile(
      resolve(import.meta.dirname, '../../data/meta/characteristics.json'),
      'utf8',
    )
    const entries: { key: string; color?: string }[] = JSON.parse(source).entries
    for (const { key, color } of entries) {
      if (!color) continue
      const contrast = contrastOf(rgbFromHex(color), rgbFromHex(inkOn(color)))
      expect(contrast, `${key} ${color}`).toBeGreaterThanOrEqual(AA_TEXT)
    }
  })

  it('refuses a colour that is not six digit hex', () => {
    expect(() => rgbFromHex('red')).toThrow(/hex/)
  })
})
