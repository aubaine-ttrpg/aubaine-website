import notesSource from '../../../data/pdf/notes.json'
import releasesSource from '../../../data/pdf/releases.json'
import { type PdfNote, type PdfRelease, pdfNotes, pdfReleases } from '../game/schema.ts'
import { LOCALES, type Locale } from '../i18n/locales.ts'
import type { BookletKind } from './release.ts'

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

const RELEASES: PdfRelease[] = pdfReleases.parse(releasesSource).releases.slice().sort(newestFirst)

const NOTES: PdfNote[] = pdfNotes
  .parse(notesSource)
  .notes.slice()
  .sort((a, b) => compareVersions(a.version, b.version))

export function releases(): PdfRelease[] {
  return RELEASES
}

export function notes(): PdfNote[] {
  return NOTES
}

export function noteFor(version: string): PdfNote | undefined {
  return NOTES.find((note) => note.version === version)
}

export function latestRelease(
  kind: BookletKind,
  slug: string,
  locale: Locale,
): PdfRelease | undefined {
  return RELEASES.find(
    (release) => release.kind === kind && release.slug === slug && release.locale === locale,
  )
}

function newestPerVersion(entries: PdfRelease[]): PdfRelease[] {
  const seen = new Set<string>()
  const out: PdfRelease[] = []
  for (const release of entries) {
    const key = `${release.kind}/${release.slug}/${release.locale}/${release.version}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(release)
  }
  return out
}

export function releasesFor(slug: string, locale: Locale): PdfRelease[] {
  return newestPerVersion(
    RELEASES.filter((release) => release.slug === slug && release.locale === locale),
  )
}

export function stalePrintings(): PdfRelease[] {
  const current = new Set(newestPerVersion(RELEASES).map((release) => release.file))
  return RELEASES.filter((release) => !current.has(release.file))
}

export function hasBooklet(slug: string): boolean {
  return LOCALES.every((locale) => releasesFor(slug, locale).length > 0)
}

export function currentVersion(): string | undefined {
  return RELEASES[0]?.version
}

export type ReleaseGeneration = {
  version: string
  note: PdfNote | undefined
  date: string
  bytes: number
  files: PdfRelease[]
}

export function generations(locale: Locale): ReleaseGeneration[] {
  const byVersion = new Map<string, PdfRelease[]>()
  for (const release of newestPerVersion(RELEASES)) {
    if (release.locale !== locale) continue
    const bucket = byVersion.get(release.version)
    if (bucket) bucket.push(release)
    else byVersion.set(release.version, [release])
  }
  return [...byVersion.entries()].map(([version, files]) => ({
    version,
    note: noteFor(version),
    date: noteFor(version)?.date ?? (files[0]?.generatedAt ?? '').slice(0, 10),
    bytes: files.reduce((total, release) => total + release.bytes, 0),
    files,
  }))
}
