import { expect, type Page, test } from '@playwright/test'

const SETTLED = /^(ready|map-unavailable)$/
const THREE_SIGNATURE = 'THREE.WebGLRenderer'

function swupComplaints(page: Page): string[] {
  const complaints: string[] = []
  page.on('console', (message) => {
    if (message.text().includes('[swup]')) complaints.push(message.text())
  })
  return complaints
}

function loadedScripts(page: Page): Promise<string>[] {
  const scripts: Promise<string>[] = []
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script' && response.ok()) {
      scripts.push(response.text())
    }
  })
  return scripts
}

function atlasInterfaceRules(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      [...document.styleSheets]
        .flatMap((sheet) => [...sheet.cssRules])
        .filter((rule) => rule.cssText.includes('.au-atlas-')).length,
  )
}

test.use({ reducedMotion: 'reduce' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    window.localStorage.setItem('aubaine.atlas.settings', JSON.stringify({ quality: 'low' })),
  )
})

async function settled(page: Page): Promise<void> {
  await expect(page.locator('[data-atlas-root]')).toHaveAttribute('data-atlas-state', SETTLED, {
    timeout: 90_000,
  })
}

test('the Atlas tab enters through swup and hands the next page back untouched', async ({
  page,
}) => {
  test.slow()
  const complaints = swupComplaints(page)
  await page.goto('/fr/arbres')
  await page.waitForFunction(() => 'swup' in window)
  await page.evaluate(() => document.documentElement.setAttribute('data-same-document', ''))

  await page.locator('#site-header [data-nav="atlas"]').click()
  await expect(page).toHaveURL('/fr/atlas')
  await settled(page)
  await expect(page).toHaveTitle('Atlas · Aubaine')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
  await expect(page.locator('#site-header [data-nav="atlas"]')).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.locator('#site-footer')).toBeHidden()
  expect(await atlasInterfaceRules(page)).toBeGreaterThan(0)

  await page.locator('#site-header [data-nav="home"]').click()
  await expect(page).toHaveURL('/fr')
  await expect(page.locator('.au-atlas__canvas')).toHaveCount(0)
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
  await expect(page.locator('#site-footer')).toBeVisible()
  await expect.poll(() => atlasInterfaceRules(page)).toBe(0)

  await page.goBack()
  await expect(page).toHaveURL('/fr/atlas')
  await settled(page)
  expect(await atlasInterfaceRules(page)).toBeGreaterThan(0)
  await page.goForward()
  await expect(page).toHaveURL('/fr')
  await expect(page.locator('html')).toHaveAttribute('data-same-document', '')
  expect(complaints).toEqual([])
})

for (const { path, lang, badge } of [
  { path: '/fr/atlas', lang: 'fr-FR', badge: 'Brouillon' },
  { path: '/en/atlas', lang: 'en-GB', badge: 'Draft' },
]) {
  test(`${path} is a draft with one title, kept out of the index`, async ({ page }) => {
    await page.goto(path)
    await settled(page)
    await expect(page).toHaveTitle('Atlas · Aubaine')
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByText(badge, { exact: true }).first()).toBeVisible()
  })
}

test('three and the map interface styles load on the Atlas and nowhere around it', async ({
  page,
}) => {
  const scripts = loadedScripts(page)
  for (const path of ['/fr', '/fr/arbres']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    expect(await atlasInterfaceRules(page)).toBe(0)
  }
  const around = await Promise.all(scripts.splice(0))
  expect(around.length).toBeGreaterThan(0)
  expect(around.filter((text) => text.includes(THREE_SIGNATURE))).toEqual([])

  await page.goto('/fr/atlas')
  await settled(page)
  const atlas = await Promise.all(scripts.splice(0))
  expect(atlas.some((text) => text.includes(THREE_SIGNATURE))).toBe(true)
  expect(await atlasInterfaceRules(page)).toBeGreaterThan(0)
})

test('without WebGL 2 the places stay listed and three is never fetched', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, options?: unknown) {
        return kind === 'webgl2' ? null : original.call(this, kind, options)
      },
    })
  })
  const scripts = loadedScripts(page)
  await page.goto('/fr/atlas')
  await expect(page.locator('[data-atlas-root]')).toHaveAttribute(
    'data-atlas-state',
    'map-unavailable',
    { timeout: 30_000 },
  )
  await expect(
    page.getByRole('heading', { level: 2, name: 'La carte ne peut pas s’afficher ici' }),
  ).toBeVisible()
  await expect(
    page
      .getByRole('complementary', { name: 'Panneau de l’Atlas' })
      .getByRole('button', { name: /Le Bastion/ }),
  ).toBeVisible()
  await page.waitForLoadState('networkidle')
  const loaded = await Promise.all(scripts)
  expect(loaded.filter((text) => text.includes(THREE_SIGNATURE))).toEqual([])
})

test.describe('a reader who prefers less motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('opens the Atlas framed and still, with its animations off', async ({ page }) => {
    await page.addInitScript(() => {
      new MutationObserver(() => {
        const width = document.querySelector<HTMLElement>('.au-atlas-scale__bar')?.style.width
        const seen = document.documentElement.dataset['atlasScaleWidths']?.split(' ') ?? []
        if (width && seen.at(-1) !== width) {
          document.documentElement.dataset['atlasScaleWidths'] = [...seen, width].join(' ')
        }
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] })
    })
    await page.goto('/fr/atlas')
    await settled(page)
    await page.getByRole('button', { name: 'Options', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Animations' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    const html = page.locator('html')
    await expect(html).toHaveAttribute('data-atlas-scale-widths', /px/)
    await page.waitForTimeout(2_000)
    await expect(html).toHaveAttribute('data-atlas-scale-widths', /^\S+$/)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('hides the map controls behind an open pane until it closes', async ({ page }) => {
    await page.goto('/fr/atlas')
    await settled(page)
    const topView = page.getByRole('radio', { name: /Dessus/ })
    await expect(topView).toBeVisible()
    await page.getByRole('button', { name: 'Lieu', exact: true }).click()
    await expect(topView).toBeHidden()
    await page.getByRole('button', { name: 'Fermer le panneau' }).click()
    await expect(topView).toBeVisible()
  })
})
