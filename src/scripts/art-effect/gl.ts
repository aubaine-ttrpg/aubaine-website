import common from './glsl/common.glsl?raw'
import fill from './glsl/fill.vert?raw'
import present from './glsl/present.glsl?raw'

const PREAMBLE = '#version 300 es\nprecision highp float;\nprecision highp int;\n'

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

export type ProgramSource = { defines: readonly string[]; presents: boolean; body: string }

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

function fragmentSource({ defines, presents, body }: ProgramSource): string {
  const declared = defines.map((name) => `#define ${name}\n`).join('')
  return `${PREAMBLE}${declared}${common}\n${presents ? `${present}\n` : ''}${body}`
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
  const vertex = compile(gl, gl.VERTEX_SHADER, `${PREAMBLE}${fill}`)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource(source))
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

export function draw(
  gl: WebGL2RenderingContext,
  target: Target | undefined,
  width: number,
  height: number,
): void {
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null)
  gl.viewport(0, 0, width, height)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
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
