import {
  type Backing,
  blurLevel,
  type CoverWindow,
  type Point,
  paintLevel,
  printRegion,
  type Size,
} from '../../lib/art-effect/cover'
import type { ArtEffect } from '../../lib/art-effect/effects'
import {
  EFFECT_SETTINGS,
  EFFECT_TIERS,
  type EffectSettings,
  type EffectTier,
  PAINT_WIDEST,
  type Paint,
  STAGE,
} from '../../lib/art-effect/presets'
import { automaticTier } from '../../lib/atlas/contract/quality'
import { gpuReport } from '../gpu'
import {
  activate,
  bindTexture,
  createTarget,
  draw,
  gpuDone,
  linkProgram,
  mipLevels,
  type Program,
  releaseTarget,
  type Target,
} from './gl'
import develop from './glsl/develop.frag?raw'
import finish from './glsl/finish.frag?raw'
import kuwahara from './glsl/kuwahara.frag?raw'
import printing from './glsl/print.frag?raw'
import staging from './glsl/stage.frag?raw'
import tensor from './glsl/tensor.frag?raw'
import tensorBlur from './glsl/tensor-blur.frag?raw'

export type Exposure = {
  backing: Backing
  cover: CoverWindow
  cssPixel: number
  devicePixel: number
}

export type Print = { effect: ArtEffect; target: Target; exposure: Exposure }

export type Backdrop = { target: Target }

export type Scene = {
  seconds: number
  backing: Backing
  cover: CoverWindow
  blur: number
  focus: Point
}

export type Studio = {
  readonly tier: EffectTier
  readonly limit: number
  develop: (
    effect: ArtEffect,
    pixels: HTMLImageElement,
    exposure: Exposure,
    signal: AbortSignal,
  ) => Promise<Print>
  show: (print: Print, seed: number, into: CanvasRenderingContext2D) => boolean
  backdrop: (pixels: HTMLImageElement, signal: AbortSignal) => Promise<Backdrop>
  stage: (backdrop: Backdrop, scene: Scene, into: CanvasRenderingContext2D) => boolean
  discard: (held: Print | Backdrop) => void
}

type Painter = { tensor: Program; across: Program; orient: Program; kuwahara: Program }

type Programs = { develop: Program; finish: Program; print: Program; painter: Painter | undefined }

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i

const CONTEXT: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false,
  powerPreference: 'low-power',
  failIfMajorPerformanceCaveat: true,
}

let current: Studio | undefined
let refused = false

function developDefines(settings: EffectSettings): string[] {
  return [
    ...(settings.halation ? ['HALATION'] : []),
    ...(settings.aberration > 0 ? ['ABERRATION'] : []),
  ]
}

function finishDefines(settings: EffectSettings): string[] {
  return settings.surface.kind === 'canvas' ? ['CANVAS'] : []
}

async function linkPainter(gl: WebGL2RenderingContext, signal: AbortSignal): Promise<Painter> {
  const [structure, across, orient, filter] = await Promise.all([
    linkProgram(gl, { defines: [], presents: false, body: tensor }, signal),
    linkProgram(gl, { defines: [], presents: false, body: tensorBlur }, signal),
    linkProgram(gl, { defines: ['ORIENT'], presents: false, body: tensorBlur }, signal),
    linkProgram(gl, { defines: [], presents: false, body: kuwahara }, signal),
  ])
  return { tensor: structure, across, orient, kuwahara: filter }
}

async function linkEffect(
  gl: WebGL2RenderingContext,
  settings: EffectSettings,
  signal: AbortSignal,
): Promise<Programs> {
  const paints = settings.paint !== undefined && gl.getExtension('EXT_color_buffer_float') !== null
  const [developer, finisher, printer, painter] = await Promise.all([
    linkProgram(gl, { defines: developDefines(settings), presents: false, body: develop }, signal),
    linkProgram(gl, { defines: finishDefines(settings), presents: false, body: finish }, signal),
    linkProgram(gl, { defines: [], presents: true, body: printing }, signal),
    paints ? linkPainter(gl, signal) : undefined,
  ])
  return { develop: developer, finish: finisher, print: printer, painter }
}

function textureLimit(gl: WebGL2RenderingContext): number {
  const viewport: unknown = gl.getParameter(gl.MAX_VIEWPORT_DIMS)
  const dimensions = viewport instanceof Int32Array ? [...viewport] : []
  return Math.min(Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)), ...dimensions)
}

function createStudio(): Studio | undefined {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl2', CONTEXT)
  if (!gl) return undefined
  const report = gpuReport(gl)
  if (SOFTWARE_RENDERER.test(report.renderer)) {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return undefined
  }
  const tier = EFFECT_TIERS[automaticTier(report)]
  const limit = textureLimit(gl)
  const life = new AbortController()
  const linked = new Map<ArtEffect, Promise<Programs>>()
  const ready = new Map<ArtEffect, Programs>()
  let linkingStage: Promise<Program> | undefined
  let stageProgram: Program | undefined
  let queue: Promise<unknown> = Promise.resolve()

  canvas.addEventListener(
    'webglcontextlost',
    () => {
      life.abort()
      if (current === studio) current = undefined
    },
    { once: true },
  )

  const programsFor = (effect: ArtEffect): Promise<Programs> => {
    const known = linked.get(effect)
    if (known) return known
    const linking = linkEffect(gl, EFFECT_SETTINGS[effect], life.signal).then((programs) => {
      ready.set(effect, programs)
      return programs
    })
    linked.set(effect, linking)
    return linking
  }

  const copyOut = (size: Size, paint: () => void, into: CanvasRenderingContext2D): void => {
    if (canvas.width < size.width) canvas.width = size.width
    if (canvas.height < size.height) canvas.height = size.height
    paint()
    if (into.canvas.width !== size.width) into.canvas.width = size.width
    if (into.canvas.height !== size.height) into.canvas.height = size.height
    const region = printRegion(size, canvas)
    into.drawImage(
      canvas,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      size.width,
      size.height,
    )
  }

  const upload = (pixels: HTMLImageElement): Target => {
    const width = pixels.naturalWidth
    const height = pixels.naturalHeight
    const source = createTarget(gl, 'srgb', width, height, mipLevels(width, height))
    gl.bindTexture(gl.TEXTURE_2D, source.texture)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    gl.generateMipmap(gl.TEXTURE_2D)
    return source
  }

  const paint = async (
    programs: Painter,
    recipe: Paint,
    from: Target,
    shown: number,
    signal: AbortSignal,
  ): Promise<Target> => {
    const level = paintLevel({
      source: from.width,
      shown,
      widest: PAINT_WIDEST,
      coarser: tier.paintCoarser,
      levels: mipLevels(from.width, from.height),
    })
    const width = Math.max(1, from.width >> level)
    const height = Math.max(1, from.height >> level)
    const radius = recipe.radius / 2 ** level
    const zeta = 1 / radius
    const eta = (zeta + Math.cos(recipe.zeroCrossing)) / Math.sin(recipe.zeroCrossing) ** 2
    const raw = createTarget(gl, 'half', width, height)
    const blurred = createTarget(gl, 'half', width, height)
    const orientation = createTarget(gl, 'half', width, height)
    const canvas = createTarget(gl, 'srgb', width, height, mipLevels(width, height))
    const strip = (bottom: number, rows: number): void => {
      const filter = programs.kuwahara
      activate(gl, filter)
      bindTexture(gl, filter, 'uSource', 0, from.texture)
      bindTexture(gl, filter, 'uOrientation', 1, orientation.texture)
      gl.uniform1i(filter.uniform('uLevel'), level)
      gl.uniform1f(filter.uniform('uRadius'), radius)
      gl.uniform1f(filter.uniform('uSharpnessExponent'), recipe.q)
      gl.uniform1f(filter.uniform('uHardness'), recipe.hardness)
      gl.uniform1f(filter.uniform('uAlpha'), recipe.alpha)
      gl.uniform1f(filter.uniform('uZeta'), zeta)
      gl.uniform1f(filter.uniform('uEta'), eta)
      gl.enable(gl.SCISSOR_TEST)
      gl.scissor(0, bottom, width, rows)
      draw(gl, canvas, width, height)
      gl.disable(gl.SCISSOR_TEST)
    }
    try {
      activate(gl, programs.tensor)
      bindTexture(gl, programs.tensor, 'uSource', 0, from.texture)
      gl.uniform1i(programs.tensor.uniform('uLevel'), level)
      draw(gl, raw, width, height)

      activate(gl, programs.across)
      bindTexture(gl, programs.across, 'uTensor', 0, raw.texture)
      gl.uniform2i(programs.across.uniform('uDirection'), 1, 0)
      draw(gl, blurred, width, height)

      activate(gl, programs.orient)
      bindTexture(gl, programs.orient, 'uTensor', 0, blurred.texture)
      gl.uniform2i(programs.orient.uniform('uDirection'), 0, 1)
      draw(gl, orientation, width, height)

      const rows = Math.ceil(height / tier.paintStrips)
      for (let bottom = 0; bottom < height; bottom += rows) {
        strip(bottom, Math.min(rows, height - bottom))
        await gpuDone(gl, signal)
      }
      gl.bindTexture(gl.TEXTURE_2D, canvas.texture)
      gl.generateMipmap(gl.TEXTURE_2D)
      return canvas
    } catch (error) {
      releaseTarget(gl, canvas)
      throw error
    } finally {
      releaseTarget(gl, raw)
      releaseTarget(gl, blurred)
      releaseTarget(gl, orientation)
    }
  }

  const runDevelop = (
    program: Program,
    settings: EffectSettings,
    picture: Target,
    exposure: Exposure,
    into: Target,
  ): void => {
    const { cover } = exposure
    const { tone, colour } = settings.grade
    activate(gl, program)
    bindTexture(gl, program, 'uSource', 0, picture.texture)
    gl.uniform2f(program.uniform('uSourceSize'), picture.width, picture.height)
    gl.uniform2f(program.uniform('uBacking'), into.width, into.height)
    gl.uniform4f(
      program.uniform('uCover'),
      cover.scale.x,
      cover.scale.y,
      cover.offset.x,
      cover.offset.y,
    )
    gl.uniform1f(program.uniform('uTexelsPerPixel'), (picture.width * cover.scale.x) / into.width)
    gl.uniform2f(
      program.uniform('uClarity'),
      settings.clarity.amount,
      blurLevel(picture.width, settings.clarity.radius),
    )
    gl.uniform1f(program.uniform('uAberration'), settings.aberration)
    if (settings.halation) {
      const { threshold, knee, strength, tint, radius } = settings.halation
      gl.uniform4f(
        program.uniform('uHalation'),
        threshold,
        knee,
        strength,
        blurLevel(picture.width, radius),
      )
      gl.uniform3f(program.uniform('uHalationTint'), ...tint)
    }
    gl.uniform4f(program.uniform('uTone'), tone.contrast, tone.pivot, tone.toe, tone.shoulder)
    gl.uniform3f(program.uniform('uChroma'), colour.saturation, colour.knee, colour.range)
    gl.uniform4f(program.uniform('uSplit'), ...colour.shadows, ...colour.highlights)
    draw(gl, into, into.width, into.height)
  }

  const runFinish = (
    program: Program,
    settings: EffectSettings,
    exposure: Exposure,
    from: Target,
    into: Target,
  ): void => {
    activate(gl, program)
    bindTexture(gl, program, 'uGraded', 0, from.texture)
    gl.uniform1f(program.uniform('uSharpness'), settings.sharpness)
    const { surface } = settings
    if (surface.kind === 'canvas') {
      const { weave, pitch, impasto, light } = surface
      gl.uniform3f(program.uniform('uCanvasSurface'), weave, pitch * exposure.cssPixel, impasto)
      gl.uniform2f(program.uniform('uLight'), ...light)
    }
    draw(gl, into, into.width, into.height)
  }

  const developNow = async (
    effect: ArtEffect,
    pixels: HTMLImageElement,
    exposure: Exposure,
    signal: AbortSignal,
  ): Promise<Print> => {
    const settings = EFFECT_SETTINGS[effect]
    const programs = await programsFor(effect)
    signal.throwIfAborted()
    const { backing } = exposure
    const source = upload(pixels)
    let painted: Target | undefined
    let graded: Target | undefined
    let developed: Target | undefined
    try {
      if (programs.painter && settings.paint) {
        painted = await paint(programs.painter, settings.paint, source, backing.width, signal)
      }
      graded = createTarget(gl, 'srgb', backing.width, backing.height)
      runDevelop(programs.develop, settings, painted ?? source, exposure, graded)
      developed = createTarget(gl, 'srgb', backing.width, backing.height)
      runFinish(programs.finish, settings, exposure, graded, developed)
      await gpuDone(gl, signal)
      const print: Print = { effect, target: developed, exposure }
      developed = undefined
      return print
    } finally {
      releaseTarget(gl, source)
      releaseTarget(gl, painted)
      releaseTarget(gl, graded)
      releaseTarget(gl, developed)
    }
  }

  const studio: Studio = {
    tier,
    limit,
    develop: (effect, pixels, exposure, signal) => {
      const run = queue.then(() => developNow(effect, pixels, exposure, signal))
      queue = run.then(
        () => undefined,
        () => undefined,
      )
      return run
    },
    show: (print, seed, into) => {
      const programs = ready.get(print.effect)
      if (gl.isContextLost() || !programs) return false
      const { backing } = print.exposure
      const { amount, size, chroma, shadow, highlight } = EFFECT_SETTINGS[print.effect].grain
      const program = programs.print
      copyOut(
        backing,
        () => {
          activate(gl, program)
          bindTexture(gl, program, 'uDeveloped', 0, print.target.texture)
          gl.uniform3f(
            program.uniform('uGrain'),
            amount,
            Math.max(1, size * print.exposure.devicePixel),
            chroma,
          )
          gl.uniform2f(program.uniform('uGrainTone'), shadow, highlight)
          gl.uniform1ui(program.uniform('uSeed'), seed)
          draw(gl, undefined, backing.width, backing.height)
        },
        into,
      )
      return true
    },
    backdrop: async (pixels, signal) => {
      linkingStage ??= linkProgram(
        gl,
        { defines: [], presents: false, body: staging },
        life.signal,
      ).then((program) => {
        stageProgram = program
        return program
      })
      await linkingStage
      signal.throwIfAborted()
      return { target: upload(pixels) }
    },
    stage: (backdrop, scene, into) => {
      const program = stageProgram
      if (gl.isContextLost() || !program) return false
      const { backing, cover, focus } = scene
      copyOut(
        backing,
        () => {
          activate(gl, program)
          bindTexture(gl, program, 'uArt', 0, backdrop.target.texture)
          gl.uniform2f(program.uniform('uBacking'), backing.width, backing.height)
          gl.uniform4f(
            program.uniform('uCover'),
            cover.scale.x,
            cover.scale.y,
            cover.offset.x,
            cover.offset.y,
          )
          gl.uniform1f(program.uniform('uBlur'), scene.blur)
          gl.uniform2f(program.uniform('uFilter'), STAGE.saturate, STAGE.brightness)
          gl.uniform1f(program.uniform('uSeconds'), scene.seconds)
          gl.uniform2f(program.uniform('uFocus'), focus.x, focus.y)
          draw(gl, undefined, backing.width, backing.height)
        },
        into,
      )
      return true
    },
    discard: (held) => releaseTarget(gl, held.target),
  }
  return studio
}

export function openStudio(): Studio | undefined {
  if (refused) return undefined
  current ??= createStudio()
  if (!current) refused = true
  return current
}
