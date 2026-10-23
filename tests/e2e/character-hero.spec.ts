import { expect, type Page, test } from '@playwright/test'

const HERO = '[data-character]'
const CARD = `${HERO} [data-plate="hero"] img`
const MARCHAND = '/fr/arbre/marchand'
const NNOR = '/fr/espece/nnor'
const DARK_INK = 'rgb(236, 232, 247)'

const MARCHAND_PROFILE = {
  fr: ['Dégâts D', 'Robustesse F', 'Soin C', 'Utilité S', 'Liberté S', 'Roleplay A'],
  en: ['Damage D', 'Tankiness F', 'Healing C', 'Utility S', 'Freeform S', 'Roleplay A'],
}

async function profileReading(page: Page): Promise<string[]> {
  return page
    .locator(`${HERO} .au-rank__axis`)
    .evaluateAll((axes) =>
      axes.map((axis) =>
        [axis.querySelector('dt'), axis.querySelector('dd')]
          .map((node) => node?.textContent?.trim() ?? '')
          .join(' '),
      ),
    )
}

test('a tree hero names its kind, its descriptors and its profile, in both languages', async ({
  page,
}) => {
  await page.goto(MARCHAND)
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator(`${HERO} h1`)).toHaveText('Marchand')
  await expect(page.locator(`${HERO} .au-character__kind`)).toHaveText('Arbre d’Archétype')
  await expect(page.getByRole('list', { name: 'Descripteurs' }).getByRole('listitem')).toHaveText([
    'Achète',
    'Vend',
    'Échange',
  ])
  expect(await profileReading(page)).toEqual(MARCHAND_PROFILE.fr)

  await page.goto('/en/tree/marchand')
  await expect(page.locator(`${HERO} .au-character__kind`)).toHaveText('Archetype Tree')
  await expect(page.getByRole('list', { name: 'Descriptors' }).getByRole('listitem')).toHaveText([
    'Buys',
    'Sells',
    'Trades',
  ])
  expect(await profileReading(page)).toEqual(MARCHAND_PROFILE.en)
})

test('a species hero carries descriptors and its traits, and no profile', async ({ page }) => {
  await page.goto(NNOR)
  await expect(page.locator(`${HERO} .au-character__kind`)).toHaveText('Espèce')
  await expect(page.getByRole('list', { name: 'Descripteurs' }).getByRole('listitem')).toHaveText([
    'Tribal',
    'Solidaire',
    'Farouche',
    '...Chèvre ?!',
  ])
  await expect(page.getByRole('group', { name: 'Traits de l’Espèce' })).toBeVisible()
  await expect(page.locator(`${HERO} .au-rank`)).toHaveCount(0)

  await page.goto('/en/species/nnor')
  await expect(page.getByRole('list', { name: 'Descriptors' }).getByRole('listitem')).toHaveText([
    'Tribal',
    'Close-knit',
    'Fierce',
    '...Goat?!',
  ])
})

test('each hero takes its accent from its own cover', async ({ page }) => {
  const stickerColour = async (path: string): Promise<number[]> => {
    await page.goto(path)
    return page
      .locator(`${HERO} .au-sticker`)
      .first()
      .evaluate((node) =>
        (getComputedStyle(node).backgroundColor.match(/\d+/g) ?? []).slice(0, 3).map(Number),
      )
  }
  const [nnorRed = 0, nnorGreen = 0, nnorBlue = 0] = await stickerColour(NNOR)
  expect(nnorRed - nnorGreen, 'the Nnor accent is a red').toBeGreaterThan(100)
  expect(nnorRed - nnorBlue).toBeGreaterThan(100)
  const [red = 0, green = 0, blue = 0] = await stickerColour(MARCHAND)
  expect(Math.min(red, green, blue), 'the Marchand accent is a light beige').toBeGreaterThan(150)
  expect(red >= green && green >= blue).toBe(true)
})

test('a card wears its emblem, and a card without one wears none', async ({ page, request }) => {
  for (const path of [NNOR, MARCHAND]) {
    await page.goto(path)
    const emblem = page.locator(`${HERO} .au-character__emblem`)
    await expect(emblem, path).toHaveAttribute('aria-hidden', 'true')
    const url = (await emblem.locator('image').getAttribute('href')) ?? ''
    expect(url, path).toMatch(/\.svg$/)
    const response = await request.get(new URL(url, page.url()).href)
    expect(response.status(), url).toBe(200)
  }
  await page.goto('/fr/arbre/berserker')
  await expect(page.locator(`${HERO} .au-character__emblem`)).toHaveCount(0)
})

test('a tree without a profile or descriptors shows neither', async ({ page }) => {
  await page.goto('/fr/arbre/berserker')
  await expect(page.locator(`${HERO} .au-rank`)).toHaveCount(0)
  await expect(page.locator(`${HERO} .au-stickers`)).toHaveCount(0)
  await expect(page.locator(`${HERO} h1`)).toHaveText('Berserker')
})

test('the profile note says how to read the ranks', async ({ page }) => {
  await page.goto(MARCHAND)
  await page.getByRole('button', { name: 'Comment lire le profil' }).click()
  const note = page.locator('#profile-note')
  await expect(note).toBeVisible()
  await expect(note).toContainText('F, D, C, B, A ou S')
  await note.getByRole('button', { name: 'Fermer' }).click()
  await expect(note).toBeHidden()
})

async function freezeAnimations(page: Page): Promise<void> {
  const devtools = await page.context().newCDPSession(page)
  await devtools.send('Animation.enable')
  await devtools.send('Animation.setPlaybackRate', { playbackRate: 0 })
}

async function atMoment(page: Page, milliseconds: number, animated: string): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(
        (selector) => (document.querySelector(selector)?.getAnimations().length ?? 0) > 0,
        animated,
      ),
    )
    .toBe(true)
  await page.evaluate((time) => {
    for (const animation of document.getAnimations()) {
      animation.pause()
      animation.currentTime = time
    }
  }, milliseconds)
}

function corners(page: Page): Promise<{ shape: number[][]; markers: number[][] }> {
  return page.evaluate(() => {
    const numbers = (text: string) => (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
    const pairs = (values: number[]) =>
      Array.from({ length: Math.floor(values.length / 2) }, (_, index) => [
        values[index * 2] ?? 0,
        values[index * 2 + 1] ?? 0,
      ])
    const edge = document.querySelector('.au-rank__edge')
    return {
      shape: pairs(numbers(edge ? getComputedStyle(edge).getPropertyValue('d') : '')),
      markers: [...document.querySelectorAll('.au-rank__vertex')].map((marker) =>
        numbers(getComputedStyle(marker).translate),
      ),
    }
  })
}

test('the profile unfolds from its centre, its markers riding its corners', async ({ page }) => {
  await freezeAnimations(page)
  await page.goto(MARCHAND)
  await atMoment(page, 0, '.au-rank__edge')
  const folded = await corners(page)
  expect(folded.shape).toHaveLength(6)
  for (const point of [...folded.shape, ...folded.markers]) expect(point).toEqual([100, 100])

  await atMoment(page, 700, '.au-rank__edge')
  const sliding = await corners(page)
  sliding.markers.forEach((marker, index) => {
    expect(marker[0]).toBeCloseTo(sliding.shape[index]?.[0] ?? Number.NaN, 1)
    expect(marker[1]).toBeCloseTo(sliding.shape[index]?.[1] ?? Number.NaN, 1)
  })
  expect(sliding.shape.some(([x, y]) => x !== 100 || y !== 100)).toBe(true)

  await atMoment(page, 5000, '.au-rank__edge')
  const settled = await corners(page)
  const outline = await page
    .locator('.au-rank__edge')
    .evaluate((node) => (node.getAttribute('d')?.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number))
  expect(settled.shape.flat()).toEqual(outline)
})

test('the plates keep their tilt through their whole arrival', async ({ page }) => {
  await freezeAnimations(page)
  await page.goto(NNOR)
  for (const moment of [0, 250, 600, 5000]) {
    await atMoment(page, moment, `${HERO} .au-trait`)
    const tilts = await page
      .locator(`${HERO} .au-trait`)
      .evaluateAll((plates) =>
        plates.map((plate) => Number.parseFloat(getComputedStyle(plate).rotate)),
      )
    expect(tilts.length, `${moment} ms`).toBe(3)
    for (const tilt of tilts) expect(Math.abs(tilt), `${moment} ms`).toBeGreaterThan(0.5)
  }
})

test('nothing in the hero starts invisible', async ({ page }) => {
  await freezeAnimations(page)
  await page.goto(MARCHAND)
  await atMoment(page, 0, '[data-character] h1')
  const opacities = await page.evaluate(() => {
    return ['[data-character] h1', '[data-character] [data-plate="hero"] img'].map((selector) => {
      const node = document.querySelector(selector)
      return node ? getComputedStyle(node).opacity : 'missing'
    })
  })
  expect(opacities).toEqual(['1', '1'])
})

test('the hero stays a dark stage in the light theme', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('aubaine.theme', 'light'))
  await page.goto(NNOR)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await page.locator(`${HERO} h1`).evaluate((node) => getComputedStyle(node).color)).toBe(
    DARK_INK,
  )
  expect(
    await page.locator('.au-reading').evaluate((node) => getComputedStyle(node).color),
  ).not.toBe(DARK_INK)
})

test.describe('on a phone', () => {
  for (const width of [320, 390]) {
    test(`the card comes first and nothing scrolls sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.goto(MARCHAND)
      const card = await page.locator(CARD).boundingBox()
      const title = await page.locator(`${HERO} h1`).boundingBox()
      expect(card && title && card.y < title.y).toBe(true)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        ),
      ).toBe(0)
    })
  }
})

test('the card leans toward the pointer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(NNOR)
  const hero = page.locator(HERO)
  await page.mouse.move(1300, 200)
  await expect(hero).toHaveAttribute('data-tilting', '')
  const lean = await hero.evaluate((node) => Number(node.style.getPropertyValue('--tilt-x')))
  expect(lean).toBeGreaterThan(0)
  expect(lean).toBeLessThan(1)
})

test('the pause button ships hidden, for the script to reveal', async ({ request }) => {
  const html = await (await request.get(NNOR)).text()
  expect(html).toMatch(/<button[^>]*data-stage-toggle[^>]*\shidden[\s>]/)
})

test('the pause button works by keyboard and is remembered on the next page', async ({ page }) => {
  await page.goto(NNOR)
  const pause = page.getByRole('button', { name: 'Mettre en pause l’animation du fond' })
  await pause.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator(HERO)).toHaveAttribute('data-still', '')
  await page.goto(MARCHAND)
  await expect(page.locator(HERO)).toHaveAttribute('data-still', '')
  await expect(page.getByRole('button', { name: 'Lancer l’animation du fond' })).toBeVisible()
})

test('a Swup visit binds the hero it brings', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/fr/especes')
  await page.waitForFunction(() => 'swup' in window)
  await page.evaluate(() => document.documentElement.setAttribute('data-same-document', ''))
  await page.locator('[data-cover-card]', { hasText: 'Nnor' }).first().click()
  await expect(page).toHaveURL(NNOR)
  await expect(page.locator('html')).toHaveAttribute('data-same-document', '')
  await expect(
    page.getByRole('button', { name: 'Mettre en pause l’animation du fond' }),
  ).toBeVisible()
  await page.mouse.move(1300, 220)
  await expect(page.locator(HERO)).toHaveAttribute('data-tilting', '')
  await page.goBack()
  await expect(page).toHaveURL('/fr/especes')
  await expect(page.getByRole('heading', { level: 1, name: 'Espèces' })).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL(NNOR)
  await expect(page.locator(`${HERO} h1`)).toHaveText('Nnor')
})

test('a tree node visit keeps the hero in place', async ({ page }) => {
  await page.goto('/fr/arbre/marchand#arbre')
  await page.evaluate(() =>
    document.querySelector('[data-character]')?.setAttribute('data-kept', ''),
  )
  await page.locator('[data-plate-node][data-node="ESTIMA-001"]').click()
  await expect(page).toHaveURL('/fr/arbre/marchand/ESTIMA-001#arbre')
  await expect(page.locator(`${HERO}[data-kept]`)).toHaveCount(1)
})

test('print keeps the card and drops the stage', async ({ page }) => {
  await page.goto(NNOR)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator(`${HERO} [data-stage]`)).toBeHidden()
  await expect(page.locator(`${HERO} .au-character__ghost`)).toBeHidden()
  await expect(page.locator(CARD)).toBeVisible()
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the card never leans and the pause button stays out of the way', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto(NNOR)
    await page.mouse.move(1300, 200)
    await page.waitForTimeout(200)
    await expect(page.locator(HERO)).not.toHaveAttribute('data-tilting')
    await expect(page.locator('[data-stage-toggle]')).toBeHidden()
  })
})
