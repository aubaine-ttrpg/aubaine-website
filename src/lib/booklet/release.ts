import type { Locale } from '../i18n/locales.ts'

export const BOOKLET_KINDS = ['tree', 'book', 'equipment'] as const

export type BookletKind = (typeof BOOKLET_KINDS)[number]

export const RELEASE_FILE =
  /^([a-z][a-z0-9-]*)-(fr|en)-v(\d+\.\d+\.\d+)_([0-9a-f]{8})_([0-9a-f]{8})\.pdf$/

export const ARCHIVE_FILE = /^aubaine-v(\d+\.\d+\.\d+)-(fr|en)\.zip$/

export function archiveFile(version: string, locale: Locale): string {
  return `aubaine-v${version}-${locale}.zip`
}

export type Release = {
  slug: string
  kind: BookletKind
  locale: Locale
  version: string
  styleHash: string
  contentHash: string
}

export function releaseFile(release: Release): string {
  const { slug, locale, version, styleHash, contentHash } = release
  return `${slug}-${locale}-v${version}_${styleHash}_${contentHash}.pdf`
}

export function releaseStamp(release: Release): string {
  return `v${release.version}.${release.styleHash}.${release.contentHash}`
}

export function releaseShort(release: Release): string {
  return `v${release.version}`
}

export function parseReleaseFile(
  file: string,
): Pick<Release, 'slug' | 'locale' | 'version' | 'styleHash' | 'contentHash'> | undefined {
  const match = RELEASE_FILE.exec(file)
  if (!match) return undefined
  const [, slug, locale, version, styleHash, contentHash] = match
  return {
    slug: slug as string,
    locale: locale as Locale,
    version: version as string,
    styleHash: styleHash as string,
    contentHash: contentHash as string,
  }
}
