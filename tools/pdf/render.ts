import { spawn } from 'node:child_process'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright-core'

import { releaseFor, styleHash } from '../../src/lib/booklet/fingerprint.ts'
import { type BookletKind, type Release, releaseFile } from '../../src/lib/booklet/release.ts'
import type { ResolvedBook, ResolvedTree } from '../../src/lib/game/build.ts'
import { readCorpus } from '../../src/lib/game/fs-sources.ts'
import { aubaineVersion, pdfReleases } from '../../src/lib/game/schema.ts'
import { LOCALES, type Locale } from '../../src/lib/i18n/locales.ts'
import { bookletClaim } from '../../src/lib/rights/claim.ts'
import { stampPdf } from '../../src/lib/rights/pdf.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const buildDir = resolve(root, '.astro/print-build')
const outDir = resolve(root, 'data/media/pdf')
const manifestPath = resolve(root, 'data/pdf/releases.json')

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
}

type Booklet = {
  kind: BookletKind
  slug: string
  title: string
  locale: Locale
  release: Release
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

function option(name: string): string | undefined {
  const prefix = `--${name}=`
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length)
}

async function run(command: string, args: string[], env: Record<string, string>): Promise<void> {
  await new Promise<void>((done, fail) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: ['ignore', 'inherit', 'inherit'],
      env: { ...process.env, ...env },
    })
    child.on('error', fail)
    child.on('exit', (code) =>
      code === 0 ? done() : fail(new Error(`${command} ${args.join(' ')} exited ${code}`)),
    )
  })
}

async function serve(directory: string): Promise<{ origin: string; stop: () => Promise<void> }> {
  const server = createServer((request, response) => {
    const path = decodeURIComponent((request.url ?? '/').split('?')[0] ?? '/')
    const target = join(directory, path.endsWith('/') ? `${path}index.html` : path)
    const candidates = extname(target) === '' ? [join(target, 'index.html'), target] : [target]
    const send = (index: number): void => {
      const candidate = candidates[index]
      if (candidate === undefined) {
        response.writeHead(404).end()
        return
      }
      const stream = createReadStream(candidate)
      stream.on('error', () => send(index + 1))
      stream.on('open', () => {
        response.writeHead(200, {
          'content-type': CONTENT_TYPES[extname(candidate)] ?? 'application/octet-stream',
        })
        stream.pipe(response)
      })
    }
    send(0)
  })

  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    stop: () => new Promise<void>((done) => server.close(() => done())),
  }
}

async function plan(version: string, style: string): Promise<Booklet[]> {
  const only = option('only')
  const wanted = option('locale')
  const locales = wanted ? LOCALES.filter((locale) => locale === wanted) : LOCALES
  if (locales.length === 0) throw new Error(`Unknown locale ${wanted}`)

  const booklets: Booklet[] = []
  for (const locale of locales) {
    const corpus = await readCorpus(root, locale)
    const trees: ResolvedTree[] = corpus.trees
    const books: ResolvedBook[] = corpus.books.filter((book) => book.chapters.length > 0)

    for (const tree of trees) {
      if (only && tree.id !== only) continue
      booklets.push({
        kind: 'tree',
        slug: tree.id,
        title: tree.name,
        locale,
        release: await releaseFor(
          root,
          { kind: 'tree', entry: tree },
          corpus,
          locale,
          version,
          style,
        ),
      })
    }
    for (const book of books) {
      if (only && book.id !== only) continue
      booklets.push({
        kind: 'book',
        slug: book.id,
        title: book.title,
        locale,
        release: await releaseFor(
          root,
          { kind: 'book', entry: book },
          corpus,
          locale,
          version,
          style,
        ),
      })
    }

    const catalogue = corpus.catalogue
    if (!only || catalogue.id === only) {
      booklets.push({
        kind: 'equipment',
        slug: catalogue.id,
        title: catalogue.name,
        locale,
        release: await releaseFor(
          root,
          { kind: 'equipment', entry: catalogue },
          corpus,
          locale,
          version,
          style,
        ),
      })
    }
  }
  return booklets
}

async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  )
}

async function main(): Promise<void> {
  const version = aubaineVersion.parse(
    JSON.parse(await readFile(resolve(root, 'data/aubaine.json'), 'utf8')),
  ).version
  const style = await styleHash(root)
  const booklets = await plan(version, style)

  const stale: Booklet[] = []
  for (const booklet of booklets) {
    const file = releaseFile(booklet.release)
    if (flag('force') || !(await exists(join(outDir, file)))) stale.push(booklet)
  }

  if (flag('check')) {
    for (const booklet of stale) {
      console.error(`stale: ${releaseFile(booklet.release)}`)
    }
    if (stale.length > 0) {
      console.error(`\n${stale.length} booklet(s) out of date. Run: pnpm pdf`)
      process.exitCode = 1
      return
    }
    console.log(`${booklets.length} booklets up to date at v${version} (style ${style})`)
    return
  }

  if (stale.length === 0) {
    console.log(`${booklets.length} booklets already built at v${version} (style ${style})`)
    await writeManifest(booklets)
    return
  }

  console.log(`building the print document for ${stale.length} booklet(s)`)
  await rm(buildDir, { recursive: true, force: true })
  await run('pnpm', ['exec', 'astro', 'build', '--outDir', buildDir], { AUBAINE_PRINT: '1' })
  await mkdir(outDir, { recursive: true })

  const site = await serve(buildDir)
  const browser = await chromium.launch()
  const built = new Map<string, number>()
  try {
    const page = await browser.newPage()
    for (const booklet of stale) {
      const { kind, slug, locale } = booklet
      const file = releaseFile(booklet.release)
      const url = `${site.origin}/print/${kind}/${slug}/${locale}`
      const response = await page.goto(url, { waitUntil: 'networkidle' })
      if (!response?.ok()) throw new Error(`${url} answered ${response?.status()}`)
      await page.waitForFunction(() => window.__bookletPaginated === true, null, {
        timeout: 30_000,
      })
      const pages = await page.evaluate(() => document.querySelectorAll('.au-page').length)
      const bytes = stampPdf(
        await page.pdf({
          printBackground: true,
          preferCSSPageSize: true,
          tagged: true,
          outline: true,
        }),
        bookletClaim(booklet.title, locale),
      )
      const destination = join(outDir, file)
      const temporary = `${destination}.tmp`
      await writeFile(temporary, bytes)
      await rename(temporary, destination)
      built.set(file, pages)
      console.log(`${file}  ${pages} pages  ${(bytes.length / 1024).toFixed(0)} KB`)
    }
  } finally {
    await browser.close()
    await site.stop()
    await rm(buildDir, { recursive: true, force: true })
  }

  await writeManifest(booklets)
  console.log(`\nwrote ${built.size} booklet(s) into data/media/pdf/`)
}

async function writeManifest(booklets: Booklet[]): Promise<void> {
  const previous = pdfReleases.parse(JSON.parse(await readFile(manifestPath, 'utf8'))).releases
  const known = new Map(previous.map((release) => [release.file, release]))
  const stamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z')

  for (const booklet of booklets) {
    const file = releaseFile(booklet.release)
    const path = join(outDir, file)
    if (!(await exists(path))) continue
    const { size } = await stat(path)
    known.set(file, {
      slug: booklet.slug,
      kind: booklet.kind,
      locale: booklet.locale,
      version: booklet.release.version,
      styleHash: booklet.release.styleHash,
      contentHash: booklet.release.contentHash,
      file,
      bytes: size,
      pages: await pageCount(path),
      generatedAt: known.get(file)?.generatedAt ?? stamp,
    })
  }

  const releases = [...known.values()].sort(
    (a, b) =>
      a.slug.localeCompare(b.slug) ||
      a.locale.localeCompare(b.locale) ||
      a.file.localeCompare(b.file),
  )
  await writeFile(manifestPath, `${JSON.stringify({ releases }, null, 2)}\n`, 'utf8')
  console.log(`manifest: ${releases.length} release(s)`)
}

async function pageCount(path: string): Promise<number> {
  const bytes = await readFile(path)
  const matches = bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g)
  return matches ? matches.length : 1
}

await main()
