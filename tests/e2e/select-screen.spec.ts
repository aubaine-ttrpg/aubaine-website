import { expect, type Locator, type Page, test } from '@playwright/test'

import { LOCALES } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'
import { corpus } from './support/corpus'

const t = strings('en')
const TREES = pathFor('trees', 'en')
const SPECIES = pathFor('species', 'en')
const SPOTLIGHT = '[data-spotlight]'
const PANEL_NAME = '[data-spotlight-panel] .au-character__name'
const CARD = '[data-entry]'

function cardLink(page: Page, id: string): Locator {
  return page.locator(`${CARD}[data-entry="${id}"] [data-cover-card]`)
}

async function currentId(page: Page): Promise<string | null> {
  return page.locator(SPOTLIGHT).getAttribute('data-spotlight-current')
}

async function anotherCard(page: Page): Promise<{ id: string; name: string }> {
  const current = await currentId(page)
  const ids = await page
    .locator(CARD)
    .evaluateAll((cards) => cards.map((card) => (card as HTMLElement).dataset['entry'] ?? ''))
  const id = ids.find((candidate) => candidate && candidate !== current)
  if (!id) throw new Error('the roster needs two entries')
  const name = (
    await page.locator(`${CARD}[data-entry="${id}"] .au-roster__name`).textContent()
  )?.trim()
  if (!name) throw new Error(`${id} has no name on its card`)
  return { id, name }
}

async function hydrated(page: Page): Promise<void> {
  await page.waitForFunction(() => 'swup' in window)
  await expect(page.locator('[data-spotlight-step]').first()).toBeVisible()
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

async function clippedPieces(page: Page): Promise<string[]> {
  return page.locator(SPOTLIGHT).evaluate((spotlight) => {
    const fixed = getComputedStyle(spotlight).position === 'sticky'
    const frame = spotlight.getBoundingClientRect()
    const bounds = fixed
      ? { left: frame.left, right: frame.right, top: frame.top, bottom: frame.bottom }
      : { left: 0, right: document.documentElement.clientWidth, top: -Infinity, bottom: Infinity }
    const paintedEdges = (
      piece: Element,
    ): { left: number; right: number; top: number; bottom: number } => {
      const style = getComputedStyle(piece)
      const holder = piece instanceof HTMLElement ? piece.offsetParent : null
      const shape = [...style.clipPath.matchAll(/(-?[\d.]+)(%|px)\s+(-?[\d.]+)(%|px)/g)]
      if (!(piece instanceof HTMLElement) || !holder || shape.length === 0)
        return piece.getBoundingClientRect()
      const origin = holder.getBoundingClientRect()
      const width = piece.offsetWidth
      const height = piece.offsetHeight
      const centreX = origin.left + piece.offsetLeft + width / 2
      const centreY = origin.top + piece.offsetTop + height / 2
      const turn = ((Number.parseFloat(style.rotate) || 0) * Math.PI) / 180
      const corners = shape.map(([, x = '0', xUnit, y = '0', yUnit]) => {
        const dx = (xUnit === '%' ? (Number(x) / 100) * width : Number(x)) - width / 2
        const dy = (yUnit === '%' ? (Number(y) / 100) * height : Number(y)) - height / 2
        return {
          x: centreX + dx * Math.cos(turn) - dy * Math.sin(turn),
          y: centreY + dx * Math.sin(turn) + dy * Math.cos(turn),
        }
      })
      return {
        left: Math.min(...corners.map((corner) => corner.x)),
        right: Math.max(...corners.map((corner) => corner.x)),
        top: Math.min(...corners.map((corner) => corner.y)),
        bottom: Math.max(...corners.map((corner) => corner.y)),
      }
    }
    const clipped: string[] = []
    for (const piece of spotlight.querySelectorAll(
      '[data-spotlight-panel] *, .au-spotlight__controls *',
    )) {
      if (piece.closest('.au-framed__plate')) continue
      const box = piece.getBoundingClientRect()
      if (box.width === 0 || box.height === 0 || getComputedStyle(piece).visibility === 'hidden')
        continue
      const edges = paintedEdges(piece)
      const overflow = Math.max(
        bounds.left - edges.left,
        edges.right - bounds.right,
        bounds.top - edges.top,
        edges.bottom - bounds.bottom,
      )
      if (overflow > 0.5)
        clipped.push(`${piece.classList[0] ?? piece.tagName} by ${Math.round(overflow)}px`)
    }
    const name = spotlight.querySelector('.au-character__name')
    if (name && name.scrollWidth > name.clientWidth + 1) clipped.push('the name')
    if (fixed && spotlight.scrollHeight > spotlight.clientHeight)
      clipped.push('the spotlight scrolls')
    return clipped
  })
}

async function piecesUnderTheProfile(page: Page): Promise<string[]> {
  return page.locator('[data-spotlight-panel]').evaluate((panel) => {
    const profile = panel.querySelector('.au-panel__profile')
    if (!profile || getComputedStyle(profile).position !== 'absolute') return []
    type Point = { x: number; y: number }
    const boxOf = (piece: Element): Point[] => {
      const box = piece.getBoundingClientRect()
      return [
        { x: box.left, y: box.top },
        { x: box.right, y: box.top },
        { x: box.right, y: box.bottom },
        { x: box.left, y: box.bottom },
      ]
    }
    const outlineOf = (shape: SVGPolygonElement): Point[] => {
      const frame = shape.getScreenCTM()
      if (!frame) return []
      return [...shape.points].map((point) => ({
        x: frame.a * point.x + frame.c * point.y + frame.e,
        y: frame.b * point.x + frame.d * point.y + frame.f,
      }))
    }
    const axesOf = (shape: Point[]): Point[] =>
      shape.map((point, index) => {
        const next = shape[(index + 1) % shape.length] ?? point
        return { x: point.y - next.y, y: next.x - point.x }
      })
    const meet = (one: Point[], other: Point[]): boolean =>
      one.length > 0 &&
      other.length > 0 &&
      [...axesOf(one), ...axesOf(other)].every((axis) => {
        const first = one.map((point) => point.x * axis.x + point.y * axis.y)
        const second = other.map((point) => point.x * axis.x + point.y * axis.y)
        return Math.max(...first) > Math.min(...second) && Math.max(...second) > Math.min(...first)
      })
    const drawn = [...profile.querySelectorAll('.au-rank__label, .au-rank__grade')].map(boxOf)
    const chart = profile.querySelector<SVGPolygonElement>('.au-rank__ground')
    if (chart) drawn.push(outlineOf(chart))
    const kept = [...panel.querySelectorAll('.au-panel__head > *, .au-trait, .au-framed__emblem')]
    const under = kept
      .filter((piece) => {
        const box = boxOf(piece)
        return piece.getBoundingClientRect().width > 0 && drawn.some((shape) => meet(shape, box))
      })
      .map((piece) => piece.classList[0] ?? piece.tagName)
    const initial = panel.querySelector<SVGPolygonElement>('.au-seal__crest polygon')
    if (initial && drawn.some((shape) => meet(shape, outlineOf(initial)))) under.push('the initial')
    return under
  })
}

async function rowsOf(page: Page, selector: string): Promise<number> {
  return page.locator(`[data-spotlight-panel] ${selector}`).evaluateAll((pieces) => {
    const boxes = pieces
      .map((piece) => piece.getBoundingClientRect())
      .sort((one, other) => one.top - other.top)
    let rows = 0
    let bottom = -Infinity
    for (const box of boxes) {
      if (box.top + box.height / 2 > bottom) {
        rows += 1
        bottom = box.bottom
      }
    }
    return rows
  })
}

async function plateInks(page: Page): Promise<{ inks: string[]; weakest: number }> {
  return page.locator('[data-spotlight-panel] .au-trait__value').evaluateAll((plates) => {
    const channels = (colour: string): number[] =>
      (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
    const luminance = (colour: string): number => {
      const [red = 0, green = 0, blue = 0] = channels(colour).map((value) => {
        const unit = value / 255
        return unit <= 0.04045 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue
    }
    const inks = plates.map((plate) => getComputedStyle(plate).color)
    const contrasts = plates.map((plate) => {
      const ink = luminance(getComputedStyle(plate).color)
      const paper = luminance(getComputedStyle(plate).backgroundColor)
      return (Math.max(ink, paper) + 0.05) / (Math.min(ink, paper) + 0.05)
    })
    return { inks: [...new Set(inks)], weakest: Math.min(...contrasts) }
  })
}

test.describe('on a desktop', () => {
  test('pointing at a card shows it in the spotlight and on the stage', async ({ page }) => {
    await page.goto(TREES)
    await hydrated(page)
    const stage = page.locator('[data-stage]')
    const before = await stage.getAttribute('data-stage')
    const other = await anotherCard(page)
    await cardLink(page, other.id).hover()
    await expect(page.locator(PANEL_NAME)).toHaveText(other.name)
    await expect(stage).not.toHaveAttribute('data-stage', before ?? '')
    const backdrop = await stage.evaluate((node) => node.style.getPropertyValue('--stage-art'))
    expect(backdrop).not.toBe('')
    await expect(cardLink(page, other.id)).toHaveAttribute('aria-current', 'true')
  })

  test('focus selects a card and Enter opens its page', async ({ page }) => {
    await page.goto(SPECIES)
    await hydrated(page)
    const other = await anotherCard(page)
    await cardLink(page, other.id).focus()
    await expect(page.locator(PANEL_NAME)).toHaveText(other.name)
    const href = await cardLink(page, other.id).getAttribute('href')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(href ?? '')
  })

  test('the spotlight stays in view while the roster scrolls', async ({ page }) => {
    await page.goto(TREES)
    await hydrated(page)
    await page.evaluate(() => window.scrollBy(0, 1500))
    await page.waitForTimeout(200)
    const box = await page.locator(SPOTLIGHT).boundingBox()
    const viewport = page.viewportSize()
    if (!box || !viewport) throw new Error('the spotlight has no box')
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeLessThan(viewport.height / 2)
    await expect(page.getByRole('link', { name: t.openSheet })).toBeInViewport()
  })

  test('filtering moves the selection, hides an empty group and can empty the spotlight', async ({
    page,
  }) => {
    const trees = (await corpus('en')).trees
    const domain = trees.find((tree) => tree.treeType === 'domain')
    if (!domain) throw new Error('the trees need a domain tree')
    await page.goto(TREES)
    await hydrated(page)
    const search = page.locator('.au-filterbar input[type="search"]').first()
    await search.fill(domain.name)
    await expect(page.locator(PANEL_NAME)).toHaveText(domain.name)
    await expect(page.getByRole('heading', { level: 2, name: t.archetypes })).toBeHidden()
    await expect(page.getByRole('heading', { level: 2, name: t.domains })).toBeVisible()
    await page.getByRole('button', { name: t.spotlightNext }).click()
    await expect(page.locator(PANEL_NAME)).toHaveText(domain.name)
    await search.fill('zzzz-no-entry-zzzz')
    await expect(page.locator(PANEL_NAME)).toHaveCount(0)
    await expect(page.getByRole('link', { name: t.openSheet })).toBeHidden()
  })

  test('hiding drafts moves the spotlight off a draft', async ({ page }) => {
    const species = (await corpus('en')).species
    const draft = species.find((entry) => entry.status === 'draft')
    if (!draft) throw new Error('the species need a draft')
    const playable = species.filter((entry) => entry.status !== 'draft').map((entry) => entry.name)
    await page.goto(SPECIES)
    await hydrated(page)
    await cardLink(page, draft.id).hover()
    await expect(page.locator(PANEL_NAME)).toHaveText(draft.name)
    await page.mouse.move(0, 0)
    await page.getByRole('switch', { name: t.hideDrafts, exact: true }).click()
    if (playable.length === 0) {
      await expect(page.locator(PANEL_NAME)).toHaveCount(0)
      return
    }
    await expect(page.locator(PANEL_NAME)).not.toHaveText(draft.name)
    expect(playable).toContain(await page.locator(PANEL_NAME).textContent())
  })

  test('the stage takes the new art while it is paused', async ({ page }) => {
    await page.goto(TREES)
    await hydrated(page)
    await page.getByRole('button', { name: t.stagePause }).click()
    const stage = page.locator('[data-stage]')
    const before = await stage.getAttribute('data-stage')
    const other = await anotherCard(page)
    await page.mouse.move(0, 0)
    await cardLink(page, other.id).hover()
    await expect(page.locator(PANEL_NAME)).toHaveText(other.name)
    await expect(stage).not.toHaveAttribute('data-stage', before ?? '')
  })

  test('a Swup visit to the other hub and back still swaps once per point', async ({ page }) => {
    await page.goto(TREES)
    await hydrated(page)
    await page.evaluate((target) => {
      const swup = (window as unknown as { swup: { navigate: (url: string) => void } }).swup
      swup.navigate(target)
    }, SPECIES)
    await expect(page).toHaveURL(SPECIES)
    await page.goBack()
    await expect(page).toHaveURL(TREES)
    await hydrated(page)
    await page.evaluate(() => {
      const panel = document.querySelector('[data-spotlight-panel]')
      const counter = window as unknown as { swaps: number }
      counter.swaps = 0
      if (panel)
        new MutationObserver(() => (counter.swaps += 1)).observe(panel, { childList: true })
    })
    const other = await anotherCard(page)
    await cardLink(page, other.id).hover()
    await expect(page.locator(PANEL_NAME)).toHaveText(other.name)
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => (window as unknown as { swaps: number }).swaps)).toBe(1)
  })

  test('the spotlight is a named region with named arrows and one title on the page', async ({
    page,
  }) => {
    await page.goto(TREES)
    await hydrated(page)
    await expect(page.locator('h1')).toHaveCount(1)
    const region = page.getByRole('region', { name: t.spotlight })
    await expect(region).toBeVisible()
    await expect(region.getByRole('button', { name: t.spotlightPrevious })).toBeVisible()
    await expect(region.getByRole('button', { name: t.spotlightNext })).toBeVisible()
    const name = await page.locator(PANEL_NAME).textContent()
    await expect(region.getByRole('link', { name: t.openSheetOf(name ?? '') })).toBeVisible()
  })

  test('print leaves the spotlight out', async ({ page }) => {
    await page.goto(TREES)
    await page.emulateMedia({ media: 'print' })
    await expect(page.locator(SPOTLIGHT)).toBeHidden()
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('every entry fits its spotlight', () => {
  test.use({ reducedMotion: 'reduce' })

  const sizes = [
    { width: 1512, height: 982 },
    { width: 1366, height: 657 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]

  for (const size of sizes) {
    for (const hub of LOCALES.flatMap((locale) =>
      (['trees', 'species'] as const).map((kind) => pathFor(kind, locale)),
    )) {
      test(`at ${size.width}x${size.height} on ${hub}`, async ({ page }) => {
        await page.setViewportSize(size)
        await page.goto(hub)
        await hydrated(page)
        const ids = await page
          .locator(CARD)
          .evaluateAll((cards) => cards.map((card) => (card as HTMLElement).dataset['entry'] ?? ''))
        for (const id of ids) {
          await cardLink(page, id).focus()
          await expect(page.locator(SPOTLIGHT)).toHaveAttribute('data-spotlight-current', id)
          expect(await clippedPieces(page), `${id} at ${size.width}x${size.height}`).toEqual([])
          expect(await piecesUnderTheProfile(page), `${id} under its profile`).toEqual([])
          const plates = await plateInks(page)
          expect(plates.inks.length, `${id} plates share one ink`).toBeLessThanOrEqual(1)
          expect(plates.weakest, `${id} plates read at AA`).toBeGreaterThanOrEqual(4.5)
          if (size.width >= 1100) {
            expect(await rowsOf(page, '.au-trait'), `${id} plates in one row`).toBeLessThanOrEqual(
              1,
            )
            expect(
              await rowsOf(page, '.au-sticker'),
              `${id} epithets in one row`,
            ).toBeLessThanOrEqual(1)
          }
        }
      })
    }
  }
})

test.describe('every entry shows the same sheet', () => {
  test('an entry without a profile shows a question mark for each grade', async ({ page }) => {
    const unknown = (await corpus('en')).trees.find((tree) => !tree.profile)
    if (!unknown) throw new Error('every tree has a profile; pick a species without one')
    await page.goto(TREES)
    await hydrated(page)
    await cardLink(page, unknown.id).focus()
    await expect(page.locator(SPOTLIGHT)).toHaveAttribute('data-spotlight-current', unknown.id)
    const grades = page.locator('[data-spotlight-panel] .au-rank__grade')
    await expect(grades).toHaveCount(6)
    for (const grade of await grades.all()) {
      await expect(grade).toHaveText(`?${t.profileUnknown}`)
    }
    await expect(page.locator('[data-spotlight-panel] .au-rank__edge')).toHaveCount(0)
  })

  test('a species shows no profile, since a species never has one', async ({ page }) => {
    await page.goto(SPECIES)
    await hydrated(page)
    const ids = await page
      .locator(CARD)
      .evaluateAll((cards) => cards.map((card) => (card as HTMLElement).dataset['entry'] ?? ''))
    for (const id of ids) {
      await cardLink(page, id).focus()
      await expect(page.locator(SPOTLIGHT)).toHaveAttribute('data-spotlight-current', id)
      await expect(page.locator('[data-spotlight-panel] .au-rank')).toHaveCount(0)
    }
  })

  test('a card without a cover shows its initial, never a Caractéristique', async ({ page }) => {
    const bare = (await corpus('en')).trees.find((tree) => !tree.cover)
    if (!bare) throw new Error('every tree has a cover')
    await page.goto(TREES)
    await hydrated(page)
    const seal = page.locator(`${CARD}[data-entry="${bare.id}"] .au-seal`)
    await expect(seal.locator('.au-seal__crest text')).toHaveText([...bare.name][0] ?? '')
    await expect(seal.locator('[title]')).toHaveCount(0)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('the arrows step through the cards and the open link follows', async ({ page }) => {
    await page.goto(TREES)
    await hydrated(page)
    const ids = await page
      .locator(CARD)
      .evaluateAll((cards) => cards.map((card) => (card as HTMLElement).dataset['entry'] ?? ''))
    const start = await currentId(page)
    const next = ids[(ids.indexOf(start ?? '') + 1) % ids.length]
    const tree = (await corpus('en')).trees.find((entry) => entry.id === next)
    if (!tree) throw new Error('the next card is not a tree')
    await page.getByRole('button', { name: t.spotlightNext }).tap()
    await expect(page.locator(PANEL_NAME)).toHaveText(tree.name)
    await expect(page.getByRole('status').filter({ hasText: tree.name })).toHaveCount(1)
    const open = page.getByRole('link', { name: t.openSheetOf(tree.name) })
    await expect(open).toHaveAttribute('href', pathFor('tree', 'en', { tree: tree.id }))
  })

  test('the filter dialog opens above the header', async ({ page }) => {
    await page.goto(SPECIES)
    await hydrated(page)
    await page.locator('.au-filterbar__open').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const heading = dialog.getByRole('heading', { level: 2 })
    const box = await heading.boundingBox()
    if (!box) throw new Error('the dialog heading has no box')
    const onTop = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('dialog') !== null,
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    )
    expect(onTop).toBe(true)
  })
})

test.describe('without javascript', () => {
  test.use({ javaScriptEnabled: false })

  test('the lead shows, the arrows stay hidden and only live pictures load', async ({ page }) => {
    const requested: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'image') requested.push(request.url())
    })
    await page.goto(SPECIES)
    await page.waitForLoadState('networkidle')
    await expect(page.locator(PANEL_NAME)).toBeVisible()
    await expect(page.locator('[data-spotlight-step]').first()).toBeHidden()
    const live = await page.evaluate(() => {
      const urls = new Set<string>()
      for (const image of document.images) {
        if (image.currentSrc) urls.add(image.currentSrc)
        for (const entry of image.srcset.split(',')) {
          const url = entry.trim().split(/\s+/)[0]
          if (url) urls.add(new URL(url, document.baseURI).href)
        }
        if (image.src) urls.add(image.src)
      }
      for (const image of document.querySelectorAll<SVGImageElement>('svg image')) {
        urls.add(new URL(image.href.baseVal, document.baseURI).href)
      }
      for (const element of document.querySelectorAll<HTMLElement>('*')) {
        const style = getComputedStyle(element)
        const painted = `${style.backgroundImage} ${style.maskImage}`
        for (const found of painted.match(/url\("([^"]+)"\)/g) ?? []) urls.add(found.slice(5, -2))
      }
      return [...urls]
    })
    for (const url of requested.filter((item) => item.includes('/_astro/'))) {
      expect(live, `${url} was fetched for a picture that is not on the page`).toContain(url)
    }
  })
})

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('a swap still changes the backdrop', async ({ page }) => {
    await page.goto(SPECIES)
    await hydrated(page)
    const stage = page.locator('[data-stage]')
    const before = await stage.evaluate((node) => node.style.getPropertyValue('--stage-art'))
    const other = await anotherCard(page)
    await cardLink(page, other.id).hover()
    await expect(page.locator(PANEL_NAME)).toHaveText(other.name)
    const after = await stage.evaluate((node) => node.style.getPropertyValue('--stage-art'))
    expect(after).not.toBe(before)
  })
})
