import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { type BrowserContext, chromium, type Page } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const TIERS = ['low', 'high', 'ultra'] as const
type Tier = (typeof TIERS)[number]

type Viewport = { width: number; height: number; scale: number; name: string }

type FrameSample = { cpu: number; gpu: number; draws: number; programs: number }

type Probe = { frames: FrameSample[]; messages: { at: number; kind: string }[] }

type StateResult = {
  state: string
  frames: number
  gpuMedian: number
  gpuP95: number
  cpuMedian: number
  drawsMedian: number
  programs: number
}

type RunResult = {
  tier: Tier
  viewport: string
  readyMs: number
  streamedMs: number
  states: StateResult[]
}

function option(name: string, fallback: string): string {
  const prefix = `--${name}=`
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback
}

function viewports(text: string): Viewport[] {
  return text.split(',').map((entry) => {
    const match = /^(\d+)x(\d+)@(\d+(?:\.\d+)?)$/.exec(entry)
    if (!match) throw new Error(`A viewport reads WIDTHxHEIGHT@SCALE, not ${entry}`)
    return {
      width: Number(match[1]),
      height: Number(match[2]),
      scale: Number(match[3]),
      name: entry,
    }
  })
}

function tiers(text: string): Tier[] {
  return text.split(',').map((entry) => {
    const tier = TIERS.find((candidate) => candidate === entry)
    if (!tier) throw new Error(`Unknown tier ${entry}`)
    return tier
  })
}

function instrument(): void {
  const probe: Probe = { frames: [], messages: [] }
  ;(window as unknown as { atlasBench: Probe }).atlasBench = probe
  let context: WebGL2RenderingContext | undefined
  let timer: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null = null
  let draws = 0
  let programs = 0
  const pending: { query: WebGLQuery; sample: FrameSample }[] = []
  const original = HTMLCanvasElement.prototype.getContext
  const countDraws = (gl: WebGL2RenderingContext) => {
    const { drawArrays, drawElements, drawArraysInstanced, drawElementsInstanced } = gl
    gl.drawArrays = (...args: Parameters<typeof drawArrays>) => {
      draws += 1
      drawArrays.apply(gl, args)
    }
    gl.drawElements = (...args: Parameters<typeof drawElements>) => {
      draws += 1
      drawElements.apply(gl, args)
    }
    gl.drawArraysInstanced = (...args: Parameters<typeof drawArraysInstanced>) => {
      draws += 1
      drawArraysInstanced.apply(gl, args)
    }
    gl.drawElementsInstanced = (...args: Parameters<typeof drawElementsInstanced>) => {
      draws += 1
      drawElementsInstanced.apply(gl, args)
    }
  }
  HTMLCanvasElement.prototype.getContext = function getContext(
    this: HTMLCanvasElement,
    ...args: Parameters<HTMLCanvasElement['getContext']>
  ) {
    const result = original.apply(this, args)
    if (
      args[0] === 'webgl2' &&
      result instanceof WebGL2RenderingContext &&
      this.classList.contains('au-atlas__canvas')
    ) {
      context = result
      timer = result.getExtension('EXT_disjoint_timer_query_webgl2')
      countDraws(result)
      const link = result.linkProgram.bind(result)
      result.linkProgram = (program: WebGLProgram) => {
        programs += 1
        link(program)
      }
    }
    return result
  } as typeof original
  const settle = () => {
    const gl = context
    if (!gl || !timer) return
    const disjoint = Boolean(gl.getParameter(timer.GPU_DISJOINT_EXT))
    while (pending.length > 0) {
      const first = pending[0]
      if (!first) break
      if (!gl.getQueryParameter(first.query, gl.QUERY_RESULT_AVAILABLE)) break
      pending.shift()
      const nanoseconds = Number(gl.getQueryParameter(first.query, gl.QUERY_RESULT))
      gl.deleteQuery(first.query)
      first.sample.gpu = disjoint ? Number.NaN : nanoseconds / 1e6
    }
  }
  const request = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = (callback: FrameRequestCallback) =>
    request((now) => {
      settle()
      const gl = context
      draws = 0
      programs = 0
      const query = gl && timer ? gl.createQuery() : null
      if (gl && timer && query) gl.beginQuery(timer.TIME_ELAPSED_EXT, query)
      const started = performance.now()
      callback(now)
      const cpu = performance.now() - started
      if (gl && timer && query) gl.endQuery(timer.TIME_ELAPSED_EXT)
      if (draws === 0 && programs === 0) {
        if (gl && query) gl.deleteQuery(query)
        return
      }
      const sample: FrameSample = { cpu, gpu: Number.NaN, draws, programs }
      probe.frames.push(sample)
      if (query) pending.push({ query, sample })
    })
  const Native = window.Worker
  window.Worker = class extends Native {
    constructor(url: string | URL, options?: WorkerOptions) {
      super(url, options)
      this.addEventListener('message', (event: MessageEvent<unknown>) => {
        const data = event.data
        const kind =
          typeof data === 'object' && data !== null && 'kind' in data ? String(data.kind) : '?'
        probe.messages.push({ at: performance.now(), kind })
      })
    }
  }
}

function quantile(values: number[], q: number): number {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (finite.length === 0) return Number.NaN
  return finite[Math.min(finite.length - 1, Math.floor(q * finite.length))] ?? Number.NaN
}

const round = (value: number) => Math.round(value * 100) / 100

async function measure(page: Page, state: string, windowMs: number): Promise<StateResult> {
  await page.evaluate(() => {
    ;(window as unknown as { atlasBench: Probe }).atlasBench.frames.length = 0
  })
  await page.waitForTimeout(windowMs)
  const frames = await page.evaluate(() =>
    (window as unknown as { atlasBench: Probe }).atlasBench.frames.slice(),
  )
  return {
    state,
    frames: frames.length,
    gpuMedian: round(
      quantile(
        frames.map((frame) => frame.gpu),
        0.5,
      ),
    ),
    gpuP95: round(
      quantile(
        frames.map((frame) => frame.gpu),
        0.95,
      ),
    ),
    cpuMedian: round(
      quantile(
        frames.map((frame) => frame.cpu),
        0.5,
      ),
    ),
    drawsMedian: quantile(
      frames.map((frame) => frame.draws),
      0.5,
    ),
    programs: frames.reduce((sum, frame) => sum + frame.programs, 0),
  }
}

async function press(page: Page, key: string, times = 1): Promise<void> {
  await page.focus('.au-atlas__canvas')
  for (let k = 0; k < times; k++) await page.keyboard.press(key)
}

async function run(
  context: BrowserContext,
  url: string,
  tier: Tier,
  viewport: Viewport,
): Promise<RunResult> {
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  const started = Date.now()
  await page.goto(`${url}/fr/atlas`)
  await page.waitForSelector('[data-atlas-root][data-atlas-state="ready"]', { timeout: 120_000 })
  const readyMs = Date.now() - started
  await page.waitForFunction(
    () =>
      (window as unknown as { atlasBench: Probe }).atlasBench.messages.some(
        (message) => message.kind === 'streamed',
      ),
    undefined,
    { timeout: 120_000 },
  )
  const streamed = await page.evaluate(
    () =>
      (window as unknown as { atlasBench: Probe }).atlasBench.messages.find(
        (message) => message.kind === 'streamed',
      )?.at ?? 0,
  )
  await page.waitForTimeout(2500)
  const windowMs = Number(option('window', '3000'))
  const states: StateResult[] = []
  states.push(await measure(page, 'opening', windowMs))
  await press(page, '1')
  await page.waitForTimeout(2000)
  states.push(await measure(page, 'top', windowMs))
  await press(page, '3')
  await press(page, 'f', 6)
  await page.waitForTimeout(2000)
  states.push(await measure(page, 'free-low', windowMs))
  await page.evaluate(() => {
    window.location.hash = '#g/bastion'
  })
  await page.waitForTimeout(3000)
  states.push(await measure(page, 'close', windowMs))
  await press(page, '2')
  await press(page, '-', 7)
  await page.waitForTimeout(2500)
  states.push(await measure(page, 'far', windowMs))
  await page.close()
  if (errors.length > 0) throw new Error(`${tier} ${viewport.name}: ${errors.join('; ')}`)
  return { tier, viewport: viewport.name, readyMs, streamedMs: Math.round(streamed), states }
}

type Build = { name: string; url: string }

function builds(text: string): Build[] {
  return text.split(',').map((entry) => {
    const [name, url] = entry.includes('=') ? entry.split('=') : ['build', entry]
    if (!name || !url) throw new Error(`A build reads NAME=URL, not ${entry}`)
    return { name, url }
  })
}

const medianOf = (values: number[]) => round(quantile(values, 0.5))

async function main(): Promise<void> {
  const targets = builds(option('url', 'http://localhost:4322'))
  const label = option('label', 'bench')
  const runs = Number(option('runs', '3'))
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=metal'],
  })
  const measured = async (build: Build, tier: Tier, viewport: Viewport): Promise<RunResult> => {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.scale,
    })
    await context.addInitScript(instrument)
    await context.addInitScript((quality: Tier) => {
      window.localStorage.setItem('aubaine.drafts', 'shown')
      window.localStorage.setItem('aubaine.atlas.quality', quality)
      window.localStorage.setItem('aubaine.atlas.settings', JSON.stringify({ quality }))
    }, tier)
    const result = await run(context, build.url, tier, viewport)
    await context.close()
    return result
  }
  const plannedViewports = viewports(option('viewports', '1920x1080@1,2560x1440@1'))
  const plannedTiers = tiers(option('tiers', 'low,high,ultra'))
  const [firstViewport] = plannedViewports
  const [firstTier] = plannedTiers
  const [firstBuild] = targets
  if (firstViewport && firstTier && firstBuild) await measured(firstBuild, firstTier, firstViewport)
  const results: (RunResult & { build: string })[] = []
  for (const viewport of plannedViewports) {
    for (const tier of plannedTiers) {
      for (let attempt = 0; attempt < runs; attempt++) {
        const order = attempt % 2 === 0 ? targets : [...targets].reverse()
        for (const build of order) {
          results.push({ build: build.name, ...(await measured(build, tier, viewport)) })
        }
      }
    }
  }
  await browser.close()
  const out = resolve(root, 'tmp/atlas-bench', `${label}.json`)
  await mkdir(dirname(out), { recursive: true })
  await writeFile(out, `${JSON.stringify(results, null, 2)}\n`)
  const rows = new Map<string, Map<string, StateResult[]>>()
  for (const result of results) {
    for (const state of result.states) {
      const key = `${result.viewport} ${result.tier} ${state.state}`
      const byBuild = rows.get(key) ?? new Map<string, StateResult[]>()
      byBuild.set(result.build, [...(byBuild.get(result.build) ?? []), state])
      rows.set(key, byBuild)
    }
  }
  const names = targets.map((build) => build.name)
  console.log(
    `| viewport tier state | ${names.map((name) => `${name} GPU ms`).join(' | ')} | ${names.map((name) => `${name} draws`).join(' | ')} |`,
  )
  console.log(`| --- |${names.map(() => ' --- |').join('')}${names.map(() => ' --- |').join('')}`)
  for (const [key, byBuild] of rows) {
    const gpu = names.map((name) => medianOf((byBuild.get(name) ?? []).map((s) => s.gpuMedian)))
    const draws = names.map((name) => medianOf((byBuild.get(name) ?? []).map((s) => s.drawsMedian)))
    console.log(`| ${key} | ${gpu.join(' | ')} | ${draws.join(' | ')} |`)
  }
  console.log(`Wrote ${out}`)
}

await main()
