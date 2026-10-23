export type Rgb = readonly [number, number, number]
export type Oklch = { lightness: number; chroma: number; hue: number }

const LIT = 0.45
const COLOURED = 0.025
const BIN_DEGREES = 10
const BINS = 360 / BIN_DEGREES
const FAMILY_DEGREES = 30
const CHROMA_GAIN = 11
const CHROMA_MOST = 0.18
const LIGHTNESS_TOP = 0.92
const LIGHTNESS_PER_CHROMA = 1.5

export const KEY_FALLBACK = '#efbe04'
export const DARK_INK = '#14100a'
export const LIGHT_INK = '#fbf8ef'

const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i

const linear = (channel: number): number => {
  const value = channel / 255
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

const encoded = (value: number): number => {
  const clamped = Math.min(1, Math.max(0, value))
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055
}

const degrees = (radians: number): number => ((radians * 180) / Math.PI + 360) % 360

const apart = (a: number, b: number): number => Math.abs(((a - b + 540) % 360) - 180)

export function oklchOf([red, green, blue]: Rgb): Oklch {
  const r = linear(red)
  const g = linear(green)
  const b = linear(blue)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bLab = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return {
    lightness: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    chroma: Math.hypot(a, bLab),
    hue: degrees(Math.atan2(bLab, a)),
  }
}

export function rgbOf({ lightness, chroma, hue }: Oklch): Rgb {
  const a = chroma * Math.cos((hue * Math.PI) / 180)
  const b = chroma * Math.sin((hue * Math.PI) / 180)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  const channel = (value: number): number => Math.round(encoded(value) * 255)
  return [
    channel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    channel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    channel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

export function hexOf(colour: Rgb): string {
  return `#${colour.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

export function luminanceOf([red, green, blue]: Rgb): number {
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue)
}

export function contrastOf(one: Rgb, other: Rgb): number {
  const first = luminanceOf(one)
  const second = luminanceOf(other)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

export function rgbFromHex(hex: string): Rgb {
  const found = HEX.exec(hex)
  if (!found) throw new Error(`${hex} is not a six digit hex colour`)
  const channel = (value: string | undefined): number => Number.parseInt(value ?? '', 16)
  return [channel(found[1]), channel(found[2]), channel(found[3])]
}

export function inkOn(paper: string): string {
  const ground = rgbFromHex(paper)
  const dark = contrastOf(ground, rgbFromHex(DARK_INK))
  const light = contrastOf(ground, rgbFromHex(LIGHT_INK))
  return dark >= light ? DARK_INK : LIGHT_INK
}

function dominantHue(coloured: Oklch[]): number {
  const counts = new Array<number>(BINS).fill(0)
  for (const { hue } of coloured) {
    const bin = Math.floor(hue / BIN_DEGREES) % BINS
    counts[bin] = (counts[bin] ?? 0) + 1
  }
  const at = (index: number): number => counts[(index + BINS) % BINS] ?? 0
  const smoothed = counts.map((count, index) => count + (at(index - 1) + at(index + 1)) / 2)
  return smoothed.indexOf(Math.max(...smoothed)) * BIN_DEGREES + BIN_DEGREES / 2
}

export function keyColour(pixels: Iterable<Rgb>): Oklch | undefined {
  const coloured = [...pixels]
    .map(oklchOf)
    .filter(({ lightness, chroma }) => lightness >= LIT && chroma >= COLOURED)
  if (coloured.length === 0) return undefined
  const family = dominantHue(coloured)
  let x = 0
  let y = 0
  let weight = 0
  let chroma = 0
  for (const pixel of coloured) {
    if (apart(pixel.hue, family) > FAMILY_DEGREES) continue
    const light = pixel.lightness ** 4
    x += Math.cos((pixel.hue * Math.PI) / 180) * light
    y += Math.sin((pixel.hue * Math.PI) / 180) * light
    chroma += pixel.chroma * light
    weight += light
  }
  const strength = Math.min(CHROMA_MOST, CHROMA_GAIN * (chroma / weight) ** 2)
  return {
    lightness: LIGHTNESS_TOP - LIGHTNESS_PER_CHROMA * strength,
    chroma: strength,
    hue: degrees(Math.atan2(y, x)),
  }
}
