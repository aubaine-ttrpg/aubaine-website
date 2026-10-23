import type { Tier } from '../atlas/contract/quality'
import type { ArtEffect } from './effects'

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

export type EffectTier = { pixelBudget: number; paintCoarser: number; paintStrips: number }

export const GRAIN_PER_SECOND = 24

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
  ultra: { pixelBudget: 6_600_000, paintCoarser: 0, paintStrips: 2 },
  high: { pixelBudget: 4_000_000, paintCoarser: 0, paintStrips: 4 },
  low: { pixelBudget: 2_400_000, paintCoarser: 1, paintStrips: 4 },
}
