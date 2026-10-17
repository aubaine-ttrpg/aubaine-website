import {
  AIRSHIP_PROTOTYPE,
  type Bounds,
  LOCOMOTIVE_PROTOTYPE,
  type PrototypeData,
  SHIP_PROTOTYPE,
  WAGON_PROTOTYPES,
} from '../contract/scene.ts'
import { BUILDING_STYLES, type BuildingStyle } from '../vocabulary.ts'
import { type PropGeometry, packProp } from './builder.ts'
import { familyOf, PROP_KIND } from './kinds.ts'
import {
  blades,
  boat,
  hall,
  house,
  lantern,
  pier,
  temple,
  tower,
  wallPiece,
  wallTower,
  windmill,
} from './models/buildings.ts'
import {
  airship,
  brazier,
  cairn,
  column,
  crypt,
  dwarfHall,
  iceSpikes,
  lakeBoat,
  lamp,
  locomotive,
  mineHead,
  mineRail,
  pylon,
  roots,
  ship,
  signpost,
  sleeper,
  stalagmites,
  trestle,
  wagon,
} from './models/furniture.ts'
import type { Detail } from './models/parts.ts'
import {
  acacia,
  basalt,
  boulder,
  bush,
  cactus,
  coral,
  crystalCluster,
  deadTree,
  hay,
  hoodoo,
  jungleTree,
  mushroom,
  oak,
  palm,
  peak,
  pine,
  reeds,
  rock,
  serac,
} from './models/vegetation.ts'

type Spec = { build: (detail: Detail) => PropGeometry; detailed: boolean; casts: boolean }

const DETAILS: readonly Detail[] = [0, 1, 2]
export const HOUSE_VARIANTS = 5
export const DWARF_HALLS = 4
export const PEAKS = 4

const fixed = (build: () => PropGeometry, casts = true): Spec => ({
  build: () => build(),
  detailed: false,
  casts,
})
const detailed = (build: (detail: Detail) => PropGeometry, casts = true): Spec => ({
  build,
  detailed: true,
  casts,
})

const PEAK_SHAPES: readonly { sharp: boolean; colour: string }[] = [
  { sharp: true, colour: '#8a847c' },
  { sharp: true, colour: '#7f7a74' },
  { sharp: false, colour: '#8c8680' },
  { sharp: false, colour: '#837d76' },
]

export const prototypeKey = {
  house: (style: BuildingStyle, variant: number) => `house-${style}-${variant}`,
  tower: (style: BuildingStyle, variant: number) => `tower-${style}-${variant}`,
  temple: (style: BuildingStyle) => `temple-${style}`,
  hall: (style: BuildingStyle) => `hall-${style}`,
  wall: (style: BuildingStyle) => `wall-${style}`,
  wallTower: (style: BuildingStyle) => `wall-tower-${style}`,
  peak: (index: number) => `peak-${index}`,
  dwarfHall: (index: number) => `dwarf-hall-${index}`,
}

function registry(): Map<string, Spec> {
  const specs = new Map<string, Spec>([
    ['oak', detailed(oak)],
    ['pine', detailed(pine)],
    ['palm', detailed(palm)],
    ['jungle', detailed(jungleTree)],
    ['acacia', detailed(acacia)],
    ['bush', detailed(bush)],
    ['dead', fixed(deadTree)],
    ['cactus', fixed(cactus)],
    ['mushroom', fixed(mushroom)],
    ['crystal', fixed(crystalCluster, false)],
    ['reeds', fixed(reeds)],
    ['coral', fixed(coral, false)],
    ['rock', fixed(rock)],
    ['boulder', fixed(boulder)],
    ['serac', fixed(serac)],
    ['basalt', fixed(basalt)],
    ['hoodoo', fixed(hoodoo)],
    ['hay', fixed(hay)],
    ['peak-volcanic', detailed((detail) => peak(5, false, '#2d2828', PROP_KIND.lavaRock, detail))],
    ['farmhouse', fixed(() => house('aubemont', 3))],
    ['barn', fixed(() => house('aubemont', 8))],
    ['windmill', fixed(windmill)],
    ['blades', fixed(blades, false)],
    ['boat', fixed(boat, false)],
    ['pier', fixed(pier, false)],
    ['lantern', fixed(lantern, false)],
    ['sleeper', fixed(sleeper, false)],
    ['trestle', fixed(trestle)],
    ['pylon', fixed(pylon)],
    ['signpost', fixed(signpost, false)],
    ['cairn', fixed(cairn, false)],
    ['stalagmites', fixed(stalagmites)],
    ['column', fixed(column)],
    ['mine-head', fixed(mineHead)],
    ['mine-rail', fixed(mineRail)],
    ['ice-spikes', fixed(iceSpikes)],
    ['crypt', fixed(crypt)],
    ['roots', fixed(roots)],
    ['brazier', fixed(brazier)],
    ['lamp', fixed(lamp, false)],
    ['lake-boat', fixed(lakeBoat)],
    [SHIP_PROTOTYPE, fixed(ship, false)],
    [AIRSHIP_PROTOTYPE, fixed(airship, false)],
    [LOCOMOTIVE_PROTOTYPE, fixed(locomotive, false)],
  ])
  for (const [index, shape] of PEAK_SHAPES.entries()) {
    specs.set(
      prototypeKey.peak(index + 1),
      detailed((detail) => peak(index + 1, shape.sharp, shape.colour, PROP_KIND.rock, detail)),
    )
  }
  for (const [index, key] of WAGON_PROTOTYPES.entries()) {
    specs.set(
      key,
      fixed(() => wagon(index), false),
    )
  }
  for (let index = 0; index < DWARF_HALLS; index++)
    specs.set(
      prototypeKey.dwarfHall(index),
      fixed(() => dwarfHall(index * 13 + 5)),
    )
  for (const style of BUILDING_STYLES) {
    for (let variant = 0; variant < HOUSE_VARIANTS; variant++) {
      specs.set(
        prototypeKey.house(style, variant),
        fixed(() => house(style, variant)),
      )
    }
    specs.set(
      prototypeKey.tower(style, 1),
      fixed(() => tower(style, 1)),
    )
    specs.set(
      prototypeKey.tower(style, 2),
      fixed(() => tower(style, 2)),
    )
    specs.set(
      prototypeKey.temple(style),
      fixed(() => temple(style)),
    )
    specs.set(
      prototypeKey.hall(style),
      fixed(() => hall(style)),
    )
    specs.set(
      prototypeKey.wall(style),
      fixed(() => wallPiece(style)),
    )
    specs.set(
      prototypeKey.wallTower(style),
      fixed(() => wallTower(style)),
    )
  }
  return specs
}

const SPECS = registry()

export class UnknownPrototypeError extends Error {
  constructor(key: string) {
    super(`no prop prototype is registered as ${key}`)
    this.name = 'UnknownPrototypeError'
  }
}

export function hasPrototype(key: string): boolean {
  return SPECS.has(key)
}

export function kindsOf(geometry: PropGeometry): Set<number> {
  const kinds = new Set<number>()
  for (let i = 3; i < geometry.colours.length; i += 4) kinds.add(geometry.colours[i] ?? 0)
  return kinds
}

const BOUNDS = new Map<string, Bounds>()

export function buildPrototype(key: string): PrototypeData {
  const spec = SPECS.get(key)
  if (!spec) throw new UnknownPrototypeError(key)
  const geometries = (spec.detailed ? DETAILS : DETAILS.slice(0, 1)).map((detail) =>
    spec.build(detail),
  )
  const [first] = geometries
  if (!first) throw new UnknownPrototypeError(key)
  const lods = geometries.map(packProp)
  const [nearest] = lods
  if (nearest) BOUNDS.set(key, [...nearest.bounds])
  return { key, family: familyOf(kindsOf(first)), lods, casts: spec.casts, doubleSided: false }
}

export function prototypeBounds(key: string): Bounds {
  const known = BOUNDS.get(key)
  if (known) return known
  const spec = SPECS.get(key)
  if (!spec) throw new UnknownPrototypeError(key)
  const bounds: Bounds = [...packProp(spec.build(0)).bounds]
  BOUNDS.set(key, bounds)
  return bounds
}

export class PrototypeShelf {
  private readonly sent = new Set<string>()

  take(keys: Iterable<string>): PrototypeData[] {
    const fresh: PrototypeData[] = []
    for (const key of keys) {
      if (this.sent.has(key)) continue
      this.sent.add(key)
      fresh.push(buildPrototype(key))
    }
    return fresh
  }
}
