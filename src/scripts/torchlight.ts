import type { SwupInstance } from './swup'

const TORCH = '[data-relief="torch"]'
const LIT = 'data-lit'
const MASK_URL = /url\(\s*["']?([^"')]+)["']?\s*\)/
const REST = { x: 0.35, y: 0.32 }
const REACH = { x: 0.42, y: 0.34 }
const GLIDE_SECONDS = 0.12
const SETTLED = 0.0005

type Point = { x: number; y: number }

function soften(value: number, reach: number): number {
  return 0.5 + reach * Math.tanh((value - 0.5) / reach)
}

export function aimAt(
  box: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  pointer: Point,
): Point {
  return {
    x: soften((pointer.x - box.left) / box.width, REACH.x),
    y: soften((pointer.y - box.top) / box.height, REACH.y),
  }
}

const VERTEX = `attribute vec2 corner;
varying vec2 uv;
void main() {
  uv = vec2(corner.x * 0.5 + 0.5, 0.5 - corner.y * 0.5);
  gl_Position = vec4(corner, 0.0, 1.0);
}`

const FRAGMENT = `precision mediump float;
varying vec2 uv;
uniform sampler2D art;
uniform sampler2D cut;
uniform vec2 texel;
uniform vec2 light;
uniform float aspect;
float height(vec2 at) { return dot(texture2D(art, at).rgb, vec3(0.299, 0.587, 0.114)); }
float inside(vec2 at) { return texture2D(cut, at).a; }
void main() {
  float slopeX = height(uv + vec2(texel.x, 0.0)) - height(uv - vec2(texel.x, 0.0));
  float slopeY = height(uv + vec2(0.0, texel.y)) - height(uv - vec2(0.0, texel.y));
  vec3 normal = normalize(vec3(-slopeX * 6.0, -slopeY * 6.0, 1.0));
  vec2 toward = (light - uv) * vec2(aspect, 1.0);
  float diffuse = max(dot(normal, normalize(vec3(toward, 0.45))), 0.0);
  float reach = 1.0 / (1.0 + dot(toward, toward) * 3.0);
  float edge = 0.0;
  for (int step = 0; step < 8; step++) {
    float angle = float(step) * 0.785398;
    edge += inside(uv + vec2(cos(angle), sin(angle)) * texel * 14.0);
  }
  vec3 torch = vec3(1.0, 0.72, 0.42) * 1.15;
  vec3 color = texture2D(art, uv).rgb * (0.55 + diffuse * reach * torch);
  gl_FragColor = vec4(color * mix(0.4, 1.0, smoothstep(2.0, 8.0, edge)), inside(uv));
}`

type Torch = {
  wrapper: HTMLElement
  teardown: AbortController
  observers: Array<ResizeObserver | IntersectionObserver>
  context: WebGLRenderingContext
}

const torches = new Set<Torch>()
const mounting = new WeakSet<HTMLElement>()

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`torchlight could not load ${source}`))
    image.src = source
  })
}

function maskSource(picture: HTMLImageElement): string | undefined {
  const value = window.getComputedStyle(picture).getPropertyValue('--au-picture-mask')
  const found = MASK_URL.exec(value)?.[1]
  return found === undefined ? undefined : new URL(found, window.location.href).href
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('torchlight could not create a shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`torchlight shader failed: ${gl.getShaderInfoLog(shader) ?? 'no log'}`)
  }
  return shader
}

function link(gl: WebGLRenderingContext): WebGLProgram {
  const program = gl.createProgram()
  if (!program) throw new Error('torchlight could not create a program')
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`torchlight program failed: ${gl.getProgramInfoLog(program) ?? 'no log'}`)
  }
  return program
}

function upload(gl: WebGLRenderingContext, image: HTMLImageElement, unit: number): void {
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
}

async function mount(wrapper: HTMLElement): Promise<void> {
  const picture = wrapper.querySelector('img')
  const mask = picture ? maskSource(picture) : undefined
  if (!picture || mask === undefined) return
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false })
  if (!gl) return

  await picture.decode()
  const [art, cut] = await Promise.all([
    loadImage(picture.currentSrc || picture.src),
    loadImage(mask),
  ])
  if (!wrapper.isConnected) return

  const program = link(gl)
  gl.useProgram(program)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const corner = gl.getAttribLocation(program, 'corner')
  gl.enableVertexAttribArray(corner)
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0)
  upload(gl, art, 0)
  upload(gl, cut, 1)
  gl.uniform1i(gl.getUniformLocation(program, 'art'), 0)
  gl.uniform1i(gl.getUniformLocation(program, 'cut'), 1)
  gl.uniform2f(gl.getUniformLocation(program, 'texel'), 1 / art.width, 1 / art.height)
  gl.uniform1f(gl.getUniformLocation(program, 'aspect'), art.width / art.height)
  const lightAt = gl.getUniformLocation(program, 'light')

  const light = { ...REST }
  const target = { ...REST }
  let pointer: Point | undefined
  let visible = false
  let frame = 0
  let previous = 0

  const render = (): void => {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(lightAt, light.x, light.y)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
  const tick = (time: number): void => {
    const seconds = previous === 0 ? 1 / 60 : Math.min((time - previous) / 1000, 0.1)
    previous = time
    const ease = 1 - Math.exp(-seconds / GLIDE_SECONDS)
    light.x += (target.x - light.x) * ease
    light.y += (target.y - light.y) * ease
    render()
    const settled = Math.abs(target.x - light.x) + Math.abs(target.y - light.y) < SETTLED
    if (settled || !visible) {
      frame = 0
      previous = 0
      return
    }
    frame = window.requestAnimationFrame(tick)
  }
  const glide = (): void => {
    if (frame === 0 && visible) frame = window.requestAnimationFrame(tick)
  }
  const aim = (): void => {
    if (!pointer) return
    const next = aimAt(wrapper.getBoundingClientRect(), pointer)
    target.x = next.x
    target.y = next.y
    glide()
  }

  const resize = new ResizeObserver(() => {
    const density = Math.min(window.devicePixelRatio, 2)
    canvas.width = Math.round(wrapper.clientWidth * density)
    canvas.height = Math.round(wrapper.clientHeight * density)
    render()
  })
  const sight = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false
    aim()
  })
  resize.observe(wrapper)
  sight.observe(wrapper)

  const teardown = new AbortController()
  teardown.signal.addEventListener('abort', () => window.cancelAnimationFrame(frame))
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.addEventListener(
      'pointermove',
      (event) => {
        pointer = { x: event.clientX, y: event.clientY }
        aim()
      },
      { passive: true, signal: teardown.signal },
    )
    window.addEventListener('scroll', aim, { passive: true, signal: teardown.signal })
  }

  wrapper.append(canvas)
  wrapper.setAttribute(LIT, '')
  torches.add({ wrapper, teardown, observers: [resize, sight], context: gl })
}

function unmount(torch: Torch): void {
  torch.teardown.abort()
  for (const observer of torch.observers) observer.disconnect()
  torch.context.getExtension('WEBGL_lose_context')?.loseContext()
  torches.delete(torch)
}

function syncTorches(): void {
  for (const torch of torches) {
    if (!torch.wrapper.isConnected) unmount(torch)
  }
  const mounted = new Set([...torches].map((torch) => torch.wrapper))
  for (const wrapper of document.querySelectorAll<HTMLElement>(TORCH)) {
    if (mounted.has(wrapper) || mounting.has(wrapper)) continue
    mounting.add(wrapper)
    mount(wrapper)
      .catch((error: unknown) => console.error(error))
      .finally(() => mounting.delete(wrapper))
  }
}

export function bindTorchlight(swup: SwupInstance): void {
  swup.hooks.on('page:view', syncTorches)
  syncTorches()
}
