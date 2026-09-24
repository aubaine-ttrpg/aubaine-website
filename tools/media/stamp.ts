import { spawn } from 'node:child_process'
import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { MediaCaption } from '../../src/lib/game/schema.ts'
import { indexCaptions, serialiseCaptions } from '../../src/lib/rights/captions.ts'
import { type AssetClaim, BASE_KEYWORDS, pictureClaim } from '../../src/lib/rights/claim.ts'
import { stampJpeg, stripJpeg } from '../../src/lib/rights/jpeg.ts'
import { mp4IsStamped, mp4MetadataArguments } from '../../src/lib/rights/mp4.ts'
import {
  FOREIGN_DIRECTORIES,
  GENERATED_DIRECTORIES,
  OWNED_DIRECTORIES,
  OWNED_FILES,
  STRIPPED_DIRECTORIES,
} from '../../src/lib/rights/ownership.ts'
import { readPngText, stampPng, stripPng } from '../../src/lib/rights/png.ts'
import { stampSvg, stripSvg } from '../../src/lib/rights/svg.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const mediaDir = resolve(root, 'data/media')
const captionsPath = resolve(root, 'data/media-captions.json')

const RASTER = ['.png', '.jpg']

type Rewrite = { relative: string; path: string; next: Uint8Array }
type Remux = { relative: string; path: string; args: string[] }

type Plan = {
  rewrites: Rewrite[]
  remuxes: Remux[]
  orphaned: string[]
  unowned: string[]
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

function option(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length)
}

async function run(command: string, args: string[]): Promise<void> {
  await new Promise<void>((done, fail) => {
    const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] })
    child.on('error', fail)
    child.on('exit', (code) => (code === 0 ? done() : fail(new Error(`${command} exited ${code}`))))
  })
}

async function filesUnder(directory: string): Promise<string[]> {
  const entries = await readdir(resolve(mediaDir, directory), { withFileTypes: true }).catch(
    () => [],
  )
  return entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => `${directory}/${entry.name}`)
    .sort()
}

function stampBytes(relative: string, bytes: Uint8Array, claim: AssetClaim): Uint8Array {
  const extension = extname(relative)
  if (extension === '.png') return stampPng(stripPng(bytes), claim)
  if (extension === '.jpg') return stampJpeg(stripJpeg(bytes), claim)
  throw new Error(`${relative}: no writer for ${extension}`)
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function embeddedKeywords(packet: string | undefined): string[] | undefined {
  const bag = packet === undefined ? undefined : /<dc:subject>([\s\S]*?)<\/dc:subject>/.exec(packet)
  if (!bag) return undefined
  const all = [...(bag[1] ?? '').matchAll(/<rdf:li>([\s\S]*?)<\/rdf:li>/g)].map((match) =>
    decodeEntities(match[1] ?? ''),
  )
  const specific = all.filter((keyword) => !BASE_KEYWORDS.includes(keyword))
  return specific.length > 0 ? specific : undefined
}

function embeddedCaption(relative: string, bytes: Uint8Array): MediaCaption | undefined {
  if (extname(relative) !== '.png') return undefined
  const text = readPngText(bytes)
  const description = text.get('Description')
  const title = text.get('Title')?.replace(/ · Aubaine$/, '')
  if (description === undefined || title === undefined) return undefined
  const keywords = embeddedKeywords(text.get('XMP') ?? text.get('XML:com.adobe.xmp'))
  return keywords === undefined
    ? { file: relative, title, description }
    : { file: relative, title, description, keywords }
}

function equal(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && Buffer.from(a).equals(Buffer.from(b))
}

async function build(captions: Map<string, MediaCaption>, only: string | undefined): Promise<Plan> {
  const plan: Plan = { rewrites: [], remuxes: [], orphaned: [], unowned: [] }
  const wanted = (relative: string) => only === undefined || relative.startsWith(only)

  const declared = new Set<string>([
    ...OWNED_DIRECTORIES,
    ...STRIPPED_DIRECTORIES,
    ...FOREIGN_DIRECTORIES,
    ...GENERATED_DIRECTORIES,
  ])
  for (const entry of await readdir(mediaDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    if (entry.isDirectory() && !declared.has(entry.name)) plan.unowned.push(`${entry.name}/`)
    if (entry.isFile() && !(OWNED_FILES as readonly string[]).includes(entry.name)) {
      plan.unowned.push(entry.name)
    }
  }

  const owned: string[] = [...OWNED_FILES]
  for (const directory of OWNED_DIRECTORIES) owned.push(...(await filesUnder(directory)))

  for (const relative of owned) {
    if (!wanted(relative)) continue
    const path = join(mediaDir, relative)
    const extension = extname(relative)
    const caption = captions.get(relative)
    const claim = pictureClaim(caption)

    if (extension === '.mp4') {
      const bytes = new Uint8Array(await readFile(path))
      if (flag('force') || !mp4IsStamped(bytes, claim)) {
        plan.remuxes.push({ relative, path, args: mp4MetadataArguments(claim) })
      }
      continue
    }

    if (extension === '.svg') {
      const source = await readFile(path, 'utf8')
      const next = stampSvg(source, claim)
      if (next !== source) {
        plan.rewrites.push({ relative, path, next: new TextEncoder().encode(next) })
      }
      continue
    }

    if (!RASTER.includes(extension)) throw new Error(`${relative}: no writer for ${extension}`)

    const bytes = new Uint8Array(await readFile(path))
    if (caption === undefined && embeddedCaption(relative, bytes) !== undefined) {
      plan.orphaned.push(relative)
      continue
    }
    const next = stampBytes(relative, bytes, claim)
    if (!equal(next, bytes)) plan.rewrites.push({ relative, path, next })
  }

  for (const directory of STRIPPED_DIRECTORIES) {
    for (const relative of await filesUnder(directory)) {
      if (!wanted(relative)) continue
      if (extname(relative) !== '.svg') throw new Error(`${relative}: only SVG is stripped here`)
      const path = join(mediaDir, relative)
      const source = await readFile(path, 'utf8')
      const next = stripSvg(source)
      if (next !== source) {
        plan.rewrites.push({ relative, path, next: new TextEncoder().encode(next) })
      }
    }
  }

  return plan
}

async function adopt(captions: Map<string, MediaCaption>): Promise<void> {
  const found: MediaCaption[] = []
  for (const directory of OWNED_DIRECTORIES) {
    for (const relative of await filesUnder(directory)) {
      if (captions.has(relative) || extname(relative) !== '.png') continue
      const embedded = embeddedCaption(
        relative,
        new Uint8Array(await readFile(join(mediaDir, relative))),
      )
      if (embedded) found.push(embedded)
    }
  }

  if (found.length === 0) {
    console.log('captions: nothing to adopt')
    return
  }

  for (const caption of found) captions.set(caption.file, caption)
  await writeFile(captionsPath, serialiseCaptions(captions.values()), 'utf8')
  for (const caption of found) console.log(`adopted ${caption.file}`)
  console.log(`\ncaptions: ${found.length} adopted into data/media-captions.json`)
}

async function main(): Promise<void> {
  const captions = indexCaptions(JSON.parse(await readFile(captionsPath, 'utf8')))

  for (const [file] of captions) {
    const path = join(mediaDir, file)
    const missing = await readFile(path).then(
      () => false,
      () => true,
    )
    if (missing) {
      console.error(`data/media-captions.json names ${file}, which is not on disk`)
      process.exitCode = 1
      return
    }
  }

  if (flag('adopt')) {
    await adopt(captions)
    return
  }

  const plan = await build(captions, option('only'))

  if (plan.unowned.length > 0) {
    for (const entry of plan.unowned) console.error(`data/media/${entry} is not declared`)
    console.error(
      `\n${plan.unowned.length} undeclared path(s). Declare them in src/lib/rights/ownership.ts`,
    )
    process.exitCode = 1
    return
  }

  if (plan.orphaned.length > 0) {
    for (const relative of plan.orphaned) {
      console.error(`${relative} carries a description that data/media-captions.json does not`)
    }
    console.error(
      `\n${plan.orphaned.length} description(s) would be lost. Run: pnpm media:stamp --adopt`,
    )
    process.exitCode = 1
    return
  }

  const pending = plan.rewrites.length + plan.remuxes.length

  if (flag('check')) {
    for (const rewrite of plan.rewrites) console.error(`stale: ${rewrite.relative}`)
    for (const remux of plan.remuxes) console.error(`stale: ${remux.relative}`)
    if (pending > 0) {
      console.error(`\n${pending} asset(s) not owned. Run: pnpm media:stamp`)
      process.exitCode = 1
      return
    }
    console.log('every owned asset carries its rights')
    return
  }

  if (pending === 0) {
    console.log('every owned asset already carries its rights')
    return
  }

  let saved = 0
  for (const rewrite of plan.rewrites) {
    const before = (await readFile(rewrite.path)).length
    const temporary = `${rewrite.path}.tmp`
    await writeFile(temporary, rewrite.next)
    await rename(temporary, rewrite.path)
    saved += before - rewrite.next.length
    console.log(`${rewrite.relative}  ${before} -> ${rewrite.next.length} bytes`)
  }

  for (const remux of plan.remuxes) {
    const temporary = `${remux.path}.tmp.mp4`
    await run('ffmpeg', ['-loglevel', 'error', '-y', '-i', remux.path, ...remux.args, temporary])
    const before = (await readFile(remux.path)).length
    const after = (await readFile(temporary)).length
    await rename(temporary, remux.path)
    await rm(`${remux.path}.tmp.mp4`, { force: true })
    saved += before - after
    console.log(`${remux.relative}  ${before} -> ${after} bytes`)
  }

  const delta =
    saved >= 0
      ? `${(saved / 1024).toFixed(0)} KB removed`
      : `${(-saved / 1024).toFixed(0)} KB added`
  console.log(`\nstamped ${pending} asset(s), ${delta}`)
}

await main()
