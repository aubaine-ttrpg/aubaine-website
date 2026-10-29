import { expect, test } from '@playwright/test'

import { LOCALES } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'

const HUB = '[data-stage-host]:not([data-character])'
const HUB_KINDS = ['trees', 'species'] as const
const HUBS = HUB_KINDS.map((kind) => pathFor(kind, 'en'))
const DARK_STAGE = 'rgb(6, 5, 13)'
const TEXT_TO_LIST = 96
const t = strings('en')

for (const path of HUBS) {
  test(`${path} opens on a stage with one title and no picture of its own`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator(`${HUB} h1`)).toBeVisible()
    await expect(page.locator(`${HUB} [data-stage]`)).toHaveCount(1)
    await expect(page.locator('.au-hero')).toHaveCount(0)
  })

  test(`${path} links each entry once in the roster and the spotlight once more`, async ({
    page,
  }) => {
    await page.goto(path)
    const entries = await page
      .locator('[data-entry] a[href]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    const links = await page
      .locator('main a[href]')
      .evaluateAll((all) => all.map((link) => link.getAttribute('href')))
    const opened = await page.locator('[data-spotlight-open]').getAttribute('href')
    for (const href of entries) {
      expect(links.filter((link) => link === href)).toHaveLength(href === opened ? 2 : 1)
    }

    const below = await page.locator('.au-filterbar input[type="search"]').first().boundingBox()
    const lowest = await page
      .locator(`${HUB} h1, ${HUB} .au-plates__about`)
      .evaluateAll((texts) => Math.max(...texts.map((text) => text.getBoundingClientRect().bottom)))
    if (!below) throw new Error('the hub lost what sits under its title')
    expect(below.y - lowest).toBeLessThan(TEXT_TO_LIST)
  })
}

for (const [path, title, lead] of [
  [pathFor('trees', 'en'), t.trees, t.treesLead],
  [pathFor('species', 'en'), t.speciesIndex, t.speciesLead],
] as const) {
  test(`${path} keeps its lead in a note beside the title, with its handbook chapter`, async ({
    page,
  }) => {
    await page.goto(path)
    await expect(page.locator(HUB).getByText(lead)).toBeHidden()
    await page.getByRole('button', { name: t.hubAbout(title) }).click()
    const note = page.locator('#hub-note')
    await expect(note).toBeVisible()
    await expect(note).toContainText(lead)
    const chapter = note.getByRole('link')
    const label = (await chapter.textContent()) ?? ''
    const href = (await chapter.getAttribute('href')) ?? ''
    expect(href).toMatch(new RegExp(`^${pathFor('book', 'en')}/`))
    await page.goto(href)
    const heading = (await page.locator('h1').textContent()) ?? ''
    expect(label.replace('→', '').trim()).toBe(t.hubChapter(heading.trim()))
  })
}

for (const width of [1512, 1100, 390, 320]) {
  test(`the title and its help button stay in their column and apart at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 860 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const path of LOCALES.flatMap((locale) =>
      HUB_KINDS.map((kind) => pathFor(kind, locale)),
    )) {
      await page.goto(path)
      const placement = await page.locator('.au-plates').evaluate((block) => {
        const button = block.querySelector('.au-plates__about')?.getBoundingClientRect()
        if (!button) return 'no button'
        const frame = block.getBoundingClientRect()
        if (button.left < frame.left - 0.5 || button.right > frame.right + 0.5) return 'outside'
        const plates = [...block.querySelectorAll('.au-plates__plate')]
        const tilt = 4
        const spilled = plates.some((plate) => {
          const box = plate.getBoundingClientRect()
          return box.left < frame.left - tilt || box.right > frame.right + tilt
        })
        if (spilled) return 'a plate leaves the column'
        const covered = plates.some((plate) => {
          const box = plate.getBoundingClientRect()
          return (
            box.left < button.right &&
            button.left < box.right &&
            box.top < button.bottom &&
            button.top < box.bottom
          )
        })
        return covered ? 'covers a plate' : 'clear'
      })
      expect(placement, path).toBe('clear')
    }
  })
}

test('the pause button stills the stage and is remembered on the next hub', async ({ page }) => {
  await page.goto(pathFor('species', 'en'))
  await page.waitForFunction(() => 'swup' in window)
  await page.getByRole('button', { name: t.stagePause }).click()
  await expect(page.locator(HUB)).toHaveAttribute('data-still', '')
  await page.evaluate(
    (target) => {
      const swup = (window as unknown as { swup: { navigate: (url: string) => void } }).swup
      swup.navigate(target)
    },
    pathFor('trees', 'en'),
  )
  await expect(page).toHaveURL(pathFor('trees', 'en'))
  await expect(page.locator(HUB)).toHaveAttribute('data-still', '')
  await expect(page.getByRole('button', { name: t.stagePlay })).toBeVisible()
})

test('a Swup visit binds the hub it brings, and back restores the first', async ({ page }) => {
  await page.goto(pathFor('trees', 'en'))
  await page.waitForFunction(() => 'swup' in window)
  await page.evaluate(
    (target) => {
      const swup = (window as unknown as { swup: { navigate: (url: string) => void } }).swup
      swup.navigate(target)
    },
    pathFor('species', 'en'),
  )
  await expect(page).toHaveURL(pathFor('species', 'en'))
  await expect(page.getByRole('button', { name: t.stagePause })).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL(pathFor('trees', 'en'))
  await expect(page.locator(`${HUB} h1`)).toBeVisible()
  await expect(page.getByRole('button', { name: t.stagePause })).toBeVisible()
})

test('the light theme keeps the hub a dark stage', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('aubaine.theme', 'light'))
  await page.goto(pathFor('species', 'en'))
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  const background = await page
    .locator(HUB)
    .evaluate((element) => getComputedStyle(element).backgroundColor)
  expect(background).toBe(DARK_STAGE)
})

test('print keeps the title and drops the stage', async ({ page }) => {
  await page.goto(pathFor('trees', 'en'))
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator(`${HUB} h1`)).toBeVisible()
  await expect(page.locator(`${HUB} [data-stage]`)).toBeHidden()
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('a hub never fetches the stage code and hides the pause button', async ({ page }) => {
    const fetched: string[] = []
    page.on('request', (request) => {
      if (/\/stage\.[^/]*\.js$/.test(request.url())) fetched.push(request.url())
    })
    await page.goto(pathFor('species', 'en'))
    await page.waitForLoadState('networkidle')
    expect(fetched).toEqual([])
    await expect(page.locator('[data-stage-toggle]')).toBeHidden()
  })
})
