import { describe, expect, it } from 'vitest'
import {
  dealDelay,
  SCENE_BUDGET_MS,
  type SceneDirection,
  sceneEnd,
  sceneRules,
} from '../../src/scripts/page-score'

const DIRECTIONS: SceneDirection[] = ['open', 'close']
const ROSTER_SIZE = 24
const FULL_SHEET = [
  'au-sheet-ghost-0',
  'au-sheet-kind-0',
  'au-sheet-rule-0',
  'au-sheet-badge-0',
  'au-sheet-name-0',
  'au-sheet-subtitle-0',
  'au-sheet-slab-0',
  'au-sheet-card-0',
  'au-sheet-profile-0',
  ...Array.from({ length: 12 }, (_, index) => `au-sheet-sticker-${index}`),
  ...Array.from({ length: 12 }, (_, index) => `au-sheet-trait-${index}`),
  ...Array.from({ length: ROSTER_SIZE }, (_, index) => `au-deal-${index}`),
]

function delayOf(rules: string, name: string): number {
  const found = rules.match(
    new RegExp(`::view-transition-group\\(${name}\\)\\{animation-delay:(\\d+)ms`),
  )
  return Number(found?.[1])
}

describe.each(DIRECTIONS)('the score, %s', (direction) => {
  it('ends inside the budget of a sheet change', () => {
    expect(sceneEnd(direction, FULL_SHEET)).toBeLessThanOrEqual(SCENE_BUDGET_MS)
  })

  it('carries every part on the one curve', () => {
    const rules = sceneRules(direction, FULL_SHEET, FULL_SHEET)
    for (const name of FULL_SHEET.filter((each) => each.startsWith('au-sheet-'))) {
      expect(rules).toContain(`::view-transition-group(${name})`)
    }
    const curves = [...rules.matchAll(/animation-timing-function:([^;}]+)/g)].map(
      (match) => match[1],
    )
    expect(new Set(curves)).toEqual(new Set(['var(--ease-carry)']))
  })

  it('never turns or bends a carried part', () => {
    expect(sceneRules(direction, FULL_SHEET, FULL_SHEET)).not.toMatch(
      /rotate|skew|image-pair\(au-sheet/,
    )
  })

  it('never lets a card further off move before a nearer one', () => {
    const delays = Array.from({ length: ROSTER_SIZE }, (_, rank) => dealDelay(rank))
    expect(delays).toEqual([...delays].sort((one, other) => one - other))
  })

  it('moves pieces of the same kind together, so a line never catches itself', () => {
    const rules = sceneRules(
      direction,
      ['au-sheet-sticker-0', 'au-sheet-sticker-1'],
      ['au-sheet-sticker-0', 'au-sheet-sticker-1'],
    )
    expect(delayOf(rules, 'au-sheet-sticker-1')).toBe(delayOf(rules, 'au-sheet-sticker-0'))
  })

  it('ignores a name it does not score', () => {
    expect(sceneRules(direction, ['au-header', 'au-sheet-unknown-0'], [])).toBe('')
  })
})

describe('the leader', () => {
  it('moves first on opening and lands last on closing', () => {
    const both = ['au-sheet-card-0', 'au-sheet-name-0']
    const opening = sceneRules('open', both, both)
    expect(delayOf(opening, 'au-sheet-card-0')).toBeLessThan(delayOf(opening, 'au-sheet-name-0'))
    const closing = sceneRules('close', both, both)
    expect(delayOf(closing, 'au-sheet-card-0')).toBeGreaterThan(delayOf(closing, 'au-sheet-name-0'))
  })
})

describe('a part with no place on the next page', () => {
  it('fades away at its own start and is not carried', () => {
    const rules = sceneRules('close', ['au-sheet-slab-0', 'au-sheet-card-0'], ['au-sheet-card-0'])
    expect(rules).toContain('::view-transition-old(au-sheet-slab-0){animation:au-transit-vanish')
    expect(rules).not.toContain('::view-transition-group(au-sheet-slab-0)')
  })
})
