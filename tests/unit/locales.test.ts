import { describe, expect, it } from 'vitest'

import { LINGUA_FRANCA, preferredLocale } from '../../src/lib/i18n/locales'

describe('preferredLocale', () => {
  it('sends a French browser to French', () => {
    expect(preferredLocale(['fr-FR', 'fr', 'en-US'])).toBe('fr')
  })

  it('sends an English browser to English', () => {
    expect(preferredLocale(['en-GB', 'fr'])).toBe('en')
  })

  it('takes the first language the site speaks, skipping the ones it does not', () => {
    expect(preferredLocale(['de-DE', 'de', 'fr-CA', 'en'])).toBe('fr')
  })

  it('reads a regional tag as its language', () => {
    expect(preferredLocale(['fr-BE'])).toBe('fr')
  })

  it('ignores the case of a tag', () => {
    expect(preferredLocale(['EN-us'])).toBe('en')
  })

  it('offers English to a reader of neither language', () => {
    expect(LINGUA_FRANCA).toBe('en')
    expect(preferredLocale(['de-DE', 'de'])).toBe(LINGUA_FRANCA)
  })

  it('offers English when the browser lists no language at all', () => {
    expect(preferredLocale([])).toBe(LINGUA_FRANCA)
  })
})
