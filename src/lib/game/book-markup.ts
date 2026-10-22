import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { DEFAULT_LOCALE, LOCALES, type Locale } from '../i18n/locales.ts'
import { strings } from '../i18n/strings.ts'
import { readCorpus } from './fs-sources.ts'
import { parseRuns, type Run, type TermIndex } from './richtext.ts'

type HastText = { type: 'text'; value: string }
type HastElement = {
  type: 'element'
  tagName: string
  properties: Record<string, string | number>
  children: HastChild[]
}
type HastChild = HastElement | HastText
type HastRoot = { type: 'root'; children: HastChild[] }
type HastParent = HastRoot | HastElement
type HastComment = { type: 'comment'; value: string }
type HastRaw = { type: 'raw'; value: string }
type AuthoredChild =
  | HastComment
  | HastRaw
  | HastText
  | (Omit<HastElement, 'children'> & { children: AuthoredChild[] })

const OPAQUE = new Set(['pre', 'a', 'script', 'style', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

function element(
  tagName: string,
  properties: Record<string, string | number>,
  children: HastChild[],
): HastElement {
  return { type: 'element', tagName, properties, children }
}

function text(value: string): HastText {
  return { type: 'text', value }
}

function tooltip(run: Extract<Run, { kind: 'term' }>, openLabel: string): HastElement {
  const parts: HastChild[] = [
    element('span', { className: 'au-term-kind' }, [text(run.term.kind)]),
    element('span', { className: 'au-term-title' }, [text(run.term.title)]),
  ]
  if (run.term.meta) {
    parts.push(element('span', { className: 'au-term-meta' }, [text(run.term.meta)]))
  }
  parts.push(element('span', { className: 'au-term-body' }, [text(run.term.text)]))
  if (run.term.href) {
    parts.push(element('span', { className: 'au-term-more' }, [text(openLabel)]))
  }
  return element('span', { 'data-tip': 'true', role: 'tooltip', className: 'au-term-tip' }, parts)
}

function termNode(run: Extract<Run, { kind: 'term' }>, openLabel: string): HastElement {
  const inner: HastChild[] = []
  if (run.term.icon) {
    inner.push(
      element(
        'span',
        {
          className: 'au-term-icon',
          'aria-hidden': 'true',
          style: `--au-term-glyph:url('/icons/${run.term.icon}.svg')`,
        },
        [],
      ),
    )
  }
  inner.push(element('span', { className: 'au-term-word' }, [text(run.text)]))
  inner.push(tooltip(run, openLabel))

  const pill = element(
    'span',
    {
      'data-term': 'true',
      tabIndex: 0,
      className: 'au-term',
      style: `--au-term-ink:${run.term.color}`,
    },
    inner,
  )
  if (!run.term.href) return pill
  return element('a', { href: run.term.href, className: 'au-term-link' }, [pill])
}

function runsToChildren(runs: Run[], marker: Marker): HastChild[] {
  return runs.map((run) => {
    if (run.kind === 'term') return termNode(run, marker.openLabel)
    if (run.kind === 'bold') return element('strong', {}, [text(run.text)])
    if (run.kind === 'italic') return element('em', {}, [text(run.text)])
    return text(run.text)
  })
}

function localeOf(path: string): Locale {
  return LOCALES.find((locale) => path.endsWith(`.${locale}.md`)) ?? DEFAULT_LOCALE
}

type Marker = {
  index: TermIndex
  openLabel: string
}

const ICON_DIRECTIVE = /:icon\[([a-z-]+:[a-z0-9-]+)\]\s?/g

function iconElement(source: string): HastElement {
  const viewBox = /viewBox="([^"]+)"/.exec(source)?.[1] ?? '0 0 512 512'
  const path = /<path[^>]*\sd="([^"]+)"/.exec(source)?.[1] ?? ''
  return element('svg', { className: 'au-slot-glyph', viewBox, 'aria-hidden': 'true' }, [
    element('path', { d: path, fill: 'currentColor' }, []),
  ])
}

function markIcons(node: HastParent, icons: Map<string, string>): void {
  const next: HastChild[] = []
  for (const child of node.children) {
    if (child.type !== 'text') {
      if (!OPAQUE.has(child.tagName)) markIcons(child, icons)
      next.push(child)
      continue
    }
    ICON_DIRECTIVE.lastIndex = 0
    if (!ICON_DIRECTIVE.test(child.value)) {
      next.push(child)
      continue
    }
    ICON_DIRECTIVE.lastIndex = 0
    let at = 0
    let match = ICON_DIRECTIVE.exec(child.value)
    while (match !== null) {
      if (match.index > at) next.push(text(child.value.slice(at, match.index)))
      const source = icons.get(match[1] as string)
      if (source) next.push(iconElement(source))
      at = match.index + match[0].length
      match = ICON_DIRECTIVE.exec(child.value)
    }
    if (at < child.value.length) next.push(text(child.value.slice(at)))
  }
  node.children = next
}

let iconCache: Promise<Map<string, string>> | undefined

async function iconSources(root: string): Promise<Map<string, string>> {
  if (!iconCache) {
    iconCache = (async () => {
      const out = new Map<string, string>()
      const base = resolve(root, 'data/media/icons')
      for (const set of await readdir(base).catch(() => [])) {
        for (const file of await readdir(join(base, set)).catch(() => [])) {
          if (!file.endsWith('.svg')) continue
          out.set(`${set}:${file.slice(0, -4)}`, await readFile(join(base, set, file), 'utf8'))
        }
      }
      return out
    })()
  }
  return iconCache
}

export function rehypeCodexTerms(root: string) {
  const markers = new Map<Locale, Promise<Marker>>()

  const markerFor = (locale: Locale): Promise<Marker> => {
    let value = markers.get(locale)
    if (!value) {
      value = readCorpus(root, locale).then(
        (built) => ({ index: built.terms, openLabel: strings(locale).openRef }),
        (error: unknown) => {
          markers.delete(locale)
          throw error
        },
      )
      markers.set(locale, value)
    }
    return value
  }

  return () =>
    async (tree: HastRoot, file: { path?: string; history?: string[] }): Promise<void> => {
      const path = file.path ?? file.history?.[0] ?? ''
      if (!path.includes('/data/')) return
      const marker = await markerFor(localeOf(path))
      markIcons(tree, await iconSources(root))

      const walk = (node: HastParent): void => {
        const next: HastChild[] = []
        for (const child of node.children) {
          if (child.type !== 'text') {
            if (!OPAQUE.has(child.tagName)) walk(child)
            next.push(child)
            continue
          }
          const runs = parseRuns(child.value, marker.index)
          if (runs.length === 1 && runs[0]?.kind === 'text') {
            next.push(child)
            continue
          }
          next.push(...runsToChildren(runs, marker))
        }
        node.children = next
      }

      walk(tree)
    }
}

const SOURCE_OPEN = ':source['
const CAPTION_OPEN = ':caption['
const BRACKET_CLOSE = ']'

function bracketed(children: HastChild[], open: string): HastChild[] | undefined {
  const first = children[0]
  const last = children.at(-1)
  if (first?.type !== 'text' || last?.type !== 'text') return undefined
  const head = first.value.trimStart()
  const tail = last.value.trimEnd()
  if (!head.startsWith(open) || !tail.endsWith(BRACKET_CLOSE)) return undefined
  if (first === last) {
    const value = first.value.trim().slice(open.length, -BRACKET_CLOSE.length)
    return value.trim() ? [text(value)] : undefined
  }
  return [
    text(head.slice(open.length)),
    ...children.slice(1, -1),
    text(tail.slice(0, -BRACKET_CLOSE.length)),
  ]
}

function captionedPicture(node: HastChild): HastChild {
  if (node.type !== 'element' || node.tagName !== 'p') return node
  const [picture, ...rest] = node.children
  if (picture?.type !== 'element' || picture.tagName !== 'img') return node
  const caption = bracketed(rest, CAPTION_OPEN)
  if (!caption) return node
  return element('figure', { className: 'au-prose__picture' }, [
    picture,
    element('figcaption', {}, caption),
  ])
}

export function rehypeProsePictureCaptions() {
  return (tree: HastRoot): void => {
    tree.children = tree.children.map(captionedPicture)
  }
}

export const CALLOUT_KINDS = ['principle', 'example'] as const

type CalloutKind = (typeof CALLOUT_KINDS)[number]

export const CALLOUT_MARK = /^\[!([A-Z]+)\][ \t]*/

function isCalloutKind(value: string | undefined): value is CalloutKind {
  return CALLOUT_KINDS.some((kind) => kind === value)
}

function calloutNote(blockquote: HastElement): HastElement | undefined {
  const first = blockquote.children.find((child): child is HastElement => child.type === 'element')
  const lead = first?.tagName === 'p' ? first.children[0] : undefined
  if (!first || lead?.type !== 'text') return undefined
  const match = CALLOUT_MARK.exec(lead.value)
  const kind = match?.[1]?.toLowerCase()
  if (!match || !isCalloutKind(kind)) return undefined
  const title = [text(lead.value.slice(match[0].length)), ...first.children.slice(1)]
  return element('div', { className: `au-callout au-callout--${kind}`, role: 'note' }, [
    element('p', { className: 'au-callout__title' }, title),
    ...blockquote.children.filter((child) => child !== first),
  ])
}

function quoteFigure(blockquote: HastElement): HastElement {
  const blocks = blockquote.children.filter(
    (child): child is HastElement => child.type === 'element',
  )
  const last = blocks.at(-1)
  const caption = last?.tagName === 'p' ? bracketed(last.children, SOURCE_OPEN) : undefined
  if (!caption) return element('figure', { className: 'au-quote' }, [blockquote])
  const quote = element(
    'blockquote',
    blockquote.properties,
    blockquote.children.filter((child) => child !== last),
  )
  return element('figure', { className: 'au-quote' }, [quote, element('figcaption', {}, caption)])
}

export function rehypeProseQuotes() {
  return (tree: HastRoot): void => {
    const wrap = (node: HastParent): void => {
      node.children = node.children.map((child) => {
        if (child.type === 'text') return child
        wrap(child)
        if (child.tagName !== 'blockquote') return child
        return calloutNote(child) ?? quoteFigure(child)
      })
    }

    wrap(tree)
  }
}

export function rehypeProseTables() {
  return (tree: HastRoot): void => {
    const wrap = (node: HastParent): void => {
      const next: HastChild[] = []
      for (const child of node.children) {
        if (child.type === 'text') {
          next.push(child)
          continue
        }
        wrap(child)
        if (child.tagName !== 'table') {
          next.push(child)
          continue
        }
        next.push(element('div', { className: 'au-prose__scroller', tabIndex: 0 }, [child]))
      }
      node.children = next
    }

    wrap(tree)
  }
}

const PORTRAIT_PICTURE = /-3_4-[a-z0-9_]+\.(?:png|jpg)$/

const SECTION_HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

function isBlank(node: HastChild): boolean {
  return node.type === 'text' && node.value.trim() === ''
}

function soloPicture(node: HastChild): HastElement | undefined {
  if (node.type !== 'element') return undefined
  const isCaptioned =
    node.tagName === 'figure' && node.properties['className'] === 'au-prose__picture'
  if (!isCaptioned && node.tagName !== 'p') return undefined
  const [only, ...rest] = node.children.filter((child) => !isBlank(child))
  if (only?.type !== 'element' || only.tagName !== 'img') return undefined
  return isCaptioned || rest.length === 0 ? only : undefined
}

function isPortraitPicture(node: HastChild): node is HastElement {
  const picture = soloPicture(node)
  return picture !== undefined && PORTRAIT_PICTURE.test(String(picture.properties['src'] ?? ''))
}

function isSectionHeading(node: HastChild): boolean {
  return node.type === 'element' && SECTION_HEADINGS.has(node.tagName)
}

export function rehypeProseSidePictures() {
  return (tree: HastRoot): void => {
    const next: HastChild[] = []
    let section: HastElement | undefined
    for (const child of tree.children) {
      if (isSectionHeading(child)) section = undefined
      if (isPortraitPicture(child)) {
        section = element('div', { className: 'au-prose__side' }, [child])
        next.push(section)
        continue
      }
      if (section) section.children.push(child)
      else next.push(child)
    }
    tree.children = next
  }
}

export const PICTURE_MASKS = ['torn', 'stone', 'rupture'] as const

type PictureMask = (typeof PICTURE_MASKS)[number]

function isPictureMask(value: string): value is PictureMask {
  return PICTURE_MASKS.some((mask) => mask === value)
}

export const PICTURE_RELIEFS = ['torch', 'drift', 'lift'] as const

type PictureRelief = (typeof PICTURE_RELIEFS)[number]

function isPictureRelief(value: string): value is PictureRelief {
  return PICTURE_RELIEFS.some((relief) => relief === value)
}

export type PictureLook = { mask: PictureMask; relief: PictureRelief | undefined }

export function pictureLook(title: string, source: string): PictureLook {
  const [mask = '', relief, ...rest] = title.trim().split(/\s+/)
  if (!isPictureMask(mask)) {
    throw new Error(
      `${source} asks for the mask "${mask}", which is none of ${PICTURE_MASKS.join(', ')}`,
    )
  }
  if (rest.length > 0 || (relief !== undefined && !isPictureRelief(relief))) {
    throw new Error(
      `${source} asks for the relief "${[relief, ...rest].join(' ')}", which is none of ${PICTURE_RELIEFS.join(', ')}`,
    )
  }
  return { mask, relief }
}

const PICTURE_RATIO = /-(\d{1,2}_\d{1,2})-[a-z0-9_]+\.(?:png|jpg)$/

function maskPicture(picture: HastElement): HastElement {
  const { title, ...properties } = picture.properties
  if (title === undefined) return picture
  const source = String(properties['src'])
  const { mask, relief } = pictureLook(String(title), source)
  const ratio = PICTURE_RATIO.exec(source)?.[1]
  const shape = { 'data-mask': mask, ...(ratio ? { 'data-ratio': ratio } : {}) }
  const masked: HastElement = { ...picture, properties: { ...properties, ...shape } }
  if (relief === undefined) return masked
  return element('span', { className: 'au-prose__relief', 'data-relief': relief, ...shape }, [
    masked,
  ])
}

export function rehypeProsePictureMasks() {
  return (tree: HastRoot): void => {
    const visit = (node: HastParent): void => {
      node.children = node.children.map((child) => {
        if (child.type === 'text') return child
        visit(child)
        return child.tagName === 'img' ? maskPicture(child) : child
      })
    }

    visit(tree)
  }
}

const HTML_COMMENT = /^\s*<!--(?:(?!-->)[\s\S])*-->\s*$/

function isComment(node: AuthoredChild): boolean {
  return node.type === 'comment' || (node.type === 'raw' && HTML_COMMENT.test(node.value))
}

export function rehypeDropComments() {
  return (tree: { type: 'root'; children: AuthoredChild[] }): void => {
    const kept = (children: AuthoredChild[]): AuthoredChild[] =>
      children.flatMap((child) => {
        if (isComment(child)) return []
        if (child.type === 'element') child.children = kept(child.children)
        return [child]
      })
    tree.children = kept(tree.children)
  }
}
