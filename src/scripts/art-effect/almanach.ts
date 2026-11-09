import {
  Box3,
  CanvasTexture,
  Color,
  DirectionalLight,
  Group,
  HalfFloatType,
  LinearFilter,
  LinearMipmapLinearFilter,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  NoColorSpace,
  type Object3D,
  ObjectSpaceNormalMap,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Ray,
  Raycaster,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Sphere,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import {
  ALMANACH_FIT,
  ALMANACH_STYLE,
  type AlmanachBattery,
  type AlmanachBoot,
  type AlmanachColour,
  type AlmanachFinishName,
  type AlmanachFit,
  type AlmanachMagic,
  isAlmanachColour,
} from '../../lib/art-effect/almanach-look'
import {
  bell,
  clamp01,
  easeIn,
  easeInOut,
  easeOut,
  easeOutBack,
  hash,
  ramp,
} from '../cadran/curves'
import { CADRAN_SWITCH_AT } from '../cadran/emblem'
import type { Rgb } from '../cadran/ink'
import {
  type CadranAudio,
  chime,
  createLimiter,
  degauss,
  hiss,
  ignite,
  noiseBuffer,
  ping,
  powerThunk,
  staticBurst,
  tone,
} from '../cadran/sound'
import { gpuReport, rendersInSoftware } from '../gpu'
import {
  CADRAN_CALM_FAST_SWITCH,
  CADRAN_FAST_OPEN,
  CADRAN_FAST_SWITCH,
  CADRAN_PACE,
  type CadranBattery,
  type CadranFrame,
  cadranFrame,
  cadranSwitchDelay,
  cadranTime,
  paintCadran,
} from './almanach-cadran'
import {
  BODY_FRAGMENT_COAT,
  BODY_FRAGMENT_EMISSIVE,
  BODY_FRAGMENT_HEAD,
  BODY_FRAGMENT_ROUGHNESS,
  BODY_FRAGMENT_SURFACE,
  BODY_FRAGMENT_TEXTURED,
  BODY_VERTEX_HEAD,
  BODY_VERTEX_TAIL,
  CRT_FRAGMENT,
  CRT_VERTEX,
} from './almanach-shaders'
import { prepareOnApproach } from './approach'
import { MeshoptDecoder } from './vendor/meshopt-decoder.js'

export type AlmanachPicture = {
  readonly src: string
  readonly alt: string
  readonly fit?: AlmanachFit
  readonly focus?: readonly [number, number]
  readonly mirrored?: boolean
}

export type AlmanachTexture = {
  readonly color: string
  readonly surface: string
  readonly size: number
  readonly grain?: 'u' | 'v'
}

export type AlmanachFinish = {
  readonly stops: readonly [Rgb, Rgb, Rgb, Rgb]
  readonly texture?: AlmanachTexture
}

const METALS = {
  or: {
    stops: [
      [31, 14, 3],
      [136, 79, 21],
      [228, 168, 70],
      [251, 232, 134],
    ],
  },
  laiton: 'painted',
  bronze: {
    stops: [
      [28, 16, 10],
      [112, 64, 34],
      [178, 118, 72],
      [226, 190, 146],
    ],
  },
  cuivre: {
    stops: [
      [34, 13, 8],
      [146, 58, 34],
      [214, 118, 82],
      [246, 196, 168],
    ],
  },
  'or-rose': {
    stops: [
      [38, 18, 18],
      [170, 96, 86],
      [226, 160, 144],
      [250, 222, 210],
    ],
  },
  rose: {
    stops: [
      [40, 12, 28],
      [186, 74, 126],
      [236, 146, 186],
      [252, 214, 232],
    ],
  },
  argent: {
    stops: [
      [20, 21, 24],
      [112, 115, 122],
      [190, 193, 200],
      [238, 240, 244],
    ],
  },
  fer: {
    stops: [
      [8, 9, 11],
      [38, 41, 47],
      [86, 91, 101],
      [160, 166, 178],
    ],
  },
  'vert-de-gris': {
    stops: [
      [12, 24, 20],
      [58, 118, 98],
      [122, 182, 156],
      [204, 236, 220],
    ],
  },
} as const satisfies Record<string, AlmanachFinish | 'painted'>

function textured(
  name: string,
  size: number,
  grain: 'u' | 'v' | undefined,
  stops: readonly [Rgb, Rgb, Rgb, Rgb],
): AlmanachFinish {
  return {
    stops,
    texture: {
      color: `materials/${name}-color.avif`,
      surface: `materials/${name}-surface.avif`,
      size,
      ...(grain ? { grain } : {}),
    },
  }
}

const TEXTURED = {
  noyer: textured('noyer', 0.7, 'u', [
    [64, 35, 11],
    [84, 48, 17],
    [96, 55, 20],
    [112, 67, 29],
  ]),
  chene: textured('chene', 0.6, 'v', [
    [147, 111, 83],
    [156, 119, 90],
    [163, 123, 93],
    [176, 132, 99],
  ]),
  acajou: textured('acajou', 0.6, 'v', [
    [44, 20, 13],
    [55, 25, 16],
    [61, 28, 18],
    [70, 33, 22],
  ]),
  ebene: textured('ebene', 0.7, 'u', [
    [36, 19, 8],
    [51, 28, 12],
    [59, 34, 16],
    [74, 44, 22],
  ]),
  palissandre: textured('palissandre', 1.1, 'v', [
    [89, 37, 11],
    [106, 48, 15],
    [115, 53, 17],
    [125, 61, 21],
  ]),
  merisier: textured('merisier', 0.8, 'u', [
    [39, 22, 13],
    [46, 27, 14],
    [50, 29, 17],
    [54, 35, 17],
  ]),
  cuir: textured('cuir', 0.25, undefined, [
    [101, 69, 35],
    [107, 74, 38],
    [111, 78, 42],
    [122, 86, 48],
  ]),
  'cuir-noir': textured('cuir-noir', 0.25, undefined, [
    [20, 20, 20],
    [25, 24, 24],
    [27, 26, 25],
    [29, 28, 27],
  ]),
  'cuir-bordeaux': textured('cuir-bordeaux', 0.25, undefined, [
    [100, 55, 40],
    [100, 55, 41],
    [100, 56, 41],
    [100, 56, 41],
  ]),
  'cuir-vieilli': textured('cuir-vieilli', 0.35, undefined, [
    [61, 26, 18],
    [68, 32, 24],
    [75, 37, 27],
    [95, 53, 37],
  ]),
} as const satisfies Record<string, AlmanachFinish>

export const ALMANACH_FINISH: Readonly<Record<AlmanachFinishName, AlmanachFinish | 'painted'>> = {
  ...METALS,
  ...TEXTURED,
}

export type AlmanachMetal = AlmanachFinishName | AlmanachFinish | AlmanachColour

export type AlmanachLook = {
  readonly metal: AlmanachMetal
  readonly trim: AlmanachMetal | 'painted'
  readonly grip: AlmanachMetal | 'painted'
  readonly gem: AlmanachColour | 'painted'
  readonly magic: AlmanachMagic | 'none'
  readonly light: AlmanachColour | 'picture'
  readonly gloss: number
  readonly metalGloss?: number
  readonly trimGloss?: number
  readonly gripGloss?: number
}

export const ALMANACH_LOOK: AlmanachLook = {
  metal: ALMANACH_STYLE.metal,
  trim: ALMANACH_STYLE.trim,
  grip: ALMANACH_STYLE.grip,
  gem: ALMANACH_STYLE.gem,
  magic: ALMANACH_STYLE.magic,
  light: ALMANACH_STYLE.light,
  gloss: ALMANACH_STYLE.gloss,
  metalGloss: ALMANACH_STYLE.metalGloss,
  trimGloss: ALMANACH_STYLE.trimGloss,
  gripGloss: ALMANACH_STYLE.gripGloss,
}

function rgbOf(hex: string): Rgb {
  const colour = new Color(hex)
  colour.convertLinearToSRGB()
  return [colour.r * 255, colour.g * 255, colour.b * 255]
}

function toward(from: Rgb, target: number, amount: number): Rgb {
  return [
    from[0] + (target - from[0]) * amount,
    from[1] + (target - from[1]) * amount,
    from[2] + (target - from[2]) * amount,
  ]
}

export function finishFromColour(hex: string): AlmanachFinish {
  const body = rgbOf(hex)
  return { stops: [toward(body, 0, 0.84), body, toward(body, 255, 0.16), toward(body, 255, 0.42)] }
}

function gripFromColour(hex: string): AlmanachFinish {
  const body = rgbOf(hex)
  return { stops: [toward(body, 0, 0.9), toward(body, 0, 0.55), body, toward(body, 255, 0.35)] }
}

function gemFromColour(hex: string): AlmanachFinish {
  const body = rgbOf(hex)
  return { stops: [toward(body, 0, 0.8), body, toward(body, 255, 0.14), toward(body, 255, 0.45)] }
}

export type AlmanachCopy = {
  readonly label: string
  readonly powerOn: string
  readonly powerOff: string
  readonly previous: string
  readonly next: string
  readonly dark: string
  readonly showing: (index: number, count: number, alt: string) => string
  readonly channel: (index: number) => string
  readonly play: string
  readonly zoomIn: string
  readonly zoomOut: string
  readonly zoom: string
}

export type AlmanachState = {
  readonly power: boolean
  readonly index: number
  readonly zoom: boolean
  readonly look: AlmanachLook
}

export type AlmanachOptions = {
  readonly model: string
  readonly pictures: readonly AlmanachPicture[]
  readonly look?: Partial<AlmanachLook>
  readonly power?: 'auto' | boolean
  readonly boot?: AlmanachBoot
  readonly crystalBoot?: AlmanachBoot
  readonly battery?: AlmanachBattery
  readonly start?: number
  readonly motion?: 'full' | 'calm'
  readonly osd?: boolean
  readonly volume?: number
  readonly controls?: boolean
  readonly copy: AlmanachCopy
  readonly environment?: string | false
  readonly onState?: (state: AlmanachState) => void
}

export type Almanach = {
  readonly ready: Promise<void>
  state(): AlmanachState
  power(on?: boolean, boot?: AlmanachBoot): void
  zoom(on?: boolean): void
  battery(level: AlmanachBattery): void
  show(index: number): void
  next(): void
  previous(): void
  look(patch: Partial<AlmanachLook>): void
  add(picture: AlmanachPicture): number
  reframe(fit: AlmanachFit, focus?: readonly [number, number]): void
  motion(mode: 'full' | 'calm'): void
  volume(level: number): void
  destroy(): void
}

type Model = {
  readonly body: Mesh
  readonly screen: Mesh
  readonly back: Mesh
  readonly crystal: Vector3
  readonly crystalRadius: number
  readonly screenBox: Box3
  readonly color: Texture
  readonly orm: Texture
  readonly normal: Texture
  readonly parts: Texture
}

type Slide = {
  texture: Texture | undefined
  loading: Promise<Texture> | undefined
  aspect: number
  light: Color
}

type Stage = {
  readonly renderer: WebGLRenderer
  readonly environment: Texture
  readonly lighting: Map<string, Promise<Texture>>
  readonly users: Set<() => void>
  width: number
  height: number
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const FINE_POINTER = '(hover: hover) and (pointer: fine)'
const LIT = 'data-almanach-lit'
const POWERED = 'data-almanach-on'
const FOV = 17
const PIXEL_BUDGET = 3_200_000
const SCREEN_ASPECT_FALLBACK = 2.3
const BOOT_HEIGHT = 384
const BOOT_LIGHT = new Color(0.05, 0.3, 0.62)
const FIELD_RATE = 30
const IDLE_RATE = 30
const DORMANT_RATE = 20
const ZOOM_LEVEL = 2
const ZOOM_TIME = 0.32
const CALM_ZOOM_TIME = 0.18
const TUBE_INSET = 0.034
const TILT = { yaw: 0.2, pitch: 0.11, reach: 0.9 }
const SWAY = { yaw: 0.022, pitch: 0.012 }
const LUMA = new Vector3(0.2126, 0.7152, 0.0722)
const EXTRA_TEXTURES = ['objectSpaceNormalTexture', 'partsTexture'] as const
const ENVIRONMENT_FILE = 'materials/almanach-environment.hdr'
const ENVIRONMENT_INTENSITY = 0.85
const LACQUER_FROM = 0.55
const MAGIC_FILE = 'materials/almanach-magic.avif'
const MAGIC_POSE = 1.85
const MAGIC_DORMANT_PACE = 0.45
const GEM_FRAME = new Vector3(0.207, -0.123, 0.95)
const GEM_LUMINANCE = 0.55

const models = new Map<string, Promise<Model>>()
const MESHOPT = { ...MeshoptDecoder, useWorkers: (): void => undefined }
let stage: Stage | undefined

const CONTEXT: WebGLContextAttributes = {
  antialias: true,
  alpha: true,
  premultipliedAlpha: true,
  powerPreference: 'default',
  failIfMajorPerformanceCaveat: true,
}

export class AlmanachUnavailable extends Error {
  constructor() {
    super('the almanach needs WebGL 2 on a graphics card')
  }
}

function openContext(canvas: HTMLCanvasElement): WebGL2RenderingContext | undefined {
  const context = canvas.getContext('webgl2', CONTEXT)
  if (!context) return undefined
  if (!rendersInSoftware(gpuReport(context))) return context
  context.getExtension('WEBGL_lose_context')?.loseContext()
  return undefined
}

function joinStage(lost: () => void): Stage {
  if (!stage) {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('data-almanach-stage', '')
    const context = openContext(canvas)
    if (!context) throw new AlmanachUnavailable()
    const renderer = new WebGLRenderer({ canvas, context })
    renderer.setPixelRatio(1)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = NeutralToneMapping
    const generator = new PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = generator.fromScene(room, 0.04).texture
    room.dispose()
    generator.dispose()
    const created: Stage = {
      renderer,
      environment,
      lighting: new Map(),
      users: new Set(),
      width: 1,
      height: 1,
    }
    canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault()
        if (stage === created) stage = undefined
        for (const user of [...created.users]) user()
      },
      { once: true },
    )
    stage = created
  }
  stage.users.add(lost)
  return stage
}

function leaveStage(joined: Stage, lost: () => void): void {
  joined.users.delete(lost)
  if (joined.users.size > 0) return
  if (stage === joined) stage = undefined
  joined.environment.dispose()
  for (const loading of joined.lighting.values()) {
    loading.then(
      (texture) => texture.dispose(),
      () => undefined,
    )
  }
  joined.renderer.dispose()
  joined.renderer.forceContextLoss()
}

function lightingOf(joined: Stage, url: string): Promise<Texture> {
  const known = joined.lighting.get(url)
  if (known) return known
  const loading = new HDRLoader()
    .setDataType(HalfFloatType)
    .loadAsync(url)
    .then((equirect) => {
      const generator = new PMREMGenerator(joined.renderer)
      const target = generator.fromEquirectangular(equirect)
      equirect.dispose()
      generator.dispose()
      return target.texture
    })
  joined.lighting.set(url, loading)
  loading.catch(() => joined.lighting.delete(url))
  return loading
}

function meshNamed(root: Object3D, name: string): Mesh {
  const found = root.getObjectByName(name)
  if (!(found instanceof Mesh)) throw new Error(`the almanach model has no mesh named ${name}`)
  return found
}

function extraIndexOf(json: unknown, key: (typeof EXTRA_TEXTURES)[number]): number | undefined {
  if (typeof json !== 'object' || json === null || !('materials' in json)) return undefined
  const { materials } = json
  if (!Array.isArray(materials)) return undefined
  const first: unknown = materials[0]
  if (typeof first !== 'object' || first === null || !('extras' in first)) return undefined
  const { extras } = first
  if (typeof extras !== 'object' || extras === null || !(key in extras)) return undefined
  const value: unknown = Reflect.get(extras, key)
  const index = Number(value)
  return Number.isInteger(index) && index >= 0 ? index : undefined
}

async function loadModel(url: string): Promise<Model> {
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MESHOPT)
  loader.register((parser) => ({
    name: 'aubaine_almanach_textures',
    beforeRoot: () => {
      for (const key of EXTRA_TEXTURES) {
        const index = extraIndexOf(parser.json, key)
        if (index !== undefined) parser.getDependency('texture', index).catch(() => undefined)
      }
      return null
    },
  }))
  const gltf = await loader.loadAsync(url)
  const root = gltf.scene
  root.updateMatrixWorld(true)
  const body = meshNamed(root, 'Body')
  const screen = meshNamed(root, 'Screen')
  const back = meshNamed(root, 'BackGlass')
  const crystal = root.getObjectByName('Crystal')
  if (!crystal) throw new Error('the almanach model has no crystal')
  const material = body.material
  if (!(material instanceof MeshStandardMaterial) || !material.map || !material.metalnessMap) {
    throw new Error('the almanach body has no baked textures')
  }
  const normalIndex = extraIndexOf(gltf.parser.json, 'objectSpaceNormalTexture')
  const partsIndex = extraIndexOf(gltf.parser.json, 'partsTexture')
  if (normalIndex === undefined || partsIndex === undefined) {
    throw new Error('the almanach body has no normal or parts texture')
  }
  const [normal, parts]: [Texture, Texture] = await Promise.all([
    gltf.parser.getDependency('texture', normalIndex),
    gltf.parser.getDependency('texture', partsIndex),
  ])
  screen.geometry.computeBoundingBox()
  const screenBox = (screen.geometry.boundingBox ?? new Box3()).clone().applyMatrix4(screen.matrix)
  const radius: unknown = crystal.userData['radius']
  return {
    body,
    screen,
    back,
    crystal: crystal.position.clone(),
    crystalRadius: typeof radius === 'number' ? radius : 0.037,
    screenBox,
    color: material.map,
    orm: material.metalnessMap,
    normal,
    parts,
  }
}

function modelAt(url: string): Promise<Model> {
  const known = models.get(url)
  if (known) return known
  const loading = loadModel(url)
  models.set(url, loading)
  loading.catch(() => models.delete(url))
  return loading
}

function srgbToLinear(value: number): number {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function linearStops(finish: AlmanachFinish, into: Vector3[]): void {
  finish.stops.forEach(([r, g, b], i) => {
    into[i]?.set(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b))
  })
}

function finishOf(
  value: AlmanachMetal,
  fromColour: (hex: string) => AlmanachFinish,
): AlmanachFinish | 'painted' {
  if (typeof value !== 'string') return value
  if (isAlmanachColour(value)) return fromColour(value)
  return ALMANACH_FINISH[value]
}

const finishTextures = new Map<string, Promise<Texture>>()

function finishTexture(url: string, colour: boolean): Promise<Texture> {
  const key = `${colour ? 'colour' : 'surface'} ${url}`
  const known = finishTextures.get(key)
  if (known) return known
  const loading = new TextureLoader().loadAsync(url).then((texture) => {
    texture.colorSpace = colour ? SRGBColorSpace : NoColorSpace
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.anisotropy = 4
    return texture
  })
  finishTextures.set(key, loading)
  loading.catch(() => finishTextures.delete(key))
  return loading
}

function spriteTexture(url: string): Promise<Texture> {
  const key = `sprites ${url}`
  const known = finishTextures.get(key)
  if (known) return known
  const loading = new TextureLoader().loadAsync(url).then((texture) => {
    texture.colorSpace = NoColorSpace
    texture.flipY = false
    texture.needsUpdate = true
    return texture
  })
  finishTextures.set(key, loading)
  loading.catch(() => finishTextures.delete(key))
  return loading
}

function averageLight(image: CanvasImageSource): Color {
  const canvas = document.createElement('canvas')
  canvas.width = 12
  canvas.height = 12
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return new Color(0.6, 0.6, 0.6)
  context.drawImage(image, 0, 0, 12, 12)
  const { data } = context.getImageData(0, 0, 12, 12)
  let r = 0
  let g = 0
  let b = 0
  for (let i = 0; i < data.length; i += 4) {
    r += srgbToLinear(data[i] ?? 0)
    g += srgbToLinear(data[i + 1] ?? 0)
    b += srgbToLinear(data[i + 2] ?? 0)
  }
  const n = data.length / 4
  const average = new Vector3(r / n, g / n, b / n)
  const luminance = Math.max(average.dot(LUMA), 1e-4)
  const strength = Math.min(1, Math.max(0.3, luminance * 3))
  average.multiplyScalar(strength / luminance)
  return new Color(average.x, average.y, average.z)
}

type Signal = {
  openX: number
  openY: number
  flash: number
  brightness: number
  noise: number
  wobble: number
  aberration: number
  catalyst: number
  light: number
  roll: number
  tear: number
  boot: number
  busy: boolean
}

const DARK: Signal = {
  openX: 0,
  openY: 0,
  flash: 0,
  brightness: 0,
  noise: 0,
  wobble: 0,
  aberration: 0,
  catalyst: 0,
  light: 0,
  roll: 0,
  tear: 0,
  boot: 0,
  busy: false,
}

const BOOT_SETTLED = CADRAN_SWITCH_AT + 0.5
const INSTANT_FADE = 0.2

function signalOf(
  powered: boolean,
  since: number,
  calm: boolean,
  never: boolean,
  field: number,
  boot: AlmanachBoot,
): Signal {
  if (never) return DARK
  if (powered && calm) {
    const at = cadranSwitchDelay(boot, true)
    const brightness = easeOut(ramp(since, 0, boot === 'instant' ? INSTANT_FADE : 0.45))
    return {
      openX: 1,
      openY: 1,
      flash: 0,
      brightness,
      noise: 0,
      wobble: 0,
      aberration: 0.5,
      catalyst: 1,
      light: brightness,
      roll: 0,
      tear: 0,
      boot: boot === 'instant' ? 0 : 1 - ramp(since, at, at + 0.25),
      busy: since < at + 0.35 || since < INSTANT_FADE + 0.05,
    }
  }
  if (powered) {
    const t = cadranTime(since, boot)
    const fade = boot === 'instant' ? easeOut(ramp(since, 0, INSTANT_FADE)) : 1
    const warm = ramp(t, 0.47, 1.5)
    const flicker = hash(field * 0.917 + 4.1) - 0.5
    const switching = bell(t, CADRAN_SWITCH_AT, CADRAN_SWITCH_AT + 0.12, CADRAN_SWITCH_AT + 0.34)
    const openX = t < 0.28 ? 0 : t < 0.35 ? 0.004 : 0.004 + 0.996 * easeOut(ramp(t, 0.35, 0.47))
    const openY = t < 0.47 ? 0.004 : 0.004 + 0.996 * easeOutBack(ramp(t, 0.47, 0.85))
    const flash =
      t < 0.28
        ? 0
        : t < 0.35
          ? 0.6 * ramp(t, 0.28, 0.35)
          : t < 0.47
            ? 0.6 + 0.4 * ramp(t, 0.35, 0.47)
            : Math.exp(-(t - 0.47) * 5) + 0.12 * switching
    const brightness =
      (0.55 + 0.45 * easeOut(warm)) * (1 + flicker * (0.12 * (1 - warm) + 0.014)) * fade
    return {
      openX,
      openY,
      flash,
      brightness,
      noise: 0.04 + 0.86 * (1 - easeOut(warm)) + 0.55 * switching,
      wobble: ramp(t, 0.8, 0.9) * (1 - ramp(t, 0.9, 1.5)) ** 2,
      aberration: 0.8 + (t >= 0.47 ? 3.6 * (1 - easeOut(warm)) : 0) + 5 * switching,
      catalyst: Math.max(ramp(t, 1, 2), 0.55 * bell(since, 0, 0.04, 0.32)),
      light: Math.min(1, openY) * (openX > 0.5 ? 1 : 0) * (0.55 + 0.45 * easeOut(warm)) * fade,
      roll:
        0.014 *
        bell(t, CADRAN_SWITCH_AT, CADRAN_SWITCH_AT + 0.08, CADRAN_SWITCH_AT + 0.2) *
        (hash(field * 1.31) - 0.5),
      tear: switching,
      boot: 1 - ramp(t, CADRAN_SWITCH_AT + 0.14, CADRAN_SWITCH_AT + 0.26),
      busy: t < BOOT_SETTLED || since < INSTANT_FADE + 0.05,
    }
  }
  if (calm) {
    const brightness = 1 - easeOut(ramp(since, 0, 0.3))
    return {
      openX: 1,
      openY: 1,
      flash: 0,
      brightness,
      noise: 0,
      wobble: 0,
      aberration: 0.5,
      catalyst: 0,
      light: brightness,
      roll: 0,
      tear: 0,
      boot: 0,
      busy: since < 0.35,
    }
  }
  const t = since
  const openY = t < 0.1 ? 0.004 + 0.996 * (1 - easeIn(t / 0.1)) : 0.004
  const openX =
    t < 0.1 ? 1 : t < 0.2 ? 0.004 + 0.996 * (1 - easeIn((t - 0.1) / 0.1)) : t < 1 ? 0.004 : 0
  const flash =
    t < 0.1 ? 0.6 * (t / 0.1) : t < 0.2 ? 0.6 + 0.4 * ((t - 0.1) / 0.1) : Math.exp(-(t - 0.2) * 5)
  return {
    openX,
    openY,
    flash: t < 1 ? flash : 0,
    brightness: t < 0.2 ? 1 : Math.exp(-(t - 0.2) * 6),
    noise: 0.04,
    wobble: 0,
    aberration: 0.8,
    catalyst: 0,
    light: t < 0.1 ? 1 - t / 0.1 : 0,
    roll: 0,
    tear: 0,
    boot: 0,
    busy: t < 1.05,
  }
}

type Switch = {
  snow: number
  roll: number
  tear: number
  dim: number
  blur: number
  swapped: boolean
  busy: boolean
}

const SWITCH_SWAP = 0.09
const SWITCH_SETTLE = 0.3
const SWITCH_ROLL = 0.07

function swell(time: number, from: number, peak: number, to: number): number {
  const progress = bell(time, from, peak, to)
  return progress * progress * (3 - 2 * progress)
}

function switchOf(since: number, calm: boolean): Switch {
  if (calm) {
    const lift = swell(since, 0, 0.08, 0.24)
    return {
      snow: 0.15 * lift,
      roll: 0,
      tear: 0,
      dim: 1 - 0.3 * lift,
      blur: 1.5 * lift,
      swapped: since >= 0.08,
      busy: since < 0.26,
    }
  }
  const swapped = since >= SWITCH_SWAP
  const lift = swell(since, 0, SWITCH_SWAP, SWITCH_SETTLE)
  const roll = swapped
    ? -SWITCH_ROLL * (1 - easeOut(ramp(since, SWITCH_SWAP, SWITCH_SETTLE)))
    : SWITCH_ROLL * easeIn(ramp(since, 0, SWITCH_SWAP))
  return {
    snow: 0.22 * lift,
    roll,
    tear: 0.2 * swell(since, 0.02, SWITCH_SWAP, 0.2),
    dim: 1 - 0.35 * lift,
    blur: 3 * lift,
    swapped,
    busy: since < SWITCH_SETTLE + 0.04,
  }
}

class Sound {
  private context: AudioContext | undefined
  private audio: CadranAudio | undefined
  private input: GainNode | undefined
  private master: GainNode | undefined
  private bus: GainNode | undefined
  private level: number

  constructor(level: number) {
    this.level = level
  }

  setVolume(level: number): void {
    this.level = Math.max(0, Math.min(1, level))
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.level, this.context.currentTime, 0.02)
    }
  }

  private ready(): CadranAudio | undefined {
    if (this.level <= 0 || !navigator.userActivation.hasBeenActive) return undefined
    if (!this.context) {
      const context = new AudioContext()
      const master = context.createGain()
      master.gain.value = this.level
      const input = context.createGain()
      input.gain.value = 0.8
      input.connect(createLimiter(context)).connect(master).connect(context.destination)
      this.context = context
      this.audio = { context, noise: noiseBuffer(context) }
      this.input = input
      this.master = master
    }
    if (this.context.state === 'suspended') void this.context.resume()
    return this.audio
  }

  private hum(audio: CadranAudio, destination: AudioNode, when: number, length: number): void {
    const { context } = audio
    const rise = Math.min(0.2, length * 0.35)
    const fall = Math.min(0.3, length * 0.45)
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(0.05, when + rise)
    gain.gain.setValueAtTime(0.05, when + length - fall)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + length)
    gain.connect(destination)
    const vibrato = context.createOscillator()
    vibrato.frequency.value = 5.5
    const depth = context.createGain()
    depth.gain.value = 1.2
    vibrato.connect(depth)
    for (const [frequency, level] of [
      [110, 1],
      [165, 0.6],
      [220, 0.25],
    ] as const) {
      const oscillator = context.createOscillator()
      oscillator.frequency.value = frequency
      depth.connect(oscillator.frequency)
      const voice = context.createGain()
      voice.gain.value = level
      oscillator.connect(voice).connect(gain)
      oscillator.start(when)
      oscillator.stop(when + length + 0.02)
    }
    vibrato.start(when)
    vibrato.stop(when + length + 0.02)
  }

  private cut(): void {
    const { context, bus } = this
    this.bus = undefined
    if (!context || !bus) return
    bus.gain.setTargetAtTime(0, context.currentTime, 0.03)
    window.setTimeout(() => bus.disconnect(), 500)
  }

  private open(): GainNode | undefined {
    const { context, input } = this
    if (!context || !input) return undefined
    this.cut()
    const bus = context.createGain()
    bus.connect(input)
    this.bus = bus
    return bus
  }

  on(calm: boolean, pace: number, calmSwitch: number): void {
    const audio = this.ready()
    const bus = audio ? this.open() : undefined
    if (!audio || !bus) return
    const at = audio.context.currentTime + 0.01
    if (calm) {
      chime(audio, bus, at + 0.15)
      ping(audio, bus, at + calmSwitch + 0.05)
      return
    }
    const cue = (moment: number): number => at + moment / pace
    powerThunk(audio, bus, cue(0.35))
    degauss(audio, bus, cue(0.8))
    this.hum(audio, bus, cue(0.9), 1.45 / pace)
    ignite(audio, bus, cue(2.25))
    staticBurst(audio, bus, cue(CADRAN_SWITCH_AT))
    ping(audio, bus, cue(CADRAN_SWITCH_AT) + 0.22)
  }

  fast(calm: boolean): void {
    const audio = this.ready()
    const bus = audio ? this.open() : undefined
    if (!audio || !bus) return
    const at = audio.context.currentTime + 0.01
    if (calm) {
      chime(audio, bus, at + 0.05)
      ping(audio, bus, at + CADRAN_CALM_FAST_SWITCH + 0.05)
      return
    }
    tone(audio, bus, 'sine', [140, 42], at, { peak: 0.5, attack: 0.004, decay: 0.45 })
    hiss(audio, bus, { type: 'bandpass', from: 1400, to: 900, q: 0.8 }, at, {
      peak: 0.16,
      attack: 0.003,
      decay: 0.32,
    })
    ignite(audio, bus, at + CADRAN_FAST_OPEN)
    staticBurst(audio, bus, at + CADRAN_FAST_SWITCH)
    ping(audio, bus, at + CADRAN_FAST_SWITCH + 0.22)
  }

  skip(calm: boolean): void {
    const audio = this.ready()
    const bus = audio ? this.open() : undefined
    if (!audio || !bus) return
    const at = audio.context.currentTime + 0.01
    if (!calm) staticBurst(audio, bus, at)
    ping(audio, bus, at + (calm ? 0.05 : 0.22))
  }

  off(): void {
    const audio = this.ready()
    const { input } = this
    this.cut()
    if (!audio || !input) return
    const at = audio.context.currentTime + 0.01
    tone(audio, input, 'sine', [520, 70], at, { peak: 0.22, attack: 0.004, decay: 0.2 })
    hiss(audio, input, { type: 'highpass', from: 4200, to: 2400, q: 0.5 }, at, {
      peak: 0.08,
      attack: 0.004,
      decay: 0.16,
    })
  }

  channel(): void {
    const audio = this.ready()
    if (!audio || !this.input) return
    staticBurst(audio, this.input, audio.context.currentTime + 0.01)
  }

  close(): void {
    if (this.context) void this.context.close()
    this.context = undefined
    this.audio = undefined
    this.bus = undefined
  }
}

type DeviceBattery = {
  readonly level: number
  readonly charging: boolean
  addEventListener(type: string, listener: () => void): void
  removeEventListener(type: string, listener: () => void): void
}

function isDeviceBattery(value: unknown): value is DeviceBattery {
  return (
    typeof value === 'object' &&
    value !== null &&
    'level' in value &&
    typeof value.level === 'number' &&
    'charging' in value &&
    typeof value.charging === 'boolean' &&
    'addEventListener' in value &&
    typeof value.addEventListener === 'function' &&
    'removeEventListener' in value &&
    typeof value.removeEventListener === 'function'
  )
}

function deviceBattery(): Promise<DeviceBattery | undefined> {
  const getBattery: unknown = Reflect.get(navigator, 'getBattery')
  if (typeof getBattery !== 'function') return Promise.resolve(undefined)
  return Promise.resolve()
    .then((): unknown => Reflect.apply(getBattery, navigator, []))
    .then(
      (value) => (isDeviceBattery(value) ? value : undefined),
      () => undefined,
    )
}

function drawOsd(canvas: HTMLCanvasElement, text: string, align: 'left' | 'right'): void {
  const context = canvas.getContext('2d')
  if (!context) return
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.font = `700 ${Math.round(canvas.height * 0.62)}px ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace`
  context.textBaseline = 'middle'
  context.textAlign = align
  const x = align === 'right' ? canvas.width - 8 : 8
  const y = canvas.height * 0.54
  context.lineJoin = 'round'
  context.lineWidth = canvas.height * 0.09
  context.strokeStyle = 'rgba(0, 0, 0, 0.85)'
  context.strokeText(text, x, y)
  context.fillStyle = '#e8ffe6'
  context.fillText(text, x, y)
}

function icon(path: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('focusable', 'false')
  const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  shape.setAttribute('d', path)
  svg.append(shape)
  return svg
}

const ICONS = {
  previous: 'M15.5 5 8.5 12l7 7',
  next: 'M8.5 5l7 7-7 7',
  power: 'M12 3v8M7.05 6.05a8 8 0 1 0 9.9 0',
  zoom: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.3 15.3 20 20M10.5 7.5v6M7.5 10.5h6',
}

export function mountAlmanach(host: HTMLElement, options: AlmanachOptions): Almanach {
  const teardown = new AbortController()
  const { signal } = teardown
  const { copy } = options
  let calm =
    options.motion === 'calm' ||
    (options.motion === undefined && window.matchMedia(REDUCED_MOTION).matches)
  const fine = window.matchMedia(FINE_POINTER).matches
  const pictures: AlmanachPicture[] = [...options.pictures]
  let count = pictures.length
  const wrapIndex = (value: number): number => ((Math.round(value) % count) + count) % count
  const sound = new Sound(options.volume ?? 0)
  const osdEnabled = options.osd ?? true

  let index = count > 0 ? wrapIndex(options.start ?? 0) : 0
  let shown = index
  let powered = false
  let never = true
  let powerAt = Number.NEGATIVE_INFINITY
  let switchAt = Number.NEGATIVE_INFINITY
  let osdAt = Number.NEGATIVE_INFINITY
  let glitchAt = Number.POSITIVE_INFINITY
  let hintAt = Number.NEGATIVE_INFINITY
  let look: AlmanachLook = { ...ALMANACH_LOOK, ...options.look }
  let visible = false
  let destroyed = false
  let frame = 0
  let lastFrame = 0
  let lastDraw = 0
  let hover: 'crystal' | 'screen' | undefined
  let hoverGlow = 0
  let pointer: { x: number; y: number } | undefined
  let gemLit = 0
  let joined: Stage | undefined
  let lighting: Texture | undefined
  let preparing: Promise<void> | undefined
  let presented = false
  let bootMode: AlmanachBoot = 'quick'
  let battery: CadranBattery | undefined
  let zoomOn = false
  let zoomAt = Number.NEGATIVE_INFINITY
  let zoomFrom = 1
  let zoomLevel = 1
  const zoomCentre = new Vector2(0.5, 0.5)
  const zoomAim = new Vector2(0.5, 0.5)
  const screenHit = new Vector2(0.5, 0.5)
  let dragging: { id: number; from: Vector2; centre: Vector2 } | undefined
  const tilt = { yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 }
  const emptySlide = (): Slide => ({
    texture: undefined,
    loading: undefined,
    aspect: 1,
    light: new Color(0.5, 0.5, 0.5),
  })
  const slides: Slide[] = pictures.map(emptySlide)

  const surface = document.createElement('canvas')
  surface.className = 'au-almanach__canvas'
  surface.setAttribute('aria-hidden', 'true')
  surface.style.cssText =
    'position:absolute;inset:0;z-index:1;width:100%;height:100%;touch-action:pan-y;-webkit-tap-highlight-color:transparent'
  const context2d = surface.getContext('2d')

  const status = document.createElement('p')
  status.className = 'au-almanach__status'
  status.setAttribute('aria-live', 'polite')
  status.style.cssText =
    'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0'

  const buttons: {
    power?: HTMLButtonElement
    zoom?: HTMLButtonElement
    previous?: HTMLButtonElement
    next?: HTMLButtonElement
  } = {}
  let toolbar: HTMLDivElement | undefined
  if (options.controls ?? true) {
    const bar = document.createElement('div')
    bar.className = 'au-almanach__controls'
    bar.setAttribute('role', 'group')
    bar.setAttribute('aria-label', copy.label)
    const make = (action: keyof typeof ICONS, label: string): HTMLButtonElement => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'au-almanach__button'
      button.dataset['action'] = action
      button.setAttribute('aria-label', label)
      button.append(icon(ICONS[action]))
      bar.append(button)
      return button
    }
    if (count > 1) buttons.previous = make('previous', copy.previous)
    buttons.power = make('power', copy.powerOn)
    buttons.zoom = make('zoom', copy.zoomIn)
    if (count > 1) buttons.next = make('next', copy.next)
    toolbar = bar
  }

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 2, 0.05, 20)
  const rig = new Group()
  scene.add(rig)
  const key = new DirectionalLight(new Color(1, 0.93, 0.82), 1.35)
  key.position.set(-1.4, 1.6, 2.2)
  const fill = new DirectionalLight(new Color(0.78, 0.82, 1), 0.4)
  fill.position.set(1.8, -0.4, 1.2)
  scene.add(key, fill)

  const osdCanvas = document.createElement('canvas')
  osdCanvas.width = 512
  osdCanvas.height = 128
  const osdTexture = new CanvasTexture(osdCanvas)
  osdTexture.colorSpace = SRGBColorSpace
  osdTexture.generateMipmaps = false
  osdTexture.minFilter = LinearFilter
  let osdAlign: 'left' | 'right' = 'right'

  const crtTarget = new WebGLRenderTarget(512, 222, {
    depthBuffer: false,
    generateMipmaps: false,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    colorSpace: SRGBColorSpace,
  })
  const blank = new CanvasTexture(document.createElement('canvas'))
  const crtUniforms = {
    uImage: { value: blank as Texture },
    uFit: { value: new Vector4(1, 0, 0.5, 0.5) },
    uMirror: { value: 0 },
    uZoom: { value: new Vector3(0.5, 0.5, 1) },
    uOsd: { value: osdTexture as Texture },
    uOsdAlpha: { value: 0 },
    uOsdLeft: { value: 0 },
    uResolution: { value: new Vector2(512, 222) },
    uAspect: { value: SCREEN_ASPECT_FALLBACK },
    uLines: { value: 200 },
    uTime: { value: 0 },
    uSeed: { value: 0 },
    uSignal: { value: 0 },
    uOpen: { value: new Vector2(0, 0) },
    uFlash: { value: 0 },
    uBrightness: { value: 0 },
    uNoise: { value: 0 },
    uWobble: { value: 0 },
    uAberration: { value: 0.8 },
    uSnow: { value: 0 },
    uBlur: { value: 0 },
    uRoll: { value: 0 },
    uTear: { value: 0 },
    uTrack: { value: 0 },
    uTrackAt: { value: 0.1 },
    uMotion: { value: calm ? 0 : 1 },
    uMask: { value: 0 },
    uSheen: { value: 0.55 },
    uBoot: { value: blank as Texture },
    uBootMix: { value: 0 },
    uBootSize: { value: new Vector2(BOOT_HEIGHT * SCREEN_ASPECT_FALLBACK, BOOT_HEIGHT) },
    uBootLod: { value: 0 },
  }
  const fitVector = crtUniforms.uFit.value
  let boot:
    | { context: CanvasRenderingContext2D; texture: CanvasTexture; aspect: number }
    | undefined
  let bootMix = 0

  const bootSurface = (): typeof boot => {
    const aspect = crtUniforms.uAspect.value
    if (boot && Math.abs(boot.aspect - aspect) < 1e-3) return boot
    boot?.texture.dispose()
    boot = undefined
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(BOOT_HEIGHT * aspect)
    canvas.height = BOOT_HEIGHT
    const context = canvas.getContext('2d')
    if (!context) return undefined
    const texture = new CanvasTexture(canvas)
    texture.premultiplyAlpha = true
    texture.generateMipmaps = true
    texture.minFilter = LinearMipmapLinearFilter
    texture.magFilter = LinearFilter
    boot = { context, texture, aspect }
    crtUniforms.uBoot.value = texture
    crtUniforms.uBootSize.value.set(canvas.width, canvas.height)
    return boot
  }

  const paintBoot = (frame: CadranFrame): void => {
    const surface = bootSurface()
    if (!surface) return
    paintCadran(surface.context, frame, battery)
    surface.texture.needsUpdate = true
  }
  const crtMaterial = new ShaderMaterial({
    vertexShader: CRT_VERTEX,
    fragmentShader: CRT_FRAGMENT,
    uniforms: crtUniforms,
    depthTest: false,
    depthWrite: false,
  })
  const crtScene = new Scene()
  const crtCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const crtQuad = new Mesh(new PlaneGeometry(2, 2), crtMaterial)
  crtQuad.frustumCulled = false
  crtScene.add(crtQuad)

  const stops = (): Vector3[] => [new Vector3(), new Vector3(), new Vector3(), new Vector3()]
  const bodyUniforms = {
    uAlmanachSpace: { value: new Matrix4() },
    uParts: { value: blank as Texture },
    uMetal: { value: stops() },
    uTrim: { value: stops() },
    uGrip: { value: stops() },
    uGem: { value: stops() },
    uCustom: { value: new Vector4() },
    uGemLight: { value: new Vector3(0.3, 0.85, 1) },
    uCrystal: { value: new Vector3() },
    uCrystalRadius: { value: 0.037 },
    uGemLit: { value: 0 },
    uGemGlow: { value: 0.12 },
    uRimLight: { value: new Vector3() },
    uGloss: { value: new Vector3(ALMANACH_LOOK.gloss, ALMANACH_LOOK.gloss, ALMANACH_LOOK.gloss) },
    uMetalColor: { value: blank as Texture },
    uMetalSurface: { value: blank as Texture },
    uMetalMapping: { value: new Vector4(1, 0, 0, 0) },
    uTrimColor: { value: blank as Texture },
    uTrimSurface: { value: blank as Texture },
    uTrimMapping: { value: new Vector4(1, 0, 0, 0) },
    uGripColor: { value: blank as Texture },
    uGripSurface: { value: blank as Texture },
    uGripMapping: { value: new Vector4(1, 0, 0, 0) },
    uGemScale: { value: 1 },
    uSprites: { value: blank as Texture },
    uMagicTime: { value: MAGIC_POSE },
    uMagicPower: { value: 0 },
    uMagicGain: { value: 1 },
    uGemFrame: { value: GEM_FRAME.clone() },
  }
  const bodyMaterial = new MeshPhysicalMaterial({
    flatShading: true,
    normalMapType: ObjectSpaceNormalMap,
    emissive: new Color(0, 0, 0),
    clearcoat: 0,
    clearcoatRoughness: 0.08,
  })
  bodyMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, bodyUniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${BODY_VERTEX_HEAD}`)
      .replace('#include <project_vertex>', `#include <project_vertex>\n${BODY_VERTEX_TAIL}`)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${BODY_FRAGMENT_HEAD}`)
      .replace('#include <map_fragment>', `#include <map_fragment>\n${BODY_FRAGMENT_SURFACE}`)
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>\n${BODY_FRAGMENT_ROUGHNESS}`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `${BODY_FRAGMENT_TEXTURED}\n${BODY_FRAGMENT_EMISSIVE}`,
      )
      .replace(
        '#include <lights_physical_fragment>',
        `#include <lights_physical_fragment>\n${BODY_FRAGMENT_COAT}`,
      )
  }
  const baseDefines = { ...bodyMaterial.defines }
  let texturedKey = ''
  bodyMaterial.customProgramCacheKey = () => `almanach-body-${texturedKey}`
  const screenMaterial = new MeshBasicMaterial({ map: crtTarget.texture, toneMapped: false })
  const backMaterial = new MeshStandardMaterial({
    color: new Color(0.012, 0.014, 0.018),
    roughness: 0.28,
    metalness: 0.1,
  })
  const almanach = new Group()
  rig.add(almanach)
  let model: Model | undefined
  const customLight = new Vector3()
  const bootLight = new Vector3()

  const modelBase = (): string => new URL(options.model, document.baseURI).href
  const texturesOf = (texture: AlmanachTexture): Promise<readonly [Texture, Texture]> =>
    Promise.all([
      finishTexture(new URL(texture.color, modelBase()).href, true),
      finishTexture(new URL(texture.surface, modelBase()).href, false),
    ])
  const slots = {
    metal: {
      stops: bodyUniforms.uMetal.value,
      colour: bodyUniforms.uMetalColor,
      surface: bodyUniforms.uMetalSurface,
      mapping: bodyUniforms.uMetalMapping.value,
      define: 'ALMANACH_TEXTURED_METAL',
    },
    trim: {
      stops: bodyUniforms.uTrim.value,
      colour: bodyUniforms.uTrimColor,
      surface: bodyUniforms.uTrimSurface,
      mapping: bodyUniforms.uTrimMapping.value,
      define: 'ALMANACH_TEXTURED_TRIM',
    },
    grip: {
      stops: bodyUniforms.uGrip.value,
      colour: bodyUniforms.uGripColor,
      surface: bodyUniforms.uGripSurface,
      mapping: bodyUniforms.uGripMapping.value,
      define: 'ALMANACH_TEXTURED_GRIP',
    },
  } as const
  type Part = keyof typeof slots
  const PARTS: readonly Part[] = ['metal', 'trim', 'grip']
  let lookRevision = 0
  let dressing: Promise<void> = Promise.resolve()
  let textured: readonly string[] = []
  const woods = new Set<Part>()
  let sprites: Texture | undefined
  let magic: AlmanachMagic | undefined
  let magicTime = MAGIC_POSE

  const magicOf = (): AlmanachMagic | undefined => (look.magic === 'none' ? undefined : look.magic)

  const spritesFor = (): Promise<Texture | undefined> =>
    sprites
      ? Promise.resolve(sprites)
      : spriteTexture(new URL(MAGIC_FILE, modelBase()).href).then(
          (texture) => {
            sprites = texture
            bodyUniforms.uSprites.value = texture
            return texture
          },
          () => undefined,
        )

  const commitGem = (): void => {
    const custom = bodyUniforms.uCustom.value
    const gem = look.gem
    const wanted = magicOf()
    magic = wanted && sprites ? wanted : undefined
    if (gem === 'painted') {
      custom.w = 0
      return
    }
    const finish = gemFromColour(gem)
    linearStops(finish, bodyUniforms.uGem.value)
    const [r, g, b] = finish.stops[2]
    const light = new Vector3(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b))
    light.divideScalar(Math.max(light.x, light.y, light.z, 1e-4))
    bodyUniforms.uGemLight.value.copy(light)
    const luminance = Math.max(light.dot(LUMA), 1e-4)
    bodyUniforms.uGemScale.value = Math.min(
      1.3,
      Math.max(0.75, Math.sqrt(GEM_LUMINANCE / luminance)),
    )
    custom.w = 1
  }

  const glossOf = (part: Part): number =>
    clamp01(
      (part === 'metal' ? look.metalGloss : part === 'trim' ? look.trimGloss : look.gripGloss) ??
        look.gloss,
    )

  const finishFor = (part: Part): AlmanachFinish | 'painted' => {
    if (part === 'metal') return finishOf(look.metal, finishFromColour)
    if (part === 'trim')
      return look.trim === 'painted' ? 'painted' : finishOf(look.trim, finishFromColour)
    return look.grip === 'painted' ? 'painted' : finishOf(look.grip, gripFromColour)
  }

  const dress = (): Promise<void> => {
    const revision = ++lookRevision
    const finishes = PARTS.map((part) => [part, finishFor(part)] as const)
    const loads = finishes.map(([, finish]) =>
      finish !== 'painted' && finish.texture
        ? texturesOf(finish.texture).catch(() => undefined)
        : Promise.resolve(undefined),
    )
    const spell = magicOf() ? spritesFor() : Promise.resolve(undefined)
    return Promise.all([Promise.all(loads), spell]).then(([textures]) => {
      if (revision !== lookRevision) return
      commitGem()
      const custom = bodyUniforms.uCustom.value
      const defines: string[] = []
      woods.clear()
      finishes.forEach(([part, finish], i) => {
        const slot = slots[part]
        const loaded = textures[i]
        let painted = 0
        if (finish !== 'painted') {
          linearStops(finish, slot.stops)
          if (finish.texture && loaded) {
            slot.colour.value = loaded[0]
            slot.surface.value = loaded[1]
            slot.mapping.set(
              finish.texture.size,
              finish.texture.grain === 'u' ? 1 : finish.texture.grain === 'v' ? 2 : 0,
              finish.texture.grain ? 1 : 0,
              0,
            )
            defines.push(slot.define)
            if (finish.texture.grain) woods.add(part)
          } else painted = 1
        }
        if (part === 'metal') custom.x = painted
        else if (part === 'trim') custom.y = painted
        else custom.z = painted
      })
      if (defines.length > 0) defines.unshift('ALMANACH_TEXTURED')
      textured = defines
      program()
      wake()
    })
  }

  const program = (): void => {
    const coated = [...woods].some((part) => glossOf(part) > LACQUER_FROM)
    const defines = [
      ...textured,
      ...(coated ? ['ALMANACH_COAT'] : []),
      ...(magic ? ['ALMANACH_MAGIC', `ALMANACH_MAGIC_${magic.toUpperCase()}`] : []),
    ]
    bodyMaterial.clearcoat = coated ? 1 : 0
    if (defines.join(' ') === texturedKey) return
    texturedKey = defines.join(' ')
    bodyMaterial.defines = {
      ...baseDefines,
      ...Object.fromEntries(defines.map((name) => [name, ''])),
    }
    bodyMaterial.needsUpdate = true
  }

  const applyLook = (patch: Partial<AlmanachLook>): void => {
    look = { ...look, ...patch }
    if (!magicOf() || sprites) commitGem()
    if (look.light !== 'picture') {
      const light = new Color(look.light)
      customLight.set(light.r, light.g, light.b)
    }
    bodyUniforms.uGloss.value.set(glossOf('metal'), glossOf('trim'), glossOf('grip'))
    program()
    if (preparing) dressing = dress()
  }
  applyLook({})

  const state = (): AlmanachState => ({ power: powered, index, zoom: zoomOn, look })

  let deviceSource: DeviceBattery | undefined
  let batteryRequest = 0
  const readDevice = (): void => {
    if (!deviceSource) return
    battery = { level: deviceSource.level, charging: deviceSource.charging }
    wake()
  }
  const setBattery = (value: AlmanachBattery): void => {
    const request = ++batteryRequest
    if (deviceSource) {
      deviceSource.removeEventListener('levelchange', readDevice)
      deviceSource.removeEventListener('chargingchange', readDevice)
      deviceSource = undefined
    }
    battery = undefined
    if (value === 'device') {
      void deviceBattery().then((source) => {
        if (!source || request !== batteryRequest || destroyed) return
        deviceSource = source
        source.addEventListener('levelchange', readDevice)
        source.addEventListener('chargingchange', readDevice)
        readDevice()
      })
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      battery = { level: clamp01(value / 100), charging: false }
    }
  }
  setBattery(options.battery ?? false)

  const cursorFor = (target: 'crystal' | 'screen' | undefined): string => {
    if (target === 'crystal') return 'pointer'
    if (target !== 'screen' || !powered) return ''
    if (zoomOn) return 'grab'
    return count > 1 ? 'pointer' : 'zoom-in'
  }

  const announce = (): void => {
    const picture = pictures[index]
    status.textContent = powered && picture ? copy.showing(index, count, picture.alt) : copy.dark
    if (buttons.power) {
      buttons.power.setAttribute('aria-pressed', String(powered))
      buttons.power.setAttribute('aria-label', powered ? copy.powerOff : copy.powerOn)
    }
    if (buttons.zoom) {
      buttons.zoom.disabled = !powered
      buttons.zoom.setAttribute('aria-pressed', String(zoomOn))
      buttons.zoom.setAttribute('aria-label', zoomOn ? copy.zoomOut : copy.zoomIn)
    }
    surface.style.cursor = dragging ? 'grabbing' : cursorFor(hover)
    surface.style.touchAction = zoomOn ? 'none' : 'pan-y'
    if (powered) host.setAttribute(POWERED, '')
    else host.removeAttribute(POWERED)
    options.onState?.(state())
  }

  const wake = (): void => {
    if (frame !== 0 || destroyed || !visible || !joined || document.hidden) return
    frame = window.requestAnimationFrame(tick)
  }

  const loadSlide = (at: number): Promise<Texture> | undefined => {
    const slide = slides[at]
    const picture = pictures[at]
    if (!slide || !picture) return undefined
    if (slide.loading) return slide.loading
    slide.loading = new TextureLoader().loadAsync(picture.src).then((texture) => {
      if (destroyed) {
        texture.dispose()
        return texture
      }
      texture.colorSpace = SRGBColorSpace
      texture.minFilter = LinearMipmapLinearFilter
      texture.generateMipmaps = true
      texture.anisotropy = joined ? Math.min(8, joined.renderer.capabilities.getMaxAnisotropy()) : 1
      const image: unknown = texture.image
      if (image instanceof HTMLImageElement || image instanceof ImageBitmap) {
        slide.aspect = image.width / Math.max(1, image.height)
        slide.light = averageLight(image)
      }
      slide.texture = texture
      wake()
      return texture
    })
    slide.loading.catch((error: unknown) => {
      if (!destroyed) console.error(error)
      wake()
    })
    return slide.loading
  }

  const prefetch = (): void => {
    if (count === 0) return
    void loadSlide(index)?.catch(() => undefined)
    if (count > 1) {
      void loadSlide(wrapIndex(index + 1))?.catch(() => undefined)
      void loadSlide(wrapIndex(index - 1))?.catch(() => undefined)
    }
  }

  const showOsd = (text: string, align: 'left' | 'right', at: number): void => {
    if (!osdEnabled) return
    osdAlign = align
    drawOsd(osdCanvas, text, align)
    osdTexture.needsUpdate = true
    osdAt = at
  }

  const now = (): number => performance.now() / 1000

  const setPower = (on: boolean, boot: AlmanachBoot = options.crystalBoot ?? 'quick'): void => {
    if (on === powered && !never) return
    if (on && count === 0) return
    const t = now()
    powered = on
    never = false
    powerAt = t
    zoomOn = false
    if (on) {
      bootMode = boot
      zoomLevel = 1
      zoomFrom = 1
      zoomAt = Number.NEGATIVE_INFINITY
      if (boot === 'fast') sound.fast(calm)
      else if (boot !== 'instant')
        sound.on(calm, boot === 'original' ? 1 : CADRAN_PACE, cadranSwitchDelay(boot, true))
      glitchAt = t + 6 + Math.random() * 6
      shown = index
      prefetch()
      osdAt = Number.NEGATIVE_INFINITY
    } else {
      zoomFrom = zoomLevel
      zoomAt = t
      sound.off()
    }
    announce()
    wake()
  }

  const switchMoment = (): number => cadranSwitchDelay(bootMode, calm)

  const booting = (): boolean => powered && now() - powerAt < switchMoment()

  const skipBoot = (): void => {
    if (!booting()) return
    powerAt = now() - switchMoment()
    sound.skip(calm)
    wake()
  }

  const show = (target: number): void => {
    if (count === 0) return
    const next = wrapIndex(target)
    if (next === index) return
    index = next
    prefetch()
    if (zoomOn) {
      zoomOn = false
      zoomLevel = 1
      zoomFrom = 1
      zoomAt = Number.NEGATIVE_INFINITY
    }
    if (booting()) {
      shown = index
      skipBoot()
    } else if (powered) {
      switchAt = now()
      sound.channel()
    } else {
      shown = index
    }
    announce()
    wake()
  }

  const ndc = new Vector2()
  const raycaster = new Raycaster()
  const localRay = new Ray()
  const inverse = new Matrix4()
  const hitPoint = new Vector3()
  const gemSphere = new Sphere()

  const cast = (event: PointerEvent): boolean => {
    const box = surface.getBoundingClientRect()
    if (box.width === 0 || box.height === 0) return false
    ndc.set(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      -((event.clientY - box.top) / box.height) * 2 + 1,
    )
    raycaster.setFromCamera(ndc, camera)
    inverse.copy(almanach.matrixWorld).invert()
    localRay.copy(raycaster.ray).applyMatrix4(inverse)
    return true
  }

  const screenAt = (): boolean => {
    if (!model || Math.abs(localRay.direction.z) <= 1e-4) return false
    const t = (model.screenBox.max.z - localRay.origin.z) / localRay.direction.z
    if (t <= 0) return false
    localRay.at(t, hitPoint)
    const { min, max } = model.screenBox
    const aspect = crtUniforms.uAspect.value
    const across = (0.5 * aspect) / (0.5 * aspect - TUBE_INSET)
    const down = 0.5 / (0.5 - TUBE_INSET)
    screenHit.set(
      clamp01(0.5 + ((hitPoint.x - min.x) / (max.x - min.x) - 0.5) * across),
      clamp01(0.5 + ((hitPoint.y - min.y) / (max.y - min.y) - 0.5) * down),
    )
    return true
  }

  const pick = (event: PointerEvent): 'crystal' | 'screen' | undefined => {
    if (!model || !cast(event)) return undefined
    gemSphere.set(model.crystal, model.crystalRadius * 1.45)
    if (localRay.intersectSphere(gemSphere, hitPoint)) return 'crystal'
    if (!screenAt()) return undefined
    const { min, max } = model.screenBox
    const inside =
      hitPoint.x > min.x && hitPoint.x < max.x && hitPoint.y > min.y && hitPoint.y < max.y
    return inside ? 'screen' : undefined
  }

  let pressed: { x: number; y: number; id: number } | undefined

  const setZoom = (on: boolean, at?: Vector2): void => {
    if (on && (!powered || booting())) return
    if (at) {
      zoomAim.copy(at)
      if (zoomLevel <= 1.0001) zoomCentre.copy(at)
    }
    if (on === zoomOn) return
    const t = now()
    zoomFrom = zoomLevel
    zoomAt = t
    zoomOn = on
    if (on) showOsd(copy.zoom, 'right', t)
    announce()
    wake()
  }

  surface.addEventListener(
    'pointermove',
    (event) => {
      const box = surface.getBoundingClientRect()
      if (fine && !calm && event.pointerType === 'mouse') {
        pointer = {
          x: (event.clientX - box.left) / box.width,
          y: (event.clientY - box.top) / box.height,
        }
      }
      if (dragging && dragging.id === event.pointerId) {
        if (zoomOn && cast(event) && screenAt()) {
          const reach = ZOOM_LEVEL - 1
          zoomAim.set(
            clamp01(dragging.centre.x - (screenHit.x - dragging.from.x) / reach),
            clamp01(dragging.centre.y - (screenHit.y - dragging.from.y) / reach),
          )
          zoomCentre.copy(zoomAim)
        }
        wake()
        return
      }
      const target = pick(event)
      if (target !== hover) {
        hover = target
        surface.style.cursor = cursorFor(target)
      }
      wake()
    },
    { signal },
  )
  surface.addEventListener(
    'pointerleave',
    () => {
      pointer = undefined
      hover = undefined
      surface.style.cursor = ''
      wake()
    },
    { signal },
  )
  surface.addEventListener(
    'pointerdown',
    (event) => {
      pressed = { x: event.clientX, y: event.clientY, id: event.pointerId }
      if (!zoomOn || pick(event) !== 'screen') return
      dragging = { id: event.pointerId, from: screenHit.clone(), centre: zoomCentre.clone() }
      surface.setPointerCapture(event.pointerId)
      surface.style.cursor = 'grabbing'
    },
    { signal },
  )
  surface.addEventListener(
    'pointercancel',
    () => {
      pressed = undefined
      dragging = undefined
      surface.style.cursor = cursorFor(hover)
    },
    { signal },
  )
  surface.addEventListener(
    'pointerup',
    (event) => {
      const start = pressed
      pressed = undefined
      if (dragging && dragging.id === event.pointerId) {
        dragging = undefined
        surface.style.cursor = cursorFor(hover)
      }
      if (!start || start.id !== event.pointerId) return
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) return
      const target = pick(event)
      if (target === 'crystal') setPower(!powered)
      else if (target === 'screen') {
        if (booting()) skipBoot()
        else if (powered && count > 1) show(index + 1)
        else if (powered) setZoom(!zoomOn, screenHit)
        else {
          hintAt = now()
          wake()
        }
      }
    },
    { signal },
  )
  buttons.power?.addEventListener('click', () => setPower(!powered), { signal })
  buttons.zoom?.addEventListener('click', () => setZoom(!zoomOn), { signal })
  buttons.previous?.addEventListener('click', () => show(index - 1), { signal })
  buttons.next?.addEventListener('click', () => show(index + 1), { signal })
  document.addEventListener(
    'visibilitychange',
    () => {
      if (!document.hidden) wake()
    },
    { signal },
  )

  const frameScene = (): void => {
    const width = host.clientWidth
    const height = host.clientHeight
    if (width === 0 || height === 0) return
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      2,
      Math.sqrt(PIXEL_BUDGET / (width * height)),
    )
    surface.width = Math.max(1, Math.round(width * ratio))
    surface.height = Math.max(1, Math.round(height * ratio))
    camera.aspect = width / height
    const half = Math.tan((FOV * Math.PI) / 360)
    const spanX = 0.49 * 1.07
    const spanY = 0.208 * 1.14
    const distance = Math.max(spanY / half, spanX / (half * camera.aspect)) + 0.075
    camera.position.set(0, 0, distance)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    const screenHeight = model ? model.screenBox.max.y - model.screenBox.min.y : 0.3
    const screenWidth = model ? model.screenBox.max.x - model.screenBox.min.x : 0.7
    const projected = (screenHeight / (2 * (distance - 0.05) * half)) * surface.height
    const rtHeight = Math.round(Math.min(900, Math.max(200, projected)))
    const aspect = screenWidth / screenHeight
    const rtWidth = Math.round(rtHeight * aspect)
    crtTarget.setSize(rtWidth, rtHeight)
    crtUniforms.uResolution.value.set(rtWidth, rtHeight)
    crtUniforms.uAspect.value = aspect
    crtUniforms.uLines.value = Math.round(Math.min(288, Math.max(96, projected / 2.6)))
    crtUniforms.uBootLod.value = Math.max(0, Math.log2(BOOT_HEIGHT / rtHeight))
    crtUniforms.uMask.value = projected > 640 ? 0.1 : 0
    lastDraw = 0
    wake()
  }

  const update = (t: number, dt: number): boolean => {
    let busy = false
    const field = Math.floor(t * FIELD_RATE)
    const beam = signalOf(powered, t - powerAt, calm, never, field, bootMode)
    busy ||= beam.busy
    const change = switchOf(t - switchAt, calm)
    if (change.swapped || !powered) shown = index
    busy ||= change.busy && powered
    if (powered && change.busy && change.swapped && osdAt < switchAt)
      showOsd(copy.channel(index), 'right', t)
    if (
      powered &&
      !calm &&
      cadranTime(t - powerAt, bootMode) > CADRAN_SWITCH_AT + 0.3 &&
      osdAt < powerAt
    )
      showOsd(copy.play, 'left', t)
    let halo = 0
    if (powered) {
      bootMix = beam.boot
      if (bootMix > 0) {
        const cadran = cadranFrame(t - powerAt, calm, bootMode)
        halo = cadran.halo * cadran.alpha
        paintBoot(cadran)
      }
    } else if (never) bootMix = 0
    crtUniforms.uBootMix.value = bootMix

    const slide = slides[shown]
    const picture = pictures[shown]
    const ready = slide?.texture
    crtUniforms.uImage.value = ready ?? blank
    crtUniforms.uSignal.value = ready ? 1 : 0
    if (slide && picture) {
      fitVector.x = slide.aspect
      fitVector.y = (picture.fit ?? ALMANACH_FIT) === 'cover' ? 1 : 0
      fitVector.z = picture.focus?.[0] ?? 0.5
      fitVector.w = 1 - (picture.focus?.[1] ?? 0.5)
      crtUniforms.uMirror.value = picture.mirrored ? 1 : 0
    }
    let track = 0
    let trackAt = 0.1
    if (powered && !calm && cadranTime(t - powerAt, bootMode) > BOOT_SETTLED) {
      const g = t - glitchAt
      if (g > 0 && g < 1.1) {
        track = Math.sin((Math.PI * g) / 1.1) * 0.85
        trackAt = 0.04 + g * 0.5
        busy = true
      } else if (g >= 1.1) glitchAt = t + 8 + Math.random() * 10
    }
    const osdAge = t - osdAt
    const osdAlpha = osdAge < 2.2 ? 1 : 1 - ramp(osdAge, 2.2, 2.8)
    crtUniforms.uOsdAlpha.value = powered ? Math.max(0, osdAlpha) : 0
    crtUniforms.uOsdLeft.value = osdAlign === 'left' ? 1 : 0
    if (osdAge < 3) busy = true
    crtUniforms.uTime.value = t
    crtUniforms.uSeed.value = calm ? 7 : field % 4096
    crtUniforms.uOpen.value.set(beam.openX, beam.openY)
    crtUniforms.uFlash.value = beam.flash
    crtUniforms.uBrightness.value = beam.brightness * (powered ? change.dim : 1)
    crtUniforms.uNoise.value = beam.noise
    crtUniforms.uWobble.value = calm ? 0 : beam.wobble
    crtUniforms.uAberration.value = beam.aberration
    crtUniforms.uSnow.value = powered ? change.snow : 0
    const zoomSpan = calm ? CALM_ZOOM_TIME : ZOOM_TIME
    const zoomProgress = easeInOut(ramp(t - zoomAt, 0, zoomSpan))
    zoomLevel = zoomFrom + ((zoomOn ? ZOOM_LEVEL : 1) - zoomFrom) * zoomProgress
    zoomCentre.lerp(zoomAim, 1 - Math.exp(-dt * 10))
    if (zoomProgress < 1 || zoomCentre.distanceToSquared(zoomAim) > 1e-8) busy = true
    crtUniforms.uZoom.value.set(zoomCentre.x, zoomCentre.y, zoomLevel)
    const zoomBlur = calm ? 0 : 1.4 * bell(t - zoomAt, 0, zoomSpan * 0.45, zoomSpan)
    crtUniforms.uBlur.value = Math.max(powered ? change.blur : 0, zoomBlur)
    const rolling = powered && !calm && change.busy
    crtUniforms.uRoll.value = rolling ? change.roll : powered && !calm ? beam.roll : 0
    crtUniforms.uTear.value = powered && !calm ? Math.max(change.tear, beam.tear) : 0
    crtUniforms.uTrack.value = track
    crtUniforms.uTrackAt.value = trackAt

    gemLit += (beam.catalyst - gemLit) * (1 - Math.exp(-dt * 14))
    const hoverTarget = hover === 'crystal' ? 1 : 0
    hoverGlow += (hoverTarget - hoverGlow) * (1 - Math.exp(-dt * 7))
    if (Math.abs(hoverTarget - hoverGlow) > 0.002) busy = true
    if (Math.abs(beam.catalyst - gemLit) > 0.002) busy = true
    const hint = Math.max(0, 1 - (t - hintAt) / 1.2)
    if (hint > 0) busy = true
    const pulse = powered && !calm ? 0.18 * Math.sin(t * 2.2) : 0
    if (powered && !calm) busy = true
    bodyUniforms.uGemLit.value = Math.min(1, gemLit + hint * 0.6 * Math.abs(Math.sin(t * 9)))
    bodyUniforms.uGemGlow.value =
      0.14 + gemLit * (2.1 + pulse) + hoverGlow * 0.55 + hint * 1.4 * Math.abs(Math.sin(t * 9))
    if (magic) {
      if (!calm) {
        magicTime += dt * (MAGIC_DORMANT_PACE + (1 - MAGIC_DORMANT_PACE) * gemLit)
        busy = true
      }
      bodyUniforms.uMagicTime.value = magicTime
      bodyUniforms.uMagicPower.value = gemLit
      bodyUniforms.uMagicGain.value = 1 + 0.35 * hoverGlow + 0.8 * hint * Math.abs(Math.sin(t * 9))
    }
    const glow = beam.light * (ready || bootMix > 0 ? 1 : 0.35) * 1.6
    const rim = bodyUniforms.uRimLight.value
    if (look.light === 'picture') {
      const light = slides[shown]?.light
      rim.set(light?.r ?? 0.5, light?.g ?? 0.5, light?.b ?? 0.5)
    } else {
      rim.copy(customLight)
    }
    rim.lerp(bootLight.set(BOOT_LIGHT.r, BOOT_LIGHT.g, BOOT_LIGHT.b), bootMix)
    rim.multiplyScalar(glow * (1 + 0.6 * halo * bootMix))

    if (pointer) {
      tilt.targetYaw = TILT.yaw * Math.tanh((pointer.x - 0.5) * 2 * TILT.reach)
      tilt.targetPitch = TILT.pitch * Math.tanh((pointer.y - 0.5) * 2 * TILT.reach)
    } else {
      tilt.targetYaw = 0
      tilt.targetPitch = 0
    }
    if (powered && !calm) {
      tilt.targetYaw += SWAY.yaw * Math.sin(t * 0.37)
      tilt.targetPitch += SWAY.pitch * Math.sin(t * 0.29 + 1.3)
    }
    const k = 1 - Math.exp(-dt * 5)
    tilt.yaw += (tilt.targetYaw - tilt.yaw) * k
    tilt.pitch += (tilt.targetPitch - tilt.pitch) * k
    if (Math.abs(tilt.targetYaw - tilt.yaw) + Math.abs(tilt.targetPitch - tilt.pitch) > 1e-4)
      busy = true
    rig.rotation.set(tilt.pitch, tilt.yaw, 0)
    crtUniforms.uSheen.value = 0.55 + tilt.yaw * 2.2 - tilt.pitch * 1.6
    return busy
  }

  const draw = (): void => {
    if (!joined || !model || !context2d) return
    const { renderer } = joined
    const width = surface.width
    const height = surface.height
    if (joined.width < width || joined.height < height) {
      joined.width = Math.max(joined.width, width)
      joined.height = Math.max(joined.height, height)
      renderer.setSize(joined.width, joined.height, false)
    }
    scene.environment = lighting ?? joined.environment
    renderer.setRenderTarget(crtTarget)
    renderer.render(crtScene, crtCamera)
    renderer.setRenderTarget(null)
    renderer.setViewport(0, 0, width, height)
    renderer.setScissor(0, 0, width, height)
    renderer.setScissorTest(true)
    renderer.render(scene, camera)
    renderer.setScissorTest(false)
    context2d.clearRect(0, 0, width, height)
    context2d.drawImage(
      renderer.domElement,
      0,
      joined.height - height,
      width,
      height,
      0,
      0,
      width,
      height,
    )
  }

  const tick = (ms: number): void => {
    frame = 0
    if (destroyed || !joined) return
    const t = ms / 1000
    const dt = Math.min(0.1, Math.max(0, t - lastFrame))
    lastFrame = t
    const busy = update(t, dt)
    const transitioning =
      cadranTime(t - powerAt, bootMode) < BOOT_SETTLED ||
      t - switchAt < 1 ||
      t - zoomAt < ZOOM_TIME ||
      pointer !== undefined
    const rate = powered ? IDLE_RATE : DORMANT_RATE
    if (!busy || transitioning || t - lastDraw >= 1 / rate - 0.004) {
      draw()
      lastDraw = t
    }
    if (busy) wake()
  }

  const lose = (): void => {
    if (!destroyed) teardown.abort()
  }

  const prepare = (): Promise<void> => {
    if (preparing) return preparing
    preparing = (async () => {
      if (!context2d) throw new Error('the almanach could not draw its canvas')
      const shared = joinStage(lose)
      joined = shared
      scene.environmentIntensity = ENVIRONMENT_INTENSITY
      const first = loadSlide(index)
      const environment =
        options.environment === false
          ? undefined
          : options.environment === undefined
            ? new URL(ENVIRONMENT_FILE, new URL(options.model, document.baseURI)).href
            : new URL(options.environment, document.baseURI).href
      const lit = environment
        ? lightingOf(shared, environment).catch(() => undefined)
        : Promise.resolve(undefined)
      const loaded = await modelAt(options.model)
      lighting = await lit
      dressing = dress()
      await dressing
      signal.throwIfAborted()
      model = loaded
      const anisotropy = Math.min(8, shared.renderer.capabilities.getMaxAnisotropy())
      for (const texture of [loaded.color, loaded.orm, loaded.normal, loaded.parts]) {
        texture.anisotropy = anisotropy
      }
      bodyMaterial.map = loaded.color
      bodyMaterial.metalnessMap = loaded.orm
      bodyMaterial.roughnessMap = loaded.orm
      bodyMaterial.normalMap = loaded.normal
      bodyMaterial.needsUpdate = true
      bodyUniforms.uParts.value = loaded.parts
      bodyUniforms.uAlmanachSpace.value.copy(loaded.body.matrix)
      bodyUniforms.uCrystal.value.copy(loaded.crystal)
      bodyUniforms.uCrystalRadius.value = loaded.crystalRadius
      const body = new Mesh(loaded.body.geometry, bodyMaterial)
      const screen = new Mesh(loaded.screen.geometry, screenMaterial)
      const back = new Mesh(loaded.back.geometry, backMaterial)
      for (const [mesh, source] of [
        [body, loaded.body],
        [screen, loaded.screen],
        [back, loaded.back],
      ] as const) {
        mesh.matrixAutoUpdate = false
        mesh.matrix.copy(source.matrix)
        almanach.add(mesh)
      }
      await first?.catch(() => undefined)
      signal.throwIfAborted()
    })()
    preparing.catch((error: unknown) => {
      if (!signal.aborted && !(error instanceof AlmanachUnavailable)) console.error(error)
      rejectReady(error)
      teardown.abort()
    })
    return preparing
  }

  let resolveReady: () => void = () => undefined
  let rejectReady: (error: unknown) => void = () => undefined
  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })
  ready.catch(() => undefined)

  const present = (): void => {
    if (presented || destroyed || !visible) return
    presented = true
    host.prepend(surface)
    host.append(status)
    if (toolbar) host.after(toolbar)
    host.setAttribute(LIT, '')
    host.scrollLeft = 0
    frameScene()
    announce()
    prefetch()
    const start = options.power ?? 'auto'
    if (start === true || (start === 'auto' && count > 0)) setPower(true, options.boot ?? 'fast')
    else draw()
    wake()
    resolveReady()
  }

  const sight = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? false
      if (!visible) return
      prepare().then(present, () => undefined)
      wake()
    },
    { rootMargin: '200px 0px' },
  )
  const resize = new ResizeObserver(() => frameScene())
  sight.observe(host)
  resize.observe(host)
  prepareOnApproach(
    host,
    () => {
      void prepare()
    },
    signal,
  )

  signal.addEventListener(
    'abort',
    () => {
      destroyed = true
      setBattery(false)
      window.cancelAnimationFrame(frame)
      frame = 0
      sight.disconnect()
      resize.disconnect()
      sound.close()
      for (const slide of slides) slide.texture?.dispose()
      crtTarget.dispose()
      crtMaterial.dispose()
      crtQuad.geometry.dispose()
      bodyMaterial.dispose()
      screenMaterial.dispose()
      backMaterial.dispose()
      osdTexture.dispose()
      boot?.texture.dispose()
      blank.dispose()
      if (joined) leaveStage(joined, lose)
      joined = undefined
      lighting = undefined
      surface.remove()
      status.remove()
      toolbar?.remove()
      host.removeAttribute(LIT)
      host.removeAttribute(POWERED)
      rejectReady(new Error('the almanach was destroyed'))
    },
    { once: true },
  )

  return {
    ready,
    state,
    power: (on, boot) => setPower(on ?? !powered, boot),
    zoom: (on) => setZoom(on ?? !zoomOn),
    battery: (level) => {
      setBattery(level)
      wake()
    },
    show,
    next: () => show(index + 1),
    previous: () => show(index - 1),
    look: (patch) => {
      applyLook(patch)
      options.onState?.(state())
      lastDraw = 0
      wake()
    },
    add: (picture) => {
      pictures.push(picture)
      slides.push(emptySlide())
      count = pictures.length
      return count - 1
    },
    reframe: (fit, focus) => {
      const current = pictures[index]
      if (!current) return
      const kept = focus ?? current.focus
      pictures[index] = {
        src: current.src,
        alt: current.alt,
        fit,
        ...(kept ? { focus: kept } : {}),
      }
      wake()
    },
    motion: (mode) => {
      calm = mode === 'calm'
      crtUniforms.uMotion.value = calm ? 0 : 1
      wake()
    },
    volume: (level) => {
      sound.setVolume(level)
    },
    destroy: () => teardown.abort(),
  }
}
