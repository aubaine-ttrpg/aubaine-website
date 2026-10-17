export function smoothstep01(t: number): number {
  return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t)
}

export function smoothstep(from: number, to: number, x: number): number {
  return smoothstep01((x - from) / (to - from))
}
