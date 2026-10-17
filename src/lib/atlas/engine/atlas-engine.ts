import {
  DataTexture,
  DirectionalLight,
  FogExp2,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearSRGBColorSpace,
  Mesh,
  NearestFilter,
  NoToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  type Ray,
  RepeatWrapping,
  RGBAFormat,
  RGFormat,
  Scene,
  SphereGeometry,
  UnsignedByteType,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { View } from '../contract/camera.ts'
import type { MapDisplay } from '../contract/display.ts'
import type { MapHover } from '../contract/hover.ts'
import type { FromWorker } from '../contract/protocol.ts'
import {
  MAX_PIXEL_RATIO,
  TIER_SETTINGS,
  type Tier,
  type TierSettings,
} from '../contract/quality.ts'
import {
  type RevealField,
  SCENE_LAYERS,
  type SceneLayer,
  type SceneTextures,
} from '../contract/scene.ts'
import { DEFAULT_HOUR, DEFAULT_SEASON, normalHour, normalSeason } from '../contract/time-of-day.ts'
import { MIST, mistRoomCovers } from '../kernel/mist.ts'
import { isUnexplored, unexploredMarks } from '../kernel/reveal.ts'
import { routeLine } from '../kernel/routes.ts'
import { itemsAt } from '../world/derive.ts'
import type { Grid } from '../world/grid.ts'
import type { World } from '../world/model.ts'
import type { AtlasRef } from '../world/refs.ts'
import { floorY, type ReliefField, ROCK_TOP, reliefField, surfaceY } from '../world/relief.ts'
import type { StarSystem } from '../world/stars.ts'
import type { Point, TravelResult } from '../world/travel.ts'
import { CameraRig } from './camera-rig.ts'
import { Daylight, type Lights, lightUnderground, undergroundFog } from './daylight.ts'
import { EffectsView } from './effects-view.ts'
import { SkyEnvironment } from './environment.ts'
import { FrameScheduler } from './frame-scheduler.ts'
import { type Hud, HudView } from './hud.ts'
import { MapInput } from './input.ts'
import { LabelLayer, labelSpecs } from './labels.ts'
import { MaterialLibrary } from './materials/library.ts'
import { createUniforms, OFF_GRID, type SharedUniforms } from './materials/uniforms.ts'
import { Beacon, type PathPoint, TravelPath } from './overlays.ts'
import { PaceCheck } from './pace-check.ts'
import { MapPicker } from './picking.ts'
import { PostPipeline, type PostSettings, renderSize } from './post.ts'
import { SceneContent } from './scene-content.ts'
import { beaconHeight, focusOf, isSmall, levelOf, SelectionTextures } from './selection.ts'
import { VehiclesView } from './vehicles-view.ts'
import { type ShaderProbes, shaderProbes } from './warm-up.ts'

export type EngineEvents = {
  firstTerrain: () => void
  compiled: () => void
  view: (view: View) => void
  level: (level: number) => void
  select: (ref: AtlasRef | undefined, focus: boolean) => void
  pick: (ref: AtlasRef) => void
  hover: (target: MapHover | undefined) => void
  escape: () => void
  settle: (x: number, z: number) => void
  slow: () => void
  contextLost: () => void
  contextRestored: () => void
}

export type EngineOptions = {
  container: HTMLElement
  label: string
  unexploredLabel: string
  locale: string
  world: World
  grid: Grid
  stars: StarSystem
  tier: Tier
  view: View
  animated: boolean
  maxSamples: number
  screen: boolean
  display: MapDisplay
  events: EngineEvents
}

const SHADOW_FRAME = { near: 1, far: 260, distance: 120, texels: 512 }
const OVERVIEW_REACH = 125
const SUN_TURN_LIMIT = Math.cos((0.25 * Math.PI) / 180)
const HIGH_DPR_SAMPLES = 2
const ULTRA_PIXEL_LIMIT = 8_300_000
const MSAA_SAMPLES = 4
const HUD_MS = 100
const TOOLTIP_OFFSET = { x: 16, y: 18, flip: 14, edge: 8 }
const TRAVEL_STEP = 0.08
const AIR_POINTS = 90
const SETTLE_MOVE = 8
const COMPILE_PATIENCE_MS = 4000
const RESIZE_SETTLE_MS = 150
const OPEN_SEA_VIEW = 30

function postSettings(
  settings: TierSettings,
  tier: Tier,
  canvasPixels: number,
  ratio: number,
  maxSamples: number,
): PostSettings {
  let samples = 0
  if (settings.antialias === 'msaa') {
    samples = MSAA_SAMPLES
    const pixels = canvasPixels * settings.renderScale * settings.renderScale
    if (tier === 'high' && ratio >= 1.5) samples = HIGH_DPR_SAMPLES
    if (tier === 'ultra' && pixels > ULTRA_PIXEL_LIMIT) samples = HIGH_DPR_SAMPLES
    samples = Math.min(samples, maxSamples)
  }
  return {
    samples,
    bloomLevels: settings.bloomLevels,
    bloomScale: settings.bloomScale,
    fxaa: settings.antialias === 'fxaa',
    renderScale: settings.renderScale,
  }
}

function airPath(from: Point, to: Point): PathPoint[] {
  const a: PathPoint = [from.x, from.y + 0.3, from.z]
  const b: PathPoint = [to.x, to.y + 0.3, to.z]
  const span = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const middle: PathPoint = [
    (a[0] + b[0]) / 2,
    Math.max(a[1], b[1]) + 1.5 + span * 0.08,
    (a[2] + b[2]) / 2,
  ]
  return Array.from({ length: AIR_POINTS + 1 }, (_, k) => {
    const t = k / AIR_POINTS
    const u = 1 - t
    return [
      u * u * a[0] + 2 * u * t * middle[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * middle[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * middle[2] + t * t * b[2],
    ]
  })
}

export class AtlasEngine {
  readonly world: World
  readonly grid: Grid
  readonly field: ReliefField
  readonly canvas: HTMLCanvasElement
  readonly camera = new PerspectiveCamera(32, 1, 0.3, 4000)
  readonly rig: CameraRig
  private readonly container: HTMLElement
  private readonly events: EngineEvents
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly uniforms: SharedUniforms
  private readonly materials: MaterialLibrary
  private readonly post: PostPipeline
  private readonly content: SceneContent
  private readonly effects: EffectsView
  private readonly vehicles: VehiclesView
  private readonly input: MapInput
  private readonly picker: MapPicker
  private readonly labels: LabelLayer
  private readonly hud: HudView
  private readonly beacon: Beacon
  private readonly travel: TravelPath
  private readonly scheduler: FrameScheduler
  private readonly lights: Lights
  private readonly key = new DirectionalLight(0xffffff, 3)
  private readonly fills = [new DirectionalLight(0xffffff, 0), new DirectionalLight(0xffffff, 0)]
  private readonly daylight: Daylight
  private readonly environment: SkyEnvironment
  private readonly fog = new FogExp2(0x9ab0c8, 0.003)
  private readonly resizer: ResizeObserver
  private readonly stop = new AbortController()
  private readonly tileInfo: DataTexture[] = []
  private readonly probes: ShaderProbes
  private selectionTextures: SelectionTextures | undefined
  private reveal: RevealField | undefined
  private mistRoom: (x: number, z: number) => boolean = () => false
  private readonly unexploredLabel: string
  private tier: Tier
  private settings: TierSettings
  private readonly maxSamples: number
  private hour = DEFAULT_HOUR
  private season = DEFAULT_SEASON
  private level = 0
  private travelLevel = 0
  private display: MapDisplay
  private selected: AtlasRef | undefined
  private hovered = ''
  private tooltip: HTMLElement | undefined
  private picking = false
  private time = 0
  private width = 1
  private height = 1
  private ratio = 1
  private shownTerrain = false
  private shadowsStale = true
  private labelsStale = true
  private wasMoving = false
  private lastHud = 0
  private frameCount = 0
  private readonly shadowCentre = new Vector3(Number.NaN, 0, 0)
  private shadowSpan = 0
  private readonly lastSun = new Vector3()
  private readonly lastSettle = { x: Number.NaN, z: Number.NaN }
  private readonly pace = new PaceCheck()
  private compileGeneration = 0
  private resizeTimer = 0
  private compiling: number | undefined
  private covered = true
  private readonly afterFrames: (() => void)[] = []

  constructor(options: EngineOptions) {
    const { container, world, grid } = options
    this.container = container
    this.world = world
    this.grid = grid
    this.events = options.events
    this.tier = options.tier
    this.settings = TIER_SETTINGS[options.tier]
    this.maxSamples = options.maxSamples
    this.unexploredLabel = options.unexploredLabel
    this.display = options.display
    this.daylight = new Daylight(options.stars)
    this.field = reliefField(grid, world.surface)
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'au-atlas__canvas'
    this.canvas.tabIndex = 0
    this.canvas.setAttribute('role', 'img')
    this.canvas.setAttribute('aria-label', options.label)
    container.prepend(this.canvas)
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      depth: false,
      stencil: false,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: options.tier === 'ultra' ? 'high-performance' : 'default',
    })
    this.renderer.outputColorSpace = LinearSRGBColorSpace
    this.renderer.toneMapping = NoToneMapping
    this.renderer.shadowMap.type = PCFShadowMap
    this.renderer.shadowMap.autoUpdate = false
    this.uniforms = createUniforms(grid.originX, grid.originZ)
    this.materials = new MaterialLibrary(
      this.uniforms,
      { columns: grid.columns, rows: grid.rows, originZ: grid.originZ },
      this.settings.shaderDetail,
    )
    this.ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    this.post = new PostPipeline(
      this.renderer,
      postSettings(this.settings, this.tier, 1, this.ratio, this.maxSamples),
      this.uniforms.uTime,
    )
    this.post.setScreen(options.screen)
    this.content = new SceneContent(this.scene, this.materials, this.display.routes)
    this.content.setDensity(this.settings.propDensity)
    this.content.setReveals(options.animated)
    this.effects = new EffectsView(this.materials, this.settings, this.display.effects)
    this.vehicles = new VehiclesView(this.materials, this.settings, (x, z) =>
      Math.max(surfaceY(this.field, x, z), 0),
    )
    this.scene.fog = this.fog
    this.key.shadow.bias = -0.0007
    this.key.shadow.normalBias = 0.06
    this.key.shadow.camera.near = SHADOW_FRAME.near
    this.key.shadow.camera.far = SHADOW_FRAME.far
    this.scene.add(this.key, this.key.target, ...this.fills)
    this.lights = {
      key: this.key,
      fills: this.fills,
      fog: this.fog,
      uniforms: this.uniforms,
      grade: this.post.gradeUniforms,
      bloomThreshold: this.post.bloomThreshold,
    }
    this.applyShadowSettings()
    this.addSky()
    this.beacon = new Beacon(this.materials)
    this.travel = new TravelPath(this.materials)
    this.scene.add(this.beacon.group, this.travel.group)
    this.applyVisibility()
    this.picker = new MapPicker(world, this.field)
    this.hud = new HudView(options.locale)
    this.labels = new LabelLayer(
      container,
      labelSpecs(world, this.field),
      this.display.labels,
      (ref) => this.chooseLabel(ref),
    )
    this.applyDisplay()
    this.rig = new CameraRig(
      options.view,
      grid.originX + OPEN_SEA_VIEW,
      grid.originZ + OPEN_SEA_VIEW,
      options.animated,
    )
    this.input = new MapInput(this.canvas, container, this.camera, this.rig, {
      activity: () => this.scheduler.invalidate(),
      hover: (x, y) => this.hover(x, y),
      leave: () => this.leave(),
      click: (x, y, double) => this.click(x, y, double),
      view: (view) => this.setView(view),
      escape: () => this.events.escape(),
    })
    this.scheduler = new FrameScheduler((now, dt, animate) => this.frame(now, dt, animate), {
      animated: options.animated,
      uncapped: options.tier === 'ultra',
    })
    this.scheduler.setCovered(true)
    this.environment = new SkyEnvironment(
      this.renderer,
      this.scene,
      this.materials.skyDome(true),
      () => this.scheduler.invalidate(false),
    )
    this.applySky()
    this.resizer = new ResizeObserver(() => this.resize())
    this.resizer.observe(container)
    const signal = this.stop.signal
    this.canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault()
        this.scheduler.suspend()
        this.events.contextLost()
      },
      { signal },
    )
    this.canvas.addEventListener(
      'webglcontextrestored',
      () => {
        this.shadowsStale = true
        this.labelsStale = true
        this.scheduler.resume()
        this.compileShaders()
        this.events.contextRestored()
      },
      { signal },
    )
    document.addEventListener('visibilitychange', () => this.scheduler.setHidden(document.hidden), {
      signal,
    })
    window.addEventListener('blur', () => this.scheduler.setBlurred(true), { signal })
    window.addEventListener('focus', () => this.scheduler.setBlurred(false), { signal })
    void document.fonts.ready.then(() => {
      this.labels.remeasure()
      this.labelsStale = true
      this.scheduler.invalidate(false)
    })
    this.probes = shaderProbes(this.materials)
    this.scene.add(this.probes.group)
    this.resize()
    this.scheduler.start()
    this.compileShaders()
  }

  get view(): View {
    return this.rig.view
  }

  get currentLevel(): number {
    return this.level
  }

  get night(): number {
    return this.uniforms.uNight.value
  }

  receive(message: FromWorker): void {
    switch (message.kind) {
      case 'textures':
        this.applyTextures(message.textures)
        break
      case 'terrain':
        this.content.terrain(message.generation, message.chunk)
        break
      case 'pieces':
        this.content.pieces(message.layer, message.pieces)
        break
      case 'props':
        this.content.addPrototypes(message.prototypes)
        this.content.addProps(message.sets)
        break
      case 'models':
        this.content.addModels(message.models)
        break
      case 'effects':
        this.effects.add(
          this.content.groups[message.layer],
          this.content.groups.surface,
          message.effects,
        )
        break
      case 'vehicles':
        this.vehicles.add(this.content.groups.routes, message.vehicles)
        break
      default:
        return
    }
    this.shadowsStale = true
    this.scheduler.invalidate(false)
  }

  setView(view: View): void {
    this.rig.setView(view)
    this.events.view(view)
    this.scheduler.invalidate()
  }

  zoom(factor: number): void {
    this.rig.zoom(factor)
    this.scheduler.invalidate()
  }

  resetNorth(): void {
    this.rig.resetNorth()
    this.scheduler.invalidate()
  }

  select(ref: AtlasRef | undefined, focus: boolean): void {
    this.selected = ref
    const level = ref ? levelOf(this.world, ref) : this.level
    if (ref && level !== this.level) this.setLevel(level)
    this.selectionTextures?.write(this.world, ref, this.level)
    this.beacon.hide()
    if (ref) {
      const point = focusOf(this.world, this.field, ref)
      if (point) {
        if (ref.kind === 'sky' || isSmall(this.world, ref)) {
          this.beacon.show(
            point.x,
            beaconHeight(this.world, this.field, ref, point, this.level),
            point.z,
          )
        }
        if (focus) this.rig.flyTo(point.x, point.z, this.rig.frameDistance(point.radius))
      }
    }
    this.scheduler.invalidate()
  }

  setPicking(on: boolean): void {
    this.picking = on
    this.canvas.style.cursor = on ? 'crosshair' : ''
  }

  showTravel(result: TravelResult): void {
    if (!result.ok) {
      this.clearTravel()
      return
    }
    const ship = result.mode === 'ship'
    let points: PathPoint[] = []
    let level = 0
    if (result.mode === 'foot') {
      level = result.stratum
      points = this.groundPath(result.tiles, level, 0.06)
    } else if (result.air) {
      points = airPath(result.air[0], result.air[1])
    } else if (result.mode !== 'fly' && result.tiles) {
      points = this.groundPath(result.tiles, 0, ship ? 0.05 : 0.06)
    }
    if (points.length < 2) {
      this.clearTravel()
      return
    }
    this.travelLevel = level
    if (level !== this.level) this.setLevel(level)
    this.travel.show(points, ship ? 0.08 : 0.07)
    this.travel.group.visible = true
    let x0 = Number.POSITIVE_INFINITY
    let x1 = Number.NEGATIVE_INFINITY
    let z0 = Number.POSITIVE_INFINITY
    let z1 = Number.NEGATIVE_INFINITY
    for (const [x, , z] of points) {
      x0 = Math.min(x0, x)
      x1 = Math.max(x1, x)
      z0 = Math.min(z0, z)
      z1 = Math.max(z1, z)
    }
    const radius = Math.max(x1 - x0, z1 - z0) * 0.62 + 2
    this.rig.flyTo(
      (x0 + x1) / 2,
      (z0 + z1) / 2,
      radius / Math.tan((this.rig.rig.fov * Math.PI) / 360),
    )
    this.scheduler.invalidate()
  }

  clearTravel(): void {
    this.travel.hide()
    this.scheduler.invalidate()
  }

  bindHud(hud: Hud): void {
    this.hud.bind(hud)
    this.lastHud = 0
    this.scheduler.invalidate(false)
  }

  bindTooltip(element: HTMLElement | undefined): void {
    this.tooltip = element
    if (element) element.style.opacity = '0'
  }

  flyTo(x: number, z: number, radius: number): void {
    this.rig.flyTo(x, z, this.rig.frameDistance(radius))
    this.scheduler.invalidate()
  }

  setSky(hour: number, season: number): void {
    this.hour = normalHour(hour)
    this.season = normalSeason(season)
    this.applySky()
    this.scheduler.invalidate()
  }

  setDisplay(display: MapDisplay): void {
    const clouds = display.effects.clouds !== this.display.effects.clouds
    this.display = display
    this.applyDisplay()
    if (clouds) this.applySky()
    this.labelsStale = true
    this.shadowsStale = true
    this.scheduler.invalidate()
  }

  setLevel(level: number): void {
    if (level === this.level) return
    this.level = level
    const tileInfo = this.tileInfo[level]
    if (tileInfo) this.uniforms.uData.value = tileInfo
    this.uniforms.uUnder.value = level > 0 ? 1 : 0
    this.selectionTextures?.write(
      this.world,
      this.selected && levelOf(this.world, this.selected) === level ? this.selected : undefined,
      level,
    )
    this.beacon.hide()
    this.applyVisibility()
    this.applySky()
    this.shadowsStale = true
    this.labelsStale = true
    this.events.level(level)
    this.scheduler.invalidate()
  }

  setScreenEffect(on: boolean): void {
    this.post.setScreen(on)
    this.scheduler.invalidate(false)
  }

  setAnimated(animated: boolean): void {
    this.content.setReveals(animated)
    this.rig.setAnimated(animated)
    this.scheduler.setAnimated(animated)
  }

  setTier(tier: Tier): void {
    if (tier === this.tier) return
    const previousDetail = this.settings.shaderDetail
    this.tier = tier
    this.settings = TIER_SETTINGS[tier]
    this.scheduler.setUncapped(tier === 'ultra')
    this.content.setDensity(this.settings.propDensity)
    this.effects.apply(this.settings)
    this.vehicles.apply(this.settings)
    this.applyShadowSettings()
    this.post.configure(
      postSettings(
        this.settings,
        tier,
        this.pixelWidth() * this.pixelHeight(),
        this.ratio,
        this.maxSamples,
      ),
    )
    this.post.resize(this.pixelWidth(), this.pixelHeight())
    this.uniforms.uPScale.value = this.pointScale()
    if (this.settings.shaderDetail !== previousDetail) {
      this.materials.setDetail(this.settings.shaderDetail)
    }
    this.shadowsStale = true
    this.pace.restart()
    this.compileShaders()
  }

  invalidate(): void {
    this.scheduler.invalidate(false)
  }

  uncover(): void {
    if (!this.covered) return
    this.covered = false
    this.labelsStale = true
    this.lastHud = 0
    this.scheduler.setCovered(false)
    this.scheduler.invalidate()
  }

  afterFrame(callback: () => void): void {
    this.afterFrames.push(callback)
    this.scheduler.invalidate(false)
  }

  surfaceAt(x: number, z: number): number {
    return surfaceY(this.field, x, z)
  }

  discovered(ref: AtlasRef): boolean {
    if (ref.kind !== 'tile' && ref.kind !== 'under') return true
    return !this.unexploredTile(ref.tile)
  }

  suspend(): void {
    this.scheduler.suspend()
  }

  resume(): void {
    this.scheduler.resume()
  }

  dispose(): void {
    window.clearTimeout(this.resizeTimer)
    this.stop.abort()
    this.scheduler.dispose()
    this.resizer.disconnect()
    this.input.dispose()
    this.labels.dispose()
    this.environment.dispose()
    this.probes.dispose()
    this.beacon.dispose()
    this.travel.dispose()
    this.effects.dispose()
    this.vehicles.dispose()
    this.content.dispose()
    this.materials.dispose()
    this.post.dispose()
    for (const texture of this.tileInfo) texture.dispose()
    for (const uniform of [
      this.uniforms.uNoise,
      this.uniforms.uWaterN,
      this.uniforms.uHeight,
      this.uniforms.uSkyData,
      this.uniforms.uReveal,
    ]) {
      uniform.value?.dispose()
    }
    this.scene.traverse((object) => {
      if (object instanceof Mesh) object.geometry.dispose()
    })
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.canvas.remove()
  }

  private compileShaders(): void {
    const generation = ++this.compileGeneration
    if (this.compiling === undefined) this.scheduler.hold()
    this.compiling = generation
    const done = () => {
      if (this.compiling !== generation) return
      this.compiling = undefined
      this.scheduler.release()
      this.events.compiled()
    }
    void Promise.all([
      this.renderer.compileAsync(this.scene, this.camera),
      this.renderer.compileAsync(this.post.probes, this.post.probeCamera),
    ]).then(done)
    window.setTimeout(done, COMPILE_PATIENCE_MS)
  }

  private groundPath(tiles: Int32Array, level: number, lift: number): PathPoint[] {
    const under =
      level > 0 ? this.world.underground.find((record) => record.level === level) : undefined
    return routeLine(this.grid, tiles, TRAVEL_STEP).map(([x, z]) => {
      const y = under
        ? floorY(this.grid, under.floor, x, z) + 0.02
        : Math.max(surfaceY(this.field, x, z), 0)
      return [x, y + lift, z]
    })
  }

  private chooseLabel(ref: AtlasRef): void {
    if (this.picking) this.events.pick(ref)
    else this.events.select(ref, true)
  }

  private unexploredTile(tile: number): boolean {
    const reveal = this.reveal
    return (
      reveal !== undefined && isUnexplored(reveal, this.grid.x[tile] ?? 0, this.grid.z[tile] ?? 0)
    )
  }

  private targetAt(clientX: number, clientY: number, landmarks: boolean): MapHover | undefined {
    const ray = this.input.rayAt(clientX, clientY)
    const ref = this.refAt(ray, landmarks)
    if (ref?.kind === 'tile' || ref?.kind === 'under') {
      return this.unexploredTile(ref.tile) ? { kind: 'unexplored' } : { kind: 'ref', ref }
    }
    if (ref) return { kind: 'ref', ref }
    return this.unexploredSea(ray) ? { kind: 'unexplored' } : undefined
  }

  private unexploredSea(ray: Ray): boolean {
    const reveal = this.reveal
    if (!reveal || ray.direction.y >= 0) return false
    const t = -ray.origin.y / ray.direction.y
    return isUnexplored(
      reveal,
      ray.origin.x + ray.direction.x * t,
      ray.origin.z + ray.direction.z * t,
    )
  }

  private refAt(ray: Ray, landmarks: boolean): AtlasRef | undefined {
    const sky = this.picker.sky(ray, this.level)
    if (sky >= 0) return { kind: 'sky', sky }
    if (landmarks && this.level === 0) {
      const landmark = this.picker.landmark(ray, this.content.landmarks)
      if (landmark >= 0) return { kind: 'landmark', landmark }
    }
    const tile = this.picker.tile(ray, this.level, this.rig.rig.dist)
    if (tile < 0) return undefined
    return this.level > 0 ? { kind: 'under', level: this.level, tile } : { kind: 'tile', tile }
  }

  private hover(clientX: number, clientY: number): void {
    const target = this.targetAt(clientX, clientY, false)
    const ref = target?.kind === 'ref' ? target.ref : undefined
    const { uHover, uHoverSky } = this.uniforms
    uHover.value.set(OFF_GRID, OFF_GRID)
    uHoverSky.value.set(OFF_GRID, OFF_GRID)
    if (ref?.kind === 'sky') {
      const tile = this.world.sky.tile[ref.sky] ?? 0
      uHoverSky.value.set(this.grid.q[tile] ?? 0, this.grid.r[tile] ?? 0)
    } else if (ref?.kind === 'tile' || ref?.kind === 'under') {
      uHover.value.set(this.grid.q[ref.tile] ?? 0, this.grid.r[ref.tile] ?? 0)
    }
    const key = target ? JSON.stringify(target) : ''
    if (key !== this.hovered) {
      this.hovered = key
      this.events.hover(target)
    }
    this.placeTooltip(clientX, clientY, target !== undefined)
    this.scheduler.invalidate(false)
  }

  private leave(): void {
    this.uniforms.uHover.value.set(OFF_GRID, OFF_GRID)
    this.uniforms.uHoverSky.value.set(OFF_GRID, OFF_GRID)
    if (this.hovered !== '') {
      this.hovered = ''
      this.events.hover(undefined)
    }
    if (this.tooltip) this.tooltip.style.opacity = '0'
    this.scheduler.invalidate(false)
  }

  private placeTooltip(clientX: number, clientY: number, shown: boolean): void {
    const tooltip = this.tooltip
    if (!tooltip) return
    tooltip.style.opacity = shown ? '1' : '0'
    if (!shown) return
    const rect = this.container.getBoundingClientRect()
    let x = clientX - rect.left + TOOLTIP_OFFSET.x
    let y = clientY - rect.top + TOOLTIP_OFFSET.y
    if (x + tooltip.offsetWidth > this.width - TOOLTIP_OFFSET.edge)
      x = clientX - rect.left - tooltip.offsetWidth - TOOLTIP_OFFSET.flip
    if (y + tooltip.offsetHeight > this.height - TOOLTIP_OFFSET.edge)
      y = clientY - rect.top - tooltip.offsetHeight - TOOLTIP_OFFSET.flip
    tooltip.style.transform = `translate3d(${x}px,${y}px,0)`
  }

  private click(clientX: number, clientY: number, double: boolean): void {
    const target = this.targetAt(clientX, clientY, true)
    const ref = target?.kind === 'ref' ? target.ref : undefined
    if (this.picking) {
      if (ref) this.events.pick(ref)
      return
    }
    if (double && ref?.kind === 'sky') {
      const place = this.world.sky.place[ref.sky] ?? -1
      if (place >= 0) {
        this.events.select({ kind: 'place', place }, true)
        return
      }
    }
    if (double && ref?.kind === 'under') {
      const under = this.world.underground.find((record) => record.level === ref.level)
      const place = [
        under?.quarter[ref.tile],
        under?.cavern[ref.tile],
        under?.network[ref.tile],
      ].find((value) => (value ?? -1) >= 0)
      if (place !== undefined) {
        this.events.select({ kind: 'place', place }, true)
        return
      }
    }
    if (double && ref?.kind === 'tile') {
      const city = this.world.surface.city[ref.tile] ?? -1
      const [natural] = itemsAt(this.world.surface.naturals, ref.tile)
      const place = city >= 0 ? city : natural
      if (place !== undefined && place >= 0) {
        this.events.select({ kind: 'place', place }, true)
        return
      }
    }
    this.events.select(ref, false)
  }

  private addSky(): void {
    const dome = new Mesh(new SphereGeometry(1, 48, 24), this.materials.skyDome(false))
    dome.scale.setScalar(1500)
    dome.frustumCulled = false
    dome.renderOrder = 100
    dome.name = 'sky-dome'
    this.content.groups.sky.add(dome)
  }

  private applyTextures(textures: SceneTextures): void {
    const noise = new DataTexture(
      textures.noise,
      textures.noiseSize,
      textures.noiseSize,
      RGBAFormat,
    )
    noise.wrapS = RepeatWrapping
    noise.wrapT = RepeatWrapping
    noise.magFilter = LinearFilter
    noise.minFilter = LinearMipmapLinearFilter
    noise.generateMipmaps = true
    noise.anisotropy = 4
    noise.needsUpdate = true
    const water = new DataTexture(
      textures.waterNormal,
      textures.noiseSize,
      textures.noiseSize,
      RGBAFormat,
    )
    water.wrapS = RepeatWrapping
    water.wrapT = RepeatWrapping
    water.magFilter = LinearFilter
    water.minFilter = LinearMipmapLinearFilter
    water.generateMipmaps = true
    water.needsUpdate = true
    const height = new DataTexture(
      textures.heights,
      textures.heightWidth,
      textures.heightHeight,
      RGBAFormat,
    )
    height.magFilter = LinearFilter
    height.minFilter = LinearFilter
    height.needsUpdate = true
    const tile = (data: Uint8Array) => {
      const texture = new DataTexture(data, this.grid.columns, this.grid.rows, RGBAFormat)
      texture.magFilter = NearestFilter
      texture.minFilter = NearestFilter
      texture.needsUpdate = true
      return texture
    }
    for (const info of textures.tileInfo) this.tileInfo.push(tile(info))
    const sky = tile(textures.skyInfo)
    this.uniforms.uNoise.value = noise
    this.uniforms.uWaterN.value = water
    this.uniforms.uHeight.value = height
    this.uniforms.uMapRect.value.set(...textures.heightRect)
    this.uniforms.uSkyData.value = sky
    this.applyReveal(textures.reveal)
    this.uniforms.uData.value = this.tileInfo[this.level] ?? null
    this.selectionTextures = new SelectionTextures(this.tileInfo, sky, this.grid)
    if (this.selected) this.selectionTextures.write(this.world, this.selected, this.level)
  }

  private applyReveal(field: RevealField): void {
    const layers = new Uint8Array(field.values.length * 2)
    for (let k = 0; k < field.values.length; k++) {
      layers[k * 2] = field.values[k] ?? 0
      layers[k * 2 + 1] = field.haze[k] ?? 0
    }
    const texture = new DataTexture(layers, field.width, field.height, RGFormat, UnsignedByteType)
    texture.unpackAlignment = 1
    texture.magFilter = LinearFilter
    texture.minFilter = LinearFilter
    texture.needsUpdate = true
    this.uniforms.uReveal.value = texture
    this.uniforms.uRevealRect.value.set(field.x0, field.z0, field.spanX, field.spanZ)
    this.reveal = field
    this.mistRoom = mistRoomCovers(field)
    this.labels.veil((x, z) => isUnexplored(field, x, z))
    this.labels.markUnexplored(unexploredMarks(field), this.unexploredLabel)
    this.labelsStale = true
  }

  private applyShadowSettings(): void {
    const size = this.settings.shadowMapSize
    this.renderer.shadowMap.enabled = size > 0
    this.key.castShadow = size > 0
    if (size > 0) {
      this.key.shadow.mapSize.set(size, size)
      this.key.shadow.radius = this.settings.shadowRadius
      this.key.shadow.map?.dispose()
      this.key.shadow.map = null
    }
    this.shadowsStale = true
  }

  private applySky(): void {
    const sky =
      this.level > 0
        ? lightUnderground(this.lights)
        : this.daylight.surface(this.lights, this.hour, this.season, this.display.effects.clouds)
    this.scene.background = this.level > 0 ? undergroundFog() : null
    this.scene.environmentIntensity = sky.environmentIntensity
    this.environment.invalidate()
    this.shadowsStale = true
  }

  private applyDisplay(): void {
    const { display } = this
    this.uniforms.uBorders.value = display.borders ? 1 : 0
    this.uniforms.uGrid.value = display.grid ? 1 : 0
    this.labels.setGroups(display.labels)
    this.content.setRoutes(display.routes)
    this.effects.setShown(display.effects)
    this.vehicles.setShown({
      ships: display.routes.sea,
      airships: display.routes.sky,
      trains: display.routes.rail,
      plume: display.effects.particles,
    })
  }

  private applyVisibility(): void {
    const surface = this.level === 0
    const visible: Record<SceneLayer, boolean> = {
      surface,
      sky: surface,
      routes: surface,
      effects: surface,
      'under-1': this.level === 1,
      'under-2': this.level === 2,
    }
    for (const layer of SCENE_LAYERS) this.content.groups[layer].visible = visible[layer]
    this.travel.group.visible = this.travelLevel === this.level
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect()
    this.width = Math.max(1, Math.round(rect.width))
    this.height = Math.max(1, Math.round(rect.height))
    this.ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    this.renderer.setPixelRatio(this.ratio)
    this.renderer.setSize(this.width, this.height, false)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.uniforms.uPScale.value = this.pointScale()
    this.labelsStale = true
    window.clearTimeout(this.resizeTimer)
    if (this.post.targetsReady) {
      this.resizeTimer = window.setTimeout(() => this.allocateTargets(), RESIZE_SETTLE_MS)
    } else this.allocateTargets()
    this.scheduler.invalidate(false)
  }

  private allocateTargets(): void {
    const pixelWidth = this.pixelWidth()
    const pixelHeight = this.pixelHeight()
    this.post.configure(
      postSettings(this.settings, this.tier, pixelWidth * pixelHeight, this.ratio, this.maxSamples),
    )
    this.post.resize(pixelWidth, pixelHeight)
    this.scheduler.invalidate(false)
  }

  private pixelWidth(): number {
    return Math.round(this.width * this.ratio)
  }

  private pixelHeight(): number {
    return Math.round(this.height * this.ratio)
  }

  private pointScale(): number {
    const height = renderSize(this.pixelHeight(), this.settings.renderScale)
    return height / (2 * Math.tan((this.camera.fov * Math.PI) / 360))
  }

  private groundY(): number {
    const { goal } = this.rig
    return this.level > 0 ? ROCK_TOP * 0.5 : Math.max(0, surfaceY(this.field, goal.x, goal.z)) * 0.6
  }

  private updateShadows(): void {
    if (!this.key.castShadow) return
    const { rig } = this.rig
    const span = Math.max(10, Math.min(150, rig.dist * 0.75))
    const texel = span / SHADOW_FRAME.texels
    const x = Math.round(rig.x / texel) * texel
    const z = Math.round(rig.z / texel) * texel
    const moved =
      Number.isNaN(this.shadowCentre.x) ||
      Math.abs(x - this.shadowCentre.x) > span * 0.25 ||
      Math.abs(z - this.shadowCentre.z) > span * 0.25 ||
      Math.abs(span - this.shadowSpan) > this.shadowSpan * 0.2
    const sun = this.uniforms.uSunDir.value
    const turned = this.lastSun.dot(sun) < SUN_TURN_LIMIT
    const far = rig.dist > OVERVIEW_REACH
    const castersChanged = this.content.setPropShadows(!far)
    if (!moved && !turned && !castersChanged && !this.shadowsStale) return
    this.shadowCentre.set(x, 0, z)
    this.shadowSpan = span
    this.lastSun.copy(sun)
    const camera = this.key.shadow.camera
    camera.left = -span
    camera.right = span
    camera.top = span
    camera.bottom = -span
    camera.updateProjectionMatrix()
    this.key.target.position.set(x, 0, z)
    this.key.position.set(
      x + sun.x * SHADOW_FRAME.distance,
      sun.y * SHADOW_FRAME.distance,
      z + sun.z * SHADOW_FRAME.distance,
    )
    this.key.target.updateMatrixWorld()
    this.key.updateMatrixWorld()
    this.renderer.shadowMap.needsUpdate = true
    this.shadowsStale = false
  }

  private settle(): void {
    const { goal } = this.rig
    if (Math.hypot(goal.x - this.lastSettle.x, goal.z - this.lastSettle.z) < SETTLE_MOVE) return
    this.lastSettle.x = goal.x
    this.lastSettle.z = goal.z
    this.events.settle(goal.x, goal.z)
  }

  private frame(now: number, dt: number, animate: boolean): boolean {
    if (animate) this.time = (this.time + dt) % 3600
    this.uniforms.uTime.value = this.time
    this.effects.update(this.time)
    this.vehicles.update(this.time)
    const keyed = this.input.step(dt)
    const moving = this.covered ? false : this.rig.update(dt, this.groundY())
    const fovChanged = this.rig.apply(this.camera)
    if (fovChanged) this.uniforms.uPScale.value = this.pointScale()
    const eye = this.camera.position
    this.uniforms.uInMist.value = eye.y < MIST.envelope && this.mistRoom(eye.x, eye.z) ? 1 : 0
    const top = this.rig.view === 'top'
    const density = 0.0045 * Math.max(0.12, Math.min(1, 60 / this.rig.rig.dist)) * (top ? 0.4 : 1)
    this.fog.density = density
    this.uniforms.uFogDensity.value = density
    this.uniforms.uCloudOp.value = top ? 0.55 : 1
    this.content.frameDetail(
      this.camera.position,
      this.rig.rig.dist > OVERVIEW_REACH,
      this.settings.nearDetail,
    )
    const rising = this.content.rise(now)
    if (this.content.takeChanged()) this.shadowsStale = true
    this.updateShadows()
    this.environment.update(now)
    this.post.render(this.scene, this.camera)
    this.frameCount += 1
    const active = moving || keyed || rising || this.input.moving
    if (!this.covered && ((active && this.frameCount % 2 === 0) || this.labelsStale)) {
      this.labels.update(this.camera, this.width, this.height, this.rig.rig.dist, this.level)
      this.labelsStale = false
    }
    if (!this.covered && now - this.lastHud > HUD_MS) {
      this.lastHud = now
      this.hud.update(
        this.camera,
        this.rig.rig,
        this.rig.rig.yaw,
        this.width,
        this.height,
        this.world.hexKm,
      )
    }
    if (this.wasMoving && !active) this.settle()
    this.wasMoving = active
    if (!this.shownTerrain && this.content.groups.surface.children.length > 0) {
      this.shownTerrain = true
      this.events.firstTerrain()
    }
    if (this.shownTerrain && this.pace.findsSlow(now, moving)) this.events.slow()
    for (const callback of this.afterFrames.splice(0)) callback()
    return active
  }
}
