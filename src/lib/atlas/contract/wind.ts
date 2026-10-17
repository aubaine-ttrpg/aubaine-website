export const WIND = { x: 0.878, z: 0.479 } as const

export function downwind(speed: number, rise: number): [number, number, number] {
  return [WIND.x * speed, rise, WIND.z * speed]
}
