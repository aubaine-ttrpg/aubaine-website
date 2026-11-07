import type { Cloth } from '../../lib/art-effect/cloth'
import type { Size } from '../../lib/art-effect/cover'
import { gridCorners, gridTriangles } from '../../lib/art-effect/mesh'
import {
  activate,
  bindTexture,
  createDataTexture,
  createLayer,
  type Layer,
  linkProgram,
  type Program,
  releaseLayer,
  releaseTarget,
  resolveLayer,
  type Target,
} from './gl'
import clothFragment from './glsl/cloth.frag?raw'
import clothVertex from './glsl/cloth.vert?raw'
import lighting from './glsl/lighting.glsl?raw'
import type { Studio } from './studio'
import { bindRoom, type Environment } from './textures'

const SUBDIVISION = 4
const LIGHT = [-0.45, -0.55, 0.7] as const
const ROOM_YAW = 3.4
const PILE_TILES = 3.6

export type Pixels = { pixels: TexImageSource; size: Size }

export type Look = {
  picture: Pixels
  detail: Pixels
  field: [number, number, number]
  hem: number
}

export type Materials = { room: Environment; pile: WebGLTexture }

export type Loom = {
  draw: (backing: Size, into: CanvasRenderingContext2D) => boolean
  release: () => void
}

const programs = new WeakMap<Studio, Promise<Program>>()

export function linkLoom(studio: Studio): Promise<Program> {
  const known = programs.get(studio)
  if (known) return known
  const linking = linkProgram(
    studio.gl,
    { vertex: clothVertex, defines: [], presents: false, body: `${lighting}\n${clothFragment}` },
    studio.lifetime,
  )
  programs.set(studio, linking)
  return linking
}

function unit(vector: readonly [number, number, number]): [number, number, number] {
  const [x, y, z] = vector
  const length = Math.hypot(x, y, z)
  return [x / length, y / length, z / length]
}

function createNodes(gl: WebGL2RenderingContext, cloth: Cloth): WebGLTexture {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, cloth.spec.columns, cloth.spec.rows)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  return texture
}

function fillNodes(cloth: Cloth, out: Float32Array): void {
  for (let index = 0; index < cloth.count; index++) {
    out[index * 4] = cloth.position[index * 3] ?? 0
    out[index * 4 + 1] = cloth.position[index * 3 + 1] ?? 0
    out[index * 4 + 2] = cloth.position[index * 3 + 2] ?? 0
  }
}

export async function openLoom(
  studio: Studio,
  cloth: Cloth,
  look: Look,
  materials: Materials,
): Promise<Loom> {
  const program = await linkLoom(studio)
  const { gl } = studio
  const { spec } = cloth
  const mesh = {
    columns: (spec.columns - 1) * SUBDIVISION + 1,
    rows: (spec.rows - 1) * SUBDIVISION + 1,
  }
  const picture: Target = studio.picture(look.picture.pixels, look.picture.size)
  const detail = createDataTexture(gl, look.detail.pixels, look.detail.size, 'edge', true)
  const nodes = createNodes(gl, cloth)
  const placed = new Float32Array(cloth.count * 4)
  const vertices = gl.createVertexArray()
  const corners = gl.createBuffer()
  const order = gl.createBuffer()
  const count = (mesh.columns - 1) * (mesh.rows - 1) * 6
  gl.bindVertexArray(vertices)
  gl.bindBuffer(gl.ARRAY_BUFFER, corners)
  gl.bufferData(gl.ARRAY_BUFFER, gridCorners(mesh), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, order)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gridTriangles(mesh), gl.STATIC_DRAW)
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  const light = unit(LIGHT)
  const pileTile = [PILE_TILES, (PILE_TILES * spec.rest.height) / spec.rest.width] as const
  let layer: Layer | undefined

  const layerFor = (backing: Size): Layer => {
    if (layer && layer.width === backing.width && layer.height === backing.height) return layer
    releaseLayer(gl, layer)
    layer = createLayer(gl, backing, true)
    return layer
  }

  const paint = (target: Layer): void => {
    fillNodes(cloth, placed)
    gl.bindTexture(gl.TEXTURE_2D, nodes)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, spec.columns, spec.rows, gl.RGBA, gl.FLOAT, placed)
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer)
    gl.viewport(0, 0, target.width, target.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clearDepth(1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)
    activate(gl, program)
    bindTexture(gl, program, 'uNodes', 0, nodes)
    bindTexture(gl, program, 'uPicture', 1, picture.texture)
    bindTexture(gl, program, 'uDetail', 2, detail)
    bindTexture(gl, program, 'uPile', 3, materials.pile)
    bindRoom(gl, program, materials.room, 4, ROOM_YAW)
    gl.uniform2i(program.uniform('uGrid'), spec.columns, spec.rows)
    gl.uniform1f(program.uniform('uAspect'), spec.aspect)
    gl.uniform1f(program.uniform('uEye'), spec.eye)
    gl.uniform1f(program.uniform('uDepth'), spec.depth)
    gl.uniform2f(program.uniform('uPileTile'), ...pileTile)
    gl.uniform3f(program.uniform('uLight'), ...light)
    gl.uniform3f(program.uniform('uField'), ...look.field)
    gl.uniform1f(program.uniform('uHem'), look.hem)
    gl.bindVertexArray(vertices)
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0)
    gl.bindVertexArray(null)
    gl.disable(gl.DEPTH_TEST)
    resolveLayer(gl, target)
  }

  return {
    draw: (backing, into) => studio.compose(backing, () => paint(layerFor(backing)), into),
    release: () => {
      releaseLayer(gl, layer)
      layer = undefined
      releaseTarget(gl, picture)
      gl.deleteTexture(detail)
      gl.deleteTexture(nodes)
      gl.deleteVertexArray(vertices)
      gl.deleteBuffer(corners)
      gl.deleteBuffer(order)
    },
  }
}
