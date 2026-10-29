import { backingSize } from '../../lib/art-effect/cover'
import { FRAME } from '../../lib/art-effect/presets'
import { type Eye, followEye } from './eye'
import { activate, bindTexture, draw, linkProgram, type Program, type Target } from './gl'
import glazed from './glsl/glazed.frag?raw'
import lighting from './glsl/lighting.glsl?raw'
import { openStudio, type Studio } from './studio'
import { bindRoom, type Environment, environmentOf, type Moulding, mouldingOf } from './textures'

const FRAMED = '.au-prose__frame'
const MOULDING = '.au-prose__moulding'
const LIT = 'data-lit'
const REST = { x: 0.3, y: 0.3 }
const ROOM_YAW = Math.PI + 0.15

type Loaded = {
  studio: Studio
  program: Program
  art: Target
  room: Environment
  moulding: Moulding
}

const glazes = new Map<HTMLElement, AbortController>()
const programs = new WeakMap<Studio, Promise<Program>>()

function programFor(studio: Studio): Promise<Program> {
  const known = programs.get(studio)
  if (known) return known
  const linking = linkProgram(
    studio.gl,
    { defines: [], presents: false, body: `${lighting}\n${glazed}` },
    studio.lifetime,
  )
  programs.set(studio, linking)
  return linking
}

async function pixelsOf(picture: HTMLImageElement): Promise<HTMLImageElement> {
  await picture.decode()
  const pixels = new Image()
  pixels.src = picture.currentSrc || picture.src
  await pixels.decode()
  return pixels
}

function mount(framed: HTMLElement, teardown: AbortController): void {
  const { signal } = teardown
  const picture = framed.querySelector('img')
  const moulding = framed.querySelector<HTMLElement>(MOULDING)
  if (!picture || !moulding) throw new Error('a glazed picture has no image or no moulding')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const surface = canvas.getContext('2d', { alpha: false })
  if (!surface) throw new Error('a glazed picture could not draw its canvas')
  const slice = { x: FRAME.slice.left / FRAME.width, y: FRAME.slice.top / FRAME.height }

  let loaded: Loaded | undefined
  let preparing: Promise<void> | undefined
  let visible = false

  const release = (): void => {
    if (loaded) loaded.studio.discard({ target: loaded.art })
    loaded = undefined
  }

  const fail = (error: unknown): void => {
    if (!signal.aborted) console.error(error)
    teardown.abort()
  }

  const render = (eye: Eye): boolean => {
    const from = loaded
    if (!from) return false
    const box = { width: framed.clientWidth, height: framed.clientHeight }
    if (box.width === 0 || box.height === 0) return true
    const backing = backingSize(
      box,
      window.devicePixelRatio,
      1,
      from.studio.tier.pixelBudget,
      from.studio.limit,
    )
    const border =
      Number.parseFloat(getComputedStyle(moulding).borderTopWidth) * (backing.width / box.width)
    const { program, art, room } = from
    const drawn = from.studio.compose(
      backing,
      (gl) => {
        activate(gl, program)
        bindTexture(gl, program, 'uArt', 0, art.texture)
        bindTexture(gl, program, 'uGilt', 1, from.moulding.gilt.texture)
        bindTexture(gl, program, 'uRelief', 2, from.moulding.relief)
        bindRoom(gl, program, room, 3, ROOM_YAW + FRAME.room.yaw)
        gl.uniform2f(program.uniform('uBacking'), backing.width, backing.height)
        gl.uniform1f(program.uniform('uMoulding'), border)
        gl.uniform2f(program.uniform('uSlice'), slice.x, slice.y)
        gl.uniform2f(program.uniform('uEye'), eye.x, eye.y)
        gl.uniform1f(program.uniform('uMetalness'), FRAME.metalness)
        gl.uniform1f(program.uniform('uExposure'), FRAME.exposure)
        draw(gl, undefined, backing.width, backing.height)
      },
      surface,
    )
    if (!drawn) {
      release()
      return false
    }
    if (!canvas.isConnected) {
      framed.append(canvas)
      framed.setAttribute(LIT, '')
    }
    return true
  }

  const follower = followEye(framed, {
    rest: REST,
    signal,
    live: () => visible && loaded !== undefined,
    render,
  })

  const prepare = (): void => {
    if (preparing || loaded) return
    preparing = (async () => {
      const studio = openStudio()
      if (!studio) {
        teardown.abort()
        return
      }
      const [pixels, program, room, gilding] = await Promise.all([
        pixelsOf(picture),
        programFor(studio),
        environmentOf(studio),
        mouldingOf(studio),
      ])
      signal.throwIfAborted()
      loaded = {
        studio,
        program,
        room,
        moulding: gilding,
        art: studio.picture(pixels, { width: pixels.naturalWidth, height: pixels.naturalHeight }),
      }
      render(follower.eye)
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
    render(follower.eye)
  })
  sight.observe(framed)
  resize.observe(framed)

  signal.addEventListener(
    'abort',
    () => {
      sight.disconnect()
      resize.disconnect()
      release()
      canvas.remove()
      framed.removeAttribute(LIT)
    },
    { once: true },
  )
}

export function syncGlazes(): void {
  for (const [framed, teardown] of [...glazes]) {
    if (framed.isConnected) continue
    teardown.abort()
    glazes.delete(framed)
  }
  for (const framed of document.querySelectorAll<HTMLElement>(FRAMED)) {
    if (glazes.has(framed)) continue
    const teardown = new AbortController()
    glazes.set(framed, teardown)
    teardown.signal.addEventListener('abort', () => glazes.delete(framed), { once: true })
    try {
      mount(framed, teardown)
    } catch (error) {
      console.error(error)
      teardown.abort()
    }
  }
}
