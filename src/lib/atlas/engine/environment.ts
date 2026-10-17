import {
  BackSide,
  CubeCamera,
  HalfFloatType,
  Mesh,
  PMREMGenerator,
  Scene,
  type ShaderMaterial,
  SphereGeometry,
  WebGLCubeRenderTarget,
  type WebGLRenderer,
  type WebGLRenderTarget,
} from 'three'

const CUBE_SIZE = 64
const DOME_RADIUS = 50
const REBAKE_MS = 120

export class SkyEnvironment {
  private readonly renderer: WebGLRenderer
  private readonly target: Scene
  private readonly sky = new Scene()
  private readonly cube = new WebGLCubeRenderTarget(CUBE_SIZE, { type: HalfFloatType })
  private readonly camera = new CubeCamera(1, DOME_RADIUS * 2, this.cube)
  private readonly generator: PMREMGenerator
  private readonly dome: Mesh<SphereGeometry, ShaderMaterial>
  private readonly wake: () => void
  private filtered: WebGLRenderTarget | undefined
  private stale = true
  private lastBake = Number.NEGATIVE_INFINITY
  private timer = 0

  constructor(renderer: WebGLRenderer, target: Scene, material: ShaderMaterial, wake: () => void) {
    this.renderer = renderer
    this.target = target
    this.wake = wake
    this.generator = new PMREMGenerator(renderer)
    material.side = BackSide
    this.dome = new Mesh(new SphereGeometry(DOME_RADIUS, 32, 16), material)
    this.dome.frustumCulled = false
    this.sky.add(this.dome)
    this.bake(performance.now())
  }

  invalidate(): void {
    this.stale = true
  }

  update(now: number): void {
    if (!this.stale) return
    const wait = this.lastBake + REBAKE_MS - now
    if (wait <= 0) {
      this.bake(now)
      return
    }
    if (this.timer !== 0) return
    this.timer = window.setTimeout(() => {
      this.timer = 0
      this.wake()
    }, wait)
  }

  dispose(): void {
    window.clearTimeout(this.timer)
    this.filtered?.dispose()
    this.cube.dispose()
    this.generator.dispose()
    this.dome.geometry.dispose()
    this.dome.material.dispose()
  }

  private bake(now: number): void {
    this.stale = false
    this.lastBake = now
    this.camera.update(this.renderer, this.sky)
    this.filtered = this.filtered
      ? this.generator.fromCubemap(this.cube.texture, this.filtered)
      : this.generator.fromCubemap(this.cube.texture)
    this.target.environment = this.filtered.texture
  }
}
