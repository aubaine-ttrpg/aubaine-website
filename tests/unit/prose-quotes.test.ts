import { describe, expect, it } from 'vitest'

import { QUOTE_BACKINGS, rehypeProseQuotes, TITLE_CORNERS } from '../../src/lib/game/book-markup'

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
  return figureIn('data/lore/species/fixture.md', ...paragraphs)
}

function figureIn(path: string, ...paragraphs: Child[][]): Element {
  const tree: Root = {
    type: 'root',
    children: [
      element(
        'blockquote',
        paragraphs.map((runs) => element('p', runs)),
      ),
    ],
  }
  rehypeProseQuotes()(tree, { path })
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

const classOf = (node: Child): unknown =>
  node.type === 'element' ? node.properties['className'] : undefined

const childNamed = (parent: Element, tagName: string): Element => {
  const found = parent.children.find(
    (child): child is Element => child.type === 'element' && child.tagName === tagName,
  )
  if (!found) throw new Error(`no ${tagName} in the ${parent.tagName}`)
  return found
}

const paragraphsOf = (quote: Element): Element[] =>
  quote.children.filter(
    (child): child is Element => child.type === 'element' && child.tagName === 'p',
  )

const marksOf = (node: Child): string[] =>
  node.type === 'text'
    ? []
    : classOf(node) === 'au-quote__mark'
      ? [textOf(node)]
      : node.children.flatMap(marksOf)

describe('prose quotes', () => {
  it('lifts a closing source out of the quote into a title above it', () => {
    const figure = figureOf([text('« Vois ces stèles. »')], [text(':source[Arsenault]')])
    expect(figure.tagName).toBe('figure')
    expect(figure.properties['className']).toBe('au-quote')
    expect(elementAt(figure, 0).tagName).toBe('figcaption')
    expect(textOf(elementAt(figure, 0))).toBe('Arsenault')
    expect(elementAt(figure, 1).tagName).toBe('blockquote')
    expect(textOf(elementAt(figure, 1))).toBe('« Vois ces stèles. »')
  })

  it('keeps inline formatting inside the caption', () => {
    const figure = figureOf(
      [text('« Paix. »')],
      [text(':source['), element('strong', [text('Arsenault')]), text(']')],
    )
    const caption = childNamed(figure, 'figcaption')
    expect(elementAt(caption, 1).tagName).toBe('strong')
    expect(textOf(caption)).toBe('Arsenault')
  })

  it('frames a quote with no source and leaves every paragraph in it', () => {
    const figure = figureOf([text('« Un. »')], [text('« Deux. »')])
    expect(figure.tagName).toBe('figure')
    expect(figure.children).toHaveLength(1)
    expect(paragraphsOf(elementAt(figure, 0))).toHaveLength(2)
  })

  it('ignores a source that is not the closing paragraph', () => {
    const figure = figureOf([text(':source[Arsenault]')], [text('« Paix. »')])
    expect(figure.children).toHaveLength(1)
    expect(textOf(figure)).toContain(':source[Arsenault]')
  })

  it('calls a quote with one speaker a speech', () => {
    const figure = figureOf(
      [element('strong', [text('Charon :')]), text(' « Écoute. »')],
      [text(':source[Charon]')],
    )
    expect(figure.properties['data-quote']).toBe('speech')
    expect(paragraphsOf(childNamed(figure, 'blockquote'))[0]?.properties['data-speaker']).toBe(0)
  })

  it('calls a quote with two turns a dialogue and numbers its speakers by name', () => {
    const figure = figureOf(
      [element('strong', [text('Tiar :')]), text(' « Couvre-les. »')],
      [element('strong', [text('Sombrecœur :')]), text(' « Non. »')],
      [element('strong', [text('Tiar :')]), text(' « Humpf. »')],
    )
    const turns = paragraphsOf(elementAt(figure, 0))
    expect(figure.properties['data-quote']).toBe('dialogue')
    expect(turns.map((turn) => turn.properties['data-speaker'])).toEqual([0, 1, 0])
  })

  it('leaves narration between turns without a speaker or a box', () => {
    const figure = figureOf(
      [element('strong', [text('MJ:')]), text(' "Roll."')],
      [text('The player rolls a 9.')],
      [element('strong', [text('MJ:')]), text(' "You land."')],
    )
    const narration = paragraphsOf(elementAt(figure, 0))[1]
    expect(narration?.properties['data-speaker']).toBeUndefined()
    expect(narration?.children.map(classOf)).not.toContain('au-quote__box')
  })

  it('keeps the speaker label whole while setting its colon apart', () => {
    const figure = figureOf(
      [element('strong', [text('Tiar :')]), text(' « Couvre-les. »')],
      [element('strong', [text('Sombrecœur :')]), text(' « Non. »')],
    )
    const turn = paragraphsOf(elementAt(figure, 0))[0]
    if (!turn) throw new Error('no turn')
    const label = elementAt(turn, 1)
    expect(classOf(elementAt(turn, 0))).toBe('au-quote__box')
    expect(textOf(label)).toBe('Tiar :')
    expect(classOf(elementAt(label, 0))).toBe('au-quote__name')
    expect(textOf(elementAt(label, 0))).toBe('Tiar')
    expect(classOf(elementAt(label, 1))).toBe('au-quote__colon')
  })

  it('reads a bold opening without a colon as words, not a speaker', () => {
    const figure = figureOf([element('strong', [text('Jamais')]), text(' ne cède.')])
    expect(figure.properties['data-quote']).toBe('speech')
    expect(paragraphsOf(elementAt(figure, 0))[0]?.properties['data-speaker']).toBeUndefined()
  })

  it('gives a speech one box and sets apart its outer guillemets with their spaces', () => {
    const figure = figureOf(
      [text('« Vois ces stèles.')],
      [text('Le Bastion doit durer. »')],
      [text(':source[Arsenault]')],
    )
    const quote = childNamed(figure, 'blockquote')
    expect(quote.children.map(classOf).filter((name) => name === 'au-quote__box')).toHaveLength(1)
    expect(marksOf(quote)).toEqual(['« ', ' »'])
    expect(textOf(quote)).toBe('« Vois ces stèles.Le Bastion doit durer. »')
  })

  it('sets apart the marks of an English speech inside emphasis', () => {
    const figure = figureOf([element('em', [text('"Hear my voice."')])])
    expect(marksOf(elementAt(figure, 0))).toEqual(['"', '"'])
  })

  it('gives each dialogue turn its own box and its own marks', () => {
    const figure = figureOf(
      [element('strong', [text('Tiar :')]), text(' « Couvre-les. »')],
      [element('strong', [text('Sombrecœur :')]), text(' « Non. »')],
    )
    const turns = paragraphsOf(elementAt(figure, 0))
    expect(turns.map((turn) => classOf(turn.children[0] ?? text('')))).toEqual([
      'au-quote__box',
      'au-quote__box',
    ])
    expect(turns.map(marksOf)).toEqual([
      ['« ', ' »'],
      ['« ', ' »'],
    ])
    expect(turns.map(textOf)).toEqual(['Tiar : « Couvre-les. »', 'Sombrecœur : « Non. »'])
  })

  it('takes the picture a turn opens on as its portrait, behind its box', () => {
    const portrait = (src: string): Element => ({
      type: 'element',
      tagName: 'img',
      properties: { src, alt: '' },
      children: [],
    })
    const figure = figureOf(
      [
        portrait('tiar.png'),
        text(' '),
        element('strong', [text('Tiar :')]),
        text(' « Couvre-les. »'),
      ],
      [element('strong', [text('Sombrecœur :')]), text(' « Non. »')],
      [portrait('tiar-agacee.png'), element('strong', [text('Tiar :')]), text(' « Humpf. »')],
    )
    const turns = paragraphsOf(elementAt(figure, 0))
    expect(figure.properties['data-quote']).toBe('dialogue')
    expect(turns.map((turn) => turn.properties['data-speaker'])).toEqual([0, 1, 0])
    expect(turns.map((turn) => turn.children.slice(0, 2).map(classOf))).toEqual([
      ['au-quote__portrait', 'au-quote__box'],
      ['au-quote__box', undefined],
      ['au-quote__portrait', 'au-quote__box'],
    ])
    const [first] = turns
    if (!first) throw new Error('no turn')
    expect(elementAt(elementAt(first, 0), 0).properties['src']).toBe('tiar.png')
    expect(turns.map(marksOf)).toEqual([
      ['« ', ' »'],
      ['« ', ' »'],
      ['« ', ' »'],
    ])
  })

  it('places a title at the corner its source names, above or below the quote', () => {
    for (const corner of TITLE_CORNERS) {
      const figure = figureOf([text('« Paix. »')], [text(`:source[Arsenault]{${corner}}`)])
      const title = childNamed(figure, 'figcaption')
      expect(figure.properties['data-title-corner']).toBe(corner)
      expect(textOf(title)).toBe('Arsenault')
      expect(figure.children.indexOf(title)).toBe(corner.startsWith('bottom') ? 1 : 0)
    }
  })

  it('places a title at the top left when the source names no corner', () => {
    const figure = figureOf([text('« Paix. »')], [text(':source[Arsenault]')])
    expect(figure.properties['data-title-corner']).toBe('top-left')
  })

  it('backs a quote with the background its source names', () => {
    for (const backing of QUOTE_BACKINGS) {
      const figure = figureOf(
        [text('« Paix. »')],
        [text(`:source[Arsenault]{bottom-right ${backing}}`)],
      )
      expect(figure.properties['data-backing']).toBe(backing)
      expect(figure.properties['data-title-corner']).toBe('bottom-right')
      expect(textOf(childNamed(figure, 'figcaption'))).toBe('Arsenault')
    }
  })

  it('backs a quote with the slab when nothing names its background', () => {
    const sourced = figureOf([text('« Paix. »')], [text(':source[Arsenault]{top-right}')])
    const unsourced = figureOf([text('« Paix. »')])
    expect(sourced.properties['data-backing']).toBe('tranche')
    expect(unsourced.properties['data-backing']).toBe('tranche')
    expect(unsourced.properties['data-title-corner']).toBeUndefined()
  })

  it('refuses a corner it does not know and names the file', () => {
    expect(() =>
      figureIn('data/lore/species/nnor.md', [text('« Paix. »')], [text(':source[Charon]{middle}')]),
    ).toThrow(/nnor\.md.*"middle"/)
  })

  it('refuses a background it does not know, or a third word, and names the file', () => {
    for (const words of ['top-left halo', 'top-left echo tranche']) {
      expect(() =>
        figureIn(
          'data/lore/species/humain.md',
          [text('« Paix. »')],
          [text(`:source[Arsenault]{${words}}`)],
        ),
      ).toThrow(/humain\.md.*backs a quote/)
    }
  })

  it('turns a tip into a titled note', () => {
    const tree: Root = {
      type: 'root',
      children: [
        element('blockquote', [
          element('p', [text('[!TIP] Astuce')]),
          element('p', [text('Une Compétence de dix minutes trouve sa place au repos.')]),
        ]),
      ],
    }
    rehypeProseQuotes()(tree)
    const note = tree.children[0]
    if (note?.type !== 'element') throw new Error('the tip left no element behind')
    expect(note.properties['className']).toBe('au-callout au-callout--tip')
    expect(note.properties['role']).toBe('note')
    expect(textOf(elementAt(note, 0))).toBe('Astuce')
  })
})
