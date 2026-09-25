import { describe, expect, it } from 'vitest'

import { rehypeDropComments } from '../../src/lib/game/book-markup'

type Root = Parameters<ReturnType<typeof rehypeDropComments>>[0]
type Child = Root['children'][number]

const raw = (value: string): Child => ({ type: 'raw', value })
const text = (value: string): Child => ({ type: 'text', value })
const paragraph = (...children: Child[]): Child => ({
  type: 'element',
  tagName: 'p',
  properties: {},
  children,
})

function kept(...children: Child[]): Child[] {
  const tree: Root = { type: 'root', children }
  rehypeDropComments()(tree)
  return tree.children
}

describe('prose comments', () => {
  it('keeps an authored comment out of the rendered page', () => {
    expect(kept(raw('<!-- TODO: rewrite -->'), paragraph(text('Hello')))).toEqual([
      paragraph(text('Hello')),
    ])
  })

  it('drops a comment nested inside a block', () => {
    expect(kept(paragraph(text('Quote '), raw('<!-- aside -->')))).toEqual([
      paragraph(text('Quote ')),
    ])
  })

  it('drops a parsed comment node', () => {
    expect(kept({ type: 'comment', value: ' aside ' })).toEqual([])
  })

  it('leaves markup that only sits between two comments', () => {
    const markup = raw('<!-- a --><b>kept</b><!-- c -->')
    expect(kept(markup)).toEqual([markup])
  })
})
