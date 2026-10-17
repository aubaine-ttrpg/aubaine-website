import { Box3, BufferAttribute, BufferGeometry, Sphere, Vector3 } from 'three'
import type { Bounds, MeshData, PieceMaterial } from '../contract/scene.ts'

export type VertexLayout = 'top' | 'wall' | 'tunnel' | 'plain' | 'ribbon' | 'prop'

const BYTE_ATTRIBUTE: Record<VertexLayout, { name: string; normalized: boolean } | undefined> = {
  top: { name: 'aBio', normalized: false },
  wall: { name: 'aWall', normalized: false },
  tunnel: { name: 'color', normalized: true },
  plain: undefined,
  ribbon: undefined,
  prop: { name: 'aColour', normalized: false },
}

const FLOAT_ATTRIBUTE: Record<VertexLayout, { name: string; size: number } | undefined> = {
  top: undefined,
  wall: { name: 'aLip', size: 1 },
  tunnel: undefined,
  plain: undefined,
  ribbon: { name: 'uv', size: 2 },
  prop: undefined,
}

const NORMAL_WITH_W: Record<VertexLayout, string | undefined> = {
  top: undefined,
  wall: undefined,
  tunnel: undefined,
  plain: undefined,
  ribbon: undefined,
  prop: 'aNormalFlutter',
}

const PROBE_VERTICES = 3

export function layoutOf(material: PieceMaterial): VertexLayout {
  switch (material) {
    case 'terrain-top':
    case 'sky-top':
    case 'under-top':
      return 'top'
    case 'terrain-wall':
    case 'under-wall':
      return 'wall'
    case 'tunnel':
      return 'tunnel'
    case 'water':
    case 'abyss':
    case 'mist-depth':
    case 'mist':
    case 'under-water':
      return 'plain'
    case 'road':
    case 'trail':
    case 'ballast':
    case 'rail':
    case 'sea-lane':
    case 'sky-lane':
    case 'river':
    case 'waterfall':
    case 'sky-fall':
      return 'ribbon'
  }
}

function setNormal(geometry: BufferGeometry, normal: BufferAttribute, layout: VertexLayout): void {
  geometry.setAttribute('normal', normal)
  const withW = NORMAL_WITH_W[layout]
  if (withW) geometry.setAttribute(withW, normal)
}

export function boxOf(bounds: Bounds): Box3 {
  return new Box3(
    new Vector3(bounds[0], bounds[1], bounds[2]),
    new Vector3(bounds[3], bounds[4], bounds[5]),
  )
}

export function geometryOf(mesh: MeshData, layout: VertexLayout): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(mesh.positions, 3))
  setNormal(geometry, new BufferAttribute(mesh.normals, 4, true), layout)
  const bytes = BYTE_ATTRIBUTE[layout]
  if (bytes && mesh.bytes)
    geometry.setAttribute(bytes.name, new BufferAttribute(mesh.bytes, 4, bytes.normalized))
  const floats = FLOAT_ATTRIBUTE[layout]
  if (floats && mesh.floats) {
    if (mesh.floatSize !== floats.size) {
      throw new Error(
        `a ${layout} mesh carries ${mesh.floatSize} floats per vertex, not ${floats.size}`,
      )
    }
    geometry.setAttribute(floats.name, new BufferAttribute(mesh.floats, floats.size))
  }
  geometry.setIndex(new BufferAttribute(mesh.indices, 1))
  geometry.boundingBox = boxOf(mesh.bounds)
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(new Sphere())
  return geometry
}

export function probeGeometry(layout: VertexLayout): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(PROBE_VERTICES * 3), 3))
  setNormal(geometry, new BufferAttribute(new Int8Array(PROBE_VERTICES * 4), 4, true), layout)
  const bytes = BYTE_ATTRIBUTE[layout]
  if (bytes)
    geometry.setAttribute(
      bytes.name,
      new BufferAttribute(new Uint8Array(PROBE_VERTICES * 4), 4, bytes.normalized),
    )
  const floats = FLOAT_ATTRIBUTE[layout]
  if (floats)
    geometry.setAttribute(
      floats.name,
      new BufferAttribute(new Float32Array(PROBE_VERTICES * floats.size), floats.size),
    )
  geometry.setIndex([0, 1, 2])
  return geometry
}
