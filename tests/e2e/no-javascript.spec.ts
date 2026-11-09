import { expect, type Page, test } from '@playwright/test'

import { label } from '../../src/lib/game/build'
import { SUBSPECIES_SECTIONS } from '../../src/lib/game/derive'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'
import { corpus } from './support/corpus'
import { frameFile, framesBySpecies } from './support/lore-pictures'

const ROUTES = [
  '/fr',
  '/en',
  '/fr/livres',
  '/en/books',
  '/fr/livres/livre-du-joueur/creer-un-personnage',
  '/en/books/livre-du-joueur/creer-un-personnage',
  '/fr/livres/livre-du-mj/menace-et-rencontres',
  '/fr/almanach',
  '/fr/atlas',
  '/en/atlas',
  '/fr/arbres',
  '/fr/arbre/berserker',
  '/fr/arbre/barbare/RAGEXX-001',
  '/fr/especes',
  '/en/species',
  '/fr/espece/humain',
  '/en/species/scothan',
  '/fr/espece/mort-vivant',
  '/en/species/mort-vivant',
  '/fr/competences',
  '/fr/equipement',
  '/fr/regles',
  '/en/rules',
  '/fr/recherche',
  '/fr/archives',
  '/en/archives',
  '/fr/archives/berserker',
  '/en/archives/berserker',
  '/fr/archives/livre-du-joueur',
  '/fr/archives/equipement',
  '/fr/licences',
  '/en/licences',
  '/fr/politique-ia',
  '/en/ai-policy',
  '/fr/credits',
  '/en/credits',
  '/fr/confidentialite',
  '/en/privacy',
]

async function speciesOf(locale: 'fr' | 'en', id: string) {
  const species = (await corpus(locale)).speciesById.get(id)
  if (!species) throw new Error(`no species ${id}`)
  return species
}

async function rowIds(page: Page): Promise<string[]> {
  return page
    .locator('[data-rows] [data-entry]')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-entry') ?? ''))
}

async function expectEveryRailLinkToLand(page: Page): Promise<void> {
  const targets = await page
    .locator('.au-aside .au-trail a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''))
  expect(targets.length).toBeGreaterThan(0)
  for (const target of targets) {
    await expect(page.locator(`[id="${target.replace(/^#/, '')}"]`), target).toHaveCount(1)
  }
  for (const heading of await page
    .locator('.au-reading__body .au-prose h2[id]')
    .evaluateAll((headings) => headings.map((node) => node.id))) {
    expect(targets, heading).toContain(`#${heading}`)
  }
}

async function documentPositions(page: Page, selectors: string[]): Promise<number[]> {
  return page.evaluate((list) => {
    const everyElement = [...document.querySelectorAll('*')]
    return list.map((selector) => {
      const element = document.querySelector(selector)
      return element ? everyElement.indexOf(element) : -1
    })
  }, selectors)
}

async function expectInReadingOrder(page: Page, selectors: string[]): Promise<void> {
  const positions = await documentPositions(page, selectors)
  selectors.forEach((selector, index) => {
    expect(positions[index], selector).toBeGreaterThanOrEqual(0)
  })
  expect(positions, selectors.join(' < ')).toEqual([...positions].sort((a, b) => a - b))
}

async function hrefsOf(page: Page, links: string): Promise<string[]> {
  return page
    .locator(links)
    .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href') ?? ''))
}

const targetOf = (href: string): string => `[id="${href.replace(/^#/, '')}"]`

for (const route of ROUTES) {
  test(`${route} renders without client javascript`, async ({ page }) => {
    const response = await page.goto(route)
    expect(response?.status(), route).toBe(200)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
  })
}

test('a species carries its lore, its regional origins and its whole pool in the markup', async ({
  page,
}) => {
  const french = await corpus('fr')
  const human = await speciesOf('fr', 'humain')
  await page.goto('/fr/espece/humain')
  const plates = page.locator('.au-trait')
  await expect(plates).not.toHaveCount(0)
  await expect(plates.first().locator('.au-trait__label')).toHaveText(strings('fr').creatureType)
  for (const type of human.types ?? []) {
    await expect(plates.first()).toContainText(label(french.creatureTypes.get(type), 'fr', type))
  }
  await expect(page.locator('.au-reading__body .au-prose img')).not.toHaveCount(0)
  const caption = (await page.locator('figure.au-quote figcaption').textContent())?.trim() ?? ''
  expect(caption).not.toBe('')
  await expect(page.locator('figure.au-quote blockquote')).not.toBeEmpty()
  await expect(page.locator('figure.au-quote blockquote')).not.toContainText(caption)
  await expectEveryRailLinkToLand(page)
  const t = strings('fr')
  await expect(page.locator(`nav.au-aside[aria-label="${t.onThisPage}"] .au-eyebrow`)).toHaveText([
    t.speciesPlayPart,
    t.speciesLorePart,
  ])
  const lore = await hrefsOf(page, `nav.au-aside[aria-label="${t.speciesLorePart}"] .au-trail a`)
  expect(lore.length).toBeGreaterThan(0)
  await expectInReadingOrder(page, [
    'figure.au-quote',
    '#jouer',
    '#origines-regionales',
    '#skills',
    ...lore.map(targetOf),
  ])
  const origins = human.subspecies.map((sub) => sub.name)
  await expect(page.locator('.au-aside .au-trail .au-trail a')).toHaveText(origins)
  await expect(page.locator('[id^="origine-"]')).toHaveCount(origins.length)
  await expect(page.locator('#origines-regionales')).toHaveText('Origines régionales')
  await expect(page.locator('#sous-especes')).toHaveCount(0)
  const playing = page.locator('#jouer').locator('xpath=..')
  await expect(playing.locator('dd')).toContainText([human.roleplay?.adulthood ?? ''])
  await expect(playing).toContainText(human.roleplay?.height ?? '')
  for (const language of human.languages ?? []) {
    await expect(playing).toContainText(label(french.languages.get(language), 'fr', language))
  }
  const pool = human.pool.map((skill) => skill.id)
  expect(pool.length).toBeGreaterThan(0)
  expect((await rowIds(page)).sort()).toEqual([...pool].sort())
  await expect(page.locator('[data-details] .au-skill__xp')).toHaveCount(0)
  await expect(page.locator('[data-detail]').first()).toBeVisible()
})

test('every species page reads its play part, then its skills, then its lore', async ({ page }) => {
  const play = new Set(['jouer', ...Object.values(SUBSPECIES_SECTIONS), 'noms'])
  for (const species of (await corpus('fr')).species) {
    await page.goto(pathFor('speciesEntry', 'fr', { species: species.id }))
    const headings = await page
      .locator('main h2[id]')
      .evaluateAll((nodes) => nodes.map((node) => node.id))
    const skills = headings.indexOf('skills')
    const read = `${species.id}: ${headings.join(', ')}`
    expect(skills, read).toBeGreaterThanOrEqual(0)
    expect(
      headings.slice(0, skills).every((id) => play.has(id)),
      read,
    ).toBe(true)
    expect(
      headings.slice(skills + 1).some((id) => play.has(id)),
      read,
    ).toBe(false)
  }
})

test('every species page gives each id to one element, so every outline link lands', async ({
  page,
}) => {
  for (const species of (await corpus('fr')).species) {
    await page.goto(pathFor('speciesEntry', 'fr', { species: species.id }))
    const ids = await page.locator('main [id]').evaluateAll((nodes) => nodes.map((node) => node.id))
    expect(new Set(ids).size, `${species.id} gives two elements the same id`).toBe(ids.length)
  }
})

test('a species with sub-species prints each one with the skill it imposes', async ({ page }) => {
  const undead = await speciesOf('fr', 'mort-vivant')
  await page.goto('/fr/espece/mort-vivant')
  await expect(page.locator('.au-trait')).not.toHaveCount(0)
  await expect(page.locator('#sous-especes')).toHaveText('Sous-espèces')
  await expect(page.locator('#origines-regionales')).toHaveCount(0)
  await expect(page.locator('[id^="origine-"]')).toHaveCount(undead.subspecies.length)
  await expect(page.locator('.au-aside .au-trail .au-trail a')).toHaveText(
    undead.subspecies.map((sub) => sub.name),
  )
  const imposing = undead.subspecies.filter((sub) => sub.imposedSkill)
  expect(imposing.length).toBeGreaterThan(0)
  for (const sub of imposing) {
    const section = page.locator(`#origine-${sub.id}`)
    await expect(section.locator('dt').first()).toHaveText('Compétence imposée')
    await expect(section.locator('dd a')).toHaveAttribute('href', `#e-${sub.imposedSkill?.id}`)
  }
  expect((await rowIds(page)).sort()).toEqual(undead.pool.map((skill) => skill.id).sort())

  await page.goto('/en/species/mort-vivant')
  await expect(page.locator('#sous-especes')).toHaveText('Subspecies')
  await expect(page.locator('.au-aside .au-trail .au-trail a')).toHaveText(
    (await speciesOf('en', 'mort-vivant')).subspecies.map((sub) => sub.name),
  )
})

test('heraldry stands in its plain form without javascript', async ({ page }) => {
  const species = (await corpus('fr')).species.find((entry) =>
    entry.subspecies.some((sub) => sub.heraldry),
  )
  expect(species, 'no species carries heraldry').toBeDefined()
  if (!species) return
  await page.goto(`/fr/espece/${species.id}`)
  for (const sub of species.subspecies) {
    if (!sub.heraldry) continue
    const figure = page.locator(`#origine-${sub.id} figure`)
    await expect(figure.locator('.au-heraldry__plain')).toBeVisible()
    await expect(figure.locator('canvas')).toHaveCount(0)
    await expect(figure.locator('figcaption')).toHaveText(sub.heraldry.name)
    await expect(figure.locator('[data-drape-toggle]')).toBeHidden()
  }
})

test('every glazed picture stands in the still of its own frame without javascript', async ({
  page,
}) => {
  const frames = await framesBySpecies()
  expect(frames.size, 'no species hangs a glazed picture').toBeGreaterThan(0)
  for (const [species, kinds] of frames) {
    await page.goto(pathFor('speciesEntry', 'fr', { species }))
    for (const kind of kinds) {
      const frame = page.locator(`.au-prose__frame[data-frame="${kind}"]`).first()
      await expect(frame.locator('[data-relief="glass"] img')).toBeVisible()
      await expect(frame.locator('canvas')).toHaveCount(0)
      const moulding = frame.locator('.au-prose__moulding')
      expect(await moulding.evaluate((node) => getComputedStyle(node).borderImageSource)).toMatch(
        frameFile(kind, 'beauty'),
      )
      expect(
        await moulding.evaluate((node) => Number.parseFloat(getComputedStyle(node).borderTopWidth)),
      ).toBeGreaterThan(0)
    }
  }
})

test('a skill tree plate draws its nodes without javascript', async ({ page }) => {
  await page.goto('/fr/arbre/berserker')
  await expect(page.locator('[data-plate-node]')).toHaveCount(
    (await corpus('fr')).treesById.get('berserker')?.placements.length ?? 0,
  )
  await expect(page.locator('svg line')).not.toHaveCount(0)
})

test('a bare skill tree asks for a skill and a node link opens it on its tree', async ({
  page,
}) => {
  await page.goto('/fr/arbre/berserker')
  await expect(page.locator('#tree-detail')).toContainText(
    'Choisissez une Compétence dans l’Arbre pour l’afficher ici.',
  )
  await expect(page.locator('[data-node][aria-current]')).toHaveCount(0)

  const node = page.locator('[data-plate-node][data-node="DEFERL-001"]')
  await expect(node).toHaveAttribute('href', '/fr/arbre/berserker/DEFERL-001#arbre')
  await node.click()
  await expect(page).toHaveURL('/fr/arbre/berserker/DEFERL-001#arbre')
  await expect(page.locator('#tree-detail [data-selected-node="DEFERL-001"]')).toBeVisible()
  await expect(page.locator('[data-plate-node][aria-current="page"]')).toHaveAttribute(
    'data-node',
    'DEFERL-001',
  )
  const touching = await page.locator('line[data-ends~="DEFERL-001"]').count()
  expect(touching).toBeGreaterThan(0)
  await expect(page.locator('line[data-lit]')).toHaveCount(touching)
  await expect(page.locator('#arbre')).toBeInViewport()
})

test('a tall hero still cues the reader below it without javascript', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 })
  await page.goto('/fr/arbre/berserker')
  await expect(page.locator('[data-scroll-cue]')).toBeInViewport()
})

test('a tree hero carries its whole sheet and its ambient picture without javascript', async ({
  page,
}) => {
  const french = await corpus('fr')
  const merchant = french.treesById.get('marchand')
  await page.goto('/fr/arbre/marchand')
  await expect(page.locator('[data-character] h1')).toHaveText(merchant?.name ?? '')
  await expect(page.locator('[data-character] .au-sticker')).toHaveText(
    (merchant?.descriptors ?? []).map((key) => label(french.descriptors.get(key), 'fr', key)),
  )
  await expect(page.locator('[data-character] .au-rank__axis')).toHaveCount(6)
  await expect(page.locator('[data-character] [data-plate="hero"] img')).toBeVisible()
  expect(
    await page
      .locator('[data-stage] .au-stage__ambient')
      .evaluate((node) => getComputedStyle(node).backgroundImage),
  ).toMatch(/\/_astro\/.+\.webp/)
})

for (const kind of ['almanach', 'books'] as const) {
  test(`every door of ${pathFor(kind, 'fr')} opens its page without javascript`, async ({
    page,
  }) => {
    const t = strings('fr')
    await page.goto(pathFor(kind, 'fr'))
    const doors = await page
      .locator('[data-door] a')
      .evaluateAll((all) => all.map((link) => link.getAttribute('href') ?? ''))
    expect(doors.length).toBeGreaterThan(0)
    for (const href of doors) {
      const response = await page.goto(href)
      expect(response?.status(), href).toBe(200)
      await expect(page.locator('h1')).toHaveCount(1)
      const onward = page
        .locator('[data-entry] a[href], [data-release-link]')
        .or(page.locator('main').getByRole('link', { name: t.allDocs, exact: true }))
      await expect(onward.first(), href).toBeVisible()
    }
  })
}

test.describe('a hub door without javascript', () => {
  test.use({
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
    viewport: { width: 1512, height: 860 },
  })

  const lightOf = (page: Page, index: number): Promise<string> =>
    page
      .locator('[data-door]')
      .nth(index)
      .evaluate((door) => getComputedStyle(door).getPropertyValue('--lit').trim())

  for (const kind of ['almanach', 'books'] as const) {
    const hub = pathFor(kind, 'en')

    test(`on ${hub} takes the light from the pointer and the keyboard`, async ({ page }) => {
      await page.goto(hub)
      const doors = page.locator('[data-door]')
      expect(await doors.count()).toBeGreaterThan(2)
      expect(await lightOf(page, 0)).toBe('1')
      await doors.nth(2).locator('a').hover()
      expect(await lightOf(page, 2)).toBe('1')
      expect(await lightOf(page, 0)).toBe('0')
      await page.mouse.move(2, 2)
      await doors.nth(1).locator('a').focus()
      await page.keyboard.press('Tab')
      await expect(doors.nth(2).locator('a')).toBeFocused()
      expect(await lightOf(page, 2)).toBe('1')
      expect(await lightOf(page, 0)).toBe('0')
    })

    test(`on ${hub} keyboard focus keeps the light while the pointer hovers another door`, async ({
      page,
    }) => {
      await page.goto(hub)
      const doors = page.locator('[data-door]')
      expect(await doors.count()).toBeGreaterThan(3)
      await doors.nth(1).locator('a').focus()
      await page.keyboard.press('Tab')
      await expect(doors.nth(2).locator('a')).toBeFocused()
      await doors.last().locator('a').hover()
      const lights = await doors.evaluateAll((all) =>
        all.map((door) => getComputedStyle(door).getPropertyValue('--lit').trim()),
      )
      expect(lights.filter((light) => light === '1')).toHaveLength(1)
      expect(await lightOf(page, 2)).toBe('1')
    })
  }
})

test('a chapter reaches its neighbour through the pager', async ({ page }) => {
  await page.goto('/fr/livres/livre-du-joueur/comment-jouer')
  await expect(page.locator('#book-nav a[aria-current="page"]')).toHaveCount(1)
  await page.locator('[data-book-next]').click()
  await expect(page).toHaveURL(/\/fr\/livres\/livre-du-joueur\/[a-z-]+$/)
  await expect(page.locator('main')).toBeVisible()
})

test('a browse page shows its list and a detail without javascript', async ({ page }) => {
  await page.goto('/fr/equipement')
  await expect(page.locator('[data-entry]')).not.toHaveCount(0)
  await expect(page.locator('[data-entry]')).toHaveCount(
    await page.locator('[data-detail]').count(),
  )
  await expect(page.locator('[data-detail]').first()).toBeVisible()
})

test('a browse row still changes the detail without javascript', async ({ page }) => {
  await page.goto('/fr/equipement')
  const first = page.locator('[data-detail]').first()
  await expect(first).toBeVisible()

  await page.locator('[data-entry="arc-long"] [data-row]').click()
  await expect(page.locator('#e-arc-long')).toBeVisible()
  await expect(first).toBeHidden()
})

test('a rule opens its detail on its own hash without javascript', async ({ page }) => {
  await page.goto('/fr/regles#e-state-agonie')
  await expect(page.locator('#e-state-agonie .au-state-entry')).toBeVisible()
  await expect(page.locator('[data-detail]:visible')).toHaveCount(1)
})

test('the equipment index offers its booklet without javascript', async ({ page }) => {
  await page.goto('/fr/equipement')
  const download = page.locator('[data-booklet]')
  await expect(download).toBeVisible()
  await expect(download).toHaveAttribute(
    'href',
    /^\/pdf\/equipement-fr-v[\d.]+_[0-9a-f]{8}_[0-9a-f]{8}\.pdf$/,
  )
})

test('the equipment help opens and closes on a hash without javascript', async ({ page }) => {
  await page.goto('/fr/equipement')
  const overlay = page.locator('#aide')
  await expect(overlay).toBeHidden()

  await page.locator('[data-help-open]').click()
  await expect(overlay).toBeVisible()
  await expect(overlay.locator('.au-help__title')).not.toBeEmpty()

  await overlay.locator('.au-help__close').click()
  await expect(overlay).toBeHidden()
})

test('a sub chapter link clears the sticky header without javascript', async ({ page }) => {
  await page.goto('/fr/livres/livre-du-joueur/comment-jouer')
  const link = page.locator('#book-nav .au-trail[data-inset] a').first()
  const hash = await link.getAttribute('href')
  expect(hash).toBeTruthy()

  await link.click()
  const header = (await page.locator('[data-shell-header]').boundingBox())?.height ?? 0
  const heading = page.locator(`#book-body [id="${(hash ?? '').replace(/^#/, '')}"]`)

  await expect
    .poll(async () => (await heading.boundingBox())?.y ?? Number.NEGATIVE_INFINITY)
    .toBeGreaterThanOrEqual(header)
})

test('a booklet history offers every printing as a direct download', async ({ page }) => {
  await page.goto('/fr/archives/berserker')
  const rows = page.locator('[data-release-row]')
  await expect(rows).not.toHaveCount(0)

  const hrefs = await page
    .locator('[data-release-link]')
    .evaluateAll((all) => all.map((link) => link.getAttribute('href')))
  for (const href of hrefs) {
    expect(href).toMatch(
      /^(\/pdf\/berserker-fr-v[\d.]+_[0-9a-f]{8}_[0-9a-f]{8}\.pdf|https:\/\/github\.com\/aubaine-ttrpg\/aubaine-website\/releases\/download\/v([\d.]+)\/aubaine-v\2-fr\.zip)$/,
    )
  }
})

test('the archive lists a generation and routes to each booklet history', async ({ page }) => {
  await page.goto('/fr/archives')
  await expect(page.locator('[data-generation]')).not.toHaveCount(0)

  await page.locator('[data-booklet-history]').first().click()
  await expect(page).toHaveURL(/\/fr\/archives\/[a-z0-9-]+$/)
  await expect(page.locator('h1')).toHaveCount(1)
})

test('a tree page reaches its own history without javascript', async ({ page }) => {
  await page.goto('/fr/arbre/berserker')
  await page.locator('[data-versions]').click()
  await expect(page).toHaveURL('/fr/archives/berserker')
})

test.describe('without javascript', () => {
  test.use({ javaScriptEnabled: false })

  test('the tree viewer hides the zoom controls it cannot drive', async ({ page }) => {
    await page.goto('/fr/arbre/berserker')
    await expect(page.locator('[data-viewer-controls]')).toBeHidden()
    await expect(page.locator('[data-plate-node]')).toHaveCount(
      (await corpus('fr')).treesById.get('berserker')?.placements.length ?? 0,
    )
  })

  test('a blazon still opens from its caption rule without javascript', async ({ page }) => {
    const t = strings('en')
    const armed = (await corpus('en')).species.flatMap((species) =>
      species.subspecies.flatMap((sub) =>
        sub.heraldry?.kind === 'arms' ? [{ species, sub: sub.id, arms: sub.heraldry }] : [],
      ),
    )[0]
    expect(armed, 'no sub-species bears arms').toBeDefined()
    if (!armed) return
    await page.goto(`/en/species/${armed.species.id}`)
    const button = page
      .locator(`#origine-${armed.sub} figure`)
      .getByRole('button', { name: t.blazonOf(armed.arms.name) })
    const note = page.locator(`#${await button.getAttribute('popovertarget')}`)
    await expect(note).toBeHidden()
    await button.click()
    await expect(note).toBeVisible()
    await expect(note).toContainText(armed.arms.blazon)
  })

  test('the Common Bank source still opens its note without javascript', async ({ page }) => {
    const bank = (await corpus('en')).bank
    const id = bank.resolved[0]?.id ?? ''
    await page.goto(`/en/skills#e-${id}`)
    const note = page.locator(`#note-bank-${id}`)
    await expect(note).toBeHidden()
    await page.locator(`#e-${id}`).getByRole('button', { name: bank.name }).click()
    await expect(note).toBeVisible()
    await expect(note).not.toBeEmpty()
  })

  test('every draft stays listed without javascript, and no switch pretends otherwise', async ({
    page,
  }) => {
    await page.goto('/en/trees')
    const entries = page.locator('[data-entry]')
    await expect(entries).not.toHaveCount(0)
    await expect(entries.filter({ visible: true })).toHaveCount(await entries.count())
    await expect(page.locator('[data-drafts-control]')).toBeHidden()
  })
})

test.describe('the threshold without javascript', () => {
  test.use({ javaScriptEnabled: false })

  test('offers both languages and stays until the reader picks one', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('[data-load-crest]')).toBeHidden()
    await expect(page.locator('[data-threshold-prompt]')).toBeVisible()
    await expect(page.locator('[data-threshold-prompt] [lang="fr-FR"]')).toHaveText(
      'Choisissez votre langue',
    )
    await expect(page.locator('[data-threshold-prompt] [lang="en-GB"]')).toHaveText(
      'Choose your language',
    )

    const french = page.getByRole('link', { name: 'Français', exact: true })
    const english = page.getByRole('link', { name: 'English', exact: true })
    await expect(french).toHaveAttribute('href', '/fr')
    await expect(english).toHaveAttribute('href', '/en')

    await page.waitForTimeout(600)
    await expect(page).toHaveURL('/')

    await english.click()
    await expect(page).toHaveURL('/en')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB')
  })
})

test('a species page lists the other sources as also available, never itself', async ({ page }) => {
  const english = await corpus('en')
  const shared = [...english.origins].find(
    ([, origin]) => origin.bank && origin.species.some((source) => source.subspecies),
  )
  expect(shared, 'no bank skill is also offered by a sub-species').toBeDefined()
  const [id = '', origin] = shared ?? []
  const source = origin?.species.find((entry) => entry.subspecies)
  await page.goto(`/en/species/${source?.id}#e-${id}`)
  const onSpecies = page.locator(`#e-${id} .au-sources`)
  await expect(onSpecies.locator('.au-sources__label')).toHaveText('Also available')
  await expect(onSpecies.getByRole('button', { name: english.bank.name })).toBeVisible()
  await expect(onSpecies.getByRole('link', { name: source?.name ?? '' })).toHaveCount(0)

  await page.goto(`/en/skills#e-${id}`)
  const inIndex = page.locator(`#e-${id} .au-sources`)
  await expect(inIndex.locator('.au-sources__label')).toHaveText('Where to Get It')
  await expect(
    inIndex.getByRole('link', { name: `${source?.name} · ${source?.subspecies?.name}` }),
  ).toBeVisible()
})
