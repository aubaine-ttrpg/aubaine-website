import {
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  PlaneGeometry,
  type ShaderMaterial,
} from 'three'
import type { MaterialLibrary } from './materials/library.ts'

export type PathPoint = [number, number, number]

export class Beacon {
  readonly group = new Group()
  private readonly materials: ShaderMaterial[]

  constructor(library: MaterialLibrary) {
    const beam = library.beaconBeam()
    const ring = library.beaconRing()
    this.materials = [beam, ring]
    const pillar = new Mesh(
      new CylinderGeometry(0.09, 0.09, 6, 24, 1, true).translate(0, 3, 0),
      beam,
    )
    const plate = new Mesh(new PlaneGeometry(1.8, 1.8), ring)
    plate.rotation.x = -Math.PI / 2
    plate.position.y = 0.03
    this.group.add(pillar, plate)
    this.group.renderOrder = 10
    this.group.visible = false
  }

  show(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z)
    this.group.visible = true
  }

  hide(): void {
    this.group.visible = false
  }

  dispose(): void {
    this.group.traverse((object) => {
      if (object instanceof Mesh) object.geometry.dispose()
    })
    for (const material of this.materials) material.dispose()
  }
}

export class TravelPath {
  readonly group = new Group()
  private readonly ribbon: Mesh<BufferGeometry, ShaderMaterial>
  private readonly pins: Mesh[]
  private readonly materials: ShaderMaterial[]

  constructor(library: MaterialLibrary) {
    const path = library.travelPath()
    const pin = library.travelPin()
    this.materials = [path, pin]
    this.ribbon = new Mesh(new BufferGeometry(), path)
    this.ribbon.frustumCulled = false
    this.ribbon.renderOrder = 11
    this.ribbon.visible = false
    const pinGeometry = new CylinderGeometry(0.08, 0.08, 3, 16, 1, true).translate(0, 1.5, 0)
    this.pins = [0, 1].map(() => {
      const mesh = new Mesh(pinGeometry, pin)
      mesh.visible = false
      return mesh
    })
    this.group.add(this.ribbon, ...this.pins)
  }

  show(points: readonly PathPoint[], width: number): void {
    const count = points.length
    const positions = new Float32Array(count * 6)
    const uvs = new Float32Array(count * 4)
    const lengths = new Float32Array(count * 2)
    const indices: number[] = []
    let length = 0
    for (let k = 0; k < count; k++) {
      const point = points[k] ?? [0, 0, 0]
      const next = points[Math.min(count - 1, k + 1)] ?? point
      const previous = points[Math.max(0, k - 1)] ?? point
      let tx = next[0] - previous[0]
      let tz = next[2] - previous[2]
      const span = Math.hypot(tx, tz) || 1
      tx /= span
      tz /= span
      if (k > 0) {
        const before = points[k - 1] ?? point
        length += Math.hypot(point[0] - before[0], point[1] - before[1], point[2] - before[2])
      }
      positions.set(
        [
          point[0] - tz * width,
          point[1],
          point[2] + tx * width,
          point[0] + tz * width,
          point[1],
          point[2] - tx * width,
        ],
        k * 6,
      )
      uvs.set([0, 0, 0, 1], k * 4)
      lengths.set([length, length], k * 2)
    }
    for (let k = 0; k < count - 1; k++) {
      const a = k * 2
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
    geometry.setAttribute('aS', new BufferAttribute(lengths, 1))
    geometry.setIndex(indices)
    this.ribbon.geometry.dispose()
    this.ribbon.geometry = geometry
    this.ribbon.visible = count > 1
    const ends = [points[0], points[count - 1]]
    for (const [index, pin] of this.pins.entries()) {
      const end = ends[index]
      if (!end) continue
      pin.position.set(end[0], end[1], end[2])
      pin.visible = true
    }
  }

  hide(): void {
    this.ribbon.visible = false
    for (const pin of this.pins) pin.visible = false
  }

  dispose(): void {
    this.ribbon.geometry.dispose()
    this.pins[0]?.geometry.dispose()
    for (const material of this.materials) material.dispose()
  }
}
