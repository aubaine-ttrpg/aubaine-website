import { chromium, errors, type Page } from 'playwright-core'

type Size = { width: number; height: number; name: string }

type Check = { piece: string; frame: string }

type Reading = { least: number | null; problems: string[] }

type Inspection = { sideways: number; readings: Reading[] }

const SCREEN = 'screen'
const SETTLE_MS = 350
const POINT_TIMEOUT_MS = 5000
const SEVEN_SIZES = '1512x860,1440x789,1366x657,1280x610,1024x768,820x1180,390x844'
const USAGE = `pnpm design:audit --pages=PATH,... --check=PIECE@FRAME [--check=...] [--sweep=SELECTOR]
  [--sizes=WIDTHxHEIGHT,...] [--margin=PX] [--base=URL]

Loads each page at each size with reduced motion and measures, for every check, how far inside its
frame every visible piece sits, in px, from its four transformed corners (an image, a form control or
an SVG element from its box), and prints the least. FRAME is a selector the piece sits in, or ${SCREEN}
for the viewport's sides. --sweep scrolls each matching element into view in turn, points its centre
and measures again. Defaults: --sizes=${SEVEN_SIZES} --margin=0 --base=http://localhost:4322

Exit 0 when nothing is flagged; 1 when a piece sits less than the margin inside its frame, has no FRAME
around it, leaves the screen sideways, sits in a frame with no area, a PIECE, FRAME or --sweep selector
matches nothing, a swept element cannot be pointed, or the page scrolls sideways; 2 on a usage error.`

class UsageError extends Error {}

function option(name: string, fallback?: string): string {
  const prefix = `--${name}=`
  const value = process.argv.find((entry) => entry.startsWith(prefix))?.slice(prefix.length)
  if (value !== undefined) return value
  if (fallback !== undefined) return fallback
  throw new UsageError(`design:audit needs --${name}=...`)
}

function every(name: string): string[] {
  const prefix = `--${name}=`
  return process.argv
    .filter((entry) => entry.startsWith(prefix))
    .map((entry) => entry.slice(prefix.length))
}

function sizes(text: string): Size[] {
  return text.split(',').map((entry) => {
    const match = /^(\d+)x(\d+)$/.exec(entry)
    if (!match) throw new UsageError(`A size reads WIDTHxHEIGHT, not ${entry}`)
    return { width: Number(match[1]), height: Number(match[2]), name: entry }
  })
}

function pagesOf(text: string): string[] {
  const list = text.split(',').filter(Boolean)
  if (list.length === 0)
    throw new UsageError('design:audit needs at least one page in --pages=PATH,...')
  const stray = list.find((path) => !path.startsWith('/'))
  if (stray !== undefined) throw new UsageError(`A page is a path starting with /, not ${stray}`)
  return list
}

function marginOf(text: string): number {
  const margin = Number(text)
  if (text.trim() === '' || !Number.isFinite(margin)) {
    throw new UsageError(`A margin is a number of px, not ${text}`)
  }
  return margin
}

function checks(entries: string[]): Check[] {
  if (entries.length === 0)
    throw new UsageError('design:audit needs at least one --check=PIECE@FRAME')
  return entries.map((entry) => {
    const at = entry.lastIndexOf('@')
    if (at <= 0 || at === entry.length - 1) {
      throw new UsageError(`A check reads PIECE@FRAME, or PIECE@${SCREEN}, not ${entry}`)
    }
    return { piece: entry.slice(0, at), frame: entry.slice(at + 1) }
  })
}

function inspect([planned, margin, screen]: [Check[], number, string]): Inspection {
  const voidTags = new Set(['IMG', 'INPUT', 'BR', 'HR', 'VIDEO', 'CANVAS', 'IFRAME', 'TEXTAREA'])

  type Point = { x: number; y: number }

  const boxCorners = (element: Element): Point[] => {
    const box = element.getBoundingClientRect()
    return [
      { x: box.left, y: box.top },
      { x: box.right, y: box.top },
      { x: box.right, y: box.bottom },
      { x: box.left, y: box.bottom },
    ]
  }

  const corners = (element: Element): Point[] => {
    if (!(element instanceof HTMLElement) || voidTags.has(element.tagName))
      return boxCorners(element)
    const positioned = getComputedStyle(element).position !== 'static'
    const before = element.style.position
    if (!positioned) element.style.position = 'relative'
    const points = (
      [
        ['0', '0'],
        ['100%', '0'],
        ['100%', '100%'],
        ['0', '100%'],
      ] as const
    ).map(([left, top]) => {
      const probe = document.createElement('i')
      probe.style.cssText = `position:absolute;left:${left};top:${top};width:0;height:0;margin:0;padding:0;border:0;display:block`
      element.appendChild(probe)
      const box = probe.getBoundingClientRect()
      probe.remove()
      return { x: box.left, y: box.top }
    })
    if (!positioned) element.style.position = before
    return points
  }

  const shown = (element: Element): boolean => {
    if (getComputedStyle(element).visibility === 'hidden') return false
    let opacity = 1
    for (let node: Element | null = element; node; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (style.display === 'none') return false
      opacity *= Number(style.opacity)
    }
    const box = element.getBoundingClientRect()
    return opacity > 0 && box.width > 0 && box.height > 0
  }

  const area = (quad: Point[]): number =>
    quad.reduce((sum, start, index) => {
      const end = quad[(index + 1) % quad.length] ?? start
      return sum + start.x * end.y - end.x * start.y
    }, 0) / 2

  const depth = (point: Point, quad: Point[]): number => {
    const sign = area(quad) < 0 ? -1 : 1
    let least = Number.POSITIVE_INFINITY
    quad.forEach((start, index) => {
      const end = quad[(index + 1) % quad.length] ?? start
      const ex = end.x - start.x
      const ey = end.y - start.y
      const length = Math.hypot(ex, ey) || 1
      least = Math.min(
        least,
        (sign * (ex * (point.y - start.y) - ey * (point.x - start.x))) / length,
      )
    })
    return least
  }

  const named = (element: Element, selector: string, index: number): string => {
    const text = (element.getAttribute('aria-label') ?? element.textContent ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 28)
    return `${selector} #${index + 1}${text ? ` "${text}"` : ''}`
  }

  const viewport = document.documentElement.clientWidth
  const screenDepth = (point: Point): number => Math.min(point.x, viewport - point.x)

  const readings = planned.map(({ piece, frame }): Reading => {
    const problems: string[] = []
    let least: number | null = null
    const matches = [...document.querySelectorAll(piece)]
    const pieces = matches.filter(shown)
    pieces.forEach((element, index) => {
      const label = named(element, piece, index)
      const points = corners(element)
      const holder = frame === screen ? null : element.closest(frame)
      if (frame !== screen && !holder) {
        problems.push(`${label} has no ${frame} around it`)
        return
      }
      const frameQuad = holder ? corners(holder) : null
      if (frameQuad && Math.abs(area(frameQuad)) < 1) {
        problems.push(`${label} sits in a ${frame} with no area`)
        return
      }
      const deepest = frameQuad
        ? Math.min(...points.map((point) => depth(point, frameQuad)))
        : Math.min(...points.map(screenDepth))
      least = least === null ? deepest : Math.min(least, deepest)
      if (deepest < margin) {
        problems.push(
          `${label} sits ${deepest.toFixed(1)} px inside ${holder ? frame : 'the screen'}`,
        )
      }
      if (holder && points.some((point) => point.x < 0 || point.x > viewport)) {
        problems.push(`${label} leaves the screen`)
      }
    })
    if (matches.length === 0) problems.push(`${piece} matches nothing on the page`)
    if (frame !== screen && document.querySelector(frame) === null) {
      problems.push(`${frame} matches nothing on the page`)
    }
    return { least: least === null ? null : Math.round(least * 10) / 10, problems }
  })
  return { sideways: document.documentElement.scrollWidth - viewport, readings }
}

async function inspected(page: Page, planned: Check[], margin: number): Promise<Inspection> {
  return page.evaluate(inspect, [planned, margin, SCREEN] as [Check[], number, string])
}

async function refuseInvalidSelectors(page: Page, selectors: string[]): Promise<void> {
  const invalid = await page.evaluate(
    (list) =>
      list.filter((selector) => {
        try {
          document.querySelector(selector)
          return false
        } catch (error) {
          if (error instanceof DOMException && error.name === 'SyntaxError') return true
          throw error
        }
      }),
    selectors,
  )
  if (invalid.length > 0) {
    throw new UsageError(`Not a valid CSS selector: ${invalid.join(', ')}`)
  }
}

async function refuseUnreadableSweep(page: Page, sweep: string): Promise<void> {
  try {
    await page.locator(sweep).count()
  } catch (error) {
    const reason = error instanceof Error ? (error.message.split('\n')[0] ?? '') : String(error)
    throw new UsageError(`Playwright cannot read the sweep ${sweep}: ${reason}`)
  }
}

async function pointAt(page: Page, sweep: string, index: number): Promise<string | undefined> {
  const target = page.locator(sweep).nth(index)
  const label = `${sweep} #${index + 1}`
  try {
    await target.scrollIntoViewIfNeeded({ timeout: POINT_TIMEOUT_MS })
  } catch (error) {
    if (!(error instanceof errors.TimeoutError)) throw error
    return `${label} cannot be scrolled into view`
  }
  const box = await target.boundingBox()
  const viewport = page.viewportSize()
  if (!box || !viewport) return `${label} has no box to point at`
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  if (x < 0 || y < 0 || x >= viewport.width || y >= viewport.height) {
    return `${label} cannot be pointed: its centre stays off the screen`
  }
  await page.mouse.move(x, y)
  await page.waitForTimeout(SETTLE_MS)
  return undefined
}

async function main(): Promise<void> {
  const base = option('base', 'http://localhost:4322')
  const pages = pagesOf(option('pages'))
  const planned = checks(every('check'))
  const margin = marginOf(option('margin', '0'))
  const sweep = option('sweep', '')
  const planSizes = sizes(option('sizes', SEVEN_SIZES))
  const selectors = [
    ...planned.flatMap(({ piece, frame }) => (frame === SCREEN ? [piece] : [piece, frame])),
    ...(sweep ? [sweep] : []),
  ]
  const browser = await chromium.launch()
  const rows: string[] = []
  let problems = 0
  let measured = 0
  try {
    const probe = await browser.newPage()
    await refuseInvalidSelectors(probe, selectors)
    if (sweep) await refuseUnreadableSweep(probe, sweep)
    await probe.close()
    for (const size of planSizes) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      for (const path of pages) {
        await page.mouse.move(1, 1)
        await page.goto(base + path, { waitUntil: 'networkidle' })
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(SETTLE_MS)
        const states: { label: string; hover?: number }[] = [{ label: 'rest' }]
        if (sweep) {
          const count = await page.locator(sweep).count()
          if (count === 0) {
            problems += 1
            rows.push(
              `| ${path} | ${size.name} | sweep | not measured | not measured | ${sweep} matches nothing on the page |`,
            )
          }
          for (let index = 0; index < count; index++)
            states.push({ label: `pointing ${index + 1}`, hover: index })
        }
        for (const state of states) {
          if (state.hover !== undefined) {
            const refused = await pointAt(page, sweep, state.hover)
            if (refused) {
              problems += 1
              rows.push(
                `| ${path} | ${size.name} | ${state.label} | not measured | not measured | ${refused} |`,
              )
              continue
            }
          }
          const { sideways, readings } = await inspected(page, planned, margin)
          measured += 1
          const found = [
            ...(sideways !== 0 ? [`the page scrolls ${sideways} px sideways`] : []),
            ...readings.flatMap((reading) => reading.problems),
          ]
          problems += found.length
          const least = readings
            .map((reading, index) => `${planned[index]?.piece}: ${reading.least ?? 'none shown'}`)
            .join('; ')
          rows.push(
            `| ${path} | ${size.name} | ${state.label} | ${sideways} | ${least} | ${found.length > 0 ? found.join('; ') : 'none'} |`,
          )
        }
      }
      await context.close()
    }
  } finally {
    await browser.close()
  }
  console.log('| page | size | state | sideways px | least depth px | problems |')
  console.log('| --- | --- | --- | --- | --- | --- |')
  for (const row of rows) console.log(row)
  console.log(
    `\n${measured} states measured, ${rows.length - measured} not measured, ${problems} problems, margin ${margin} px.`,
  )
  if (problems > 0) process.exitCode = 1
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
