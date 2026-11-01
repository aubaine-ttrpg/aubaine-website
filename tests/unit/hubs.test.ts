import { describe, expect, it } from 'vitest'

import { fieldBackdrop, leadFirst, leadOrder } from '../../src/lib/game/hubs'

const entry = (name: string, status?: 'draft' | 'playtest' | 'balanced', cover?: string) => ({
  name,
  status,
  cover,
})

const names = (entries: { name: string }[]) => entries.map((item) => item.name)

describe('the order a select screen picks its lead from', () => {
  it('puts a playable entry with a cover first', () => {
    const order = leadOrder(
      [
        entry('Alpha', 'draft', 'a.png'),
        entry('Beta', 'balanced'),
        entry('Gamma', 'balanced', 'g.png'),
      ],
      'fr',
    )
    expect(names(order)[0]).toBe('Gamma')
  })

  it('puts a playable entry without a cover before a draft with one', () => {
    const order = leadOrder([entry('Alpha', 'draft', 'a.png'), entry('Beta', 'playtest')], 'fr')
    expect(names(order)).toEqual(['Beta', 'Alpha'])
  })

  it('puts a draft with a cover before a draft without one', () => {
    const order = leadOrder([entry('Alpha', 'draft'), entry('Zeta', 'draft', 'z.png')], 'fr')
    expect(names(order)).toEqual(['Zeta', 'Alpha'])
  })

  it('treats an entry without a status as playable', () => {
    const order = leadOrder([entry('Alpha', 'draft', 'a.png'), entry('Beta')], 'fr')
    expect(names(order)).toEqual(['Beta', 'Alpha'])
  })

  it('orders equals by name in the reader language', () => {
    const order = leadOrder([entry('Ours'), entry('Élan'), entry('Abeille')], 'fr')
    expect(names(order)).toEqual(['Abeille', 'Élan', 'Ours'])
  })

  it('leaves the entries it was given in their order', () => {
    const entries = [entry('Zeta'), entry('Alpha')]
    leadOrder(entries, 'fr')
    expect(names(entries)).toEqual(['Zeta', 'Alpha'])
  })
})

describe('the lead of a list that keeps its authored order', () => {
  it('puts a playable entry with a cover first and keeps equals in the order given', () => {
    const order = leadFirst([
      entry('Zeta'),
      entry('Alpha'),
      entry('Gamma', 'draft', 'g.png'),
      entry('Beta', 'balanced', 'b.png'),
    ])
    expect(names(order)).toEqual(['Beta', 'Zeta', 'Alpha', 'Gamma'])
  })

  it('leaves the entries it was given in their order', () => {
    const entries = [entry('Zeta', 'draft'), entry('Alpha')]
    leadFirst(entries)
    expect(names(entries)).toEqual(['Zeta', 'Alpha'])
  })
})

describe('the backdrop a seal paints on the stage', () => {
  it('lays one soft spot per colour over a night ground of the first and last colours', () => {
    const backdrop = fieldBackdrop(['#c0392b', '#2e86c1'])
    expect(backdrop.match(/radial-gradient/g)).toHaveLength(2)
    expect(backdrop).toContain('#c0392b')
    expect(backdrop).toContain('#2e86c1')
    expect(backdrop).toMatch(
      /linear-gradient\(135deg, color-mix\(in srgb, #c0392b [^)]*#06050d\), color-mix\(in srgb, #2e86c1 [^)]*#06050d\)\)$/,
    )
  })

  it('works from a single colour', () => {
    const backdrop = fieldBackdrop(['var(--accent)'])
    expect(backdrop.match(/radial-gradient/g)).toHaveLength(1)
    expect(backdrop).toContain('var(--accent)')
  })
})
