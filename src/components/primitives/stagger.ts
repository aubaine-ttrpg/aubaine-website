const MAX_STEPS = 8

export const STAGGER_STEP = { card: 50, tree: 40 } as const

export function enterDelay(index: number, step: number): number {
  return Math.min(index, MAX_STEPS) * step
}
