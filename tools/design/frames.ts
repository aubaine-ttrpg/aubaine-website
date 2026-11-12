import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

import { type Browser, type BrowserContext, chromium, type Page } from 'playwright-core'
import sharp from 'sharp'

import { type Lean, leanMargin } from '../../src/lib/art-effect/lean.ts'
import { ARMS_SIZE, armsFiles, ENVIRONMENT } from '../../src/lib/art-effect/presets.ts'
import { sealFiles } from '../../src/lib/art-effect/seal-look.ts'
import { readCorpus } from '../../src/lib/game/fs-sources.ts'
import { ARMS_COMPOSITIONS } from '../../src/lib/rights/attribution.ts'
import { BUILD_LEAD } from '../../src/scripts/art-effect/approach.ts'
import { FULLEST_LEAN } from '../../src/scripts/tilt.ts'
import { aimAt } from '../../src/scripts/torchlight.ts'
import { bakeStill, type StillScene } from '../media/relief-bake.ts'
import { ARMS_DIR, armsStillScene, SEALS_DIR, sealStillScene } from '../media/relief-scenes.ts'
import { ENGINES, type Engine, isEngine } from './engines.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const MODES = ['appear', 'sweep', 'idle', 'bytes', 'shader', 'light', 'twin'] as const

type Mode = (typeof MODES)[number]

const USAGE = `pnpm design:frames --mode=MODE [--base=URL] [--path=/fr/espece/humain] [--pieces=arms,seal]
  [--engines=firefox,chromium,webkit] [--ratios=1,2] [--runs=5] [--out=FILE|DIR] [--dist=dist]
  [--against=URL|DIR] [--headless]

Measures the lit pieces of a page, named by their data-drape kind, on a production build.
  appear  time from the build lead to the first drawn frame, long frames and decoding in between
  sweep   a fixed 10 s pointer path with every piece in view: frame intervals, long frames,
          redraws, main-thread shading and copy per redraw, GPU time, repeated inputs
  idle    draws after the light settles, off screen, and after the single frame of reduced motion
  bytes   the maps, the stills each size picks, the chunks, and texture memory
  shader  each piece's shader on SwiftShader at three eyes and two fullest leans; --against=DIR
          compares with an earlier --out=DIR
  light   mean luminance at rest and at two far pointers, and the swing, in Chromium at ratio 2
  twin    the build at --base against the build at --against, on a paused clock, pixel by pixel
Headed on the graphics card unless --headless. Default --base=http://localhost:4322.

Exit 0 when the measure ran (and, for shader and twin, nothing differs); 1 when something differs;
2 on a usage error.`

const VIEW = { width: 1440, height: 900 }
const SETTLE_MS = 1500
const SWEEP_SECONDS = 10
const POINTER_HZ = 60
const SCROLL_STEP_PX = 120
const SCROLL_STEP_MS = 50
const LONG_FRAME_MS = 50
const BUILD_WINDOW_MS = 300
const REST_MS = 3000
const SETTLED_TAIL_MS = 2000
const COLUMN_CAP_PX = 192
const SHADER_DENSITY = 2
const SIZES = [
  [1512, 860],
  [1440, 789],
  [1366, 657],
  [1280, 610],
  [1024, 768],
  [820, 1180],
  [390, 844],
  [320, 568],
] as const

class UsageError extends Error {}

function option(name: string, fallback?: string): string {
  const prefix = `--${name}=`
  const value = process.argv.find((entry) => entry.startsWith(prefix))?.slice(prefix.length)
  if (value !== undefined) return value
  if (fallback !== undefined) return fallback
  throw new UsageError(`design:frames needs --${name}=...`)
}

function modeOf(name: string): Mode {
  const mode = MODES.find((known) => known === name)
  if (!mode) throw new UsageError(`design:frames knows no mode ${name}`)
  return mode
}

function enginesOf(list: string): Engine[] {
  return list.split(',').map((name) => {
    if (!isEngine(name)) throw new UsageError(`design:frames knows no engine ${name}`)
    return name
  })
}

type Redraw = {
  piece: string
  at: number
  issue: number
  copy: number
  gpu: number
  repeat: boolean
  inputs: string
}

type Decode = { url: string; start: number; end: number; failed: string }

type Probe = {
  redraws: Redraw[]
  frames: number[]
  long: { start: number; duration: number; blocking: number }[]
  leads: Record<string, number>
  drawn: Record<string, number>
  decodes: Decode[]
  uploads: { at: number; ms: number; mipmaps: boolean }[]
  renderer: string
  timer: boolean
  loaf: boolean
  resolution: number
}

function probe(lead: string): void {
  const record: Probe = {
    redraws: [],
    frames: [],
    long: [],
    leads: {},
    drawn: {},
    decodes: [],
    uploads: [],
    renderer: '',
    timer: false,
    loaf: PerformanceObserver.supportedEntryTypes.includes('long-animation-frame'),
    resolution: Number.POSITIVE_INFINITY,
  }
  let ticks = 0
  for (let sample = 0, before = performance.now(); sample < 1_000_000 && ticks < 20; sample++) {
    const after = performance.now()
    if (after > before) {
      record.resolution = Math.min(record.resolution, after - before)
      ticks += 1
    }
    before = after
  }
  Reflect.set(window, 'framesProbe', record)
  const INPUTS = new Set(['uEye', 'uPiece', 'uWarp'])
  const names = new WeakMap<WebGLUniformLocation, string>()
  const studios = new WeakSet<HTMLCanvasElement>()
  const instrumented = new WeakSet<WebGL2RenderingContext>()
  const urls = new WeakMap<Blob, string>()
  const lastInputs = new WeakMap<HTMLCanvasElement, string>()
  const unnamed = new Map<Redraw, HTMLCanvasElement>()
  const firstDrawn = new Map<HTMLCanvasElement, number>()
  const pending: { query: WebGLQuery; redraw: Redraw }[] = []
  let inputs: Record<string, string> = {}
  let issueStart: number | undefined
  let context: WebGL2RenderingContext | undefined
  let timer: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null = null
  let query: WebGLQuery | undefined

  const wrap = (
    target: object,
    name: string,
    around: (call: () => unknown, args: unknown[], self: unknown) => unknown,
  ): void => {
    const original: unknown = Reflect.get(target, name)
    if (typeof original !== 'function') return
    Object.defineProperty(target, name, {
      configurable: true,
      writable: true,
      value(this: unknown, ...args: unknown[]) {
        return around(() => Reflect.apply(original, this, args), args, this)
      },
    })
  }

  const timed =
    (mipmaps: boolean) =>
    (call: () => unknown): unknown => {
      const started = performance.now()
      const result = call()
      record.uploads.push({ at: started, ms: performance.now() - started, mipmaps })
      return result
    }

  const instrument = (gl: WebGL2RenderingContext): void => {
    if (instrumented.has(gl)) return
    instrumented.add(gl)
    context = gl
    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    record.renderer = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
    timer = gl.getExtension('EXT_disjoint_timer_query_webgl2')
    record.timer = timer !== null
    wrap(gl, 'getUniformLocation', (call, [, name]) => {
      const location = call()
      if (
        location instanceof WebGLUniformLocation &&
        typeof name === 'string' &&
        INPUTS.has(name)
      ) {
        names.set(location, name)
      }
      return location
    })
    const remember = (location: unknown, values: unknown[]): void => {
      if (!(location instanceof WebGLUniformLocation)) return
      const name = names.get(location)
      if (name) inputs[name] = Array.from(Float32Array.from(values.map(Number))).join()
    }
    wrap(gl, 'uniform2f', (call, [location, x, y]) => {
      remember(location, [x, y])
      return call()
    })
    wrap(gl, 'uniformMatrix3fv', (call, [location, , data]) => {
      remember(location, data instanceof Float32Array || Array.isArray(data) ? [...data] : [])
      return call()
    })
    wrap(gl, 'useProgram', (call) => {
      issueStart ??= performance.now()
      return call()
    })
    wrap(gl, 'drawArrays', (call) => {
      const onScreen = gl.getParameter(gl.FRAMEBUFFER_BINDING) === null
      if (!timer || !onScreen || query) return call()
      const started = gl.createQuery()
      gl.beginQuery(timer.TIME_ELAPSED_EXT, started)
      const result = call()
      gl.endQuery(timer.TIME_ELAPSED_EXT)
      query = started
      return result
    })
    wrap(gl, 'texSubImage2D', (call, args) =>
      args.some((arg) => arg instanceof ImageBitmap) ? timed(false)(call) : call(),
    )
    wrap(gl, 'generateMipmap', timed(true))
  }

  wrap(HTMLCanvasElement.prototype, 'getContext', (call, [kind], self) => {
    const made = call()
    const studio =
      kind === 'webgl2' &&
      made instanceof WebGL2RenderingContext &&
      self instanceof HTMLCanvasElement &&
      !self.hasAttribute('data-almanach-stage')
    if (studio) {
      studios.add(self)
      instrument(made)
    }
    return made
  })

  wrap(CanvasRenderingContext2D.prototype, 'drawImage', (call, [source], self) => {
    if (!(source instanceof HTMLCanvasElement) || !studios.has(source)) return call()
    if (!(self instanceof CanvasRenderingContext2D)) return call()
    const destination = self.canvas
    const started = performance.now()
    const result = call()
    const copy = performance.now() - started
    const key = `${inputs['uEye']}|${inputs['uPiece']}|${inputs['uWarp']}|${destination.width}x${destination.height}`
    const redraw: Redraw = {
      piece: '',
      at: started,
      issue: issueStart === undefined ? 0 : started - issueStart,
      copy,
      gpu: Number.NaN,
      repeat: lastInputs.get(destination) === key,
      inputs: key,
    }
    lastInputs.set(destination, key)
    record.redraws.push(redraw)
    unnamed.set(redraw, destination)
    if (!firstDrawn.has(destination)) firstDrawn.set(destination, started)
    if (query) pending.push({ query, redraw })
    query = undefined
    issueStart = undefined
    inputs = {}
    return result
  })

  wrap(Response.prototype, 'blob', (call, _args, self) => {
    const result = call()
    const url = self instanceof Response ? self.url : ''
    if (!(result instanceof Promise)) return result
    return result.then((blob: unknown) => {
      if (blob instanceof Blob) urls.set(blob, url)
      return blob
    })
  })

  wrap(window, 'createImageBitmap', (call, [source]) => {
    const start = performance.now()
    const url = source instanceof Blob ? (urls.get(source) ?? '') : ''
    const result = call()
    if (result instanceof Promise) {
      result.then(
        () => record.decodes.push({ url, start, end: performance.now(), failed: '' }),
        (error: unknown) =>
          record.decodes.push({ url, start, end: performance.now(), failed: String(error) }),
      )
    }
    return result
  })

  Reflect.set(window, 'framesName', (): void => {
    const pieceOf = (canvas: HTMLCanvasElement) => canvas.parentElement?.getAttribute('data-drape')
    for (const [redraw, canvas] of unnamed) {
      const piece = pieceOf(canvas)
      if (!piece) continue
      redraw.piece = piece
      unnamed.delete(redraw)
    }
    for (const [canvas, at] of firstDrawn) {
      const piece = pieceOf(canvas)
      if (piece) record.drawn[piece] ??= at
    }
  })

  const settle = (): void => {
    const gl = context
    if (!gl || !timer) return
    const disjoint = Boolean(gl.getParameter(timer.GPU_DISJOINT_EXT))
    while (pending.length > 0) {
      const first = pending[0]
      if (!first || !gl.getQueryParameter(first.query, gl.QUERY_RESULT_AVAILABLE)) break
      pending.shift()
      const nanoseconds = Number(gl.getQueryParameter(first.query, gl.QUERY_RESULT))
      gl.deleteQuery(first.query)
      first.redraw.gpu = disjoint ? Number.NaN : nanoseconds / 1e6
    }
  }
  const request = window.requestAnimationFrame.bind(window)
  const frame = (time: number): void => {
    record.frames.push(time)
    settle()
    request(frame)
  }
  request(frame)

  if (record.loaf) {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        record.long.push({
          start: entry.startTime,
          duration: entry.duration,
          blocking: Number(Reflect.get(entry, 'blockingDuration') ?? 0),
        })
      }
    }).observe({ type: 'long-animation-frame', buffered: true })
  }

  document.addEventListener('DOMContentLoaded', () => {
    const near = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const piece = entry.target.getAttribute('data-drape')
          if (piece && entry.isIntersecting) record.leads[piece] ??= performance.now()
        }
      },
      { rootMargin: lead },
    )
    for (const holder of document.querySelectorAll('[data-drape]')) near.observe(holder)
  })
}

function quantile(values: readonly number[], q: number): number {
  const sorted = values.filter(Number.isFinite).toSorted((a, b) => a - b)
  if (sorted.length === 0) return Number.NaN
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? Number.NaN
}

function spread(values: readonly number[], digits = 1): string {
  const finite = values.filter(Number.isFinite)
  if (finite.length === 0) return 'n/a'
  const median = quantile(finite, 0.5)
  if (finite.length === 1) return median.toFixed(digits)
  return `${median.toFixed(digits)} [${Math.min(...finite).toFixed(digits)}..${Math.max(...finite).toFixed(digits)}]`
}

function reportErrors(page: Page): Page {
  page.on('pageerror', (error) => console.error(`page error: ${error.message}`))
  return page
}

async function readProbe(page: Page): Promise<Probe> {
  return page.evaluate((): Probe => {
    Reflect.apply(Reflect.get(window, 'framesName'), window, [])
    return Reflect.get(window, 'framesProbe')
  })
}

async function now(page: Page): Promise<number> {
  return page.evaluate(() => performance.now())
}

type Box = { x: number; y: number; width: number; height: number }

async function boxes(page: Page, pieces: readonly string[]): Promise<Record<string, Box>> {
  const found: Record<string, Box> = {}
  for (const piece of pieces) {
    const box = await page.locator(`[data-drape="${piece}"]`).boundingBox()
    if (!box) throw new Error(`the page shows no ${piece}`)
    found[piece] = box
  }
  return found
}

async function bringAllIntoView(page: Page, pieces: readonly string[]): Promise<void> {
  await page.evaluate((kinds) => {
    const placed = kinds.map((kind) => {
      const holder = document.querySelector(`[data-drape="${kind}"]`)
      if (!holder) throw new Error(`the page shows no ${kind}`)
      const box = holder.getBoundingClientRect()
      return { top: box.top + window.scrollY, bottom: box.bottom + window.scrollY }
    })
    const top = Math.min(...placed.map((box) => box.top))
    const bottom = Math.max(...placed.map((box) => box.bottom))
    if (bottom - top > window.innerHeight) throw new Error('the pieces do not fit one screen')
    window.scrollTo(0, Math.round((top + bottom) / 2 - window.innerHeight / 2))
  }, pieces)
}

async function drawn(page: Page, pieces: readonly string[]): Promise<void> {
  await page.waitForFunction(
    (kinds) => {
      Reflect.apply(Reflect.get(window, 'framesName'), window, [])
      const record: unknown = Reflect.get(window, 'framesProbe')
      const drawnAt: unknown = record && Reflect.get(record, 'drawn')
      return kinds.every((kind) => drawnAt && Reflect.get(drawnAt, kind) !== undefined)
    },
    pieces,
    { timeout: 30_000 },
  )
}

type Opening = { reducedMotion?: 'reduce' | 'no-preference'; fineTimers?: boolean }

type Run = {
  engine: Engine
  ratio: number
  run: number
  renderer: string
  values: Record<string, number>
}

async function isolated(context: BrowserContext): Promise<void> {
  await context.route('**/*', async (route) => {
    const response = await route.fetch()
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'cross-origin-opener-policy': 'same-origin',
        'cross-origin-embedder-policy': 'require-corp',
      },
    })
  })
}

async function opened(
  browser: Browser,
  ratio: number,
  url: string,
  { reducedMotion = 'no-preference', fineTimers = true }: Opening = {},
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: ratio,
    reducedMotion,
  })
  if (fineTimers) await isolated(context)
  await context.addInitScript(probe, BUILD_LEAD)
  const page = reportErrors(await context.newPage())
  await page.goto(url, { waitUntil: 'load' })
  return { context, page }
}

function longFramesBetween(
  record: Probe,
  from: number,
  to: number,
): { count: number; worst: number } {
  const gaps: number[] = []
  const frames = record.frames.filter((time) => time >= from && time <= to)
  for (let at = 1; at < frames.length; at++) gaps.push((frames[at] ?? 0) - (frames[at - 1] ?? 0))
  if (record.loaf) {
    const long = record.long.filter((entry) => entry.start >= from && entry.start <= to)
    return { count: long.length, worst: Math.max(0, ...gaps) }
  }
  const long = gaps.filter((gap) => gap > LONG_FRAME_MS)
  return { count: long.length, worst: Math.max(0, ...gaps) }
}

async function appear(browser: Browser, ratio: number, url: string, pieces: readonly string[]) {
  const { context, page } = await opened(browser, ratio, url, { fineTimers: false })
  const target = await page.evaluate((kinds) => {
    const tops = kinds.map((kind) => {
      const holder = document.querySelector(`[data-drape="${kind}"]`)
      if (!holder) throw new Error(`the page shows no ${kind}`)
      return holder.getBoundingClientRect().bottom + window.scrollY
    })
    return Math.max(...tops) - window.innerHeight / 2
  }, pieces)
  for (let y = 0; y < target; y += SCROLL_STEP_PX) {
    await page.evaluate((step) => window.scrollBy(0, step), SCROLL_STEP_PX)
    await page.waitForTimeout(SCROLL_STEP_MS)
  }
  await drawn(page, pieces)
  await page.waitForTimeout(SETTLE_MS)
  const record = await readProbe(page)
  await context.close()
  const values: Record<string, number> = {}
  for (const piece of pieces) {
    const lead = record.leads[piece] ?? Number.NaN
    const first = record.drawn[piece] ?? Number.NaN
    const long = longFramesBetween(record, lead - BUILD_WINDOW_MS, first + BUILD_WINDOW_MS)
    const decodes = record.decodes.filter((decode) => decode.start >= lead && decode.start <= first)
    values[`${piece} lead to first frame ms`] = first - lead
    values[`${piece} long frames`] = long.count
    values[`${piece} worst frame ms`] = long.worst
    values[`${piece} slowest decode ms`] = Math.max(0, ...decodes.map((d) => d.end - d.start))
    const uploads = record.uploads.filter((upload) => upload.at >= lead && upload.at <= first)
    const spent = (mipmaps: boolean) =>
      uploads.filter((u) => u.mipmaps === mipmaps).reduce((sum, u) => sum + u.ms, 0)
    values[`${piece} image upload ms`] = spent(false)
    values[`${piece} mipmap ms`] = spent(true)
  }
  return { renderer: record.renderer, values }
}

function sweepPointer(t: number, places: Record<string, Box>, pieces: readonly string[]) {
  const around = (box: Box, phase: number) => ({
    x: box.x + box.width * (0.5 + 0.38 * Math.cos(phase)),
    y: box.y + box.height * (0.5 + 0.38 * Math.sin(phase)),
  })
  const across = () => ({
    x: VIEW.width * (0.5 + 0.47 * Math.sin((2 * Math.PI * t) / 2.3)),
    y: VIEW.height * (0.5 + 0.45 * Math.sin((2 * Math.PI * t) / 3.1)),
  })
  const hover = SWEEP_SECONDS * 0.25
  const index = Math.floor((t - SWEEP_SECONDS * 0.4) / hover)
  const piece = pieces[index]
  const box = piece === undefined ? undefined : places[piece]
  if (t < SWEEP_SECONDS * 0.4 || !box) return across()
  return around(box, 2 * Math.PI * (t / 1.2))
}

async function sweepOn(
  page: Page,
  pieces: readonly string[],
): Promise<{ from: number; to: number }> {
  const places = await boxes(page, pieces)
  const from = await now(page)
  const started = Date.now()
  for (let step = 0; step < SWEEP_SECONDS * POINTER_HZ; step++) {
    const point = sweepPointer(step / POINTER_HZ, places, pieces)
    await page.mouse.move(point.x, point.y)
    const due = started + ((step + 1) * 1000) / POINTER_HZ
    const wait = due - Date.now()
    if (wait > 0) await page.waitForTimeout(wait)
  }
  return { from, to: await now(page) }
}

async function sweep(browser: Browser, ratio: number, url: string, pieces: readonly string[]) {
  const { context, page } = await opened(browser, ratio, url)
  await bringAllIntoView(page, pieces)
  await drawn(page, pieces)
  await page.waitForTimeout(SETTLE_MS)
  const { from, to } = await sweepOn(page, pieces)
  const record = await readProbe(page)
  await context.close()
  const frames = record.frames.filter((time) => time >= from && time <= to)
  const gaps = frames.slice(1).map((time, at) => time - (frames[at] ?? time))
  const long = longFramesBetween(record, from, to)
  const values: Record<string, number> = {
    'frame median ms': quantile(gaps, 0.5),
    'frame p95 ms': quantile(gaps, 0.95),
    'frame worst ms': Math.max(...gaps),
    'long frames': long.count,
    'timer resolution ms': record.resolution,
  }
  for (const piece of pieces) {
    const redraws = record.redraws.filter((r) => r.piece === piece && r.at >= from && r.at <= to)
    values[`${piece} redraws`] = redraws.length
    values[`${piece} repeated inputs`] = redraws.filter((r) => r.repeat).length
    const mean = (of: (redraw: Redraw) => number) =>
      redraws.reduce((sum, redraw) => sum + of(redraw), 0) / redraws.length
    values[`${piece} shading ms mean`] = mean((r) => r.issue)
    values[`${piece} copy ms mean`] = mean((r) => r.copy)
    values[`${piece} shading ms median`] = quantile(
      redraws.map((r) => r.issue),
      0.5,
    )
    values[`${piece} copy ms median`] = quantile(
      redraws.map((r) => r.copy),
      0.5,
    )
    values[`${piece} copy ms p95`] = quantile(
      redraws.map((r) => r.copy),
      0.95,
    )
    values[`${piece} main thread ms per redraw p95`] = quantile(
      redraws.map((r) => r.issue + r.copy),
      0.95,
    )
    values[`${piece} gpu ms median`] = quantile(
      redraws.map((r) => r.gpu),
      0.5,
    )
  }
  return { renderer: record.renderer, values }
}

async function idle(browser: Browser, ratio: number, url: string, pieces: readonly string[]) {
  const values: Record<string, number> = {}
  const moving = await opened(browser, ratio, url)
  await bringAllIntoView(moving.page, pieces)
  await drawn(moving.page, pieces)
  await moving.page.waitForTimeout(SETTLE_MS)
  const { to } = await sweepOn(moving.page, pieces)
  await moving.page.waitForTimeout(REST_MS)
  const rested = await readProbe(moving.page)
  for (const piece of pieces) {
    const after = rested.redraws.filter((r) => r.piece === piece && r.at > to)
    values[`${piece} tail ms`] = Math.max(0, ...after.map((r) => r.at - to))
    values[`${piece} draws once settled`] = after.filter((r) => r.at > to + SETTLED_TAIL_MS).length
  }
  await moving.page.evaluate(() => window.scrollTo(0, 0))
  await moving.page.waitForTimeout(SETTLE_MS)
  const hidden = await now(moving.page)
  for (let step = 0; step < 2 * POINTER_HZ; step++) {
    await moving.page.mouse.move(40 + step * 8, 200 + (step % 30) * 10)
  }
  await moving.page.waitForTimeout(SETTLE_MS)
  const offScreen = await readProbe(moving.page)
  for (const piece of pieces) {
    values[`${piece} draws off screen`] = offScreen.redraws.filter(
      (r) => r.piece === piece && r.at > hidden,
    ).length
  }
  await moving.context.close()

  const still = await opened(browser, ratio, url, { reducedMotion: 'reduce' })
  await bringAllIntoView(still.page, pieces)
  await drawn(still.page, pieces)
  await still.page.waitForTimeout(SETTLE_MS)
  const places = await boxes(still.page, pieces)
  for (const piece of pieces) {
    const box = places[piece]
    if (!box) continue
    await still.page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2, { steps: 10 })
    await still.page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8, { steps: 10 })
  }
  await still.page.mouse.wheel(0, 40)
  await still.page.waitForTimeout(SETTLE_MS)
  const reduced = await readProbe(still.page)
  await still.context.close()
  for (const piece of pieces) {
    values[`${piece} draws under reduced motion`] = reduced.redraws.filter(
      (r) => r.piece === piece,
    ).length
  }
  return { renderer: rested.renderer, values }
}

type Measure = (
  browser: Browser,
  ratio: number,
  url: string,
  pieces: readonly string[],
) => Promise<{ renderer: string; values: Record<string, number> }>

const TIMED: Record<'appear' | 'sweep' | 'idle', Measure> = { appear, sweep, idle }

async function timed(mode: 'appear' | 'sweep' | 'idle'): Promise<Run[]> {
  const url = new URL(option('path', '/fr/espece/humain'), option('base', 'http://localhost:4322'))
  const pieces = option('pieces', 'arms,seal').split(',')
  const runs = Number(option('runs', '5'))
  const headless = process.argv.includes('--headless')
  const results: Run[] = []
  for (const engine of enginesOf(option('engines', 'firefox,chromium,webkit'))) {
    const browser = await ENGINES[engine](headless)
    try {
      for (const ratio of option('ratios', '1,2').split(',').map(Number)) {
        for (let run = 1; run <= runs; run++) {
          const measured = await TIMED[mode](browser, ratio, url.href, pieces)
          results.push({ engine, ratio, run, ...measured })
          process.stdout.write('.')
        }
      }
    } finally {
      await browser.close()
    }
  }
  process.stdout.write('\n')
  return results
}

function table(results: readonly Run[]): void {
  const cases = [...new Set(results.map((run) => `${run.engine} ${run.ratio}`))]
  for (const name of cases) {
    const runs = results.filter((run) => `${run.engine} ${run.ratio}` === name)
    console.log(
      `\n${name.replace(' ', ', ratio ')} (${runs.length} runs, ${runs[0]?.renderer ?? ''})`,
    )
    for (const key of Object.keys(runs[0]?.values ?? {})) {
      console.log(
        `  ${key}: ${spread(
          runs.map((run) => run.values[key] ?? Number.NaN),
          2,
        )}`,
      )
    }
  }
}

function mipBytes(width: number, height: number): number {
  let total = 0
  for (let level = 0; ; level++) {
    const w = Math.max(1, width >> level)
    const h = Math.max(1, height >> level)
    total += w * h * 4
    if (w === 1 && h === 1) return total
  }
}

async function bytes(): Promise<void> {
  const dist = resolve(option('dist', 'dist'))
  const corpus = await readCorpus(root, 'fr')
  const emblems = corpus.species.flatMap((species) =>
    species.subspecies.flatMap((sub) =>
      sub.heraldry?.kind === 'seal' ? [sub.heraldry.emblem] : [],
    ),
  )
  const maps = [
    ...ARMS_COMPOSITIONS.flatMap((composition) => {
      const files = armsFiles(composition.file)
      return [files.colour, files.relief, files.finish].map((file) => resolve(ARMS_DIR, file))
    }),
    ...emblems.flatMap((emblem) => {
      const files = sealFiles(emblem)
      return [files.colour, files.relief, files.finish].map((file) => resolve(SEALS_DIR, file))
    }),
  ]
  console.log('maps: file, bytes, texture memory with mips')
  for (const file of maps) {
    const { width = 0, height = 0 } = await sharp(file).metadata()
    console.log(
      `  ${file.split('/').pop()}: ${(await stat(file)).size}, ${mipBytes(width, height)}`,
    )
  }
  const room = ENVIRONMENT.levels.reduce((sum, level) => sum + level.width * level.height * 4, 0)
  console.log(`  room levels: texture memory ${room}`)
  console.log('chunks: file, bytes, gzip -9')
  for (const file of await readdir(resolve(dist, '_astro'))) {
    if (!/^(?:seal|arms|baked-relief|studio)\.[^.]+\.js$/.test(file)) continue
    const body = await readFile(resolve(dist, '_astro', file))
    console.log(`  ${file}: ${body.length}, ${gzipSync(body, { level: 9 }).length}`)
  }
  const browser = await chromium.launch()
  try {
    const url = new URL(
      option('path', '/fr/espece/humain'),
      option('base', 'http://localhost:4322'),
    )
    console.log('stills each size picks: size, ratio, piece, file, bytes')
    for (const [width, height] of SIZES) {
      for (const ratio of [1, 2]) {
        const page = await browser.newPage({
          viewport: { width, height },
          deviceScaleFactor: ratio,
        })
        await page.goto(url.href, { waitUntil: 'load' })
        const picks = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLImageElement>('[data-drape] img')].map((img) => ({
            piece: img.parentElement?.getAttribute('data-drape') ?? '',
            src: new URL(img.currentSrc).pathname,
          })),
        )
        const pieces = option('pieces', 'arms,seal').split(',')
        for (const pick of picks.filter((p) => pieces.includes(p.piece))) {
          const size = (await stat(resolve(dist, `.${pick.src}`))).size
          console.log(
            `  ${width}x${height}, ${ratio}, ${pick.piece}, ${pick.src.split('/').pop()}, ${size}`,
          )
        }
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }
}

type Pose = { name: string; eye: { x: number; y: number } | undefined; lean: Lean }

function poses(): Pose[] {
  const far = (x: number, y: number) => aimAt({ left: 0, top: 0, width: 1, height: 1 }, { x, y })
  const upright = { x: 0, y: 0 }
  return [
    { name: 'rest', eye: undefined, lean: upright },
    { name: 'far-top-left', eye: far(-1e3, -1e3), lean: upright },
    { name: 'far-bottom-right', eye: far(1e3, 1e3), lean: upright },
    { name: 'leaned', eye: undefined, lean: { x: FULLEST_LEAN, y: FULLEST_LEAN } },
    { name: 'leaned-back', eye: undefined, lean: { x: -FULLEST_LEAN, y: -FULLEST_LEAN } },
  ]
}

async function shaderScenes(): Promise<
  { name: string; dir: string; scene: StillScene; aspect: number }[]
> {
  const corpus = await readCorpus(root, 'fr')
  const seals = corpus.species.flatMap((species) =>
    species.subspecies.flatMap((sub) => (sub.heraldry?.kind === 'seal' ? [sub.heraldry] : [])),
  )
  return [
    ...(await Promise.all(
      ARMS_COMPOSITIONS.map(async (composition) => ({
        name: composition.file.replace(/\.svg$/, ''),
        dir: ARMS_DIR,
        scene: await armsStillScene(composition.file),
        aspect: ARMS_SIZE.height / ARMS_SIZE.width,
      })),
    )),
    ...(await Promise.all(
      seals.map(async (seal) => ({
        name: seal.emblem.replace(/\.svg$/, ''),
        dir: SEALS_DIR,
        scene: await sealStillScene(seal.emblem, seal.wax, COLUMN_CAP_PX),
        aspect: 1,
      })),
    )),
  ]
}

async function raw(png: Buffer): Promise<Buffer> {
  return sharp(png).ensureAlpha().raw().toBuffer()
}

async function shader(): Promise<boolean> {
  const out = resolve(option('out'))
  const against = process.argv.some((entry) => entry.startsWith('--against='))
    ? resolve(option('against'))
    : undefined
  await mkdir(out, { recursive: true })
  let differs = false
  for (const { name, dir, scene, aspect } of await shaderScenes()) {
    const box = { width: COLUMN_CAP_PX, height: Math.round(COLUMN_CAP_PX * aspect) }
    const margin = leanMargin(box, FULLEST_LEAN, scene.lean)
    const size = {
      width: Math.round((box.width + 2 * margin) * SHADER_DENSITY),
      height: Math.round((box.height + 2 * margin) * SHADER_DENSITY),
    }
    for (const pose of poses()) {
      const png = await bakeStill(
        { ...scene, size, eye: pose.eye ?? scene.eye, leaned: { box, margin, lean: pose.lean } },
        dir,
      )
      const file = `${name}-${pose.name}.png`
      await writeFile(resolve(out, file), png)
      if (!against) {
        console.log(`${file}: ${size.width}x${size.height} captured`)
        continue
      }
      const [now, before] = await Promise.all([
        raw(png),
        readFile(resolve(against, file)).then(raw),
      ])
      let values = 0
      let most = 0
      for (let at = 0; at < now.length; at++) {
        const delta = Math.abs((now[at] ?? 0) - (before[at] ?? 0))
        if (delta > 0) values += 1
        most = Math.max(most, delta)
      }
      differs ||= values > 0 || now.length !== before.length
      console.log(`${file}: ${values} of ${now.length} values differ, most by ${most}`)
    }
  }
  return differs
}

async function canvasPixels(page: Page, piece: string): Promise<number[]> {
  return page.locator(`[data-drape="${piece}"]`).evaluate((holder) => {
    const canvas = holder.querySelector('canvas')
    if (!canvas) throw new Error('the piece has no canvas')
    const scratch = document.createElement('canvas')
    scratch.width = canvas.width
    scratch.height = canvas.height
    const context = scratch.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('no 2D context')
    context.drawImage(canvas, 0, 0)
    return [...context.getImageData(0, 0, canvas.width, canvas.height).data]
  })
}

function luminanceOf(pixels: readonly number[]): {
  mean: number
  p10: number
  p50: number
  p90: number
} {
  const values: number[] = []
  for (let at = 0; at < pixels.length; at += 4) {
    if ((pixels[at + 3] ?? 0) < 255) continue
    values.push(
      0.2126 * (pixels[at] ?? 0) + 0.7152 * (pixels[at + 1] ?? 0) + 0.0722 * (pixels[at + 2] ?? 0),
    )
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return {
    mean,
    p10: quantile(values, 0.1),
    p50: quantile(values, 0.5),
    p90: quantile(values, 0.9),
  }
}

async function light(): Promise<void> {
  const url = new URL(option('path', '/fr/espece/humain'), option('base', 'http://localhost:4322'))
  const pieces = option('pieces', 'arms,seal').split(',')
  const browser = await ENGINES.chromium(process.argv.includes('--headless'))
  try {
    for (const piece of pieces) {
      const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2 })
      await context.addInitScript(probe, BUILD_LEAD)
      const page = reportErrors(await context.newPage())
      await page.goto(url.href, { waitUntil: 'load' })
      await page.locator(`[data-drape="${piece}"]`).evaluate((holder) => {
        const box = holder.getBoundingClientRect()
        window.scrollTo(0, box.top + window.scrollY + box.height / 2 - window.innerHeight / 2)
      })
      await drawn(page, [piece])
      await page.waitForTimeout(SETTLE_MS)
      const rest = luminanceOf(await canvasPixels(page, piece))
      const box = (await boxes(page, [piece]))[piece]
      if (!box) throw new Error(`the page shows no ${piece}`)
      const centre = box.y + box.height / 2
      await page.mouse.move(1, centre, { steps: 12 })
      await page.waitForTimeout(SETTLE_MS)
      const left = luminanceOf(await canvasPixels(page, piece))
      await page.mouse.move(VIEW.width - 2, centre, { steps: 12 })
      await page.waitForTimeout(SETTLE_MS)
      const right = luminanceOf(await canvasPixels(page, piece))
      const means = [rest.mean, left.mean, right.mean]
      console.log(
        `${piece}: mean ${means.map((mean) => mean.toFixed(1)).join(', ')} (rest, far left, far right); swing ${(Math.max(...means) - Math.min(...means)).toFixed(1)}; 10th, 50th, 90th at rest ${[rest.p10, rest.p50, rest.p90].map((v) => v.toFixed(0)).join(', ')}`,
      )
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

type TwinStep = { name: string; piece: string | undefined; at: { x: number; y: number } }

const TWIN_CLOCK_START = Date.UTC(2026, 0, 1)
const TWIN_PAUSE_AFTER_MS = 120_000

const TWIN_STEPS: readonly TwinStep[] = [
  { name: 'far top left', piece: undefined, at: { x: 0.01, y: 0.02 } },
  { name: 'far bottom right', piece: undefined, at: { x: 0.99, y: 0.98 } },
  { name: 'over the arms', piece: 'arms', at: { x: 0.15, y: 0.2 } },
  { name: 'over the arms, far corner', piece: 'arms', at: { x: 0.95, y: 0.95 } },
  { name: 'over the seal', piece: 'seal', at: { x: 0.1, y: 0.85 } },
  { name: 'left the pieces', piece: undefined, at: { x: 0.5, y: 0.5 } },
]

function framesCompared(
  a: readonly number[],
  b: readonly number[],
): { pixels: number; opaque: number; most: number } {
  const premultiplied = (pixels: readonly number[], at: number, channel: number): number => {
    const alpha = pixels[at + 3] ?? 0
    return channel === 3 ? alpha : Math.round(((pixels[at + channel] ?? 0) * alpha) / 255)
  }
  let pixels = 0
  let opaque = 0
  let most = 0
  for (let at = 0; at < Math.max(a.length, b.length); at += 4) {
    const deltas = [0, 1, 2, 3].map((c) =>
      Math.abs(premultiplied(a, at, c) - premultiplied(b, at, c)),
    )
    const largest = Math.max(...deltas)
    if (largest === 0) continue
    pixels += 1
    if (a[at + 3] === 255 && b[at + 3] === 255) opaque += 1
    most = Math.max(most, largest)
  }
  return { pixels, opaque, most }
}

async function twin(): Promise<boolean> {
  const path = option('path', '/fr/espece/humain')
  const sides = [option('base', 'http://localhost:4322'), option('against')].map(
    (base) => new URL(path, base).href,
  )
  const pieces = option('pieces', 'arms,seal').split(',')
  const headless = process.argv.includes('--headless')
  let differs = false
  for (const engine of enginesOf(option('engines', 'firefox,chromium,webkit'))) {
    const browser = await ENGINES[engine](headless)
    try {
      for (const ratio of option('ratios', '1,2').split(',').map(Number)) {
        const pages: Page[] = []
        const before: number[] = []
        for (const side of sides) {
          const context = await browser.newContext({ viewport: VIEW, deviceScaleFactor: ratio })
          await context.addInitScript(probe, BUILD_LEAD)
          const page = reportErrors(await context.newPage())
          await page.clock.install({ time: TWIN_CLOCK_START })
          await page.goto(side, { waitUntil: 'load' })
          await bringAllIntoView(page, pieces)
          await drawn(page, pieces)
          await page.waitForTimeout(SETTLE_MS)
          await page.clock.pauseAt(TWIN_CLOCK_START + TWIN_PAUSE_AFTER_MS)
          pages.push(page)
          before.push((await readProbe(page)).redraws.length)
        }
        const [first] = pages
        if (!first) throw new Error('the twin opened no page')
        const places = await boxes(first, pieces)
        const differing: Record<string, number> = Object.fromEntries(pieces.map((p) => [p, 0]))
        const most: Record<string, number> = Object.fromEntries(pieces.map((p) => [p, 0]))
        const opaque: Record<string, number> = Object.fromEntries(pieces.map((p) => [p, 0]))
        for (const step of TWIN_STEPS) {
          const box = step.piece ? places[step.piece] : undefined
          const point = box
            ? { x: box.x + box.width * step.at.x, y: box.y + box.height * step.at.y }
            : { x: VIEW.width * step.at.x, y: VIEW.height * step.at.y }
          for (const ms of [80, 2000]) {
            for (const page of pages) {
              if (ms === 80) await page.mouse.move(point.x, point.y)
              await page.clock.runFor(ms)
            }
            for (const piece of pieces) {
              const [a = [], b = []] = await Promise.all(
                pages.map((page) => canvasPixels(page, piece)),
              )
              const compared = framesCompared(a, b)
              differing[piece] = (differing[piece] ?? 0) + compared.pixels
              opaque[piece] = (opaque[piece] ?? 0) + compared.opaque
              most[piece] = Math.max(most[piece] ?? 0, compared.most)
            }
          }
        }
        const records = await Promise.all(pages.map(readProbe))
        for (const page of pages) await page.context().close()
        for (const piece of pieces) {
          const fed = records.map((record, side) =>
            record.redraws
              .slice(before[side] ?? 0)
              .filter((redraw) => redraw.piece === piece)
              .map((redraw) => redraw.inputs)
              .join('\n'),
          )
          differs ||= (differing[piece] ?? 0) > 0
          console.log(
            `${engine}, ratio ${ratio}, ${piece}: ${differing[piece]} differing pixels (${opaque[piece]} opaque) over ${TWIN_STEPS.length * 2} frames, premultiplied channels move by at most ${most[piece]}; inputs ${fed[0] === fed[1] ? 'identical' : 'differ'}`,
          )
        }
      }
    } finally {
      await browser.close()
    }
  }
  return differs
}

async function main(): Promise<void> {
  const mode = modeOf(option('mode'))
  if (mode === 'bytes') return bytes()
  if (mode === 'light') return light()
  if (mode === 'shader') {
    process.exitCode = (await shader()) ? 1 : 0
    return
  }
  if (mode === 'twin') {
    process.exitCode = (await twin()) ? 1 : 0
    return
  }
  const results = await timed(mode)
  table(results)
  const out = process.argv.some((entry) => entry.startsWith('--out='))
    ? resolve(option('out'))
    : undefined
  if (out) await writeFile(out, JSON.stringify(results, null, 1))
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) {
    console.error(`${error.message}\n\n${USAGE}`)
    process.exitCode = 2
    return
  }
  throw error
})
