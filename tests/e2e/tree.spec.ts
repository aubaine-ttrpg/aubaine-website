import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, type Page, test } from '@playwright/test'

const TREE = '/fr/arbre/berserker'
const TREE_IDS = readdirSync(resolve(import.meta.dirname, '../../data/skill-trees')).map((file) =>
  file.replace(/\.json$/, ''),
)

function node(page: Page, id: string) {
  return page.locator(`[data-plate-node][data-node="${id}"]`)
}

function pane(page: Page) {
  return page.locator('#tree-detail')
}

function viewer(page: Page) {
  return page.locator('[data-plate-viewer]')
}

async function viewScale(page: Page): Promise<number> {
  return viewer(page).evaluate((sheet) =>
    Number.parseFloat(getComputedStyle(sheet).getPropertyValue('--view-scale')),
  )
}

async function heartOffset(page: Page): Promise<{ x: number; y: number }> {
  return viewer(page).evaluate((sheet) => {
    const style = getComputedStyle(sheet)
    const scale = Number.parseFloat(style.getPropertyValue('--view-scale'))
    const x = Number.parseFloat(style.getPropertyValue('--view-x'))
    const y = Number.parseFloat(style.getPropertyValue('--view-y'))
    return {
      x: x + Number(sheet.dataset['heartX']) * scale - sheet.clientWidth / 2,
      y: y + Number(sheet.dataset['heartY']) * scale - sheet.clientHeight / 2,
    }
  })
}

function dimmed(page: Page) {
  return page.locator('[data-plate-node][data-dimmed]')
}

async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

async function headerHeight(page: Page): Promise<number> {
  const box = await page.locator('[data-shell-header]').boundingBox()
  return box?.height ?? 0
}

test('the lore comes first and the rail ends on the tree', async ({ page }) => {
  await page.goto(TREE)
  const rail = page.locator('nav.au-aside .au-trail a')
  await expect(rail.last()).toHaveAttribute('href', '#arbre')
  await expect(rail.last()).toContainText('Arbre de compétences')
  const loreComesFirst = await page.evaluate(() => {
    const lore = document.querySelector('.au-prose')
    const tree = document.getElementById('arbre')
    if (!lore || !tree) return false
    return Boolean(lore.compareDocumentPosition(tree) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(loreComesFirst).toBe(true)
})

test('the rail entry lands the tree below the sticky header', async ({ page }) => {
  await page.goto(TREE)
  await page.locator('nav.au-aside a[href="#arbre"]').click()
  const header = await headerHeight(page)
  const heading = page.locator('#arbre')
  await expect
    .poll(async () => (await heading.boundingBox())?.y ?? Number.NEGATIVE_INFINITY)
    .toBeGreaterThanOrEqual(header)
  await expect
    .poll(async () => (await heading.boundingBox())?.y ?? Number.POSITIVE_INFINITY)
    .toBeLessThan(header + 120)
})

test('the bare tree asks the reader to pick a skill', async ({ page }) => {
  await page.goto(TREE)
  await expect(pane(page)).toContainText('Rien à afficher pour l’instant.')
  await expect(pane(page)).toContainText(
    'Choisissez une Compétence dans l’arbre pour l’afficher ici.',
  )
  await expect(pane(page).locator('.au-empty__mark')).toBeVisible()
  await expect(page.locator('[data-node][aria-current]')).toHaveCount(0)
})

test('the tree and its skill split the width in half, and the pane matches the tree', async ({
  page,
}) => {
  await page.goto(TREE)
  const board = await page.locator('.au-tree__board').boundingBox()
  const detail = await pane(page).boundingBox()
  const cap = await pane(page).evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).maxHeight),
  )
  expect(board).not.toBeNull()
  expect(detail).not.toBeNull()
  if (!board || !detail) return
  expect(Math.abs(board.width - detail.width)).toBeLessThanOrEqual(1)
  expect(detail.height).toBeGreaterThanOrEqual(Math.min(board.height, cap) - 1)
  const empty = await pane(page).locator('.au-empty').boundingBox()
  expect(empty).not.toBeNull()
  if (!empty) return
  const paneMiddle = detail.y + detail.height / 2
  expect(Math.abs(empty.y + empty.height / 2 - paneMiddle)).toBeLessThan(24)
})

test('the legend reads before the tree', async ({ page }) => {
  await page.goto(TREE)
  const legend = await page.locator('.au-board-legend').boundingBox()
  const sheet = await page.locator('.au-sheet--board').boundingBox()
  expect(legend).not.toBeNull()
  expect(sheet).not.toBeNull()
  if (!legend || !sheet) return
  expect(legend.y + legend.height).toBeLessThanOrEqual(sheet.y)
  await expect(page.locator('.au-sheet--board .au-legend')).toHaveCount(0)
})

test('the bare tree pulses its nodes once it comes into view', async ({ page }) => {
  await page.goto(TREE)
  await hydrated(page)
  const board = page.locator('[data-plate-viewer]')
  await expect(board).not.toHaveAttribute('data-hinting')
  await page.evaluate(() => document.getElementById('arbre')?.scrollIntoView())
  await expect(board).toHaveAttribute('data-hinting', '')

  await page.goto(`${TREE}/RAGER-01#arbre`)
  await hydrated(page)
  await page.waitForTimeout(300)
  await expect(page.locator('[data-plate-viewer]')).not.toHaveAttribute('data-hinting')
})

test('choosing a node swaps only the detail pane', async ({ page }) => {
  await page.goto(`${TREE}#arbre`)
  await hydrated(page)
  await page.evaluate(() => document.querySelector('main h1')?.setAttribute('data-kept', ''))
  const scrolled = await page.evaluate(() => window.scrollY)

  await node(page, 'TOURB-01').click()
  await expect(page).toHaveURL('/fr/arbre/berserker/TOURB-01#arbre')
  await expect(page).toHaveTitle(/^Tourbillon · Berserker/)
  await expect(pane(page).locator('[data-selected-node]')).toHaveAttribute(
    'data-selected-node',
    'TOURB-01',
  )
  await expect(page.locator('[data-node][aria-current]')).toHaveCount(1)
  await expect(node(page, 'TOURB-01')).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('line[data-lit]')).toHaveCount(1)
  await expect(page.locator('line[data-lit]')).toHaveAttribute('data-ends', 'TOURB-01 TEMER-01')
  await expect(page.locator('line[data-lit]')).toHaveAttribute('data-lit', 'start')
  await expect(page.locator('main h1[data-kept]')).toHaveCount(1)
  await expect(pane(page)).toBeFocused()
  expect(await page.evaluate(() => window.scrollY)).toBe(scrolled)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/fr\/arbre\/berserker\/TOURB-01$/,
  )
  await expect(page.locator('link[rel="alternate"][hreflang="en-GB"]')).toHaveAttribute(
    'href',
    /\/en\/tree\/berserker\/TOURB-01$/,
  )
})

test('the keyboard opens a node', async ({ page }) => {
  await page.goto(`${TREE}#arbre`)
  await hydrated(page)
  await node(page, 'RAGER-01').focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/fr/arbre/berserker/RAGER-01#arbre')
  await expect(pane(page).locator('[data-selected-node]')).toHaveAttribute(
    'data-selected-node',
    'RAGER-01',
  )
  await expect(pane(page)).toBeFocused()
})

test('back leaves the tree instead of unwinding each selection', async ({ page }) => {
  await page.goto('/fr/arbres')
  await page.goto(`${TREE}#arbre`)
  await hydrated(page)
  await node(page, 'RAGER-01').click()
  await expect(page).toHaveURL(/RAGER-01#arbre$/)
  await node(page, 'TOURB-01').click()
  await expect(page).toHaveURL(/TOURB-01#arbre$/)

  await page.goBack()
  await expect(page).toHaveURL('/fr/arbres')
})

test('the language switch follows the selected node', async ({ page }) => {
  await page.goto(`${TREE}#arbre`)
  await hydrated(page)
  await node(page, 'TOURB-01').click()
  await expect(page).toHaveURL(/TOURB-01#arbre$/)
  await expect(page.locator('[data-lang-option="en"]')).toHaveAttribute(
    'href',
    '/en/tree/berserker/TOURB-01',
  )
})

test('a filter dims the nodes it leaves out and keeps them on the tree', async ({ page }) => {
  await page.goto(`${TREE}#arbre`)
  await hydrated(page)
  const filter = page.getByRole('searchbox', { name: 'Filtrer par nom…' })

  await filter.fill('cri')
  await expect(dimmed(page)).toHaveCount(10)
  await expect(page.locator('[data-plate-node]:visible')).toHaveCount(14)
  await expect(page.getByText('4 résultats')).toBeVisible()

  await node(page, 'PRMCR-01').click()
  await expect(page).toHaveURL(/PRMCR-01#arbre$/)
  await expect(filter).toHaveValue('cri')
  await expect(dimmed(page)).toHaveCount(10)

  await filter.fill('')
  await expect(dimmed(page)).toHaveCount(0)
})

test('a filter that matches nothing offers a reset', async ({ page }) => {
  await page.goto(`${TREE}#arbre`)
  await hydrated(page)
  const filter = page.getByRole('searchbox', { name: 'Filtrer par nom…' })

  await filter.fill('zzzz')
  await expect(dimmed(page)).toHaveCount(14)
  const empty = page.locator('[data-filter-empty="filtered"]')
  await expect(empty).toBeVisible()
  await expect(empty.locator('.au-empty__mark')).toBeVisible()

  await empty.getByRole('button', { name: 'Réinitialiser' }).click()
  await expect(dimmed(page)).toHaveCount(0)
  await expect(empty).toBeHidden()
  await expect(filter).toBeFocused()
})

test('every ring and every node of every tree sits inside its board, and no label collides', async ({
  page,
}) => {
  for (const id of TREE_IDS) {
    await page.goto(`/fr/arbre/${id}`)
    const problems = await page.evaluate(() => {
      const sheet = document.querySelector('.au-sheet--board')?.getBoundingClientRect()
      if (!sheet) return ['no board']
      const outside = (box: DOMRect) =>
        box.left < sheet.left - 0.5 ||
        box.right > sheet.right + 0.5 ||
        box.top < sheet.top - 0.5 ||
        box.bottom > sheet.bottom + 0.5
      const overlap = (a: DOMRect, b: DOMRect) =>
        a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1
      const rings = Array.from(document.querySelectorAll('.au-plate__orbit'))
        .filter((ring) => outside(ring.getBoundingClientRect()))
        .map(() => 'ring')
      const parts = Array.from(document.querySelectorAll<HTMLElement>('[data-plate-node]')).map(
        (link) => ({
          id: link.dataset['node'] ?? '?',
          shape: link.querySelector('.au-node__shape')?.getBoundingClientRect(),
          plate: link.querySelector('.au-nameplate')?.getBoundingClientRect(),
        }),
      )
      const clipped = parts
        .filter(({ shape, plate }) => [shape, plate].some((box) => !box || outside(box)))
        .map(({ id }) => `${id} clipped`)
      const collisions = parts.flatMap((a, index) =>
        parts
          .slice(index + 1)
          .filter(
            (b) =>
              a.plate &&
              b.plate &&
              a.shape &&
              b.shape &&
              (overlap(a.plate, b.plate) || overlap(a.plate, b.shape) || overlap(b.plate, a.shape)),
          )
          .map((b) => `${a.id}~${b.id}`),
      )
      return [...rings, ...clipped, ...collisions]
    })
    expect(problems, id).toEqual([])
  }
})

test('the viewer opens fitted and zooms, pans and fits again', async ({ page }) => {
  await page.goto(`${TREE}#arbre`)
  await hydrated(page)
  const fitted = await viewScale(page)
  await expect(page.locator('[data-view-zoom="out"]')).toBeDisabled()
  await expect(page.locator('[data-view-zoom="fit"]')).toBeDisabled()

  await page.locator('[data-view-zoom="in"]').click()
  await expect.poll(() => viewScale(page)).toBeGreaterThan(fitted)
  await expect(viewer(page)).toHaveAttribute('data-zoomed', '')

  const box = await viewer(page).boundingBox()
  expect(box).not.toBeNull()
  if (!box) return
  const before = await heartOffset(page)
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 40, { steps: 6 })
  await page.mouse.up()
  const after = await heartOffset(page)
  expect(after.x - before.x).toBeCloseTo(60, 0)
  expect(after.y - before.y).toBeCloseTo(40, 0)
  await expect(page).toHaveURL(`${TREE}#arbre`)

  await page.locator('[data-view-zoom="fit"]').click()
  await expect.poll(() => viewScale(page)).toBeCloseTo(fitted, 3)
  await expect(viewer(page)).not.toHaveAttribute('data-zoomed')
})

test('the wheel zooms the tree only with the control key', async ({ page }) => {
  await page.goto(`${TREE}#arbre`)
  await hydrated(page)
  const fitted = await viewScale(page)
  const box = await viewer(page).boundingBox()
  expect(box).not.toBeNull()
  if (!box) return
  await page.mouse.move(box.x + box.width / 3, box.y + box.height / 3)
  const scrolled = await page.evaluate(() => window.scrollY)
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -240)
  await page.keyboard.up('Control')
  await expect.poll(() => viewScale(page)).toBeGreaterThan(fitted)
  expect(await page.evaluate(() => window.scrollY)).toBe(scrolled)
})

test('the keyboard zooms and a focused node comes into view', async ({ page }) => {
  await page.goto(`${TREE}#arbre`)
  await hydrated(page)
  const fitted = await viewScale(page)
  await node(page, 'RAGER-01').focus()
  for (const _ of [1, 2, 3, 4, 5]) await page.keyboard.press('+')
  await expect.poll(() => viewScale(page)).toBeCloseTo(fitted * 3, 2)
  await expect(viewer(page)).not.toHaveAttribute('data-view-gliding')

  const outside = await viewer(page).evaluate((sheet) => {
    const frame = sheet.getBoundingClientRect()
    return Array.from(sheet.querySelectorAll<HTMLElement>('[data-plate-node]')).find((link) => {
      const box = link.getBoundingClientRect()
      return (
        box.left < frame.left ||
        box.right > frame.right ||
        box.top < frame.top ||
        box.bottom > frame.bottom
      )
    })?.dataset['node']
  })
  expect(outside).toBeDefined()
  await page.locator(`[data-node="${outside}"]`).focus()
  await expect
    .poll(() =>
      viewer(page).evaluate((sheet, id) => {
        const frame = sheet.getBoundingClientRect()
        const box = sheet.querySelector(`[data-node="${id}"]`)?.getBoundingClientRect()
        return Boolean(
          box &&
            box.left >= frame.left &&
            box.right <= frame.right &&
            box.top >= frame.top &&
            box.bottom <= frame.bottom,
        )
      }, outside),
    )
    .toBe(true)

  await page.keyboard.press('0')
  await expect.poll(() => viewScale(page)).toBeCloseTo(fitted, 3)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the pulse never shows', async ({ page }) => {
    await page.goto(`${TREE}#arbre`)
    await hydrated(page)
    await expect(page.locator('[data-plate-viewer]')).toHaveAttribute('data-hinting', '')
    const ringed = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('[data-plate-node]')).filter(
          (node) => getComputedStyle(node, '::after').opacity !== '0',
        ).length,
    )
    expect(ringed).toBe(0)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the viewer opens legible on the heart of the tree and a choice brings its skill into view', async ({
    page,
  }) => {
    await page.goto(`${TREE}#arbre`)
    await hydrated(page)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBe(0)
    expect(await viewScale(page)).toBeCloseTo(0.8, 2)
    await expect(viewer(page)).toHaveAttribute('data-zoomed', '')
    const heart = await heartOffset(page)
    expect(Math.abs(heart.x)).toBeLessThan(1)
    expect(Math.abs(heart.y)).toBeLessThan(1)

    await node(page, 'RAGER-01').click()
    await expect(page).toHaveURL(/RAGER-01#arbre$/)
    await expect(pane(page).locator('[data-selected-node]')).toBeInViewport()
  })
})
