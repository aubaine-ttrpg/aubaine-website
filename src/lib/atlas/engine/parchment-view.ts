import {
  type DataArrayTexture,
  type DataTexture,
  Group,
  Mesh,
  type MeshStandardMaterial,
  PlaneGeometry,
} from 'three'
import { ROUTE_LAYERS, type RouteLayer } from '../contract/display.ts'
import { LANE_FLOATS, type ParchmentTextures } from '../contract/parchment.ts'
import type { Grid } from '../world/grid.ts'
import type { MaterialLibrary } from './materials/library.ts'
import type { SharedUniforms } from './materials/uniforms.ts'
import { tileTexture } from './tile-texture.ts'

const SHEET_SIZE = 1400
export const SHEET_ORDER = 1000

export class ParchmentView {
  readonly group = new Group()
  private readonly uniforms: SharedUniforms
  private readonly sheet: Mesh<PlaneGeometry, MeshStandardMaterial>
  private tiles: DataTexture[] = []
  private routes: DataTexture | undefined
  private glyphs: DataArrayTexture | undefined

  constructor(library: MaterialLibrary) {
    this.uniforms = library.uniforms
    this.sheet = new Mesh(
      new PlaneGeometry(SHEET_SIZE, SHEET_SIZE).rotateX(-Math.PI / 2),
      library.parchment(),
    )
    this.sheet.frustumCulled = false
    this.sheet.renderOrder = SHEET_ORDER
    this.group.name = 'parchment'
    this.group.add(this.sheet)
    this.group.visible = false
  }

  set shown(shown: boolean) {
    this.group.visible = shown
  }

  setFade(amount: number): void {
    this.sheet.material.opacity = amount
  }

  receive(textures: ParchmentTextures, grid: Grid, level: number): void {
    this.tiles = textures.tiles.map((data) => tileTexture(data, grid))
    this.routes = tileTexture(textures.routes, grid)
    this.uniforms.uParchmentRoutes.value = this.routes
    const lanes = this.uniforms.uLanes.value
    const count = textures.lanes.length / LANE_FLOATS
    for (let index = 0; index < count; index++) {
      const at = index * LANE_FLOATS
      lanes[index]?.fromArray(textures.lanes, at)
    }
    this.uniforms.uLaneCount.value = count
    this.setLevel(level)
  }

  setLevel(level: number): void {
    this.uniforms.uParchment.value = this.tiles[level] ?? null
  }

  setRoutes(routes: Readonly<Record<RouteLayer, boolean>>): void {
    const shown = this.uniforms.uShowRoute.value
    ROUTE_LAYERS.forEach((layer, index) => {
      shown[index] = routes[layer] ? 1 : 0
    })
  }

  setGlyphs(glyphs: DataArrayTexture): void {
    this.glyphs = glyphs
    this.uniforms.uGlyphs.value = glyphs
    this.uniforms.uGlyphsOn.value = 1
  }

  dispose(): void {
    this.sheet.geometry.dispose()
    for (const texture of this.tiles) texture.dispose()
    this.routes?.dispose()
    this.glyphs?.dispose()
  }
}
