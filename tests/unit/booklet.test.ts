import { describe, expect, it } from 'vitest'

import { formatBytes, formatReleaseDate } from '../../src/lib/booklet/format'
import { ARCHIVE_FILE, archiveFile } from '../../src/lib/booklet/release'
import type { PdfRelease } from '../../src/lib/game/schema'
import { planArchive } from '../../tools/pdf/archive'

const printing = (
  version: string,
  styleHash: string,
  generatedAt: string,
  overrides: Partial<PdfRelease> = {},
): PdfRelease => ({
  slug: 'feu',
  kind: 'tree',
  locale: 'fr',
  version,
  styleHash,
  contentHash: '7b57e2df',
  file: `feu-${overrides.locale ?? 'fr'}-v${version}_${styleHash}_7b57e2df.pdf`,
  bytes: 1_000_000,
  pages: 7,
  generatedAt,
  ...overrides,
})

describe('release sizes and dates', () => {
  it('sizes a booklet in the reader s own units', () => {
    expect(formatBytes(1_179_416, 'fr')).toBe('1,2 Mo')
    expect(formatBytes(1_179_416, 'en')).toBe('1.2 MB')
    expect(formatBytes(4_200, 'en')).toBe('4.2 kB')
  })

  it('reads a printing date as the same calendar day everywhere', () => {
    expect(formatReleaseDate('2026-09-22T00:30:00Z', 'fr')).toBe('22 septembre 2026')
    expect(formatReleaseDate('2026-09-22T23:45:00Z', 'fr')).toBe('22 septembre 2026')
    expect(formatReleaseDate('2026-09-22', 'en')).toBe('22 September 2026')
  })
})

describe('archive names', () => {
  it('names an archive after the version and the language it holds', () => {
    expect(archiveFile('0.2.1', 'fr')).toBe('aubaine-v0.2.1-fr.zip')
    expect(ARCHIVE_FILE.test(archiveFile('1.10.3', 'en'))).toBe(true)
    expect(ARCHIVE_FILE.test('aubaine-v0.2.1.zip')).toBe(false)
  })
})

describe('planning an archive', () => {
  it('drops a reprint of a version it already holds', () => {
    const plan = planArchive([
      printing('0.2.1', 'aaaaaaaa', '2026-09-22T13:00:00Z'),
      printing('0.2.1', 'bbbbbbbb', '2026-09-22T14:00:00Z'),
    ])
    expect(plan.stale.map((release) => release.styleHash)).toEqual(['aaaaaaaa'])
    expect(plan.keep.map((release) => release.styleHash)).toEqual(['bbbbbbbb'])
    expect(plan.bundles).toEqual([])
  })

  it('leaves the newest version loose and bundles the rest by language', () => {
    const plan = planArchive([
      printing('0.3.0', 'cccccccc', '2026-10-01T10:00:00Z'),
      printing('0.3.0', 'cccccccc', '2026-10-01T10:00:00Z', {
        locale: 'en',
        file: 'feu-en-v0.3.0_cccccccc_7b57e2df.pdf',
      }),
      printing('0.2.1', 'aaaaaaaa', '2026-09-22T13:00:00Z'),
      printing('0.2.1', 'aaaaaaaa', '2026-09-22T13:00:00Z', {
        locale: 'en',
        file: 'feu-en-v0.2.1_aaaaaaaa_7b57e2df.pdf',
      }),
    ])
    expect(plan.keep.every((release) => release.version === '0.3.0')).toBe(true)
    expect(plan.bundles.map((bundle) => bundle.file)).toEqual([
      'aubaine-v0.2.1-fr.zip',
      'aubaine-v0.2.1-en.zip',
    ])
    expect(plan.bundles.every((bundle) => bundle.releases.length === 1)).toBe(true)
  })

  it('orders versions by number rather than by printing date', () => {
    const plan = planArchive([
      printing('0.9.0', 'aaaaaaaa', '2026-01-01T00:00:00Z'),
      printing('0.10.0', 'bbbbbbbb', '2025-01-01T00:00:00Z'),
    ])
    expect(plan.keep.map((release) => release.version)).toEqual(['0.10.0'])
    expect(plan.bundles.map((bundle) => bundle.version)).toEqual(['0.9.0'])
  })
})
