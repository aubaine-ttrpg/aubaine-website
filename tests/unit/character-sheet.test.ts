import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { speciesSheet, treeSheet } from '../../src/lib/game/character-sheet'
import { label } from '../../src/lib/game/corpus'
import { readCorpus } from '../../src/lib/game/fs-sources'
import { SPECIES_SEAL, treeSeal, treeSealKey } from '../../src/lib/game/seals'
import { strings } from '../../src/lib/i18n/strings'

const root = resolve(import.meta.dirname, '../..')
const french = await readCorpus(root, 'fr')
const english = await readCorpus(root, 'en')

describe('the sheet of a tree', () => {
  it('carries one trait per primary Caractéristique, named in the reader language', () => {
    for (const tree of english.trees) {
      const sheet = treeSheet(tree, english, 'en')
      const plates = sheet.traits?.plates ?? []
      expect(plates).toHaveLength(tree.primeCharacteristics.length)
      for (const trait of plates) expect(trait.label).toBe(strings('en').primeChar)
    }
  })

  it('names its kind and keeps its own profile, pending until the team ranks it', () => {
    for (const tree of french.trees) {
      const sheet = treeSheet(tree, french, 'fr')
      expect(sheet.kind).toBe(strings('fr').treeEyebrow(tree.treeType))
      expect(sheet.profile).toEqual(
        tree.profile ? { kind: 'ranked', ranks: tree.profile } : { kind: 'pending' },
      )
    }
  })

  it('keeps an authored key colour, else wears its seal without a cover in a key that reads on night', () => {
    for (const tree of french.trees) {
      const sheet = treeSheet(tree, french, 'fr')
      expect(sheet.cover).toBe(tree.cover)
      expect(sheet.seal).toEqual(treeSeal(tree, french))
      expect(sheet.keyColour).toBe(
        tree.keyColour ?? (tree.cover ? undefined : treeSealKey(tree, french)),
      )
    }
  })

  it('mirrors its cover only when the tree asks for it', () => {
    for (const tree of french.trees) {
      expect(treeSheet(tree, french, 'fr').coverMirrored).toBe(tree.coverMirrored === true)
    }
  })
})

describe('the sheet of a species', () => {
  it('shows its origin instead of a movement and a size when its size is derived', () => {
    for (const species of french.species) {
      const labels = (speciesSheet(species, french, 'fr').traits?.plates ?? []).map(
        (trait) => trait.label,
      )
      const t = strings('fr')
      if (species.derivedFrom) {
        expect(labels).toContain(t.speciesOrigin)
        expect(labels).not.toContain(t.movement)
      } else {
        expect(labels).toContain(t.movement)
        expect(labels).not.toContain(t.speciesOrigin)
      }
    }
  })

  it('reads its descriptors in the reader language and keeps an authored key colour', () => {
    for (const species of english.species) {
      const sheet = speciesSheet(species, english, 'en')
      expect(sheet.descriptors.map((descriptor) => descriptor.label)).toEqual(
        (species.descriptors ?? []).map((key) => label(english.descriptors.get(key), 'en', key)),
      )
      expect(sheet.keyColour).toBe(species.keyColour)
      expect(sheet.coverMirrored).toBe(species.coverMirrored === true)
      expect(sheet.profile).toEqual({ kind: 'none' })
      expect(sheet.seal).toEqual(SPECIES_SEAL)
    }
  })

  it('strikes through the one descriptor its vocabulary strikes', () => {
    const species = english.species.find((entry) => (entry.descriptors ?? []).length > 1)
    const [struckKey, ...plainKeys] = species?.descriptors ?? []
    if (!species || !struckKey) throw new Error('no species carries two descriptors')
    const descriptors = new Map(
      [...english.descriptors].map(([key, { effect: _effect, ...entry }]) => [
        key,
        key === struckKey ? { ...entry, effect: 'struck' as const } : entry,
      ]),
    )
    const sheet = speciesSheet(species, { ...english, descriptors }, 'en')
    expect(sheet.descriptors).toEqual([
      { effect: 'struck', label: label(descriptors.get(struckKey), 'en', struckKey) },
      ...plainKeys.map((key) => ({
        effect: 'plain',
        label: label(descriptors.get(key), 'en', key),
      })),
    ])
  })
})
