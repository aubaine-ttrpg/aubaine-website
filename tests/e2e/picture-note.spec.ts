import { expect, test } from '@playwright/test'

import type { ResolvedSpecies } from '../../src/lib/game/build'
import type { Heraldry } from '../../src/lib/game/schema'
import type { Locale } from '../../src/lib/i18n/locales'
import { pathFor } from '../../src/lib/i18n/routes'
import { strings } from '../../src/lib/i18n/strings'
import { corpus } from './support/corpus'

type Arms = Extract<Heraldry, { kind: 'arms' }>

async function armed(
  locale: Locale,
): Promise<{ species: ResolvedSpecies; sub: string; arms: Arms }> {
  for (const species of (await corpus(locale)).species) {
    for (const sub of species.subspecies) {
      if (sub.heraldry?.kind === 'arms') return { species, sub: sub.id, arms: sub.heraldry }
    }
  }
  throw new Error('no sub-species bears arms')
}

for (const locale of ['fr', 'en'] as const) {
  test(`the blazon opens from the caption rule by click and by keyboard, in ${locale}`, async ({
    page,
  }) => {
    const t = strings(locale)
    const { species, sub, arms } = await armed(locale)
    await page.goto(pathFor('speciesEntry', locale, { species: species.id }))
    const figure = page.locator(`#origine-${sub} figure`)
    const button = figure.getByRole('button', { name: t.blazonOf(arms.name) })
    const target = await button.getAttribute('popovertarget')
    if (!target) throw new Error('the blazon button names no note')
    const note = page.locator(`#${target}`)
    await expect(button).toBeVisible()
    await expect(note).toBeHidden()

    await button.click()
    await expect(note).toBeVisible()
    await expect(note).toContainText(t.blazon)
    await expect(note).toContainText(arms.blazon)
    await page.keyboard.press('Escape')
    await expect(note).toBeHidden()

    await button.focus()
    await page.keyboard.press('Enter')
    await expect(note).toBeVisible()
    await note.getByRole('button', { name: t.close }).click()
    await expect(note).toBeHidden()
    await expect(figure.locator('figcaption')).toHaveText(arms.name)
  })
}

for (const width of [320, 390, 480, 768, 1216, 1440]) {
  test(`at ${width}px the blazon button sits on the caption rule at its right end`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    const { species, sub } = await armed('fr')
    await page.goto(pathFor('speciesEntry', 'fr', { species: species.id }))
    const measured = await page.locator(`#origine-${sub} figure`).evaluate((figure) => {
      const caption = figure.querySelector('figcaption')
      const button = figure.querySelector('.au-picture-note')
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
    if (!measured) throw new Error('the arms have no caption or no blazon button')
    expect(Math.abs(measured.buttonCentre - measured.ruleCentre)).toBeLessThanOrEqual(1)
    expect(Math.abs(measured.buttonRight - measured.figureRight)).toBeLessThanOrEqual(1)
    expect(measured.buttonLeft).toBeGreaterThan(measured.ruleEnd)
    expect(measured.size).toBeGreaterThanOrEqual(24)
    expect(measured.sideways).toBe(0)
  })
}
