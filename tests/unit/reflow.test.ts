import { describe, expect, it } from 'vitest'

import { keepOnPage, padCount, unitsOf } from '../../src/scripts/reflow'

type FakeNode = { name: string; selectors: string[]; children: FakeNode[] }

function node(name: string, selectors: string[] = [], children: FakeNode[] = []): FakeNode {
  return { name, selectors, children }
}

function asElement(fake: FakeNode): Element {
  const element = {
    children: fake.children.map(asElement),
    matches: (selector: string): boolean =>
      selector.split(',').some((part) => fake.selectors.includes(part.trim())),
    toString: () => fake.name,
  }
  return element as unknown as Element
}

function names(cols: FakeNode, wrappers: string): string[] {
  return unitsOf(asElement(cols), wrappers).map((unit) => String(unit.el))
}

function chains(cols: FakeNode, wrappers: string): string[][] {
  return unitsOf(asElement(cols), wrappers).map((unit) => unit.chain.map(String))
}

const item = (name: string) =>
  node(name, ['.au-item'], [node(`${name}/id`), node(`${name}/headline`), node(`${name}/desc`)])

const catalogue = node(
  'columns',
  [],
  [node('group', ['[data-equipment-group]'], [node('section'), item('dague')]), item('rapiere')],
)

const prose = node('body', [], [node('h1'), node('h2'), node('p'), node('dl')])

describe('unitsOf', () => {
  it('treats every child as a unit when no wrapper is named', () => {
    expect(names(prose, '')).toEqual(['h1', 'h2', 'p', 'dl'])
    expect(chains(prose, '')).toEqual([[], [], [], []])
  })

  it('descends into an entry so a column may break between its parts', () => {
    expect(names(catalogue, '[data-equipment-group], .au-item')).toEqual([
      'section',
      'dague/id',
      'dague/headline',
      'dague/desc',
      'rapiere/id',
      'rapiere/headline',
      'rapiere/desc',
    ])
  })

  it('keeps a section title and the entry it leads under one group', () => {
    expect(chains(catalogue, '[data-equipment-group], .au-item')).toEqual([
      ['group'],
      ['group', 'dague'],
      ['group', 'dague'],
      ['group', 'dague'],
      ['rapiere'],
      ['rapiere'],
      ['rapiere'],
    ])
  })

  it('carries a whole entry overleaf when the entry is not a wrapper', () => {
    expect(names(catalogue, '[data-equipment-group]')).toEqual(['section', 'dague', 'rapiere'])
    expect(chains(catalogue, '[data-equipment-group]')).toEqual([['group'], ['group'], []])
  })
})

describe('keepOnPage', () => {
  it('keeps every fitted unit when none of them binds to the next', () => {
    expect(keepOnPage(3, [false, false, false])).toBe(3)
  })

  it('pushes a trailing title onto the next leaf', () => {
    expect(keepOnPage(3, [false, false, true])).toBe(2)
  })

  it('pushes a whole trailing run of bound units', () => {
    expect(keepOnPage(4, [false, true, true, true])).toBe(1)
  })

  it('keeps one unit rather than emptying a leaf that would never drain', () => {
    expect(keepOnPage(2, [true, true])).toBe(1)
    expect(keepOnPage(0, [])).toBe(1)
  })
})

describe('padCount', () => {
  it('pads nothing when imposition is off', () => {
    expect(padCount(7, 1)).toBe(0)
  })

  it('pads up to the next multiple', () => {
    expect(padCount(7, 4)).toBe(1)
    expect(padCount(5, 4)).toBe(3)
  })

  it('pads nothing when the count already lands on a multiple', () => {
    expect(padCount(8, 4)).toBe(0)
  })
})
