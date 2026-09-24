import { latestRelease } from './booklet/manifest.ts'
import type { BookletKind } from './booklet/release.ts'
import type { PdfRelease } from './game/schema.ts'
import type { Locale } from './i18n/locales.ts'

export const PLACEHOLDER_COVER = 'placeholder-3_4-og.png'
export const PLACEHOLDER_BANNER = 'placeholder-16_9-og.png'
export const PLACEHOLDER_SQUARE = 'placeholder-1_1-og.png'

const ART = import.meta.glob<{ default: ImageMetadata }>('/data/media/art/*.{png,jpg}', {
  eager: true,
})
const ITEMS = import.meta.glob<{ default: ImageMetadata }>('/data/media/items/*.{png,jpg}', {
  eager: true,
})
const SKILLS = import.meta.glob<{ default: ImageMetadata }>('/data/media/skills/*.{png,jpg}', {
  eager: true,
})

function pick(
  map: Record<string, { default: ImageMetadata }>,
  directory: string,
  file: string | undefined,
): ImageMetadata | undefined {
  if (!file) return undefined
  return map[`/data/media/${directory}/${file}`]?.default
}

export function artImage(file: string | undefined): ImageMetadata | undefined {
  return pick(ART, 'art', file)
}

export function itemImage(file: string | undefined): ImageMetadata | undefined {
  return pick(ITEMS, 'items', file)
}

export function skillImage(file: string | undefined): ImageMetadata | undefined {
  return pick(SKILLS, 'skills', file) ?? pick(ITEMS, 'items', PLACEHOLDER_SQUARE)
}

export function pdfHref(file: string | undefined): string | undefined {
  return file ? `/pdf/${file}` : undefined
}

export function archiveHref(file: string): string {
  return `/pdf-archive/${file}`
}

export function releaseHref(release: PdfRelease): string {
  return release.archive ? archiveHref(release.archive) : `/pdf/${release.file}`
}

export function bookletHref(kind: BookletKind, slug: string, locale: Locale): string | undefined {
  const release = latestRelease(kind, slug, locale)
  return release ? releaseHref(release) : undefined
}

const ICONS = import.meta.glob('/data/media/icons/**/*.svg')

const ICON_SOURCE = import.meta.glob<string>('/data/media/icons/**/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default',
})

export function hasIcon(name: string | null | undefined): boolean {
  if (!name) return false
  return `/data/media/icons/${name.replace(':', '/')}.svg` in ICONS
}

export function iconMask(name: string | null | undefined): string {
  const file = name ? name.replace(':', '/') : 'mdi/hexagon'
  return `url('/icons/${file}.svg') center/contain no-repeat`
}

export function inlineIcon(name: string | null | undefined, className: string): string | undefined {
  if (!name) return undefined
  const source = ICON_SOURCE[`/data/media/icons/${name.replace(':', '/')}.svg`]
  if (source === undefined) return undefined
  return source
    .replace(/\s(?:width|height)="[^"]*"/g, '')
    .replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="currentColor"')
    .replace('<svg', `<svg class="${className}" aria-hidden="true" focusable="false"`)
}
