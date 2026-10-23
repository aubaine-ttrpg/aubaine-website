import { PROFILE_AXES, PROFILE_RANKS } from './schema'

export type ProfileAxis = (typeof PROFILE_AXES)[number]
export type ProfileRank = (typeof PROFILE_RANKS)[number]
export type Profile = Record<ProfileAxis, ProfileRank>

export type Point = { x: number; y: number }
export type LabelSide = 'top' | 'end' | 'bottom' | 'start'

export const PROFILE_RINGS = PROFILE_RANKS.length
export const TOP_RANK: ProfileRank = 'S'

const TURN = 2 * Math.PI
const DECIMALS = 1000

export function rankRing(rank: ProfileRank): number {
  return PROFILE_RANKS.indexOf(rank) + 1
}

export function axisAngle(index: number): number {
  return -Math.PI / 2 + (index * TURN) / PROFILE_AXES.length
}

export function vertex(index: number, radius: number): Point {
  const angle = axisAngle(index)
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

export function ringPoints(ring: number, radius: number): Point[] {
  return PROFILE_AXES.map((_, index) => vertex(index, (radius * ring) / PROFILE_RINGS))
}

export function profilePoints(profile: Profile, radius: number): Point[] {
  return PROFILE_AXES.map((axis, index) =>
    vertex(index, (radius * rankRing(profile[axis])) / PROFILE_RINGS),
  )
}

export function svgPoints(points: Point[]): string {
  const round = (value: number) => Math.round(value * DECIMALS) / DECIMALS
  return points.map(({ x, y }) => `${round(x)},${round(y)}`).join(' ')
}

export function svgPath(points: Point[]): string {
  return `M${svgPoints(points).replaceAll(' ', ' L')} Z`
}

export function labelSide(index: number): LabelSide {
  const { x, y } = vertex(index, 1)
  if (Math.abs(x) < 1e-9) return y < 0 ? 'top' : 'bottom'
  return x > 0 ? 'end' : 'start'
}

export function labelPosition(index: number, radiusPercent: number): Point {
  const { x, y } = vertex(index, radiusPercent)
  return { x: 50 + x, y: 50 + y }
}
