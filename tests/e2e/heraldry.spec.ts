import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, type Page, test } from '@playwright/test'

import { BANNER_CLOTH, EFFECT_TIERS } from '../../src/lib/art-effect/presets'
import type { ResolvedSpecies } from '../../src/lib/game/build'
import { HERALDRY_PLACEMENT } from '../../src/lib/game/derive'
import type { Heraldry } from '../../src/lib/game/schema'
import type { Locale } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'
import { type Oklch, oklchOf, rgbFromHex } from '../../src/lib/key-colour'
import { corpus } from './support/corpus'

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i
const BANNER = '[data-drape="banner"]'
const FLAG = '[data-drape="flag"]'
const ARMS = '[data-drape="arms"]'
const GLASS = '.au-prose__frame'
const STAGE = '[data-stage]'
const HERALDRY_CODE = /\/(?:banners|flags|glazes|arms)\.[^/]*\.js$/
const TEXTURE =
  /\/(?:combination-room|rough-linen-relief|velour-velvet-relief|[a-z0-9-]+-(?:colour|relief|finish))\.[^/]*\.(?:webp|avif)$/
const KINDS = Object.keys(HERALDRY_PLACEMENT) as Heraldry['kind'][]
const BESIDE = KINDS.filter((kind) => HERALDRY_PLACEMENT[kind] === 'beside')
const CLOTH_MOST_PER_SECOND = Math.max(
  ...Object.values(EFFECT_TIERS).map((tier) => tier.cloth?.perSecond ?? 0),
)
const STILL_BUDGET = 5000

test.use({ channel: 'chromium' })

type Counted = { drapeCopies: Record<string, number>; glassCopies: number; glContexts: number }

function hasKind(species: ResolvedSpecies, kind: Heraldry['kind']): boolean {
  return species.subspecies.some((sub) => sub.heraldry?.kind === kind)
}

async function heraldic(locale: Locale): Promise<ResolvedSpecies> {
  const species = (await corpus(locale)).species.find((entry) =>
    KINDS.every((kind) => hasKind(entry, kind)),
  )
  if (!species) throw new Error(`no species carries every kind of heraldry (${KINDS.join(', ')})`)
  return species
}

async function plain(): Promise<ResolvedSpecies> {
  const glazed = await glazedLore()
  const species = (await corpus('fr')).species.find(
    (entry) => entry.subspecies.every((sub) => !sub.heraldry) && !glazed.has(entry.id),
  )
  if (!species) throw new Error('every species carries heraldry or a glazed picture')
  return species
}

async function glazedLore(): Promise<Set<string>> {
  const directory = resolve(import.meta.dirname, '../../data/lore/species')
  const glazed = new Set<string>()
  for (const file of await readdir(directory)) {
    if (!file.endsWith('.md') || file.endsWith('.en.md')) continue
    if ((await readFile(resolve(directory, file), 'utf8')).includes('"glazed")')) {
      glazed.add(file.replace(/\.md$/, ''))
    }
  }
  return glazed
}

function speciesPath(species: ResolvedSpecies, locale: Locale = 'fr'): string {
  return pathFor('speciesEntry', locale, { species: species.id })
}

async function count(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const counted = window as unknown as Counted
    counted.drapeCopies = {}
    counted.glassCopies = 0
    counted.glContexts = 0
    const copy = CanvasRenderingContext2D.prototype.drawImage
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'drawImage', {
      value(this: CanvasRenderingContext2D, ...args: unknown[]) {
        const holder = this.canvas.parentElement
        const kind = holder?.getAttribute('data-drape')
        if (kind) counted.drapeCopies[kind] = (counted.drapeCopies[kind] ?? 0) + 1
        if (holder?.matches('.au-prose__frame')) counted.glassCopies += 1
        return Reflect.apply(copy, this, args)
      },
    })
    const open = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value(this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        const context: unknown = Reflect.apply(open, this, [kind, ...rest])
        if (kind === 'webgl2' && context) counted.glContexts += 1
        return context
      },
    })
  })
}

type Copies = { banner: number; flag: number; arms: number; glass: number }

function copies(page: Page): Promise<Copies> {
  return page.evaluate(() => {
    const counted = window as unknown as Counted
    return {
      banner: counted.drapeCopies['banner'] ?? 0,
      flag: counted.drapeCopies['flag'] ?? 0,
      arms: counted.drapeCopies['arms'] ?? 0,
      glass: counted.glassCopies,
    }
  })
}

function contexts(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as Counted).glContexts)
}

async function bring(page: Page, selector: string): Promise<void> {
  await page
    .locator(selector)
    .first()
    .evaluate((node) => {
      window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY - 120)
    })
}

async function bringDrawn(page: Page, selector: string): Promise<void> {
  await bring(page, selector)
  const drawn = selector === GLASS ? `${GLASS}[data-lit] canvas` : `${selector}[data-draped] canvas`
  await expect(page.locator(drawn)).toHaveCount(1)
}

async function perSecond(page: Page, kind: 'banner' | 'flag'): Promise<number> {
  const from = (await copies(page))[kind]
  const start = Date.now()
  await page.waitForTimeout(1000)
  return (((await copies(page))[kind] - from) * 1000) / (Date.now() - start)
}

async function drawsFor(
  page: Page,
  kind: 'banner' | 'flag',
  milliseconds: number,
): Promise<number> {
  const from = (await copies(page))[kind]
  await page.waitForTimeout(milliseconds)
  return (await copies(page))[kind] - from
}

function bannerPixels(page: Page): Promise<string> {
  return page
    .locator(`${BANNER}[data-draped] canvas`)
    .evaluate((node: HTMLCanvasElement) => node.toDataURL())
}

async function dragBanner(page: Page): Promise<void> {
  const box = await page.locator(`${BANNER}[data-draped] canvas`).boundingBox()
  if (!box) throw new Error('the banner canvas has no box')
  const { rest } = BANNER_CLOTH
  const grip = {
    x: box.x + ((rest.x + rest.width / 2) / BANNER_CLOTH.aspect) * box.width,
    y: box.y + (rest.y + rest.height * 0.85) * box.height,
  }
  await page.mouse.move(grip.x, grip.y)
  await page.mouse.down()
  await page.mouse.move(grip.x + box.width * 0.3, grip.y - box.height * 0.1, { steps: 12 })
}

const apart = (a: number, b: number): number => Math.abs(((a - b + 540) % 360) - 180)

function middle(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN
}

async function restsWithin(page: Page, kind: keyof Copies, limit: number): Promise<number> {
  const start = Date.now()
  let previous = (await copies(page))[kind]
  for (;;) {
    await page.waitForTimeout(400)
    const now = (await copies(page))[kind]
    if (now === previous) return Date.now() - start
    previous = now
    if (Date.now() - start > limit) return Number.POSITIVE_INFINITY
  }
}

async function visit(page: Page, path: string): Promise<void> {
  await page.evaluate((target) => {
    const swup = (window as unknown as { swup: { navigate: (url: string) => void } }).swup
    swup.navigate(target)
  }, path)
  await expect(page).toHaveURL(path)
}

test.beforeEach(async ({ page }) => {
  await page.goto('/fr')
  const name = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('webgl2')
    if (!context) return 'none'
    const debug = context.getExtension('WEBGL_debug_renderer_info')
    return String(context.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : context.RENDERER))
  })
  test.skip(SOFTWARE.test(name) || name === 'none', `no hardware WebGL2 here (${name})`)
})

test('a page with no heraldry and no glazed picture never fetches their code, textures or maps', async ({
  page,
}) => {
  const fetched: string[] = []
  page.on('request', (request) => {
    if (HERALDRY_CODE.test(request.url()) || TEXTURE.test(request.url()))
      fetched.push(request.url())
  })
  for (const path of [speciesPath(await plain()), pathFor('species', 'fr')]) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
  }
  expect(fetched).toEqual([])
})

test('every piece of heraldry takes over its plain picture at once, named by its caption', async ({
  page,
}) => {
  for (const locale of ['fr', 'en'] as const) {
    const species = await heraldic(locale)
    await page.goto(speciesPath(species, locale))
    for (const sub of species.subspecies) {
      if (!sub.heraldry) continue
      const holder = page.locator(`#origine-${sub.id} [data-drape="${sub.heraldry.kind}"]`)
      await bring(page, `#origine-${sub.id}`)
      await expect(holder).toHaveAttribute('data-draped', '')
      await expect(holder).toHaveAttribute('aria-hidden', 'true')
      await expect(holder.locator('canvas')).toHaveCount(1)
      await expect(holder.locator('.au-heraldry__plain')).toBeHidden()
      await expect(page.locator(`#origine-${sub.id} figure`)).toHaveAccessibleName(
        sub.heraldry.name,
      )
    }
  }
})

test('the stage, the banner, the flag, the arms and the glass share one context', async ({
  page,
}) => {
  await count(page)
  await page.goto(speciesPath(await heraldic('fr')))
  await expect(page.locator(`${STAGE}[data-staged] > canvas`)).toHaveCount(1)
  for (const selector of [GLASS, BANNER, FLAG, ARMS]) await bringDrawn(page, selector)
  expect(await contexts(page)).toBe(1)
})

test('the banner stirs in the wind at its pace while on screen and stops off screen', async ({
  page,
}) => {
  await count(page)
  await page.goto(speciesPath(await heraldic('fr')))
  await bring(page, BANNER)
  await expect(page.locator(`${BANNER}[data-draped] canvas`)).toHaveCount(1)
  await expect
    .poll(() => perSecond(page, 'banner'), { timeout: STILL_BUDGET + 2000 })
    .toBeLessThanOrEqual(CLOTH_MOST_PER_SECOND + 2)
  expect(await perSecond(page, 'banner')).toBeGreaterThanOrEqual(5)
  const before = await bannerPixels(page)
  await page.waitForTimeout(1000)
  expect(await bannerPixels(page)).not.toBe(before)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  expect(await drawsFor(page, 'banner', 1000)).toBe(0)
})

test('the banner pauses by keyboard and holds its frame, and a drag still moves it until it rests', async ({
  page,
}) => {
  const t = strings('fr')
  await count(page)
  await page.goto(speciesPath(await heraldic('fr')))
  await bring(page, BANNER)
  const pause = page.getByRole('button', { name: t.bannerPause })
  await expect(pause).toBeVisible()
  await pause.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: t.bannerPlay })).toBeVisible()
  await page.waitForTimeout(200)
  const held = await bannerPixels(page)
  expect(await drawsFor(page, 'banner', 1000)).toBe(0)
  expect(await bannerPixels(page)).toBe(held)

  await dragBanner(page)
  expect(await bannerPixels(page)).not.toBe(held)
  await page.mouse.up()
  expect(await restsWithin(page, 'banner', STILL_BUDGET)).toBeLessThan(STILL_BUDGET)
  expect(await drawsFor(page, 'banner', 1000)).toBe(0)
})

test('the banner, the flag and the hero share one pause, which outlives the page', async ({
  page,
}) => {
  const t = strings('fr')
  await count(page)
  const path = speciesPath(await heraldic('fr'))
  await page.goto(path)
  await bring(page, BANNER)
  await page.getByRole('button', { name: t.bannerPause }).click()
  await bring(page, FLAG)
  await expect(page.getByRole('button', { name: t.flagPlay })).toBeVisible()

  await page.goto(path)
  await bring(page, BANNER)
  await expect(page.getByRole('button', { name: t.bannerPlay })).toBeVisible()
  expect(await restsWithin(page, 'banner', STILL_BUDGET)).toBeLessThan(STILL_BUDGET)
  expect(await drawsFor(page, 'banner', 1000)).toBe(0)
  await page.getByRole('button', { name: t.bannerPlay }).click()
  await expect.poll(() => drawsFor(page, 'banner', 500)).toBeGreaterThan(0)

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.getByRole('button', { name: t.stagePause }).click()
  await bring(page, BANNER)
  await expect(page.getByRole('button', { name: t.bannerPlay })).toBeVisible()
  await page.waitForTimeout(300)
  expect(await drawsFor(page, 'banner', 1000)).toBe(0)
})

async function expectOnCaptionRule(page: Page, selector: string): Promise<void> {
  const measured = await page.locator(selector).evaluate((figure) => {
    const caption = figure.querySelector('figcaption')
    const button = figure.querySelector('[data-drape-toggle]')
    if (!caption || !button) return undefined
    const rule = Number.parseFloat(getComputedStyle(caption, '::after').blockSize)
    const probe = document.createElement('div')
    probe.style.inlineSize = 'var(--au-caption-tail)'
    figure.append(probe)
    const tail = probe.getBoundingClientRect().width
    probe.remove()
    const captionBox = caption.getBoundingClientRect()
    const buttonBox = button.getBoundingClientRect()
    return {
      ruleCentre: captionBox.bottom - rule / 2,
      buttonCentre: buttonBox.top + buttonBox.height / 2,
      figureRight: figure.getBoundingClientRect().right,
      buttonRight: buttonBox.right,
      buttonLeft: buttonBox.left,
      ruleEnd: captionBox.right - tail,
      size: Math.min(buttonBox.width, buttonBox.height),
      sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })
  if (!measured) throw new Error(`${selector} has no caption or no pause`)
  expect(Math.abs(measured.buttonCentre - measured.ruleCentre)).toBeLessThanOrEqual(1)
  expect(Math.abs(measured.buttonRight - measured.figureRight)).toBeLessThanOrEqual(1)
  expect(measured.buttonLeft).toBeGreaterThan(measured.ruleEnd)
  expect(measured.size).toBeGreaterThanOrEqual(24)
  expect(measured.sideways).toBe(0)
}

const MOVING = [
  { kind: 'banner', drape: BANNER, pause: strings('fr').bannerPause },
  { kind: 'flag', drape: FLAG, pause: strings('fr').flagPause },
] as const

for (const width of [320, 768, 1440]) {
  for (const { kind, drape, pause } of MOVING) {
    test(`at ${width}px the ${kind}'s pause sits on its caption rule at the right end`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(speciesPath(await heraldic('fr')))
      await bring(page, drape)
      await expect(page.getByRole('button', { name: pause })).toBeVisible()
      await expectOnCaptionRule(page, `.au-heraldry--${kind}`)
    })
  }
}

test('the flag flies at its pace while on screen and stops off screen', async ({ page }) => {
  await count(page)
  await page.goto(speciesPath(await heraldic('fr')))
  await bring(page, FLAG)
  await expect(page.locator(`${FLAG}[data-draped] canvas`)).toHaveCount(1)
  const pace = await perSecond(page, 'flag')
  expect(pace).toBeGreaterThanOrEqual(5)
  expect(pace).toBeLessThanOrEqual(CLOTH_MOST_PER_SECOND + 2)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(300)
  const away = (await copies(page)).flag
  await page.waitForTimeout(1000)
  expect((await copies(page)).flag - away).toBe(0)
})

test('the flag pauses by keyboard, stays paused on the next page, and the hero button stills it too', async ({
  page,
}) => {
  const t = strings('fr')
  await count(page)
  const path = speciesPath(await heraldic('fr'))
  await page.goto(path)
  await bring(page, FLAG)
  const pause = page.getByRole('button', { name: t.flagPause })
  await expect(pause).toBeVisible()
  await pause.focus()
  await page.keyboard.press('Enter')
  await page.waitForTimeout(200)
  const paused = (await copies(page)).flag
  await page.waitForTimeout(1000)
  expect((await copies(page)).flag - paused).toBe(0)

  await page.goto(path)
  await bring(page, FLAG)
  await expect(page.getByRole('button', { name: t.flagPlay })).toBeVisible()
  await page.getByRole('button', { name: t.flagPlay }).click()
  await expect.poll(async () => (await copies(page)).flag).toBeGreaterThan(0)

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.getByRole('button', { name: t.stagePause }).click()
  await bring(page, FLAG)
  await page.waitForTimeout(300)
  const stilled = (await copies(page)).flag
  await page.waitForTimeout(1000)
  expect((await copies(page)).flag - stilled).toBe(0)
  await expect(page.getByRole('button', { name: t.flagPlay })).toBeVisible()
})

test('a Swup visit leaves no drape or glass behind, and they come back with their page', async ({
  page,
}) => {
  await count(page)
  const path = speciesPath(await heraldic('fr'))
  await page.goto('/fr')
  await page.waitForFunction(() => 'swup' in window)
  await visit(page, path)
  await bring(page, BANNER)
  await expect(page.locator(`${BANNER}[data-draped] canvas`)).toHaveCount(1)
  await bring(page, FLAG)
  await expect(page.locator(`${FLAG}[data-draped] canvas`)).toHaveCount(1)
  await visit(page, '/fr')
  await expect(page.locator('[data-drape] canvas, .au-prose__frame canvas')).toHaveCount(0)
  const gone = await copies(page)
  await page.waitForTimeout(1000)
  expect(await copies(page)).toEqual(gone)
  await visit(page, path)
  await bring(page, FLAG)
  await expect(page.locator(`${FLAG}[data-draped] canvas`)).toHaveCount(1)
})

test('the gilt and the glass follow the pointer, then settle', async ({ page }) => {
  await count(page)
  await page.goto(speciesPath(await heraldic('fr')))
  await bring(page, GLASS)
  const glass = page.locator(`${GLASS}[data-lit]`)
  await expect(glass.locator('canvas')).toHaveCount(1)
  await expect(glass.locator('img')).toHaveAttribute('alt', /.+/)
  const box = await glass.boundingBox()
  if (!box) throw new Error('the glazed picture has no box')
  const gilt = (): Promise<number[]> =>
    glass.locator('canvas').evaluate((node: HTMLCanvasElement) => {
      const corner = Math.round(node.width * 0.03)
      const pixels = node.getContext('2d')?.getImageData(corner, corner, corner, corner).data
      return pixels ? [...pixels] : []
    })
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.1)
  expect(await restsWithin(page, 'glass', 3000)).toBeLessThan(3000)
  const before = (await copies(page)).glass
  const lit = await gilt()
  await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.9, { steps: 8 })
  await expect.poll(async () => (await copies(page)).glass).toBeGreaterThan(before)
  expect(await restsWithin(page, 'glass', 3000)).toBeLessThan(3000)
  expect(await gilt()).not.toEqual(lit)
})

test('print keeps the plain banner, flag, arms and painting and drops the canvases', async ({
  page,
}) => {
  await page.goto(speciesPath(await heraldic('fr')))
  for (const selector of [GLASS, BANNER, FLAG, ARMS]) await bringDrawn(page, selector)
  await page.emulateMedia({ media: 'print' })
  for (const canvas of await page.locator('[data-drape] canvas, .au-prose__frame canvas').all()) {
    await expect(canvas).toBeHidden()
  }
  await expect(page.locator(`${BANNER} .au-heraldry__plain`)).toBeVisible()
  await expect(page.locator(`${FLAG} .au-heraldry__plain`)).toBeVisible()
  await expect(page.locator(`${ARMS} .au-heraldry__plain`)).toBeVisible()
  await expect(page.locator(`${GLASS} img`)).toBeVisible()
})

test('the gilt and enamel of the arms follow the pointer, then settle', async ({ page }) => {
  await count(page)
  await page.goto(speciesPath(await heraldic('fr')))
  await bringDrawn(page, ARMS)
  const canvas = page.locator(`${ARMS}[data-draped] canvas`)
  const box = await canvas.boundingBox()
  if (!box) throw new Error('the arms have no box')
  const pixels = (): Promise<string> =>
    canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL())
  await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.1)
  expect(await restsWithin(page, 'arms', 3000)).toBeLessThan(3000)
  const before = (await copies(page)).arms
  const lit = await pixels()
  await page.mouse.move(box.x + box.width * 2, box.y + box.height * 1.5, { steps: 8 })
  await expect.poll(async () => (await copies(page)).arms).toBeGreaterThan(before)
  expect(await restsWithin(page, 'arms', 3000)).toBeLessThan(3000)
  const settled = (await copies(page)).arms
  await page.waitForTimeout(1000)
  expect((await copies(page)).arms).toBe(settled)
  expect(await pixels()).not.toBe(lit)
})

test('the first live frame of the arms stays within 8 of 255 of their still', async ({ page }) => {
  await page.goto(speciesPath(await heraldic('fr')))
  await bringDrawn(page, ARMS)
  const difference = await page.locator(ARMS).evaluate(async (holder) => {
    const canvas = holder.querySelector('canvas')
    const still = holder.querySelector('img')
    if (!canvas || !still) return undefined
    await still.decode()
    const width = canvas.width
    const height = canvas.height
    const read = (source: CanvasImageSource): Uint8ClampedArray => {
      const scratch = document.createElement('canvas')
      scratch.width = width
      scratch.height = height
      const context = scratch.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('no 2D context')
      context.drawImage(source, 0, 0, width, height)
      return context.getImageData(0, 0, width, height).data
    }
    const live = read(canvas)
    const plain = read(still)
    let sum = 0
    let counted = 0
    for (let at = 0; at < live.length; at += 4) {
      if ((plain[at + 3] ?? 0) < 255) continue
      for (let c = 0; c < 3; c++) sum += Math.abs((live[at + c] ?? 0) - (plain[at + c] ?? 0))
      counted += 3
    }
    return sum / counted
  })
  expect(difference).toBeDefined()
  expect(difference).toBeLessThan(8)
})

const NARROW_REM = 30

for (const width of [320, 390, 480, 768, 1216, 1440]) {
  test(`at ${width}px every piece beside its text stands beside it or above it, and nothing scrolls sideways`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(speciesPath(await heraldic('fr')))
    for (const kind of BESIDE) {
      const measured = await page.evaluate((selector) => {
        const figure = document.querySelector(selector)
        const article = figure?.closest('article')
        const text = article?.querySelector('.au-subspecies__beside .au-rule-text')
        if (!figure || !article || !text) return undefined
        const box = figure.getBoundingClientRect()
        const lines = [...text.querySelectorAll('p')].flatMap((line) => {
          const range = document.createRange()
          range.selectNodeContents(line)
          return [...range.getClientRects()]
        })
        const first = lines[0]
        let covered = 0
        const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT)
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (figure.contains(node) || !node.textContent?.trim()) continue
          const range = document.createRange()
          range.selectNodeContents(node)
          for (const line of range.getClientRects()) {
            const across = Math.min(box.right, line.right) - Math.max(box.left, line.left)
            const down = Math.min(box.bottom, line.bottom) - Math.max(box.top, line.top)
            if (across > 0.5 && down > 0.5) covered += 1
          }
        }
        return {
          sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          covered,
          rem: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
          banner: { left: box.left, right: box.right, top: box.top, bottom: box.bottom },
          text: {
            left: Math.min(...lines.map((line) => line.left)),
            top: first?.top ?? 0,
          },
        }
      }, `.au-heraldry--${kind}`)
      if (!measured) throw new Error(`the ${kind}, its article or its text is missing`)
      expect(measured.sideways, kind).toBe(0)
      expect(measured.covered, kind).toBe(0)
      if (width >= NARROW_REM * measured.rem) {
        expect(measured.banner.right, kind).toBeLessThanOrEqual(measured.text.left)
        expect(Math.abs(measured.banner.top - measured.text.top), kind).toBeLessThan(measured.rem)
      } else {
        expect(measured.banner.bottom, kind).toBeLessThanOrEqual(measured.text.top)
      }
    }
  })
}

test('the flag spans the reading column like a picture, with no pole', async ({ page }) => {
  await page.goto(speciesPath(await heraldic('fr')))
  const widths = await page.evaluate(() => {
    const figure = document.querySelector('.au-heraldry--flag')
    const column = figure?.closest('.au-prose')
    if (!figure || !column) return undefined
    return {
      figure: figure.getBoundingClientRect().width,
      column: column.getBoundingClientRect().width,
      fixtures: figure.querySelectorAll('.au-heraldry__fixture').length,
    }
  })
  expect(widths).toBeDefined()
  expect(widths?.figure).toBeCloseTo(widths?.column ?? 0, 0)
  expect(widths?.fixtures).toBe(0)
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the banner and the flag draw one still frame each, never redraw, and offer no pause', async ({
    page,
  }) => {
    await count(page)
    await page.goto(speciesPath(await heraldic('fr')))
    for (const selector of [BANNER, FLAG]) await bringDrawn(page, selector)
    await page.waitForTimeout(500)
    const drawn = await copies(page)
    const canvas = page.locator(`${BANNER}[data-draped] canvas`)
    const pixels = (): Promise<string> =>
      canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL())
    const before = await pixels()
    const box = await canvas.boundingBox()
    if (!box) throw new Error('the banner canvas has no box')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.8)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width, box.y + box.height * 0.6, { steps: 8 })
    await page.mouse.up()
    await page.waitForTimeout(1000)
    expect(await copies(page)).toEqual(drawn)
    expect(await pixels()).toBe(before)
    for (const toggle of await page.locator('[data-drape-toggle]').all()) {
      await expect(toggle).toBeHidden()
    }
  })

  test('the banner gilt takes the hue of its charge', async ({ page }) => {
    await page.goto(speciesPath(await heraldic('fr')))
    await bringDrawn(page, BANNER)
    await page.waitForTimeout(300)
    const read = await page.locator(BANNER).evaluate((holder: HTMLElement) => {
      const canvas = holder.querySelector('canvas')
      const context = canvas?.getContext('2d')
      if (!canvas || !context) return undefined
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data
      const picks: number[] = []
      for (let at = 0; at < data.length; at += 8) {
        if (data[at + 3] === 255) picks.push(data[at] ?? 0, data[at + 1] ?? 0, data[at + 2] ?? 0)
      }
      return { charge: holder.dataset['charge'] ?? '', picks }
    })
    if (!read) throw new Error('the banner canvas cannot be read')
    const charge = oklchOf(rgbFromHex(read.charge))
    const gold: Oklch[] = []
    for (let at = 0; at + 2 < read.picks.length; at += 3) {
      const tone = oklchOf([read.picks[at] ?? 0, read.picks[at + 1] ?? 0, read.picks[at + 2] ?? 0])
      if (tone.chroma >= 0.04 && apart(tone.hue, charge.hue) <= 60) gold.push(tone)
    }
    expect(gold.length).toBeGreaterThan(1000)
    expect(apart(middle(gold.map((tone) => tone.hue)), charge.hue)).toBeLessThanOrEqual(6)
  })

  test('the arms draw once and hold still under the pointer and the scroll', async ({ page }) => {
    await count(page)
    await page.goto(speciesPath(await heraldic('fr')))
    await bringDrawn(page, ARMS)
    const canvas = page.locator(`${ARMS}[data-draped] canvas`)
    const box = await canvas.boundingBox()
    if (!box) throw new Error('the arms have no box')
    await page.waitForTimeout(300)
    const drawn = (await copies(page)).arms
    const before = await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL())
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.6, { steps: 8 })
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(500)
    expect((await copies(page)).arms).toBe(drawn)
    expect(await canvas.evaluate((node: HTMLCanvasElement) => node.toDataURL())).toBe(before)
  })

  test('the glass draws once and holds still under the pointer', async ({ page }) => {
    await count(page)
    await page.goto(speciesPath(await heraldic('fr')))
    await bring(page, GLASS)
    const glass = page.locator(`${GLASS}[data-lit]`)
    await expect(glass.locator('canvas')).toHaveCount(1)
    const box = await glass.boundingBox()
    if (!box) throw new Error('the glazed picture has no box')
    await page.waitForTimeout(300)
    const drawn = (await copies(page)).glass
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.6, { steps: 8 })
    await page.waitForTimeout(500)
    expect((await copies(page)).glass).toBe(drawn)
  })
})
