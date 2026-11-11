import { expect, test } from '@playwright/test'

import { label, type ResolvedSpecies } from '../../src/lib/game/build'
import {
  DEFAULT_MOVEMENT_METRES,
  formatNumber,
  SPECIES_PLATE_TERMS,
} from '../../src/lib/game/derive'
import type { Locale } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'
import { corpus } from './support/corpus'

const NAME_LISTS = ['masculine', 'feminine', 'given', 'family'] as const
type NameLists = Partial<Record<(typeof NAME_LISTS)[number], string[] | undefined>>

const nameReading = (species: ResolvedSpecies, locale: Locale): string[][] => {
  const t = strings(locale)
  const labels = {
    masculine: t.namesMasculine,
    feminine: t.namesFeminine,
    given: species.givenNamesLabel ?? t.namesGiven,
    family: species.familyNamesLabel ?? t.namesFamily,
  }
  const rows = (names: NameLists) =>
    NAME_LISTS.flatMap((list) => {
      const value = names[list]
      return value
        ? [
            ['dt', labels[list]],
            ['dd', value.join(', ')],
          ]
        : []
    })
  return [
    ...rows(species.names ?? { family: species.familyNames }),
    ...species.subspecies.flatMap((sub) => {
      const own = rows(sub.names ?? {})
      return own.length > 0 ? [['h3', sub.name], ...own] : []
    }),
  ]
}

test('every species with names reads them under « Noms »: its custom, its shared lists, then each sub-species, in both languages', async ({
  page,
}) => {
  for (const locale of ['fr', 'en'] as const) {
    const t = strings(locale)
    const named = (await corpus(locale)).species.filter(
      (entry) => entry.naming !== undefined || nameReading(entry, locale).length > 0,
    )
    expect(named.length, 'no species reads names').toBeGreaterThan(0)
    for (const species of named) {
      await page.goto(pathFor('speciesEntry', locale, { species: species.id }))
      const section = page.locator('section').filter({ has: page.locator('h2#noms') })
      await expect(section.locator('h2')).toHaveText(t.speciesNames)
      const reading = await section
        .locator(
          ':scope > .au-rule-text, :scope > .au-head > h3, :scope > dl > dt, :scope > dl > dd',
        )
        .evaluateAll((nodes) =>
          nodes.map((node) =>
            node.classList.contains('au-rule-text')
              ? ['custom']
              : [node.tagName.toLowerCase(), (node.textContent ?? '').trim()],
          ),
        )
      expect(reading, `${locale} ${species.id}`).toEqual([
        ...(species.naming === undefined ? [] : [['custom']]),
        ...nameReading(species, locale),
      ])
      await expect(page.locator('.au-aside a[href="#noms"] .au-trail__text')).toHaveText(
        t.speciesNames,
      )
      const headings = await page
        .locator('main h2[id]')
        .evaluateAll((nodes) => nodes.map((node) => node.id))
      expect(headings.indexOf('noms'), headings.join(', ')).toBeGreaterThan(-1)
      expect(headings.indexOf('noms'), headings.join(', ')).toBeLessThan(headings.indexOf('skills'))
      for (const [tag, value] of nameReading(species, locale)) {
        if (tag !== 'dd' || value === undefined) continue
        await expect(page.getByText(value, { exact: true })).toHaveCount(1)
      }
    }
  }
})

test('a sub-species presents itself without its names, in both languages', async ({ page }) => {
  for (const locale of ['fr', 'en'] as const) {
    const species = (await corpus(locale)).species.find((entry) =>
      entry.subspecies.some((sub) => sub.names !== undefined),
    )
    expect(species, 'no sub-species declares names').toBeDefined()
    if (!species) return
    await page.goto(pathFor('speciesEntry', locale, { species: species.id }))
    const labels = await page.locator('.au-subspecies dt').allTextContents()
    expect(
      labels.every((text) => text.trim() === strings(locale).imposedSkill),
      labels.join(', '),
    ).toBe(true)
  }
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
