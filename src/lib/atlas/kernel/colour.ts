import type { Rgb } from '../contract/scene.ts'

export function srgbToLinear(value: number): number {
  return value < 0.04045 ? value * 0.0773993808 : (value * 0.9478672986 + 0.0521327014) ** 2.4
}

export function linearToSrgb(value: number): number {
  return value < 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055
}

export function hexToLinear(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16)
  return [
    srgbToLinear(((value >> 16) & 255) / 255),
    srgbToLinear(((value >> 8) & 255) / 255),
    srgbToLinear((value & 255) / 255),
  ]
}

export function srgbBytes([r, g, b]: Rgb): [number, number, number] {
  const byte = (value: number) =>
    Math.max(0, Math.min(255, Math.round(linearToSrgb(Math.max(0, Math.min(1, value))) * 255)))
  return [byte(r), byte(g), byte(b)]
}

const hueChannel = (low: number, high: number, at: number) => {
  let t = at
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return low + (high - low) * 6 * t
  if (t < 1 / 2) return high
  if (t < 2 / 3) return low + (high - low) * 6 * (2 / 3 - t)
  return low
}

export function offsetHsl([r, g, b]: Rgb, dh: number, ds: number, dl: number): Rgb {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (min + max) / 2
  let hue = 0
  let saturation = 0
  if (min !== max) {
    const delta = max - min
    saturation = lightness <= 0.5 ? delta / (max + min) : delta / (2 - max - min)
    if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0)
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
    hue /= 6
  }
  const h = (((hue + dh) % 1) + 1) % 1
  const s = Math.max(0, Math.min(1, saturation + ds))
  const l = Math.max(0, Math.min(1, lightness + dl))
  if (s === 0) return [l, l, l]
  const high = l <= 0.5 ? l * (1 + s) : l + s - l * s
  const low = 2 * l - high
  return [
    hueChannel(low, high, h + 1 / 3),
    hueChannel(low, high, h),
    hueChannel(low, high, h - 1 / 3),
  ]
}

export const WHITE: Rgb = [1, 1, 1]
