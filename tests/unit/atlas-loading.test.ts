import { describe, expect, it } from 'vitest'

import { LOAD_MILESTONES, LoadProgress } from '../../src/lib/atlas/contract/loading'

function reachAll(progress: LoadProgress): void {
  for (const milestone of LOAD_MILESTONES) progress.reach(milestone)
}

describe('the load the start-up screen shows', () => {
  it('completes for a world whose plan has no job of some kinds, such as an empty sea', () => {
    const progress = new LoadProgress(true)
    progress.receive({ kind: 'plan', jobs: ['textures', 'terrain:0', 'water', 'sky'] })
    for (const job of ['textures', 'terrain:0', 'water', 'sky']) {
      progress.receive({ kind: 'done', job })
    }
    reachAll(progress)
    expect(progress.state.fraction).toBe(1)
  })

  it('counts no job done before the worker has sent its plan', () => {
    const progress = new LoadProgress(true)
    reachAll(progress)
    expect(progress.state.fraction).toBeLessThan(1)
  })

  it('without a map, completes once the code and the world have arrived', () => {
    const progress = new LoadProgress(false)
    progress.reach('code')
    expect(progress.state.fraction).toBeLessThan(1)
    progress.reach('world')
    expect(progress.state.fraction).toBe(1)
  })
})
