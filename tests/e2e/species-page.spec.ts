import { expect, test } from '@playwright/test'

import { label, type ResolvedSpecies } from '../../src/lib/game/build'
import {
  DEFAULT_MOVEMENT_METRES,
  formatNumber,
  SPECIES_PLATE_TERMS,
} from '../../src/lib/game/derive'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'
import { corpus } from './support/corpus'

const familyLists = (species: ResolvedSpecies): number =>
  species.subspecies.filter((sub) => (sub.names?.family ?? species.familyNames) !== undefined)
    .length

test('a species that names its family names heads them with that name, in both languages', async ({
  page,
}) => {
  for (const locale of ['fr', 'en'] as const) {
    const species = (await corpus(locale)).species.find((entry) => entry.familyNamesLabel)
    const heading = species?.familyNamesLabel
    expect(heading, 'no species names its family names').toBeDefined()
    if (!species || !heading) return
    expect(familyLists(species)).toBeGreaterThan(0)
    await page.goto(pathFor('speciesEntry', locale, { species: species.id }))
    await expect(page.locator('.au-subspecies dt', { hasText: heading })).toHaveCount(
      familyLists(species),
    )
    await expect(
      page.locator('.au-subspecies dt', { hasText: strings(locale).namesFamily }),
    ).toHaveCount(0)
  }
})

test('a species that names no heading keeps « Noms de famille »', async ({ page }) => {
  const species = (await corpus('fr')).species.find(
    (entry) => !entry.familyNamesLabel && familyLists(entry) > 0,
  )
  expect(species, 'no species lists family names under the default heading').toBeDefined()
  await page.goto(pathFor('speciesEntry', 'fr', { species: species?.id ?? '' }))
  await expect(
    page.locator('.au-subspecies dt', { hasText: strings('fr').namesFamily }).first(),
  ).toBeVisible()
})

test('a species plate shows its value under the icon of the rule term it names', async ({
  page,
}) => {
  const french = await corpus('fr')
  const nnor = french.speciesById.get('nnor')
  const t = strings('fr')
  const plate = (name: string) =>
    page.locator('.au-trait').filter({ has: page.locator('.au-trait__label', { hasText: name }) })
  const icon = (reference: string) =>
    `[style*="/icons/${(french.terms.keys.get(reference)?.icon ?? '').replace(':', '/')}.svg"]`
  await page.goto('/fr/espece/nnor')

  const types = (nnor?.types ?? []).map((key) => label(french.creatureTypes.get(key), 'fr', key))
  expect(types.length).toBeGreaterThan(0)
  await expect(plate(t.creatureType)).toContainText(types.join(' · '))
  await expect(plate(t.creatureType).locator(icon(SPECIES_PLATE_TERMS.type))).toHaveCount(1)
  await expect(plate(t.movement)).toContainText(
    nnor?.movement ?? `${formatNumber(DEFAULT_MOVEMENT_METRES, 'fr')} m`,
  )
  await expect(plate(t.movement).locator(icon(SPECIES_PLATE_TERMS.movement))).toHaveCount(1)
})

test('species cards carry no domain spine, tree cards keep theirs', async ({ page }) => {
  await page.goto('/fr/especes')
  await expect(page.locator('[data-cover-card]').first()).toBeVisible()
  await expect(page.locator('[data-cover-spine]')).toHaveCount(0)
  await page.goto('/fr/arbres')
  expect(await page.locator('[data-cover-spine]').count()).toBeGreaterThan(0)
})

test('a species and a tree show their one 3:4 cover in the hero and in the social image', async ({
  page,
}) => {
  for (const path of ['/fr/espece/nnor', '/fr/arbre/marchand']) {
    await page.goto(path)
    const hero = page.locator('[data-character] [data-plate="hero"] img')
    await expect(hero, path).toHaveCount(1)
    expect(await hero.getAttribute('src'), path).toMatch(/-3_4-og\./)
    expect(await page.locator('meta[property="og:image"]').getAttribute('content'), path).toMatch(
      /-3_4-og\./,
    )
  }
})
