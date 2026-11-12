import { srgbToLinear } from '../atlas/kernel/colour.ts'
import { oklchOf, rgbFromHex, rgbOf } from '../key-colour.ts'
import { RELIEF_LEAN, RELIEF_ROOM, type Rgb } from './presets.ts'
import type { KeyLight, SealRelief } from './relief.ts'

export const SEAL_STILL_WIDTHS = [120, 144, 192, 240, 288, 360, 384, 432, 576] as const

export type SealStillWidth = (typeof SEAL_STILL_WIDTHS)[number]

export type SealFiles = {
  colour: string
  relief: string
  finish: string
  stills: readonly { width: SealStillWidth; file: string }[]
}

export function sealFiles(emblem: string): SealFiles {
  const stem = emblem.replace(/\.svg$/, '')
  return {
    colour: `${stem}-colour.avif`,
    relief: `${stem}-relief.avif`,
    finish: `${stem}-finish.avif`,
    stills: SEAL_STILL_WIDTHS.map((width) => ({ width, file: `${stem}-${width}.webp` })),
  }
}

export const SEAL = {
  mapWidth: 768,
  supersample: 3,
  rest: RELIEF_ROOM.rest,
  sway: 0.4,
  distance: RELIEF_ROOM.distance,
  roomYaw: RELIEF_ROOM.roomYaw,
  key: RELIEF_ROOM.key,
  exposure: 1.0,
  mica: 0.6,
  relief: {
    span: 100,
    centre: { x: 50, y: 45 },
    outline: {
      radius: 40,
      waves: [
        [3, 0.022, 0.4],
        [5, 0.018, 2.1],
        [8, 0.028, 4.0],
        [11, 0.016, 1.3],
        [17, 0.007, 5.2],
      ],
    },
    drip: { angle: 1.36, from: 0.88, to: 1.13, neck: 5.5, tip: 5, blend: 4 },
    body: {
      height: 3.2,
      reach: 3,
      dome: 2.5,
      ripples: [
        [23, 0.22, 0.6, 1.7],
        [17, 0.16, 2.3, 4.1],
        [11, 0.08, 4.0, 0.9],
      ],
    },
    stamp: { radius: 30, press: 1.1, wall: 1.2 },
    ring: {
      height: 1.1,
      width: 7,
      waves: [
        [3, 0.3, 0.7],
        [5, 0.25, 2.6],
        [9, 0.15, 4.4],
      ],
      drift: [
        [2, 0.5, 1.9],
        [5, 0.45, 0.3],
        [8, 0.3, 3.6],
      ],
      ripples: [
        [29, 0.08, 1.1],
        [43, 0.06, 3.3],
        [61, 0.05, 0.2],
      ],
    },
    emblem: { span: 57, swell: { height: 0.9, reach: 0.5 }, clearance: 1.8 },
    roughness: { body: 0.6, ring: 0.72, field: 0.5, emblem: 0.48 },
    curvature: { reach: 0.2, gain: 0.25 },
    occlusion: { contact: { reach: 0.35, strength: 9 }, broad: { reach: 1.5, strength: 4 } },
    shadow: { reach: 4, softness: 0.3 },
  },
  lean: RELIEF_LEAN,
} as const satisfies {
  mapWidth: number
  supersample: number
  rest: { x: number; y: number }
  sway: number
  distance: number
  roomYaw: number
  key: KeyLight
  exposure: number
  mica: number
  relief: SealRelief
  lean: { degrees: number; perspective: number }
}

export const SEAL_MAP_SIZE = { width: SEAL.mapWidth, height: SEAL.mapWidth }

export type WaxShades = { albedo: Rgb; deep: Rgb; pale: Rgb }

const WAX_BODY = { lightness: 0.72, chroma: 1, warmer: 0 }
const WAX_HOLLOW = { lightness: 0.58, chroma: 1, warmer: 14 }
const WAX_HIGHLIGHT = { lightness: 0.93, chroma: 0.5, warmer: 0 }
const WAX_DIFFUSE = 0.42

type WaxTone = typeof WAX_HOLLOW

function linearOf([red, green, blue]: Rgb): Rgb {
  return [srgbToLinear(red / 255), srgbToLinear(green / 255), srgbToLinear(blue / 255)]
}

function brightest([red, green, blue]: Rgb): Rgb {
  const peak = Math.max(red, green, blue)
  return [red / peak, green / peak, blue / peak]
}

export function waxShades(wax: string): WaxShades {
  const charge = oklchOf(rgbFromHex(wax))
  const toned = ({ lightness, chroma, warmer }: WaxTone): Rgb =>
    linearOf(rgbOf({ lightness, chroma: charge.chroma * chroma, hue: charge.hue - warmer }))
  const [red, green, blue] = brightest(toned(WAX_BODY))
  return {
    albedo: [red * WAX_DIFFUSE, green * WAX_DIFFUSE, blue * WAX_DIFFUSE],
    deep: brightest(toned(WAX_HOLLOW)),
    pale: brightest(toned(WAX_HIGHLIGHT)),
  }
}

export const SEAL_UNIFORMS = {
  uSway: [SEAL.sway],
  uDistance: [SEAL.distance],
  uExposure: [SEAL.exposure],
  uKey: SEAL.key,
  uMica: [SEAL.mica],
} as const satisfies Record<string, readonly number[]>

export function waxUniforms({ deep, pale }: WaxShades): Record<'uWaxDeep' | 'uWaxPale', Rgb> {
  return { uWaxDeep: deep, uWaxPale: pale }
}
