import { expect, type Page, test } from '@playwright/test'

function swupComplaints(page: Page): string[] {
  const complaints: string[] = []
  page.on('console', (message) => {
    if (message.text().includes('[swup]')) complaints.push(message.text())
  })
  return complaints
}

async function holdHandOff(page: Page, path: string): Promise<() => void> {
  let release = () => {}
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route(
    (url) => url.pathname === path,
    async (route) => {
      if (route.request().resourceType() === 'fetch') await released
      await route.continue()
    },
  )
  return release
}

async function expectArrivedHome(page: Page, locale: 'fr' | 'en'): Promise<void> {
  await expect(page).toHaveURL(`/${locale}`)
  await expect(page.locator('[data-threshold]')).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('lang', locale === 'fr' ? 'fr-FR' : 'en-GB')
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    `https://aubaine.io/${locale}`,
  )
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
  await expect(page.locator('#site-header [data-nav]')).toHaveCount(3)
  await expect(page.locator('#site-header')).toHaveAttribute('data-arriving', '')
}

test.describe('a French browser', () => {
  test.use({ locale: 'fr-FR' })

  test('crosses the threshold to the French home', async ({ page }) => {
    const complaints = swupComplaints(page)
    await page.goto('/')
    await expectArrivedHome(page, 'fr')
    await expect(page.locator('[data-nav="home"]')).toHaveText('Accueil')
    expect(complaints).toEqual([])
  })
})

test.describe('an English browser', () => {
  test.use({ locale: 'en-GB' })

  test('crosses the threshold to the English home', async ({ page }) => {
    const complaints = swupComplaints(page)
    await page.goto('/')
    await expectArrivedHome(page, 'en')
    await expect(page.locator('[data-nav="home"]')).toHaveText('Home')
    expect(complaints).toEqual([])
  })
})

test.describe('a browser that reads neither language', () => {
  test.use({ locale: 'de-DE' })

  test('crosses the threshold to the English home', async ({ page }) => {
    await page.goto('/')
    await expectArrivedHome(page, 'en')
  })
})

test.describe('the hand-off', () => {
  test.use({ locale: 'en-GB' })

  test('shows only the logo and the loading crest until the home arrives', async ({ page }) => {
    const release = await holdHandOff(page, '/en')
    await page.goto('/')

    const crest = page.locator('[data-load-crest]')
    await expect(crest).toHaveAttribute('data-phase', 'loading')
    await expect(crest).toBeVisible()
    await expect(page.locator('#site-header a[aria-label="Aubaine"]')).toBeVisible()
    await expect(page.locator('#site-header [data-arrive]')).toHaveCount(0)
    await expect(page).toHaveURL('/en')

    release()
    await expectArrivedHome(page, 'en')
    await expect(page.locator('#site-header [data-arrive]').first()).toHaveCSS(
      'animation-name',
      'au-pop',
    )
    await expect(crest).not.toHaveAttribute('data-phase', /.*/)
    await expect(crest).toBeHidden()
  })

  test('leaves no threshold behind in the history', async ({ page }) => {
    await page.goto('/en/licences')
    await page.goto('/')
    await expectArrivedHome(page, 'en')

    await page.goBack()
    await expect(page).toHaveURL('/en/licences')
  })

  test('a failed fetch still lands on the home without leaving the site', async ({ page }) => {
    let failed = false
    await page.route(
      (url) => url.pathname === '/en',
      async (route) => {
        if (!failed && route.request().resourceType() === 'fetch') {
          failed = true
          await route.abort('failed')
          return
        }
        await route.continue()
      },
    )

    await page.goto('/en/licences')
    await page.goto('/')
    await expect(page).toHaveURL('/en')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('[data-threshold]')).toHaveCount(0)
    expect(failed).toBe(true)

    await page.goBack()
    await expect(page).toHaveURL('/en/licences')
  })

  test('keeps both languages reachable above the crest when the scripts never load', async ({
    page,
  }) => {
    await page.route('**/_astro/*.js', (route) => route.abort('failed'))
    await page.goto('/')

    const crest = page.locator('[data-load-crest]')
    await expect(crest).toHaveAttribute('data-phase', 'loading')
    await expect(crest).toBeVisible()

    const english = page.getByRole('link', { name: 'English', exact: true })
    await expect(english).toBeVisible()
    const paintedOnTop = await english.evaluate((link) => {
      const veil = document.querySelector<HTMLElement>('[data-load-crest]')
      if (!veil) return false
      veil.style.pointerEvents = 'auto'
      const box = link.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      veil.style.pointerEvents = ''
      return hit !== null && link.contains(hit)
    })
    expect(paintedOnTop).toBe(true)

    await page.unrouteAll()
    await english.click()
    await expect(page).toHaveURL('/en')
  })
})

test.describe('the hand-off under reduced motion', () => {
  test.use({ locale: 'en-GB', reducedMotion: 'reduce' })

  test('shows the page instead of the crest and lands on the home', async ({ page }) => {
    const release = await holdHandOff(page, '/en')
    await page.goto('/')

    await expect(page.locator('[data-load-crest]')).toBeHidden()
    await expect(page.getByRole('heading', { level: 1, name: 'Aubaine' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'English', exact: true })).toBeVisible()

    release()
    await expectArrivedHome(page, 'en')
    await expect(page.locator('[data-load-crest]')).toBeHidden()
  })
})

test('the threshold keeps crawlers out and still describes the site', async ({ request }) => {
  const response = await request.get('/')
  expect(response.status()).toBe(200)
  const html = await response.text()
  expect(html).toContain('<meta name="robots" content="noindex, follow">')
  expect(html).toMatch(/<meta property="og:image" content="https:\/\/aubaine\.io\/_astro\/[^"]+">/)
  expect(html).not.toContain('http-equiv="refresh"')
  expect(html).toContain('data-threshold')
})

test('the sitemap leaves the threshold out', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap-0.xml')).text()
  expect(sitemap).not.toContain('<loc>https://aubaine.io/</loc>')
  expect(sitemap).toContain('<loc>https://aubaine.io/fr</loc>')
  expect(sitemap).toContain('<loc>https://aubaine.io/en</loc>')
})
