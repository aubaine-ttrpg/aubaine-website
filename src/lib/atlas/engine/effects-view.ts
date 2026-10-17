import {
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  type Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Points,
  SphereGeometry,
} from 'three'
import { EFFECT_GROUPS, type EffectGroup } from '../contract/display.ts'
import type { TierSettings } from '../contract/quality.ts'
import type {
  BeamSpec,
  CloudSpec,
  EffectsData,
  Flock,
  LightPool,
  ParticleSpec,
} from '../contract/scene.ts'
import { mulberry32 } from '../world/noise.ts'
import { geometryOf } from './geometry.ts'
import type { MaterialLibrary } from './materials/library.ts'

const BIRD_SEED = 5
const BIRD_SHAPE = [
  0, 0, 0.05, 0.16, 0.02, -0.03, 0, 0, -0.04, 0, 0, 0.05, 0, 0, -0.04, -0.16, 0.02, -0.03, 0, 0.005,
  0.07, 0.012, 0, -0.06, -0.012, 0, -0.06,
]
const REDUCED_CLOUDS = 0.5
const SPHERE_ROWS = 0.625

type Particles = { points: Points; spec: ParticleSpec; total: number }
type Spinner = { mesh: Mesh; spin: number }

function particleGeometry(spec: ParticleSpec): { geometry: BufferGeometry; total: number } {
  const origins = spec.origins.length / 3
  const total = origins * spec.perOrigin
  const random = mulberry32(spec.seed)
  const position = new Float32Array(total * 3)
  const seeds = new Float32Array(total * 4)
  for (let k = 0; k < total; k++) {
    const origin = Math.floor(k / spec.perOrigin) * 3
    position[k * 3] = spec.origins[origin] ?? 0
    position[k * 3 + 1] = spec.origins[origin + 1] ?? 0
    position[k * 3 + 2] = spec.origins[origin + 2] ?? 0
    seeds[k * 4] = random()
    seeds[k * 4 + 1] = random()
    seeds[k * 4 + 2] = random()
    seeds[k * 4 + 3] = random()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(position, 3))
  geometry.setAttribute('aOrigin', new BufferAttribute(position, 3))
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 4))
  return { geometry, total }
}

function beamGeometry(spec: BeamSpec): BufferGeometry {
  let geometry: BufferGeometry
  if (spec.shape === 'sphere') {
    geometry = new SphereGeometry(
      spec.radiusTop,
      spec.segments,
      Math.max(6, Math.round(spec.segments * SPHERE_ROWS)),
    )
  } else if (spec.shape === 'cone') {
    geometry = new ConeGeometry(spec.radiusBottom, spec.height, spec.segments, 1, true)
  } else {
    geometry = new CylinderGeometry(
      spec.radiusTop,
      spec.radiusBottom,
      spec.height,
      spec.segments,
      1,
      true,
    )
  }
  if (spec.shift !== 0) geometry.translate(0, spec.shift, 0)
  if (spec.lying) geometry.rotateZ(Math.PI / 2)
  return geometry
}

function birdsGeometry(flocks: Flock[]): InstancedBufferGeometry {
  const random = mulberry32(BIRD_SEED)
  const birds: number[][] = []
  for (const flock of flocks) {
    for (let k = 0; k < flock.count; k++) {
      birds.push([
        flock.x + (random() - 0.5) * flock.spread,
        flock.z + (random() - 0.5) * flock.spread,
        flock.radius * (0.6 + random() * 0.6),
        (random() < 0.5 ? -1 : 1) * (0.12 + random() * 0.1) * flock.speed,
        flock.y + (random() - 0.5) * 0.6,
        random() * 6.28,
        flock.scale * (0.8 + random() * 0.4),
        9 + random() * 4,
        flock.dark ? 1 : 0,
      ])
    }
  }
  const geometry = new InstancedBufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(BIRD_SHAPE, 3))
  geometry.instanceCount = birds.length
  const fly = new Float32Array(birds.length * 4)
  const flyMore = new Float32Array(birds.length * 4)
  const dark = new Float32Array(birds.length)
  for (const [index, bird] of birds.entries()) {
    fly.set(bird.slice(0, 4), index * 4)
    flyMore.set(bird.slice(4, 8), index * 4)
    dark[index] = bird[8] ?? 0
  }
  geometry.setAttribute('aFly', new InstancedBufferAttribute(fly, 4))
  geometry.setAttribute('aFly2', new InstancedBufferAttribute(flyMore, 4))
  geometry.setAttribute('aDark', new InstancedBufferAttribute(dark, 1))
  return geometry
}

function interleaved<T>(items: readonly T[]): T[] {
  return [
    ...items.filter((_, index) => index % 2 === 0),
    ...items.filter((_, index) => index % 2 === 1),
  ]
}

function cloudMesh(clouds: CloudSpec[], library: MaterialLibrary): InstancedMesh {
  const geometry = new PlaneGeometry(1, 1)
  const attributes = new Float32Array(clouds.length * 4)
  const mesh = new InstancedMesh(geometry, library.clouds(), clouds.length)
  const matrix = new Matrix4()
  for (const [index, cloud] of interleaved(clouds).entries()) {
    matrix.makeScale(cloud.size, cloud.size, cloud.size)
    matrix.setPosition(cloud.x, cloud.y, cloud.z)
    mesh.setMatrixAt(index, matrix)
    attributes[index * 4] = cloud.seed
    attributes[index * 4 + 1] = cloud.opacity
    attributes[index * 4 + 2] = cloud.drift
  }
  geometry.setAttribute('aCloud', new InstancedBufferAttribute(attributes, 4))
  mesh.instanceMatrix.needsUpdate = true
  mesh.frustumCulled = false
  mesh.renderOrder = 8
  mesh.name = 'clouds'
  return mesh
}

const POOL_SEGMENTS = 24

function poolMesh(pools: LightPool[], library: MaterialLibrary): Mesh {
  const disc = new CircleGeometry(1, POOL_SEGMENTS).rotateX(-Math.PI / 2)
  const geometry = new InstancedBufferGeometry()
  geometry.setIndex(disc.index)
  geometry.setAttribute('position', disc.getAttribute('position'))
  geometry.instanceCount = pools.length
  const placement = new Float32Array(pools.length * 4)
  const strength = new Float32Array(pools.length)
  for (const [index, pool] of pools.entries()) {
    placement.set([pool.x, pool.y, pool.z, pool.radius], index * 4)
    strength[index] = pool.strength
  }
  geometry.setAttribute('aPool', new InstancedBufferAttribute(placement, 4))
  geometry.setAttribute('aStrength', new InstancedBufferAttribute(strength, 1))
  const mesh = new Mesh(geometry, library.lightPools())
  mesh.frustumCulled = false
  mesh.renderOrder = 4
  mesh.name = 'light-pools'
  return mesh
}

export class EffectsView {
  private readonly library: MaterialLibrary
  private readonly particles: Particles[] = []
  private readonly spinners: Spinner[] = []
  private readonly owned: (Mesh | Points | InstancedMesh)[] = []
  private readonly shared: Mesh[] = []
  private readonly sorted: Record<EffectGroup, (Mesh | Points | InstancedMesh)[]> = {
    clouds: [],
    birds: [],
    particles: [],
    glows: [],
  }
  private clouds: InstancedMesh | undefined
  private settings: TierSettings
  private shown: Readonly<Record<EffectGroup, boolean>>

  constructor(
    library: MaterialLibrary,
    settings: TierSettings,
    shown: Readonly<Record<EffectGroup, boolean>>,
  ) {
    this.library = library
    this.settings = settings
    this.shown = shown
  }

  add(group: Group, surface: Group, effects: EffectsData): void {
    for (const spec of effects.particles) {
      const { geometry, total } = particleGeometry(spec)
      const points = new Points(geometry, this.library.particles(spec))
      points.frustumCulled = false
      points.renderOrder = 9
      group.add(points)
      this.particles.push({ points, spec, total })
      this.own(points, 'particles')
    }
    for (const spec of effects.beams) {
      const mesh = new Mesh(beamGeometry(spec), this.library.beam(spec))
      mesh.position.set(...spec.position)
      mesh.rotation.set(0, spec.turn, spec.tilt)
      group.add(mesh)
      this.own(mesh, 'glows')
      if (spec.spin !== 0) this.spinners.push({ mesh, spin: spec.spin })
    }
    for (const spec of effects.vortices) {
      const mesh = new Mesh(new CircleGeometry(spec.radius, 40), this.library.vortex(spec.colour))
      mesh.position.set(...spec.position)
      mesh.rotation.y = spec.turn
      group.add(mesh)
      this.own(mesh, 'glows')
    }
    if (effects.glows.length > 0) {
      const geometry = new BufferGeometry()
      geometry.setAttribute(
        'position',
        new Float32BufferAttribute(
          effects.glows.flatMap((glow) => glow.position),
          3,
        ),
      )
      geometry.setAttribute(
        'aColour',
        new Float32BufferAttribute(
          effects.glows.flatMap((glow) => glow.colour),
          3,
        ),
      )
      geometry.setAttribute(
        'aSize',
        new Float32BufferAttribute(
          effects.glows.map((glow) => glow.size),
          1,
        ),
      )
      const points = new Points(geometry, this.library.glows())
      points.frustumCulled = false
      points.renderOrder = 9
      group.add(points)
      this.own(points, 'glows')
    }
    if (effects.flocks.length > 0) {
      const birds = new Mesh(birdsGeometry(effects.flocks), this.library.birds())
      birds.frustumCulled = false
      birds.name = 'birds'
      group.add(birds)
      this.own(birds, 'birds')
    }
    if (effects.clouds.length > 0) {
      const clouds = cloudMesh(effects.clouds, this.library)
      group.add(clouds)
      this.own(clouds, 'clouds')
      this.clouds = clouds
    }
    if (effects.pools.length > 0) {
      const pools = poolMesh(effects.pools, this.library)
      group.add(pools)
      this.own(pools, 'glows')
    }
    if (effects.falls) {
      const falls = new Mesh(geometryOf(effects.falls, 'ribbon'), this.library.piece('waterfall'))
      falls.name = 'waterfalls'
      surface.add(falls)
      this.shared.push(falls)
    }
    this.apply(this.settings)
  }

  apply(settings: TierSettings): void {
    this.settings = settings
    for (const { points, total } of this.particles) {
      points.geometry.setDrawRange(0, Math.max(1, Math.round(total * settings.particleShare)))
    }
    this.show()
    if (this.clouds) {
      const all = this.clouds.instanceMatrix.count
      this.clouds.count = settings.clouds === 'reduced' ? Math.round(all * REDUCED_CLOUDS) : all
    }
  }

  setShown(shown: Readonly<Record<EffectGroup, boolean>>): void {
    this.shown = shown
    this.show()
  }

  update(time: number): void {
    for (const { mesh, spin } of this.spinners) mesh.rotation.y = time * spin
  }

  dispose(): void {
    for (const object of this.owned) {
      object.removeFromParent()
      object.geometry.dispose()
      const { material } = object
      if (Array.isArray(material)) for (const entry of material) entry.dispose()
      else material.dispose()
    }
    for (const mesh of this.shared) {
      mesh.removeFromParent()
      mesh.geometry.dispose()
    }
    this.owned.length = 0
    this.shared.length = 0
    for (const list of Object.values(this.sorted)) list.length = 0
    this.particles.length = 0
    this.spinners.length = 0
  }

  private own(object: Mesh | Points | InstancedMesh, group: EffectGroup): void {
    this.owned.push(object)
    this.sorted[group].push(object)
    object.visible = this.shown[group]
  }

  private show(): void {
    for (const group of EFFECT_GROUPS) {
      const shown = this.shown[group] && (group !== 'birds' || this.settings.birds)
      for (const object of this.sorted[group]) object.visible = shown
    }
  }
}
