import { describe, expect, it } from 'vitest'

import {
  FRAME_CLASS,
  FRAME_FACE_CLASS,
  FRAME_ICON_CLASS,
  HEAD_CLASS,
  headFit,
  rehypeProseHeadings,
  UNSET_PICTOGRAM,
} from '../../src/lib/game/book-markup'
import { KEY_INK } from '../../src/lib/key-colour'

type Root = Parameters<ReturnType<typeof rehypeProseHeadings>>[0]
type Child = Root['children'][number]
type Element = Extract<Child, { type: 'element' }>

const text = (value: string): Child => ({ type: 'text', value })
const element = (tagName: string, children: Child[], id?: string): Element => ({
  type: 'element',
  tagName,
  properties: id === undefined ? {} : { id },
  children,
})

function headed(...children: Child[]): Child[] {
  const tree: Root = { type: 'root', children }
  rehypeProseHeadings()(tree)
  return tree.children
}

function asElement(child: Child | undefined): Element {
  if (child?.type !== 'element') throw new Error('expected an element')
  return child
}

function textOf(child: Child): string {
  return child.type === 'text' ? child.value : child.children.map(textOf).join('')
}

describe('rehypeProseHeadings', () => {
  it('wraps a section title with an unset pictogram frame before it', () => {
    const title = element('h2', [text('La Venue')], 'la-venue')
    const wrapper = asElement(headed(title)[0])
    expect(wrapper.tagName).toBe('div')
    expect(wrapper.properties).toEqual({
      className: HEAD_CLASS,
      'data-level': '2',
      style: headFit('La Venue'),
    })
    const [frame, heading] = wrapper.children.map(asElement)
    expect(frame?.properties).toEqual({
      className: FRAME_CLASS,
      'data-face': 'unset',
      'aria-hidden': 'true',
    })
    expect(asElement(frame?.children[0]).properties).toEqual({ className: FRAME_FACE_CLASS })
    expect(textOf(asElement(frame))).toBe(UNSET_PICTOGRAM)
    expect(heading).toBe(title)
  })

  it('gives a subsection title the same frame at its own level', () => {
    const subsection = element('h3', [text('Nouvelle-Aubaine')])
    const wrapper = asElement(headed(subsection)[0])
    expect(wrapper.properties['data-level']).toBe('3')
    expect(textOf(asElement(wrapper.children[0]))).toBe(UNSET_PICTOGRAM)
    expect(wrapper.children[1]).toBe(subsection)
  })

  it('moves an icon that leads a title into its frame, inked in the key colour', () => {
    const glyph = element('svg', [element('path', [])])
    glyph.properties = { className: 'au-slot-glyph', viewBox: '0 0 512 512', 'aria-hidden': 'true' }
    const title = element('h2', [glyph, text('La Venue')], 'la-venue')
    const wrapper = asElement(headed(title)[0])
    const [frame, heading] = wrapper.children.map(asElement)
    expect(frame?.properties).toEqual({
      className: FRAME_CLASS,
      'data-face': 'icon',
      'aria-hidden': 'true',
      style: `--frame-ink:${KEY_INK}`,
    })
    const pictogram = asElement(asElement(frame?.children[0]).children[0])
    expect(pictogram.tagName).toBe('svg')
    expect(pictogram.properties['className']).toBe(FRAME_ICON_CLASS)
    expect(pictogram.properties['viewBox']).toBe('0 0 512 512')
    expect(heading?.children).toEqual([text('La Venue')])
    expect(heading?.properties).toEqual({ id: 'la-venue' })
    expect(wrapper.properties['style']).toBe(headFit('La Venue'))
  })

  it('keeps an icon inside the title when words come before it', () => {
    const glyph = element('svg', [])
    glyph.properties = { className: 'au-slot-glyph' }
    const title = element('h2', [text('Le '), glyph, text('signe')])
    const [frame, heading] = asElement(headed(title)[0]).children.map(asElement)
    expect(frame?.properties['data-face']).toBe('unset')
    expect(heading).toBe(title)
  })

  it('leaves the title, its text and its id untouched, so anchors and the side list hold', () => {
    const title = element('h2', [text('Les Oracles')], 'les-oracles')
    const heading = asElement(asElement(headed(title)[0]).children[1])
    expect(heading).toBe(title)
    expect(textOf(heading)).toBe('Les Oracles')
    expect(heading.properties).toEqual({ id: 'les-oracles' })
  })

  it('leaves titles inside a quote or a callout alone', () => {
    const quoted = element('h2', [text('Dans la citation')])
    const figure = element('figure', [element('blockquote', [quoted])])
    const callout = element('div', [element('h3', [text('Dans la note')])])
    expect(headed(figure, callout)).toEqual([figure, callout])
  })

  it('leaves the other blocks and their order as they were', () => {
    const paragraph = element('p', [text('Un paragraphe.')])
    const list = element('ul', [element('li', [text('Un point.')])])
    const heads = headed(paragraph, element('h2', [text('Titre')]), list)
    expect(heads[0]).toBe(paragraph)
    expect(asElement(heads[1]).properties['className']).toBe(HEAD_CLASS)
    expect(heads[2]).toBe(list)
  })

  it('sizes each title from its own longest word', () => {
    const short = asElement(headed(element('h2', [text('Noms')]))[0])
    const long = asElement(headed(element('h2', [text('Les six Caractéristiques')]))[0])
    expect(short.properties['style']).toBe(headFit('Noms'))
    expect(long.properties['style']).toBe(headFit('Caractéristiques'))
    expect(short.properties['style']).not.toBe(long.properties['style'])
  })
})
