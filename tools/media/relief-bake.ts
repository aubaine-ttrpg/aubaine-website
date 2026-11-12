import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'
import { type LeanOptics, leanWarp } from '../../src/lib/art-effect/lean.ts'
import { ENVIRONMENT } from '../../src/lib/art-effect/presets.ts'
import type { Plane } from '../../src/lib/art-effect/relief.ts'
import { fragmentSource, vertexSource } from '../../src/lib/art-effect/shader-source.ts'
import { BAKE_ORIGIN, type BakeSize, bakeInBrowser } from './browser-bake.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const glslDir = resolve(root, 'src/scripts/art-effect/glsl')
const roomFile = resolve(root, 'data/media/textures/combination-room.webp')

export type BakedMap = { uniform: string; file: string; colour: boolean }

export type StillScene = {
  size: BakeSize
  maps: readonly BakedMap[]
  fragment: string
  roomYaw: number
  lean: LeanOptics
  eye: { x: number; y: number }
  uniforms: Readonly<Record<string, readonly number[]>>
}

export function planeOf(rgb: Buffer, size: BakeSize): Plane {
  const values = new Float32Array(size.width * size.height)
  for (let at = 0; at < values.length; at++) values[at] = (rgb[at * 3] ?? 0) / 255
  return { ...size, values }
}

export function reduced(
  values: Float32Array,
  size: BakeSize,
  channels: number,
  by: number,
): Float32Array {
  const width = size.width / by
  const height = size.height / by
  const out = new Float32Array(width * height * channels)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < channels; c++) {
        let sum = 0
        for (let dy = 0; dy < by; dy++) {
          for (let dx = 0; dx < by; dx++) {
            sum += values[((y * by + dy) * size.width + (x * by + dx)) * channels + c] ?? 0
          }
        }
        out[(y * width + x) * channels + c] = sum / (by * by)
      }
    }
  }
  return out
}

export function bytes(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 1) * 255)
}

export type ReliefMaps = { colour: Uint8Array; relief: Uint8Array; finish: Uint8Array }

export type ReliefMapFiles = { colour: string; relief: string; finish: string }

const MAP_QUALITY = { colour: 72, relief: 72, finish: 60 } as const
const STILL_QUALITY = 88

export function reliefMapOf(normals: Float32Array, convexity: Float32Array): Uint8Array {
  const map = new Uint8Array(convexity.length * 3)
  for (let at = 0; at < convexity.length; at++) {
    const nx = normals[at * 3] ?? 0
    const ny = normals[at * 3 + 1] ?? 0
    const nz = normals[at * 3 + 2] ?? 1
    const length = Math.hypot(nx, ny, nz) || 1
    map.set(
      [
        bytes(0.5 + (0.5 * nx) / length),
        bytes(0.5 + (0.5 * ny) / length),
        bytes(0.5 + 0.5 * (convexity[at] ?? 0)),
      ],
      at * 3,
    )
  }
  return map
}

export function finishMapOf(
  surface: Float32Array,
  occlusion: Float32Array,
  shadow: Float32Array,
): Uint8Array {
  const map = new Uint8Array(surface.length * 3)
  for (let at = 0; at < surface.length; at++) {
    map.set([bytes(surface[at] ?? 0), bytes(occlusion[at] ?? 1), bytes(shadow[at] ?? 1)], at * 3)
  }
  return map
}

async function encodeMap(
  pixels: Uint8Array,
  channels: 3 | 4,
  size: BakeSize,
  path: string,
  quality: number,
): Promise<void> {
  await sharp(pixels, { raw: { ...size, channels } })
    .avif({ quality, effort: 6, chromaSubsampling: '4:4:4' })
    .toFile(path)
}

export async function writeReliefMaps(
  maps: ReliefMaps,
  size: BakeSize,
  dir: string,
  files: ReliefMapFiles,
): Promise<void> {
  await encodeMap(maps.colour, 4, size, resolve(dir, files.colour), MAP_QUALITY.colour)
  await encodeMap(maps.relief, 3, size, resolve(dir, files.relief), MAP_QUALITY.relief)
  await encodeMap(maps.finish, 3, size, resolve(dir, files.finish), MAP_QUALITY.finish)
}

export async function writeStill(still: Buffer, path: string): Promise<void> {
  await sharp(still).webp({ quality: STILL_QUALITY, alphaQuality: 100, effort: 6 }).toFile(path)
}

export async function reliefFragment(...bodies: readonly string[]): Promise<string> {
  const read = (file: string): Promise<string> => readFile(resolve(glslDir, file), 'utf8')
  const parts = await Promise.all(['lighting.glsl', ...bodies].map(read))
  return fragmentSource(
    { common: await read('common.glsl'), present: await read('present.glsl') },
    { defines: [], presents: false, body: parts.join('\n') },
  )
}

function stillPage({ size, maps, fragment, roomYaw, lean, eye, uniforms }: StillScene): string {
  const vertex = vertexSource(
    'layout(location = 0) in vec2 aCorner;\nvoid main() { gl_Position = vec4(aCorner, 0.0, 1.0); }',
  )
  const flat = [...leanWarp({ box: size, margin: 0, backing: size, lean: { x: 0, y: 0 } }, lean)]
  return `<!doctype html>
<html><body style="margin:0;background:transparent">
<canvas id="still" width="${size.width}" height="${size.height}"></canvas>
<script type="module">
const canvas = document.getElementById('still')
const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false })
const untouched = { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }
const bitmap = async (url) => createImageBitmap(await (await fetch(url)).blob(), untouched)
const compile = (type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader))
  return shader
}
const program = gl.createProgram()
gl.attachShader(program, compile(gl.VERTEX_SHADER, ${JSON.stringify(vertex)}))
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, ${JSON.stringify(fragment)}))
gl.linkProgram(program)
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program))
gl.useProgram(program)
const levels = (width, height) => Math.floor(Math.log2(Math.max(width, height))) + 1
const texture = (pixels, format, width, height, mipmapped, from = 0) => {
  const made = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0 + gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) - 1)
  gl.bindTexture(gl.TEXTURE_2D, made)
  gl.texStorage2D(gl.TEXTURE_2D, mipmapped ? levels(width, height) : 1, format, width, height)
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.pixelStorei(gl.UNPACK_SKIP_ROWS, from)
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmapped ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  if (mipmapped) gl.generateMipmap(gl.TEXTURE_2D)
  return made
}
const bind = (name, unit, made) => {
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, made)
  gl.uniform1i(gl.getUniformLocation(program, name), unit)
}
const maps = ${JSON.stringify(maps)}
const [room, ...pictures] = await Promise.all(
  ['room.webp', ...maps.map((map) => map.file)].map((name) => bitmap('${BAKE_ORIGIN}/' + name)),
)
for (const [unit, map] of maps.entries()) {
  const picture = pictures[unit]
  bind(map.uniform, unit, texture(picture, map.colour ? gl.SRGB8_ALPHA8 : gl.RGBA8, picture.width, picture.height, true))
}
const names = ['uRoomSharp', 'uRoomGloss', 'uRoomMatte', 'uRoomDiffuse']
let top = 0
for (const [index, level] of ${JSON.stringify(ENVIRONMENT.levels)}.entries()) {
  const made = texture(room, gl.RGBA8, level.width, level.height, false, top)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  bind(names[index], maps.length + index, made)
  top += level.height
}
const set = (name, ...values) => gl['uniform' + values.length + 'f'](gl.getUniformLocation(program, name), ...values)
set('uRoomRange', ${ENVIRONMENT.range})
set('uRoomYaw', ${roomYaw})
gl.uniformMatrix3fv(gl.getUniformLocation(program, 'uWarp'), false, ${JSON.stringify(flat)})
set('uPiece', ${size.width}, ${size.height})
set('uEye', ${eye.x}, ${eye.y})
${Object.entries(uniforms)
  .map(([name, values]) => `set('${name}', ${values.join(', ')})`)
  .join('\n')}
const covering = gl.createVertexArray()
gl.bindVertexArray(covering)
gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
gl.enableVertexAttribArray(0)
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
gl.viewport(0, 0, ${size.width}, ${size.height})
gl.drawArrays(gl.TRIANGLES, 0, 3)
gl.finish()
window.baked = { still: canvas.toDataURL('image/png') }
</script></body></html>`
}

export async function bakeStill(scene: StillScene, mapsDir: string): Promise<Buffer> {
  const shot = await bakeInBrowser(stillPage(scene), scene.size, (path) =>
    path === '/room.webp' ? roomFile : resolve(mapsDir, path.slice(1)),
  )
  const still = shot['still']
  if (!still) throw new Error(`the still of ${scene.maps[0]?.file ?? 'a relief'} was not drawn`)
  return still
}
