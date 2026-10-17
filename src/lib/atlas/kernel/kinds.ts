import type { PropFamily } from '../contract/scene.ts'

export const PROP_KIND = {
  plain: 0,
  bark: 1,
  leaf: 2,
  stone: 3,
  roof: 4,
  wood: 5,
  plaster: 6,
  metal: 7,
  crystal: 8,
  cloth: 9,
  glow: 10,
  rock: 11,
  ice: 12,
  mushroom: 13,
  lamp: 14,
  gold: 15,
  bone: 18,
  rotor: 19,
  rampart: 20,
  worldLeaf: 21,
  tornCloth: 22,
  arcade: 23,
  lavaRock: 24,
  stripes: 25,
  runes: 26,
} as const

export type PropKind = (typeof PROP_KIND)[keyof typeof PROP_KIND]

const CUTOUT_KINDS: ReadonlySet<number> = new Set([PROP_KIND.rampart, PROP_KIND.tornCloth])
const FOLIAGE_KINDS: ReadonlySet<number> = new Set([
  PROP_KIND.leaf,
  PROP_KIND.worldLeaf,
  PROP_KIND.mushroom,
])
const BUILT_KINDS: ReadonlySet<number> = new Set([
  PROP_KIND.stone,
  PROP_KIND.roof,
  PROP_KIND.wood,
  PROP_KIND.plaster,
  PROP_KIND.metal,
  PROP_KIND.cloth,
  PROP_KIND.glow,
  PROP_KIND.lamp,
  PROP_KIND.gold,
  PROP_KIND.rotor,
  PROP_KIND.arcade,
  PROP_KIND.stripes,
])

export function familyOf(kinds: Iterable<number>): PropFamily {
  const present = new Set(kinds)
  if ([...present].some((kind) => CUTOUT_KINDS.has(kind))) return 'cutout'
  if ([...present].some((kind) => FOLIAGE_KINDS.has(kind))) return 'foliage'
  if ([...present].some((kind) => BUILT_KINDS.has(kind))) return 'built'
  return 'mineral'
}
