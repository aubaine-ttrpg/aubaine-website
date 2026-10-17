import { describe, expect, it } from 'vitest'

import { createGrid } from '../../src/lib/atlas/world/grid'
import {
  BEDS,
  type Bed,
  type HeardCall,
  type Listener,
  listen,
} from '../../src/lib/atlas/world/soundscape'
import { loadWorld } from './fixtures/atlas'

const { world } = loadWorld('archipel')
const grid = createGrid(world.columns, world.rows)
const everywhere = () => true
const nowhere = () => false

const harbour = world.establishments.find(
  (establishment) =>
    establishment.kind === 'harbour' && establishment.stratum === 0 && !establishment.aloft,
)
const forest = world.places.find((place) => place.kind === 'natural' && place.subtype === 'forest')

function at(x: number, z: number, patch: Partial<Listener> = {}): Listener {
  return { x, z, dist: 168, yaw: 0, level: 0, night: 0, ...patch }
}

function harbourAt(): { x: number; z: number } {
  if (!harbour) throw new Error('the Archipel has no harbour on the surface')
  return { x: grid.x[harbour.tile] ?? 0, z: grid.z[harbour.tile] ?? 0 }
}

function forestAt(): { x: number; z: number } {
  if (!forest) throw new Error('the Archipel has no forest')
  return { x: forest.centreX, z: forest.centreZ }
}

const audible = (beds: Readonly<Record<Bed, number>>) => BEDS.filter((bed) => beds[bed] > 0).sort()

const gullPans = (calls: readonly HeardCall[]) =>
  calls.flatMap((call) => (call.kind === 'point' && call.call === 'gull' ? [call] : []))

function loudestGullPan(calls: readonly HeardCall[]): number | undefined {
  return gullPans(calls).sort((a, b) => b.gain - a.gain)[0]?.pan
}

describe('what the Atlas lets a reader hear', () => {
  it('plays only the sea and the wind from far away, over land or water', () => {
    const forestView = listen(
      world,
      grid,
      at(forestAt().x, forestAt().z, { dist: 300 }),
      everywhere,
    )
    const openSea = listen(world, grid, at(0, 200, { dist: 300 }), everywhere)
    const generic = (bed: Bed) => bed === 'sea' || bed === 'wind'
    expect(audible(forestView.beds).filter((bed) => !generic(bed))).toEqual([])
    expect(audible(openSea.beds)).toEqual(['sea', 'wind'])
    expect(openSea.beds.sea).toBe(1)
    expect([...forestView.calls, ...openSea.calls]).toEqual([])
  })

  it('brings in the forest once the reader comes close to one', () => {
    const { x, z } = forestAt()
    const { beds } = listen(world, grid, at(x, z, { dist: 60 }), everywhere)
    const loudest = BEDS.filter((bed) => bed !== 'wind').sort((a, b) => beds[b] - beds[a])[0]
    expect(loudest).toBe('forest')
  })

  it('hands the forest over to the night when the stars set', () => {
    const { x, z } = forestAt()
    const { beds } = listen(world, grid, at(x, z, { dist: 60, night: 1 }), everywhere)
    expect(beds.forest).toBe(0)
    expect(beds.night).toBeGreaterThan(0)
  })

  it('lets a harbour call only when the reader is close to it', () => {
    const { x, z } = harbourAt()
    expect(gullPans(listen(world, grid, at(x, z, { dist: 30 }), everywhere).calls)).not.toEqual([])
    expect(gullPans(listen(world, grid, at(x, z, { dist: 200 }), everywhere).calls)).toEqual([])
  })

  it('places a call on the side of the screen it comes from', () => {
    const { x, z } = harbourAt()
    const facing = listen(world, grid, at(x - 8, z, { dist: 30 }), everywhere)
    const turned = listen(world, grid, at(x - 8, z, { dist: 30, yaw: Math.PI }), everywhere)
    expect(loudestGullPan(facing.calls)).toBeGreaterThan(0)
    expect(loudestGullPan(turned.calls)).toBeLessThan(0)
  })

  it('keeps an undiscovered place silent', () => {
    const { x, z } = harbourAt()
    const { calls } = listen(world, grid, at(x, z, { dist: 30 }), nowhere)
    expect(calls.filter((call) => call.kind === 'point')).toEqual([])
  })

  it('plays only the cave underground', () => {
    const { x, z } = harbourAt()
    const { beds } = listen(world, grid, at(x, z, { level: 1 }), everywhere)
    expect(audible(beds)).toEqual(['cave'])
  })
})
