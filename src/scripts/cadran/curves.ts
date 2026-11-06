export const TAU = Math.PI * 2

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

export function ramp(time: number, from: number, to: number): number {
  return clamp01((time - from) / (to - from))
}

export function bell(time: number, from: number, peak: number, to: number): number {
  return time < peak ? ramp(time, from, peak) : 1 - ramp(time, peak, to)
}

export function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3
}

export function easeInOut(progress: number): number {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
}

export function easeOutBack(progress: number): number {
  const overshoot = 1.6
  return 1 + (overshoot + 1) * (progress - 1) ** 3 + overshoot * (progress - 1) ** 2
}

export function hash(seed: number): number {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}
