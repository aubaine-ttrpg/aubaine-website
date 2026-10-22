import { describe, expect, it } from 'vitest'

import { rehypeProsePictureCaptions, rehypeProseSidePictures } from '../../src/lib/game/book-markup'

type Root = Parameters<ReturnType<typeof rehypeProsePictureCaptions>>[0]
type Child = Root['children'][number]
type Element = Extract<Child, { type: 'element' }>

const text = (value: string): Child => ({ type: 'text', value })
const element = (
  tagName: string,
  children: Child[],
  properties: Element['properties'] = {},
): Element => ({ type: 'element', tagName, properties, children })
const image = (file: string): Element =>
  element('img', [], { src: `../../media/art/${file}`, alt: '' })

function captioned(...children: Child[]): Child[] {
  const tree: Root = { type: 'root', children }
  rehypeProsePictureCaptions()(tree)
  return tree.children
}

const elements = (children: Child[]): Element[] =>
  children.filter((child): child is Element => child.type === 'element')

const textOf = (node: Child): string =>
  node.type === 'text' ? node.value : node.children.map(textOf).join('')

describe('prose picture captions', () => {
  it('turns the line under a picture into its caption', () => {
    const [figure] = elements(
      captioned(
        element('p', [
          image('nnor-marchand-16_9-og.png'),
          text("\n:caption[Un émissaire marchand d'Araskha]"),
        ]),
      ),
    )
    expect(figure?.tagName).toBe('figure')
    expect(figure?.properties['className']).toBe('au-prose__picture')
    const [picture, caption] = elements(figure?.children ?? [])
    expect(picture?.tagName).toBe('img')
    expect(caption?.tagName).toBe('figcaption')
    expect(textOf(caption ?? text(''))).toBe("Un émissaire marchand d'Araskha")
  })

  it('keeps inline formatting inside the caption', () => {
    const [figure] = elements(
      captioned(
        element('p', [
          image('nnor-marchand-16_9-og.png'),
          text('\n:caption[Un émissaire de '),
          element('em', [text('Araskha')]),
          text(']'),
        ]),
      ),
    )
    const caption = elements(figure?.children ?? [])[1]
    expect(elements(caption?.children ?? [])[0]?.tagName).toBe('em')
    expect(textOf(caption ?? text(''))).toBe('Un émissaire de Araskha')
  })

  it('leaves a picture without a caption line alone', () => {
    const bare = element('p', [image('nnor-marchand-16_9-og.png')])
    expect(captioned(bare)[0]).toBe(bare)
  })

  it('leaves a caption line with no picture as text', () => {
    const stray = element('p', [text(':caption[Sans image]')])
    expect(captioned(stray)[0]).toBe(stray)
  })

  it('still sets a captioned 3:4 picture beside its text', () => {
    const tree: Root = {
      type: 'root',
      children: [
        element('p', [image('nnor-marchand-3_4-og.png'), text('\n:caption[Au marché]')]),
        element('p', [text('Les Nnors négocient.')]),
      ],
    }
    rehypeProsePictureCaptions()(tree)
    rehypeProseSidePictures()(tree)
    const [side] = elements(tree.children)
    expect(side?.properties['className']).toBe('au-prose__side')
    expect(elements(side?.children ?? []).map((child) => child.tagName)).toEqual(['figure', 'p'])
  })
})
