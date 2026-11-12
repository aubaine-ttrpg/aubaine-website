import type { Browser, Page } from 'playwright-core'

import { ENGINES, type Engine, isEngine } from './engines.ts'
import {
  clipAround,
  LEAN_POINTERS,
  leanedAndFlat,
  sharpnessDrift,
  stillAndLive,
} from './picture-measures.ts'

const SETTLE_MS = 1200
const ROOM_PX = 24
const AS_SHARP_AS = 0.1
const USAGE = `pnpm design:sharpness --path=PATH --pieces=SELECTOR[,SELECTOR] [--engines=firefox,chromium,webkit] [--ratios=1,2] [--width=1440] [--base=URL] [--headless]

For each engine, pixel ratio and piece, measures the sharpness (variance of the Laplacian of the
greyscale crop) of the piece leaned toward a pointer at every point of a 3 by 3 grid over its box,
against the same pointer with the piece drawn flat (a transparent veil takes its hover away), and of its
still against its first live frame. Prints each as a fraction of the reference; a row drifts when it is
more than 10 % away. Headed by default, on the graphics card.
Default --base=http://localhost:4322

Exit 0 when nothing drifts; 1 when a row drifts; 2 on a usage error.`

class UsageError extends Error {}

function option(name: string, fallback?: string): string {
  const prefix = `--${name}=`
  const value = process.argv.find((entry) => entry.startsWith(prefix))?.slice(prefix.length)
  if (value !== undefined) return value
  if (fallback !== undefined) return fallback
  throw new UsageError(`design:sharpness needs --${name}=...`)
}

function enginesOf(list: string): Engine[] {
  return list.split(',').map((name) => {
    if (!isEngine(name)) throw new UsageError(`design:sharpness knows no engine ${name}`)
    return name
  })
}

async function settled(page: Page): Promise<void> {
  await page.waitForTimeout(SETTLE_MS)
}

async function opened(page: Page, url: string, selector: string): Promise<void> {
  await page.goto(url)
  await page.locator(selector).evaluate((node) => {
    window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 200)
  })
  await page.locator(`${selector}[data-draped] canvas`).waitFor({ state: 'attached' })
  await settled(page)
}

async function measure(
  browser: Browser,
  url: string,
  selector: string,
  ratio: number,
  width: number,
): Promise<string[]> {
  const rows: string[] = []
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: ratio,
  })
  const page = await context.newPage()
  await opened(page, url, selector)
  const holder = page.locator(selector)
  const handOff = await stillAndLive(page, holder, await clipAround(holder, 0))
  rows.push(
    `still against first live frame: ${(1 - sharpnessDrift(handOff.still, handOff.live)).toFixed(3)}`,
  )
  for (const at of LEAN_POINTERS) {
    await opened(page, url, selector)
    const box = await clipAround(holder, 0)
    const pointer = { x: box.x + box.width * at.x, y: box.y + box.height * at.y }
    const { leaned, flat } = await leanedAndFlat(
      page,
      await clipAround(holder, ROOM_PX),
      pointer,
      () => settled(page),
    )
    rows.push(
      `leaned at ${at.x}, ${at.y} against flat: ${(1 - sharpnessDrift(leaned, flat)).toFixed(3)}`,
    )
  }
  await context.close()
  return rows
}

async function main(): Promise<void> {
  const base = option('base', 'http://localhost:4322')
  const url = new URL(option('path'), base).href
  const pieces = option('pieces').split(',')
  const engines = enginesOf(option('engines', 'firefox,chromium,webkit'))
  const ratios = option('ratios', '1,2').split(',').map(Number)
  const width = Number(option('width', '1440'))
  const headless = process.argv.includes('--headless')
  let drifted = false
  for (const engine of engines) {
    const browser = await ENGINES[engine](headless)
    try {
      for (const ratio of ratios) {
        for (const selector of pieces) {
          console.log(`\n${engine}, ratio ${ratio}, ${selector}`)
          for (const row of await measure(browser, url, selector, ratio, width)) {
            const value = Number(row.split(': ')[1])
            const drifts = Math.abs(1 - value) > AS_SHARP_AS
            drifted ||= drifts
            console.log(`  ${row}${drifts ? '  DRIFTS' : ''}`)
          }
        }
      }
    } finally {
      await browser.close()
    }
  }
  process.exitCode = drifted ? 1 : 0
}

main().catch((error: unknown) => {
  if (error instanceof UsageError) {
    console.error(`${error.message}\n\n${USAGE}`)
    process.exitCode = 2
    return
  }
  throw error
})
