import { describe, expect, it } from 'vitest'

import { rehypeProseSidePictures } from '../../src/lib/game/book-markup'

type Root = Parameters<ReturnType<typeof rehypeProseSidePictures>>[0]
type Child = Root['children'][number]
type Element = Extract<Child, { type: 'element' }>

const text = (value: string): Child => ({ type: 'text', value })
const element = (
  tagName: string,
  children: Child[],
  properties: Element['properties'] = {},
): Element => ({ type: 'element', tagName, properties, children })
const picture = (file: string): Element =>
  element('p', [element('img', [], { src: `../../media/art/${file}`, alt: '' })])
const paragraph = (value: string): Element => element('p', [text(value)])

function laidOut(...children: Child[]): Child[] {
  const tree: Root = { type: 'root', children }
  rehypeProseSidePictures()(tree)
  return tree.children
}

const elements = (children: Child[]): Element[] =>
  children.filter((child): child is Element => child.type === 'element')

const textOf = (node: Child): string =>
  node.type === 'text' ? node.value : node.children.map(textOf).join('')

describe('prose side pictures', () => {
  it('gathers a 3:4 picture and the text that follows it into one section', () => {
    const [heading, side] = elements(
      laidOut(
        element('h2', [text('Au carrefour')]),
        text('\n'),
        picture('nnor-marchand-3_4-og.png'),
        text('\n'),
        paragraph('Les Nnors apprennent à négocier.'),
        text('\n'),
        paragraph('Leurs caravanes ménagent les sentiers.'),
      ),
    )
    expect(heading?.tagName).toBe('h2')
    expect(side?.properties['className']).toBe('au-prose__side')
    const [image, ...paragraphs] = elements(side?.children ?? [])
    expect(elements(image?.children ?? [])[0]?.tagName).toBe('img')
    expect(paragraphs.map(textOf)).toEqual([
      'Les Nnors apprennent à négocier.',
      'Leurs caravanes ménagent les sentiers.',
    ])
  })

  it('ends the section at the next heading', () => {
    const [side, heading, after] = elements(
      laidOut(
        picture('nnor-marchand-3_4-og.png'),
        paragraph('Beside the picture.'),
        element('h2', [text('Montagnards')]),
        paragraph('Under the heading.'),
      ),
    )
    expect(side?.properties['className']).toBe('au-prose__side')
    expect(heading?.tagName).toBe('h2')
    expect(textOf(after ?? text(''))).toBe('Under the heading.')
  })

  it('leaves a 16:9 picture across the column', () => {
    const children = laidOut(picture('placeholder-16_9-og.png'), paragraph('Below the banner.'))
    expect(elements(children).map((child) => child.tagName)).toEqual(['p', 'p'])
    expect(elements(children).some((child) => child.properties['className'])).toBe(false)
  })

  it('leaves a 3:4 picture inside running text alone', () => {
    const inline = element('p', [
      text('Voyez '),
      element('img', [], { src: '../../media/art/nnor-marchand-3_4-og.png', alt: '' }),
    ])
    const [only] = elements(laidOut(inline, paragraph('Suite.')))
    expect(only).toBe(inline)
  })
})
