import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'
import {
  ARMS,
  ARMS_MAP_SIZE,
  ARMS_SIZE,
  ARMS_UNIFORMS,
  armsFiles,
  ENVIRONMENT,
} from '../../src/lib/art-effect/presets.ts'
import {
  armsSurface,
  curvatureOf,
  normalsOf,
  occlusionOf,
  type Plane,
  shadowOf,
} from '../../src/lib/art-effect/relief.ts'
import { fragmentSource, vertexSource } from '../../src/lib/art-effect/shader-source.ts'
import { linearToSrgb, srgbToLinear } from '../../src/lib/atlas/kernel/colour.ts'
import { ARMS_COMPOSITIONS, ARMS_WORKS } from '../../src/lib/rights/attribution.ts'
import { BAKE_ORIGIN, type BakeSize, bakeInBrowser } from './browser-bake.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const armsDir = resolve(root, 'data/media/arms')
const glslDir = resolve(root, 'src/scripts/art-effect/glsl')
const roomFile = resolve(root, 'data/media/textures/combination-room.webp')

const STILL_QUALITY = 88
const MAP_QUALITY = { colour: 72, relief: 72, finish: 60 } as const

const LAYERS = {
  shield: '.field{fill:#fff} .division,.charges,.outline{display:none}',
  sable: '.field{fill:#000} .division rect{fill:#fff} .charges,.outline{display:none}',
  charges:
    '.field,.division,.outline{display:none} .charge,.charge *{fill:#fff !important;stroke:none !important}',
  lines:
    '.field,.division,.outline{display:none} .charge,.charge *{fill:none !important;stroke:#fff !important} .charge [fill="#000"],.charge .pseudostroke{fill:#fff !important}',
  enamel: '.charges,.outline{display:none}',
} as const

type Layer = keyof typeof LAYERS

function cropped(svg: string, size: BakeSize, style: string, clipped: boolean): string {
  const { x, y, width, height } = ARMS.crop
  const opened = svg.replace(
    /<svg([^>]*?)viewBox="[^"]*"/,
    `<svg$1viewBox="${x} ${y} ${width} ${height}" width="${size.width}" height="${size.height}"`,
  )
  const unclipped = clipped ? opened : opened.replace('<g clip-path="url(#shield)">', '<g>')
  return unclipped.replace('</svg>', `<style>${style}</style></svg>`)
}

async function rasterOf(svg: string, size: BakeSize, layer: Layer): Promise<Buffer> {
  const source = cropped(svg, size, LAYERS[layer], layer !== 'enamel')
  const { data, info } = await sharp(Buffer.from(source))
    .flatten({ background: '#000' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  if (info.width !== size.width || info.height !== size.height) {
    throw new Error(`the ${layer} layer rendered at ${info.width}x${info.height}`)
  }
  return data
}

function planeOf(rgb: Buffer, size: BakeSize): Plane {
  const values = new Float32Array(size.width * size.height)
  for (let at = 0; at < values.length; at++) values[at] = (rgb[at * 3] ?? 0) / 255
  return { ...size, values }
}

function reduced(values: Float32Array, size: BakeSize, channels: number, by: number): Float32Array {
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

function bytes(value: number): number {
  return Math.round(Math.min(Math.max(value, 0), 1) * 255)
}

function pooledTincture(channel: number, pooled: number): number {
  const { open, walls } = ARMS.enamelDepth
  const depth = open + (walls - open) * pooled
  return bytes(linearToSrgb(Math.max(srgbToLinear(channel / 255), 1e-4) ** depth))
}

async function encodeMap(
  pixels: Uint8Array,
  channels: 3 | 4,
  size: BakeSize,
  file: string,
  quality: number,
): Promise<void> {
  await sharp(pixels, { raw: { ...size, channels } })
    .avif({ quality, effort: 6, chromaSubsampling: '4:4:4' })
    .toFile(resolve(armsDir, file))
}

function stillPage(size: BakeSize, files: ReturnType<typeof armsFiles>, fragment: string): string {
  const vertex = vertexSource(
    'layout(location = 0) in vec2 aCorner;\nvoid main() { gl_Position = vec4(aCorner, 0.0, 1.0); }',
  )
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
const [colour, relief, finish, room] = await Promise.all(
  ['${files.colour}', '${files.relief}', '${files.finish}', 'room.webp'].map((name) => bitmap('${BAKE_ORIGIN}/' + name)),
)
bind('uColour', 0, texture(colour, gl.SRGB8_ALPHA8, colour.width, colour.height, true))
bind('uRelief', 1, texture(relief, gl.RGBA8, relief.width, relief.height, true))
bind('uFinish', 2, texture(finish, gl.RGBA8, finish.width, finish.height, true))
const names = ['uRoomSharp', 'uRoomGloss', 'uRoomMatte', 'uRoomDiffuse']
let top = 0
for (const [index, level] of ${JSON.stringify(ENVIRONMENT.levels)}.entries()) {
  const made = texture(room, gl.RGBA8, level.width, level.height, false, top)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  bind(names[index], 3 + index, made)
  top += level.height
}
const set = (name, ...values) => gl['uniform' + values.length + 'f'](gl.getUniformLocation(program, name), ...values)
set('uRoomRange', ${ENVIRONMENT.range})
set('uRoomYaw', ${ARMS.roomYaw})
set('uBacking', ${size.width}, ${size.height})
set('uEye', ${ARMS.rest.x}, ${ARMS.rest.y})
${Object.entries(ARMS_UNIFORMS)
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

async function bakeComposition(file: string): Promise<void> {
  const svg = await readFile(resolve(armsDir, file), 'utf8')
  const files = armsFiles(file)
  const by = ARMS.supersample
  const out = ARMS_MAP_SIZE
  const fine = { width: out.width * by, height: out.height * by }
  const pixelsPerUnit = fine.width / ARMS.crop.width

  const [shield, sable, charges, lines] = await Promise.all(
    (['shield', 'sable', 'charges', 'lines'] as const).map(async (layer) =>
      planeOf(await rasterOf(svg, fine, layer), fine),
    ),
  )
  if (!shield || !sable || !charges || !lines) throw new Error('a layer of the arms is missing')
  const surface = armsSurface(
    { shield, sable, charges, lines },
    ARMS.relief,
    pixelsPerUnit,
    (100 - ARMS.crop.x) * pixelsPerUnit,
    75 * pixelsPerUnit,
  )
  const toMap = (values: Float32Array): Float32Array => reduced(values, fine, 1, by)
  const normals = reduced(
    normalsOf(surface.height, fine.width, fine.height, pixelsPerUnit),
    fine,
    3,
    by,
  )
  const convexity = toMap(
    curvatureOf(surface.height, fine.width, fine.height, ARMS.relief, pixelsPerUnit),
  )
  const coverage = toMap(shield.values)
  const metal = toMap(surface.metal)
  const occlusion = toMap(
    occlusionOf(surface.height, fine.width, fine.height, ARMS.relief, pixelsPerUnit),
  )
  const shadow = toMap(
    shadowOf(surface.height, fine.width, fine.height, ARMS.key, ARMS.relief, pixelsPerUnit),
  )
  const pooled = toMap(surface.pooled)

  const count = out.width * out.height
  const enamel = await sharp(Buffer.from(cropped(svg, out, LAYERS.enamel, false)))
    .removeAlpha()
    .raw()
    .toBuffer()
  const colourMap = new Uint8Array(count * 4)
  const reliefMap = new Uint8Array(count * 3)
  const finishMap = new Uint8Array(count * 3)
  for (let at = 0; at < count; at++) {
    const pooling = pooled[at] ?? 0
    colourMap.set(
      [0, 1, 2].map((channel) => pooledTincture(enamel[at * 3 + channel] ?? 0, pooling)),
      at * 4,
    )
    colourMap[at * 4 + 3] = bytes(coverage[at] ?? 0)
    const nx = normals[at * 3] ?? 0
    const ny = normals[at * 3 + 1] ?? 0
    const nz = normals[at * 3 + 2] ?? 1
    const length = Math.hypot(nx, ny, nz) || 1
    reliefMap.set(
      [
        bytes(0.5 + (0.5 * nx) / length),
        bytes(0.5 + (0.5 * ny) / length),
        bytes(0.5 + 0.5 * (convexity[at] ?? 0)),
      ],
      at * 3,
    )
    finishMap.set(
      [bytes(metal[at] ?? 0), bytes(occlusion[at] ?? 1), bytes(shadow[at] ?? 1)],
      at * 3,
    )
  }
  await encodeMap(colourMap, 4, out, files.colour, MAP_QUALITY.colour)
  await encodeMap(reliefMap, 3, out, files.relief, MAP_QUALITY.relief)
  await encodeMap(finishMap, 3, out, files.finish, MAP_QUALITY.finish)

  const fragment = fragmentSource(
    {
      common: await readFile(resolve(glslDir, 'common.glsl'), 'utf8'),
      present: await readFile(resolve(glslDir, 'present.glsl'), 'utf8'),
    },
    {
      defines: [],
      presents: false,
      body: `${await readFile(resolve(glslDir, 'lighting.glsl'), 'utf8')}\n${await readFile(resolve(glslDir, 'arms.frag'), 'utf8')}`,
    },
  )
  const shot = await bakeInBrowser(stillPage(ARMS_SIZE, files, fragment), ARMS_SIZE, (path) =>
    path === '/room.webp' ? roomFile : resolve(armsDir, path.slice(1)),
  )
  const still = shot['still']
  if (!still) throw new Error(`the still of ${file} was not drawn`)
  await sharp(still)
    .webp({ quality: STILL_QUALITY, alphaQuality: 100, effort: 6 })
    .toFile(resolve(armsDir, files.still))
}

async function main(): Promise<void> {
  const credited = new Set<string>(ARMS_WORKS.map((work) => work.key))
  for (const composition of ARMS_COMPOSITIONS) {
    for (const key of composition.works) {
      if (!credited.has(key))
        throw new Error(`${composition.file} names ${key}, which no work credits`)
    }
    await bakeComposition(composition.file)
  }
  console.log(`arms: baked ${ARMS_COMPOSITIONS.length} composition(s) into data/media/arms/`)
}

await main()
