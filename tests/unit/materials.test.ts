import { describe, expect, it } from 'vitest'

import { lootRows, placesOf, rollOf } from '../../src/lib/game/materials'
import type { Environment, Material } from '../../src/lib/game/schema'

const material = (name: string, value = 1): Material => ({
  name,
  types: ['bois'],
  value,
  description: name,
})

const environment = (name: string, loot: Environment['loot']): Environment => ({
  name,
  icon: 'game-icons:forest',
  die: 4,
  description: name,
  loot,
})

const materials = new Map([
  ['branche', material('Branche')],
  ['ambre', material('Ambre', 2)],
])

const forest = environment('Forêt', [
  { from: 1, to: 2, material: 'branche', quantity: 1 },
  { from: 3, to: 3, material: 'branche', quantity: 2 },
  { from: 4, to: 4, material: 'ambre', quantity: 1 },
])

describe('loot tables', () => {
  it('writes a single face as its number and a span as first-last', () => {
    expect(rollOf(3, 3)).toBe('3')
    expect(rollOf(1, 2)).toBe('1-2')
  })

  it('reads each row with its material, in the order of the die', () => {
    expect(
      lootRows(forest, materials).map((row) => [row.roll, row.material.name, row.quantity]),
    ).toEqual([
      ['1-2', 'Branche', 1],
      ['3', 'Branche', 2],
      ['4', 'Ambre', 1],
    ])
  })

  it('refuses a row that names no material', () => {
    const broken = environment('Ruines', [{ from: 1, to: 4, material: 'rien', quantity: 1 }])
    expect(() => lootRows(broken, materials)).toThrow('Ruines loots rien')
  })
})

describe('where a material is found', () => {
  const plain = environment('Plaine', [{ from: 1, to: 4, material: 'branche', quantity: 1 }])
  const environments = new Map([
    ['foret', forest],
    ['plaine', plain],
  ])

  it('lists each environment once, with every roll that gives the material', () => {
    expect(placesOf('branche', environments)).toEqual([
      {
        slug: 'foret',
        environment: forest,
        rolls: [
          { roll: '1-2', quantity: 1 },
          { roll: '3', quantity: 2 },
        ],
      },
      { slug: 'plaine', environment: plain, rolls: [{ roll: '1-4', quantity: 1 }] },
    ])
  })

  it('leaves out an environment that never gives it', () => {
    expect(placesOf('ambre', environments).map((place) => place.slug)).toEqual(['foret'])
  })
})
