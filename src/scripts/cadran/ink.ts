export type Rgb = readonly [number, number, number]

export function hex(value: string): Rgb {
  const digits = value.replace('#', '')
  return [
    Number.parseInt(digits.slice(0, 2), 16),
    Number.parseInt(digits.slice(2, 4), 16),
    Number.parseInt(digits.slice(4, 6), 16),
  ]
}

export function css(color: Rgb, alpha = 1): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`
}

export function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return [
    Math.round(from[0] + (to[0] - from[0]) * amount),
    Math.round(from[1] + (to[1] - from[1]) * amount),
    Math.round(from[2] + (to[2] - from[2]) * amount),
  ]
}

export const CADRAN_INK = {
  white: hex('#ffffff'),
  beam: hex('#a8f1ff'),
  cyan: hex('#5fd4ff'),
  gold: hex('#f1d199'),
} as const
