import { describe, expect, it } from 'vitest'

import { rehypeProseQuotes } from '../../src/lib/game/book-markup'

type Root = Parameters<ReturnType<typeof rehypeProseQuotes>>[0]
type Child = Root['children'][number]
type Element = Extract<Child, { type: 'element' }>

const text = (value: string): Child => ({ type: 'text', value })
const element = (tagName: string, children: Child[]): Element => ({
  type: 'element',
  tagName,
  properties: {},
  children,
})

function figureOf(...paragraphs: Child[][]): Element {
  const tree: Root = {
    type: 'root',
    children: [
      element(
        'blockquote',
        paragraphs.map((runs) => element('p', runs)),
      ),
    ],
  }
  rehypeProseQuotes()(tree)
  const figure = tree.children[0]
  if (figure?.type !== 'element') throw new Error('the quote left no element behind')
  return figure
}

function elementAt(parent: Element, index: number): Element {
  const child = parent.children[index]
  if (child?.type !== 'element') throw new Error(`no element at ${index}`)
  return child
}

const textOf = (node: Child): string =>
  node.type === 'text' ? node.value : node.children.map(textOf).join('')

describe('prose quotes', () => {
  it('lifts a closing source out of the quote into a caption', () => {
    const figure = figureOf([text('« Vois ces stèles. »')], [text(':source[Arsenault]')])
    expect(figure.tagName).toBe('figure')
    expect(figure.properties['className']).toBe('au-quote')
    expect(elementAt(figure, 0).tagName).toBe('blockquote')
    expect(textOf(elementAt(figure, 0))).toBe('« Vois ces stèles. »')
    expect(elementAt(figure, 1).tagName).toBe('figcaption')
    expect(textOf(elementAt(figure, 1))).toBe('Arsenault')
  })

  it('keeps inline formatting inside the caption', () => {
    const figure = figureOf(
      [text('« Paix. »')],
      [text(':source['), element('strong', [text('Arsenault')]), text(']')],
    )
    const caption = elementAt(figure, 1)
    expect(elementAt(caption, 1).tagName).toBe('strong')
    expect(textOf(caption)).toBe('Arsenault')
  })

  it('frames a quote with no source and leaves every paragraph in it', () => {
    const figure = figureOf([text('« Un. »')], [text('« Deux. »')])
    expect(figure.tagName).toBe('figure')
    expect(figure.children).toHaveLength(1)
    expect(elementAt(figure, 0).children).toHaveLength(2)
  })

  it('ignores a source that is not the closing paragraph', () => {
    const figure = figureOf([text(':source[Arsenault]')], [text('« Paix. »')])
    expect(figure.children).toHaveLength(1)
    expect(textOf(figure)).toContain(':source[Arsenault]')
  })
})
