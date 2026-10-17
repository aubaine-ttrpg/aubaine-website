import { describe, expect, it } from 'vitest'

import type { AtlasWorldCard } from '../../src/islands/atlas/props'
import { chosenWorld, WORLD_PARAM, worldUrl } from '../../src/islands/atlas/worlds'

const card = (key: string): AtlasWorldCard => ({
  key,
  name: key,
  kind: 'land',
  columns: 4,
  rows: 3,
  hexKm: 5,
})

const atlas = { worlds: [card('archipel'), card('eden')], opening: 'archipel' }

describe('the world the Atlas opens', () => {
  it('opens the opening world when the address names none', () => {
    expect(chosenWorld(atlas, '')).toEqual({ world: card('archipel'), known: true })
  })

  it('opens the world the address names', () => {
    expect(chosenWorld(atlas, `?${WORLD_PARAM}=eden`).world.key).toBe('eden')
  })

  it('falls back to the opening world, and says so, when the address names an unknown one', () => {
    expect(chosenWorld(atlas, `?${WORLD_PARAM}=nowhere`)).toEqual({
      world: card('archipel'),
      known: false,
    })
  })

  it('writes the opening world as the bare address and keeps other parameters', () => {
    const here = { pathname: '/fr/atlas', search: `?${WORLD_PARAM}=eden&x=1` }
    expect(worldUrl(here, 'archipel', 'archipel')).toBe('/fr/atlas?x=1')
    expect(worldUrl({ pathname: '/fr/atlas', search: '' }, 'eden', 'archipel')).toBe(
      `/fr/atlas?${WORLD_PARAM}=eden`,
    )
  })
})
