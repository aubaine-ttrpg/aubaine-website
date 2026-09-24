import { execFile } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

import { archiveFile } from '../../src/lib/booklet/release.ts'
import { type PdfRelease, pdfReleases } from '../../src/lib/game/schema.ts'
import { LOCALES, type Locale } from '../../src/lib/i18n/locales.ts'

const run = promisify(execFile)

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const pdfDir = resolve(root, 'data/media/pdf')
const archiveDir = resolve(root, 'data/media/pdf-archive')
const manifestPath = resolve(root, 'data/pdf/releases.json')

export type ArchiveBundle = {
  file: string
  version: string
  locale: Locale
  releases: PdfRelease[]
}

export type ArchivePlan = {
  stale: PdfRelease[]
  bundles: ArchiveBundle[]
  keep: PdfRelease[]
}

function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let at = 0; at < 3; at += 1) {
    const diff = (right[at] ?? 0) - (left[at] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function newestFirst(a: PdfRelease, b: PdfRelease): number {
  return compareVersions(a.version, b.version) || b.generatedAt.localeCompare(a.generatedAt)
}

export function planArchive(releases: PdfRelease[]): ArchivePlan {
  const sorted = [...releases].sort(newestFirst)

  const seen = new Set<string>()
  const current: PdfRelease[] = []
  const stale: PdfRelease[] = []
  for (const release of sorted) {
    const key = `${release.kind}/${release.slug}/${release.locale}/${release.version}`
    if (seen.has(key)) stale.push(release)
    else {
      seen.add(key)
      current.push(release)
    }
  }

  const newest = current[0]?.version
  const keep = current.filter((release) => release.version === newest)
  const older = current.filter((release) => release.version !== newest)

  const bundles: ArchiveBundle[] = []
  for (const version of [...new Set(older.map((release) => release.version))]) {
    for (const locale of LOCALES) {
      const members = older.filter(
        (release) => release.version === version && release.locale === locale,
      )
      if (members.length === 0) continue
      bundles.push({ file: archiveFile(version, locale), version, locale, releases: members })
    }
  }

  return { stale, bundles, keep }
}

async function zip(bundle: ArchiveBundle): Promise<void> {
  const target = join(archiveDir, bundle.file)
  await rm(target, { force: true })
  await run('zip', ['-q', '-9', '-j', target, ...bundle.releases.map((r) => join(pdfDir, r.file))])
}

async function main(): Promise<void> {
  const check = process.argv.slice(2).includes('--check')
  const releases = pdfReleases.parse(JSON.parse(await readFile(manifestPath, 'utf8'))).releases
  const plan = planArchive(releases)

  const loose = plan.stale.length + plan.bundles.reduce((n, b) => n + b.releases.length, 0)
  if (loose === 0) {
    console.log(`pdf-archive: nothing to do, ${plan.keep.length} booklet(s) current`)
    return
  }

  console.log(`pdf-archive: ${plan.stale.length} stale printing(s) to remove`)
  for (const bundle of plan.bundles) {
    console.log(`pdf-archive: ${bundle.file} holds ${bundle.releases.length} booklet(s)`)
  }

  if (check) {
    console.log(`\n${loose} loose file(s) out of place. Run: pnpm pdf:archive`)
    process.exitCode = 1
    return
  }

  await mkdir(archiveDir, { recursive: true })
  for (const bundle of plan.bundles) await zip(bundle)

  const archived = new Map<string, string>()
  for (const bundle of plan.bundles) {
    for (const release of bundle.releases) archived.set(release.file, bundle.file)
  }

  const dropped = new Set(plan.stale.map((release) => release.file))
  for (const file of [...dropped, ...archived.keys()]) {
    await rm(join(pdfDir, file), { force: true })
  }

  const kept: PdfRelease[] = releases
    .filter((release) => !dropped.has(release.file))
    .map((release) => {
      const bundle = archived.get(release.file)
      return bundle ? { ...release, archive: bundle } : release
    })
    .sort(
      (a, b) =>
        a.slug.localeCompare(b.slug) ||
        a.locale.localeCompare(b.locale) ||
        a.file.localeCompare(b.file),
    )

  await writeFile(manifestPath, `${JSON.stringify({ releases: kept }, null, 2)}\n`, 'utf8')
  console.log(
    `\npdf-archive: ${plan.keep.length} booklet(s) loose, ${plan.bundles.length} archive(s), ${kept.length} release(s) in the manifest`,
  )
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
