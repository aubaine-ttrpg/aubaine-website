import { describe, expect, it } from 'vitest'

import { WIND } from '../../src/lib/atlas/contract/wind'
import { PropBuilder, type PropGeometry, packProp } from '../../src/lib/atlas/kernel/builder'
import { buildEffects } from '../../src/lib/atlas/kernel/effects'
import { PROP_KIND } from '../../src/lib/atlas/kernel/kinds'
import { at } from '../../src/lib/atlas/kernel/models/parts'
import { plane } from '../../src/lib/atlas/kernel/primitives'
import { reliefField } from '../../src/lib/atlas/world/relief'
import { loadWorld } from './fixtures/atlas'

const FLAG = { width: 0.06, height: 0.1, colour: '#2a3f9a' }
const SNORM = 127

function flag(options: Parameters<PropBuilder['add']>[4], scale = 1): PropGeometry {
  return new PropBuilder()
    .add(
      plane(FLAG.width, FLAG.height, 4, 2),
      at(0, 0, 0, 0, 0, 0, scale),
      FLAG.colour,
      PROP_KIND.cloth,
      options,
    )
    .geometry()
}

function axisValues(geometry: PropGeometry, axis: 0 | 1): number[] {
  return Array.from(
    { length: geometry.flutter.length },
    (_, i) => geometry.positions[i * 3 + axis] ?? 0,
  )
}

describe('a cloth pinned to its pole', () => {
  it('holds still along the pinned edge and flutters most at the free edge', () => {
    const left = flag({ pinned: 'left' })
    const xs = axisValues(left, 0)
    for (const [i, x] of xs.entries()) {
      expect(left.flutter[i]).toBeCloseTo(x + FLAG.width / 2, 6)
    }
    expect(Math.min(...left.flutter)).toBe(0)
    expect(Math.max(...left.flutter)).toBeCloseTo(FLAG.width, 6)
  })

  it('measures from the right edge or from the top when pinned there', () => {
    const right = flag({ pinned: 'right' })
    for (const [i, x] of axisValues(right, 0).entries()) {
      expect(right.flutter[i]).toBeCloseTo(FLAG.width / 2 - x, 6)
    }
    const top = flag({ pinned: 'top' })
    for (const [i, y] of axisValues(top, 1).entries()) {
      expect(top.flutter[i]).toBeCloseTo(FLAG.height / 2 - y, 6)
    }
  })

  it('grows its reach with the scale it is placed at', () => {
    expect(Math.max(...flag({ pinned: 'left' }, 2).flutter)).toBeCloseTo(FLAG.width * 2, 6)
    const merged = new PropBuilder().merge(flag({ pinned: 'left' }), at(0, 0, 0, 0, 0, 0, 1.5))
    expect(Math.max(...merged.geometry().flutter)).toBeCloseTo(FLAG.width * 1.5, 6)
  })

  it('stays rigid without a pin', () => {
    expect(flag({}).flutter.every((reach) => reach === 0)).toBe(true)
  })

  it('travels to the renderer in the spare byte of each packed normal', () => {
    const left = flag({ pinned: 'left' })
    const packed = packProp(left)
    for (const [i, reach] of left.flutter.entries()) {
      expect(packed.normals[i * 4 + 3]).toBe(Math.round(reach * SNORM))
    }
  })
})

describe('the wind over Eden', () => {
  const { authored, world } = loadWorld('archipel')
  const effects = buildEffects(world, reliefField(authored.grid, world.surface), [])

  it('carries every drifting particle downwind', () => {
    const drifting = effects.particles.filter(({ velocity: [x, , z] }) => Math.hypot(x, z) > 0)
    expect(drifting.length).toBeGreaterThan(0)
    for (const { velocity } of drifting) {
      const [x, , z] = velocity
      expect(x * WIND.z - z * WIND.x).toBeCloseTo(0, 12)
      expect(x * WIND.x + z * WIND.z).toBeGreaterThan(0)
    }
  })

  it('moves every cloud with the wind', () => {
    expect(effects.clouds.length).toBeGreaterThan(0)
    expect(effects.clouds.every((cloud) => cloud.drift > 0)).toBe(true)
  })
})
