import { describe, expect, it } from 'vitest'

import { EMBLEM_MARGIN, frameEmblem, pathBounds } from '../../src/lib/emblem-frame'

const viewBox = (svg: string): number[] =>
  (/viewBox="([^"]+)"/.exec(svg)?.[1] ?? '').split(' ').map(Number)

describe('the bounds of an emblem path', () => {
  it('covers straight lines, absolute and relative', () => {
    expect(pathBounds('M10 20 L30 5 l-40 50 Z')).toEqual({
      left: -10,
      top: 5,
      right: 30,
      bottom: 55,
    })
  })

  it('follows horizontal and vertical moves', () => {
    expect(pathBounds('M0 0 H50 V-20 h-70 v10 z')).toEqual({
      left: -20,
      top: -20,
      right: 50,
      bottom: 0,
    })
  })

  it('reaches the bulge of a curve, beyond its end points', () => {
    const bounds = pathBounds('M0 0 C0 100 100 100 100 0')
    expect(bounds.bottom).toBeCloseTo(75)
    expect(bounds.top).toBe(0)
  })

  it('reaches the bulge of a quadratic curve', () => {
    expect(pathBounds('M0 0 Q50 100 100 0').bottom).toBeCloseTo(50)
  })

  it('refuses a command it cannot measure', () => {
    expect(() => pathBounds('M0 0 A10 10 0 0 1 20 20')).toThrow(/A command/)
  })
})

describe('the frame of an emblem', () => {
  it('centres the drawing in a square with the same margin on its longer side', () => {
    const framed = frameEmblem('<svg><path d="M100 300 L300 300 L300 400 L100 400 Z"/></svg>')
    const [left = 0, top = 0, side = 0] = viewBox(framed)
    expect(side * (1 - 2 * EMBLEM_MARGIN)).toBeCloseTo(200)
    expect(left + side / 2).toBeCloseTo(200)
    expect(top + side / 2).toBeCloseTo(350)
  })

  it('drops the size, the title and the colour it arrived with', () => {
    const framed = frameEmblem(
      '<?xml version="1.0"?><svg width="10" height="10"><title>x</title><path fill="#FFF" fill-rule="evenodd" d="M0 0 L1 1"/></svg>',
    )
    expect(framed).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.043 -0.043 1.087 1.087">\n<path fill="#ffffff" fill-rule="evenodd" d="M0 0 L1 1"/>\n</svg>\n',
    )
  })

  it('gives the same frame twice', () => {
    const once = frameEmblem('<svg><path d="M5 5 C5 50 90 50 90 5 Z"/></svg>')
    expect(frameEmblem(once)).toBe(once)
  })

  it('refuses groups and transforms, which its bounds would miss', () => {
    expect(() => frameEmblem('<svg><g><path d="M0 0 L1 1"/></g></svg>')).toThrow(/plain paths/)
    expect(() => frameEmblem('<svg><path transform="scale(2)" d="M0 0 L1 1"/></svg>')).toThrow(
      /plain paths/,
    )
  })
})
