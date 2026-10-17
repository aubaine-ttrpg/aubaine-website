import { fields, list, positive } from '../contract/fields.ts'
import { normalHour } from '../contract/time-of-day.ts'
import { smoothstep } from './smoothstep.ts'

export const STAR_KEYS = ['primary', 'warm', 'hot'] as const
export type StarKey = (typeof STAR_KEYS)[number]

export type Rgb = readonly [number, number, number]
export type Direction = readonly [number, number, number]

export type StarProfile = {
  temperature: number
  illuminance: number
  diameter: number
  tint: Rgb
}

export type StarPair = {
  distance: number
  separation: number
  orbitYears: number
  mutualDays: number
}

export type StarSystem = Record<StarKey, StarProfile> & { pair: StarPair }

export type StarLight = {
  key: StarKey
  direction: Direction
  outside: number
  illuminance: number
  colour: Rgb
  radius: number
}

const DAYS_PER_YEAR = 365.25
const PLANET_DISTANCE = 1
const OPTICAL_DEPTH: Rgb = [0.145, 0.198, 0.335]
const LUMINANCE: Rgb = [0.2126, 0.7152, 0.0722]
const NEUTRAL: Rgb = [1, 1, 1]
const TINT_FADE = { from: Math.sin((5 * Math.PI) / 180), to: Math.sin((25 * Math.PI) / 180) }

function profile(raw: unknown, path: string): StarProfile {
  const star = fields(raw, path)
  const tint =
    star['tint'] === undefined
      ? NEUTRAL
      : list(star['tint'], `${path}.tint`).map((value, index) =>
          positive(value, `${path}.tint[${index}]`),
        )
  const [r = 1, g = 1, b = 1] = tint
  return {
    temperature: positive(star['temperature'], `${path}.temperature`),
    illuminance: positive(star['illuminance'], `${path}.illuminance`),
    diameter: positive(star['diameter'], `${path}.diameter`),
    tint: [r, g, b],
  }
}

export function decodeStars(raw: unknown): StarSystem {
  const file = fields(raw, 'stars')
  const pair = fields(file['pair'], 'stars.pair')
  return {
    primary: profile(file['primary'], 'stars.primary'),
    warm: profile(file['warm'], 'stars.warm'),
    hot: profile(file['hot'], 'stars.hot'),
    pair: {
      distance: positive(pair['distance'], 'stars.pair.distance'),
      separation: positive(pair['separation'], 'stars.pair.separation'),
      orbitYears: positive(pair['orbitYears'], 'stars.pair.orbitYears'),
      mutualDays: positive(pair['mutualDays'], 'stars.pair.mutualDays'),
    },
  }
}

export function synodicDays(pair: StarPair): number {
  return DAYS_PER_YEAR / (1 - 1 / pair.orbitYears)
}

export function skyArc(hour: number): Direction {
  const theta = ((normalHour(hour) - 6) / 12) * Math.PI
  const x = Math.cos(theta)
  const y = Math.sin(theta) * 0.92
  const z = 0.42 * Math.max(0.2, Math.sin(theta)) + 0.12
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

function chromaticity(kelvin: number): [number, number] {
  const t = Math.min(25000, Math.max(1667, kelvin))
  const x =
    t <= 4000
      ? -0.2661239e9 / t ** 3 - 0.2343589e6 / t ** 2 + 0.8776956e3 / t + 0.17991
      : -3.0258469e9 / t ** 3 + 2.1070379e6 / t ** 2 + 0.2226347e3 / t + 0.24039
  const y =
    t <= 2222
      ? -1.1063814 * x ** 3 - 1.3481102 * x ** 2 + 2.18555832 * x - 0.20219683
      : t <= 4000
        ? -0.9549476 * x ** 3 - 1.37418593 * x ** 2 + 2.09137015 * x - 0.16748867
        : 3.081758 * x ** 3 - 5.8733867 * x ** 2 + 3.75112997 * x - 0.37001483
  return [x, y]
}

export function blackbody(kelvin: number): Rgb {
  const [x, y] = chromaticity(kelvin)
  const X = x / y
  const Z = (1 - x - y) / y
  return [
    Math.max(0, 3.2406 * X - 1.5372 - 0.4986 * Z),
    Math.max(0, -0.9689 * X + 1.8758 + 0.0415 * Z),
    Math.max(0, 0.0557 * X - 0.204 + 1.057 * Z),
  ]
}

function airmass(sine: number): number {
  const degrees = (Math.asin(Math.min(1, Math.max(0, sine))) * 180) / Math.PI
  return 1 / (Math.max(0, sine) + 0.50572 * (degrees + 6.07995) ** -1.6364)
}

const luminance = (c: Rgb) => c[0] * LUMINANCE[0] + c[1] * LUMINANCE[1] + c[2] * LUMINANCE[2]

function beam(star: StarProfile, sine: number): { colour: Rgb; transmitted: number } {
  const mass = airmass(sine) - 1
  const base = blackbody(star.temperature)
  const tint = smoothstep(TINT_FADE.from, TINT_FADE.to, sine)
  const raw: Rgb = [
    base[0] * Math.exp(-OPTICAL_DEPTH[0] * mass) * (1 + (star.tint[0] - 1) * tint),
    base[1] * Math.exp(-OPTICAL_DEPTH[1] * mass) * (1 + (star.tint[1] - 1) * tint),
    base[2] * Math.exp(-OPTICAL_DEPTH[2] * mass) * (1 + (star.tint[2] - 1) * tint),
  ]
  const transmitted = luminance(raw) / luminance(base)
  const level = luminance(raw)
  return {
    colour: level > 0 ? [raw[0] / level, raw[1] / level, raw[2] / level] : [1, 1, 1],
    transmitted,
  }
}

type Seen = { lag: number; distance: number }

function seen(x: number, z: number): Seen {
  const dx = x - PLANET_DISTANCE
  const cross = -z
  const dot = -dx
  return { lag: (Math.atan2(cross, dot) * 12) / Math.PI, distance: Math.hypot(dx, z) }
}

function light(
  key: StarKey,
  star: StarProfile,
  hour: number,
  view: Seen,
  reference: number,
): StarLight {
  const direction = skyArc(hour - view.lag)
  const { colour, transmitted } = beam(star, direction[1])
  const above = direction[1] > 0 ? 1 : 0
  const outside = star.illuminance * (reference / view.distance) ** 2
  return {
    key,
    direction,
    outside,
    illuminance: outside * transmitted * above,
    colour,
    radius: star.diameter / 2,
  }
}

export function companionAngle(pair: StarPair, season: number): number {
  const phase = 2 * Math.PI * season
  const view = seen(pair.distance * Math.cos(phase), pair.distance * Math.sin(phase))
  return Math.abs(view.lag) * 15
}

export function starLights(system: StarSystem, hour: number, season: number): StarLight[] {
  const { pair } = system
  const phase = 2 * Math.PI * season
  const mutual = 2 * Math.PI * ((season * synodicDays(pair)) / pair.mutualDays)
  const cx = pair.distance * Math.cos(phase)
  const cz = pair.distance * Math.sin(phase)
  const ox = (pair.separation / 2) * Math.cos(mutual)
  const oz = (pair.separation / 2) * Math.sin(mutual)
  return [
    light('primary', system.primary, hour, { lag: 0, distance: 1 }, 1),
    light('warm', system.warm, hour, seen(cx - ox, cz - oz), pair.distance),
    light('hot', system.hot, hour, seen(cx + ox, cz + oz), pair.distance),
  ]
}
