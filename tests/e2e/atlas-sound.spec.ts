import { expect, type Page, test } from '@playwright/test'

const SETTLED = /^(ready|map-unavailable)$/
const SOUND_KEY = 'aubaine.sound'

type AudioProbe = { contexts: AudioContext[]; decoded: ('ok' | 'failed')[] }

test.use({ reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('aubaine.atlas.settings', JSON.stringify({ quality: 'low' }))
    const probe: AudioProbe = { contexts: [], decoded: [] }
    const Native = window.AudioContext
    window.AudioContext = class extends Native {
      constructor(options?: AudioContextOptions) {
        super(options)
        probe.contexts.push(this)
      }
    }
    const decode = BaseAudioContext.prototype.decodeAudioData
    BaseAudioContext.prototype.decodeAudioData = function (this: BaseAudioContext, data) {
      return decode.call(this, data).then(
        (buffer) => {
          probe.decoded.push('ok')
          return buffer
        },
        (error: unknown) => {
          probe.decoded.push('failed')
          throw error
        },
      )
    }
    Object.assign(window, { audioProbe: probe })
  })
})

function soundRequests(page: Page): string[] {
  const paths: string[] = []
  page.on('request', (request) => {
    const { pathname } = new URL(request.url())
    if (pathname.endsWith('.mp3')) paths.push(pathname)
  })
  return paths
}

function audio(page: Page): Promise<{ states: string[]; decoded: string[] }> {
  return page.evaluate(() => {
    const probe = (window as unknown as { audioProbe: AudioProbe }).audioProbe
    return { states: probe.contexts.map((context) => context.state), decoded: [...probe.decoded] }
  })
}

function storedSound(page: Page): Promise<unknown> {
  return page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? 'null'), SOUND_KEY)
}

async function soundOn(page: Page): Promise<void> {
  await page.addInitScript(
    (key) => window.localStorage.setItem(key, JSON.stringify({ muted: false })),
    SOUND_KEY,
  )
}

async function activatedOnlyByTheReader(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const activation = { hasBeenActive: false, isActive: false }
    Object.defineProperty(navigator, 'userActivation', { value: activation, configurable: true })
    for (const type of ['pointerdown', 'keydown']) {
      window.addEventListener(type, () => Object.assign(activation, { hasBeenActive: true }), {
        capture: true,
      })
    }
  })
}

async function openAtlas(page: Page, path = '/fr/atlas'): Promise<void> {
  await page.goto(path)
  const root = page.locator('[data-atlas-root]')
  await expect(root).toHaveAttribute('data-atlas-state', SETTLED, { timeout: 90_000 })
  test.skip(
    (await root.getAttribute('data-atlas-state')) !== 'ready',
    'the map, and its sound, need WebGL 2',
  )
}

function panel(page: Page) {
  return page.getByRole('complementary', { name: 'Panneau de l’Atlas' })
}

function railSound(page: Page) {
  return panel(page).locator('.au-atlas-rail').getByRole('button', { name: 'Son', exact: true })
}

async function openPane(page: Page, name: string): Promise<void> {
  await panel(page).getByRole('button', { name, exact: true, expanded: false }).click()
}

test('the Atlas stays silent and fetches no sound until the reader turns it on', async ({
  page,
}) => {
  const requests = soundRequests(page)
  await openAtlas(page)
  await openPane(page, 'Options')
  await expect(railSound(page)).toHaveAttribute('aria-pressed', 'false')
  await page.waitForTimeout(1500)
  expect(requests).toEqual([])
  expect((await audio(page)).states).toEqual([])
})

test('the rail turns sound on, keeps the choice, and loads only what the view needs', async ({
  page,
}) => {
  test.slow()
  const requests = soundRequests(page)
  await openAtlas(page)
  await railSound(page).click()
  await expect(railSound(page)).toHaveAttribute('aria-pressed', 'true')
  expect(await storedSound(page)).toMatchObject({ muted: false })
  await expect.poll(async () => (await audio(page)).states).toEqual(['running'])
  await expect.poll(() => requests.some((path) => path.includes('/wind.'))).toBe(true)
  await expect.poll(async () => (await audio(page)).decoded.length).toBeGreaterThan(1)
  expect((await audio(page)).decoded).not.toContain('failed')
  expect(requests.filter((path) => path.includes('/cave.'))).toEqual([])

  await page.reload()
  await expect(page.locator('[data-atlas-root]')).toHaveAttribute('data-atlas-state', 'ready', {
    timeout: 90_000,
  })
  await expect(railSound(page)).toHaveAttribute('aria-pressed', 'true')
})

test('the Sons tab mutes the site and sets each volume', async ({ page }) => {
  await openAtlas(page)
  await openPane(page, 'Options')
  await panel(page).getByRole('tab', { name: 'Sons' }).click()
  const tab = panel(page).getByRole('tabpanel')
  await tab.getByRole('button', { name: 'Son', exact: true }).click()
  await expect(railSound(page)).toHaveAttribute('aria-pressed', 'true')

  const ambience = tab.getByRole('slider', { name: 'Ambiance' })
  await ambience.focus()
  await page.keyboard.press('ArrowLeft')
  await expect
    .poll(() => storedSound(page))
    .toMatchObject({ muted: false, levels: { ambience: 0.75 } })

  await tab.getByRole('button', { name: 'Son', exact: true }).click()
  await expect(railSound(page)).toHaveAttribute('aria-pressed', 'false')
  expect(await storedSound(page)).toMatchObject({ muted: true, levels: { ambience: 0.75 } })
})

test('a sound left on waits for the reader to act before it plays', async ({ page }) => {
  await activatedOnlyByTheReader(page)
  await soundOn(page)
  await openAtlas(page)
  expect((await audio(page)).states).toEqual([])
  await openPane(page, 'Lieu')
  await expect.poll(async () => (await audio(page)).states).toEqual(['running'])
})

test('leaving the Atlas through swup closes its audio', async ({ page }) => {
  test.slow()
  await soundOn(page)
  await openAtlas(page)
  await openPane(page, 'Lieu')
  await expect.poll(async () => (await audio(page)).states).toEqual(['running'])
  await page.locator('#site-header [data-nav="home"]').click()
  await expect(page).toHaveURL('/fr')
  await expect.poll(async () => (await audio(page)).states).toEqual(['closed'])
})

test('a page without the Atlas fetches no sound, even with sound on', async ({ page }) => {
  await soundOn(page)
  const requests = soundRequests(page)
  await page.goto('/fr')
  await page.locator('main').click()
  await page.waitForLoadState('networkidle')
  expect(requests).toEqual([])
  expect((await audio(page)).states).toEqual([])
})
