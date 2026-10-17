import { ROUTE_KINDS, SKY_LANE } from '../vocabulary.ts'
import type { PieceMaterial } from './scene.ts'

export const LABEL_KINDS = [
  'continent',
  'country',
  'sea',
  'region',
  'natural',
  'city',
  'village',
  'quarter',
  'landmark',
  'realm',
  'network',
  'cavern',
  'hold',
  'unexplored',
] as const
export type LabelKind = (typeof LABEL_KINDS)[number]

export const LABEL_GROUPS = ['territories', 'seas', 'settlements', 'nature', 'landmarks'] as const
export type LabelGroup = (typeof LABEL_GROUPS)[number]

export const LABEL_GROUP_OF: Readonly<Record<LabelKind, LabelGroup>> = {
  continent: 'territories',
  country: 'territories',
  region: 'territories',
  realm: 'territories',
  unexplored: 'territories',
  sea: 'seas',
  city: 'settlements',
  village: 'settlements',
  quarter: 'settlements',
  hold: 'settlements',
  natural: 'nature',
  network: 'nature',
  cavern: 'nature',
  landmark: 'landmarks',
}

export const ROUTE_LAYERS = [...ROUTE_KINDS, SKY_LANE] as const
export type RouteLayer = (typeof ROUTE_LAYERS)[number]

export const ROUTE_LAYER_OF_PIECE: Readonly<Partial<Record<PieceMaterial, RouteLayer>>> = {
  road: 'road',
  trail: 'trail',
  ballast: 'rail',
  rail: 'rail',
  'sea-lane': 'sea',
  'sky-lane': 'sky',
  river: 'river',
}

export const ROUTE_LAYER_OF_PROP: Readonly<Record<string, RouteLayer>> = {
  cairn: 'trail',
  signpost: 'trail',
  sleeper: 'rail',
  pylon: 'rail',
  trestle: 'rail',
}

export const EFFECT_GROUPS = ['clouds', 'birds', 'particles', 'glows'] as const
export type EffectGroup = (typeof EFFECT_GROUPS)[number]

export type MapDisplay = {
  labels: Readonly<Record<LabelGroup, boolean>>
  borders: boolean
  grid: boolean
  routes: Readonly<Record<RouteLayer, boolean>>
  effects: Readonly<Record<EffectGroup, boolean>>
}

export const DEFAULT_DISPLAY: MapDisplay = {
  labels: { territories: true, seas: true, settlements: true, nature: true, landmarks: true },
  borders: true,
  grid: false,
  routes: { road: true, trail: true, rail: true, sea: true, river: true, sky: true },
  effects: { clouds: true, birds: true, particles: true, glows: true },
}
