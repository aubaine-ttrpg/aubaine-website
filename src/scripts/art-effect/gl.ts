import {
  type FragmentParts,
  fragmentSource,
  vertexSource,
} from '../../lib/art-effect/shader-source'
import common from './glsl/common.glsl?raw'
import fill from './glsl/fill.vert?raw'
import present from './glsl/present.glsl?raw'

const LIBRARY = { common, present }

export type Program = {
  program: WebGLProgram
  uniform: (name: string) => WebGLUniformLocation | null
}

export type Target = {
  texture: WebGLTexture
  framebuffer: WebGLFramebuffer
  width: number
  height: number
}

export type TargetFormat = 'srgb' | 'half'

export type ProgramSource = FragmentParts & { vertex?: string }

export function nextFrame(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }
    const frame = window.requestAnimationFrame(() => {
      signal.removeEventListener('abort', cancel)
      resolve()
    })
    const cancel = (): void => {
      window.cancelAnimationFrame(frame)
      reject(signal.reason)
    }
    signal.addEventListener('abort', cancel, { once: true })
  })
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('the hero grade could not create a shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

export async function linkProgram(
  gl: WebGL2RenderingContext,
  source: ProgramSource,
  signal: AbortSignal,
): Promise<Program> {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource(source.vertex ?? fill))
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource(LIBRARY, source))
  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  const parallel = gl.getExtension('KHR_parallel_shader_compile')
  if (parallel) {
    while (!gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) await nextFrame(signal)
  }
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const logs = [
      gl.getShaderInfoLog(fragment),
      gl.getShaderInfoLog(vertex),
      gl.getProgramInfoLog(program),
    ]
    throw new Error(`a hero grade program failed to link: ${logs.filter(Boolean).join(' ')}`)
  }
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  const locations = new Map<string, WebGLUniformLocation | null>()
  return {
    program,
    uniform: (name) => {
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name))
      return locations.get(name) ?? null
    },
  }
}

export function createTarget(
  gl: WebGL2RenderingContext,
  format: TargetFormat,
  width: number,
  height: number,
  levels = 1,
): Target {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texStorage2D(
    gl.TEXTURE_2D,
    levels,
    format === 'srgb' ? gl.SRGB8_ALPHA8 : gl.RGBA16F,
    width,
    height,
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    levels > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST,
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, levels > 1 ? gl.LINEAR : gl.NEAREST)
  const framebuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`a hero grade ${format} target of ${width}x${height} is incomplete (${status})`)
  }
  return { texture, framebuffer, width, height }
}

export function releaseTarget(gl: WebGL2RenderingContext, target: Target | undefined): void {
  if (!target) return
  gl.deleteFramebuffer(target.framebuffer)
  gl.deleteTexture(target.texture)
}

export function mipLevels(width: number, height: number): number {
  return Math.floor(Math.log2(Math.max(width, height))) + 1
}

export async function gpuDone(gl: WebGL2RenderingContext, signal: AbortSignal): Promise<void> {
  const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
  if (!fence) throw new Error('the hero grade could not fence its GPU work')
  gl.flush()
  try {
    for (;;) {
      const status = gl.clientWaitSync(fence, 0, 0)
      if (status === gl.WAIT_FAILED) throw new Error('the hero grade lost its GPU fence')
      if (status !== gl.TIMEOUT_EXPIRED) return
      await nextFrame(signal)
    }
  } finally {
    gl.deleteSync(fence)
  }
}

const COVERING_TRIANGLE = new Float32Array([-1, -1, 3, -1, -1, 3])

const coverings = new WeakMap<WebGL2RenderingContext, WebGLVertexArrayObject>()

function coveringOf(gl: WebGL2RenderingContext): WebGLVertexArrayObject {
  const known = coverings.get(gl)
  if (known) return known
  const covering = gl.createVertexArray()
  const corners = gl.createBuffer()
  gl.bindVertexArray(covering)
  gl.bindBuffer(gl.ARRAY_BUFFER, corners)
  gl.bufferData(gl.ARRAY_BUFFER, COVERING_TRIANGLE, gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.bindVertexArray(null)
  gl.bindBuffer(gl.ARRAY_BUFFER, null)
  coverings.set(gl, covering)
  return covering
}

export function draw(
  gl: WebGL2RenderingContext,
  target: Target | undefined,
  width: number,
  height: number,
): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null)
  gl.viewport(0, 0, width, height)
  gl.bindVertexArray(coveringOf(gl))
  gl.drawArrays(gl.TRIANGLES, 0, 3)
  gl.bindVertexArray(null)
}

export function activate(gl: WebGL2RenderingContext, program: Program): void {
  gl.useProgram(program.program)
}

export function bindTexture(
  gl: WebGL2RenderingContext,
  program: Program,
  name: string,
  unit: number,
  texture: WebGLTexture,
): void {
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.uniform1i(program.uniform(name), unit)
}

export type Wrap = 'tile' | 'edge' | 'around'

export function createDataTexture(
  gl: WebGL2RenderingContext,
  pixels: TexImageSource | Uint8Array,
  { width, height }: { width: number; height: number },
  wrap: Wrap,
  mipmapped: boolean,
  from: { x: number; y: number } = { x: 0, y: 0 },
): WebGLTexture {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texStorage2D(gl.TEXTURE_2D, mipmapped ? mipLevels(width, height) : 1, gl.RGBA8, width, height)
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  if (pixels instanceof Uint8Array) {
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  } else {
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, from.x)
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, from.y)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0)
    gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0)
  }
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap === 'edge' ? gl.CLAMP_TO_EDGE : gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap === 'tile' ? gl.REPEAT : gl.CLAMP_TO_EDGE)
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    mipmapped ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR,
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  if (mipmapped) gl.generateMipmap(gl.TEXTURE_2D)
  return texture
}

export function sharpen(gl: WebGL2RenderingContext, texture: WebGLTexture): void {
  const anisotropic = gl.getExtension('EXT_texture_filter_anisotropic')
  if (!anisotropic) return
  const most = Number(gl.getParameter(anisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT))
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameterf(gl.TEXTURE_2D, anisotropic.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, most))
}

export type Layer = {
  framebuffer: WebGLFramebuffer
  colour: WebGLRenderbuffer
  depth: WebGLRenderbuffer | undefined
  width: number
  height: number
}

const LAYER_SAMPLES = 4

export function createLayer(
  gl: WebGL2RenderingContext,
  { width, height }: { width: number; height: number },
  depth: boolean,
): Layer {
  const samples = Math.min(LAYER_SAMPLES, Number(gl.getParameter(gl.MAX_SAMPLES)))
  const framebuffer = gl.createFramebuffer()
  const colour = gl.createRenderbuffer()
  gl.bindRenderbuffer(gl.RENDERBUFFER, colour)
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, width, height)
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colour)
  let depthBuffer: WebGLRenderbuffer | undefined
  if (depth) {
    depthBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT16, width, height)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer)
  }
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`a cloth layer of ${width}x${height} is incomplete (${status})`)
  }
  return { framebuffer, colour, depth: depthBuffer, width, height }
}

export function releaseLayer(gl: WebGL2RenderingContext, layer: Layer | undefined): void {
  if (!layer) return
  gl.deleteFramebuffer(layer.framebuffer)
  gl.deleteRenderbuffer(layer.colour)
  if (layer.depth) gl.deleteRenderbuffer(layer.depth)
}

export function resolveLayer(gl: WebGL2RenderingContext, layer: Layer): void {
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, layer.framebuffer)
  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
  gl.blitFramebuffer(
    0,
    0,
    layer.width,
    layer.height,
    0,
    0,
    layer.width,
    layer.height,
    gl.COLOR_BUFFER_BIT,
    gl.NEAREST,
  )
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}
