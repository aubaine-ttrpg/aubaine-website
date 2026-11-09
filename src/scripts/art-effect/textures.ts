import roomUrl from '../../../data/media/textures/combination-room.webp?url'
import giltReliefUrl from '../../../data/media/textures/fancy-picture-frame-01-relief.avif?url'
import giltSurfaceUrl from '../../../data/media/textures/fancy-picture-frame-01-surface.avif?url'
import linenUrl from '../../../data/media/textures/rough-linen-relief.avif?url'
import velvetUrl from '../../../data/media/textures/velour-velvet-relief.avif?url'
import woodReliefUrl from '../../../data/media/textures/wooden-frame-relief.avif?url'
import woodSurfaceUrl from '../../../data/media/textures/wooden-frame-surface.avif?url'
import { ENVIRONMENT, type FrameKind } from '../../lib/art-effect/presets'
import { bindTexture, createDataTexture, type Program, type Target } from './gl'
import type { Studio } from './studio'

export type Environment = {
  sharp: WebGLTexture
  gloss: WebGLTexture
  matte: WebGLTexture
  diffuse: WebGLTexture
}

export type Fabric = 'linen' | 'velvet'

export type Moulding = { surface: Target; relief: WebGLTexture }

type KeyedLoads<Key, Value> = WeakMap<Studio, Map<Key, Promise<Value>>>

const FABRICS: Record<Fabric, string> = { linen: linenUrl, velvet: velvetUrl }
const MOULDINGS: Record<FrameKind, { surface: string; relief: string }> = {
  gilt: { surface: giltSurfaceUrl, relief: giltReliefUrl },
  wood: { surface: woodSurfaceUrl, relief: woodReliefUrl },
}
const RELIEF_SLOPE = 6
const UNTOUCHED: ImageBitmapOptions = { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }

const environments = new WeakMap<Studio, Promise<Environment>>()
const fabrics: KeyedLoads<Fabric, WebGLTexture> = new WeakMap()
const mouldings: KeyedLoads<FrameKind, Moulding> = new WeakMap()

export async function bitmapOf(url: string, signal: AbortSignal): Promise<ImageBitmap> {
  const response = await fetch(url, { signal })
  if (!response.ok)
    throw new Error(`a texture could not be fetched from ${url} (${response.status})`)
  return createImageBitmap(await response.blob(), UNTOUCHED)
}

async function loadEnvironment(studio: Studio): Promise<Environment> {
  const atlas = await bitmapOf(roomUrl, studio.lifetime)
  studio.lifetime.throwIfAborted()
  const textures: WebGLTexture[] = []
  let top = 0
  for (const level of ENVIRONMENT.levels) {
    textures.push(createDataTexture(studio.gl, atlas, level, 'around', false, { x: 0, y: top }))
    top += level.height
  }
  atlas.close()
  const [sharp, gloss, matte, diffuse] = textures
  if (!sharp || !gloss || !matte || !diffuse) {
    throw new Error('the environment holds fewer levels than it names')
  }
  return { sharp, gloss, matte, diffuse }
}

function normalsOf(heights: Uint8ClampedArray, size: number): Uint8Array {
  const normals = new Uint8Array(size * size * 4)
  const at = (x: number, y: number): number =>
    (heights[(((y + size) % size) * size + ((x + size) % size)) * 4] ?? 0) / 255
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const across = ((at(x + 1, y) - at(x - 1, y)) / 2) * RELIEF_SLOPE
      const down = ((at(x, y + 1) - at(x, y - 1)) / 2) * RELIEF_SLOPE
      const length = Math.sqrt(across * across + down * down + 1)
      const out = (y * size + x) * 4
      normals[out] = Math.round((-across / length) * 127.5 + 127.5)
      normals[out + 1] = Math.round((-down / length) * 127.5 + 127.5)
      normals[out + 2] = Math.round((1 / length) * 127.5 + 127.5)
      normals[out + 3] = 255
    }
  }
  return normals
}

async function loadFabric(studio: Studio, fabric: Fabric): Promise<WebGLTexture> {
  const relief = await bitmapOf(FABRICS[fabric], studio.lifetime)
  const size = relief.width
  if (relief.height !== size) throw new Error(`the ${fabric} relief is not square`)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error(`the ${fabric} relief could not be read`)
  context.drawImage(relief, 0, 0)
  relief.close()
  const normals = normalsOf(context.getImageData(0, 0, size, size).data, size)
  studio.lifetime.throwIfAborted()
  return createDataTexture(studio.gl, normals, { width: size, height: size }, 'tile', true)
}

export function environmentOf(studio: Studio): Promise<Environment> {
  const known = environments.get(studio)
  if (known) return known
  const loading = loadEnvironment(studio)
  environments.set(studio, loading)
  return loading
}

function loadOnce<Key, Value>(
  loads: KeyedLoads<Key, Value>,
  studio: Studio,
  key: Key,
  load: () => Promise<Value>,
): Promise<Value> {
  const known = loads.get(studio) ?? new Map<Key, Promise<Value>>()
  loads.set(studio, known)
  const loaded = known.get(key)
  if (loaded) return loaded
  const loading = load()
  known.set(key, loading)
  return loading
}

export function fabricOf(studio: Studio, fabric: Fabric): Promise<WebGLTexture> {
  return loadOnce(fabrics, studio, fabric, () => loadFabric(studio, fabric))
}

async function loadMoulding(studio: Studio, frame: FrameKind): Promise<Moulding> {
  const maps = MOULDINGS[frame]
  const [surface, relief] = await Promise.all([
    bitmapOf(maps.surface, studio.lifetime),
    bitmapOf(maps.relief, studio.lifetime),
  ])
  studio.lifetime.throwIfAborted()
  const moulding = {
    surface: studio.picture(surface, { width: surface.width, height: surface.height }),
    relief: createDataTexture(
      studio.gl,
      relief,
      { width: relief.width, height: relief.height },
      'edge',
      true,
    ),
  }
  surface.close()
  relief.close()
  return moulding
}

export function mouldingOf(studio: Studio, frame: FrameKind): Promise<Moulding> {
  return loadOnce(mouldings, studio, frame, () => loadMoulding(studio, frame))
}

export function bindRoom(
  gl: WebGL2RenderingContext,
  program: Program,
  room: Environment,
  unit: number,
  yaw: number,
): void {
  bindTexture(gl, program, 'uRoomSharp', unit, room.sharp)
  bindTexture(gl, program, 'uRoomGloss', unit + 1, room.gloss)
  bindTexture(gl, program, 'uRoomMatte', unit + 2, room.matte)
  bindTexture(gl, program, 'uRoomDiffuse', unit + 3, room.diffuse)
  gl.uniform1f(program.uniform('uRoomRange'), ENVIRONMENT.range)
  gl.uniform1f(program.uniform('uRoomYaw'), yaw)
}
