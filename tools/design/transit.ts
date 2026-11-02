import { execFileSync, spawn } from 'node:child_process'
import { mkdir, mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { type Browser, chromium, firefox, type Page, webkit } from 'playwright-core'
import sharp from 'sharp'

type Edge = { from: string; to: string; back: boolean }
type Size = { width: number; height: number }

type Trace = {
  acknowledged: number | undefined
  called: number | undefined
  ready: number | undefined
  finished: number | undefined
  rejected: string | undefined
  emptied: number
  worstFrame: number
  groups: string[]
  travel: string
  namesLeft: number
}

const USAGE = `pnpm design:transit --edges=FROM>TO,... [--themes=dark,light] [--sizes=1512x860,390x844]
  [--browser=chromium|firefox|webkit] [--cold] [--film=DIR] [--flash] [--pops] [--real-firefox] [--base=URL]

Clicks the link to TO on FROM and measures one page change per edge, theme and size, then Back when the
edge is written FROM<TO. Prints one row each: the acknowledgement, the first motion and the end after the
click, the frames where the page is hidden, the worst frame during the motion, how long the leading piece
takes to cross 10 to 90 % of its travel, the transition's groups. --cold disables the HTTP cache. --film
writes a contact sheet of the frames really painted: a screencast on Chromium, a 25 fps recording on Firefox
and WebKit. --flash records every painted frame on Chromium and counts the general and red flashes of WCAG
2.3.1 in any second, in any patch a quarter of a 10 degree field, sliding by a quarter of a patch. --pops
records the same frames and reports any large area that jumps for one to three frames and comes back.
--real-firefox drives the installed Firefox through geckodriver, headless, and prints the frames of the
motion alone: count, median, p95 and worst, three visits per edge. Playwright's Firefox video breaks into
tiles on these pages, so this reading and seeked stills are what Firefox gets.
Default --base=http://localhost:4322

Exit 0 when every row meets the budget; 1 when one does not; 2 on a usage error.`

const BROWSERS = { chromium, firefox, webkit } as const
type BrowserName = keyof typeof BROWSERS
const FILM_COLUMNS = 8
const FILM_FRAMES = 32
const SETTLE_MS = 2200
const HOVER_MS = 450
const AFTER_MS = 1300
const FINISHED_BUDGET_MS = 400
const BOOK_BUDGET_MS = 700
const ACK_BUDGET_MS = 100
const FILM_WIDTH = 300

class UsageError extends Error {}

function option(name: string, fallback?: string): string {
  const prefix = `--${name}=`
  const value = process.argv.find((entry) => entry.startsWith(prefix))?.slice(prefix.length)
  if (value !== undefined) return value
  if (fallback !== undefined) return fallback
  throw new UsageError(`design:transit needs --${name}=...`)
}

function edgesOf(text: string): Edge[] {
  return text.split(',').map((edge) => {
    const back = edge.includes('<')
    const [from, to] = edge.split(back ? '<' : '>')
    if (!from?.startsWith('/') || !to?.startsWith('/')) throw new UsageError(`bad edge ${edge}`)
    return { from, to, back }
  })
}

function sizesOf(text: string): Size[] {
  return text.split(',').map((size) => {
    const [width, height] = size.split('x').map(Number)
    if (!width || !height) throw new UsageError(`bad size ${size}`)
    return { width, height }
  })
}

const SPY = `
  (() => {
    const native = document.startViewTransition?.bind(document)
    if (!native) return
    const lead = (names) =>
      names.find((name) => name === '(au-sheet-card-0)') ?? names.find((name) => name.startsWith('(au-flight-'))
    document.startViewTransition = (update) => {
      const spy = (window.__spy ??= {})
      spy.called = performance.now()
      const transition = native(update)
      transition.ready.then(
        () => {
          spy.ready = performance.now()
          spy.groups = [...new Set(document.documentElement.getAnimations({ subtree: true })
            .map((animation) => animation.effect.pseudoElement)
            .filter((name) => name && /group|image-pair/.test(name))
            .map((name) => name.replace(/::view-transition-(group|image-pair)/, '')))]
          const piece = lead(spy.groups)
          if (!piece) return
          spy.piece = piece
          spy.path = []
          const sample = () => {
            if (spy.finished) return
            const style = getComputedStyle(document.documentElement, '::view-transition-group' + piece)
            if (style.transform !== 'none') {
              const matrix = new DOMMatrixReadOnly(style.transform)
              spy.path.push([performance.now(), matrix.e, matrix.f])
            }
            requestAnimationFrame(sample)
          }
          sample()
        },
        (error) => { spy.rejected = String(error) },
      )
      transition.finished.then(() => { spy.finished = performance.now() })
      return transition
    }
  })()
`

function travelOf(path: readonly (readonly [number, number, number])[]): string {
  const first = path[0]
  const last = path.at(-1)
  if (!first || !last) return '-'
  const span = Math.hypot(last[1] - first[1], last[2] - first[2])
  if (span < 8) return '-'
  const along = path.map(([at, x, y]) => ({
    at,
    share:
      ((x - first[1]) * (last[1] - first[1]) + (y - first[2]) * (last[2] - first[2])) / span ** 2,
  }))
  const from = along.find((point) => point.share >= 0.1)
  const to = along.find((point) => point.share >= 0.9)
  if (!from || !to) return '-'
  const frames = along.filter((point) => point.at >= from.at && point.at <= to.at).length
  return `${Math.round(to.at - from.at)} ms, ${frames} frames`
}

async function arm(page: Page): Promise<void> {
  await page.evaluate(() => {
    const state = window as unknown as { __spy: Record<string, unknown>; __watching?: boolean }
    state.__spy = { start: 0, emptied: 0, worstFrame: 0 }
    const spy = state.__spy
    let last = performance.now()
    let moving = false
    const watch = (now: number) => {
      if (spy['done']) return
      const page = document.querySelector('#swup')
      if (spy['start'] && page && Number(getComputedStyle(page).opacity) < 0.98) {
        spy['emptied'] = Number(spy['emptied']) + 1
      }
      if (moving && spy['ready'] && !spy['finished']) {
        spy['worstFrame'] = Math.max(Number(spy['worstFrame']), now - last)
      }
      moving = Boolean(spy['ready'])
      last = now
      requestAnimationFrame(watch)
    }
    requestAnimationFrame(watch)
    const seen = new MutationObserver(() => {
      if (spy['acknowledged'] === undefined && document.querySelector('a[data-pressed]')) {
        spy['acknowledged'] = performance.now()
      }
    })
    seen.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-pressed'],
    })
    window.addEventListener(
      'click',
      () => {
        spy['start'] = performance.now()
      },
      { capture: true, once: true },
    )
  })
}

async function traced(page: Page): Promise<Trace> {
  const { path, ...trace } = await page.evaluate(() => {
    const spy = (window as unknown as { __spy: Record<string, unknown> }).__spy
    spy['done'] = true
    const start = Number(spy['start'])
    const since = (key: string): number | undefined =>
      typeof spy[key] === 'number' ? Math.round(Number(spy[key]) - start) : undefined
    return {
      acknowledged: since('acknowledged'),
      called: since('called'),
      ready: since('ready'),
      finished: since('finished'),
      rejected: typeof spy['rejected'] === 'string' ? spy['rejected'] : undefined,
      emptied: Number(spy['emptied']),
      worstFrame: Math.round(Number(spy['worstFrame'])),
      groups: Array.isArray(spy['groups']) ? (spy['groups'] as string[]) : [],
      path: Array.isArray(spy['path']) ? (spy['path'] as [number, number, number][]) : [],
      namesLeft: [...document.querySelectorAll<HTMLElement>('*')].filter(
        (element) => element.style.getPropertyValue('view-transition-name') !== '',
      ).length,
    }
  })
  return { ...trace, travel: travelOf(path) }
}

async function contactSheet(frames: readonly Buffer[], file: string): Promise<void> {
  const first = frames[0]
  if (!first) return
  const changed = frames.filter(
    (frame, index) => !frame.equals(frames[index - 1] ?? Buffer.alloc(0)),
  )
  const every = Math.max(1, Math.floor(changed.length / FILM_FRAMES))
  const chosen = changed.filter((_, index) => index % every === 0).slice(0, FILM_FRAMES)
  const metadata = await sharp(first).metadata()
  const height = Math.round((FILM_WIDTH * (metadata.height ?? 1)) / (metadata.width ?? 1))
  const rows = Math.ceil(chosen.length / FILM_COLUMNS)
  const tiles = await Promise.all(
    chosen.map(async (frame, index) => ({
      input: await sharp(frame).resize(FILM_WIDTH, height).toBuffer(),
      left: (index % FILM_COLUMNS) * FILM_WIDTH,
      top: Math.floor(index / FILM_COLUMNS) * height,
    })),
  )
  await sharp({
    create: {
      width: FILM_WIDTH * FILM_COLUMNS,
      height: height * rows,
      channels: 3,
      background: '#000',
    },
  })
    .composite(tiles)
    .png()
    .toFile(file)
}

async function framesOfVideo(video: string): Promise<Buffer[]> {
  const directory = await mkdtemp(join(tmpdir(), 'aubaine-transit-'))
  try {
    execFileSync('ffmpeg', [
      '-v',
      'error',
      '-i',
      video,
      '-vf',
      'fps=25',
      join(directory, '%04d.png'),
    ])
    const names = (await readdir(directory)).sort()
    return await Promise.all(names.map((name) => sharp(join(directory, name)).png().toBuffer()))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

const GRID_WIDTH = 64
const FIELD_QUARTER = { width: 170, height: 128 }
const FLASH_LIMIT = 3
const FLASH_STEP = 0.1
const DARKER_LIMIT = 0.8

type Frame = { at: number; data: Buffer }

function linear(channel: number): number {
  const value = channel / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function opposingChanges(series: readonly { at: number; value: number }[]): number[] {
  const changes: number[] = []
  let anchor = series[0]?.value ?? 0
  let direction = 0
  for (const { at, value } of series) {
    const delta = value - anchor
    if (Math.abs(delta) >= FLASH_STEP && Math.min(value, anchor) < DARKER_LIMIT) {
      const now = Math.sign(delta)
      if (now !== direction) {
        if (direction !== 0) changes.push(at)
        direction = now
      }
      anchor = value
    } else if (direction !== 0 && Math.sign(delta) === direction) {
      anchor = value
    }
  }
  return changes
}

function worstInASecond(changes: readonly number[]): number {
  let worst = 0
  for (const start of changes) {
    const within = changes.filter((at) => at >= start && at < start + 1000).length
    worst = Math.max(worst, Math.ceil(within / 2))
  }
  return worst
}

async function flashesIn(frames: readonly Frame[], viewport: Size): Promise<number> {
  const rows = Math.round((GRID_WIDTH * viewport.height) / viewport.width)
  const cell = viewport.width / GRID_WIDTH
  const across = Math.max(1, Math.round(FIELD_QUARTER.width / cell))
  const down = Math.max(1, Math.round(FIELD_QUARTER.height / cell))
  const decoded = await Promise.all(
    frames.map(async ({ at, data }) => ({
      at,
      pixels: await sharp(data)
        .resize(GRID_WIDTH, rows, { fit: 'fill' })
        .removeAlpha()
        .raw()
        .toBuffer(),
    })),
  )
  const slideDown = Math.max(1, Math.round(down / 4))
  const slideAcross = Math.max(1, Math.round(across / 4))
  let worst = 0
  for (let top = 0; top + down <= rows; top += slideDown) {
    for (let left = 0; left + across <= GRID_WIDTH; left += slideAcross) {
      const general: { at: number; value: number }[] = []
      const red: { at: number; value: number }[] = []
      for (const { at, pixels } of decoded) {
        let luminance = 0
        let saturated = 0
        for (let y = top; y < top + down; y++) {
          for (let x = left; x < left + across; x++) {
            const index = (y * GRID_WIDTH + x) * 3
            const r = pixels[index] ?? 0
            const g = pixels[index + 1] ?? 0
            const b = pixels[index + 2] ?? 0
            luminance += 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
            if (r / Math.max(1, r + g + b) >= 0.8) {
              saturated += Math.max(0, (linear(r) - linear(g) - linear(b)) * 320)
            }
          }
        }
        general.push({ at, value: luminance / (across * down) })
        red.push({ at, value: saturated / (across * down) / 200 })
      }
      worst = Math.max(
        worst,
        worstInASecond(opposingChanges(general)),
        worstInASecond(opposingChanges(red)),
      )
    }
  }
  return worst
}

const POP_GRID = { columns: 24, rows: 14 }
const POP_JUMP = 18
const POP_RETURN = 7
const POP_LONGEST = 3
const POP_LEAST_CELLS = 14

type Pop = { at: number; cells: number; jump: number }

async function popsIn(frames: readonly Frame[], clickAt: number): Promise<Pop[]> {
  const { columns, rows } = POP_GRID
  const grey = await Promise.all(
    frames.map((frame) =>
      sharp(frame.data).resize(columns, rows, { fit: 'fill' }).greyscale().raw().toBuffer(),
    ),
  )
  const pops: Pop[] = []
  for (let index = 1; index < grey.length - 1; index++) {
    for (let span = 1; span <= POP_LONGEST && index + span < grey.length; span++) {
      let cells = 0
      let strongest = 0
      for (let cell = 0; cell < columns * rows; cell++) {
        const before = grey[index - 1]?.[cell] ?? 0
        const during = grey[index]?.[cell] ?? 0
        const after = grey[index + span]?.[cell] ?? 0
        if (Math.abs(during - before) < POP_JUMP || Math.abs(after - before) > POP_RETURN) continue
        cells++
        strongest = Math.max(strongest, Math.abs(during - before))
      }
      if (cells < POP_LEAST_CELLS) continue
      pops.push({ at: Math.round((frames[index]?.at ?? 0) - clickAt), cells, jump: strongest })
      break
    }
  }
  return pops
}

function describePops(pops: readonly Pop[]): string {
  if (pops.length === 0) return '0'
  return pops.map((pop) => `${pop.at} ms (${pop.cells} patches)`).join(', ')
}

function budgetOf(groups: readonly string[]): number {
  if (groups.some((group) => /au-book|au-sheet|au-deal|au-filter/.test(group)))
    return BOOK_BUDGET_MS
  return FINISHED_BUDGET_MS
}

type Run = {
  browser: Browser
  base: string
  edge: Edge
  theme: 'dark' | 'light'
  size: Size
  cold: boolean
  filmDirectory: string | undefined
  flash: boolean
  pops: boolean
}

async function rowOf(run: Run): Promise<boolean> {
  const { browser, base, edge, theme, size, cold, filmDirectory, flash, pops } = run
  const chromiumEngine = browser.browserType().name() === 'chromium'
  const videoDirectory =
    filmDirectory && !chromiumEngine ? await mkdtemp(join(tmpdir(), 'aubaine-video-')) : undefined
  const context = await browser.newContext({
    viewport: size,
    colorScheme: theme,
    bypassCSP: true,
    ...(videoDirectory ? { recordVideo: { dir: videoDirectory, size } } : {}),
  })
  await context.addInitScript(SPY)
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  if (cold && chromiumEngine) {
    const session = await context.newCDPSession(page)
    await session.send('Network.setCacheDisabled', { cacheDisabled: true })
  }
  await page.goto(base + edge.from)
  await page.waitForFunction(() => 'swup' in window)
  await page.waitForTimeout(SETTLE_MS)
  const link = page.locator(`a[href="${edge.to}"]:visible`).first()
  await link.hover({ trial: false, timeout: 4000 })
  await page.waitForTimeout(cold ? 0 : HOVER_MS)
  const frames: Frame[] = []
  if ((flash || pops || filmDirectory) && chromiumEngine) {
    const session = await context.newCDPSession(page)
    session.on('Page.screencastFrame', (frame) => {
      frames.push({ at: frame.metadata.timestamp ?? 0, data: Buffer.from(frame.data, 'base64') })
      void session
        .send('Page.screencastFrameAck', { sessionId: frame.sessionId })
        .catch(() => undefined)
    })
    await session.send('Page.startScreencast', { format: 'png', everyNthFrame: 1, maxWidth: 480 })
  }
  await arm(page)
  const label = `${edge.from} ${edge.back ? '<' : '>'} ${edge.to}`
  const name = `${label.replace(/\W+/g, '-')}-${edge.back ? 'back-' : ''}${theme}-${size.width}`
  if (edge.back) {
    await link.click()
    await page.waitForURL(`**${edge.to}`)
    await page.waitForTimeout(AFTER_MS)
    await page.evaluate(() => {
      const spy = (window as unknown as { __spy: Record<string, unknown> }).__spy
      for (const key of ['acknowledged', 'called', 'ready', 'finished', 'rejected', 'groups']) {
        delete spy[key]
      }
    })
    frames.length = 0
    await page.evaluate(() => {
      const spy = (window as unknown as { __spy: Record<string, unknown> }).__spy
      spy['start'] = performance.now()
      spy['emptied'] = 0
      spy['worstFrame'] = 0
      window.history.back()
    })
  } else {
    await link.click({ noWaitAfter: true })
  }
  await page.waitForTimeout(AFTER_MS)
  const trace = await traced(page)
  const popped = pops
    ? await popsIn(
        frames.map((frame) => ({ ...frame, at: frame.at * 1000 })),
        (frames[0]?.at ?? 0) * 1000,
      )
    : []
  const flashes = flash
    ? await flashesIn(
        frames.map((frame) => ({ ...frame, at: frame.at * 1000 })),
        size,
      )
    : undefined
  const good =
    trace.rejected === undefined &&
    trace.emptied === 0 &&
    (flashes ?? 0) <= FLASH_LIMIT &&
    popped.length === 0 &&
    trace.namesLeft === 0 &&
    errors.length === 0 &&
    trace.finished !== undefined &&
    trace.finished <= budgetOf(trace.groups) &&
    (edge.back || (trace.acknowledged ?? Number.POSITIVE_INFINITY) <= ACK_BUDGET_MS)
  console.log(
    `| ${label} | ${theme} | ${size.width}x${size.height} | ${trace.acknowledged ?? '-'} | ${trace.ready ?? '-'} | ${trace.finished ?? '-'} | ${trace.emptied} | ${trace.worstFrame} | ${trace.travel} | ${flashes ?? '-'} | ${pops ? describePops(popped) : '-'} | ${trace.groups.join(' ')} | ${[trace.rejected, trace.namesLeft ? `${trace.namesLeft} names left` : '', ...errors].filter(Boolean).join('; ') || (good ? 'ok' : 'over budget')} |`,
  )
  const video = page.video()
  await context.close()
  if (filmDirectory) {
    const painted = video
      ? await framesOfVideo(await video.path())
      : frames.map((frame) => frame.data)
    await contactSheet(painted, resolve(filmDirectory, `${name}.png`))
  }
  if (videoDirectory) await rm(videoDirectory, { recursive: true, force: true })
  return good
}

function pause(milliseconds: number): Promise<void> {
  return new Promise((done) => setTimeout(done, milliseconds))
}

const GECKO_PORT = 4471
const GECKO_START_MS = 800
const GECKO_SETTLE_MS = 1300
const REAL_VISITS = 3
const REAL_WINDOW = { width: 1512, height: 940 }

const REAL_FRAMES = `
  const done = arguments[arguments.length - 1]
  const [to, back] = arguments
  const native = document.startViewTransition.bind(document)
  const gaps = []
  let measuring = false
  let last = 0
  const tick = (now) => {
    if (!measuring) return
    gaps.push(now - last)
    last = now
    requestAnimationFrame(tick)
  }
  document.startViewTransition = (update) => {
    const transition = native(update)
    transition.ready.then(() => {
      measuring = true
      last = performance.now()
      requestAnimationFrame(tick)
    }, () => undefined)
    transition.finished.then(() => {
      measuring = false
      const sorted = [...gaps].sort((a, b) => a - b)
      done([
        sorted.length,
        Math.round(sorted[sorted.length >> 1]),
        Math.round(sorted[Math.floor(sorted.length * 0.95)]),
        Math.round(sorted.at(-1)),
      ])
    })
    return transition
  }
  if (back) history.back()
  else [...document.querySelectorAll('a[href="' + to + '"]')].find((link) => link.checkVisibility()).click()
`

async function realFirefoxRows(edges: readonly Edge[], base: string): Promise<void> {
  const driver = spawn('geckodriver', ['-p', String(GECKO_PORT)], { stdio: 'ignore' })
  await pause(GECKO_START_MS)
  const call = async (method: string, path: string, body?: unknown): Promise<unknown> => {
    const response = await fetch(`http://127.0.0.1:${GECKO_PORT}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const { value } = (await response.json()) as { value: unknown }
    return value
  }
  try {
    const { sessionId } = (await call('POST', '/session', {
      capabilities: {
        alwaysMatch: { browserName: 'firefox', 'moz:firefoxOptions': { args: ['-headless'] } },
      },
    })) as { sessionId: string }
    const session = `/session/${sessionId}`
    await call('POST', `${session}/window/rect`, REAL_WINDOW)
    await call('POST', `${session}/timeouts`, { script: 15000 })
    const visit = async (path: string): Promise<void> => {
      await call('POST', `${session}/url`, { url: base + path })
      await pause(GECKO_SETTLE_MS)
    }
    const frames = (to: string, back: boolean): Promise<unknown> =>
      call('POST', `${session}/execute/async`, { script: REAL_FRAMES, args: [to, back] })
    console.log('| edge | frames / median / p95 / worst, per visit |\n| --- | --- |')
    for (const edge of edges) {
      const rows: unknown[] = []
      for (let run = 0; run < REAL_VISITS; run++) {
        await visit(edge.from)
        const going = await frames(edge.to, false)
        if (edge.back) {
          await pause(GECKO_SETTLE_MS)
          rows.push(await frames(edge.from, true))
        } else {
          rows.push(going)
        }
      }
      const label = `${edge.from} ${edge.back ? '<' : '>'} ${edge.to}`
      console.log(
        `| ${label} | ${rows.map((row) => String(row).replaceAll(',', ' / ')).join('; ')} |`,
      )
    }
    await call('DELETE', session)
  } finally {
    driver.kill()
  }
}

async function main(): Promise<void> {
  const edges = edgesOf(option('edges'))
  if (process.argv.includes('--real-firefox')) {
    await realFirefoxRows(edges, option('base', 'http://localhost:4322'))
    return
  }
  const browserName = option('browser', 'chromium')
  if (!(browserName in BROWSERS)) throw new UsageError(`unknown browser ${browserName}`)
  const engine = BROWSERS[browserName as BrowserName]
  const themes = option('themes', 'dark').split(',') as ('dark' | 'light')[]
  const sizes = sizesOf(option('sizes', '1512x860'))
  const base = option('base', 'http://localhost:4322')
  const cold = process.argv.includes('--cold')
  const flash = process.argv.includes('--flash')
  const pops = process.argv.includes('--pops')
  const filmOption = process.argv.find((entry) => entry.startsWith('--film='))?.slice(7)
  const filmDirectory = filmOption ? resolve(filmOption) : undefined
  if (filmDirectory) await mkdir(filmDirectory, { recursive: true })
  const browser = await engine.launch(
    engine === chromium ? { channel: 'chromium', args: ['--use-angle=metal', '--enable-gpu'] } : {},
  )
  console.log(
    '| edge | theme | size | pressed ms | first motion ms | finished ms | hidden frames | worst frame in motion ms | lead piece 10 to 90 % | flashes a second | stray frames | groups | verdict |',
  )
  console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
  let bad = 0
  try {
    for (const edge of edges) {
      for (const theme of themes) {
        for (const size of sizes) {
          const good = await rowOf({
            browser,
            base,
            edge,
            theme,
            size,
            cold,
            filmDirectory,
            flash,
            pops,
          })
          if (!good) bad++
        }
      }
    }
  } finally {
    await browser.close()
  }
  if (bad > 0) {
    console.log(`\n${bad} rows over budget.`)
    process.exitCode = 1
  }
}

if (process.argv.includes('--help')) {
  console.log(USAGE)
} else {
  try {
    await main()
  } catch (error) {
    if (!(error instanceof UsageError)) throw error
    console.error(`${error.message}\n\n${USAGE}`)
    process.exitCode = 2
  }
}
