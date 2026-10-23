import { describe, expect, it } from 'vitest'

import { species } from '../../src/lib/game/schema'

const subspecies = (names?: { family?: string[]; given?: string[] }) => ({
  id: 'alpin',
  name: 'Nnor alpin',
  text: 'Les Nnors des cimes.',
  offered: [],
  ...(names ? { names } : {}),
})

const entry = (fields: Record<string, unknown>) => ({
  id: 'nnor',
  name: 'Nnor',
  offered: [],
  ...fields,
})

describe('the heading of a species family names', () => {
  it('is accepted when a sub-species declares family names', () => {
    const parsed = species.safeParse(
      entry({ familyNamesLabel: 'Yurtas', subspecies: [subspecies({ family: ['Aktharos'] })] }),
    )
    expect(parsed.success).toBe(true)
  })

  it('is refused when no sub-species declares family names', () => {
    const parsed = species.safeParse(
      entry({ familyNamesLabel: 'Yurtas', subspecies: [subspecies({ given: ['Azhoran'] })] }),
    )
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['familyNamesLabel'])
  })

  it('is refused on a species without sub-species', () => {
    expect(species.safeParse(entry({ familyNamesLabel: 'Yurtas' })).success).toBe(false)
  })

  it('stays optional', () => {
    expect(
      species.safeParse(entry({ subspecies: [subspecies({ family: ['Aktharos'] })] })).success,
    ).toBe(true)
  })

  it('is accepted when the species gives every sub-species its family names', () => {
    const parsed = species.safeParse(
      entry({
        familyNames: ['Aktharos'],
        familyNamesLabel: 'Yurtas',
        subspecies: [subspecies({ given: ['Azhoran'] })],
      }),
    )
    expect(parsed.success).toBe(true)
  })
})

describe('the family names a species gives its sub-species', () => {
  it('needs sub-species to give them to', () => {
    const parsed = species.safeParse(entry({ familyNames: ['Aktharos'] }))
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['familyNames'])
  })
})
