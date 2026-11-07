import { backingSize, frameIndex, type Size } from '../../lib/art-effect/cover'
import { gridCorners, gridTriangles } from '../../lib/art-effect/mesh'
import { FLAG } from '../../lib/art-effect/presets'
import { bindStillToggle, isStill, STILLNESS_CHANGED } from '../stillness'
import { prepareOnApproach, stayPlain } from './approach'
import {
  activate,
  bindTexture,
  createLayer,
  type Layer,
  linkProgram,
  type Program,
  releaseLayer,
  releaseTarget,
  resolveLayer,
  sharpen,
  type Target,
} from './gl'
import flagFragment from './glsl/flag.frag?raw'
import flagVertex from './glsl/flag.vert?raw'
import flagWave from './glsl/flag-wave.glsl?raw'
import lighting from './glsl/lighting.glsl?raw'
import { openStudio, type Studio } from './studio'
import { bindRoom, type Environment, environmentOf, fabricOf } from './textures'

const FLAG_SELECTOR = '[data-drape="flag"]'
const FIGURE = '[data-heraldry]'
const TOGGLE = '[data-drape-toggle]'
const DRAPED = 'data-draped'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

type Loaded = {
  studio: Studio
  program: Program
  picture: Target
  room: Environment
  weave: WebGLTexture
  length: number
}

const flags = new Map<HTMLElement, AbortController>()
const programs = new WeakMap<Studio, Promise<Program>>()

function programFor(studio: Studio): Promise<Program> {
  const known = programs.get(studio)
  if (known) return known
  const linking = linkProgram(
    studio.gl,
    {
      vertex: `${flagWave}\n${flagVertex}`,
      defines: [],
      presents: false,
      body: `${lighting}\n${flagWave}\n${flagFragment}`,
    },
    studio.lifetime,
  )
  programs.set(studio, linking)
  return linking
}

async function pixelsOf(shown: HTMLImageElement): Promise<HTMLImageElement> {
  await shown.decode()
  const pixels = new Image()
  pixels.src = shown.currentSrc || shown.src
  await pixels.decode()
  return pixels
}

function unit([x, y, z]: readonly [number, number, number]): [number, number, number] {
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

function mount(holder: HTMLElement, teardown: AbortController): void {
  const { signal } = teardown
  const shown = holder.querySelector('img')
  if (!shown) throw new Error('a flag has no picture')
  const figure = holder.closest<HTMLElement>(FIGURE)
  const toggle = figure?.querySelector<HTMLButtonElement>(TOGGLE) ?? undefined
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const surface = canvas.getContext('2d')
  if (!surface) throw new Error('a flag could not draw its canvas')
  const still = window.matchMedia(REDUCED_MOTION).matches
  const light = unit(FLAG.light)
  const grid = FLAG.mesh

  let loaded: Loaded | undefined
  let preparing: Promise<void> | undefined
  let vertices: WebGLVertexArrayObject | undefined
  let buffers: WebGLBuffer[] = []
  let layer: Layer | undefined
  let visible = false
  let frame = 0
  let last: number | undefined
  let flown = 0
  let shownFrame = -1

  const paused = (): boolean => still || isStill()

  const release = (): void => {
    if (!loaded) return
    const { gl } = loaded.studio
    releaseLayer(gl, layer)
    releaseTarget(gl, loaded.picture)
    if (vertices) gl.deleteVertexArray(vertices)
    for (const buffer of buffers) gl.deleteBuffer(buffer)
    layer = undefined
    vertices = undefined
    buffers = []
    loaded = undefined
  }

  const fail = (error: unknown): void => {
    if (!signal.aborted) console.error(error)
    teardown.abort()
  }

  const layerFor = (gl: WebGL2RenderingContext, backing: Size): Layer => {
    if (layer && layer.width === backing.width && layer.height === backing.height) return layer
    releaseLayer(gl, layer)
    layer = createLayer(gl, backing, false)
    return layer
  }

  const meshFor = (gl: WebGL2RenderingContext): WebGLVertexArrayObject => {
    if (vertices) return vertices
    const array = gl.createVertexArray()
    const corners = gl.createBuffer()
    const order = gl.createBuffer()
    gl.bindVertexArray(array)
    gl.bindBuffer(gl.ARRAY_BUFFER, corners)
    gl.bufferData(gl.ARRAY_BUFFER, gridCorners(grid), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, order)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gridTriangles(grid), gl.STATIC_DRAW)
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    vertices = array
    buffers = [corners, order]
    return array
  }

  const paint = (from: Loaded, backing: Size, gl: WebGL2RenderingContext): void => {
    const target = layerFor(gl, backing)
    const { program, picture, room, weave, length } = from
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer)
    gl.viewport(0, 0, target.width, target.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    activate(gl, program)
    bindTexture(gl, program, 'uPicture', 0, picture.texture)
    bindTexture(gl, program, 'uWeave', 1, weave)
    bindRoom(gl, program, room, 2, FLAG.roomYaw)
    gl.uniform1f(program.uniform('uTime'), FLAG.pose + flown / 1000)
    gl.uniform1f(program.uniform('uLength'), length)
    gl.uniform1f(program.uniform('uEye'), FLAG.eye)
    gl.uniform1f(program.uniform('uHeadroom'), FLAG.headroom)
    gl.uniform1f(program.uniform('uHeading'), FLAG.heading)
    gl.uniform1f(program.uniform('uWeaveTile'), FLAG.weaveTile)
    gl.uniform3f(program.uniform('uLight'), ...light)
    gl.bindVertexArray(meshFor(gl))
    gl.drawElements(gl.TRIANGLES, (grid.columns - 1) * (grid.rows - 1) * 6, gl.UNSIGNED_SHORT, 0)
    gl.bindVertexArray(null)
    resolveLayer(gl, target)
  }

  const draw = (): boolean => {
    const from = loaded
    const pace = from?.studio.tier.cloth
    if (!from || !pace) return false
    const box = { width: holder.clientWidth, height: holder.clientHeight }
    if (box.width === 0 || box.height === 0) return true
    const backing = backingSize(box, window.devicePixelRatio, 1, pace.budget, from.studio.limit)
    if (!from.studio.compose(backing, (gl) => paint(from, backing, gl), surface)) {
      release()
      if (!canvas.isConnected) stayPlain(holder)
      return false
    }
    if (!canvas.isConnected) {
      holder.append(canvas)
      holder.setAttribute(DRAPED, '')
      if (figure && toggle && !still) bindStillToggle(figure, toggle, signal)
    }
    return true
  }

  const tick = (time: number): void => {
    frame = 0
    const pace = loaded?.studio.tier.cloth
    if (!visible || !pace || paused()) {
      last = undefined
      return
    }
    flown += last === undefined ? 0 : time - last
    last = time
    const next = frameIndex(flown, pace.perSecond)
    if (next !== shownFrame) {
      shownFrame = next
      if (!draw()) return
    }
    frame = window.requestAnimationFrame(tick)
  }

  const resume = (): void => {
    if (frame === 0 && visible && loaded && !paused()) frame = window.requestAnimationFrame(tick)
  }

  const prepare = (): void => {
    if (preparing || loaded) return
    preparing = (async () => {
      const studio = openStudio()
      if (!studio?.tier.cloth) {
        teardown.abort()
        return
      }
      const [pixels, program, room, weave] = await Promise.all([
        pixelsOf(shown),
        programFor(studio),
        environmentOf(studio),
        fabricOf(studio, 'linen'),
      ])
      signal.throwIfAborted()
      const picture = studio.picture(pixels, {
        width: pixels.naturalWidth,
        height: pixels.naturalHeight,
      })
      sharpen(studio.gl, picture.texture)
      loaded = {
        studio,
        program,
        picture,
        room,
        weave,
        length: pixels.naturalWidth / pixels.naturalHeight,
      }
      if (draw()) resume()
    })().finally(() => {
      preparing = undefined
    })
    preparing.catch(fail)
  }

  const sight = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    if (visible) prepare()
    resume()
  })
  const resize = new ResizeObserver(() => {
    if (loaded) draw()
  })
  sight.observe(holder)
  resize.observe(holder)
  prepareOnApproach(holder, prepare, signal)
  window.addEventListener(STILLNESS_CHANGED, resume, { signal })

  signal.addEventListener(
    'abort',
    () => {
      window.cancelAnimationFrame(frame)
      sight.disconnect()
      resize.disconnect()
      release()
      canvas.remove()
      holder.removeAttribute(DRAPED)
      if (toggle) toggle.hidden = true
    },
    { once: true },
  )
}

export function syncFlags(): void {
  for (const [holder, teardown] of [...flags]) {
    if (holder.isConnected) continue
    teardown.abort()
    flags.delete(holder)
  }
  for (const holder of document.querySelectorAll<HTMLElement>(FLAG_SELECTOR)) {
    if (flags.has(holder)) continue
    const teardown = new AbortController()
    flags.set(holder, teardown)
    teardown.signal.addEventListener(
      'abort',
      () => {
        flags.delete(holder)
        stayPlain(holder)
      },
      { once: true },
    )
    try {
      mount(holder, teardown)
    } catch (error) {
      console.error(error)
      teardown.abort()
    }
  }
}
