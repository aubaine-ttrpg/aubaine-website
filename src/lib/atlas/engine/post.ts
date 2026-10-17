import {
  AdditiveBlending,
  BufferGeometry,
  type Camera,
  DataTexture,
  Float32BufferAttribute,
  HalfFloatType,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  type Texture,
  UnsignedByteType,
  Vector2,
  Vector3,
  type WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import bloomBright from './materials/glsl/bloom-bright.frag?raw'
import bloomDown from './materials/glsl/bloom-down.frag?raw'
import bloomUp from './materials/glsl/bloom-up.frag?raw'
import fullscreen from './materials/glsl/fullscreen.vert?raw'
import gradeFragment from './materials/glsl/grade.frag?raw'
import postCommon from './materials/glsl/post-common.glsl?raw'
import presentFragment from './materials/glsl/present.frag?raw'
import screen from './materials/glsl/screen.glsl?raw'

export type PostSettings = {
  samples: number
  bloomLevels: number
  bloomScale: number
  fxaa: boolean
  renderScale: number
}

type Uniform<T> = { value: T }

type SampleUniforms = { tSrc: Uniform<Texture | null>; uTex: Uniform<Vector2> }

type ScreenUniforms = {
  uTime: Uniform<number>
  uScreen: Uniform<number>
  uScan: Uniform<number>
  uVig: Uniform<number>
  uRes: Uniform<Vector2>
}

export type GradeUniforms = ScreenUniforms & {
  tScene: Uniform<Texture | null>
  tBloom: Uniform<Texture | null>
  uBloom: Uniform<number>
  uExpo: Uniform<number>
  uSat: Uniform<number>
  uContrast: Uniform<number>
  uTint: Uniform<Vector3>
  uLift: Uniform<Vector3>
  uGamma: Uniform<Vector3>
  uGain: Uniform<Vector3>
  uSrc: Uniform<Vector2>
  uSharp: Uniform<number>
}

type PresentUniforms = ScreenUniforms & {
  tGraded: Uniform<Texture | null>
  uSrc: Uniform<Vector2>
  uSrcSize: Uniform<Vector2>
  uSharp: Uniform<number>
}

const SCANLINE_STRENGTH = 0.19
const INLINE_SHARPEN = 0.22
const FXAA_SHARPEN = 0.12
const BICUBIC_SHARPEN = 0.16

const sampling = (): SampleUniforms => ({ tSrc: { value: null }, uTex: { value: new Vector2() } })

const pass = (
  fragmentShader: string,
  uniforms: Record<string, Uniform<unknown>>,
  additive = false,
) =>
  new ShaderMaterial({
    uniforms,
    vertexShader: fullscreen,
    fragmentShader: postCommon + fragmentShader,
    depthTest: false,
    depthWrite: false,
    ...(additive ? { blending: AdditiveBlending, transparent: true } : {}),
  })

export function scanlineStrength(canvasHeight: number): number {
  const pitch = Math.max(2, Math.round(canvasHeight / 360))
  return SCANLINE_STRENGTH * Math.min(1, Math.max(0, (pitch - 1.6) / 1.4))
}

export function renderSize(canvas: number, scale: number): number {
  return Math.max(2, Math.round(canvas * scale))
}

function splitsPresent(settings: PostSettings): boolean {
  return settings.fxaa || settings.renderScale < 1
}

export class PostPipeline {
  readonly bloomThreshold: Uniform<number> = { value: 1 }
  readonly gradeUniforms: GradeUniforms
  readonly probes = new Scene()
  readonly probeCamera: Camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private readonly renderer: WebGLRenderer
  private readonly quad: Mesh<BufferGeometry, ShaderMaterial>
  private readonly brightUniforms = { ...sampling(), uTh: this.bloomThreshold }
  private readonly downUniforms = sampling()
  private readonly upUniforms = { ...sampling(), uR: { value: 0.85 } }
  private readonly presentUniforms: PresentUniforms
  private readonly black = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
  private readonly bright: ShaderMaterial
  private readonly down: ShaderMaterial
  private readonly up: ShaderMaterial
  private readonly grade: ShaderMaterial
  private readonly present: ShaderMaterial
  private main: WebGLRenderTarget | undefined
  private graded: WebGLRenderTarget | undefined
  private mips: WebGLRenderTarget[] = []
  private settings: PostSettings
  private stale = true
  private canvasWidth = 1
  private canvasHeight = 1

  constructor(renderer: WebGLRenderer, settings: PostSettings, time: Uniform<number>) {
    this.renderer = renderer
    this.settings = settings
    this.black.needsUpdate = true
    const geometry = new BufferGeometry()
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
    )
    const screenUniforms: ScreenUniforms = {
      uTime: time,
      uScreen: { value: 1 },
      uScan: { value: 0 },
      uVig: { value: 0.26 },
      uRes: { value: new Vector2(1, 1) },
    }
    this.gradeUniforms = {
      ...screenUniforms,
      tScene: { value: null },
      tBloom: { value: null },
      uBloom: { value: 0.3 },
      uExpo: { value: 1 },
      uSat: { value: 1 },
      uContrast: { value: 0.2 },
      uTint: { value: new Vector3(1, 1, 1) },
      uLift: { value: new Vector3(0, 0, 0) },
      uGamma: { value: new Vector3(1, 1, 1) },
      uGain: { value: new Vector3(1, 1, 1) },
      uSrc: { value: new Vector2(1, 1) },
      uSharp: { value: INLINE_SHARPEN },
    }
    this.presentUniforms = {
      ...screenUniforms,
      tGraded: { value: null },
      uSrc: { value: new Vector2(1, 1) },
      uSrcSize: { value: new Vector2(1, 1) },
      uSharp: { value: BICUBIC_SHARPEN },
    }
    this.bright = pass(bloomBright, this.brightUniforms)
    this.down = pass(bloomDown, this.downUniforms)
    this.up = pass(bloomUp, this.upUniforms, true)
    this.grade = pass(screen + gradeFragment, this.gradeUniforms)
    this.present = pass(screen + presentFragment, this.presentUniforms)
    this.applyVariants()
    this.quad = new Mesh(geometry, this.grade)
    this.quad.frustumCulled = false
    for (const material of [this.bright, this.down, this.up, this.grade, this.present]) {
      const probe = new Mesh(geometry, material)
      probe.frustumCulled = false
      this.probes.add(probe)
    }
  }

  configure(settings: PostSettings): void {
    const previous = this.settings
    this.settings = settings
    if (previous.fxaa !== settings.fxaa || splitsPresent(previous) !== splitsPresent(settings)) {
      this.applyVariants()
    }
    if (
      previous.samples !== settings.samples ||
      previous.bloomLevels !== settings.bloomLevels ||
      previous.bloomScale !== settings.bloomScale ||
      previous.renderScale !== settings.renderScale ||
      splitsPresent(previous) !== splitsPresent(settings)
    ) {
      this.stale = true
    }
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    if (
      !this.stale &&
      canvasWidth === this.canvasWidth &&
      canvasHeight === this.canvasHeight &&
      this.main
    ) {
      return
    }
    this.allocate(canvasWidth, canvasHeight)
  }

  get targetsReady(): boolean {
    return this.main !== undefined
  }

  get renderHeight(): number {
    return renderSize(this.canvasHeight, this.settings.renderScale)
  }

  setScreen(on: boolean): void {
    this.gradeUniforms.uScreen.value = on ? 1 : 0
  }

  render(scene: Scene, camera: Camera): void {
    const main = this.main
    if (!main) return
    const { renderer } = this
    renderer.setRenderTarget(main)
    renderer.render(scene, camera)
    const [first] = this.mips
    if (first) {
      this.brightUniforms.tSrc.value = main.texture
      this.brightUniforms.uTex.value.set(0.5 / main.width, 0.5 / main.height)
      this.run(this.bright, first)
      for (let k = 1; k < this.mips.length; k++) {
        const source = this.mips[k - 1]
        const target = this.mips[k]
        if (!source || !target) continue
        this.downUniforms.tSrc.value = source.texture
        this.downUniforms.uTex.value.set(1 / source.width, 1 / source.height)
        this.run(this.down, target)
      }
      renderer.autoClear = false
      for (let k = this.mips.length - 1; k > 0; k--) {
        const source = this.mips[k]
        const target = this.mips[k - 1]
        if (!source || !target) continue
        this.upUniforms.tSrc.value = source.texture
        this.upUniforms.uTex.value.set(1 / source.width, 1 / source.height)
        this.run(this.up, target)
      }
      renderer.autoClear = true
    }
    this.gradeUniforms.tScene.value = main.texture
    this.gradeUniforms.tBloom.value = first ? first.texture : this.black
    const graded = this.graded
    if (!graded) {
      this.run(this.grade, null)
      return
    }
    this.run(this.grade, graded)
    this.presentUniforms.tGraded.value = graded.texture
    this.run(this.present, null)
  }

  dispose(): void {
    this.disposeTargets()
    this.bright.dispose()
    this.down.dispose()
    this.up.dispose()
    this.grade.dispose()
    this.present.dispose()
    this.quad.geometry.dispose()
    this.black.dispose()
    this.probes.clear()
  }

  private applyVariants(): void {
    const split = splitsPresent(this.settings)
    this.grade.defines = split ? {} : { GRADE_PRESENT: '' }
    this.grade.needsUpdate = true
    this.present.defines = this.settings.fxaa ? { PRESENT_FXAA: '' } : {}
    this.present.needsUpdate = true
    this.presentUniforms.uSharp.value = this.settings.fxaa ? FXAA_SHARPEN : BICUBIC_SHARPEN
  }

  private run(material: ShaderMaterial, target: WebGLRenderTarget | null): void {
    this.quad.material = material
    this.renderer.setRenderTarget(target)
    this.renderer.render(this.quad, this.probeCamera)
  }

  private disposeTargets(): void {
    this.main?.dispose()
    this.graded?.dispose()
    for (const target of this.mips) target.dispose()
    this.mips = []
    this.main = undefined
    this.graded = undefined
  }

  private allocate(canvasWidth: number, canvasHeight: number): void {
    this.stale = false
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.disposeTargets()
    const width = renderSize(canvasWidth, this.settings.renderScale)
    const height = renderSize(canvasHeight, this.settings.renderScale)
    this.main = new WebGLRenderTarget(width, height, {
      type: HalfFloatType,
      samples: this.settings.samples,
      depthBuffer: true,
    })
    if (splitsPresent(this.settings)) {
      this.graded = new WebGLRenderTarget(width, height, {
        type: UnsignedByteType,
        depthBuffer: false,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
      })
    }
    let mipWidth = Math.max(2, Math.round(width * this.settings.bloomScale))
    let mipHeight = Math.max(2, Math.round(height * this.settings.bloomScale))
    for (let level = 0; level < this.settings.bloomLevels; level++) {
      this.mips.push(
        new WebGLRenderTarget(mipWidth, mipHeight, { type: HalfFloatType, depthBuffer: false }),
      )
      mipWidth = Math.max(2, mipWidth >> 1)
      mipHeight = Math.max(2, mipHeight >> 1)
    }
    this.gradeUniforms.uRes.value.set(canvasWidth, canvasHeight)
    this.gradeUniforms.uSrc.value.set(1 / width, 1 / height)
    this.gradeUniforms.uScan.value = scanlineStrength(canvasHeight)
    this.presentUniforms.uSrc.value.set(1 / width, 1 / height)
    this.presentUniforms.uSrcSize.value.set(width, height)
  }
}
