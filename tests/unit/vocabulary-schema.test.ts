import { describe, expect, it } from 'vitest'

import { SUSPENSE_PAUSE, vocabulary } from '../../src/lib/game/schema'

const descriptor = (fields: Record<string, unknown>) => [
  { key: 'held', labelFr: 'Mot ?!', labelEn: 'Word?!', ...fields },
]

describe('a descriptor held in suspense', () => {
  it('is accepted when both labels open on the pause and go on with a word', () => {
    const parsed = vocabulary.safeParse(
      descriptor({
        labelFr: `${SUSPENSE_PAUSE}Mot ?!`,
        labelEn: `${SUSPENSE_PAUSE}Word?!`,
        effect: 'suspense',
      }),
    )
    expect(parsed.success).toBe(true)
  })

  it('is refused when a label lacks the pause', () => {
    const parsed = vocabulary.safeParse(
      descriptor({ labelEn: `${SUSPENSE_PAUSE}Word?!`, effect: 'suspense' }),
    )
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((issue) => issue.path.join('.'))).toEqual(['0.effect'])
  })

  it('is refused when the pause runs on or nothing follows it', () => {
    for (const held of [`${SUSPENSE_PAUSE}.Word?!`, `${SUSPENSE_PAUSE} Word?!`, SUSPENSE_PAUSE]) {
      const parsed = vocabulary.safeParse(
        descriptor({ labelFr: `${SUSPENSE_PAUSE}Mot ?!`, labelEn: held, effect: 'suspense' }),
      )
      expect(parsed.success, held).toBe(false)
    }
  })

  it('leaves a struck word free of the pause', () => {
    expect(vocabulary.safeParse(descriptor({ effect: 'struck' })).success).toBe(true)
  })
})
