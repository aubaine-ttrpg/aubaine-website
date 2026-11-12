import type { Tier } from '../atlas/contract/quality'
import type { ClothSpec } from './cloth'
import type { ArtEffect } from './effects'
import type { ArmsRelief, KeyLight } from './relief'

type Triple = [number, number, number]

export type Tone = { contrast: number; pivot: number; toe: number; shoulder: number }

export type Colour = {
  saturation: number
  knee: number
  range: number
  shadows: [number, number]
  highlights: [number, number]
}

export type Grade = { tone: Tone; colour: Colour }

export type Halation = {
  threshold: number
  knee: number
  strength: number
  tint: Triple
  radius: number
}

export type Surface =
  | { kind: 'none' }
  | { kind: 'canvas'; weave: number; pitch: number; impasto: number; light: [number, number] }

export type Paint = {
  radius: number
  q: number
  hardness: number
  alpha: number
  zeroCrossing: number
}

export type Grain = {
  amount: number
  size: number
  chroma: number
  shadow: number
  highlight: number
  motion: 'animated' | 'static'
}

export type EffectSettings = {
  clarity: { amount: number; radius: number }
  sharpness: number
  grade: Grade
  halation: Halation | undefined
  aberration: number
  surface: Surface
  paint: Paint | undefined
  grain: Grain
}

export type StagePace = { budget: number; perSecond: number }

export type EffectTier = {
  pixelBudget: number
  paintCoarser: number
  paintStrips: number
  stage: StagePace | undefined
  cloth: StagePace | undefined
}

export const GRAIN_PER_SECOND = 24

export const STAGE = { width: 128, bleed: 48, blur: 40, saturate: 1.45, brightness: 0.62 } as const

export const PAINT_WIDEST = 1672

export const EFFECT_SETTINGS: Record<ArtEffect, EffectSettings> = {
  film: {
    clarity: { amount: 0.22, radius: 0.01 },
    sharpness: 0.55,
    grade: {
      tone: { contrast: 0.14, pivot: 0.46, toe: 0.022, shoulder: 0.965 },
      colour: {
        saturation: 0.94,
        knee: 0.13,
        range: 0.1,
        shadows: [-0.006, -0.014],
        highlights: [0.004, 0.012],
      },
    },
    halation: { threshold: 0.6, knee: 0.2, strength: 0.16, tint: [1, 0.3, 0.1], radius: 0.004 },
    aberration: 0.0008,
    surface: { kind: 'none' },
    paint: undefined,
    grain: {
      amount: 0.028,
      size: 1.35,
      chroma: 0.3,
      shadow: 0.55,
      highlight: 0.25,
      motion: 'animated',
    },
  },
  oil: {
    clarity: { amount: 0.08, radius: 0.012 },
    sharpness: 0.3,
    grade: {
      tone: { contrast: 0.1, pivot: 0.47, toe: 0.015, shoulder: 0.975 },
      colour: {
        saturation: 1,
        knee: 0.15,
        range: 0.12,
        shadows: [0.003, 0.006],
        highlights: [0.003, 0.01],
      },
    },
    halation: undefined,
    aberration: 0,
    surface: { kind: 'canvas', weave: 0.035, pitch: 3.2, impasto: 0.06, light: [-0.55, 0.65] },
    paint: { radius: 6, q: 8, hardness: 8, alpha: 1, zeroCrossing: 0.58 },
    grain: {
      amount: 0.012,
      size: 1.5,
      chroma: 0.15,
      shadow: 0.6,
      highlight: 0.3,
      motion: 'static',
    },
  },
}

export const EFFECT_TIERS: Record<Tier, EffectTier> = {
  ultra: {
    pixelBudget: 6_600_000,
    paintCoarser: 0,
    paintStrips: 2,
    stage: { budget: 400_000, perSecond: 30 },
    cloth: { budget: 2_200_000, perSecond: 30 },
  },
  high: {
    pixelBudget: 4_000_000,
    paintCoarser: 0,
    paintStrips: 4,
    stage: { budget: 240_000, perSecond: 24 },
    cloth: { budget: 1_000_000, perSecond: 24 },
  },
  low: {
    pixelBudget: 2_400_000,
    paintCoarser: 1,
    paintStrips: 4,
    stage: undefined,
    cloth: undefined,
  },
}

export const BANNER_CLOTH: ClothSpec = {
  stepsPerSecond: 120,
  aspect: 0.5,
  rest: { x: 0.06, y: 0.11, width: 0.38, height: 0.82 },
  columns: 10,
  rows: 21,
  gather: 0.07,
  gravity: 6.5,
  damping: 2.4,
  air: 2.2,
  stiffness: { stretch: 1, shear: 0.6, bend: 0.12 },
  iterations: 8,
  depth: 0.22,
  margin: 0.012,
  eye: 3,
  wind: {
    speed: 0.08,
    slip: 3.5,
    rise: 2,
    fall: 0.8,
    gusts: [
      { share: 0.4, pace: 0.29, phase: 0.4 },
      { share: 0.25, pace: 0.53, phase: 2.1 },
    ],
    ripples: [
      { share: 0.5, across: 0.6, down: 0.45, pace: 1.3, phase: 0 },
      { share: 0.3, across: -0.9, down: 0.7, pace: 2.1, phase: 1.7 },
    ],
    sideways: [
      { share: 0.5, pace: 0.9, phase: 0.3 },
      { share: 0.3, pace: 1.7, phase: 2.2 },
    ],
  },
}

export const BANNER_HANGER = {
  pole: { from: 0.04, radius: 0.0085, lift: 0.004 },
  finial: { length: 0.0335 },
  cord: { attach: 0.014, apex: 0.022, radius: 0.0012, twist: 0.006 },
  ring: { radius: 0.0055, tube: 0.0011 },
  band: 0.14,
  width: 800,
  exposure: 1.2,
} as const

export const FLAG = {
  headroom: 0.045,
  eye: 4,
  heading: 0.055,
  weaveTile: 0.55,
  light: [-0.62, -0.42, 0.66],
  roomYaw: 3.4,
  pose: 3.4,
  mesh: { columns: 97, rows: 65 },
} as const

export const BANNER_DESIGN = {
  notch: 0.12,
  trim: 0.06,
  rule: 0.01,
  fringe: 0.06,
  strands: 56,
  hem: 0.045,
  emblem: { centre: 0.41, width: 0.9 },
} as const

function bannerHem(height: number): { bottom: number; notch: number; drop: number } {
  const bottom = height * (1 - BANNER_DESIGN.fringe)
  return {
    bottom,
    notch: bottom - height * BANNER_DESIGN.notch,
    drop: height * BANNER_DESIGN.fringe,
  }
}

export function bannerOutline(width: number, height: number): string {
  const { bottom, notch } = bannerHem(height)
  return `M0 0H${width}V${bottom}L${width / 2} ${notch}L0 ${bottom}Z`
}

export function bannerFringe(width: number, height: number): string {
  const { bottom, notch, drop } = bannerHem(height)
  const middle = width / 2
  return `M0 ${bottom}L${middle} ${notch}L${width} ${bottom}V${bottom + drop}L${middle} ${notch + drop}L0 ${bottom + drop}Z`
}

export type EnvironmentLevel = { width: number; height: number; gloss: number | undefined }

export const ENVIRONMENT = {
  range: 64,
  meanRadiance: 0.5,
  levels: [
    { width: 256, height: 128, gloss: undefined },
    { width: 128, height: 64, gloss: 48 },
    { width: 64, height: 32, gloss: 8 },
    { width: 32, height: 16, gloss: 1 },
  ],
} as const satisfies { range: number; meanRadiance: number; levels: readonly EnvironmentLevel[] }

export type FrameMoulding = { top: number; right: number; bottom: number; left: number }

export const FRAME_KINDS = ['gilt', 'wood'] as const

export type FrameKind = (typeof FRAME_KINDS)[number]

export const GLAZED_FRAME = 'gilt' satisfies FrameKind

export function isFrameKind(value: unknown): value is FrameKind {
  return FRAME_KINDS.some((kind) => kind === value)
}

export type FrameSpec = {
  width: number
  height: number
  mapsWidth: number
  slice: FrameMoulding
  metalness: number
  exposure: number
}

export const FRAMES = {
  gilt: {
    width: 1600,
    height: 1231,
    mapsWidth: 1200,
    slice: { top: 105, right: 105, bottom: 105, left: 105 },
    metalness: 0.7,
    exposure: 1.2,
  },
  wood: {
    width: 1463,
    height: 1576,
    mapsWidth: 1100,
    slice: { top: 132, right: 132, bottom: 132, left: 132 },
    metalness: 0,
    exposure: 2,
  },
} as const satisfies Record<FrameKind, FrameSpec>

export const ROOM_ROTATION = { yaw: 0, pitch: 0 } as const

export const GLAZE_ROOM_YAW = Math.PI + 0.15

export type ArmsFiles = { still: string; colour: string; relief: string; finish: string }

export function armsFiles(composition: string): ArmsFiles {
  const stem = composition.replace(/\.svg$/, '')
  return {
    still: `${stem}.webp`,
    colour: `${stem}-colour.avif`,
    relief: `${stem}-relief.avif`,
    finish: `${stem}-finish.avif`,
  }
}

export type Rgb = readonly [number, number, number]

export const RELIEF_LEAN = { degrees: 7, perspective: 600 } as const

export const RELIEF_ROOM = {
  rest: { x: 0.3, y: 0.3 },
  distance: 1.5,
  roomYaw: Math.PI + 0.15,
  key: [-0.45, 0.6, 0.66],
} as const satisfies {
  rest: { x: number; y: number }
  distance: number
  roomYaw: number
  key: KeyLight
}

export const ARMS = {
  crop: { x: 23, y: 23, width: 154, height: 179 },
  width: 576,
  mapWidth: 768,
  supersample: 3,
  rest: RELIEF_ROOM.rest,
  sway: 0.75,
  distance: RELIEF_ROOM.distance,
  exposure: 1.06,
  roomYaw: RELIEF_ROOM.roomYaw,
  gold: { deep: [1.0, 0.55, 0.08], pale: [1.0, 0.74, 0.27] },
  enamelDepth: { open: 0.9, walls: 1.5 },
  key: RELIEF_ROOM.key,
  relief: {
    dome: 5,
    bezel: { roll: 0.55, band: 1.6, drop: 0.5, bead: 1.15, height: 1.35, valley: 0.6, crest: 1.0 },
    fillet: { width: 1.3, height: 0.7 },
    enamel: { recess: 0.35, meniscus: 0.18, reach: 0.8, pooling: 1.5 },
    charge: { volume: { height: 1.6, reach: 1.8 }, parts: { height: 0.5, reach: 0.5 } },
    engraving: { depth: 0.35, slope: 0.2, inset: 0.2 },
    curvature: { reach: 0.2, gain: 0.25 },
    occlusion: { contact: { reach: 0.35, strength: 5 }, broad: { reach: 1.5, strength: 2 } },
    shadow: { reach: 4, softness: 0.3 },
  },
  lean: RELIEF_LEAN,
} as const satisfies {
  crop: { x: number; y: number; width: number; height: number }
  width: number
  mapWidth: number
  supersample: number
  rest: { x: number; y: number }
  sway: number
  distance: number
  exposure: number
  roomYaw: number
  gold: { deep: Rgb; pale: Rgb }
  enamelDepth: { open: number; walls: number }
  key: KeyLight
  relief: ArmsRelief
  lean: { degrees: number; perspective: number }
}

function armsSizeAt(width: number): { width: number; height: number } {
  return { width, height: Math.round((width * ARMS.crop.height) / ARMS.crop.width) }
}

export const ARMS_SIZE = armsSizeAt(ARMS.width)

export const ARMS_MAP_SIZE = armsSizeAt(ARMS.mapWidth)

export const ARMS_UNIFORMS = {
  uSway: [ARMS.sway],
  uDistance: [ARMS.distance],
  uExposure: [ARMS.exposure],
  uGoldDeep: ARMS.gold.deep,
  uGoldPale: ARMS.gold.pale,
  uKey: ARMS.key,
} as const satisfies Record<string, readonly number[]>
