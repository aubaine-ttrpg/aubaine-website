import { existsSync, realpathSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { chromium } from 'playwright-core'
import sharp from 'sharp'

type Shot = { name: string; path: string; width: number; height: number; hover?: string }

type Mode = 'capture' | 'compare'

const MODES: readonly Mode[] = ['capture', 'compare']
const SETTLE_MS = 300
const HOVER_MS = 400
const USAGE = `pnpm design:pixels capture --shots=FILE --out=DIR [--base=URL]
pnpm design:pixels compare --shots=FILE --out=DIR --against=DIR [--base=URL]

Captures every shot of FILE as a full-page PNG in DIR, once its fonts and images have loaded, with
reduced motion and the pointer parked at the bottom left; compare also counts, shot by shot, the pixels
that differ from the same name in --against. FILE is a JSON array of { "name", "path", "width",
"height" } with an optional "hover" Playwright selector, such as "main a >> nth=1".
Default --base=http://localhost:4322

Exit 0 when every compared shot is identical; 1 when one differs; 2 on a usage error.`

class UsageError extends Error {}

function option(name: string, fallback?: string): string {
  const prefix = `--${name}=`
  const value = process.argv.find((entry) => entry.startsWith(prefix))?.slice(prefix.length)
  if (value !== undefined) return value
  if (fallback !== undefined) return fallback
  throw new UsageError(`design:pixels needs --${name}=...`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function shotOf(value: unknown, index: number): Shot {
  if (!isRecord(value)) throw new UsageError(`shot ${index + 1} is not an object`)
  const { name, path, width, height, hover } = value
  if (typeof name !== 'string' || !/^[\w.-]+$/.test(name)) {
    throw new UsageError(`shot ${index + 1} needs a file-safe name`)
  }
  if (typeof path !== 'string' || !path.startsWith('/')) {
    throw new UsageError(`shot ${name} needs a path starting with /`)
  }
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new UsageError(`shot ${name} needs a whole width and height`)
  }
  if (hover !== undefined && typeof hover !== 'string') {
    throw new UsageError(`shot ${name} has a hover that is not a selector`)
  }
  return { name, path, width: Number(width), height: Number(height), ...(hover ? { hover } : {}) }
}

async function shots(file: string): Promise<Shot[]> {
  const parsed = await readFile(file, 'utf8').then(
    (text): unknown => JSON.parse(text),
    (error: unknown) => {
      throw new UsageError(
        `${file} cannot be read: ${error instanceof Error ? error.message : error}`,
      )
    },
  )
  if (!Array.isArray(parsed) || parsed.length === 0) throw new UsageError(`${file} lists no shot`)
  const list = parsed.map(shotOf)
  const names = new Set(list.map((shot) => shot.name))
  if (names.size !== list.length) throw new UsageError(`${file} names a shot twice`)
  return list
}

function sameDirectory(a: string, b: string): boolean {
  if (a === b) return true
  return existsSync(a) && existsSync(b) && realpathSync.native(a) === realpathSync.native(b)
}

function baseline(against: string, out: string, list: Shot[]): string {
  if (sameDirectory(against, out)) {
    throw new UsageError('--against must name another directory than --out')
  }
  const missing = list.filter((shot) => !existsSync(resolve(against, `${shot.name}.png`)))
  if (missing.length > 0) {
    const names = missing.map((shot) => `${shot.name}.png`).join(', ')
    throw new UsageError(`${against} holds no ${names} to compare with`)
  }
  return against
}

async function refuseUnreadableHovers(list: Shot[]): Promise<void> {
  const hovers = list.flatMap((shot) => (shot.hover ? [shot.hover] : []))
  if (hovers.length === 0) return
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    for (const hover of hovers) {
      try {
        await page.locator(hover).count()
      } catch (error) {
        const reason = error instanceof Error ? (error.message.split('\n')[0] ?? '') : String(error)
        throw new UsageError(`Playwright cannot read the hover ${hover}: ${reason}`)
      }
    }
  } finally {
    await browser.close()
  }
}

async function capture(base: string, out: string, list: Shot[]): Promise<void> {
  await mkdir(out, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const shot of list) {
      const context = await browser.newContext({
        viewport: { width: shot.width, height: shot.height },
        reducedMotion: 'reduce',
      })
      const page = await context.newPage()
      await page.goto(base + shot.path, { waitUntil: 'networkidle' })
      await page.evaluate(() => document.fonts.ready)
      await page.evaluate(() =>
        Promise.all(
          [...document.images].map((image) =>
            image.complete
              ? image.decode().then(
                  () => undefined,
                  () => undefined,
                )
              : new Promise<void>((resolve) => {
                  image.addEventListener('load', () => resolve(), { once: true })
                  image.addEventListener('error', () => resolve(), { once: true })
                }),
          ),
        ),
      )
      await page.mouse.move(1, shot.height - 1)
      if (shot.hover) {
        await page.locator(shot.hover).first().hover()
        await page.waitForTimeout(HOVER_MS)
      }
      await page.waitForTimeout(SETTLE_MS)
      await page.screenshot({ path: resolve(out, `${shot.name}.png`), fullPage: true })
      await context.close()
    }
  } finally {
    await browser.close()
  }
}

async function differing(before: string, after: string): Promise<string> {
  const read = (file: string) =>
    sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const [a, b] = await Promise.all([read(before), read(after)])
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    return `size ${a.info.width}x${a.info.height} before, ${b.info.width}x${b.info.height} now`
  }
  let changed = 0
  for (let index = 0; index < a.data.length; index += 3) {
    if (
      a.data[index] !== b.data[index] ||
      a.data[index + 1] !== b.data[index + 1] ||
      a.data[index + 2] !== b.data[index + 2]
    ) {
      changed++
    }
  }
  return String(changed)
}

async function main(): Promise<void> {
  const mode = MODES.find((candidate) => candidate === process.argv[2])
  if (!mode)
    throw new UsageError(`design:pixels runs ${MODES.join(' or ')}, not ${process.argv[2]}`)
  const base = option('base', 'http://localhost:4322')
  const out = resolve(option('out'))
  const list = await shots(resolve(option('shots')))
  if (mode === 'capture') {
    await refuseUnreadableHovers(list)
    await capture(base, out, list)
    console.log(`Captured ${list.length} shots into ${out}`)
    return
  }
  const against = baseline(resolve(option('against')), out, list)
  await refuseUnreadableHovers(list)
  await capture(base, out, list)
  console.log('| shot | differing pixels |')
  console.log('| --- | --- |')
  let identical = 0
  for (const shot of list) {
    const result = await differing(
      resolve(against, `${shot.name}.png`),
      resolve(out, `${shot.name}.png`),
    )
    if (result === '0') identical++
    console.log(`| ${shot.name} | ${result} |`)
  }
  console.log(`\n${identical} of ${list.length} shots identical.`)
  if (identical !== list.length) process.exitCode = 1
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
