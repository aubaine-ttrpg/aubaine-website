import type { PropModel } from '../contract/scene.ts'
import type { LandmarkKind } from '../vocabulary.ts'
import type { LandmarkRecord, World } from '../world/model.ts'
import { type ReliefField, surfaceY } from '../world/relief.ts'
import { type PropGeometry, packProp } from './builder.ts'
import { familyOf } from './kinds.ts'
import {
  arena,
  bones,
  castle,
  type Ground,
  lighthouse,
  portal,
  shipwreck,
  spire,
  volcano,
  watchtower,
  worldTree,
} from './models/landmarks.ts'
import { landmarkPlacement } from './placement.ts'
import { kindsOf } from './prototypes.ts'

type Model = (ground: Ground) => PropGeometry

const MODELS: Partial<Record<LandmarkKind, Model>> = {
  worldtree: worldTree,
  shipwreck: () => shipwreck(),
  castle: () => castle(),
  arena: () => arena(),
  volcano,
  spire: () => spire(),
  bones: () => bones(),
  lighthouse: () => lighthouse(),
  portal: () => portal(),
  tower: () => watchtower(),
}

const DOUBLE_SIDED: ReadonlySet<LandmarkKind> = new Set(['shipwreck'])

function model(field: ReliefField, landmark: LandmarkRecord): PropModel | undefined {
  const build = MODELS[landmark.kind]
  if (!build) return undefined
  const ground: Ground = (dx, dz) => surfaceY(field, landmark.x + dx, landmark.z + dz) - landmark.y
  const geometry = build(ground)
  const { x, y, z, turn, scale } = landmarkPlacement(field, landmark)
  return {
    layer: 'surface',
    landmark: landmark.index,
    family: familyOf(kindsOf(geometry)),
    mesh: packProp(geometry),
    doubleSided: DOUBLE_SIDED.has(landmark.kind),
    casts: true,
    position: [x, y, z],
    turn,
    scale,
  }
}

export function* landmarkSteps(
  world: World,
  field: ReliefField,
): Generator<undefined, PropModel[]> {
  const models: PropModel[] = []
  for (const landmark of world.landmarks) {
    const built = model(field, landmark)
    if (built) models.push(built)
    yield
  }
  return models
}
