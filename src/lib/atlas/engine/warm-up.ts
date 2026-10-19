import {
  type BufferGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  type Material,
  Mesh,
  type Object3D,
  Points,
} from 'three'
import {
  PARTICLE_STYLES,
  type ParticleSpec,
  PIECE_MATERIALS,
  PROP_FAMILIES,
} from '../contract/scene.ts'
import { layoutOf, probeGeometry } from './geometry.ts'
import type { MaterialLibrary } from './materials/library.ts'

export type ShaderProbes = { group: Group; dispose: () => void }

const PROBE_PARTICLES: Omit<ParticleSpec, 'style' | 'nightOnly' | 'additive'> = {
  origins: new Float32Array(3),
  perOrigin: 1,
  life: 1,
  velocity: [0, 0, 0],
  spread: [0, 0, 0],
  gravity: 0,
  size: [0.1, 0.1],
  turbulence: 0,
  colour: [1, 1, 1],
  fade: [1, 1, 1],
  alpha: 1,
  seed: 0,
}

export function shaderProbes(library: MaterialLibrary): ShaderProbes {
  const group = new Group()
  group.name = 'shader-probes'
  const geometries: BufferGeometry[] = []
  const owned: Material[] = []
  const shape = (geometry: BufferGeometry) => {
    geometries.push(geometry)
    return geometry
  }
  const own = <T extends Material>(material: T) => {
    owned.push(material)
    return material
  }
  const add = (...objects: Object3D[]) => group.add(...objects)
  for (const material of PIECE_MATERIALS)
    add(new Mesh(shape(probeGeometry(layoutOf(material))), library.piece(material)))
  const prop = shape(probeGeometry('prop'))
  const tinted = shape(probeGeometry('prop'))
  tinted.setAttribute('aTint', new InstancedBufferAttribute(new Uint8Array(4), 4, true))
  for (const family of PROP_FAMILIES) {
    for (const doubleSided of [false, true]) {
      const material = library.prop(family, doubleSided)
      add(new Mesh(prop, material), new InstancedMesh(tinted, material, 1))
    }
  }
  const plain = shape(probeGeometry('plain'))
  for (const style of PARTICLE_STYLES) {
    for (const nightOnly of [false, true]) {
      add(
        new Points(
          plain,
          own(library.particles({ ...PROBE_PARTICLES, style, nightOnly, additive: false })),
        ),
      )
    }
  }
  add(
    new Points(plain, own(library.glows())),
    new Mesh(plain, own(library.lightPools())),
    new Mesh(plain, own(library.beam({ colour: [1, 1, 1], intensity: 1, scroll: 0, night: 0 }))),
    new Mesh(plain, own(library.vortex([1, 1, 1]))),
    new InstancedMesh(plain, own(library.clouds()), 1),
    new InstancedMesh(plain, own(library.vehicleDecals()), 1),
    new Mesh(plain, own(library.birds())),
    new Mesh(plain, own(library.beaconRing())),
    new Mesh(plain, own(library.travelPath(false))),
    new Mesh(plain, own(library.travelPath(true))),
  )
  group.visible = false
  return {
    group,
    dispose() {
      group.removeFromParent()
      for (const geometry of geometries) geometry.dispose()
      for (const material of owned) material.dispose()
    },
  }
}
