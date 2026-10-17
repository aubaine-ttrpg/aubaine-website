import {
  BufferGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Mesh,
  type Scene,
  Sphere,
  type Vector3,
} from 'three'
import { ROUTE_LAYER_OF_PIECE, ROUTE_LAYER_OF_PROP, type RouteLayer } from '../contract/display.ts'
import type {
  Piece,
  PieceMaterial,
  PropModel,
  PropSet,
  PrototypeData,
  SceneLayer,
  TerrainChunk,
} from '../contract/scene.ts'
import { boxOf, geometryOf, layoutOf } from './geometry.ts'
import type { MaterialLibrary } from './materials/library.ts'

const RENDER_ORDER: Partial<Record<PieceMaterial, number>> = {
  water: 2,
  abyss: 2,
  'mist-depth': 3.5,
  mist: 4,
  river: 3,
  'sea-lane': 3,
  'sky-lane': 3,
  'under-water': 2,
}

const RECEIVES: ReadonlySet<PieceMaterial> = new Set([
  'terrain-top',
  'sky-top',
  'under-top',
  'terrain-wall',
  'under-wall',
  'road',
  'trail',
  'ballast',
  'rail',
])

const DETAIL_REACH = [20, 60] as const
const DETAIL_HYSTERESIS = 0.1
const RISE_DEPTH = 1.6
const RISE_MS = 650

type ChunkMeshes = { generation: number; meshes: Mesh[] }

type Rise = { meshes: Mesh[]; start: number | undefined }

type Prototype = { data: PrototypeData; geometries: BufferGeometry[] }

export type PropInstances = {
  mesh: InstancedMesh
  set: PropSet
  full: number
  details: BufferGeometry[]
  detail: number
}

function instancedShape(shape: BufferGeometry, tints: InstancedBufferAttribute): BufferGeometry {
  const geometry = new BufferGeometry()
  for (const name of Object.keys(shape.attributes))
    geometry.setAttribute(name, shape.getAttribute(name))
  geometry.setIndex(shape.index)
  geometry.setAttribute('aTint', tints)
  return geometry
}

function detailAt(distance: number, current: number, reaches: readonly number[]): number {
  let detail = 0
  for (const [level, reach] of reaches.entries()) {
    if (distance > reach * (current > level ? 1 - DETAIL_HYSTERESIS : 1 + DETAIL_HYSTERESIS))
      detail = level + 1
  }
  return detail
}

function layerGroups(scene: Scene): Record<SceneLayer, Group> {
  const make = (layer: SceneLayer) => {
    const group = new Group()
    group.name = layer
    scene.add(group)
    return group
  }
  return {
    surface: make('surface'),
    sky: make('sky'),
    routes: make('routes'),
    effects: make('effects'),
    'under-1': make('under-1'),
    'under-2': make('under-2'),
  }
}

function lift(mesh: Mesh, y: number): void {
  mesh.position.y = y
  mesh.updateMatrix()
}

function freeze(mesh: Mesh): Mesh {
  mesh.matrixAutoUpdate = false
  mesh.updateMatrix()
  return mesh
}

export class SceneContent {
  readonly groups: Record<SceneLayer, Group>
  readonly props: PropInstances[] = []
  readonly landmarks: Mesh[] = []
  private readonly materials: MaterialLibrary
  private readonly chunks = new Map<number, ChunkMeshes>()
  private readonly pieceMeshes = new Map<SceneLayer, Mesh[]>()
  private readonly prototypes = new Map<string, Prototype>()
  private density = 1
  private propShadows = true
  private overview = false
  private reveals = true
  private routes: Readonly<Record<RouteLayer, boolean>>
  private readonly routePieces: { mesh: Mesh; layer: RouteLayer }[] = []
  private readonly rises: Rise[] = []
  private changed = false

  constructor(
    scene: Scene,
    materials: MaterialLibrary,
    routes: Readonly<Record<RouteLayer, boolean>>,
  ) {
    this.groups = layerGroups(scene)
    this.materials = materials
    this.routes = routes
  }

  setRoutes(routes: Readonly<Record<RouteLayer, boolean>>): void {
    this.routes = routes
    for (const { mesh, layer } of this.routePieces) mesh.visible = routes[layer]
    for (const { mesh, set } of this.props) mesh.visible = this.shows(set)
    this.changed = true
  }

  takeChanged(): boolean {
    const changed = this.changed
    this.changed = false
    return changed
  }

  terrain(generation: number, chunk: TerrainChunk): void {
    const previous = this.chunks.get(chunk.chunk)
    if (previous && previous.generation > generation) return
    const meshes: Mesh[] = []
    if (chunk.tops)
      meshes.push(this.piece({ material: 'terrain-top', mesh: chunk.tops, casts: true }))
    if (chunk.walls)
      meshes.push(this.piece({ material: 'terrain-wall', mesh: chunk.walls, casts: true }))
    if (chunk.tunnels)
      meshes.push(this.piece({ material: 'tunnel', mesh: chunk.tunnels, casts: false }))
    for (const mesh of meshes) this.groups.surface.add(mesh)
    if (previous) this.release(previous.meshes)
    else if (this.reveals) this.startRise(meshes)
    this.chunks.set(chunk.chunk, { generation, meshes })
    this.changed = true
  }

  setReveals(reveals: boolean): void {
    this.reveals = reveals
    if (!reveals) this.finishRises()
  }

  rise(now: number): boolean {
    if (this.rises.length === 0) return false
    for (const rise of this.rises) {
      rise.start ??= now
      const left = 1 - Math.min(1, (now - rise.start) / RISE_MS)
      for (const mesh of rise.meshes) lift(mesh, -RISE_DEPTH * left * left * left)
    }
    const settled = this.rises.filter(
      (rise) => rise.start !== undefined && now - rise.start >= RISE_MS,
    )
    if (settled.length > 0) {
      this.rises.splice(
        0,
        this.rises.length,
        ...this.rises.filter((rise) => !settled.includes(rise)),
      )
      this.changed = true
    }
    return true
  }

  pieces(layer: SceneLayer, pieces: Piece[]): void {
    const meshes = pieces.map((piece) => {
      const mesh = this.piece(piece)
      const route = ROUTE_LAYER_OF_PIECE[piece.material]
      if (route) {
        mesh.visible = this.routes[route]
        this.routePieces.push({ mesh, layer: route })
      }
      return mesh
    })
    for (const mesh of meshes) this.groups[layer].add(mesh)
    this.pieceMeshes.set(layer, [...(this.pieceMeshes.get(layer) ?? []), ...meshes])
    this.changed = true
  }

  addPrototypes(prototypes: PrototypeData[]): void {
    for (const data of prototypes) {
      if (this.prototypes.has(data.key)) continue
      this.prototypes.set(data.key, {
        data,
        geometries: data.lods.map((lod) => geometryOf(lod, 'prop')),
      })
    }
  }

  addProps(sets: PropSet[]): void {
    for (const set of sets) {
      const prototype = this.prototypes.get(set.prototype)
      if (!prototype) throw new Error(`no prototype ${set.prototype} for a prop set`)
      const tints = new InstancedBufferAttribute(set.tints, 4, true)
      const shapes = set.range === 'far' ? prototype.geometries.slice(-1) : prototype.geometries
      const details = shapes.map((shape) => instancedShape(shape, tints))
      const [nearest] = details
      if (!nearest) throw new Error(`prototype ${set.prototype} has no detail level`)
      const full = set.matrices.length / 16
      const mesh = new InstancedMesh(
        nearest,
        this.materials.prop(prototype.data.family, prototype.data.doubleSided),
        0,
      )
      mesh.instanceMatrix = new InstancedBufferAttribute(set.matrices, 16)
      mesh.boundingBox = boxOf(set.bounds)
      mesh.boundingSphere = mesh.boundingBox.getBoundingSphere(new Sphere())
      mesh.castShadow = prototype.data.casts && this.propShadows
      mesh.receiveShadow = true
      mesh.matrixAutoUpdate = false
      mesh.count = set.thinned ? Math.max(1, Math.round(full * this.density)) : full
      mesh.visible = this.shows(set)
      this.groups[set.layer].add(mesh)
      this.props.push({ mesh, set, full, details, detail: 0 })
    }
    this.changed = true
  }

  addModels(models: PropModel[]): void {
    for (const model of models) {
      const mesh = new Mesh(
        geometryOf(model.mesh, 'prop'),
        this.materials.prop(model.family, model.doubleSided),
      )
      mesh.position.set(...model.position)
      mesh.rotation.y = model.turn
      mesh.scale.setScalar(model.scale)
      mesh.castShadow = model.casts
      mesh.receiveShadow = true
      mesh.userData['landmark'] = model.landmark
      freeze(mesh)
      this.groups[model.layer].add(mesh)
      if (model.landmark >= 0) this.landmarks.push(mesh)
    }
    this.changed = true
  }

  setDensity(density: number): void {
    this.density = density
    for (const { mesh, set, full } of this.props) {
      mesh.count = set.thinned ? Math.max(1, Math.round(full * density)) : full
    }
    this.changed = true
  }

  frameDetail(eye: Vector3, overview: boolean, nearDetail: number): void {
    if (overview !== this.overview) {
      this.overview = overview
      for (const { mesh, set } of this.props) mesh.visible = this.shows(set)
      this.changed = true
    }
    const reaches = [DETAIL_REACH[0] * nearDetail, DETAIL_REACH[1] * Math.max(1, nearDetail)]
    for (const props of this.props) {
      const { mesh, details } = props
      if (!mesh.visible || details.length < 2 || !mesh.boundingBox) continue
      const detail = Math.min(
        details.length - 1,
        detailAt(mesh.boundingBox.distanceToPoint(eye), props.detail, reaches),
      )
      const shape = details[detail]
      if (detail === props.detail || !shape) continue
      props.detail = detail
      mesh.geometry = shape
      this.changed = true
    }
  }

  setPropShadows(on: boolean): boolean {
    if (on === this.propShadows) return false
    this.propShadows = on
    for (const { mesh, set } of this.props) {
      const prototype = this.prototypes.get(set.prototype)
      mesh.castShadow = on && (prototype?.data.casts ?? false)
    }
    return true
  }

  dispose(): void {
    for (const { meshes } of this.chunks.values()) this.release(meshes)
    for (const meshes of this.pieceMeshes.values()) this.release(meshes)
    for (const { mesh, details } of this.props) {
      mesh.removeFromParent()
      for (const shape of details) shape.dispose()
      mesh.dispose()
    }
    for (const mesh of this.landmarks) {
      mesh.removeFromParent()
      mesh.geometry.dispose()
    }
    for (const prototype of this.prototypes.values())
      for (const geometry of prototype.geometries) geometry.dispose()
    this.chunks.clear()
    this.pieceMeshes.clear()
    this.prototypes.clear()
    this.props.length = 0
    this.landmarks.length = 0
    this.routePieces.length = 0
  }

  private piece(piece: Piece): Mesh {
    const mesh = new Mesh(
      geometryOf(piece.mesh, layoutOf(piece.material)),
      this.materials.piece(piece.material),
    )
    mesh.castShadow = piece.casts
    mesh.receiveShadow = RECEIVES.has(piece.material)
    mesh.renderOrder = RENDER_ORDER[piece.material] ?? 0
    return freeze(mesh)
  }

  private startRise(meshes: Mesh[]): void {
    for (const mesh of meshes) lift(mesh, -RISE_DEPTH)
    this.rises.push({ meshes, start: undefined })
  }

  private finishRises(): void {
    for (const rise of this.rises) for (const mesh of rise.meshes) lift(mesh, 0)
    this.rises.length = 0
    this.changed = true
  }

  private shows(set: PropSet): boolean {
    const route = set.layer === 'routes' ? ROUTE_LAYER_OF_PROP[set.prototype] : undefined
    return this.inRange(set) && (route === undefined || this.routes[route])
  }

  private inRange(set: PropSet): boolean {
    if (set.range === 'always') return true
    return (set.range === 'far') === this.overview
  }

  private release(meshes: Mesh[]): void {
    for (const mesh of meshes) {
      mesh.removeFromParent()
      mesh.geometry.dispose()
    }
  }
}
