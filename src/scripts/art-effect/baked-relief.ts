import { backingSize } from '../../lib/art-effect/cover'
import { type Lean, type LeanOptics, leanMargin, leanWarp } from '../../lib/art-effect/lean'
import { FULLEST_LEAN } from '../tilt'
import { prepareOnApproach, stayPlain } from './approach'
import { type Eye, followEye } from './eye'
import {
  activate,
  bindTexture,
  createDataTexture,
  draw,
  linkProgram,
  type Program,
  releaseTarget,
  type Target,
} from './gl'
import lighting from './glsl/lighting.glsl?raw'
import reliefLibrary from './glsl/relief.glsl?raw'
import { openStudio, type Studio } from './studio'
import { bindRoom, bitmapOf, type Environment, environmentOf } from './textures'

export type BakedRelief = {
  held: string
  called: string
  shader: string
  uniforms: Readonly<Record<string, readonly number[]>>
  heldUniforms?: (holder: HTMLElement) => Readonly<Record<string, readonly number[]>>
  rest: Eye
  roomYaw: number
  lean: LeanOptics
}

const DRAPED = 'data-draped'
const MAP_NAMES = ['colour', 'relief', 'finish'] as const

type MapName = (typeof MAP_NAMES)[number]

type Maps = { colour: Target; relief: WebGLTexture; finish: WebGLTexture }

type Loaded = { studio: Studio; program: Program; room: Environment; maps: Maps }

type Shading = { name: string; floats: Float32Array }

function shadingOf(piece: BakedRelief, holder: HTMLElement): Shading[] {
  const uniforms = { ...piece.uniforms, ...piece.heldUniforms?.(holder) }
  return Object.entries(uniforms).map(([name, values]) => ({
    name,
    floats: Float32Array.from(values),
  }))
}

function setShading(gl: WebGL2RenderingContext, program: Program, shading: Shading[]): void {
  for (const { name, floats } of shading) {
    const location = program.uniform(name)
    if (floats.length === 1) gl.uniform1fv(location, floats)
    else if (floats.length === 3) gl.uniform3fv(location, floats)
    else throw new Error(`a baked relief cannot set ${name} from ${floats.length} values`)
  }
}

function mapUrl(holder: HTMLElement, name: MapName, called: string): string {
  const url = holder.dataset[name]
  if (!url) throw new Error(`${called} names no ${name} map`)
  return url
}

async function mapsOf(studio: Studio, holder: HTMLElement, called: string): Promise<Maps> {
  const [colour, relief, finish] = await Promise.all(
    MAP_NAMES.map((name) => bitmapOf(mapUrl(holder, name, called), studio.lifetime)),
  )
  if (!colour || !relief || !finish) throw new Error(`${called} lost one of its maps`)
  studio.lifetime.throwIfAborted()
  const size = (bitmap: ImageBitmap) => ({ width: bitmap.width, height: bitmap.height })
  const maps = {
    colour: studio.picture(colour, size(colour)),
    relief: createDataTexture(studio.gl, relief, size(relief), 'edge', true),
    finish: createDataTexture(studio.gl, finish, size(finish), 'edge', true),
  }
  for (const bitmap of [colour, relief, finish]) bitmap.close()
  return maps
}

export function bakedReliefs(piece: BakedRelief): () => void {
  const mounted = new Map<HTMLElement, AbortController>()
  const programs = new WeakMap<Studio, Promise<Program>>()

  const programFor = (studio: Studio): Promise<Program> => {
    const known = programs.get(studio)
    if (known) return known
    const linking = linkProgram(
      studio.gl,
      { defines: [], presents: false, body: `${lighting}\n${reliefLibrary}\n${piece.shader}` },
      studio.lifetime,
    )
    programs.set(studio, linking)
    return linking
  }

  const mount = (holder: HTMLElement, teardown: AbortController): void => {
    const { signal } = teardown
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    const surface = canvas.getContext('2d')
    if (!surface) throw new Error(`${piece.called} could not draw its canvas`)
    const shading = shadingOf(piece, holder)

    let loaded: Loaded | undefined
    let preparing: Promise<void> | undefined
    let visible = false

    const release = (): void => {
      if (loaded) {
        const { gl } = loaded.studio
        releaseTarget(gl, loaded.maps.colour)
        gl.deleteTexture(loaded.maps.relief)
        gl.deleteTexture(loaded.maps.finish)
      }
      loaded = undefined
    }

    const fail = (error: unknown): void => {
      if (!signal.aborted) console.error(error)
      teardown.abort()
    }

    const render = (eye: Eye, lean: Lean): boolean => {
      const from = loaded
      if (!from) return false
      const box = { width: holder.clientWidth, height: holder.clientHeight }
      if (box.width === 0 || box.height === 0) return true
      const margin = follower.leans ? leanMargin(box, FULLEST_LEAN, piece.lean) : 0
      const backing = backingSize(
        { width: box.width + 2 * margin, height: box.height + 2 * margin },
        window.devicePixelRatio,
        1,
        from.studio.tier.pixelBudget,
        from.studio.limit,
      )
      const { program, room, maps } = from
      const drawn = from.studio.compose(
        backing,
        (gl) => {
          activate(gl, program)
          bindTexture(gl, program, 'uColour', 0, maps.colour.texture)
          bindTexture(gl, program, 'uRelief', 1, maps.relief)
          bindTexture(gl, program, 'uFinish', 2, maps.finish)
          bindRoom(gl, program, room, 3, piece.roomYaw)
          gl.uniformMatrix3fv(
            program.uniform('uWarp'),
            false,
            leanWarp({ box, margin, backing, lean }, piece.lean),
          )
          gl.uniform2f(
            program.uniform('uPiece'),
            (box.width * backing.width) / (box.width + 2 * margin),
            (box.height * backing.height) / (box.height + 2 * margin),
          )
          gl.uniform2f(program.uniform('uEye'), eye.x, eye.y)
          setShading(gl, program, shading)
          draw(gl, undefined, backing.width, backing.height)
        },
        surface,
      )
      if (!drawn) {
        release()
        if (!canvas.isConnected) stayPlain(holder)
        return false
      }
      canvas.style.setProperty('--lean-margin', `${margin}px`)
      if (!canvas.isConnected) {
        holder.append(canvas)
        holder.setAttribute(DRAPED, '')
      }
      return true
    }

    const follower = followEye(holder, {
      rest: piece.rest,
      signal,
      live: () => visible && loaded !== undefined,
      render,
      hover: holder,
    })

    const prepare = (): void => {
      if (preparing || loaded) return
      preparing = (async () => {
        const studio = openStudio()
        if (!studio) {
          teardown.abort()
          return
        }
        const [program, room, maps] = await Promise.all([
          programFor(studio),
          environmentOf(studio),
          mapsOf(studio, holder, piece.called),
        ])
        signal.throwIfAborted()
        loaded = { studio, program, room, maps }
        render(follower.eye, follower.lean)
      })().finally(() => {
        preparing = undefined
      })
      preparing.catch(fail)
    }

    const sight = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
      if (visible) prepare()
      follower.glide()
    })
    const resize = new ResizeObserver(() => {
      render(follower.eye, follower.lean)
    })
    sight.observe(holder)
    resize.observe(holder)
    prepareOnApproach(holder, prepare, signal)

    signal.addEventListener(
      'abort',
      () => {
        sight.disconnect()
        resize.disconnect()
        release()
        canvas.remove()
        holder.removeAttribute(DRAPED)
      },
      { once: true },
    )
  }

  return () => {
    for (const [holder, teardown] of [...mounted]) {
      if (holder.isConnected) continue
      teardown.abort()
      mounted.delete(holder)
    }
    for (const holder of document.querySelectorAll<HTMLElement>(piece.held)) {
      if (mounted.has(holder)) continue
      const teardown = new AbortController()
      mounted.set(holder, teardown)
      teardown.signal.addEventListener(
        'abort',
        () => {
          mounted.delete(holder)
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
}
