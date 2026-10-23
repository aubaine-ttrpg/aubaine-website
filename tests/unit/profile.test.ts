import { describe, expect, it } from 'vitest'

import {
  axisAngle,
  labelPosition,
  labelSide,
  PROFILE_RINGS,
  type Profile,
  profilePoints,
  rankRing,
  ringPoints,
  svgPath,
  svgPoints,
  vertex,
} from '../../src/lib/game/profile'
import { PROFILE_AXES, PROFILE_RANKS } from '../../src/lib/game/schema'

const MARCHAND: Profile = {
  damage: 'D',
  toughness: 'F',
  healing: 'C',
  utility: 'A',
  freeform: 'S',
  roleplay: 'S',
}

const everywhere = (rank: Profile['damage']): Profile => ({
  damage: rank,
  toughness: rank,
  healing: rank,
  utility: rank,
  freeform: rank,
  roleplay: rank,
})

describe('the rank rings', () => {
  it('put F on the innermost ring and S on the outermost', () => {
    expect(rankRing('F')).toBe(1)
    expect(rankRing('S')).toBe(PROFILE_RINGS)
  })

  it('climb one ring per rank, in the order F, D, C, B, A, S', () => {
    expect(PROFILE_RANKS.map(rankRing)).toEqual([1, 2, 3, 4, 5, 6])
  })
})

describe('the hexagon', () => {
  it('has six axes, Dégâts first and Roleplay last', () => {
    expect(PROFILE_AXES).toEqual([
      'damage',
      'toughness',
      'healing',
      'utility',
      'freeform',
      'roleplay',
    ])
  })

  it('points up like the logo, its first vertex straight above the centre', () => {
    const top = vertex(0, 1)
    expect(top.x).toBeCloseTo(0)
    expect(top.y).toBeCloseTo(-1)
  })

  it('turns clockwise by sixty degrees per axis', () => {
    expect(axisAngle(1) - axisAngle(0)).toBeCloseTo(Math.PI / 3)
    const right = vertex(1, 1)
    expect(right.x).toBeGreaterThan(0)
    expect(right.y).toBeLessThan(0)
  })

  it('draws every ring at its share of the radius', () => {
    for (let ring = 1; ring <= PROFILE_RINGS; ring += 1) {
      for (const point of ringPoints(ring, 120)) {
        expect(Math.hypot(point.x, point.y)).toBeCloseTo((120 * ring) / PROFILE_RINGS)
      }
    }
  })
})

describe('the profile polygon', () => {
  it('fills the outer ring when every axis is S', () => {
    expect(profilePoints(everywhere('S'), 100)).toEqual(ringPoints(PROFILE_RINGS, 100))
  })

  it('sits on the inner ring when every axis is F', () => {
    expect(profilePoints(everywhere('F'), 100)).toEqual(ringPoints(1, 100))
  })

  it('puts each Marchand axis on the ring of its rank', () => {
    const radii = profilePoints(MARCHAND, 60).map((point) =>
      Math.round(Math.hypot(point.x, point.y)),
    )
    expect(radii).toEqual([20, 10, 30, 50, 60, 60])
  })

  it('writes SVG points with at most three decimals', () => {
    expect(svgPoints([{ x: 1 / 3, y: -2 }])).toBe('0.333,-2')
  })

  it('writes the same corners as a closed path, so the shape can unfold from its centre', () => {
    expect(
      svgPath([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
        { x: 5, y: 6 },
      ]),
    ).toBe('M1,2 L3,4 L5,6 Z')
    const centre = svgPath(PROFILE_AXES.map(() => ({ x: 100, y: 100 })))
    const marchand = svgPath(profilePoints(MARCHAND, 58))
    expect(centre.split(' ').length).toBe(marchand.split(' ').length)
  })
})

describe('the labels around the hexagon', () => {
  it('sit above the top vertex, below the bottom one, and outward on the sides', () => {
    expect(PROFILE_AXES.map((_, index) => labelSide(index))).toEqual([
      'top',
      'end',
      'end',
      'bottom',
      'start',
      'start',
    ])
  })

  it('stay inside their box', () => {
    for (const index of PROFILE_AXES.keys()) {
      const { x, y } = labelPosition(index, 40)
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(100)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(100)
    }
  })
})
