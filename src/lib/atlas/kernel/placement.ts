import type { LandmarkKind } from '../vocabulary.ts'
import type { LandmarkRecord } from '../world/model.ts'
import { type ReliefField, surfaceY } from '../world/relief.ts'

export type LandmarkPlacement = { x: number; y: number; z: number; turn: number; scale: number }

type Rule = { ground: boolean; lift: number; turn: number; scale: number }

const RULES: Record<LandmarkKind, Rule> = {
  worldtree: { ground: false, lift: -0.05, turn: 0, scale: 1.25 },
  shipwreck: { ground: false, lift: 0, turn: 0.6, scale: 0.62 },
  castle: { ground: true, lift: 0, turn: 0.4, scale: 1.05 },
  arena: { ground: true, lift: -0.01, turn: 0, scale: 1.1 },
  volcano: { ground: false, lift: 0, turn: 0, scale: 1 },
  spire: { ground: true, lift: -0.05, turn: 0, scale: 1 },
  bones: { ground: true, lift: -0.06, turn: 0.4, scale: 0.85 },
  lighthouse: { ground: true, lift: 0, turn: 0, scale: 1.3 },
  portal: { ground: true, lift: 0, turn: 0, scale: 1.2 },
  tower: { ground: true, lift: 0, turn: 0, scale: 1.4 },
  skycity: { ground: false, lift: 0, turn: 0, scale: 1 },
  skyisle: { ground: false, lift: 0, turn: 0, scale: 1 },
}

const WRECK_DEPTH = -0.12

export const LANDMARK_LABEL_LIFT: Partial<Record<LandmarkKind, number>> = {
  worldtree: 8.6,
  skycity: 3.4,
  skyisle: 0.8,
  volcano: 2.4,
  spire: 5.2,
}
export const DEFAULT_LABEL_LIFT = 0.9

export function landmarkPlacement(field: ReliefField, landmark: LandmarkRecord): LandmarkPlacement {
  const rule = RULES[landmark.kind]
  const base =
    landmark.kind === 'shipwreck'
      ? WRECK_DEPTH
      : rule.ground
        ? surfaceY(field, landmark.x, landmark.z)
        : landmark.y
  return { x: landmark.x, y: base + rule.lift, z: landmark.z, turn: rule.turn, scale: rule.scale }
}
