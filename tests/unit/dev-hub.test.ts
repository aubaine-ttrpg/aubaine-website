import { describe, expect, it } from 'vitest'
import { almanachSave } from '../../src/dev/almanach-store'
import { devHubRuns } from '../../src/dev/integration'
import { ALMANACH_STYLE } from '../../src/lib/art-effect/almanach-look'

const ORIGIN = 'http://localhost:4321'
const HOST = 'localhost:4321'

function save(overrides: Partial<Parameters<typeof almanachSave>[0]>) {
  return almanachSave({
    method: 'PUT',
    path: '/humain',
    origin: ORIGIN,
    host: HOST,
    body: JSON.stringify(ALMANACH_STYLE),
    ...overrides,
  })
}

describe('the dev hub', () => {
  it('runs under astro dev only', () => {
    expect(devHubRuns('dev', {})).toBe(true)
    expect(devHubRuns('build', {})).toBe(false)
    expect(devHubRuns('preview', {})).toBe(false)
    expect(devHubRuns('sync', {})).toBe(false)
  })

  it('stays off under Vitest, which starts the integrations as dev', () => {
    expect(devHubRuns('dev', { VITEST: 'true' })).toBe(false)
  })
})

describe('saving an almanach style', () => {
  it('writes a valid style under its name, as two-space JSON ending in a newline', () => {
    const saved = save({})
    expect(saved).toEqual({
      ok: true,
      id: 'humain',
      json: `${JSON.stringify(ALMANACH_STYLE, null, 2)}\n`,
    })
  })

  it('refuses any method but PUT', () => {
    expect(save({ method: 'POST' })).toMatchObject({ ok: false, status: 405 })
  })

  it('refuses a request from another origin, or with none', () => {
    expect(save({ origin: 'https://example.com' })).toMatchObject({ ok: false, status: 403 })
    expect(save({ origin: undefined })).toMatchObject({ ok: false, status: 403 })
  })

  it('refuses a name that could leave data/almanachs', () => {
    for (const path of ['/../humain', '/Humain', '/humain.json', '/', '/a/b']) {
      expect(save({ path }), path).toMatchObject({ ok: false, status: 400 })
    }
  })

  it('refuses a body the contract rejects, or that is not JSON', () => {
    expect(
      save({ body: JSON.stringify({ ...ALMANACH_STYLE, crystalBoot: 'original' }) }),
    ).toMatchObject({ ok: false, status: 400 })
    expect(save({ body: '{' })).toMatchObject({ ok: false, status: 400 })
  })
})
