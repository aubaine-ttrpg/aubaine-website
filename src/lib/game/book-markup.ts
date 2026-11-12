import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import {
  ALMANACH_FIT,
  ALMANACH_STYLE_ID,
  isPortraitSource,
  pictureRatio,
} from '../art-effect/almanach-look.ts'
import {
  FRAME_KINDS,
  FRAMES,
  type FrameKind,
  GLAZED_FRAME,
  isFrameKind,
} from '../art-effect/presets.ts'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '../i18n/locales.ts'
import { strings } from '../i18n/strings.ts'
import { KEY_INK } from '../key-colour.ts'
import { fitLetters } from '../plates.ts'
import { readCorpus } from './fs-sources.ts'
import { parseRuns, type Run, type TermIndex } from './richtext.ts'

type HastText = { type: 'text'; value: string }
type HastElement = {
  type: 'element'
  tagName: string
  properties: Record<string, string | number | number[]>
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
const GLYPH_OPAQUE = new Set(['pre', 'a', 'script', 'style'])

function element(
  tagName: string,
  properties: HastElement['properties'],
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
const GLYPH_CLASS = 'au-slot-glyph'

export function withoutIcons(markdown: string): string {
  return markdown.replace(ICON_DIRECTIVE, '')
}

function iconElement(source: string): HastElement {
  const viewBox = /viewBox="([^"]+)"/.exec(source)?.[1] ?? '0 0 512 512'
  const path = /<path[^>]*\sd="([^"]+)"/.exec(source)?.[1] ?? ''
  return element('svg', { className: GLYPH_CLASS, viewBox, 'aria-hidden': 'true' }, [
    element('path', { d: path, fill: 'currentColor' }, []),
  ])
}

function markIcons(node: HastParent, icons: Map<string, string>): void {
  const next: HastChild[] = []
  for (const child of node.children) {
    if (child.type !== 'text') {
      if (!GLYPH_OPAQUE.has(child.tagName)) markIcons(child, icons)
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

function guillemetsHeld(children: HastChild[]): HastChild[] {
  return children.map((child) =>
    child.type === 'text'
      ? text(child.value.replace(/« +/g, '«\u00a0').replace(/ +»/g, '\u00a0»'))
      : child,
  )
}

function captionedPicture(node: HastChild): HastChild {
  if (node.type !== 'element' || node.tagName !== 'p') return node
  const [picture, ...rest] = node.children
  if (picture?.type !== 'element' || picture.tagName !== 'img') return node
  const caption = bracketed(rest, CAPTION_OPEN)
  if (!caption) return node
  return element('figure', { className: 'au-prose__picture' }, [
    picture,
    element('figcaption', {}, guillemetsHeld(caption)),
  ])
}

export function rehypeProsePictureCaptions() {
  return (tree: HastRoot): void => {
    tree.children = tree.children.map(captionedPicture)
  }
}

export const CALLOUT_KINDS = ['principle', 'example', 'tip'] as const

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

const SPEAKER_COLON = /\s*:\s*$/
const OPENING_MARK = /^[«“"][\s\u00a0\u202f]*/
const CLOSING_MARK = /[\s\u00a0\u202f]*[»”"]$/
const MARK_CLASS = 'au-quote__mark'
const BOX_CLASS = 'au-quote__box'
const PORTRAIT_CLASS = 'au-quote__portrait'
const PORTRAIT_WIDTHS = [168, 336, 504]
const PORTRAIT_SIZES = '(width < 40rem) 80px, 168px'

export const TITLE_CORNERS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const

type TitleCorner = (typeof TITLE_CORNERS)[number]

function isTitleCorner(value: string): value is TitleCorner {
  return TITLE_CORNERS.some((corner) => corner === value)
}

export const QUOTE_BACKINGS = ['tranche', 'echo'] as const

type QuoteBacking = (typeof QUOTE_BACKINGS)[number]

function isQuoteBacking(value: string): value is QuoteBacking {
  return QUOTE_BACKINGS.some((backing) => backing === value)
}

type Staging = { corner: TitleCorner; backing: QuoteBacking }

const DEFAULT_STAGING: Staging = { corner: 'top-left', backing: 'tranche' }

const NAMED_STAGING = /\]\{([^{}]*)\}$/

type Speaker = { label: HastElement; colon: string }

function plainText(node: HastChild): string {
  return node.type === 'text' ? node.value : node.children.map(plainText).join('')
}

function isPortrait(child: HastChild): child is HastElement {
  return child.type === 'element' && child.tagName === 'img'
}

function speakerOf(paragraph: HastElement): Speaker | undefined {
  const label = paragraph.children.find((child) => !isBlank(child) && !isPortrait(child))
  if (label?.type !== 'element' || label.tagName !== 'strong') return undefined
  const last = label.children.at(-1)
  const colon = last?.type === 'text' ? SPEAKER_COLON.exec(last.value)?.[0] : undefined
  return colon ? { label, colon } : undefined
}

function nameOf({ label, colon }: Speaker): string {
  return plainText(label).slice(0, -colon.length).trim()
}

function tagSpeaker({ label, colon }: Speaker): void {
  const last = label.children.at(-1)
  if (last?.type !== 'text') throw new Error('a speaker label lost the colon it was read with')
  const name = [...label.children.slice(0, -1), text(last.value.slice(0, -colon.length))]
  label.children = [
    element('span', { className: 'au-quote__name' }, name),
    element('span', { className: 'au-quote__colon' }, [text(colon)]),
  ]
}

function markEdge(nodes: HastChild[], edge: 'first' | 'last', pattern: RegExp): HastChild[] {
  const at = edge === 'first' ? nodes.findIndex((node) => !isBlank(node)) : nodes.length - 1
  const node = nodes[at]
  if (node === undefined) return nodes
  if (node.type === 'element') {
    if (node.tagName === 'strong' || node.properties['className'] === BOX_CLASS) return nodes
    const children = markEdge(node.children, edge, pattern)
    if (children === node.children) return nodes
    return nodes.with(at, { ...node, children })
  }
  const value = edge === 'first' ? node.value.trimStart() : node.value.trimEnd()
  const found = pattern.exec(value)?.[0]
  if (!found) return nodes
  const mark = element('span', { className: MARK_CLASS }, [text(found)])
  if (edge === 'first') {
    const lead = node.value.slice(0, node.value.length - value.length)
    const parts = [text(lead), mark, text(value.slice(found.length))]
    return nodes.toSpliced(at, 1, ...parts.filter((part) => part.type !== 'text' || part.value))
  }
  const trail = node.value.slice(value.length)
  const parts = [text(value.slice(0, -found.length)), mark, text(trail)]
  return nodes.toSpliced(at, 1, ...parts.filter((part) => part.type !== 'text' || part.value))
}

function opened(paragraph: HastElement, speaker: Speaker | undefined): HastElement {
  if (!speaker)
    return { ...paragraph, children: markEdge(paragraph.children, 'first', OPENING_MARK) }
  const at = paragraph.children.indexOf(speaker.label)
  const head = paragraph.children.slice(0, at + 1)
  const tail = markEdge(paragraph.children.slice(at + 1), 'first', OPENING_MARK)
  return { ...paragraph, children: [...head, ...tail] }
}

function closed(paragraph: HastElement): HastElement {
  return { ...paragraph, children: markEdge(paragraph.children, 'last', CLOSING_MARK) }
}

function boxed(children: HastChild[]): HastChild[] {
  return [element('span', { className: BOX_CLASS, 'aria-hidden': 'true' }, []), ...children]
}

function portrayed(children: HastChild[]): HastChild[] {
  const at = children.findIndex((child) => !isBlank(child))
  const portrait = children[at]
  if (portrait === undefined || !isPortrait(portrait)) return boxed(children)
  const sized = {
    ...portrait,
    properties: { ...portrait.properties, widths: PORTRAIT_WIDTHS, sizes: PORTRAIT_SIZES },
  }
  return [
    element('span', { className: PORTRAIT_CLASS }, [sized]),
    ...boxed(children.toSpliced(at, 1)),
  ]
}

function isParagraph(child: HastChild): child is HastElement {
  return child.type === 'element' && child.tagName === 'p'
}

function dialogueOf(blocks: HastChild[]): HastChild[] {
  const speakers = new Map<string, number>()
  return blocks.map((child) => {
    if (!isParagraph(child)) return child
    const speaker = speakerOf(child)
    if (!speaker) return child
    const name = nameOf(speaker)
    const index = speakers.get(name) ?? speakers.size
    speakers.set(name, index)
    const turn = closed(opened(child, speaker))
    tagSpeaker(speaker)
    return {
      ...turn,
      properties: { ...turn.properties, 'data-speaker': index },
      children: portrayed(turn.children),
    }
  })
}

function speechOf(blocks: HastChild[]): HastChild[] {
  const paragraphs = blocks.filter(isParagraph)
  const first = paragraphs[0]
  const last = paragraphs.at(-1)
  return boxed(
    blocks.map((child) => {
      if (!isParagraph(child)) return child
      const speaker = speakerOf(child)
      const line = child === first ? opened(child, speaker) : child
      const marked = child === last ? closed(line) : line
      if (!speaker) return marked
      tagSpeaker(speaker)
      return { ...marked, properties: { ...marked.properties, 'data-speaker': 0 } }
    }),
  )
}

function isTurn(child: HastChild): boolean {
  return isParagraph(child) && speakerOf(child) !== undefined
}

function stagingOf(words: string, source: string): Staging {
  const [corner = '', backing, ...rest] = words.trim().split(/\s+/)
  if (!isTitleCorner(corner)) {
    throw new Error(
      `${source} places a quote's title at "${corner}", which is none of ${TITLE_CORNERS.join(', ')}`,
    )
  }
  if (rest.length > 0 || (backing !== undefined && !isQuoteBacking(backing))) {
    throw new Error(
      `${source} backs a quote with "${[backing, ...rest].join(' ')}", which is none of ${QUOTE_BACKINGS.join(', ')}`,
    )
  }
  return { corner, backing: backing ?? DEFAULT_STAGING.backing }
}

function stagedLine(
  paragraph: HastElement,
  source: string,
): { staging: Staging | undefined; children: HastChild[] } {
  const last = paragraph.children.at(-1)
  const named = last?.type === 'text' ? NAMED_STAGING.exec(last.value.trimEnd()) : null
  if (!named || last?.type !== 'text') return { staging: undefined, children: paragraph.children }
  const value = last.value.trimEnd()
  const kept = text(value.slice(0, value.length - named[0].length) + BRACKET_CLOSE)
  return {
    staging: stagingOf(named[1] ?? '', source),
    children: [...paragraph.children.slice(0, -1), kept],
  }
}

function isTitleBelow({ corner }: Staging): boolean {
  return corner === 'bottom-left' || corner === 'bottom-right'
}

function quoteFigure(blockquote: HastElement, source: string): HastElement {
  const blocks = blockquote.children.filter(
    (child): child is HastElement => child.type === 'element',
  )
  const last = blocks.at(-1)
  const staged = last?.tagName === 'p' ? stagedLine(last, source) : undefined
  const caption = staged ? bracketed(staged.children, SOURCE_OPEN) : undefined
  if (staged?.staging && !caption) {
    throw new Error(
      `${source} places a title at "${staged.staging.corner}" on a line that is no source`,
    )
  }
  const staging = staged?.staging ?? DEFAULT_STAGING
  const spoken = blockquote.children.filter((child) => !caption || child !== last)
  const dialogue = spoken.filter(isTurn).length > 1
  const children = dialogue ? dialogueOf(spoken) : speechOf(spoken)
  const figure = {
    className: 'au-quote',
    'data-quote': dialogue ? 'dialogue' : 'speech',
    'data-backing': staging.backing,
    ...(caption ? { 'data-title-corner': staging.corner } : {}),
  }
  const quote = element('blockquote', blockquote.properties, children)
  if (!caption) return element('figure', figure, [quote])
  const title = element('figcaption', {}, caption)
  return element('figure', figure, isTitleBelow(staging) ? [quote, title] : [title, quote])
}

export function rehypeProseQuotes() {
  return (tree: HastRoot, file?: { path?: string; history?: string[] }): void => {
    const source = file?.path ?? file?.history?.[0] ?? 'a prose file'
    const wrap = (node: HastParent): void => {
      node.children = node.children.map((child) => {
        if (child.type === 'text') return child
        wrap(child)
        if (child.tagName !== 'blockquote') return child
        return calloutNote(child) ?? quoteFigure(child, source)
      })
    }

    wrap(tree)
  }
}

export const HEAD_CLASS = 'au-head'
export const FRAME_CLASS = 'au-frame'
export const FRAME_FACE_CLASS = 'au-frame__face'
export const FRAME_ICON_CLASS = 'au-frame__icon'
export const UNSET_PICTOGRAM = '?'

const HEAD_LEVELS: Record<string, string> = { h2: '2', h3: '3' }
const HEAD_PADDING = 1.6

export function headFit(title: string): string {
  return `--fit-letters:${fitLetters([title], HEAD_PADDING)}`
}

function textOf(node: HastChild): string {
  return node.type === 'text' ? node.value : node.children.map(textOf).join('')
}

function unsetFrame(): HastElement {
  return element('span', { className: FRAME_CLASS, 'data-face': 'unset', 'aria-hidden': 'true' }, [
    element('span', { className: FRAME_FACE_CLASS }, [text(UNSET_PICTOGRAM)]),
  ])
}

function iconFrame(glyph: HastElement): HastElement {
  const pictogram = { ...glyph, properties: { ...glyph.properties, className: FRAME_ICON_CLASS } }
  return element(
    'span',
    {
      className: FRAME_CLASS,
      'data-face': 'icon',
      'aria-hidden': 'true',
      style: `--frame-ink:${KEY_INK}`,
    },
    [element('span', { className: FRAME_FACE_CLASS }, [pictogram])],
  )
}

function leadingGlyph(heading: HastElement): HastElement | undefined {
  const first = heading.children.find((child) => !isBlank(child))
  const isGlyph =
    first?.type === 'element' &&
    first.tagName === 'svg' &&
    first.properties['className'] === GLYPH_CLASS
  return isGlyph ? first : undefined
}

function headed(heading: HastElement, level: string): HastElement {
  const glyph = leadingGlyph(heading)
  const title = glyph
    ? { ...heading, children: heading.children.filter((child) => child !== glyph) }
    : heading
  return element(
    'div',
    { className: HEAD_CLASS, 'data-level': level, style: headFit(textOf(title)) },
    [glyph ? iconFrame(glyph) : unsetFrame(), title],
  )
}

export function rehypeProseHeadings() {
  return (tree: HastRoot): void => {
    tree.children = tree.children.map((child) => {
      const level = child.type === 'element' ? HEAD_LEVELS[child.tagName] : undefined
      return child.type === 'element' && level !== undefined ? headed(child, level) : child
    })
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

const SECTION_HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
const SIDE_WIDTHS = [352, 704, 1056]
const SIDE_SIZES = '(width < 48rem) 22rem, 22.25rem'

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
  return picture !== undefined && isPortraitSource(String(picture.properties['src'] ?? ''))
}

function isSectionHeading(node: HastChild): boolean {
  return node.type === 'element' && SECTION_HEADINGS.has(node.tagName)
}

function sizedSidePicture(holder: HastElement): HastElement {
  return {
    ...holder,
    children: holder.children.map((child) =>
      child.type === 'element' && child.tagName === 'img'
        ? { ...child, properties: { ...child.properties, widths: SIDE_WIDTHS, sizes: SIDE_SIZES } }
        : child,
    ),
  }
}

export function rehypeProseSidePictures() {
  return (tree: HastRoot): void => {
    const next: HastChild[] = []
    let section: HastElement | undefined
    for (const child of tree.children) {
      if (isSectionHeading(child)) section = undefined
      if (isPortraitPicture(child)) {
        section = element('div', { className: 'au-prose__side' }, [sizedSidePicture(child)])
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

export const GLAZED_PICTURE = 'glazed'

export const ALMANACH_PICTURE = 'almanach'

export const MIRRORED_PICTURE = 'mirrored'

export type PictureLook =
  | { kind: 'masked'; mask: PictureMask; relief: PictureRelief | undefined }
  | { kind: 'glazed'; frame: FrameKind }
  | {
      kind: 'almanach'
      style: string | undefined
      focus: readonly [number, number] | undefined
      mirrored: boolean
    }

const FOCUS_PERCENT = /^(\d{1,3})%$/

function focusShare(word: string | undefined): number | undefined {
  const percent = Number(FOCUS_PERCENT.exec(word ?? '')?.[1])
  return Number.isInteger(percent) && percent <= 100 ? percent / 100 : undefined
}

function almanachLook(title: string, source: string, words: readonly string[]): PictureLook {
  const mirrored = words.at(-1) === MIRRORED_PICTURE
  const placed = mirrored ? words.slice(0, -1) : words
  const x = focusShare(placed.at(-2))
  const y = focusShare(placed.at(-1))
  const focus = x === undefined || y === undefined ? undefined : ([x, y] as const)
  const [style, ...rest] = focus ? placed.slice(0, -2) : placed
  if (rest.length > 0 || (style !== undefined && !ALMANACH_STYLE_ID.test(style))) {
    throw new Error(
      `${source} asks for "${title.trim()}", but an ${ALMANACH_PICTURE} picture takes at most the name of an almanach style, then the point it keeps in view such as "50% 20%", then "${MIRRORED_PICTURE}"`,
    )
  }
  if (isPortraitSource(source)) {
    throw new Error(
      `${source} is a portrait, which the wide tube of an ${ALMANACH_PICTURE} would crop to a strip`,
    )
  }
  return { kind: 'almanach', style, focus, mirrored }
}

function glazedLook(
  title: string,
  source: string,
  frame: string | undefined,
  rest: readonly string[],
): PictureLook {
  if (frame === undefined) return { kind: 'glazed', frame: GLAZED_FRAME }
  if (rest.length > 0 || !isFrameKind(frame)) {
    throw new Error(
      `${source} asks for "${title.trim()}", but a ${GLAZED_PICTURE} picture takes at most one word after it, one of the frames ${FRAME_KINDS.join(', ')}`,
    )
  }
  return { kind: 'glazed', frame }
}

export function pictureLook(title: string, source: string): PictureLook {
  const words = title.trim().split(/\s+/)
  const [first = '', second, ...rest] = words
  if (first === GLAZED_PICTURE) return glazedLook(title, source, second, rest)
  if (first === ALMANACH_PICTURE) return almanachLook(title, source, words.slice(1))
  if (!isPictureMask(first)) {
    throw new Error(
      `${source} asks for the look "${first}", which is none of ${[...PICTURE_MASKS, GLAZED_PICTURE, ALMANACH_PICTURE].join(', ')}`,
    )
  }
  if (rest.length > 0 || (second !== undefined && !isPictureRelief(second))) {
    throw new Error(
      `${source} asks for the relief "${[second, ...rest].join(' ')}", which is none of ${PICTURE_RELIEFS.join(', ')}`,
    )
  }
  return { kind: 'masked', mask: first, relief: second }
}

function frameStyle(frame: FrameKind): string {
  const { slice, width } = FRAMES[frame]
  return [
    `--au-frame-slice:${slice.top} ${slice.right} ${slice.bottom} ${slice.left}`,
    `--au-frame-share:${((100 * slice.left) / width).toFixed(4)}`,
  ].join(';')
}

function glazePicture(
  picture: HastElement,
  ratio: string | undefined,
  frame: FrameKind,
): HastElement {
  const glass = element(
    'span',
    {
      className: 'au-prose__relief',
      'data-relief': 'glass',
      ...(ratio ? { 'data-ratio': ratio } : {}),
    },
    [picture],
  )
  const moulding = element('span', { className: 'au-prose__moulding' }, [glass])
  return element(
    'span',
    { className: 'au-prose__frame', 'data-frame': frame, style: frameStyle(frame) },
    [moulding],
  )
}

function almanachPicture(
  picture: HastElement,
  look: Extract<PictureLook, { kind: 'almanach' }>,
): HastElement {
  const shown = {
    ...picture,
    properties: {
      ...picture.properties,
      'data-almanach-picture': '',
      'data-fit': ALMANACH_FIT,
      ...(look.focus === undefined
        ? {}
        : {
            'data-focus': look.focus.join(' '),
            style: `object-position:${look.focus.map((share) => `${Math.round(share * 100)}%`).join(' ')}`,
          }),
      ...(look.mirrored ? { 'data-mirrored': '' } : {}),
    },
  }
  return element(
    'span',
    {
      className: 'au-almanach__stage',
      'data-almanach': '',
      ...(look.style === undefined ? {} : { 'data-almanach-style': look.style }),
    },
    [shown],
  )
}

function maskPicture(picture: HastElement): HastElement {
  const { title, ...properties } = picture.properties
  if (title === undefined) return picture
  const source = String(properties['src'])
  const look = pictureLook(String(title), source)
  const ratio = pictureRatio(source)
  switch (look.kind) {
    case 'glazed':
      return glazePicture({ ...picture, properties }, ratio, look.frame)
    case 'almanach':
      return almanachPicture({ ...picture, properties }, look)
    case 'masked':
      return maskedPicture({ ...picture, properties }, look, ratio)
  }
}

function maskedPicture(
  picture: HastElement,
  look: Extract<PictureLook, { kind: 'masked' }>,
  ratio: string | undefined,
): HastElement {
  const { properties } = picture
  const { mask, relief } = look
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
