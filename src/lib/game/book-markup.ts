import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

import { DEFAULT_LOCALE, LOCALES, type Locale } from '../i18n/locales.ts'
import { pathFor } from '../i18n/routes.ts'
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

const OPAQUE = new Set(['code', 'pre', 'a', 'script', 'style', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

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

function runsToChildren(runs: Run[], marker: Marker, seen: Set<string>): HastChild[] {
  return runs.map((run) => {
    if (run.kind === 'term') {
      if (!marker.glossed.has(run.term.kind)) return termNode(run, marker.openLabel)
      if (seen.has(run.term.title)) return text(run.text)
      seen.add(run.term.title)
      return termNode(run, marker.openLabel)
    }
    if (run.kind === 'bold') return element('strong', {}, [text(run.text)])
    if (run.kind === 'ref') {
      return element('a', { href: run.href, className: 'au-term-plain' }, [text(run.text)])
    }
    return text(run.text)
  })
}

function localeOf(path: string): Locale {
  return LOCALES.find((locale) => path.endsWith(`.${locale}.md`)) ?? DEFAULT_LOCALE
}

type Marker = {
  index: TermIndex
  rulesHref: string
  openLabel: string
  glossed: Set<string>
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
      value = readCorpus(root, locale).then((built) => ({
        index: built.terms,
        rulesHref: pathFor('rules', locale),
        openLabel: strings(locale).openRef,
        glossed: new Set([
          strings(locale).ruleTerm,
          strings(locale).characteristic,
          strings(locale).aptitude,
        ]),
      }))
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
      if (!marker.index.pattern) return

      const options = { rulesHref: marker.rulesHref, resolveReference: (): null => null }
      const seen = new Set<string>()

      const walk = (node: HastParent): void => {
        const next: HastChild[] = []
        for (const child of node.children) {
          if (child.type !== 'text') {
            if (!OPAQUE.has(child.tagName)) walk(child)
            next.push(child)
            continue
          }
          const runs = parseRuns(child.value, marker.index, options)
          if (runs.length === 1 && runs[0]?.kind === 'text') {
            next.push(child)
            continue
          }
          next.push(...runsToChildren(runs, marker, seen))
        }
        node.children = next
      }

      walk(tree)
    }
}

const SOURCE_OPEN = ':source['
const SOURCE_CLOSE = ']'

function sourceCaption(paragraph: HastElement): HastChild[] | undefined {
  const first = paragraph.children[0]
  const last = paragraph.children.at(-1)
  if (first?.type !== 'text' || last?.type !== 'text') return undefined
  if (!first.value.startsWith(SOURCE_OPEN) || !last.value.endsWith(SOURCE_CLOSE)) return undefined
  if (first === last) {
    const value = first.value.slice(SOURCE_OPEN.length, -SOURCE_CLOSE.length)
    return value.trim() ? [text(value)] : undefined
  }
  return [
    text(first.value.slice(SOURCE_OPEN.length)),
    ...paragraph.children.slice(1, -1),
    text(last.value.slice(0, -SOURCE_CLOSE.length)),
  ]
}

function quoteFigure(blockquote: HastElement): HastElement {
  const blocks = blockquote.children.filter(
    (child): child is HastElement => child.type === 'element',
  )
  const last = blocks.at(-1)
  const caption = last?.tagName === 'p' ? sourceCaption(last) : undefined
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
        return child.tagName === 'blockquote' ? quoteFigure(child) : child
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
